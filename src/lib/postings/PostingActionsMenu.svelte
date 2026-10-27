<script lang="ts">
  import type { Snippet } from 'svelte';
  import { enhance, type SubmitFunction } from '$app/forms';
  import SplitButton from '#lib/components/SplitButton.svelte';
  import { offerUndoMove } from '#lib/applications/undo.svelte.js';
  import { hasApplied } from '#lib/applications/types.js';
  import { m } from '#lib/paraglide/messages.js';
  import { VIEWS, type View } from './list.js';
  import type { PostingPlace } from './place.js';
  import { VIEW_NAMES } from './view-text.js';

  interface Props {
    postingId: string;
    /** The tab it is in now: Move to offers the others. */
    view: View;
    /** Tabs a button on the page already leads to (Want to apply, Consider it anyway): the menu doesn't repeat them. */
    shownElsewhere?: View[];
    place: PostingPlace;
    /** Closed asks how it ended, in the close dialog the page holds. */
    onclose: () => void;
    ondelete: () => void;
    /** The page's next step (Want to apply, Mark as applied, Mark as closed…), joined to the menu as one button */
    main?: Snippet;
  }

  let { postingId, view, shownElsewhere = [], place, onclose, ondelete, main }: Props = $props();

  const MENU_ID = 'posting-actions-menu';

  // An icon for each tab, so the targets read at a glance
  const VIEW_ICONS: Record<View, string> = {
    considering: 'icon-funnel',
    applying: 'icon-briefcase',
    closed: 'icon-check-square',
    notSure: 'icon-archive'
  };

  const applied = $derived(place.application !== null && place.application.stage !== 'closed' && hasApplied(place.application));
  const targets = $derived(VIEWS.filter((target) => target !== view && !shownElsewhere.includes(target)));

  /** A move, with Undo for a few seconds: it puts the posting back where it was. */
  function withUndo(message: () => string): SubmitFunction {
    return () => {
      const previous = place;
      return async ({ result, update }) => {
        await update({ reset: false });
        if (result.type === 'success') offerUndoMove(message(), postingId, previous);
      };
    };
  }
</script>

<!-- The next step and, joined to it, everything else: one split button -->
{#snippet items()}
  <!-- The pair of Mark as applied, for a click by mistake -->
  {#if applied}
    <form method="POST" action="?/apply" use:enhance={withUndo(() => m.undo_not_applied_yet())}>
      <input type="hidden" name="stage" value="want" />
      <button type="submit" class="menu-item" role="menuitem">
        <span class="menu-item-label">
          <span class="icon icon-arrow-circle-left" aria-hidden="true"></span>
          {m.apply_not_applied_yet()}
        </span>
      </button>
    </form>
    <div class="menu-separator" role="separator"></div>
  {/if}

  <!-- Every other tab, by name: the posting goes where it says -->
  <span class="text-overline group-label" aria-hidden="true">{m.posting_move_to()}</span>
  {#each targets as target (target)}
    {#if target === 'closed'}
      <button
        type="button"
        class="menu-item"
        role="menuitem"
        aria-label={m.posting_move_to_named({ view: VIEW_NAMES[target]() })}
        onclick={onclose}
      >
        <span class="menu-item-label">
          <span class="icon {VIEW_ICONS[target]}" aria-hidden="true"></span>
          {VIEW_NAMES[target]()}…
        </span>
      </button>
    {:else}
      <form method="POST" action="?/moveTo" use:enhance={withUndo(() => m.undo_moved_to({ view: VIEW_NAMES[target]() }))}>
        <input type="hidden" name="to" value={target} />
        <button type="submit" class="menu-item" role="menuitem" aria-label={m.posting_move_to_named({ view: VIEW_NAMES[target]() })}>
          <span class="menu-item-label">
            <span class="icon {VIEW_ICONS[target]}" aria-hidden="true"></span>
            {VIEW_NAMES[target]()}
          </span>
        </button>
      </form>
    {/if}
  {/each}

  <div class="menu-separator" role="separator"></div>
  <button
    type="button"
    class="menu-item is-destructive"
    role="menuitem"
    onclick={ondelete}
  >
    <span class="menu-item-label">
      <span class="icon icon-trash" aria-hidden="true"></span>
      {m.posting_delete()}…
    </span>
  </button>
{/snippet}

<SplitButton {main} {items} label={m.posting_more()} menuId={MENU_ID} variant={main ? 'primary' : 'secondary'} />

<style>
  /* "Move to", over the tabs it offers */
  .group-label {
    display: block;
    padding: var(--space-1) var(--space-3) 0;
  }
</style>
