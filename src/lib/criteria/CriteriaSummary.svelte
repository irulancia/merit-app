<script lang="ts">
  import type { Snippet } from 'svelte';
  import { m } from '#lib/paraglide/messages.js';
  import { ALL_CRITERIA, CATEGORIES, type Criterion } from './catalog.js';
  import type { CriteriaSettings, Level } from './types.js';

  interface Props {
    settings: CriteriaSettings;
    headingId: string;
    /** Opens the step of the category with this index, to change a criterion there. */
    onedit: (categoryIndex: number) => void;
    actions: Snippet;
  }

  let { settings = $bindable(), headingId, onedit, actions }: Props = $props();

  let dismissedTooltip = $state<string | null>(null);

  function chosen(level: Level): Criterion[] {
    return ALL_CRITERIA.filter((criterion) => settings[criterion.id]?.level === level);
  }

  const mustHave = $derived(chosen('must'));
  const weighed = $derived(chosen('weigh'));

  function categoryOf(criterion: Criterion): number {
    return CATEGORIES.findIndex((category) => category.criteria.includes(criterion));
  }

  /** Removing sets it to Off: its value stays, so putting it back later keeps what was typed. */
  function remove(criterion: Criterion) {
    settings[criterion.id].level = 'off';
  }
</script>

{#snippet group(title: string, criteria: Criterion[], icon: string)}
  <div class="stack-sm">
    <h3 class="text-overline">{title}</h3>
    <ul class="items">
      {#each criteria as criterion (criterion.id)}
        {@const label = criterion.summary(settings[criterion.id]?.value ?? '')}
        <li>
          <span class="icon icon-sm {icon}" aria-hidden="true"></span>
          <button type="button" class="link link-quiet item-name" onclick={() => onedit(categoryOf(criterion))}>
            {label}
          </button>
          <span
            class="has-tooltip tooltip-end"
            class:is-dismissed={dismissedTooltip === criterion.id}
            role="presentation"
            onkeydown={(event) => event.key === 'Escape' && (dismissedTooltip = criterion.id)}
            onmouseleave={() => (dismissedTooltip = null)}
            onfocusout={() => (dismissedTooltip = null)}
          >
            <button
              type="button"
              class="btn btn-ghost btn-icon btn-sm is-danger"
              aria-label={m.summary_remove({ criterion: label })}
              onclick={() => remove(criterion)}
            >
              <span class="icon icon-x-circle" aria-hidden="true"></span>
            </button>
            <span class="tooltip" aria-hidden="true">{m.summary_remove_tooltip()}</span>
          </span>
        </li>
      {/each}
    </ul>
  </div>
{/snippet}

<section class="card" aria-labelledby={headingId}>
  <h2 id={headingId} tabindex="-1">{m.summary_title()}</h2>
  {#if mustHave.length === 0 && weighed.length === 0}
    <div class="empty">
      <span class="empty-icon"><span class="icon icon-lg icon-funnel" aria-hidden="true"></span></span>
      <strong>{m.summary_empty_title()}</strong>
      <p class="text-small">{m.summary_empty_text()}</p>
      <button type="button" class="btn btn-secondary" onclick={() => onedit(0)}>{m.summary_empty_action()}</button>
    </div>
  {:else}
    <p class="text-small text-muted">{m.summary_hint()}</p>
    {#if mustHave.length > 0}
      {@render group(m.summary_must({ count: mustHave.length }), mustHave, 'icon-funnel')}
    {/if}
    {#if weighed.length > 0}
      {@render group(m.summary_weigh({ count: weighed.length }), weighed, 'icon-check-circle')}
    {/if}
  {/if}
  <p class="note text-small">{m.summary_filtered_note()}</p>
  {@render actions()}
</section>

<style>
  h2:focus {
    outline: none;
  }

  .items {
    display: flex;
    flex-direction: column;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .items li {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding-block: var(--space-1);
    border-top: 1px solid var(--border-subtle);
  }

  .items .icon-sm {
    flex-shrink: 0;
    color: var(--text-label);
  }

  .item-name {
    flex: 1;
    min-width: 0;
    text-align: start;
    color: var(--text-primary);
  }

  .note {
    padding: var(--space-2) var(--space-3);
    border-radius: max(0px, calc(var(--radius-surface) - var(--space-4)));
    background: var(--bg-surface);
    color: var(--text-secondary);
  }
</style>
