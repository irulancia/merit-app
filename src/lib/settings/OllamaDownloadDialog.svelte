<script lang="ts">
  import { m } from '#lib/paraglide/messages.js';

  interface Props {
    onconfirm: () => void;
  }

  let { onconfirm }: Props = $props();

  // Nothing downloads on one click: first what comes, how big, and whose terms.
  // Plain buttons, not forms: the dialog sits inside the AI engine page's own form
  const TERMS_URL = 'https://ai.google.dev/gemma/terms';
  let dialog = $state<HTMLDialogElement>();

  export function open() {
    dialog?.showModal();
  }

  function confirm() {
    dialog?.close();
    onconfirm();
  }
</script>

<dialog class="dialog dialog-sm" bind:this={dialog} aria-labelledby="ollama-download-title">
  <div class="dialog-header">
    <h2 id="ollama-download-title">{m.ollama_dialog_title()}</h2>
    <p class="dialog-description">{m.ollama_dialog_text()}</p>
  </div>
  <p class="dialog-body text-small">
    {m.ollama_dialog_terms()}
    <a class="link" href={TERMS_URL} target="_blank" rel="noopener noreferrer">{m.ollama_dialog_terms_link()}</a>
  </p>
  <div class="dialog-footer">
    <button type="button" class="btn btn-secondary" onclick={() => dialog?.close()}>{m.ollama_dialog_cancel()}</button>
    <button type="button" class="btn btn-primary" onclick={confirm}>{m.ollama_dialog_confirm()}</button>
  </div>
</dialog>

<style>
  h2,
  p {
    margin: 0;
  }
</style>
