<script lang="ts">
  import { m } from '#lib/paraglide/messages.js';

  export type SaveState = 'saved' | 'saving' | 'failed';

  interface Props {
    state: SaveState;
  }

  let { state }: Props = $props();
</script>

<!-- Every change saves by itself; this line says so, or, when a change didn't save, only that, beside its icon: the
     page's own alert above the criteria says why and holds the retry, so it isn't said twice -->
<div class="status" class:is-failed={state === 'failed'} aria-live="polite">
  <div class="line">
    {#if state === 'saving'}
      <span class="spinner" aria-hidden="true"></span>
      <span>{m.criteria_saving()}</span>
    {:else if state === 'failed'}
      <span class="icon icon-x-circle" aria-hidden="true"></span>
      <span>{m.criteria_status_not_saved()}</span>
    {:else}
      <span class="icon icon-check-circle" aria-hidden="true"></span>
      <span>{m.criteria_status_saved()}</span>
    {/if}
  </div>
  {#if state !== 'failed'}
    <p class="text-small text-muted">{m.criteria_autosave_note()}</p>
  {/if}
</div>

<style>
  p {
    margin: 0;
  }

  .status {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    padding-bottom: var(--space-3);
    border-bottom: 1px solid var(--border-subtle);
  }

  .line {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-weight: var(--weight-semibold);
  }

  .line .icon {
    color: var(--success-strong);
  }

  .is-failed .line,
  .is-failed .line .icon {
    color: var(--error-strong);
  }

  /* The size of the icons it takes turns with, so the line doesn't jump */
  .spinner {
    width: 1em;
    height: 1em;
    border-width: 2px;
  }
</style>
