/**
 * Parallel Processing Service
 * Prevents long-running lab statistics calculations from freezing the UI thread
 * by chunking work into microtasks that yield back to the event loop.
 *
 * Since React Native doesn't natively support Web Workers on mobile,
 * we use cooperative scheduling (chunked async iteration) to maintain 60fps.
 */

/**
 * Process an array in chunks, yielding to the event loop between each chunk.
 * This prevents the JS thread from blocking and keeps the UI responsive.
 *
 * @param items - Full array of items to process
 * @param processFn - Synchronous processing function applied to each item
 * @param chunkSize - Number of items per chunk (default 50)
 * @returns Promise resolving to the array of processed results
 *
 * Usage:
 *   const results = await processInChunks(sensorReadings, (r) => computeStats(r), 100);
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

    // Yield to the event loop so UI stays responsive
    await yieldToEventLoop();
  }

  return results;
}

/**
 * Run multiple independent async operations concurrently with a concurrency limit.
 * Prevents overwhelming the device with too many parallel promises.
 *
 * @param tasks - Array of functions that return promises
 * @param concurrency - Max simultaneous tasks (default 4)
 * @returns Promise resolving to all results in order
 *
 * Usage:
 *   const uploads = await runWithConcurrency(
 *     videoFiles.map(f => () => uploadVideo(f)),
 *     3
 *   );
 */
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

  // Spawn `concurrency` workers that pull from the task queue
  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker());
  await Promise.all(workers);

  return results;
}

/**
 * Debounced batch processor for real-time sensor data.
 * Collects incoming data points and processes them in batches on a timer,
 * preventing per-event re-renders from choking the UI.
 *
 * @param processBatch - Function to handle a batch of accumulated items
 * @param intervalMs - How often to flush the batch (default 200ms)
 *
 * Usage:
 *   const batcher = createBatchProcessor<SensorReading>(
 *     (batch) => { updateStatistics(batch); },
 *     150
 *   );
 *   // In sensor listener:
 *   batcher.push(reading);
 *   // Cleanup:
 *   batcher.stop();
 */
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
    flush(); // Process remaining items
  };

  const push = (item: T) => {
    buffer.push(item);
    if (!timer) start();
  };

  return { push, flush, stop, start };
}

/**
 * Yields control back to the event loop for one microtask.
 * Insert this in tight loops to keep the UI thread responsive.
 */
export function yieldToEventLoop(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Measure execution time of an async operation (for profiling).
 *
 * Usage:
 *   const { result, durationMs } = await measureAsync(() => heavyComputation());
 */
export async function measureAsync<T>(fn: () => Promise<T>): Promise<{ result: T; durationMs: number }> {
  const start = performance.now();
  const result = await fn();
  const durationMs = performance.now() - start;
  return { result, durationMs };
}
