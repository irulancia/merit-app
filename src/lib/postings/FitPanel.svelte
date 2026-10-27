<script lang="ts">
  import { enhance } from '$app/forms';
  import { resolve } from '$app/paths';
  import type { Criterion } from '#lib/criteria/catalog.js';
  import type { CriteriaSettings } from '#lib/criteria/types.js';
  import { m } from '#lib/paraglide/messages.js';
  import AsideReason from './AsideReason.svelte';
  import NotSureBox from './NotSureBox.svelte';
  import CheckWithAi from './CheckWithAi.svelte';
  import { currentMarks, currentReasons, isCompared, isFactCriterion, markSource } from './facts.js';
  import { findOut } from './find-out.js';
  import { usefulReason } from './reasons.js';
  import { computeFit, isFilteredOut } from './fit.js';
  import { engineName, formatCheckedAt } from './format.js';
  import VerdictRow from './VerdictRow.svelte';
  import FitBars from './FitBars.svelte';
  import { VERDICT_LOOK, VERDICT_ORDER, type Verdict } from './verdict-look.js';
  import type { Posting } from './types.js';

  interface Props {
    posting: Posting;
    settings: CriteriaSettings;
    engine: string;
    checkFailure: string | null;
    /** The user's skills and tools, from About you, for the skills bar. */
    skills: string[];
  }

  let { posting, settings, engine, checkFailure, skills }: Props = $props();

  const marks = $derived(currentMarks(posting, settings));
  const reasons = $derived(currentReasons(posting));
  const fit = $derived(computeFit(marks, settings));
  // Checked before facts were read: a criterion with a value may keep a verdict from an older value
  const outOfDate = $derived(posting.facts === null && fit.inUse.some((criterion) => isFactCriterion(criterion.id)));
  // Set aside by the user, a "consider it anyway" no longer holds: it reads as in Not sure again
  const filtered = $derived(isFilteredOut(fit, posting.keptAnyway && !posting.archived));
  // Grouped by verdict; in each group the non-negotiables first, then the catalog's order
  const byVerdict = $derived.by(() => {
    const ordered = [...fit.inUse].sort((a, b) => Number(isMust(b)) - Number(isMust(a)));
    return Object.fromEntries(
      VERDICT_ORDER.map((verdict) => [verdict, ordered.filter((criterion) => (marks[criterion.id] ?? 'unmarked') === verdict)])
    ) as Record<Verdict, Criterion[]>;
  });

  const GROUP_TITLE: Record<Verdict, (count: { count: number }) => string> = {
    miss: (count) => m.fit_group_miss(count),
    unmentioned: (count) => m.fit_group_unmentioned(count),
    unmarked: (count) => m.fit_group_unmarked(count),
    pass: (count) => m.fit_group_pass(count)
  };

  function isMust(criterion: Criterion): boolean {
    return settings[criterion.id]?.level === 'must';
  }
  let checking = $state(false);
  const checkedLine = $derived(
    posting.checkedAt ? m.check_done_with({ when: formatCheckedAt(posting.checkedAt) }) : null
  );
  const failedNames = $derived(fit.failedMust.map((criterion) => criterion.title()).join(', '));

  function label(criterion: Criterion): string {
    return criterion.summary(settings[criterion.id]?.value ?? '');
  }
</script>

