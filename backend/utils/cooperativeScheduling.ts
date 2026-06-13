/**
 * Cooperative scheduling utilities for sensor-heavy lab activities.
 * Yields to the event loop between chunks so the UI thread stays responsive.
 */

export async function processInChunks<T, R>(
  items: T[],
  processFn: (item: T, index: number) => R,
  chunkSize = 50,
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const chunkResults = chunk.map((item, idx) => processFn(item, i + idx));
    results.push(...chunkResults);
    await yieldToEventLoop();
  }

  return results;
}

export async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  concurrency = 4,
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let nextIndex = 0;

  const worker = async () => {
    while (nextIndex < tasks.length) {
      const idx = nextIndex++;
      results[idx] = await tasks[idx]();
    }
  };

  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker());
  await Promise.all(workers);

  return results;
}

export function createBatchProcessor<T>(
  processBatch: (items: T[]) => void,
  intervalMs = 200,
) {
  let buffer: T[] = [];
  let timer: ReturnType<typeof setInterval> | null = null;

  const flush = () => {
    if (buffer.length === 0) return;
    const batch = buffer;
    buffer = [];
    processBatch(batch);
  };

  const start = () => {
    if (timer) return;
    timer = setInterval(flush, intervalMs);
  };

  const stop = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    flush();
  };

  const push = (item: T) => {
    buffer.push(item);
    if (!timer) start();
  };

  return { push, flush, stop, start };
}

export function yieldToEventLoop(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

export async function measureAsync<T>(fn: () => Promise<T>): Promise<{ result: T; durationMs: number }> {
  const start = performance.now();
  const result = await fn();
  const durationMs = performance.now() - start;
  return { result, durationMs };
}
