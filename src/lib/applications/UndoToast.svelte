<script lang="ts">
  import { deserialize } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { m } from '#lib/paraglide/messages.js';
  import { dismissUndo, undoState } from './undo.svelte.js';

  /** Long enough to notice a slip and reach the button; then the move simply stands. */
  const SHOWN_FOR_MS = 8_000;

  let region = $state<HTMLDivElement>();
  let undoing = $state(false);
  let failed = $state(false);

  const offer = $derived(undoState.offer);

  // The region is a manual popover (above an open dialog too): open while there is an offer, for a few seconds
  $effect(() => {
    if (!region) return;
    if (!offer) {
      if (region.matches(':popover-open')) region.hidePopover();
      return;
    }
    failed = false;
    if (!region.matches(':popover-open')) region.showPopover();
    const timer = setTimeout(dismissUndo, SHOWN_FOR_MS);
    return () => clearTimeout(timer);
  });

  /** Takes the last move or delete back, through the action the offer names. */
  async function undo() {
    if (!offer) return;
    const body = new FormData();
    for (const [name, value] of Object.entries(offer.fields)) body.set(name, value);
    undoing = true;
    try {
      const response = await fetch(offer.action, {
        method: 'POST',
        body,
        headers: { 'x-sveltekit-action': 'true' }
      });
      const result = deserialize(await response.text());
      if (result.type !== 'success') {
        failed = true;
        return;
      }
      dismissUndo();
      await invalidateAll();
    } catch {
      failed = true;
    } finally {
      undoing = false;
    }
  }
</script>

<div class="toast-region" popover="manual" role="region" aria-label={m.undo_region_label()} bind:this={region}>
  {#if offer}
    <div class="toast" class:toast-error={failed} role="status">
      <span class="icon {failed ? 'icon-x-circle' : 'icon-check-circle'}" aria-hidden="true"></span>
      <div class="alert-body">
        <span>{failed ? m.undo_failed() : offer.message}</span>
      </div>
      <button type="button" class="btn btn-secondary btn-sm" onclick={undo} disabled={undoing}>{m.undo_action()}</button>
      <button type="button" class="toast-close" aria-label={m.undo_dismiss()} onclick={dismissUndo}>&times;</button>
    </div>
  {/if}
</div>

<style>
  /* one line: the message, Undo and the close, centred on each other. As wide as that line needs (the system's
     fixed width left the message a word per line beside Undo and the close), never wider than the screen. */
  .toast {
    align-items: center;
    width: max-content;
    max-width: 100%;
  }
</style>
