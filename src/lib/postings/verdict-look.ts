import { m } from '#lib/paraglide/messages.js';
import type { Mark } from './types.js';

export type Verdict = Mark | 'unmarked';

/** Each verdict's icon and word, beside its colour (an `is-<verdict>` class): the colour never carries the meaning alone. */
export const VERDICT_LOOK: Record<Verdict, { icon: string; label: () => string }> = {
  pass: { icon: 'icon-check-circle', label: () => m.mark_pass() },
  miss: { icon: 'icon-prohibit', label: () => m.mark_miss() },
  unmentioned: { icon: 'icon-question', label: () => m.mark_unmentioned() },
  unmarked: { icon: 'icon-hourglass', label: () => m.mark_unmarked() }
};

/** The order of the bar's parts (left to right) and of the groups under it: what fits, what is still open, what
    rules the posting out. */
export const VERDICT_ORDER: Verdict[] = ['pass', 'unmentioned', 'unmarked', 'miss'];
