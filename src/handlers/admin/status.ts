import type { InputRichMessage } from "grammy/types";

import { and, asc, count, desc, eq, inArray, sql } from "drizzle-orm";
import { InlineKeyboard } from "grammy";

import type { CallbackQueryHandler, CommandHandler, MessageHandler } from "@/handlers";
import type { BotContext } from "@/lib/bot";

import { schema } from "@/db";
import {
  advanceGroupWhitelistEpoch,
  getGroupWhitelistEpoch,
  GROUP_WHITELIST_SETTING,
  isGroupAllowlisted,
  isGroupWhitelistEnabled,
  notifyUnallowlistedGroups,
  sendGroupWhitelistDisabledNotice,
} from "@/lib/bot/group-whitelist";
import { CREATOR, getOwnerTelegramId } from "@/lib/creator";

const GROUPS_PER_PAGE = 8;
const CLOWNS_PER_PAGE = 8;
const MAX_PAGE = 100_000;

type Membership = "active" | "kicked" | "left" | "unknown";

interface MessageRef {
  chat: { id: number };
  message_id: number;
}

function isOwner(ctx: BotContext): boolean {
  return ctx.chat?.type === "private" && Boolean(ctx.from && ctx.botAdminIds?.has(String(ctx.from.id)));
}

function isUnsafeDisplayCode(code: number): boolean {
  return (
    code < 32 ||
    (code >= 127 && code <= 159) ||
    (code >= 0x200e && code <= 0x200f) ||
    (code >= 0x202a && code <= 0x202e) ||
    (code >= 0x2066 && code <= 0x2069)
  );
}

function safeName(name: string | null | undefined, fallback: string): string {
  let normalized = "";

  for (const character of name ?? "") {
    const code = character.codePointAt(0);
    if (code === undefined) continue;
    if (code >= 9 && code <= 13) {
      normalized += " ";
    } else if (!isUnsafeDisplayCode(code)) {
      normalized += character;
    }
  }

  const clean = normalized.replace(/\s+/g, " ").trim().slice(0, 64);
  return clean || fallback.replace(/^\u200f+/, "");
}

function directionalName(ctx: BotContext, name: string): string {
  return ctx.locale === "fa" ? `\u200f${name.replace(/^\u200f+/, "")}` : name;
}

function pageNumber(raw: string | undefined): number | null {
  if (!raw || !/^\d{1,6}$/.test(raw)) return null;
  const page = Number(raw);
  return Number.isSafeInteger(page) && page <= MAX_PAGE ? page : null;
}

function rich(ctx: BotContext, blocks: object[]): InputRichMessage {
  return { blocks, is_rtl: ctx.locale === "fa" } as InputRichMessage;
}

function listBlock(items: string[]) {
  return {
    type: "list" as const,
    items: items.map((text) => ({ blocks: [{ type: "paragraph" as const, text }] })),
  };
}

function addPager({
  keyboard,
  ctx,
  page,
  pages,
  target,
}: {
  keyboard: InlineKeyboard;
  ctx: BotContext;
  page: number;
  pages: number;
  target: (next: number) => string;
}) {
  if (page > 0) keyboard.text(ctx.t("admin_button_previous"), target(page - 1));
  if (page + 1 < pages) keyboard.text(ctx.t("admin_button_next"), target(page + 1));
  if (page > 0 || page + 1 < pages) keyboard.row();
}

async function sendOrEdit(
  ctx: BotContext,
  { message, blocks, keyboard }: { message: MessageRef | undefined; blocks: object[]; keyboard: InlineKeyboard },
) {
  const content = rich(ctx, blocks);

  if (message) {
    try {
      return await ctx.api.editMessageText(message.chat.id, message.message_id, content, { reply_markup: keyboard });
    } catch (error) {
      if (error instanceof Error && /message is not modified/i.test(error.message)) return;
      throw error;
    }
  }
  if (!ctx.chat) return;
  return await ctx.api.sendRichMessage(ctx.chat.id, content, {
    reply_markup: keyboard,
    ...(ctx.msg
      ? {
          reply_parameters: {
            message_id: ctx.msg.message_id,
            chat_id: ctx.msg.chat.id,
            allow_sending_without_reply: true,
          },
        }
      : {}),
  });
}

