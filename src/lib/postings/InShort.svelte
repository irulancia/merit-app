<script lang="ts">
  import { m } from '#lib/paraglide/messages.js';
  import type { PostingSummaryLines } from './types.js';

  interface Props {
    summary: PostingSummaryLines;
  }

  let { summary }: Props = $props();

  // Always the same order — the role, the place, worth knowing — so postings read alike; a line the posting
  // says nothing about is left out (without labels, "not said" on its own would mean nothing)
  const lines = $derived([summary.role, summary.place, summary.note].filter((line) => line.length > 0));
</script>

{#if lines.length > 0}
  <section class="card" aria-labelledby="in-short">
    <h2 id="in-short">{m.in_short_title()}</h2>
    {#each lines as line, index (index)}
      <p>{line}</p>
    {/each}
  </section>
{/if}

<style>
  h2,
  p {
    margin: 0;
  }

  p {
    color: var(--text-secondary);
  }
</style>
