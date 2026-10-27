<script lang="ts">
  import { enhance } from '$app/forms';
  import { offerUndoDelete } from '#lib/applications/undo.svelte.js';
  import { m } from '#lib/paraglide/messages.js';

  interface Props {
    /** On a posting's own page: its id and title. In a list, open() says which posting instead. */
    postingId?: string;
    title?: string;
  }

  let { postingId = '', title = '' }: Props = $props();

  let dialog = $state<HTMLDialogElement>();
  // Set when opened from a list: the list page's own delete action, told which posting by its id
  let listed = $state<{ id: string; title: string } | null>(null);

  export function open(posting?: { id: string; title: string }) {
    listed = posting ?? null;
    dialog?.showModal();
  }
</script>

<dialog class="dialog" bind:this={dialog} aria-labelledby="delete-title">
  <div class="dialog-header">
    <h2 id="delete-title">{m.posting_delete_title()}</h2>
    <p class="dialog-description">{m.posting_delete_text({ title: listed?.title ?? title })}</p>
  </div>
  <div class="dialog-footer">
    <form method="dialog">
      <button class="btn btn-secondary">{m.posting_delete_cancel()}</button>
    </form>
    <form
      method="POST"
      action="?/delete"
      use:enhance={() => {
        const id = listed?.id ?? postingId;
        return async ({ result, update }) => {
          dialog?.close();
          await update();
          // On its own page the delete ends on the postings list (a redirect); in a list, in place
          if (result.type === 'success' || result.type === 'redirect') offerUndoDelete(m.undo_deleted(), id);
        };
      }}
    >
      {#if listed}<input type="hidden" name="id" value={listed.id} />{/if}
      <button class="btn btn-destructive">{m.posting_delete_confirm()}</button>
    </form>
  </div>
</dialog>
