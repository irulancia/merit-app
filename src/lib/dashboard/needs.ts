import { daysWithoutReply } from '#lib/applications/text.js';
import { displayTitle } from '#lib/postings/format.js';
import type { ListEntry } from '#lib/postings/list.js';

/** Something that waits on the user, most pressing first. */
export type Need =
  | { kind: 'offer'; postingId: string; title: string }
  | { kind: 'followUp'; postingId: string; title: string; days: number }
  | { kind: 'toCheck'; count: number };

const MAX_PER_KIND = 3;

/** Offers to answer, applications gone quiet, then postings not checked yet. */
export function needsFrom(entries: ListEntry[], now = Date.now()): Need[] {
  const open = entries.filter((entry) => entry.posting.application && entry.posting.application.stage !== 'closed');
  const at = (stage: string) => open.filter((entry) => entry.posting.application?.stage === stage).slice(0, MAX_PER_KIND);

  const offers: Need[] = at('offer').map(({ posting }) => ({ kind: 'offer', postingId: posting.id, title: displayTitle(posting) }));
  const followUps: Need[] = open
    .map((entry) => ({ entry, days: entry.posting.application ? daysWithoutReply(entry.posting.application, now) : null }))
    .filter((item): item is { entry: ListEntry; days: number } => item.days !== null)
    .sort((a, b) => b.days - a.days)
    .slice(0, MAX_PER_KIND)
    .map(({ entry, days }) => ({ kind: 'followUp', postingId: entry.posting.id, title: displayTitle(entry.posting), days }));
  const toCheck = entries.filter((entry) => entry.view === 'considering' && !entry.fit.complete).length;

  return [...offers, ...followUps, ...(toCheck > 0 ? [{ kind: 'toCheck' as const, count: toCheck }] : [])];
}
