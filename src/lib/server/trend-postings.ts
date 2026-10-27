import { toEntries, type ListEntry } from '#lib/postings/list.js';
import type { Posting } from '#lib/postings/types.js';
import { loadCriteria } from './criteria-store.js';
import { getPosting, listPostings } from './postings-store.js';

/** The postings the trends are read from: every one the user added, in any tab — one in Not sure missed a criterion,
    but it still says what the field asks for — and only those with text. Newest first. */
export async function trendPostings(): Promise<Posting[]> {
  const postings = await listPostings();
  const full = await Promise.all(postings.map((posting) => getPosting(posting.id)));
  return full.filter((posting): posting is Posting => posting !== null && posting.text !== '');
}

const VIEW_NAMES = { considering: 'Considering', applying: 'Applying', closed: 'Closed', notSure: 'Not sure' } as const;

/** Where the user put a posting, in words for the AI engine: a choice the user made says as much as the text does. */
function placeOf({ posting, fit, view }: ListEntry): string {
  if (view !== 'notSure') return VIEW_NAMES[view];
  if (posting.archived) return `Not sure, set aside by the user${posting.asideReason ? `: ${posting.asideReason}` : ''}`;
  return `Not sure, misses what the user won't give up: ${fit.failedMust.map((criterion) => criterion.title()).join(', ')}`;
}

/** Each posting's place (tab, and why it is in Not sure), by id. */
export async function postingPlaces(): Promise<Map<string, string>> {
  const [postings, { settings }] = await Promise.all([listPostings(), loadCriteria()]);
  return new Map(toEntries(postings, settings).map((entry) => [entry.posting.id, placeOf(entry)]));
}
