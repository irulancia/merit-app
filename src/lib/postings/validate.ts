import { IMAGE_TYPES, POSTING_LIMITS, type AddError } from './types.js';

const SAFE_PROTOCOLS = ['http:', 'https:'];

/** Only http(s) links are kept, so a pasted "javascript:" link can never become a clickable href. */
export function isSafeLink(link: string): boolean {
  try {
    return SAFE_PROTOCOLS.includes(new URL(link).protocol);
  } catch {
    return false;
  }
}

/** The whole paste is one web address (no spaces, http or https) — not a text that contains one. */
export function isLinkOnly(content: string): boolean {
  return !/\s/.test(content) && isSafeLink(content);
}

export interface Submission {
  content: string;
  image: File | null;
}

export function readSubmission(form: FormData): Submission {
  const content = form.get('content');
  const image = form.get('image');
  return {
    content: typeof content === 'string' ? content.trim() : '',
    image: image instanceof File && image.size > 0 ? image : null
  };
}

export function validateSubmission({ content, image }: Submission): AddError | null {
  if (!content && !image) return 'empty';
  if (content.length > POSTING_LIMITS.text) return 'textTooLong';
  if (image && !(image.type in IMAGE_TYPES)) return 'imageType';
  if (image && image.size > POSTING_LIMITS.imageBytes) return 'imageTooBig';
  return null;
}
