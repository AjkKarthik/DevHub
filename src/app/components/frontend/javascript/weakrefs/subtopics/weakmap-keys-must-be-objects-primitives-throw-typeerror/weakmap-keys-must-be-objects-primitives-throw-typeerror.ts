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
  selector: 'app-weakmap-object-keys-only-subtopic',
  standalone: true,
  imports: [
    RouterLink, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './weakmap-keys-must-be-objects-primitives-throw-typeerror.html',
  styleUrl: './weakmap-keys-must-be-objects-primitives-throw-typeerror.scss',
})
export class CanYouUseNonObjectKeysInWeakMapSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Own QnA, Proven With a Real Thrown TypeError',
      points: [
        'The main page\'s QnA states directly: "WeakMap keys must be objects or non-registered Symbols (ES2023+). Primitives (strings, numbers, booleans) cannot be WeakMap keys." This subtopic actually attempts to use a string, a number, and a plain <code>Symbol()</code> as WeakMap keys, confirming exactly which ones throw and which succeed.',
        'This restriction has a specific, well-defined reason the main page gives: "primitives are value-typed and have no identity — the GC cannot track \'this specific string\' going out of scope." A WeakMap entry\'s automatic removal depends entirely on the GC being able to detect when a specific KEY OBJECT becomes unreachable — something that only makes sense for values with a distinct identity in memory, which primitives fundamentally don\'t have.',
      ],
    },
    {
      heading: 'Why "Value-Typed" vs "Reference-Typed" Is the Deciding Factor',
      points: [
        'Two occurrences of the exact same primitive value (like the string <code>\'hello\'</code> written twice in different places) are considered completely INTERCHANGEABLE by the language — there is no way to ask "is this specific occurrence of the string still reachable" the way you can ask that about a specific object instance, since primitives have no notion of identity separate from their value.',
        'A plain (non-registered) <code>Symbol()</code> IS allowed as a WeakMap key as of ES2023, specifically because each <code>Symbol()</code> call creates a genuinely unique, unshared value with its own identity — unlike other primitives, two symbols are never equal to each other even if created the same way, giving the GC something concrete to track.',
        'A REGISTERED symbol (created via <code>Symbol.for(\'key\')</code>) is deliberately EXCLUDED from this exception, even though it\'s still technically a <code>Symbol</code> — registered symbols are intentionally global and shared across the entire realm (looking up the same key always returns the identical symbol), which defeats the "unique, collectible identity" property that makes plain symbols safe to use.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>WeakMap object-only keys demo</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const wm = new WeakMap<any, string>();

console.log('--- Attempting a STRING key ---');
try {
  wm.set('hello' as any, 'value1');
  console.log('string key accepted?!');
} catch (e) {
  console.log('string key THREW:', (e as Error).message);
}

console.log('--- Attempting a NUMBER key ---');
try {
  wm.set(42 as any, 'value2');
  console.log('number key accepted?!');
} catch (e) {
  console.log('number key THREW:', (e as Error).message);
}

console.log('--- Attempting a BOOLEAN key ---');
try {
  wm.set(true as any, 'value3');
  console.log('boolean key accepted?!');
} catch (e) {
  console.log('boolean key THREW:', (e as Error).message);
}

console.log('--- Attempting a plain, UNREGISTERED Symbol() key (ES2023+) ---');
try {
  const sym = Symbol('my-key');
  wm.set(sym as any, 'value4');
  console.log('plain Symbol() key accepted! value:', wm.get(sym as any));
} catch (e) {
  console.log('plain Symbol() key THREW:', (e as Error).message);
}

console.log('--- Attempting a REGISTERED Symbol.for() key ---');
try {
  const registeredSym = Symbol.for('shared-key');
  wm.set(registeredSym as any, 'value5');
  console.log('registered Symbol.for() key accepted?!');
} catch (e) {
  console.log('registered Symbol.for() key THREW:', (e as Error).message);
}

console.log('--- Contrast: a plain OBJECT key always works ---');
const objKey = {};
wm.set(objKey, 'value6');
console.log('object key accepted, value:', wm.get(objKey));`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Both a plain <code>Symbol(\'my-key\')</code> and a registered <code>Symbol.for(\'shared-key\')</code> are technically values of type <code>symbol</code>. Are they both accepted as WeakMap keys?',
    hint: 'Ask what makes a value safe for the GC to track as a collectible key -- does EVERY symbol have that property, or only symbols that are guaranteed to be unique and never shared?',
    solution: `No -- only the plain Symbol('my-key') is accepted; Symbol.for
('shared-key') throws a TypeError, even though both are genuinely
of type "symbol".

Every string, number, and boolean throws immediately -- these are
value-typed primitives with no identity for the GC to track, exactly
as the theory explains.

Symbol('my-key') succeeds because ES2023 specifically carved out an
exception for UNREGISTERED symbols: each call to Symbol() produces a
brand new, genuinely unique value that is never equal to any other
symbol, even one created with the identical description string. This
gives it the same kind of trackable identity an object has.

Symbol.for('shared-key'), despite also being a symbol, is REGISTERED
in a global symbol registry -- calling Symbol.for('shared-key') from
ANYWHERE in the program, at any time, returns that exact same shared
symbol value. Because it's fundamentally a shared, non-unique value
(conceptually closer to how a string works than how a plain object
works), it's deliberately excluded from the WeakMap-key exception,
and still throws.

The final object key demonstrates the normal case working as
expected -- any plain object, with its own distinct identity in
memory, has always been a valid WeakMap key since WeakMap's
introduction.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'WeakMap keys can be any JavaScript value, the same as a regular Map — the "weak" behavior is purely about how entries are cleaned up, not a restriction on what can be used as a key.',
      reality: 'WeakMap enforces a real, spec-level restriction on what can be a key — only objects (and, as of ES2023, unregistered Symbols) are allowed, because the GC needs a value with genuine identity to track for automatic entry removal.',
    },
    {
      thought: 'since ES2023 allows Symbol values as WeakMap keys, EVERY symbol (however it was created) can now be used as a key.',
      reality: 'only UNREGISTERED symbols (created via Symbol()) are allowed — a REGISTERED symbol from Symbol.for(), despite also being of type "symbol," is deliberately excluded because it represents a shared, non-unique value rather than a genuinely distinct, collectible identity.',
    },
    {
      thought: 'attempting to use a primitive as a WeakMap key fails silently, perhaps by converting it to a string or simply not storing the entry, rather than throwing an actual error.',
      reality: 'attempting to use a disallowed key type throws a real, immediate TypeError from the .set() call itself — there is no silent fallback or conversion behavior at all.',
    },
  ];
}
