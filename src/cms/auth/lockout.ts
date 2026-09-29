// Five wrong passwords in a row lock an account for ten minutes. Pure so it can be tested.
export const MAX_ATTEMPTS = 5;
export const LOCK_MINUTES = 10;

export type LockState = { failedAttempts: number; lockedUntil: Date | null };

export function isLocked(state: LockState, now = new Date()) {
  return state.lockedUntil !== null && state.lockedUntil > now;
}

export function afterFailure(state: LockState, now = new Date()): LockState {
  // A failure after an expired lock starts a fresh count.
  const attempts = (state.lockedUntil && state.lockedUntil <= now ? 0 : state.failedAttempts) + 1;
  if (attempts >= MAX_ATTEMPTS) {
    return { failedAttempts: 0, lockedUntil: new Date(now.getTime() + LOCK_MINUTES * 60_000) };
  }
  return { failedAttempts: attempts, lockedUntil: null };
}

export const afterSuccess = (): LockState => ({ failedAttempts: 0, lockedUntil: null });

export function lockMessage(state: LockState, now = new Date()) {
  if (!isLocked(state, now)) return null;
  const minutes = Math.max(1, Math.ceil((state.lockedUntil!.getTime() - now.getTime()) / 60_000));
  return `Zu viele Fehlversuche. Bitte warten Sie ${minutes} ${minutes === 1 ? "Minute" : "Minuten"}.`;
}
