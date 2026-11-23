import { and, eq } from "drizzle-orm";
import type { MiddlewareFn } from "grammy";
import { InlineKeyboard } from "grammy";

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

async function releaseGroupNoticeClaim(ctx: BotContext, groupId: string, epoch: number): Promise<void> {
  const key = `${GROUP_NOTICE_KEY_PREFIX}${groupId}`;

  try {
    await ctx.db
      .delete(schema.botSettings)
      .where(and(eq(schema.botSettings.key, key), eq(schema.botSettings.value, String(epoch))));
  } catch {
    console.warn("Could not release a failed group whitelist notice claim.");
  }
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
  const chatId = Number(groupId);
  if (!Number.isSafeInteger(chatId)) return false;

  const currentEpoch = epoch ?? (await getGroupWhitelistEpoch(ctx));
  if (!(await claimGroupNotice(ctx, groupId, currentEpoch))) return false;

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
    await releaseGroupNoticeClaim(ctx, groupId, currentEpoch);
    console.warn("Could not deliver a group whitelist notice.");
    return false;
  }
}

function isActiveMembership(member: { status: string; is_member?: boolean }): boolean {
  return (
    member.status === "creator" ||
    member.status === "administrator" ||
    member.status === "member" ||
    (member.status === "restricted" && Boolean(member.is_member))
  );
}

async function isKnownGroupActive(
  ctx: BotContext,
  group: { id: string; botMemberStatus: "active" | "kicked" | "left" | null },
): Promise<boolean> {
  if (group.botMemberStatus === "active") return true;
  if (group.botMemberStatus === "left" || group.botMemberStatus === "kicked") return false;

  try {
    const member = await ctx.api.getChatMember(group.id, ctx.meId);
    const active = isActiveMembership(member);
    const botMemberStatus = active ? "active" : member.status === "kicked" ? "kicked" : "left";

    await ctx.db.update(schema.groups).set({ botMemberStatus }).where(eq(schema.groups.id, group.id));

    return active;
  } catch {
    return false;
  }
}

async function notifyGroupIfActive(
  ctx: BotContext,
  group: { id: string; botMemberStatus: "active" | "kicked" | "left" | null },
  epoch: number,
): Promise<boolean> {
  if (!(await isKnownGroupActive(ctx, group))) return false;

  return await sendGroupWhitelistDisabledNotice(ctx, group.id, epoch);
}

/** Notifies known active, non-allowlisted groups after whitelist mode is enabled. */
export async function notifyUnallowlistedGroups(ctx: BotContext, epoch: number): Promise<number> {
  const [groups, allowlisted] = await Promise.all([
    ctx.db.select({ id: schema.groups.id, botMemberStatus: schema.groups.botMemberStatus }).from(schema.groups),
    ctx.db.select({ groupId: schema.allowedGroups.groupId }).from(schema.allowedGroups),
  ]);
  const allowlistedIds = new Set(allowlisted.map((entry) => entry.groupId));
  const targets = groups.filter(
    (group) => !allowlistedIds.has(group.id) && group.botMemberStatus !== "left" && group.botMemberStatus !== "kicked",
  );
  const batches = Array.from({ length: Math.ceil(targets.length / 5) }, (_, index) =>
    targets.slice(index * 5, index * 5 + 5),
  );
  const results = await Promise.all(
    batches.map((batch) => Promise.all(batch.map((group) => notifyGroupIfActive(ctx, group, epoch)))),
  );

  return results.flat().filter(Boolean).length;
}

function isGroupChat(ctx: BotContext): boolean {
  return ctx.chat?.type === "group" || ctx.chat?.type === "supergroup";
}

function isGroupLifecycleUpdate(ctx: BotContext): boolean {
  return (
    "my_chat_member" in ctx.update ||
    ctx.msg?.migrate_to_chat_id !== undefined ||
    ctx.msg?.migrate_from_chat_id !== undefined
  );
}

async function shouldProcessGroupUpdate(ctx: BotContext): Promise<boolean> {
  if (!(await isGroupWhitelistEnabled(ctx))) return true;

  const groupId = String(ctx.chat?.id);
  if (await isGroupAllowlisted(ctx, groupId)) return true;

  // Receiving a group update confirms that the bot is still a member, including for
  // legacy groups that predate membership tracking.
  await ctx.db
    .insert(schema.groups)
    .values({ id: groupId, name: ctx.chat?.title ?? null, botMemberStatus: "active" })
    .onConflictDoUpdate({
      target: schema.groups.id,
      set: { name: ctx.chat?.title ?? null, botMemberStatus: "active" },
    });

  await sendGroupWhitelistDisabledNotice(ctx, groupId);

  return false;
}

export const groupWhitelistMiddleware: MiddlewareFn<BotContext> = async (ctx, next) => {
  if (!isGroupChat(ctx) || isGroupLifecycleUpdate(ctx)) return await next();

  try {
    if (await shouldProcessGroupUpdate(ctx)) return await next();
  } catch {
    // Fail closed and avoid leaking configuration or producing retrying Telegram webhook errors.
    console.warn("Group whitelist check failed; ignored group update.");
  }
};
