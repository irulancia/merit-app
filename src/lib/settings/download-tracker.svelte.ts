import { invalidateAll } from '$app/navigation';
import { resolve } from '$app/paths';
import type { DownloadState } from './ollama-download.js';

const POLL_MS = 1_000;

/** The page's view of the download Merit runs: starts and stops it, and asks every second while it runs. */
export class DownloadTracker {
  state = $state<DownloadState>();
  /** Set when "Delete it" couldn't remove the files; cleared by the next try. */
  deleteFailed = $state(false);
  #timer: ReturnType<typeof setTimeout> | undefined;

  constructor(initial: DownloadState) {
    this.state = initial;
    this.#follow();
  }

  start = () => this.#send('POST');
  stop = () => this.#send('DELETE');

  /** Deletes what a stopped download left on the disk. */
  discard = async () => {
    this.deleteFailed = false;
    try {
      const response = await fetch(resolve('/settings/ai/download/unfinished'), {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: '{}'
      });
      if (!response.ok) throw new Error(`Merit answered ${response.status}`);
      this.state = (await response.json()) as DownloadState;
    } catch (cause) {
      console.error('Deleting the unfinished Ollama download failed:', cause);
      this.deleteFailed = true;
    }
  };

  destroy() {
    clearTimeout(this.#timer);
  }

  async #send(method: 'GET' | 'POST' | 'DELETE') {
    clearTimeout(this.#timer);
    try {
      const sends = method !== 'GET';
      const response = await fetch(resolve('/settings/ai/download'), {
        method,
        ...(sends ? { headers: { 'content-type': 'application/json' }, body: '{}' } : {})
      });
      if (!response.ok) throw new Error(`Merit answered ${response.status}`);
      this.state = (await response.json()) as DownloadState;
    } catch (cause) {
      console.error('Following the Ollama download failed:', cause);
      if (this.state) this.state = { ...this.state, phase: 'failed' };
    }
    this.#follow();
  }

  /** While it runs, asks again in a second; once the model is in place, the page reloads what Ollama has. */
  #follow() {
    if (this.state?.phase === 'downloading') this.#timer = setTimeout(() => this.#send('GET'), POLL_MS);
    if (this.state?.phase === 'done') void invalidateAll();
  }
}
