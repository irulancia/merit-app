<script lang="ts">
  import { tick } from 'svelte';
  import { enhance } from '$app/forms';
  import { m } from '#lib/paraglide/messages.js';
  import NotSureBox from './NotSureBox.svelte';

  interface Props {
    /** Why the user marked it Not sure; empty when they gave none. */
    reason: string;
  }

  let { reason }: Props = $props();

  let editing = $state(false);
  let draft = $state('');
  // What was just written, shown at once while it saves; the saved reason takes over once the page has it
  let pending = $state<string | null>(null);

  const shown = $derived(pending ?? reason);
  let form = $state<HTMLFormElement>();
  let field = $state<HTMLTextAreaElement>();

  async function startEditing() {
    draft = shown;
    editing = true;
    await tick();
    field?.focus();
  }

  /** Leaving the field saves it (nothing to press); Esc puts it back. */
  function finish() {
    editing = false;
    const cleaned = draft.trim();
    if (cleaned === reason) return;
    pending = cleaned;
    form?.requestSubmit();
  }

  function onkeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      draft = reason;
      editing = false;
    } else if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      field?.blur();
    }
  }
</script>

<form
  id="aside-reason-form"
  method="POST"
  action="?/asideReason"
  bind:this={form}
  use:enhance={() => async ({ update }) => {
    await update({ reset: false });
    pending = null;
  }}
>
  {#if !editing}<input type="hidden" name="reason" value={draft} />{/if}
</form>

<!-- The user's own mark, when nothing on the posting misses: why, in their words — written in the box, saved by
     itself -->
{#snippet line()}
  {#if editing}
    <div class="field">
      <textarea id="aside-reason" name="reason" form="aside-reason-form" placeholder=" " maxlength="300" bind:value={draft} bind:this={field} onblur={finish} {onkeydown}></textarea>
      <label for="aside-reason">{m.aside_reason_label()}</label>
    </div>
  {:else if shown}
    <span>{shown}</span>
  {:else}
    <span>{m.aside_no_reason()}</span>
  {/if}
{/snippet}

{#snippet action()}
  {#if !editing}
    <button type="button" class="link link-action" onclick={startEditing}>
      {shown ? m.aside_reason_edit() : m.aside_reason_add()}
    </button>
  {/if}
{/snippet}

<NotSureBox title={m.aside_title()} icon="icon-archive" {line} {action} />

<style>
  .field {
    padding-top: var(--space-1);
  }

  /* On the box's red tint, the field and its label strip in the near-white of a card, whatever its state, instead
     of the theme's blue-grey */
  .field textarea,
  .field textarea:is(:hover, :focus) {
    height: calc(var(--field-height) * 2);
    resize: none;
    background: var(--card-bg);
  }

  .field textarea + label {
    background: var(--card-bg);
  }
</style>
