import { describe, expect, it, vi } from "vitest";

import type { AppDb } from "@/db";

import { schema } from "@/db";

import type { BotContext } from ".";

import { groupWhitelistMiddleware } from "./group-whitelist";

function createContext(options: {
  chatType?: "group" | "private" | "supergroup";
  enabled?: boolean;
  allowed?: boolean;
  membershipUpdate?: boolean;
  fail?: boolean;
}) {
  const selectedTables: unknown[] = [];
  const db = {
    select: () => {
      let table: unknown;
      const query = {
        from: (source: unknown) => {
          table = source;
          selectedTables.push(source);
          return query;
        },
        where: () => query,
        limit: async () => {
          if (options.fail) throw new Error("D1 unavailable");
          if (table === schema.botSettings) return options.enabled ? [{ value: "enabled" }] : [];
          if (table === schema.allowedGroups) return options.allowed ? [{ groupId: "-100123" }] : [];
          return [];
        },
      };
      return query;
    },
  } as unknown as AppDb;
  const ctx = {
    chat: { id: -100123, type: options.chatType ?? "supergroup" },
    update: options.membershipUpdate ? { my_chat_member: {} } : { message: {} },
    db,
  } as unknown as BotContext;
  return { ctx, selectedTables };
}

describe("group allowlist middleware", () => {
  it("preserves current behavior while whitelist mode is disabled", async () => {
    const { ctx, selectedTables } = createContext({ enabled: false });
    const next = vi.fn().mockResolvedValue(undefined);

    await groupWhitelistMiddleware(ctx, next);

    expect(next).toHaveBeenCalledExactlyOnceWith();
    expect(selectedTables).toEqual([schema.botSettings]);
  });

  it("silently stops an unlisted group before handlers run", async () => {
    const { ctx } = createContext({ enabled: true, allowed: false });
    const next = vi.fn().mockResolvedValue(undefined);

    await groupWhitelistMiddleware(ctx, next);

    expect(next).not.toHaveBeenCalled();
  });

  it("passes a listed group when whitelist mode is enabled", async () => {
    const { ctx } = createContext({ enabled: true, allowed: true });
    const next = vi.fn().mockResolvedValue(undefined);

    await groupWhitelistMiddleware(ctx, next);

    expect(next).toHaveBeenCalledExactlyOnceWith();
  });

  it("does not gate private chats", async () => {
    const { ctx, selectedTables } = createContext({ chatType: "private", enabled: true });
    const next = vi.fn().mockResolvedValue(undefined);

    await groupWhitelistMiddleware(ctx, next);

    expect(next).toHaveBeenCalledExactlyOnceWith();
    expect(selectedTables).toHaveLength(0);
  });

  it("records membership-change updates even when whitelist mode is enabled", async () => {
    const { ctx, selectedTables } = createContext({ enabled: true, membershipUpdate: true });
    const next = vi.fn().mockResolvedValue(undefined);

    await groupWhitelistMiddleware(ctx, next);

    expect(next).toHaveBeenCalledExactlyOnceWith();
    expect(selectedTables).toHaveLength(0);
  });

  it("fails closed if D1 cannot verify allowlist access", async () => {
    const { ctx } = createContext({ enabled: true, fail: true });
    const next = vi.fn().mockResolvedValue(undefined);

    await expect(groupWhitelistMiddleware(ctx, next)).resolves.toBeUndefined();
    expect(next).not.toHaveBeenCalled();
  });
});
