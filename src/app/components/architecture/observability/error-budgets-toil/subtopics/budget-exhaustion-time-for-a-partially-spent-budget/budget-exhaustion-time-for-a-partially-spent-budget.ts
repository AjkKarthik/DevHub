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
    heading: 'A Formula That Only Ever Appears as a Comment, and Only for a Fresh Budget',
    points: [
      'The page’s own "Error Budget Tracking" code tab ends with two trailing comment lines, never real code: <code>time_remaining_hours = budget_remaining / (burn_rate * error_budget_per_hour)</code>, followed by the worked example "At 14x burn rate: budget exhausted in 30d / 14 = 2.14 days." That worked example implicitly assumes the ENTIRE 30-day budget is still available — it never shows what changes once some of the budget is already spent.',
      'Turning the comment into a real, runnable function and running it confirms the "2.14 days" figure is exactly right for a fresh budget. Extending that same function with a <code>budgetRemainingFraction</code> parameter, verified directly, shows the real-world case that actually matters most: a budget already 90% consumed (10% remaining) hitting the same 14× burn rate is exhausted in roughly 5 hours, not 2.14 days — the fresh-budget formula alone would overstate the remaining runway by a factor of ten in that scenario.',
      'This connects directly to the page’s own error budget policy theory: a policy tier like "< 25% remaining → freeze deploys" is meaningful specifically because the SAME burn rate produces very different urgency depending on how much budget is already gone — the fresh-budget-only formula the page shows has no way to express that difference at all.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'From a Comment to Real, Verified Code',
    language: 'typescript',
    code: `// The page's own comment, made real:
// "time_remaining_hours = budget_remaining / (burn_rate * error_budget_per_hour)"
// -- implicitly assumes budget_remaining = the FULL window's budget.
function daysUntilExhaustion(windowDays: number, burnRate: number): number {
  return windowDays / burnRate;
}

console.log('Fresh 30-day budget at 14x burn rate:', daysUntilExhaustion(30, 14));
// -> 2.142857142857143  (matches the page's own "2.14 days")

// ── EXTENDED: the budget is already partially consumed ─────────────
// budgetRemainingFraction: 1.0 = fully fresh, 0.1 = only 10% left
function daysUntilExhaustionWithRemaining(
  windowDays: number,
  burnRate: number,
  budgetRemainingFraction: number
): number {
  return (windowDays * budgetRemainingFraction) / burnRate;
}

console.log('40% already consumed (60% remaining), same 14x burn rate:',
  daysUntilExhaustionWithRemaining(30, 14, 0.6));

console.log('90% already consumed (10% remaining), same 14x burn rate:',
  daysUntilExhaustionWithRemaining(30, 14, 0.1));
// -> 40% consumed:  1.2857142857142858 days  (~30.9 hours)
// -> 90% consumed:  0.21428571428571427 days (~5.1 hours)`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The extended function scales the fresh-budget exhaustion time by <code>budgetRemainingFraction</code> directly — <code>windowDays * budgetRemainingFraction / burnRate</code>. Algebraically, is this the same computation as "figure out how many days of ALLOWED errors remain, then divide by how many days-worth of allowed errors the current burn rate consumes per real day"? Work through both framings for the 90%-consumed case and confirm they agree.',
  hint: 'The fresh-budget formula computes windowDays / burnRate as "budget-days remaining, divided by how fast a day of budget disappears." Try re-deriving the extended version from that same starting point rather than just checking the arithmetic matches.',
  solution: `// Yes, they're the same computation, just reached two different ways
// -- worth confirming rather than assuming, since it's easy to bolt a
// scaling factor onto a formula in a way that LOOKS right but subtly
// changes what's being measured.
//
// Framing 1 (what the code does): take the FULL window's budget-days
// (30), scale it down to however much budget-days actually remain
// (30 x 0.1 = 3 budget-days remaining, for the 90%-consumed case),
// then divide by burnRate to find how many REAL days it takes to
// spend those 3 budget-days at the current rate: 3 / 14 = 0.214 days.
//
// Framing 2 (the alternate framing in the prompt): the SAME 3
// budget-days remaining, but framed as "how many real days does one
// budget-day take to burn through, at this rate" (1/14 days per
// budget-day), multiplied by the 3 remaining budget-days:
// 3 x (1/14) = 3/14 = 0.214 days -- identical.
//
// Both framings land on 0.214 days because they're the same division
// (3 / 14) performed in a different order -- confirming the extended
// formula isn't accidentally measuring something different from what
// the page's own fresh-budget version measures, just generalized to a
// non-100%-remaining starting point.`,
};

const misconceptions: Misconception[] = [
  {
    thought: '<code>budgetRemainingFraction</code> should be computed as "1 minus the CURRENT burn rate’s contribution" — i.e., it’s derived from the same burn rate value already being passed into the function.',
    reality: 'The two are independent inputs describing different things, not one derived from the other — <code>budgetRemainingFraction</code> answers "how much of the total period’s budget has ALREADY been consumed, up to right now" (a fact about the PAST), while <code>burnRate</code> answers "how fast is the budget CURRENTLY being consumed, going forward" (a fact about the recent trend). A budget could be 90% consumed from a single incident three weeks ago while the CURRENT burn rate is a healthy 1× — or, as the worked example shows, freshly threatened by a NEW 14× burn rate on top of already being mostly spent. Neither value can be derived from the other.',
  },
  {
    thought: 'The extended formula only matters for a budget that’s ALREADY in bad shape (mostly consumed) — a healthy team with plenty of remaining budget doesn’t need to think about this at all.',
    reality: 'The formula is a strict GENERALIZATION of the page’s own fresh-budget case, not a separate tool only for emergencies — passing <code>budgetRemainingFraction: 1.0</code> reproduces the exact "2.14 days" figure the page’s own comment states. A team with a healthy, mostly-fresh budget genuinely doesn’t need the distinction in practice, but that’s because their remaining fraction happens to be close to 1, not because the formula stops applying — the moment any real budget has been spent (even a small, routine amount), the fresh-budget-only formula starts silently overstating remaining runway.',
  },
];

@Component({
  selector: 'app-obs-error-budgets-exhaustion',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './budget-exhaustion-time-for-a-partially-spent-budget.html',
  styleUrl: './budget-exhaustion-time-for-a-partially-spent-budget.scss',
})
export class BudgetExhaustionTimeForAPartiallySpentBudgetSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
