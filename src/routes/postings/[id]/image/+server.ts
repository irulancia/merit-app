import { error } from '@sveltejs/kit';
import { readPostingImage } from '#lib/server/postings-store.js';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
  const image = await readPostingImage(params.id);
  if (!image) error(404);
  return new Response(new Uint8Array(image.bytes), {
    headers: {
      'content-type': image.type,
      'cache-control': 'private, max-age=3600',
      // Served as an image only, never sniffed into something else
      'x-content-type-options': 'nosniff'
    }
  });
};
