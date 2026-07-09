import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-new-overrides-bind-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './new-overrides-even-an-explicitly-bound-function.html',
  styleUrl: './new-overrides-even-an-explicitly-bound-function.scss',
})
export class NewOverridesEvenAnExplicitlyBoundFunctionSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Priority List Says "new > Explicit" — But the Previous Subtopic Just Proved bind() Is Permanent',
      points: [
        'The theory section states the priority order plainly: "new > explicit (call/apply/bind) > method call > default." But this creates an apparent tension with the earlier finding (bind() Is Permanent) that <code>.call()</code>/<code>.apply()</code>/even a second <code>.bind()</code> could NOT override an already-bound function\'s <code>this</code>. If explicit binding is that unbreakable, can <code>new</code> — supposedly HIGHER priority — actually override it?',
        'This subtopic tests exactly that: take a constructor function, bind it to a specific object with <code>.bind()</code>, then call the BOUND function with <code>new</code> — and check whether the resulting <code>this</code> is the bound target object, or a genuinely fresh, newly-created object.',
      ],
    },
    {
      heading: 'Why new Is a True Exception to bind()\'s Permanence',
      points: [
        'The ECMAScript spec gives bound functions ("bound function exotic objects") special-cased behavior specifically for the <code>[[Construct]]</code> internal method (what <code>new</code> invokes) — when a bound function is called with <code>new</code>, the bound <code>this</code> value is DELIBERATELY IGNORED, and construction proceeds as if you had called <code>new</code> directly on the ORIGINAL, un-bound target function.',
        'This is a genuinely special carve-out, not a general pattern — every other invocation style (plain call, <code>.call()</code>, <code>.apply()</code>, a second <code>.bind()</code>) respects the original binding, as the previous subtopic demonstrated. <code>new</code> is the SOLE exception, precisely because <code>new</code>\'s entire purpose (creating a fresh instance) would be incoherent if it were forced to reuse some unrelated, previously-bound object instead.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>new vs bind() demo</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `function Person(this: any, name: string) {
  this.name = name;
}

const boundTarget = { name: 'BOUND_TARGET', isTheOriginalBoundObject: true };

// Bind Person's "this" to boundTarget -- per the previous subtopic,
// this binding should be "permanent" against call/apply/bind.
const BoundPerson = Person.bind(boundTarget as any);

// Ordinary call: does this actually mutate boundTarget, honoring the bind?
BoundPerson('Alice');
console.log('After BoundPerson("Alice") as a plain call:');
console.log('  boundTarget.name is now:', boundTarget.name);

// Now the real test: construct with "new" on the BOUND function.
const instance = new (BoundPerson as any)('Bob');
console.log('');
console.log('After new BoundPerson("Bob"):');
console.log('  instance.name:', instance.name);
console.log('  instance === boundTarget?', instance === boundTarget);
console.log('  boundTarget.name (unchanged?):', boundTarget.name);
console.log('  instance.isTheOriginalBoundObject:', instance.isTheOriginalBoundObject);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Open the console. After new BoundPerson("Bob"), is instance the SAME object as boundTarget, or a genuinely new one? Does boundTarget.name get overwritten to "Bob"?',
    hint: 'Compare this result to the ordinary plain-call case right above it, which DOES honor the binding — ask what\'s specifically different about invoking with new.',
    solution: `The plain call BoundPerson("Alice") DOES honor the binding --
boundTarget.name becomes "Alice", confirming bind() worked normally
for an ordinary function call, consistent with the previous
subtopic's findings.

But new BoundPerson("Bob") behaves completely differently: instance
is a BRAND NEW object, NOT the same object as boundTarget
(instance === boundTarget is false). instance.name is "Bob", while
boundTarget.name remains "Alice" (unchanged by the new call at all).
instance.isTheOriginalBoundObject is undefined, confirming instance
has none of boundTarget's own properties -- it's a genuinely fresh
object, exactly as if you had called new Person("Bob") directly,
completely ignoring the earlier .bind(boundTarget) call.

This resolves the apparent tension the theory section raised: bind()
IS permanent against every ordinary invocation style (as the
previous subtopic proved), but new is a specifically carved-out
exception in the ECMAScript spec -- when a bound function is invoked
with new, the bound this is discarded entirely and construction
proceeds against the ORIGINAL, un-bound function, creating a fresh
instance just like normal constructor invocation always does. This
is exactly why the main page's own priority list ranks new above
explicit binding -- it isn't a vague generalization, it's describing
this precise, spec-mandated carve-out.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'if a constructor function has been bound to a specific object with .bind(), calling it with new will construct onto (or somehow involve) that bound object.',
      reality: 'new specifically ignores the bound this entirely — it constructs a genuinely fresh object and calls the ORIGINAL, un-bound function against it, exactly as if the .bind() call had never happened.',
    },
    {
      thought: 'since the previous subtopic proved bind() is "permanent" against call/apply/and a second bind, the this-binding priority list\'s claim that "new" ranks even higher must be describing some rare, contrived edge case.',
      reality: 'this IS the specific, well-defined mechanism the priority list refers to — new is not a vague "higher priority" concept, it is a spec-mandated special case specifically for bound functions\' [[Construct]] behavior, and it is the ONE reliable way to bypass an existing bind().',
    },
    {
      thought: 'a bound constructor function used with new is effectively the same as an unbound one — the bind() call becomes pointless once new is involved.',
      reality: 'the bind() call still matters for the function\'s ARGUMENTS if partial application was used (e.g. Fn.bind(null, presetArg1)) — new still respects any pre-bound arguments, it only specifically discards the bound this value.',
    },
  ];
}
