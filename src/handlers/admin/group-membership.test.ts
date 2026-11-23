import { describe, expect, it, vi } from "vitest";

import type { BotContext } from "@/lib/bot";

import { schema } from "@/db";

import { groupMembershipHandler } from "./group-membership";

function contextFor(update: {
  chat: { id: number; type: string; title?: string };
  new_chat_member: { status: string; is_member?: boolean };
}) {
  const values = vi.fn((row: unknown) => ({
    onConflictDoUpdate: vi.fn().mockResolvedValue(row),
  }));
  const insert = vi.fn(() => ({ values }));
  const select = vi.fn(() => {
    const query = {
      from: () => query,
      where: () => query,
      limit: vi.fn().mockResolvedValue([]),
    };
    return query;
  });
  const ctx = { myChatMember: update, db: { insert, select } } as unknown as BotContext;
  return { ctx, insert, values };
}

describe("group membership tracking", () => {
  it("records a newly active supergroup membership", async () => {
    const { ctx, insert, values } = contextFor({
      chat: { id: -100123, type: "supergroup", title: "Study group" },
      new_chat_member: { status: "member" },
    });

    await groupMembershipHandler.handler(ctx, vi.fn());

    expect(insert).toHaveBeenCalledExactlyOnceWith(schema.groups);
    expect(values).toHaveBeenCalledWith({ id: "-100123", name: "Study group", botMemberStatus: "active" });
  });

  it("records a removal without producing a public reply", async () => {
    const { ctx, values } = contextFor({
      chat: { id: -100123, type: "group", title: "Study group" },
      new_chat_member: { status: "kicked" },
    });

    await groupMembershipHandler.handler(ctx, vi.fn());

    expect(values).toHaveBeenCalledWith({ id: "-100123", name: "Study group", botMemberStatus: "kicked" });
  });

  it("ignores private-chat membership updates", async () => {
    const { ctx, insert } = contextFor({
      chat: { id: 424242, type: "private", title: "Private" },
      new_chat_member: { status: "member" },
    });

    await groupMembershipHandler.handler(ctx, vi.fn());

    expect(insert).not.toHaveBeenCalled();
  });
});
