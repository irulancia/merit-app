import { m } from '#lib/paraglide/messages.js';
import { parseChoices } from './values.js';

/** The criteria whose value is a set of ticked options that a posting states too (the contract, the level): the
    engine reads which options the posting names, Merit compares them with the ticks. Each option id is unique
    across them, so one list of labels serves all. */
export const CHOICE_FACTS = {
  contract_type: ['employment', 'freelance'],
  contract_duration: ['permanent', 'fixed_term'],
  working_hours: ['full_time', 'part_time'],
  seniority: ['junior', 'mid', 'senior', 'lead'],
  role_type: ['individual', 'manager']
} as const;

export type ChoiceCriterion = keyof typeof CHOICE_FACTS;
export const CHOICE_CRITERIA = Object.keys(CHOICE_FACTS) as ChoiceCriterion[];

export const CHOICE_LABELS: Record<string, () => string> = {
  employment: () => m.choice_employment(),
  freelance: () => m.choice_freelance(),
  permanent: () => m.choice_permanent(),
  fixed_term: () => m.choice_fixed_term(),
  full_time: () => m.choice_full_time(),
  part_time: () => m.choice_part_time(),
  junior: () => m.choice_junior(),
  mid: () => m.choice_mid(),
  senior: () => m.choice_senior(),
  lead: () => m.choice_lead(),
  individual: () => m.choice_individual(),
  manager: () => m.choice_manager()
};

/** How the engine is told what each option means. */
export const CHOICE_PROMPTS: Record<ChoiceCriterion, string> = {
  contract_type: 'employment (an employment contract with the company), freelance (freelance, contractor, B2B)',
  contract_duration: 'permanent, fixed_term (a fixed-term contract or a project of set length)',
  working_hours: 'full_time, part_time',
  seniority: 'junior, mid, senior, lead (lead, principal or head of)',
  role_type: 'individual (an individual contributor), manager (manages people)'
};

export function isChoiceCriterion(candidate: string): candidate is ChoiceCriterion {
  return candidate in CHOICE_FACTS;
}

export function choiceOptions(criterion: ChoiceCriterion): readonly string[] {
  return CHOICE_FACTS[criterion];
}

export function parseChoiceValue(criterion: ChoiceCriterion, value: string): string[] {
  const options: readonly string[] = CHOICE_FACTS[criterion];
  return parseChoices(value, (candidate): candidate is string => typeof candidate === 'string' && options.includes(candidate));
}

export function choiceLabels(ids: readonly string[]): string {
  return ids.map((id) => CHOICE_LABELS[id]?.() ?? id).join(', ');
}
