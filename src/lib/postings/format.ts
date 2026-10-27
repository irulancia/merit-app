import { m } from '#lib/paraglide/messages.js';
import { getLocale } from '#lib/paraglide/runtime.js';
import type { Posting } from './types.js';

/** The title as shown everywhere (the list, the posting's page, the browser tab): the role and the company as one
    text, "Senior Designer at Northwind Studio"; once the user has edited it, exactly what they wrote. */
export function displayTitle(posting: Pick<Posting, 'title' | 'company' | 'titleEdited'>): string {
  const company = posting.company.trim();
  const repeatsTitle = company.toLowerCase() === posting.title.trim().toLowerCase();
  if (posting.titleEdited || !company || repeatsTitle) return posting.title;
  return m.posting_title_with_company({ title: posting.title, company });
}

/** Whether the shown title already names the company, so a line under it needn't repeat it. */
export function titleNamesCompany(posting: Pick<Posting, 'title' | 'company' | 'titleEdited'>): boolean {
  const company = posting.company.trim().toLowerCase();
  return company !== '' && displayTitle(posting).toLowerCase().includes(company);
}

/** "3 Oct" this year, "3 Oct 2025" otherwise. */
export function formatAddedDate(iso: string): string {
  const date = new Date(iso);
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return new Intl.DateTimeFormat(getLocale(), {
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' })
  }).format(date);
}

/** "3 Oct, 14:05". */
export function formatCheckedAt(iso: string): string {
  return new Intl.DateTimeFormat(getLocale(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(
    new Date(iso)
  );
}

const ENGINE_NAMES: Record<string, () => string> = {
  'claude-code': () => m.settings_claude_name(),
  ollama: () => m.settings_ollama_name()
};

export function engineName(engine: string): string {
  return ENGINE_NAMES[engine]?.() ?? engine;
}

/** What to tell the user when a check gave no result; null when it worked. */
export function checkFailureText(check: unknown): string | null {
  if (typeof check !== 'object' || check === null || (check as { checked?: boolean }).checked) return null;
  const { skipped, engineError } = check as { skipped?: string; engineError?: string };
  const texts: Record<string, () => string> = {
    noCriteria: () => m.check_error_no_criteria(),
    nothingToRead: () => m.check_error_nothing(),
    notInstalled: () => m.check_error_not_installed(),
    notRunning: () => m.check_error_not_running(),
    noModel: () => m.check_error_no_model(),
    timeout: () => m.check_error_timeout(),
    badAnswer: () => m.check_error_bad_answer(),
    failed: () => m.check_error_failed()
  };
  const code = skipped ?? engineError;
  if (code === 'noEngine' || !code) return null;
  return (texts[code] ?? texts.failed)();
}

/** Where the posting came from: the link's site without "www.", a screenshot, or pasted text. */
export function postingSource(posting: Pick<Posting, 'source' | 'link'>): string {
  if (posting.source === 'image') return m.posting_source_image();
  if (!posting.link) return m.posting_source_pasted();
  try {
    return new URL(posting.link).hostname.replace(/^www\./, '');
  } catch {
    return m.posting_source_pasted();
  }
}
