import { loadCriteria } from '#lib/server/criteria-store.js';
import { displayDataDir } from '#lib/server/data-dir.js';
import { listPostings } from '#lib/server/postings-store.js';
import type { LayoutServerLoad } from './$types';

/** The sidebar's counts never fail a page: null when they can't be read. */
async function orNull<T>(label: string, read: () => Promise<T>): Promise<T | null> {
  try {
    return await read();
  } catch (error) {
    console.error(`Counting ${label} failed:`, error);
    return null;
  }
}

async function criteriaInUse(): Promise<number> {
  const { settings } = await loadCriteria();
  return Object.values(settings).filter((setting) => setting.level !== 'off').length;
}

export const load: LayoutServerLoad = async () => {
  const [inUse, postings] = await Promise.all([orNull('criteria', criteriaInUse), orNull('postings', listPostings)]);
  return {
    dataDir: displayDataDir(),
    criteriaInUse: inUse,
    postingsCount: postings?.length ?? null
  };
};
