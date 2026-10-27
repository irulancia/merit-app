import { describe, expect, it } from 'vitest';
import { usefulReason } from './reasons.js';

describe('usefulReason', () => {
  it('drops a "not mentioned" reason that only says the posting is silent', () => {
    expect(usefulReason('unmentioned', 'The posting does not mention a laptop or a home-office budget.')).toBeUndefined();
    expect(usefulReason('unmentioned', "It doesn't say anything about travel.")).toBeUndefined();
    expect(usefulReason('unmentioned', 'No mention of parental leave.')).toBeUndefined();
    expect(usefulReason('unmentioned', 'Not stated.')).toBeUndefined();
  });

  it('keeps one that tells what the posting does say', () => {
    const reason = 'It asks for comfort with user research and behavioral data but does not say whether the role includes research with real users.';
    expect(usefulReason('unmentioned', reason)).toBe(reason);
  });

  it('keeps every reason for a pass or a miss', () => {
    expect(usefulReason('miss', 'The posting does not offer remote work.')).toBe('The posting does not offer remote work.');
  });
});
