/** Where an application stands; a posting is in Applications once the user wants to apply to it.
    The page shows two lists: Active (want, applied) and Closed. "interviewing"
    and "offer" stay readable for applications saved before, and count as applied. */
export const STAGES = ['want', 'applied', 'interviewing', 'offer', 'closed'] as const;
export type Stage = (typeof STAGES)[number];

/** How a closed application ended. */
export const CLOSED_REASONS = ['notSelected', 'noReply', 'withdrew', 'accepted', 'declined'] as const;
export type ClosedReason = (typeof CLOSED_REASONS)[number];

/** The closed ones it makes sense to ask for feedback on: turned down, or never answered. */
export const ASK_FEEDBACK_REASONS: readonly ClosedReason[] = ['notSelected', 'noReply'];

export const NOTE_LIMIT = 4_000;

export interface Application {
  stage: Stage;
  /** When it moved to this stage (ISO). */
  stageAt: string;
  /** When the user applied (ISO); empty until then. */
  appliedAt: string;
  /** Only for a closed one. */
  closedReason: ClosedReason | '';
  /** What the employer said, in their words or the user's. */
  feedback: string;
  /** The message asking for feedback, as drafted (and possibly edited); kept to copy again later. */
  feedbackRequest: string;
}

/** Days after applying with no news before the card says "No reply yet". */
export const NO_REPLY_AFTER_DAYS = 7;

export function isStage(candidate: unknown): candidate is Stage {
  return typeof candidate === 'string' && (STAGES as readonly string[]).includes(candidate);
}

export function isClosedReason(candidate: unknown): candidate is ClosedReason {
  return typeof candidate === 'string' && (CLOSED_REASONS as readonly string[]).includes(candidate);
}

/** Applied, or further along: what the Active list shows as "Applied". */
export function hasApplied(application: Application): boolean {
  return application.stage === 'applied' || application.stage === 'interviewing' || application.stage === 'offer';
}

/** The application after a move: the date it applied is kept once set — unless it goes back to "want", which says
    it hasn't been sent yet — a reason only while closed, and the feedback stays whatever the stage. */
export function moveApplication(current: Application | null, stage: Stage, closedReason: ClosedReason | '', now: string): Application {
  const appliedAt = stage === 'want' ? '' : current?.appliedAt || (stage !== 'closed' ? now : '');
  return {
    stage,
    stageAt: now,
    appliedAt,
    closedReason: stage === 'closed' ? closedReason : '',
    feedback: current?.feedback ?? '',
    feedbackRequest: current?.feedbackRequest ?? ''
  };
}

export function parseApplication(raw: unknown): Application | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const record = raw as Record<string, unknown>;
  if (!isStage(record.stage)) return null;
  const text = (value: unknown) => (typeof value === 'string' ? value : '');
  return {
    stage: record.stage,
    stageAt: text(record.stageAt),
    appliedAt: text(record.appliedAt),
    closedReason: isClosedReason(record.closedReason) ? record.closedReason : '',
    feedback: text(record.feedback),
    feedbackRequest: text(record.feedbackRequest)
  };
}
