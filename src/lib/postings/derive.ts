import { POSTING_LIMITS } from './types.js';

/** A title from the text: its first line with something in it, shortened at a word if it runs long. */
export function titleFromText(text: string): string {
  const firstLine = text.split('\n').map((line) => line.trim()).find((line) => line.length > 0) ?? '';
  if (firstLine.length <= POSTING_LIMITS.title) return firstLine;
  const cut = firstLine.slice(0, POSTING_LIMITS.title);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}
