import { mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { dataDir } from './data-dir.js';
import { replaceFile } from './write-file.js';

export const ENGINES = ['none', 'ollama', 'claude-code'] as const;
export type Engine = (typeof ENGINES)[number];

export interface AppSettings {
  engine: Engine;
  /** The Ollama model to use, by its name in `ollama list`. */
  ollamaModel: string;
}

const FILE_NAME = 'settings.json';
const DEFAULTS: AppSettings = { engine: 'none', ollamaModel: '' };

export function isEngine(candidate: unknown): candidate is Engine {
  return typeof candidate === 'string' && (ENGINES as readonly string[]).includes(candidate);
}

function filePath(): string {
  return join(dataDir(), FILE_NAME);
}

/** The saved settings; the defaults (no AI) when there are none yet or the file can't be read. */
export async function loadSettings(): Promise<AppSettings> {
  try {
    const raw = JSON.parse(await readFile(filePath(), 'utf8')) as Record<string, unknown>;
    return {
      engine: isEngine(raw.engine) ? raw.engine : DEFAULTS.engine,
      ollamaModel: typeof raw.ollamaModel === 'string' ? raw.ollamaModel : DEFAULTS.ollamaModel
    };
  } catch (error) {
    const missing = error instanceof Error && 'code' in error && error.code === 'ENOENT';
    if (!missing) console.error('Reading settings failed, using the defaults:', error);
    return { ...DEFAULTS };
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await mkdir(dataDir(), { recursive: true });
  await replaceFile(filePath(), `${JSON.stringify(settings, null, 2)}\n`);
}
