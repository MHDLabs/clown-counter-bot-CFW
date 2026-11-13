import type { BotContext } from "..";

/** `true` for group admins, including anonymous admins posting as the group itself. */
export async function isAdmin(ctx: BotContext): Promise<boolean> {
  if (!ctx.chat) return false;

  if (ctx.senderChat?.id === ctx.chat.id) {
    return true;
  }

  try {
    const author = await ctx.getAuthor();

    return ["administrator", "creator"].includes(author.status);
  } catch {
    // Telegram only guarantees getChatMember results when the bot is an admin.
    // Fail closed for admin-only operations, but do not turn a permission issue into a webhook 500.
    return false;
  }
}
