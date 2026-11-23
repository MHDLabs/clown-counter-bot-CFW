import type { MiddlewareFn } from "grammy";
import type { BotCommandScope } from "grammy/types";

import type { BotContext } from "@/lib/bot";

import { groupMembershipHandler } from "./admin/group-membership";
import { resetStatsCallbacks, resetStatsHandler } from "./admin/resetstats";
import { setCooldownHandler } from "./admin/setcooldown";
import { adminStatusCallbacks, adminStatusHandler, adminStatusHyphenAlias } from "./admin/status";
import { triggerCallbacks, triggerHandlers } from "./admin/triggers";
import { clownHandlers } from "./group/clown";
import { clownMediaHandlers } from "./group/clown-media";
import { clownOfTheDayHandler } from "./group/clownoftheday";
import { migrateGroupHandler } from "./group/migrate";
import { personalStatsHandler } from "./group/mystats";
import { statsCallbacks, statsHandler } from "./group/stats";
import { helpCallbacks, helpHandler } from "./static/help";
import { languageCallbacks, languageHandler } from "./static/language";
import { privacyHandler } from "./static/privacy";
import { sourceHandler } from "./static/source";
import { startHandler } from "./static/start";
import { adminPanelCloseHandler, ownerPanelCloseHandler, panelCloseHandler } from "./panel";

export type Handler = CallbackQueryHandler | CommandHandler | MessageHandler | UpdateHandler;

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
  data: string | RegExp;
  handler: HandlerFn;
}

export interface UpdateHandler {
  kind: "update";
  update: "my_chat_member";
  handler: MiddlewareFn<BotContext>;
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
  adminStatusHandler,
  adminStatusHyphenAlias,
  ...adminStatusCallbacks,
  panelCloseHandler,
  adminPanelCloseHandler,
  ownerPanelCloseHandler,

  // Groups
  ...clownHandlers,
  ...clownMediaHandlers,
  migrateGroupHandler,
  statsHandler,
  ...statsCallbacks,
  personalStatsHandler,
  clownOfTheDayHandler,

  // Admins
  ...triggerHandlers,
  ...triggerCallbacks,
  groupMembershipHandler,
  resetStatsHandler,
  ...resetStatsCallbacks,
  setCooldownHandler,
];
