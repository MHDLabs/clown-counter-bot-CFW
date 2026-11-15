/* eslint-disable camelcase, dot-notation */
import { createHash } from "node:crypto";

import { administratorMenu, commandMenus } from "./command-menus.mjs";

const token = process.env["BOT_TOKEN"];
const workerUrl = process.env["WORKER_URL"];
if (!token || !workerUrl) throw new Error("BOT_TOKEN and WORKER_URL are required");
const base = `https://api.telegram.org/bot${token}`;
const secret = createHash("sha256").update(`clown-counter-webhook:${token}`).digest("hex");

/** @param {number} milliseconds */
function delay(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

/** @param {string} method @param {Record<string, unknown>} payload @param {number} attempt */
async function requestWithRetry(method, payload, attempt = 1) {
  try {
    return await fetch(`${base}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    const cause = error instanceof Error ? error.cause : undefined;
    const code = cause && typeof cause === "object" && "code" in cause ? cause.code : undefined;
    const reason = String(code ?? (error instanceof Error ? error.name : "unknown error"));
    if (attempt === 5) throw new Error(`Telegram ${method} request failed before a response was received (${reason})`);

    console.warn(`Telegram ${method} connection attempt ${attempt}/5 failed (${reason}); retrying.`);
    await delay(1000 * 2 ** (attempt - 1));
    return requestWithRetry(method, payload, attempt + 1);
  }
}

/** @param {string} method @param {Record<string, unknown>} payload */
async function telegram(method, payload) {
  const response = await requestWithRetry(method, payload);

  const result = await response.json();

  if (!response.ok || result.ok !== true) {
    throw new Error(`Telegram ${method} failed: ${result.description ?? `HTTP ${response.status}`}`);
  }

  return result;
}

const url = `${workerUrl.replace(/\/$/, "")}/telegram`;

const botInfo = await telegram("getMe", {});
console.log(
  `Telegram bot identity: ${JSON.stringify({
    id: botInfo.result.id,
    username: botInfo.result.username,
    firstName: botInfo.result.first_name,
  })}`,
);

/** @param {string} label @param {{ result: { url?: string; pending_update_count?: number; last_error_date?: number; last_error_message?: string; allowed_updates?: string[] } }} response */
function reportWebhookStatus(label, response) {
  const info = response.result;
  const lastError =
    typeof info.last_error_message === "string" ? info.last_error_message.replaceAll(token ?? "", "[redacted]") : null;
  console.log(
    `Telegram webhook ${label}: ${JSON.stringify({
      expectedUrl: info.url === url,
      pendingUpdates: info.pending_update_count ?? 0,
      lastErrorDate: info.last_error_date ? new Date(info.last_error_date * 1000).toISOString() : null,
      lastError,
      allowedUpdates: info.allowed_updates ?? [],
    })}`,
  );
}

reportWebhookStatus("before re-registration", await telegram("getWebhookInfo", {}));
await telegram("setWebhook", {
  url,
  secret_token: secret,
  allowed_updates: ["message", "callback_query", "my_chat_member"],
});
const webhookInfo = await telegram("getWebhookInfo", {});
if (webhookInfo.result?.url !== url) throw new Error("Telegram did not retain the expected webhook URL");
reportWebhookStatus("after registration", webhookInfo);
await telegram("setMyCommands", { commands: commandMenus.private, scope: { type: "all_private_chats" } });
await telegram("setMyCommands", { commands: commandMenus.group, scope: { type: "all_group_chats" } });
await telegram("setMyCommands", { commands: administratorMenu, scope: { type: "all_chat_administrators" } });
const ownerIds = new Set(
  (process.env["BOT_ADMIN_IDS"] ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter((id) => /^\d+$/.test(id)),
);
await Promise.all(
  [...ownerIds].map((ownerId) =>
    telegram("setMyCommands", {
      commands: commandMenus.owner,
      scope: { type: "chat", chat_id: ownerId },
    }),
  ),
);
console.log("Telegram webhook and command menus configured successfully.");
