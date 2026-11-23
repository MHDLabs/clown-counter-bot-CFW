import type { Message } from "grammy/types";

import { GrammyError, InlineKeyboard } from "grammy";

import type { schema } from "@/db";
import type { CallbackQueryHandler, CommandHandler } from "@/handlers";
import type { BotContext } from "@/lib/bot";
import type { GroupPatch } from "@/lib/utils";

import { isAdmin } from "@/lib/bot";
import { getLegacyMediaId, getSendableMediaIds, matchesStoredMediaId } from "@/lib/file-id/storage";
import { saveGroup } from "@/lib/utils";

const MAX_PER_KIND = 3;
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

function mediaLabel(ctx: BotContext, kind: MediaKind): string {
  return ctx.t(kind === "animation" ? "trigger_media_animation" : "trigger_media_sticker");
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
  return keyboard;
}

function promptBlocks(ctx: BotContext, kind: MediaKind, action: Action | null) {
  const state = action
    ? ctx.t(action === "clown" ? "trigger_state_clown" : "trigger_state_unclown")
    : ctx.t("trigger_state_unset");

  return {
    blocks: [
      {
        type: "paragraph" as const,
        text: ctx.t("cmd_trigger_prompt", {
          media: mediaLabel(ctx, kind),
          state,
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

function displayAction(ctx: BotContext, action: Action | null): string {
  if (action === "clown") return ctx.t("trigger_state_clown");
  if (action === "unclown") return ctx.t("trigger_state_unclown");
  return ctx.t("trigger_state_unset");
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

async function promptTrigger(ctx: BotContext) {
  const message = ctx.msg;
  if (!message) return;
  if (!(await isAdmin(ctx))) return await ctx.replyTo(message, ctx.t("cmd_admin_only"));

  const target = message.reply_to_message;
  const media = mediaFromMessage(target);
  if (!target || !media) return await ctx.replyTo(message, ctx.t("cmd_trigger_usage"));

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
    text: ctx.t("trigger_missing_media"),
    show_alert: true,
  });

  return await ctx.editRichMessage({
    chatId: message.chat.id,
    messageId: message.message_id,
    text: ctx.t("trigger_missing_media"),
    options: { reply_markup: new InlineKeyboard() },
  });
}

async function applyChoice(ctx: BotContext) {
  const callback = ctx.callbackQuery;
  if (!callback?.message || !ctx.chat || !(await ownerOrGroupAdmin(ctx))) return;

  const promptMessage = callback.message;
  const target = "reply_to_message" in promptMessage ? promptMessage.reply_to_message : undefined;
  const media = mediaFromMessage(target);
  if (!media) return await showMissingMedia(ctx, promptMessage);

  const action = actionFromCallback(callback.data);
  const group = await loadGroup(ctx);
  const legacyId = getLegacyMediaId(media.fileId);
  const clownBucket = bucketFor(media.kind, "clown");
  const unclownBucket = bucketFor(media.kind, "unclown");
  const clownIds = getSendableMediaIds(valuesFor(group, clownBucket));
  const unclownIds = getSendableMediaIds(valuesFor(group, unclownBucket));
  const targetIds = action === "clown" ? clownIds : unclownIds;
  const alreadyExists = action !== null && hasMatch(targetIds, media.fileId, legacyId);

  if (mediaLimitReached(action, alreadyExists, targetIds)) {
    return await ctx.answerCallbackQuery({
      text: ctx.t("trigger_limit", { max: MAX_PER_KIND }),
      show_alert: true,
    });
  }

  const next = updatedMediaLists({
    action,
    media,
    clownIds,
    unclownIds,
    legacyId,
  });
  await saveBuckets(ctx, {
    [clownBucket]: next.clownIds.length ? next.clownIds : null,
    [unclownBucket]: next.unclownIds.length ? next.unclownIds : null,
  });

  await ctx.answerCallbackQuery({
    text: ctx.t(action ? "trigger_saved" : "trigger_removed"),
  });

  return await ctx.editRichMessage({
    chatId: promptMessage.chat.id,
    messageId: promptMessage.message_id,
    text: ctx.t("cmd_trigger_prompt", {
      media: mediaLabel(ctx, media.kind),
      state: displayAction(ctx, action),
    }),
    options: { reply_markup: promptKeyboard(ctx, action) },
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

function deleteCallback(bucket: Bucket, fileId: string): string | null {
  const key = /^\d+$/.test(fileId) ? fileId : getLegacyMediaId(fileId);
  return key ? `trigger:delete:${bucket}:${key}` : null;
}

async function listTriggers(ctx: BotContext) {
  const message = ctx.msg;
  if (!message) return;
  if (!(await isAdmin(ctx))) return await ctx.replyTo(message, ctx.t("cmd_admin_only"));

  const group = await loadGroup(ctx);
  const entries = listEntries(group);
  if (entries.length === 0) return await ctx.replyTo(message, ctx.t("cmd_triggers_empty"));

  for (const entry of entries) {
    const callbackData = deleteCallback(entry.bucket, entry.fileId);
    const keyboard = new InlineKeyboard();
    if (callbackData) keyboard.text(ctx.t("trigger_btn_delete"), callbackData);

    try {
      if (entry.kind === "animation") {
        // eslint-disable-next-line no-await-in-loop -- Keep the media list in a stable order.
        await ctx.replyWithAnimation(entry.fileId, { reply_markup: keyboard });
      } else {
        // eslint-disable-next-line no-await-in-loop -- Keep the media list in a stable order.
        await ctx.replyWithSticker(entry.fileId, { reply_markup: keyboard });
      }
    } catch (error) {
      if (!(error instanceof GrammyError)) throw error;

      // eslint-disable-next-line no-await-in-loop -- Keep fallback entries beside their media.
      await ctx.richReply(ctx.t("trigger_stale_media", { media: mediaLabel(ctx, entry.kind) }), {
        reply_markup: keyboard,
      });
    }
  }

  return await ctx.reply(ctx.t("cmd_triggers_summary", { count: entries.length }), {
    reply_markup: new InlineKeyboard().text(ctx.t("trigger_btn_clear"), "trigger:clear"),
  });
}

async function deleteListedTrigger(ctx: BotContext) {
  const callback = ctx.callbackQuery;
  const match = /^trigger:delete:(gifIds|stickerIds|unclownGifIds|unclownStickerIds):(\d{1,20})$/.exec(
    callback?.data ?? "",
  );

  if (!callback?.message || !ctx.chat || !match?.[1] || !match[2]) return;
  if (!(await ownerOrGroupAdmin(ctx))) return;

  const bucket = match[1] as Bucket;
  const legacyId = match[2];
  const group = await loadGroup(ctx);
  const current = valuesFor(group, bucket);
  const updated = current.filter((storedId) => !matchesStoredMediaId(storedId, "", legacyId));

  if (updated.length === current.length) {
    return await ctx.answerCallbackQuery({
      text: ctx.t("trigger_not_found"),
      show_alert: true,
    });
  }

  await saveBuckets(ctx, {
    [bucket]: updated.length ? updated : null,
  });
  await ctx.answerCallbackQuery({ text: ctx.t("trigger_removed") });

  try {
    await ctx.api.deleteMessage(callback.message.chat.id, callback.message.message_id);
  } catch {
    await ctx.editRichMessage({
      chatId: callback.message.chat.id,
      messageId: callback.message.message_id,
      text: ctx.t("trigger_removed"),
      options: { reply_markup: new InlineKeyboard() },
    });
  }

  return undefined;
}

async function askClear(ctx: BotContext) {
  const callback = ctx.callbackQuery;
  if (!callback?.message || !ctx.chat || !(await ownerOrGroupAdmin(ctx))) return;

  await ctx.answerCallbackQuery();
  const keyboard = new InlineKeyboard()
    .text(ctx.t("trigger_clear_yes"), "trigger:clear:yes")
    .text(ctx.t("trigger_clear_no"), "trigger:clear:no");

  return await ctx.editRichMessage({
    chatId: callback.message.chat.id,
    messageId: callback.message.message_id,
    text: ctx.t("trigger_clear_confirm"),
    options: { reply_markup: keyboard },
  });
}

async function clearTriggers(ctx: BotContext) {
  const callback = ctx.callbackQuery;
  if (!callback?.message || !ctx.chat || !(await ownerOrGroupAdmin(ctx))) return;

  await saveBuckets(ctx, {
    gifIds: null,
    stickerIds: null,
    unclownGifIds: null,
    unclownStickerIds: null,
  });
  await ctx.answerCallbackQuery({
    text: ctx.t("trigger_cleared"),
  });

  return await ctx.editRichMessage({
    chatId: callback.message.chat.id,
    messageId: callback.message.message_id,
    text: ctx.t("trigger_cleared"),
    options: { reply_markup: new InlineKeyboard() },
  });
}

async function cancelClear(ctx: BotContext) {
  const callback = ctx.callbackQuery;
  if (!callback?.message || !ctx.chat || !(await ownerOrGroupAdmin(ctx))) return;

  await ctx.answerCallbackQuery();
  return await ctx.editRichMessage({
    chatId: callback.message.chat.id,
    messageId: callback.message.message_id,
    text: ctx.t("trigger_clear_cancelled"),
    options: { reply_markup: new InlineKeyboard() },
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
