<script lang="ts">
  import { enhance } from '$app/forms';
  import { resolve } from '$app/paths';
  import { m } from '#lib/paraglide/messages.js';
  import { displayTitle, formatAddedDate } from '#lib/postings/format.js';
  import type { ListEntry } from '#lib/postings/list.js';
  import PostingRow from '#lib/postings/PostingRow.svelte';
  import { CLOSED_REASON_TEXT } from './text.js';
  import { ASK_FEEDBACK_REASONS, type Application } from './types.js';

  interface Props {
    /** A posting in Closed: the same row as every tab, with how it ended and this tab's actions. */
    entry: ListEntry & { posting: { application: Application } };
    ondelete: (id: string, title: string) => void;
  }

  let { entry, ondelete }: Props = $props();

  const posting = $derived(entry.posting);
  const application = $derived(posting.application);
  // Asking makes sense when turned down or never answered, and only until feedback has come
  const canAsk = $derived(
    !application.feedback && application.closedReason !== '' && ASK_FEEDBACK_REASONS.includes(application.closedReason)
  );
  const reasonText = $derived(application.closedReason ? CLOSED_REASON_TEXT[application.closedReason]() : m.stage_closed());
  const detail = $derived(`${reasonText} · ${formatAddedDate(application.stageAt)}`);
</script>

{#snippet extra()}
  {#if application.feedback}
    <p class="text-small excerpt"><strong>{m.application_feedback_label()}</strong> {application.feedback}</p>
  {/if}
  {#if posting.notes}
    <p class="text-small excerpt"><strong>{m.application_notes_label()}</strong> {posting.notes}</p>
  {/if}
{/snippet}

<!-- This tab's actions, as items of the row's menu (Delete is the menu's own, last). Feedback and notes live on the
     posting's page, edited in place: one item leads there, to its feedback card -->
{#snippet actions()}
  <a class="menu-item" role="menuitem" href="{resolve('/postings/[id]', { id: posting.id })}#feedback">
    <span class="menu-item-label">
      <span class="icon {canAsk ? 'icon-envelope-simple-open' : 'icon-chat-text'}" aria-hidden="true"></span>
      {canAsk ? m.application_ask_feedback() : m.feedback_title()}
    </span>
  </a>
  <form method="POST" action="?/move" use:enhance={() => async ({ update }) => update({ reset: false })}>
    <input type="hidden" name="id" value={posting.id} />
    <input type="hidden" name="stage" value={application.appliedAt ? 'applied' : 'want'} />
    <button type="submit" class="menu-item" role="menuitem">
      <span class="menu-item-label"><span class="icon icon-arrow-circle-left" aria-hidden="true"></span>{m.application_reopen()}</span>
    </button>
  </form>
{/snippet}

<PostingRow {entry} {detail} {extra} {actions} {ondelete} />

<style>
  .excerpt {
    margin: 0;
    color: var(--text-secondary);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
