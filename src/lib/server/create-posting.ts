import { m } from '#lib/paraglide/messages.js';
import { titleFromText } from '#lib/postings/derive.js';
import type { Posting } from '#lib/postings/types.js';
import { isLinkOnly, type Submission } from '#lib/postings/validate.js';
import { fetchPageText } from './page-text.js';
import { addPosting, type NewImage, type NewPosting } from './postings-store.js';

/** A link on its own: its page is read for the text and title; if it can't be, the link alone is kept. */
async function fromLink(link: string): Promise<NewPosting> {
  const page = await fetchPageText(link);
  const host = new URL(link).hostname.replace(/^www\./, '');
  return {
    source: 'link',
    title: titleFromText(page?.title || page?.text || '') || m.posting_title_from_link({ site: host }),
    company: '',
    link,
    text: page?.text ?? '',
    linkRead: page !== null
  };
}

function fromText(text: string, hasImage: boolean): NewPosting {
  return {
    source: hasImage ? 'image' : 'text',
    title: titleFromText(text) || m.posting_title_from_image(),
    company: '',
    link: '',
    text,
    linkRead: false
  };
}

// The type comes from the file's first bytes, not from what the browser claimed
const SIGNATURES: [string, number[]][] = [
  ['image/png', [0x89, 0x50, 0x4e, 0x47]],
  ['image/jpeg', [0xff, 0xd8, 0xff]],
  ['image/gif', [0x47, 0x49, 0x46, 0x38]],
  ['image/webp', [0x52, 0x49, 0x46, 0x46]]
];

function detectImageType(bytes: Uint8Array): string | null {
  const match = SIGNATURES.find(([, signature]) => signature.every((byte, index) => bytes[index] === byte));
  return match?.[0] ?? null;
}

export class NotAnImageError extends Error {}

async function readImage(file: File): Promise<NewImage> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = detectImageType(bytes);
  if (!type) throw new NotAnImageError();
  return { bytes, type };
}

/** Whatever was pasted — text, a link, a screenshot (with or without text) — becomes one posting. */
export async function createPosting({ content, image }: Submission): Promise<Posting> {
  const newImage = image ? await readImage(image) : null;
  const fields = !image && isLinkOnly(content) ? await fromLink(content) : fromText(content, image !== null);
  return addPosting(fields, newImage);
}
