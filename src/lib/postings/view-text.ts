import { m } from '#lib/paraglide/messages.js';
import type { View } from './list.js';

/** Each tab's name: in the tabs, and on a search result, which mixes postings from every tab. */
export const VIEW_NAMES: Record<View, () => string> = {
  considering: () => m.view_considering(),
  notSure: () => m.view_not_sure(),
  applying: () => m.view_applying(),
  closed: () => m.view_closed()
};
