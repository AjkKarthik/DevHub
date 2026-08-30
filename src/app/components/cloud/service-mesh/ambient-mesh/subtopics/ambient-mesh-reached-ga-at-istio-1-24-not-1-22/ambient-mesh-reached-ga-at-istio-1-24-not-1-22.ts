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
  templateUrl: './ambient-mesh-reached-ga-at-istio-1-24-not-1-22.html',
  styleUrl: './ambient-mesh-reached-ga-at-istio-1-24-not-1-22.scss'
})
export class AmbientMeshReachedGaAtIstio124Not122Subtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A version claim worth verifying before betting a rollout timeline on it',
      points: [
        'The main page originally stated Ambient Mesh was "introduced as stable in Istio 1.22 (May 2024)." Checking this directly against Istio\'s own release announcements, this is off by two full minor versions. The main page has been corrected.',
      ]
    },
    {
      heading: 'The reality: GA landed at Istio 1.24 (November 2024) — 1.22 was still Beta',
      points: [
        'Istio\'s own blog post title is unambiguous: "Fast, Secure, and Simple: Istio\'s Ambient Mode Reaches General Availability in v1.24," dated November 7, 2024 — and it explicitly states this is the point where "ztunnel, waypoints and APIs" were "marked as Stable by the Istio TOC."',
        'Istio 1.22 (the version the main page originally cited) corresponds to an EARLIER phase — the project\'s own CNCF blog post from March 2024 is titled "Istio announces the beta release of ambient mode," confirming 1.22-era Ambient was still explicitly Beta, not Stable/GA.',
      ]
    },
    {
      heading: 'Why the exact GA boundary matters for production adoption decisions',
      points: [
        'A team scoping when Ambient became "safe to run in production" based on the main page\'s original (incorrect) 1.22/May-2024 date would have concluded Ambient was production-ready roughly SIX MONTHS earlier than Istio\'s own project actually declared it stable — a meaningful gap when justifying an adoption timeline to a risk-averse platform review, or when explaining why an incident during the Beta window doesn\'t reflect the GA-quality bar.',
        'Beta and GA carry genuinely different support/stability guarantees in Istio\'s own versioning process — treating a Beta-era feature\'s behavior as equivalent to its later GA behavior risks assuming stability commitments (API stability, upgrade compatibility) that didn\'t formally exist yet at the earlier version.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Confirming the GA milestone directly from Istio\'s own release',
      language: 'bash',
      code: `# Istio's own blog post (istio.io/latest/blog/2024/ambient-reaches-ga/)
# title: "Fast, Secure, and Simple: Istio's Ambient Mode
#         Reaches General Availability in v1.24"
# published: November 7, 2024
#
# Quote: "ztunnel, waypoints and APIs" marked Stable by the
# Istio Technical Oversight Committee (TOC) at this release.

# Contrast: Istio's own CNCF blog post from March 2024
# is titled "Istio announces the beta release of ambient mode"
# -- confirming 1.22-era Ambient (~May 2024) was still Beta,
# not the Stable/GA milestone the main page originally cited.

# If evaluating Ambient for production today, confirm your
# actual installed version is 1.24+ before treating it as GA:
istioctl version --short`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A platform team, citing the main page\'s original (now-corrected) claim that "Ambient reached stable in Istio 1.22 (May 2024)," argues in a risk-review meeting that Ambient has been production-grade stable for over a year by the time of a proposed rollout in mid-2025. A skeptical reviewer, doing their own research, finds Istio\'s own blog post declaring GA specifically at 1.24 in November 2024. How does this change the team\'s stability argument, and what should they check before citing a "since X" date for any fast-moving open-source feature?',
    hint: 'What is the actual, correct GA date for Ambient Mesh, and how much shorter is the real "time since GA" window compared to the team\'s original claim?',
    solution: 'The corrected GA date is November 2024 (Istio 1.24), not May 2024 (Istio 1.22) — a six-month difference. This shortens the team\'s claimed "over a year of production-grade stability" to a genuinely shorter, though still reasonable, window by the time of a mid-2025 rollout. The practical lesson: before citing a "stable since X" date for any fast-moving open-source project, verify against the project\'s OWN official release announcement (a dedicated GA blog post, in this case) rather than a remembered or assumed version number — Beta and GA are officially distinct milestones with different stability guarantees, and conflating an earlier Beta release with the later GA date overstates how long the stability commitment has actually existed.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Ambient Mesh reached stable/GA status in Istio 1.22, around May 2024.',
      reality: 'Per this subtopic\'s theory (a version claim corrected on the main page during this batch), Ambient Mesh actually reached General Availability at Istio 1.24 in November 2024 — 1.22 was still explicitly the Beta stage, per Istio\'s own release announcements.'
    },
    {
      thought: 'Since a feature was functionally usable and documented at an earlier version (like 1.22), that earlier version\'s release date is a reasonable proxy for "when it became production-stable."',
      reality: 'Per this subtopic\'s theory, Beta and GA/Stable are officially distinct project milestones with different stability guarantees — using an earlier Beta-stage date to represent "when it became stable" overstates how long the actual stability commitment has existed.'
    },
    {
      thought: 'Verifying a "reached stable in version X" claim for an open-source project requires deep technical investigation into changelogs and commit history.',
      reality: 'Per this subtopic\'s theory, the fastest, most authoritative check is often simply looking for the project\'s OWN dedicated GA/stable announcement (a blog post title as direct as "Reaches General Availability in v1.24" is about as unambiguous a primary source as verification gets).'
    }
  ];
}