async function currentPeriodClowns(ctx: BotContext) {
  return ctx.db
    .select({
      clownId: schema.clownVotes.clownId,
      score: sql<number>`sum(${schema.clownVotes.quantity})`.as("score"),
    })
    .from(schema.clownVotes)
    .innerJoin(schema.groups, eq(schema.groups.id, schema.clownVotes.groupId))
    .where(sql`${schema.clownVotes.votedAt} >= coalesce(${schema.groups.resetAt}, 0)`)
    .groupBy(schema.clownVotes.groupId, schema.clownVotes.clownId)
    .having(sql`sum(${schema.clownVotes.quantity}) > 0`)
    .as("current_period_clowns");
}

async function homeMetrics(ctx: BotContext) {
  const [groupCountRow] = await ctx.db.select({ total: count() }).from(schema.groups);
  const groupCount = groupCountRow?.total ?? 0;
  const [activeGroupsRow] = await ctx.db
    .select({ total: count() })
    .from(schema.groups)
    .where(eq(schema.groups.botMemberStatus, "active"));
  const confirmedActiveGroups = activeGroupsRow?.total ?? 0;
  const currentClowns = await currentPeriodClowns(ctx);
  const [clownsRow] = await ctx.db
    .select({ total: sql<number>`count(distinct ${currentClowns.clownId})` })
    .from(currentClowns);
  const clownCount = clownsRow?.total ?? 0;
  const enabled = await isGroupWhitelistEnabled(ctx);
  const [allowlistedRow] = await ctx.db.select({ total: count() }).from(schema.allowedGroups);
  const allowlistedCount = allowlistedRow?.total ?? 0;

  return { groupCount, confirmedActiveGroups, clownCount, enabled, allowlistedCount };
}

function homeBlocks(ctx: BotContext, metrics: Awaited<ReturnType<typeof homeMetrics>>, notice?: string): object[] {
  const blocks = [
    { type: "heading" as const, size: 1 as const, text: ctx.t("admin_title") },
    {
      type: "list" as const,
      items: [
        { blocks: [{ type: "paragraph" as const, text: ctx.t("admin_metric_groups", { count: metrics.groupCount }) }] },
        {
          blocks: [
            {
              type: "paragraph" as const,
              text: ctx.t("admin_metric_active_groups", { count: metrics.confirmedActiveGroups }),
            },
          ],
        },
        { blocks: [{ type: "paragraph" as const, text: ctx.t("admin_metric_clowns", { count: metrics.clownCount }) }] },
        {
          blocks: [
            {
              type: "paragraph" as const,
              text: ctx.t("admin_metric_whitelist", {
                mode: ctx.t(metrics.enabled ? "admin_whitelist_enabled" : "admin_whitelist_disabled"),
                count: metrics.allowlistedCount,
              }),
            },
          ],
        },
      ],
    },
    ...(notice ? [{ type: "paragraph" as const, text: notice }] : []),
    { type: "divider" as const },
    {
      type: "footer" as const,
      text: ctx.t("admin_creator", {
        creator: CREATOR.username,
        owner_id: getOwnerTelegramId(ctx.botAdminIds),
      }),
    },
  ];
  return blocks;
}

function homeKeyboard(ctx: BotContext, enabled: boolean): InlineKeyboard {
  return new InlineKeyboard()
    .text(ctx.t("admin_button_groups"), "admin:groups:0")
    .row()
    .text(ctx.t(enabled ? "admin_button_disable_whitelist" : "admin_button_enable_whitelist"), "admin:toggle-whitelist")
    .row()
    .url(ctx.t("admin_button_creator_channel"), CREATOR.channelUrl);
}

