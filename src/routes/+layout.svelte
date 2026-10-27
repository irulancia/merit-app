<script lang="ts">
  import '../project.css';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { m } from '#lib/paraglide/messages.js';
  import UndoToast from '#lib/applications/UndoToast.svelte';
  import type { LayoutProps } from './$types';

  let { children, data }: LayoutProps = $props();

  interface NavItem {
    href: string;
    icon: string;
    label: () => string;
    count: number | null;
    countLabel: (count: number) => string;
  }

  // The daily work on top; everything about the user and the app grouped under Settings, its pages listed
  // beneath its heading: the criteria, what the user brings, the AI engine.
  const WORK: NavItem[] = $derived([
    {
      href: resolve('/dashboard'),
      icon: 'icon-squares-four',
      label: () => m.nav_dashboard(),
      count: null,
      countLabel: (count: number) => String(count)
    },
    {
      href: resolve('/postings'),
      icon: 'icon-newspaper',
      label: () => m.nav_postings(),
      count: data.postingsCount,
      countLabel: (count: number) => m.nav_postings_count({ count })
    }
  ]);
  const SETTINGS: NavItem[] = $derived([
    {
      href: resolve('/settings/criteria'),
      icon: 'icon-funnel',
      label: () => m.nav_criteria(),
      count: data.criteriaInUse,
      countLabel: (count: number) => m.nav_criteria_count({ count })
    },
    {
      href: resolve('/settings/profile'),
      icon: 'icon-user-circle',
      label: () => m.nav_profile(),
      count: null,
      countLabel: (count: number) => String(count)
    },
    {
      href: resolve('/settings/ai'),
      icon: 'icon-lightbulb',
      label: () => m.nav_ai(),
      count: null,
      countLabel: (count: number) => String(count)
    }
  ]);
</script>

{#snippet navItem(item: NavItem)}
  {@const active = page.url.pathname.startsWith(item.href)}
  <a class="sidebar-item" class:is-active={active} href={item.href} aria-current={active ? 'page' : undefined}>
    <span class="icon {item.icon}" aria-hidden="true"></span>
    {item.label()}
    {#if item.count}
      <span class="badge badge-count" aria-hidden="true">{item.count}</span>
      <span class="sr-only">{item.countLabel(item.count)}</span>
    {/if}
  </a>
{/snippet}

<svelte:head>
  <title>Merit</title>
</svelte:head>

<div class="app-shell">
  <nav class="sidebar" aria-label={m.nav_label()}>
    <a class="navbar-brand brand" href={resolve('/')}>merit</a>
    {#each WORK as item (item.href)}
      {@render navItem(item)}
    {/each}
    <span class="sidebar-heading" id="nav-settings">{m.nav_settings()}</span>
    <div class="nav-group" role="group" aria-labelledby="nav-settings">
      {#each SETTINGS as item (item.href)}
        {@render navItem(item)}
      {/each}
    </div>
    <div class="local">
      <span class="local-title">{m.local_title()}</span>
      <span class="text-small text-muted">{m.local_data_folder()}</span>
      <code>{data.dataDir}</code>
    </div>
  </nav>
  <main class="app-main">
    {@render children()}
  </main>
</div>

<!-- The one place a move can be taken back from, whichever page made it -->
<UndoToast />

<style>
  /* This project's shell: the sidebar is a full-height column against the left edge, not app.css's floating card.
     The page scrolls beside it; the shell keeps its gap, and main gets the padding the shell gave up. */
  .app-shell {
    padding: 0;
    align-items: stretch;
  }

  .sidebar {
    position: sticky;
    top: 0;
    height: 100dvh;
    overflow-y: auto;
    padding: var(--space-4) var(--space-3);
    border-width: 0 1px 0 0;
    border-radius: 0;
  }

  .app-main {
    padding: var(--space-5) var(--space-5) var(--space-5) 0;
  }

  /* app.css's wordmark (display font, uppercase), with wider tracking and a lighter colour */
  .brand {
    align-self: flex-start;
    padding: 0 var(--space-3) var(--space-4);
    letter-spacing: calc(var(--tracking-wordmark) * 2.4);
    /* lighter than any text token: a logotype is exempt from the 4.5:1 text contrast (WCAG 1.4.3); --secondary-ui keeps 3:1 */
    color: var(--secondary-ui);
  }

  /* On a phone the column becomes a band across the top, and main gets its side padding back */
  @media (max-width: 48rem) {
    .sidebar {
      position: static;
      height: auto;
      border-width: 0 0 1px;
    }

    .app-main {
      padding: var(--space-4) var(--space-3);
    }
  }

  /* The group's items keep the sidebar's own spacing between them */
  .nav-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .local {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    margin-top: auto;
    padding: var(--space-3) var(--space-3) var(--space-2);
    border-top: 1px solid var(--border-subtle);
  }

  .local-title {
    font-size: var(--text-small);
    font-weight: var(--weight-semibold);
  }

  .local code {
    align-self: flex-start;
    font-size: var(--text-xs);
    overflow-wrap: anywhere;
  }

  /* The sidebar grows to its widest item (app.css); a long data folder path must not be that item */
  .local {
    contain: inline-size;
  }
</style>
