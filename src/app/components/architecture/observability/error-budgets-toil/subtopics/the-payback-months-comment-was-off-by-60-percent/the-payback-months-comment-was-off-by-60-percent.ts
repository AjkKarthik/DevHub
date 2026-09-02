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
    heading: 'Running the Page’s Own Function Against Its Own Comment',
    points: [
      'The main page’s own "Toil Tracking" code tab defines a real, runnable <code>computeToilRoi()</code> function, applies it to three real toil items, and then prints a trailing comment claiming what each one’s output looks like — including "Deployment gate: 6.7h/month, payback 6 months ← automate first!"',
      'Running the exact function against the exact input reveals the comment is wrong on the payback figure specifically: <code>automationEffortDays</code> is 8, monthly hours saved is 6.7, and <code>paybackMonths = automationEffortDays / (monthlyHours / 8)</code> evaluates to 9.6 months, not 6.',
      'The monthly-hours figure (6.7h) is correct, and the CONCLUSION ("automate first!") is also still correct — 9.6 months is still the shortest payback of the three items (13.3 months for the OOM restart, 36.4 months for the TLS renewal) — which is exactly what makes the wrong number easy to miss: the comment reads as internally consistent and points at the right decision, it just states the wrong magnitude for one of the three numbers backing that decision.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Running computeToilRoi() Against All Three Comment Claims',
    language: 'typescript',
    code: `interface ToilItem {
  name: string;
  frequencyPerMonth: number;
  minutesPerInstance: number;
  automatable: boolean;
  automationEffortDays: number;
}

function computeToilRoi(item: ToilItem): { monthlyHours: number; paybackMonths: number } {
  const monthlyHours = (item.frequencyPerMonth * item.minutesPerInstance) / 60;
  const paybackMonths = item.automatable
    ? item.automationEffortDays / (monthlyHours / 8)
    : Infinity;
  return { monthlyHours: Math.round(monthlyHours * 10) / 10, paybackMonths: Math.round(paybackMonths * 10) / 10 };
}

const toilInventory: ToilItem[] = [
  { name: 'Manual TLS certificate renewal', frequencyPerMonth: 0.33, minutesPerInstance: 120, automatable: true, automationEffortDays: 3 },
  { name: 'OOM pod restart',                frequencyPerMonth: 12,   minutesPerInstance: 15,  automatable: true, automationEffortDays: 5 },
  { name: 'Deployment approval gate',       frequencyPerMonth: 80,   minutesPerInstance: 5,   automatable: true, automationEffortDays: 8 },
];

toilInventory.forEach(item => {
  const roi = computeToilRoi(item);
  console.log(\`\${item.name}: \${roi.monthlyHours}h/month, payback \${roi.paybackMonths} months\`);
});
// -> Manual TLS certificate renewal: 0.7h/month, payback 36.4 months
// -> OOM pod restart: 3h/month, payback 13.3 months
// -> Deployment approval gate: 6.7h/month, payback 9.6 months  <- still the best ROI, just not "6 months"`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'Given that the deployment gate’s monthly-hours figure (6.7h) was already correct, and only the payback-months figure was wrong (6 vs. the real 9.6), can you spot the specific arithmetic step in <code>computeToilRoi()</code> most likely to have been miscalculated by hand while drafting the original comment?',
  hint: 'The formula divides <code>automationEffortDays</code> by <code>(monthlyHours / 8)</code> — try computing it as <code>automationEffortDays / monthlyHours * 8</code> instead, a mathematically identical but easy-to-transpose rearrangement, and see what number that produces.',
  solution: `// 8 / 6.7 * 8 = 1.194 * 8 = 9.55 -- rounds to 9.6, matching the
// verified correct answer, so that's not the likely slip.
//
// The more likely slip: computing automationEffortDays / monthlyHours
// directly, WITHOUT the "/ 8" denominator adjustment at all --
// 8 / 6.7 = 1.19, which rounds to roughly "just over a month," not 6
// either, so that's not quite it.
//
// The number that actually lands close to "6" is treating
// automationEffortDays as though it were already in the same units as
// monthlyHours (hours), i.e. computing 40 (8 effort-days x 5 workdays
// mistakenly folded in, or some similar day/hour unit mixup) / 6.7 =~
// 6 -- a plausible, easy-to-make unit-confusion error between "8
// working DAYS of effort" and some HOURS-denominated intermediate
// value, rather than a pure copy-paste typo. The broader lesson: this
// specific formula mixes two different units (days of effort, hours
// saved per month) through an 8-hour-workday conversion factor, which
// is exactly the kind of formula where a units mistake produces a
// plausible-looking wrong answer rather than an obviously broken one.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since the "automate first!" recommendation was still correct despite the wrong number, the comment’s error doesn’t really matter in practice.',
    reality: 'It matters for a different, more concrete reason than "which item to automate first": the actual payback period is a real input to a real decision — a team deciding whether a payback under 6 months clears their internal automation-investment bar would greenlight the deployment-gate project based on the WRONG number, when the true 9.6-month payback might sit on the other side of that same bar. The RANKING happened to survive the error; the specific number a reader might act on directly did not.',
  },
  {
    thought: 'A comment claiming specific output values right next to the real, runnable code that produces them is inherently trustworthy, since anyone could just run the code to check.',
    reality: 'That anyone COULD run it doesn’t mean anyone DID before publishing — this is precisely the kind of claim that reads as self-evidently correct (real function, real inputs, plausible-looking output) and is therefore LESS likely to get double-checked than a bare prose claim with no code attached at all. The verification in this subtopic’s own code tab is exactly the check that was apparently skipped the first time: actually executing the function against its own inputs before trusting the trailing comment.',
  },
];

@Component({
  selector: 'app-obs-error-budgets-payback',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-payback-months-comment-was-off-by-60-percent.html',
  styleUrl: './the-payback-months-comment-was-off-by-60-percent.scss',
})
export class ThePaybackMonthsCommentWasOffBy60PercentSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
