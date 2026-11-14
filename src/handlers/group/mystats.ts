import { and, eq, gte, sql } from "drizzle-orm";

import type { CommandHandler } from "@/handlers";
import type { BotContext } from "@/lib/bot";

import { schema } from "@/db";

function displayName(firstName: string, lastName?: string): string {
  return lastName ? `${firstName} ${lastName}` : firstName;
}

async function personalStats(ctx: BotContext) {
  const { message } = ctx;
  if (!message || !ctx.chat) return;

  const target = message.reply_to_message?.from ?? message.from;

  if (!target) {
    return await ctx.richReply(ctx.t("cmd_mystats_unavailable"), {
      reply_parameters: {
        message_id: message.message_id,
        chat_id: message.chat.id,
        allow_sending_without_reply: true,
      },
    });
  }

  const group = await ctx.db.query.groups.findFirst({
    columns: { resetAt: true },
    where: (fields, operators) => operators.eq(fields.id, String(ctx.chat?.id)),
  });
  const conditions = [
    eq(schema.clownVotes.groupId, String(ctx.chat.id)),
    eq(schema.clownVotes.clownId, String(target.id)),
  ];
  if (group?.resetAt) conditions.push(gte(schema.clownVotes.votedAt, group.resetAt));

  const [result] = await ctx.db
    .select({
      score: sql<number>`coalesce(sum(${schema.clownVotes.quantity}), 0)`,
      received: sql<number>`coalesce(sum(case when ${schema.clownVotes.quantity} > 0 then ${schema.clownVotes.quantity} else 0 end), 0)`,
      removed: sql<number>`coalesce(-sum(case when ${schema.clownVotes.quantity} < 0 then ${schema.clownVotes.quantity} else 0 end), 0)`,
    })
    .from(schema.clownVotes)
    .where(and(...conditions));
  const totals = result ?? { score: 0, received: 0, removed: 0 };

  const name = displayName(target.first_name, target.last_name);
  const replyParameters = {
    message_id: message.message_id,
    chat_id: message.chat.id,
    allow_sending_without_reply: true,
  };

  return await ctx.api.sendRichMessage(
    ctx.chat.id,
    {
      blocks: [
        { type: "heading", size: 1, text: ctx.t("cmd_mystats_title", { name }) },
        {
          type: "list",
          items: [
            { blocks: [{ type: "paragraph", text: ctx.t("cmd_mystats_score", { score: totals.score }) }] },
            { blocks: [{ type: "paragraph", text: ctx.t("cmd_mystats_received", { received: totals.received }) }] },
            { blocks: [{ type: "paragraph", text: ctx.t("cmd_mystats_removed", { removed: totals.removed }) }] },
          ],
        },
      ],
      is_rtl: ctx.locale === "fa",
    },
    { reply_parameters: replyParameters },
  );
}

export const personalStatsHandler: CommandHandler = {
  kind: "command",
  name: "mystats",
  description: "View personal group stats",
  scopes: [{ type: "all_group_chats" }, { type: "all_chat_administrators" }],
  handler: personalStats,
};
