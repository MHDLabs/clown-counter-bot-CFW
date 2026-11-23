import { describe, expect, it, vi } from "vitest";

import type { BotContext } from "@/lib/bot";

import { respondToClownCooldown } from "./clown";

const groupId = -100123456789;
const voterId = 123456;
const expiresAt = Date.now() + 5 * 60_000;

function createContext(options: { targetStatus?: string; botCanRestrict?: boolean; groupType?: string } = {}) {
  const restrictChatMember = vi.fn().mockResolvedValue(true);
  const richReply = vi.fn().mockResolvedValue(undefined);
  const getChatMember = vi.fn(async (_chatId: number, userId: number) => {
    if (userId === voterId) return { status: options.targetStatus ?? "member" };
    return {
      status: options.botCanRestrict === false ? "member" : "administrator",
      can_restrict_members: options.botCanRestrict !== false,
    };
  });
  const ctx = {
    meId: 999,
    t: (key: string) => key,
    richReply,
    api: { getChatMember, restrictChatMember },
  } as unknown as BotContext;
  const data = {
    messageId: 44,
    group: { id: groupId, name: "Test group", type: options.groupType ?? "supergroup" },
    voter: { id: voterId, is_bot: false, first_name: "Persistent", name: "Persistent" },
    clown: { id: 789, is_bot: false, first_name: "Target", name: "Target" },
  };

  return { ctx, data, getChatMember, restrictChatMember, richReply };
}

describe("clown cooldown escalation", () => {
  it.each(["creator", "administrator"])("uses the fixed upstream cooldown text for a group %s", async (targetStatus) => {
    const { ctx, data, restrictChatMember, richReply } = createContext({ targetStatus });

    await respondToClownCooldown(ctx, data, expiresAt);

    expect(restrictChatMember).not.toHaveBeenCalled();
    expect(richReply.mock.calls[0]?.[0]).toBe("cmd_clown_wait");
  });

  it("does not attempt a mute if the bot lacks restrict_members permission", async () => {
    const { ctx, data, restrictChatMember, richReply } = createContext({ botCanRestrict: false });

    await respondToClownCooldown(ctx, data, expiresAt);

    expect(restrictChatMember).not.toHaveBeenCalled();
    expect(richReply.mock.calls[0]?.[0]).toBe("cmd_clown_wait");
  });

  it("mutes a regular supergroup member only until the voting cooldown expires", async () => {
    const { ctx, data, restrictChatMember, richReply } = createContext();

    await respondToClownCooldown(ctx, data, expiresAt);

    expect(restrictChatMember).toHaveBeenCalledExactlyOnceWith(
      groupId,
      voterId,
      expect.objectContaining({ can_send_messages: false, can_send_other_messages: false }),
      expect.objectContaining({ until_date: Math.floor(expiresAt / 1000), use_independent_chat_permissions: true }),
    );
    expect(richReply.mock.calls[0]?.[0]).toBe("cmd_clown_wait");
  });

  it("does not set a timed restriction in a basic group", async () => {
    const { ctx, data, getChatMember, restrictChatMember, richReply } = createContext({ groupType: "group" });

    await respondToClownCooldown(ctx, data, expiresAt);

    expect(getChatMember).toHaveBeenCalledExactlyOnceWith(groupId, voterId);
    expect(restrictChatMember).not.toHaveBeenCalled();
    expect(richReply.mock.calls[0]?.[0]).toBe("cmd_clown_wait");
  });

  it("does not apply restrictions when the remaining cooldown is below Telegram's minimum window", async () => {
    const { ctx, data, getChatMember, restrictChatMember, richReply } = createContext();

    await respondToClownCooldown(ctx, data, Date.now() + 10_000);

    expect(getChatMember).toHaveBeenCalledExactlyOnceWith(groupId, voterId);
    expect(restrictChatMember).not.toHaveBeenCalled();
    expect(richReply.mock.calls[0]?.[0]).toBe("cmd_clown_wait");
  });

  it("contains Telegram permission/API failures and still uses the fixed upstream cooldown text", async () => {
    const { ctx, data, restrictChatMember, richReply } = createContext();
    restrictChatMember.mockRejectedValue(new Error("not enough rights"));

    await expect(respondToClownCooldown(ctx, data, expiresAt)).resolves.toBeUndefined();

    expect(richReply.mock.calls[0]?.[0]).toBe("cmd_clown_wait");
  });
});
