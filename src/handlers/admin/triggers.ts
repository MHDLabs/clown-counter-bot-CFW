import type { Message } from "grammy/types";

import { and, eq, sql } from "drizzle-orm";
import { GrammyError, InlineKeyboard } from "grammy";

import type { CallbackQueryHandler, CommandHandler } from "@/handlers";
import type { BotContext } from "@/lib/bot";
import type { GroupPatch } from "@/lib/utils";

import { schema } from "@/db";
import { isAdmin } from "@/lib/bot";
import { getLegacyMediaId, getSendableMediaIds, matchesStoredMediaId } from "@/lib/file-id/storage";
import { saveGroup } from "@/lib/utils";

const MAX_PER_KIND = 3;
const MEDIA_LOCK_MS = 30_000;
const BUCKETS = ["gifIds", "stickerIds", "unclownGifIds", "unclownStickerIds"] as const;

type Bucket = (typeof BUCKETS)[number];

type Action = "clown" | "unclown";

type MediaKind = "animation" | "sticker";

interface Media {
  fileId: string;
  kind: MediaKind;
  bucket: Bucket;
}

type GroupMedia = Pick<
  typeof schema.groups.$inferSelect,
  "gifIds" | "stickerIds" | "unclownGifIds" | "unclownStickerIds"
>;

interface MediaLists {
  clownIds: string[];
  unclownIds: string[];
}

function mediaFromMessage(message: Message | undefined): Omit<Media, "bucket"> | null {
  const animation = message?.animation?.file_id;
  if (animation) return { fileId: animation, kind: "animation" };

  const sticker = message?.sticker?.file_id;
  if (sticker) return { fileId: sticker, kind: "sticker" };

  return null;
}

function bucketFor(kind: MediaKind, action: Action): Bucket {
  if (kind === "animation") {
    return action === "clown" ? "gifIds" : "unclownGifIds";
  }

  return action === "clown" ? "stickerIds" : "unclownStickerIds";
}

function valuesFor(group: GroupMedia | undefined, bucket: Bucket): string[] {
  return group?.[bucket] ?? [];
}

function hasMatch(values: readonly string[], fileId: string, legacyId: string | null): boolean {
  return values.some((storedId) => matchesStoredMediaId(storedId, fileId, legacyId));
}

function promptKeyboard(ctx: BotContext, action: Action | null): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  if (action !== "clown") keyboard.text(ctx.t("trigger_btn_clown"), "trigger:set:clown");
  if (action !== "unclown") keyboard.text(ctx.t("trigger_btn_unclown"), "trigger:set:unclown");
  if (action) keyboard.text(ctx.t("trigger_btn_remove"), "trigger:remove");
  keyboard.row().text(ctx.t("panel_close"), "panel:close:admin");
  return keyboard;
}

function promptBlocks(ctx: BotContext, kind: MediaKind, action: Action | null) {
  return {
    blocks: [
      {
        type: "paragraph" as const,
        text: ctx.t("cmd_trigger_prompt", {
          media: kind,
          state: action ?? "none",
        }),
      },
    ],
    is_rtl: ctx.locale === "fa",
  };
}

function actionFromCallback(data: string | undefined): Action | null {
  if (data === "trigger:set:clown") return "clown";
  if (data === "trigger:set:unclown") return "unclown";
  return null;
}

interface MediaUpdateInput {
  action: Action | null;
  media: Omit<Media, "bucket">;
  clownIds: string[];
  unclownIds: string[];
  legacyId: string | null;
}

function updatedMediaLists({ action, media, clownIds, unclownIds, legacyId }: MediaUpdateInput): MediaLists {
  const matches = (id: string) => matchesStoredMediaId(id, media.fileId, legacyId);
  const add = (ids: string[]) => (hasMatch(ids, media.fileId, legacyId) ? ids : [...ids, media.fileId]);
  const remove = (ids: string[]) => ids.filter((id) => !matches(id));

  if (action === "clown") {
    return { clownIds: add(clownIds), unclownIds: remove(unclownIds) };
  }

  if (action === "unclown") {
    return { clownIds: remove(clownIds), unclownIds: add(unclownIds) };
  }

  return { clownIds: remove(clownIds), unclownIds: remove(unclownIds) };
}

function mediaLimitReached(action: Action | null, alreadyExists: boolean, targetIds: string[]): boolean {
  return action !== null && !alreadyExists && targetIds.length >= MAX_PER_KIND;
}

async function ownerOrGroupAdmin(ctx: BotContext): Promise<boolean> {
  if (await isAdmin(ctx)) return true;

  await ctx.answerCallbackQuery({
    text: ctx.t("trigger_not_admin"),
    show_alert: true,
  });
  return false;
}

