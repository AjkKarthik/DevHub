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
    heading: 'Trusting a Probabilistic Config Value Without Ever Measuring It',
    points: [
      'The page’s own "Custom Fault Injection" code tab configures <code>errorRate</code> and <code>latencyMs</code> as plain numbers, then uses <code>Math.random() < faultConfig.errorRate</code> to decide whether to throw. Nowhere on the page is this checked against actual observed behavior — the reader is asked to trust that a configured "0.1" genuinely means "roughly 10% of calls fail," and that a configured "50ms" of latency is genuinely applied.',
      'A single test call, or even a handful of manual runs, cannot confirm a PROBABILISTIC value like this is calibrated correctly — a 10%-failure-rate injector could, by pure chance, succeed 10 times in a row on any given short run. The only way to actually confirm the configured rate is real is to run it enough times that the LAW OF LARGE NUMBERS makes the observed frequency converge on the true probability.',
      'Verified directly over 20,000 trials: with <code>errorRate</code> configured to 0.1, the observed failure rate came back at 0.0998 — within a tenth of a percentage point of the configured value. Separately, with <code>latencyMs</code> configured to 50, a single measured call took 55ms end-to-end, confirming the delay is genuinely applied to the caller’s own wall-clock time, not just recorded in config and ignored.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Statistical Verification, Over 20,000 Trials',
    language: 'typescript',
    code: `class FaultInjectionMiddleware {
  static faultConfig = { errorRate: 0, latencyMs: 0, enabled: true };

  static async injectFault(): Promise<void> {
    if (!this.faultConfig.enabled) return;
    if (this.faultConfig.latencyMs > 0) {
      await new Promise((r) => setTimeout(r, this.faultConfig.latencyMs));
    }
    if (Math.random() < this.faultConfig.errorRate) {
      throw new Error('Injected fault: simulated downstream failure');
    }
  }
}

async function main() {
  // ── Statistically verify errorRate over many trials ────────────
  FaultInjectionMiddleware.faultConfig = { errorRate: 0.1, latencyMs: 0, enabled: true };
  const trials = 20_000;
  let failures = 0;
  for (let i = 0; i < trials; i++) {
    try {
      await FaultInjectionMiddleware.injectFault();
    } catch {
      failures++;
    }
  }
  const observedRate = failures / trials;
  console.log(\`Configured errorRate: 0.1, observed over \${trials} trials: \${observedRate.toFixed(4)}\`);
  console.log('Within 1 percentage point of configured rate?', Math.abs(observedRate - 0.1) < 0.01);

  // ── Confirm latency is genuinely applied, not just recorded ────
  FaultInjectionMiddleware.faultConfig = { errorRate: 0, latencyMs: 50, enabled: true };
  const start = Date.now();
  await FaultInjectionMiddleware.injectFault();
  const elapsed = Date.now() - start;
  console.log(\`Configured latencyMs: 50, measured elapsed: \${elapsed}ms\`);
  console.log('Latency actually applied (>= 50ms observed)?', elapsed >= 50);
}
main();
// -> Configured errorRate: 0.1, observed over 20000 trials: 0.0998
// -> Within 1 percentage point of configured rate? true
// -> Configured latencyMs: 50, measured elapsed: 55ms
// -> Latency actually applied (>= 50ms observed)? true`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The 20,000-trial run happened to observe 0.0998, extremely close to the configured 0.1. If you re-ran the exact same 20,000-trial test a second time, would you expect to get exactly 0.0998 again?',
  hint: 'Think about what <code>Math.random()</code> actually generates on each call, and what the "law of large numbers" guarantees versus what it doesn’t.',
  solution: `// No -- a second run would almost certainly produce a SLIGHTLY
// different observed rate, like 0.1003 or 0.0996, not the exact same
// 0.0998. Math.random() draws a genuinely different sequence of
// values each run, so the exact count of failures over 20,000 trials
// varies run to run.
//
// What the law of large numbers actually guarantees isn't an EXACT
// repeated result -- it's that the observed rate CONVERGES toward the
// true configured probability as the trial count grows, with the
// remaining random variation (the "noise" around 0.1) shrinking as
// trials increase. 20,000 trials is enough to get within roughly a
// tenth of a percentage point reliably; a much smaller trial count
// (say, 10 trials) would show much wider swings run to run -- getting
// exactly 1 failure (10%) on one run of 10 and 3 failures (30%) on
// the next isn't at all unusual purely from randomness, even though
// the underlying configured rate never changed.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since the observed rate (0.0998) is slightly BELOW the configured rate (0.1), this proves <code>Math.random() < faultConfig.errorRate</code> has a subtle off-by-one-style bias toward fewer failures than configured.',
    reality: '0.0998 vs. 0.1 is well within the ordinary statistical noise expected from a genuinely unbiased 20,000-trial sample — it’s a difference of about 4 failures out of 20,000 trials, not a systematic pattern. <code>Math.random() < threshold</code> is the standard, correct way to implement a probability check in JavaScript (it fires with probability exactly equal to <code>threshold</code>, since <code>Math.random()</code> is uniformly distributed on <code>[0, 1)</code>) — re-running the same test several times would show the observed rate landing sometimes slightly above 0.1 and sometimes slightly below, centered on 0.1, which is exactly what an unbiased implementation should produce.',
  },
  {
    thought: 'The latency check (a single 55ms measurement against a configured 50ms) is a weaker form of verification than the 20,000-trial error-rate check, since it only ran once.',
    reality: 'The two checks are verifying fundamentally different KINDS of claims, which is why they need different amounts of evidence. <code>errorRate</code> is a PROBABILISTIC claim ("roughly 10% of calls fail") that can only be checked by observing many trials and looking at the aggregate frequency. <code>latencyMs</code> is a DETERMINISTIC claim for any single call ("this specific call waits at least 50ms") — a single measurement genuinely is sufficient to confirm or refute it, since the underlying <code>setTimeout</code> delay isn’t random at all; running it 20,000 more times would just repeat the same true/false answer each time, with only ordinary system-timer jitter (the extra 5ms observed here) varying between runs.',
  },
];

@Component({
  selector: 'app-obs-chaos-fault-verification',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './verifying-the-fault-injectors-rate-and-latency.html',
  styleUrl: './verifying-the-fault-injectors-rate-and-latency.scss',
})
export class VerifyingTheFaultInjectorsRateAndLatencySubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
