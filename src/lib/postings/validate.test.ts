import { describe, expect, it } from 'vitest';
import { titleFromText } from './derive.js';
import { POSTING_LIMITS } from './types.js';
import { isLinkOnly, isSafeLink, validateSubmission } from './validate.js';

function image(type: string, size: number): File {
  return new File([new Uint8Array(size)], 'shot', { type });
}

describe('isSafeLink', () => {
  it('accepts http and https only', () => {
    expect(isSafeLink('https://example.com/job')).toBe(true);
    expect(isSafeLink('http://example.com')).toBe(true);
    expect(isSafeLink('javascript:alert(1)')).toBe(false);
    expect(isSafeLink('data:text/html,hi')).toBe(false);
    expect(isSafeLink('not a link')).toBe(false);
  });
});

describe('isLinkOnly', () => {
  it('is a link only when the whole paste is one address', () => {
    expect(isLinkOnly('https://jobs.example.com/1')).toBe(true);
    expect(isLinkOnly('See https://jobs.example.com/1')).toBe(false);
    expect(isLinkOnly('javascript:alert(1)')).toBe(false);
  });
});

describe('validateSubmission', () => {
  it('needs text or an image', () => {
    expect(validateSubmission({ content: '', image: null })).toBe('empty');
    expect(validateSubmission({ content: 'A posting', image: null })).toBeNull();
    expect(validateSubmission({ content: '', image: image('image/png', 10) })).toBeNull();
  });

  it('refuses text that is too long, an image that is too big or not an image type', () => {
    expect(validateSubmission({ content: 'x'.repeat(POSTING_LIMITS.text + 1), image: null })).toBe('textTooLong');
    expect(validateSubmission({ content: '', image: image('image/png', POSTING_LIMITS.imageBytes + 1) })).toBe('imageTooBig');
    expect(validateSubmission({ content: '', image: image('application/pdf', 10) })).toBe('imageType');
  });
});

describe('titleFromText', () => {
  it('takes the first line with something in it', () => {
    expect(titleFromText('\n\n  Senior Designer  \nAt Lumen')).toBe('Senior Designer');
  });

  it('shortens a long first line at a word', () => {
    const title = titleFromText(`${'word '.repeat(60)}`);
    expect(title.length).toBeLessThanOrEqual(POSTING_LIMITS.title + 1);
    expect(title.endsWith('word…')).toBe(true);
  });

  it('is empty for empty text', () => {
    expect(titleFromText('   ')).toBe('');
  });
});
