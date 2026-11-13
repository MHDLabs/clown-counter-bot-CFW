import { describe, expect, it, vi } from "vitest";

import type { BotContext } from "..";

import { isAdmin } from "./is-admin";

describe("isAdmin", () => {
  it("rejects contexts without a chat", async () => {
    await expect(isAdmin({} as BotContext)).resolves.toBe(false);
  });

  it("accepts anonymous group administrators", async () => {
    const getAuthor = vi.fn();

    await expect(
      isAdmin({ chat: { id: -100 }, senderChat: { id: -100 }, getAuthor } as unknown as BotContext),
    ).resolves.toBe(true);
    expect(getAuthor).not.toHaveBeenCalled();
  });

  it.each(["administrator", "creator"] as const)("accepts %s members", async (status) => {
    const getAuthor = vi.fn(async () => ({ status }));
    const ctx = { chat: { id: -100 }, getAuthor } as unknown as BotContext;

    await expect(isAdmin(ctx)).resolves.toBe(true);
  });

  it("rejects regular members", async () => {
    const ctx = { chat: { id: -100 }, getAuthor: vi.fn(async () => ({ status: "member" })) } as unknown as BotContext;

    await expect(isAdmin(ctx)).resolves.toBe(false);
  });

  it("fails closed when Telegram cannot verify the member", async () => {
    const ctx = {
      chat: { id: -100 },
      getAuthor: vi.fn(async () => {
        throw new Error("not enough rights");
      }),
    } as unknown as BotContext;

    await expect(isAdmin(ctx)).resolves.toBe(false);
  });
});
