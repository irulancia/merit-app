<script lang="ts">
  import { ALL_CRITERIA } from '#lib/criteria/catalog.js';
  import CriterionRow from '#lib/criteria/CriterionRow.svelte';
  import type { CriteriaSettings } from '#lib/criteria/types.js';
  import { m } from '#lib/paraglide/messages.js';

  /** Three with nothing to fill in, so the slide never scrolls; the rest wait in Criteria. */
  const SETUP_CRITERIA = ['no_outsourcing', 'no_extras', 'end_to_end'];

  interface Props {
    /** Every criterion's setting: these few are changed here, the others kept as they are. */
    settings: CriteriaSettings;
  }

  let { settings = $bindable() }: Props = $props();

  const criteria = SETUP_CRITERIA.map((id) => ALL_CRITERIA.find((criterion) => criterion.id === id)).filter((criterion) => criterion !== undefined);
</script>

<div class="rows">
  {#each criteria as criterion (criterion.id)}
    <CriterionRow {criterion} bind:setting={settings[criterion.id]} compact />
  {/each}
</div>
<p class="text-small text-muted">{m.setup_criteria_more()}</p>

<style>
  p {
    margin: 0;
  }

  .rows {
    display: flex;
    flex-direction: column;
  }
</style>
