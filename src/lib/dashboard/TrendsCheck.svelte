<script lang="ts">
  import { enhance } from '$app/forms';
  import type { SubmitFunction } from '$app/forms';
  import { m } from '#lib/paraglide/messages.js';

  interface Props {
    /** Read once already: it offers to check again, as a link on the line that says when (as on a posting). */
    checked: boolean;
    /** True while the engine reads the postings, so the card can say so. */
    working?: boolean;
  }

  let { checked, working = $bindable(false) }: Props = $props();

  const whileReading: SubmitFunction = () => {
    working = true;
    return async ({ update }) => {
      await update({ reset: false });
      working = false;
    };
  };
</script>

<!-- Before the first reading a button at the title's end; after it a link with the AI icon, as Check again on a
     posting. The card shows what happens. -->
<form method="POST" action="?/readTrends" use:enhance={whileReading}>
  {#if checked}
    <button type="submit" class="link link-action check-link" disabled={working}>
      {#if working}
        <span class="spinner" aria-hidden="true"></span>
        {m.check_running()}
      {:else}
        <span class="icon icon-sm icon-lightbulb" aria-hidden="true"></span>
        {m.check_again()}
      {/if}
    </button>
  {:else}
    <button type="submit" class="btn btn-secondary btn-sm" disabled={working}>
      {#if working}
        <span class="spinner" aria-hidden="true"></span>
        {m.check_running()}
      {:else}
        {m.check_now()}
      {/if}
    </button>
  {/if}
</form>

<style>
  form {
    display: inline;
    margin: 0;
  }

  /* The same size as the meta line it sits on */
  .check-link {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    font-size: inherit;
  }
</style>
