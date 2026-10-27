<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    /** The main action: a `.btn` (or a form holding one). Without it, the menu button stands alone, with its label. */
    main?: Snippet;
    /** The menu's items. */
    items: Snippet;
    /** The menu button's name: said to screen readers beside the caret, shown in words when it stands alone. */
    label: string;
    /** The kind of button, the same for both halves so they read as one. */
    variant?: 'primary' | 'secondary';
    /** .btn-sm, for a card's actions. */
    small?: boolean;
    disabled?: boolean;
    menuId: string;
  }

  let { main, items, label, variant = 'primary', small = false, disabled = false, menuId }: Props = $props();

  let caret = $state<HTMLButtonElement>();
  let menu = $state<HTMLDivElement>();

  /** Under the button, end-aligned (app.css leaves placing a menu to the app). */
  function place(event: ToggleEvent) {
    if (event.newState !== 'open' || !caret || !menu) return;
    const anchor = caret.getBoundingClientRect();
    menu.style.top = `${anchor.bottom}px`;
    menu.style.left = `${Math.max(0, anchor.right - menu.offsetWidth)}px`;
  }

  // Any item chosen closes the menu
  function onclick(event: MouseEvent) {
    if (event.target instanceof Element && event.target.closest('.menu-item')) menu?.hidePopover();
  }
</script>

<!-- A split button: the main action and, joined to it, a caret
     that opens the rest — one shape, one kind, so the step and its alternatives read together. Built on .btn; where
     the halves meet, their own outlines make the dividing line. -->
<div class="split" class:is-alone={!main}>
  {@render main?.()}
  <button type="button" class="btn btn-{variant} caret" class:btn-icon={!!main} class:btn-sm={small} {disabled} aria-label={main ? label : undefined} popovertarget={menuId} bind:this={caret}>
    {#if !main}{label}{/if}
    <span class="chevron" aria-hidden="true"></span>
  </button>
</div>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class="menu" id={menuId} popover="auto" role="menu" tabindex="-1" bind:this={menu} ontoggle={place} {onclick}>
  {@render items()}
</div>

<style>
  .split {
    display: inline-flex;
    gap: var(--space-0);
  }

  /* The halves meet as one shape: square where they touch (a .btn-group's slight rounding left a notch between thick
     outlines), and one dividing line — the main half's own end; the caret drops its start, so the line isn't doubled */
  .split:not(.is-alone) > :global(:first-child.btn),
  .split:not(.is-alone) > :global(:first-child) > :global(.btn) {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }

  .split:not(.is-alone) .caret {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    border-left-width: 0;
  }

  /* The design system's own "opens a list" sign, as on every select (.field-select::after): a plain chevron, no
     circle — in the button's own colour */
  .chevron {
    width: var(--space-1);
    height: var(--space-1);
    border: solid currentColor;
    border-width: 0 2px 2px 0;
    transform: translateY(-25%) rotate(45deg);
  }

  .menu {
    margin-top: var(--space-1);
  }

  /* a menu item that is a button (or a form's button) fills its row */
  .menu :global(.menu-item) {
    width: 100%;
    text-align: start;
  }
</style>
