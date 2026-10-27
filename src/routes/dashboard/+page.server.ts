import { fail } from '@sveltejs/kit';
import { skillsInDemand } from '#lib/profile/skills.js';
import { claudeCodeVersion } from '#lib/server/ai/claude-code.js';
import { ollamaModels } from '#lib/server/ai/ollama.js';
import { currentTrends, readTrends } from '#lib/server/ai/trends.js';
import { EngineError } from '#lib/server/ai/errors.js';
import { loadCriteria } from '#lib/server/criteria-store.js';
import { listPostings } from '#lib/server/postings-store.js';
import { loadProfile } from '#lib/server/profile-store.js';
import { loadSettings } from '#lib/server/settings-store.js';
import { trendPostings } from '#lib/server/trend-postings.js';
import type { Actions, PageServerLoad } from './$types';

/** What the setup needs, only while it is shown (Merit not set up: no criterion in use yet): looking for Claude Code
    and Ollama takes a moment, so a set-up dashboard doesn't. */
async function setupData(needed: boolean, profile: { skills: string[]; tools: string[] }, app: { engine: string }) {
  if (!needed) return null;
  const [claudeVersion, models] = await Promise.all([claudeCodeVersion(), ollamaModels()]);
  return { skills: profile.skills, tools: profile.tools, engine: app.engine, claudeFound: claudeVersion !== null, ollamaModel: models?.[0] ?? null };
}

export const load: PageServerLoad = async () => {
  const [postings, criteria, app, profile, read] = await Promise.all([listPostings(), loadCriteria(), loadSettings(), loadProfile(), trendPostings()]);
  const texts = read.map((posting) => posting.text);
  const trends = await currentTrends(read, profile);
  const inUse = Object.values(criteria.settings).some((setting) => setting.level !== 'off');
  const setup = await setupData(!inUse, profile, app);
  return {
    setup,
    postings,
    settings: criteria.settings,
    engine: app.engine,
    demand: {
      postings: texts.length,
      skills: skillsInDemand(texts, profile.skills, 'skill'),
      tools: skillsInDemand(texts, profile.tools, 'tool'),
      hasSkills: profile.skills.length + profile.tools.length > 0
    },
    trends: trends && { insights: trends.insights, readAt: trends.readAt, engine: trends.engine, postings: trends.postings, outdated: trends.outdated }
  };
};

export const actions: Actions = {
  /** The AI engine reads the postings together; written only when asked, since it costs the engine's time. */
  readTrends: async () => {
    try {
      const outcome = await readTrends();
      return outcome.ok ? { trendsRead: true } : fail(400, { trendsError: outcome.reason });
    } catch (cause) {
      console.error('Reading the trends failed:', cause);
      return fail(500, { trendsError: cause instanceof EngineError ? cause.code : ('failed' as const) });
    }
  }
};
