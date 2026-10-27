import { error, json } from '@sveltejs/kit';
import { downloadState, startDownload, stopDownload } from '#lib/server/ai/ollama-download.js';
import type { RequestHandler } from './$types';

// Finishing Ollama's setup from Merit: the suggested model downloaded with no terminal.
// The model is fixed on the server, never taken from the request; the page asks where the download stands
const JSON_TYPE = 'application/json';

// Only Merit's own page sends JSON: a form posted from another site can't start or stop a 3 GB download
function requireJson(request: Request) {
  if (request.headers.get('content-type') !== JSON_TYPE) error(415, 'json');
}

export const GET: RequestHandler = async () => json(await downloadState());

export const POST: RequestHandler = async ({ request }) => {
  requireJson(request);
  return json(await startDownload());
};

export const DELETE: RequestHandler = async ({ request }) => {
  requireJson(request);
  return json(await stopDownload());
};
