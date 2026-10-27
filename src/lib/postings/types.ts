import type { Application } from '#lib/applications/types.js';
import type { PostingFacts } from './facts.js';

/** What the user pasted: the posting's text, a link to it, or a screenshot of it. */
export type PostingSource = 'text' | 'link' | 'image';

/** A criterion checked against a posting: it clearly meets it, clearly doesn't, or doesn't say. */
export const MARKS = ['pass', 'miss', 'unmentioned'] as const;
export type Mark = (typeof MARKS)[number];

export function isMark(candidate: unknown): candidate is Mark {
  return typeof candidate === 'string' && (MARKS as readonly string[]).includes(candidate);
}

export interface Posting {
  id: string;
  source: PostingSource;
  /** From the text's first line or the page's title; the user can change it. */
  title: string;
  company: string;
  /** The original link, http(s) only; empty when there is none. */
  link: string;
  /** The posting's full text: as pasted, or read from the link's page. Empty for a screenshot nobody has read yet. */
  text: string;
  /** The screenshot's file name in the postings folder; empty when there is none. */
  image: string;
  /** For a link: whether its page could be read (false when the site needs a login, for instance). */
  linkRead: boolean;
  /** How the posting does on each criterion, keyed by criterion id; a criterion not in here isn't checked yet.
      A criterion with a fact is only in here when the user marked it by hand: otherwise Merit compares the fact
      (see currentMarks in facts.ts, which every reader of the marks goes through). */
  marks: Record<string, Mark>;
  /** What the posting says on the criteria that carry a value; null for one not checked since facts existed. */
  facts: PostingFacts | null;
  /** Brought back by the user although it fails a non-negotiable: it shows with the others again. */
  keptAnyway: boolean;
  /** Why each mark is what it is, as the AI engine explained it; a mark the user set by hand has none. */
  reasons: Record<string, string>;
  /** The user renamed it: an AI check no longer replaces the title. */
  titleEdited: boolean;
  /** When an AI engine last checked it (ISO), and which one; empty when none has. */
  checkedAt: string;
  checkedWith: string;
  /** In Applications once the user wants to apply; null otherwise. */
  application: Application | null;
  /** A cover letter draft for this posting (from the AI, then edited by the user); empty when there is none. */
  coverLetter: string;
  /** What the letter was drafted from (the posting's text and what fits), as a fingerprint: when it no longer matches,
      the letter can be redrafted for that reason. Empty for a letter drafted before this was kept. */
  letterBasis: string;
  /** The user's own notes on it, from the first look to how it ended: what they learned in calls or about the
      company, what they noticed, what they'd do differently. */
  notes: string;
  /** Marked Not sure by the user ("not for me"), apart from a miss on a non-negotiable, which is Merit's own call. */
  archived: boolean;
  /** Why the user marked it Not sure, in their words; empty when they gave none. */
  asideReason: string;
  /** "In short", written by the AI engine on its check, always the same three lines; null until then. */
  summary: PostingSummaryLines | null;
  /** ISO date-time. */
  createdAt: string;
  /** When the user first opened its page (ISO); empty until then, so it shows as new — wherever a check moved it. */
  openedAt: string;
}

/** The summary's formula: what you'd do, where, and what else is worth knowing
    that isn't one of the criteria. An empty line means the posting doesn't say. */
export interface PostingSummaryLines {
  role: string;
  place: string;
  note: string;
}

/** A posting in a list: everything but the full text, plus its opening. */
export type PostingSummary = Omit<Posting, 'text'> & { excerpt: string };

export const POSTING_LIMITS = {
  title: 160,
  text: 50_000,
  excerpt: 240,
  imageBytes: 10 * 1024 * 1024
} as const;

export const IMAGE_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif'
};

export type AddError = 'empty' | 'textTooLong' | 'imageTooBig' | 'imageType' | 'write';
