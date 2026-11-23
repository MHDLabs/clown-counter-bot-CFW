import { describe, expect, it, vi } from "vitest";

import type { BotContext } from "@/lib/bot";

import { adminPanelCloseHandler, ownerPanelCloseHandler, panelCloseHandler } from "./panel";

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
      message: { chat: { id: -100123, type: "supergroup" }, message_id: 55 },
    },
    chat: { id: -100123, type: "supergroup" },
    from: { id: 123, is_bot: false, first_name: "Member" },
    botAdminIds: new Set(["424242"]),
    getAuthor: vi.fn().mockResolvedValue({ status: "administrator" }),
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

  it("allows group administrators to close admin panels", async () => {
    const { ctx, deleteMessage } = createContext();
    await adminPanelCloseHandler.handler(ctx);
    expect(deleteMessage).toHaveBeenCalledExactlyOnceWith(-100123, 55);
  });

  it("does not let a regular member close an admin panel", async () => {
    const { ctx, answerCallbackQuery, deleteMessage } = createContext();
    Object.assign(ctx, { getAuthor: vi.fn().mockResolvedValue({ status: "member" }) });
    await adminPanelCloseHandler.handler(ctx);
    expect(answerCallbackQuery).toHaveBeenCalledWith({ text: "cmd_admin_only", show_alert: true });
    expect(deleteMessage).not.toHaveBeenCalled();
  });

  it("restricts owner-panel closing to configured owners in private chat", async () => {
    const { ctx, deleteMessage } = createContext();
    Object.assign(ctx, {
      chat: { id: 424242, type: "private" },
      from: { id: 424242, is_bot: false, first_name: "Owner" },
      callbackQuery: { message: { chat: { id: 424242, type: "private" }, message_id: 55 } },
    });
    await ownerPanelCloseHandler.handler(ctx);
    expect(deleteMessage).toHaveBeenCalledExactlyOnceWith(424242, 55);
  });

  it("answers callback queries even when the panel message is missing", async () => {
    const answerCallbackQuery = vi.fn().mockResolvedValue(undefined);
    const ctx = { callbackQuery: {}, answerCallbackQuery } as unknown as BotContext;

    await panelCloseHandler.handler(ctx);

    expect(answerCallbackQuery).toHaveBeenCalledExactlyOnceWith();
  });
});
