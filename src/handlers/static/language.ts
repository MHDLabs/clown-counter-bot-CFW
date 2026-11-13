import { InlineKeyboard } from "grammy";

import type { CallbackQueryHandler, CommandHandler } from "@/handlers";
import type { BotContext } from "@/lib/bot";

import { schema } from "@/db";
import { translate } from "@/lib/bot/plugins/i18n";

const faData = "language:fa";
const enData = "language:en";

function languageKeyboard(ctx: BotContext) {
  return new InlineKeyboard().text(ctx.t("cmd_language_persian"), faData).text(ctx.t("cmd_language_english"), enData);
}

async function showLanguagePanel(ctx: BotContext) {
  if (!ctx.from) return;
  return await ctx.reply(ctx.t("cmd_language_prompt"), { reply_markup: languageKeyboard(ctx) });
}

async function chooseLanguage(ctx: BotContext, locale: "en" | "fa"): Promise<void> {
  if (!ctx.from || !ctx.callbackQuery) return;

  await ctx.db
    .insert(schema.userPreferences)
    .values({ userId: String(ctx.from.id), locale })
    .onConflictDoUpdate({ target: schema.userPreferences.userId, set: { locale } });

  await ctx.answerCallbackQuery({ text: translate(locale, "cmd_language_saved") });

  if (ctx.callbackQuery.message) {
    await ctx.editMessageText(translate(locale, "cmd_language_saved"), { reply_markup: new InlineKeyboard() });
  }
}

export const languageHandler: CommandHandler = {
  kind: "command",
  name: "language",
  description: "🌐 Choose bot language",
  scopes: [{ type: "all_private_chats" }],
  handler: showLanguagePanel,
};

export const languageCallbacks: CallbackQueryHandler[] = [
  { kind: "callback_query", data: faData, handler: (ctx) => chooseLanguage(ctx, "fa") },
  { kind: "callback_query", data: enData, handler: (ctx) => chooseLanguage(ctx, "en") },
];
