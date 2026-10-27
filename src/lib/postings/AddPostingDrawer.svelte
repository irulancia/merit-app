<script lang="ts">
  import { resolve } from '$app/paths';
  import { m } from '#lib/paraglide/messages.js';
  import AddPostingForm, { type Added } from './AddPostingForm.svelte';
  import { readCheckPreference, rememberCheckPreference } from './check-preference.js';
  import { checkFailureText } from './format.js';

  interface Props {
    canCheck: boolean;
  }

  let { canCheck }: Props = $props();

  let drawer = $state<HTMLDialogElement>();
  let saving = $state(false);
  let checkNow = $state(readCheckPreference());
  // What was added while the drawer was open, newest first: it stays open for the next one
  let added = $state<Added[]>([]);

  export function open() {
    added = [];
    drawer?.showModal();
  }

  function note(item: Added): string {
    if (item.linkUnread) return m.added_note_link_unread();
    const failure = checkFailureText(item.check);
    if (failure) return m.added_note_not_checked({ reason: failure });
    return (item.check as { checked?: boolean } | null)?.checked ? m.added_note_checked() : m.added_note_saved();
  }
</script>

<dialog class="drawer add-drawer" bind:this={drawer} aria-labelledby="add-drawer-title">
  <div class="dialog-header">
    <h2 id="add-drawer-title">{m.add_title()}</h2>
    <span class="has-tooltip tooltip-end">
      <button type="button" class="btn btn-ghost btn-icon dialog-close" aria-label={m.add_drawer_close()} onclick={() => drawer?.close()}>
        <span class="icon icon-x-circle" aria-hidden="true"></span>
      </button>
      <span class="tooltip" aria-hidden="true">{m.add_drawer_close()}</span>
    </span>
  </div>

  <div class="dialog-body stack-lg">
    <AddPostingForm id="add-posting-form" bind:saving onadded={(item) => (added = [item, ...added])} />

    {#if added.length > 0}
      <section class="stack-sm" aria-labelledby="added-title" aria-live="polite">
        <h3 class="text-overline" id="added-title">{m.added_title({ count: added.length })}</h3>
        <ul class="list">
          {#each added as item (item.id)}
            <li class="list-item">
              <div class="list-item-main">
                <a class="list-item-title link link-action" href={resolve('/postings/[id]', { id: item.id })} onclick={() => drawer?.close()}>{item.title}</a>
                <span class="list-item-meta">{note(item)}</span>
              </div>
            </li>
          {/each}
        </ul>
      </section>
    {/if}
  </div>

  <div class="dialog-footer add-footer">
    <!-- The switch beside the button it changes, in the footer that never scrolls: in the form it went out of sight
         under a long pasted posting, and was forgotten. It still belongs to the form (form=…). -->
    {#if canCheck}
      <label class="switch">
        <input type="checkbox" name="check" form="add-posting-form" bind:checked={checkNow} onchange={() => rememberCheckPreference(checkNow)} />
        {m.add_check_switch()}
      </label>
    {/if}
    <!-- The action that moves on; the × closes the drawer (a footer "Done" next to it did nothing of its own) -->
    <button type="submit" form="add-posting-form" class="btn btn-primary" disabled={saving}>
      {#if saving}
        <span class="spinner" aria-hidden="true"></span>
        {canCheck && checkNow ? m.add_checking() : m.add_saving()}
      {:else}
        {canCheck && checkNow ? m.add_save_and_check() : m.add_save()}
      {/if}
    </button>
  </div>
</dialog>

<style>
  /* Wider than app.css's drawer: a posting's text needs room (the width of a large dialog) */
  .add-drawer {
    width: min(40rem, 100%);
  }

  /* min-height: 0 lets the body shrink and scroll by itself; without it the whole drawer scrolled, its title with it */
  .add-drawer .dialog-body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }

  /* the switch at the start, the button at the end; on a narrow drawer the button wraps under */
  .add-footer {
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-2) var(--space-3);
  }

  h2,
  h3 {
    margin: 0;
  }
</style>