async function loadGroup(ctx: BotContext) {
  if (!ctx.chat) return undefined;

  return await ctx.db.query.groups.findFirst({
    columns: {
      gifIds: true,
      stickerIds: true,
      unclownGifIds: true,
      unclownStickerIds: true,
    },
    where: (fields, operators) => operators.eq(fields.id, String(ctx.chat!.id)),
  });
}

async function saveBuckets(ctx: BotContext, patch: GroupPatch) {
  if (!ctx.chat) return;

  await saveGroup(ctx.db, {
    chatId: ctx.chat.id,
    name: ctx.chat.title,
    patch,
  });
}

async function withMediaWriteLock<T>(ctx: BotContext, operation: () => Promise<T>): Promise<T> {
  if (!ctx.chat) throw new Error("A group chat is required to update custom media.");

  const key = `trigger-lock:${ctx.chat.id}`;
  const lockValue = `${Date.now() + MEDIA_LOCK_MS}:${crypto.randomUUID()}`;
  let acquired = false;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const now = Date.now();
    const result = await ctx.db.run(sql`
      INSERT INTO bot_settings (key, value) VALUES (${key}, ${lockValue})
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
      WHERE CAST(substr(bot_settings.value, 1, instr(bot_settings.value, ':') - 1) AS INTEGER) <= ${now}
    `);
    if (result.meta.changes > 0) {
      acquired = true;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 20 * (attempt + 1)));
  }

  if (!acquired) throw new Error("Custom media settings are busy; retry the action.");

  try {
    return await operation();
  } finally {
    try {
      await ctx.db
        .delete(schema.botSettings)
        .where(and(eq(schema.botSettings.key, key), eq(schema.botSettings.value, lockValue)));
    } catch {
      console.warn(`Could not release custom-media lock for group ${ctx.chat.id}.`);
    }
  }
}

export async function mediaDeleteKey(fileId: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(fileId));
  return [...new Uint8Array(digest).slice(0, 12)].map((value) => value.toString(16).padStart(2, "0")).join("");
}

async function promptTrigger(ctx: BotContext) {
  const message = ctx.msg;
  if (!message) return;
  if (!(await isAdmin(ctx))) return await ctx.replyTo(message, ctx.t("cmd_admin_only"));

  const target = message.reply_to_message;
  const media = mediaFromMessage(target);
  if (!target || !media) return await ctx.replyTo(message, ctx.t("cmd_trigger_usage", { max: MAX_PER_KIND }));

  const group = await loadGroup(ctx);
  const legacyId = getLegacyMediaId(media.fileId);
  const clownIds = valuesFor(group, bucketFor(media.kind, "clown"));
  const unclownIds = valuesFor(group, bucketFor(media.kind, "unclown"));
  const action: Action | null = hasMatch(clownIds, media.fileId, legacyId)
    ? "clown"
    : hasMatch(unclownIds, media.fileId, legacyId)
      ? "unclown"
      : null;

  return await ctx.api.sendRichMessage(message.chat.id, promptBlocks(ctx, media.kind, action), {
    reply_parameters: {
      message_id: target.message_id,
      chat_id: target.chat.id,
      allow_sending_without_reply: true,
    },
    reply_markup: promptKeyboard(ctx, action),
  });
}

interface CallbackMessageReference {
  chat: { id: number };
  message_id: number;
}

async function showMissingMedia(ctx: BotContext, message: CallbackMessageReference) {
  await ctx.answerCallbackQuery({
    text: ctx.t("trigger_gone"),
    show_alert: true,
  });

  return await ctx.editRichMessage({
    chatId: message.chat.id,
    messageId: message.message_id,
    text: ctx.t("trigger_gone"),
    options: { reply_markup: new InlineKeyboard() },
  });
}

async function persistMediaAction(
  ctx: BotContext,
  media: Omit<Media, "bucket">,
  action: Action | null,
): Promise<boolean> {
  return await withMediaWriteLock(ctx, async () => {
    const group = await loadGroup(ctx);
    const legacyId = getLegacyMediaId(media.fileId);
    const clownBucket = bucketFor(media.kind, "clown");
    const unclownBucket = bucketFor(media.kind, "unclown");
    const clownIds = getSendableMediaIds(valuesFor(group, clownBucket));
    const unclownIds = getSendableMediaIds(valuesFor(group, unclownBucket));
    const targetIds = action === "clown" ? clownIds : unclownIds;
    const alreadyExists = action !== null && hasMatch(targetIds, media.fileId, legacyId);

    if (mediaLimitReached(action, alreadyExists, targetIds)) return false;

    const next = updatedMediaLists({ action, media, clownIds, unclownIds, legacyId });
    await saveBuckets(ctx, {
      [clownBucket]: next.clownIds.length ? next.clownIds : null,
      [unclownBucket]: next.unclownIds.length ? next.unclownIds : null,
    });

    return true;
  });
}

