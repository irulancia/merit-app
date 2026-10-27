import { describe, expect, it } from 'vitest';
import { INTERVIEW_TOPICS, parseTopics, topicsFromOldCriteria } from './topics.js';

describe('topicsFromOldCriteria', () => {
  it('starts from the criteria that were in use, mentoring counted as other designers', () => {
    const old = {
      user_access: { level: 'must', value: '' },
      mentoring: { level: 'weigh', value: '' },
      career_path: { level: 'off', value: '' },
      work_location: { level: 'must', value: 'remote_only' }
    };
    expect(topicsFromOldCriteria(old)).toEqual(['user_access', 'other_designers']);
  });

  it('ticks every topic when none of them was in use', () => {
    expect(topicsFromOldCriteria({})).toHaveLength(INTERVIEW_TOPICS.length);
    expect(topicsFromOldCriteria(null)).toHaveLength(INTERVIEW_TOPICS.length);
  });
});

describe('parseTopics', () => {
  it('keeps known topics only, in the list’s order', () => {
    expect(parseTopics(['career_path', 'nonsense', 'user_access', 3])).toEqual(['user_access', 'career_path']);
  });
});
