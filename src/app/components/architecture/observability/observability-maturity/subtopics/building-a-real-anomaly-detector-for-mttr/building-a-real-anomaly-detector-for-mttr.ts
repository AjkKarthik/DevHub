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
    heading: 'From Prose Description to a Real, Verified Detector',
    points: [
      'The page’s own QnA on AIOps describes anomaly detection in real technical detail — "ML models learn the normal behavior of each metric. Alert when a metric deviates significantly without a human-defined threshold. Reduces false positives from misconfigured static thresholds." — but no code anywhere on the page shows what this actually computes.',
      'A z-score-based detector (comparing a new value against the historical mean plus N standard deviations) is a real, simple, well-established instance of exactly this pattern — not the sophisticated ML models AIOps platforms use in production, but a genuine, working example of the same underlying idea: "learn what normal looks like for THIS metric, then flag deviations from that learned baseline instead of a fixed number."',
      'Verified directly against 8 weeks of simulated MTTR (Mean Time To Resolve) data, tightly clustered around a healthy baseline: a moderately elevated week (46 minutes, against a baseline mean of 41.5) correctly stays UNFLAGGED, while a genuine regression (120 minutes) correctly triggers the anomaly — exactly the "reduces false positives from misconfigured static thresholds" benefit the QnA describes, since a FIXED threshold set to catch the 120-minute case would either also flag the harmless 46-minute week, or miss it if set too loose.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'A Real Z-Score Anomaly Detector for MTTR',
    language: 'typescript',
    code: `function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function stddev(xs: number[]): number {
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / xs.length);
}

interface AnomalyResult {
  mean: number;
  upperBound: number;
  isAnomaly: boolean;
}

function detectAnomaly(
  historicalMttrMinutes: number[],
  currentMttrMinutes: number,
  stdDevMultiplier: number
): AnomalyResult {
  const m = mean(historicalMttrMinutes);
  const sd = stddev(historicalMttrMinutes);
  const upperBound = m + stdDevMultiplier * sd;
  return {
    mean: Math.round(m * 10) / 10,
    upperBound: Math.round(upperBound * 10) / 10,
    isAnomaly: currentMttrMinutes > upperBound,
  };
}

// 8 weeks of normal MTTR data (minutes), tightly clustered
const historicalMttr = [42, 38, 45, 40, 43, 39, 41, 44];

console.log('Case A: this week MTTR is 46 min (normal-ish)');
console.log(detectAnomaly(historicalMttr, 46, 3));

console.log('Case B: this week MTTR spikes to 120 min (a real regression)');
console.log(detectAnomaly(historicalMttr, 120, 3));
// -> Case A: { mean: 41.5, upperBound: 48.4, isAnomaly: false }
// -> Case B: { mean: 41.5, upperBound: 48.4, isAnomaly: true }`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The detector uses a fixed <code>stdDevMultiplier</code> of 3 in both cases. If a team switched to <code>stdDevMultiplier: 1</code> instead, using the exact same 8-week historical data, would Case A (46 minutes) now be flagged as an anomaly?',
  hint: 'Compute the new upper bound with a multiplier of 1 instead of 3, using the same mean (41.5) and standard deviation the code tab already reports, and compare 46 against it.',
  solution: `// Yes -- with stdDevMultiplier: 1, the upper bound tightens
// considerably (mean + 1 standard deviation, instead of mean + 3),
// and 46 minutes would very likely cross that lower bound, getting
// flagged as an anomaly where it previously wasn't.
//
// This demonstrates the real tuning trade-off any anomaly detector
// has: a SMALLER multiplier makes the detector more SENSITIVE --
// catching smaller deviations sooner, at the cost of more false
// positives on completely normal week-to-week variance. A LARGER
// multiplier (like the code tab's own 3) is more conservative --
// fewer false alarms, but a real, smaller regression could go
// unnoticed until it grows large enough to cross the wider bound.
// There's no universally "correct" multiplier -- it's a genuine
// choice a team makes based on how costly a false positive is
// (an unnecessary page) versus a false negative (a missed early
// warning) for THIS specific metric.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'This z-score detector IS what the page’s own AIOps QnA is describing when it names "ML models" learning normal behavior — z-score calculation is itself a form of machine learning.',
    reality: 'A z-score/standard-deviation calculation is ordinary statistics, not machine learning — there’s no model being trained, no parameters being learned through iterative optimization, no ability to capture non-linear patterns or seasonality the way a real ML-based anomaly detector (like the ones the QnA names — Datadog Watchdog, Dynatrace Davis AI) can. This subtopic’s detector is a genuine, WORKING instance of the general PRINCIPLE the QnA describes ("learn a baseline, flag deviations from it instead of a fixed threshold") — a simple, transparent stand-in for the more sophisticated techniques real AIOps platforms actually use, not a literal implementation of what they do internally.',
  },
  {
    thought: 'Since the detector correctly identified both test cases, it would work equally well for ANY metric, not just MTTR.',
    reality: 'The specific technique (mean + N standard deviations) works well for metrics that vary in a roughly bell-curve-shaped way around a stable baseline, which weekly MTTR figures for a stable, mature team plausibly do. Many real operational metrics DON’T behave this way — a metric with a strong daily or weekly seasonal pattern (traffic that’s naturally 10x higher on weekday afternoons than at 3am) would trigger constant false "anomalies" from a plain z-score check that has no concept of time-of-day, which is exactly the kind of case that needs the seasonally-aware dynamic-threshold technique this hub’s own Alerting Design topic covers separately.',
  },
];

@Component({
  selector: 'app-obs-maturity-anomaly-detector',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './building-a-real-anomaly-detector-for-mttr.html',
  styleUrl: './building-a-real-anomaly-detector-for-mttr.scss',
})
export class BuildingARealAnomalyDetectorForMttrSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
