<script lang="ts">
  import { m } from '#lib/paraglide/messages.js';

  interface Props {
    /** How much it frees, in GB, as the page shows it. */
    size: string;
    onconfirm: () => void;
  }

  let { size, onconfirm }: Props = $props();

  // Asked first, like deleting a posting. Plain buttons, not forms: the dialog sits inside the AI engine page's form
  let dialog = $state<HTMLDialogElement>();

  export function open() {
    dialog?.showModal();
  }

  function confirm() {
    dialog?.close();
    onconfirm();
  }
</script>

<dialog class="dialog dialog-sm" bind:this={dialog} aria-labelledby="ollama-delete-title">
  <div class="dialog-header">
    <h2 id="ollama-delete-title">{m.ollama_delete_title()}</h2>
    <p class="dialog-description">{m.ollama_delete_text({ size })}</p>
  </div>
  <div class="dialog-footer">
    <button type="button" class="btn btn-secondary" onclick={() => dialog?.close()}>{m.ollama_dialog_cancel()}</button>
    <button type="button" class="btn btn-destructive" onclick={confirm}>{m.ollama_delete_confirm()}</button>
  </div>
</dialog>

<style>
  h2,
  p {
    margin: 0;
  }
</style>
