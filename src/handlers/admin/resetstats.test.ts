import { describe, expect, it, vi } from "vitest";

import type { BotContext } from "@/lib/bot";

import { resetStatsCallbacks } from "./resetstats";

function createCallbackContext(status: string) {
  const answerCallbackQuery = vi.fn().mockResolvedValue(true);
  const editRichMessage = vi.fn().mockResolvedValue(true);
  const ctx = {
    chat: { id: -100123, type: "supergroup" },
    from: { id: 123, is_bot: false, first_name: "Member" },
    callbackQuery: {
      id: "cancel",
      data: "resetstats:no",
      message: { message_id: 5, chat: { id: -100123, type: "supergroup" } },
    },
    answerCallbackQuery,
    editRichMessage,
    getAuthor: vi.fn().mockResolvedValue({ status }),
  } as unknown as BotContext;

  return { ctx, answerCallbackQuery, editRichMessage };
}

describe("reset statistics cancellation", () => {
  it("does not let a regular member cancel an administrator's reset prompt", async () => {
    const { ctx, answerCallbackQuery, editRichMessage } = createCallbackContext("member");

    await resetStatsCallbacks[1]!.handler(ctx);

    expect(answerCallbackQuery).toHaveBeenCalledWith({
      text: "cmd_resetstats_not_admin",
      show_alert: true,
    });
    expect(editRichMessage).not.toHaveBeenCalled();
  });

  it("allows a group administrator to cancel the prompt", async () => {
    const { ctx, answerCallbackQuery, editRichMessage } = createCallbackContext("administrator");

    await resetStatsCallbacks[1]!.handler(ctx);

    expect(answerCallbackQuery).toHaveBeenCalledExactlyOnceWith();
    expect(editRichMessage).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ text: "cmd_resetstats_cancelled" }),
    );
  });
});
