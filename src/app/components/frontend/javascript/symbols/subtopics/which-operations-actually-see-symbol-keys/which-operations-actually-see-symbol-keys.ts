import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-which-ops-see-symbols-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './which-operations-actually-see-symbol-keys.html',
  styleUrl: './which-operations-actually-see-symbol-keys.scss',
})
export class WhichOperationsActuallySeeSymbolKeysSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Mistake #5 Is Actually Correcting a Misconception in Its Own "Wrong" Block — Worth a Full Test Matrix',
      points: [
        'Mistake #5\'s "wrong" code is unusual: it\'s labeled as a mistake, but its comment says "Object.assign DOES copy symbol keys — the mistake is thinking they\'re lost." The entry then lists which operations DO lose symbols (for...in, Object.keys, JSON.stringify) versus which DO NOT (Object.assign, spread). That is FIVE different operations to keep straight, described only in prose.',
        'This subtopic runs all five operations against the SAME symbol-keyed object in one place, printing the actual result of each, so the "which ones see symbols" rule is directly observable as a real comparison table rather than something to memorize from a bullet list.',
      ],
    },
    {
      heading: 'The Actual Dividing Line: Enumeration vs Copying',
      points: [
        'Symbol-keyed properties are marked as non-enumerable in the specific sense that ENUMERATION-based APIs (<code>for...in</code>, <code>Object.keys()</code>, <code>Object.values()</code>, <code>Object.entries()</code>, <code>JSON.stringify()</code>) were specifically designed to skip them — this was a deliberate spec decision so that adding metadata via symbols wouldn\'t "pollute" ordinary object enumeration.',
        'COPYING operations (<code>Object.assign()</code>, spread <code>{...obj}</code>) are defined differently in the spec — they use <code>[[OwnPropertyKeys]]</code> internally, which includes BOTH string and symbol keys, then copies every OWN enumerable property regardless of key type. Symbol keys are typically enumerable by default (just excluded from the enumeration-APIs\' output) — so they get copied along with everything else.',
        'The practical rule that falls out of this: if you need to reliably access a symbol-keyed property\'s VALUE after some transformation, spread/Object.assign are safe; if you need to actually SEE the symbol key itself for inspection, use <code>Object.getOwnPropertySymbols()</code> or <code>Reflect.ownKeys()</code> specifically — the enumeration APIs will never show it to you.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Which operations see symbol keys</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const ID = Symbol('id');
const obj = { name: 'Alice', [ID]: 42 };

console.log('for...in keys:', (() => {
  const keys: string[] = [];
  for (const k in obj) keys.push(k);
  return keys;
})());

console.log('Object.keys(obj):', Object.keys(obj));

console.log('JSON.stringify(obj):', JSON.stringify(obj));

const assigned = Object.assign({}, obj);
console.log('Object.assign copy has ID key?', assigned[ID] === 42);

const spread = { ...obj };
console.log('Spread copy has ID key?', spread[ID] === 42);

console.log('Object.getOwnPropertySymbols(obj):', Object.getOwnPropertySymbols(obj));
console.log('Reflect.ownKeys(obj):', Reflect.ownKeys(obj));
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Open the console. Which of the 5 operations (for...in, Object.keys, JSON.stringify, Object.assign, spread) actually see or preserve the symbol-keyed ID property?',
    hint: 'Group the operations into two categories: ones that ENUMERATE (list out) keys for display, versus ones that COPY every own property to a new object.',
    solution: `for...in keys: ["name"] -- the symbol key is skipped entirely.

Object.keys(obj): ["name"] -- also skipped.

JSON.stringify(obj): '{"name":"Alice"}' -- the symbol-keyed property
is silently dropped from the serialized output.

Object.assign copy has ID key? true -- the symbol-keyed property WAS
copied into the new object, and assigned[ID] === 42 correctly reads
its value back.

Spread copy has ID key? true -- same result as Object.assign; the
symbol-keyed property survives spreading.

Object.getOwnPropertySymbols(obj): [Symbol(id)] and
Reflect.ownKeys(obj): ["name", Symbol(id)] -- both of these
reflection APIs DO show the symbol key directly, confirming it was
never actually "lost," just excluded from the three enumeration-based
outputs above it.

This confirms the theory's dividing line precisely: for...in,
Object.keys, and JSON.stringify are ENUMERATION APIs that were
specifically designed to skip symbol keys in their output.
Object.assign and spread are COPYING operations that transfer every
own property (symbol-keyed or not) to the new object. The symbol key
was never inaccessible -- it was just invisible to the wrong category
of API, which is exactly the mix-up Mistake #5's own "wrong" example
title is warning against.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'symbol-keyed properties are lost or dropped whenever an object is copied or transformed in any way.',
      reality: 'copying operations (Object.assign, spread) explicitly preserve symbol-keyed properties — only enumeration-display operations (for...in, Object.keys, JSON.stringify) skip them, and the underlying data is never actually lost by copying alone.',
    },
    {
      thought: 'if Object.keys(obj) doesn\'t list a symbol key, that symbol-keyed property doesn\'t genuinely exist as an own property of the object.',
      reality: 'the property genuinely exists as an own property — Object.getOwnPropertySymbols() and Reflect.ownKeys() both confirm it\'s there; Object.keys() specifically filters to only STRING keys by design, which is a display/enumeration choice, not a statement about what properties actually exist.',
    },
    {
      thought: 'since Object.assign and spread preserve symbol keys, this makes symbol keys a reasonably strong way to prevent a property from surviving a clone when you WANT it excluded.',
      reality: 'the opposite is true — symbol keys survive copying by default; if you specifically need a property excluded from a clone, you need to explicitly delete or omit it, not rely on the key being a symbol.',
    },
  ];
}
