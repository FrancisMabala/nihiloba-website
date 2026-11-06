import { expect, it, vi } from "vitest";
import { Socket } from "node:net";

it("blocks unmocked fetch and sockets after mock restoration", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response("fixture")));
  expect(await (await fetch("https://example.invalid")).text()).toBe("fixture");
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  await expect(fetch("https://example.invalid")).rejects.toThrow("Real fetch is disabled");
  expect(() => new Socket().connect(9, "127.0.0.1")).toThrow("Real sockets are disabled");
});
