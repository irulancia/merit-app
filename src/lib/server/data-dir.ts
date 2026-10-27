import { homedir } from 'node:os';
import { join, sep } from 'node:path';

const DEFAULT_RELATIVE_DIR = join('Merit', 'data');

/** Where Merit keeps the user's files: MERIT_DATA_DIR if set, otherwise ~/Merit/data. */
export function dataDir(): string {
  return process.env.MERIT_DATA_DIR || join(homedir(), DEFAULT_RELATIVE_DIR);
}

/** The same folder as the user would write it, with ~ for their home folder. */
export function displayDataDir(): string {
  const dir = dataDir();
  const home = homedir();
  return dir.startsWith(home) ? `~${dir.slice(home.length).split(sep).join('/')}` : dir;
}
