<script lang="ts">
  import { untrack } from 'svelte';
  import { resolve } from '$app/paths';
  import { hasApplied } from '#lib/applications/types.js';
  import SunriseSprout from '#lib/components/SunriseSprout.svelte';
  import { greetingFor, headlineFor } from '#lib/dashboard/headline.js';
  import { needsFrom, type Need } from '#lib/dashboard/needs.js';
  import InsightsCard from '#lib/dashboard/InsightsCard.svelte';
  import Trends from '#lib/dashboard/Trends.svelte';
  import { m } from '#lib/paraglide/messages.js';
  import SetupDialog from '#lib/onboarding/SetupDialog.svelte';
  import CheckAll from '#lib/postings/CheckAll.svelte';
  import { engineName } from '#lib/postings/format.js';
  import { addPostingsHref } from '#lib/postings/add-link.js';
  import { needsCheck, sortEntries, toEntries } from '#lib/postings/list.js';
  import type { PageProps } from './$types';

  let { data, form }: PageProps = $props();

  let setupDialog = $state<SetupDialog>();
  // Taken once, as the page opens: saving the criteria sets Merit up, which must not take the setup away halfway through
  const setup = untrack(() => data.setup);

  const entries = $derived(toEntries(data.postings, data.settings));
  // Being considered: fully checked (worth a look) or not yet (waiting to be checked)
  const worth = $derived(sortEntries(entries.filter((entry) => entry.view === 'considering' && entry.fit.complete), 'fit'));
  const toCheck = $derived(entries.filter((entry) => entry.view === 'considering' && !entry.fit.complete));
  const needs = $derived(needsFrom(entries).filter((need) => need.kind !== 'toCheck'));
  const headline = $derived(headlineFor(worth.length, toCheck.length, needsFrom(entries), entries.length));
  const greeting = greetingFor(new Date().getHours());
  const canCheck = $derived(data.engine !== 'none' && !!data.criteriaInUse);
  // Whatever a check would still add, as on the postings page
  const uncheckedIds = $derived(entries.filter(needsCheck).map((entry) => entry.posting.id));

  // Like the Applying tab: to apply, and applied — only the parts that hold something
  const open = $derived(data.postings.filter((posting) => posting.application && posting.application.stage !== 'closed'));
  const openCount = $derived(open.length);
  const openDetail = $derived(
    [
      { count: open.filter((posting) => posting.application && !hasApplied(posting.application)).length, text: m.dashboard_to_apply },
      { count: open.filter((posting) => posting.application && hasApplied(posting.application)).length, text: m.dashboard_applied }
    ]
      .filter((part) => part.count > 0)
      .map((part) => part.text({ count: part.count }))
      .join(' · ')
  );
  const ENGINE_DETAIL: Record<string, () => string> = {
    'claude-code': () => m.dashboard_card_engine_claude(),
    ollama: () => m.dashboard_card_engine_ollama(),
    none: () => m.dashboard_card_engine_none()
  };
  const levels = $derived(Object.values(data.settings).filter((setting) => setting.level !== 'off'));
  const mustCount = $derived(levels.filter((setting) => setting.level === 'must').length);

  function needLine(need: Need): { text: string; href: string } {
    if (need.kind === 'toCheck') return { text: '', href: resolve('/postings') };
    const href = resolve('/postings/[id]', { id: need.postingId });
    if (need.kind === 'offer') return { text: m.need_offer({ title: need.title }), href };
    return { text: m.need_follow_up({ title: need.title, days: need.days }), href };
  }
</script>

<svelte:head>
  <title>{m.dashboard_page_title()} · Merit</title>
</svelte:head>

