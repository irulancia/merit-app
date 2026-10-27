import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// Everyone starts at the dashboard: someone not set up yet finds the setup open there
export const load: PageServerLoad = () => {
  redirect(307, '/dashboard');
};
