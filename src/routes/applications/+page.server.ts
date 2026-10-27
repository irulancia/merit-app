import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// Applications became the Applying and Closed tabs of Postings; an old link or bookmark still finds them
export const load: PageServerLoad = () => {
  redirect(308, '/postings?view=applying');
};