{#snippet group(verdict: Verdict)}
  {@const criteria = byVerdict[verdict]}
  {#if criteria.length > 0}
    <!-- Each verdict folds away; what passes starts folded, since there is nothing to do about it -->
    <details class="group is-{verdict}" open={verdict !== 'pass'}>
      <summary class="group-summary">
        <h3 class="text-overline group-title is-{verdict}">
          <span class="icon icon-sm {VERDICT_LOOK[verdict].icon}" aria-hidden="true"></span>
          {GROUP_TITLE[verdict]({ count: criteria.length })}
        </h3>
      </summary>
      <ul class="rows">
        {#each criteria as criterion (criterion.id)}
          <VerdictRow
            criterionId={criterion.id}
            compared={isCompared(posting, criterion.id)}
            label={label(criterion)}
            mark={marks[criterion.id]}
            reason={usefulReason(marks[criterion.id], reasons[criterion.id])}
            source={markSource(posting, criterion.id)}
            must={isMust(criterion)}
            findOut={findOut(criterion, posting.company)}
          />
        {/each}
      </ul>
    </details>
  {/if}
{/snippet}

{#snippet keepForm(kept: boolean, text: string)}
  <form method="POST" action="?/keep" use:enhance={() => async ({ update }) => update({ reset: false })}>
    <input type="hidden" name="kept" value={String(kept)} />
    <button type="submit" class="link link-action">{text}</button>
  </form>
{/snippet}

<aside class="card fit-card" aria-labelledby="fit-title">
  <div class="stack-sm">
    <!-- The title, and right under it who checked it with a link to check again; before the first check, the button at the title's end -->
    <div class="head">
      <div class="card-header">
        <h2 id="fit-title">{m.fit_title()}</h2>
        {#if !checkedLine && fit.inUse.length > 0 && engine !== 'none'}
          <CheckWithAi checked={false} bind:checking />
        {/if}
      </div>
      {#if checkedLine}
        <p class="checked card-meta">
          <span>{checkedLine}</span>
          {#if fit.inUse.length > 0 && engine !== 'none'}
            <span aria-hidden="true">·</span>
            <CheckWithAi checked bind:checking asLink />
          {/if}
        </p>
      {/if}
    </div>
    {#if fit.inUse.length > 0}
      <FitBars {fit} text={posting.text} {skills} />
    {/if}
    <!-- Checked, but something is left: Merit says what, so the user never has to work it out -->
    {#if posting.checkedAt && fit.counts.unmarked > 0}
      <p class="text-small text-muted">{m.fit_missing_unmarked({ count: fit.counts.unmarked })}</p>
    {:else if posting.checkedAt && outOfDate}
      <p class="text-small text-muted">{m.fit_missing_out_of_date()}</p>
    {/if}
  </div>

  {#if fit.inUse.length === 0}
    <div class="empty">
      <span class="empty-icon"><span class="icon icon-lg icon-funnel" aria-hidden="true"></span></span>
      <strong>{m.fit_no_criteria_title()}</strong>
      <p class="text-small">{m.fit_no_criteria_text()}</p>
      <a class="btn btn-secondary" href={resolve('/settings/criteria')}>{m.fit_no_criteria_action()}</a>
    </div>
  {:else}
    <!-- One reason at a time: a miss on a non-negotiable is the main one; the user's own mark only when nothing misses.
         The box stays whatever was decided; only its link follows where the posting is — Consider it anyway from Not
         sure, Back to Not sure once considered anyway, none once applying (the breadcrumb and top button say where) -->
    {#if fit.failedMust.length > 0}
      {#snippet missedLine()}<span>{failedNames}</span>{/snippet}
      {#snippet missedAction()}
        {#if !posting.application && filtered}
          {@render keepForm(true, m.fit_bring_back())}
        {:else if !posting.application && !posting.archived}
          {@render keepForm(false, m.fit_filter_again())}
        {/if}
      {/snippet}
      <NotSureBox title={m.fit_misses_title()} line={missedLine} action={missedAction} />
    {:else if posting.archived && !posting.application}
      <AsideReason reason={posting.asideReason} />
    {/if}
    <div class="live" aria-live="polite">
      {#if checking}
        <p class="text-small text-muted">{m.check_running_hint({ engine: engineName(engine) })}</p>
      {:else if checkFailure}
        <div class="alert alert-error" role="alert">
          <span class="icon icon-x-circle" aria-hidden="true"></span>
          <div class="alert-body"><span>{checkFailure}</span></div>
        </div>
      {/if}
    </div>
    {#if engine === 'none'}
      <p class="text-small text-muted">
        {m.check_no_engine()} <a class="link" href={resolve('/settings/ai')}>{m.check_no_engine_link()}</a>
      </p>
    {/if}
    {#each VERDICT_ORDER as verdict (verdict)}
      {@render group(verdict)}
    {/each}
  {/if}
</aside>

<style>
  /* the message area takes no room while it has nothing to say */
  .live:empty {
    display: none;
  }

  /* If the row is short of room, the check moves under the title */
  .card-header {
    flex-wrap: wrap;
  }

  /* Title and its checked line close together, then room before the bars */
  .head {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    padding-bottom: var(--space-3);
  }

  .checked {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
  }

  h2,
  p {
    margin: 0;
  }

  /* a step more room between its parts (the result, the groups) than a card's own */
  .fit-card {
    gap: var(--space-4);
  }

  /* Each group on a tint of its verdict's colour, so it reads before any word does; nested in the card, so its
     corners follow the card's (concentric) */
  .group {
    padding: var(--space-3);
    border-radius: max(0px, calc(var(--radius-surface) - var(--space-4)));
  }

  .group.is-pass {
    background: var(--success-bg);
  }

  /* The secondary, as in the fit bar: a tint of it on the card */
  .group.is-unmentioned {
    background: color-mix(in srgb, var(--secondary) 45%, var(--card-bg));
  }

  .group.is-unmarked {
    background: var(--bg-surface);
  }

  .group.is-miss {
    background: var(--error-bg);
  }

  /* The heading is the fold's handle: the design system's accordion chevron at its end, pointing down when open */
  .group-summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    list-style: none;
    cursor: pointer;
  }

  .group-summary::-webkit-details-marker {
    display: none;
  }

  .group-summary::after {
    content: '';
    flex-shrink: 0;
    width: 0.5em;
    height: 0.5em;
    margin-right: var(--space-1);
    border-right: 2px solid var(--text-secondary);
    border-bottom: 2px solid var(--text-secondary);
    transform: translateY(-25%) rotate(45deg);
    transition: transform 0.2s ease;
  }

  .group[open] > .group-summary::after {
    transform: translateY(25%) rotate(-135deg);
  }

  .group-summary:focus-visible {
    outline: 2px solid var(--focus-ring);
    outline-offset: 2px;
    border-radius: var(--radius-chip);
  }

  .group-title {
    margin: 0;
  }

  .group[open] > .rows {
    padding-top: var(--space-2);
  }

  /* the first row under the heading needs no line above it */
  .group :global(.verdict-row:first-child) {
    border-top: 0;
  }

  /* The verdict said once, in its colour, with its icon and word; the rows under it show only the icon */
  .group-title {
    display: flex;
    align-items: center;
    gap: var(--space-1);
  }

  .group-title.is-pass {
    color: var(--success-strong);
  }

  .group-title.is-unmentioned {
    color: var(--secondary-text);
  }

  .group-title.is-unmarked {
    color: var(--text-label);
  }

  .group-title.is-miss {
    color: var(--error-strong);
  }

  .rows {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .alert-body form {
    margin-top: var(--space-1);
  }
</style>
