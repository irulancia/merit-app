<script lang="ts">
  import { enhance } from '$app/forms';
  import AutosaveText from '#lib/components/AutosaveText.svelte';
  import { m } from '#lib/paraglide/messages.js';
  import { ASK_FEEDBACK_REASONS, type Application } from './types.js';

  interface Props {
    application: Application;
  }

  let { application }: Props = $props();

  let drafting = $state(false);
  let draftFailed = $state(false);

  // Asking makes sense when turned down or never answered; once they replied, the reply comes first and the asking
  // folds away under it
  const canAsk = $derived(application.closedReason !== '' && ASK_FEEDBACK_REASONS.includes(application.closedReason));
  const answered = $derived(application.feedback.trim() !== '');

  // Why it is worth asking, how to take it, and what Merit does with it
  const GUIDE = [
    { icon: 'icon-envelope-simple-open', text: () => m.feedback_guide_why() },
    { icon: 'icon-chat-text', text: () => m.feedback_guide_take() },
    { icon: 'icon-lightbulb', text: () => m.feedback_guide_merit() }
  ];
</script>

{#snippet ask()}
  <ul class="guide">
    {#each GUIDE as point (point.icon)}
      <li class="text-small"><span class="icon icon-sm {point.icon}" aria-hidden="true"></span>{point.text()}</li>
    {/each}
  </ul>
  <form
    method="POST"
    action="?/draftRequest"
    use:enhance={() => {
      drafting = true;
      draftFailed = false;
      return async ({ result, update }) => {
        drafting = false;
        if (result.type === 'success') await update({ reset: false });
        else draftFailed = true;
      };
    }}
  >
    <button type="submit" class="btn btn-secondary btn-sm" disabled={drafting}>
      {#if drafting}<span class="spinner" aria-hidden="true"></span>{m.letter_drafting()}{:else}{application.feedbackRequest ? m.notes_redraft() : m.notes_draft()}{/if}
    </button>
  </form>
  {#if draftFailed}
    <p class="text-small reason">{m.notes_failed()}</p>
  {/if}
  {#if application.feedbackRequest}
    <AutosaveText
      id="feedback-request"
      label={m.notes_request_label()}
      value={application.feedbackRequest}
      action="?/saveRequest"
      name="feedbackRequest"
      copyLabel={m.notes_copy_request()}
    />
  {/if}
{/snippet}

<!-- A closed application's feedback, on the posting's own page and edited in place like the rest: what they said, saved as typed, and, when asking makes sense, why and how, with the message to send -->
<section class="card stack" id="feedback" aria-labelledby="feedback-title">
  <div class="stack-sm">
    <h2 id="feedback-title">{m.feedback_title()}</h2>
    <p class="text-small text-muted">{m.notes_dialog_text()}</p>
  </div>

  {#if canAsk && !answered}
    {@render ask()}
  {/if}

  <AutosaveText id="feedback-received" label={m.notes_feedback_label()} value={application.feedback} action="?/saveFeedback" name="feedback" />

  {#if canAsk && answered}
    <div class="accordion">
      <details>
        <summary>{m.application_ask_feedback()}</summary>
        <div class="accordion-body stack">{@render ask()}</div>
      </details>
    </div>
  {/if}
</section>

<style>
  h2,
  p {
    margin: 0;
  }

  .guide {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    margin: 0;
    padding: 0;
    list-style: none;
    color: var(--text-secondary);
  }

  .guide li {
    display: flex;
    align-items: flex-start;
    gap: var(--space-2);
  }

  .guide .icon {
    flex-shrink: 0;
    margin-top: calc((var(--text-small) * var(--leading-loose) - var(--icon-sm)) / 2);
    color: var(--accent-text);
  }
</style>
