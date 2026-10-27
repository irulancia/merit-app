<script lang="ts">
  import { m } from '#lib/paraglide/messages.js';
  import type { Criterion } from './catalog.js';
  import ChoicesInput from './ChoicesInput.svelte';
  import SalaryInput from './SalaryInput.svelte';
  import { LEVELS, type CriterionSetting, type Level } from './types.js';

  interface Props {
    criterion: Criterion;
    setting: CriterionSetting;
    /** For the setup, where several must fit one screen: the title and its level only; the value to fill in shows
        once the criterion is in use. */
    compact?: boolean;
  }

  let { criterion, setting = $bindable(), compact = false }: Props = $props();

  const LEVEL_LABELS: Record<Level, () => string> = {
    off: () => m.level_off(),
    weigh: () => m.level_weigh(),
    must: () => m.level_must()
  };

  // A phone's row is too narrow for "Non-negotiable" in one of three equal options
  const LEVEL_SHORT_LABELS: Record<Level, () => string> = {
    off: () => m.level_off(),
    weigh: () => m.level_weigh(),
    must: () => m.level_must_short()
  };

  const inputId = $derived(`value-${criterion.id}`);
</script>

<div class="criterion" class:is-compact={compact}>
  <div class="text">
    <span class="title">{criterion.title()}</span>
    {#if !compact}
      <span class="text-small text-muted">{criterion.description()}</span>
    {/if}
  </div>

  {#if compact && setting.level === 'off'}
    <!-- Not in use yet: nothing to fill in -->
  {:else if criterion.value?.kind === 'salary'}
    <div class="value-wide">
      <SalaryInput bind:value={setting.value} idPrefix={inputId} />
    </div>
  {:else if criterion.value?.kind === 'choices'}
    <div class="value-wide">
      <ChoicesInput bind:value={setting.value} options={criterion.value.options ?? []} legend={criterion.value.label()} />
    </div>
  {:else if criterion.value}
    <div class="field value" class:field-select={criterion.value.kind === 'select'}>
      {#if criterion.value.kind === 'select'}
        <select id={inputId} bind:value={setting.value}>
          <option value="">{m.value_none()}</option>
          {#each criterion.value.options ?? [] as option (option.id)}
            <option value={option.id}>{option.label()}</option>
          {/each}
        </select>
      {:else}
        <input
          id={inputId}
          type="text"
          inputmode={criterion.value.kind === 'number' ? 'decimal' : 'text'}
          placeholder=" "
          bind:value={setting.value}
        />
      {/if}
      <label for={inputId}>{criterion.value.label()}</label>
    </div>
  {/if}

  <div class="segmented" class:is-block={compact} role="group" aria-label={m.level_group_label({ criterion: criterion.title() })}>
    {#each LEVELS as level (level)}
      <button type="button" aria-pressed={setting.level === level} onclick={() => (setting.level = level)}>
        <span class="label-full">{LEVEL_LABELS[level]()}</span>
        <span class="label-short">{LEVEL_SHORT_LABELS[level]()}</span>
      </button>
    {/each}
  </div>

  <!-- Nothing under the level: what it does is in the page's lead, and how often a posting says it ("usually / rarely
       in the posting") only frustrated; Merit still uses it, for the AI and the lookups -->
</div>

<style>
  .criterion {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2) var(--space-3);
    padding-block: var(--space-3);
    border-top: 1px solid var(--border-subtle);
    /* The level control adapts to the row's own width, not the screen's: the row is narrow beside the steps too */
    container-type: inline-size;
  }

  .text {
    flex: 1 1 18rem;
    min-width: 0;
    display: flex;
    flex-direction: column;
    /* No gap: each line's own height already spaces them, and a gap on top read as three loose lines */
    gap: var(--space-0);
  }

  .title {
    font-weight: var(--weight-semibold);
    line-height: var(--leading-tight);
  }

  .value {
    flex: 0 1 14rem;
    min-width: 10rem;
  }

  /* A value with several parts (a salary, a list of ticks) takes a line of its own, under the text */
  .value-wide {
    flex: 1 1 100%;
    order: 1;
  }

  .segmented {
    flex: 0 0 auto;
  }

  .label-short {
    display: none;
  }

  /* A row too narrow for the three levels at full size: they share its width, smaller and tighter */
  @container (max-width: 34rem) {
    .segmented {
      display: grid;
      flex: 1 1 100%;
      grid-auto-columns: minmax(0, 1fr);
    }

    .segmented > button {
      padding-inline: var(--space-1);
      font-size: var(--text-small);
    }
  }

  /* Compact (the setup): the title and its level only, the level small, so several criteria fit one screen; a value to
     fill in still takes a line of its own under them */
  /* A little more room between criteria than between a title and its levels, so each reads as one group, and no more:
     a setup slide must fit without a scroll. The title quieter, medium not semibold */
  .is-compact {
    flex-wrap: wrap;
    gap: var(--space-1);
    padding-block: var(--space-2);
  }

  .is-compact .title {
    font-weight: var(--weight-medium);
  }

  /* The title on its own line, the level under it: three words per option need the row's width */
  .is-compact .text {
    flex: 1 1 100%;
  }

  .is-compact .segmented {
    flex: 1 1 100%;
  }

  .is-compact .segmented > button {
    padding-inline: var(--space-2);
    font-size: var(--text-small);
  }

  .is-compact .label-full {
    display: none;
  }

  .is-compact .label-short {
    display: inline;
  }

  /* Narrower still (a phone): "Non-negotiable" doesn't fit a third of the row, so the short label shows */
  @container (max-width: 26rem) {
    .label-full {
      display: none;
    }

    .label-short {
      display: inline;
    }
  }
</style>
