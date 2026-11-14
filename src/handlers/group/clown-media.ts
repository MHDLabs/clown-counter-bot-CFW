import type { BotCommandScope } from "grammy/types";

import type { CommandHandler } from "@/handlers";
import type { BotContext } from "@/lib/bot";

type ClownMediaKind = "gif" | "sticker";

const GROUP_SCOPES: BotCommandScope[] = [{ type: "all_group_chats" }, { type: "all_chat_administrators" }];

async function sendClownMedia(ctx: BotContext, kind: ClownMediaKind) {
  const message = ctx.msg;
  if (!message || !ctx.chat) return;
  const chatId = ctx.chat.id;

  const group = await ctx.db.query.groups.findFirst({
    where: (fields, operators) => operators.eq(fields.id, String(message.chat.id)),
  });
  const mediaIds: string[] = kind === "gif" ? (group?.gifIds ?? []) : (group?.stickerIds ?? []);

  if (mediaIds.length === 0) {
    return await ctx.replyTo(message, ctx.t(`cmd_clown_${kind}s_empty`));
  }

  return await Promise.all(
    mediaIds.map((mediaId) =>
      kind === "gif" ? ctx.api.sendAnimation(chatId, mediaId) : ctx.api.sendSticker(chatId, mediaId),
    ),
  );
}

export const clownMediaHandlers: CommandHandler[] = [
  {
    kind: "command",
    name: "clowngifs",
    description: "🤡 ارسال گیف‌های دلقک گروه",
    scopes: GROUP_SCOPES,
    handler: (ctx) => sendClownMedia(ctx, "gif"),
  },
  {
    kind: "command",
    name: "clownstickers",
    description: "🤡 ارسال استیکرهای دلقک گروه",
    scopes: GROUP_SCOPES,
    handler: (ctx) => sendClownMedia(ctx, "sticker"),
  },
];
