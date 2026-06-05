const windows = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60_000;

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number = WINDOW_MS
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = windows.get(key);

  if (!entry || now >= entry.resetAt) {
    const resetAt = now + windowMs;
    windows.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  entry.count++;
  const remaining = Math.max(0, limit - entry.count);
  const allowed = entry.count <= limit;

  return { allowed, remaining, resetAt: entry.resetAt };
}

export function getRateLimitHeaders(result: { remaining: number; resetAt: number }) {
  return {
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };
}

export const RATE_LIMITS = {
  agentExecute: { limit: 10, windowMs: 60_000 },
  payments: { limit: 5, windowMs: 60_000 },
  general: { limit: 60, windowMs: 60_000 },
} as const;
