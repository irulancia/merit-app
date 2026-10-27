<script lang="ts">
  import type { Snippet } from 'svelte';
  import { m } from '#lib/paraglide/messages.js';
  import type { Category, Criterion } from './catalog.js';
  import CriterionRow from './CriterionRow.svelte';
  import type { CriteriaSettings } from './types.js';

  interface Props {
    category: Category;
    settings: CriteriaSettings;
    headingId: string;
    /** The criteria to show — a search shows only the ones that match; all of them otherwise. */
    visible?: Criterion[];
    actions?: Snippet;
  }

  let { category, settings = $bindable(), headingId, visible, actions }: Props = $props();

  const inUse = $derived(category.criteria.filter((criterion) => settings[criterion.id]?.level !== 'off').length);
</script>

<section class="card" aria-labelledby={headingId}>
  <div class="card-header">
    <h2 id={headingId} tabindex="-1">{category.title()}</h2>
    <span class="card-meta">{m.category_count({ total: category.criteria.length, inUse })}</span>
  </div>
  <div>
    {#each visible ?? category.criteria as criterion (criterion.id)}
      <CriterionRow {criterion} bind:setting={settings[criterion.id]} />
    {/each}
  </div>
  {@render actions?.()}
</section>

<style>
  h2 {
    margin: 0;
  }

  h2:focus {
    outline: none;
  }
</style>
