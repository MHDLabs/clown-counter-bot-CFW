import { describe, expect, it } from "vitest";

import { listEntries } from "./triggers";

describe("custom media trigger list", () => {
  it("maps the four legacy D1 media arrays to their action and media types", () => {
    expect(
      listEntries({
        gifIds: ["gif-1"],
        stickerIds: ["sticker-1"],
        unclownGifIds: ["angel-gif"],
        unclownStickerIds: ["angel-sticker"],
      }),
    ).toEqual([
      { bucket: "gifIds", kind: "animation", action: "clown", fileId: "gif-1" },
      { bucket: "stickerIds", kind: "sticker", action: "clown", fileId: "sticker-1" },
      { bucket: "unclownGifIds", kind: "animation", action: "unclown", fileId: "angel-gif" },
      { bucket: "unclownStickerIds", kind: "sticker", action: "unclown", fileId: "angel-sticker" },
    ]);
  });

  it("ignores empty arrays and null group data", () => {
    expect(listEntries(undefined)).toEqual([]);
    expect(
      listEntries({
        gifIds: null,
        stickerIds: [],
        unclownGifIds: null,
        unclownStickerIds: [],
      }),
    ).toEqual([]);
  });
});
