<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import ActiveRow from '#lib/applications/ActiveRow.svelte';
  import CloseDialog from '#lib/applications/CloseDialog.svelte';
  import ClosedRow from '#lib/applications/ClosedRow.svelte';
  import { hasApplied, type Application } from '#lib/applications/types.js';
  import { m } from '#lib/paraglide/messages.js';
  import AddPostingDrawer from '#lib/postings/AddPostingDrawer.svelte';
  import CheckAll from '#lib/postings/CheckAll.svelte';
  import DeletePostingDialog from '#lib/postings/DeletePostingDialog.svelte';
  import { isNew, matchesSearch, needsCheck, sortEntries, toEntries, VIEWS, type ListEntry, type Sort, type View } from '#lib/postings/list.js';
  import PostingRow from '#lib/postings/PostingRow.svelte';
  import type { PostingSummary } from '#lib/postings/types.js';
  import { VIEW_NAMES } from '#lib/postings/view-text.js';
  import { ADD_PARAM } from '#lib/postings/add-link.js';
  import type { PageProps } from './$types';

  let { data, form }: PageProps = $props();

  let addDrawer = $state<AddPostingDrawer>();
  let closeDialog = $state<CloseDialog>();
  let deleteDialog = $state<DeletePostingDialog>();
  let query = $state('');

  const entries = $derived(toEntries(data.postings, data.settings));
  const counts = $derived(Object.fromEntries(VIEWS.map((view) => [view, entries.filter((entry) => entry.view === view).length])) as Record<View, number>);
  // With no tab in the address: Considering, where everything new lands
  const view = $derived<View>(data.view ?? 'considering');
  // Not opened yet, by tab: where a check moved something new, at a glance
  const newCounts = $derived(Object.fromEntries(VIEWS.map((view) => [view, entries.filter((entry) => entry.view === view && isNew(entry.posting)).length])) as Record<View, number>);
  // A search looks through every tab, so nothing is missed because it moved on
  const searching = $derived(query.trim() !== '');
  const shown = $derived(
    searching
      ? sortEntries(entries.filter((entry) => matchesSearch(entry, query)), data.sort)
      : view === 'applying' || view === 'closed'
        ? applicationOrder(entries.filter((entry) => entry.view === view))
        : sortEntries(entries.filter((entry) => entry.view === view), data.sort)
  );
  const failed = $derived(form && ('moveFailed' in form || 'notesFailed' in form || 'requestFailed' in form || 'deleteFailed' in form));
  const canCheck = $derived(data.engine !== 'none' && !!data.criteriaInUse);
  // Whatever a check would still add, found by Merit (never checked, a criterion left unmarked, out of date)
  const uncheckedIds = $derived(entries.filter(needsCheck).map((entry) => entry.posting.id));

  const EMPTY_VIEW: Record<View, { icon: string; title: () => string; text: () => string }> = {
    considering: { icon: 'icon-funnel', title: () => m.postings_empty_considering_title(), text: () => m.postings_empty_considering_text() },
    notSure: { icon: 'icon-archive', title: () => m.postings_empty_not_sure_title(), text: () => m.postings_empty_not_sure_text() },
    applying: { icon: 'icon-briefcase', title: () => m.postings_empty_applying_title(), text: () => m.postings_empty_applying_text() },
    closed: { icon: 'icon-briefcase', title: () => m.postings_empty_closed_title(), text: () => m.postings_empty_closed_text() }
  };

  // Sent here to add postings (?add, from the dashboard or the welcome steps): the add drawer opens at once, and the
  // address drops the flag, so going back or refreshing doesn't open it again
  $effect(() => {
    if (!addDrawer || !page.url.searchParams.has(ADD_PARAM)) return;
    addDrawer.open();
    const params = new URLSearchParams(page.url.searchParams.toString());
    params.delete(ADD_PARAM);
    const rest = params.toString();
    void goto(`${resolve('/postings')}${rest ? `?${rest}` : ''}`, { replace: true, shallow: true });
  });

  type WithApplication = PostingSummary & { application: Application };

  function withApplication(posting: PostingSummary): posting is WithApplication {
    return posting.application !== null;
  }

  /** Applying: not applied yet first, then applied, newest move first in each. Closed: most recently closed first. */
  function applicationOrder(list: ListEntry[]): ListEntry[] {
    const applied = (entry: ListEntry) => Number(!!entry.posting.application && hasApplied(entry.posting.application));
    const movedAt = (entry: ListEntry) => entry.posting.application?.stageAt ?? '';
    return [...list].sort((a, b) => applied(a) - applied(b) || movedAt(b).localeCompare(movedAt(a)));
  }

  function hrefFor(next: { view?: View; sort?: Sort }): string {
    const params = new URLSearchParams(page.url.searchParams.toString());
    if (next.view) params.set('view', next.view);
    if (next.sort) params.set('sort', next.sort);
    return `${resolve('/postings')}?${params}`;
  }
