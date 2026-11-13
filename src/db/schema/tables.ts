import * as t from "drizzle-orm/sqlite-core";

// Decimal text preserves the full precision of Telegram's 64-bit identifiers.
const telegramId = () => t.text();
const stringArray = () => t.text({ mode: "json" }).$type<string[]>();

export const users = t.sqliteTable("users", {
  id: telegramId().primaryKey(),
  name: t.text().notNull(),
});

export const groups = t.sqliteTable("groups", {
  id: telegramId().primaryKey(),
  name: t.text(),
  gifIds: stringArray(),
  stickerIds: stringArray(),
  unclownGifIds: stringArray(),
  unclownStickerIds: stringArray(),
  resetAt: t.integer({ mode: "timestamp_ms" }),
  cooldown: t.integer(),
});

export const clownVotes = t.sqliteTable(
  "clown_votes",
  {
    id: t.integer().primaryKey({ autoIncrement: true }),
    voterId: telegramId().references(() => users.id),
    clownId: telegramId()
      .notNull()
      .references(() => users.id),
    groupId: telegramId()
      .notNull()
      .references(() => groups.id),
    votedAt: t
      .integer({ mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    quantity: t.integer().notNull().default(1),
  },
  (table) => [
    t.index("clown_votes_group_voter_idx").on(table.groupId, table.voterId, table.votedAt),
    t.index("clown_votes_group_idx").on(table.groupId),
  ],
);
