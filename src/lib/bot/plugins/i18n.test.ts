import { describe, expect, it, vi } from "vitest";

import type { BotContext } from "..";

import { i18nMiddleware } from "./i18n";

describe("language preference fallback", () => {
  it("continues with Telegram language when D1 cannot read the saved preference", async () => {
    const ctx = {
      update: { update_id: 77 },
      from: { id: 123, language_code: "en" },
      db: {
        query: {
          userPreferences: {
            findFirst: vi.fn().mockRejectedValue(new Error("D1 unavailable")),
          },
        },
      },
    } as unknown as BotContext;
    const next = vi.fn().mockResolvedValue(undefined);

    await i18nMiddleware()(ctx, next);

    expect(ctx.locale).toBe("en");
    expect(ctx.t("cmd_start")).toContain("Welcome");
    expect(next).toHaveBeenCalledOnce();
  });

  it("uses Persian when Telegram does not advertise English", async () => {
    const ctx = {
      update: { update_id: 78 },
      from: { id: 123, language_code: "fa" },
      db: { query: { userPreferences: { findFirst: vi.fn().mockResolvedValue(undefined) } } },
    } as unknown as BotContext;

    await i18nMiddleware()(ctx, vi.fn().mockResolvedValue(undefined));
    expect(ctx.locale).toBe("fa");
  });
});
