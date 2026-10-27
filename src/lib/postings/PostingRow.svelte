<script lang="ts">
  import type { Snippet } from 'svelte';
  import { enhance, type SubmitFunction } from '$app/forms';
  import { resolve } from '$app/paths';
  import { offerUndoMove } from '#lib/applications/undo.svelte.js';
  import { m } from '#lib/paraglide/messages.js';
  import FitBar from './FitBar.svelte';
  import { displayTitle, formatAddedDate, postingSource, titleNamesCompany } from './format.js';
  import type { ListEntry } from './list.js';
  import { placeOf } from './place.js';
  import RowMenu from './RowMenu.svelte';
  import { VIEW_NAMES } from './view-text.js';

  interface Props {
    entry: ListEntry;
    /** A search result: the tab it is in shows, since the results mix every tab. */
    searching?: boolean;
    /** The tab's own word on the meta line, in place of the date added ("Applied Oct 22", "No reply · Oct 22"). */
    detail?: string;
    /** Under the row's text: what the tab adds (a waiting badge, the feedback kept). */
    extra?: Snippet;
    /** The tab's own actions, as items of the row's menu; Considering and Not sure have theirs here. */
    actions?: Snippet;
    /** Delete asks first, in the dialog the page holds. */
    ondelete: (id: string, title: string) => void;
  }

  let { entry, searching = false, detail, extra, actions, ondelete }: Props = $props();

  const posting = $derived(entry.posting);
  const fit = $derived(entry.fit);
  // Until an engine has read it, the title is only the text's first line (which the right column shows anyway): it
  // says so instead — unless the user named it themselves
  const title = $derived(!posting.checkedAt && !posting.titleEdited ? m.posting_not_checked() : displayTitle(posting));
  const href = $derived(resolve('/postings/[id]', { id: posting.id }));
  const checked = $derived(fit.inUse.length - fit.counts.unmarked);
  const notSure = $derived(entry.view === 'notSure');
  // Set aside by the user wins over Merit's filter: it is the user's own call
  const byYou = $derived(notSure && posting.archived);

  // Why Merit put it in Not sure (said under the bar); in Applying or Closed the user decided past that
  const shownFiltered = $derived(entry.filtered && entry.view === 'notSure');

  /** One line under the title: the non-negotiables it misses (the badge says that is why it's in Not sure, so only
      the Miss icon leads them), or that it isn't checked yet (its text would only repeat a
      title taken from it); a checked one shows its result as the bar instead. */
  const summary = $derived(
    shownFiltered
      ? fit.failedMust.map((criterion) => criterion.title()).join(', ')
      : checked === 0 && !posting.excerpt && !posting.image
        ? m.posting_no_text_link()
        : null
  );
  // On the right, what the job is; until a check has said it, the posting's own opening lines
  const about = $derived(posting.summary?.role || (checked === 0 ? posting.excerpt : ''));

  /** One of the posting's own actions, from the list. */
  function postingAction(name: string): string {
    return `${resolve('/postings/[id]', { id: posting.id })}?/${name}`;
  }

  /** A move from the menu, with Undo for a few seconds: it puts the posting back where it was. */
  function withUndo(message: () => string): SubmitFunction {
    return () => {
      const previous = placeOf(posting);
      return async ({ result, update }) => {
        await update({ reset: false, invalidateAll: true });
        if (result.type === 'success') offerUndoMove(message(), posting.id, previous);
      };
    };
  }
</script>

