<script lang="ts">
  import { m } from '#lib/paraglide/messages.js';
  import { DEMAND_MIN_POSTINGS, type SkillDemand } from '#lib/profile/skills.js';
  import SkillsChart from './SkillsChart.svelte';

  interface Props {
    /** How many postings the counts come from: every one added, with text. */
    postings: number;
    /** The skills, and the tools, asked most: two columns. */
    skills: SkillDemand[];
    tools: SkillDemand[];
  }

  let { postings, skills, tools }: Props = $props();
</script>

<!-- What the user's postings ask for, counted by Merit, no AI. The AI's reading is a card of its own under it,
     Insights for you -->
<section class="card stack" aria-labelledby="demand-title">
  <!-- The title alone; a line under it only while there are too few postings -->
  <div class="stack-sm">
    <h2 id="demand-title">{m.trends_title()}</h2>
    {#if postings < DEMAND_MIN_POSTINGS}
      <p class="text-small text-muted">{m.demand_too_few({ min: DEMAND_MIN_POSTINGS, count: postings })}</p>
    {/if}
  </div>

  {#if postings >= DEMAND_MIN_POSTINGS}
    <!-- Skills, then tools, no heading over either: everyone tells them apart -->
    <div class="columns">
      <SkillsChart {postings} {skills} none={m.demand_none()} legend={false} />
      <SkillsChart {postings} skills={tools} none={m.demand_none_tools()} legend={false} />
    </div>
    <!-- Under the bars, apart from them: how many postings they come from, then the one legend for both -->
    <p class="source card-meta">
      <span>{m.demand_from({ count: postings })}</span>
      {#if skills.some((skill) => skill.have) || tools.some((tool) => tool.have)}
        <span aria-hidden="true">·</span>
        <span class="legend"><span class="icon icon-sm icon-check-circle" aria-hidden="true"></span>{m.trends_skills_legend()}</span>
      {/if}
    </p>
  {/if}
</section>

<style>
  h2,
  p {
    margin: 0;
  }

  /* Skills and tools side by side, one under the other on a narrow screen */
  .columns {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-6);
  }

  @media (width < 64rem) {
    .columns {
      grid-template-columns: minmax(0, 1fr);
      gap: var(--space-4);
    }
  }

  /* Not .footer: that is the design system's page footer */
  .source {
    flex-wrap: wrap;
    padding-top: var(--space-2);
  }

  .legend {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
  }

  .legend .icon {
    color: var(--success-strong);
  }
</style>
