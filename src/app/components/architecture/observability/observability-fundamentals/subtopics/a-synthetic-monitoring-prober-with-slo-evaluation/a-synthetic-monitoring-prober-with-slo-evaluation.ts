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
    heading: 'Active Observability, Described in Detail, Never Built',
    points: [
      'The QnA on active vs. passive observability names synthetic monitoring precisely — "run scripted user journeys every minute... blackbox probers: HTTP health checks... catches issues when no real users are active" — but no codeTab anywhere on the page builds an actual prober or connects its results to anything.',
      'The genuinely useful property active probing has over waiting for real traffic: a synthetic probe fires on a FIXED schedule regardless of whether any real user happens to be hitting the endpoint at that moment — which is exactly why the QnA calls out "catches issues when no real users are active (off-peak, before launch)" as a distinct advantage over passive observability, which can only ever observe traffic that actually occurred.',
      'A synthetic probe’s results are only useful once they’re evaluated against a target — a raw stream of "succeeded / failed / took N ms" results doesn’t answer "is this healthy?" on its own; that’s exactly what an SLO (a target like "99.5% of probes succeed within 2 seconds") is for, tying this subtopic directly back to the page’s own theory on the metrics-alerting pillar.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Synthetic Prober + SLO Evaluation',
    language: 'typescript',
    code: `interface ProbeResult {
  latencyMs: number;
  success: boolean;   // did the endpoint respond with a healthy status?
  timedOut: boolean;
}

class SyntheticProber {
  private results: ProbeResult[] = [];
  constructor(private intervalMs: number, private timeoutMs: number) {}

  recordProbe(latencyMs: number, success: boolean) {
    this.results.push({ latencyMs, success, timedOut: latencyMs > this.timeoutMs });
  }

  evaluateSlo(targetSuccessRate: number) {
    const total = this.results.length;
    // A probe that "succeeded" but exceeded the timeout still counts as
    // a failure for SLO purposes -- a slow success isn't a real success.
    const successes = this.results.filter(r => r.success && !r.timedOut).length;
    const successRate = total === 0 ? 1 : successes / total;

    const sortedLatencies = [...this.results].map(r => r.latencyMs).sort((a, b) => a - b);
    const p99 = sortedLatencies[Math.floor(total * 0.99)] ?? 0;

    return { total, successes, successRate, p99, sloMet: successRate >= targetSuccessRate };
  }
}

// Simulated: a prober checking every 60s with a 2s timeout, over 100 probes.
const prober = new SyntheticProber(60_000, 2_000);

// 97 fast, healthy probes
for (let i = 0; i < 97; i++) prober.recordProbe(150 + Math.random() * 50, true);
// 2 probes that "succeeded" but took too long (over the 2s timeout)
for (let i = 0; i < 2; i++) prober.recordProbe(2_500, true);
// 1 genuine failure
prober.recordProbe(0, false);

const result = prober.evaluateSlo(0.995); // 99.5% target
console.log(result);
// -> { total: 100, successes: 97, successRate: 0.97, p99: 2500, sloMet: false }
//
// Only 97/100 probes counted as genuine successes (the 2 slow ones don't
// count) -- 0.97 is below the 0.995 target, so the SLO is NOT met, even
// though a naive "success: true" count alone would have read 99/100.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The team lowers their timeout from 2 seconds to 500ms (a stricter latency requirement) and re-runs the SAME 100 probes above (97 at 150-200ms, 2 at 2,500ms, 1 genuine failure) against the new 500ms timeout. Does the SLO evaluation change, and if so, how?',
  hint: 'The 97 "fast" probes were recorded at 150ms + up to 50ms of randomness — check whether ANY of them could exceed a 500ms timeout, then check what changes for the 2 already-slow probes.',
  solution: `// The 97 fast probes (150-200ms) are all comfortably under the NEW 500ms
// timeout too -- none of them flip to timedOut: true.
// The 2 probes at 2,500ms were ALREADY over the OLD 2,000ms timeout, and
// are obviously still over the new, stricter 500ms timeout too.
// The 1 genuine failure is unaffected by the timeout change (success:
// false regardless).
//
// Re-evaluated with the new prober instance (SyntheticProber with
// timeoutMs = 500):
//   successes: still 97 (the same 97 fast probes)
//   successRate: still 0.97
//   sloMet: still false (0.97 < 0.995)
//
// The SLO EVALUATION doesn't change in this specific case -- but that's
// a property of THESE PARTICULAR numbers, not a general rule: lowering
// the timeout can only ever REDUCE successRate (by reclassifying more
// probes as timed-out), never increase it, since a probe that was
// already under the old timeout might now exceed a stricter one, but a
// probe that exceeded the old timeout can never newly qualify as
// "within" a stricter one. A team tightening their timeout should
// expect their measured success rate to hold steady or drop, never
// improve, purely as a mechanical consequence of the stricter bar.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Synthetic (active) monitoring and passive observability (metrics/logs/traces from real traffic) measure the same underlying reliability — synthetic checks are just a cheaper way to get the same signal.',
    reality: 'They measure genuinely different things, as the QnA’s own framing makes clear: passive observability only ever reflects what ACTUALLY happened to real user requests, while synthetic monitoring runs on its own fixed schedule regardless of real traffic — which is precisely why it can catch an outage during a genuinely quiet period (2am, before a launch) that passive signals would have no data for at all.',
  },
  {
    thought: 'A probe result marked <code>success: true</code> should always count as a success when evaluating an SLO.',
    reality: 'The codeTab’s own <code>evaluateSlo()</code> deliberately excludes a "successful but timed-out" probe from the success count — a response that eventually arrived but took far longer than the timeout threshold represents a real latency violation, and treating it as an unqualified success would hide a genuine SLO breach behind a technically-true boolean.',
  },
  {
    thought: 'Tightening a probe’s timeout threshold is a purely cosmetic configuration change that has no effect on a team’s measured reliability numbers.',
    reality: 'The Try It above establishes the real, one-directional mechanical relationship: lowering a timeout can only ever hold a measured success rate steady or push it down (by reclassifying previously-acceptable probes as timeouts) — it can never push the measured rate up, since no probe newly qualifies as "faster" just because the threshold moved.',
  },
];

@Component({
  selector: 'app-obs-fundamentals-synthetic-monitoring',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './a-synthetic-monitoring-prober-with-slo-evaluation.html',
  styleUrl: './a-synthetic-monitoring-prober-with-slo-evaluation.scss',
})
export class ASyntheticMonitoringProberWithSloEvaluationSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
