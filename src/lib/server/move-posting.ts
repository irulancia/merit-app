import { fail } from '@sveltejs/kit';
import { moveApplication } from '#lib/applications/types.js';
import { currentMarks } from '#lib/postings/facts.js';
import { computeFit, isFilteredOut } from '#lib/postings/fit.js';
import { isView, type View } from '#lib/postings/list.js';
import { parsePlace, type PostingPlace } from '#lib/postings/place.js';
import type { Posting } from '#lib/postings/types.js';
import { loadCriteria } from './criteria-store.js';
import { getPosting, isPostingId, updatePosting } from './postings-store.js';

function readText(form: FormData, name: string): string {
  const raw = form.get(name);
  return typeof raw === 'string' ? raw.trim() : '';
}

/** Where a posting goes when the user moves it to a tab (Closed asks how it ended, so it goes through its own
    dialog). Considering takes it out of an application and out of Not sure — kept although it misses a
    non-negotiable, when that is why it was there; Not sure sets it aside; Applying reopens or starts one. */
async function placeIn(view: Exclude<View, 'closed'>, posting: Posting, now: string): Promise<PostingPlace> {
  // Set aside by the user: an earlier "consider it anyway" no longer holds
  if (view === 'notSure') return { application: null, archived: true, keptAnyway: false };
  if (view === 'applying') {
    const stage = posting.application?.appliedAt ? 'applied' : 'want';
    return { application: moveApplication(posting.application, stage, '', now), archived: false, keptAnyway: posting.keptAnyway };
  }
  const { settings } = await loadCriteria();
  const filtered = isFilteredOut(computeFit(currentMarks(posting, settings), settings), false);
  return { application: null, archived: false, keptAnyway: posting.keptAnyway || filtered };
}

/** A form action's body: moves the posting to the tab named in the form ("to"). */
export async function moveToFromForm(form: FormData, id: string) {
  const to = readText(form, 'to');
  if (!isPostingId(id) || !isView(to) || to === 'closed') return fail(400, { moveFailed: true });
  try {
    const posting = await getPosting(id);
    if (!posting) return fail(404, { moveFailed: true });
    await updatePosting(id, await placeIn(to, posting, new Date().toISOString()));
  } catch (error) {
    console.error('Moving a posting failed:', error);
    return fail(500, { moveFailed: true });
  }
  return { movedTo: to };
}

/** Undo: puts the posting back exactly where it was before a move ("previous", as the page kept it). */
export async function restorePlaceFromForm(form: FormData, id: string) {
  let previous: PostingPlace | null = null;
  try {
    previous = parsePlace(JSON.parse(readText(form, 'previous')));
  } catch {
    previous = null;
  }
  if (!isPostingId(id) || !previous) return fail(400, { moveFailed: true });
  try {
    await updatePosting(id, previous);
  } catch (error) {
    console.error('Undoing a move failed:', error);
    return fail(500, { moveFailed: true });
  }
  return { restored: id };
}
