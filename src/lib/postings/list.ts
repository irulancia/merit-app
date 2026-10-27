import type { CriteriaSettings } from '#lib/criteria/types.js';
import { currentMarks, isFactCriterion } from './facts.js';
import { computeFit, isFilteredOut, type Fit } from './fit.js';
import type { PostingSummary } from './types.js';

/** The postings page's tabs, in order: the user's own way, from weighing a posting to how it ended, with what was set
    aside last. */
export const VIEWS = ['considering', 'applying', 'closed', 'notSure'] as const;
export type View = (typeof VIEWS)[number];

/** The tabs Considering replaced: an old link or bookmark still lands there. */
const FORMER_VIEWS: Record<string, View> = { check: 'considering', worth: 'considering' };

export const SORTS = ['newest', 'fit'] as const;
export type Sort = (typeof SORTS)[number];

export interface ListEntry {
  posting: PostingSummary;
  fit: Fit;
  filtered: boolean;
  view: View;
}

export function isView(candidate: unknown): candidate is View {
  return typeof candidate === 'string' && (VIEWS as readonly string[]).includes(candidate);
}

/** The tab named in an address, a former one included; null for none or an unknown one. */
export function parseView(raw: string | null): View | null {
  if (raw === null) return null;
  return isView(raw) ? raw : (FORMER_VIEWS[raw] ?? null);
}

export function isSort(candidate: unknown): candidate is Sort {
  return typeof candidate === 'string' && (SORTS as readonly string[]).includes(candidate);
}

/** Each posting is in exactly one tab: an application wins (applying, or closed), then Not sure — set aside by
    the user, or filtered out by Merit — and everything else is being considered, checked or not yet. */
export function viewOf(posting: Pick<PostingSummary, 'application' | 'archived'>, filtered: boolean): View {
  if (posting.application) return posting.application.stage === 'closed' ? 'closed' : 'applying';
  if (posting.archived || filtered) return 'notSure';
  return 'considering';
}

export function toEntries(postings: PostingSummary[], settings: CriteriaSettings): ListEntry[] {
  return postings.map((posting) => {
    const fit = computeFit(currentMarks(posting, settings), settings);
    const filtered = isFilteredOut(fit, posting.keptAnyway);
    return { posting, fit, filtered, view: viewOf(posting, filtered) };
  });
}

/** What a check would still add, found by Merit so the user never has to look for it: a posting never checked, one
    with a criterion in use left unmarked (turned on after its check), or one checked before facts were read while a
    criterion with a value is in use (its verdict there may be out of date). Closed ones are left alone, and one with
    nothing to read can't be checked. */
export function needsCheck({ posting, fit, view }: ListEntry): boolean {
  if (view === 'closed' || (!posting.excerpt && !posting.image)) return false;
  if (fit.counts.unmarked > 0) return true;
  return posting.facts === null && fit.inUse.some((criterion) => isFactCriterion(criterion.id));
}

/** Not opened by the user yet: what a check moved somewhere, or what was just added. */
export function isNew(posting: Pick<PostingSummary, 'openedAt'>): boolean {
  return posting.openedAt === '';
}

/** Best fit: the share of criteria that pass, then fewer misses; one with nothing checked yet goes last (it has no
    result to rank); newest breaks a tie. */
function fitScore({ fit }: ListEntry): number {
  if (fit.inUse.length === 0 || fit.counts.unmarked === fit.inUse.length) return Number.NEGATIVE_INFINITY;
  return (fit.counts.pass - fit.counts.miss / 2) / fit.inUse.length;
}

export function sortEntries(entries: ListEntry[], sort: Sort): ListEntry[] {
  const newest = (a: ListEntry, b: ListEntry) => b.posting.createdAt.localeCompare(a.posting.createdAt);
  return [...entries].sort(sort === 'fit' ? (a, b) => fitScore(b) - fitScore(a) || newest(a, b) : newest);
}

/** A search over what the list shows: title, company, where it came from, and the opening of the text. */
export function matchesSearch({ posting }: ListEntry, query: string): boolean {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return true;
  return [posting.title, posting.company, posting.link, posting.excerpt].join(' ').toLocaleLowerCase().includes(needle);
}
