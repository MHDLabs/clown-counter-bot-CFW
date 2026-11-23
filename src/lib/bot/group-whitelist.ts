import type { MiddlewareFn } from "grammy";

import { eq } from "drizzle-orm";

import { schema } from "@/db";

import type { BotContext } from ".";

export const GROUP_WHITELIST_SETTING = "group_whitelist_enabled";

export async function isGroupWhitelistEnabled(ctx: BotContext): Promise<boolean> {
  const [setting] = await ctx.db
    .select({ value: schema.botSettings.value })
    .from(schema.botSettings)
    .where(eq(schema.botSettings.key, GROUP_WHITELIST_SETTING))
    .limit(1);

  return setting?.value === "enabled";
}

export async function isGroupAllowlisted(ctx: BotContext, groupId: string): Promise<boolean> {
  const [entry] = await ctx.db
    .select({ groupId: schema.allowedGroups.groupId })
    .from(schema.allowedGroups)
    .where(eq(schema.allowedGroups.groupId, groupId))
    .limit(1);

  return entry !== undefined;
}

export const groupWhitelistMiddleware: MiddlewareFn<BotContext> = async (ctx, next) => {
  if (ctx.chat?.type !== "group" && ctx.chat?.type !== "supergroup") {
    return await next();
  }

  // Keep lifecycle updates flowing so membership and group-ID migrations can be recorded.
  const isGroupMigration = ctx.msg?.migrate_to_chat_id !== undefined || ctx.msg?.migrate_from_chat_id !== undefined;
  if ("my_chat_member" in ctx.update || isGroupMigration) {
    return await next();
  }

  try {
    if (!(await isGroupWhitelistEnabled(ctx))) return await next();
    if (await isGroupAllowlisted(ctx, String(ctx.chat.id))) {
      return await next();
    }
  } catch {
    // Fail closed and avoid leaking configuration or producing retrying Telegram webhook errors.
    console.warn("Group whitelist check failed; ignored group update.");
  }
};
