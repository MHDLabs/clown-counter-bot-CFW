import type { BotCommandScope } from "grammy/types";

import type { CommandHandler } from "@/handlers";
import type { BotContext } from "@/lib/bot";

const scopes: BotCommandScope[] = [
  { type: "all_private_chats" },
  { type: "all_group_chats" },
  { type: "all_chat_administrators" },
];

function heading(ctx: BotContext, key: string, size: 1 | 2) {
  return { type: "heading" as const, size, text: ctx.t(key) };
}

function list(ctx: BotContext, keys: string[]) {
  return {
    type: "list" as const,
    items: keys.map((key) => ({
      blocks: [{ type: "paragraph" as const, text: ctx.t(key) }],
    })),
  };
}

export const helpHandler: CommandHandler = {
  kind: "command",
  name: "help",
  description: "📖 Bot usage guide",
  scopes,
  handler: async (ctx) => {
    if (!ctx.chat) return;

    const blocks = [
      heading(ctx, "help_title", 1),
      { type: "divider" as const },
      heading(ctx, "help_voting_heading", 2),
      list(ctx, ["help_vote_add", "help_vote_remove", "help_vote_limits", "help_vote_cooldown", "help_text_triggers"]),
      heading(ctx, "help_group_heading", 2),
      list(ctx, ["help_stats", "help_clown_of_day"]),
      { type: "divider" as const },
      heading(ctx, "help_admin_heading", 2),
      list(ctx, ["help_set_cooldown", "help_reset_stats", "help_custom_clown_media", "help_custom_unclown_media"]),
      heading(ctx, "help_private_heading", 2),
      list(ctx, ["help_language", "help_privacy_source"]),
      { type: "footer" as const, text: ctx.t("help_footer") },
    ];

    return await ctx.api.sendRichMessage(
      ctx.chat.id,
      { blocks, is_rtl: ctx.locale === "fa" },
      ctx.msg
        ? {
            reply_parameters: {
              message_id: ctx.msg.message_id,
              chat_id: ctx.msg.chat.id,
              allow_sending_without_reply: true,
            },
          }
        : undefined,
    );
  },
};
