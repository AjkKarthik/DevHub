import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './ambient-mesh-ga-version-was-off-by-one-release.html',
  styleUrl: './ambient-mesh-ga-version-was-off-by-one-release.scss'
})
export class AmbientMeshGaVersionWasOffByOneReleaseSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A cross-hub catch — this same claim was already researched and corrected elsewhere',
      points: [
        'The QnA\'s "What is \'ambient mesh\' and why does it matter?" answer originally ended with "GA in Istio 1.22+." This exact claim — the specific version number where Istio Ambient Mesh reached General Availability — was already independently researched for this site\'s own dedicated Service Mesh hub, in its Ambient Mesh subtopic set.',
        'That earlier research (verified against Istio\'s own official GA announcement blog post) found the correct version is Istio 1.24, released November 2024 — Istio 1.22 still carried Ambient Mesh as BETA, not GA. This page repeated the same stale/incorrect version number independently.',
        'This is a different kind of catch from most findings in this hub: not fresh research, but RECOGNIZING that a specific, checkable claim on this page duplicates one already verified (and found wrong) on a sibling hub built earlier in the same overall project — a reminder that a fact worth checking once is worth checking everywhere it reappears, not just the first time it\'s encountered.',
      ]
    },
    {
      heading: 'Why "GA" specifically is worth getting exactly right',
      points: [
        'GA (General Availability) is not a marketing label — it\'s a specific, meaningful commitment from a project: the feature is considered production-ready, covered by normal support/compatibility guarantees, and no longer subject to the "use at your own risk, API may still change" caveats that apply to Beta features.',
        'A reader planning a production Ambient Mesh rollout who trusts "GA in 1.22" might adopt it a full release earlier than the project itself considered it production-ready — while Istio\'s versioning is generally forward-compatible enough that this specific gap is unlikely to cause serious harm, the broader lesson (verify GA/stable claims against the project\'s own official release notes, not a remembered or assumed version) applies broadly to any fast-moving open-source infrastructure project.',
        'The corrected QnA now states the version AND the reasoning that pins it down (1.22 was Beta, 1.24 was the actual GA release) — giving the reader something checkable against Istio\'s own release notes, rather than just a bare corrected number to trust on faith.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'How this specific claim was pinned down (a repeatable technique)',
      language: 'bash',
      code: `# The general technique for pinning down "when did feature X reach status Y"
# for a fast-moving open-source project: check whether the FEATURE'S OWN
# docs page existed at a given ARCHIVED version -- a fast, direct way to
# bound when something was introduced or promoted, more reliable than a
# remembered or assumed version number.

# Istio publishes docs for every past version at a predictable URL pattern:
#   https://istio.io/v{VERSION}/docs/...

# For Ambient Mesh specifically, checking the archived GA-status blog post
# and release notes directly (rather than trusting a secondhand summary)
# confirmed: Istio 1.22 (~April 2024) shipped Ambient as BETA;
# Istio 1.24 (November 2024) is where Istio's own release notes and blog
# post declared it GA.

# This is the same discipline already applied when this project's own
# Service Mesh hub independently verified this exact fact the first time --
# reapplying it here (recognizing a REPEATED claim, not just checking new
# ones) is what caught the stale number on this page.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'You\'re updating a reference page and notice it states "Feature X reached GA in Framework version 3.2." You vaguely recall correcting this exact same claim on a different page in the same project a few weeks ago. What\'s the fastest reliable way to resolve this instance, given that memory?',
    hint: 'Is "I vaguely recall the correct number was different" itself sufficient evidence to make the edit, or does it just tell you what to go check?',
    solution: 'The vague recollection is a strong signal to re-verify, not a substitute for verification -- memory of a past correction can itself be imprecise (which page, which exact number, whether the situation is identical). The fastest RELIABLE path is checking the earlier correction\'s own cited source (in this case, Istio\'s own official GA announcement) directly, confirming it actually applies to this new instance of the claim, and then applying the same fix -- reusing the PREVIOUS RESEARCH (the verified fact and its source), not reusing an unverified memory of having fixed something similar once.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Once a specific fact has been researched and corrected once in a project, it\'s reasonably safe to assume every other page states it correctly too.',
      reality: 'Per this subtopic\'s theory, this page independently repeated the exact same incorrect version number that had already been researched and corrected on a sibling hub — a fact being fixed once doesn\'t mean every other occurrence of it gets fixed automatically.'
    },
    {
      thought: '"GA" and "Beta" are soft, marketing-adjacent labels not worth being precise about in a technical reference.',
      reality: 'Per this subtopic\'s theory, GA is a specific commitment about production-readiness and support guarantees — conflating a Beta release with GA status can lead a reader to adopt a feature under different risk assumptions than the project itself intended.'
    },
    {
      thought: 'Recognizing a repeated claim from memory ("I think this was already corrected somewhere") is itself sufficient grounds to make an edit.',
      reality: 'Per this subtopic\'s theory, the memory is a prompt to re-check the ORIGINAL verified source, not a replacement for it — the actual fix should trace back to the same authoritative source (Istio\'s own GA announcement) used the first time, not to an unverified recollection.'
    }
  ];
}
