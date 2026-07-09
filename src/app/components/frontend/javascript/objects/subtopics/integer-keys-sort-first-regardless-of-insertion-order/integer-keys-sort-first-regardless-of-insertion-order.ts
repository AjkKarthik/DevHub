import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-integer-keys-sort-first-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './integer-keys-sort-first-regardless-of-insertion-order.html',
  styleUrl: './integer-keys-sort-first-regardless-of-insertion-order.scss',
})
export class IntegerKeysSortFirstRegardlessOfInsertionOrderSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Mistake #6 Only Tests Object.keys() — Does the Same Reordering Happen Everywhere Else?',
      points: [
        'Mistake #6 demonstrates the surprising reordering specifically for <code>Object.keys()</code>. But objects have several other operations that also enumerate properties in some order — <code>for...in</code>, <code>JSON.stringify()</code>, and spreading into a new object (<code>{...obj}</code>). Does EVERY one of these reorder integer-like keys the same way, or is <code>Object.keys()</code> special?',
        'This subtopic runs the exact same mixed-key object through all four operations to confirm whether the reordering is a property of the OBJECT itself (meaning every enumeration method sees the same order) or specific to just one function.',
      ],
    },
    {
      heading: 'Why This Is a Property of the Object, Not of Object.keys() Specifically',
      points: [
        'The ECMAScript specification defines <code>[[OwnPropertyKeys]]</code> — the single, canonical internal algorithm that determines property ORDER for ANY object. It specifies: integer-like keys first, sorted numerically ascending, THEN string keys in insertion order, THEN symbol keys in insertion order.',
        'Every enumeration mechanism in the language — <code>Object.keys()</code>, <code>Object.values()</code>, <code>Object.entries()</code>, <code>for...in</code> (for the string-key portion), <code>JSON.stringify()</code>, and object spread — is built on top of this SAME underlying algorithm. This is precisely why the reordering is consistent everywhere, not a quirk of one specific function.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Integer key ordering demo</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const obj: Record<string, number> = { b: 1, a: 2, 1: 3, 2: 4, z: 5 };

console.log('Object.keys(obj):', Object.keys(obj));

const forInKeys: string[] = [];
for (const key in obj) forInKeys.push(key);
console.log('for...in keys:', forInKeys);

console.log('JSON.stringify(obj):', JSON.stringify(obj));

const spread = { ...obj };
console.log('Object.keys({...obj}):', Object.keys(spread));
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Open the console. The object was written as { b: 1, a: 2, 1: 3, 2: 4, z: 5 } — a string, string, integer, integer, string in that literal order. Does any of the 4 outputs match that literal insertion order?',
    hint: 'Ask whether the integer-like keys ("1", "2") appear where they were WRITTEN in the object literal, or somewhere else entirely, in every single one of the 4 outputs.',
    solution: `All four outputs show the exact same reordered sequence:
["1", "2", "b", "a", "z"] -- the two integer-like keys ("1" and
"2") are moved to the FRONT, sorted numerically, even though they
were written in the MIDDLE of the object literal. The string keys
("b", "a", "z") retain their original insertion order, but only
AFTER the integer keys.

Object.keys(obj), the for...in loop, JSON.stringify(obj) (note the
key order inside the resulting JSON string), and Object.keys of the
SPREAD copy all agree on this exact order -- confirming the
reordering isn't a quirk specific to Object.keys(), it's baked into
the object's own canonical property order, which every enumeration
mechanism reads from the same underlying source.

This directly confirms the theory's claim: [[OwnPropertyKeys]] is
ONE algorithm every enumeration method shares, so there was never
any chance one of these four operations would show a different
order than the others -- the "gotcha" is a property of how the
JavaScript engine stores and orders keys internally, not a
peculiarity of any single API surface.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the integer-key reordering only affects Object.keys() specifically — for...in, JSON.stringify, and spread would show the original insertion order.',
      reality: 'every enumeration mechanism in JavaScript is built on the same underlying [[OwnPropertyKeys]] algorithm — the reordering is consistent across Object.keys(), for...in, JSON.stringify(), and spread, with no exceptions.',
    },
    {
      thought: 'spreading an object into a new one ({...obj}) resets or "fixes" the key order back to something more predictable.',
      reality: 'spreading preserves the SAME canonical order the source object already has — integer-like keys were already sorted first in the source, and the spread copy inherits that same order rather than reverting to some other order.',
    },
    {
      thought: 'this reordering only happens for keys that are quoted with number-literal syntax like the number 1, not for keys written as quoted strings like "1".',
      reality: 'the reordering rule applies to any key that is a valid array-index-like string ("1", "2", "42", etc.) regardless of whether it was written as a bare number or a quoted string in the object literal — JavaScript object keys are always strings (or symbols) under the hood, so { 1: "a" } and { "1": "a" } produce identical, indistinguishable keys.',
    },
  ];
}
