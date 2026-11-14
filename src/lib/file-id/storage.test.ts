import { describe, expect, it } from "vitest";

import {
  getSendableMediaIds,
  isLegacyMediaId,
  matchesStoredMediaId,
} from "./storage";

describe("Telegram media ID storage compatibility", () => {
  const telegramFileId = "AgACAgQAAxkBAAIBY2VydGlmaWVkLWZpbGUtaWQ";

  it("distinguishes legacy numeric parser IDs from opaque Telegram file IDs", () => {
    expect(isLegacyMediaId("9007199254740995")).toBe(true);
    expect(isLegacyMediaId(telegramFileId)).toBe(false);
  });

  it("never returns legacy numeric IDs as Telegram-sendable media", () => {
    expect(getSendableMediaIds(["9007199254740995", telegramFileId])).toEqual([telegramFileId]);
  });

  it("matches newly stored media by its complete Telegram file_id", () => {
    expect(matchesStoredMediaId(telegramFileId, telegramFileId, null)).toBe(true);
    expect(matchesStoredMediaId("another-file-id", telegramFileId, null)).toBe(false);
  });

  it("continues matching old numeric records for existing group media reactions", () => {
    expect(matchesStoredMediaId("9007199254740995", telegramFileId, "9007199254740995")).toBe(true);
    expect(matchesStoredMediaId("123", telegramFileId, "9007199254740995")).toBe(false);
  });
});
