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
    heading: 'Correct for Its Own Tests, Silently Wrong Beyond Them',
    points: [
      'The Challenge’s own <code>SimpleHistogram</code> passes every one of its own given test cases — verified via direct execution that <code>getCount(0.05)</code>, <code>getCount(0.1)</code>, <code>getCount(1.0)</code>, and <code>totalCount()</code> all match their claimed outputs exactly for the three given observations (0.08, 0.03, 0.6). The Challenge is genuinely, demonstrably correct for the scope it was tested against.',
      'The gap: <code>totalCount()</code> is implemented as <code>Math.max(...this.counts.values())</code> — it derives the total from whichever bucket happens to hold the most observations, relying on every recorded observation landing in AT LEAST ONE bucket. Real Prometheus histograms never have this problem because every real histogram has an implicit <code>+Inf</code> bucket that captures EVERY observation, no matter how large.',
      'Verified via direct execution: recording a value larger than every configured bucket boundary (e.g. 5.0 seconds, with buckets topping out at 1.0) increments NO bucket at all — the observation is silently invisible to <code>getCount()</code> for every boundary, and <code>totalCount()</code> undercounts by exactly the number of such out-of-range observations.',
      'This has NOT been changed on the main page — the Challenge’s own scope never claims to handle out-of-range values, and its given tests never exercise this case, so there’s nothing incorrect to fix there. This is a genuine, well-motivated GAP worth closing separately: building the same <code>+Inf</code>-bucket mechanism real Prometheus uses.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Adding the +Inf Bucket',
    language: 'typescript',
    code: `class SimpleHistogram {
  private counts: Map<number, number>;

  constructor(private buckets: number[]) {
    this.counts = new Map(buckets.map(b => [b, 0]));
  }

  record(value: number): void {
    for (const bucket of this.buckets) {
      if (value <= bucket) this.counts.set(bucket, (this.counts.get(bucket) ?? 0) + 1);
    }
  }

  getCount(le: number): number { return this.counts.get(le) ?? 0; }

  totalCount(): number { return Math.max(...this.counts.values(), 0); }
}

// Confirmed: the ORIGINAL Challenge solution silently undercounts.
const original = new SimpleHistogram([0.05, 0.1, 0.25, 0.5, 1.0]);
original.record(0.08);
original.record(5.0); // exceeds every configured bucket
console.log('ORIGINAL totalCount() after 2 observations:', original.totalCount());
// -> 1 -- the 5.0s observation is completely invisible, undercounted

// FIXED -- append an implicit +Inf bucket, matching real Prometheus
// histogram semantics exactly (the same mechanism behind the real
// "_count" suffix every Prometheus histogram metric automatically gets).
class SimpleHistogramV2 {
  private buckets: number[];
  private counts: Map<number, number>;

  constructor(buckets: number[]) {
    this.buckets = [...buckets, Infinity];
    this.counts = new Map(this.buckets.map(b => [b, 0]));
  }

  record(value: number): void {
    for (const bucket of this.buckets) {
      if (value <= bucket) this.counts.set(bucket, (this.counts.get(bucket) ?? 0) + 1);
    }
  }

  getCount(le: number): number { return this.counts.get(le) ?? 0; }

  // The +Inf bucket, by construction, always contains EVERY observation --
  // this is exactly what real Prometheus's own auto-generated "_count"
  // metric is: the +Inf bucket's own count, given a distinct name.
  totalCount(): number { return this.counts.get(Infinity) ?? 0; }
}

const fixed = new SimpleHistogramV2([0.05, 0.1, 0.25, 0.5, 1.0]);
fixed.record(0.08);
fixed.record(5.0);
console.log('FIXED totalCount() after 2 observations:', fixed.totalCount());
// -> 2 -- correct
console.log('FIXED getCount(1.0):', fixed.getCount(1.0)); // 1 -- only 0.08 fits in a finite bucket
console.log('FIXED getCount(Infinity):', fixed.getCount(Infinity)); // 2 -- everything, including the 5.0s outlier`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A caller queries <code>fixed.getCount(1.0)</code> right after recording ONLY the 5.0-second outlier (no other observations). What does it return, and why doesn’t the +Inf-bucket fix change this particular answer?',
  hint: 'Walk through <code>record(5.0)</code>’s own loop — does <code>5.0 <= 1.0</code> ever evaluate true for the finite <code>1.0</code> bucket, regardless of whether a +Inf bucket also exists?',
  solution: `// record(5.0) checks EVERY bucket in order: 0.05, 0.1, 0.25, 0.5, 1.0, Infinity.
// 5.0 <= 1.0 is FALSE -- the 1.0 bucket is never incremented by this
// observation, exactly as before the fix. Only the newly-added Infinity
// bucket (5.0 <= Infinity is true) gets incremented.
//
// fixed.getCount(1.0) after only recording 5.0 -> 0 (unchanged, correct)
// fixed.getCount(Infinity) after only recording 5.0 -> 1 (new, correct)
//
// The +Inf bucket fix doesn't change what ANY EXISTING finite bucket
// reports -- a genuinely out-of-range observation should NOT count
// toward "requests completing within 1.0 seconds" (it explicitly took
// longer than that). The fix only changes totalCount()'s SOURCE OF
// TRUTH (reading from the new, always-accurate +Inf bucket instead of
// Math.max of the finite buckets, which could miss out-of-range values
// entirely) -- it doesn't change the finite buckets' own semantics at all.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since the Challenge’s own given tests all passed correctly, the SimpleHistogram implementation has no real bugs — the +Inf-bucket gap is purely theoretical.',
    reality: 'The gap is entirely real and directly reproducible — it simply requires an input the Challenge’s own three given test observations never happen to include (a value exceeding every bucket boundary). "Passes the given tests" and "correct for every input" are different claims, and this is a concrete demonstration of exactly that gap.',
  },
  {
    thought: 'Math.max(...this.counts.values()) is a reasonable, general way to compute a histogram’s total observation count, since the largest finite bucket should always hold the most observations (buckets are cumulative).',
    reality: 'That reasoning holds ONLY when every observation fits into at least one configured bucket — the moment a value exceeds the largest boundary, it increments NO bucket at all, and <code>Math.max</code> has nothing to reflect it. The assumption "every observation lands somewhere" is exactly what a dedicated +Inf bucket exists to guarantee, unconditionally, for any real-valued observation.',
  },
  {
    thought: 'Adding a +Inf bucket to a histogram is purely a workaround for a made-up edge case that wouldn’t happen with a well-chosen set of bucket boundaries in real production code.',
    reality: 'Real Prometheus histograms include the +Inf bucket UNCONDITIONALLY, by design, precisely because "well-chosen boundaries" can never be guaranteed in advance — a service’s own latency distribution shifts over time (a slow downstream dependency, a traffic spike, a degraded database), and a bucket set tuned for today’s traffic can silently stop covering tomorrow’s outliers without anyone noticing, unless the +Inf bucket is there to catch them.',
  },
];

@Component({
  selector: 'app-obs-prometheus-histogram-inf-bucket',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-histograms-missing-inf-bucket.html',
  styleUrl: './the-histograms-missing-inf-bucket.scss',
})
export class TheHistogramsMissingInfBucketSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
