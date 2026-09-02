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
    heading: 'Two Failure Modes a Static Threshold Can’t Avoid Simultaneously',
    points: [
      'The page’s own QnA on static vs. dynamic thresholds gives one concrete example: alerting when "the current error rate is 3 standard deviations above the same hour from the previous week." It’s described in prose, with no code showing what that comparison actually computes.',
      'Built and verified against synthetic weekly-seasonal data, both failure modes a single flat threshold is genuinely stuck between: set the threshold LOW enough to catch a real problem during a normally-quiet hour, and it FALSE-POSITIVES every time a completely normal, expected weekly batch job pushes error rate up during its own regular window. Set it HIGH enough to tolerate that normal batch-job spike, and it FALSE-NEGATIVES on a genuine, multiple-times-normal degradation that happens during a quiet hour, because the quiet hour’s normal baseline is so much lower.',
      'A dynamic, per-hour baseline sidesteps the tradeoff entirely — each hour is compared only against ITS OWN historical pattern, so the batch job’s regular 4% doesn’t need to be treated the same as the 3am slot’s regular 0.2%.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Static vs. Dynamic, Verified Against Both Failure Modes',
    language: 'typescript',
    code: `function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}
function stddev(xs: number[]): number {
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / xs.length);
}

function staticThresholdFires(currentValue: number, threshold: number): boolean {
  return currentValue > threshold;
}

function dynamicThresholdFires(
  currentValue: number,
  historicalSamples: number[],
  stdDevMultiplier: number
): boolean {
  const m = mean(historicalSamples);
  const sd = stddev(historicalSamples);
  return currentValue > m + stdDevMultiplier * sd;
}

// 4 weeks of hourly error-rate samples for "hour 14" -- a known weekly
// batch job normally pushes error rate to ~4% at exactly this hour
const historicalHour14 = [0.038, 0.041, 0.039, 0.042];

// ── Case A: this week's batch job runs normally, same as always ────
const normalWeekValue = 0.040;
console.log('Normal batch-job week (4%):');
console.log('  static (3% threshold) fires?', staticThresholdFires(normalWeekValue, 0.03));
console.log('  dynamic (hour-14 baseline) fires?', dynamicThresholdFires(normalWeekValue, historicalHour14, 3));

// ── Case B: a genuine incident DURING the same batch-job hour ──────
const incidentValue = 0.15;
console.log('Genuine incident during the batch-job hour (15%):');
console.log('  static (3% threshold) fires?', staticThresholdFires(incidentValue, 0.03));
console.log('  dynamic (hour-14 baseline) fires?', dynamicThresholdFires(incidentValue, historicalHour14, 3));

// ── Case C: a quiet 3am hour, normally ~0.2%, degrades to 1.5% ─────
const historicalQuietHour = [0.002, 0.0018, 0.0022, 0.0019];
const quietHourDegraded = 0.015;
console.log('Quiet-hour degradation (0.2% baseline -> 1.5%):');
console.log('  static (3% threshold) fires?', staticThresholdFires(quietHourDegraded, 0.03));
console.log('  dynamic (3am baseline) fires?', dynamicThresholdFires(quietHourDegraded, historicalQuietHour, 3));
// -> Normal batch job:      static=true (FALSE POSITIVE)   dynamic=false
// -> Genuine incident:      static=true                    dynamic=true
// -> Quiet-hour degradation: static=false (FALSE NEGATIVE) dynamic=true`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The dynamic check correctly stays silent for the normal batch-job week (Case A) and correctly fires for the genuine incident (Case B) — both use the exact same <code>historicalHour14</code> baseline and the same 3-standard-deviation multiplier. What is different about the two input values that makes the SAME comparison produce two different outcomes?',
  hint: 'Compute the actual upper bound (<code>mean + 3 * stddev</code>) for <code>historicalHour14</code>, then check where 0.040 and 0.15 each fall relative to it.',
  solution: `// historicalHour14's own mean is ~0.040 with a very small standard
// deviation (the four samples are all tightly clustered around 4%),
// so mean + 3*stddev works out to only slightly above 0.04 -- roughly
// 0.045-0.05 depending on the exact stddev.
//
// 0.040 (Case A) sits AT the historical mean -- comfortably below that
// upper bound, so the check correctly stays silent: this week's batch
// job is behaving exactly like every prior week's did.
//
// 0.15 (Case B) is roughly 3-4x the upper bound itself, not just
// somewhat above the mean -- a genuinely enormous deviation from this
// hour's own established pattern, which is exactly what the
// 3-standard-deviation multiplier is calibrated to catch.
//
// The general principle: a dynamic threshold isn't "more lenient" or
// "more strict" than a static one in some fixed direction -- it moves
// its own effective bar up or down per time slot based on THAT slot's
// own historical variance, which is precisely why it can be simultaneously
// MORE tolerant of the batch job's normal spike and MORE sensitive to
// the quiet hour's small-but-real degradation than any single flat
// number could be.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'A dynamic threshold is strictly better than a static one and should replace static thresholds everywhere.',
    reality: 'The page’s own QnA states the opposite conclusion directly: "static thresholds are simpler and sufficient for most services." Dynamic thresholds need real historical data for the SAME time-of-week/time-of-day slot before they’re trustworthy at all — a newly-deployed service, or one whose traffic pattern genuinely doesn’t have a stable weekly/daily shape, has nothing meaningful to compare against, and a dynamic threshold computed from noisy or insufficient history can be less reliable than a well-chosen flat number.',
  },
  {
    thought: 'Since the demo uses a 3-standard-deviation multiplier consistently for both the batch-job hour and the quiet hour, that number is a universal, one-size-fits-all constant that would work for any service.',
    reality: 'The multiplier (3, in this demo) is a tunable sensitivity knob, not a fixed law — a lower multiplier (say, 2) fires more eagerly and catches smaller deviations at the cost of more false positives, while a higher one (say, 4) is more conservative. What stays constant across BOTH hours in the demo isn’t the multiplier producing identical absolute thresholds — it’s the same RULE (mean plus N standard deviations of THAT slot’s own history) being applied independently per time slot, which is what lets the same rule produce two very different absolute cutoffs (~0.05 for the busy hour, ~0.003 for the quiet one).',
  },
];

@Component({
  selector: 'app-obs-alerting-dynamic-threshold',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './dynamic-thresholds-catch-what-a-static-one-misses.html',
  styleUrl: './dynamic-thresholds-catch-what-a-static-one-misses.scss',
})
export class DynamicThresholdsCatchWhatAStaticOneMissesSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
