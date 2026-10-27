<script lang="ts">
  import { enhance } from '$app/forms';
  import { m } from '#lib/paraglide/messages.js';

  interface Props {
    /** Why the text is missing: a link whose page couldn't be read, or a screenshot not read yet. */
    reason: 'link' | 'image';
    failed?: boolean;
  }

  let { reason, failed = false }: Props = $props();

  let saving = $state(false);
</script>

<section class="card" aria-labelledby="add-text">
  <h2 id="add-text">{m.add_text_title()}</h2>
  <p class="text-muted">{reason === 'link' ? m.add_text_reason_link() : m.add_text_reason_image()}</p>
  <form
    method="POST"
    action="?/addText"
    class="stack-sm"
    use:enhance={() => {
      saving = true;
      return async ({ update }) => {
        await update();
        saving = false;
      };
    }}
  >
    <div class="field-group" class:has-error={failed}>
      <div class="field">
        <textarea id="posting-text" name="text" placeholder=" "></textarea>
        <label for="posting-text">{m.add_text_field()}</label>
      </div>
      {#if failed}
        <span class="field-msg">
          <span class="icon icon-sm icon-warning-circle" aria-hidden="true"></span>
          {m.add_text_error()}
        </span>
      {/if}
    </div>
    <div class="card-actions">
      <button type="submit" class="btn btn-primary" disabled={saving}>{saving ? m.add_saving() : m.add_text_save()}</button>
    </div>
  </form>
</section>

<style>
  h2,
  p {
    margin: 0;
  }

  textarea {
    field-sizing: content;
    min-height: calc(var(--field-height) * 3);
    max-height: 60vh;
  }
</style>
