import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-invariant-violation-subtopic',
  standalone: true,
  imports: [
    RouterLink, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './lying-about-a-frozen-propertys-value-throws-invariant-violation.html',
  styleUrl: './lying-about-a-frozen-propertys-value-throws-invariant-violation.scss',
})
export class ProxyingNonConfigurablePropertiesIncorrectlySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Mistake #4 and QnA, Proven With the Real Invariant TypeError',
      points: [
        'The main page\'s Mistake #4 shows a <code>get</code> trap that always returns <code>42</code> regardless of the actual property value, applied to a FROZEN object — with the comment "TypeError: invariant violation." This subtopic builds that exact scenario and catches the real error, confirming it fires specifically when the LYING property is READ, not when the <code>Proxy</code> itself is constructed.',
        'The main page\'s QnA on invariants explains the underlying rule directly: "the <code>get</code> trap must return the actual value for non-configurable, non-writable properties." Once a property is BOTH non-configurable and non-writable (which is exactly what <code>Object.freeze()</code> makes every property), the JS engine itself — not just convention — requires any <code>get</code> trap to report that property\'s TRUE, unaltered value.',
      ],
    },
    {
      heading: 'Why This Enforcement Exists — Invariants Protect Fundamental Guarantees',
      points: [
        'JavaScript makes a real, load-bearing promise to every piece of code in the language: once a property is frozen, its value can NEVER change again, by any mechanism, ever. If a <code>Proxy</code> were allowed to freely lie about a frozen property\'s value in its <code>get</code> trap, that promise would be broken silently — any code relying on "this frozen value never changes" (caching, memoization, security checks) could be fooled by a misbehaving Proxy sitting in front of the real object.',
        'This is why the check happens at the exact moment of the OPERATION (a property read), not at <code>Proxy</code> construction time — the engine has no way to know in advance whether a given trap will violate an invariant for a given property; it can only catch the violation when that specific property is actually accessed and the returned value is compared against the target\'s real, frozen value.',
        'This invariant is specific to properties that are BOTH non-configurable AND non-writable — a <code>get</code> trap is completely free to transform, compute, or fabricate values for any property that ISN\'T frozen (or is configurable/writable), which is exactly how legitimate use cases like default values, computed properties, and logging work without triggering this restriction at all.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Proxy invariant violation demo</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `console.log('--- A get trap that lies about a FROZEN property ---');
const frozen = Object.freeze({ x: 1, y: 2 });

const lyingProxy = new Proxy(frozen, {
  get(target, prop) {
    return 42; // always lies, regardless of the real value
  },
});

console.log('Was constructing the Proxy itself a problem?', 'No error yet -- the Proxy was created successfully.');

try {
  const value = lyingProxy.x;
  console.log('lyingProxy.x returned:', value, '(this line should not print)');
} catch (e) {
  console.log('Reading lyingProxy.x THREW:', (e as Error).message, '<-- the invariant violation happens exactly HERE, at the read');
}

console.log('--- Contrast: a get trap on a NON-frozen object CAN freely lie ---');
const notFrozen = { x: 1, y: 2 };
const freeToLieProxy = new Proxy(notFrozen, {
  get(target, prop) {
    return 42; // completely fine here -- x is not non-configurable/non-writable
  },
});
console.log('freeToLieProxy.x returned:', freeToLieProxy.x, '<-- no error, since x is not frozen');

console.log('--- The FIX: transform the value while preserving its type/shape correctly ---');
const doublingProxy = new Proxy(frozen, {
  get(target, prop, receiver) {
    const val = Reflect.get(target, prop, receiver);
    // Still an invariant violation risk if val is transformed for a frozen prop!
    // The only fully safe approach for frozen properties is returning the real value unchanged:
    return val;
  },
});
console.log('doublingProxy.x (safely unchanged):', doublingProxy.x, '<-- no error, because the trap returns the TRUE value for a frozen property');`,
    },
  ];

  exercise: TryItExercise = {
    prompt: '<code>lyingProxy</code> is constructed successfully with no error. Does the invariant-violation TypeError fire at construction time, or specifically when <code>lyingProxy.x</code> is actually read?',
    hint: 'Ask what the engine would actually need to know to detect this violation -- can it tell, just from looking at the trap FUNCTION\'s code, that it will misreport frozen properties, or does it need to see the trap actually RUN and compare its result against the real value?',
    solution: `The TypeError fires specifically when lyingProxy.x is READ -- not
when the Proxy is constructed. "Was constructing the Proxy itself a
problem?" correctly logs "No error yet," confirming new Proxy(frozen,
{ get: ... }) completes with zero issue, however misbehaved the get
trap's logic might be.

The engine has no way to statically analyze a get trap's function
body and determine in advance whether it will violate an invariant
for some property -- it can only catch the violation reactively,
at the moment a specific property is actually accessed. When
lyingProxy.x is read, the engine runs the get trap (which returns
42), then checks: is x a non-configurable, non-writable property on
the target? Yes (frozen makes every property both). Does the trap's
returned value (42) match the target's actual, real value (1)? No
-- and THAT mismatch, detected at read time, is what throws the
TypeError.

The contrast with freeToLieProxy proves this restriction is specific
to frozen properties: the exact same "always return 42" trap logic,
applied to a NON-frozen object, works completely fine with no error
at all -- x on notFrozen is neither non-configurable nor
non-writable, so there's no invariant to violate.

The final doublingProxy example shows the actual safe pattern for a
get trap wrapping a potentially-frozen object: for properties that
ARE frozen, the trap simply must return Reflect.get()'s real,
unaltered value -- any transformation applied to a frozen property's
value would trigger the exact same invariant violation, regardless
of whether the transformation "seems" harmless.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a Proxy get trap can return any value it wants for any property, completely overriding the target object\'s real values — that\'s the entire point of intercepting property access.',
      reality: 'this is true for MOST properties, but the JS engine enforces a hard exception for non-configurable, non-writable properties (which is exactly what Object.freeze() produces) — a get trap MUST return the real, unaltered value for those specific properties, or a TypeError is thrown.',
    },
    {
      thought: 'if a Proxy\'s get trap is written to lie about a frozen property\'s value, the error would be caught immediately when the Proxy object itself is constructed with new Proxy(target, handler).',
      reality: 'the invariant violation is only detected reactively, at the moment the specific frozen property is actually READ — constructing the Proxy itself never checks or validates the trap\'s logic in advance, since the engine has no way to know which properties will be accessed or what the trap will return for them.',
    },
    {
      thought: 'this invariant restriction applies broadly to any object with SOME frozen or protected characteristics — as long as an object has been frozen at all, a Proxy wrapping it can never modify how ANY of its properties are reported.',
      reality: 'the restriction applies PER-PROPERTY, based on that specific property\'s own configurable/writable status — a get trap remains completely free to transform, compute, or fabricate values for any property that is not itself both non-configurable and non-writable, even on an object that has other frozen properties.',
    },
  ];
}
