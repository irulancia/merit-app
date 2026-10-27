import { m } from '#lib/paraglide/messages.js';
import type { Application } from './types.js';

/** The message asking for feedback, without AI: one template per situation, the role and company filled in.
    Turned down asks what to do better; no reply first asks whether the application is still being considered. */
export function feedbackRequestTemplate(application: Application, title: string, company: string): string {
  const role = company ? m.request_role_at({ title, company }) : title;
  return application.closedReason === 'noReply'
    ? m.request_template_no_reply({ role })
    : m.request_template_not_selected({ role });
}
