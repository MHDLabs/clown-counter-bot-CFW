import type { BotCommandScope } from "grammy/types";

import { InlineKeyboard } from "grammy";

import type { CallbackQueryHandler, CommandHandler } from "@/handlers";
import type { BotContext } from "@/lib/bot";

const scopes: BotCommandScope[] = [
  { type: "all_private_chats" },
  { type: "all_group_chats" },
  { type: "all_chat_administrators" },
];

const helpPages = ["home", "voting", "group", "personal", "admin", "account"] as const;
type HelpPage = (typeof helpPages)[number];

const pageButtons: { page: HelpPage; key: string }[] = [
  { page: "home", key: "help_button_home" },
  { page: "voting", key: "help_button_voting" },
  { page: "group", key: "help_button_group_stats" },
  { page: "personal", key: "help_button_personal_stats" },
  { page: "admin", key: "help_button_admin" },
  { page: "account", key: "help_button_account" },
];

function helpKeyboard(ctx: BotContext) {
  const keyboard = new InlineKeyboard();

  for (const [index, button] of pageButtons.entries()) {
    keyboard.text(ctx.t(button.key), `help:${button.page}`);
    if (index % 2 === 1 && index < pageButtons.length - 1) keyboard.row();
  }

  keyboard.row().text(ctx.t("panel_close"), "panel:close");
  return keyboard;
}

function heading(ctx: BotContext, key: string, size: 1 | 2) {
  return { type: "heading" as const, size, text: ctx.t(key) };
}

function list(ctx: BotContext, keys: string[]) {
  return {
    type: "list" as const,
    items: keys.map((key) => ({ blocks: [{ type: "paragraph" as const, text: ctx.t(key) }] })),
  };
}

function helpBlocks(ctx: BotContext, page: HelpPage) {
  switch (page) {
    case "home":
      return [
        heading(ctx, "help_title", 1),
        { type: "paragraph" as const, text: ctx.t("help_intro") },
        { type: "divider" as const },
        heading(ctx, "help_home_heading", 2),
        list(ctx, ["help_home_voting", "help_home_group_stats", "help_home_personal_stats", "help_home_settings"]),
        { type: "footer" as const, text: ctx.t("help_home_footer") },
      ];

    case "voting":
      return [
        heading(ctx, "help_voting_heading", 1),
        list(ctx, [
          "help_vote_add",
          "help_vote_remove",
          "help_vote_limits",
          "help_vote_cooldown",
          "help_text_triggers",
        ]),
        { type: "footer" as const, text: ctx.t("help_vote_footer") },
      ];

    case "group":
      return [
        heading(ctx, "help_group_heading", 1),
        list(ctx, ["help_stats", "help_clown_of_day"]),
        { type: "footer" as const, text: ctx.t("help_group_footer") },
      ];

    case "personal":
      return [
        heading(ctx, "help_personal_heading", 1),
        list(ctx, ["help_personal_self", "help_personal_reply", "help_personal_period"]),
      ];

    case "admin":
      return [
        heading(ctx, "help_admin_heading", 1),
        { type: "paragraph" as const, text: ctx.t("help_admin_intro") },
        list(ctx, ["help_set_cooldown", "help_reset_stats", "help_custom_clown_media", "help_custom_unclown_media"]),
      ];

    case "account":
      return [heading(ctx, "help_private_heading", 1), list(ctx, ["help_language", "help_privacy_source"])];
  }
}

function richMessage(ctx: BotContext, page: HelpPage) {
  return { blocks: helpBlocks(ctx, page), is_rtl: ctx.locale === "fa" };
}

export const helpHandler: CommandHandler = {
  kind: "command",
  name: "help",
  description: "📖 Bot usage guide",
  scopes,
  handler: async (ctx) => {
    if (!ctx.chat) return;

    return await ctx.api.sendRichMessage(ctx.chat.id, richMessage(ctx, "home"), {
      reply_markup: helpKeyboard(ctx),
      ...(ctx.msg
        ? {
            reply_parameters: {
              message_id: ctx.msg.message_id,
              chat_id: ctx.msg.chat.id,
              allow_sending_without_reply: true,
            },
          }
        : {}),
    });
  },
};

export const helpCallbacks: CallbackQueryHandler[] = helpPages.map((page) => ({
  kind: "callback_query",
  data: `help:${page}`,
  handler: async (ctx) => {
    const message = ctx.callbackQuery?.message;
    await ctx.answerCallbackQuery();
    if (!message) return;

    return await ctx.api.editMessageText(message.chat.id, message.message_id, richMessage(ctx, page), {
      reply_markup: helpKeyboard(ctx),
    });
  },
}));
