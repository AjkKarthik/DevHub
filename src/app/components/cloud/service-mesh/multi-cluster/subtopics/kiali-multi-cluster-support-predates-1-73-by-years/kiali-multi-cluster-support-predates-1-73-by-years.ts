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
  templateUrl: './kiali-multi-cluster-support-predates-1-73-by-years.html',
  styleUrl: './kiali-multi-cluster-support-predates-1-73-by-years.scss'
})
export class KialiMultiClusterSupportPredates173ByYearsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A version-gate claim worth checking before telling a team "you need to upgrade first"',
      points: [
        'The main page originally stated "Kiali 1.73+ supports multi-cluster service graphs" — phrasing that reads as a hard minimum-version gate, implying multi-cluster graphs are entirely unavailable on anything earlier. Checking this against Kiali\'s own release history, this significantly overstates how recent the feature is. The main page has been corrected.',
      ]
    },
    {
      heading: 'The reality: multi-cluster support goes back to Kiali\'s early 1.x line, and Kiali is now on v2',
      points: [
        'Kiali\'s own project blog documents that "in the last release, Kiali started to include some features focused on support of multi-cluster environments" as of <strong>v1.29/v1.30</strong> — introducing the "Cluster Boxes" graph display option that groups nodes by cluster, explicitly labeled "initial experimental multi-cluster support" at the time.',
        'This experimental support was refined across many subsequent releases in the 1.6x and 1.7x line (broader multi-cluster workload/health visibility, multi-cluster config wizards, etc.) — there is no single "1.73" cutover point marking multi-cluster support turning on; it was a gradual maturation from an early experimental baseline, not a single release event.',
        'Kiali versioning has since moved past the 1.x line entirely — the project is now on a v2.x release series, with multi-cluster support continuing to receive active investment there. Citing a "1.73+" gate is stale on two independent counts: it understates how far back the feature goes, and it doesn\'t reflect that Kiali has since moved to major version 2.',
      ]
    },
    {
      heading: 'Why an inflated "you need version X+" claim causes real friction',
      points: [
        'A platform team running an older-but-still-multi-cluster-capable Kiali (say, 1.65) reading the main page\'s original claim might conclude they need an upgrade before they can even attempt a multi-cluster service graph — an unnecessary blocker when the capability, in some form, has likely been available to them for a long time.',
        'The more useful, version-agnostic advice (and the one this correction leads with) is to check the specific Kiali release notes for the multi-cluster capabilities THAT VERSION has, rather than memorizing a specific version-number gate that itself goes stale as the project keeps releasing — especially now that the whole 1.x line has been superseded by 2.x.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Checking your actual Kiali version\'s multi-cluster capabilities, not a memorized cutoff',
      language: 'bash',
      code: `# Don't assume a hard "1.73+" gate -- multi-cluster support in
# Kiali has existed, in some form, since the early 1.x line
# (v1.29/1.30's "Cluster Boxes" feature) and matured gradually.
# Kiali has also since moved to a v2.x release series.

# Check your actual deployed Kiali version:
kubectl get deployment kiali -n istio-system \\
  -o jsonpath='{.spec.template.spec.containers[0].image}'

# Then check that SPECIFIC version's own release notes for
# multi-cluster capabilities, rather than relying on a
# remembered version-number threshold:
# https://kiali.io/news/release-notes/

# Multi-cluster graph config (works across the supported range,
# not gated behind a single hard version number):
kubectl get configmap kiali -n istio-system -o yaml \\
  | grep -A5 clustering`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A platform team running Kiali 1.68 wants a multi-cluster service graph and, based on the main page\'s original (now-corrected) "1.73+" claim, plans an upgrade before attempting it. Is the upgrade actually a hard prerequisite?',
    hint: 'When did Kiali\'s own release history show multi-cluster support FIRST appearing, even in experimental form?',
    solution: 'Very likely not a hard prerequisite. Kiali\'s own release history shows multi-cluster support (in the form of the "Cluster Boxes" graph display option) appearing as early as v1.29/1.30, well before 1.68 — so the team\'s 1.68 install likely already has SOME level of multi-cluster graph capability, even if less refined than later 1.7x releases or the current v2.x line. Rather than assuming an upgrade is required based on a specific remembered version number, the team should check v1.68\'s own release notes and try configuring multi-cluster graphing directly — the "1.73+" figure was never an accurate hard gate to begin with.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Kiali multi-cluster service graphs require version 1.73 or later — anything earlier simply cannot show a multi-cluster graph.',
      reality: 'Per this subtopic\'s theory (a version claim corrected on the main page during this batch), multi-cluster support goes back to Kiali\'s early 1.x line (v1.29/1.30\'s initial "Cluster Boxes" feature) and matured gradually — there is no hard 1.73 cutoff.'
    },
    {
      thought: 'Kiali\'s current stable release line is still 1.x, so citing a 1.x version number as a feature gate is a reasonable, current reference point.',
      reality: 'Per this subtopic\'s theory, Kiali has since moved to a v2.x release series — a 1.x version-number gate is stale on this count alone, independent of whether the specific number was ever accurate.'
    },
    {
      thought: 'Multi-cluster support in a tool like Kiali is typically a single feature that "turns on" at one specific release.',
      reality: 'Per this subtopic\'s theory, Kiali\'s own history shows this was a gradual maturation — an early experimental baseline (v1.29/1.30) refined incrementally across many later releases, not a single version-gated switch.'
    }
  ];
}
