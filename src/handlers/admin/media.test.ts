import { describe, expect, it, vi } from "vitest";

import type { BotContext } from "@/lib/bot";

import { mediaHandlers } from "./media";

describe("admin media configuration", () => {
  it("stores the complete Telegram file_id and drops legacy parser IDs", async () => {
    const fileId = "AgACAgQAAxkBAAIBY2VydGlmaWVkLWZpbGUtaWQ";
    const onConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
    const values = vi.fn().mockReturnValue({ onConflictDoUpdate });
    const insert = vi.fn().mockReturnValue({ values });
    const ctx = {
      msg: {
        chat: { id: -100123456789, title: "Test group" },
        reply_to_message: { animation: { file_id: fileId } },
      },
      chat: { id: -100123456789, type: "supergroup" },
      from: { id: 42 },
      botAdminIds: new Set(["42"]),
      db: {
        query: {
          groups: {
            findFirst: vi.fn().mockResolvedValue({ gifIds: ["9007199254740995"] }),
          },
        },
        insert,
      },
      replyTo: vi.fn().mockResolvedValue(undefined),
      t: (key: string) => key,
    } as unknown as BotContext;
    const handler = mediaHandlers.find((item) => item.name === "setgif");
    if (!handler) throw new Error("setgif handler is missing");

    await handler.handler(ctx);

    expect(values).toHaveBeenCalledWith({
      id: "-100123456789",
      name: "Test group",
      gifIds: [fileId],
    });
    expect(ctx.replyTo).toHaveBeenCalledWith(ctx.msg, "cmd_setgif_done", { count: 1, max: 3 });
  });
});
