import { describe, expect, it } from 'vitest';
import type { CriteriaSettings } from '#lib/criteria/types.js';
import { computeFit, isFilteredOut } from './fit.js';

const SETTINGS: CriteriaSettings = {
  no_outsourcing: { level: 'must', value: '' },
  salary_minimum: { level: 'must', value: '5000' },
  work_location: { level: 'weigh', value: 'remote_or_hybrid' },
  company_size: { level: 'off', value: '' }
};

describe('computeFit', () => {
  it('counts only the criteria in use, and what is not marked yet', () => {
    const fit = computeFit({ no_outsourcing: 'pass', company_size: 'miss' }, SETTINGS);
    expect(fit.inUse.map((criterion) => criterion.id)).toEqual(['no_outsourcing', 'work_location', 'salary_minimum']);
    expect(fit.counts).toEqual({ pass: 1, miss: 0, unmentioned: 0, unmarked: 2 });
    expect(fit.complete).toBe(false);
  });

  it('is complete once every criterion in use has a mark', () => {
    const fit = computeFit({ no_outsourcing: 'pass', salary_minimum: 'unmentioned', work_location: 'miss' }, SETTINGS);
    expect(fit.complete).toBe(true);
  });

  it('a miss on a non-negotiable fails it; a miss on a weighed one does not', () => {
    const fit = computeFit({ no_outsourcing: 'miss', work_location: 'miss' }, SETTINGS);
    expect(fit.failedMust.map((criterion) => criterion.id)).toEqual(['no_outsourcing']);
  });

  it('a non-negotiable not mentioned is flagged, not failed', () => {
    const fit = computeFit({ salary_minimum: 'unmentioned' }, SETTINGS);
    expect(fit.failedMust).toEqual([]);
    expect(fit.flaggedMust.map((criterion) => criterion.id)).toEqual(['salary_minimum']);
  });

  it('is never complete with no criteria in use', () => {
    expect(computeFit({}, {}).complete).toBe(false);
  });
});

describe('isFilteredOut', () => {
  const failing = computeFit({ no_outsourcing: 'miss' }, SETTINGS);

  it('filters out a posting that fails a non-negotiable', () => {
    expect(isFilteredOut(failing, false)).toBe(true);
  });

  it('keeps it when the user brought it back', () => {
    expect(isFilteredOut(failing, true)).toBe(false);
  });

  it('keeps a posting that fails nothing', () => {
    expect(isFilteredOut(computeFit({ no_outsourcing: 'pass' }, SETTINGS), false)).toBe(false);
  });
});
