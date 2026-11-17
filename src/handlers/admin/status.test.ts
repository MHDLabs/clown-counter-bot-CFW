import { describe, expect, it, vi } from "vitest";

import type { AppDb } from "@/db";
import type { BotContext } from "@/lib/bot";

import { CREATOR } from "@/lib/creator";

import { adminStatusCallbacks, adminStatusHandler, adminStatusHyphenAlias } from "./status";

function createContext(options: {
  userId: number;
  chatType?: "group" | "private" | "supergroup";
  selectResults?: unknown[][];
  groupRow?: { id: string; name: string | null; botMemberStatus: "active" | "kicked" | "left" | null };
}) {
  let selectIndex = 0;
  const results = options.selectResults ?? [];
  const select = vi.fn(() => {
    const result = results[selectIndex] ?? [];
    selectIndex += 1;
    const query: Record<string, unknown> = {};

    for (const method of ["from", "where", "innerJoin", "groupBy", "having", "orderBy", "limit", "offset"]) {
      // eslint-disable-next-line vitest/prefer-spy-on -- Drizzle query methods are generated dynamically in this mock.
      query[method] = vi.fn(() => query);
    }

    // eslint-disable-next-line vitest/prefer-spy-on -- The fake query has no Drizzle prototype to spy on.
    query["as"] = vi.fn((alias: string) => ({ alias }));
    query["then"] = (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject);
    return query;
  });
  const sendRichMessage = vi.fn().mockResolvedValue({});
  const editMessageText = vi.fn().mockResolvedValue(true);
  const answerCallbackQuery = vi.fn().mockResolvedValue(true);
  const groupFindFirst = vi.fn().mockResolvedValue(options.groupRow);
  const db = { select, query: { groups: { findFirst: groupFindFirst } } } as unknown as AppDb;
  const ctx = {
    chat: { id: options.userId, type: options.chatType ?? "private" },
    from: { id: options.userId, is_bot: false, first_name: "Mahdi", username: "Mahdi_CS30" },
    botAdminIds: new Set(["424242"]),
    db,
    locale: "en",
    msg: { message_id: 1, chat: { id: options.userId, type: options.chatType ?? "private" } },
    api: { sendRichMessage, editMessageText },
    answerCallbackQuery,
    replyTo: vi.fn().mockResolvedValue({}),
    t: (key: string, variables?: Record<string, unknown>) => {
      if (key === "admin_creator") return `creator:${String(variables?.["creator"] ?? "")}`;
      return variables ? `${key}:${Object.values(variables).join(" ")}` : key;
    },
  } as unknown as BotContext;
  return { ctx, select, sendRichMessage, editMessageText, answerCallbackQuery, groupFindFirst };
}

