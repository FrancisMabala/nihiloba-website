export class CartMutationQueue {
  private queue: Promise<unknown> = Promise.resolve();
  private duplicates = new Map<string, Promise<unknown>>();

  run<T>(key: string | null, operation: () => Promise<T>): Promise<T> {
    if (key) {
      const existing = this.duplicates.get(key);
      if (existing) return existing as Promise<T>;
    }
    const result = this.queue.then(operation, operation);
    this.queue = result.then(() => undefined, () => undefined);
    if (key) {
      this.duplicates.set(key, result);
      void result.then(() => this.duplicates.delete(key), () => this.duplicates.delete(key));
    }
    return result;
  }
}
