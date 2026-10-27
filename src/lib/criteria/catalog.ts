import { m } from '#lib/paraglide/messages.js';
import { CHOICE_LABELS, choiceLabels, choiceOptions, parseChoiceValue, type ChoiceCriterion } from './choices.js';
import {
  COMPANY_SIZES,
  COMPANY_SIZE_LABELS,
  INDUSTRIES,
  INDUSTRY_LABELS,
  describeSalaryWanted,
  parseCompanySizes,
  parseIndustries,
  parseWantedIndustries,
  WANTED_INDUSTRIES,
  WANTED_INDUSTRY_LABELS,
  parseSalaryWanted
} from './values.js';

/** How likely a posting is to say something about the criterion — shown beside it, so the user knows what to expect.
    Three steps on one scale, usually · sometimes · rarely: the ones found elsewhere
    (reviews, a lookup) or asked in an interview are all "rarely" to the reader; the posting page still links a search. */
const RARELY = { icon: 'icon-warning-circle', label: () => m.findability_rarely() };
export const FINDABILITY = {
  posting: { icon: 'icon-check-circle', label: () => m.findability_posting() },
  sometimes: { icon: 'icon-minus-circle', label: () => m.findability_sometimes() },
  reviews: RARELY,
  findable: RARELY,
  oftenMissing: RARELY,
  interview: RARELY
} as const;

export type Findability = keyof typeof FINDABILITY;

export interface ValueOption {
  id: string;
  label: () => string;
}

export interface ValueInput {
  kind: 'text' | 'number' | 'select' | 'salary' | 'choices';
  label: () => string;
  options?: ValueOption[];
}

export interface Criterion {
  id: string;
  title: () => string;
  description: () => string;
  findability: Findability;
  value?: ValueInput;
  /** The line in "Your set"; gets the value as the user typed it (or the chosen option's label). */
  summary: (value: string) => string;
}

export interface Category {
  id: string;
  title: () => string;
  criteria: Criterion[];
}

function salarySummary(value: string): string {
  const salary = parseSalaryWanted(value);
  return salary ? m.crit_salary_summary({ value: describeSalaryWanted(salary) }) : m.crit_salary_title();
}

function industriesSummary(value: string): string {
  const industries = parseIndustries(value);
  if (industries.length === 0) return m.crit_industries_title();
  return m.crit_industries_summary({ value: industries.map((industry) => INDUSTRY_LABELS[industry]()).join(', ') });
}

function wantedIndustriesSummary(value: string): string {
  const industries = parseWantedIndustries(value);
  if (industries.length === 0) return m.crit_mission_title();
  return m.crit_mission_summary({ value: industries.map((industry) => WANTED_INDUSTRY_LABELS[industry]()).join(', ') });
}

function companySizeSummary(value: string): string {
  const sizes = parseCompanySizes(value);
  if (sizes.length === 0) return m.crit_company_size_title();
  return m.crit_company_size_summary({ value: sizes.map((size) => COMPANY_SIZE_LABELS[size]()).join(', ') });
}

/** A criterion with no value: its line in "Your set" is its title. */
function plain(id: string, title: () => string, description: () => string, findability: Findability): Criterion {
  return { id, title, description, findability, summary: () => title() };
}

/** A criterion with a value the user types, which the engine weighs with the posting. */
function typed(
  id: string,
  copy: { title: () => string; description: () => string; value: () => string; summary: (value: string) => string },
  findability: Findability,
  kind: 'text' | 'number' = 'text'
): Criterion {
  return {
    id,
    title: copy.title,
    description: copy.description,
    findability,
    value: { kind, label: copy.value },
    summary: (value) => (value ? copy.summary(value) : copy.title())
  };
}

/** A criterion made of ticked options, which the posting states and Merit compares (choices.ts). */
function ticked(
  id: ChoiceCriterion,
  copy: { title: () => string; description: () => string; value: () => string; summary: (value: string) => string },
  findability: Findability
): Criterion {
  return {
    id,
    title: copy.title,
    description: copy.description,
    findability,
    value: { kind: 'choices', label: copy.value, options: choiceOptions(id).map((option) => ({ id: option, label: CHOICE_LABELS[option] })) },
    summary: (value) => {
      const chosen = parseChoiceValue(id, value);
      return chosen.length > 0 ? copy.summary(choiceLabels(chosen)) : copy.title();
    }
  };
}