describe("owner status panel access", () => {
  it("does not run for an unlisted numeric user even when the username matches the creator handle", async () => {
    const { ctx, select, sendRichMessage } = createContext({ userId: 99 });

    await adminStatusHandler.handler(ctx);

    expect(select).not.toHaveBeenCalled();
    expect(sendRichMessage).not.toHaveBeenCalled();
  });

  it("does not run in a group even for a configured owner", async () => {
    const { ctx, select, sendRichMessage } = createContext({ userId: 424242, chatType: "supergroup" });

    await adminStatusHandler.handler(ctx);

    expect(select).not.toHaveBeenCalled();
    expect(sendRichMessage).not.toHaveBeenCalled();
  });

  it("sends the summary as a structured private Rich Message to a configured owner", async () => {
    const { ctx, sendRichMessage } = createContext({
      userId: 424242,
      selectResults: [[{ total: 4 }], [{ total: 3 }], [], [{ total: 7 }], [], [{ total: 0 }]],
    });

    await adminStatusHandler.handler(ctx);

    // eslint-disable-next-line vitest/prefer-called-with -- Payload and options are asserted separately.
    expect(sendRichMessage).toHaveBeenCalledOnce();

    const [, richMessage, options] = sendRichMessage.mock.calls[0] as [
      number,
      { blocks: { type: string; text?: string }[]; is_rtl: boolean },
      Record<string, unknown>,
    ];

    expect(richMessage.blocks.map((block) => block.type)).toContain("heading");
    expect(richMessage.blocks.map((block) => block.type)).toContain("list");
    expect(richMessage.blocks.map((block) => block.type)).toContain("divider");
    expect(richMessage.blocks.map((block) => block.text).join(" ")).toContain(CREATOR.username);
    expect(richMessage.is_rtl).toBe(false);
    expect(options).toHaveProperty("reply_markup");
  });

  it("supports the requested hyphenated alias in the owner's private chat", async () => {
    const { ctx, sendRichMessage } = createContext({
      userId: 424242,
      selectResults: [[{ total: 1 }], [{ total: 1 }], [], [{ total: 1 }], [], [{ total: 0 }]],
    });
    Object.assign(ctx, { msg: { text: "/admin-status", message_id: 2, chat: { id: 424242, type: "private" } } });
    const next = vi.fn().mockResolvedValue(undefined);

    await adminStatusHyphenAlias.filter?.(ctx, next);
    await adminStatusHyphenAlias.handler(ctx);

    expect(next).toHaveBeenCalledExactlyOnceWith();
    // eslint-disable-next-line vitest/prefer-called-with -- Payload and options are asserted separately.
    expect(sendRichMessage).toHaveBeenCalledOnce();
  });

  it("paginates the owner-only group list and keeps group IDs out of visible text", async () => {
    const groupRows = Array.from({ length: 8 }, (_, index) => ({
      id: `-100${index + 1}`,
      name: `Group ${index + 1}`,
      botMemberStatus: "active" as const,
    }));
    const { ctx, editMessageText } = createContext({
      userId: 424242,
      selectResults: [[{ total: 10 }], groupRows, []],
    });
    Object.assign(ctx, {
      callbackQuery: {
        id: "groups",
        from: { id: 424242, is_bot: false, first_name: "Owner" },
        data: "admin:groups:0",
        message: { message_id: 5, chat: { id: 424242, type: "private" } },
      },
    });

    await adminStatusCallbacks[0]?.handler(ctx);

    // eslint-disable-next-line vitest/prefer-called-with -- Rich text and keyboard are asserted separately.
    expect(editMessageText).toHaveBeenCalledOnce();

    const [, , richMessage, options] = editMessageText.mock.calls[0] as [
      number,
      number,
      { blocks: { type: string; text?: string }[] },
      Record<string, unknown>,
    ];
    const visibleText = JSON.stringify(richMessage);
    const keyboard = options["reply_markup"] as {
      inline_keyboard: { callback_data?: string }[][];
    };

    expect(visibleText).toContain("Group 1");
    expect(visibleText).not.toContain("-1001");
    expect(JSON.stringify(keyboard)).toContain("admin:groups:1");
  });

  it("shows a paginated group leaderboard with names and scores only", async () => {
    const clownRows = Array.from({ length: 8 }, (_, index) => ({
      clownId: `90000${index + 1}`,
      name: `Member ${index + 1}`,
      score: 10 - index,
    }));
    const { ctx, editMessageText } = createContext({
      userId: 424242,
      groupRow: { id: "-100123", name: "Study group", botMemberStatus: "active" },
      selectResults: [[], [], [{ total: 9 }], clownRows],
    });
    Object.assign(ctx, {
      callbackQuery: {
        id: "group-detail",
        from: { id: 424242, is_bot: false, first_name: "Owner" },
        data: "admin:group:-100123:0",
        message: { message_id: 5, chat: { id: 424242, type: "private" } },
      },
    });

    await adminStatusCallbacks[0]?.handler(ctx);

    // eslint-disable-next-line vitest/prefer-called-with -- Rich text and keyboard are asserted separately.
    expect(editMessageText).toHaveBeenCalledOnce();

    const [, , richMessage, options] = editMessageText.mock.calls[0] as [
      number,
      number,
      { blocks: { type: string; text?: string }[] },
      Record<string, unknown>,
    ];
    const visibleText = JSON.stringify(richMessage);
    const keyboard = options["reply_markup"] as {
      inline_keyboard: { callback_data?: string }[][];
    };

    expect(visibleText).toContain("Study group");
    expect(visibleText).toContain("Member 1");
    expect(visibleText).not.toContain("-100123");
    expect(visibleText).not.toContain("900001");
    expect(JSON.stringify(keyboard)).toContain("admin:group:-100123:1");
  });

  it("answers but never renders a panel callback for a non-owner", async () => {
    const { ctx, select, editMessageText, answerCallbackQuery } = createContext({ userId: 99 });
    Object.assign(ctx, {
      callbackQuery: {
        id: "callback",
        from: { id: 99, is_bot: false, first_name: "Mahdi", username: "Mahdi_CS30" },
        data: "admin:home",
        message: { message_id: 5, chat: { id: 99, type: "private" } },
      },
    });

    await adminStatusCallbacks[0]?.handler(ctx);

    // eslint-disable-next-line vitest/prefer-called-with -- Authorization test only needs the callback count.
    expect(answerCallbackQuery).toHaveBeenCalledOnce();
    expect(select).not.toHaveBeenCalled();
    expect(editMessageText).not.toHaveBeenCalled();
  });

  it("silently consumes the requested hyphenated alias for non-owners", async () => {
    const { ctx, select } = createContext({ userId: 99 });
    Object.assign(ctx, { msg: { text: "/admin-status", message_id: 2, chat: { id: 99, type: "private" } } });
    const next = vi.fn().mockResolvedValue(undefined);

    await adminStatusHyphenAlias.filter?.(ctx, next);
    await adminStatusHyphenAlias.handler(ctx);

    expect(next).toHaveBeenCalledExactlyOnceWith();
    expect(select).not.toHaveBeenCalled();
  });
});
