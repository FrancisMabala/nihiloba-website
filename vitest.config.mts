import {defineConfig} from "vitest/config";
import {fileURLToPath} from "node:url";

export default defineConfig({
  test: {setupFiles: ["./tests/network-isolation.setup.ts", "./tests/request-context.setup.ts"]},
  resolve: {alias: {"@": fileURLToPath(new URL(".", import.meta.url))}},
});