{#snippet considering()}
  <form method="POST" action={postingAction('apply')} use:enhance={withUndo(() => m.undo_moved_want())}>
    <input type="hidden" name="stage" value="want" />
    <button type="submit" class="menu-item" role="menuitem">
      <span class="menu-item-label"><span class="icon icon-plus-circle" aria-hidden="true"></span>{m.apply_want()}</span>
    </button>
  </form>
  <form method="POST" action={postingAction('moveTo')} use:enhance={withUndo(() => m.undo_moved_to({ view: VIEW_NAMES.notSure() }))}>
    <input type="hidden" name="to" value="notSure" />
    <button type="submit" class="menu-item" role="menuitem">
      <span class="menu-item-label"><span class="icon icon-archive" aria-hidden="true"></span>{m.posting_archive()}</span>
    </button>
  </form>
{/snippet}

{#snippet notSureItems()}
  <form method="POST" action="/postings?/bringBack" use:enhance={withUndo(() => m.undo_moved_to({ view: VIEW_NAMES.considering() }))}>
    <input type="hidden" name="id" value={posting.id} />
    <input type="hidden" name="keep" value={String(entry.filtered)} />
    <!-- Filtered out by Merit: kept although it misses; set aside by the user: simply back -->
    <button type="submit" class="menu-item" role="menuitem">
      <span class="menu-item-label">
        <span class="icon icon-arrow-circle-left" aria-hidden="true"></span>
        {entry.filtered && !posting.archived ? m.posting_consider_anyway() : m.posting_bring_back()}
      </span>
    </button>
  </form>
{/snippet}

{#snippet items()}
  {#if actions}
    {@render actions()}
  {:else if entry.view === 'considering'}
    {@render considering()}
  {:else if notSure}
    {@render notSureItems()}
  {/if}
  <div class="menu-separator" role="separator"></div>
  <button type="button" class="menu-item is-destructive" role="menuitem" onclick={() => ondelete(posting.id, title)}>
    <span class="menu-item-label"><span class="icon icon-trash" aria-hidden="true"></span>{m.posting_delete()}…</span>
  </button>
{/snippet}

<li class="list-item posting-row" class:is-unchecked={!posting.checkedAt}>
  <!-- Two columns: on the left the title, where it's from, and how it fits (the bar, its words on hover); on the
       right what the job is, the longer text, as on the posting's page. One column on a narrow screen. Every action
       is in the menu at the row's end, the same in every tab. -->
  <div class="list-item-main">
    <div class="columns">
      <div class="identity">
        <span class="title-line">
          <a class="list-item-title title-link" {href}>{title}</a>
        </span>
        <span class="list-item-meta">
          {[titleNamesCompany(posting) ? '' : posting.company, postingSource(posting), detail ?? formatAddedDate(posting.createdAt)]
            .filter(Boolean)
            .join(' · ')}
        </span>
        <!-- The bar on every row, grey until checked; under it, only when there is something to say -->
        {#if fit.inUse.length > 0}
          <div class="result">
            <FitBar counts={fit.counts} compact />
          </div>
        {/if}
        {#if byYou}
          <!-- Who put it in Not sure, where the misses would be: the user, in the same red -->
          <span class="text-small summary is-filtered"><span class="icon icon-sm icon-archive" aria-hidden="true"></span><span class="summary-text">{m.not_sure_by_you()}</span></span>
        {:else if summary}
          <span class="text-small summary" class:is-filtered={shownFiltered}>
            {#if shownFiltered}<span class="icon icon-sm icon-prohibit" aria-hidden="true"></span><span class="sr-only">{m.not_sure_by_merit()}:</span>{/if}<span class="summary-text">{summary}</span>
          </span>
        {/if}
      </div>
      {#if about}
        <p class="role">{about}</p>
      {/if}
    </div>
    {@render extra?.()}
  </div>
  <!-- In a search, which tab it is in -->
  {#if searching}
    <div class="row badges">
      <span class="badge badge-neutral">{VIEW_NAMES[entry.view]()}</span>
    </div>
  {/if}
  <RowMenu postingId={posting.id} {title} {items} />
</li>

<style>
  /* the title, raised to the top of the first line */
  .title-line {
    display: flex;
    align-items: flex-start;
    gap: var(--space-1);
  }

  /* Not checked with AI yet: a lighter row (the near-white of a card on the list's own tint), so it stands apart until
     a check fills it in; hover darkens it like any row */
  .posting-row.is-unchecked:not(:hover) {
    background: var(--card-bg);
  }

  /* its title, "Not checked with AI", in bold: the one row waiting on something */
  .posting-row.is-unchecked .title-link {
    font-weight: var(--weight-semibold);
  }

  /* at most two lines: a title taken from a pasted text can run on */
  .title-link {
    color: var(--text-primary);
    text-decoration: none;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .title-link:hover {
    color: var(--accent-text-hover);
    text-decoration: underline;
  }

  .title-link:focus-visible {
    outline: 2px solid var(--focus-ring);
    outline-offset: 2px;
    border-radius: var(--radius-chip);
  }

  .summary {
    color: var(--text-secondary);
    display: -webkit-box;
    -webkit-line-clamp: 1;
    line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* at most three lines, so a long one doesn't stretch the row */
  .role {
    margin: 0;
    color: var(--text-primary);
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* what it misses (or that the user moved it), after its icon, which sits centred on the first line; the text
     itself keeps to two lines, so a few names fit */
  .summary.is-filtered {
    display: flex;
    align-items: flex-start;
    gap: var(--space-1);
    color: var(--error-strong);
  }

  .summary.is-filtered .icon {
    flex-shrink: 0;
    margin-block: calc((1lh - var(--icon-sm)) / 2);
  }

  .summary.is-filtered .summary-text {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .columns {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
    align-items: start;
    gap: var(--space-1) var(--space-4);
  }

  .identity {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    min-width: 0;
  }

  /* the bar on the column's third line, a fixed width so the rows' bars can be compared down the list */
  .result {
    width: min(100%, 12rem);
    padding-top: var(--space-1);
  }

  @media (width < 48rem) {
    .columns {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  .badges {
    gap: var(--space-1);
    justify-content: flex-end;
  }

  /* On a narrow screen the badge goes under the text, the button stays at the end */
  @media (width < 48rem) {
    .posting-row {
      flex-wrap: wrap;
    }

    .badges {
      order: 3;
      flex-basis: 100%;
      justify-content: flex-start;
    }
  }
</style>
