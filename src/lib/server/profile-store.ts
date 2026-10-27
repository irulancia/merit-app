import { mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseTopics, topicsFromOldCriteria } from '#lib/interview/topics.js';
import { parseSkills, splitByKind } from '#lib/profile/skills.js';
import { dataDir } from './data-dir.js';
import { replaceFile } from './write-file.js';

/** What the user tells Merit about themselves: for the cover letter, to see how their skills meet a posting, and
    what they want to ask in an interview. Kept in profile.json, on their own computer only. */
export interface Profile {
  /** Their experience, in their own words. */
  experience: string;
  /** What they know how to do (methods, fields, code). */
  skills: string[];
  /** The tools they use (Figma, Miro…). */
  tools: string[];
  /** The interview topics whose questions every posting lists (interview/topics.ts). */
  interviewTopics: string[];
}

export const MAX_EXPERIENCE = 6_000;
const FILE_NAME = 'profile.json';

function filePath(): string {
  return join(dataDir(), FILE_NAME);
}

function isMissingFile(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}

/** The file's object; undefined when there is no such file, null when it can't be read. */
async function readJson(path: string): Promise<Record<string, unknown> | null | undefined> {
  try {
    const raw: unknown = JSON.parse(await readFile(path, 'utf8'));
    return typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : null;
  } catch (error) {
    if (isMissingFile(error)) return undefined;
    console.error(`Reading ${path} failed:`, error);
    return null;
  }
}

async function writeProfile(profile: Profile): Promise<void> {
  await mkdir(dataDir(), { recursive: true });
  await replaceFile(filePath(), `${JSON.stringify(profile, null, 2)}\n`);
}

/** The first interview topics, from the criteria the user had in use before they became questions; saved at once,
    since saving the criteria later drops those old entries. */
async function firstTopics(profile: Omit<Profile, 'interviewTopics'>): Promise<Profile> {
  const withTopics = { ...profile, interviewTopics: topicsFromOldCriteria(await readJson(join(dataDir(), 'criteria.json'))) };
  try {
    await writeProfile(withTopics);
  } catch (error) {
    console.error('Saving the first interview topics failed:', error);
  }
  return withTopics;
}

/** The two lists; a file from before tools had their own list has them among the skills, split here (saved so by the
    next change). */
function skillsAndTools(raw: Record<string, unknown>): Pick<Profile, 'skills' | 'tools'> {
  if (!Array.isArray(raw.tools)) return splitByKind(parseSkills(raw.skills));
  return { skills: parseSkills(raw.skills), tools: parseSkills(raw.tools) };
}

/** The saved profile; an empty one when there is none yet or the file can't be read (that file is left as it is). */
export async function loadProfile(): Promise<Profile> {
  const file = await readJson(filePath());
  if (file === null) return { experience: '', skills: [], tools: [], interviewTopics: [] };
  const raw = file ?? {};
  const profile = {
    experience: typeof raw.experience === 'string' ? raw.experience.slice(0, MAX_EXPERIENCE) : '',
    ...skillsAndTools(raw)
  };
  if (!Array.isArray(raw.interviewTopics)) return firstTopics(profile);
  return { ...profile, interviewTopics: parseTopics(raw.interviewTopics) };
}

/** Saves part of the profile, keeping the rest as it is. */
export async function updateProfile(changes: Partial<Profile>): Promise<Profile> {
  const profile = { ...(await loadProfile()), ...changes };
  await writeProfile(profile);
  return profile;
}
