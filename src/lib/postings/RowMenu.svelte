<script lang="ts">
  import type { Snippet } from 'svelte';
  import { m } from '#lib/paraglide/messages.js';

  interface Props {
    /** The row's posting, for the menu's id and its name for screen readers. */
    postingId: string;
    title: string;
    /** The tab's actions, as menu items. */
    items: Snippet;
  }

  let { postingId, title, items }: Props = $props();

  let button = $state<HTMLButtonElement>();
  let menu = $state<HTMLDivElement>();

  const menuId = $derived(`row-menu-${postingId}`);

  /** Under its button, end-aligned (app.css leaves placing a menu to the app). */
  function place(event: ToggleEvent) {
    if (event.newState !== 'open' || !button || !menu) return;
    const anchor = button.getBoundingClientRect();
    menu.style.top = `${anchor.bottom}px`;
    menu.style.left = `${Math.max(0, anchor.right - menu.offsetWidth)}px`;
  }

  // Any item chosen closes the menu (the items are the tab's own forms and links)
  function onclick(event: MouseEvent) {
    if (event.target instanceof Element && event.target.closest('.menu-item')) menu?.hidePopover();
  }
</script>

<!-- Every action of a row in one place, the same in every tab: the menu at the row's end -->
<!-- Three dots stacked, not side by side: in a row they read as a minus to someone who doesn't see well -->
<span class="has-tooltip tooltip-end">
  <button type="button" class="btn btn-ghost btn-icon btn-sm" aria-label={m.row_actions({ title })} popovertarget={menuId} bind:this={button}>
    <span class="icon icon-dots-three-circle-vertical" aria-hidden="true"></span>
  </button>
  <span class="tooltip" aria-hidden="true">{m.posting_more()}</span>
</span>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class="menu" id={menuId} popover="auto" role="menu" tabindex="-1" bind:this={menu} ontoggle={place} {onclick}>
  {@render items()}
</div>

<style>
  .menu {
    margin-top: var(--space-1);
  }

  /* a menu item that is a button (or a form's button) fills its row */
  .menu :global(.menu-item) {
    width: 100%;
    text-align: start;
  }
</style>
