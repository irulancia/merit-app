<script lang="ts">
  import { tick } from 'svelte';
  import { deserialize } from '$app/forms';
  import { beforeNavigate, invalidateAll } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { m } from '#lib/paraglide/messages.js';
  import { CATEGORIES, type Criterion } from '#lib/criteria/catalog.js';
  import CategoryCard from '#lib/criteria/CategoryCard.svelte';
  import CriteriaSteps, { type Step } from '#lib/criteria/CriteriaSteps.svelte';
  import CriteriaSummary from '#lib/criteria/CriteriaSummary.svelte';
  import SaveStatus, { type SaveState } from '#lib/criteria/SaveStatus.svelte';
  import SunriseSprout from '#lib/components/SunriseSprout.svelte';
  import type { PageProps } from './$types';

  const REVIEW_STEP = CATEGORIES.length;
  /** A pause in typing this long saves; a click saves after it too, so several quick clicks make one save. */
  const AUTOSAVE_DELAY_MS = 600;

  let { data }: PageProps = $props();

  // Edited here from the loaded copy; every change saves by itself after a short pause
  const loaded = () => data.settings;
  let settings = $state(structuredClone(loaded()));
  let savedSnapshot = $state(JSON.stringify(loaded()));
  /** The copy that last failed to save: not retried by itself, only by a new change or Try again. */
  let failedSnapshot = $state<string | null>(null);
  let currentStep = $state(0);
  let query = $state('');
  let saving = $state(false);
  let saveError = $state<'invalid' | 'write' | 'offline' | null>(null);

  const serialized = $derived(JSON.stringify(settings));
  const dirty = $derived(serialized !== savedSnapshot);
  const saveState: SaveState = $derived(saveError && !saving ? 'failed' : dirty || saving ? 'saving' : 'saved');
  const steps: Step[] = $derived([
    ...CATEGORIES.map((category) => ({
      id: category.id,
      title: category.title(),
      text: m.category_count({
        total: category.criteria.length,
        inUse: category.criteria.filter((criterion) => settings[criterion.id]?.level !== 'off').length
      })
    })),
    { id: 'review', title: m.step_review_title(), text: m.step_review_text() }
  ]);
  const currentCategory = $derived(CATEGORIES[currentStep]);
  const inUse = $derived(Object.values(settings).filter((setting) => setting.level !== 'off').length);
  // A search looks through every group, not only the open step; clearing it goes back to the step
  const needle = $derived(query.trim().toLocaleLowerCase());
  const searchResults = $derived(
    CATEGORIES.map((category) => ({ category, visible: category.criteria.filter(matches) })).filter(
      (entry) => entry.visible.length > 0
    )
  );

  function matches(criterion: Criterion): boolean {
    return `${criterion.title()} ${criterion.description()}`.toLocaleLowerCase().includes(needle);
  }

  function headingId(step: number): string {
    return `step-heading-${steps[step]?.id ?? 'review'}`;
  }

  /** Moves to a step and puts keyboard and screen-reader focus on its heading. */
  async function goTo(step: number) {
    currentStep = step;
    await tick();
    document.getElementById(headingId(step))?.focus();
  }

  $effect(() => {
    if (!dirty || saving || serialized === failedSnapshot) return;
    const timer = setTimeout(save, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
  });

  // Leaving within the app saves what is still waiting; closing the tab asks first
  beforeNavigate(({ willUnload, cancel }) => {
    if (!dirty) return;
    if (willUnload) cancel();
    else if (!saving) void save();
  });

  /** Sends the criteria as they are now through the page's "save" action. */
  async function save() {
    const submitted = serialized;
    const body = new FormData();
    body.set('settings', submitted);
    saving = true;
    try {
      const response = await fetch(`${resolve('/settings/criteria')}?/save`, {
        method: 'POST',
        body,
        headers: { 'x-sveltekit-action': 'true' }
      });
      const result = deserialize(await response.text());
      if (result.type !== 'success') {
        fail(result.type === 'failure' && result.data?.error === 'invalid' ? 'invalid' : 'write', submitted);
        return;
      }
      savedSnapshot = submitted;
      saveError = null;
      failedSnapshot = null;
      // Reloads the layout's data, so the sidebar's count follows what was saved
      await invalidateAll();
    } catch {
      // No answer at all: Merit itself isn't running, not a folder it can't write to
      fail('offline', submitted);
    } finally {
      saving = false;
    }
  }

  function fail(error: 'invalid' | 'write' | 'offline', submitted: string) {
    saveError = error;
    failedSnapshot = submitted;
  }

  const SAVE_ERRORS = {
    invalid: () => m.criteria_error_invalid(),
    write: () => m.criteria_error_write(),
    offline: () => m.criteria_error_offline()
  };

  // The lead with its two key words marked, then split on the marks so they can be set in semibold
  const MUST_HAVE = '';
  const NOT_SURE = '';
  const leadParts = m.criteria_lead({ mustHave: MUST_HAVE, notSure: NOT_SURE }).split(/(|)/).filter(Boolean);
</script>

<svelte:head>
  <title>{m.criteria_page_title()} · Merit</title>
</svelte:head>

{#snippet stepNav()}
  <div class="card-actions">
    {#if currentStep > 0}
      <button type="button" class="btn btn-secondary" onclick={() => goTo(currentStep - 1)}>{m.step_back()}</button>
    {/if}
    <button type="button" class="btn btn-primary" onclick={() => goTo(currentStep + 1)}>
      {currentStep === REVIEW_STEP - 1 ? m.step_to_review() : m.step_next()}
    </button>
  </div>
{/snippet}

{#snippet reviewActions()}
  <div class="card-actions">
    <button type="button" class="btn btn-secondary" onclick={() => goTo(REVIEW_STEP - 1)}>{m.step_back()}</button>
  </div>
{/snippet}

{#snippet saveStatus()}
  <SaveStatus state={saveState} />
{/snippet}

<div class="stack-lg page">
  <div class="illustration">
    <SunriseSprout />
  </div>
  <header class="page-header">
    <div class="page-header-text">
      <h1>{m.criteria_title()}</h1>
      <!-- The two words that decide where a posting goes, in semibold -->
      <p class="text-lead">
        {#each leadParts as part, index (index)}{#if part === MUST_HAVE}<strong>{m.criteria_lead_must_have()}</strong>{:else if part === NOT_SURE}<strong>{m.criteria_lead_not_sure()}</strong>{:else}{part}{/if}{/each}
      </p>
    </div>
  </header>

  {#if data.unreadable}
    <div class="alert alert-warning" role="alert">
      <span class="icon icon-warning" aria-hidden="true"></span>
      <div class="alert-body">
        <span class="alert-title">{m.criteria_unreadable_title()}</span>
        <span>{m.criteria_unreadable_text()}</span>
      </div>
    </div>
  {/if}

  <div class="layout">
    <div class="steps-column">
      <CriteriaSteps {steps} current={currentStep} {inUse} onselect={goTo} status={saveStatus} />
    </div>
    <div class="step-column stack">
      {#if saveState === 'failed'}
        <div class="alert alert-error" role="alert">
          <span class="icon icon-x-circle" aria-hidden="true"></span>
          <div class="alert-body">
            <span class="alert-title">{m.criteria_status_failed()}</span>
            <span>{SAVE_ERRORS[saveError ?? 'write']()}</span>
            <div><button type="button" class="btn btn-secondary btn-sm" onclick={save}>{m.criteria_retry()}</button></div>
          </div>
        </div>
      {/if}
      <div class="field">
        <input id="criteria-search" type="search" placeholder=" " bind:value={query} />
        <label for="criteria-search">{m.criteria_search()}</label>
      </div>
      {#if needle}
        {#each searchResults as entry (entry.category.id)}
          <CategoryCard
            category={entry.category}
            visible={entry.visible}
            headingId="search-{entry.category.id}"
            bind:settings
          />
        {:else}
          <div class="empty">
            <span class="empty-icon"><span class="icon icon-lg icon-magnifying-glass" aria-hidden="true"></span></span>
            <strong>{m.criteria_search_empty_title()}</strong>
            <p class="text-small">{m.criteria_search_empty_text({ query: query.trim() })}</p>
            <button type="button" class="btn btn-secondary" onclick={() => (query = '')}>{m.criteria_search_clear()}</button>
          </div>
        {/each}
      {:else if currentCategory}
        <CategoryCard category={currentCategory} headingId={headingId(currentStep)} bind:settings actions={stepNav} />
      {:else}
        <CriteriaSummary bind:settings headingId={headingId(REVIEW_STEP)} onedit={goTo} actions={reviewActions} />
      {/if}
    </div>
  </div>
</div>

<style>
  .text-lead strong {
    font-weight: var(--weight-semibold);
  }

  /* The steps come first for keyboard and screen readers: above the criteria (only the progress, see
     CriteriaSteps) until there is room for both, then on the right, staying in view while the page scrolls */
  /* The illustration lies on the background in the top corner, behind everything and out of the flow, so it
     takes no room; where the title would run into it (tablet, phone) it goes */
  .page {
    position: relative;
    isolation: isolate;
  }

  .illustration {
    position: absolute;
    top: calc(-1 * var(--space-3));
    right: 0;
    z-index: -1;
    width: var(--space-12);
    pointer-events: none;
  }

  @media (width < 80rem) {
    .illustration {
      display: none;
    }
  }

  .layout {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .step-column {
    min-width: 0;
  }

  @media (width >= 80rem) {
    .layout {
      flex-direction: row-reverse;
      align-items: flex-start;
    }

    .steps-column {
      flex: 0 0 19rem;
      position: sticky;
      top: var(--space-3);
    }

    .step-column {
      flex: 1;
    }
  }
</style>
