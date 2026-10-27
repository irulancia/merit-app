import { readdir, rm } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

// Ollama keeps a part it is still downloading as "sha256-<hex>-partial", plus "-partial-0", "-partial-1"… for its
// chunks, in its models folder (OLLAMA_MODELS when set, as Ollama itself reads it)
const DIGEST = /^sha256:([a-f0-9]{64})$/;

export function isDigest(candidate: unknown): candidate is string {
  return typeof candidate === 'string' && DIGEST.test(candidate);
}

function blobsDir(): string {
  return join(process.env.OLLAMA_MODELS || join(homedir(), '.ollama', 'models'), 'blobs');
}

/** Deletes the unfinished parts of these digests, and nothing else: never a finished part, never another model. */
export async function deleteUnfinished(digests: string[]): Promise<void> {
  const prefixes = digests.filter(isDigest).map((digest) => `${digest.replace(':', '-')}-partial`);
  let names: string[];
  try {
    names = await readdir(blobsDir());
  } catch (error) {
    // No folder: nothing was ever written there
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return;
    throw error;
  }
  const unfinished = names.filter((name) => prefixes.some((prefix) => name === prefix || name.startsWith(`${prefix}-`)));
  await Promise.all(unfinished.map((name) => rm(join(blobsDir(), name), { force: true })));
}
