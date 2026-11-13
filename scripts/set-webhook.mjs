/* eslint-disable camelcase, dot-notation */
import { createHash } from "node:crypto";

const token = process.env["BOT_TOKEN"];
const workerUrl = process.env["WORKER_URL"];
if (!token || !workerUrl) throw new Error("BOT_TOKEN and WORKER_URL are required");
const base = `https://api.telegram.org/bot${token}`;
const secret = createHash("sha256").update(`clown-counter-webhook:${token}`).digest("hex");

/** @param {string} method @param {Record<string, unknown>} payload */
async function telegram(method, payload) {
  let response;

  try {
    response = await fetch(`${base}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error(`Telegram ${method} request failed before a response was received`);
  }

  const result = await response.json();

  if (!response.ok || result.ok !== true) {
    throw new Error(`Telegram ${method} failed: ${result.description ?? `HTTP ${response.status}`}`);
  }
}

const url = `${workerUrl.replace(/\/$/, "")}/telegram`;
await telegram("setWebhook", { url, secret_token: secret, allowed_updates: ["message", "callback_query"] });
const commands = {
  private: [
    { command: "start", description: "Start Clown Counter" },
    { command: "privacy", description: "Privacy information" },
    { command: "source", description: "View source code" },
  ],
  group: [
    { command: "clown", description: "Vote clown for replied member" },
    { command: "unclown", description: "Lower clown score of replied member" },
    { command: "stats", description: "Show group statistics" },
    { command: "clownoftheday", description: "Choose clown of the day" },
  ],
  admin: [
    { command: "setcooldown", description: "Set group vote cooldown" },
    { command: "setgif", description: "Add clown GIF by reply" },
    { command: "removegif", description: "Remove clown GIF by reply" },
    { command: "setsticker", description: "Add clown sticker by reply" },
    { command: "removesticker", description: "Remove clown sticker by reply" },
    { command: "setunclowngif", description: "Add unclown GIF by reply" },
    { command: "removeunclowngif", description: "Remove unclown GIF by reply" },
    { command: "setunclownsticker", description: "Add unclown sticker by reply" },
    { command: "removeunclownsticker", description: "Remove unclown sticker by reply" },
    { command: "resetstats", description: "Reset group statistics" },
  ],
};
await telegram("setMyCommands", { commands: commands.private, scope: { type: "all_private_chats" } });
await telegram("setMyCommands", { commands: commands.group, scope: { type: "all_group_chats" } });
await telegram("setMyCommands", { commands: commands.admin, scope: { type: "all_chat_administrators" } });
console.log("Telegram webhook and command menus configured successfully.");
