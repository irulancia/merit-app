// Reads a job posting's page from its link: its title and its readable text. Best effort — a site that needs a
// login (LinkedIn) or builds its page in the browser gives little or nothing, and the caller says so.

const TIMEOUT_MS = 10_000;
const MAX_BYTES = 2 * 1024 * 1024;
const MIN_USEFUL_TEXT = 200;

export interface PageText {
  title: string;
  text: string;
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

function decodeEntities(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (match, name: string) => ENTITIES[name.toLowerCase()] ?? match);
}

/** Text only: scripts, styles and navigation dropped, block ends kept as line breaks. */
export function htmlToText(html: string): PageText {
  const title = decodeEntities(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '').trim();
  const body = html
    .replace(/<(script|style|noscript|svg|nav|header|footer|form)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<\/(p|div|li|h[1-6]|section|article|tr)>|<br\s*\/?>/gi, '\n')
    .replace(/<li\b[^>]*>/gi, '\n- ')
    .replace(/<[^>]+>/g, ' ');
  const text = decodeEntities(body)
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line, index, lines) => line.length > 0 || (index > 0 && lines[index - 1].length > 0))
    .join('\n')
    .trim();
  return { title, text };
}

async function readLimited(response: Response): Promise<string> {
  const bytes = await response.arrayBuffer();
  return new TextDecoder().decode(bytes.byteLength > MAX_BYTES ? bytes.slice(0, MAX_BYTES) : bytes);
}

/** Null when the page can't be fetched, isn't HTML, or holds too little text to be the posting. */
export async function fetchPageText(url: string): Promise<PageText | null> {
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { accept: 'text/html' }
    });
    if (!response.ok || !(response.headers.get('content-type') ?? '').includes('html')) return null;
    const page = htmlToText(await readLimited(response));
    return page.text.length >= MIN_USEFUL_TEXT ? page : null;
  } catch (error) {
    console.error(`Reading ${url} failed:`, error);
    return null;
  }
}
