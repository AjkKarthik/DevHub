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
  templateUrl: './burn-rate-formula-elapsed-window-disagreement.html',
  styleUrl: './burn-rate-formula-elapsed-window-disagreement.scss'
})
export class BurnRateFormulaElapsedWindowDisagreementSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page ships two different burn rate calculators that answer two different questions',
      points: [
        'The main page\'s "Error Budget Calculator" code tab defines `calculateErrorBudget`, whose burn rate is `actualErrorRate / errorBudgetFraction` — the ratio of the error rate MEASURED so far to the allowed error rate. Nothing in that formula asks how much of the window has actually elapsed.',
        'The separate Challenge, later on the same page, defines `classifyBudgetStatus`, whose `projectedBurnRate` is `(actualErrorRate / errorBudgetFraction) * (windowDays / elapsedDays)` — the exact same base ratio, but then SCALED by how much of the window remains, via `windowDays / elapsedDays`.',
        'These are not two ways of writing the same formula — they answer genuinely different questions. The first (`calculateErrorBudget`) answers "what is my burn rate based on measurements FROM THE PART OF THE WINDOW I HAVE DATA FOR." The second (`classifyBudgetStatus`) answers "if this rate CONTINUES for the rest of the window, what will my burn rate be by the time the window closes."',
      ]
    },
    {
      heading: 'Why the missing elapsed-time factor silently breaks calculateErrorBudget early in any window',
      points: [
        'Trace calculateErrorBudget\'s own worked example: `calculateErrorBudget(checkoutSlo, 0.9982, 10_000_000)` is called with a single, undated snapshot — 10 million total requests and a 99.82% success rate — and produces "Burn rate: 8.2x." Nowhere in the function signature or the call is there any indication of whether those 10 million requests represent day 1 of a 30-day window or day 29.',
        'Now trace the SAME 99.82% success rate through `classifyBudgetStatus`, called at day 5 of the same 30-day window (`elapsedDays: 5`): the `windowDays / elapsedDays` factor is `30/5 = 6`, meaning the raw ratio gets multiplied by 6 before being reported as the "projected" burn rate. Called at day 25 instead, the same raw ratio only gets multiplied by `30/25 = 1.2`.',
        'This means `calculateErrorBudget`\'s single "8.2x" burn rate, reported with zero context about elapsed time, is silently equivalent to `classifyBudgetStatus`\'s number ONLY at the specific elapsed fraction where `windowDays / elapsedDays` happens to equal 1 — i.e. only once the window is fully elapsed (`elapsedDays == windowDays`). At any earlier point in the window, `calculateErrorBudget`\'s reported number understates how fast the budget is genuinely projected to run out if the current rate continues, because it never scales by how much of the window is left to still spend budget in.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The same underlying error rate, two different burn rate numbers',
      language: 'typescript',
      code: `// calculateErrorBudget (the main page's own Error Budget Calculator tab)
function burnRateA(actualErrorRate: number, errorBudgetFraction: number): number {
  return actualErrorRate / errorBudgetFraction;
  // No elapsedDays / windowDays anywhere in this formula.
}

// classifyBudgetStatus (the main page's own separate Challenge)
function burnRateB(
  actualErrorRate: number,
  errorBudgetFraction: number,
  windowDays: number,
  elapsedDays: number
): number {
  return (actualErrorRate / errorBudgetFraction) * (windowDays / elapsedDays);
  // Same base ratio as burnRateA -- but scaled by how much of the
  // window remains.
}

// Same inputs, called at DAY 5 of a 30-day window:
const errorBudgetFraction = 1 - 0.999; // 0.001
const actualErrorRate = 1 - 0.9982;    // 0.0018

console.log(burnRateA(actualErrorRate, errorBudgetFraction));
// 1.8  -- matches the main page's own reported "8.2x" style number
//         for a DIFFERENT input set, but same shape: no time context.

console.log(burnRateB(actualErrorRate, errorBudgetFraction, 30, 5));
// 10.8 -- the SAME underlying error rate, but reported as burning
//         6x faster once the elapsed-window scaling is applied.`,
    },
    {
      label: 'Why this matters at the exact 8.2x example from the main page\'s own calculator',
      language: 'bash',
      code: `# The main page's own calculateErrorBudget call:
#
#   calculateErrorBudget(checkoutSlo, 0.9982, 10_000_000)
#   -> "Burn rate: 8.2x. Status: warning — open a reliability ticket"
#
# This number is presented with NO elapsed-time context at all --
# the function signature never takes a "how far into the window are
# we" parameter. The SRE book's own multi-window burn-rate alerting
# (which the SAME main page's Prometheus recording-rules tab
# implements) treats 8.2x as meaningfully different depending on
# WHEN in the window it's measured:
#
#   8.2x measured at day 2 of 30   -> budget genuinely on track to
#                                      exhaust in ~3.7 days -- CRITICAL
#   8.2x measured at day 28 of 30  -> only 2 days of window left
#                                      regardless -- much lower
#                                      practical urgency
#
# calculateErrorBudget's own status classification ('warning' at
# burnRate >= 6) treats both of those wildly different situations
# identically, because the function was never given -- and never
# asks for -- the one piece of information (elapsed time) that
# classifyBudgetStatus, a few sections later on the SAME page,
# treats as essential to the same calculation.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team wires the main page\'s own calculateErrorBudget function into a dashboard that runs it once per day against that day\'s cumulative window data, and treats any "warning" or "critical" status the same way regardless of what day of the 30-day window it is. On day 3 of a new window, a real but small incident pushes the reported burn rate to 8.2x and status to "warning" — the same status calculateErrorBudget would report for the exact same 8.2x number on day 27. Using this subtopic\'s theory, explain why treating those two "warning" statuses identically is a mistake, and what classifyBudgetStatus does differently that avoids it.',
    hint: 'Per this subtopic\'s theory, does calculateErrorBudget\'s burn rate number change meaning depending on how much of the 30-day window is still left to run — and does classifyBudgetStatus\'s projectedBurnRate?',
    solution: 'Per this subtopic\'s theory, an 8.2x burn rate reported on day 3 and the identical 8.2x reported on day 27 represent very different real situations, but calculateErrorBudget has no way to distinguish them — its formula never incorporates elapsed time, so both trigger the exact same "warning" classification. On day 3, with 27 days still remaining in the window, an 8.2x burn rate genuinely on track to continue is a serious early-window trend worth real concern (there is a long remaining window for the budget to keep draining at that rate). On day 27, with only 3 days left regardless of what happens, the same 8.2x number has far less remaining window to do further damage in — the practical urgency is much lower even though the reported number and status are identical. classifyBudgetStatus avoids this by explicitly taking elapsedDays and windowDays as inputs and computing `projectedBurnRate` scaled by `windowDays / elapsedDays` — so the SAME underlying error rate produces a LARGER projected burn rate early in the window (when there is more time for a bad trend to keep draining budget) and a smaller one late in the window (when there is little time left for the trend to matter), which is the more operationally meaningful signal for a "should we freeze releases" decision.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The main page\'s calculateErrorBudget and classifyBudgetStatus functions compute the same "burn rate" concept in two slightly different but interchangeable ways.',
      reality: 'Per this subtopic\'s theory, they answer genuinely different questions — calculateErrorBudget reports a rate based purely on the data measured so far with no time context, while classifyBudgetStatus explicitly projects that rate forward by scaling it against how much of the window remains, via windowDays / elapsedDays.'
    },
    {
      thought: 'An 8.2x burn rate reported by calculateErrorBudget always means the same thing and warrants the same response, no matter when in the SLO window it was measured.',
      reality: 'Per this subtopic\'s exercise, the same numeric burn rate implies dramatically different real urgency depending on how much window time remains — early in the window, a sustained 8.2x rate has much more time left to drain the budget than the identical rate measured near the window\'s end, a distinction calculateErrorBudget\'s formula has no way to express.'
    },
    {
      thought: 'Since classifyBudgetStatus\'s projectedBurnRate formula scales by windowDays / elapsedDays, it will always report a HIGHER number than calculateErrorBudget\'s plain burn rate for the same underlying error rate.',
      reality: 'Per this subtopic\'s theory, the scaling factor windowDays / elapsedDays equals exactly 1 once the window is fully elapsed (elapsedDays == windowDays), and is LESS than the early-window multiplier as elapsedDays grows — the two formulas only ever agree exactly at the single point where the window has fully run its course, not consistently at every point in between.'
    }
  ];
}
