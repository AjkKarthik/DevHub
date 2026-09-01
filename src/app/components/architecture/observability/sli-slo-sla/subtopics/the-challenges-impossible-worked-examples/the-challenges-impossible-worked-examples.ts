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
    heading: 'Two Worked Examples That Could Never Produce Their Own Claimed Output',
    points: [
      'The main page’s own "SLO Calculations" codeTab ran <code>calculateSloStatus({ target: 0.999, windowDays: 30 }, 0.9985)</code> and claimed the result was <code>{ remainingBudgetMinutes: 21.6, consumedPercent: 50, burnRate: 1.5, status: \'healthy\' }</code>. Look closely at the function’s own code: <code>consumedRate</code> and <code>burnRate</code> are computed by the EXACT SAME FORMULA (<code>actualErrorRate / allowedErrorRate</code>) — they can never differ. The claimed output shows <code>consumedPercent: 50</code> (implying consumedRate = 0.5) alongside <code>burnRate: 1.5</code> — two different values for what the code guarantees are always identical. The comment was never correct for ANY input, not just this one.',
      'Verified via direct execution: the actual output for the stated input is <code>{ remainingBudgetMinutes: 0, consumedPercent: 150, burnRate: 1.5, status: \'exhausted\' }</code> — a 1.5× sustained burn rate fully exhausts a 30-day budget well before the window ends, the opposite of the claimed "healthy" status.',
      'The page’s own Challenge repeats a related mistake with its own <code>errorBudgetStatus()</code> worked examples: the starterCode and solution both claimed <code>errorBudgetStatus(0.999, 30, 0.9985)</code> returns <code>\'at-risk\'</code> and <code>errorBudgetStatus(0.999, 30, 0.9982)</code> returns <code>\'critical\'</code>. Verified via direct execution of the Challenge’s own solution function: BOTH inputs actually return <code>\'exhausted\'</code> — the same underlying error (an input value chosen without actually running the stated formula against it) appearing twice on the same page, in two different codeTabs.',
      'This has now been fixed on the main page in both places: the SLO Calculations codeTab’s comment now shows the real, verified output; the Challenge’s test inputs were changed to values that genuinely land in the "at-risk" (0.9994) and "critical" (0.9991) ranges, verified by running the exact stated formula against each before publishing.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Both Bugs, Verified',
    language: 'typescript',
    code: `interface SloConfig { target: number; windowDays: number; }
interface SloStatus {
  remainingBudgetMinutes: number;
  consumedPercent: number;
  burnRate: number;
  status: 'healthy' | 'at-risk' | 'exhausted';
}

function calculateSloStatus(config: SloConfig, currentSuccessRate: number): SloStatus {
  const windowMinutes = config.windowDays * 24 * 60;
  const allowedErrorRate = 1 - config.target;
  const actualErrorRate  = 1 - currentSuccessRate;
  const totalBudgetMinutes = windowMinutes * allowedErrorRate;
  const consumedRate       = actualErrorRate / allowedErrorRate;
  const remainingBudgetMinutes = totalBudgetMinutes * (1 - Math.min(consumedRate, 1));
  const burnRate = actualErrorRate / allowedErrorRate; // SAME formula as consumedRate -- always equal

  const status: SloStatus['status'] =
    consumedRate >= 1       ? 'exhausted' :
    consumedRate >= 0.8     ? 'at-risk'   : 'healthy';

  return { remainingBudgetMinutes, consumedPercent: consumedRate * 100, burnRate, status };
}

// Bug 1, verified: the main page's own claimed output for this exact call
// was { remainingBudgetMinutes: 21.6, consumedPercent: 50, burnRate: 1.5,
// status: 'healthy' } -- impossible, since consumedPercent (from
// consumedRate) and burnRate can never disagree.
console.log(calculateSloStatus({ target: 0.999, windowDays: 30 }, 0.9985));
// -> { remainingBudgetMinutes: 0, consumedPercent: 150, burnRate: 1.5, status: 'exhausted' }

// Bug 2, verified: the Challenge's own solution function, run against ITS
// OWN originally-claimed test inputs.
function errorBudgetStatus(sloTarget: number, _windowDays: number, currentSuccessRate: number): string {
  const allowedErrorRate = 1 - sloTarget;
  const actualErrorRate  = 1 - currentSuccessRate;
  const consumed = actualErrorRate / allowedErrorRate;
  if (consumed > 1.0)  return 'exhausted';
  if (consumed >= 0.8) return 'critical';
  if (consumed >= 0.5) return 'at-risk';
  return 'healthy';
}

console.log(errorBudgetStatus(0.999, 30, 0.9985)); // originally claimed 'at-risk'
console.log(errorBudgetStatus(0.999, 30, 0.9982)); // originally claimed 'critical'
// -> both actually return 'exhausted' -- neither original claim was reachable

// The corrected test values, verified to actually land in the claimed categories:
console.log(errorBudgetStatus(0.999, 30, 0.9994)); // 'at-risk' -- now genuinely correct
console.log(errorBudgetStatus(0.999, 30, 0.9991)); // 'critical' -- now genuinely correct`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A third input, <code>currentSuccessRate = 0.9989</code>, is proposed as a NEW "at-risk" example (target still 0.999, windowDays still 30). Using <code>errorBudgetStatus()</code>’s own formula, verify whether this input genuinely produces <code>\'at-risk\'</code> before it would ever be added to the page.',
  hint: 'Compute <code>allowedErrorRate</code>, <code>actualErrorRate</code>, then <code>consumed = actualErrorRate / allowedErrorRate</code> — check which of the four bracket ranges (>1.0, >=0.8, >=0.5, else) that value actually falls into.',
  solution: `// allowedErrorRate = 1 - 0.999 = 0.001
// actualErrorRate = 1 - 0.9989 = 0.0011
// consumed = 0.0011 / 0.001 = 1.1
//
// 1.1 > 1.0 -- this falls into 'exhausted', NOT 'at-risk'.
//
// errorBudgetStatus(0.999, 30, 0.9989) -> 'exhausted'
//
// This input would have been a THIRD instance of the exact same mistake
// this subtopic is about: picking a success-rate value that "looks like"
// it should land in a mid-range category without actually running the
// stated formula against it. The lesson generalizes: for a formula this
// sensitive (allowedErrorRate is often a very small number, like 0.001),
// small differences in the input's later decimal places move the
// consumed ratio by a lot -- always compute the actual value before
// trusting an example is correctly categorized, rather than eyeballing
// how "close to 1" the success rate looks.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'A worked example’s output comment being wrong for ONE specific input is a minor documentation slip, not something worth verifying systematically.',
    reality: 'This subtopic found the SAME category of mistake in TWO separate codeTabs on the same page (the SLO Calculations comment, and the Challenge’s own test cases) — a pattern, not an isolated typo. Both happened for the identical underlying reason: an example input was chosen because it "looked" like it should produce a certain result, without actually running the stated formula to confirm it.',
  },
  {
    thought: 'Since <code>consumedRate</code> and <code>burnRate</code> have different NAMES and appear in different places in the output object, they must be measuring different things.',
    reality: 'Reading the function’s own source is decisive here: both are computed by the literal same expression, <code>actualErrorRate / allowedErrorRate</code> — they are two different NAMES for the identical number. A claimed output where they disagree is a mathematical impossibility for this function, regardless of what input produced it.',
  },
  {
    thought: 'A four-category status function (healthy/at-risk/critical/exhausted) needs four well-separated, "obviously different" example inputs to demonstrate each category clearly.',
    reality: 'The corrected examples (0.9997, 0.9994, 0.9991, 0.998) are all within 0.0006 of each other in success rate, yet land in all four distinct categories — a direct consequence of how small the allowed error rate (0.001) is relative to the success rate scale. This is precisely why eyeballing "does this look like a reasonable example" fails for functions like this one; the categories are separated by tiny input differences, not large, visually obvious ones.',
  },
];

@Component({
  selector: 'app-obs-sli-slo-sla-impossible-examples',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-challenges-impossible-worked-examples.html',
  styleUrl: './the-challenges-impossible-worked-examples.scss',
})
export class TheChallengesImpossibleWorkedExamplesSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
