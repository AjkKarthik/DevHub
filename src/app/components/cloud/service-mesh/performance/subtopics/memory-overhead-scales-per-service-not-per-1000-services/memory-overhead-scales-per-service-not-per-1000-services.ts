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
  templateUrl: './memory-overhead-scales-per-service-not-per-1000-services.html',
  styleUrl: './memory-overhead-scales-per-service-not-per-1000-services.scss'
})
export class MemoryOverheadScalesPerServiceNotPer1000ServicesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A genuine, self-contradicting numeric inconsistency caught during this batch — off by roughly 1000x',
      points: [
        'The main page\'s own theory bullet originally stated the memory formula as: "50-80MB RAM base + ~1MB per 1000 services it knows about." Applied to the SAME page\'s own worked examples (a 500-service cluster), that formula predicts a negligible addition — roughly 0.5MB. But the mistakes block and the QnA BOTH independently stated a 500-service, unscoped proxy uses "500MB+" / "550MB" of RAM — a real number roughly 1000× larger than what the page\'s own stated formula would predict for the exact same scenario. The main page has been corrected to use one consistent formula throughout.',
      ]
    },
    {
      heading: 'Reconciling the numbers: the coefficient is ~1MB PER SERVICE, not per 1000 services',
      points: [
        'Working backward from the more frequently-repeated, more specific figures (the mistakes block AND the QnA both independently landed on ~500-550MB for 500 services): subtracting the ~50-80MB base leaves roughly 420-500MB attributable to service count, which divided by 500 services works out to approximately <strong>1MB PER SERVICE</strong> — not per 1000 services as the theory bullet originally, and uniquely, stated.',
        'This is now the reconciled, consistent formula across the entire page: 50-80MB base + ~1MB per service the proxy has in its scope. This also makes the main page\'s OWN Sidecar-CRD-scoping value proposition make actual numeric sense: 500 unscoped services → ~500MB extra; scoped down to 10 services → ~10MB extra — a real, substantial, and correctly-motivated case for scoping, unlike the original (per-1000) formula, which would have made scoping barely worth doing at all (saving under 1MB).',
      ]
    },
    {
      heading: 'Why catching self-contradicting numbers is its own distinct verification skill',
      points: [
        'This correction required NO external research at all — it was found purely by comparing the main page\'s own stated formula against its own worked examples and noticing they didn\'t agree. This is a different, complementary verification technique from checking a claim against an external primary source (like Istio\'s own docs): sometimes the fastest, most reliable way to catch an error is internal consistency-checking against a page\'s OTHER claims, especially numeric ones that get restated in different forms (a formula vs. a worked example vs. a QnA figure).',
        'The practical lesson for authoring or reviewing similar technical content: whenever a page states BOTH a general formula AND a specific worked example derived from it, it\'s worth doing the arithmetic to confirm the example is actually consistent with the formula — a mismatch here is a strong, self-contained signal that something is wrong, independent of whether either number is externally correct.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The inconsistency, made explicit',
      language: 'bash',
      code: `# The main page's ORIGINAL formula (theory bullet):
#   memory = 50-80MB base + (~1MB / 1000 services in scope)
#
# Applied to the SAME page's own 500-service example:
#   memory = 50-80MB + (500 / 1000) * 1MB
#          = 50-80MB + 0.5MB
#          ≈ 50.5 - 80.5MB   <-- negligible service-count effect

# But the SAME page's mistakes block AND QnA both separately
# state, for the SAME 500-service scenario:
#   memory ≈ 500-550MB total
#
# These two numbers cannot both be describing the same formula --
# a ~1000x discrepancy in the implied per-service coefficient.`,
    },
    {
      label: 'The reconciled, consistent formula (now used throughout the page)',
      language: 'bash',
      code: `# Corrected formula:
#   memory = 50-80MB base + (~1MB PER SERVICE in scope)
#
# Applied to the 500-service example:
#   memory = 50-80MB + (500 * 1MB)
#          = 50-80MB + 500MB
#          ≈ 550-580MB   <-- matches the mistakes block/QnA figures

# Applied to a Sidecar-CRD-scoped proxy (10 services):
#   memory = 50-80MB + (10 * 1MB)
#          = 50-80MB + 10MB
#          ≈ 60-90MB   <-- matches the page's own "~60MB scoped" claim,
#                            and makes the Sidecar CRD scoping
#                            recommendation numerically well-motivated`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A capacity-planning team reads the main page\'s ORIGINAL memory formula ("~1MB per 1000 services") and concludes that Sidecar CRD scoping is barely worth the engineering effort, since going from 500 unscoped services to 10 scoped services would only save about 0.49MB per proxy per their calculation. They deprioritize the Sidecar CRD rollout. Using the corrected formula, was their conclusion right?',
    hint: 'Per the reconciled formula (verified against the page\'s own mistakes-block and QnA figures for the same scenario), how much memory does going from 500 unscoped services down to 10 scoped services actually save per proxy?',
    solution: 'Their conclusion was wrong, based on an inconsistent formula. Using the reconciled, internally-consistent formula (~1MB per service, not per 1000), scoping from 500 services down to 10 services saves approximately 490MB per proxy (500MB → 10MB in service-count-attributable memory) — a substantial, clearly worthwhile optimization across a whole fleet of sidecars, not a negligible ~0.5MB difference. The team should reprioritize the Sidecar CRD rollout; the original formula they based their decision on was itself inconsistent with the same page\'s own worked examples.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Envoy sidecar memory overhead scales at roughly 1MB per 1000 services in scope — meaning service-count-driven memory growth is nearly negligible even in large, unscoped clusters.',
      reality: 'Per this subtopic\'s theory (a genuine self-contradicting inconsistency caught and corrected on the main page during this batch), the real, internally-consistent coefficient is approximately 1MB PER SERVICE — a roughly 1000x larger effect that makes service-count scoping a substantial, worthwhile optimization.'
    },
    {
      thought: 'When a technical page states a general formula, cross-checking that formula against the page\'s own separately-stated worked examples is redundant — if the formula is correct, the examples will automatically be correct too.',
      reality: 'Per this subtopic\'s theory, this specific inconsistency was ONLY found by doing exactly that cross-check — comparing the stated formula\'s prediction against the page\'s own separately-authored worked examples (mistakes block, QnA), which had silently drifted to a different, unstated coefficient.'
    },
    {
      thought: 'Since Sidecar CRD scoping is described as helpful on the main page, but the accompanying formula suggested minimal savings, the formula\'s numbers were probably just an approximation not meant to be taken literally.',
      reality: 'Per this subtopic\'s theory, the formula wasn\'t a rough approximation — it was a genuine, one-digit-off inconsistency (per-1000 vs. per-service) that, once corrected, makes the Sidecar CRD scoping recommendation numerically well-motivated rather than a vague, unquantified best practice.'
    }
  ];
}
