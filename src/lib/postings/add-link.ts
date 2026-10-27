import { resolve } from '$app/paths';

/** In the Postings address, asks the page to open the add drawer at once. */
export const ADD_PARAM = 'add';

/** Where "Add postings" leads from another page: Postings, with the add drawer open. */
export function addPostingsHref(): string {
  return `${resolve('/postings')}?${ADD_PARAM}`;
}