</script>

<svelte:head>
  <title>{m.postings_page_title()} · Merit</title>
</svelte:head>

<div class="stack-lg">
  <header class="page-header">
    <div class="page-header-text">
      <h1>{m.postings_title()}</h1>
    </div>
    <div class="page-header-actions">
      {#if canCheck}
        <CheckAll ids={uncheckedIds} />
      {/if}
      <!-- With no posting yet, the empty state below holds the one way to add: not two buttons for it -->
      {#if data.postings.length > 0}
        <button type="button" class="btn btn-primary" onclick={() => addDrawer?.open()}>
          <span class="icon icon-plus-circle" aria-hidden="true"></span>
          {m.postings_add()}
        </button>
      {/if}
    </div>
  </header>

  <!-- What stops a check, said once there is something to check: a page with no posting has only its empty state -->
  {#if data.postings.length === 0}
    <!-- Nothing to check yet -->
  {:else if data.criteriaInUse === 0}
    <div class="alert" role="status">
      <span class="icon icon-info" aria-hidden="true"></span>
      <div class="alert-body">
        <span class="alert-title">{m.postings_no_criteria_title()}</span>
        <span>{m.postings_no_criteria_text()} <a class="link" href={resolve('/settings/criteria')}>{m.postings_no_criteria_link()}</a></span>
      </div>
    </div>
  {:else if data.engine === 'none'}
    <div class="alert" role="status">
      <span class="icon icon-info" aria-hidden="true"></span>
      <div class="alert-body">
        <span class="alert-title">{m.postings_no_engine_title()}</span>
        <span>{m.postings_no_engine_text()} <a class="link" href={resolve('/settings/ai')}>{m.postings_no_engine_link()}</a></span>
      </div>
    </div>
  {/if}

  {#if form && 'archiveFailed' in form}
    <div class="alert alert-error" role="alert">
      <span class="icon icon-x-circle" aria-hidden="true"></span>
      <div class="alert-body"><span>{m.postings_archive_failed()}</span></div>
    </div>
  {/if}

  {#if data.postings.length === 0}
    <div class="empty">
      <span class="empty-icon"><span class="icon icon-lg icon-newspaper" aria-hidden="true"></span></span>
      <strong>{m.postings_empty_title()}</strong>
      <p class="text-small">{m.postings_empty_text()}</p>
      <button type="button" class="btn btn-primary" onclick={() => addDrawer?.open()}>{m.postings_add()}</button>
    </div>
  {:else}
    <section class="stack" aria-labelledby="postings-list">
      <h2 class="sr-only" id="postings-list">{m.postings_list_title({ count: data.postings.length })}</h2>
      <!-- The tabs are links: each view has its own address -->
      <nav class="tabs" aria-label={m.postings_tabs_label()}>
        {#each VIEWS as tab (tab)}
          <a class="tab" class:is-active={view === tab} href={hrefFor({ view: tab })} aria-current={view === tab ? 'page' : undefined}>
            <!-- Something in it not opened yet: a small red dot at the top right of the tab's name -->
            <span class="tab-name"
              >{VIEW_NAMES[tab]()}{#if newCounts[tab] > 0}<span class="new-dot" aria-hidden="true"></span>{/if}</span
            >{' '}{m.postings_tab_count({ count: counts[tab] })}
            {#if newCounts[tab] > 0}<span class="sr-only">{m.postings_tab_new({ count: newCounts[tab] })}</span>{/if}
          </a>
        {/each}
      </nav>

      <div class="toolbar">
        <div class="field search">
          <input id="postings-search" type="search" placeholder=" " bind:value={query} />
          <label for="postings-search">{m.postings_search()}</label>
        </div>
        {#if searching || (view !== 'applying' && view !== 'closed')}
          <div class="field field-select sort">
            <select id="postings-sort" value={data.sort} onchange={(event) => goto(hrefFor({ sort: event.currentTarget.value as Sort }), { reset: false })}>
              <option value="newest">{m.postings_sort_newest()}</option>
              <option value="fit">{m.postings_sort_fit()}</option>
            </select>
            <label for="postings-sort">{m.postings_sort()}</label>
          </div>
        {/if}
      </div>

      {#if failed}
        <div class="alert alert-error" role="alert">
          <span class="icon icon-x-circle" aria-hidden="true"></span>
          <div class="alert-body"><span>{m.applications_move_failed()}</span></div>
        </div>
      {/if}

      {#if searching}
        <p class="text-small text-muted">{m.postings_search_all()}</p>
      {:else if view === 'notSure' && shown.length > 0}
        <p class="text-small text-muted">{m.postings_not_sure_hint()}</p>
      {/if}

      {#if shown.length > 0}
        <ul class="list">
          {#each shown as entry (entry.posting.id)}
            {#if searching || !withApplication(entry.posting)}
              <PostingRow {entry} {searching} ondelete={(id, title) => deleteDialog?.open({ id, title })} />
            {:else if view === 'closed'}
              <ClosedRow entry={entry as ListEntry & { posting: WithApplication }} ondelete={(id, title) => deleteDialog?.open({ id, title })} />
            {:else}
              <ActiveRow entry={entry as ListEntry & { posting: WithApplication }} onclose={(id, title, place) => closeDialog?.open(id, title, place)} ondelete={(id, title) => deleteDialog?.open({ id, title })} />
            {/if}
          {/each}
        </ul>
      {:else if query.trim()}
        <div class="empty">
          <span class="empty-icon"><span class="icon icon-lg icon-magnifying-glass" aria-hidden="true"></span></span>
          <strong>{m.postings_search_empty_title()}</strong>
          <p class="text-small">{m.postings_search_empty_text({ query: query.trim() })}</p>
          <button type="button" class="btn btn-secondary" onclick={() => (query = '')}>{m.criteria_search_clear()}</button>
        </div>
      {:else}
        <div class="empty">
          <span class="empty-icon"><span class="icon icon-lg {EMPTY_VIEW[view].icon}" aria-hidden="true"></span></span>
          <strong>{EMPTY_VIEW[view].title()}</strong>
          <p class="text-small">{EMPTY_VIEW[view].text()}</p>
        </div>
      {/if}
    </section>
  {/if}
</div>

<AddPostingDrawer bind:this={addDrawer} {canCheck} />
<CloseDialog bind:this={closeDialog} />
<DeletePostingDialog bind:this={deleteDialog} />

<style>
  /* a small red dot at the top right of the tab's name, as an app marks what's new (no number); it takes no room,
     so the count after the name doesn't move */
  .tab-name {
    position: relative;
  }

  .tab .new-dot {
    position: absolute;
    top: 0;
    left: 100%;
    width: var(--space-1);
    height: var(--space-1);
    border-radius: var(--radius-pill);
    background: var(--error);
  }

  h1,
  .empty p {
    margin: 0;
  }

  a.tab {
    display: inline-flex;
    align-items: center;
    text-decoration: none;
  }

  .toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .search {
    flex: 1 1 18rem;
  }

  .sort {
    flex: 0 1 14rem;
  }
</style>
