import { mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Insight } from '#lib/dashboard/trends.js';
import { dataDir } from './data-dir.js';
import { replaceFile } from './write-file.js';

/** The AI engine's last reading of the postings together, kept in trends.json until it reads them again. */
export interface SavedTrends {
  insights: Insight[];
  /** A fingerprint of what it read (the postings and About you): when it no longer matches, it can read again. */
  basis: string;
  readAt: string;
  engine: string;
  postings: number;
}

const FILE_NAME = 'trends.json';

function filePath(): string {
  return join(dataDir(), FILE_NAME);
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function parseInsight(raw: unknown): Insight | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const record = raw as Record<string, unknown>;
  const postings = Array.isArray(record.postings) ? record.postings.filter((name): name is string => typeof name === 'string') : [];
  return text(record.title) || text(record.text) ? { title: text(record.title), text: text(record.text), postings } : null;
}

/** A reading from before insights (four fixed lines) has no insights list: it reads as none, to be checked again. */
function parseTrends(raw: Record<string, unknown>): SavedTrends | null {
  if (!Array.isArray(raw.insights)) return null;
  return {
    insights: raw.insights.map(parseInsight).filter((insight): insight is Insight => insight !== null),
    basis: text(raw.basis),
    readAt: text(raw.readAt),
    engine: text(raw.engine),
    postings: typeof raw.postings === 'number' ? raw.postings : 0
  };
}

/** The last reading; null when there is none yet or the file can't be read (that file is left as it is). */
export async function loadTrends(): Promise<SavedTrends | null> {
  try {
    const raw: unknown = JSON.parse(await readFile(filePath(), 'utf8'));
    return typeof raw === 'object' && raw !== null ? parseTrends(raw as Record<string, unknown>) : null;
  } catch (error) {
    const missing = error instanceof Error && 'code' in error && error.code === 'ENOENT';
    if (!missing) console.error('Reading the trends failed:', error);
    return null;
  }
}

export async function saveTrends(trends: SavedTrends): Promise<void> {
  await mkdir(dataDir(), { recursive: true });
  await replaceFile(filePath(), `${JSON.stringify(trends, null, 2)}\n`);
}
