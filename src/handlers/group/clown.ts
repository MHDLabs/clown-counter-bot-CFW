import type { BotCommandScope, User } from "grammy/types";

import { and, desc, eq, lte, sql } from "drizzle-orm";

import type { CommandHandler, Handler, MessageHandler } from "@/handlers";
import type { BotContext } from "@/lib/bot";

import { schema } from "@/db";

import { isClownCall } from "./clown-filter";

const DEFAULT_COOLDOWN = 10 * 60 * 1000;
const MIN_RESTRICTION_SECONDS = 30;
const GROUP_SCOPES: BotCommandScope[] = [{ type: "all_group_chats" }, { type: "all_chat_administrators" }];

interface Data {
  messageId: number;
  group: { id: number; name: string; type: string };
  voter: User & { name: string };
  clown: User & { name: string };
}

function displayName(user: User): string {
  return user.last_name ? `${user.first_name} ${user.last_name}` : user.first_name;
}

export function getData(ctx: BotContext): Data | null {
  if (!ctx.message) return null;

  const voter = ctx.message.from;
  const replied = ctx.message.reply_to_message;
  // Forum topic creation service messages are not a member and cannot receive a vote.
  const clown = replied?.forum_topic_created ? undefined : replied?.from;
  if (!clown || !voter) return null;

  return {
    messageId: ctx.message.message_id,
    group: {
      id: ctx.message.chat.id,
      name: ctx.message.chat.title ?? "",
      type: ctx.message.chat.type,
    },
    voter: { ...voter, name: displayName(voter) },
    clown: { ...clown, name: displayName(clown) },
  };
}

async function cooldownState(ctx: BotContext, data: Data) {
  const group = await ctx.db.query.groups.findFirst({
    columns: { cooldown: true },
    where: (f, o) => o.eq(f.id, String(data.group.id)),
  });
  const cooldown = group?.cooldown ?? DEFAULT_COOLDOWN;
  const last = await ctx.db
    .select({ votedAt: schema.clownVotes.votedAt })
    .from(schema.clownVotes)
    .where(
      and(eq(schema.clownVotes.groupId, String(data.group.id)), eq(schema.clownVotes.voterId, String(data.voter.id))),
    )
    .orderBy(desc(schema.clownVotes.votedAt))
    .limit(1);
  if (!last[0]) return { waitMin: 0, expiresAt: Date.now() };

  const expiresAt = last[0].votedAt.getTime() + cooldown;
  return {
    waitMin: Math.max(0, Math.ceil((expiresAt - Date.now()) / 60_000)),
    expiresAt,
  };
}

async function recordCooldownAttempt(ctx: BotContext, data: Data, expiresAt: number): Promise<number> {
  const now = Date.now();
  await ctx.db.delete(schema.clownCooldownAttempts).where(lte(schema.clownCooldownAttempts.expiresAt, now));
  const result = await ctx.db
    .insert(schema.clownCooldownAttempts)
    .values({ groupId: String(data.group.id), voterId: String(data.voter.id), attempts: 1, expiresAt })
    .onConflictDoUpdate({
      target: [schema.clownCooldownAttempts.groupId, schema.clownCooldownAttempts.voterId],
      set: {
        attempts: sql`CASE WHEN ${schema.clownCooldownAttempts.expiresAt} <= ${now} THEN 1 ELSE ${schema.clownCooldownAttempts.attempts} + 1 END`,
        expiresAt,
      },
    })
    .returning({ attempts: schema.clownCooldownAttempts.attempts });

  return result[0]?.attempts ?? 1;
}

export async function respondToClownCooldown(ctx: BotContext, data: Data, expiresAt: number) {
  const { group, voter } = data;
  const waitMin = Math.max(1, Math.ceil((expiresAt - Date.now()) / 60_000));
  const reply = (text: string) =>
    ctx.richReply(text, {
      reply_parameters: {
        message_id: data.messageId,
        chat_id: group.id,
        allow_sending_without_reply: true,
      },
    });

  try {
    const member = await ctx.api.getChatMember(group.id, voter.id);

    if (
      member.status === "member" &&
      group.type === "supergroup" &&
      expiresAt - Date.now() > MIN_RESTRICTION_SECONDS * 1000
    ) {
      const botMember = await ctx.api.getChatMember(group.id, ctx.meId);

      if (botMember.status === "administrator" && botMember.can_restrict_members) {
        await ctx.api.restrictChatMember(
          group.id,
          voter.id,
          {
            can_send_messages: false,
            can_send_audios: false,
            can_send_documents: false,
            can_send_photos: false,
            can_send_videos: false,
            can_send_video_notes: false,
            can_send_voice_notes: false,
            can_send_polls: false,
            can_send_other_messages: false,
            can_add_web_page_previews: false,
          },
          { until_date: Math.floor(expiresAt / 1000), use_independent_chat_permissions: true },
        );
      }
    }
  } catch {
    // A missing moderation permission must not prevent the canonical cooldown response.
  }

  return await reply(ctx.t("cmd_clown_wait", { waitMin }));
}

