import { eq, sql } from "drizzle-orm";

import type { CommandHandler } from "@/handlers";
import type { BotContext } from "@/lib/bot";

import { schema } from "@/db";

const MIN_QUANTITY = 5;
const MAX_QUANTITY = 20;

async function clownOfTheDay(ctx: BotContext) {
  const { message } = ctx;
  if (!message) return;

  const groupId = message.chat.id;

  // Candidates: users who ever appeared in this group's clown_votes (as voter or clown).
  const rows = await ctx.db
    .selectDistinct({ id: schema.users.id, name: schema.users.name })
    .from(schema.clownVotes)
    .innerJoin(schema.users, eq(schema.users.id, schema.clownVotes.clownId))
    .where(eq(schema.clownVotes.groupId, String(groupId)));

  if (rows.length === 0) {
    return await ctx.reply(ctx.t("cmd_clown_of_the_day_no_users"), {
      reply_parameters: { message_id: message.message_id, chat_id: groupId },
    });
  }

  const clown = rows[Math.floor(Math.random() * rows.length)]!;
  const quantity = MIN_QUANTITY + Math.floor(Math.random() * (MAX_QUANTITY - MIN_QUANTITY + 1));

  const now = new Date();
  const dayStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const inserted = await ctx.db.run(sql`INSERT INTO clown_votes (group_id, voter_id, clown_id, voted_at, quantity)
    SELECT ${String(groupId)}, NULL, ${clown.id}, ${now.getTime()}, ${quantity}
    WHERE NOT EXISTS (SELECT 1 FROM clown_votes WHERE group_id = ${String(groupId)} AND voter_id IS NULL
      AND voted_at >= ${dayStart} AND voted_at < ${dayStart + 86_400_000})`);

  if (inserted.meta.changes === 0) {
    return await ctx.reply(ctx.t("cmd_clown_of_the_day_wait"), {
      reply_parameters: { message_id: message.message_id, chat_id: groupId },
    });
  }

  return await ctx.reply(ctx.t("cmd_clown_of_the_day", { clown: clown.name, quantity }), {
    reply_parameters: { message_id: message.message_id, chat_id: groupId },
  });
}

export const clownOfTheDayHandler: CommandHandler = {
  kind: "command",
  name: "clownoftheday",
  description: "👑 دلقک روز",
  scopes: [{ type: "all_group_chats" }, { type: "all_chat_administrators" }],
  handler: clownOfTheDay,
};
