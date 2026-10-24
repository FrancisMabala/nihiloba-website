import { defineConfig } from "vitest/config";
export default defineConfig({ test: { setupFiles: ["./tests/network-isolation.setup.ts"] } });
