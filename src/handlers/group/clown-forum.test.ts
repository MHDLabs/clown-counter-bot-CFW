import { describe, expect, it } from "vitest";

import type { BotContext } from "@/lib/bot";

import { getData } from "./clown";

describe("forum topic service messages", () => {
  it("does not treat the topic-created service message as the voted member", () => {
    const ctx = {
      message: {
        message_id: 20,
        chat: { id: -100123, title: "Forum", type: "supergroup" },
        from: { id: 10, is_bot: false, first_name: "Voter" },
        reply_to_message: {
          message_id: 1,
          forum_topic_created: { name: "General" },
          from: { id: 11, is_bot: false, first_name: "Topic service" },
        },
      },
    } as unknown as BotContext;

    expect(getData(ctx)).toBeNull();
  });
});
