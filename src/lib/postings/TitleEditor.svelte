<script lang="ts">
  import { tick, untrack } from 'svelte';
  import { enhance } from '$app/forms';
  import { m } from '#lib/paraglide/messages.js';
  import { POSTING_LIMITS } from './types.js';

  interface Props {
    /** The whole title as shown: the role and the company ("Senior Product Designer at Adobe"), or the user's own. */
    title: string;
    failed?: boolean;
  }

  let { title, failed = false }: Props = $props();

  let editable = $state<HTMLElement>();
  let form = $state<HTMLFormElement>();
  let focused = $state(false);
  let text = $state(untrack(() => title));
  let submitted = $state('');
  let saving = $state(false);

  // Follows the saved title, except while the user is typing in it
  $effect(() => {
    if (!focused) text = title;
  });

  /** The title is edited where it stands: Enter or leaving it saves, Esc puts it back. */
  async function commit() {
    focused = false;
    const cleaned = text.replace(/\s+/g, ' ').trim();
    if (!cleaned || cleaned.length > POSTING_LIMITS.title) {
      restore();
      return;
    }
    if (cleaned === title) return;
    submitted = cleaned;
    saving = true;
    // Once the hidden field holds the new value
    await tick();
    form?.requestSubmit();
  }

  function restore() {
    text = title;
  }

  function onkeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      editable?.blur();
    } else if (event.key === 'Escape') {
      restore();
      editable?.blur();
    }
  }

  // Pasted text comes in as plain text, on one line: no formatting from the page it was copied from
  function onpaste(event: ClipboardEvent) {
    event.preventDefault();
    const text = (event.clipboardData?.getData('text/plain') ?? '').replace(/\s+/g, ' ');
    document.execCommand('insertText', false, text);
  }

</script>

<form
  class="title-form"
  method="POST"
  action="?/rename"
  bind:this={form}
  use:enhance={() => async ({ result, update }) => {
    await update({ reset: false });
    saving = false;
    if (result.type !== 'success') restore();
  }}
>
  <input type="hidden" name="title" value={submitted} />
</form>

<div class="field-group" class:has-error={failed}>
  <!-- The title is the field: no pencil, no buttons; a hover tint and the text cursor say it can be edited.
       The heading's text is the editable span's, bound (bind:textContent), which the check can't see. -->
  <!-- svelte-ignore a11y_missing_content -->
  <h1>
    <span
      class="editable"
      class:is-saving={saving}
      contenteditable="true"
      role="textbox"
      tabindex="0"
      aria-label={m.posting_title_label()}
      spellcheck="false"
      bind:this={editable}
      bind:textContent={text}
      onfocus={() => (focused = true)}
      onblur={commit}
      {onkeydown}
      {onpaste}
    ></span>
  </h1>
  {#if failed}
    <span class="field-msg">
      <span class="icon icon-sm icon-warning-circle" aria-hidden="true"></span>
      {m.posting_title_error()}
    </span>
  {/if}
</div>

<style>
  h1 {
    margin: 0;
  }

  /* Only a hidden field: it takes no place in the header, so the gap there doesn't push the title down */
  .title-form {
    display: contents;
  }

  /* Edited in place (the design system's inline editable field): a border only on hover and while editing, so it
     reads as the page's title until it is touched. A full border, since a title can wrap. */
  .editable {
    border: 2px solid transparent;
    border-radius: var(--radius-chip);
    box-decoration-break: clone;
    transition: all 0.2s ease;
    cursor: text;
  }

  .editable:hover {
    background: var(--accent-bg-subtle);
  }

  .editable:focus {
    outline: none;
    border-color: var(--accent-ui);
  }

  .editable.is-saving {
    color: var(--text-secondary);
  }
</style>
