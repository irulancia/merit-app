<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    /** Why it is in Not sure, or would be: a miss on a non-negotiable, or the user's own mark. */
    title: string;
    /** The second line: which criterion, or the user's reason. */
    line: Snippet;
    /** The one link that follows where the posting is (none once applying). */
    action?: Snippet;
    /** The reason's icon, as on the rows: a Miss's for Merit's move, the archive for the user's own. */
    icon?: string;
  }

  let { title, line, action, icon = 'icon-prohibit' }: Props = $props();
</script>

<!-- One box for every reason a posting is in Not sure: the same red and three lines (what, which, the link),
     so the reason is the only thing that changes. The two lines read together, the link a step apart. -->
<div class="alert alert-error not-sure-box">
  <span class="icon {icon}" aria-hidden="true"></span>
  <div class="alert-body">
    <div class="what">
      <span class="alert-title">{title}</span>
      {@render line()}
    </div>
    <!-- In a block of its own, so the link keeps its own width at the start, not stretched (and centred) across -->
    {#if action}<div>{@render action()}</div>{/if}
  </div>
</div>

<style>
  .not-sure-box .alert-body {
    gap: var(--space-2);
  }

  .what {
    display: flex;
    flex-direction: column;
  }

  /* The box's links in its own red (it carries 4.5:1 on the tint), underlined on hover like any link */
  .not-sure-box :global(.link) {
    color: inherit;
  }
</style>
