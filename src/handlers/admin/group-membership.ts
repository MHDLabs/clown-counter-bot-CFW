import type { UpdateHandler } from "@/handlers";

import { schema } from "@/db";

function membershipStatus(member: { status: string; is_member?: boolean }): "active" | "kicked" | "left" {
  if (member.status === "creator" || member.status === "administrator" || member.status === "member") {
    return "active";
  }
  if (member.status === "restricted") return member.is_member ? "active" : "left";
  return member.status === "kicked" ? "kicked" : "left";
}

export const groupMembershipHandler: UpdateHandler = {
  kind: "update",
  update: "my_chat_member",
  handler: async (ctx) => {
    const update = ctx.myChatMember;
    if (!update || (update.chat.type !== "group" && update.chat.type !== "supergroup")) return;

    const name = update.chat.title;
    const botMemberStatus = membershipStatus(update.new_chat_member);

    await ctx.db
      .insert(schema.groups)
      .values({ id: String(update.chat.id), name, botMemberStatus })
      .onConflictDoUpdate({
        target: schema.groups.id,
        set: { name, botMemberStatus },
      });
  },
};
