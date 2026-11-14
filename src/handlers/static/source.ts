import type { CommandHandler } from "@/handlers";

export const sourceHandler: CommandHandler = {
  kind: "command",
  name: "source",
  description: "🪄 سورس‌کد ربات",
  scopes: [{ type: "all_private_chats" }],
  handler: async (ctx) => {
    return await ctx.richReply(ctx.t("cmd_source"), {
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
