import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { replaceFile } from './write-file.js';

describe('replaceFile', () => {
  let folder: string;

  beforeEach(async () => {
    folder = await mkdtemp(join(tmpdir(), 'merit-write-'));
  });

  afterEach(async () => {
    await rm(folder, { recursive: true, force: true });
  });

  it('saves many quick changes to one file, the last one kept, no temporary file left', async () => {
    const path = join(folder, 'profile.json');
    const saves = Array.from({ length: 20 }, (_, index) => replaceFile(path, `save ${index}`));
    await Promise.all(saves);
    expect(await readFile(path, 'utf8')).toBe('save 19');
    expect(await readdir(folder)).toEqual(['profile.json']);
  });

  it('writes bytes as well as text', async () => {
    const path = join(folder, 'image.png');
    await replaceFile(path, new Uint8Array([1, 2, 3]));
    expect([...(await readFile(path))]).toEqual([1, 2, 3]);
  });
});
