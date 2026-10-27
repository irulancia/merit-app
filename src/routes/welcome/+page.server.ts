import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// The welcome steps became the setup on the dashboard; an old link lands there
export const load: PageServerLoad = () => {
  redirect(308, '/dashboard');
};
