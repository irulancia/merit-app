<script lang="ts">
  import { enhance } from '$app/forms';
  import { m } from '#lib/paraglide/messages.js';
  import EngineOptions from '#lib/settings/EngineOptions.svelte';
  import type { PageProps } from './$types';

  let { data, form }: PageProps = $props();

  // Starts from the saved choice; the radios change it until Save
  const saved = () => ({ ...data.settings, firstModel: data.ollamaModels?.[0] ?? '' });
  let engine = $state(saved().engine);
  let ollamaModel = $state(saved().ollamaModel || saved().firstModel);
  let saving = $state(false);

  const SAVE_ERRORS = {
    invalid: () => m.settings_error_invalid(),
    noModel: () => m.settings_error_no_model(),
    write: () => m.settings_error_write()
  };
  const saveError = $derived(form && 'saveError' in form && form.saveError ? SAVE_ERRORS[form.saveError]() : null);
</script>

<svelte:head>
  <title>{m.settings_page_title()} · Merit</title>
</svelte:head>

<div class="stack-lg">
  <header class="page-header">
    <div class="page-header-text">
      <h1>{m.settings_title()}</h1>
      <p class="text-lead">{m.settings_lead()}</p>
    </div>
  </header>

  <form
    method="POST"
    action="?/save"
    class="card"
    use:enhance={() => {
      saving = true;
      return async ({ update }) => {
        await update({ reset: false });
        saving = false;
      };
    }}
  >
    <!-- Not the two columns of a form section: the engines' table needs the card's whole width -->
    <section class="stack">
      <div class="stack-sm">
        <h2>{m.settings_engine_title()}</h2>
        <p class="text-muted">{m.settings_engine_text()}</p>
      </div>
      <EngineOptions claudeVersion={data.claudeVersion} ollamaModels={data.ollamaModels} download={data.download} bind:engine bind:ollamaModel />
    </section>

    {#if saveError}
      <div class="alert alert-error" role="alert">
        <span class="icon icon-x-circle" aria-hidden="true"></span>
        <div class="alert-body"><span>{saveError}</span></div>
      </div>
    {/if}

    <div class="form-actions">
      <span class="text-small text-muted status" aria-live="polite">{form && 'saved' in form ? m.settings_saved() : ''}</span>
      <button type="submit" class="btn btn-primary" disabled={saving}>{saving ? m.add_saving() : m.settings_save()}</button>
    </div>
  </form>
</div>

<style>
  h1,
  h2,
  p {
    margin: 0;
  }

  .status {
    margin-right: auto;
    align-self: center;
  }
</style>
