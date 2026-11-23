import { InlineKeyboard } from "grammy";

import type { CallbackQueryHandler } from "@/handlers";
import type { BotContext } from "@/lib/bot";
import { isAdmin } from "@/lib/bot";

async function closeMessage(ctx: BotContext): Promise<void> {
  const message = ctx.callbackQuery?.message;
  await ctx.answerCallbackQuery();
  if (!message) return;

  try {
    await ctx.api.deleteMessage(message.chat.id, message.message_id);
  } catch {
    try {
      await ctx.api.editMessageReplyMarkup(message.chat.id, message.message_id, {
        reply_markup: new InlineKeyboard(),
      });
    } catch {
      // The panel may already have been deleted or become inaccessible.
    }
  }
}

export const panelCloseHandler: CallbackQueryHandler = {
  kind: "callback_query",
  data: "panel:close",
  handler: closeMessage,
};

export const adminPanelCloseHandler: CallbackQueryHandler = {
  kind: "callback_query",
  data: "panel:close:admin",
  handler: async (ctx) => {
    if (!(await isAdmin(ctx))) {
      return await ctx.answerCallbackQuery({ text: ctx.t("cmd_admin_only"), show_alert: true });
    }
    await closeMessage(ctx);
  },
};

export const ownerPanelCloseHandler: CallbackQueryHandler = {
  kind: "callback_query",
  data: "panel:close:owner",
  handler: async (ctx) => {
    const allowed = ctx.chat?.type === "private" && Boolean(ctx.from && ctx.botAdminIds?.has(String(ctx.from.id)));
    if (!allowed) {
      return await ctx.answerCallbackQuery({ text: ctx.t("cmd_admin_only"), show_alert: true });
    }
    await closeMessage(ctx);
  },
};
