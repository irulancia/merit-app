<script lang="ts">
  import { enhance } from '$app/forms';
  import { m } from '#lib/paraglide/messages.js';
  import { CLOSED_REASON_TEXT } from './text.js';
  import type { PostingPlace } from '#lib/postings/place.js';
  import { CLOSED_REASONS, type ClosedReason } from './types.js';
  import { offerUndoMove } from './undo.svelte.js';

  let dialog = $state<HTMLDialogElement>();
  let postingId = $state('');
  let postingTitle = $state('');
  let reason = $state<ClosedReason>('notSelected');
  // Where it was before closing, for Undo
  let previous = $state<PostingPlace | null>(null);

  export function open(id: string, title: string, place: PostingPlace) {
    postingId = id;
    postingTitle = title;
    previous = place;
    reason = 'notSelected';
    dialog?.showModal();
  }
</script>

<dialog class="dialog" bind:this={dialog} aria-labelledby="close-title">
  <form
    method="POST"
    action="?/move"
    use:enhance={() => async ({ result, update }) => {
      dialog?.close();
      await update({ reset: false });
      if (result.type === 'success' && previous) offerUndoMove(m.undo_moved_closed(), postingId, previous);
    }}
  >
    <div class="dialog-header">
      <h2 id="close-title">{m.close_title()}</h2>
      <p class="dialog-description">{m.close_text({ title: postingTitle })}</p>
    </div>
    <input type="hidden" name="id" value={postingId} />
    <input type="hidden" name="stage" value="closed" />
    <div class="dialog-body">
      <fieldset class="fieldset">
        <legend class="sr-only">{m.close_title()}</legend>
        <div class="choice-group">
          {#each CLOSED_REASONS as option (option)}
            <label class="radio"><input type="radio" name="reason" value={option} bind:group={reason} />{CLOSED_REASON_TEXT[option]()}</label>
          {/each}
        </div>
      </fieldset>
    </div>
    <div class="dialog-footer">
      <button type="button" class="btn btn-secondary" onclick={() => dialog?.close()}>{m.close_cancel()}</button>
      <button type="submit" class="btn btn-primary">{m.close_confirm()}</button>
    </div>
  </form>
</dialog>
