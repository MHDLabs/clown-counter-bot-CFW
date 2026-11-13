import { drizzle } from "drizzle-orm/d1";

import * as schema from "./schema";

export type D1Database = globalThis.D1Database;

export function createDb(binding: D1Database) {
  return drizzle(binding, { casing: "snake_case", schema });
}

export type AppDb = ReturnType<typeof createDb>;
export { schema };
