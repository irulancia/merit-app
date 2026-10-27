import { rename, rm, writeFile } from 'node:fs/promises';

/** Windows refuses a rename for a moment while the file is busy (another save, an antivirus scan). */
const BUSY_CODES = new Set(['EPERM', 'EACCES', 'EBUSY']);
const RENAME_TRIES = 5;
const RETRY_DELAY_MS = 40;

// One write at a time per file: two quick saves (two skills ticked in a row) ran together, and on Windows the second
// rename was refused, so the change showed as not saved
const queues = new Map<string, Promise<void>>();
let written = 0;

function isBusy(error: unknown): boolean {
  return error instanceof Error && 'code' in error && BUSY_CODES.has(String(error.code));
}

async function renameWhenFree(from: string, to: string): Promise<void> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      await rename(from, to);
      return;
    } catch (error) {
      if (attempt >= RENAME_TRIES || !isBusy(error)) throw error;
      await new Promise((done) => setTimeout(done, RETRY_DELAY_MS * attempt));
    }
  }
}

async function replace(path: string, data: string | Uint8Array): Promise<void> {
  // Its own temporary file, so two saves never write the same one
  written += 1;
  const temporary = `${path}.${process.pid}-${written}.tmp`;
  try {
    await writeFile(temporary, data);
    await renameWhenFree(temporary, path);
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
}

/** Writes the whole file or nothing: a temporary file first, then put in its place, one save after another. */
export function replaceFile(path: string, data: string | Uint8Array): Promise<void> {
  const previous = queues.get(path) ?? Promise.resolve();
  const next = previous.catch(() => undefined).then(() => replace(path, data));
  queues.set(path, next);
  const forget = () => {
    if (queues.get(path) === next) queues.delete(path);
  };
  next.then(forget, forget);
  return next;
}
