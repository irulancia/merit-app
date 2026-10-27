<script lang="ts">
  import { enhance } from '$app/forms';
  import { m } from '#lib/paraglide/messages.js';
  import type { MarkSource } from './facts.js';
  import type { FindOut } from './find-out.js';
  import { VERDICT_LOOK } from './verdict-look.js';
  import { MARKS, type Mark } from './types.js';

  interface Props {
    criterionId: string;
    label: string;
    mark: Mark | undefined;
    reason: string | undefined;
    source: MarkSource | null;
    /** Merit compares this one from the posting's facts: a verdict set by hand can go back to Merit's. */
    compared: boolean;
    /** A Non-negotiable: a miss filters the posting out. */
    must: boolean;
    /** While it is not mentioned: the question to ask, or where to look it up. */
    findOut: FindOut;
  }

  let { criterionId, label, mark, reason, source, compared, must, findOut }: Props = $props();

  let button = $state<HTMLButtonElement>();
  let menu = $state<HTMLDivElement>();
  // While a choice is saved, the row already shows it
  let pending = $state<Mark | 'clear' | null>(null);

  const shown = $derived(pending === null ? mark : pending === 'clear' ? undefined : pending);
  const look = $derived(VERDICT_LOOK[shown ?? 'unmarked']);
  const menuId = $derived(`verdict-menu-${criterionId}`);

  /** Under its button, end-aligned (app.css leaves placing a menu to the app). */
  function place(event: ToggleEvent) {
    if (event.newState !== 'open' || !button || !menu) return;
    const anchor = button.getBoundingClientRect();
    menu.style.top = `${anchor.bottom}px`;
    menu.style.left = `${Math.max(0, anchor.right - menu.offsetWidth)}px`;
  }
</script>

<!-- Only the verdict carries colour; who gave it and why sit quietly under the criterion -->
<li class="verdict-row">
  <div class="text">
    <span class="name">
      {label}
      {#if must}<span class="level text-small">· {m.level_must()}</span>{/if}
    </span>
    <!-- Why the verdict is what it is; and, only when the user changed it, that they did — no label otherwise -->
    {#if pending === null && source === 'you'}
      <span class="why text-small"><span class="source">{m.source_you()}</span></span>
    {:else if pending === null && reason}
      <span class="why text-small">{reason}</span>
    {/if}
    <!-- Not mentioned: what to do about it, right where the verdict is changed once the user knows -->
    {#if shown === 'unmentioned' && findOut?.kind === 'ask'}
      <span class="find-out text-small"><span class="find-out-kind">{m.find_out_ask()}</span> {findOut.question}</span>
    {:else if shown === 'unmentioned' && findOut?.kind === 'lookUp'}
      <span class="find-out text-small">
        <span class="find-out-kind">{m.find_out_look_up()}</span>
        <a class="link link-action" href={findOut.href} target="_blank" rel="noopener noreferrer">
          {m.find_out_search({ query: findOut.query })}<span class="icon icon-sm icon-arrow-square-out" aria-hidden="true"></span>
        </a>
      </span>
    {/if}
  </div>
  <!-- The verdict's icon is the way to change it: a click opens the three verdicts (the group's heading says the
       current one in words; the button's name says it for screen readers) -->
  <span class="has-tooltip tooltip-end">
    <button
      type="button"
      class="btn btn-ghost btn-icon verdict is-{shown ?? 'unmarked'}"
      aria-label={m.verdict_change({ criterion: label, verdict: look.label() })}
      popovertarget={menuId}
      bind:this={button}
    >
      <span class="icon icon-lg {look.icon}" aria-hidden="true"></span>
    </button>
    <span class="tooltip" aria-hidden="true">{m.verdict_change_tooltip()}</span>
  </span>
  <div class="menu" id={menuId} popover="auto" role="menu" bind:this={menu} ontoggle={place}>
    <form
      method="POST"
      action="?/mark"
      use:enhance={({ submitter }) => {
        const value = submitter?.getAttribute('value');
        pending = value === 'clear' || MARKS.some((option) => option === value) ? (value as Mark | 'clear') : null;
        menu?.hidePopover();
        return async ({ update }) => {
          await update({ reset: false });
          pending = null;
        };
      }}
    >
      <input type="hidden" name="criterion" value={criterionId} />
      {#each MARKS as option (option)}
        <button type="submit" name="mark" value={option} class="menu-item verdict-option is-{option}" role="menuitemradio" aria-checked={shown === option}>
          <span class="menu-item-label">
            <span class="icon {VERDICT_LOOK[option].icon}" aria-hidden="true"></span>
            {VERDICT_LOOK[option].label()}
          </span>
          {#if shown === option}<span class="icon icon-sm icon-check-circle current" aria-hidden="true"></span>{/if}
        </button>
      {/each}
      {#if source === 'you' && compared}
        <div class="menu-separator" role="separator"></div>
        <button type="submit" name="mark" value="clear" class="menu-item" role="menuitem">
          <span class="menu-item-label">
            <span class="icon icon-arrow-circle-left" aria-hidden="true"></span>
            {m.verdict_back_to_merit()}
          </span>
        </button>
      {/if}
    </form>
  </div>
</li>

<style>
  .verdict-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding-block: var(--space-3);
    border-top: 1px solid var(--border-subtle);
  }

  .text {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    min-width: 0;
  }

  .name {
    font-weight: var(--weight-medium);
  }

  .level {
    font-weight: var(--weight-regular);
    color: var(--text-secondary);
  }

  .why {
    color: var(--text-secondary);
  }

  /* What to do next reads as the row's own text, led by a quiet label (Ask, Look it up) */
  .find-out {
    color: var(--text-primary);
  }

  .find-out-kind {
    font-weight: var(--weight-semibold);
    color: var(--text-label);
  }

  /* Inline, not a flex box: a search that wraps kept its icon at the box's far edge, away from the words; inline, it
     follows the last word */
  .find-out .link {
    display: inline;
  }

  .find-out .link .icon {
    margin-left: var(--space-1);
    vertical-align: middle;
  }

  .source {
    font-weight: var(--weight-semibold);
    color: var(--text-label);
  }

  .has-tooltip {
    flex-shrink: 0;
  }

  .verdict.is-pass,
  .verdict-option.is-pass .icon {
    color: var(--success-strong);
  }

  .verdict.is-unmentioned,
  .verdict-option.is-unmentioned .icon {
    color: var(--secondary-text);
  }

  .verdict.is-unmarked {
    color: var(--text-label);
  }

  .verdict.is-miss,
  .verdict-option.is-miss .icon {
    color: var(--error-strong);
  }

  /* a little air between the button and the menu under it */
  .menu {
    margin-top: var(--space-1);
  }

  /* a menu item that is a button fills its row; the current verdict is ticked at its end */
  .menu-item {
    width: 100%;
    text-align: start;
  }

  .current {
    margin-left: auto;
    color: var(--text-label);
  }
</style>
