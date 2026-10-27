import { describe, expect, it } from 'vitest';
import type { CriteriaSettings } from '#lib/criteria/types.js';
import { isNew, matchesSearch, needsCheck, parseView, sortEntries, toEntries } from './list.js';
import type { PostingSummary } from './types.js';

const SETTINGS: CriteriaSettings = {
  no_outsourcing: { level: 'must', value: '' },
  work_location: { level: 'weigh', value: 'remote_or_hybrid' }
};

function posting(id: string, changes: Partial<PostingSummary> = {}): PostingSummary {
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
    keptAnyway: false,
    reasons: {},
    titleEdited: false,
    checkedAt: '',
    checkedWith: '',
    application: null,
    coverLetter: '',
    letterBasis: '',
    notes: '',
    archived: false,
    asideReason: '',
    summary: null,
    createdAt: `2026-10-0${id}T10:00:00.000Z`,
    openedAt: `2026-10-0${id}T11:00:00.000Z`,
    excerpt: 'A posting.',
    ...changes
  };
}

describe('toEntries: each posting in one tab', () => {
  it('puts every posting being weighed under Considering, checked or not', () => {
    const entries = toEntries(
      [posting('1'), posting('2', { marks: { no_outsourcing: 'pass' } }), posting('3', { marks: { no_outsourcing: 'pass', work_location: 'miss' } })],
      SETTINGS
    );
    expect(entries.map((entry) => entry.view)).toEqual(['considering', 'considering', 'considering']);
  });

  it('filters out a miss on a non-negotiable, unless brought back', () => {
    const entries = toEntries(
      [posting('1', { marks: { no_outsourcing: 'miss' } }), posting('2', { marks: { no_outsourcing: 'miss', work_location: 'pass' }, keptAnyway: true })],
      SETTINGS
    );
    expect(entries.map((entry) => entry.view)).toEqual(['notSure', 'considering']);
  });

  it('puts the ones set aside by the user under Not sure too', () => {
    expect(toEntries([posting('1', { archived: true, marks: { no_outsourcing: 'pass', work_location: 'pass' } })], SETTINGS)[0].view).toBe('notSure');
  });

  it('an application wins over everything: applying while open, closed once it ends', () => {
    const application = { stage: 'applied', stageAt: '2026-10-05T10:00:00.000Z', appliedAt: '2026-10-05T10:00:00.000Z', closedReason: '', feedback: '', feedbackRequest: '' } as const;
    const entries = toEntries(
      [
        posting('1', { archived: true, marks: { no_outsourcing: 'miss' }, application }),
        posting('2', { application: { ...application, stage: 'closed', closedReason: 'notSelected' } })
      ],
      SETTINGS
    );
    expect(entries.map((entry) => entry.view)).toEqual(['applying', 'closed']);
  });
});

describe('sortEntries', () => {
  const entries = toEntries(
    [
      posting('1', { marks: { no_outsourcing: 'pass', work_location: 'pass' } }),
      posting('2', { marks: { no_outsourcing: 'pass', work_location: 'miss' } }),
      posting('3')
    ],
    SETTINGS
  );

  it('newest first', () => {
    expect(sortEntries(entries, 'newest').map((entry) => entry.posting.id)).toEqual(['3', '2', '1']);
  });

  it('best fit first, the unchecked last', () => {
    expect(sortEntries(entries, 'fit').map((entry) => entry.posting.id)).toEqual(['1', '2', '3']);
  });
});

describe('matchesSearch', () => {
  const [entry] = toEntries([posting('1', { title: 'UX Researcher', company: 'Lumen Bank' })], SETTINGS);

  it('finds by title or company, ignoring case', () => {
    expect(matchesSearch(entry, 'researcher')).toBe(true);
    expect(matchesSearch(entry, 'LUMEN')).toBe(true);
    expect(matchesSearch(entry, 'insurance')).toBe(false);
    expect(matchesSearch(entry, '  ')).toBe(true);
  });
});

describe('parseView', () => {
  it('lands the former To check and Worth a look on Considering', () => {
    expect(parseView('check')).toBe('considering');
    expect(parseView('worth')).toBe('considering');
    expect(parseView('applying')).toBe('applying');
    expect(parseView('nonsense')).toBeNull();
    expect(parseView(null)).toBeNull();
  });
});

describe('isNew', () => {
  it('is new until its page is opened', () => {
    expect(isNew(posting('1', { openedAt: '' }))).toBe(true);
    expect(isNew(posting('1'))).toBe(false);
  });
});

describe('needsCheck', () => {
  const facts = { workSetup: 'remote', salary: null, industry: 'other', companySize: null, rating: null, choices: {}, evidence: {} } as const;

  it('finds a posting never checked, and one with a criterion left unmarked', () => {
    const [never, partly] = toEntries([posting('1'), posting('2', { marks: { no_outsourcing: 'pass' }, facts })], SETTINGS);
    expect(needsCheck(never)).toBe(true);
    expect(needsCheck(partly)).toBe(false);
    const [missing] = toEntries([posting('3', { marks: {}, facts })], SETTINGS);
    expect(needsCheck(missing)).toBe(true);
  });

  it('finds one checked before facts were read while a criterion with a value is in use', () => {
    const [old] = toEntries([posting('1', { marks: { no_outsourcing: 'pass', work_location: 'pass' } })], SETTINGS);
    expect(needsCheck(old)).toBe(true);
  });

  it('leaves alone a closed one, and one with nothing to read', () => {
    const closed = { stage: 'closed', stageAt: '', appliedAt: '', closedReason: 'noReply', feedback: '', feedbackRequest: '' } as const;
    const [ended, empty] = toEntries([posting('1', { application: closed }), posting('2', { excerpt: '', image: '' })], SETTINGS);
    expect(needsCheck(ended)).toBe(false);
    expect(needsCheck(empty)).toBe(false);
  });
});
