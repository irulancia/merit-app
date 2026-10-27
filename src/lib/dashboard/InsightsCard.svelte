<script lang="ts">
  import { SvelteSet } from 'svelte/reactivity';
  import { resolve } from '$app/paths';
  import { m } from '#lib/paraglide/messages.js';
  import { checkFailureText, formatCheckedAt } from '#lib/postings/format.js';
  import { DEMAND_MIN_POSTINGS } from '#lib/profile/skills.js';
  import TrendsCheck from './TrendsCheck.svelte';
  import type { TrendsReading as Reading } from './trends.js';

  interface Props {
    /** How many postings there are to read: every one added, with text. */
    postings: number;
    reading: Reading | null;
    engine: string;
    /** The code from the last reading that failed, if any. */
    error: string | null;
  }

  let { postings, reading, engine, error }: Props = $props();

  let working = $state(false);
  // The insights opened in full; each starts on its first two lines, so the list is quick to run down
  const open = new SvelteSet<number>();
  // The first two, then See all: the card stays short enough for the rest of the dashboard to show
  const FIRST_SHOWN = 2;
  let showAll = $state(false);
  const shown = $derived(reading ? (showAll ? reading.insights : reading.insights.slice(0, FIRST_SHOWN)) : []);

  const failure = $derived(error ? checkFailureText({ checked: false, engineError: error, skipped: error }) : null);
  const enough = $derived(postings >= DEMAND_MIN_POSTINGS);

  function toggle(index: number) {
    if (open.has(index)) open.delete(index);
    else open.add(index);
  }

  /** "Product Designer at Adobe at Adobe": a title naming its company already, then the company again. */
  function postingName(name: string): string {
    return name.replace(/ at (.+) at \1$/i, ' at $1');
  }
</script>

<!-- What the AI engine read in the postings together: a card of its own, under the skills, as the part that helps the
     most. Only when asked: a reading costs the engine's time -->
<section class="card stack" aria-labelledby="insights-title">
  <div class="card-header">
    <h2 id="insights-title">{m.insights_title()}</h2>
    <!-- At the title's end: before the first reading the button, after it when it was read and a link to read again -->
    {#if reading && enough}
      <p class="checked card-meta">
        <span>{m.check_done_with({ when: formatCheckedAt(reading.readAt) })}</span>
        {#if engine !== 'none'}
          <span aria-hidden="true">·</span>
          <TrendsCheck checked bind:working />
        {/if}
      </p>
    {:else if engine !== 'none' && enough}
      <TrendsCheck checked={false} bind:working />
    {/if}
  </div>

  {#if !enough}
    <p class="text-small text-muted">{m.demand_too_few({ min: DEMAND_MIN_POSTINGS, count: postings })}</p>
  {:else}
    {#if reading && reading.insights.length === 0}
      <p class="text-small text-muted">{m.trends_insights_none()}</p>
    {:else if reading}
      <ul class="insights">
        {#each shown as insight, index (index)}
          {@const isOpen = open.has(index)}
          <li class="insight">
            <span class="icon icon-lightbulb insight-icon" aria-hidden="true"></span>
            <div class="stack-sm">
              <p class="insight-title">{insight.title}</p>
              <p class="insight-text" class:is-open={isOpen} id="insight-{index}">{insight.text}</p>
              {#if isOpen && insight.postings.length > 0}
                <p class="text-small text-muted">{insight.postings.map(postingName).join(' · ')}</p>
              {/if}
              <div>
                <button type="button" class="link link-action" aria-expanded={isOpen} aria-controls="insight-{index}" onclick={() => toggle(index)}>
                  {isOpen ? m.insights_read_less() : m.insights_read_more()}
                </button>
              </div>
            </div>
          </li>
        {/each}
      </ul>
      {#if reading.insights.length > FIRST_SHOWN}
        <div>
          <button type="button" class="btn btn-secondary btn-sm" aria-expanded={showAll} onclick={() => (showAll = !showAll)}>
            {showAll ? m.insights_show_fewer() : m.insights_see_all({ count: reading.insights.length })}
          </button>
        </div>
      {/if}
    {/if}

    {#if working}
      <p class="row text-small text-muted"><span class="spinner" aria-hidden="true"></span>{m.trends_reading({ count: postings })}</p>
    {:else if engine === 'none'}
      <p class="text-small text-muted">
        {m.trends_no_engine()}
        <a class="link" href={resolve('/settings/ai')}>{m.check_no_engine_link()}</a>
      </p>
    {:else if reading}
      <p class="card-meta">
        {m.trends_read_on({ count: reading.postings })}
        {#if reading.outdated}{m.trends_outdated()}{/if}
      </p>
    {:else}
      <p class="text-small text-muted">{m.trends_ai_intro({ count: postings })}</p>
    {/if}

    {#if failure && !working}
      <div class="alert alert-error" role="alert">
        <span class="icon icon-x-circle" aria-hidden="true"></span>
        <div class="alert-body"><span>{m.trends_failed({ reason: failure })}</span></div>
      </div>
    {/if}
  {/if}
</section>

<style>
  h2,
  p {
    margin: 0;
  }

  /* The title and the button stay on top: the header aligns them at the top, not the middle of the two lines */
  .card-header {
    align-items: flex-start;
  }

  .checked {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
    padding-top: var(--space-2);
  }

  /* One under another at a comfortable line length, a line between them; each title read first */
  .insights {
    display: grid;
    max-width: 75ch;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  /* The AI's lightbulb in front of each, level with its title, so the list runs down at a glance */
  .insight {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: var(--space-3);
    padding-block: var(--space-3);
    border-top: 1px solid var(--border-subtle);
  }

  .insight:first-child {
    padding-top: 0;
    border-top: 0;
  }

  .insight-icon {
    color: var(--accent-text);
  }

  .insight-title {
    font-weight: var(--weight-semibold);
  }

  /* Two lines until opened: enough to tell what it is about */
  .insight-text:not(.is-open) {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
