import { m } from '#lib/paraglide/messages.js';
import type { Need } from './needs.js';

export interface Headline {
  /** The answer to "is there anything for me?", in one sentence. */
  title: string;
  /** What else waits, briefly; empty when nothing does. */
  detail: string;
  /** The one thing to do now. */
  action: 'check' | 'review' | 'add';
}

/** The dashboard's opening line, from what matters most when someone opens Merit: good postings first, then
    what waits on them, then what to do when there is nothing new: a fresh start with no postings yet, or all caught
    up once every one is handled. Nothing is said about what is zero. */
export function headlineFor(worth: number, toCheck: number, needs: Need[], postings: number): Headline {
  const applicationNeeds = needs.filter((need) => need.kind !== 'toCheck').length;
  const details = [
    applicationNeeds === 1 ? m.headline_detail_needs_one() : applicationNeeds > 1 ? m.headline_detail_needs_many({ count: applicationNeeds }) : '',
    toCheck > 0 ? m.headline_detail_check({ count: toCheck }) : ''
  ].filter(Boolean);

  if (worth > 0) {
    return {
      title: worth === 1 ? m.headline_worth_one() : m.headline_worth_many({ count: worth }),
      detail: details.join(' · '),
      action: toCheck > 0 ? 'check' : 'review'
    };
  }
  if (toCheck > 0) {
    return { title: m.headline_check({ count: toCheck }), detail: details.slice(0, -1).join(' · '), action: 'check' };
  }
  if (applicationNeeds > 0) {
    return { title: m.headline_needs({ count: applicationNeeds }), detail: '', action: 'add' };
  }
  return { title: postings > 0 ? m.headline_caught_up() : m.headline_fresh_start(), detail: '', action: 'add' };
}

/** "Good morning" until noon, "Good afternoon" until six, then "Good evening". */
export function greetingFor(hour: number): string {
  if (hour < 12) return m.greeting_morning();
  if (hour < 18) return m.greeting_afternoon();
  return m.greeting_evening();
}
