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
  selector: 'app-object-freeze-shallow-subtopic',
  standalone: true,
  imports: [
    RouterLink, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './object-freeze-is-only-shallow-nested-objects-stay-mutable.html',
  styleUrl: './object-freeze-is-only-shallow-nested-objects-stay-mutable.scss',
})
export class ObjectFreezeIsOnlyShallowNestedObjectsStayMutableSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Mistake #2, Proven With a Real Mutation That Succeeds',
      points: [
        'The main page\'s Mistake #2 shows exactly this: freezing <code>{ user: { name: \'Alice\' } }</code>, then successfully mutating <code>state.user.name = \'Bob\'</code> — proving <code>Object.freeze()</code> "only prevents reassigning properties on the top-level object." This subtopic runs that exact scenario live, confirming the mutation succeeds with no error and the nested value genuinely changes.',
        '<code>Object.freeze(obj)</code> only protects <code>obj</code>\'s OWN, DIRECT properties from being reassigned, added, or deleted — it has zero effect on any OBJECT VALUES stored inside those properties. If <code>obj.nested</code> holds a reference to another, separate object, that inner object is completely untouched by freezing the outer one; it remains exactly as mutable as it always was.',
      ],
    },
    {
      heading: 'Why This Is Genuinely Surprising, Given the Immutability Promise',
      points: [
        'The whole POINT of the theory\'s "immutability" section is to prevent "a whole class of bugs where shared mutable state leads to unexpected changes" — a developer who freezes a state object expecting that guarantee to apply everywhere inside it is left with a FALSE sense of safety at any nesting level beyond the first, since <code>Object.freeze()</code>\'s protection stops exactly one level deep.',
        'The fix requires RECURSIVELY freezing every nested object — the main page\'s own <code>deepFreeze()</code> utility walks every own property, recursively freezes any that are themselves objects, and only then freezes the top level. Without this recursive walk, <code>Object.freeze()</code> alone silently protects far less than its name might suggest for anything but a flat, single-level object.',
        'This has real practical consequences beyond a single accidental mutation — any code elsewhere in a large application that holds a reference to a "frozen" state object\'s nested property can still mutate it, and that mutation is invisible to anyone who assumed the whole tree was locked down, making this a genuine, hard-to-trace source of state bugs in exactly the systems immutability is meant to protect.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Object.freeze shallow demo</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `'use strict';

console.log('--- Object.freeze on a NESTED object ---');
const state = Object.freeze({ user: { name: 'Alice', prefs: { theme: 'light' } } });

console.log('Is the top-level state object frozen?', Object.isFrozen(state));
console.log('Is state.user frozen?', Object.isFrozen(state.user), '<-- freezing state did NOT freeze state.user');

console.log('--- Attempting a TOP-LEVEL mutation (should fail) ---');
try {
  (state as any).user = { name: 'Someone Else' };
  console.log('top-level reassignment succeeded?!');
} catch (e) {
  console.log('top-level reassignment THREW (strict mode):', (e as Error).message);
}

console.log('--- Attempting a NESTED mutation (should SUCCEED, revealing the gap) ---');
state.user.name = 'Bob'; // no try/catch needed -- this genuinely works
console.log('state.user.name is now:', state.user.name, '<-- mutated successfully, despite the outer object being "frozen"');

state.user.prefs.theme = 'dark'; // two levels deep -- also succeeds
console.log('state.user.prefs.theme is now:', state.user.prefs.theme, '<-- also mutated successfully');

console.log('--- FIXED: a deepFreeze() that recursively freezes every level ---');
function deepFreeze<T extends object>(obj: T): T {
  Object.getOwnPropertyNames(obj).forEach(name => {
    const val = (obj as any)[name];
    if (val && typeof val === 'object') deepFreeze(val);
  });
  return Object.freeze(obj);
}

const deeplyFrozenState = deepFreeze({ user: { name: 'Carol', prefs: { theme: 'light' } } });
console.log('Is deeplyFrozenState.user frozen now?', Object.isFrozen(deeplyFrozenState.user));
console.log('Is deeplyFrozenState.user.prefs frozen now?', Object.isFrozen(deeplyFrozenState.user.prefs));

try {
  deeplyFrozenState.user.name = 'David';
  console.log('nested mutation on deeply frozen state succeeded?!');
} catch (e) {
  console.log('nested mutation on deeply frozen state correctly THREW:', (e as Error).message);
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: '<code>state</code> is created with <code>Object.freeze()</code>. Does <code>state.user.name = \'Bob\'</code> succeed or throw, given that <code>state</code> itself is frozen?',
    hint: 'Ask exactly WHICH object Object.freeze() was called on -- the outer state object, or state.user (a separate, distinct object nested inside it)?',
    solution: `state.user.name = 'Bob' succeeds completely -- no error, and
state.user.name is genuinely 'Bob' afterward. This happens despite
state itself being frozen, because Object.freeze(state) only ever
froze the OUTER object -- it never touched state.user, which is a
completely separate object value stored inside one of state's
properties.

The top-level reassignment attempt (state.user = { name: 'Someone Else' })
DOES throw in strict mode, confirming Object.freeze() genuinely
protects the outer object's own direct properties from being
reassigned. But state.user.name = 'Bob' isn't reassigning a property
OF state at all -- it's reassigning a property of state.user, a
DIFFERENT object that Object.freeze(state) never touched or even
knew existed as anything more than a value.

Object.isFrozen(state.user) confirms this directly: it returns
false, even though Object.isFrozen(state) returns true. The two
objects have completely independent frozen status.

The deepFreeze() example at the end shows the actual fix: recursively
walking every own property and freezing any that are themselves
objects, BEFORE freezing the top level. Once state.user has ALSO
been explicitly frozen (not just state), the same nested mutation
attempt correctly throws, proving deep freezing genuinely closes the
gap that a single top-level Object.freeze() call leaves wide open.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'calling Object.freeze() on an object protects the ENTIRE object tree underneath it — every nested object, array, and value becomes immutable, not just the object\'s own direct properties.',
      reality: 'Object.freeze() only protects the object it was called on directly — any object VALUES stored in that object\'s properties remain completely mutable, since freezing only affects one level, not the tree beneath it.',
    },
    {
      thought: 'Object.isFrozen(obj) returning true for a top-level state object guarantees every nested object inside it is also frozen and immutable.',
      reality: 'Object.isFrozen() only reports the frozen status of the SPECIFIC object it\'s called on — Object.isFrozen(state) being true says nothing about Object.isFrozen(state.someNestedProperty), which must be checked independently.',
    },
    {
      thought: 'a mutation attempt on a nested property of a frozen object throws an error in strict mode, the same way a top-level reassignment attempt does.',
      reality: 'a nested mutation succeeds completely silently, with no error in strict mode or otherwise — strict mode only makes top-level reassignment attempts on the FROZEN object itself throw; mutating a nested, unfrozen object\'s own properties is completely unaffected by the outer object\'s frozen status.',
    },
  ];
}
