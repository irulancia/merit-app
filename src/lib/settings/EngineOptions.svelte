<script lang="ts">
  import { m } from '#lib/paraglide/messages.js';
  import { untrack } from 'svelte';
  import OllamaDeleteDialog from './OllamaDeleteDialog.svelte';
  import OllamaDownloadDialog from './OllamaDownloadDialog.svelte';
  import OllamaSetup from './OllamaSetup.svelte';
  import { DownloadTracker } from './download-tracker.svelte.js';
  import type { DownloadState } from './ollama-download.js';

  interface Props {
    /** The version of Claude Code found on this computer; null when it isn't installed. */
    claudeVersion: string | null;
    /** The models Ollama has; null when it isn't running. */
    ollamaModels: string[] | null;
    /** Where the download of Ollama's model stood as the page loaded. */
    download: DownloadState;
    engine: string;
    ollamaModel: string;
  }

  let { claudeVersion, ollamaModels, download, engine = $bindable(), ollamaModel = $bindable() }: Props = $props();

  // Taken once: from then on the tracker asks Merit itself, every second while it downloads
  const tracker = new DownloadTracker(untrack(() => download));
  let downloadDialog = $state<OllamaDownloadDialog>();
  let deleteDialog = $state<OllamaDeleteDialog>();
  const GIGABYTE = 1e9;
  const downloadedSize = $derived(((tracker.state?.completed ?? 0) / GIGABYTE).toFixed(1));
  $effect(() => () => tracker.destroy());

  // claude --version answers "2.1.311 (Claude Code)": the column already says which it is
  const claudeNumber = $derived(claudeVersion?.split(' ')[0] ?? '');
  const ollamaReady = $derived(ollamaModels !== null && ollamaModels.length > 0);

  // The engines side by side, like plans on a pricing page: the cost under each name,
  // then what each does for you and what it takes, in words for someone who hasn't used Merit yet. A yes or no shows
  // its icon and says it
  type EngineId = 'claude-code' | 'ollama' | 'none';
  type Cell = { text: () => string; has?: boolean };
  type Row = { label: () => string; cells: Record<EngineId, Cell> };
  const yes = (text: () => string = m.compare_yes): Cell => ({ text, has: true });
  const no = (text: () => string = m.compare_no): Cell => ({ text, has: false });
  const says = (claude: () => string, ollama: () => string, none: () => string): Record<EngineId, Cell> => ({
    'claude-code': { text: claude },
    ollama: { text: ollama },
    none: { text: none }
  });
  const GROUPS: { title: () => string; rows: Row[] }[] = [
    {
      title: m.compare_group_does,
      rows: [
        { label: m.compare_check, cells: { 'claude-code': yes(m.compare_check_claude), ollama: yes(m.compare_check_ollama), none: no(m.compare_check_none) } },
        { label: m.compare_screenshots, cells: { 'claude-code': yes(), ollama: yes(), none: no() } },
        { label: m.compare_letters, cells: { 'claude-code': yes(), ollama: yes(), none: no() } },
        { label: m.compare_trends, cells: { 'claude-code': yes(), ollama: yes(), none: no() } },
        { label: m.compare_skills, cells: { 'claude-code': yes(), ollama: yes(), none: yes() } }
      ]
    },
    {
      title: m.compare_group_takes,
      rows: [
        { label: m.compare_data, cells: says(m.compare_data_claude, m.compare_data_ollama, m.compare_data_none) },
        { label: m.compare_limits, cells: says(m.compare_limits_claude, m.compare_limits_ollama, m.compare_limits_none) }
      ]
    }
  ];
  const ENGINES: EngineId[] = ['claude-code', 'ollama', 'none'];
</script>

