import { describe, expect, it, vi } from "vitest";

import type { BotContext } from "..";

import { updateDeduplicationMiddleware } from "./update-deduplication";

function createContext(changes: number[], existing?: { status: "processing" | "processed"; updatedAt: number }) {
  const run = vi.fn(async () => ({ meta: { changes: changes.shift() ?? 0 } }));
  const findFirst = vi.fn().mockResolvedValue(existing);
  const where = vi.fn().mockResolvedValue(undefined);
  const set = vi.fn(() => ({ where }));
  const update = vi.fn(() => ({ set }));
  const deleteWhere = vi.fn().mockResolvedValue(undefined);
  const deleteQuery = vi.fn(() => ({ where: deleteWhere }));
  const db = { run, update, delete: deleteQuery, query: { webhookUpdates: { findFirst } } };
  const ctx = { update: { update_id: 1234 }, db } as unknown as BotContext;
  return { ctx, run, update, deleteQuery, findFirst };
}

describe("Telegram webhook update deduplication", () => {
  it("runs an update once and marks it processed", async () => {
    const { ctx, run, update } = createContext([1]);
    const next = vi.fn().mockResolvedValue(undefined);

    await updateDeduplicationMiddleware()(ctx, next);

    expect(run).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledOnce();
    expect(update).toHaveBeenCalledOnce();
  });

  it("acknowledges an update already processed", async () => {
    const { ctx, findFirst } = createContext([0], { status: "processed", updatedAt: Date.now() });
    const next = vi.fn().mockResolvedValue(undefined);

    await updateDeduplicationMiddleware()(ctx, next);

    expect(findFirst).toHaveBeenCalledOnce();
    expect(next).not.toHaveBeenCalled();
  });

  it("returns a retryable error while an update is actively processing", async () => {
    const { ctx } = createContext([0], { status: "processing", updatedAt: Date.now() });
    const next = vi.fn().mockResolvedValue(undefined);

    await expect(updateDeduplicationMiddleware()(ctx, next)).rejects.toThrow("already processing");
    expect(next).not.toHaveBeenCalled();
  });

  it("releases a failed claim so Telegram can retry the update", async () => {
    const { ctx, deleteQuery, update } = createContext([1]);
    const next = vi.fn().mockRejectedValue(new Error("temporary D1 failure"));

    await expect(updateDeduplicationMiddleware()(ctx, next)).rejects.toThrow("temporary D1 failure");

    expect(deleteQuery).toHaveBeenCalledOnce();
    expect(update).not.toHaveBeenCalled();
  });
});
