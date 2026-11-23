import { describe, expect, it } from "vitest";

import { listEntries, removeStoredMediaIds } from "./triggers";

function syntheticFileId(): string {
  const data = new Uint8Array(26);
  const view = new DataView(data.buffer);
  view.setUint32(0, 5, true);
  view.setUint32(4, 4, true);
  view.setBigInt64(8, 9007199254740995n, true);
  view.setBigInt64(16, 123456789n, true);
  data[24] = 1;
  data[25] = 4;

  const packed: number[] = [];
  for (let i = 0; i < data.length;) {
    if (data[i] !== 0) {
      packed.push(data[i]!);
      i += 1;
      continue;
    }

    let end = i + 1;
    while (end < data.length && data[end] === 0 && end - i < 255) end += 1;
    packed.push(0, end - i);
    i = end;
  }

  return btoa(String.fromCharCode(...packed))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/[=]+$/g, "");
}

describe("custom media trigger list", () => {
  it("removes both current file IDs and legacy numeric IDs by Telegram media ID", () => {
    const fileId = syntheticFileId();

    expect(removeStoredMediaIds([fileId, "9007199254740995", "another-id"], "9007199254740995")).toEqual([
      "another-id",
    ]);
  });

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
