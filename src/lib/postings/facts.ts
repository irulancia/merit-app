import { CHOICE_CRITERIA, choiceLabels, choiceOptions, isChoiceCriterion, parseChoiceValue, type ChoiceCriterion } from '#lib/criteria/choices.js';
import type { CriteriaSettings } from '#lib/criteria/types.js';
import {
  COMPANY_SIZE_LABELS,
  INDUSTRY_LABELS,
  PAY_BASIS_LABELS,
  PERIOD_LABELS,
  formatAmount,
  isCompanySize,
  isCurrency,
  isIndustry,
  isPayBasis,
  isPeriod,
  parseCompanySizes,
  parseIndustries,
  parseSalaryWanted,
  type CompanySize,
  type Currency,
  type Industry,
  type PayBasis,
  type Period
} from '#lib/criteria/values.js';
import { m } from '#lib/paraglide/messages.js';
import type { Mark, Posting } from './types.js';

/** What a posting says, read once by the AI engine; Merit compares it with the user's criteria itself, so a
    change of mind needs no new check. Only the criteria that carry a value have a fact: these five, and the ones
    made of ticked options (choices.ts). */
const VALUE_FACTS = ['work_location', 'salary_minimum', 'industries_avoid', 'company_size', 'employer_rating'] as const;
export type FactCriterion = (typeof VALUE_FACTS)[number] | ChoiceCriterion;
export const FACT_CRITERIA: readonly FactCriterion[] = [...VALUE_FACTS, ...CHOICE_CRITERIA];

export const WORK_SETUPS = ['remote', 'hybrid', 'office'] as const;
export type WorkSetup = (typeof WORK_SETUPS)[number];

export const WORK_SETUP_LABELS: Record<WorkSetup, () => string> = {
  remote: () => m.setup_remote(),
  hybrid: () => m.setup_hybrid(),
  office: () => m.setup_office()
};

export interface SalaryFact {
  /** Either end of the range may be missing; a single figure is both. */
  min: number | null;
  max: number | null;
  currency: Currency;
  period: Period;
  /** Empty when the posting doesn't say gross or net. */
  basis: PayBasis | '';
}

export interface PostingFacts {
  /** Null wherever the posting doesn't say. */
  workSetup: WorkSetup | null;
  salary: SalaryFact | null;
  /** "other" for an industry not in the list. */
  industry: Industry | 'other' | null;
  /** By headcount; missing from facts read before company size had a value. */
  companySize: CompanySize | null;
  rating: number | null;
  /** The options the posting names, by criterion: empty when it doesn't say; missing when the posting was read
      before that criterion existed (it is then simply not checked yet). */
  choices: Partial<Record<ChoiceCriterion, string[]>>;
  /** Where the posting says it, in one sentence, by criterion. */
  evidence: Partial<Record<FactCriterion, string>>;
}

const MONTHS_IN_YEAR = 12;
const MAX_EVIDENCE = 300;

export function isFactCriterion(candidate: string): candidate is FactCriterion {
  return (FACT_CRITERIA as readonly string[]).includes(candidate);
}

function isWorkSetup(candidate: unknown): candidate is WorkSetup {
  return typeof candidate === 'string' && (WORK_SETUPS as readonly string[]).includes(candidate);
}

function positiveNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
}

function parseSalaryFact(raw: unknown): SalaryFact | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const record = raw as Record<string, unknown>;
  const min = positiveNumber(record.min);
  const max = positiveNumber(record.max);
  if ((min === null && max === null) || !isCurrency(record.currency) || !isPeriod(record.period)) return null;
  return { min, max, currency: record.currency, period: record.period, basis: isPayBasis(record.basis) ? record.basis : '' };
}

function parseChoiceFacts(raw: unknown): PostingFacts['choices'] {
  if (typeof raw !== 'object' || raw === null) return {};
  const record = raw as Record<string, unknown>;
  const read = CHOICE_CRITERIA.filter((criterion) => Array.isArray(record[criterion])).map((criterion) => {
    const options = choiceOptions(criterion);
    const named = (record[criterion] as unknown[]).filter((option): option is string => typeof option === 'string' && options.includes(option));
    return [criterion, [...new Set(named)]];
  });
  return Object.fromEntries(read);
}

