<script lang="ts">
  import { m } from '#lib/paraglide/messages.js';
  import { VERDICT_LOOK, VERDICT_ORDER, type Verdict } from './verdict-look.js';

  interface Props {
    counts: Record<Verdict, number>;
    /** Only the bar (a list row): the words go to a tooltip and to screen readers instead of a line under it. */
    compact?: boolean;
  }

  let { counts, compact = false }: Props = $props();

  const parts = $derived(VERDICT_ORDER.filter((verdict) => counts[verdict] > 0));
  const spoken = $derived(parts.map((verdict) => `${counts[verdict]} ${VERDICT_LOOK[verdict].label()}`).join(', '));
</script>

<!-- The whole result in one bar, a share of it per verdict; the line under it says the same in words and icons,
     so the colour never carries it alone -->
{#snippet bar()}
  <div class="bar" role="img" aria-label={m.fit_summary_label() + ': ' + spoken}>
    {#each parts as verdict (verdict)}
      <span class="part is-{verdict}" style:flex-grow={counts[verdict]}></span>
    {/each}
  </div>
{/snippet}

{#if compact}
  <span class="has-tooltip compact">
    {@render bar()}
    <span class="tooltip" aria-hidden="true">{spoken}</span>
  </span>
{:else}
<div class="fit-bar">
  {@render bar()}
  <ul class="legend text-small" aria-hidden="true">
    {#each parts as verdict (verdict)}
      <li class="is-{verdict}">
        <span class="icon icon-sm {VERDICT_LOOK[verdict].icon}"></span>
        {counts[verdict]} {VERDICT_LOOK[verdict].label()}
      </li>
    {/each}
  </ul>
</div>
{/if}

<style>
  .fit-bar {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  /* In a list row: a short bar, as wide as a line of meta text needs, not the row's whole width */
  .compact {
    display: block;
    width: min(100%, 16rem);
  }

  .bar {
    display: flex;
    height: var(--space-2);
    border-radius: var(--radius-pill);
    overflow: hidden;
  }

  .part {
    flex-basis: 0;
  }

  /* a thin line of the card's own colour between two parts, so neighbours read as separate */
  .part + .part {
    border-left: 2px solid var(--card-bg);
  }

  .part.is-pass {
    background: var(--success);
  }

  /* Not mentioned is not knowing, not a warning: a pale tint of the secondary, apart from the primary and the states;
     its full shade read muddy beside the green and red */
  .part.is-unmentioned {
    background: color-mix(in srgb, var(--secondary-ui) 40%, var(--card-bg));
  }

  .part.is-unmarked {
    background: var(--border-control);
  }

  .part.is-miss {
    background: var(--error);
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1) var(--space-3);
    list-style: none;
    margin: 0;
    padding: 0;
    color: var(--text-secondary);
  }

  .legend li {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
  }

  .legend .is-pass .icon {
    color: var(--success-strong);
  }

  .legend .is-unmentioned .icon {
    color: var(--secondary-text);
  }

  .legend .is-unmarked .icon {
    color: var(--text-label);
  }

  .legend .is-miss .icon {
    color: var(--error-strong);
  }
</style>
