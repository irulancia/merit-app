import { m } from '#lib/paraglide/messages.js';

/** The question to ask the employer about each criterion, when a posting doesn't say. A criterion without one
    here (a new one, before its question is written) is simply left out of the list. */
export const CRITERION_QUESTIONS: Record<string, () => string> = {
  no_outsourcing: () => m.question_no_outsourcing(),
  employer_rating: () => m.question_rating(),
  industries_avoid: () => m.question_industries(),
  company_size: () => m.question_company_size(),
  direct_hire: () => m.question_direct_hire(),
  work_location: () => m.question_location(),
  flexible_hours: () => m.question_flexible_hours(),
  no_shifts: () => m.question_no_shifts(),
  salary_minimum: () => m.question_salary(),
  design_system: () => m.question_design_system(),
  own_product: () => m.question_own_product(),
  commute: () => m.question_commute(),
  contract_type: () => m.question_contract_type(),
  contract_duration: () => m.question_contract_duration(),
  working_hours: () => m.question_working_hours(),
  seniority: () => m.question_seniority(),
  role_type: () => m.question_role_type(),
  bonus_equity: () => m.question_bonus_equity(),
  health_insurance: () => m.question_health_insurance(),
  paid_time_off: () => m.question_paid_time_off(),
  end_to_end: () => m.question_end_to_end(),
  clear_scope: () => m.question_clear_scope(),
  no_extras: () => m.question_no_extras(),
  little_travel: () => m.question_little_travel(),
  learning_budget: () => m.question_learning_budget(),
  mission: () => m.question_mission(),
  accessibility: () => m.question_accessibility(),
  parental_leave: () => m.question_parental_leave()
};
