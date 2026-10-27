<script lang="ts">
  import { resolve } from '$app/paths';
  import AutosaveText from '#lib/components/AutosaveText.svelte';
  import { m } from '#lib/paraglide/messages.js';
  import { interviewQuestions } from './topics.js';

  interface Props {
    /** The posting's own notes. */
    notes: string;
    /** The interview topics the user chose in About you. */
    topics: string[];
  }

  let { notes, topics }: Props = $props();

  let copied = $state(false);
  let copyFailed = $state(false);

  const questions = $derived(interviewQuestions(topics));

  async function copy() {
    try {
      await navigator.clipboard.writeText(questions.map((question, index) => `${index + 1}. ${question}`).join('\n'));
      copied = true;
      copyFailed = false;
    } catch {
      copyFailed = true;
    }
  }
</script>

<!-- What a posting can't tell, as two cards: the questions usually clarified in an interview, and the user's
     notes — their own research on the company, or what they heard — kept with the posting to the end -->
<section class="card" id="interview" aria-labelledby="questions-title">
  <div class="stack-sm">
    <h2 id="questions-title">{m.interview_questions_title()}</h2>
    <p class="text-small text-muted">{m.interview_questions_subtitle()}</p>
  </div>
  {#if questions.length > 0}
    <ol class="questions">
      {#each questions as question (question)}
        <li>{question}</li>
      {/each}
    </ol>
    <div class="card-actions">
      <button type="button" class="btn btn-secondary btn-sm" onclick={copy}>
        <span class="icon icon-copy" aria-hidden="true"></span>
        {m.interview_copy()}
      </button>
      <a class="link link-action text-small" href={resolve('/settings/profile')}>{m.interview_choose()}</a>
      <span class="text-small text-muted" aria-live="polite">{copied ? m.copied() : ''}</span>
    </div>
    {#if copyFailed}
      <p class="text-small reason">{m.copy_failed()}</p>
    {/if}
  {:else}
    <p class="text-small text-muted">
      {m.interview_none()}
      <a class="link" href={resolve('/settings/profile')}>{m.interview_choose()}</a>
    </p>
  {/if}
</section>

<section class="card" aria-labelledby="posting-notes-title">
  <div class="stack-sm">
    <h2 id="posting-notes-title">{m.interview_notes_title()}</h2>
    <p class="text-small text-muted">{m.interview_notes_hint()}</p>
  </div>
  <AutosaveText id="posting-notes" label={m.interview_notes_field()} value={notes} action="?/saveNotes" name="notes" />
</section>

<style>
  h2,
  p {
    margin: 0;
  }

  .questions {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    margin: 0;
    padding-left: var(--space-4);
  }
</style>
