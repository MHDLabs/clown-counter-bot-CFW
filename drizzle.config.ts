import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema/",
  out: "./drizzle",
  casing: "snake_case",
  strict: true,
  dbCredentials: { url: "file:local.db" },
});
