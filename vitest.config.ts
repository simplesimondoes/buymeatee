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
    server: {
      deps: {
        // Process next-intl with Vite instead of Node's ESM resolver: its
        // build imports the extension-less "next/navigation", which Node
        // can't resolve because next ships no package.json "exports" map.
        inline: ["next-intl"],
      },
    },
  },
  resolve: {
    alias: {
      // The real "server-only" package throws outside React Server Components;
      // tests exercise server modules directly, so stub it out.
      "server-only": path.resolve(__dirname, "test/server-only-stub.ts"),
      // next ships no package.json "exports" map, so when Vitest externalizes
      // next-intl its ESM import of the extension-less "next/navigation"
      // fails under Node resolution. Point the specifier at the real file.
      "next/navigation": path.resolve(
        __dirname,
        "node_modules/next/navigation.js",
      ),
      "@": path.resolve(__dirname, "."),
    },
  },
});
