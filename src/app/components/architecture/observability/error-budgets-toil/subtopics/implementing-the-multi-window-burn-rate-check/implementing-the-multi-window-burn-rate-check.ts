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
    heading: 'The Challenge Computes One Window — the Page’s Own Alert Needs Two',
    points: [
      'The page’s own theory is explicit: "Multi-window burn rate: combine a short window (1h, for fast detection) and a long window (6h, for significance)... Both windows must exceed the threshold before firing." The page’s own "Error Budget Tracking" code tab implements exactly this in its <code>ErrorBudgetBurningCritical</code> alert — two separate PromQL expressions, both required, joined with <code>AND</code>.',
      'The page’s own Challenge, though, only ever asks for and verifies a SINGLE-value function — <code>computeBurnRate(errorRate, sloTarget)</code> — with no version combining two windows into one pass/fail decision. The theory and the PromQL example both describe the multi-window check; nothing on the page actually runs it end-to-end as working, testable code.',
      'Built directly on top of the page’s own <code>computeBurnRate()</code> (reused unmodified, not reimplemented), verified against exactly the scenario multi-window burn rate exists to distinguish: a brief, transient spike that pushes the SHORT window’s burn rate well past the critical threshold while the LONG window — diluted by the surrounding healthy traffic — stays low, correctly does NOT fire, while a genuinely sustained incident elevating BOTH windows correctly does.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Multi-Window Check, Built on the Page\'s Own computeBurnRate()',
    language: 'typescript',
    code: `// The page's own Challenge function, reused unmodified
function computeBurnRate(errorRate: number, sloTarget: number): number {
  const allowedErrorRate = 1 - sloTarget;
  return Math.round((errorRate / allowedErrorRate) * 100) / 100;
}

interface MultiWindowResult {
  shortBurn: number;
  longBurn: number;
  fires: boolean;
}

function evaluateMultiWindowBurnRate(
  shortWindowErrorRate: number,
  longWindowErrorRate: number,
  sloTarget: number,
  threshold: number
): MultiWindowResult {
  const shortBurn = computeBurnRate(shortWindowErrorRate, sloTarget);
  const longBurn = computeBurnRate(longWindowErrorRate, sloTarget);
  return {
    shortBurn,
    longBurn,
    fires: shortBurn > threshold && longBurn > threshold, // matches the page's own AND
  };
}

// ── Case A: a transient 5-minute spike ─────────────────────────────
// The 1h window still shows it elevated; the 6h window, diluted by
// the surrounding healthy traffic, does not.
console.log('Transient spike:');
console.log(evaluateMultiWindowBurnRate(0.02, 0.0015, 0.999, 14));

// ── Case B: a genuine, sustained incident ──────────────────────────
// Both windows show high burn rate throughout.
console.log('Sustained incident:');
console.log(evaluateMultiWindowBurnRate(0.02, 0.018, 0.999, 14));
// -> Transient spike:      { shortBurn: 20, longBurn: 1.5, fires: false }
// -> Sustained incident:   { shortBurn: 20, longBurn: 18,  fires: true }`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The transient-spike case has a short-window burn rate of 20 — well above the 14 threshold on its own. If the alert only checked the SHORT window (dropping the AND on the long window entirely), what real operational cost would that simpler, single-window version have, given that it would have paged on-call for this exact scenario?',
  hint: 'Think about what happens to on-call’s trust in the alert over many such transient spikes, referencing what the page’s own Alerting Design topic calls this exact failure mode.',
  solution: `// A short-window-only check would page on-call for every transient
// spike that happens to push the 1h window's burn rate past 14x, even
// when the surrounding 6h window shows the budget is barely being
// touched -- exactly the false-positive pattern the sibling Alerting
// Design topic's own theory names directly: alerts that fire for
// self-resolving, non-actionable conditions train engineers to start
// ignoring pages, including the real ones. A brief spike from a
// deploy's rolling restart, a single downstream dependency's transient
// blip, or a load-balancer health-check flap could all trigger a
// short-window-only page with zero real user-facing consequence
// worth waking someone up for.
//
// The long-window requirement isn't just extra caution for its own
// sake -- it's specifically what lets the alert distinguish "burning
// fast AND sustained" (genuinely urgent) from "burning fast for a
// moment, then recovering" (self-resolving, and confirmed as such by
// the fact that the long window never got elevated in the first
// place).`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since the transient-spike case correctly doesn’t fire, that means the incident is being missed entirely — nobody gets alerted to it at all.',
    reality: 'The page’s own theory explicitly frames the SHORT window as being "for fast detection" specifically so a genuinely severe, sustained problem gets caught quickly — a spike that resolves on its own within the short window, before the long window ever reflects it, is by definition not the kind of sustained, budget-threatening event burn-rate paging exists to catch. The page’s own alert tiers (Page/Ticket/Record) exist precisely so a brief anomaly that self-resolves can still surface on a dashboard or a lower-urgency channel without waking anyone up.',
  },
  {
    thought: 'The 14× threshold is a universal constant that applies to any burn-rate alert, regardless of window length.',
    reality: 'The threshold and the window LENGTHS are chosen together, as a pair, to target a specific "time until budget exhaustion" — the page’s own theory ties 14× specifically to "the monthly budget exhausts in 2.5 days" for a 30-day SLO window. A team using a 7-day SLO window (a weekly budget instead of monthly) would need a DIFFERENT threshold to represent the same "exhausted in roughly 2.5 days" urgency, since 14× of a smaller total budget exhausts proportionally faster in absolute time.',
  },
];

@Component({
  selector: 'app-obs-error-budgets-multiwindow',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './implementing-the-multi-window-burn-rate-check.html',
  styleUrl: './implementing-the-multi-window-burn-rate-check.scss',
})
export class ImplementingTheMultiWindowBurnRateCheckSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
