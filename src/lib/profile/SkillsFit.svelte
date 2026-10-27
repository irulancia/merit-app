<script lang="ts">
  import { resolve } from '$app/paths';
  import { m } from '#lib/paraglide/messages.js';
  import { skillsFit } from './skills.js';

  interface Props {
    /** The posting's text. */
    text: string;
    /** The user's skills, from About you. */
    skills: string[];
  }

  let { text, skills }: Props = $props();

  const fit = $derived(skillsFit(text, skills));
</script>

<!-- Beside how it fits what the user wants: how what they bring meets what it asks, by the names it uses -->
<section class="card" aria-labelledby="skills-fit">
  <h2 id="skills-fit">{m.skills_fit_title()}</h2>

  {#if skills.length === 0}
    <p class="text-small text-muted">
      {m.skills_fit_none()}
      <a class="link" href={resolve('/settings/profile')}>{m.skills_fit_add()}</a>
    </p>
  {:else if fit.have.length === 0 && fit.notListed.length === 0}
    <p class="text-small text-muted">{m.skills_fit_nothing_named()}</p>
  {:else}
    {#if fit.have.length > 0}
      <div class="stack-sm">
        <h3 class="text-overline">{m.skills_fit_have({ count: fit.have.length })}</h3>
        <ul class="skills">
          {#each fit.have as skill (skill)}
            <li class="tag is-have"><span class="icon icon-sm icon-check-circle" aria-hidden="true"></span>{skill}</li>
          {/each}
        </ul>
      </div>
    {/if}
    {#if fit.notListed.length > 0}
      <div class="stack-sm">
        <h3 class="text-overline">{m.skills_fit_not_listed({ count: fit.notListed.length })}</h3>
        <ul class="skills">
          {#each fit.notListed as skill (skill)}
            <li class="tag">{skill}</li>
          {/each}
        </ul>
        <p class="text-small text-muted">{m.skills_fit_not_listed_text()}</p>
      </div>
    {/if}
  {/if}
</section>

<style>
  h2,
  h3,
  p {
    margin: 0;
  }

  .skills {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  /* One you have: Pass's green on its icon, the words carry it too (the heading) */
  .is-have .icon {
    color: var(--success-strong);
  }
</style>
