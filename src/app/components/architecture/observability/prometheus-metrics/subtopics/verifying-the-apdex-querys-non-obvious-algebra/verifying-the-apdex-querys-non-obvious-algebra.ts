import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

const theory: TheoryPoint[] = [
  {
    heading: 'A Query That Looks Wrong Until You Do the Algebra',
    points: [
      'The main page’s own "PromQL Queries" codeTab computes Apdex as <code>(le=0.1_bucket + le=0.4_bucket) / 2 / total_count</code>. At first glance this looks like it might be averaging two unrelated cumulative sums — but the textbook Apdex formula is <code>(Satisfied + Tolerating / 2) / Total</code>, where "Tolerating" means requests that took BETWEEN the satisfied and tolerating thresholds, not the cumulative count up to the tolerating threshold.',
      'The key fact that makes the page’s query correct: Prometheus histogram bucket counts (<code>_bucket{le="X"}</code>) are CUMULATIVE — <code>le="0.4"</code> already includes every observation counted in <code>le="0.1"</code>, plus everything between 0.1 and 0.4. So "Tolerating-only" (the incremental segment) is <code>le=0.4_bucket - le=0.1_bucket</code>, not <code>le=0.4_bucket</code> on its own.',
      'Substituting that into the textbook formula and simplifying algebraically: <code>(le01 + (le04 - le01)/2) / Total</code> reduces to exactly <code>(le01 + le04) / 2 / Total</code> — the page’s own query. The "/2" isn’t naively averaging two cumulative sums; it falls out of a real algebraic simplification of the correct, textbook-defined formula.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Verified Against Concrete Data',
    language: 'typescript',
    code: `// Simulated request durations (seconds) for one 5-minute window.
const durations = [0.05, 0.08, 0.09, 0.15, 0.2, 0.3, 0.35, 0.5, 0.6, 1.2];

const satisfiedThreshold = 0.1;   // < 100ms
const toleratingThreshold = 0.4;  // < 400ms
const total = durations.length;

// Textbook Apdex: Satisfied + (Tolerating-ONLY, i.e. NOT cumulative) / 2, over Total.
const satisfiedCount = durations.filter(d => d <= satisfiedThreshold).length;
const toleratingOnlyCount = durations.filter(
  d => d > satisfiedThreshold && d <= toleratingThreshold
).length;
const apdexTextbook = (satisfiedCount + toleratingOnlyCount / 2) / total;

// The main page's own PromQL-equivalent formula, using CUMULATIVE bucket
// counts (exactly what a real Prometheus histogram's le="X" buckets are).
const le01Bucket = durations.filter(d => d <= satisfiedThreshold).length;   // cumulative up to 0.1
const le04Bucket = durations.filter(d => d <= toleratingThreshold).length;  // cumulative up to 0.4 (includes le01's own count too)
const apdexPageFormula = (le01Bucket + le04Bucket) / 2 / total;

console.log('satisfiedCount:', satisfiedCount, 'toleratingOnlyCount:', toleratingOnlyCount);
console.log('le01Bucket (cumulative):', le01Bucket, 'le04Bucket (cumulative):', le04Bucket);
console.log('Apdex (textbook formula):', apdexTextbook);
console.log('Apdex (page PromQL-equivalent formula):', apdexPageFormula);
console.log('Match:', apdexTextbook === apdexPageFormula);
// -> satisfiedCount: 3, toleratingOnlyCount: 4
// -> le01Bucket: 3, le04Bucket: 7  (7 = 3 satisfied + 4 tolerating-only, cumulative)
// -> Apdex (textbook): 0.5
// -> Apdex (page formula): 0.5
// -> Match: true`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A second dataset has 10 requests: 6 satisfied (≤ 0.1s), 0 tolerating (none between 0.1s and 0.4s), and 4 frustrated (> 0.4s). Using BOTH formulas (textbook and the page’s cumulative-bucket version), compute the Apdex score and confirm they still agree.',
  hint: 'With zero tolerating-only requests, <code>le04Bucket</code> (cumulative up to 0.4) should equal exactly <code>le01Bucket</code> (cumulative up to 0.1), since nothing new falls in the 0.1-0.4 range to add to the cumulative count.',
  solution: `// satisfiedCount = 6, toleratingOnlyCount = 0, total = 10.
// Textbook: (6 + 0/2) / 10 = 6/10 = 0.6
//
// le01Bucket (cumulative, <= 0.1) = 6 (the satisfied requests)
// le04Bucket (cumulative, <= 0.4) = 6 too -- since nothing falls in the
//   0.1-0.4 gap, the cumulative count doesn't grow between the two
//   thresholds; it's still just the same 6 satisfied requests.
// Page formula: (6 + 6) / 2 / 10 = 12/2/10 = 0.6
//
// Both formulas agree: 0.6.
//
// This confirms the algebraic identity holds even in the degenerate
// case where the "tolerating" segment is empty -- le04Bucket and
// le01Bucket collapsing to the SAME value is exactly what the
// cumulative-bucket model predicts when no observations fall in that
// range, and the formula's own "/2" still correctly reduces to the
// plain satisfied-fraction in that case (since averaging a number with
// itself just returns that number).`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'The page’s Apdex query, <code>(le=0.1_bucket + le=0.4_bucket) / 2</code>, is averaging two DIFFERENT groups of requests (satisfied vs. tolerating) the same way you’d average two independent sample means.',
    reality: 'Both <code>le=0.1_bucket</code> and <code>le=0.4_bucket</code> are CUMULATIVE counts measuring the SAME underlying quantity (requests at or below a threshold) at two different thresholds — not two independent groups. The apparent "average" is really an algebraic byproduct of expressing the textbook Satisfied + Tolerating/2 formula entirely in terms of cumulative sums, verified directly in the codeTab above.',
  },
  {
    thought: 'Since Prometheus histogram bucket labels look like <code>le="0.1"</code>, <code>le="0.25"</code>, etc., each bucket independently counts only the requests that fall specifically INTO that bucket’s own range.',
    reality: 'This is the single most important fact about Prometheus histogram buckets, and getting it backwards breaks every quantile and Apdex-style query: <code>le="X"</code> means "count of ALL observations less than or equal to X," always cumulative from zero — never an isolated per-range count. The page’s own Apdex formula only works BECAUSE this cumulative property holds.',
  },
  {
    thought: 'Verifying a PromQL formula’s correctness requires either running a real Prometheus instance or trusting the formula because it "looks like" other Apdex formulas seen elsewhere.',
    reality: 'The codeTab above demonstrates a third option that needed neither: re-deriving the SAME formula independently from the textbook definition using plain array filtering on concrete sample data, then confirming both computations produce the identical number — a general technique for verifying any formula expressed in terms of cumulative buckets against its own non-cumulative textbook definition.',
  },
];

@Component({
  selector: 'app-obs-prometheus-apdex-algebra',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './verifying-the-apdex-querys-non-obvious-algebra.html',
  styleUrl: './verifying-the-apdex-querys-non-obvious-algebra.scss',
})
export class VerifyingTheApdexQuerysNonObviousAlgebraSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
