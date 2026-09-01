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
    heading: 'The Decision Logic Behind the PromQL, Never Shown Directly',
    points: [
      'The main page’s own theory names the exact thresholds: "Page (wake someone up) on burn rate > 14× for 1h + 5m windows. Ticket (next business day) on burn rate > 1× for 6h + 30m windows." The "Prometheus Alerting" codeTab configures this via PromQL/YAML alert rules — but PromQL expressions are declarative queries, not the kind of plain, step-through-able DECISION LOGIC a reader can trace by hand to understand exactly why a given set of burn-rate readings does or doesn’t fire.',
      'The whole point of requiring BOTH windows (short AND long) to exceed the threshold, rather than either one alone, is to filter out exactly the failure mode a single-window alert has: a brief spike that a short window catches but a long window correctly recognizes as too diluted to matter, and a slow sustained drift that a long window catches but a short window (measuring only the last few minutes) never sees at all.',
      'This is a DIFFERENT AND channel-appropriate condition from the mistake block’s own "single time window" fix example, which only shows ONE and-condition (<code>burn_rate_1h > 14 AND burn_rate_5m > 14</code>) for the page-level alert — the theory names a SECOND, separate ticket-level condition (6h + 30m at a much lower 1× threshold) that no codeTab ever expresses as runnable logic at all, page-level or otherwise.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Multi-Window Decision Logic, Verified',
    language: 'typescript',
    code: `interface BurnRateReadings {
  rate5m: number;   // burn rate over the last 5 minutes
  rate30m: number;  // burn rate over the last 30 minutes
  rate1h: number;   // burn rate over the last 1 hour
  rate6h: number;   // burn rate over the last 6 hours
}

interface AlertDecision { severity: 'page' | 'ticket' | 'none'; reason: string; }

// Matches the main page's own theory thresholds exactly: page on 14x
// sustained over BOTH 1h and 5m; ticket on 1x sustained over BOTH 6h and 30m.
function evaluateBurnRateAlert(r: BurnRateReadings): AlertDecision {
  const pageCondition = r.rate1h > 14 && r.rate5m > 14;
  if (pageCondition) return { severity: 'page', reason: 'burn rate > 14x sustained over 1h AND 5m' };

  const ticketCondition = r.rate6h > 1 && r.rate30m > 1;
  if (ticketCondition) return { severity: 'ticket', reason: 'burn rate > 1x sustained over 6h AND 30m' };

  return { severity: 'none', reason: 'within budget' };
}

// A brief, acute spike -- both short windows catch it, the long window
// (1h) is still catching up but already elevated too.
console.log(evaluateBurnRateAlert({ rate5m: 20, rate1h: 15, rate6h: 2, rate30m: 18 }));
// -> { severity: 'page', reason: 'burn rate > 14x sustained over 1h AND 5m' }

// A TRUE brief blip -- the 5-minute window spikes, but averaged over the
// full hour, the burn rate dilutes below the 14x page threshold. This is
// EXACTLY the false-positive scenario multi-window alerting exists to
// filter out.
console.log(evaluateBurnRateAlert({ rate5m: 20, rate1h: 8, rate6h: 1.2, rate30m: 5 }));
// -> { severity: 'ticket', reason: 'burn rate > 1x sustained over 6h AND 30m' }
// -- NOT paged, correctly downgraded to a ticket instead, since the 6h/30m
//    ticket condition still holds even though the page condition doesn't.

// Slow, sustained degradation -- never spikes hard enough for the page
// threshold, but consistently exceeds 1x, exactly the "gradual budget
// drain" scenario a single fast-window alert would miss entirely.
console.log(evaluateBurnRateAlert({ rate5m: 1.5, rate1h: 1.4, rate6h: 1.3, rate30m: 1.5 }));
// -> { severity: 'ticket', reason: 'burn rate > 1x sustained over 6h AND 30m' }`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A service has <code>rate5m: 16, rate1h: 16, rate6h: 0.3, rate30m: 0.2</code> — both short windows exceed 14×, but both long windows are well under 1×. What does <code>evaluateBurnRateAlert()</code> return, and does this scenario make physical sense (can a genuinely brand-new spike really show up this way)?',
  hint: 'Walk the function’s own two conditions in order — does the page condition check anything about the 6h/30m windows at all?',
  solution: `// pageCondition only checks rate1h and rate5m -- it never looks at
// rate6h or rate30m at all.
//
// rate1h (16) > 14 AND rate5m (16) > 14 -- both true.
//
// evaluateBurnRateAlert({ rate5m: 16, rate1h: 16, rate6h: 0.3, rate30m: 0.2 })
//   -> { severity: 'page', reason: 'burn rate > 14x sustained over 1h AND 5m' }
//
// And yes, this is physically realistic: a genuinely NEW, severe incident
// that started roughly an hour ago would show exactly this shape -- both
// the 5-minute and 1-hour windows are fully "inside" the incident and
// read high, while the 6-hour and 30-minute-BEFORE-the-incident windows
// are dominated by the many healthy hours preceding it, diluting them
// down near zero. The page fires correctly and immediately here -- it
// does NOT need to wait for the slower 6h ticket-level windows to also
// notice anything, since the page condition is entirely self-contained
// and never depends on the ticket condition at all.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'The "page" and "ticket" alert conditions are two severity levels of the SAME underlying check — ticket fires first, then escalates to page if the situation worsens.',
    reality: 'The codeTab’s own function evaluates them as two INDEPENDENT conditions over completely different window pairs (1h+5m for page, 6h+30m for ticket) — a scenario can trigger the page condition without the ticket condition ever being true at all (a brand-new spike, as the Try It demonstrates), and vice versa (slow sustained drift, as the codeTab’s own third example shows). Neither is a prerequisite for the other.',
  },
  {
    thought: 'Since the page threshold (14×) is much higher than the ticket threshold (1×), any burn rate high enough to trigger a page will always also trigger the ticket condition.',
    reality: 'The codeTab’s own "brief blip" example directly contradicts this: <code>rate5m: 20</code> alone looks page-severity by eye, but the actual page condition requires <code>rate1h</code> to ALSO exceed 14×, and in that example it doesn’t (8×) — meaning the scenario is correctly downgraded to ticket, not page, even with an extremely high instantaneous 5-minute reading.',
  },
  {
    thought: 'A multi-window condition (checking two windows with AND) is strictly more conservative than a single-window check — it can only ever alert LESS often, never differently in kind.',
    reality: 'The two conditions here check ENTIRELY DIFFERENT window pairs at ENTIRELY DIFFERENT thresholds for TWO DIFFERENT PURPOSES (fast detection of acute incidents vs. slow detection of gradual drift) — this isn’t "the same alert, just pickier"; it’s two structurally different alerts running side by side, each catching a failure mode the other is specifically NOT designed to catch.',
  },
];

@Component({
  selector: 'app-obs-sli-slo-sla-multi-window',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-multi-window-burn-rate-decision-logic.html',
  styleUrl: './the-multi-window-burn-rate-decision-logic.scss',
})
export class TheMultiWindowBurnRateDecisionLogicSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
