/// <reference types="@cloudflare/workers-types" />
import { GrammyError, webhookCallback } from "grammy";

import { createDb } from "@/db";
import { handlers } from "@/handlers";
import { Bot, i18nMiddleware, replyToMiddleware } from "@/lib/bot";

export interface Env {
  BOT_TOKEN: string;
  BOT_USERNAME?: string;
  BOT_ADMIN_IDS?: string;
  BOT_READ_ALL_GROUP_MESSAGES?: string;
  DB: D1Database;
}

function safeErrorSummary(error: unknown): string {
  if (error instanceof GrammyError) return "TelegramApiError";
  if (error instanceof Error) return error.name;
  return "UnknownError";
}

async function webhookSecret(token: string): Promise<string> {
  const bytes = new TextEncoder().encode(`clown-counter-webhook:${token}`);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)].map((v) => v.toString(16).padStart(2, "0")).join("");
}

function parseBotAdminIds(input: string | undefined): ReadonlySet<string> {
  return new Set(
    (input ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter((id) => /^\d+$/.test(id)),
  );
}

async function readinessResponse(env: Env): Promise<Response> {
  try {
    const result = await env.DB.prepare("SELECT 1 AS ok").first<{ ok: number }>();
    if (result?.ok === 1) return Response.json({ ok: true, database: true });
  } catch (error) {
    console.error(`Readiness check failed (${safeErrorSummary(error)}).`);
  }

  return Response.json({ ok: false, database: false }, { status: 503 });
}

async function handleWebhook(request: Request, env: Env): Promise<Response> {
  const token = env.BOT_TOKEN;
  if (!token || !/^\d{6,}:[\w-]+$/.test(token)) return new Response("Service unavailable", { status: 503 });

  const secret = await webhookSecret(token);
  if (request.headers.get("X-Telegram-Bot-Api-Secret-Token") !== secret) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const database = createDb(env.DB);
    const botId = Number(token.slice(0, token.indexOf(":")));
    const bot = new Bot(token, {
      botId,
      botUsername: env.BOT_USERNAME ?? "MHDLabs_clownbot",
      database,
      botAdminIds: parseBotAdminIds(env.BOT_ADMIN_IDS),
      plugins: [i18nMiddleware(), replyToMiddleware],
    });
    bot.registerHandlers(...handlers);

    return await webhookCallback(bot, "cloudflare-mod", { secretToken: secret })(request);
  } catch (error) {
    // Log safe error metadata only; never expose request bodies, credentials, headers, or upstream objects.
    console.error(`Webhook processing failed (${safeErrorSummary(error)}).`);
    return new Response("Webhook processing failed", { status: 500 });
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/health" && request.method === "GET") return Response.json({ ok: true });

    if (url.pathname === "/ready" && request.method === "GET") return readinessResponse(env);

    if (url.pathname === "/telegram" && request.method === "POST") return handleWebhook(request, env);

    return new Response("Not found", { status: 404 });
  },
};