async function renderHome(ctx: BotContext, message?: MessageRef, notice?: string) {
  const metrics = await homeMetrics(ctx);
  return await sendOrEdit(ctx, {
    message,
    blocks: homeBlocks(ctx, metrics, notice),
    keyboard: homeKeyboard(ctx, metrics.enabled),
  });
}

async function membershipFor(
  ctx: BotContext,
  groupId: string,
  cached: Membership | null | undefined,
): Promise<Membership> {
  if (cached) return cached;

  try {
    const member = await ctx.api.getChatMember(groupId, ctx.meId);
    let status: Exclude<Membership, "unknown">;

    if (member.status === "creator" || member.status === "administrator" || member.status === "member") {
      status = "active";
    } else if (member.status === "restricted") {
      status = member.is_member ? "active" : "left";
    } else {
      status = member.status === "kicked" ? "kicked" : "left";
    }

    await ctx.db.update(schema.groups).set({ botMemberStatus: status }).where(eq(schema.groups.id, groupId));
    return status;
  } catch {
    return "unknown";
  }
}

function membershipText(ctx: BotContext, membership: Membership): string {
  return ctx.t(
    membership === "active"
      ? "admin_group_active"
      : membership === "unknown"
        ? "admin_group_unknown"
        : "admin_group_inactive",
  );
}

async function renderGroups(
  ctx: BotContext,
  requestedPage: number,
  message?: { chat: { id: number }; message_id: number },
) {
  const [groupCountRow] = await ctx.db.select({ total: count() }).from(schema.groups);
  const total = groupCountRow?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / GROUPS_PER_PAGE));
  const page = Math.min(requestedPage, pages - 1);
  const rows = await ctx.db
    .select({ id: schema.groups.id, name: schema.groups.name, botMemberStatus: schema.groups.botMemberStatus })
    .from(schema.groups)
    .orderBy(asc(schema.groups.name), asc(schema.groups.id))
    .limit(GROUPS_PER_PAGE)
    .offset(page * GROUPS_PER_PAGE);
  const allowedRows = rows.length
    ? await ctx.db
        .select({ groupId: schema.allowedGroups.groupId })
        .from(schema.allowedGroups)
        .where(
          inArray(
            schema.allowedGroups.groupId,
            rows.map((group) => group.id),
          ),
        )
    : [];
  const allowedGroupIds = new Set(allowedRows.map((group) => group.groupId));

  const groups = await Promise.all(
    rows.map(async (group) => ({ ...group, membership: await membershipFor(ctx, group.id, group.botMemberStatus) })),
  );
  const blocks: object[] = [
    { type: "heading", size: 1, text: ctx.t("admin_groups_title") },
    { type: "paragraph", text: ctx.t("admin_page", { current: page + 1, total: pages }) },
  ];

  if (groups.length === 0) {
    blocks.push({ type: "paragraph", text: ctx.t("admin_groups_empty") });
  } else {
    blocks.push(
      listBlock(
        groups.map((group) =>
          ctx.t("admin_group_line", {
            name: safeName(group.name, ctx.t("admin_group_unnamed")),
            status: membershipText(ctx, group.membership),
            whitelist: ctx.t(allowedGroupIds.has(group.id) ? "admin_whitelist_enabled" : "admin_whitelist_disabled"),
          }),
        ),
      ),
    );
  }

  blocks.push({ type: "footer", text: ctx.t("admin_groups_note") });

  const keyboard = new InlineKeyboard();

  for (const group of groups) {
    const allowed = allowedGroupIds.has(group.id);
    const label = `${safeName(group.name, ctx.t("admin_group_unnamed"))} · ${membershipText(ctx, group.membership)}${allowed ? ` · ${ctx.t("admin_whitelist_enabled")}` : ""}`;
    keyboard.text(directionalName(ctx, label).slice(0, 64), `admin:group:${group.id}:0`).row();
  }

  addPager({ keyboard, ctx, page, pages, target: (next) => `admin:groups:${next}` });
  keyboard.text(ctx.t("admin_button_home"), "admin:home");
  return await sendOrEdit(ctx, { message, blocks, keyboard });
}