async function closeTriggerPrompt(ctx: BotContext, message: CallbackMessageReference): Promise<void> {
  try {
    await ctx.api.deleteMessage(message.chat.id, message.message_id);
  } catch {
    try {
      await ctx.api.editMessageReplyMarkup(message.chat.id, message.message_id, { reply_markup: new InlineKeyboard() });
    } catch {
      // The previous selector may already be gone.
    }
  }
}

async function applyChoice(ctx: BotContext) {
  const callback = ctx.callbackQuery;
  if (!callback?.message || !ctx.chat) return;
  if (!(await ownerOrGroupAdmin(ctx))) return;

  const promptMessage = callback.message;
  const target = "reply_to_message" in promptMessage ? promptMessage.reply_to_message : undefined;
  const media = mediaFromMessage(target);
  if (!target || !media) return await showMissingMedia(ctx, promptMessage);

  const action = actionFromCallback(callback.data);
  const saved = await persistMediaAction(ctx, media, action);

  if (!saved) {
    return await ctx.answerCallbackQuery({
      text: ctx.t("trigger_limit", { max: MAX_PER_KIND }),
      show_alert: true,
    });
  }

  await ctx.answerCallbackQuery({ text: ctx.t(action ? "trigger_saved" : "trigger_removed") });
  await closeTriggerPrompt(ctx, promptMessage);

  return await ctx.api.sendRichMessage(promptMessage.chat.id, promptBlocks(ctx, media.kind, action), {
    reply_parameters: {
      message_id: target.message_id,
      chat_id: target.chat.id,
      allow_sending_without_reply: true,
    },
    reply_markup: promptKeyboard(ctx, action),
  });
}

export function removeStoredMediaIds(values: readonly string[], legacyId: string): string[] {
  return values.filter((storedId) => {
    const isLegacyId = storedId.length > 0 && [...storedId].every((character) => character >= "0" && character <= "9");
    const storedLegacyId = isLegacyId ? storedId : getLegacyMediaId(storedId);
    return storedLegacyId !== legacyId;
  });
}

export function listEntries(group: GroupMedia | undefined): {
  bucket: Bucket;
  kind: MediaKind;
  action: Action;
  fileId: string;
}[] {
  const entries: {
    bucket: Bucket;
    kind: MediaKind;
    action: Action;
    fileId: string;
  }[] = [];

  for (const bucket of BUCKETS) {
    for (const fileId of valuesFor(group, bucket)) {
      if (!fileId) continue;

      entries.push({
        bucket,
        kind: bucket === "stickerIds" || bucket === "unclownStickerIds" ? "sticker" : "animation",
        action: bucket.startsWith("unclown") ? "unclown" : "clown",
        fileId,
      });
    }
  }

  return entries;
}

async function deleteCallback(bucket: Bucket, fileId: string): Promise<string> {
  return `trigger:delete:${bucket}:${await mediaDeleteKey(fileId)}`;
}

function triggerListKey(chatId: number): string {
  return `trigger-list:${chatId}`;
}

async function readTrackedPreviewIds(ctx: BotContext, key: string): Promise<number[]> {
  const [row] = await ctx.db
    .select({ value: schema.botSettings.value })
    .from(schema.botSettings)
    .where(eq(schema.botSettings.key, key))
    .limit(1);
  if (!row) return [];

  try {
    const parsed: unknown = JSON.parse(row.value);
    return Array.isArray(parsed)
      ? parsed.filter((value): value is number => Number.isSafeInteger(value) && value > 0)
      : [];
  } catch {
    return [];
  }
}

async function writeTrackedPreviewIds(ctx: BotContext, key: string, ids: number[]): Promise<void> {
  if (ids.length === 0) {
    await ctx.db.delete(schema.botSettings).where(eq(schema.botSettings.key, key));
    return;
  }

  const value = JSON.stringify(ids);
  await ctx.db
    .insert(schema.botSettings)
    .values({ key, value })
    .onConflictDoUpdate({ target: schema.botSettings.key, set: { value } });
}

