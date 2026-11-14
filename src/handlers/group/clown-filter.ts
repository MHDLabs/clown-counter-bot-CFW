import type { MiddlewareFn } from "grammy";

import type { BotContext, ClownCall } from "@/lib/bot";

import { getLegacyMediaId, isLegacyMediaId, matchesStoredMediaId } from "@/lib/file-id/storage";

const clownTexts = ["🤡", "دلقک"];
const unclownTexts = ["😇", "ستون", "آدم عاقل"];

const MEDIA_COLUMNS = { gifIds: true, stickerIds: true, unclownGifIds: true, unclownStickerIds: true } as const;

type GroupMedia = Record<keyof typeof MEDIA_COLUMNS, string[] | null>;

function matchText(text: string | undefined): ClownCall | null {
  if (clownTexts.includes(text ?? "")) return "clown";
  if (unclownTexts.includes(text ?? "")) return "unclown";
  return null;
}

function matchMedia(group: GroupMedia, fileId: string, legacyId: string | null): ClownCall | null {
  const matches = (ids: string[] | null) =>
    ids?.some((storedId) => matchesStoredMediaId(storedId, fileId, legacyId)) ?? false;

  if (matches(group.gifIds) || matches(group.stickerIds)) return "clown";
  if (matches(group.unclownGifIds) || matches(group.unclownStickerIds)) return "unclown";
  return null;
}

function hasLegacyMediaIds(group: GroupMedia): boolean {
  return [
    ...(group.gifIds ?? []),
    ...(group.stickerIds ?? []),
    ...(group.unclownGifIds ?? []),
    ...(group.unclownStickerIds ?? []),
  ].some(isLegacyMediaId);
}

async function matchMediaCall(ctx: BotContext): Promise<ClownCall | null> {
  const fileId = ctx.msg?.animation?.file_id ?? ctx.msg?.sticker?.file_id;

  const chatId = ctx.chat?.id;
  if (!fileId || !chatId) return null;

  const group = await ctx.db.query.groups.findFirst({
    columns: MEDIA_COLUMNS,
    where: (f, o) => o.eq(f.id, String(chatId)),
  });

  if (!group) return null;

  const legacyId = hasLegacyMediaIds(group) ? getLegacyMediaId(fileId) : null;

  return matchMedia(group, fileId, legacyId);
}

/** Matcher for the 🤡/دلقک flow: sets `ctx.clownCall` and continues, or stops the chain. */
export const isClownCall: MiddlewareFn<BotContext> = async (ctx, next) => {
  if (!ctx.msg || !ctx.chat) return null;

  const call = matchText(ctx.msg.text) ?? (await matchMediaCall(ctx));

  if (!call) return null;

  // False positive: each grammY update gets a fresh ctx; there is no shared mutable state.
  // eslint-disable-next-line require-atomic-updates
  ctx.clownCall = call;

  return await next();
};
