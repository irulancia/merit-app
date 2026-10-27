import { EngineError } from './errors.js';

const BASE_URL = 'http://localhost:11434';
const TIMEOUT_MS = 300_000;
const STATUS_TIMEOUT_MS = 3_000;

interface RunOptions {
  prompt: string;
  schema: Record<string, unknown>;
  model: string;
  /** A screenshot, base64; the model must be able to see images (gemma3, qwen2.5vl, llava…). */
  imageBase64?: string;
}

/** Asks the local Ollama model; nothing leaves this computer. */
export async function askOllama({ prompt, schema, model, imageBase64 }: RunOptions): Promise<unknown> {
  if (!model) throw new EngineError('noModel');
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      body: JSON.stringify({
        model,
        stream: false,
        format: schema,
        options: { temperature: 0 },
        messages: [{ role: 'user', content: prompt, ...(imageBase64 ? { images: [imageBase64] } : {}) }]
      })
    });
  } catch (error) {
    throw new EngineError(error instanceof Error && error.name === 'TimeoutError' ? 'timeout' : 'notRunning');
  }
  if (response.status === 404) throw new EngineError('noModel', model);
  if (!response.ok) throw new EngineError('failed', await response.text());
  const body = (await response.json()) as { message?: { content?: string } };
  try {
    return JSON.parse(body.message?.content ?? '');
  } catch {
    throw new EngineError('badAnswer', body.message?.content?.slice(0, 500));
  }
}

/** The model Merit downloads for a new user: it reads text and screenshots, and fits an ordinary laptop. */
export const SUGGESTED_MODEL = 'gemma3';
/** Its size in all (2026-10): Ollama names each part only as it starts on it, so the progress is measured against this. */
export const SUGGESTED_MODEL_BYTES = 3_350_000_000;

interface InstalledModel {
  name: string;
  details?: { families?: string[] | null };
}

/** An embedding model (nomic-embed-text, a BERT) only turns text into numbers: it can't read a posting. */
function canChat(model: InstalledModel): boolean {
  const families = model.details?.families ?? [];
  return !/embed/i.test(model.name) && !families.some((family) => /bert/i.test(family));
}

/** The installed models that can read a posting, or null when Ollama isn't running (for the Settings page). */
export async function ollamaModels(): Promise<string[] | null> {
  try {
    const response = await fetch(`${BASE_URL}/api/tags`, { signal: AbortSignal.timeout(STATUS_TIMEOUT_MS) });
    if (!response.ok) return null;
    const body = (await response.json()) as { models?: InstalledModel[] };
    return (body.models ?? []).filter(canChat).map((model) => model.name);
  } catch {
    return null;
  }
}

/** Asks Ollama to download the suggested model; its answer streams the progress, one JSON line at a time. */
export async function pullSuggestedModel(signal: AbortSignal): Promise<Response> {
  return fetch(`${BASE_URL}/api/pull`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    signal,
    body: JSON.stringify({ model: SUGGESTED_MODEL, stream: true })
  });
}
