<script lang="ts">
  import { m } from '#lib/paraglide/messages.js';
  import type { SkillDemand } from '#lib/profile/skills.js';

  interface Props {
    /** How many postings were counted: every bar is a share of these. */
    postings: number;
    /** The skills, or the tools: the chart is the same for both. */
    skills: SkillDemand[];
    /** What to say when none is named in more than one posting. */
    none: string;
    /** The line saying what the check means; off when the page shows one for several charts. */
    legend?: boolean;
  }

  let { postings, skills, none, legend = true }: Props = $props();
</script>

<!-- One bar per skill, its length the share of postings that name it, its number beside it as text (the bar is
     only a picture of it); a check for the ones on the user's list, with its words for screen readers -->
<div class="stack-sm">
  {#if skills.length === 0}
    <p class="text-small text-muted">{none}</p>
  {:else}
    <ul class="chart">
      {#each skills as skill (skill.name)}
        <li class="bar-row">
          <span class="name">{skill.name}</span>
          <span class="track" aria-hidden="true"><span class="bar" style:width="{(skill.count / postings) * 100}%"></span></span>
          <span class="count">{m.trends_skill_count({ count: skill.count, total: postings })}</span>
          <span class="have">
            {#if skill.have}
              <span class="icon icon-sm icon-check-circle" aria-hidden="true"></span><span class="sr-only">{m.demand_have()}</span>
            {:else}
              <span class="sr-only">{m.demand_not_listed()}</span>
            {/if}
          </span>
        </li>
      {/each}
    </ul>
    {#if legend}<p class="legend card-meta"><span class="icon icon-sm icon-check-circle" aria-hidden="true"></span>{m.trends_skills_legend()}</p>{/if}
  {/if}
</div>

<style>
  p {
    margin: 0;
  }

  /* Name, bar, number, check: the same four columns on every row, so the bars start and end at the same place; the
     name is never cut (the bar gives way, down to a short one) */
  .chart {
    display: grid;
    grid-template-columns: max-content minmax(var(--space-6), 1fr) max-content var(--space-4);
    align-items: center;
    gap: var(--space-2) var(--space-3);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .bar-row {
    display: contents;
  }

  .name {
    font-size: var(--text-small);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* A faint track for the whole (every posting), the bar for the share: thin, its data end rounded */
  .track {
    display: block;
    height: var(--space-2);
    background: var(--bg-surface);
    border-radius: var(--radius-chip);
  }

  .bar {
    display: block;
    height: 100%;
    background: var(--chart);
    border-radius: var(--radius-chip);
  }

  .count {
    font-size: var(--text-small);
    color: var(--text-secondary);
    font-variant-numeric: tabular-nums;
  }

  .have,
  .legend {
    display: inline-flex;
    align-items: center;
  }

  .legend {
    gap: var(--space-1);
  }

  .have .icon,
  .legend .icon {
    color: var(--success-strong);
  }
</style>
