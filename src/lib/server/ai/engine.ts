import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { postingsFolder } from '../postings-store.js';
import type { AppSettings } from '../settings-store.js';
import { askClaudeCode } from './claude-code.js';
import { EngineError } from './errors.js';
import { askOllama } from './ollama.js';

export interface EngineRequest {
  prompt: string;
  schema: Record<string, unknown>;
  /** A screenshot to read, by its file name in the postings folder. */
  imageFile?: string;
}

/** Asks the chosen engine for an answer in the given shape; throws EngineError when there is none. */
export async function askEngine(app: AppSettings, { prompt, schema, imageFile }: EngineRequest): Promise<unknown> {
  if (app.engine === 'claude-code') return askClaudeCode({ prompt, schema, cwd: postingsFolder(), imageFile });
  if (app.engine === 'ollama') {
    const imageBase64 = imageFile ? (await readFile(join(postingsFolder(), imageFile))).toString('base64') : undefined;
    return askOllama({ prompt, schema, model: app.ollamaModel, imageBase64 });
  }
  throw new EngineError('notInstalled', 'no engine chosen');
}