function parseEvidence(raw: unknown): PostingFacts['evidence'] {
  if (typeof raw !== 'object' || raw === null) return {};
  const entries = Object.entries(raw).filter(
    (entry): entry is [FactCriterion, string] => isFactCriterion(entry[0]) && typeof entry[1] === 'string' && entry[1].trim() !== ''
  );
  return Object.fromEntries(entries.map(([criterion, text]) => [criterion, text.trim().slice(0, MAX_EVIDENCE)]));
}

/** From a posting's file or an engine's answer: anything malformed counts as not said. */
export function parseFacts(raw: unknown): PostingFacts | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const record = raw as Record<string, unknown>;
  const industry = record.industry === 'other' || isIndustry(record.industry) ? record.industry : null;
  return {
    workSetup: isWorkSetup(record.workSetup) ? record.workSetup : null,
    salary: parseSalaryFact(record.salary),
    industry,
    companySize: isCompanySize(record.companySize) ? record.companySize : null,
    rating: positiveNumber(record.rating),
    choices: parseChoiceFacts(record.choices),
    evidence: parseEvidence(record.evidence)
  };
}

function compareWorkSetup(setup: WorkSetup | null, wanted: string): Mark {
  if (setup === null) return 'unmentioned';
  if (wanted === 'remote_only') return setup === 'remote' ? 'pass' : 'miss';
  if (wanted === 'remote_or_hybrid') return setup === 'office' ? 'miss' : 'pass';
  return 'pass';
}

function yearly(amount: number, period: Period): number {
  return period === 'year' ? amount : amount * MONTHS_IN_YEAR;
}

/** The top of the range against the minimum: it passes when the range reaches it. A different currency, or gross
    against net, can't be compared without guessing, so it counts as not said: the posting passes, flagged to ask. */
function compareSalary(salary: SalaryFact | null, wantedValue: string): Mark {
  if (salary === null) return 'unmentioned';
  const wanted = parseSalaryWanted(wantedValue);
  if (wanted === null) return 'pass';
  if (salary.currency !== wanted.currency) return 'unmentioned';
  if (salary.basis !== '' && salary.basis !== wanted.basis) return 'unmentioned';
  const top = salary.max ?? salary.min ?? 0;
  return yearly(top, salary.period) >= yearly(wanted.amount, wanted.period) ? 'pass' : 'miss';
}

function compareIndustry(industry: PostingFacts['industry'], wanted: string): Mark {
  if (industry === null) return 'unmentioned';
  return industry !== 'other' && parseIndustries(wanted).includes(industry) ? 'miss' : 'pass';
}

/** One of the sizes ticked passes; with none ticked, any size the posting states does. */
function compareCompanySize(size: CompanySize | null, wanted: string): Mark {
  if (size === null) return 'unmentioned';
  const sizes = parseCompanySizes(wanted);
  return sizes.length === 0 || sizes.includes(size) ? 'pass' : 'miss';
}

function compareRating(rating: number | null, wanted: string): Mark {
  if (rating === null) return 'unmentioned';
  const minimum = Number(wanted);
  return !wanted || !Number.isFinite(minimum) || rating >= minimum ? 'pass' : 'miss';
}

/** One of the options ticked named by the posting passes; with none ticked, anything it states does. Null while the
    posting hasn't been read for this criterion. */
function compareChoice(criterion: ChoiceCriterion, facts: PostingFacts, wanted: string): Mark | null {
  const named = facts.choices[criterion];
  if (named === undefined) return null;
  if (named.length === 0) return 'unmentioned';
  const ticked = parseChoiceValue(criterion, wanted);
  return ticked.length === 0 || named.some((option) => ticked.includes(option)) ? 'pass' : 'miss';
}

/** How a posting does on a criterion with a value, from its facts and what the user wants now; null when its facts
    don't cover that criterion yet. */
