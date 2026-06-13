/**
 * Parallel Processing Service
 * Prevents long-running lab statistics calculations from freezing the UI thread
 * by chunking work into microtasks that yield back to the event loop.
 *
 * Since React Native doesn't natively support Web Workers on mobile,
 * we use cooperative scheduling (chunked async iteration) to maintain 60fps.
 */

export {
  processInChunks,
  runWithConcurrency,
  createBatchProcessor,
  yieldToEventLoop,
  measureAsync,
} from '../../backend/utils/cooperativeScheduling';
