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
  templateUrl: './esm-named-imports-are-live-bindings-cjs-destructuring-is-a-snapshot.html',
  styleUrl: './esm-named-imports-are-live-bindings-cjs-destructuring-is-a-snapshot.scss'
})
export class EsmNamedImportsAreLiveBindingsCjsDestructuringIsASnapshotSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page already states ESM exports are "live bindings" that "update automatically" while CJS "exports snapshots" — worth seeing the actual consequence side by side',
      points: [
        'In ES Modules, a named import (import { count } from \'./counter.js\') is not a copy of a value — it is a genuine live binding to the exporting module\'s own variable. If the exporting module later reassigns that variable internally (count = 5), every importer\'s binding reflects the NEW value on its very next read, with no re-import or refresh needed. This is part of the ECMAScript module specification itself, not a Node-specific quirk.',
        'In CommonJS, destructuring a required module\'s exports (const { count } = require(\'./counter\')) copies whatever primitive value count held AT THE MOMENT require() ran into a brand-new local variable. Since primitives are copied by value in JavaScript destructuring, this local count has no ongoing connection to the module\'s internal variable — it is frozen at that snapshot value forever, even if the source module reassigns its own internal count many times afterward.',
      ]
    },
    {
      heading: 'Why this distinction produces genuinely different, sometimes surprising, program behavior',
      points: [
        'A CJS module wanting to expose a value that changes over time (a counter, a mutable config flag, a status string) must export a GETTER FUNCTION or the containing OBJECT itself (never destructured) if consumers need to see updates — module.exports = { getCount: () => count } works; module.exports = { count } combined with a consumer destructuring it does not, for any consumer wanting live updates.',
        'ESM sidesteps this entirely for named exports — the live-binding behavior is automatic and requires no special export pattern, though it comes with its own constraint: an ESM module cannot reassign an imported binding from the IMPORTING side (import { count } from \'...\'; count = 5 is a syntax/runtime error) — the binding is live but read-only from the consumer\'s perspective, only the exporting module itself may reassign the underlying variable.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'ESM — the imported binding updates automatically',
      language: 'typescript',
      code: `// counter.mjs
export let count = 0;
export function increment() { count++; }

// main.mjs
import { count, increment } from './counter.mjs';

console.log(count); // 0
increment();
console.log(count); // 1 — the SAME imported binding, live-updated,
                     // with no re-import needed at all.

// count = 5; // SyntaxError — cannot reassign an imported binding
//               from the consumer's side; only counter.mjs itself
//               can reassign its own exported variable.`,
    },
    {
      label: 'CJS — the destructured value is frozen at import time',
      language: 'typescript',
      code: `// counter.js
let count = 0;
function increment() { count++; }
module.exports = { count, increment };

// main.js
const { count, increment } = require('./counter');

console.log(count); // 0
increment(); // increments counter.js's OWN internal count variable
console.log(count); // STILL 0 — this destructured local variable
                     // was copied at require() time and has no
                     // ongoing connection to counter.js's count.

// The fix: expose a getter instead of the raw value directly
// module.exports = { getCount: () => count, increment };
// const { getCount, increment } = require('./counter');
// console.log(getCount()); // correctly reflects live updates`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer migrates a CJS module from module.exports = { count, increment } (with consumers destructuring const { count } = require(...)) to an equivalent ESM version using export let count = 0 and export function increment() { count++ }, keeping the SAME destructuring-style import pattern (import { count, increment } from \'./counter.mjs\'). After migration, consumers report the count value now correctly reflects updates after calling increment() — something that never worked in the CJS version without a getter function. Explain precisely why the exact same "destructure the exported value" pattern behaves differently between the two module systems.',
    hint: 'Is an ESM named import genuinely the same kind of copy-by-value operation as CJS object destructuring, or does the ECMAScript module specification define named imports as something fundamentally different?',
    solution: 'The two patterns LOOK syntactically similar (pulling a named value out of an imported/required module) but are fundamentally different operations under the hood. CJS\'s const { count } = require(...) is ordinary JavaScript object destructuring — it copies the primitive value held by the module\'s exports.count property at that exact moment into a brand-new, disconnected local variable, with zero ongoing relationship to the source module\'s internal state. ESM\'s import { count } from \'./counter.mjs\' is NOT destructuring at all, despite the similar-looking syntax — it is a live binding, a mechanism defined directly in the ECMAScript module specification that keeps the imported name permanently linked to the exporting module\'s own variable. When counter.mjs\'s increment() function reassigns its internal count, every import { count } binding anywhere in the app automatically reflects that new value on its next read, with no re-import, no getter function, and no special export pattern required — which is exactly why the migrated ESM version "just worked" where the CJS version needed an explicit getter function to achieve the same live-update behavior.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'ESM\'s import { name } from \'...\' syntax and CJS\'s const { name } = require(\'...\') destructuring are functionally the same operation, just with different syntax for the same result.',
      reality: 'This subtopic\'s theory clarifies these are fundamentally different mechanisms — ESM named imports are true live bindings defined by the ECMAScript spec, while CJS destructuring is ordinary JavaScript value-copying with no special module-aware behavior at all.'
    },
    {
      thought: 'To get live-updating exported values in CommonJS, you just need to destructure the value correctly, similar to how ESM handles it.',
      reality: 'This subtopic\'s code examples show no CJS destructuring pattern achieves live updates for primitive values — the only reliable CJS fix is exposing a getter FUNCTION (or the whole containing object, accessed without destructuring) rather than destructuring a primitive value directly.'
    },
    {
      thought: 'Since ESM named imports are live bindings, a consumer can reassign an imported value directly to update it, the same way it could reassign its own local variables.',
      reality: 'This subtopic\'s theory shows ESM live bindings are read-only from the IMPORTING side — attempting `count = 5` after `import { count } from \'...\'` is a syntax/runtime error; only the module that originally exported the variable may reassign it internally.'
    }
  ];
}
