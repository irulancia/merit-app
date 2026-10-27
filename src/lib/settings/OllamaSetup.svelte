<script lang="ts">
  import { m } from '#lib/paraglide/messages.js';
  import type { DownloadTracker } from './download-tracker.svelte.js';

  interface Props {
    download: DownloadTracker;
    /** Opens the dialog that says what is downloaded, before anything starts. */
    onrequest: () => void;
    /** Opens the dialog that asks before deleting what a stopped download left. */
    ondelete: () => void;
  }

  let { download, onrequest, ondelete }: Props = $props();

  // Ollama running with nothing that reads a posting: one button downloads the model, so nobody needs a terminal.
  // The download runs in Merit; this shows where it stands, also after the page was closed
  const GIGABYTE = 1e9;
  const state = $derived(download.state);
  // Never 100% before Ollama says the model is in place
  const MAX_RUNNING_PERCENT = 99;
  const percent = $derived(state && state.total ? Math.min(MAX_RUNNING_PERCENT, Math.floor((state.completed / state.total) * 100)) : 0);
  const gigabytes = (bytes: number) => (bytes / GIGABYTE).toFixed(1);
</script>

{#if state?.phase === 'downloading'}
  <div class="pulling" aria-live="polite">
    <div class="progress" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={m.ollama_setup_progress_label()}>
      <span style:--value="{percent}%"></span>
    </div>
    <span class="reason">{m.ollama_setup_progress({ percent })}</span>
  </div>
  <button type="button" class="btn btn-secondary btn-sm" onclick={download.stop}>{m.ollama_setup_stop()}</button>
{:else if state?.phase === 'stopped' || state?.phase === 'failed'}
  <!-- Stopped, by the user or not: continue it, or delete what it left, so nobody has to find Ollama's folder -->
  {#if state.phase === 'failed'}
    <span class="failed"><span class="icon icon-sm icon-x-circle" aria-hidden="true"></span>{m.ollama_setup_failed()}</span>
  {:else}
    <span class="reason">{m.ollama_setup_stopped({ done: gigabytes(state.completed), total: gigabytes(state.total) })}</span>
  {/if}
  <button type="button" class="btn btn-secondary btn-sm" onclick={download.start}>{m.ollama_setup_continue()}</button>
  {#if state.completed > 0}
    <button type="button" class="link link-quiet" onclick={ondelete}>{m.ollama_setup_delete()}</button>
  {/if}
  {#if download.deleteFailed}
    <span class="failed"><span class="icon icon-sm icon-x-circle" aria-hidden="true"></span>{m.ollama_delete_failed()}</span>
  {/if}
{:else}
  <!-- What works, what is left and its size, the action: one line each. The button
       stays short, with the download icon, so it fits a narrow column: a button never wraps -->
  <span class="running">{m.settings_ollama_running()}</span>
  <span class="reason">{m.settings_ollama_one_step()}</span>
  <button type="button" class="btn btn-secondary btn-sm" onclick={onrequest}>
    <span class="icon icon-download" aria-hidden="true"></span>{m.ollama_setup_button()}
  </button>
{/if}

<style>
  .pulling {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    width: 100%;
  }

  /* What works already, in green like the other engines' ready line; what is left stays muted */
  .running {
    font-size: var(--text-small);
    font-weight: var(--weight-regular);
    color: var(--success-text);
  }

  .failed {
    display: inline-flex;
    align-items: flex-start;
    gap: var(--space-1);
    font-size: var(--text-small);
    color: var(--error-strong);
  }
</style>
