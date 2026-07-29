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
  templateUrl: './fraud-timeout-breaks-the-pages-own-2-3x-rule.html',
  styleUrl: './fraud-timeout-breaks-the-pages-own-2-3x-rule.scss'
})
export class FraudTimeoutBreaksThePagesOwn23xRuleSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A rule the page states clearly, then doesn\'t consistently follow in its own solution',
      points: [
        'The main page\'s own QnA is explicit about timeout sizing: "Look at the p99 latency of the downstream in normal conditions... Set timeout at 2-3x that value." The Challenge description states fraudService\'s p99 latency as 800ms. The Challenge\'s original solution set its timeout for that exact call to 1000ms — a ratio of only 1.25x, not 2-3x. The code has been corrected to follow the page\'s own stated rule.',
        'This is worth flagging specifically because the SAME solution code applies the rule correctly elsewhere: stripe.charge has a stated p99 of 2000ms, and the solution sets its timeout to 5000ms — a ratio of 2.5x, squarely inside the "2-3x" range. One call in the solution follows the rule; the other, right next to it, does not.',
      ]
    },
    {
      heading: 'Why a too-tight timeout is a real problem, not just an inconsistency',
      points: [
        'By definition, p99 latency means 1% of normal, healthy requests already take LONGER than that figure. A timeout set at only 1.25x p99 leaves very little headroom above that 1% tail — a meaningfully larger fraction of genuinely healthy fraud-check calls would be expected to exceed a 1000ms cutoff than the "2-3x" rule\'s wider margin would allow.',
        'Because this specific call has a FALLBACK (allow the payment with an "unknown risk" flag when the circuit is open or the call fails), a too-tight timeout does not cause outright failures — it silently and more frequently routes legitimate, still-healthy fraud checks into the "unknown risk" fallback path, which is exactly the kind of quiet, hard-to-notice degradation that motivates having a considered timeout-sizing rule in the first place rather than picking a round number.',
      ]
    },
    {
      heading: 'The fix: apply the page\'s own rule consistently',
      points: [
        'Using the same 2-3x multiplier the stripe.charge call already follows, an 800ms p99 fraud-check call should use a timeout in the roughly 1600-2400ms range — the corrected solution uses 2000ms (exactly 2.5x, matching the ratio already used for stripe.charge).',
        'This is a good habit to check for generally: when a page (or a codebase) states an explicit rule for sizing a value, it is worth verifying every place that value is actually SET follows the stated rule — a rule stated once but applied inconsistently is easy to miss on a single read-through, especially when the inconsistent instance is not directly next to the rule\'s own statement.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Checking each timeout against the page\'s own rule',
      language: 'typescript',
      code: `interface TimeoutCheck {
  call: string;
  p99Ms: number;
  timeoutMs: number;
  ratio: number;
  followsThe2To3xRule: boolean;
}

const checks: TimeoutCheck[] = [
  {
    call: 'fraudService.check() (BEFORE fix)',
    p99Ms: 800,
    timeoutMs: 1000,
    ratio: 1000 / 800,       // 1.25
    followsThe2To3xRule: false,
  },
  {
    call: 'fraudService.check() (AFTER fix)',
    p99Ms: 800,
    timeoutMs: 2000,
    ratio: 2000 / 800,       // 2.5 -- matches stripe.charge's own ratio below
    followsThe2To3xRule: true,
  },
  {
    call: 'stripe.charge() (unchanged, already correct)',
    p99Ms: 2000,
    timeoutMs: 5000,
    ratio: 5000 / 2000,      // 2.5
    followsThe2To3xRule: true,
  },
];

// The SAME solution followed its own stated rule for one call
// and not the other -- worth checking every timeout against the
// rule individually, not assuming consistency across a file.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A reviewer reads the page\'s QnA ("set timeout at 2-3x p99") and then reads the Challenge solution\'s stripe.charge call (p99=2000ms, timeout=5000ms) and concludes the whole solution correctly follows the stated rule. Is that conclusion safe to generalize to every timeout in the same solution?',
    hint: 'Does confirming the rule holds for ONE call in a file guarantee it holds for every other call in that same file?',
    solution: 'No — checking one call\'s ratio does not verify the rest. In this exact solution, stripe.charge does follow the rule (2000ms p99, 5000ms timeout, a 2.5x ratio), but the fraudService.check() call right above it originally used an 800ms p99 with only a 1000ms timeout — a 1.25x ratio, well below the stated 2-3x range. A reviewer who checks only one call and generalizes to "the solution follows its own rule" would miss this. The safe practice is to check EVERY timeout value against the stated rule individually, especially in a file with multiple downstream calls that could each have been tuned differently (or, as happened here, inconsistently).'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since the Challenge solution clearly states and follows the "2-3x p99" rule for at least one call, the whole solution can be assumed to apply it consistently.',
      reality: 'Per this subtopic\'s theory, the SAME solution applied the rule correctly to stripe.charge (2.5x) but not to fraudService.check() (1.25x, before the fix) — one correct instance does not guarantee every instance in the same file follows the stated rule.'
    },
    {
      thought: 'A timeout set too close to a service\'s p99 latency is a minor inefficiency, not a real problem, since the service usually responds well within that time anyway.',
      reality: 'Per this subtopic\'s theory, p99 latency BY DEFINITION means 1% of healthy requests already exceed it — a timeout with little headroom above p99 causes a meaningfully larger fraction of healthy calls to be treated as failures than a properly-sized timeout would, silently routing more traffic into fallback paths than intended.'
    },
    {
      thought: 'Because the fraud-check call has a fallback (allow with an "unknown risk" flag), a too-tight timeout on it is harmless — the payment still succeeds either way.',
      reality: 'Per this subtopic\'s theory, the payment succeeding is not the same as the fraud check working as intended — a too-tight timeout means MORE legitimate transactions silently skip real fraud screening and fall back to "unknown risk" than the design intended, a quiet but real degradation in the fraud-detection coverage the feature exists to provide.'
    }
  ];
}
