import type { BotError } from "grammy";

import { GrammyError } from "grammy";

import type { BotContext } from ".";

export function errorHandler(err: BotError<BotContext>) {
  if (err.error instanceof GrammyError) console.error("Telegram update failed:", err.error.description);
  else console.error("Telegram update failed.");
}
