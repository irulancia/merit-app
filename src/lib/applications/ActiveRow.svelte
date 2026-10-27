<script lang="ts">
  import { enhance } from '$app/forms';
  import { resolve } from '$app/paths';
  import { m } from '#lib/paraglide/messages.js';
  import { displayTitle, formatAddedDate } from '#lib/postings/format.js';
  import type { ListEntry } from '#lib/postings/list.js';
  import { placeOf, type PostingPlace } from '#lib/postings/place.js';
  import PostingRow from '#lib/postings/PostingRow.svelte';
  import { daysWithoutReply } from './text.js';
  import { hasApplied, type Application } from './types.js';
  import { offerUndoMove } from './undo.svelte.js';

  interface Props {
    /** A posting in Applying: the same row as every tab, with this tab's detail and actions. */
    entry: ListEntry & { posting: { application: Application } };
    onclose: (id: string, title: string, place: PostingPlace) => void;
    ondelete: (id: string, title: string) => void;
  }

  let { entry, onclose, ondelete }: Props = $props();

  let busy = $state(false);

  const posting = $derived(entry.posting);
  const application = $derived(posting.application);
  const applied = $derived(hasApplied(application));
  const waiting = $derived(daysWithoutReply({ ...application, stage: applied ? 'applied' : application.stage }));
  const href = $derived(resolve('/postings/[id]', { id: posting.id }));
  const detail = $derived(
    applied
      ? m.application_applied_on({ date: formatAddedDate(application.appliedAt || application.stageAt) })
      : m.application_marked_on({ date: formatAddedDate(application.stageAt) })
  );
</script>

{#snippet extra()}
  {#if waiting !== null}
    <span class="badge badge-warning waiting">{m.application_no_reply({ days: waiting })}</span>
  {/if}
{/snippet}

<!-- This tab's actions, as items of the row's menu: the next step first -->
{#snippet actions()}
  {#if !applied}
    <form
      method="POST"
      action="?/move"
      use:enhance={() => {
        busy = true;
        // As it was before the click, for Undo
        const previous = placeOf(posting);
        return async ({ result, update }) => {
          await update({ reset: false });
          busy = false;
          if (result.type === 'success') offerUndoMove(m.undo_marked_applied(), posting.id, previous);
        };
      }}
    >
      <input type="hidden" name="id" value={posting.id} />
      <input type="hidden" name="stage" value="applied" />
      <button type="submit" class="menu-item" role="menuitem" disabled={busy}>
        <span class="menu-item-label"><span class="icon icon-paper-plane-tilt" aria-hidden="true"></span>{m.application_mark_applied()}</span>
      </button>
    </form>
    <a class="menu-item" role="menuitem" href="{href}#cover-letter">
      <span class="menu-item-label"><span class="icon icon-note-pencil" aria-hidden="true"></span>{m.application_write_letter()}</span>
    </a>
  {/if}
  <button type="button" class="menu-item" role="menuitem" onclick={() => onclose(posting.id, displayTitle(posting), placeOf(posting))}>
    <span class="menu-item-label"><span class="icon icon-check-square" aria-hidden="true"></span>{m.application_mark_closed()}…</span>
  </button>
{/snippet}

<PostingRow {entry} {detail} {extra} {actions} {ondelete} />

<style>
  .waiting {
    align-self: flex-start;
  }
</style>
