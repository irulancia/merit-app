<script lang="ts">
  import { tick } from 'svelte';
  import { enhance } from '$app/forms';
  import { resolve } from '$app/paths';
  import type { SubmitFunction } from '$app/forms';
  import SplitButton from '#lib/components/SplitButton.svelte';
  import { m } from '#lib/paraglide/messages.js';
  import AutosaveText from '#lib/components/AutosaveText.svelte';
  import { checkFailureText } from './format.js';
  import type { Posting } from './types.js';

  interface Props {
    posting: Posting;
    engine: string;
    /** The posting's text or what fits has changed since the letter was drafted. */
    outdated: boolean;
    /** The code from the last draft or save that failed, if any. */
    letterError: string | null;
  }

  let { posting, engine, outdated, letterError }: Props = $props();

  let working = $state<'drafting' | 'rewriting' | null>(null);
  let stressing = $state(false);
  let stressField = $state<HTMLInputElement>();

  const canWrite = $derived(engine !== 'none' && !!posting.text);
  const letterFailure = $derived(
    letterError === 'write' ? m.letter_error_write() : letterError ? checkFailureText({ checked: false, engineError: letterError, skipped: letterError }) : null
  );
  const rewrites = $derived([
    { purpose: 'shorter', label: m.letter_rewrite_shorter() },
    { purpose: 'formal', label: m.letter_rewrite_formal() },
    { purpose: 'warmer', label: m.letter_rewrite_warmer() },
    ...(outdated ? [{ purpose: 'changed', label: m.letter_rewrite_changed() }] : [])
  ]);

  /** Drafting and rewriting both wait on the engine; the letter stays readable meanwhile. */
  function writing(kind: 'drafting' | 'rewriting'): SubmitFunction {
    return () => {
      working = kind;
      return async ({ update }) => {
        await update({ reset: false });
        working = null;
        stressing = false;
      };
    };
  }

  async function startStressing() {
    stressing = true;
    await tick();
    stressField?.focus();
  }

  function onStressKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') stressing = false;
  }
</script>

<!-- On every posting, written only when asked (it costs the engine's time); Applying's "Write cover letter" lands
     here -->
<section class="card" id="cover-letter" aria-labelledby="cover-letter-title">
  <div class="part">
    <div class="stack-sm">
      <h2 id="cover-letter-title">{m.letter_title()}</h2>
      <p class="text-small text-muted">{m.letter_text()}</p>
    </div>

    {#if posting.coverLetter}
      <!-- One form carries every rewrite: the purpose comes from the item chosen, the letter from the field as it is
           now, edits included -->
      <form id="rewrite-form" method="POST" action="?/rewriteLetter" use:enhance={writing('rewriting')}></form>
      <AutosaveText
        id="cover-letter-text"
        label={m.letter_field()}
        value={posting.coverLetter}
        action="?/saveLetter"
        name="letter"
        copyLabel={m.letter_copy()}
        busy={working !== null}
      >
        {#snippet actions(text)}
          <input type="hidden" name="letter" value={text} form="rewrite-form" />
          {#if canWrite}
            {#snippet items()}
              {#each rewrites as rewrite (rewrite.purpose)}
                <button type="submit" class="menu-item" role="menuitem" form="rewrite-form" name="purpose" value={rewrite.purpose}>
                  <span class="menu-item-label">{rewrite.label}</span>
                </button>
              {/each}
              <button type="button" class="menu-item" role="menuitem" onclick={startStressing}>
                <span class="menu-item-label">{m.letter_rewrite_stress()}</span>
              </button>
            {/snippet}
            <SplitButton label={m.letter_rewrite()} variant="secondary" small disabled={working !== null} menuId="rewrite-menu" {items} />
          {/if}
        {/snippet}
      </AutosaveText>

      {#if stressing && working === null}
        <div class="stress">
          <div class="field">
            <input id="letter-stress" name="stress" form="rewrite-form" placeholder=" " maxlength="200" bind:this={stressField} onkeydown={onStressKeydown} />
            <label for="letter-stress">{m.letter_stress_field()}</label>
          </div>
          <button type="submit" class="btn btn-secondary btn-sm" form="rewrite-form" name="purpose" value="stress">{m.letter_stress_submit()}</button>
        </div>
      {/if}
    {/if}

    {#if working}
      <p class="row text-small"><span class="spinner" aria-hidden="true"></span>{working === 'drafting' ? m.letter_drafting() : m.letter_rewriting()}</p>
    {/if}

    {#if engine === 'none'}
      <p class="text-small text-muted">
        {m.letter_no_engine()}
        <a class="link" href={resolve('/settings/ai')}>{m.check_no_engine_link()}</a>
      </p>
    {:else if !posting.text}
      <p class="reason">{m.letter_needs_text()}</p>
    {:else if !posting.coverLetter && !working}
      <form method="POST" action="?/draftLetter" use:enhance={writing('drafting')}>
        <button type="submit" class="btn btn-primary btn-sm">
          <span class="icon icon-note-pencil" aria-hidden="true"></span>{m.letter_draft()}
        </button>
      </form>
    {/if}

    {#if letterFailure && !working}
      <div class="alert alert-error" role="alert">
        <span class="icon icon-x-circle" aria-hidden="true"></span>
        <div class="alert-body"><span>{letterFailure}</span></div>
      </div>
    {/if}
  </div>
</section>

<style>
  .part {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  h2,
  p {
    margin: 0;
  }

  /* What to stress, and the button that sends it, on one line */
  .stress {
    display: flex;
    align-items: flex-end;
    gap: var(--space-2);
  }

  .stress .field {
    flex: 1;
  }
</style>
