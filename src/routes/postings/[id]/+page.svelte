<script lang="ts">
  import { resolve } from '$app/paths';
  import ApplyControl from '#lib/applications/ApplyControl.svelte';
  import CloseDialog from '#lib/applications/CloseDialog.svelte';
  import FeedbackCard from '#lib/applications/FeedbackCard.svelte';
  import { ASK_FEEDBACK_REASONS, hasApplied } from '#lib/applications/types.js';
  import { m } from '#lib/paraglide/messages.js';
  import AddTextCard from '#lib/postings/AddTextCard.svelte';
  import CoverLetter from '#lib/postings/CoverLetter.svelte';
  import DeletePostingDialog from '#lib/postings/DeletePostingDialog.svelte';
  import FitPanel from '#lib/postings/FitPanel.svelte';
  import PostingActionsMenu from '#lib/postings/PostingActionsMenu.svelte';
  import PostingText from '#lib/postings/PostingText.svelte';
  import InShort from '#lib/postings/InShort.svelte';
  import InterviewCard from '#lib/interview/InterviewCard.svelte';
  import SkillsFit from '#lib/profile/SkillsFit.svelte';
  import { currentMarks } from '#lib/postings/facts.js';
  import { computeFit, isFilteredOut } from '#lib/postings/fit.js';
  import { checkFailureText, displayTitle, postingSource } from '#lib/postings/format.js';
  import { viewOf } from '#lib/postings/list.js';
  import { placeOf } from '#lib/postings/place.js';
  import { VIEW_NAMES } from '#lib/postings/view-text.js';
  import TitleEditor from '#lib/postings/TitleEditor.svelte';
  import { isSafeLink } from '#lib/postings/validate.js';
  import type { PageProps } from './$types';

  let { data, form }: PageProps = $props();

  let deleteDialog = $state<DeletePostingDialog>();
  let closeDialog = $state<CloseDialog>();

  const posting = $derived(data.posting);
  // Checked again on display: a file edited by hand must not turn into a "javascript:" link
  const safeLink = $derived(posting.link && isSafeLink(posting.link) ? posting.link : null);
  const editError = $derived(form && 'editError' in form ? form.editError : null);
  // The title as one text, the company included; once the user has edited it, it is exactly what they wrote
  const shownTitle = $derived(displayTitle(posting));
  // The tab it is in, for the breadcrumb and the menu: worked out as the postings page does
  const filtered = $derived(isFilteredOut(computeFit(currentMarks(posting, data.settings), data.settings), posting.keptAnyway && !posting.archived));
  const view = $derived(viewOf(posting, filtered));
  // Moves a button on the page already offers, which the menu doesn't repeat: Want to apply, Consider it anyway,
  // Mark as closed once applied
  const shownElsewhere = $derived([
    ...(posting.application ? [] : (['applying'] as const)),
    ...(filtered && !posting.application ? (['considering'] as const) : []),
    ...(posting.application && hasApplied(posting.application) ? (['closed'] as const) : [])
  ]);
  // Closed: the next step is the feedback, asked for while it makes sense and none has come, else read or added
  const closed = $derived(posting.application?.stage === 'closed' ? posting.application : null);
  const askNext = $derived(closed !== null && !closed.feedback.trim() && closed.closedReason !== '' && ASK_FEEDBACK_REASONS.includes(closed.closedReason));
  const saveFailed =$derived(form !== null && form !== undefined && ('markFailed' in form || 'keepFailed' in form || 'moveFailed' in form));
</script>

<svelte:head>
  <title>{shownTitle} · Merit</title>
</svelte:head>

