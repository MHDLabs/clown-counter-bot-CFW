import { eq, sql } from "drizzle-orm";

import type { MessageHandler } from "@/handlers";
import type { BotContext } from "@/lib/bot";

import { schema } from "@/db";

interface GroupSnapshot {
  name: string | null;
  botMemberStatus: "active" | "kicked" | "left" | null;
  gifIds: string[] | null;
  stickerIds: string[] | null;
  unclownGifIds: string[] | null;
  unclownStickerIds: string[] | null;
  resetAt: Date | null;
  cooldown: number | null;
}

interface CooldownAttempt {
  voterId: string;
  attempts: number;
  expiresAt: number;
}

interface GroupMigration {
  sourceId: string;
  destinationId: string;
  destinationName?: string;
}

interface MigrationState {
  source: GroupSnapshot | undefined;
  destination: GroupSnapshot | undefined;
  sourceAllowlist: { groupId: string }[];
  sourceAttempts: CooldownAttempt[];
  destinationAttempts: CooldownAttempt[];
}

function mergeIds(...values: (string[] | null)[]): string[] | null {
  const merged = [...new Set(values.flatMap((value) => value ?? []))];
  return merged.length ? merged : null;
}

function mergeResetAt(source: Date | null, destination: Date | null | undefined): Date | null {
  const sourceTime = source?.getTime() ?? null;
  const destinationTime = destination?.getTime() ?? null;

  if (sourceTime === null && destinationTime === null) return null;
  return new Date(Math.max(sourceTime ?? Number.NEGATIVE_INFINITY, destinationTime ?? Number.NEGATIVE_INFINITY));
}

function mergeMembershipStatus(
  source: GroupSnapshot["botMemberStatus"],
  destination: GroupSnapshot["botMemberStatus"] | undefined,
): GroupSnapshot["botMemberStatus"] {
  if (source === "active" || destination === "active") return "active";
  return destination ?? source;
}

export function mergeGroupSettings(
  source: GroupSnapshot,
  destination?: GroupSnapshot,
  destinationName?: string,
): GroupSnapshot {
  return {
    name: destinationName ?? destination?.name ?? source.name,
    botMemberStatus: mergeMembershipStatus(source.botMemberStatus, destination?.botMemberStatus),
    gifIds: mergeIds(source.gifIds, destination?.gifIds ?? null),
    stickerIds: mergeIds(source.stickerIds, destination?.stickerIds ?? null),
    unclownGifIds: mergeIds(source.unclownGifIds, destination?.unclownGifIds ?? null),
    unclownStickerIds: mergeIds(source.unclownStickerIds, destination?.unclownStickerIds ?? null),
    resetAt: mergeResetAt(source.resetAt, destination?.resetAt ?? null),
    cooldown: destination?.cooldown ?? source.cooldown,
  };
}

export function mergeCooldownAttempts(...groups: CooldownAttempt[][]): CooldownAttempt[] {
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

function migrationFor(ctx: BotContext): GroupMigration | null {
  const { msg, chat } = ctx;
  if (!msg || !chat || (chat.type !== "group" && chat.type !== "supergroup")) return null;

  if (msg.migrate_to_chat_id !== undefined) {
    return {
      sourceId: String(chat.id),
      destinationId: String(msg.migrate_to_chat_id),
      destinationName: chat.title,
    };
  }

  if (msg.migrate_from_chat_id !== undefined) {
    return {
      sourceId: String(msg.migrate_from_chat_id),
      destinationId: String(chat.id),
      destinationName: chat.title,
    };
  }

  return null;
}

async function loadMigrationState(ctx: BotContext, migration: GroupMigration): Promise<MigrationState> {
  const { sourceId, destinationId } = migration;
  const [source, destination, sourceAllowlist, sourceAttempts, destinationAttempts] = await Promise.all([
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

  return { source, destination, sourceAllowlist, sourceAttempts, destinationAttempts };
}

function migrationStatements(
  ctx: BotContext,
  migration: GroupMigration,
  state: MigrationState,
) {
  const { source, destination, sourceAllowlist, sourceAttempts, destinationAttempts } = state;
  const { sourceId, destinationId, destinationName } = migration;
  if (!source) return null;

  const merged = mergeGroupSettings(source, destination, destinationName);
  const attempts = mergeCooldownAttempts(sourceAttempts, destinationAttempts);
  const statements = [
    ctx.db
      .insert(schema.groups)
      .values({ id: destinationId, ...merged })
      .onConflictDoUpdate({
        target: schema.groups.id,
        set: merged,
      }),
    ctx.db.update(schema.clownVotes).set({ groupId: destinationId }).where(eq(schema.clownVotes.groupId, sourceId)),
  ];

  if (sourceAllowlist.length > 0) {
    statements.push(
      ctx.db.insert(schema.allowedGroups).values({ groupId: destinationId }).onConflictDoNothing(),
      ctx.db.delete(schema.allowedGroups).where(eq(schema.allowedGroups.groupId, sourceId)),
    );
  }

  if (attempts.length > 0) {
    statements.push(
      ctx.db
        .insert(schema.clownCooldownAttempts)
        .values(attempts.map((attempt) => ({ ...attempt, groupId: destinationId })))
        .onConflictDoUpdate({
          target: [schema.clownCooldownAttempts.groupId, schema.clownCooldownAttempts.voterId],
          set: {
            attempts: sql`max(${schema.clownCooldownAttempts.attempts}, excluded.attempts)`,
            expiresAt: sql`max(${schema.clownCooldownAttempts.expiresAt}, excluded.expires_at)`,
          },
        }),
    );
  }

  statements.push(
    ctx.db.delete(schema.clownCooldownAttempts).where(eq(schema.clownCooldownAttempts.groupId, sourceId)),
    ctx.db.delete(schema.groups).where(eq(schema.groups.id, sourceId)),
  );

  return statements;
}

/** Move all persisted group state when Telegram upgrades a basic group to a supergroup. */
async function migrateGroup(ctx: BotContext) {
  const migration = migrationFor(ctx);
  if (!migration || migration.sourceId === migration.destinationId) return;

  const state = await loadMigrationState(ctx, migration);
  const statements = migrationStatements(ctx, migration, state);
  if (!statements) return;

  // Cloudflare D1 batches are atomic. Keep the new parent row first and the old one last.
  await ctx.db.batch(statements);
}

export const migrateGroupHandler: MessageHandler = {
  kind: "message",
  inGroup: true,
  filter: async (ctx, next) => {
    if (ctx.msg?.migrate_to_chat_id === undefined && ctx.msg?.migrate_from_chat_id === undefined) {
      return;
    }
    await next();
  },
  handler: migrateGroup,
};
