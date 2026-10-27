import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// The design system's stylesheet, read from the project on every request rather than built into the app: saving it
// again from the configurator shows at the next page load — no rebuild, no restart.
// Merit runs from its own folder (npm start, the start files), so the file is always there.
const STYLESHEET = join(process.cwd(), 'src', 'app.css');

export const GET: RequestHandler = async () => {
  try {
    const css = await readFile(STYLESHEET, 'utf8');
    return new Response(css, {
      headers: { 'content-type': 'text/css; charset=utf-8', 'cache-control': 'no-cache' }
    });
  } catch (cause) {
    console.error('Reading src/app.css failed:', cause);
    error(500, 'The stylesheet could not be read');
  }
};
