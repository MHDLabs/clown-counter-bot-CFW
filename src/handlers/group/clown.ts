import type { BotCommandScope, User } from "grammy/types";

import { and, desc, eq, sql } from "drizzle-orm";

import type { CommandHandler, Handler, MessageHandler } from "@/handlers";
import type { BotContext } from "@/lib/bot";

import { schema } from "@/db";

import { isClownCall } from "./clown-filter";

const DEFAULT_COOLDOWN = 10 * 60 * 1000;

const GROUP_SCOPES: BotCommandScope[] = [{ type: "all_group_chats" }, { type: "all_chat_administrators" }];

interface Data {
  messageId: number;
  group: { id: number; name: string };
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
    group: { id: ctx.message.chat.id, name: ctx.message.chat.title ?? "" },
    voter: { ...voter, name: displayName(voter) },
    clown: { ...clown, name: displayName(clown) },
  };
}

async function waitMinutes(ctx: BotContext, data: Data): Promise<number> {
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
  if (!last[0]) return 0;
  return Math.max(0, Math.ceil((cooldown - (Date.now() - last[0].votedAt.getTime())) / 60_000));
}

async function voteHandler(ctx: BotContext, quantity: -1 | 1) {
  const data = getData(ctx);

  if (!data) {
    if (ctx.message) {
      const prefix = quantity > 0 ? "cmd_clown" : "cmd_unclown";
      return await ctx.reply(ctx.t(`${prefix}_usage`), {
        reply_parameters: { message_id: ctx.message.message_id, chat_id: ctx.message.chat.id },
      });
    }

    return;
  }

  const { messageId, group, voter, clown } = data;
  const prefix = quantity > 0 ? "cmd_clown" : "cmd_unclown";
  const reply = (text: string) => ctx.reply(text, { reply_parameters: { message_id: messageId, chat_id: group.id } });
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
  // A single conditional INSERT is atomic in SQLite: competing webhook requests cannot both pass.
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
    const waitMin = await waitMinutes(ctx, data);
    return await reply(ctx.t(`${prefix}_wait`, { waitMin: Math.max(1, waitMin) }));
  }

  return await reply(ctx.t(`${prefix}`, { clown: clown.name, voter: voter.name }));
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
