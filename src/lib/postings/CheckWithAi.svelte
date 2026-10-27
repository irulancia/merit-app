<script lang="ts">
  import { enhance } from '$app/forms';
  import { m } from '#lib/paraglide/messages.js';

  interface Props {
    /** Already checked once: the button offers to check again. */
    checked: boolean;
    /** True while the engine reads the posting, so the panel can say so. */
    checking?: boolean;
    /** A link with the AI icon instead of a button: on the line that says who checked it. */
    asLink?: boolean;
  }

  let { checked, checking = $bindable(false), asLink = false }: Props = $props();
  const label = $derived(checked ? m.check_again() : m.check_now());
</script>

<!-- Only the button: it sits at the end of the panel's title row; the panel shows what happens -->
<form
  method="POST"
  action="?/check"
  use:enhance={() => {
    checking = true;
    return async ({ update }) => {
      await update({ reset: false });
      checking = false;
    };
  }}
>
  {#if asLink}
    <button type="submit" class="link link-action check-link" disabled={checking}>
      {#if checking}
        <span class="spinner" aria-hidden="true"></span>
        {m.check_running()}
      {:else}
        <span class="icon icon-sm icon-lightbulb" aria-hidden="true"></span>
        {label}
      {/if}
    </button>
  {:else}
    <button type="submit" class="btn btn-secondary btn-sm" disabled={checking}>
      {#if checking}
        <span class="spinner" aria-hidden="true"></span>
        {m.check_running()}
      {:else}
        {label}
      {/if}
    </button>
  {/if}
</form>

<style>
  form {
    display: inline;
    margin: 0;
  }

  /* A link that sends the form: the icon and its words on one line */
  /* The same size as the meta line it sits on */
  .check-link {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    font-size: inherit;
  }
</style>
