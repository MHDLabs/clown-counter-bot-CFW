import { and, asc, count, desc, eq, gte, sql } from "drizzle-orm";
import { InlineKeyboard } from "grammy";

import type { CallbackQueryHandler, CommandHandler } from "@/handlers";
import type { BotContext } from "@/lib/bot";

import { schema } from "@/db";
import { localizeDate } from "@/lib/date";

const STATS_PER_PAGE = 20;
const MAX_PAGE = 100_000;

export function parseStatsPage(input: string): number | null {
  if (!/^\d{1,6}$/.test(input)) return null;
  const page = Number(input);
  return Number.isSafeInteger(page) && page <= MAX_PAGE ? page : null;
}

function statsKeyboard(ctx: BotContext, page: number, pages: number): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  if (page > 0) keyboard.text(ctx.t("cmd_stats_previous"), `stats:page:${page - 1}`);
  if (page + 1 < pages) keyboard.text(ctx.t("cmd_stats_next"), `stats:page:${page + 1}`);
  return keyboard;
}

async function renderStats(
  ctx: BotContext,
  requestedPage: number,
  message?: { chat: { id: number }; message_id: number },
) {
  if (!ctx.chat || (ctx.chat.type !== "group" && ctx.chat.type !== "supergroup")) return;

  const groupId = String(ctx.chat.id);
  const group = await ctx.db.query.groups.findFirst({
    columns: { resetAt: true },
    where: (fields, operators) => operators.eq(fields.id, groupId),
  });

  const conditions = [eq(schema.clownVotes.groupId, groupId)];
  if (group?.resetAt) conditions.push(gte(schema.clownVotes.votedAt, group.resetAt));

  const currentScores = ctx.db
    .select({
      clownId: schema.clownVotes.clownId,
      name: schema.users.name,
      score: sql<number>`sum(${schema.clownVotes.quantity})`.as("score"),
    })
    .from(schema.clownVotes)
    .innerJoin(schema.users, eq(schema.users.id, schema.clownVotes.clownId))
    .where(and(...conditions))
    .groupBy(schema.clownVotes.clownId, schema.users.name)
    .as("current_group_scores");

  const [countRow] = await ctx.db.select({ total: count() }).from(currentScores);
  const total = countRow?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / STATS_PER_PAGE));
  const page = Math.min(requestedPage, pages - 1);
  const rows = await ctx.db
    .select({ name: currentScores.name, score: currentScores.score })
    .from(currentScores)
    .orderBy(desc(currentScores.score), asc(currentScores.clownId))
    .limit(STATS_PER_PAGE)
    .offset(page * STATS_PER_PAGE);

  if (rows.length === 0) {
    const text = ctx.t("cmd_stats_no_clown");

    if (message) {
      return await ctx.editRichMessage({
        chatId: message.chat.id,
        messageId: message.message_id,
        text,
        options: { reply_markup: new InlineKeyboard() },
      });
    }

    return await ctx.richReply(text);
  }

  const clownsText = rows.map((row) => ctx.t("cmd_stats_group_clown", { name: row.name, votes: row.score }));
  const resetText = group?.resetAt ? `\n\n${ctx.t("cmd_stats_reset_at", { date: localizeDate(group.resetAt) })}` : "";
  const pageText = pages > 1 ? `\n${ctx.t("cmd_stats_group_page", { current: page + 1, total: pages })}` : "";
  const text = `${ctx.t("cmd_stats_group")}\n\n${clownsText.join("\n")}${resetText}${pageText}`;
  const replyMarkup = statsKeyboard(ctx, page, pages);

  if (message) {
    return await ctx.editRichMessage({
      chatId: message.chat.id,
      messageId: message.message_id,
      text,
      options: { reply_markup: replyMarkup },
    });
  }

  return await ctx.richReply(text, { reply_markup: replyMarkup });
}

async function groupStats(ctx: BotContext) {
  return await renderStats(ctx, 0);
}

async function statsPageCallback(ctx: BotContext) {
  const callback = ctx.callbackQuery;
  if (!callback?.message || !ctx.chat || (ctx.chat.type !== "group" && ctx.chat.type !== "supergroup")) return;

  const match = /^stats:page:(\d{1,6})$/.exec(callback.data ?? "");
  if (!match?.[1]) return;
  const page = parseStatsPage(match[1]);
  await ctx.answerCallbackQuery();
  if (page === null) return;

  return await renderStats(ctx, page, {
    chat: callback.message.chat,
    message_id: callback.message.message_id,
  });
}

export const statsHandler: CommandHandler = {
  kind: "command",
  name: "stats",
  description: "📊 آمار دلقک‌شماری",
  scopes: [{ type: "all_group_chats" }, { type: "all_chat_administrators" }],
  handler: groupStats,
};

export const statsCallbacks: CallbackQueryHandler[] = [
  { kind: "callback_query", data: /^stats:page:(\d{1,6})$/, handler: statsPageCallback },
];
