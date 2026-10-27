export const LEVELS = ['off', 'weigh', 'must'] as const;
export type Level = (typeof LEVELS)[number];

export interface CriterionSetting {
  level: Level;
  value: string;
}

/** What the user chose, keyed by criterion id. Saved as criteria.json in the data folder. */
export type CriteriaSettings = Record<string, CriterionSetting>;

export const DEFAULT_SETTING: CriterionSetting = { level: 'off', value: '' };

export function isLevel(candidate: unknown): candidate is Level {
  return typeof candidate === 'string' && (LEVELS as readonly string[]).includes(candidate);
}
