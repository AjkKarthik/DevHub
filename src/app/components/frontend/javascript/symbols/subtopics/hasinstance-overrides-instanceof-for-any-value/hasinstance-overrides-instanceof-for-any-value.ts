import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-hasinstance-overrides-instanceof-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './hasinstance-overrides-instanceof-for-any-value.html',
  styleUrl: './hasinstance-overrides-instanceof-for-any-value.scss',
})
export class HasinstanceOverridesInstanceofForAnyValueSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The EvenNumber Example Only Tests Numbers — What About Everything Else?',
      points: [
        'The Well-Known Symbols code tab tests <code>EvenNumber</code> against <code>4</code>, <code>5</code>, and <code>42</code> — all numbers, which is exactly the kind of value <code>EvenNumber[Symbol.hasInstance]</code> was designed to check. It never shows what happens with a value the check function was NOT designed for — a string, a plain object, or an instance of a completely different class.',
        'This subtopic runs <code>instanceof EvenNumber</code> against a much wider range of values — a string, an object, an array, and an instance of an unrelated class — to confirm that <code>Symbol.hasInstance</code> is called for genuinely EVERY value on the left of <code>instanceof</code>, with no built-in fallback to a "does this even make sense to check" filter.',
      ],
    },
    {
      heading: 'instanceof Has No Special-Casing — It Always Defers Completely',
      points: [
        'Normally, <code>x instanceof SomeClass</code> walks <code>x</code>\'s prototype chain looking for <code>SomeClass.prototype</code> — a value that clearly isn\'t even an object (like a number or string primitive) fails FAST, immediately returning false, without needing to inspect a prototype chain that primitives don\'t have.',
        'The MOMENT a class defines <code>static [Symbol.hasInstance](value)</code>, this entire default mechanism is bypassed completely — <code>instanceof</code> becomes nothing more than a call to that static method, passing whatever is on the left-hand side, UNCHANGED, with zero pre-filtering. A completely nonsensical value (a string, an unrelated object) is passed to the custom function exactly the same way a "sensible" value would be.',
        'This is precisely why <code>EvenNumber[Symbol.hasInstance]</code> has to include its own <code>typeof value === "number"</code> check as the FIRST condition — without it, calling <code>value % 2 === 0</code> on a non-number (like a string) would either throw, coerce unexpectedly, or produce a nonsensical true/false result, since nothing about <code>instanceof</code>\'s own machinery is filtering the input for it.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Symbol.hasInstance demo</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `class EvenNumber {
  static [Symbol.hasInstance](value: unknown) {
    console.log('  hasInstance called with:', JSON.stringify(value), '(typeof:', typeof value, ')');
    return typeof value === 'number' && value % 2 === 0;
  }
}

class UnrelatedClass {}

const testValues: [string, unknown][] = [
  ['a number: 4', 4],
  ['a number: 5', 5],
  ['a string: "4"', '4'],
  ['a plain object: {}', {}],
  ['an array: [4]', [4]],
  ['an instance of an unrelated class', new UnrelatedClass()],
  ['null', null],
];

for (const [label, value] of testValues) {
  console.log('Testing', label);
  const result = value instanceof EvenNumber;
  console.log('  instanceof EvenNumber result:', result);
  console.log('');
}
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Open the console. For each of the 7 test values, does Symbol.hasInstance actually get CALLED, and what does instanceof EvenNumber return for each?',
    hint: 'Even for values like a plain object, an array, or null — values that clearly aren\'t "even numbers" in any conceptual sense — check whether hasInstance is invoked at all before returning its result.',
    solution: `Symbol.hasInstance IS called for every single one of the 7 values,
with zero exceptions -- including the string "4", the plain object,
the array, the unrelated class instance, and even null. The "typeof:
..." log line confirms the raw value and its type as received,
unchanged, by the custom function.

Results: 4 -> true, 5 -> false, "4" -> false (typeof check fails
even though "4" LOOKS numeric), {} -> false, [4] -> false, unrelated
class instance -> false, null -> false.

The key finding is not really the individual true/false results --
it's that hasInstance is called EVERY time, for EVERY value, with no
pre-filtering whatsoever. For null and the plain object especially,
a reader might assume instanceof would "fail fast" the way it does
for the DEFAULT (no hasInstance) implementation -- but once a class
defines Symbol.hasInstance, that default fast-fail mechanism is
gone entirely; the custom function is now solely responsible for
correctly handling every possible input, including ones nobody
would ever seriously test it against.

This confirms exactly why EvenNumber's own implementation leads with
typeof value === 'number' -- that check isn't decoration, it's load
bearing. Remove it, and value % 2 === 0 would run against a string,
an object, or null, producing NaN-based or coercion-based nonsense
results instead of a clean false.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'instanceof still does some basic sanity-checking on the left-hand value (like confirming it\'s an object) before calling a class\'s custom Symbol.hasInstance function.',
      reality: 'once a class defines Symbol.hasInstance, instanceof becomes a direct, unfiltered call to that function with whatever value is on the left — including primitives, null, and completely unrelated objects, exactly as received.',
    },
    {
      thought: 'a custom Symbol.hasInstance implementation only needs to correctly handle the "reasonable" inputs its check logic was designed around.',
      reality: 'because instanceof performs zero pre-filtering, a robust Symbol.hasInstance implementation needs its own defensive type-checking (like EvenNumber\'s typeof value === "number") as its first step — it cannot assume the input is even remotely close to what it expects.',
    },
    {
      thought: 'testing instanceof against nonsensical values (strings, objects, null) for a class like EvenNumber is a purely academic exercise with no practical relevance to real code.',
      reality: 'any real-world class implementing Symbol.hasInstance (for validation, type-guarding, or custom matching logic) is exposed to exactly this same unfiltered-input behavior — a caller can legitimately write `randomUserInput instanceof MyValidatorClass`, and the function must handle whatever that random input actually is.',
    },
  ];
}
