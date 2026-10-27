import { fail } from '@sveltejs/kit';
import { isClosedReason, isStage, moveApplication, NOTE_LIMIT } from '#lib/applications/types.js';
import { draftFeedbackRequest } from './ai/feedback-request.js';
import { getPosting, isPostingId, updatePosting } from './postings-store.js';

function readText(form: FormData, name: string): string {
  const raw = form.get(name);
  return typeof raw === 'string' ? raw.trim() : '';
}

/** A form action's body: moves the posting named in the form to the stage in the form. */
export async function moveFromForm(form: FormData, id = readText(form, 'id')) {
  const stage = readText(form, 'stage');
  const reason = readText(form, 'reason');
  if (!isPostingId(id) || !isStage(stage)) return fail(400, { moveFailed: true });
  if (stage === 'closed' && !isClosedReason(reason)) return fail(400, { moveFailed: true, needsReason: id });
  try {
    const posting = await getPosting(id);
    if (!posting) return fail(404, { moveFailed: true });
    const application = moveApplication(posting.application, stage, isClosedReason(reason) ? reason : '', new Date().toISOString());
    await updatePosting(id, { application });
  } catch (error) {
    console.error('Moving an application failed:', error);
    return fail(500, { moveFailed: true });
  }
  return { moved: id };
}

/** Drafts the message asking for feedback (AI when chosen, else the template) and keeps it with the application. */
export async function draftRequestFromForm(form: FormData) {
  const id = readText(form, 'id');
  if (!isPostingId(id)) return fail(400, { requestFailed: true });
  try {
    const posting = await getPosting(id);
    if (!posting?.application) return fail(404, { requestFailed: true });
    const { message } = await draftFeedbackRequest(posting);
    await updatePosting(id, { application: { ...posting.application, feedbackRequest: message } });
    return { requestDrafted: id, message };
  } catch (error) {
    console.error('Drafting a feedback request failed:', error);
    return fail(500, { requestFailed: true });
  }
}


/** One of an application's own texts, saved by itself as the user types on the posting's page: the feedback received,
    or the message asking for it. */
export async function saveApplicationText(id: string, field: 'feedback' | 'feedbackRequest', value: string) {
  const failure = { [`${field}Failed`]: true };
  try {
    const posting = await getPosting(id);
    if (!posting?.application) return fail(404, failure);
    await updatePosting(id, { application: { ...posting.application, [field]: value.trimEnd().slice(0, NOTE_LIMIT) } });
  } catch (error) {
    console.error('Saving an application text failed:', error);
    return fail(500, failure);
  }
  return { saved: true };
}
