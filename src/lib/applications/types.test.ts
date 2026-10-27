import { describe, expect, it } from 'vitest';
import { daysWithoutReply } from './text.js';
import { moveApplication, parseApplication, type Application } from './types.js';

const T1 = '2026-10-01T10:00:00.000Z';
const T2 = '2026-10-05T10:00:00.000Z';

describe('moveApplication', () => {
  it('wanting to apply has no date applied yet', () => {
    expect(moveApplication(null, 'want', '', T1)).toEqual({ stage: 'want', stageAt: T1, appliedAt: '', closedReason: '', feedback: '', feedbackRequest: '' });
  });

  it('sets the date applied on the first move past "want", and keeps it after', () => {
    const applied = moveApplication(moveApplication(null, 'want', '', T1), 'applied', '', T1);
    expect(applied.appliedAt).toBe(T1);
    expect(moveApplication(applied, 'interviewing', '', T2).appliedAt).toBe(T1);
  });

  it('forgets the date applied when it goes back to "want" (it was marked applied by mistake)', () => {
    const applied = moveApplication(moveApplication(null, 'want', '', T1), 'applied', '', T1);
    expect(moveApplication(applied, 'want', '', T2)).toMatchObject({ stage: 'want', appliedAt: '' });
  });

  it('keeps the feedback through every move', () => {
    const closed = { ...moveApplication(null, 'closed', 'notSelected', T1), feedback: 'Portfolio too broad.' };
    expect(moveApplication(closed, 'applied', '', T2)).toMatchObject({ feedback: 'Portfolio too broad.' });
  });

  it('keeps a reason only while closed', () => {
    const closed = moveApplication(null, 'closed', 'withdrew', T1);
    expect(closed.closedReason).toBe('withdrew');
    expect(moveApplication(closed, 'applied', 'withdrew', T2).closedReason).toBe('');
  });
});

describe('parseApplication', () => {
  it('reads a saved one and drops what is not valid', () => {
    expect(parseApplication({ stage: 'offer', stageAt: T1, appliedAt: T1, closedReason: 'nonsense' })).toEqual({
      stage: 'offer',
      stageAt: T1,
      appliedAt: T1,
      closedReason: '',
      feedback: '',
      feedbackRequest: ''
    });
    expect(parseApplication({ stage: 'hired' })).toBeNull();
    expect(parseApplication(null)).toBeNull();
  });
});

describe('daysWithoutReply', () => {
  const applied: Application = { stage: 'applied', stageAt: T1, appliedAt: T1, closedReason: '', feedback: '', feedbackRequest: '' };

  it('counts the days once a week has passed with no news', () => {
    expect(daysWithoutReply(applied, new Date(T1).getTime() + 6 * 86_400_000)).toBeNull();
    expect(daysWithoutReply(applied, new Date(T1).getTime() + 10 * 86_400_000)).toBe(10);
  });

  it('says nothing once it has moved on', () => {
    expect(daysWithoutReply({ ...applied, stage: 'interviewing' }, new Date(T2).getTime() + 30 * 86_400_000)).toBeNull();
  });
});
