import { describe, expect, it } from "vitest";

import { translate } from "@/lib/bot/plugins/i18n";

import type { Env } from "./index";

import worker from "./index";

const env = { BOT_TOKEN: "", DB: {} as Env["DB"] };

describe("Worker HTTP entry point", () => {
  it("returns a public health response", async () => {
    const response = await worker.fetch(new Request("https://bot.test/health"), env);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  it("rejects unknown paths", async () => {
    const response = await worker.fetch(new Request("https://bot.test/"), env);

    expect(response.status).toBe(404);
  });

  it("does not process a webhook without a configured token", async () => {
    const response = await worker.fetch(new Request("https://bot.test/telegram", { method: "POST" }), env);

    expect(response.status).toBe(503);
  });

  it("rejects unauthorized webhook requests before accessing D1", async () => {
    const response = await worker.fetch(
      new Request("https://bot.test/telegram", {
        method: "POST",
        headers: { "X-Telegram-Bot-Api-Secret-Token": "not-the-derived-secret" },
        body: "{}",
      }),
      { ...env, BOT_TOKEN: "123456:valid_token" },
    );

    expect(response.status).toBe(401);
  });
});

describe("Fluent localization", () => {
  it("loads the Persian and English catalogs with working variables", async () => {
    expect(translate("en", "cmd_clown_wait", { waitMin: 3 })).toContain("3");
    expect(translate("fa", "cmd_clown_wait", { waitMin: 3 })).toContain("۳");
    expect(translate("en", "cmd_source")).toContain("github.com/MHDLabs/clown-counter-bot-CFW");
    expect(translate("en", "cmd_stats_group", { clowns: "- Test", reset: "" })).toContain("\n");
  });
});
