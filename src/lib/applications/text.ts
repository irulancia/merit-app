import { m } from '#lib/paraglide/messages.js';
import { NO_REPLY_AFTER_DAYS, type Application, type ClosedReason, type Stage } from './types.js';

export const STAGE_TITLES: Record<Stage, () => string> = {
  want: () => m.stage_want(),
  applied: () => m.stage_applied(),
  interviewing: () => m.stage_interviewing(),
  offer: () => m.stage_offer(),
  closed: () => m.stage_closed()
};

export const CLOSED_REASON_TEXT: Record<ClosedReason, () => string> = {
  notSelected: () => m.closed_not_selected(),
  noReply: () => m.closed_no_reply(),
  withdrew: () => m.closed_withdrew(),
  accepted: () => m.closed_accepted(),
  declined: () => m.closed_declined()
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** Days since applying, when it is still only "Applied" and past the wait; null otherwise. */
export function daysWithoutReply(application: Application, now = Date.now()): number | null {
  if (application.stage !== 'applied' || !application.appliedAt) return null;
  const days = Math.floor((now - new Date(application.appliedAt).getTime()) / DAY_MS);
  return days >= NO_REPLY_AFTER_DAYS ? days : null;
}
