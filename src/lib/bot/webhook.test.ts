import { webhookCallback } from "grammy";
import { describe, expect, it } from "vitest";

import type { AppDb } from "@/db";

import { handlers } from "@/handlers";
import { sourceHandler } from "@/handlers/static/source";
import { Bot, i18nMiddleware, replyToMiddleware } from "@/lib/bot";

function testDatabase(
  locale?: "en" | "fa",
  onLocaleSaved?: (locale: "en" | "fa") => void,
  options: {
    personalStats?: { score: number; received: number; removed: number };
    group?: { gifIds: string[] | null; stickerIds: string[] | null };
  } = {},
) {
  return {
    query: {
      userPreferences: { findFirst: async () => (locale ? { locale } : undefined) },
      groups: { findFirst: async () => options.group },
    },
    insert: () => ({
      values: (row: { locale: "en" | "fa" }) => ({
        onConflictDoUpdate: async () => onLocaleSaved?.(row.locale),
      }),
    }),
    select: () => ({
      from: () => ({
        where: async () => [options.personalStats ?? { score: 0, received: 0, removed: 0 }],
      }),
    }),
  } as unknown as AppDb;
}

const fakeBotInfo = {
  id: 123456,
  is_bot: true,
  first_name: "Test Bot",
  username: "test_counter_bot",
  can_join_groups: true,
  can_read_all_group_messages: false,
  supports_inline_queries: false,
  can_connect_to_business: false,
  has_main_web_app: false,
  has_topics_enabled: false,
  allows_users_to_create_topics: false,
  can_manage_bots: false,
  supports_join_request_queries: false,
};

