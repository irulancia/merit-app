<script lang="ts">
  import { deserialize } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { m } from '#lib/paraglide/messages.js';
  import { checkFailureText } from './format.js';

  interface Props {
    /** The postings no AI engine has read yet. */
    ids: string[];
    /** The main action where it sits (the dashboard), a secondary one beside Add postings. */
    primary?: boolean;
  }

  let { ids, primary = false }: Props = $props();

  let running = $state(false);
  let stopRequested = $state(false);
  let done = $state(0);
  let total = $state(0);
  let failures = $state(0);
  let lastFailure = $state<string | null>(null);

  /** One posting, through the same "check" action its own page uses. */
  async function checkOne(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${resolve('/postings/[id]', { id })}?/check`, {
        method: 'POST',
        body: new FormData(),
        headers: { 'x-sveltekit-action': 'true' }
      });
      const result = deserialize(await response.text());
      const failure = result.type === 'success' ? checkFailureText(result.data) : m.check_error_failed();
      lastFailure = failure ?? lastFailure;
      return failure === null;
    } catch {
      lastFailure = m.check_error_failed();
      return false;
    }
  }

  /** One after another, never in parallel: an engine checks one posting at a time, and the list fills as it goes. */
  async function checkAll() {
    const queue = [...ids];
    running = true;
    stopRequested = false;
    done = 0;
    failures = 0;
    lastFailure = null;
    total = queue.length;
    for (const id of queue) {
      if (stopRequested) break;
      if (!(await checkOne(id))) failures += 1;
      done += 1;
      await invalidateAll();
    }
    running = false;
  }
</script>

{#if running}
  <div class="row progress-row" aria-live="polite">
    <span class="spinner" aria-hidden="true"></span>
    <span class="text-small">{m.check_all_running({ done: done + 1 > total ? total : done + 1, total })}</span>
    <div class="progress" role="progressbar" aria-valuenow={done} aria-valuemin={0} aria-valuemax={total} aria-label={m.check_all_progress()}>
      <span style:--value="{total ? Math.round((done / total) * 100) : 0}%"></span>
    </div>
    <button type="button" class="btn btn-ghost btn-sm" onclick={() => (stopRequested = true)} disabled={stopRequested}>
      {stopRequested ? m.check_all_stopping() : m.check_all_stop()}
    </button>
  </div>
{:else}
  <!-- Only when there is something new to check: no button standing at zero; the count in its label, "Check new · 1" -->
  {#if ids.length > 0}
    <button type="button" class="btn {primary ? 'btn-primary' : 'btn-secondary'}" onclick={checkAll}>
      <span class="icon icon-lightbulb" aria-hidden="true"></span>
      {m.check_new({ count: ids.length })}
    </button>
  {/if}
  {#if total > 0}
    <span class="text-small text-muted" aria-live="polite">
      {failures > 0 ? m.check_all_done_failures({ done: done - failures, failures, reason: lastFailure ?? '' }) : m.check_all_done({ done })}
    </span>
  {/if}
{/if}

<style>
  .progress-row {
    gap: var(--space-2);
  }

  .progress {
    width: var(--space-11);
  }
</style>
