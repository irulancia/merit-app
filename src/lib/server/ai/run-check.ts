import type { EngineErrorCode } from './errors.js';
import { EngineError } from './errors.js';
import { checkPosting, type CheckOutcome } from './check-posting.js';

export type CheckResult =
  | { checked: true }
  | { checked: false; skipped: Exclude<CheckOutcome, { ok: true }>['reason'] }
  | { checked: false; engineError: EngineErrorCode };

/** Runs a check for a form action: never throws, so a failed check never loses the posting it was for. */
export async function runCheck(id: string): Promise<CheckResult> {
  try {
    const outcome = await checkPosting(id);
    return outcome.ok ? { checked: true } : { checked: false, skipped: outcome.reason };
  } catch (error) {
    console.error('Checking a posting failed:', error);
    return { checked: false, engineError: error instanceof EngineError ? error.code : 'failed' };
  }
}
