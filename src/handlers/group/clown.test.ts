import { describe, expect, it, vi } from "vitest";

import type { BotContext } from "@/lib/bot";

import { randomMessage, respondToClownCooldown } from "./clown";

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
  it("selects different localized response variants using randomness", () => {
    const t = vi.fn((key: string) => key);
    const ctx = { t } as unknown as BotContext;
    const random = vi.spyOn(Math, "random");
    random.mockReturnValueOnce(0).mockReturnValueOnce(0.99);

    const first = randomMessage(ctx, { key: "cmd_clown", variants: 4 });
    const second = randomMessage(ctx, { key: "cmd_clown", variants: 4 });

    expect(first).toBe("cmd_clown_1");
    expect(second).toBe("cmd_clown_4");

    random.mockRestore();
  });

  it.each([
    ["creator", "cmd_clown_timeout_owner_"],
    ["administrator", "cmd_clown_timeout_admin_"],
  ])("does not attempt to restrict a group %s", async (targetStatus, expectedKey) => {
    const { ctx, data, restrictChatMember, richReply } = createContext({ targetStatus });

    await respondToClownCooldown(ctx, data, expiresAt);

    expect(restrictChatMember).not.toHaveBeenCalled();
    expect(String(richReply.mock.calls[0]?.[0])).toContain(expectedKey);
  });

  it("does not attempt a mute if the bot lacks restrict_members permission", async () => {
    const { ctx, data, restrictChatMember, richReply } = createContext({ botCanRestrict: false });

    await respondToClownCooldown(ctx, data, expiresAt);

    expect(restrictChatMember).not.toHaveBeenCalled();
    expect(String(richReply.mock.calls[0]?.[0])).toContain("cmd_clown_timeout_no_access_");
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
    expect(String(richReply.mock.calls[0]?.[0])).toContain("cmd_clown_timeout_muted_");
  });

  it("does not set a timed restriction in a basic group", async () => {
    const { ctx, data, getChatMember, restrictChatMember, richReply } = createContext({ groupType: "group" });

    await respondToClownCooldown(ctx, data, expiresAt);

    expect(getChatMember).toHaveBeenCalledExactlyOnceWith(groupId, voterId);
    expect(restrictChatMember).not.toHaveBeenCalled();
    expect(String(richReply.mock.calls[0]?.[0])).toContain("cmd_clown_timeout_no_access_");
  });

  it("does not apply restrictions when the remaining cooldown is below Telegram's minimum window", async () => {
    const { ctx, data, getChatMember, restrictChatMember, richReply } = createContext();

    await respondToClownCooldown(ctx, data, Date.now() + 10_000);

    expect(getChatMember).toHaveBeenCalledExactlyOnceWith(groupId, voterId);
    expect(restrictChatMember).not.toHaveBeenCalled();
    expect(String(richReply.mock.calls[0]?.[0])).toContain("cmd_clown_wait_");
  });

  it("contains Telegram permission/API failures and gives the no-access response", async () => {
    const { ctx, data, restrictChatMember, richReply } = createContext();
    restrictChatMember.mockRejectedValue(new Error("not enough rights"));

    await expect(respondToClownCooldown(ctx, data, expiresAt)).resolves.toBeUndefined();

    expect(String(richReply.mock.calls[0]?.[0])).toContain("cmd_clown_timeout_no_access_");
  });
});
