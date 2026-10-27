import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { IDLE_DOWNLOAD, type DownloadPhase, type DownloadState } from '#lib/settings/ollama-download.js';
import { dataDir } from '../data-dir.js';
import { pullSuggestedModel, SUGGESTED_MODEL_BYTES } from './ollama.js';
import { deleteUnfinished, isDigest } from './ollama-files.js';

// The download runs in Merit, not in the page: closing the tab doesn't stop it, and the page shows where it stands
// when opened again. Its progress is kept in a file, so after Merit itself stops the page says how far it got
// (Ollama keeps what it downloaded and continues from there)

/** One line of Ollama's progress: what it is doing and, for each part of the model, its size and how far it is. */
interface PullLine {
  status?: string;
  digest?: string;
  total?: number;
  completed?: number;
  error?: string;
}

const FILE_NAME = 'ollama-download.json';
const SUCCESS = 'success';

// Null until read from the file, once per run
let current: DownloadState | null = null;
let controller: AbortController | null = null;
let lastSavedPercent = -1;
// The parts Ollama named while downloading: what "Delete it" may remove, and nothing more
let digests: string[] = [];
let saving: Promise<void> = Promise.resolve();

function filePath(): string {
  return join(dataDir(), FILE_NAME);
}

/** What was downloaded before Merit last stopped, as a stopped download; idle when nothing was. */
async function readSaved(): Promise<DownloadState> {
  try {
    const raw = JSON.parse(await readFile(filePath(), 'utf8')) as Record<string, unknown>;
    const completed = typeof raw.completed === 'number' ? raw.completed : 0;
    const total = Math.max(SUGGESTED_MODEL_BYTES, typeof raw.total === 'number' ? raw.total : 0);
    digests = Array.isArray(raw.digests) ? raw.digests.filter(isDigest) : [];
    return { phase: 'stopped', completed, total };
  } catch (error) {
    const missing = error instanceof Error && 'code' in error && error.code === 'ENOENT';
    if (!missing) console.error('Reading the Ollama download progress failed:', error);
    return IDLE_DOWNLOAD;
  }
}

/** Saves the progress, or forgets it once the model is in place; one write at a time. */
function keep(state: DownloadState) {
  saving = saving.then(async () => {
    try {
      if (state.phase === 'done' || state.phase === 'idle') return await rm(filePath(), { force: true });
      await mkdir(dataDir(), { recursive: true });
      await writeFile(filePath(), `${JSON.stringify({ completed: state.completed, total: state.total, digests })}\n`, 'utf8');
    } catch (error) {
      console.error('Saving the Ollama download progress failed:', error);
    }
  });
}

function setProgress(parts: Map<string, { total: number; completed: number }>) {
  const sizes = [...parts.values()];
  digests = [...new Set([...digests, ...parts.keys()])];
  const total = Math.max(SUGGESTED_MODEL_BYTES, sizes.reduce((sum, part) => sum + part.total, 0));
  const completed = sizes.reduce((sum, part) => sum + part.completed, 0);
  current = { phase: 'downloading', completed, total };
  const percent = total ? Math.floor((completed / total) * 100) : 0;
  if (percent !== lastSavedPercent) {
    lastSavedPercent = percent;
    keep(current);
  }
}

/** Reads Ollama's answer line by line as it arrives; true once it says the model is in place. */
async function readLines(body: ReadableStream<Uint8Array>): Promise<boolean> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  // The model comes in parts, each with its own size: the progress is their sum
  const parts = new Map<string, { total: number; completed: number }>();
  let pending = '';
  let done = false;
  for (;;) {
    const chunk = await reader.read();
    if (chunk.done) return done;
    const lines = (pending + decoder.decode(chunk.value, { stream: true })).split('\n');
    pending = lines.pop() ?? '';
    for (const text of lines.filter((line) => line.trim())) {
      const line = JSON.parse(text) as PullLine;
      if (line.error) throw new Error(line.error);
      if (line.status === SUCCESS) done = true;
      if (line.digest && line.total) {
        parts.set(line.digest, { total: line.total, completed: line.completed ?? 0 });
        setProgress(parts);
      }
    }
  }
}

function finish(phase: DownloadPhase) {
  current = { ...(current ?? IDLE_DOWNLOAD), phase };
  controller = null;
  keep(current);
}

async function run(signal: AbortSignal) {
  // A download stopped and started again leaves this one behind: only the one running now says how it ended
  const settle = (phase: DownloadPhase) => {
    if (!controller || controller.signal === signal) finish(phase);
  };
  try {
    const response = await pullSuggestedModel(signal);
    if (!response.ok || !response.body) throw new Error(`Ollama answered ${response.status}`);
    settle((await readLines(response.body)) ? 'done' : 'failed');
  } catch (cause) {
    if (signal.aborted) return settle('stopped');
    console.error('The Ollama download failed:', cause);
    settle('failed');
  }
}

export async function downloadState(): Promise<DownloadState> {
  current ??= await readSaved();
  return current;
}

/** Starts the download, or continues a stopped one; a second start while it runs changes nothing. */
export async function startDownload(): Promise<DownloadState> {
  const before = await downloadState();
  if (before.phase === 'downloading') return before;
  controller = new AbortController();
  lastSavedPercent = -1;
  current = { ...before, phase: 'downloading' };
  void run(controller.signal);
  return current;
}

export async function stopDownload(): Promise<DownloadState> {
  if (controller) {
    controller.abort();
    finish('stopped');
  }
  return downloadState();
}

/** Deletes what a stopped download left on the disk, and forgets it; refused while it runs. */
export async function discardDownload(): Promise<DownloadState> {
  const before = await downloadState();
  if (before.phase === 'downloading') return before;
  await deleteUnfinished(digests);
  digests = [];
  current = IDLE_DOWNLOAD;
  keep(current);
  return current;
}
