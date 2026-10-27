import { ALL_CRITERIA, type Criterion } from '#lib/criteria/catalog.js';
import type { CriteriaSettings } from '#lib/criteria/types.js';
import type { Mark } from './types.js';

export interface Fit {
  /** The criteria in use (Weigh it or Non-negotiable), in catalog order. */
  inUse: Criterion[];
  counts: Record<Mark | 'unmarked', number>;
  /** Non-negotiables the posting clearly misses: a single one filters it out. */
  failedMust: Criterion[];
  /** Non-negotiables the posting doesn't mention: it passes, flagged, so the user can ask. */
  flaggedMust: Criterion[];
  /** Checked: every criterion in use has a mark. */
  complete: boolean;
}

/** How a posting fits the user's criteria, from its marks. Marks on criteria no longer in use are ignored. */
export function computeFit(marks: Record<string, Mark>, settings: CriteriaSettings): Fit {
  const inUse = ALL_CRITERIA.filter((criterion) => (settings[criterion.id]?.level ?? 'off') !== 'off');
  const counts = { pass: 0, miss: 0, unmentioned: 0, unmarked: 0 };
  for (const criterion of inUse) counts[marks[criterion.id] ?? 'unmarked'] += 1;
  const isMust = (criterion: Criterion) => settings[criterion.id]?.level === 'must';
  return {
    inUse,
    counts,
    failedMust: inUse.filter((criterion) => isMust(criterion) && marks[criterion.id] === 'miss'),
    flaggedMust: inUse.filter((criterion) => isMust(criterion) && marks[criterion.id] === 'unmentioned'),
    complete: inUse.length > 0 && counts.unmarked === 0
  };
}

export function isFilteredOut(fit: Fit, keptAnyway: boolean): boolean {
  return fit.failedMust.length > 0 && !keptAnyway;
}
