<script lang="ts">
  import { m } from '#lib/paraglide/messages.js';
  import { skillsFit, skillsShare } from '#lib/profile/skills.js';
  import FitBar from './FitBar.svelte';
  import type { Fit } from './fit.js';

  interface Props {
    fit: Fit;
    /** The posting's text, to find the skills it names. */
    text: string;
    /** The user's skills and tools, from About you. */
    skills: string[];
  }

  let { fit, text, skills }: Props = $props();

  const share = $derived(skills.length > 0 && text ? skillsShare(skillsFit(text, skills)) : null);
</script>

<!-- How it fits in two bars, one under the other: what the user wants (the criteria, by verdict) and what they bring
     (the skills the posting names that they have); the groups under them keep the detail -->
<dl class="bars">
  <dt class="text-small">{m.fit_bars_criteria()}</dt>
  <dd><FitBar counts={fit.counts} compact /></dd>
  <dd class="text-small text-muted">{m.fit_bars_criteria_count({ pass: fit.counts.pass, total: fit.inUse.length })}</dd>

  <dt class="text-small">{m.fit_bars_skills()}</dt>
  {#if share}
    <dd><span class="progress progress-success" aria-hidden="true"><span style:--value="{(share.have / share.asked) * 100}%"></span></span></dd>
    <dd class="text-small text-muted">{m.fit_bars_skills_count({ have: share.have, asked: share.asked })}</dd>
  {:else}
    <dd class="none text-small text-muted">{skills.length === 0 ? m.fit_bars_skills_none_yours() : m.fit_bars_skills_none_named()}</dd>
  {/if}
</dl>

<style>
  /* Label, bar, number: the same three columns on both rows, so the two bars start and end together */
  .bars {
    display: grid;
    grid-template-columns: max-content minmax(var(--space-10), 1fr) max-content;
    align-items: center;
    gap: var(--space-2) var(--space-3);
    margin: 0;
  }

  dt,
  dd {
    margin: 0;
  }

  /* Both bars fill their column: the criteria one, not the list row's short width; the skills one, a block (it is a
     span, so it would have no width of its own) */
  .bars :global(.compact),
  .progress {
    display: block;
    width: 100%;
  }

  /* As thick as the criteria bar above it (app.css's progress is thinner): two bars read as a pair */
  .progress {
    height: var(--space-2);
  }

  .none {
    grid-column: 2 / -1;
  }
</style>
