import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-test-symmetric-bug-never-fails',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './symmetric-bug-never-fails.html',
  styleUrl: './symmetric-bug-never-fails.scss'
})
export class SymmetricBugNeverFailsSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Why the original demo passed",
      "points": [
        "The page's <code>buggyAdd</code> returned <code>a + b + 1</code> when <code>a &gt; 100 &amp;&amp; b &gt; 100</code>. Swapping a and b keeps that condition true or false together, and <code>a + b + 1</code> equals <code>b + a + 1</code>. So <code>buggyAdd(a, b) === buggyAdd(b, a)</code> for every pair of integers.",
        "Run with fast-check 4.10 and <code>numRuns: 100000</code>, the commutativity property never failed. The \"Counterexample: [101, 101]\" output on the page could not have come from this test.",
        "The bug is real, but commutativity is the wrong property to catch it. Comparing against an oracle, <code>buggyAdd(a, b) === a + b</code>, fails and shrinks to <code>[101, 101]</code>.",
        "The page now uses an asymmetric bug (<code>a &gt; 100 &amp;&amp; b &lt; 0</code>). With seed 42, commutativity failed after 7 tests and shrank 27 times to <code>[101, -1]</code>, which is the output now shown."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Measured",
      "language": "typescript",
      "code": "import fc from 'fast-check';\n\nfunction buggyAdd(a: number, b: number) {\n  if (a > 100 && b > 100) return a + b + 1;   // symmetric bug\n  return a + b;\n}\n\nfc.check(fc.property(fc.integer(), fc.integer(),\n  (a, b) => buggyAdd(a, b) === buggyAdd(b, a)), { numRuns: 100000 });\n// failed: false   (commutativity cannot see this bug)\n\nfc.check(fc.property(fc.integer(), fc.integer(),\n  (a, b) => buggyAdd(a, b) === a + b));\n// failed: true, counterexample [101, 101]   (oracle catches it)"
    },
    {
      "label": "Fixed demo",
      "language": "typescript",
      "code": "function buggyAdd(a: number, b: number) {\n  if (a > 100 && b < 0) return a + b + 1;     // asymmetric bug\n  return a + b;\n}\n\nfc.assert(fc.property(fc.integer(), fc.integer(), (a, b) => {\n  expect(buggyAdd(a, b)).toBe(buggyAdd(b, a));\n}), { seed: 42 });\n// Property failed after 7 tests\n// Counterexample: [101,-1]\n// Shrunk 27 time(s)"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "A function <code>max(a, b)</code> has the bug <code>if (a === b) return a + 1</code>. Will the property <code>max(a, b) === max(b, a)</code> find it? Which property would?",
    "hint": "Check whether swapping the arguments changes whether the buggy branch runs.",
    "solution": "No. When a === b, swapping gives the same call, so both sides return a + 1 and the property holds. A property that relates the result to the inputs finds it, for example result >= a and result >= b and (result === a or result === b). The last part fails for any equal pair."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "Any property will eventually catch any bug if it runs enough times.",
      "reality": "Running more cases cannot help if the bug never violates the property. Choosing the property is the important part."
    },
    {
      "thought": "The counterexample printed in a tutorial was produced by that exact code.",
      "reality": "Run it. In this case the printed output could not have come from the code shown."
    }
  ];
}
