import { ALL_CRITERIA, type Criterion } from '#lib/criteria/catalog.js';
import type { CriteriaSettings } from '#lib/criteria/types.js';
import { isFactCriterion } from '#lib/postings/facts.js';
import type { Posting } from '#lib/postings/types.js';
import { loadCriteria } from '../criteria-store.js';
import { getPosting, updatePosting, type PostingChanges } from '../postings-store.js';
import { loadSettings, type AppSettings } from '../settings-store.js';
import { askEngine } from './engine.js';
import { EngineError } from './errors.js';
import { evaluationPrompt, evaluationSchema, parseEvaluation, type Evaluation } from './prompt.js';

export function criteriaInUse(settings: CriteriaSettings): Criterion[] {
  return ALL_CRITERIA.filter((criterion) => (settings[criterion.id]?.level ?? 'off') !== 'off');
}

function ask(posting: Posting, criteria: Criterion[], criteriaSettings: CriteriaSettings, app: AppSettings): Promise<unknown> {
  const fromImage = !posting.text && posting.image !== '';
  return askEngine(app, {
    prompt: evaluationPrompt(criteria, criteriaSettings, posting.text, fromImage),
    schema: evaluationSchema(criteria, fromImage),
    imageFile: fromImage ? posting.image : undefined
  });
}

/** What a check changes: every mark, reason and fact, plus the title, company and (for a screenshot) the text it read. */
function changesFrom(evaluation: Evaluation, posting: Posting, engine: string): PostingChanges {
  return {
    marks: evaluation.marks,
    reasons: evaluation.reasons,
    facts: evaluation.facts,
    summary: evaluation.summary,
    ...(evaluation.title && !posting.titleEdited ? { title: evaluation.title } : {}),
    ...(evaluation.company && !posting.company ? { company: evaluation.company } : {}),
    ...(evaluation.postingText && !posting.text ? { text: evaluation.postingText } : {}),
    checkedAt: new Date().toISOString(),
    checkedWith: engine
  };
}

export type CheckOutcome = { ok: true; posting: Posting } | { ok: false; reason: 'noEngine' | 'noCriteria' | 'nothingToRead' };

/** Checks one saved posting against the saved criteria with the chosen engine, and saves what it found.
    Throws EngineError when the engine gives no usable answer. */
export async function checkPosting(id: string): Promise<CheckOutcome> {
  const [posting, app, { settings }] = await Promise.all([getPosting(id), loadSettings(), loadCriteria()]);
  if (!posting) throw new EngineError('failed', 'no such posting');
  if (app.engine === 'none') return { ok: false, reason: 'noEngine' };
  const inUse = criteriaInUse(settings);
  if (inUse.length === 0) return { ok: false, reason: 'noCriteria' };
  if (!posting.text && !posting.image) return { ok: false, reason: 'nothingToRead' };

  // The engine marks only the criteria without a value; for the others it reports facts, which Merit compares
  const criteria = inUse.filter((criterion) => !isFactCriterion(criterion.id));
  const evaluation = parseEvaluation(await ask(posting, criteria, settings, app), criteria);
  if (!evaluation) throw new EngineError('badAnswer');
  const updated = await updatePosting(id, changesFrom(evaluation, posting, app.engine));
  if (!updated) throw new EngineError('failed', 'posting deleted while it was checked');
  return { ok: true, posting: updated };
}
