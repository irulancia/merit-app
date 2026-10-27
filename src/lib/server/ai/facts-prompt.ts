import { CHOICE_CRITERIA, CHOICE_FACTS, CHOICE_PROMPTS } from '#lib/criteria/choices.js';
import { COMPANY_SIZES, CURRENCIES, INDUSTRIES, PAY_BASES, PERIODS } from '#lib/criteria/values.js';
import { FACT_CRITERIA, WORK_SETUPS } from '#lib/postings/facts.js';

/** The facts asked of every posting, whatever the user's criteria: Merit compares them itself, so turning a
    criterion on or changing its value later needs no new check. An empty string or 0 means the posting doesn't say. */
export const FACTS_SCHEMA = {
  type: 'object',
  properties: {
    workSetup: { type: 'string', enum: [...WORK_SETUPS, ''] },
    salary: {
      type: 'object',
      properties: {
        min: { type: 'number', description: 'The lowest figure; 0 if none.' },
        max: { type: 'number', description: 'The highest figure; the same as min for a single figure; 0 if none.' },
        currency: { type: 'string', enum: [...CURRENCIES, ''] },
        period: { type: 'string', enum: [...PERIODS, ''] },
        basis: { type: 'string', enum: [...PAY_BASES, ''] }
      },
      required: ['min', 'max', 'currency', 'period', 'basis']
    },
    industry: { type: 'string', enum: [...INDUSTRIES, 'other', ''] },
    companySize: { type: 'string', enum: [...COMPANY_SIZES, ''] },
    rating: { type: 'number', description: 'An employer rating the posting itself states; 0 if none.' },
    choices: {
      type: 'object',
      properties: Object.fromEntries(
        CHOICE_CRITERIA.map((criterion) => [criterion, { type: 'array', items: { type: 'string', enum: [...CHOICE_FACTS[criterion]] } }])
      ),
      required: [...CHOICE_CRITERIA]
    },
    evidence: {
      type: 'object',
      properties: Object.fromEntries(FACT_CRITERIA.map((criterion) => [criterion, { type: 'string' }])),
      required: [...FACT_CRITERIA]
    }
  },
  required: ['workSetup', 'salary', 'industry', 'companySize', 'rating', 'choices', 'evidence']
};

export const FACTS_INSTRUCTIONS = [
  'Also report these facts, from the posting only, whatever the criteria (an empty string or 0 when it does not say):',
  '- workSetup: remote, hybrid or office.',
  '- salary: the figures as stated (min and max; the same number twice for a single figure), the currency, per month or year,',
  '  and gross or net. Leave currency, period or basis empty when the posting does not state them; never convert.',
  `- industry: the company's industry if it is one of ${INDUSTRIES.join(', ')}; "other" for any other industry.`,
  '- companySize: by headcount as the posting states it: startup (under 50 people), scaleup (50 to 500), large (over 500).',
  '- rating: only an employer rating the posting itself states; never from outside knowledge.',
  '- choices: for each of these, every option the posting names or clearly offers (several when it offers several, such as',
  '  "full-time or part-time" or "mid to senior"); an empty list when it does not say:',
  ...CHOICE_CRITERIA.map((criterion) => `  - ${criterion}: ${CHOICE_PROMPTS[criterion]}`),
  `- evidence: for each of ${FACT_CRITERIA.join(', ')}, one short sentence quoting or pointing to where the posting says it; empty if it does not.`
];
