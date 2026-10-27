<script lang="ts">
  import type { Snippet } from 'svelte';
  import { m } from '#lib/paraglide/messages.js';

  export interface Step {
    id: string;
    title: string;
    text: string;
  }

  interface Props {
    steps: Step[];
    current: number;
    /** Criteria not set to Off, as edited on the page (saved or not). */
    inUse: number;
    onselect: (index: number) => void;
    /** Whether the criteria are saved: shown at the top in every layout, so it stays in view. */
    status?: Snippet;
  }

  let { steps, current, inUse, onselect, status }: Props = $props();

  const reviewStep = $derived(steps.length - 1);
  const percent = $derived(Math.round(((current + 1) / steps.length) * 100));
  const inUseText = $derived(
    inUse === 0 ? m.steps_in_use_none() : inUse === 1 ? m.steps_in_use_one() : m.steps_in_use_many({ count: inUse })
  );
</script>

<nav class="card" aria-label={m.criteria_steps_label()}>
  {@render status?.()}
  <!-- Beside the criteria: what you have so far, and the way to review it -->
  <div class="summary">
    <p class="summary-count">{inUseText}</p>
    {#if inUse > 0 && current !== reviewStep}
      <button type="button" class="link link-action" onclick={() => onselect(reviewStep)}>{m.steps_review()}</button>
    {/if}
  </div>

  <!-- Above the criteria (tablet, phone): the list is hidden, so the progress says where you are -->
  <div class="progress-block stack-sm">
    <p class="text-small text-muted">
      {m.steps_count({ current: current + 1, total: steps.length })} · {steps[current]?.title}
    </p>
    <div class="progress" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={m.steps_count({ current: current + 1, total: steps.length })}>
      <span style:--value="{percent}%"></span>
    </div>
  </div>

  <ol class="steps">
    {#each steps as step, index (step.id)}
      <li class:is-current={index === current} class:is-done={index < current}>
        {#if index === current}
          <span class="steps-title" aria-current="step">{step.title}</span>
        {:else}
          <button type="button" class="steps-title link link-action" onclick={() => onselect(index)}>
            {step.title}
          </button>
        {/if}
        <span class="steps-text text-small">{step.text}</span>
      </li>
    {/each}
  </ol>
</nav>

<style>
  p {
    margin: 0;
  }

  .summary {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-1) var(--space-3);
    padding-bottom: var(--space-3);
    border-bottom: 1px solid var(--border-subtle);
  }

  .summary-count {
    font-weight: var(--weight-semibold);
  }

  .progress-block {
    display: none;
  }

  /* Rows with room around them, so the current one can carry a tint; the joining line follows the padding */
  .steps {
    gap: var(--space-1);
  }

  .steps > li {
    padding: var(--space-2);
    border-radius: max(0px, calc(var(--radius-surface) - var(--space-4)));
    transition: background 0.2s ease;
  }

  .steps > li:not(:last-child)::after {
    left: calc(var(--space-2) + var(--row-height) / 2 - 1px);
    top: calc(var(--space-2) + var(--row-height));
    bottom: calc(-1 * (var(--space-1) + var(--space-2)));
  }

  .steps > li.is-current {
    background: var(--accent-bg-subtle);
  }

  .steps > li.is-current::before {
    box-shadow: 0 0 0 var(--space-1) var(--accent-bg);
  }

  /* Steps already passed: the number and the line after it in the accent, so the path reads as progress */
  .steps > li.is-done::before {
    background: var(--card-bg);
    color: var(--accent-text);
    border: 2px solid var(--accent-ui);
    box-sizing: border-box;
  }

  .steps > li.is-done::after {
    background: var(--accent-ui);
  }

  .steps > li:not(.is-current):hover {
    background: var(--bg-hover);
  }

  button.steps-title {
    justify-self: start;
    text-align: start;
    color: var(--text-primary);
  }

  button.steps-title:hover {
    color: var(--accent-text-hover);
  }

  /* the same width at which the page puts the steps beside the criteria (criteria/+page.svelte) */
  @media (width < 80rem) {
    .summary,
    .steps {
      display: none;
    }

    .progress-block {
      display: flex;
    }
  }
</style>
