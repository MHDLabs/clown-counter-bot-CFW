import type { CommandGroup } from "@grammyjs/commands";
import type { Bot as GrammyBot, MiddlewareFn } from "grammy";

import { Command } from "@grammyjs/commands";

import type { Handler, MessageHandler } from "@/handlers";

import type { BotContext } from ".";

/** Middlewares a single `MessageHandler` registers, in execution order. */
function messageChain(handler: MessageHandler): MiddlewareFn<BotContext>[] {
  return [
    async (ctx, next) => {
      if (handler.inGroup && ctx.chat?.type !== "group" && ctx.chat?.type !== "supergroup") {
        return await next();
      }

      if (handler.filter) {
        let matched = false;
        await handler.filter(ctx, async () => {
          matched = true;
        });
        if (!matched) return await next();
      }

      return await handler.handler(ctx);
    },
  ];
}

/** Binds every handler to `bot`; command handlers go into the single, shared `commands` group. */
export function applyHandlers(
  bot: GrammyBot<BotContext>,
  commands: CommandGroup<BotContext>,
  handlers: Handler[],
): void {
  for (const handler of handlers) {
    switch (handler.kind) {
      case "command": {
        const command = new Command<BotContext>(handler.name, handler.description);
        for (const scope of handler.scopes) command.addToScope(scope, handler.handler);
        commands.add(command);
        break;
      }

      case "message":
        bot.on("message", ...messageChain(handler));
        break;

      case "callback_query":
        bot.callbackQuery(handler.data, handler.handler);
        break;

      case "update":
        bot.on(handler.update, handler.handler);
        break;
    }
  }
}