async function groupLeaderboard(ctx: BotContext, groupId: string, requestedPage: number) {
  const conditions = [
    eq(schema.clownVotes.groupId, groupId),
    sql`${schema.clownVotes.votedAt} >= coalesce(${schema.groups.resetAt}, 0)`,
  ];
  const scoreSubquery = ctx.db
    .select({ clownId: schema.clownVotes.clownId })
    .from(schema.clownVotes)
    .innerJoin(schema.groups, eq(schema.groups.id, schema.clownVotes.groupId))
    .where(and(...conditions))
    .groupBy(schema.clownVotes.groupId, schema.clownVotes.clownId)
    .having(sql`sum(${schema.clownVotes.quantity}) > 0`)
    .as("group_clowns");
  const [clownCountRow] = await ctx.db.select({ total: count() }).from(scoreSubquery);
  const clownTotal = clownCountRow?.total ?? 0;
  const pages = Math.max(1, Math.ceil(clownTotal / CLOWNS_PER_PAGE));
  const page = Math.min(requestedPage, pages - 1);
  const clowns = await ctx.db
    .select({
      clownId: schema.clownVotes.clownId,
      name: schema.users.name,
      score: sql<number>`sum(${schema.clownVotes.quantity})`,
    })
    .from(schema.clownVotes)
    .innerJoin(schema.users, eq(schema.users.id, schema.clownVotes.clownId))
    .innerJoin(schema.groups, eq(schema.groups.id, schema.clownVotes.groupId))
    .where(and(...conditions))
    .groupBy(schema.clownVotes.clownId, schema.users.name)
    .having(sql`sum(${schema.clownVotes.quantity}) > 0`)
    .orderBy(desc(sql`sum(${schema.clownVotes.quantity})`), asc(schema.clownVotes.clownId))
    .limit(CLOWNS_PER_PAGE)
    .offset(page * CLOWNS_PER_PAGE);

  return { page, pages, clowns };
}

function groupDetailKeyboard(
  ctx: BotContext,
  groupId: string,
  { allowed, membership, page, pages }: { allowed: boolean; membership: Membership; page: number; pages: number },
): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  const canAllow = membership !== "left" && membership !== "kicked";

  if (allowed) {
    keyboard.text(ctx.t("admin_button_remove_group"), `admin:allow:${groupId}`);
  } else if (canAllow) {
    keyboard.text(ctx.t("admin_button_allow_group"), `admin:allow:${groupId}`);
  }
  if (allowed || canAllow) keyboard.row();
  if (page > 0) keyboard.text(ctx.t("admin_button_previous"), `admin:group:${groupId}:${page - 1}`);
  if (page + 1 < pages) keyboard.text(ctx.t("admin_button_next"), `admin:group:${groupId}:${page + 1}`);
  if (page > 0 || page + 1 < pages) keyboard.row();
  keyboard.text(ctx.t("admin_button_groups"), "admin:groups:0").row().text(ctx.t("admin_button_home"), "admin:home");
  return keyboard;
}

