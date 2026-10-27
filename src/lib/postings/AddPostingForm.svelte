<script lang="ts">
  import { enhance } from '$app/forms';
  import { m } from '#lib/paraglide/messages.js';
  import { IMAGE_TYPES, POSTING_LIMITS, type AddError } from './types.js';
  import { isLinkOnly } from './validate.js';

  export interface Added {
    id: string;
    title: string;
    linkUnread: boolean;
    check: unknown;
  }

  interface Props {
    onadded: (added: Added) => void;
    /** The form's id: its submit button and its "check as I add it" switch sit in the drawer's footer. */
    id: string;
    /** Read by the footer's button: what it says, and whether it waits. */
    saving?: boolean;
    /** Where it is sent: the Postings page's own add action, from that page or from another (the setup). */
    action?: string;
  }

  let { onadded, id, saving = $bindable(false), action = '?/add' }: Props = $props();

  let text = $state('');
  let error = $state<AddError | null>(null);
  let image = $state<File | null>(null);
  let previewUrl = $state<string | null>(null);
  let dragging = $state(false);
  let fileInput = $state<HTMLInputElement>();
  // Checked here before sending: the server would refuse a body this big before Merit could explain why
  let localError = $state<AddError | null>(null);

  const shownError = $derived(localError ?? error);

  const ERROR_TEXT: Record<AddError, () => string> = {
    empty: () => m.add_error_empty(),
    textTooLong: () => m.add_error_text_too_long(),
    imageTooBig: () => m.add_error_image_too_big(),
    imageType: () => m.add_error_image_type(),
    write: () => m.add_error_write()
  };

  const trimmed = $derived(text.trim());
  const detected = $derived(
    image ? m.add_detected_image() : isLinkOnly(trimmed) ? m.add_detected_link() : trimmed ? m.add_detected_text() : null
  );

  /** One image at a time; it also goes into the file input, so the form sends it like a chosen file. */
  function useImage(file: File | null) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const tooBig = file !== null && file.size > POSTING_LIMITS.imageBytes;
    localError = tooBig ? 'imageTooBig' : null;
    image = file && !tooBig && file.type in IMAGE_TYPES ? file : null;
    previewUrl = image ? URL.createObjectURL(image) : null;
    if (!fileInput) return;
    const transfer = new DataTransfer();
    if (image) transfer.items.add(image);
    fileInput.files = transfer.files;
  }

  function isAddError(candidate: unknown): candidate is AddError {
    return typeof candidate === 'string' && candidate in ERROR_TEXT;
  }

  function firstImage(files: FileList | null | undefined): File | null {
    return [...(files ?? [])].find((file) => file.type in IMAGE_TYPES) ?? null;
  }

  function onPaste(event: ClipboardEvent) {
    const pasted = firstImage(event.clipboardData?.files);
    if (!pasted) return;
    event.preventDefault();
    useImage(pasted);
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    dragging = false;
    const dropped = firstImage(event.dataTransfer?.files);
    if (dropped) useImage(dropped);
  }
</script>

  <form
    {id}
    method="POST"
    {action}
    enctype="multipart/form-data"
    class="stack"
    use:enhance={() => {
      saving = true;
      error = null;
      return async ({ result, update }) => {
        saving = false;
        if (result.type === 'success' && result.data) {
          const data = result.data as Record<string, unknown>;
          onadded({ id: String(data.added), title: String(data.title), linkUnread: data.linkUnread === true, check: data.check });
          text = '';
          useImage(null);
          // Refresh the list behind the drawer; the drawer stays open for the next one
          await update({ reset: false });
          return;
        }
        error = result.type === 'failure' && isAddError(result.data?.error) ? result.data.error : 'write';
      };
    }}
  >
    <div
      class="field-group paste-zone"
      class:has-error={shownError}
      class:is-dragging={dragging}
      role="presentation"
      ondragover={(event) => {
        event.preventDefault();
        dragging = true;
      }}
      ondragleave={() => (dragging = false)}
      ondrop={onDrop}
    >
      <div class="field">
        <textarea id="content" name="content" placeholder=" " bind:value={text} onpaste={onPaste} aria-describedby={shownError ? 'content-msg' : undefined}></textarea>
        <label for="content">{m.add_field_content()}</label>
      </div>
      {#if shownError}
        <span class="field-msg" id="content-msg">
          <span class="icon icon-sm icon-warning-circle" aria-hidden="true"></span>
          {ERROR_TEXT[shownError]()}
        </span>
      {/if}
    </div>

    <input class="sr-only" type="file" id="image" name="image" accept="image/png,image/jpeg,image/webp,image/gif" bind:this={fileInput} onchange={() => useImage(firstImage(fileInput?.files))} />

    {#if image && previewUrl}
      <div class="preview">
        <img src={previewUrl} alt={m.add_preview_alt()} />
        <span class="text-small">{image.name}</span>
        <button type="button" class="btn btn-ghost btn-sm" onclick={() => useImage(null)}>{m.add_remove_image()}</button>
      </div>
    {/if}

    <div class="row">
      <label class="btn btn-secondary btn-sm" for="image">
        <span class="icon icon-image" aria-hidden="true"></span>
        {m.add_choose_image()}
      </label>
      <span class="text-small text-muted" aria-live="polite">{detected ?? ''}</span>
    </div>
  </form>

<style>
  /* A fixed size: a pasted posting is only passed on, nobody reads it here, so a long one scrolls inside instead of
     growing the field and pushing the rest of the drawer out of sight */
  textarea {
    height: calc(var(--field-height) * 3);
    resize: none;
  }

  .paste-zone {
    border-radius: var(--radius-field);
    transition: all 0.2s ease;
  }

  .paste-zone.is-dragging {
    outline: 2px dashed var(--accent-ui);
    outline-offset: var(--space-1);
  }

  .preview {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
  }

  .preview img {
    width: var(--space-11);
    max-height: var(--space-10);
    object-fit: cover;
    object-position: top;
    border: 1px solid var(--border);
    border-radius: var(--radius-chip);
  }

  /* The file input is visually hidden but still takes Tab; its label is what you see, so the ring goes there */
  form:has(#image:focus-visible) label[for='image'] {
    outline: 2px solid var(--focus-ring);
    outline-offset: 2px;
  }

  label[for='image'] {
    cursor: pointer;
  }
</style>
