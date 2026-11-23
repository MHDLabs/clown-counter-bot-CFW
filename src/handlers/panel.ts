import { InlineKeyboard } from "grammy";

import type { CallbackQueryHandler } from "@/handlers";

export const panelCloseHandler: CallbackQueryHandler = {
  kind: "callback_query",
  data: "panel:close",
  handler: async (ctx) => {
    const message = ctx.callbackQuery?.message;
    await ctx.answerCallbackQuery();
    if (!message) return;

    try {
      await ctx.api.deleteMessage(message.chat.id, message.message_id);
    } catch {
      try {
        await ctx.api.editMessageReplyMarkup(message.chat.id, message.message_id, { reply_markup: new InlineKeyboard() });
      } catch {
        // The panel may already have been deleted or become inaccessible.
      }
    }
  },
};
