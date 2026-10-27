/** Where Merit's download of Ollama's model stands: shared by the server, which runs it, and the page, which shows it. */
export type DownloadPhase = 'idle' | 'downloading' | 'stopped' | 'failed' | 'done';

export interface DownloadState {
  phase: DownloadPhase;
  /** Bytes so far and in all; 0 before Ollama has said. */
  completed: number;
  total: number;
}

export const IDLE_DOWNLOAD: DownloadState = { phase: 'idle', completed: 0, total: 0 };
