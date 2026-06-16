import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["lib/weather/**/*.test.ts", "lib/rain/**/*.test.ts", "lib/email/**/*.test.ts"],
  },
});
