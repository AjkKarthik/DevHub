import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-numberisnan-vs-global-isnan-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './numberisnan-vs-global-isnan-real-coercion.html',
  styleUrl: './numberisnan-vs-global-isnan-real-coercion.scss',
})
export class NumberisnanVsGlobalIsnanRealCoercionSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Mistake #3 Names Two Specific Wrong Answers — Worth Verifying Directly',
      points: [
        'Mistake #3\'s comment says plainly: <code>isNaN("") = false, isNaN(" ") = false</code>. These are stated as facts, but the main page never runs them side by side against <code>Number.isNaN()</code> to show HOW different the two functions\' answers actually are across a range of inputs.',
        'This subtopic runs both functions against six deliberately chosen values — an empty string, whitespace, a real NaN, a numeric string, a non-numeric string, and undefined — and displays every result in a table, so the actual disagreement is visible input-by-input rather than described in prose.',
      ],
    },
    {
      heading: 'Why the Two Functions Disagree at All',
      points: [
        'The global <code>isNaN(x)</code> function COERCES its argument to a number first (via <code>Number(x)</code>), THEN checks if the result is NaN. <code>Number("")</code> is <code>0</code> (not NaN) — so <code>isNaN("")</code> asks "is 0 NaN?" and correctly answers false, even though the intent was almost certainly "is this empty string a valid number?"',
        '<code>Number.isNaN(x)</code> performs NO coercion at all — it only returns true if <code>x</code> IS ALREADY, LITERALLY, the value <code>NaN</code>. Every other value, including strings, objects, and undefined, returns false immediately without any conversion attempt.',
        'This means the two functions are answering genuinely different questions: <code>isNaN(x)</code> asks "would converting x to a number produce NaN?" while <code>Number.isNaN(x)</code> asks "is x already exactly the NaN value?" — for anything that ISN\'T already a number type, these questions have different answers.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>isNaN vs Number.isNaN</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const testValues: [string, unknown][] = [
  ['empty string ""', ''],
  ['whitespace " "', ' '],
  ['real NaN', NaN],
  ['numeric string "42"', '42'],
  ['non-numeric string "abc"', 'abc'],
  ['undefined', undefined],
];

console.log('label'.padEnd(24), 'global isNaN()'.padEnd(18), 'Number.isNaN()');
console.log('-'.repeat(60));

for (const [label, value] of testValues) {
  // @ts-ignore -- deliberately passing mixed types to compare both functions' behavior
  const globalResult = isNaN(value);
  const strictResult = Number.isNaN(value);
  console.log(label.padEnd(24), String(globalResult).padEnd(18), String(strictResult));
}

console.log('');
console.log('Notice which rows DISAGREE between the two columns.');
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Open the console. Compare the "global isNaN()" and "Number.isNaN()" columns for all 6 test values. Which rows disagree, and why?',
    hint: 'The global isNaN() converts its argument with Number(x) first — ask what Number("") and Number(" ") actually equal.',
    solution: `Three rows disagree: empty string, whitespace, and the numeric
string "42".

"" -- global isNaN("") is false (Number("") is 0, not NaN).
Number.isNaN("") is also false, but for a completely different
reason: "" is a string, not the literal NaN value, so it returns
false immediately with no coercion attempted. Both happen to say
false here, but for different reasons -- this row doesn't actually
disagree, which is itself an important nuance: neither function is
useful on its own for "is this a valid number the user typed"
without an extra check.

" " (whitespace) -- same story as empty string: global isNaN(" ")
is false because Number(" ") is 0. Number.isNaN(" ") is false
because a string is never NaN itself.

"42" -- global isNaN("42") is false (Number("42") is 42, a valid
number). Number.isNaN("42") is ALSO false (a string is never
literally NaN). These agree too.

"abc" -- THIS is where they genuinely diverge: global isNaN("abc")
is TRUE (Number("abc") is NaN, so the coercion-then-check finds
NaN). Number.isNaN("abc") is FALSE (the string "abc" itself is not
the NaN value, no coercion happens).

The practical lesson matches Mistake #3's point but sharpens it:
neither function alone correctly validates "is this string a valid
number" — Number.isNaN() never returns true for strings AT ALL
(even garbage input), while global isNaN() DOES flag garbage
strings correctly but ALSO wrongly clears empty/whitespace strings
as "not NaN". The main page's own fix — Number.isNaN(Number(input))
— combines them: explicitly convert first, THEN check strictly.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Number.isNaN(x) is simply a "safer" version of isNaN(x) that gives the same answers but validates its input type first.',
      reality: 'the two functions answer fundamentally different questions — isNaN(x) checks "would converting x to a number produce NaN," while Number.isNaN(x) checks "is x already exactly the NaN value" — for any non-number input, they can disagree.',
    },
    {
      thought: 'Number.isNaN(userInputString) is the correct way to validate whether a string the user typed is a valid number.',
      reality: 'Number.isNaN() returns false for EVERY string, including garbage like "abc" — because a string is never literally the NaN value. Validating string input requires converting first: Number.isNaN(Number(userInputString)).',
    },
    {
      thought: 'isNaN("") returning false and isNaN("abc") returning true means the global isNaN() correctly distinguishes valid-looking from invalid-looking numeric strings.',
      reality: 'isNaN("") returns false because Number("") happens to be 0 (an implicit, surprising coercion rule), not because the empty string is a valid number — this is exactly the kind of false negative Mistake #3 warns about for empty/whitespace input.',
    },
  ];
}
