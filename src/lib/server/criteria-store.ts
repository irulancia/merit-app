import { copyFile, mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ALL_CRITERIA } from '#lib/criteria/catalog.js';
import { DEFAULT_SETTING, isLevel, type CriteriaSettings, type CriterionSetting } from '#lib/criteria/types.js';
import { dataDir } from './data-dir.js';
import { replaceFile } from './write-file.js';

const FILE_NAME = 'criteria.json';
const MAX_VALUE_LENGTH = 200;

export type LoadResult =
  | { ok: true; settings: CriteriaSettings }
  | { ok: false; settings: CriteriaSettings; reason: 'unreadable' };

function filePath(): string {
  return join(dataDir(), FILE_NAME);
}

function defaults(): CriteriaSettings {
  return Object.fromEntries(ALL_CRITERIA.map((criterion) => [criterion.id, { ...DEFAULT_SETTING }]));
}

function parseSetting(raw: unknown): CriterionSetting {
  if (typeof raw !== 'object' || raw === null) return { ...DEFAULT_SETTING };
  const { level, value } = raw as Record<string, unknown>;
  return {
    level: isLevel(level) ? level : DEFAULT_SETTING.level,
    value: typeof value === 'string' ? value.trim().slice(0, MAX_VALUE_LENGTH) : ''
  };
}

/** Keeps only known criteria, each with a valid level and value; anything missing falls back to Off. */
export function normalize(raw: unknown): CriteriaSettings {
  const source = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  return Object.fromEntries(ALL_CRITERIA.map((criterion) => [criterion.id, parseSetting(source[criterion.id])]));
}

function isMissingFile(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}

export async function loadCriteria(): Promise<LoadResult> {
  let text: string;
  try {
    text = await readFile(filePath(), 'utf8');
  } catch (error) {
    if (isMissingFile(error)) return { ok: true, settings: defaults() };
    throw error;
  }
  try {
    return { ok: true, settings: normalize(JSON.parse(text)) };
  } catch {
    return { ok: false, settings: defaults(), reason: 'unreadable' };
  }
}

/** A file that can't be read is kept beside the new one, never overwritten. */
async function backUpIfUnreadable(path: string): Promise<void> {
  const current = await loadCriteria();
  if (current.ok) return;
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  await copyFile(path, join(dataDir(), `criteria.unreadable-${stamp}.json`));
}

export async function saveCriteria(settings: CriteriaSettings): Promise<void> {
  const path = filePath();
  await mkdir(dataDir(), { recursive: true });
  await backUpIfUnreadable(path);
  await replaceFile(path, `${JSON.stringify(settings, null, 2)}\n`);
}
