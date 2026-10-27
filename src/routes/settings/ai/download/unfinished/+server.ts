import { error, json } from '@sveltejs/kit';
import { discardDownload } from '#lib/server/ai/ollama-download.js';
import type { RequestHandler } from './$types';

// "Delete it": what a stopped download left on the disk, so nobody has to find Ollama's folder. Only Merit's own page sends JSON, as for the download itself
export const DELETE: RequestHandler = async ({ request }) => {
  if (request.headers.get('content-type') !== 'application/json') error(415, 'json');
  try {
    return json(await discardDownload());
  } catch (cause) {
    console.error('Deleting the unfinished Ollama download failed:', cause);
    error(500, 'delete');
  }
};
