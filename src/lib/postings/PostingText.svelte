<script lang="ts">
  import { m } from '#lib/paraglide/messages.js';

  interface Props {
    text: string;
  }

  let { text }: Props = $props();

  let expanded = $state(false);
  let body = $state<HTMLDivElement>();
  // Whether the text runs past the lines shown: only then is there something to read more of
  let overflows = $state(false);

  $effect(() => {
    if (!body || expanded) return;
    void text;
    overflows = body.scrollHeight > body.clientHeight + 1;
  });
</script>

<section class="card" aria-labelledby="full-posting">
  <div class="card-header">
    <h2 id="full-posting">{m.posting_full()}</h2>
    <span class="card-meta">{m.posting_kept_here()}</span>
  </div>
  <!-- Plain text, never HTML: the posting is shown exactly as pasted -->
  <div class="posting-text" class:is-clamped={!expanded} bind:this={body} id="posting-text">{text}</div>
  {#if overflows || expanded}
    <button type="button" class="link link-action toggle" aria-expanded={expanded} aria-controls="posting-text" onclick={() => (expanded = !expanded)}>
      {expanded ? m.posting_show_less() : m.posting_read_more()}
    </button>
  {/if}
</section>

<style>
  h2 {
    margin: 0;
  }

  .posting-text {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    line-height: var(--leading-loose);
    color: var(--text-secondary);
  }

  /* The opening lines only, until "Read more" */
  .posting-text.is-clamped {
    display: -webkit-box;
    -webkit-line-clamp: 6;
    line-clamp: 6;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .toggle {
    align-self: flex-start;
  }
</style>
