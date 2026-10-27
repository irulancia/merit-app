import { describe, expect, it } from 'vitest';
import type { Application } from '#lib/applications/types.js';
import { toEntries } from '#lib/postings/list.js';
import type { PostingSummary } from '#lib/postings/types.js';
import { needsFrom } from './needs.js';

const NOW = new Date('2026-10-21T10:00:00.000Z').getTime();
const DAYS_AGO = (days: number) => new Date(NOW - days * 86_400_000).toISOString();

function posting(id: string, application: Application | null = null): PostingSummary {
  return {
    id,
    source: 'text',
    title: `Posting ${id}`,
    company: '',
    link: '',
    image: '',
    linkRead: false,
    marks: {},
    facts: null,
    openedAt: '',
    keptAnyway: false,
    reasons: {},
    titleEdited: false,
    checkedAt: '',
    checkedWith: '',
    application,
    coverLetter: '',
    letterBasis: '',
    notes: '',
    archived: false,
    asideReason: '',
    summary: null,
    createdAt: DAYS_AGO(20),
    excerpt: ''
  };
}

const app = (stage: Application['stage'], appliedDaysAgo = 0): Application => ({
  stage,
  stageAt: DAYS_AGO(appliedDaysAgo),
  appliedAt: stage === 'want' ? '' : DAYS_AGO(appliedDaysAgo),
  closedReason: stage === 'closed' ? 'notSelected' : '',
  feedback: '',
  feedbackRequest: ''
});

describe('needsFrom', () => {
  it('lists offers, then applications gone quiet, then postings to check', () => {
    const entries = toEntries(
      [posting('a', app('applied', 12)), posting('c', app('offer', 1)), posting('d')],
      { no_outsourcing: { level: 'must', value: '' } }
    );
    expect(needsFrom(entries, NOW).map((need) => need.kind)).toEqual(['offer', 'followUp', 'toCheck']);
  });

  // With no criteria in use every posting is still "to check"; these look at applications only
  const applicationNeeds = (entries: ReturnType<typeof toEntries>) => needsFrom(entries, NOW).filter((need) => need.kind !== 'toCheck');

  it('only follows up after a week with no news, and never on a closed one', () => {
    const entries = toEntries([posting('a', app('applied', 3)), posting('b', app('closed', 30))], {});
    expect(applicationNeeds(entries)).toEqual([]);
  });

  it('puts the longest silence first', () => {
    const entries = toEntries([posting('a', app('applied', 8)), posting('b', app('applied', 20))], {});
    expect(applicationNeeds(entries).map((need) => ('days' in need ? need.days : null))).toEqual([20, 8]);
  });
});