<div class="stack-lg">
  <!-- The answer first: is there anything for me, and what do I do now -->
  <section class="card welcome-band" aria-labelledby="headline">
    <div class="welcome-text">
      <p class="text-overline">{greeting}</p>
      <h1 id="headline">{headline.title}</h1>
      {#if headline.detail}<p class="text-lead">{headline.detail}</p>{/if}
      <div class="row band-actions">
        <!-- The postings worth a look aren't listed here: the headline leads to them -->
        {#if worth.length > 0}
          <a class="btn btn-primary" href="{resolve('/postings')}?view=considering&sort=fit">
            <span class="icon icon-arrow-circle-right" aria-hidden="true"></span>
            {m.dashboard_review()}
          </a>
        {/if}
        {#if canCheck}
          <CheckAll ids={uncheckedIds} primary={worth.length === 0} />
        {/if}
        <a class="btn {headline.action === 'add' ? 'btn-primary' : 'btn-secondary'}" href={addPostingsHref()}>
          <span class="icon icon-plus-circle" aria-hidden="true"></span>
          {m.postings_add()}
        </a>
      </div>
    </div>
    <div class="welcome-art"><SunriseSprout /></div>
  </section>

  <!-- Not set up yet: the setup opens by itself once per visit; closed, it waits behind this link -->
  {#if setup}
    <SetupDialog bind:this={setupDialog} {setup} settings={data.settings} />
  {/if}
  {#if data.setup}
    <p class="finish">
      <button type="button" class="link link-action" onclick={() => setupDialog?.open()}>
        <span class="icon icon-sm icon-arrow-circle-right" aria-hidden="true"></span>{m.setup_finish()}
      </button>
    </p>
  {/if}

  {#if needs.length > 0}
    <section class="stack-sm" aria-labelledby="next-title">
      <h2 class="text-overline" id="next-title">{m.dashboard_next_title()}</h2>
      <ul class="list">
        {#each needs as need, index (index)}
          {@const line = needLine(need)}
          <li class="list-item">
            <a class="list-item-main title-link" href={line.href}>{line.text}</a>
            <span class="icon icon-caret-circle-right go" aria-hidden="true"></span>
          </li>
        {/each}
      </ul>
    </section>
  {/if}


  <!-- The insights first, right under the opening band, so they show without a scroll: the part that helps most; the skills counted under them -->
  <InsightsCard
    postings={data.demand.postings}
    reading={data.trends}
    engine={data.engine}
    error={form && 'trendsError' in form ? String(form.trendsError) : null}
  />

  <Trends postings={data.demand.postings} skills={data.demand.skills} tools={data.demand.tools} />

  <!-- Three smaller cards in the opening band's style, on one row, after the insights:
       where the applications are, what the criteria are, which AI engine checks the postings -->
  <div class="summary-cards">
    <a class="card card-interactive summary-card" href="{resolve('/postings')}?view=applying">
      <span class="text-overline"><span class="icon icon-sm icon-briefcase" aria-hidden="true"></span>{m.nav_applications()}</span>
      {#if openCount > 0}
        <span class="summary-value">{m.dashboard_card_applications({ count: openCount })}</span>
        <span class="summary-detail">{openDetail}</span>
      {:else}
        <span class="summary-value">{m.dashboard_card_applications_none()}</span>
        <span class="summary-detail">{m.dashboard_card_applications_none_detail()}</span>
      {/if}
      <span class="summary-link">{m.dashboard_card_open()}</span>
    </a>
    <a class="card card-interactive summary-card" href={resolve('/settings/criteria')}>
      <span class="text-overline"><span class="icon icon-sm icon-funnel" aria-hidden="true"></span>{m.nav_criteria()}</span>
      {#if levels.length > 0}
        <span class="summary-value">{m.dashboard_card_criteria({ count: levels.length })}</span>
        <span class="summary-detail">{m.dashboard_card_criteria_detail({ must: mustCount, weigh: levels.length - mustCount })}</span>
      {:else}
        <span class="summary-value">{m.dashboard_setup_no_criteria()}</span>
        <span class="summary-detail">{m.dashboard_card_criteria_none_detail()}</span>
      {/if}
      <span class="summary-link">{m.dashboard_setup_edit()}</span>
    </a>
    <a class="card card-interactive summary-card" href={resolve('/settings/ai')}>
      <span class="text-overline"><span class="icon icon-sm icon-lightbulb" aria-hidden="true"></span>{m.nav_ai()}</span>
      <span class="summary-value">{data.engine === 'none' ? m.settings_none_name() : engineName(data.engine)}</span>
      <span class="summary-detail">{ENGINE_DETAIL[data.engine]?.() ?? ''}</span>
      <span class="summary-link">{m.dashboard_setup_change()}</span>
    </a>
  </div>

</div>

<style>
  h1,
  h2,
  p {
    margin: 0;
  }

  /* The opening band: the design system's card (as every card on the page), roomier, the answer in the display font
     and the sunrise beside it */
  .welcome-band {
    position: relative;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-5);
    padding: var(--space-6) var(--space-6) var(--space-5);
  }

  .welcome-text {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    max-width: 40rem;
  }

  .band-actions {
    padding-top: var(--space-2);
    gap: var(--space-2);
  }

  /* The illustration a little larger than it was, but never making the band taller: out of the flow, centred at the band's end, with the text kept clear of it */
  /* A share of the band's width, up to a little larger than it was: smaller on a narrower screen, not under the text */
  .welcome-band {
    --art-width: min(calc(var(--space-12) + var(--space-5)), 26%);
  }

  .welcome-art {
    position: absolute;
    top: 50%;
    right: var(--space-6);
    width: var(--art-width);
    transform: translateY(-50%);
  }

  @media (width >= 64rem) {
    .welcome-band {
      padding-right: calc(var(--space-6) + var(--art-width));
    }
  }

  @media (width < 64rem) {
    .welcome-art {
      display: none;
    }

    .welcome-band {
      padding: var(--space-4);
    }
  }

  .finish {
    margin: 0;
  }

  .finish .link-action {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
  }

  .title-link {
    color: var(--text-primary);
    text-decoration: none;
  }

  .title-link:hover {
    color: var(--accent-text-hover);
    text-decoration: underline;
  }

  .title-link:focus-visible {
    outline: 2px solid var(--focus-ring);
    outline-offset: 2px;
    border-radius: var(--radius-chip);
  }

  .go {
    color: var(--text-label);
  }

  /* The three small cards: the design system's card, each a link (its hover lifts it), on one row */
  .summary-cards {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--space-3);
  }

  @media (width < 64rem) {
    .summary-cards {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  .summary-card {
    gap: var(--space-1);
    color: var(--text-primary);
    text-decoration: none;
  }

  .summary-card:focus-visible {
    outline: 2px solid var(--focus-ring);
    outline-offset: 2px;
  }

  .summary-card .text-overline {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
  }

  .summary-value {
    font-family: var(--font-display);
    font-size: var(--text-h3);
    font-weight: var(--weight-semibold);
    line-height: var(--leading-tight);
    padding-top: var(--space-1);
  }

  .summary-detail {
    font-size: var(--text-small);
    color: var(--text-secondary);
  }

  .summary-link {
    margin-top: auto;
    padding-top: var(--space-2);
    font-size: var(--text-small);
    font-weight: var(--weight-medium);
    color: var(--accent-text);
  }
</style>
