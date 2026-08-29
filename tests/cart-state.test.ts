import { describe, expect, it, vi } from "vitest";
import { CartMutationQueue } from "../app/services/shida/cart-mutation-queue";

describe("cart mutation coordination", () => {
  it("deduplicates concurrent identical add clicks", async () => {
    const queue = new CartMutationQueue(); const operation = vi.fn(async () => "cart");
    const [first, second] = await Promise.all([queue.run("WNP:A", operation), queue.run("WNP:A", operation)]);
    expect(first).toBe("cart"); expect(second).toBe("cart"); expect(operation).toHaveBeenCalledTimes(1);
  });

  it("serializes different mutations so each can use the latest cart version", async () => {
    const queue = new CartMutationQueue(); const order: string[] = [];
    const first = queue.run(null, async () => { order.push("first-start"); await Promise.resolve(); order.push("first-end"); });
    const second = queue.run(null, async () => { order.push("second"); });
    await Promise.all([first, second]); expect(order).toEqual(["first-start", "first-end", "second"]);
  });
});
