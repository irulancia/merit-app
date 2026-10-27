<script lang="ts">
  import type { ValueOption } from './catalog.js';
  import { formatChoices } from './values.js';

  interface Props {
    /** The criterion's value: the ticked options' ids, "gambling,crypto". */
    value: string;
    options: ValueOption[];
    legend: string;
  }

  let { value = $bindable(), options, legend }: Props = $props();

  const ids = $derived(options.map((option) => option.id));
  const chosen = $derived(value.split(',').filter((id) => ids.includes(id)));

  function toggle(id: string, on: boolean) {
    value = formatChoices(ids, on ? [...chosen, id] : chosen.filter((other) => other !== id));
  }
</script>

<!-- A value made of several ticks (industries to avoid, the company sizes that suit) -->
<fieldset class="fieldset">
  <!-- For screen readers only: on the page it repeated the criterion's title just above -->
  <legend class="sr-only">{legend}</legend>
  <div class="choice-group choices">
    {#each options as option (option.id)}
      <label class="check">
        <input type="checkbox" checked={chosen.includes(option.id)} onchange={(event) => toggle(option.id, event.currentTarget.checked)} />
        {option.label()}
      </label>
    {/each}
  </div>
</fieldset>

<style>
  .choices {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr));
    column-gap: var(--space-3);
  }
</style>
