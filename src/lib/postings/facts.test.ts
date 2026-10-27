import { describe, expect, it } from 'vitest';
import type { CriteriaSettings } from '#lib/criteria/types.js';
import { currentMarks, markFromFacts, parseFacts, type PostingFacts } from './facts.js';

const NOTHING: PostingFacts = { workSetup: null, salary: null, industry: null, companySize: null, rating: null, choices: {}, evidence: {} };

function facts(changes: Partial<PostingFacts>): PostingFacts {
  return { ...NOTHING, ...changes };
}

const salary = (min: number | null, max: number | null, basis: 'gross' | 'net' | '' = 'net') =>
  ({ min, max, currency: 'EUR', period: 'month', basis }) as const;

describe('markFromFacts', () => {
  it('compares the work setup with the one wanted now', () => {
    const hybrid = facts({ workSetup: 'hybrid' });
    expect(markFromFacts('work_location', hybrid, 'remote_only')).toBe('miss');
    expect(markFromFacts('work_location', hybrid, 'remote_or_hybrid')).toBe('pass');
    expect(markFromFacts('work_location', hybrid, 'office_ok')).toBe('pass');
    expect(markFromFacts('work_location', NOTHING, 'remote_only')).toBe('unmentioned');
  });

  it('passes a salary whose range reaches the minimum, a year being twelve months', () => {
    expect(markFromFacts('salary_minimum', facts({ salary: salary(3000, 4500) }), '4000|EUR|month|net')).toBe('pass');
    expect(markFromFacts('salary_minimum', facts({ salary: salary(3000, 3500) }), '4000|EUR|month|net')).toBe('miss');
    expect(markFromFacts('salary_minimum', facts({ salary: salary(3500, null) }), '40000|EUR|year|net')).toBe('pass');
  });

  it('never compares another currency or gross against net: it asks instead', () => {
    const inRon = facts({ salary: { ...salary(9000, 9000), currency: 'RON' } });
    expect(markFromFacts('salary_minimum', inRon, '4000|EUR|month|net')).toBe('unmentioned');
    expect(markFromFacts('salary_minimum', facts({ salary: salary(5000, 5000, 'gross') }), '4000|EUR|month|net')).toBe('unmentioned');
    expect(markFromFacts('salary_minimum', facts({ salary: salary(5000, 5000, '') }), '4000|EUR|month|net')).toBe('pass');
  });

  it('misses only an industry to avoid', () => {
    expect(markFromFacts('industries_avoid', facts({ industry: 'gambling' }), 'gambling,crypto')).toBe('miss');
    expect(markFromFacts('industries_avoid', facts({ industry: 'other' }), 'gambling')).toBe('pass');
    expect(markFromFacts('industries_avoid', facts({ industry: 'crypto' }), '')).toBe('pass');
  });

  it('compares a stated rating with the minimum', () => {
    expect(markFromFacts('employer_rating', facts({ rating: 3.2 }), '3.5')).toBe('miss');
    expect(markFromFacts('employer_rating', facts({ rating: 4.1 }), '3.5')).toBe('pass');
    expect(markFromFacts('employer_rating', NOTHING, '3.5')).toBe('unmentioned');
  });
});

describe('currentMarks', () => {
  const settings: CriteriaSettings = { work_location: { level: 'must', value: 'remote_only' } };

  it('follows a change of mind with no new check', () => {
    const posting = { marks: { no_outsourcing: 'pass' as const }, facts: facts({ workSetup: 'hybrid' }) };
    expect(currentMarks(posting, settings).work_location).toBe('miss');
    const changed = { work_location: { level: 'must' as const, value: 'remote_or_hybrid' } };
    expect(currentMarks(posting, changed)).toMatchObject({ work_location: 'pass', no_outsourcing: 'pass' });
  });

  it("keeps a mark the user set by hand, and an old check's marks until it is checked again", () => {
    const byHand = { marks: { work_location: 'pass' as const }, facts: facts({ workSetup: 'office' }) };
    expect(currentMarks(byHand, settings).work_location).toBe('pass');
    expect(currentMarks({ marks: { work_location: 'miss' as const }, facts: null }, settings)).toEqual({ work_location: 'miss' });
  });
});

describe('parseFacts', () => {
  it('turns what an engine left empty into "not said"', () => {
    const parsed = parseFacts({
      workSetup: '',
      salary: { min: 0, max: 0, currency: '', period: '', basis: '' },
      industry: '',
      rating: 0,
      evidence: { work_location: '', salary_minimum: ' No figure. ', made_up: 'x' }
    });
    expect(parsed).toEqual({ ...NOTHING, evidence: { salary_minimum: 'No figure.' } });
  });
});

describe('company size', () => {
  it('passes one of the sizes ticked, misses another, asks when the posting is silent', () => {
    expect(markFromFacts('company_size', facts({ companySize: 'large' }), 'scaleup,large')).toBe('pass');
    expect(markFromFacts('company_size', facts({ companySize: 'startup' }), 'scaleup,large')).toBe('miss');
    expect(markFromFacts('company_size', NOTHING, 'large')).toBe('unmentioned');
  });

  it('passes any stated size while none is ticked', () => {
    expect(markFromFacts('company_size', facts({ companySize: 'startup' }), '')).toBe('pass');
  });
});

describe('ticked options', () => {
  it('passes when the posting names one of the options ticked, misses when it names only others', () => {
    expect(markFromFacts('contract_type', facts({ choices: { contract_type: ['freelance'] } }), 'employment')).toBe('miss');
    expect(markFromFacts('seniority', facts({ choices: { seniority: ['mid', 'senior'] } }), 'senior,lead')).toBe('pass');
    expect(markFromFacts('working_hours', facts({ choices: { working_hours: ['part_time'] } }), '')).toBe('pass');
  });

  it('is not mentioned when the posting says nothing, and not checked when it was read before the criterion existed', () => {
    expect(markFromFacts('role_type', facts({ choices: { role_type: [] } }), 'individual')).toBe('unmentioned');
    expect(markFromFacts('role_type', NOTHING, 'individual')).toBeNull();
    expect(currentMarks({ marks: {}, facts: NOTHING }, { role_type: { level: 'must', value: 'individual' } })).not.toHaveProperty('role_type');
  });

  it('keeps only known options from a file', () => {
    expect(parseFacts({ choices: { seniority: ['senior', 'wizard'], contract_type: 'employment' } })?.choices).toEqual({ seniority: ['senior'] });
  });
});
