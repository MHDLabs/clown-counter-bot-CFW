import { describe, expect, it } from "vitest";

import type { BotContext } from "@/lib/bot";

import { isClownCall } from "@/handlers/group/clown-filter";

import { parseFileId } from "./index";

function syntheticFileId(): string {
  const data = new Uint8Array(26);
  const view = new DataView(data.buffer);
  view.setUint32(0, 5, true); // document
  view.setUint32(4, 4, true); // dc id
  view.setBigInt64(8, 9007199254740995n, true);
  view.setBigInt64(16, 123456789n, true);
  data[24] = 1; // sub-version
  data[25] = 4; // version
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
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/[=]+$/g, "");
}

const fileId = syntheticFileId();
const parsedId = "9007199254740995";

describe("Workers-safe Telegram file IDs", () => {
  it("parses a 64-bit document ID without Node Buffer APIs", () => {
    const parsed = parseFileId(fileId);

    expect(parsed.kind).toBe("document");
    expect(parsed.id).toBe(9007199254740995n);
    expect(parsed.typeDetailed).toBe("document");
  });

  it.each([
    [{ gifIds: [parsedId], stickerIds: null, unclownGifIds: null, unclownStickerIds: null }, "animation", "clown"],
    [{ gifIds: null, stickerIds: null, unclownGifIds: null, unclownStickerIds: [parsedId] }, "sticker", "unclown"],
  ] as const)("matches configured media and dispatches %s", async (settings, kind, expected) => {
    const message = kind === "animation" ? { animation: { file_id: fileId } } : { sticker: { file_id: fileId } };
    const ctx = {
      msg: { ...message },
      chat: { id: -123 },
      db: { query: { groups: { findFirst: async () => settings } } },
    } as unknown as BotContext;
    await isClownCall(ctx, async () => {});

    expect(ctx.clownCall).toBe(expected);
  });
});
