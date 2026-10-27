import { fail } from '@sveltejs/kit';
import { isSort, parseView } from '#lib/postings/list.js';
import { readSubmission, validateSubmission } from '#lib/postings/validate.js';
import { runCheck } from '#lib/server/ai/run-check.js';
import { moveFromForm } from '#lib/server/applications.js';
import { createPosting, NotAnImageError } from '#lib/server/create-posting.js';
import { loadCriteria } from '#lib/server/criteria-store.js';
import { deletePosting, isPostingId, listPostings, restorePosting, updatePosting } from '#lib/server/postings-store.js';
import { loadSettings } from '#lib/server/settings-store.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
  const [postings, criteria, app] = await Promise.all([listPostings(), loadCriteria(), loadSettings()]);
  const view = url.searchParams.get('view');
  const sort = url.searchParams.get('sort');
  return {
    postings,
    settings: criteria.settings,
    engine: app.engine,
    view: parseView(view),
    sort: isSort(sort) ? sort : 'newest'
  };
};

export const actions: Actions = {
  add: async ({ request }) => {
    const form = await request.formData();
    const submission = readSubmission(form);
    // Unticked, the posting is only saved: the user can add several and check them all afterwards
    const checkNow = form.get('check') === 'on';
    const error = validateSubmission(submission);
    if (error) return fail(400, { error, content: submission.content });
    try {
      const posting = await createPosting(submission);
      const check = checkNow ? await runCheck(posting.id) : null;
      return { added: posting.id, title: posting.title, linkUnread: posting.source === 'link' && !posting.linkRead, check };
    } catch (cause) {
      if (cause instanceof NotAnImageError) return fail(400, { error: 'imageType' as const, content: submission.content });
      console.error('Saving a posting failed:', cause);
      return fail(500, { error: 'write' as const, content: submission.content });
    }
  },
  archive: async ({ request }) => {
    const form = await request.formData();
    const id = String(form.get('id') ?? '');
    if (!isPostingId(id)) return fail(400, { archiveFailed: true });
    try {
      await updatePosting(id, { archived: form.get('archived') === 'true' });
    } catch (cause) {
      console.error('Archiving a posting failed:', cause);
      return fail(500, { archiveFailed: true });
    }
    return { archivedChanged: id };
  },
  // Out of Not sure: no longer set aside, and kept although it fails a non-negotiable when that is why it was there
  bringBack: async ({ request }) => {
    const form = await request.formData();
    const id = String(form.get('id') ?? '');
    if (!isPostingId(id)) return fail(400, { archiveFailed: true });
    try {
      await updatePosting(id, form.get('keep') === 'true' ? { archived: false, keptAnyway: true } : { archived: false });
    } catch (cause) {
      console.error('Bringing a posting back failed:', cause);
      return fail(500, { archiveFailed: true });
    }
    return { broughtBack: id };
  },
  // The applying and closed tabs: the same actions the posting page and its dialogs use
  move: async ({ request }) => moveFromForm(await request.formData()),
  delete: async ({ request }) => {
    const id = String((await request.formData()).get('id') ?? '');
    if (!isPostingId(id)) return fail(400, { deleteFailed: true });
    try {
      await deletePosting(id);
    } catch (cause) {
      console.error('Deleting a posting failed:', cause);
      return fail(500, { deleteFailed: true });
    }
    return { deleted: id };
  },
  // Undo for a delete, from any page (the posting's own page is gone by then)
  undelete: async ({ request }) => {
    const id = String((await request.formData()).get('id') ?? '');
    try {
      if (!(await restorePosting(id))) return fail(404, { deleteFailed: true });
    } catch (cause) {
      console.error('Bringing a deleted posting back failed:', cause);
      return fail(500, { deleteFailed: true });
    }
    return { restored: id };
  }
};