async function renderGroup(
  ctx: BotContext,
  {
    groupId,
    requestedPage,
    message,
    notice,
  }: { groupId: string; requestedPage: number; message?: MessageRef; notice?: string },
) {
  const group = await ctx.db.query.groups.findFirst({
    columns: { id: true, name: true, botMemberStatus: true },
    where: (fields, operators) => operators.eq(fields.id, groupId),
  });

  if (!group) {
    return await sendOrEdit(ctx, {
      message,
      blocks: [{ type: "paragraph", text: ctx.t("admin_group_missing") }],
      keyboard: new InlineKeyboard()
        .text(ctx.t("admin_button_groups"), "admin:groups:0")
        .row()
        .text(ctx.t("admin_button_home"), "admin:home"),
    });
  }

  const membership = await membershipFor(ctx, groupId, group.botMemberStatus);
  const allowed = await isGroupAllowlisted(ctx, groupId);
  const { page, pages, clowns } = await groupLeaderboard(ctx, groupId, requestedPage);

  const blocks: object[] = [
    {
      type: "heading",
      size: 1,
      text: directionalName(ctx, safeName(group.name, ctx.t("admin_group_unnamed"))),
    },
    {
      type: "list",
      items: [
        {
          blocks: [
            { type: "paragraph", text: ctx.t("admin_group_membership", { status: membershipText(ctx, membership) }) },
          ],
        },
        {
          blocks: [
            {
              type: "paragraph",
              text: ctx.t("admin_group_allowlist", {
                status: ctx.t(allowed ? "admin_whitelist_enabled" : "admin_whitelist_disabled"),
              }),
            },
          ],
        },
      ],
    },
    { type: "divider" },
    { type: "heading", size: 2, text: ctx.t("admin_group_clowns_title") },
  ];
  if (notice) blocks.push({ type: "paragraph", text: notice });
  if (clowns.length) {
    blocks.push(
      listBlock(
        clowns.map((clown) =>
          ctx.t("admin_clown_line", { name: safeName(clown.name, ctx.t("admin_group_unnamed")), score: clown.score }),
        ),
      ),
    );
    blocks.push({ type: "paragraph", text: ctx.t("admin_page", { current: page + 1, total: pages }) });
  } else {
    blocks.push({ type: "paragraph", text: ctx.t("admin_group_no_clowns") });
  }

  blocks.push({ type: "footer", text: ctx.t("admin_group_privacy_note") });

  const keyboard = groupDetailKeyboard(ctx, groupId, { allowed, membership, page, pages });

  return await sendOrEdit(ctx, { message, blocks, keyboard });
}

async function handleOwnerCommand(ctx: BotContext) {
  if (!isOwner(ctx)) return;

  try {
    await renderHome(ctx);
  } catch {
    console.error("Owner panel load failed.");
    if (ctx.msg) await ctx.replyTo(ctx.msg, ctx.t("admin_error"));
  }
}

export const adminStatusHandler: CommandHandler = {
  kind: "command",
  name: "admin_status",
  description: "Owner-only bot status and whitelist panel",
  scopes: [{ type: "all_private_chats" }],
  handler: handleOwnerCommand,
};

// Telegram's command syntax rejects hyphens. Keep the requested spelling as a private text alias.
export const adminStatusHyphenAlias: MessageHandler = {
  kind: "message",
  filter: async (ctx, next) => {
    if (ctx.chat?.type !== "private" || !/^\/admin-status(?:\s|$)/.test(ctx.msg?.text ?? "")) {
      return;
    }

    return await next();
  },
  handler: handleOwnerCommand,
};

async function setWhitelistEnabled(ctx: BotContext, enabled: boolean): Promise<number | null> {
  // Advance the generation before enabling the gate, so concurrent group updates
  // cannot send a notice using the previous activation's generation.
  const epoch = enabled ? await advanceGroupWhitelistEpoch(ctx) : null;

  await ctx.db
    .insert(schema.botSettings)
    .values({ key: GROUP_WHITELIST_SETTING, value: enabled ? "enabled" : "disabled" })
    .onConflictDoUpdate({ target: schema.botSettings.key, set: { value: enabled ? "enabled" : "disabled" } });

  return epoch;
}

async function toggleAllowlist(ctx: BotContext, groupId: string): Promise<boolean> {
  const group = await ctx.db.query.groups.findFirst({
    columns: { id: true, botMemberStatus: true },
    where: (fields, operators) => operators.eq(fields.id, groupId),
  });
  if (!group) return false;

  const allowed = await isGroupAllowlisted(ctx, groupId);

  if (allowed) {
    await ctx.db.delete(schema.allowedGroups).where(eq(schema.allowedGroups.groupId, groupId));
    return true;
  }

  const status = await membershipFor(ctx, groupId, group.botMemberStatus);
  if (status === "left" || status === "kicked") return false;

  await ctx.db.insert(schema.allowedGroups).values({ groupId }).onConflictDoNothing();
  return true;
}

