import { parseApplication } from '#lib/applications/types.js';
import type { Posting } from './types.js';

/** What decides which tab a posting is in, beside its verdicts: its application, whether the user set it aside,
    and whether they consider it although it misses a non-negotiable. Undo puts exactly this back. */
export type PostingPlace = Pick<Posting, 'application' | 'archived' | 'keptAnyway'>;

export function placeOf(posting: PostingPlace): PostingPlace {
  return { application: posting.application, archived: posting.archived, keptAnyway: posting.keptAnyway };
}

/** A place sent back by the page for Undo, read as strictly as a saved posting: null for anything malformed. */
export function parsePlace(raw: unknown): PostingPlace | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const record = raw as Record<string, unknown>;
  if (typeof record.archived !== 'boolean' || typeof record.keptAnyway !== 'boolean') return null;
  const application = record.application === null ? null : parseApplication(record.application);
  if (record.application !== null && application === null) return null;
  return { application, archived: record.archived, keptAnyway: record.keptAnyway };
}
