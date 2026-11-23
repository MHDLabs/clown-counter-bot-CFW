import { InlineKeyboard } from "grammy";

import type { CommandHandler } from "@/handlers";

import { CREATOR, getOwnerTelegramId } from "@/lib/creator";

export const sourceHandler: CommandHandler = {
  kind: "command",
  name: "source",
  description: "🪄 سورس‌کد ربات",
  scopes: [{ type: "all_private_chats" }],
  handler: async (ctx) => {
    const keyboard = new InlineKeyboard()
      .url(ctx.t("cmd_source_repository"), CREATOR.repositoryUrl)
      .url(ctx.t("cmd_creator_channel"), CREATOR.channelUrl);

    return await ctx.richReply(
      ctx.t("cmd_source", {
        creator: CREATOR.username,
        owner_id: getOwnerTelegramId(ctx.botAdminIds),
        channel: CREATOR.channel,
        repository: CREATOR.repositoryUrl,
      }),
      {
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
      },
    );
  },
};
