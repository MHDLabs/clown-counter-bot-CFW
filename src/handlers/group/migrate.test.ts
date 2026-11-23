import { describe, expect, it } from "vitest";

import { mergeCooldownAttempts, mergeGroupSettings } from "./migrate";

describe("group migration merge rules", () => {
  it("preserves media and settings while preferring destination values", () => {
    const source = {
      name: "Old group",
      botMemberStatus: "active" as const,
      gifIds: ["gif-a", "shared"],
      stickerIds: ["sticker-a"],
      unclownGifIds: null,
      unclownStickerIds: ["angel-a"],
      resetAt: new Date("2026-01-01T00:00:00Z"),
      cooldown: 300000,
    };
    const destination = {
      name: "New group",
      botMemberStatus: "left" as const,
      gifIds: ["shared", "gif-b"],
      stickerIds: null,
      unclownGifIds: ["angel-gif"],
      unclownStickerIds: null,
      resetAt: new Date("2026-02-01T00:00:00Z"),
      cooldown: 600000,
    };

    expect(mergeGroupSettings(source, destination, "Supergroup")).toEqual({
      name: "Supergroup",
      botMemberStatus: "active",
      gifIds: ["gif-a", "shared", "gif-b"],
      stickerIds: ["sticker-a"],
      unclownGifIds: ["angel-gif"],
      unclownStickerIds: ["angel-a"],
      resetAt: new Date("2026-02-01T00:00:00Z"),
      cooldown: 600000,
    });
  });

  it("keeps source settings when the destination has no row", () => {
    const source = {
      name: "Old group",
      botMemberStatus: "active" as const,
      gifIds: null,
      stickerIds: null,
      unclownGifIds: null,
      unclownStickerIds: null,
      resetAt: null,
      cooldown: null,
    };

    expect(mergeGroupSettings(source)).toEqual(source);
  });

  it("keeps the stricter cooldown escalation record per voter", () => {
    expect(
      mergeCooldownAttempts(
        [{ voterId: "10", attempts: 1, expiresAt: 100 }],
        [
          { voterId: "10", attempts: 3, expiresAt: 200 },
          { voterId: "11", attempts: 1, expiresAt: 150 },
        ],
      ),
    ).toEqual([
      { voterId: "10", attempts: 3, expiresAt: 200 },
      { voterId: "11", attempts: 1, expiresAt: 150 },
    ]);
  });
});
