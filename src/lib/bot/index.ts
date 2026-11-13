import type { Context, Middleware } from "grammy";

import { CommandGroup } from "@grammyjs/commands";
import { Bot as GrammyBot } from "grammy";

import type { AppDb } from "@/db";
import type { Handler } from "@/handlers";

import type { I18nFlavor } from "./plugins/i18n";
import type { ReplyToFlavor } from "./plugins/reply-to";

import { errorHandler } from "./error-handler";
import { autoRetryPlugin } from "./plugins/auto-retry";
import { applyHandlers } from "./registration";

export type ClownCall = "clown" | "unclown";

export type BotContext = Context &
  I18nFlavor &
  ReplyToFlavor & {
    clownCall?: ClownCall;
    db: AppDb;
    meId: number;
  };

interface BotOptions {
  botId: number;
  database: AppDb;
  plugins: Middleware<BotContext>[];
}

export class Bot extends GrammyBot<BotContext> {
  /**
   * Single group for every command handler: `setCommands` issues one `setMyCommands`
   * per scope, so two groups would overwrite each other's scopes.
   */
  readonly commands = new CommandGroup<BotContext>();

  constructor(token: string, { botId, database, plugins }: BotOptions) {
    super(token);

    this.use(async (ctx, next) => {
      ctx.db = database;
      ctx.meId = botId;
      await next();
    });
    plugins.forEach((plugin) => this.use(plugin));

    this.api.config.use(autoRetryPlugin());
  }

  override errorHandler = errorHandler;

  /** Binds every handler passed in — see `applyHandlers`. */
  registerHandlers(...handlers: Handler[]): this {
    const commands = handlers.filter((handler) => handler.kind === "command");
    const rest = handlers.filter((handler) => handler.kind !== "command");
    applyHandlers(this, this.commands, commands);
    this.use(this.commands);
    applyHandlers(this, this.commands, rest);
    return this;
  }
}

export * from "./filters";
export * from "./plugins";
