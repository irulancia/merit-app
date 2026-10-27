import { mkdtemp, readFile, rm, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { addPosting, deletePosting, getPosting, isPostingId, listPostings, readPostingImage, restorePosting, updatePosting, type NewPosting } from './postings-store.js';

const FIELDS: NewPosting = { source: 'text', title: 'Designer', company: '', link: '', text: 'A posting.', linkRead: false };
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]);

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'merit-test-'));
  process.env.MERIT_DATA_DIR = dir;
});

afterEach(async () => {
  delete process.env.MERIT_DATA_DIR;
  await rm(dir, { recursive: true, force: true });
});

describe('postings store', () => {
  it('saves a posting and reads it back, unchecked', async () => {
    const posting = await addPosting(FIELDS, null);
    expect(isPostingId(posting.id)).toBe(true);
    expect(await getPosting(posting.id)).toEqual(posting);
    expect(posting).toMatchObject({ marks: {}, reasons: {}, keptAnyway: false, application: null, image: '' });
  });

  it('lists postings newest first, without their full text', async () => {
    const first = await addPosting({ ...FIELDS, title: 'First' }, null);
    await new Promise((resolve) => setTimeout(resolve, 5));
    const second = await addPosting({ ...FIELDS, title: 'Second' }, null);
    const list = await listPostings();
    expect(list.map((posting) => posting.id)).toEqual([second.id, first.id]);
    expect(list[0]).not.toHaveProperty('text');
    expect(list[0].excerpt).toBe('A posting.');
  });

  it('keeps a screenshot beside the posting and deletes both together', async () => {
    const posting = await addPosting({ ...FIELDS, source: 'image', text: '' }, { bytes: PNG, type: 'image/png' });
    expect(posting.image).toBe(`${posting.id}.png`);
    expect((await readPostingImage(posting.id))?.type).toBe('image/png');
    await deletePosting(posting.id);
    expect(await getPosting(posting.id)).toBeNull();
    await expect(readFile(join(dir, 'postings', posting.image))).rejects.toThrow();
  });

  it('brings a deleted posting back, its screenshot too (Undo)', async () => {
    const posting = await addPosting({ ...FIELDS, source: 'image', text: '' }, { bytes: PNG, type: 'image/png' });
    await deletePosting(posting.id);
    expect(await restorePosting(posting.id)).toBe(true);
    expect(await getPosting(posting.id)).toEqual(posting);
    expect((await readPostingImage(posting.id))?.type).toBe('image/png');
  });

  it('has nothing to bring back for an unknown id, or one not deleted', async () => {
    expect(await restorePosting('../criteria')).toBe(false);
    expect(await restorePosting('00000000-0000-4000-8000-000000000000')).toBe(false);
  });

  it('clears what was deleted more than a week ago when deleting again', async () => {
    const old = await addPosting(FIELDS, null);
    await deletePosting(old.id);
    const longAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
    await utimes(join(dir, 'deleted-postings', `${old.id}.json`), longAgo, longAgo);
    await deletePosting((await addPosting(FIELDS, null)).id);
    expect(await restorePosting(old.id)).toBe(false);
  });

  it('updates only what it is given', async () => {
    const posting = await addPosting(FIELDS, null);
    const updated = await updatePosting(posting.id, { marks: { no_outsourcing: 'miss' } });
    expect(updated).toMatchObject({ title: 'Designer', marks: { no_outsourcing: 'miss' } });
  });

  it('never touches a file for an id it did not make', async () => {
    expect(await getPosting('../criteria')).toBeNull();
    expect(await updatePosting('../criteria', { title: 'x' })).toBeNull();
    await expect(deletePosting('../../x')).resolves.toBeUndefined();
  });

  it('reads a posting saved before marks existed, as unchecked', async () => {
    const posting = await addPosting(FIELDS, null);
    const path = join(dir, 'postings', `${posting.id}.json`);
    const old = JSON.parse(await readFile(path, 'utf8'));
    delete old.marks;
    delete old.reasons;
    delete old.application;
    await writeFile(path, JSON.stringify(old));
    expect(await getPosting(posting.id)).toMatchObject({ marks: {}, reasons: {}, application: null });
  });

  it('skips a file that is not a posting instead of failing the list', async () => {
    await addPosting(FIELDS, null);
    await writeFile(join(dir, 'postings', '00000000-0000-4000-8000-000000000000.json'), '{broken');
    expect(await listPostings()).toHaveLength(1);
  });
});
