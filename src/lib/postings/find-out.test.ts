import { describe, expect, it } from 'vitest';
import { findOut } from './find-out.js';

describe('findOut', () => {
  it('offers a search for what public reviews or the company’s pages tell', () => {
    expect(findOut({ id: 'employer_rating', findability: 'reviews' }, 'Lumen')).toEqual({
      kind: 'lookUp',
      query: 'Lumen Glassdoor rating',
      href: 'https://www.google.com/search?q=Lumen%20Glassdoor%20rating'
    });
  });

  it('offers nothing to look up while the company is unknown', () => {
    expect(findOut({ id: 'low_turnover', findability: 'reviews' }, ' ')).toBeNull();
  });

  it('offers the question for the rest', () => {
    expect(findOut({ id: 'flexible_hours', findability: 'sometimes' }, 'Lumen')).toMatchObject({ kind: 'ask' });
  });
});
