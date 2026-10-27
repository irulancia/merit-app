/** Why an engine gave no answer — each one has its own message for the user. */
export type EngineErrorCode = 'notInstalled' | 'notRunning' | 'noModel' | 'timeout' | 'failed' | 'badAnswer';

export class EngineError extends Error {
  constructor(
    readonly code: EngineErrorCode,
    readonly detail?: string
  ) {
    super(`AI engine: ${code}${detail ? ` — ${detail}` : ''}`);
  }
}
