// Fixed windows for rate limits: every key counts within [start, start + seconds). Pure.
export type RateLimit = { limit: number; windowSeconds: number };

export function windowOf(now: Date, windowSeconds: number) {
  const size = windowSeconds * 1000;
  const start = Math.floor(now.getTime() / size) * size;
  return { start: new Date(start), end: new Date(start + size) };
}

export function retryMessage(retryAfterSeconds: number) {
  const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
  return `Zu viele Versuche. Bitte warten Sie ${minutes} ${minutes === 1 ? "Minute" : "Minuten"}.`;
}