async function appendTrackedPreviewId(ctx: BotContext, key: string, messageId: number): Promise<void> {
  await ctx.db.run(sql`
    INSERT INTO bot_settings (key, value) VALUES (${key}, json_array(${messageId}))
    ON CONFLICT(key) DO UPDATE SET value = json_insert(
      CASE
        WHEN json_valid(bot_settings.value) AND json_type(bot_settings.value) = 'array'
          THEN bot_settings.value
        ELSE '[]'
      END,
      '$[#]',
      ${messageId}
    )
  `);
}

async function removePreviewMessage(ctx: BotContext, chatId: number, messageId: number): Promise<void> {
  try {
    await ctx.api.deleteMessage(chatId, messageId);
  } catch {
    try {
      await ctx.api.editMessageReplyMarkup(chatId, messageId, { reply_markup: new InlineKeyboard() });
    } catch {
      // A stale preview does not prevent the remaining messages from being cleaned up.
    }
  }
}

async function cleanTrackedTriggerMessages(ctx: BotContext, key: string): Promise<void> {
  if (!ctx.chat) return;
  const chatId = ctx.chat.id;
  const ids = await withMediaWriteLock(ctx, async () => {
    const tracked = await readTrackedPreviewIds(ctx, key);
    await writeTrackedPreviewIds(ctx, key, []);
    return tracked;
  });
  await Promise.all(ids.map((messageId) => removePreviewMessage(ctx, chatId, messageId)));
}

async function removeTrackedPreviewMessage(ctx: BotContext, key: string, messageId: number): Promise<void> {
  const ids = await readTrackedPreviewIds(ctx, key);
  await writeTrackedPreviewIds(
    ctx,
    key,
    ids.filter((id) => id !== messageId),
  );
}

async function sendTriggerPreview(
  ctx: BotContext,
  entry: { kind: MediaKind; fileId: string },
  keyboard: InlineKeyboard,
) {
  try {
    if (entry.kind === "animation") {
      return await ctx.replyWithAnimation(entry.fileId, { reply_markup: keyboard });
    }

    return await ctx.replyWithSticker(entry.fileId, { reply_markup: keyboard });
  } catch (error) {
    if (!(error instanceof GrammyError)) throw error;

    return await ctx.richReply(ctx.t("triggers_no_preview", { media: entry.kind }), {
      reply_markup: keyboard,
    });
  }
}

async function listTriggers(ctx: BotContext) {
  const message = ctx.msg;
  if (!message) return;
  if (!(await isAdmin(ctx))) return await ctx.replyTo(message, ctx.t("cmd_admin_only"));

  const trackingKey = triggerListKey(message.chat.id);
  await cleanTrackedTriggerMessages(ctx, trackingKey);

  const group = await loadGroup(ctx);
  const entries = listEntries(group);
  if (entries.length === 0) return await ctx.replyTo(message, ctx.t("cmd_triggers_empty"));

  for (const entry of entries) {
    const keyboard = new InlineKeyboard();
    const callbackData = await deleteCallback(entry.bucket, entry.fileId);
    keyboard.text(ctx.t("triggers_btn_delete", { action: entry.action }), callbackData);
    keyboard.text(ctx.t("panel_close"), "panel:close:admin");

    // eslint-disable-next-line no-await-in-loop -- Keep each preview beside its matching action button.
    const sent = await sendTriggerPreview(ctx, entry, keyboard);
    // Persist each successful send immediately so a later failure cannot orphan earlier previews.
    await appendTrackedPreviewId(ctx, trackingKey, sent.message_id);
  }

  const summary = await ctx.reply(ctx.t("cmd_triggers_summary", { count: entries.length }), {
    reply_markup: new InlineKeyboard()
      .text(ctx.t("triggers_btn_clear"), "trigger:clear")
      .row()
      .text(ctx.t("panel_close"), "panel:close:admin"),
  });
  await appendTrackedPreviewId(ctx, trackingKey, summary.message_id);
  return summary;
}

async function deleteListedTrigger(ctx: BotContext) {
  const callback = ctx.callbackQuery;
  const match = /^trigger:delete:(gifIds|stickerIds|unclownGifIds|unclownStickerIds):([a-f0-9]{24})$/.exec(
    callback?.data ?? "",
  );

  if (!callback?.message || !ctx.chat || !match?.[1] || !match[2]) return;
  if (!(await ownerOrGroupAdmin(ctx))) return;

  const bucket = match[1] as Bucket;
  const key = match[2];
  const removed = await withMediaWriteLock(ctx, async () => {
    const group = await loadGroup(ctx);
    const current = valuesFor(group, bucket);
    const hashes = await Promise.all(current.map((fileId) => mediaDeleteKey(fileId)));
    const updated = current.filter((_, index) => hashes[index] !== key);
    if (updated.length === current.length) return false;

    await saveBuckets(ctx, {
      [bucket]: updated.length ? updated : null,
    });
    await removeTrackedPreviewMessage(ctx, triggerListKey(callback.message!.chat.id), callback.message!.message_id);
    return true;
  });

  if (!removed) {
    return await ctx.answerCallbackQuery({
      text: ctx.t("trigger_not_found"),
      show_alert: true,
    });
  }
  await ctx.answerCallbackQuery({ text: ctx.t("trigger_removed") });

  await removePreviewMessage(ctx, callback.message.chat.id, callback.message.message_id);

  return undefined;
}

