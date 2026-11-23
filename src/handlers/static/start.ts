import type { CommandHandler } from "@/handlers";

import { CREATOR, getOwnerTelegramId } from "@/lib/creator";

export const startHandler: CommandHandler = {
  kind: "command",
  name: "start",
  description: "🎉 شروع دلقک بازی",
  scopes: [{ type: "all_private_chats" }],
  handler: async (ctx) => {
    const credits = ctx.t("help_public_credits", {
      creator: CREATOR.username,
      owner_id: getOwnerTelegramId(ctx.botAdminIds),
      channel: CREATOR.channel,
      repository: CREATOR.repositoryUrl,
    });

    return await ctx.replyTo(ctx.msg, `${ctx.t("cmd_start")}\n\n${credits}`);
  },
};
