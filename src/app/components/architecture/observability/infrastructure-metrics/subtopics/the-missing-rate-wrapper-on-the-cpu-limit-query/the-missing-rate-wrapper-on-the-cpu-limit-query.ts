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
    heading: 'A Raw Counter Divided by a Limit Grows Forever, Regardless of Load',
    points: [
      'The main page’s own "Kubernetes Metrics" theory bullet originally gave <code>container_cpu_usage_seconds_total / kube_pod_container_resource_limits{resource="cpu"}</code> as the "CPU throttling ratio," with "if &gt; 0.8 you are consistently hitting CPU limits" as the reading. <code>container_cpu_usage_seconds_total</code> is a monotonic COUNTER — it only ever goes up, accumulating total CPU-seconds consumed since the container started. Dividing it directly by a static limit, with no <code>rate()</code> wrapper, is the same class of mistake this hub’s own Prometheus & Metrics topic already warns against generally.',
      'Worked through with concrete numbers: a container with a 1-core limit running at a genuinely healthy, un-throttled 10% average CPU usage the whole time still crosses the page’s own "&gt; 0.8" threshold within the FIRST MINUTE it’s alive, and the "ratio" keeps climbing without bound for as long as the container keeps running — 6.0 after 1 minute, 30.0 after 5 minutes, 360.0 after an hour — entirely independent of how busy the CPU actually is.',
      'The correctly-formed query wraps the counter in <code>rate(...[5m])</code> FIRST, converting cumulative CPU-seconds into cores-used-per-second over a rolling window, THEN divides by the limit — this genuinely tracks the container’s current usage relative to its limit, and stays flat at the true ~0.10 value for the same healthy container instead of climbing forever.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'The Bug, Reproduced With Realistic Numbers',
    language: 'typescript',
    code: `// Simulate container_cpu_usage_seconds_total (a monotonic counter) for a
// container with CPU limit = 1 core, running at a genuinely healthy 10%
// average usage the ENTIRE time -- nowhere near actually hitting its limit.
const limitCores = 1;
const avgUsageFraction = 0.10; // 10% of 1 core

function usageSecondsAfter(elapsedSeconds: number): number {
  return elapsedSeconds * limitCores * avgUsageFraction;
}

console.log('BROKEN (no rate()): usage_seconds_total / limit');
for (const minutes of [1, 5, 10, 30, 60]) {
  const elapsed = minutes * 60;
  const rawRatio = usageSecondsAfter(elapsed) / limitCores;
  console.log(\`  after \${minutes}min: raw ratio = \${rawRatio.toFixed(2)} (threshold is >0.8 = "hitting limits")\`);
}

console.log();
console.log('FIXED: rate(usage_seconds_total[5m]) / limit');
const windowSec = 300;
const rateValue = (usageSecondsAfter(windowSec) - usageSecondsAfter(0)) / windowSec; // cores/sec
const correctRatio = rateValue / limitCores;
console.log(\`  correct ratio = \${correctRatio.toFixed(2)} -- correctly reflects the true 10% usage\`);

// -> BROKEN (no rate()): usage_seconds_total / limit
// ->   after 1min: raw ratio = 6.00 (threshold is >0.8 = "hitting limits")
// ->   after 5min: raw ratio = 30.00 (threshold is >0.8 = "hitting limits")
// ->   after 10min: raw ratio = 60.00 (threshold is >0.8 = "hitting limits")
// ->   after 30min: raw ratio = 180.00 (threshold is >0.8 = "hitting limits")
// ->   after 60min: raw ratio = 360.00 (threshold is >0.8 = "hitting limits")
// ->
// -> FIXED: rate(usage_seconds_total[5m]) / limit
// ->   correct ratio = 0.10 -- correctly reflects the true 10% usage`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The main page’s own "Deployment health" bullet, right below the fixed one, gives <code>kube_deployment_status_replicas_available / kube_deployment_spec_replicas</code> with no <code>rate()</code> wrapper at all — and it’s NOT a bug. Why is this formula safe without <code>rate()</code>, while the CPU one needed it?',
  hint: 'Ask what TYPE of metric each one is at its core — does the value only ever increase over time, or can it go up and down to reflect a current state?',
  solution: `// kube_deployment_status_replicas_available and kube_deployment_spec_replicas
// are both GAUGES, not counters -- they report the CURRENT number of
// available/desired replicas at scrape time, and can go up or down freely
// as pods come and go. Dividing two gauges gives a meaningful "ratio right
// now" with no rate() involved at all.
//
// container_cpu_usage_seconds_total, by contrast, is a COUNTER -- it only
// ever accumulates, forever, for as long as the container has been alive.
// A counter has to be wrapped in rate() (or increase()) to turn "total
// seconds consumed since start" into "seconds consumed per second, right
// now" -- a meaningful, bounded quantity. Dividing a raw counter by
// anything static just measures how long the container has existed, not
// how busy it currently is.
//
// The general rule (already established on this hub's own Prometheus &
// Metrics topic for the OTHER direction -- applying rate() to a gauge is
// meaningless): counters need rate()/increase() before they're usable in
// a ratio; gauges are already usable as-is.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'The original formula was only wrong in how it was LABELED — it correctly measured something, just not throttling specifically.',
    reality: 'It’s wrong on BOTH counts, and they’re independent bugs: even setting the mislabeling aside entirely, the formula itself is mathematically broken without <code>rate()</code> — it doesn’t measure "usage relative to limit" either, it just measures elapsed time scaled by the average usage fraction, which is a completely different (and far less useful) quantity that happens to share some of the same input metrics.',
  },
  {
    thought: 'A container that’s been running a long time and shows a "ratio" over 0.8 under the broken formula is at least a WEAK signal of something worth investigating, even if the number itself is wrong.',
    reality: 'It’s not even a weak signal — the broken ratio crosses 0.8 within roughly 48 seconds for a container using just 10% of a 1-core limit (verified in the codeTab above: 6.00 after only 1 minute), and it crosses 0.8 for EVERY container regardless of load, sooner or later, purely because time keeps passing. A value that inevitably fires for 100% of containers carries zero diagnostic information at all.',
  },
  {
    thought: 'The correctly-formed <code>rate()</code>-wrapped query and the page’s own separate CPU throttling ratio query (<code>container_cpu_throttled_seconds_total / container_cpu_usage_seconds_total</code>) are measuring the same underlying thing, just phrased differently.',
    reality: 'They’re genuinely different signals answering different questions: the fixed usage-to-limit ratio answers "how much of my CPU allocation am I currently using" (can be near 1.0 with zero throttling, if the container is efficiently using exactly what it’s allotted), while the throttling ratio answers "how often is the kernel actually denying me CPU time after I’ve exhausted my quota within an enforcement period" — a container can run at 95% of its limit indefinitely with 0% throttling, or hit real throttling at a lower usage ratio depending on burst patterns within each CFS enforcement window.',
  },
];

@Component({
  selector: 'app-obs-infra-metrics-rate-wrapper-bug',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-missing-rate-wrapper-on-the-cpu-limit-query.html',
  styleUrl: './the-missing-rate-wrapper-on-the-cpu-limit-query.scss',
})
export class TheMissingRateWrapperOnTheCpuLimitQuerySubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
