import type { Context, NextFunction } from "grammy";
import type { Message } from "grammy/types";

import type { BotContext } from "..";

type RichReplyOptions = NonNullable<Parameters<Context["api"]["sendRichMessage"]>[2]>;

type RichEditOptions = NonNullable<Parameters<Context["api"]["editMessageText"]>[3]>;

type RichReplyResult = Awaited<ReturnType<Context["api"]["sendRichMessage"]>>;

type RichEditResult = Awaited<ReturnType<Context["api"]["editMessageText"]>>;

interface RichEditInput {
  chatId: number | string;
  messageId: number;
  text: string;
  options?: RichEditOptions;
}

export interface ReplyToFlavor {
  richReply: (text: string, options?: RichReplyOptions) => Promise<RichReplyResult>;
  editRichMessage: (input: RichEditInput) => Promise<RichEditResult>;
  replyTo: (msg: Message | undefined, text: string) => Promise<RichReplyResult>;
}

function inputRichMessage(ctx: BotContext, text: string) {
  const lines = text.split(/\r?\n/).filter((line) => line.replace(/\u200f/g, "").length > 0);
  const blocks = (lines.length ? lines : ["\u200f"]).map((line) => ({
    type: "paragraph" as const,
    text: line,
  }));

  return { blocks, is_rtl: ctx.locale === "fa" };
}

export async function replyToMiddleware(ctx: BotContext, next: NextFunction) {
  ctx.richReply = async (text, options) => {
    if (!ctx.chat) throw new Error("Cannot send a Rich Message without a chat context");
    return await ctx.api.sendRichMessage(ctx.chat.id, inputRichMessage(ctx, text), options);
  };

  ctx.editRichMessage = async ({ chatId, messageId, text, options }) => {
    return await ctx.api.editMessageText(chatId, messageId, inputRichMessage(ctx, text), options);
  };

  ctx.replyTo = async (msg, text) => {
    return await ctx.richReply(
      text,
      msg
        ? { reply_parameters: { message_id: msg.message_id, chat_id: msg.chat.id, allow_sending_without_reply: true } }
        : undefined,
    );
  };

  await next();
}