const INDUSTRY_OPTIONS: ValueOption[] = INDUSTRIES.map((industry) => ({ id: industry, label: INDUSTRY_LABELS[industry] }));
const WANTED_INDUSTRY_OPTIONS: ValueOption[] = WANTED_INDUSTRIES.map((industry) => ({ id: industry, label: WANTED_INDUSTRY_LABELS[industry] }));
const COMPANY_SIZE_OPTIONS: ValueOption[] = COMPANY_SIZES.map((size) => ({ id: size, label: COMPANY_SIZE_LABELS[size] }));

const WORK_LOCATION_OPTIONS: ValueOption[] = [
  { id: 'remote_or_hybrid', label: () => m.crit_location_remote_or_hybrid() },
  { id: 'remote_only', label: () => m.crit_location_remote_only() },
  { id: 'office_ok', label: () => m.crit_location_office_ok() }
];

const EMPLOYER: Category = {
  id: 'employer',
  title: () => m.category_employer(),
  criteria: [
    {
      id: 'no_outsourcing',
      title: () => m.crit_no_outsourcing_title(),
      description: () => m.crit_no_outsourcing_desc(),
      findability: 'posting',
      summary: () => m.crit_no_outsourcing_title()
    },
    {
      id: 'employer_rating',
      title: () => m.crit_rating_title(),
      description: () => m.crit_rating_desc(),
      findability: 'reviews',
      value: { kind: 'number', label: () => m.crit_rating_value() },
      summary: (value) => (value ? m.crit_rating_summary({ value }) : m.crit_rating_title())
    },
    {
      id: 'industries_avoid',
      title: () => m.crit_industries_title(),
      description: () => m.crit_industries_desc(),
      findability: 'posting',
      value: { kind: 'choices', label: () => m.crit_industries_value(), options: INDUSTRY_OPTIONS },
      summary: (value) => industriesSummary(value)
    },
    {
      id: 'company_size',
      title: () => m.crit_company_size_title(),
      description: () => m.crit_company_size_desc(),
      findability: 'findable',
      value: { kind: 'choices', label: () => m.crit_company_size_value(), options: COMPANY_SIZE_OPTIONS },
      summary: (value) => companySizeSummary(value)
    },
    {
      id: 'direct_hire',
      title: () => m.crit_direct_hire_title(),
      description: () => m.crit_direct_hire_desc(),
      findability: 'posting',
      summary: () => m.crit_direct_hire_title()
    },
    plain('own_product', () => m.crit_own_product_title(), () => m.crit_own_product_desc(), 'posting'),
    // Ticked, like the industries to avoid, but weighed by the engine from the posting: the ticks reach it in words
    {
      id: 'mission',
      title: () => m.crit_mission_title(),
      description: () => m.crit_mission_desc(),
      findability: 'posting',
      value: { kind: 'choices', label: () => m.crit_mission_value(), options: WANTED_INDUSTRY_OPTIONS },
      summary: (value) => wantedIndustriesSummary(value)
    }
  ]
};

const WORK_SETUP: Category = {
  id: 'work_setup',
  title: () => m.category_work_setup(),
  criteria: [
    {
      id: 'work_location',
      title: () => m.crit_location_title(),
      description: () => m.crit_location_desc(),
      findability: 'posting',
      value: { kind: 'select', label: () => m.crit_location_value(), options: WORK_LOCATION_OPTIONS },
      summary: (value) => WORK_LOCATION_OPTIONS.find((option) => option.id === value)?.label() ?? m.crit_location_title()
    },
    {
      id: 'flexible_hours',
      title: () => m.crit_flexible_hours_title(),
      description: () => m.crit_flexible_hours_desc(),
      findability: 'sometimes',
      summary: () => m.crit_flexible_hours_title()
    },
    {
      id: 'no_shifts',
      title: () => m.crit_no_shifts_title(),
      description: () => m.crit_no_shifts_desc(),
      findability: 'sometimes',
      summary: () => m.crit_no_shifts_title()
    },
    typed(
      'commute',
      {
        title: () => m.crit_commute_title(),
        description: () => m.crit_commute_desc(),
        value: () => m.crit_commute_value(),
        summary: (value) => m.crit_commute_summary({ value })
      },
      'posting'
    )
  ]
};

