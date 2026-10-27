import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// Criteria moved under Settings; an old link or bookmark still finds them
export const load: PageServerLoad = () => {
  redirect(308, '/settings/criteria');
};
