import { describe, expect, it, vi } from "vitest";

import type { BotContext } from "@/lib/bot";

import { clownMediaHandlers } from "./clown-media";

const chatId = -100123456789;
const message = { message_id: 15, chat: { id: chatId, type: "supergroup" } };
const validTelegramFileId = "AgACAgQAAxkBAAIBY2VydGlmaWVkLWZpbGUtaWQ";

function createContext(gifIds: string[]) {
  const sendAnimation = vi.fn();
  const replyTo = vi.fn().mockResolvedValue(undefined);
  const ctx = {
    msg: message,
    chat: { id: chatId, type: "supergroup" },
    db: {
      query: {
        groups: {
          findFirst: vi.fn().mockResolvedValue({ gifIds }),
        },
      },
    },
    api: { sendAnimation, sendSticker: vi.fn() },
    replyTo,
    t: (key: string) => key,
  } as unknown as BotContext;

  return { ctx, sendAnimation, replyTo };
}

describe("clown media sending", () => {
  const handler = clownMediaHandlers.find((item) => item.name === "clowngifs");
  if (!handler) throw new Error("clowngifs handler is missing");

  it("sends the complete Telegram file_id and skips legacy numeric IDs", async () => {
    const { ctx, sendAnimation, replyTo } = createContext(["9007199254740995", validTelegramFileId]);
    sendAnimation.mockResolvedValue({});

    await handler.handler(ctx);

    expect(sendAnimation).toHaveBeenCalledOnce();
    expect(sendAnimation).toHaveBeenCalledWith(chatId, validTelegramFileId);
    expect(replyTo).not.toHaveBeenCalled();
  });

  it("explains how to repair legacy records without sending invalid numeric IDs", async () => {
    const { ctx, sendAnimation, replyTo } = createContext(["9007199254740995"]);

    await handler.handler(ctx);

    expect(sendAnimation).not.toHaveBeenCalled();
    expect(replyTo).toHaveBeenCalledWith(message, "cmd_clown_media_legacy");
  });

  it("contains Telegram send failures instead of rejecting the webhook handler", async () => {
    const { ctx, sendAnimation, replyTo } = createContext([validTelegramFileId]);
    sendAnimation.mockRejectedValue(new Error("wrong remote file identifier"));

    await expect(handler.handler(ctx)).resolves.toBeUndefined();

    expect(sendAnimation).toHaveBeenCalledWith(chatId, validTelegramFileId);
    expect(replyTo).toHaveBeenCalledWith(message, "cmd_clown_media_send_failed");
  });
});
