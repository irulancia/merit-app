import { fail } from '@sveltejs/kit';
import { loadCriteria, normalize, saveCriteria } from '#lib/server/criteria-store.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const result = await loadCriteria();
  return { settings: result.settings, unreadable: !result.ok };
};

function parseSubmitted(raw: FormDataEntryValue | null): unknown {
  if (typeof raw !== 'string') return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export const actions: Actions = {
  save: async ({ request }) => {
    const submitted = parseSubmitted((await request.formData()).get('settings'));
    if (submitted === null) return fail(400, { error: 'invalid' as const });
    try {
      await saveCriteria(normalize(submitted));
    } catch (error) {
      console.error('Saving criteria failed:', error);
      return fail(500, { error: 'write' as const });
    }
    return { saved: true };
  }
};
