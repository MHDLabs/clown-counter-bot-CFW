import type { BotCommandScope } from "grammy/types";

import type { CommandHandler } from "@/handlers";
import type { BotContext } from "@/lib/bot";

import { getSendableMediaIds } from "@/lib/file-id/storage";

type ClownMediaKind = "gif" | "sticker";

const GROUP_SCOPES: BotCommandScope[] = [{ type: "all_group_chats" }, { type: "all_chat_administrators" }];

async function sendClownMedia(ctx: BotContext, kind: ClownMediaKind) {
  const message = ctx.msg;
  if (!message || !ctx.chat) return;
  const chatId = ctx.chat.id;

  const group = await ctx.db.query.groups.findFirst({
    where: (fields, operators) => operators.eq(fields.id, String(message.chat.id)),
  });
  const storedIds: string[] = kind === "gif" ? (group?.gifIds ?? []) : (group?.stickerIds ?? []);
  const mediaIds = getSendableMediaIds(storedIds);
  const legacyCount = storedIds.length - mediaIds.length;

  if (mediaIds.length === 0) {
    const key = legacyCount > 0 ? "cmd_clown_media_legacy" : `cmd_clown_${kind}s_empty`;
    return await ctx.replyTo(message, ctx.t(key));
  }

  const results = await Promise.allSettled(
    mediaIds.map(async (mediaId) => {
      if (kind === "gif") {
        await ctx.api.sendAnimation(chatId, mediaId);
      } else {
        await ctx.api.sendSticker(chatId, mediaId);
      }
    }),
  );
  const failedCount = results.filter((result) => result.status === "rejected").length;

  if (failedCount > 0) {
    // A stale or revoked Telegram file_id must not turn the webhook update into an HTTP 500.
    console.error(`Failed to send ${failedCount} configured clown ${kind} media item(s).`);
    return await ctx.replyTo(message, ctx.t("cmd_clown_media_send_failed"));
  }

  if (legacyCount > 0) {
    return await ctx.replyTo(message, ctx.t("cmd_clown_media_legacy"));
  }
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