async function voteHandler(ctx: BotContext, quantity: -1 | 1) {
  const data = getData(ctx);

  if (!data) return;

  const { messageId, group, voter, clown } = data;
  const prefix = quantity > 0 ? "cmd_clown" : "cmd_unclown";
  const reply = (text: string) =>
    ctx.richReply(text, {
      reply_parameters: { message_id: messageId, chat_id: group.id, allow_sending_without_reply: true },
    });
  const rejection = clown.id === ctx.meId ? "is_me" : clown.is_bot ? "is_bot" : voter.id === clown.id ? "is_you" : null;
  if (rejection) return await reply(ctx.t(`${prefix}_${rejection}`));

  await Promise.all([
    ctx.db
      .insert(schema.users)
      .values([
        { id: String(voter.id), name: voter.name },
        { id: String(clown.id), name: clown.name },
      ])
      .onConflictDoUpdate({ target: schema.users.id, set: { name: sql`excluded.name` } }),
    ctx.db
      .insert(schema.groups)
      .values({ id: String(group.id), name: group.name })
      .onConflictDoUpdate({ target: schema.groups.id, set: { name: group.name } }),
  ]);

  const now = Date.now();
  const cooldown = await ctx.db.query.groups.findFirst({
    columns: { cooldown: true },
    where: (f, o) => o.eq(f.id, String(group.id)),
  });
  const duration = cooldown?.cooldown ?? DEFAULT_COOLDOWN;
  const inserted = await ctx.db.run(sql`INSERT INTO clown_votes (voter_id, clown_id, group_id, voted_at, quantity)
    SELECT ${String(voter.id)}, ${String(clown.id)}, ${String(group.id)}, ${now}, ${quantity}
    WHERE NOT EXISTS (SELECT 1 FROM clown_votes WHERE group_id = ${String(group.id)}
      AND voter_id = ${String(voter.id)} AND voted_at > ${now - duration})`);

  if (inserted.meta.changes === 0) {
    const state = await cooldownState(ctx, data);

    if (quantity > 0) {
      const attempts = await recordCooldownAttempt(ctx, data, state.expiresAt);
      if (attempts >= 2) return await respondToClownCooldown(ctx, data, state.expiresAt);
    }

    return await reply(ctx.t(`${prefix}_wait`, { waitMin: Math.max(1, state.waitMin) }));
  }

  return await reply(ctx.t(prefix, { clown: clown.name, voter: voter.name }));
}

function clownHandler(ctx: BotContext) {
  return voteHandler(ctx, 1);
}

function unclownHandler(ctx: BotContext) {
  return voteHandler(ctx, -1);
}

/** `/clown` — same vote as the 🤡 text trigger. */
export const cmdClown: CommandHandler = {
  kind: "command",
  name: "clown",
  description: "🤡 عه یه دلقک!",
  scopes: GROUP_SCOPES,
  handler: clownHandler,
};

/** `/unclown` — same vote as the 😇 text trigger. */
export const cmdUnclown: CommandHandler = {
  kind: "command",
  name: "unclown",
  description: "💀 یکی آدم شده",
  scopes: GROUP_SCOPES,
  handler: unclownHandler,
};

/** The 🤡/دلقک/😇/ستون text + configured gif/sticker flow. */
export const clownMessageHandler: MessageHandler = {
  kind: "message",
  inGroup: true,
  filter: isClownCall,
  handler: async (ctx) => (ctx.clownCall === "clown" ? await clownHandler(ctx) : await unclownHandler(ctx)),
};

export const clownHandlers: Handler[] = [cmdClown, cmdUnclown, clownMessageHandler];
