import type { BotError } from "grammy";
import { GrammyError, HttpError } from "grammy";

import type { BotContext } from ".";

export function errorHandler(err: BotError<BotContext>): never {
  const error = err.error;
  const kind =
    error instanceof GrammyError
      ? "TelegramApiError"
      : error instanceof HttpError
        ? "TelegramNetworkError"
        : error instanceof Error
          ? error.name
          : "UnknownError";

  console.error(`Telegram update ${err.ctx.update.update_id} failed (${kind}).`);
  throw error;
}
