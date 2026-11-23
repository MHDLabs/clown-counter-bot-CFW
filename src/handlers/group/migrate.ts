import { eq, sql } from "drizzle-orm";

import type { MessageHandler } from "@/handlers";
import type { BotContext } from "@/lib/bot";

import { schema } from "@/db";

type GroupSnapshot = {
  name: string | null;
  botMemberStatus: "active" | "kicked" | "left" | null;
  gifIds: string[] | null;
  stickerIds: string[] | null;
  unclownGifIds: string[] | null;
  unclownStickerIds: string[] | null;
  resetAt: Date | null;
  cooldown: number | null;
};

type CooldownAttempt = {
  voterId: string;
  attempts: number;
  expiresAt: number;
};

function mergeIds(...values: (string[] | null)[]): string[] | null {
  const merged = [...new Set(values.flatMap((value) => value ?? []))];
  return merged.length ? merged : null;
}

export function mergeGroupSettings(
  source: GroupSnapshot,
  destination?: GroupSnapshot,
  destinationName?: string,
): GroupSnapshot {
  const resetTimes = [source.resetAt, destination?.resetAt].filter(
    (value): value is Date => value !== null && value !== undefined,
  );

  return {
    name: destinationName ?? destination?.name ?? source.name,
    botMemberStatus:
      source.botMemberStatus === "active" ||
      destination?.botMemberStatus === "active"
        ? "active"
        : (destination?.botMemberStatus ?? source.botMemberStatus),
    gifIds: mergeIds(source.gifIds, destination?.gifIds ?? null),
    stickerIds: mergeIds(source.stickerIds, destination?.stickerIds ?? null),
    unclownGifIds: mergeIds(
      source.unclownGifIds,
      destination?.unclownGifIds ?? null,
    ),
    unclownStickerIds: mergeIds(
      source.unclownStickerIds,
      destination?.unclownStickerIds ?? null,
    ),
    resetAt: resetTimes.length
      ? new Date(Math.max(...resetTimes.map((value) => value.getTime())))
      : null,
    cooldown: destination?.cooldown ?? source.cooldown,
  };
}

export function mergeCooldownAttempts(
  ...groups: CooldownAttempt[][]
): CooldownAttempt[] {
  const merged = new Map<string, CooldownAttempt>();

  for (const attempt of groups.flat()) {
    const current = merged.get(attempt.voterId);
    merged.set(attempt.voterId, {
      voterId: attempt.voterId,
      attempts: Math.max(current?.attempts ?? 0, attempt.attempts),
      expiresAt: Math.max(current?.expiresAt ?? 0, attempt.expiresAt),
    });
  }

  return [...merged.values()];
}

/** Move all persisted group state when Telegram upgrades a basic group to a supergroup. */
async function migrateGroup(ctx: BotContext) {
  const message = ctx.msg;
  const chat = ctx.chat;
  if (
    !message ||
    !chat ||
    (chat.type !== "group" && chat.type !== "supergroup")
  ) {
    return;
  }

  const sourceId =
    message.migrate_to_chat_id !== undefined
      ? String(chat.id)
      : message.migrate_from_chat_id !== undefined
        ? String(message.migrate_from_chat_id)
        : null;
  const destinationId =
    message.migrate_to_chat_id !== undefined
      ? String(message.migrate_to_chat_id)
      : message.migrate_from_chat_id !== undefined
        ? String(chat.id)
        : null;

  if (!sourceId || !destinationId || sourceId === destinationId) return;

  const [
    source,
    destination,
    sourceAllowlist,
    sourceAttempts,
    destinationAttempts,
  ] = await Promise.all([
    ctx.db.query.groups.findFirst({
      where: (fields, operators) => operators.eq(fields.id, sourceId),
    }),
    ctx.db.query.groups.findFirst({
      where: (fields, operators) => operators.eq(fields.id, destinationId),
    }),
    ctx.db
      .select({ groupId: schema.allowedGroups.groupId })
      .from(schema.allowedGroups)
      .where(eq(schema.allowedGroups.groupId, sourceId))
      .limit(1),
    ctx.db
      .select({
        voterId: schema.clownCooldownAttempts.voterId,
        attempts: schema.clownCooldownAttempts.attempts,
        expiresAt: schema.clownCooldownAttempts.expiresAt,
      })
      .from(schema.clownCooldownAttempts)
      .where(eq(schema.clownCooldownAttempts.groupId, sourceId)),
    ctx.db
      .select({
        voterId: schema.clownCooldownAttempts.voterId,
        attempts: schema.clownCooldownAttempts.attempts,
        expiresAt: schema.clownCooldownAttempts.expiresAt,
      })
      .from(schema.clownCooldownAttempts)
      .where(eq(schema.clownCooldownAttempts.groupId, destinationId)),
  ]);

  // No source row means this update was already processed or the group was never recorded.
  if (!source) return;

  const destinationName =
    String(chat.id) === destinationId ? (chat.title ?? undefined) : undefined;
  const merged = mergeGroupSettings(
    source,
    destination ?? undefined,
    destinationName,
  );
  const attempts = mergeCooldownAttempts(
    sourceAttempts,
    destinationAttempts,
  );

  const statements = [
    ctx.db
      .insert(schema.groups)
      .values({ id: destinationId, ...merged })
      .onConflictDoUpdate({
        target: schema.groups.id,
        set: merged,
      }),
    ctx.db
      .update(schema.clownVotes)
      .set({ groupId: destinationId })
      .where(eq(schema.clownVotes.groupId, sourceId)),
    ...(sourceAllowlist.length
      ? [
          ctx.db
            .insert(schema.allowedGroups)
            .values({ groupId: destinationId })
            .onConflictDoNothing(),
          ctx.db
            .delete(schema.allowedGroups)
            .where(eq(schema.allowedGroups.groupId, sourceId)),
        ]
      : []),
    ...(attempts.length
      ? [
          ctx.db
            .insert(schema.clownCooldownAttempts)
            .values(
              attempts.map((attempt) => ({
                ...attempt,
                groupId: destinationId,
              })),
            )
            .onConflictDoUpdate({
              target: [
                schema.clownCooldownAttempts.groupId,
                schema.clownCooldownAttempts.voterId,
              ],
              set: {
                attempts: sql`max(${schema.clownCooldownAttempts.attempts}, excluded.attempts)`,
                expiresAt: sql`max(${schema.clownCooldownAttempts.expiresAt}, excluded.expires_at)`,
              },
            }),
        ]
      : []),
    ctx.db
      .delete(schema.clownCooldownAttempts)
      .where(eq(schema.clownCooldownAttempts.groupId, sourceId)),
    ctx.db.delete(schema.groups).where(eq(schema.groups.id, sourceId)),
  ];

  // Cloudflare D1 batches are atomic. Keep the new parent row first and the old one last
  // so foreign-key references remain valid throughout the migration.
  await ctx.db.batch(statements);
}

export const migrateGroupHandler: MessageHandler = {
  kind: "message",
  inGroup: true,
  filter: async (ctx, next) => {
    if (
      ctx.msg?.migrate_to_chat_id === undefined &&
      ctx.msg?.migrate_from_chat_id === undefined
    ) {
      return;
    }
    await next();
  },
  handler: migrateGroup,
};
