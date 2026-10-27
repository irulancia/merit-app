<script lang="ts">
  import { untrack } from 'svelte';
  import { m } from '#lib/paraglide/messages.js';
  import {
    CURRENCIES,
    PAY_BASES,
    PAY_BASIS_LABELS,
    PERIODS,
    PERIOD_LABELS,
    formatSalaryWanted,
    parseSalaryWanted,
    type Currency,
    type PayBasis,
    type Period
  } from './values.js';

  interface Props {
    /** The criterion's value, "4000|EUR|month|net"; empty until an amount is typed. */
    value: string;
    idPrefix: string;
  }

  let { value = $bindable(), idPrefix }: Props = $props();

  // Each part is edited on its own; the value is written whole, and only with an amount
  const initial = untrack(() => parseSalaryWanted(value));
  let amount = $state(initial ? String(initial.amount) : '');
  let currency = $state<Currency>(initial?.currency ?? 'EUR');
  let period = $state<Period>(initial?.period ?? 'month');
  let basis = $state<PayBasis>(initial?.basis ?? 'net');

  function write() {
    const parsed = Number(amount.replace(/[\s,]/g, ''));
    value = Number.isFinite(parsed) && parsed > 0 ? formatSalaryWanted({ amount: parsed, currency, period, basis }) : '';
  }
</script>

<div class="salary">
  <div class="field">
    <input id="{idPrefix}-amount" type="text" inputmode="decimal" placeholder=" " bind:value={amount} oninput={write} />
    <label for="{idPrefix}-amount">{m.crit_salary_value()}</label>
  </div>
  <div class="field field-select">
    <select id="{idPrefix}-currency" bind:value={currency} onchange={write}>
      {#each CURRENCIES as option (option)}
        <option value={option}>{option}</option>
      {/each}
    </select>
    <label for="{idPrefix}-currency">{m.salary_currency()}</label>
  </div>
  <div class="field field-select">
    <select id="{idPrefix}-basis" bind:value={basis} onchange={write}>
      {#each PAY_BASES as option (option)}
        <option value={option}>{PAY_BASIS_LABELS[option]()}</option>
      {/each}
    </select>
    <label for="{idPrefix}-basis">{m.salary_basis()}</label>
  </div>
  <div class="field field-select">
    <select id="{idPrefix}-period" bind:value={period} onchange={write}>
      {#each PERIODS as option (option)}
        <option value={option}>{PERIOD_LABELS[option]()}</option>
      {/each}
    </select>
    <label for="{idPrefix}-period">{m.salary_period()}</label>
  </div>
</div>

<style>
  .salary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(7rem, 1fr));
    gap: var(--space-2);
  }
</style>
