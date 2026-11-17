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

function getData(ctx: BotContext): Data | null {
  if (!ctx.message) return null;

  const voter = ctx.message.from;
  const clown = ctx.message.reply_to_message?.from;
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

export function randomMessage(
  ctx: BotContext,
  options: { key: string; variants: number; variables?: Record<string, number | string> },
) {
  const index = Math.floor(Math.random() * options.variants) + 1;
  return ctx.t(`${options.key}_${index}`, options.variables);
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
  const reply = (text: string) =>
    ctx.richReply(text, {
      reply_parameters: {
        message_id: data.messageId,
        chat_id: group.id,
        allow_sending_without_reply: true,
      },
    });

  let responseKey = "cmd_clown_timeout_no_access";
  let waitMin = 1;

  try {
    const member = await ctx.api.getChatMember(group.id, voter.id);

    if (member.status === "creator") responseKey = "cmd_clown_timeout_owner";
    else if (member.status === "administrator") responseKey = "cmd_clown_timeout_admin";
    else if (member.status === "member") {
      if (group.type !== "supergroup") {
        responseKey = "cmd_clown_timeout_no_access";
      } else if (expiresAt - Date.now() <= MIN_RESTRICTION_SECONDS * 1000) {
        responseKey = "cmd_clown_wait";
      } else {
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
          responseKey = "cmd_clown_timeout_muted";
          waitMin = Math.max(1, Math.ceil((expiresAt - Date.now()) / 60_000));
        }
      }
    }
  } catch {
    responseKey = "cmd_clown_timeout_no_access";
  }

  return await reply(
    randomMessage(ctx, {
      key: responseKey,
      variants: 2,
      variables: { waitMin },
    }),
  );
}

async function voteHandler(ctx: BotContext, quantity: -1 | 1) {
  const data = getData(ctx);

  if (!data) {
    if (ctx.message) {
      const prefix = quantity > 0 ? "cmd_clown_usage" : "cmd_unclown_usage";
      return await ctx.richReply(randomMessage(ctx, { key: prefix, variants: 3 }), {
        reply_parameters: {
          message_id: ctx.message.message_id,
          chat_id: ctx.message.chat.id,
          allow_sending_without_reply: true,
        },
      });
    }

    return;
  }

  const { messageId, group, voter, clown } = data;
  const prefix = quantity > 0 ? "cmd_clown" : "cmd_unclown";
  const reply = (text: string) =>
    ctx.richReply(text, {
      reply_parameters: { message_id: messageId, chat_id: group.id, allow_sending_without_reply: true },
    });
  const rejection = clown.id === ctx.meId ? "is_me" : clown.is_bot ? "is_bot" : voter.id === clown.id ? "is_you" : null;
  if (rejection) return await reply(randomMessage(ctx, { key: `${prefix}_${rejection}`, variants: 3 }));

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

    return await reply(
      randomMessage(ctx, { key: `${prefix}_wait`, variants: 4, variables: { waitMin: Math.max(1, state.waitMin) } }),
    );
  }

  return await reply(
    randomMessage(ctx, { key: prefix, variants: 4, variables: { clown: clown.name, voter: voter.name } }),
  );
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