async function groupListCallback(ctx: BotContext, data: string, message: MessageRef): Promise<boolean> {
  const match = /^admin:groups:(\d{1,6})$/.exec(data);
  if (!match) return false;
  const page = pageNumber(match[1]);
  if (page !== null) await renderGroups(ctx, page, message);
  return true;
}

async function whitelistCallback(ctx: BotContext, data: string, message: MessageRef): Promise<boolean> {
  if (data !== "admin:toggle-whitelist") return false;
  const enabled = await isGroupWhitelistEnabled(ctx);

  if (!enabled) {
    const [allowedCountRow] = await ctx.db.select({ total: count() }).from(schema.allowedGroups);

    if (!(allowedCountRow?.total ?? 0)) {
      await renderHome(ctx, message, ctx.t("admin_whitelist_needs_group"));
      return true;
    }
  }

  const epoch = await setWhitelistEnabled(ctx, !enabled);

  if (epoch !== null) {
    await notifyUnallowlistedGroups(ctx, epoch);
  }

  await renderHome(ctx, message);
  return true;
}

async function allowGroupCallback(ctx: BotContext, data: string, message: MessageRef): Promise<boolean> {
  const match = /^admin:allow:(-?\d{1,20})$/.exec(data);
  if (!match?.[1]) return false;
  const groupId = match[1];
  const wasAllowed = await isGroupAllowlisted(ctx, groupId);
  const whitelistEnabled = await isGroupWhitelistEnabled(ctx);
  const changed = await toggleAllowlist(ctx, groupId);

  // Removing a group from an active allowlist disables it immediately.
  if (changed && wasAllowed && whitelistEnabled) {
    const epoch = await getGroupWhitelistEpoch(ctx);
    await sendGroupWhitelistDisabledNotice(ctx, groupId, epoch);
  }

  await renderGroup(ctx, {
    groupId,
    requestedPage: 0,
    message,
    ...(changed ? {} : { notice: ctx.t("admin_group_not_active") }),
  });
  return true;
}

async function groupDetailCallback(ctx: BotContext, data: string, message: MessageRef): Promise<boolean> {
  const match = /^admin:group:(-?\d{1,20}):(\d{1,6})$/.exec(data);
  if (!match?.[1]) return false;
  const page = pageNumber(match[2]);

  if (page !== null) {
    await renderGroup(ctx, { groupId: match[1], requestedPage: page, message });
  }

  return true;
}

async function routeOwnerCallback(ctx: BotContext, data: string, message: MessageRef): Promise<void> {
  if (data === "admin:home") {
    await renderHome(ctx, message);
    return;
  }
  if (await groupListCallback(ctx, data, message)) return;
  if (await whitelistCallback(ctx, data, message)) return;
  if (await allowGroupCallback(ctx, data, message)) return;
  await groupDetailCallback(ctx, data, message);
}

async function handleOwnerCallback(ctx: BotContext): Promise<void> {
  const callback = ctx.callbackQuery;
  if (!callback) return;
  const { message } = callback;

  if (!message || message.chat.type !== "private" || !ctx.from || !ctx.botAdminIds?.has(String(ctx.from.id))) {
    await ctx.answerCallbackQuery();
    return;
  }

  await ctx.answerCallbackQuery();
  const data = callback.data ?? "";
  const home = { chat: message.chat, message_id: message.message_id };

  try {
    await routeOwnerCallback(ctx, data, home);
  } catch {
    console.error("Owner panel action failed.");
    await ctx.editRichMessage({
      chatId: message.chat.id,
      messageId: message.message_id,
      text: ctx.t("admin_error"),
      options: { reply_markup: new InlineKeyboard().text(ctx.t("admin_button_home"), "admin:home") },
    });
  }
}

export const adminStatusCallbacks: CallbackQueryHandler[] = [
  { kind: "callback_query", data: /^admin:/, handler: handleOwnerCallback },
];
