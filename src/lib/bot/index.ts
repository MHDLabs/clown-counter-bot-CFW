import type { Context, Middleware } from "grammy";

import { CommandGroup } from "@grammyjs/commands";
import { Bot as GrammyBot } from "grammy";

import type { AppDb } from "@/db";
import type { Handler } from "@/handlers";

import type { I18nFlavor } from "./plugins/i18n";
import type { ReplyToFlavor } from "./plugins/reply-to";

import { errorHandler } from "./error-handler";
import { groupWhitelistMiddleware } from "./group-whitelist";
import { autoRetryPlugin } from "./plugins/auto-retry";
import { updateDeduplicationMiddleware } from "./plugins/update-deduplication";
import { applyHandlers } from "./registration";

export type ClownCall = "clown" | "unclown";

export type BotContext = Context &
  I18nFlavor &
  ReplyToFlavor & {
    clownCall?: ClownCall;
    db: AppDb;
    meId: number;
    botAdminIds?: ReadonlySet<string>;
  };

interface BotOptions {
  botId: number;
  botUsername?: string;
  database: AppDb;
  botAdminIds?: ReadonlySet<string>;
  plugins: Middleware<BotContext>[];
}

export class Bot extends GrammyBot<BotContext> {
  /**
   * Single group for every command handler: `setCommands` issues one `setMyCommands`
   * per scope, so two groups would overwrite each other's scopes.
   */
  readonly commands: CommandGroup<BotContext>;

  constructor(
    token: string,
    { botId, botUsername = "MHDLabs_clownbot", database, botAdminIds = new Set(), plugins }: BotOptions,
  ) {
    super(token);

    // The commands plugin needs the bot username to match targeted group commands
    // such as /stats@MHDLabs_clownbot. Webhook Workers do not call bot.init(),
    // so provide the stable identity here instead of issuing getMe on every update.
    this.botInfo = {
      id: botId,
      is_bot: true,
      first_name: "Clown Counter",
      username: botUsername,
      can_join_groups: true,
      can_read_all_group_messages: false,
      supports_inline_queries: false,
      can_connect_to_business: false,
      has_main_web_app: false,
      has_topics_enabled: false,
      allows_users_to_create_topics: false,
      can_manage_bots: false,
      supports_join_request_queries: false,
    };
    this.commands = new CommandGroup<BotContext>({ targetedCommands: "optional" });

    this.use(async (ctx, next) => {
      ctx.db = database;
      ctx.meId = botId;
      ctx.botAdminIds = botAdminIds;
      await next();
    });
    this.use(updateDeduplicationMiddleware());
    // Load locale/context helpers before the whitelist gate so public notices
    // use each chat's selected language.
    plugins.forEach((plugin) => this.use(plugin));
    this.use(groupWhitelistMiddleware);

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
