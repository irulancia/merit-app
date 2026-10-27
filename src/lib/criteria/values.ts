import { m } from '#lib/paraglide/messages.js';

/** The values a posting's facts are compared with. A criterion's value is saved as one string (criteria.json),
    so a salary and a list of industries each have their own small format, read and written only here. */

export const CURRENCIES = ['EUR', 'RON', 'USD', 'GBP'] as const;
export type Currency = (typeof CURRENCIES)[number];

export const PERIODS = ['month', 'year'] as const;
export type Period = (typeof PERIODS)[number];

export const PAY_BASES = ['gross', 'net'] as const;
export type PayBasis = (typeof PAY_BASES)[number];

/** The industries a posting is sorted into; "other" is any industry not listed, never one to avoid. */
export const INDUSTRIES = [
  'gambling',
  'tobacco',
  'alcohol',
  'weapons',
  'crypto',
  'adtech',
  'fast_fashion',
  'fossil_fuels',
  'predatory_lending',
  'mlm',
  'adult'
] as const;
export type Industry = (typeof INDUSTRIES)[number];

export const INDUSTRY_LABELS: Record<Industry, () => string> = {
  gambling: () => m.industry_gambling(),
  tobacco: () => m.industry_tobacco(),
  alcohol: () => m.industry_alcohol(),
  weapons: () => m.industry_weapons(),
  crypto: () => m.industry_crypto(),
  adtech: () => m.industry_adtech(),
  fast_fashion: () => m.industry_fast_fashion(),
  fossil_fuels: () => m.industry_fossil_fuels(),
  predatory_lending: () => m.industry_predatory_lending(),
  mlm: () => m.industry_mlm(),
  adult: () => m.industry_adult()
};

/** The industries a user can want to work in: the
    fields designers often work in. Weighed by the engine from the posting, not sorted into like the ones to avoid. */
export const WANTED_INDUSTRIES = [
  'health',
  'education',
  'climate',
  'finance',
  'ecommerce',
  'b2b_software',
  'public_nonprofit',
  'media',
  'travel',
  'gaming',
  'consumer_apps'
] as const;
export type WantedIndustry = (typeof WANTED_INDUSTRIES)[number];

export const WANTED_INDUSTRY_LABELS: Record<WantedIndustry, () => string> = {
  health: () => m.wanted_health(),
  education: () => m.wanted_education(),
  climate: () => m.wanted_climate(),
  finance: () => m.wanted_finance(),
  ecommerce: () => m.wanted_ecommerce(),
  b2b_software: () => m.wanted_b2b_software(),
  public_nonprofit: () => m.wanted_public_nonprofit(),
  media: () => m.wanted_media(),
  travel: () => m.wanted_travel(),
  gaming: () => m.wanted_gaming(),
  consumer_apps: () => m.wanted_consumer_apps()
};

/** The company sizes a posting is sorted into, by headcount: under 50, 50 to 500, over 500. */
export const COMPANY_SIZES = ['startup', 'scaleup', 'large'] as const;
export type CompanySize = (typeof COMPANY_SIZES)[number];

export const COMPANY_SIZE_LABELS: Record<CompanySize, () => string> = {
  startup: () => m.size_startup(),
  scaleup: () => m.size_scaleup(),
  large: () => m.size_large()
};

export const PERIOD_LABELS: Record<Period, () => string> = {
  month: () => m.period_month(),
  year: () => m.period_year()
};

export const PAY_BASIS_LABELS: Record<PayBasis, () => string> = {
  gross: () => m.pay_gross(),
  net: () => m.pay_net()
};

export interface SalaryWanted {
  amount: number;
  currency: Currency;
  period: Period;
  basis: PayBasis;
}

const SEPARATOR = '|';

export function isCurrency(candidate: unknown): candidate is Currency {
  return typeof candidate === 'string' && (CURRENCIES as readonly string[]).includes(candidate);
}

export function isPeriod(candidate: unknown): candidate is Period {
  return typeof candidate === 'string' && (PERIODS as readonly string[]).includes(candidate);
}

export function isPayBasis(candidate: unknown): candidate is PayBasis {
  return typeof candidate === 'string' && (PAY_BASES as readonly string[]).includes(candidate);
}

export function isIndustry(candidate: unknown): candidate is Industry {
  return typeof candidate === 'string' && (INDUSTRIES as readonly string[]).includes(candidate);
}

/** "4000|EUR|month|net"; null for anything else (an empty value, or one typed before this format). */
export function parseSalaryWanted(value: string): SalaryWanted | null {
  const [amountText, currency, period, basis] = value.split(SEPARATOR);
  const amount = Number(amountText);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  if (!isCurrency(currency) || !isPeriod(period) || !isPayBasis(basis)) return null;
  return { amount, currency, period, basis };
}

export function formatSalaryWanted(salary: SalaryWanted): string {
  return [salary.amount, salary.currency, salary.period, salary.basis].join(SEPARATOR);
}

export function isCompanySize(candidate: unknown): candidate is CompanySize {
  return typeof candidate === 'string' && (COMPANY_SIZES as readonly string[]).includes(candidate);
}

/** A value made of ticked options, "gambling,crypto"; unknown ids are dropped. */
export function parseChoices<T extends string>(value: string, isKnown: (candidate: unknown) => candidate is T): T[] {
  return value.split(',').filter(isKnown);
}

/** The ticked options as a value, in the list's own order whatever the order they were ticked in. */
export function formatChoices(order: readonly string[], chosen: readonly string[]): string {
  return order.filter((option) => chosen.includes(option)).join(',');
}

export function parseIndustries(value: string): Industry[] {
  return parseChoices(value, isIndustry);
}

function isWantedIndustry(candidate: unknown): candidate is WantedIndustry {
  return typeof candidate === 'string' && (WANTED_INDUSTRIES as readonly string[]).includes(candidate);
}

export function parseWantedIndustries(value: string): WantedIndustry[] {
  return parseChoices(value, isWantedIndustry);
}

export function parseCompanySizes(value: string): CompanySize[] {
  return parseChoices(value, isCompanySize);
}

export function formatAmount(amount: number): string {
  return amount.toLocaleString('en');
}

/** "4,000 EUR net a month", for the criterion's line in the user's set and on a posting. */
export function describeSalaryWanted(salary: SalaryWanted): string {
  return m.salary_wanted({
    amount: formatAmount(salary.amount),
    currency: salary.currency,
    basis: PAY_BASIS_LABELS[salary.basis](),
    period: PERIOD_LABELS[salary.period]()
  });
}
