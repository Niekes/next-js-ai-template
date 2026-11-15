import path from "path";
import { defineConfig } from "vite-plus";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    // ArchUnitTS extends the Vitest expect matcher at import time.
    globals: true,
    // Component tests opt into jsdom per file with `// @vitest-environment jsdom`.
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx", "scripts/**/*.test.ts"],
    // Enabled via --coverage so local `pnpm test` stays fast.
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "json"],
      include: ["src/**/*.{ts,tsx}"],
      // The only excludes; src/lib/architecture/coverage-gate.test.ts fails if this list changes.
      // src/components/ui/ is shadcn CLI output, never hand-edited.
      exclude: ["**/*.test.*", "**/*.d.ts", "src/components/ui/**"],
      // Every file at 100% on every metric. Cover new code with a test; never lower this.
      thresholds: { 100: true },
    },
  },
});
