import { m } from '#lib/paraglide/messages.js';

/** What is usually clarified in an interview, not in a posting: the user ticks the
    ones they care about once, in About you, and every posting lists their questions. The ids are the criteria they
    used to be, so the ticks could start from those. */
export interface InterviewTopic {
  id: string;
  title: () => string;
  question: () => string;
}

export const INTERVIEW_TOPICS: InterviewTopic[] = [
  { id: 'user_access', title: () => m.crit_user_access_title(), question: () => m.question_user_access() },
  { id: 'design_maturity', title: () => m.crit_design_maturity_title(), question: () => m.question_design_maturity() },
  { id: 'discovery_time', title: () => m.crit_discovery_time_title(), question: () => m.question_discovery_time() },
  { id: 'outcomes_measured', title: () => m.crit_outcomes_measured_title(), question: () => m.question_outcomes_measured() },
  { id: 'other_designers', title: () => m.crit_other_designers_title(), question: () => m.question_other_designers() },
  { id: 'close_to_dev', title: () => m.crit_close_to_dev_title(), question: () => m.question_close_to_dev() },
  { id: 'design_manager', title: () => m.crit_design_manager_title(), question: () => m.question_design_manager() },
  { id: 'reasonable_workload', title: () => m.crit_reasonable_workload_title(), question: () => m.question_reasonable_workload() },
  { id: 'feedback_culture', title: () => m.crit_feedback_culture_title(), question: () => m.question_feedback_culture() },
  { id: 'low_turnover', title: () => m.crit_low_turnover_title(), question: () => m.question_low_turnover() },
  { id: 'inclusive', title: () => m.crit_inclusive_title(), question: () => m.question_inclusive() },
  { id: 'time_off_respected', title: () => m.crit_time_off_respected_title(), question: () => m.question_time_off_respected() },
  { id: 'career_path', title: () => m.crit_career_path_title(), question: () => m.question_career_path() },
  { id: 'ethical_design', title: () => m.crit_ethical_design_title(), question: () => m.question_ethical_design() },
  { id: 'mental_health', title: () => m.crit_mental_health_title(), question: () => m.question_mental_health() }
];

const TOPIC_IDS = new Set(INTERVIEW_TOPICS.map((topic) => topic.id));

/** Criteria that went into a topic of another name when they stopped being criteria. */
const MERGED_INTO: Record<string, string> = { mentoring: 'other_designers' };

/** The topics from a file or a form: known ids only, in the list's order, no repeats. */
export function parseTopics(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const chosen = new Set(raw.filter((id): id is string => typeof id === 'string'));
  return INTERVIEW_TOPICS.filter((topic) => chosen.has(topic.id)).map((topic) => topic.id);
}

/** The first ticks, from the criteria the user had in use before these became questions; every topic when they
    had none of them (a new user, or one who never got that far). */
export function topicsFromOldCriteria(raw: unknown): string[] {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const inUse = Object.entries(record)
    .filter(([, setting]) => typeof setting === 'object' && setting !== null && (setting as Record<string, unknown>).level !== 'off')
    .map(([id]) => MERGED_INTO[id] ?? id)
    .filter((id) => TOPIC_IDS.has(id));
  return inUse.length > 0 ? parseTopics(inUse) : INTERVIEW_TOPICS.map((topic) => topic.id);
}

/** The questions for the topics chosen, in the list's order. */
export function interviewQuestions(topics: string[]): string[] {
  return INTERVIEW_TOPICS.filter((topic) => topics.includes(topic.id)).map((topic) => topic.question());
}
