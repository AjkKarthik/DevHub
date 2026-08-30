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
    heading: 'A Warning Repeated Three Times, No Worked Boundary',
    points: [
      'The main page warns against over-fragmentation in THREE separate places: the mistakes block ("50 classes, each with a single method — over-engineered"), the QnA\'s misapplications answer ("every function becomes a class... hundreds of tiny classes," "dozens of single-method interfaces when two or three broader interfaces would be clearer"), and the "SRP means one reason to change, not one method" mistake explanation. All three state the WARNING; none shows a concrete "how do I tell the difference" comparison.',
      'The main page\'s OWN "one reason to change" test is the actual tool for drawing this line — this subtopic applies it directly to a worked example, showing the SAME functionality split three different ways: correctly, under-split, and over-split.',
    ],
  },
  {
    heading: 'The "One Reason to Change" Test, Applied Concretely',
    points: [
      'Under-split: one class mixes concerns that change for genuinely DIFFERENT reasons (a business-rule change and a formatting-preference change both touch the same class) — a real SRP violation, per the main page\'s own definition.',
      'Correctly split: each class changes for exactly ONE reason — a validation-rule change only touches the validator; a currency-formatting preference only touches the formatter.',
      'Over-split: functionality that ALWAYS changes together for the SAME reason gets split anyway — two classes that would need to be edited TOGETHER for every single future change are not actually separable "reasons to change," just one reason split across two files for no benefit.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Three Levels of Granularity',
    language: 'csharp',
    code: `// UNDER-SPLIT: validation and formatting change for genuinely
// different reasons (a new business rule vs. a new currency display
// preference) but live in one class -- a real SRP violation.
public class PriceProcessor
{
    public bool Validate(decimal price) => price > 0 && price < 1_000_000;
    public string Format(decimal price, string culture) =>
        price.ToString("C", new CultureInfo(culture));
}

// CORRECTLY SPLIT: each class has exactly one reason to change.
public class PriceValidator
{
    public bool Validate(decimal price) => price > 0 && price < 1_000_000;
}
public class PriceFormatter
{
    public string Format(decimal price, string culture) =>
        price.ToString("C", new CultureInfo(culture));
}

// OVER-SPLIT: "greater than zero" and "less than the maximum" are
// NOT two separate reasons to change -- they are both part of the
// SAME business rule (what counts as a valid price), and any future
// change to that rule (e.g. tightening the maximum) would require
// editing BOTH classes together, every single time. Splitting them
// added two files and zero actual independence.
public class MinimumPriceValidator
{
    public bool Validate(decimal price) => price > 0;
}
public class MaximumPriceValidator
{
    public bool Validate(decimal price) => price < 1_000_000;
}
public class PriceValidatorOverSplit(MinimumPriceValidator min, MaximumPriceValidator max)
{
    public bool Validate(decimal price) => min.Validate(price) && max.Validate(price);
}`,
  },
];

const exercise: TryItExercise = {
  prompt: 'A new business requirement arrives: prices above 500,000 now need manager approval before being valid. Using the OVER-SPLIT version, which class(es) need to change? Does the number of classes touched tell you anything about whether the original split was justified?',
  hint: 'Check whether the new "needs approval above 500,000" rule is closer to <code>MinimumPriceValidator</code>\'s concern or <code>MaximumPriceValidator</code>\'s — or neither, cleanly.',
  solution: `// The new rule doesn't cleanly belong to EITHER existing class --
// it's a NEW kind of check (an approval-status lookup), not a
// tweak to the existing min/max numeric bounds. So the honest
// answer is: neither MinimumPriceValidator nor MaximumPriceValidator
// needs to change at all; a genuinely NEW class (e.g.
// ApprovalRequiredValidator) gets added instead.

// This actually argues AGAINST the original min/max split having
// been useful in the first place: the split was drawn along an
// arbitrary numeric-comparison-operator line ("less than" vs.
// "greater than"), not along a genuine business-reason-to-change
// line -- which is exactly why a REAL new business rule didn't
// map onto either half of that split at all. A split that doesn't
// anticipate or align with how requirements actually evolve is a
// sign the granularity was chosen for its own sake, not for a
// concrete reason.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'More classes always means better adherence to SRP — if in doubt, split further.',
    reality: 'The main page\'s own "one reason to change" test is explicitly about REASONS, not method or class COUNT. <code>MinimumPriceValidator</code> and <code>MaximumPriceValidator</code> are two classes, but they don\'t represent two independent reasons to change — any change to the acceptable price range touches both together, every time. Splitting along an axis that never varies independently produces more files without producing more actual flexibility.',
  },
  {
    thought: 'The over-split version is objectively worse code than the correctly-split version in every way.',
    reality: 'It compiles, it works correctly, and its behavior is identical to the correctly-split version — "worse" here specifically means it adds navigation and maintenance overhead (two files, one extra composing class) without buying any genuine independent-extensibility benefit in return, not that it is broken or produces wrong results. The main page\'s own mistakes block frames this the same way: over-fragmentation is a cost/benefit judgment call gone wrong, not a correctness bug.',
  },
];

@Component({
  selector: 'app-dp-solid-granularity',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './how-much-segregation-is-too-much.html',
  styleUrl: './how-much-segregation-is-too-much.scss',
})
export class HowMuchSegregationIsTooMuchSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
