import { and, eq } from "drizzle-orm";
import { InlineKeyboard } from "grammy";
import type { MiddlewareFn } from "grammy";

import { schema } from "@/db";

import { CREATOR, getOwnerTelegramId } from "@/lib/creator";

import type { BotContext } from ".";

export const GROUP_WHITELIST_SETTING = "group_whitelist_enabled";
const GROUP_WHITELIST_EPOCH_SETTING = "group_whitelist_epoch";
const GROUP_NOTICE_KEY_PREFIX = "group_whitelist_notice:";

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

/** Returns the current notification generation, creating one for older installations when needed. */
export async function getGroupWhitelistEpoch(ctx: BotContext): Promise<number> {
  const [setting] = await ctx.db
    .select({ value: schema.botSettings.value })
    .from(schema.botSettings)
    .where(eq(schema.botSettings.key, GROUP_WHITELIST_EPOCH_SETTING))
    .limit(1);
  const current = Number(setting?.value);

  if (Number.isSafeInteger(current) && current > 0) return current;

  const initial = Date.now();
  await ctx.db
    .insert(schema.botSettings)
    .values({ key: GROUP_WHITELIST_EPOCH_SETTING, value: String(initial) })
    .onConflictDoNothing();

  const [persisted] = await ctx.db
    .select({ value: schema.botSettings.value })
    .from(schema.botSettings)
    .where(eq(schema.botSettings.key, GROUP_WHITELIST_EPOCH_SETTING))
    .limit(1);
  const persistedEpoch = Number(persisted?.value);

  return Number.isSafeInteger(persistedEpoch) && persistedEpoch > 0 ? persistedEpoch : initial;
}

/** Starts a fresh notification generation each time whitelist mode is enabled. */
export async function advanceGroupWhitelistEpoch(ctx: BotContext): Promise<number> {
  const current = await getGroupWhitelistEpoch(ctx);
  const next = Math.max(Date.now(), current + 1);

  await ctx.db
    .insert(schema.botSettings)
    .values({ key: GROUP_WHITELIST_EPOCH_SETTING, value: String(next) })
    .onConflictDoUpdate({
      target: schema.botSettings.key,
      set: { value: String(next) },
    });

  return next;
}

async function claimGroupNotice(ctx: BotContext, groupId: string, epoch: number): Promise<boolean> {
  const key = `${GROUP_NOTICE_KEY_PREFIX}${groupId}`;
  const [existing] = await ctx.db
    .select({ value: schema.botSettings.value })
    .from(schema.botSettings)
    .where(eq(schema.botSettings.key, key))
    .limit(1);

  if (!existing) {
    const [inserted] = await ctx.db
      .insert(schema.botSettings)
      .values({ key, value: String(epoch) })
      .onConflictDoNothing()
      .returning({ key: schema.botSettings.key });

    return inserted !== undefined;
  }

  const previousEpoch = Number(existing.value);
  if (Number.isSafeInteger(previousEpoch) && previousEpoch >= epoch) return false;

  const [updated] = await ctx.db
    .update(schema.botSettings)
    .set({ value: String(epoch) })
    .where(and(eq(schema.botSettings.key, key), eq(schema.botSettings.value, existing.value)))
    .returning({ key: schema.botSettings.key });

  return updated !== undefined;
}

/**
 * Sends at most one notice per group and whitelist generation.
 * The database claim happens before the Telegram request to avoid duplicate notices
 * when multiple group updates arrive concurrently.
 */
export async function sendGroupWhitelistDisabledNotice(
  ctx: BotContext,
  groupId: string,
  epoch?: number,
): Promise<boolean> {
  const currentEpoch = epoch ?? (await getGroupWhitelistEpoch(ctx));
  if (!(await claimGroupNotice(ctx, groupId, currentEpoch))) return false;

  const chatId = Number(groupId);
  if (!Number.isSafeInteger(chatId)) return false;

  const keyboard = new InlineKeyboard()
    .url(ctx.t("whitelist_button_source"), CREATOR.repositoryUrl)
    .url(ctx.t("whitelist_button_channel"), CREATOR.channelUrl);

  try {
    await ctx.api.sendMessage(
      chatId,
      ctx.t("whitelist_group_disabled", {
        creator: CREATOR.username,
        owner_id: getOwnerTelegramId(ctx.botAdminIds),
        channel: CREATOR.channel,
        repository: CREATOR.repositoryUrl,
      }),
      { reply_markup: keyboard },
    );
    return true;
  } catch {
    console.warn("Could not deliver a group whitelist notice.");
    return false;
  }
}

/** Notifies known active, non-allowlisted groups after whitelist mode is enabled. */
export async function notifyUnallowlistedGroups(ctx: BotContext, epoch: number): Promise<number> {
  const [groups, allowlisted] = await Promise.all([
    ctx.db.select({ id: schema.groups.id, botMemberStatus: schema.groups.botMemberStatus }).from(schema.groups),
    ctx.db.select({ groupId: schema.allowedGroups.groupId }).from(schema.allowedGroups),
  ]);
  const allowlistedIds = new Set(allowlisted.map((entry) => entry.groupId));
  const targets = groups.filter(
    (group) =>
      !allowlistedIds.has(group.id) && group.botMemberStatus !== "left" && group.botMemberStatus !== "kicked",
  );
  let notified = 0;

  // Also verify legacy rows whose membership predates my_chat_member tracking.
  // Telegram does not expose a list of all chats, so only registered chat IDs can be checked.
  for (let index = 0; index < targets.length; index += 5) {
    await Promise.all(
      targets.slice(index, index + 5).map(async (group) => {
        let active = group.botMemberStatus === "active";

        if (!active) {
          try {
            const member = await ctx.api.getChatMember(group.id, ctx.meId);
            active =
              member.status === "creator" ||
              member.status === "administrator" ||
              member.status === "member" ||
              (member.status === "restricted" && member.is_member);

            await ctx.db
              .update(schema.groups)
              .set({ botMemberStatus: active ? "active" : member.status === "kicked" ? "kicked" : "left" })
              .where(eq(schema.groups.id, group.id));
          } catch {
            return;
          }
        }

        if (active && (await sendGroupWhitelistDisabledNotice(ctx, group.id, epoch))) notified += 1;
      }),
    );
  }

  return notified;
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

    const groupId = String(ctx.chat.id);
    if (await isGroupAllowlisted(ctx, groupId)) return await next();

    // Receiving a group update confirms that the bot is still a member, including for
    // legacy groups that predate membership tracking.
    await ctx.db
      .insert(schema.groups)
      .values({ id: groupId, name: ctx.chat.title ?? null, botMemberStatus: "active" })
      .onConflictDoUpdate({
        target: schema.groups.id,
        set: { name: ctx.chat.title ?? null, botMemberStatus: "active" },
      });

    await sendGroupWhitelistDisabledNotice(ctx, groupId);
  } catch {
    // Fail closed and avoid leaking configuration or producing retrying Telegram webhook errors.
    console.warn("Group whitelist check failed; ignored group update.");
  }
};
