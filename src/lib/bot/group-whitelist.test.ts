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
  migrationUpdate?: boolean;
  fail?: boolean;
}) {
  const selectedTables: unknown[] = [];
  const noticeValues = new Map<string, string>();
  let settingsReads = 0;

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

          if (table === schema.botSettings) {
            const read = settingsReads++ % 3;
            if (read === 0) return options.enabled ? [{ value: "enabled" }] : [{ value: "disabled" }];
            if (read === 1) return [{ value: "100" }];
            const value = noticeValues.get("group_whitelist_notice:-100123");
            return value ? [{ value }] : [];
          }

          if (table === schema.allowedGroups) return options.allowed ? [{ groupId: "-100123" }] : [];
          return [];
        },
      };
      return query;
    },
    insert: (table: unknown) => {
      let row: Record<string, string> = {};
      const query = {
        values: (value: Record<string, string>) => {
          row = value;
          return query;
        },
        onConflictDoUpdate: async () => row,
        onConflictDoNothing: () => query,
        returning: async () => {
          if (table !== schema.botSettings) return [];
          if (noticeValues.has(row.key ?? "")) return [];
          noticeValues.set(row.key ?? "", row.value ?? "");
          return [{ key: row.key }];
        },
      };
      return query;
    },
  } as unknown as AppDb;

  const sendMessage = vi.fn().mockResolvedValue({});
  const ctx = {
    chat: { id: -100123, type: options.chatType ?? "supergroup", title: "Test group" },
    update: options.membershipUpdate ? { my_chat_member: {} } : { message: {} },
    msg: options.migrationUpdate ? { migrate_to_chat_id: -100999 } : undefined,
    db,
    api: { sendMessage },
    botAdminIds: new Set(["424242"]),
    locale: "fa",
    t: (key: string) => key,
  } as unknown as BotContext;

  return { ctx, selectedTables, sendMessage };
}

describe("group allowlist middleware", () => {
  it("preserves current behavior while whitelist mode is disabled", async () => {
    const { ctx, selectedTables } = createContext({ enabled: false });
    const next = vi.fn().mockResolvedValue(undefined);

    await groupWhitelistMiddleware(ctx, next);

    expect(next).toHaveBeenCalledExactlyOnceWith();
    expect(selectedTables).toEqual([schema.botSettings]);
  });

  it("sends one disabled notice and stops updates in an unlisted group", async () => {
    const { ctx, sendMessage } = createContext({ enabled: true, allowed: false });
    const next = vi.fn().mockResolvedValue(undefined);

    await groupWhitelistMiddleware(ctx, next);

    expect(next).not.toHaveBeenCalled();
    expect(sendMessage).toHaveBeenCalledExactlyOnceWith(
      -100123,
      "whitelist_group_disabled",
      expect.objectContaining({ reply_markup: expect.any(Object) }),
    );
  });

  it("does not repeat the notice for later updates in the same whitelist generation", async () => {
    const { ctx, sendMessage } = createContext({ enabled: true, allowed: false });
    const next = vi.fn().mockResolvedValue(undefined);

    await groupWhitelistMiddleware(ctx, next);
    await groupWhitelistMiddleware(ctx, next);

    expect(sendMessage).toHaveBeenCalledOnce();
    expect(next).not.toHaveBeenCalled();
  });

  it("passes a listed group when whitelist mode is enabled", async () => {
    const { ctx, sendMessage } = createContext({ enabled: true, allowed: true });
    const next = vi.fn().mockResolvedValue(undefined);

    await groupWhitelistMiddleware(ctx, next);

    expect(next).toHaveBeenCalledExactlyOnceWith();
    expect(sendMessage).not.toHaveBeenCalled();
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

  it("allows migration service messages through so persisted group data can be moved", async () => {
    const { ctx, selectedTables } = createContext({ enabled: true, migrationUpdate: true });
    const next = vi.fn().mockResolvedValue(undefined);

    await groupWhitelistMiddleware(ctx, next);

    expect(next).toHaveBeenCalledExactlyOnceWith();
    expect(selectedTables).toHaveLength(0);
  });

  it("fails closed if D1 cannot verify allowlist access", async () => {
    const { ctx, sendMessage } = createContext({ enabled: true, fail: true });
    const next = vi.fn().mockResolvedValue(undefined);

    await expect(groupWhitelistMiddleware(ctx, next)).resolves.toBeUndefined();
    expect(next).not.toHaveBeenCalled();
    expect(sendMessage).not.toHaveBeenCalled();
  });
});
