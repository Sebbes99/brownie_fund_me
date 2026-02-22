// Rate limiter: 5 requests per 60 seconds
// Tracks timestamps of recent requests and queues new ones when at limit

type RateLimitListener = (info: { waiting: boolean; retryInMs: number }) => void;

const MAX_REQUESTS = 5;
const WINDOW_MS = 60_000;
const timestamps: number[] = [];
const listeners = new Set<RateLimitListener>();

export function onRateLimitChange(listener: RateLimitListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify(waiting: boolean, retryInMs: number) {
  for (const fn of listeners) fn({ waiting, retryInMs });
}

function cleanOldTimestamps() {
  const cutoff = Date.now() - WINDOW_MS;
  while (timestamps.length > 0 && timestamps[0] < cutoff) {
    timestamps.shift();
  }
}

function canRequest(): boolean {
  cleanOldTimestamps();
  return timestamps.length < MAX_REQUESTS;
}

function msUntilSlotAvailable(): number {
  cleanOldTimestamps();
  if (timestamps.length < MAX_REQUESTS) return 0;
  return timestamps[0] + WINDOW_MS - Date.now() + 100; // +100ms buffer
}

/**
 * Wraps a fetch call with rate limiting.
 * If the limit is hit, it waits and notifies listeners.
 */
export async function rateLimitedFetch(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  // Wait if at limit
  while (!canRequest()) {
    const waitMs = msUntilSlotAvailable();
    notify(true, waitMs);
    await new Promise(resolve => setTimeout(resolve, Math.min(waitMs, 15_000)));
  }

  notify(false, 0);
  timestamps.push(Date.now());

  const response = await fetch(url, init);

  // Handle 429 from server as well
  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    const waitMs = retryAfter ? parseInt(retryAfter) * 1000 : 15_000;
    notify(true, waitMs);
    await new Promise(resolve => setTimeout(resolve, waitMs));
    // Remove the failed timestamp and retry
    const idx = timestamps.indexOf(Date.now());
    if (idx >= 0) timestamps.splice(idx, 1);
    return rateLimitedFetch(url, init);
  }

  return response;
}

export function getRateLimitInfo() {
  cleanOldTimestamps();
  return {
    used: timestamps.length,
    max: MAX_REQUESTS,
    windowMs: WINDOW_MS,
    canRequest: timestamps.length < MAX_REQUESTS,
    msUntilSlot: msUntilSlotAvailable(),
  };
}
