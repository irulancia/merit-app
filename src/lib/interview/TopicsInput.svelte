<script lang="ts">
  import { untrack } from 'svelte';
  import { deserialize } from '$app/forms';
  import { m } from '#lib/paraglide/messages.js';
  import { INTERVIEW_TOPICS } from './topics.js';

  interface Props {
    /** The topics ticked, as saved. */
    topics: string[];
  }

  let { topics: savedTopics }: Props = $props();

  let topics = $state(untrack(() => [...savedTopics]));
  let saving = $state(false);
  let failed = $state(false);

  function toggle(id: string, on: boolean) {
    const chosen = on ? [...topics, id] : topics.filter((other) => other !== id);
    topics = INTERVIEW_TOPICS.filter((topic) => chosen.includes(topic.id)).map((topic) => topic.id);
    void save();
  }

  /** Each tick saves at once. */
  async function save() {
    const body = new FormData();
    body.set('topics', JSON.stringify(topics));
    saving = true;
    try {
      const response = await fetch('?/saveTopics', { method: 'POST', body, headers: { 'x-sveltekit-action': 'true' } });
      failed = deserialize(await response.text()).type !== 'success';
    } catch {
      failed = true;
    } finally {
      saving = false;
    }
  }
</script>

<!-- Each topic by the question it puts on every posting -->
<fieldset class="fieldset">
  <legend class="sr-only">{m.profile_interview_title()}</legend>
  <div class="choice-group topics">
    {#each INTERVIEW_TOPICS as topic (topic.id)}
      <label class="check">
        <input type="checkbox" checked={topics.includes(topic.id)} onchange={(event) => toggle(topic.id, event.currentTarget.checked)} />
        <span class="topic">
          <span>{topic.title()}</span>
          <span class="text-small text-muted">{topic.question()}</span>
        </span>
      </label>
    {/each}
  </div>
</fieldset>

<div aria-live="polite">
  {#if saving}
    <p class="status text-small">{m.criteria_saving()}</p>
  {:else if failed}
    <p class="status text-small is-failed">
      <span class="icon icon-x-circle" aria-hidden="true"></span>{m.criteria_status_failed()}
      <button type="button" class="link link-action" onclick={save}>{m.criteria_retry()}</button>
    </p>
  {/if}
</div>

<style>
  p {
    margin: 0;
  }

  .topics {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .topic {
    display: flex;
    flex-direction: column;
  }

  .status {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    color: var(--text-secondary);
  }

  .status.is-failed {
    color: var(--error-strong);
  }
</style>