async function askClear(ctx: BotContext) {
  const callback = ctx.callbackQuery;
  if (!callback?.message || !ctx.chat || !(await ownerOrGroupAdmin(ctx))) return;

  await ctx.answerCallbackQuery();
  const keyboard = new InlineKeyboard()
    .text(ctx.t("triggers_clear_yes"), "trigger:clear:yes")
    .text(ctx.t("triggers_clear_no"), "trigger:clear:no")
    .row()
    .text(ctx.t("panel_close"), "panel:close:admin");

  return await ctx.editRichMessage({
    chatId: callback.message.chat.id,
    messageId: callback.message.message_id,
    text: ctx.t("triggers_clear_confirm"),
    options: { reply_markup: keyboard },
  });
}

async function clearTriggers(ctx: BotContext) {
  const callback = ctx.callbackQuery;
  if (!callback?.message || !ctx.chat || !(await ownerOrGroupAdmin(ctx))) return;

  const chatId = callback.message.chat.id;
  const summaryMessageId = callback.message.message_id;
  const trackingKey = triggerListKey(chatId);
  const trackedMessageIds = await withMediaWriteLock(ctx, async () => {
    const ids = await readTrackedPreviewIds(ctx, trackingKey);
    await saveBuckets(ctx, {
      gifIds: null,
      stickerIds: null,
      unclownGifIds: null,
      unclownStickerIds: null,
    });
    await writeTrackedPreviewIds(ctx, trackingKey, []);
    return ids;
  });

  await Promise.all(
    trackedMessageIds
      .filter((messageId) => messageId !== summaryMessageId)
      .map((messageId) => removePreviewMessage(ctx, chatId, messageId)),
  );
  await ctx.answerCallbackQuery({
    text: ctx.t("triggers_cleared"),
  });

  return await ctx.editRichMessage({
    chatId: callback.message.chat.id,
    messageId: callback.message.message_id,
    text: ctx.t("triggers_cleared"),
    options: { reply_markup: new InlineKeyboard().text(ctx.t("panel_close"), "panel:close:admin") },
  });
}

async function cancelClear(ctx: BotContext) {
  const callback = ctx.callbackQuery;
  if (!callback?.message || !ctx.chat || !(await ownerOrGroupAdmin(ctx))) return;

  await ctx.answerCallbackQuery();
  return await ctx.editRichMessage({
    chatId: callback.message.chat.id,
    messageId: callback.message.message_id,
    text: ctx.t("triggers_clear_cancelled"),
    options: { reply_markup: new InlineKeyboard().text(ctx.t("panel_close"), "panel:close:admin") },
  });
}

const GROUP_SCOPES = [{ type: "all_group_chats" as const }, { type: "all_chat_administrators" as const }];

export const triggerHandlers: CommandHandler[] = [
  {
    kind: "command",
    name: "trigger",
    description: "🪄 تنظیم گیف یا استیکر سفارشی",
    scopes: GROUP_SCOPES,
    handler: promptTrigger,
  },
  {
    kind: "command",
    name: "triggers",
    description: "🗂 فهرست و مدیریت رسانه‌های سفارشی",
    scopes: GROUP_SCOPES,
    handler: listTriggers,
  },
];

export const triggerCallbacks: CallbackQueryHandler[] = [
  {
    kind: "callback_query",
    data: /^trigger:set:(clown|unclown)$/,
    handler: applyChoice,
  },
  {
    kind: "callback_query",
    data: "trigger:remove",
    handler: applyChoice,
  },
  {
    kind: "callback_query",
    data: /^trigger:delete:(gifIds|stickerIds|unclownGifIds|unclownStickerIds):(\d{1,20})$/,
    handler: deleteListedTrigger,
  },
  {
    kind: "callback_query",
    data: "trigger:clear",
    handler: askClear,
  },
  {
    kind: "callback_query",
    data: "trigger:clear:yes",
    handler: clearTriggers,
  },
  {
    kind: "callback_query",
    data: "trigger:clear:no",
    handler: cancelClear,
  },
];
