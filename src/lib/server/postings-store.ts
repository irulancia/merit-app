import { randomUUID } from 'node:crypto';
import { mkdir, readdir, readFile, rename, rm, stat, utimes, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { IMAGE_TYPES, isMark, POSTING_LIMITS, type Mark, type Posting, type PostingSummary, type PostingSummaryLines } from '#lib/postings/types.js';
import { parseApplication } from '#lib/applications/types.js';
import { parseFacts } from '#lib/postings/facts.js';
import { dataDir } from './data-dir.js';
import { replaceFile } from './write-file.js';

const FOLDER = 'postings';
// Deleted postings wait here a few days, so a delete can be undone
const DELETED_FOLDER = 'deleted-postings';
const KEPT_AFTER_DELETE_MS = 7 * 24 * 60 * 60 * 1000;
// Ids are UUIDs Merit made itself; anything else never reaches the file system (no "../" in a URL)
const ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const STRING_FIELDS = ['id', 'source', 'title', 'company', 'link', 'text', 'image', 'createdAt'] as const;

type CheckFields = 'openedAt' | 'marks' | 'facts' | 'keptAnyway' | 'reasons' | 'titleEdited' | 'checkedAt' | 'checkedWith' | 'application' | 'coverLetter' | 'letterBasis' | 'notes' | 'archived' | 'asideReason' | 'summary';
export type NewPosting = Omit<Posting, 'id' | 'createdAt' | 'image' | CheckFields>;

const UNCHECKED: Pick<Posting, CheckFields> = {
  openedAt: '',
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
  summary: null
};
export interface NewImage {
  bytes: Uint8Array;
  type: string;
}

export function postingsFolder(): string {
  return folder();
}

function folder(): string {
  return join(dataDir(), FOLDER);
}

function filePath(id: string): string {
  return join(folder(), `${id}.json`);
}

export function isPostingId(id: string): boolean {
  return ID_PATTERN.test(id);
}

function isMissingFile(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}

function parseMarks(raw: unknown): Record<string, Mark> {
  if (typeof raw !== 'object' || raw === null) return {};
  return Object.fromEntries(Object.entries(raw).filter((entry): entry is [string, Mark] => isMark(entry[1])));
}

function parseReasons(raw: unknown): Record<string, string> {
  if (typeof raw !== 'object' || raw === null) return {};
  return Object.fromEntries(Object.entries(raw).filter((entry): entry is [string, string] => typeof entry[1] === 'string'));
}

function parseSummary(raw: unknown): PostingSummaryLines | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const { role, place, note } = raw as Record<string, unknown>;
  const text = (value: unknown) => (typeof value === 'string' ? value : '');
  return { role: text(role), place: text(place), note: text(note) };
}

/** Notes kept on the application before they moved to the posting itself. */
function notesFromApplication(raw: unknown): string {
  if (typeof raw !== 'object' || raw === null) return '';
  const notes = (raw as Record<string, unknown>).notes;
  return typeof notes === 'string' ? notes : '';
}

/** A posting from its file; the check fields came later, so a file without them starts unchecked. */
function parsePosting(raw: unknown): Posting | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const record = raw as Record<string, unknown>;
  if (!STRING_FIELDS.every((field) => typeof record[field] === 'string') || typeof record.linkRead !== 'boolean') return null;
  return {
    ...(record as unknown as Posting),
    marks: parseMarks(record.marks),
    facts: parseFacts(record.facts),
    keptAnyway: record.keptAnyway === true,
    reasons: parseReasons(record.reasons),
    titleEdited: record.titleEdited === true,
    checkedAt: typeof record.checkedAt === 'string' ? record.checkedAt : '',
    checkedWith: typeof record.checkedWith === 'string' ? record.checkedWith : '',
    application: parseApplication(record.application),
    coverLetter: typeof record.coverLetter === 'string' ? record.coverLetter : '',
    letterBasis: typeof record.letterBasis === 'string' ? record.letterBasis : '',
    notes: typeof record.notes === 'string' ? record.notes : notesFromApplication(record.application),
    archived: record.archived === true,
    asideReason: typeof record.asideReason === 'string' ? record.asideReason : '',
    summary: parseSummary(record.summary),
    // A posting saved before this was kept counts as opened: only what is added from now on shows as new
    openedAt: typeof record.openedAt === 'string' ? record.openedAt : String(record.createdAt)
  };
}

function summarize({ text, ...rest }: Posting): PostingSummary {
  const flat = text.replace(/\s+/g, ' ').trim();
  const excerpt = flat.length > POSTING_LIMITS.excerpt ? `${flat.slice(0, POSTING_LIMITS.excerpt).trimEnd()}…` : flat;
  return { ...rest, excerpt };
}

