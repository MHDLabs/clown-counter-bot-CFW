import type { BotCommandScope } from "grammy/types";

import type { CommandHandler } from "@/handlers";

const scopes: BotCommandScope[] = [
  { type: "all_private_chats" },
  { type: "all_group_chats" },
  { type: "all_chat_administrators" },
];

export const helpHandler: CommandHandler = {
  kind: "command",
  name: "help",
  description: "📖 Bot usage guide",
  scopes,
  handler: async (ctx) => await ctx.replyTo(ctx.msg, ctx.t("cmd_help")),
};