<div class="stack-lg">
  <!-- Where the posting sits: Postings, then the tab it is in (both links back); the title right below names the
       posting itself, so the trail doesn't repeat it -->
  <div class="stack-sm">
    <nav aria-label={m.posting_breadcrumb_label()}>
      <ol class="breadcrumb">
        <li><a href={resolve('/postings')}>{m.nav_postings()}</a></li>
        <li><a href="{resolve('/postings')}?view={view}">{VIEW_NAMES[view]()}</a></li>
      </ol>
    </nav>
    <hr class="separator" />
  </div>

  <header class="posting-header">
    <div class="identity">
      <TitleEditor title={shownTitle} failed={editError === 'title'} />
      <!-- Where it came from, when that says something (a site, a screenshot), not for text that was simply pasted;
           when it was added is the list's business, why it is in Not sure is How it fits' -->
      {#if posting.source !== 'text'}
        <div class="row status">
          <span class="meta">
            <span class="icon {posting.source === 'image' ? 'icon-image' : 'icon-link'}" aria-hidden="true"></span>{postingSource(posting)}
          </span>
        </div>
      {/if}
    </div>
    <div class="actions">
      {#if safeLink}
        <a class="btn btn-secondary" href={safeLink} target="_blank" rel="noopener noreferrer">
          <span class="icon icon-arrow-square-out" aria-hidden="true"></span>
          {m.posting_open_original()}
        </a>
      {/if}
      <!-- The next step and everything else, as one split button; a closed one's step is its feedback card -->
      {#snippet feedbackStep()}
        <a class="btn btn-primary" href="#feedback">
          <span class="icon {askNext ? 'icon-envelope-simple-open' : 'icon-chat-text'}" aria-hidden="true"></span>
          {askNext ? m.application_ask_feedback() : m.feedback_title()}
        </a>
      {/snippet}
      {#snippet nextStep()}
        <ApplyControl
          postingId={posting.id}
          place={placeOf(posting)}
          onclose={() => closeDialog?.open(posting.id, displayTitle(posting), placeOf(posting))}
        />
      {/snippet}
      <PostingActionsMenu
        postingId={posting.id}
        {view}
        {shownElsewhere}
        place={placeOf(posting)}
        main={closed ? feedbackStep : nextStep}
        onclose={() => closeDialog?.open(posting.id, displayTitle(posting), placeOf(posting))}
        ondelete={() => deleteDialog?.open()}
      />
    </div>
  </header>

  {#if form && 'deleteFailed' in form}
    <div class="alert alert-error" role="alert">
      <span class="icon icon-x-circle" aria-hidden="true"></span>
      <div class="alert-body"><span>{m.posting_delete_failed()}</span></div>
    </div>
  {/if}

  {#if saveFailed}
    <div class="alert alert-error" role="alert">
      <span class="icon icon-x-circle" aria-hidden="true"></span>
      <div class="alert-body"><span>{m.fit_save_failed()}</span></div>
    </div>
  {/if}

  <div class="layout">
    <!-- How it fits what the user wants, then what they bring: both answers to "is it for me?" -->
    <div class="fit-column stack-lg">
      <FitPanel {posting} settings={data.settings} engine={data.engine} checkFailure={checkFailureText(form)} skills={data.skills} />
      {#if posting.text}
        <SkillsFit text={posting.text} skills={data.skills} />
      {/if}
    </div>
    <div class="content-column stack-lg">
      {#if posting.summary}
        <InShort summary={posting.summary} />
      {/if}
      {#if !posting.text}
        <AddTextCard reason={posting.image ? 'image' : 'link'} failed={editError === 'text'} />
      {/if}

      {#if closed}
        <FeedbackCard application={closed} />
      {/if}

      <!-- For applying: the letter, written when asked -->
      <CoverLetter
        {posting}
        engine={data.engine}
        outdated={data.letterOutdated}
        letterError={form && 'letterError' in form ? String(form.letterError) : null}
      />
      <InterviewCard notes={posting.notes} topics={data.interviewTopics} />

      <!-- The original, for reference, at the end: its opening lines, the rest behind "Read more" -->
      {#if posting.text}
        <PostingText text={posting.text} />
      {/if}
      {#if posting.image}
        <div class="accordion">
          <details>
            <summary>{m.posting_screenshot()}</summary>
            <div class="accordion-body">
              <img class="screenshot" src={resolve('/postings/[id]/image', { id: posting.id })} alt={m.posting_screenshot_alt({ title: posting.title })} />
            </div>
          </details>
        </div>
      {/if}
    </div>
  </div>
</div>

<DeletePostingDialog bind:this={deleteDialog} postingId={posting.id} title={displayTitle(posting)} />
<CloseDialog bind:this={closeDialog} />

<style>
  /* The identity on the left, the actions on the right at the title's height; they wrap under on a narrow screen */
  .posting-header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3) var(--space-5);
  }

  .identity {
    flex: 1 1 28rem;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .status {
    flex-wrap: wrap;
    gap: var(--space-1) var(--space-3);
  }

  /* the company, the date, the source: told apart from the title by their icons and a quieter colour */
  .meta {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    color: var(--text-secondary);
  }

  .meta .icon {
    color: var(--text-label);
  }


  .actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
  }

  /* The fit panel comes first for keyboard and screen readers; on a wide screen it sits on the right, on a
     narrow one above the posting. Not sticky: it can be taller than the window. */
  .layout {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .content-column {
    min-width: 0;
  }

  @media (width >= 80rem) {
    .layout {
      flex-direction: row-reverse;
      align-items: flex-start;
    }

    /* Half each: how it fits is the page's main answer, not a side note */
    .fit-column,
    .content-column {
      flex: 1 1 0;
      min-width: 0;
    }
  }


  .screenshot {
    display: block;
    max-width: 100%;
    height: auto;
    border: 1px solid var(--border);
    border-radius: max(0px, calc(var(--radius-surface) - var(--space-4)));
  }
</style>
