import { fail } from '@sveltejs/kit';
import { claudeCodeVersion } from '#lib/server/ai/claude-code.js';
import { ollamaModels } from '#lib/server/ai/ollama.js';
import { downloadState } from '#lib/server/ai/ollama-download.js';
import { isEngine, loadSettings, saveSettings } from '#lib/server/settings-store.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const [settings, claudeVersion, models, download] = await Promise.all([loadSettings(), claudeCodeVersion(), ollamaModels(), downloadState()]);
  return { settings, claudeVersion, ollamaModels: models, download };
};

export const actions: Actions = {
  save: async ({ request }) => {
    const form = await request.formData();
    const engine = form.get('engine');
    const model = form.get('ollamaModel');
    if (!isEngine(engine)) return fail(400, { saveError: 'invalid' as const });
    const ollamaModel = typeof model === 'string' ? model.trim().slice(0, 200) : '';
    if (engine === 'ollama' && !ollamaModel) return fail(400, { saveError: 'noModel' as const });
    try {
      await saveSettings({ engine, ollamaModel });
    } catch (error) {
      console.error('Saving settings failed:', error);
      return fail(500, { saveError: 'write' as const });
    }
    return { saved: true };
  }
};
