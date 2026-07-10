import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-closure-primitive-vs-object-mutation-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './closure-over-primitive-vs-object-property-mutation.html',
  styleUrl: './closure-over-primitive-vs-object-property-mutation.scss',
})
export class ClosureOverPrimitiveVsObjectPropertyMutationSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Mistake #5\'s Own Explanation Contradicts Itself at First Glance — Worth Untangling',
      points: [
        'Mistake #5 says: "Closures capture the variable itself — mutations ARE visible. This is actually the CORRECT behavior." Then, in the very same entry, it describes a "stale closure" bug where a handler "captures count=0 at registration and never updates." These two statements sound contradictory — mutations are visible, EXCEPT when they aren\'t?',
        'This subtopic resolves the apparent contradiction directly: it builds ONE closure that reads a MUTABLE OBJECT\'S property (genuinely sees later changes) side by side with a SECOND closure that reads a PRIMITIVE VALUE extracted via destructuring at creation time (genuinely does NOT see later changes) — proving both statements are true simultaneously, just about different things.',
      ],
    },
    {
      heading: 'The Real Distinction: What the Closure Actually References',
      points: [
        'A closure over <code>state.count</code> (reading the OBJECT\'S property each time it runs) always sees the CURRENT value, because <code>state</code> itself is one object the whole time — reassigning <code>state.count</code> mutates that same object, and the closure reads through the object reference fresh on every call.',
        'A closure that DESTRUCTURES a primitive out at creation time — <code>const {count} = state;</code> — copies the VALUE of <code>count</code> at that moment into a brand new, independent local variable. Reassigning <code>state.count</code> afterward does nothing to this already-copied local variable; the closure that reads it sees the OLD value forever.',
        'This is exactly the general primitive-vs-reference distinction from the JavaScript Fundamentals topic, applied specifically to closures: "mutations are visible" is true for object properties accessed through a live reference; it is false for primitives that were already copied out into their own separate binding.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Closure over object property vs primitive copy</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const state = { count: 0 };

// Closure A: reads state.count fresh, through the object reference,
// every time it's called.
function readThroughReference() {
  return state.count;
}

// Closure B: destructures count OUT of state at creation time --
// this copies the PRIMITIVE value into its own separate binding.
const { count } = state;
function readCopiedPrimitive() {
  return count;
}

console.log('Before mutation:');
console.log('readThroughReference():', readThroughReference());
console.log('readCopiedPrimitive():', readCopiedPrimitive());

// Mutate state.count AFTER both closures already exist.
state.count = 100;

console.log('');
console.log('After state.count = 100:');
console.log('readThroughReference():', readThroughReference());
console.log('readCopiedPrimitive():', readCopiedPrimitive());
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Open the console. Before and after state.count = 100, compare what readThroughReference() and readCopiedPrimitive() each return.',
    hint: 'One function reads state.count fresh every call (through the object). The other reads a primitive value that was copied out at destructuring time — ask whether that copy has any connection to state anymore.',
    solution: `Before mutation, both functions return 0 -- unsurprising, since
state.count starts at 0 and the destructured count was copied from
it at that same starting value.

After state.count = 100:
readThroughReference() returns 100 -- it reads state.count fresh
every single time it's called, through the live object reference.
Since state is the same object the whole time, this closure always
sees whatever state.count currently holds.

readCopiedPrimitive() STILL returns 0 -- the destructuring
"const { count } = state;" happened once, at the moment that line
ran, copying the VALUE 0 into a completely new, independent local
variable called count. This variable has no ongoing connection to
state.count whatsoever -- mutating state.count later does nothing
to it.

This resolves the apparent contradiction in Mistake #5's own
explanation: "closures capture the variable itself, mutations ARE
visible" is true specifically for readThroughReference(), which
closes over state (an object) and reads through it live. The
"stale closure" bug it separately describes happens specifically
when a primitive gets copied OUT of that object at some earlier
point (via destructuring, or an assignment like const c = state.count)
-- at that point, the closure over the COPY behaves completely
differently from a closure over the original object, even though
both started from the same underlying data.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'closures always see the current, up-to-date value of everything they reference — "closures capture by reference, not value" applies universally to every variable a closure touches.',
      reality: 'it applies to the SPECIFIC binding the closure references — a closure over state.count (read live through the object) sees updates; a closure over a primitive value already copied OUT via destructuring or assignment does not, because that copy is its own separate, disconnected variable.',
    },
    {
      thought: 'destructuring `const { count } = state` creates a live "view" into state, similar to how reading state.count directly would.',
      reality: 'destructuring a primitive value copies it at that exact moment into a brand new, independent variable — there is no ongoing connection back to the source object afterward, unlike reading the property directly each time.',
    },
    {
      thought: 'the "stale closure" bug described in Mistake #5 is a special, unusual case that only happens with specific frameworks like React.',
      reality: 'the underlying mechanism is plain, framework-agnostic JavaScript — any closure that reads a primitive copied out of an object (rather than reading the object\'s property live) will see a stale value, whether or not a framework is involved.',
    },
  ];
}
