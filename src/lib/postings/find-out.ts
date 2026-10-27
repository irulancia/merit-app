import type { Criterion, Findability } from '#lib/criteria/catalog.js';
import { CRITERION_QUESTIONS } from '#lib/criteria/questions.js';

/** What the user can do about a criterion the posting doesn't mention: ask the employer, or look it up themselves
    (public reviews, the company's own pages). Which one follows the criterion's findability. */
export type FindOut = { kind: 'ask'; question: string } | { kind: 'lookUp'; query: string; href: string } | null;

/** The criteria the user can find out about online rather than by asking. */
const LOOKED_UP: Findability[] = ['reviews', 'findable'];

/** What to search for, beside the company's name; reviews by default. */
const SEARCH_TERMS: Record<string, string> = {
  employer_rating: 'Glassdoor rating',
  company_size: 'number of employees',
  low_turnover: 'employee reviews',
  feedback_culture: 'employee reviews culture',
  time_off_respected: 'employee reviews work-life balance'
};

const SEARCH_URL = 'https://www.google.com/search?q=';

export function isLookedUp(criterion: Pick<Criterion, 'findability'>): boolean {
  return LOOKED_UP.includes(criterion.findability);
}

/** How to find out about a criterion; a look-up needs the company's name, so without one there is nothing to offer. */
export function findOut(criterion: Pick<Criterion, 'id' | 'findability'>, company: string): FindOut {
  if (isLookedUp(criterion)) {
    const name = company.trim();
    if (!name) return null;
    const query = `${name} ${SEARCH_TERMS[criterion.id] ?? 'reviews'}`;
    return { kind: 'lookUp', query, href: `${SEARCH_URL}${encodeURIComponent(query)}` };
  }
  const question = CRITERION_QUESTIONS[criterion.id];
  return question ? { kind: 'ask', question: question() } : null;
}
