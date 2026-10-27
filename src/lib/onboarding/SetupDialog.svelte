<script lang="ts">
  import { untrack } from 'svelte';
  import { deserialize } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { resolve } from '$app/paths';
  import type { CriteriaSettings } from '#lib/criteria/types.js';
  import SunriseSprout from '#lib/components/SunriseSprout.svelte';
  import { m } from '#lib/paraglide/messages.js';
  import SkillsInput from '#lib/profile/SkillsInput.svelte';
  import SetupCriteria from './SetupCriteria.svelte';

  export interface SetupData {
    skills: string[];
    tools: string[];
    engine: string;
    /** What this computer has: Claude Code installed, and Ollama's first model (null when it isn't running). */
    claudeFound: boolean;
    ollamaModel: string | null;
  }

  interface Props {
    setup: SetupData;
    /** The criteria as saved: the setup changes a few of them. */
    settings: CriteriaSettings;
  }

  let { setup, settings: savedSettings }: Props = $props();

  // A new user's first look at Merit, one slide at a time: each slide fits on a screen.
  // It ends on the AI engine, chosen on its own page, unless one is chosen. No
  // posting is asked for: nobody is made to add one to get through.
  const ALL_STEPS = ['intro', 'criteria', 'skills', 'tools', 'engine'] as const;
  type StepId = (typeof ALL_STEPS)[number];
  const TITLES: Record<Exclude<StepId, 'intro'>, () => string> = {
    criteria: () => m.setup_criteria_title(),
    skills: () => m.setup_skills_title(),
    tools: () => m.setup_tools_title(),
    engine: () => ENGINE_TITLES[found]()
  };
  // The last slide follows what this computer has: one click to use it, or where to get one
  type Found = 'claude' | 'ollama' | 'none';
  const ENGINE_TITLES: Record<Found, () => string> = {
    claude: () => m.setup_ai_claude_title(),
    ollama: () => m.setup_ai_ollama_title(),
    none: () => m.setup_ai_none_title()
  };
  const INSTALL_LINKS = [
    { href: 'https://claude.com/claude-code', name: () => m.settings_claude_name(), text: () => m.setup_ai_claude_text() },
    { href: 'https://ollama.com', name: () => m.settings_ollama_name(), text: () => m.setup_ai_ollama_text() }
  ];
  // Shown on the first slide, each with its icon
  const POINTS = [
    { icon: 'icon-funnel', text: () => m.setup_point_criteria() },
    { icon: 'icon-clipboard-text', text: () => m.setup_point_paste() },
    { icon: 'icon-check-circle', text: () => m.setup_point_fit() },
    // What the search teaches, not only what it finds: the dashboard's insights, its lightbulb
    { icon: 'icon-lightbulb', text: () => m.setup_point_grow() }
  ];
  /** What a new user picks from, on screen; the rest are in About you. */
  const SKILL_PICKS = ['User research', 'Prototyping', 'Wireframing', 'Usability testing', 'Interaction design', 'UI design', 'Visual design', 'Design systems', 'Information architecture', 'Accessibility', 'Product design', 'Stakeholder management'];
  const TOOL_PICKS = ['Figma', 'FigJam', 'Miro', 'Jira', 'Notion', 'Maze', 'Hotjar', 'Dovetail', 'Sketch', 'Adobe XD', 'Framer', 'Webflow'];
  /** Finished or closed once, it stays closed on this computer until "Finish setting up": not on every visit. */
  const DISMISSED_KEY = 'merit-setup-dismissed';
  /** A pause this long after a change saves the criteria, so a few quick clicks save once. */
  const CRITERIA_SAVE_DELAY_MS = 400;

  let dialog = $state<HTMLDialogElement>();
  let index = $state(0);
  let settings = $state(untrack(() => structuredClone(savedSettings)));
  let saving = $state(false);
  /** On the last slide: use the engine found here now, or decide later in Settings. */
  let engineChoice = $state<'use' | 'later'>('use');
  let failed = $state(false);

  const steps = $derived(ALL_STEPS.filter((id) => id !== 'engine' || setup.engine === 'none'));
  const step = $derived<StepId>(steps[index]);
  const last = $derived(index === steps.length - 1);
  const found = $derived<Found>(setup.claudeFound ? 'claude' : setup.ollamaModel ? 'ollama' : 'none');

  export function open() {
    index = 0;
    dialog?.showModal();
    focusTitle();
  }

  $effect(() => {
    if (!dialog || dialog.open || readDismissed()) return;
    dialog.showModal();
  });

  // Each slide starts on its title: not on the close (the browser's pick, being first), and not on a button, which
  // would draw its focus ring; Tab goes on from there, and a screen reader reads the title
  $effect(() => {
    void index;
    if (!dialog?.open) return;
    queueMicrotask(focusTitle);
  });

  function focusTitle() {
    dialog?.querySelector<HTMLElement>('#setup-title')?.focus();
  }

  function readDismissed(): boolean {
    try {
      return localStorage.getItem(DISMISSED_KEY) === '1';
    } catch {
      return false;
    }
  }

  function dismiss() {
    try {
      localStorage.setItem(DISMISSED_KEY, '1');
    } catch {
      // No storage (a private window): it simply opens again on the next visit
    }
    dialog?.close();
  }

  // The criteria save by themselves as they change, like the lists on the next slides: Next showed "Saving…" while
  // a tick showed nothing, which was confusing
  let savedCriteria = untrack(() => JSON.stringify(savedSettings));
  let criteriaSave: Promise<boolean> = Promise.resolve(true);

  $effect(() => {
    const current = JSON.stringify(settings);
    if (current === savedCriteria) return;
    const timer = setTimeout(() => (criteriaSave = saveCriteria(current)), CRITERIA_SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  });

  /** These criteria, saved through the Criteria page's action; true when saved. */
  async function saveCriteria(current: string): Promise<boolean> {
    const body = new FormData();
    body.set('settings', current);
    try {
      const response = await fetch(`${resolve('/settings/criteria')}?/save`, { method: 'POST', body, headers: { 'x-sveltekit-action': 'true' } });
      const saved = deserialize(await response.text()).type === 'success';
      if (saved) savedCriteria = current;
      failed = !saved;
      return saved;
    } catch {
      failed = true;
      return false;
    }
  }

  /** On to the next slide; the criteria are saved already, or now if the last change hasn't had its turn yet. */
  async function next() {
    if (step === 'criteria') {
      const current = JSON.stringify(settings);
      if (current !== savedCriteria) criteriaSave = saveCriteria(current);
      if (!(await criteriaSave)) return;
      // The page behind reloads in the background: waiting for it (it checks for Claude Code and Ollama) held the slide
      // back about a second with nothing on screen, which read as a bug
      void invalidateAll();
    }
    if (last) dismiss();
    else index += 1;
  }

  function back() {
    failed = false;
    index = Math.max(index - 1, 0);
  }

  /** Ends the setup: with the engine found here when chosen, saved through the AI engine page's action. */
  async function finish() {
    if (found === 'none' || engineChoice === 'later') {
      dismiss();
      return;
    }
    const body = new FormData();
    body.set('engine', found === 'claude' ? 'claude-code' : 'ollama');
    body.set('ollamaModel', setup.ollamaModel ?? '');
    saving = true;
    try {
      const response = await fetch(`${resolve('/settings/ai')}?/save`, { method: 'POST', body, headers: { 'x-sveltekit-action': 'true' } });
      failed = deserialize(await response.text()).type !== 'success';
    } catch {
      failed = true;
    }
    saving = false;
    if (failed) return;
    await invalidateAll();
    dismiss();
  }
</script>

<dialog class="dialog dialog-lg setup" bind:this={dialog} aria-labelledby="setup-title" onclose={() => (failed = false)}>
  <!-- The close in the header's corner, as every dialog in the design system has it -->
  <div class="dialog-header">
    <span class="has-tooltip tooltip-end">
      <button type="button" class="btn btn-ghost btn-icon dialog-close" aria-label={m.setup_close()} onclick={dismiss}>
        <span class="icon icon-x-circle" aria-hidden="true"></span>
      </button>
      <span class="tooltip" aria-hidden="true">{m.setup_close()}</span>
    </span>
    {#if step === 'intro'}
      <div class="art"><SunriseSprout /></div>
      <p class="text-overline">{m.welcome_overline()}</p>
      <h2 id="setup-title" tabindex="-1">{m.welcome_title()}</h2>
    {:else}
      <h2 id="setup-title" tabindex="-1">{TITLES[step]()}</h2>
    {/if}
  </div>

  <div class="dialog-body stack">
    {#if step === 'intro'}
      <ul class="points">
        {#each POINTS as point (point.icon)}
          <li><span class="point-icon"><span class="icon icon-sm {point.icon}" aria-hidden="true"></span></span>{point.text()}</li>
        {/each}
      </ul>
    {:else if step === 'criteria'}
      <SetupCriteria bind:settings />
    {:else if step === 'skills'}
      <SkillsInput kind="skill" skills={setup.skills} picks={SKILL_PICKS} />
      <p class="text-small text-muted">{m.setup_picks_more()}</p>
    {:else if step === 'tools'}
      <SkillsInput kind="tool" skills={setup.tools} picks={TOOL_PICKS} />
      <p class="text-small text-muted">{m.setup_picks_more()}</p>
    {:else}
      {#if found === 'none'}
        <p>{m.setup_ai_none_text()}</p>
        <ul class="installs">
          {#each INSTALL_LINKS as link (link.href)}
            <li>
              <a class="link link-action" href={link.href} target="_blank" rel="noopener noreferrer">
                {link.name()}<span class="icon icon-sm icon-arrow-square-out" aria-hidden="true"></span>
              </a>
              <span class="text-muted">{link.text()}</span>
            </li>
          {/each}
        </ul>
        <p class="text-small text-muted">{m.setup_ai_compare()}</p>
      {:else}
        <fieldset class="choice-group">
          <legend class="sr-only">{TITLES.engine()}</legend>
          <label class="radio">
            <input type="radio" name="setup-engine" value="use" bind:group={engineChoice} />
            {found === 'claude' ? m.setup_ai_use_claude() : m.setup_ai_use_ollama()}
          </label>
          <label class="radio">
            <input type="radio" name="setup-engine" value="later" bind:group={engineChoice} />
            {m.setup_ai_later()}
          </label>
        </fieldset>
      {/if}
    {/if}

    {#if failed}
      <div class="alert alert-error" role="alert">
        <span class="icon icon-x-circle" aria-hidden="true"></span>
        <div class="alert-body"><span>{m.setup_save_failed()}</span></div>
      </div>
    {/if}
  </div>

  <!-- "Skip setup" at the start, the same on every slide; then where you are, Back and the slide's main button -->
  <div class="dialog-footer">
    <button type="button" class="link link-quiet skip" onclick={dismiss}>{m.setup_skip_all()}</button>
    <span class="progress-count text-small text-muted">{m.setup_progress({ step: index + 1, total: steps.length })}</span>
    {#if step !== 'intro'}
      <button type="button" class="btn btn-secondary" onclick={back}>{m.setup_back()}</button>
    {/if}
    {#if step === 'intro'}
      <button type="button" class="btn btn-primary" onclick={() => (index = 1)}>{m.setup_start()}</button>
    {:else if step === 'engine'}
      <button type="button" class="btn btn-primary" onclick={finish} disabled={saving}>{saving ? m.add_saving() : m.setup_finish_button()}</button>
    {:else}
      <button type="button" class="btn btn-primary" onclick={next}>{m.setup_next()}</button>
    {/if}
  </div>
</dialog>

<style>
  /* Focused only so the slide starts there: a title isn't something to act on, so no ring */
  h2:focus {
    outline: none;
  }

  h2,
  p {
    margin: 0;
  }

  .art {
    width: var(--space-11);
    align-self: center;
  }

  /* What Merit does, in three short lines, each led by its icon in a light circle */
  /* Close together: three lines of one list, not three sections */
  .points {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .points li {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .installs {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .installs li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
  }

  .installs .link-action {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
  }

  .choice-group {
    margin: 0;
    padding: 0;
    border: 0;
  }

  .point-icon {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: var(--control-height-sm);
    height: var(--control-height-sm);
    border-radius: var(--radius-pill);
    background: var(--accent-bg);
    color: var(--accent-text);
  }

  /* Skip setup at the start; the count, Back and the slide's action at the end */
  .dialog-footer {
    align-items: center;
  }

  .skip {
    margin-right: auto;
  }

  .progress-count {
    padding-inline: var(--space-2);
    font-variant-numeric: tabular-nums;
  }
</style>
