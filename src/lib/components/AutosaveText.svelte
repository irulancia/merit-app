<script lang="ts">
  import { untrack, type Snippet } from 'svelte';
  import { deserialize } from '$app/forms';
  import { beforeNavigate, invalidateAll } from '$app/navigation';
  import { m } from '#lib/paraglide/messages.js';

  /** A pause in typing this long saves; leaving the field saves at once. */
  const AUTOSAVE_DELAY_MS = 600;

  interface Props {
    id: string;
    label: string;
    /** The text as saved (or suggested); a new one from the page (after a rewrite) replaces what is shown. */
    value: string;
    /** The page's form action that saves it, and the field's name in it. */
    action: string;
    name: string;
    /** A Copy button, with this label; none without it. */
    copyLabel?: string;
    /** While something else is rewriting the text: it can be read, not edited. */
    busy?: boolean;
    /** More of the card's actions, after Copy, given the text as it is now. */
    actions?: Snippet<[string]>;
  }

  let { id, label, value, action, name, copyLabel, busy = false, actions }: Props = $props();

  let text = $state(untrack(() => value));
  let saved = $state(untrack(() => value));
  let saving = $state(false);
  /** The text that last failed to save: not retried by itself, only by a new change or Try again. */
  let failedText = $state<string | null>(null);
  // Nothing is said about saving until the user has changed something
  let edited = $state(false);
  let copied = $state(false);
  let copyFailed = $state(false);
  let focused = $state(false);

  const dirty = $derived(text !== saved);

  // A new text from the page (a rewrite, Back to suggested) replaces the shown one. Never while the user is in the
  // field: the page hands back what was just saved, tidied by the server (a trailing space dropped), and taking it
  // then would undo their typing and throw the cursor to the end
  $effect(() => {
    const incoming = value;
    untrack(() => {
      if (focused || incoming === saved) return;
      text = incoming;
      saved = incoming;
      failedText = null;
    });
  });

  $effect(() => {
    if (!dirty || saving || text === failedText) return;
    const timer = setTimeout(save, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
  });

  beforeNavigate(({ willUnload, cancel }) => {
    if (!dirty) return;
    if (willUnload) cancel();
    else if (!saving) void save();
  });

  async function save() {
    const submitted = text;
    const body = new FormData();
    body.set(name, submitted);
    saving = true;
    try {
      const response = await fetch(action, { method: 'POST', body, headers: { 'x-sveltekit-action': 'true' } });
      const result = deserialize(await response.text());
      if (result.type !== 'success') {
        failedText = submitted;
        return;
      }
      saved = submitted;
      failedText = null;
      // The page follows what was saved (Back to suggested shows once the questions are the user's)
      await invalidateAll();
    } catch {
      failedText = submitted;
    } finally {
      saving = false;
    }
  }

  function oninput() {
    edited = true;
    copied = false;
  }

  function onblur() {
    focused = false;
    if (dirty && !saving) void save();
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
      copyFailed = false;
    } catch {
      copyFailed = true;
    }
  }
</script>

<!-- One text, edited where it stands and saved by itself: no Save, no Cancel -->
<div class="field">
  <textarea {id} placeholder=" " readonly={busy} bind:value={text} onfocus={() => (focused = true)} {oninput} {onblur}></textarea>
  <label for={id}>{label}</label>
</div>
<div class="card-actions">
  {#if copyLabel}
    <button type="button" class="btn btn-secondary btn-sm" disabled={!text.trim()} onclick={copy}>
      <span class="icon icon-copy" aria-hidden="true"></span>
      {copyLabel}
    </button>
  {/if}
  {@render actions?.(text)}
  <span class="status text-small" class:is-failed={failedText !== null && !saving} aria-live="polite">
    {#if copied}
      {m.copied()}
    {:else if failedText !== null && !saving}
      <span class="icon icon-x-circle" aria-hidden="true"></span>{m.criteria_status_failed()}
      <button type="button" class="link link-action" onclick={save}>{m.criteria_retry()}</button>
    {:else if edited && (dirty || saving)}
      {m.criteria_saving()}
    {:else if edited}
      <span class="icon icon-check-circle" aria-hidden="true"></span>{m.criteria_status_saved()}
    {/if}
  </span>
</div>
{#if copyFailed}
  <p class="text-small reason">{m.copy_failed()}</p>
{/if}

<style>
  p {
    margin: 0;
  }

  textarea {
    field-sizing: content;
    min-height: calc(var(--field-height) * 4);
    max-height: 70vh;
  }

  .status {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    color: var(--text-secondary);
  }

  .status .icon-check-circle {
    color: var(--success-strong);
  }

  .status.is-failed {
    color: var(--error-strong);
  }
</style>
