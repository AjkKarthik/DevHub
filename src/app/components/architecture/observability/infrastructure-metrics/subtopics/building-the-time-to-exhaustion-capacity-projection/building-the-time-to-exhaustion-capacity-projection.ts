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
    heading: 'From "80% Full" to "Will Run Out in 2 Hours"',
    points: [
      'The main page’s own QnA on capacity alerting names time-to-exhaustion as "the most useful capacity alert" and gives a precise worked example in prose: a disk filling gradually over 2 weeks is far less urgent than one filling in 2 hours, even if both are AT the exact same percent-full threshold right now. Neither the theory section nor any codeTab on the page ever turns this into an actual projection function.',
      'The calculation itself is simple once stated precisely: given how much capacity remains and the current growth rate, <code>hoursRemaining = remainingCapacity / growthRatePerHour</code> — a plain division, but one that requires tracking growth rate over time (typically via a PromQL <code>predict_linear()</code> or <code>deriv()</code> query in production, since a single point-in-time reading has no rate information at all).',
      'This is what makes time-to-exhaustion strictly more actionable than a flat percent-full threshold alone: a 500GB disk at 80% full (400GB used, 100GB free) can mean "14 days of headroom" or "2 hours of headroom" depending ENTIRELY on the current fill rate — the same percentage, wildly different urgency, verified with the page’s own exact numbers below.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Time-to-Exhaustion, Verified Against the QnA’s Own Numbers',
    language: 'typescript',
    code: `interface ExhaustionProjection { hoursRemaining: number; exhausted: boolean }

function projectExhaustion(
  currentUsedBytes: number,
  capacityBytes: number,
  growthBytesPerHour: number
): ExhaustionProjection {
  const remainingBytes = capacityBytes - currentUsedBytes;
  if (remainingBytes <= 0) return { hoursRemaining: 0, exhausted: true };
  if (growthBytesPerHour <= 0) return { hoursRemaining: Infinity, exhausted: false };
  return { hoursRemaining: remainingBytes / growthBytesPerHour, exhausted: false };
}

const GB = 1024 ** 3;
const capacity = 500 * GB;

// Scenario A: the QnA's own "2 weeks" example -- 100GB free, filling slowly
const usedSlow = 400 * GB;
const growthSlow = (100 * GB) / (14 * 24); // fills the remaining 100GB over 14 days
const slow = projectExhaustion(usedSlow, capacity, growthSlow);
console.log('Slow fill:', (slow.hoursRemaining / 24).toFixed(1), 'days remaining');

// Scenario B: the QnA's own "2 hours" example -- 20GB free, filling fast
const usedFast = 480 * GB;
const growthFast = (20 * GB) / 2; // fills the remaining 20GB over 2 hours
const fast = projectExhaustion(usedFast, capacity, growthFast);
console.log('Fast fill:', fast.hoursRemaining.toFixed(2), 'hours remaining');

// Alert on lead time, not raw percent-full
function shouldAlert(projection: ExhaustionProjection, thresholdHours = 24): boolean {
  return projection.hoursRemaining <= thresholdHours;
}
console.log('Slow fill alerts (24h threshold)?', shouldAlert(slow));
console.log('Fast fill alerts (24h threshold)?', shouldAlert(fast));
// -> Slow fill: 14.0 days remaining
// -> Fast fill: 2.00 hours remaining
// -> Slow fill alerts (24h threshold)? false
// -> Fast fill alerts (24h threshold)? true`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The codeTab’s two scenarios sit at different percentages (80% full for the slow fill, 96% full for the fast fill), and only the higher-percentage one alerts. Could a disk at a LOWER percent-full than another disk still be the one that gets flagged first by <code>shouldAlert()</code>’s 24-hour threshold?',
  hint: 'The alert function only ever looks at <code>hoursRemaining</code> — trace what determines that value and whether percent-full is even one of its inputs directly.',
  solution: `// Yes, easily -- percent-full plays no direct role in shouldAlert() at all,
// only hoursRemaining does, which is a function of remaining CAPACITY and
// growth RATE, not the current percentage.
//
// Concretely: a disk at 50% full (250GB used, 250GB free on a 500GB disk)
// growing at 300GB/hour would have hoursRemaining = 250/300 = ~0.83 hours
// -- it WOULD alert under the 24h threshold, despite being only half full,
// because a runaway growth rate (a logging bug, a leaked temp-file writer)
// can exhaust even a mostly-empty disk within the hour.
//
// Meanwhile the page's own "2 weeks" scenario sits at 80% full and does
// NOT alert -- a higher percentage but a controlled, predictable growth
// rate. This is exactly why the main page's own QnA calls time-to-
// exhaustion "the most useful capacity alert" ahead of a flat percent-full
// threshold: percent-full alone cannot distinguish these two situations,
// but a projection that accounts for RATE can.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'A time-to-exhaustion projection is strictly better than a percent-full alert, so percent-full thresholds should be dropped entirely once this is in place.',
    reality: 'The Try It above shows the projection can fire on a disk that’s only 50% full — a genuinely useful early warning, but one that depends entirely on the growth-rate ESTIMATE being accurate over the sampled window. A brief, unusual spike in growth rate (a one-time large file copy) can produce a falsely alarming short projection that a percent-full threshold would have correctly ignored; the two approaches catch different failure modes and are complementary, not a strict upgrade.',
  },
  {
    thought: 'The <code>growthBytesPerHour</code> input can just be computed once and reused indefinitely — growth rate for a given disk is roughly constant.',
    reality: 'Growth rate is exactly the kind of quantity that needs to be recomputed on a rolling window (in real PromQL, via <code>predict_linear()</code> or <code>deriv()</code> over something like a 6-hour lookback) — a disk’s fill rate can change sharply when a new feature ships, a batch job starts writing more data, or log verbosity changes, and a stale growth-rate estimate produces a stale (and potentially dangerously wrong) time-to-exhaustion projection.',
  },
  {
    thought: 'A negative or zero <code>growthBytesPerHour</code> (disk usage flat or shrinking) is an edge case that would break the function or produce a nonsensical negative time.',
    reality: '<code>projectExhaustion()</code> explicitly handles this: it returns <code>Infinity</code> for <code>hoursRemaining</code> whenever growth is zero or negative, correctly representing "at this rate, capacity is never exhausted" rather than dividing by a non-positive number or producing a negative/undefined result.',
  },
];

@Component({
  selector: 'app-obs-infra-metrics-exhaustion-projection',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './building-the-time-to-exhaustion-capacity-projection.html',
  styleUrl: './building-the-time-to-exhaustion-capacity-projection.scss',
})
export class BuildingTheTimeToExhaustionCapacityProjectionSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