async function writeAtomically(path: string, data: string | Uint8Array): Promise<void> {
  await mkdir(folder(), { recursive: true });
  await replaceFile(path, data);
}

function savePosting(posting: Posting): Promise<void> {
  return writeAtomically(filePath(posting.id), `${JSON.stringify(posting, null, 2)}\n`);
}

/** Null when there is no such posting; a file that can't be read is skipped, never deleted. */
export async function getPosting(id: string): Promise<Posting | null> {
  if (!isPostingId(id)) return null;
  try {
    return parsePosting(JSON.parse(await readFile(filePath(id), 'utf8')));
  } catch (error) {
    if (isMissingFile(error) || error instanceof SyntaxError) return null;
    throw error;
  }
}

/** Newest first. */
export async function listPostings(): Promise<PostingSummary[]> {
  let names: string[];
  try {
    names = await readdir(folder());
  } catch (error) {
    if (isMissingFile(error)) return [];
    throw error;
  }
  const ids = names.filter((name) => name.endsWith('.json')).map((name) => name.slice(0, -'.json'.length));
  const postings = await Promise.all(ids.map(getPosting));
  return postings
    .filter((posting): posting is Posting => posting !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(summarize);
}

/** The screenshot is saved beside the posting as <id>.<ext>; the posting names it. */
export async function addPosting(fields: NewPosting, image: NewImage | null): Promise<Posting> {
  const id = randomUUID();
  const imageName = image ? `${id}.${IMAGE_TYPES[image.type]}` : '';
  if (image) await writeAtomically(join(folder(), imageName), image.bytes);
  const posting: Posting = { ...fields, ...UNCHECKED, id, image: imageName, createdAt: new Date().toISOString() };
  await savePosting(posting);
  return posting;
}

export type PostingChanges = Partial<Pick<Posting, 'title' | 'company' | 'text' | CheckFields>>;

/** Changes what the user can change on a saved posting; null when there is no such posting. */
export async function updatePosting(id: string, changes: PostingChanges): Promise<Posting | null> {
  const posting = await getPosting(id);
  if (!posting) return null;
  const updated = { ...posting, ...changes };
  await savePosting(updated);
  return updated;
}

/** The screenshot's bytes and type, or null when the posting has none. */
export async function readPostingImage(id: string): Promise<{ bytes: Buffer; type: string } | null> {
  const posting = await getPosting(id);
  if (!posting?.image) return null;
  const extension = posting.image.split('.').pop();
  const type = Object.keys(IMAGE_TYPES).find((candidate) => IMAGE_TYPES[candidate] === extension);
  if (!type || posting.image !== `${id}.${extension}`) return null;
  return { bytes: await readFile(join(folder(), posting.image)), type };
}

/** A posting's own files: its JSON and, when it has one, its screenshot (only a name Merit gave it). */
function ownFiles(posting: Posting): string[] {
  const image = posting.image === `${posting.id}.${posting.image.split('.').pop()}` ? [posting.image] : [];
  return [...image, `${posting.id}.json`];
}

function deletedFolder(): string {
  return join(dataDir(), DELETED_FOLDER);
}

/** What was deleted long enough ago that Undo is no longer offered goes for good. */
async function clearOldDeleted(): Promise<void> {
  let names: string[];
  try {
    names = await readdir(deletedFolder());
  } catch (error) {
    if (isMissingFile(error)) return;
    throw error;
  }
  const cutoff = Date.now() - KEPT_AFTER_DELETE_MS;
  for (const name of names) {
    const path = join(deletedFolder(), name);
    if ((await stat(path)).mtimeMs < cutoff) await rm(path, { force: true });
  }
}

/** Moves the posting's files aside rather than removing them, so Undo can put them back; they go for good a few
    days later. */
export async function deletePosting(id: string): Promise<void> {
  const posting = await getPosting(id);
  if (!posting) return;
  await clearOldDeleted();
  await mkdir(deletedFolder(), { recursive: true });
  const now = new Date();
  for (const name of ownFiles(posting)) {
    await rename(join(folder(), name), join(deletedFolder(), name));
    // The day it was deleted, which is what clearing goes by
    await utimes(join(deletedFolder(), name), now, now);
  }
}

/** Undo for a delete: false when there is nothing to bring back (an unknown id, or cleared already). */
export async function restorePosting(id: string): Promise<boolean> {
  if (!isPostingId(id)) return false;
  let posting: Posting | null;
  try {
    posting = parsePosting(JSON.parse(await readFile(join(deletedFolder(), `${id}.json`), 'utf8')));
  } catch (error) {
    if (isMissingFile(error) || error instanceof SyntaxError) return false;
    throw error;
  }
  if (!posting || posting.id !== id) return false;
  await mkdir(folder(), { recursive: true });
  for (const name of ownFiles(posting)) await rename(join(deletedFolder(), name), join(folder(), name));
  return true;
}