const CONTRACT: Category = {
  id: 'contract',
  title: () => m.category_contract(),
  criteria: [
    ticked(
      'contract_type',
      {
        title: () => m.crit_contract_type_title(),
        description: () => m.crit_contract_type_desc(),
        value: () => m.crit_choices_value(),
        summary: (value) => m.crit_contract_type_summary({ value })
      },
      'posting'
    ),
    ticked(
      'contract_duration',
      {
        title: () => m.crit_contract_duration_title(),
        description: () => m.crit_contract_duration_desc(),
        value: () => m.crit_choices_value(),
        summary: (value) => m.crit_contract_duration_summary({ value })
      },
      'posting'
    ),
    ticked(
      'working_hours',
      {
        title: () => m.crit_working_hours_title(),
        description: () => m.crit_working_hours_desc(),
        value: () => m.crit_choices_value(),
        summary: (value) => m.crit_working_hours_summary({ value })
      },
      'posting'
    )
  ]
};

const PAY: Category = {
  id: 'pay',
  title: () => m.category_pay(),
  criteria: [
    {
      id: 'salary_minimum',
      title: () => m.crit_salary_title(),
      description: () => m.crit_salary_desc(),
      findability: 'oftenMissing',
      value: { kind: 'salary', label: () => m.crit_salary_value() },
      summary: (value) => salarySummary(value)
    },
    plain('bonus_equity', () => m.crit_bonus_equity_title(), () => m.crit_bonus_equity_desc(), 'sometimes'),
    plain('health_insurance', () => m.crit_health_insurance_title(), () => m.crit_health_insurance_desc(), 'sometimes'),
    typed(
      'paid_time_off',
      {
        title: () => m.crit_paid_time_off_title(),
        description: () => m.crit_paid_time_off_desc(),
        value: () => m.crit_paid_time_off_value(),
        summary: (value) => m.crit_paid_time_off_summary({ value })
      },
      'sometimes',
      'number'
    ),
    plain('learning_budget', () => m.crit_learning_budget_title(), () => m.crit_learning_budget_desc(), 'sometimes'),
    plain('parental_leave', () => m.crit_parental_leave_title(), () => m.crit_parental_leave_desc(), 'sometimes')
  ]
};

const ROLE: Category = {
  id: 'role',
  title: () => m.category_role(),
  criteria: [
    ticked(
      'seniority',
      {
        title: () => m.crit_seniority_title(),
        description: () => m.crit_seniority_desc(),
        value: () => m.crit_choices_value(),
        summary: (value) => m.crit_seniority_summary({ value })
      },
      'posting'
    ),
    ticked(
      'role_type',
      {
        title: () => m.crit_role_type_title(),
        description: () => m.crit_role_type_desc(),
        value: () => m.crit_choices_value(),
        summary: (value) => m.crit_role_type_summary({ value })
      },
      'posting'
    ),
    plain('end_to_end', () => m.crit_end_to_end_title(), () => m.crit_end_to_end_desc(), 'sometimes'),
    plain('clear_scope', () => m.crit_clear_scope_title(), () => m.crit_clear_scope_desc(), 'posting'),
    plain('no_extras', () => m.crit_no_extras_title(), () => m.crit_no_extras_desc(), 'posting'),
    plain('little_travel', () => m.crit_little_travel_title(), () => m.crit_little_travel_desc(), 'sometimes'),
    plain('design_system', () => m.crit_design_system_title(), () => m.crit_design_system_desc(), 'sometimes'),
    plain('accessibility', () => m.crit_accessibility_title(), () => m.crit_accessibility_desc(), 'sometimes')
  ]
};

/** Only what a posting states or the user can look up: what is usually clarified in
    an interview is a question for the interview (interview/topics.ts), not a criterion. */
export const CATEGORIES: Category[] = [EMPLOYER, WORK_SETUP, CONTRACT, PAY, ROLE];

export const ALL_CRITERIA: Criterion[] = CATEGORIES.flatMap((category) => category.criteria);