export function markFromFacts(criterion: FactCriterion, facts: PostingFacts, wanted: string): Mark | null {
  if (isChoiceCriterion(criterion)) return compareChoice(criterion, facts, wanted);
  switch (criterion) {
    case 'work_location':
      return compareWorkSetup(facts.workSetup, wanted);
    case 'salary_minimum':
      return compareSalary(facts.salary, wanted);
    case 'industries_avoid':
      return compareIndustry(facts.industry, wanted);
    case 'company_size':
      return compareCompanySize(facts.companySize, wanted);
    case 'employer_rating':
      return compareRating(facts.rating, wanted);
  }
}

/** The posting's marks as they stand now: a mark the user set stays; a criterion with a fact is compared with
    today's value; a posting checked before facts existed keeps the engine's old mark until it is checked again. */
export function currentMarks(posting: Pick<Posting, 'marks' | 'facts'>, settings: CriteriaSettings): Record<string, Mark> {
  const { facts } = posting;
  if (facts === null) return posting.marks;
  const compared = FACT_CRITERIA.map((criterion) => [criterion, markFromFacts(criterion, facts, settings[criterion]?.value ?? '')] as const).filter(
    (entry): entry is readonly [FactCriterion, Mark] => entry[1] !== null
  );
  return { ...Object.fromEntries(compared), ...posting.marks };
}

function describeSalaryFact(salary: SalaryFact): string {
  const range = [salary.min, salary.max].filter((amount): amount is number => amount !== null);
  const amounts = [...new Set(range)].map(formatAmount).join('–');
  const basis = salary.basis ? ` ${PAY_BASIS_LABELS[salary.basis]()}` : '';
  return m.fact_salary({ amounts, currency: salary.currency, basis, period: PERIOD_LABELS[salary.period]() });
}

function describeFact(criterion: FactCriterion, facts: PostingFacts): string {
  if (isChoiceCriterion(criterion)) {
    const named = facts.choices[criterion] ?? [];
    return named.length > 0 ? m.fact_choices({ value: choiceLabels(named) }) : m.fact_none();
  }
  switch (criterion) {
    case 'work_location':
      return facts.workSetup ? m.fact_work_setup({ setup: WORK_SETUP_LABELS[facts.workSetup]() }) : m.fact_none();
    case 'salary_minimum':
      return facts.salary ? describeSalaryFact(facts.salary) : m.fact_none();
    case 'industries_avoid':
      if (facts.industry === null) return m.fact_none();
      return m.fact_industry({ industry: facts.industry === 'other' ? m.industry_other() : INDUSTRY_LABELS[facts.industry]() });
    case 'company_size':
      return facts.companySize ? m.fact_company_size({ size: COMPANY_SIZE_LABELS[facts.companySize]() }) : m.fact_none();
    case 'employer_rating':
      return facts.rating === null ? m.fact_none() : m.fact_rating({ rating: String(facts.rating) });
  }
}

export type MarkSource = 'ai' | 'you' | 'merit';

/** Who gave a criterion's current mark: the AI engine (a mark with its reason), the user (one without), or Merit
    comparing a fact with the criterion's value; null while it has none. */
export function markSource(posting: Pick<Posting, 'marks' | 'facts' | 'reasons'>, criterion: string): MarkSource | null {
  if (criterion in posting.marks) return posting.reasons[criterion] ? 'ai' : 'you';
  return isCompared(posting, criterion) ? 'merit' : null;
}

/** Whether Merit compares this criterion from the posting's facts (rather than a mark from the engine or the user). */
export function isCompared(posting: Pick<Posting, 'facts'>, criterion: string): boolean {
  const { facts } = posting;
  if (facts === null || !isFactCriterion(criterion)) return false;
  return !isChoiceCriterion(criterion) || facts.choices[criterion] !== undefined;
}

/** Why each current mark is what it is: the engine's reason, or for a compared one, what the posting says. A mark
    the user set has none. */
export function currentReasons(posting: Pick<Posting, 'marks' | 'facts' | 'reasons'>): Record<string, string> {
  const { facts } = posting;
  if (facts === null) return posting.reasons;
  const compared = FACT_CRITERIA.filter((criterion) => !(criterion in posting.marks) && isCompared(posting, criterion)).map((criterion) => {
    const said = describeFact(criterion, facts);
    const where = facts.evidence[criterion];
    return [criterion, where ? `${said} ${where}` : said];
  });
  return { ...posting.reasons, ...Object.fromEntries(compared) };
}
