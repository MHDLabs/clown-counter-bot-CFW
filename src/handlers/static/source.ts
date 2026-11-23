import { InlineKeyboard } from "grammy";

import type { CommandHandler } from "@/handlers";

const UPSTREAM_REPOSITORY = "https://github.com/haashemi/clown-counter-bot";

export const sourceHandler: CommandHandler = {
  kind: "command",
  name: "source",
  description: "🪄 سورس‌کد ربات",
  scopes: [{ type: "all_private_chats" }],
  handler: async (ctx) => {
    const keyboard = new InlineKeyboard()
      .url(ctx.t("cmd_source_repository"), UPSTREAM_REPOSITORY)
      .url(ctx.t("cmd_creator_channel"), "https://t.me/MHDLabs")
      .row()
      .text(ctx.t("panel_close"), "panel:close");

    return await ctx.richReply(ctx.t("cmd_source"), {
      reply_markup: keyboard,
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
