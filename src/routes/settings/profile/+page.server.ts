import { fail } from '@sveltejs/kit';
import { parseTopics } from '#lib/interview/topics.js';
import { parseSkills } from '#lib/profile/skills.js';
import { loadProfile, MAX_EXPERIENCE, updateProfile, type Profile } from '#lib/server/profile-store.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({ profile: await loadProfile() });

async function save(changes: Partial<Profile>) {
  try {
    await updateProfile(changes);
  } catch (error) {
    console.error('Saving the profile failed:', error);
    return fail(500, { error: 'write' as const });
  }
  return { saved: true };
}

function readJson(raw: FormDataEntryValue | null): unknown {
  if (typeof raw !== 'string') return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** One of the two lists, skills or tools, as the user has it now. */
async function saveList(key: 'skills' | 'tools', request: Request) {
  const submitted = readJson((await request.formData()).get('list'));
  if (!Array.isArray(submitted)) return fail(400, { error: 'invalid' as const });
  return save({ [key]: parseSkills(submitted) });
}

export const actions: Actions = {
  // Saved by itself as the user types
  saveExperience: async ({ request }) => {
    const raw = (await request.formData()).get('experience');
    return save({ experience: (typeof raw === 'string' ? raw : '').trimEnd().slice(0, MAX_EXPERIENCE) });
  },
  // The interview topics ticked, each time one changes
  saveTopics: async ({ request }) => {
    const submitted = readJson((await request.formData()).get('topics'));
    if (!Array.isArray(submitted)) return fail(400, { error: 'invalid' as const });
    return save({ interviewTopics: parseTopics(submitted) });
  },
  // The whole list, each time one is added or removed
  saveSkills: async ({ request }) => saveList('skills', request),
  saveTools: async ({ request }) => saveList('tools', request)
};
