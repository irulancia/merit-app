import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// Settings opens on the criteria: the setting everything else depends on
export const load: PageServerLoad = () => {
  redirect(307, '/settings/criteria');
};