describe("grammY Cloudflare webhook", () => {
  it.each([
    { command: "/clowngifs", method: "sendAnimation", ids: ["gif-one", "gif-two"], field: "gifIds" },
    { command: "/clownstickers", method: "sendSticker", ids: ["sticker-one", "sticker-two"], field: "stickerIds" },
  ] as const)("sends every configured clown $field item with $command", async ({ command, method, ids, field }) => {
    const media = { gifIds: null, stickerIds: null, [field]: ids };
    const bot = new Bot("123456:fake_token", {
      botId: fakeBotInfo.id,
      database: testDatabase("en", undefined, { group: media }),
      plugins: [i18nMiddleware(), replyToMiddleware],
    });
    bot.registerHandlers(...handlers);
    const calls: { method: string; payload: Record<string, unknown> }[] = [];
    bot.api.config.use(async (_previous, apiMethod, payload) => {
      calls.push({ method: apiMethod, payload });
      return { ok: true, result: apiMethod === "getMe" ? fakeBotInfo : true } as never;
    });
    const webhook = webhookCallback(bot, "cloudflare-mod", { secretToken: "test-webhook-secret" });
    const response = await webhook(
      new Request("https://bot.test/telegram", {
        method: "POST",
        headers: { "content-type": "application/json", "X-Telegram-Bot-Api-Secret-Token": "test-webhook-secret" },
        body: JSON.stringify({
          update_id: 20,
          message: {
            message_id: 20,
            from: { id: 10, is_bot: false, first_name: "Test", language_code: "en" },
            chat: { id: -100123, type: "supergroup", title: "Test group" },
            date: 1,
            text: command,
            entities: [{ offset: 0, length: command.length, type: "bot_command" }],
          },
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(
      calls
        .filter((call) => call.method === method)
        .map((call) => call.payload[field === "gifIds" ? "animation" : "sticker"]),
    ).toEqual(ids);
  });

  it("processes an authenticated /start update and replies in the user's language", async () => {
    const bot = new Bot("123456:fake_token", {
      botId: fakeBotInfo.id,
      database: testDatabase(),
      plugins: [i18nMiddleware(), replyToMiddleware],
    });
    bot.registerHandlers(...handlers);
    const calls: { method: string; payload: Record<string, unknown> }[] = [];
    bot.api.config.use(async (_previous, method, payload) => {
      calls.push({ method, payload });
      const result =
        method === "getMe"
          ? fakeBotInfo
          : method === "sendRichMessage"
            ? {
                message_id: 2,
                date: 1,
                chat: { id: 10, type: "private", first_name: "Test" },
                text: String((payload as unknown as Record<string, unknown>)["text"]),
              }
            : true;
      return { ok: true, result } as never;
    });

    const webhook = webhookCallback(bot, "cloudflare-mod", { secretToken: "test-webhook-secret" });
    const response = await webhook(
      new Request("https://bot.test/telegram", {
        method: "POST",
        headers: { "content-type": "application/json", "X-Telegram-Bot-Api-Secret-Token": "test-webhook-secret" },
        body: JSON.stringify({
          update_id: 2,
          message: {
            message_id: 2,
            from: { id: 10, is_bot: false, first_name: "Test", language_code: "en" },
            chat: { id: 10, type: "private", first_name: "Test" },
            date: 1,
            text: "/start",
            entities: [{ offset: 0, length: 6, type: "bot_command" }],
          },
        }),
      }),
    );

    expect(response.status).toBe(200);

    const sendRichMessage = calls.find((call) => call.method === "sendRichMessage");

    expect(JSON.stringify(sendRichMessage?.payload["rich_message"])).toContain("Welcome!");
  });

  it("processes an authenticated /source update with a mocked Telegram API", async () => {
    const bot = new Bot("123456:fake_token", {
      botId: fakeBotInfo.id,
      database: testDatabase(),
      plugins: [i18nMiddleware(), replyToMiddleware],
    });
    bot.registerHandlers(sourceHandler);
    const calls: { method: string; payload: Record<string, unknown> }[] = [];
    bot.api.config.use(async (_previous, method, payload) => {
      calls.push({ method, payload });
      const result =
        method === "getMe"
          ? fakeBotInfo
          : method === "sendRichMessage"
            ? {
                message_id: 2,
                date: 1,
                chat: { id: 10, type: "private", first_name: "Test" },
                text: String((payload as unknown as Record<string, unknown>)["text"]),
              }
            : true;
      return { ok: true, result } as never;
    });
    const webhook = webhookCallback(bot, "cloudflare-mod", { secretToken: "test-webhook-secret" });
    const response = await webhook(
      new Request("https://bot.test/telegram", {
        method: "POST",
        headers: { "content-type": "application/json", "X-Telegram-Bot-Api-Secret-Token": "test-webhook-secret" },
        body: JSON.stringify({
          update_id: 1,
          message: {
            message_id: 1,
            from: { id: 10, is_bot: false, first_name: "Test", language_code: "en" },
            chat: { id: 10, type: "private", first_name: "Test" },
            date: 1,
            text: "/source",
            entities: [{ offset: 0, length: 7, type: "bot_command" }],
          },
        }),
      }),
    );

    expect(response.status).toBe(200);

    const sendRichMessage = calls.find((call) => call.method === "sendRichMessage");

    expect(JSON.stringify(sendRichMessage?.payload["rich_message"])).toContain(
      "github.com/MHDLabs/clown-counter-bot-CFW",
    );
  });

  it("explains that group /clown requires replying to a target instead of staying silent", async () => {
    const bot = new Bot("123456:fake_token", {
      botId: fakeBotInfo.id,
      database: testDatabase(),
      plugins: [i18nMiddleware(), replyToMiddleware],
    });
    bot.registerHandlers(...handlers);
    const calls: { method: string; payload: Record<string, unknown> }[] = [];
    bot.api.config.use(async (_previous, method, payload) => {
      calls.push({ method, payload });
      const result = method === "getMe" ? fakeBotInfo : true;
      return { ok: true, result } as never;
    });
    const webhook = webhookCallback(bot, "cloudflare-mod", { secretToken: "test-webhook-secret" });
    const response = await webhook(
      new Request("https://bot.test/telegram", {
        method: "POST",
        headers: { "content-type": "application/json", "X-Telegram-Bot-Api-Secret-Token": "test-webhook-secret" },
        body: JSON.stringify({
          update_id: 4,
          message: {
            message_id: 4,
            from: { id: 10, is_bot: false, first_name: "Test", language_code: "en" },
            chat: { id: -100123, type: "supergroup", title: "Test group" },
            date: 1,
            text: "/clown",
            entities: [{ offset: 0, length: 6, type: "bot_command" }],
          },
        }),
      }),
    );

    expect(response.status).toBe(200);

    const sendRichMessage = calls.find((call) => call.method === "sendRichMessage");

    expect(JSON.stringify(sendRichMessage?.payload["rich_message"])).toContain("Reply to a group member's message");
    expect(sendRichMessage?.payload["reply_parameters"]).toMatchObject({
      message_id: 4,
      chat_id: -100123,
      allow_sending_without_reply: true,
    });
  });

  it("offers the language panel using the persisted preference", async () => {
    const bot = new Bot("123456:fake_token", {
      botId: fakeBotInfo.id,
      database: testDatabase("fa"),
      plugins: [i18nMiddleware(), replyToMiddleware],
    });
    bot.registerHandlers(...handlers);
    const calls: { method: string; payload: Record<string, unknown> }[] = [];
    bot.api.config.use(async (_previous, method, payload) => {
      calls.push({ method, payload });
      return { ok: true, result: method === "getMe" ? fakeBotInfo : true } as never;
    });
    const webhook = webhookCallback(bot, "cloudflare-mod", { secretToken: "test-webhook-secret" });
    const response = await webhook(
      new Request("https://bot.test/telegram", {
        method: "POST",
        headers: { "content-type": "application/json", "X-Telegram-Bot-Api-Secret-Token": "test-webhook-secret" },
        body: JSON.stringify({
          update_id: 3,
          message: {
            message_id: 3,
            from: { id: 10, is_bot: false, first_name: "Test", language_code: "en" },
            chat: { id: 10, type: "private", first_name: "Test" },
            date: 1,
            text: "/language",
            entities: [{ offset: 0, length: 9, type: "bot_command" }],
          },
        }),
      }),
    );

    expect(response.status).toBe(200);

    const sendRichMessage = calls.find((call) => call.method === "sendRichMessage");

    expect(JSON.stringify(sendRichMessage?.payload["rich_message"])).toContain("زبان پاسخ‌های ربات را انتخاب کنید");
    expect(sendRichMessage?.payload["reply_markup"]).toMatchObject({
      inline_keyboard: [[{ text: "\u200Fفارسی" }, { text: "\u200FEnglish" }]],
    });
  });

  it("persists an English selection made from the language inline keyboard", async () => {
    let persistedLocale: "en" | "fa" | undefined;
    const bot = new Bot("123456:fake_token", {
      botId: fakeBotInfo.id,
      database: testDatabase("fa", (locale) => (persistedLocale = locale)),
      plugins: [i18nMiddleware(), replyToMiddleware],
    });
    bot.registerHandlers(...handlers);
    const calls: string[] = [];
    bot.api.config.use(async (_previous, method) => {
      calls.push(method);
      return { ok: true, result: method === "getMe" ? fakeBotInfo : true } as never;
    });
    const webhook = webhookCallback(bot, "cloudflare-mod", { secretToken: "test-webhook-secret" });
    const response = await webhook(
      new Request("https://bot.test/telegram", {
        method: "POST",
        headers: { "content-type": "application/json", "X-Telegram-Bot-Api-Secret-Token": "test-webhook-secret" },
        body: JSON.stringify({
          update_id: 5,
          callback_query: {
            id: "callback-1",
            from: { id: 10, is_bot: false, first_name: "Test", language_code: "fa" },
            chat_instance: "chat-instance",
            data: "language:en",
            message: {
              message_id: 5,
              date: 1,
              chat: { id: 10, type: "private", first_name: "Test" },
              text: "زبان پاسخ‌های ربات را انتخاب کنید:",
            },
          },
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(persistedLocale).toBe("en");
    expect(calls).toContain("answerCallbackQuery");
    expect(calls).toContain("editMessageText");
  });

  it("allows the configured bot admin to change group settings without Telegram group-admin status", async () => {
    const bot = new Bot("123456:fake_token", {
      botId: fakeBotInfo.id,
      database: testDatabase(),
      botAdminIds: new Set(["42424242"]),
      plugins: [i18nMiddleware(), replyToMiddleware],
    });
    bot.registerHandlers(...handlers);
    const calls: { method: string; payload: Record<string, unknown> }[] = [];
    bot.api.config.use(async (_previous, method, payload) => {
      calls.push({ method, payload });
      return { ok: true, result: method === "getMe" ? fakeBotInfo : true } as never;
    });
    const webhook = webhookCallback(bot, "cloudflare-mod", { secretToken: "test-webhook-secret" });
    const response = await webhook(
      new Request("https://bot.test/telegram", {
        method: "POST",
        headers: { "content-type": "application/json", "X-Telegram-Bot-Api-Secret-Token": "test-webhook-secret" },
        body: JSON.stringify({
          update_id: 7,
          message: {
            message_id: 7,
            from: { id: 42424242, is_bot: false, first_name: "Bot Admin", language_code: "en" },
            chat: { id: -100123, type: "supergroup", title: "Test group" },
            date: 1,
            text: "/setcooldown 5",
            entities: [{ offset: 0, length: 12, type: "bot_command" }],
          },
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(calls.some((call) => call.method === "getChatMember")).toBe(false);

    const sendRichMessage = calls.find((call) => call.method === "sendRichMessage");

    const sentText = String(JSON.stringify(sendRichMessage?.payload["rich_message"])).replace(/[\u2066-\u2069]/g, "");

    expect(sentText).toContain("Voting cooldown set to 5");
  });

  it.each([
    ["en", "Clown Counter — help"],
    ["fa", "راهنمای ربات دلقک‌شمار"],
  ] as const)("serves the structured /help Rich Message in saved locale %s", async (locale, expected) => {
    const bot = new Bot("123456:fake_token", {
      botId: fakeBotInfo.id,
      database: testDatabase(locale),
      plugins: [i18nMiddleware(), replyToMiddleware],
    });
    bot.registerHandlers(...handlers);
    const calls: { method: string; payload: Record<string, unknown> }[] = [];
    bot.api.config.use(async (_previous, method, payload) => {
      calls.push({ method, payload });
      return { ok: true, result: method === "getMe" ? fakeBotInfo : true } as never;
    });
    const webhook = webhookCallback(bot, "cloudflare-mod", { secretToken: "test-webhook-secret" });
    const response = await webhook(
      new Request("https://bot.test/telegram", {
        method: "POST",
        headers: { "content-type": "application/json", "X-Telegram-Bot-Api-Secret-Token": "test-webhook-secret" },
        body: JSON.stringify({
          update_id: 6,
          message: {
            message_id: 6,
            from: { id: 10, is_bot: false, first_name: "Test", language_code: "en" },
            chat: { id: 10, type: "private", first_name: "Test" },
            date: 1,
            text: "/help",
            entities: [{ offset: 0, length: 5, type: "bot_command" }],
          },
        }),
      }),
    );

    expect(response.status).toBe(200);

    const sendRichMessage = calls.find((call) => call.method === "sendRichMessage");
    const richMessage = sendRichMessage?.payload["rich_message"] as
      { blocks: { type: string }[]; is_rtl: boolean } | undefined;
    const payloadText = JSON.stringify(richMessage);

    expect(richMessage?.is_rtl).toBe(locale === "fa");
    expect(richMessage?.blocks.map((block) => block.type)).toContain("heading");
    expect(richMessage?.blocks.map((block) => block.type)).toContain("list");
    expect(richMessage?.blocks.map((block) => block.type)).toContain("divider");
    expect(payloadText).toContain(expected);
    expect(payloadText).toContain("/mystats");
    expect(sendRichMessage?.payload["reply_parameters"]).toMatchObject({ message_id: 6 });
    expect(sendRichMessage?.payload["reply_markup"]).toMatchObject({
      inline_keyboard: expect.arrayContaining([
        expect.arrayContaining([expect.objectContaining({ callback_data: "help:personal" })]),
      ]),
    });
    expect(payloadText.includes("\u200f")).toBe(locale === "fa");
  });

  it("shows replied-to member personal stats in a Persian Rich Message", async () => {
    const bot = new Bot("123456:fake_token", {
      botId: fakeBotInfo.id,
      database: testDatabase("fa", undefined, { personalStats: { score: 5, received: 7, removed: 2 } }),
      plugins: [i18nMiddleware(), replyToMiddleware],
    });
    bot.registerHandlers(...handlers);
    const calls: { method: string; payload: Record<string, unknown> }[] = [];
    bot.api.config.use(async (_previous, method, payload) => {
      calls.push({ method, payload });
      return { ok: true, result: method === "getMe" ? fakeBotInfo : true } as never;
    });
    const webhook = webhookCallback(bot, "cloudflare-mod", { secretToken: "test-webhook-secret" });
    const response = await webhook(
      new Request("https://bot.test/telegram", {
        method: "POST",
        headers: { "content-type": "application/json", "X-Telegram-Bot-Api-Secret-Token": "test-webhook-secret" },
        body: JSON.stringify({
          update_id: 8,
          message: {
            message_id: 8,
            from: { id: 10, is_bot: false, first_name: "Test", language_code: "en" },
            chat: { id: -100123, type: "supergroup", title: "Test group" },
            date: 1,
            text: "/mystats",
            entities: [{ offset: 0, length: 8, type: "bot_command" }],
            reply_to_message: {
              message_id: 7,
              from: { id: 11, is_bot: false, first_name: "Rival", language_code: "fa" },
              chat: { id: -100123, type: "supergroup", title: "Test group" },
              date: 1,
              text: "Target message",
            },
          },
        }),
      }),
    );

    expect(response.status).toBe(200);

    const statsCall = calls.find((call) => call.method === "sendRichMessage");
    const richMessage = statsCall?.payload["rich_message"] as { blocks: unknown[]; is_rtl: boolean } | undefined;
    const payloadText = JSON.stringify(richMessage);

    expect(richMessage?.is_rtl).toBe(true);
    expect(payloadText).toContain("Rival");
    expect(payloadText).toContain("امتیاز خالص");
    expect(payloadText).toContain("امتیازهای اضافه‌شده");
    expect(payloadText).toContain("امتیازهای کم‌شده");
    expect(statsCall?.payload["reply_parameters"]).toMatchObject({ message_id: 8, chat_id: -100123 });
  });

  it("opens a help category by editing the existing message as a Persian Rich Message", async () => {
    const bot = new Bot("123456:fake_token", {
      botId: fakeBotInfo.id,
      database: testDatabase("fa"),
      plugins: [i18nMiddleware(), replyToMiddleware],
    });
    bot.registerHandlers(...handlers);
    const calls: { method: string; payload: Record<string, unknown> }[] = [];
    bot.api.config.use(async (_previous, method, payload) => {
      calls.push({ method, payload });
      return { ok: true, result: method === "getMe" ? fakeBotInfo : true } as never;
    });
    const webhook = webhookCallback(bot, "cloudflare-mod", { secretToken: "test-webhook-secret" });
    const response = await webhook(
      new Request("https://bot.test/telegram", {
        method: "POST",
        headers: { "content-type": "application/json", "X-Telegram-Bot-Api-Secret-Token": "test-webhook-secret" },
        body: JSON.stringify({
          update_id: 9,
          callback_query: {
            id: "help-category",
            from: { id: 10, is_bot: false, first_name: "Test", language_code: "en" },
            chat_instance: "test-instance",
            data: "help:personal",
            message: {
              message_id: 9,
              date: 1,
              chat: { id: -100123, type: "supergroup", title: "Test group" },
              text: "help panel",
            },
          },
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(calls.map((call) => call.method)).toContain("answerCallbackQuery");

    const editCall = calls.find((call) => call.method === "editMessageText");
    const richMessage = editCall?.payload["rich_message"] as { blocks: unknown[]; is_rtl: boolean } | undefined;
    const payloadText = JSON.stringify(richMessage);

    expect(richMessage?.is_rtl).toBe(true);
    expect(payloadText).toContain("/mystats");
    expect(payloadText).toContain("دیدن امتیاز");
    expect(editCall?.payload["reply_markup"]).toMatchObject({
      inline_keyboard: expect.arrayContaining([
        expect.arrayContaining([expect.objectContaining({ callback_data: "help:home" })]),
      ]),
    });
  });
});
