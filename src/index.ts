/// <reference types="@cloudflare/workers-types" />
import { webhookCallback } from "grammy";

import { createDb } from "@/db";
import { handlers } from "@/handlers";
import { Bot, i18nMiddleware, replyToMiddleware } from "@/lib/bot";

export interface Env {
  BOT_TOKEN: string;
  DB: D1Database;
}

async function webhookSecret(token: string): Promise<string> {
  const bytes = new TextEncoder().encode(`clown-counter-webhook:${token}`);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)].map((v) => v.toString(16).padStart(2, "0")).join("");
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/health") return Response.json({ ok: true });
    if (url.pathname !== "/telegram" || request.method !== "POST") return new Response("Not found", { status: 404 });
    const token = env.BOT_TOKEN;
    if (!token || !/^\d{6,}:[\w-]+$/.test(token)) return new Response("Service unavailable", { status: 503 });
    const secret = await webhookSecret(token);
    if (request.headers.get("X-Telegram-Bot-Api-Secret-Token") !== secret)
      return new Response("Unauthorized", { status: 401 });

    try {
      const database = createDb(env.DB);
      const botId = Number(token.slice(0, token.indexOf(":")));
      const bot = new Bot(token, { botId, database, plugins: [i18nMiddleware(), replyToMiddleware] });
      bot.registerHandlers(...handlers);
      return await webhookCallback(bot, "cloudflare-mod", { secretToken: secret })(request);
    } catch (error) {
      // Log only the error class; never expose request bodies, credentials, headers, or upstream error objects.
      console.error(`Webhook processing failed (${error instanceof Error ? error.name : "UnknownError"})`);
      return new Response("Webhook processing failed", { status: 500 });
    }
  },
};
