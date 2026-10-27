import { describe, expect, it } from 'vitest';
import { greetingFor, headlineFor } from './headline.js';
import type { Need } from './needs.js';

const FOLLOW_UP: Need = { kind: 'followUp', postingId: 'a', title: 'A', days: 10 };

describe('headlineFor', () => {
  it('leads with postings worth a look, and mentions what else waits', () => {
    const headline = headlineFor(2, 3, [FOLLOW_UP, { kind: 'toCheck', count: 3 }], 1);
    expect(headline.title).toBe('2 postings are worth a look');
    expect(headline.detail).toBe('1 application needs you · 3 more waiting to be checked');
    expect(headline.action).toBe('check');
  });

  it('says one posting in the singular', () => {
    expect(headlineFor(1, 0, [], 1).title).toBe('1 posting is worth a look');
  });

  it('with nothing worth a look yet, leads with what to check — without repeating it below', () => {
    const headline = headlineFor(0, 4, [{ kind: 'toCheck', count: 4 }], 1);
    expect(headline.title).toBe('4 postings are waiting to be checked');
    expect(headline.detail).toBe('');
    expect(headline.action).toBe('check');
  });

  it('with no postings yet, a fresh start', () => {
    expect(headlineFor(0, 0, [], 0)).toEqual({ title: 'A fresh start. Which posting caught your eye first?', detail: '', action: 'add' });
  });

  it('with every posting handled, all caught up', () => {
    expect(headlineFor(0, 0, [], 6)).toEqual({ title: 'You’re all caught up. Found something new?', detail: '', action: 'add' });
  });
});

describe('greetingFor', () => {
  it('follows the time of day', () => {
    expect(greetingFor(8)).toBe('Good morning');
    expect(greetingFor(14)).toBe('Good afternoon');
    expect(greetingFor(21)).toBe('Good evening');
  });
});
