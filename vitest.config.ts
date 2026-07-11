import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    // Globals enable React Testing Library's automatic DOM cleanup between tests.
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["node_modules", ".next"],
  },
  resolve: {
    alias: {
      // The real "server-only" package throws outside React Server Components;
      // tests exercise server modules directly, so stub it out.
      "server-only": path.resolve(__dirname, "test/server-only-stub.ts"),
      "@": path.resolve(__dirname, "."),
    },
  },
});