{#snippet getLink(href: string, text: string)}
  <a class="link link-action" href={href} target="_blank" rel="noopener noreferrer">
    {text}<span class="icon icon-sm icon-arrow-square-out" aria-hidden="true"></span>
  </a>
{/snippet}

<!-- The engines as the columns of one table, each with its radio and whether it is ready here; the fields are named
     for the AI engine page's "save" action -->
<fieldset class="fieldset">
  <legend>{m.settings_engine_legend()}</legend>
  <div class="table-wrap">
    <table class="table compare">
      <thead>
        <tr>
          <td></td>
          <th scope="col" class:is-chosen={engine === 'claude-code'}>
            <div class="head">
              <label class="radio"><input type="radio" name="engine" value="claude-code" bind:group={engine} disabled={!claudeVersion} />{m.settings_claude_name()}</label>
              <span class="cost">{m.compare_cost_claude()}</span>
              {#if claudeVersion}
                <span class="ready">{m.settings_claude_found({ version: claudeNumber })}</span>
              {:else}
                <span class="reason">{m.settings_claude_missing()}</span>
                {@render getLink('https://claude.com/claude-code', m.settings_claude_get())}
              {/if}
            </div>
          </th>
          <th scope="col" class:is-chosen={engine === 'ollama'}>
            <div class="head">
              <label class="radio"><input type="radio" name="engine" value="ollama" bind:group={engine} disabled={!ollamaReady} />{m.settings_ollama_name()}</label>
              <span class="cost">{m.compare_cost_free()}</span>
              {#if ollamaModels === null}
                <span class="reason">{m.settings_ollama_not_running()}</span>
                {@render getLink('https://ollama.com', m.settings_ollama_get())}
              {:else if ollamaModels.length === 0}
                <OllamaSetup download={tracker} onrequest={() => downloadDialog?.open()} ondelete={() => deleteDialog?.open()} />
              {:else}
                <span class="ready">{m.settings_ollama_found({ count: ollamaModels.length })}</span>
              {/if}
            </div>
          </th>
          <th scope="col" class:is-chosen={engine === 'none'}>
            <div class="head">
              <label class="radio"><input type="radio" name="engine" value="none" bind:group={engine} />{m.settings_none_name()}</label>
              <span class="cost">{m.compare_cost_free()}</span>
              <span class="ready">{m.settings_none_ready()}</span>
            </div>
          </th>
        </tr>
      </thead>
      {#each GROUPS as group (group.title)}
        <tbody>
          <!-- The group's name, its cells left empty so the chosen column's tint runs on unbroken -->
          <tr class="group">
            <th scope="rowgroup" class="text-overline">{group.title()}</th>
            {#each ENGINES as id (id)}
              <td class:is-chosen={engine === id}></td>
            {/each}
          </tr>
          {#each group.rows as row (row.label)}
          <tr>
            <th scope="row">{row.label()}</th>
            {#each ENGINES as id (id)}
              {@const cell = row.cells[id]}
              <td class:is-chosen={engine === id}>
                <span class="cell">
                  {#if cell.has !== undefined}
                    <!-- The default size: as tall as a line of the cell's text, so it sits level with the first line -->
                    <span class="icon {cell.has ? 'icon-check-circle has' : 'icon-x-circle'}" aria-hidden="true"></span>
                  {/if}
                  {cell.text()}
                </span>
              </td>
            {/each}
          </tr>
          {/each}
        </tbody>
      {/each}
    </table>
  </div>
</fieldset>

<!-- Outside the table, so the dialogs don't take its header's small, bold text -->
<OllamaDownloadDialog bind:this={downloadDialog} onconfirm={tracker.start} />
<OllamaDeleteDialog bind:this={deleteDialog} size={downloadedSize} onconfirm={tracker.discard} />

{#if engine === 'ollama' && ollamaReady}
  <div class="field field-select">
    <select id="ollama-model" name="ollamaModel" bind:value={ollamaModel}>
      {#each ollamaModels ?? [] as model (model)}
        <option value={model}>{model}</option>
      {/each}
    </select>
    <label for="ollama-model">{m.settings_ollama_model()}</label>
  </div>
  <p class="text-small text-muted">{m.settings_ollama_model_hint()}</p>
{:else}
  <input type="hidden" name="ollamaModel" value={ollamaModel} />
{/if}

<style>
  p {
    margin: 0;
  }

  /* The row names take a fixed share; the engines split the rest evenly */
  .compare {
    table-layout: fixed;
  }

  /* A row here isn't something to click: no hover, which also cut the chosen column's tint in two */
  .compare tbody tr:hover {
    background: transparent;
  }

  .compare thead td,
  .compare tbody th {
    width: 28%;
  }

  /* Each engine's head: its radio, then whether it is ready here and where to get it */
  .compare thead th {
    vertical-align: top;
    white-space: normal;
  }

  .head {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-1);
  }

  /* Ready to use: the same small line as the other states, in green, no badge */
  .ready {
    font-size: var(--text-small);
    font-weight: var(--weight-regular);
    color: var(--success-text);
  }

  .cost {
    font-size: var(--text-small);
    font-weight: var(--weight-semibold);
    color: var(--text-primary);
  }

  .head .radio {
    font-size: var(--text-ui);
    font-weight: var(--weight-semibold);
    color: var(--text-primary);
  }

  /* Compact rows, to scan: a row's name lines up with its cells */
  .compare tbody th,
  .compare td {
    padding: var(--space-2) var(--space-3);
  }

  .compare tbody th {
    border-bottom: 1px solid var(--border-subtle);
    white-space: normal;
    font-size: var(--text-small);
    font-weight: var(--weight-semibold);
    color: var(--text-secondary);
    text-align: left;
    vertical-align: top;
  }

  .compare tbody tr:last-child th {
    border-bottom: 0;
  }

  /* A group's name: an overline, with room above it to set the groups apart */
  .compare .group :is(th, td) {
    padding-top: var(--space-4);
    border-bottom: 0;
  }

  .compare .group th {
    font-size: var(--text-xs);
    color: var(--text-label);
  }

  .compare td {
    vertical-align: top;
  }

  /* The chosen engine's whole column is tinted, as a chosen plan */
  .compare .is-chosen {
    background: var(--accent-bg-subtle);
  }

  .cell {
    display: inline-flex;
    align-items: flex-start;
    gap: var(--space-1);
  }

  /* A no in red, a yes in green: the icon's colour beside the word, never alone */
  .cell .icon {
    flex-shrink: 0;
    color: var(--error);
  }

  .cell .icon.has {
    color: var(--success);
  }
</style>
