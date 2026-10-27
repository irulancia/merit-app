<script lang="ts">
  import { untrack } from 'svelte';
  import { deserialize } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { m } from '#lib/paraglide/messages.js';
  import { cleanSkill, knownOfKind, MAX_SKILL_LENGTH, MAX_SKILLS, type SkillKind } from './skills.js';

  interface Props {
    /** Which of About you's two lists: the skills, or the tools. */
    kind: SkillKind;
    /** The list as saved. */
    skills: string[];
    /** Only these few, as buttons to press, with no field (the setup): a new user picks from what they see. */
    picks?: string[];
  }

  let { kind, skills: savedSkills, picks }: Props = $props();

  // Each list's own words and where it is saved
  const TEXT = {
    skill: { field: m.profile_skills_field, list: m.profile_skills_title, action: 'saveSkills' },
    tool: { field: m.profile_tools_field, list: m.profile_tools_title, action: 'saveTools' }
  };
  const text = $derived(TEXT[kind]);
  const known = $derived(knownOfKind(kind));

  let skills = $state(untrack(() => [...savedSkills]));
  let typed = $state('');
  let saving = $state(false);
  let failed = $state(false);

  const added = $derived(new Set(skills.map((skill) => skill.toLocaleLowerCase())));
  // The list offers only what isn't added yet
  const offered = $derived(known.filter((skill) => !added.has(skill.name.toLocaleLowerCase())));
  const knownNames = $derived(new Set(known.map((skill) => skill.name.toLocaleLowerCase())));

  function add(raw: string) {
    const skill = cleanSkill(raw);
    if (!skill || added.has(skill.toLocaleLowerCase()) || skills.length >= MAX_SKILLS) return;
    skills = [...skills, skill];
    typed = '';
    void save();
  }

  /** A pick pressed adds it, pressed again takes it off. */
  function toggle(name: string) {
    const kept = skills.find((skill) => skill.toLocaleLowerCase() === name.toLocaleLowerCase());
    if (kept) remove(kept);
    else add(name);
  }

  function remove(skill: string) {
    skills = skills.filter((kept) => kept !== skill);
    void save();
  }

  /** Enter adds what is typed, from the list or not. */
  function onkeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    add(typed);
  }

  /** Picking one from the list adds it at once (the browser fills in its whole name). */
  function oninput(event: Event) {
    const inputType = (event as InputEvent).inputType;
    const picked = inputType === undefined || inputType === 'insertReplacementText';
    if (picked && knownNames.has(typed.trim().toLocaleLowerCase())) add(typed);
  }

  async function save() {
    const body = new FormData();
    body.set('list', JSON.stringify(skills));
    saving = true;
    try {
      const response = await fetch(`${resolve('/settings/profile')}?/${text.action}`, { method: 'POST', body, headers: { 'x-sveltekit-action': 'true' } });
      failed = deserialize(await response.text()).type !== 'success';
      if (!failed) await invalidateAll();
    } catch {
      failed = true;
    } finally {
      saving = false;
    }
  }
</script>

{#if picks}
  <div class="picks" role="group" aria-label={text.list()}>
    {#each picks as pick (pick)}
      <button type="button" class="toggle" aria-pressed={added.has(pick.toLocaleLowerCase())} onclick={() => toggle(pick)}>
        {pick}<span class="icon icon-sm icon-check-circle tick" aria-hidden="true"></span>
      </button>
    {/each}
  </div>
{:else}
<!-- The field says what it is; typing offers the list, Enter adds anything else. Its tags are its value, so an empty
     list shows nothing -->
<div class="field">
  <input id="{kind}-input" type="text" list="{kind}-list" placeholder=" " maxlength={MAX_SKILL_LENGTH} autocomplete="off" bind:value={typed} {onkeydown} {oninput} />
  <label for="{kind}-input">{text.field()}</label>
</div>
<datalist id="{kind}-list">
  {#each offered as skill (skill.name)}
    <option value={skill.name}></option>
  {/each}
</datalist>

{#if skills.length > 0}
  <ul class="skills" aria-label={text.list()}>
    {#each skills as skill (skill)}
      <li class="tag">
        {skill}
        <button type="button" class="tag-remove" aria-label={m.profile_skill_remove({ skill })} onclick={() => remove(skill)}>
          <span class="icon icon-sm icon-x-circle" aria-hidden="true"></span>
        </button>
      </li>
    {/each}
  </ul>
{/if}
{/if}

<!-- Only a save that failed is said: a quick save showed "Saving…" for a blink, which read as a flicker and moved a
     centred dialog -->
<div aria-live="polite">
  {#if failed && !saving}
    <p class="status text-small is-failed">
      <span class="icon icon-x-circle" aria-hidden="true"></span>{m.criteria_status_failed()}
      <button type="button" class="link link-action" onclick={save}>{m.criteria_retry()}</button>
    </p>
  {/if}
</div>

<style>
  p {
    margin: 0;
  }

  /* A pick that is on: its tick after the name. The tick's room is kept when off, and the weight is the same either
     way, so pressing one never changes its width and the rows don't jump */
  .picks .toggle {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    font-weight: var(--weight-semibold);
    /* Chip-sized: twelve fit a laptop's screen with no scroll */
    min-height: 0;
    padding: var(--space-1) var(--space-3);
    font-size: var(--text-small);
  }

  /* Not picked: the tick shows, very faint, so the chip doesn't end in an empty gap; picked, in
     the chip's own colour */
  .tick {
    color: var(--border);
  }

  .toggle[aria-pressed='true'] .tick {
    color: currentColor;
  }

  .picks {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1);
  }

  .skills {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .status {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    color: var(--text-secondary);
  }

  .status.is-failed {
    color: var(--error-strong);
  }
</style>
