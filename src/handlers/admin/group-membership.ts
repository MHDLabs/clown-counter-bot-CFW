import type { UpdateHandler } from "@/handlers";
import type { BotContext } from "@/lib/bot";

import { schema } from "@/db";
import {
  isGroupAllowlisted,
  isGroupWhitelistEnabled,
  sendGroupWhitelistDisabledNotice,
} from "@/lib/bot/group-whitelist";

function membershipStatus(member: { status: string; is_member?: boolean }): "active" | "kicked" | "left" {
  if (member.status === "creator" || member.status === "administrator" || member.status === "member") {
    return "active";
  }
  if (member.status === "restricted") return member.is_member ? "active" : "left";
  return member.status === "kicked" ? "kicked" : "left";
}

async function notifyIfNotAllowlisted(ctx: BotContext, groupId: string): Promise<void> {
  try {
    if (!(await isGroupWhitelistEnabled(ctx))) return;
    if (await isGroupAllowlisted(ctx, groupId)) return;
    await sendGroupWhitelistDisabledNotice(ctx, groupId);
  } catch {
    console.warn("Could not check whitelist after a group membership update.");
  }
}

export const groupMembershipHandler: UpdateHandler = {
  kind: "update",
  update: "my_chat_member",
  handler: async (ctx) => {
    const update = ctx.myChatMember;
    if (!update || (update.chat.type !== "group" && update.chat.type !== "supergroup")) return;

    const name = update.chat.title;
    const botMemberStatus = membershipStatus(update.new_chat_member);
    const groupId = String(update.chat.id);

    await ctx.db
      .insert(schema.groups)
      .values({ id: groupId, name, botMemberStatus })
      .onConflictDoUpdate({
        target: schema.groups.id,
        set: { name, botMemberStatus },
      });

    // If the bot is added while whitelist mode is active, notify the group once.
    if (botMemberStatus === "active") {
      await notifyIfNotAllowlisted(ctx, groupId);
    }
  },
};
