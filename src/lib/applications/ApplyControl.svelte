<script lang="ts">
  import { enhance } from '$app/forms';
  import { m } from '#lib/paraglide/messages.js';
  import type { PostingPlace } from '#lib/postings/place.js';
  import { hasApplied, type Stage } from './types.js';
  import { offerUndoMove } from './undo.svelte.js';

  interface Props {
    postingId: string;
    /** Where it is now: which step comes next, and where Undo puts it back. */
    place: PostingPlace;
    /** Closing asks how it ended, in the close dialog the page holds. */
    onclose: () => void;
  }

  let { postingId, place, onclose }: Props = $props();

  let busy = $state(false);

  const application = $derived(place.application);
  // The next step on the way, never the state (the breadcrumb says where it is): want to apply, then mark it
  // applied, then close it; a closed one has none here (it reopens from the menu)
  const next = $derived(
    application === null ? 'want' : application.stage === 'want' ? 'applied' : hasApplied(application) ? 'close' : null
  );

  const STEP: Record<'want' | 'applied', { stage: Stage; icon: string; label: () => string; undo: () => string }> = {
    want: { stage: 'want', icon: 'icon-plus-circle', label: () => m.apply_want(), undo: () => m.undo_moved_want() },
    applied: { stage: 'applied', icon: 'icon-paper-plane-tilt', label: () => m.application_mark_applied(), undo: () => m.undo_marked_applied() }
  };
</script>

{#if next === 'want' || next === 'applied'}
  {@const step = STEP[next]}
  <form
    method="POST"
    action="?/apply"
    use:enhance={() => {
      busy = true;
      const previous = place;
      return async ({ result, update }) => {
        await update({ reset: false });
        busy = false;
        // A click by mistake can be taken back for a few seconds
        if (result.type === 'success') offerUndoMove(step.undo(), postingId, previous);
      };
    }}
  >
    <input type="hidden" name="stage" value={step.stage} />
    <button type="submit" class="btn btn-primary" disabled={busy}>
      <span class="icon {step.icon}" aria-hidden="true"></span>
      {step.label()}
    </button>
  </form>
{:else if next === 'close'}
  <button type="button" class="btn btn-primary" onclick={onclose}>
    <span class="icon icon-check-square" aria-hidden="true"></span>
    {m.application_mark_closed()}…
  </button>
{/if}
