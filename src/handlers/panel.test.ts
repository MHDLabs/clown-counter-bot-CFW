import { describe, expect, it, vi } from "vitest";

import type { BotContext } from "@/lib/bot";

import { panelCloseHandler } from "./panel";

function createContext(options: { deleteFails?: boolean; markupFails?: boolean } = {}) {
  const answerCallbackQuery = vi.fn().mockResolvedValue(undefined);
  const deleteMessage = vi.fn().mockImplementation(async () => {
    if (options.deleteFails) throw new Error("message cannot be deleted");
  });
  const editMessageReplyMarkup = vi.fn().mockImplementation(async () => {
    if (options.markupFails) throw new Error("message is inaccessible");
  });
  const ctx = {
    callbackQuery: {
      message: { chat: { id: -100123 }, message_id: 55 },
    },
    answerCallbackQuery,
    api: { deleteMessage, editMessageReplyMarkup },
  } as unknown as BotContext;

  return { ctx, answerCallbackQuery, deleteMessage, editMessageReplyMarkup };
}

describe("interactive panel closing", () => {
  it("deletes the panel message", async () => {
    const { ctx, answerCallbackQuery, deleteMessage, editMessageReplyMarkup } = createContext();

    await panelCloseHandler.handler(ctx);

    expect(answerCallbackQuery).toHaveBeenCalledExactlyOnceWith();
    expect(deleteMessage).toHaveBeenCalledExactlyOnceWith(-100123, 55);
    expect(editMessageReplyMarkup).not.toHaveBeenCalled();
  });

  it("removes inline buttons when Telegram refuses to delete the message", async () => {
    const { ctx, deleteMessage, editMessageReplyMarkup } = createContext({ deleteFails: true });

    await panelCloseHandler.handler(ctx);

    expect(deleteMessage).toHaveBeenCalledExactlyOnceWith(-100123, 55);
    expect(editMessageReplyMarkup).toHaveBeenCalledExactlyOnceWith(
      -100123,
      55,
      expect.objectContaining({ reply_markup: expect.any(Object) }),
    );
  });

  it("contains errors when the message is already inaccessible", async () => {
    const { ctx, answerCallbackQuery } = createContext({ deleteFails: true, markupFails: true });

    await expect(panelCloseHandler.handler(ctx)).resolves.toBeUndefined();
    expect(answerCallbackQuery).toHaveBeenCalledExactlyOnceWith();
  });

  it("answers callback queries even when the panel message is missing", async () => {
    const answerCallbackQuery = vi.fn().mockResolvedValue(undefined);
    const ctx = { callbackQuery: {}, answerCallbackQuery } as unknown as BotContext;

    await panelCloseHandler.handler(ctx);

    expect(answerCallbackQuery).toHaveBeenCalledExactlyOnceWith();
  });
});
