import type { MiddlewareFn } from "grammy";
import type { BotCommandScope } from "grammy/types";

import type { BotContext } from "@/lib/bot";

import { mediaHandlers } from "./admin/media";
import { resetStatsCallbacks, resetStatsHandler } from "./admin/resetstats";
import { setCooldownHandler } from "./admin/setcooldown";
import { clownHandlers } from "./group/clown";
import { clownMediaHandlers } from "./group/clown-media";
import { clownOfTheDayHandler } from "./group/clownoftheday";
import { personalStatsHandler } from "./group/mystats";
import { statsHandler } from "./group/stats";
import { helpCallbacks, helpHandler } from "./static/help";
import { languageCallbacks, languageHandler } from "./static/language";
import { privacyHandler } from "./static/privacy";
import { sourceHandler } from "./static/source";
import { startHandler } from "./static/start";

export type Handler = CallbackQueryHandler | CommandHandler | MessageHandler;

export type HandlerFn = (ctx: BotContext) => Promise<unknown>;

export interface CommandHandler {
  kind: "command";
  /** Command name without the leading `/`: `^[a-z0-9_]{1,32}$` (Telegram rejects anything else). */
  name: string;
  description: string;
  /** Non-empty. Where Telegram shows the command *and* where grammY is allowed to run it. */
  scopes: BotCommandScope[];
  handler: HandlerFn;
}

export interface MessageHandler {
  kind: "message";
  /** Restrict the handler to group/supergroup chats. */
  inGroup?: boolean;
  /** Optional matcher that runs before `handler`; it must call `next()` for `handler` to run. */
  filter?: MiddlewareFn<BotContext>;
  handler: HandlerFn;
}

export interface CallbackQueryHandler {
  kind: "callback_query";
  data: string;
  handler: HandlerFn;
}

export const handlers: Handler[] = [
  // Private chats
  startHandler,
  helpHandler,
  ...helpCallbacks,
  languageHandler,
  sourceHandler,
  privacyHandler,
  ...languageCallbacks,

  // Groups
  ...clownHandlers,
  ...clownMediaHandlers,
  statsHandler,
  personalStatsHandler,
  clownOfTheDayHandler,

  // Admins
  ...mediaHandlers,
  resetStatsHandler,
  ...resetStatsCallbacks,
  setCooldownHandler,
];
