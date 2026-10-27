import { error, fail, redirect } from '@sveltejs/kit';
import { ALL_CRITERIA } from '#lib/criteria/catalog.js';
import { m } from '#lib/paraglide/messages.js';
import { isMark, POSTING_LIMITS } from '#lib/postings/types.js';
import { isRewritePurpose, letterOutdated, MAX_STRESS, writeCoverLetter, type LetterOutcome } from '#lib/server/ai/cover-letter.js';
import { EngineError } from '#lib/server/ai/errors.js';
import { runCheck } from '#lib/server/ai/run-check.js';
import { draftRequestFromForm, moveFromForm, saveApplicationText } from '#lib/server/applications.js';
import { moveToFromForm, restorePlaceFromForm } from '#lib/server/move-posting.js';
import { loadCriteria } from '#lib/server/criteria-store.js';
import { deletePosting, getPosting, updatePosting, type PostingChanges } from '#lib/server/postings-store.js';
import { loadProfile } from '#lib/server/profile-store.js';
import { loadSettings } from '#lib/server/settings-store.js';
import type { Actions, PageServerLoad } from './$types';

const LETTER_LIMIT = 6_000;
const NOTES_LIMIT = 10_000;
const ASIDE_REASON_LIMIT = 300;

export const load: PageServerLoad = async ({ params }) => {
  const found = await getPosting(params.id);
  if (!found) error(404, m.posting_not_found());
  // Opening it is what makes it no longer new; once only
  const posting = found.openedAt ? found : ((await updatePosting(found.id, { openedAt: new Date().toISOString() })) ?? found);
  const [{ settings }, app, profile] = await Promise.all([loadCriteria(), loadSettings(), loadProfile()]);
  return { posting, settings, engine: app.engine, skills: [...profile.skills, ...profile.tools], interviewTopics: profile.interviewTopics, letterOutdated: letterOutdated(posting, settings, profile) };
};

/** Saves the changes, or explains the failure on the field it came from. */
async function save(id: string, changes: PostingChanges, failure: Record<string, unknown>) {
  try {
    if (!(await updatePosting(id, changes))) error(404, m.posting_not_found());
  } catch (cause) {
    if (cause instanceof Error && 'status' in cause) throw cause;
    console.error('Saving a posting failed:', cause);
    return fail(500, failure);
  }
  return { saved: true };
}

function readText(form: FormData, name: string): string {
  const raw = form.get(name);
  return typeof raw === 'string' ? raw.trim() : '';
}

/** Drafts or rewrites the letter, or says why it couldn't on the letter's card. */
async function letterAction(write: () => Promise<LetterOutcome>) {
  try {
    const outcome = await write();
    return outcome.ok ? { letterDrafted: true } : fail(400, { letterError: outcome.reason });
  } catch (cause) {
    console.error('Writing a cover letter failed:', cause);
    return fail(500, { letterError: cause instanceof EngineError ? cause.code : ('failed' as const) });
  }
}

export const actions: Actions = {
  rename: async ({ params, request }) => {
    const title = readText(await request.formData(), 'title');
    if (!title || title.length > POSTING_LIMITS.title) return fail(400, { editError: 'title' as const, value: title });
    return save(params.id, { title, titleEdited: true }, { editError: 'title', value: title });
  },
  addText: async ({ params, request }) => {
    const text = readText(await request.formData(), 'text');
    if (!text || text.length > POSTING_LIMITS.text) return fail(400, { editError: 'text' as const, value: text });
    return save(params.id, { text }, { editError: 'text', value: text });
  },
  /** One criterion's mark: pass, miss, not mentioned — or "clear" to take the mark off. */
  mark: async ({ params, request }) => {
    const form = await request.formData();
    const criterion = readText(form, 'criterion');
    const mark = readText(form, 'mark');
    if (!ALL_CRITERIA.some((known) => known.id === criterion) || !(isMark(mark) || mark === 'clear')) {
      return fail(400, { markFailed: true });
    }
    const posting = await getPosting(params.id);
    if (!posting) error(404, m.posting_not_found());
    // A mark set by hand is the user's: the engine's reason for the old one no longer applies
    const { [criterion]: _previousMark, ...otherMarks } = posting.marks;
    const { [criterion]: _previousReason, ...otherReasons } = posting.reasons;
    const marks = mark === 'clear' ? otherMarks : { ...otherMarks, [criterion]: mark };
    return save(params.id, { marks, reasons: otherReasons }, { markFailed: true });
  },
  check: async ({ params }) => runCheck(params.id),
  draftLetter: async ({ params }) => letterAction(() => writeCoverLetter(params.id)),
  /** A rewrite for a named purpose, from the letter as the user has it now (sent along, edits included). */
  rewriteLetter: async ({ params, request }) => {
    const form = await request.formData();
    const purpose = readText(form, 'purpose');
    const stress = readText(form, 'stress').slice(0, MAX_STRESS);
    if (!isRewritePurpose(purpose) || (purpose === 'stress' && !stress)) return fail(400, { letterError: 'failed' as const });
    const letter = readText(form, 'letter').slice(0, LETTER_LIMIT);
    return letterAction(() => writeCoverLetter(params.id, { letter, purpose, stress }));
  },
  // Saved by itself as the user types (the letter's own field)
  saveLetter: async ({ params, request }) => {
    const letter = readText(await request.formData(), 'letter').slice(0, LETTER_LIMIT);
    return save(params.id, { coverLetter: letter }, { letterError: 'write' });
  },
  // The posting's own notes, saved by themselves as the user types
  saveNotes: async ({ params, request }) => {
    const raw = (await request.formData()).get('notes');
    return save(params.id, { notes: (typeof raw === 'string' ? raw : '').trimEnd().slice(0, NOTES_LIMIT) }, { notesFailed: true });
  },
  // A closed application's feedback card: what they said, and the message asking for it, each saved as typed
  saveFeedback: async ({ params, request }) => saveApplicationText(params.id, 'feedback', readText(await request.formData(), 'feedback')),
  saveRequest: async ({ params, request }) => saveApplicationText(params.id, 'feedbackRequest', readText(await request.formData(), 'feedbackRequest')),
  draftRequest: async ({ params }) => {
    const form = new FormData();
    form.set('id', params.id);
    return draftRequestFromForm(form);
  },
  apply: async ({ params, request }) => moveFromForm(await request.formData(), params.id),
  restore: async ({ params, request }) => restorePlaceFromForm(await request.formData(), params.id),
  moveTo: async ({ params, request }) => moveToFromForm(await request.formData(), params.id),
  // Closing, from the close dialog (the same one the Applying tab uses)
  move: async ({ params, request }) => moveFromForm(await request.formData(), params.id),
  /** Why the user marked it Not sure, in their own words; saved as they type (an empty one clears it). */
  asideReason: async ({ params, request }) => {
    const reason = readText(await request.formData(), 'reason').slice(0, ASIDE_REASON_LIMIT);
    return save(params.id, { asideReason: reason }, { asideReasonFailed: true });
  },
  // Consider it anyway brings it to Considering, out of Not sure whoever put it there; Back to Not sure undoes that
  keep: async ({ params, request }) => {
    const keptAnyway = readText(await request.formData(), 'kept') === 'true';
    return save(params.id, keptAnyway ? { keptAnyway, archived: false } : { keptAnyway }, { keepFailed: true });
  },
  delete: async ({ params }) => {
    try {
      await deletePosting(params.id);
    } catch (cause) {
      console.error('Deleting a posting failed:', cause);
      return fail(500, { deleteFailed: true });
    }
    redirect(303, '/postings');
  }
};
