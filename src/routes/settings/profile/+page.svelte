<script lang="ts">
  import AutosaveText from '#lib/components/AutosaveText.svelte';
  import { m } from '#lib/paraglide/messages.js';
  import SkillsInput from '#lib/profile/SkillsInput.svelte';
  import TopicsInput from '#lib/interview/TopicsInput.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
</script>

<svelte:head>
  <title>{m.profile_page_title()} · Merit</title>
</svelte:head>

<!-- What the user brings, for the cover letter and for how their skills meet a posting; nobody else sees it -->
<div class="stack-lg">
  <header class="page-header">
    <div class="page-header-text">
      <h1>{m.profile_title()}</h1>
      <p class="text-lead">{m.profile_lead()}</p>
    </div>
  </header>

  <div class="card">
    <section class="form-section">
      <div class="form-section-head">
        <h2>{m.profile_experience_title()}</h2>
        <p>{m.profile_experience_text()}</p>
      </div>
      <div class="form-section-body">
        <AutosaveText id="experience" label={m.profile_experience_field()} value={data.profile.experience} action="?/saveExperience" name="experience" />
      </div>
    </section>

    <section class="form-section">
      <div class="form-section-head">
        <h2>{m.profile_skills_title()}</h2>
        <p>{m.profile_skills_text()}</p>
      </div>
      <div class="form-section-body">
        <SkillsInput kind="skill" skills={data.profile.skills} />
      </div>
    </section>

    <section class="form-section">
      <div class="form-section-head">
        <h2>{m.profile_tools_title()}</h2>
        <p>{m.profile_tools_text()}</p>
      </div>
      <div class="form-section-body">
        <SkillsInput kind="tool" skills={data.profile.tools} />
      </div>
    </section>

    <section class="form-section">
      <div class="form-section-head">
        <h2>{m.profile_interview_title()}</h2>
        <p>{m.profile_interview_text()}</p>
      </div>
      <div class="form-section-body">
        <TopicsInput topics={data.profile.interviewTopics} />
      </div>
    </section>
  </div>
</div>
