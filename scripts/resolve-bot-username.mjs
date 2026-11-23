import { readFile, writeFile } from "node:fs/promises";

// eslint-disable-next-line dot-notation -- TypeScript requires bracket access for ProcessEnv index signatures.
const token = process.env["BOT_TOKEN"];
if (!token) throw new Error("BOT_TOKEN is required.");

const response = await fetch(`https://api.telegram.org/bot${token}/getMe`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: "{}",
});
const result = await response.json();
if (!response.ok || result.ok !== true) {
  throw new Error(`Telegram getMe failed: ${result.description ?? response.status}`);
}

const username = result.result?.username;
if (typeof username !== "string" || !/^[a-z]\w{4,31}$/i.test(username)) {
  throw new Error("Telegram did not return a valid bot username.");
}

const path = new URL("../wrangler.jsonc", import.meta.url);
const config = await readFile(path, "utf8");
const pattern = /("BOT_USERNAME"\s*:\s*")[^"]*(")/;
if (!pattern.test(config)) throw new Error("Could not find BOT_USERNAME in wrangler.jsonc.");
await writeFile(
  path,
  config.replace(pattern, (_match, before, after) => `${before}${username}${after}`),
);
console.log(`Resolved Telegram bot username: @${username}`);
