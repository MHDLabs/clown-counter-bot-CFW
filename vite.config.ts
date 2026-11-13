import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  plugins: [
    {
      name: "fluent-text",
      enforce: "pre",
      transform(code, id) {
        if (id.endsWith(".ftl")) return { code: `export default ${JSON.stringify(code)}`, map: null };
        return null;
      },
    },
  ],
  test: { environment: "node" },
});
