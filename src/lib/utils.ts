import type { AppDb } from "@/db";

import { schema } from "@/db";

export type GroupPatch = Partial<Omit<typeof schema.groups.$inferInsert, "id" | "name">>;

export async function saveGroup(
  db: AppDb,
  group: { chatId: number; name: string | undefined; patch: GroupPatch },
): Promise<void> {
  const { chatId, name, patch } = group;
  await db
    .insert(schema.groups)
    .values({ id: String(chatId), name, ...patch })
    .onConflictDoUpdate({
      target: schema.groups.id,
      set: patch,
    });
}
