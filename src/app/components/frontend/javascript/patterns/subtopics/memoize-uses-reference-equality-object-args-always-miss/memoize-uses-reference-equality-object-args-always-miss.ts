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
  selector: 'app-memoize-reference-equality-subtopic',
  standalone: true,
  imports: [
    RouterLink, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './memoize-uses-reference-equality-object-args-always-miss.html',
  styleUrl: './memoize-uses-reference-equality-object-args-always-miss.scss',
})
export class MemoizeWithObjectArgumentsUsingReferenceEqualitySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Mistake #4, Proven With a Real Cache Miss',
      points: [
        'The main page\'s Mistake #4 states: using a naive <code>Map</code>-based cache with object arguments causes a MISS even for "two equal-looking objects" — because a plain <code>Map</code> uses REFERENCE equality for its keys, not a deep comparison of the object\'s contents. This subtopic calls a naively memoized function with two SEPARATE object literals that have identical properties, and shows the cache treats them as completely different keys.',
        'A JavaScript <code>Map</code>\'s default key comparison is <code>SameValueZero</code> — for objects, this means two different object REFERENCES are always different keys, even if every property inside them is identical. <code>{ id: 1 } !== { id: 1 }</code> is true in plain JavaScript for the exact same reason: object equality is about IDENTITY, not content, unless you explicitly serialize or deep-compare.',
      ],
    },
    {
      heading: 'Why JSON.stringify() Is the Fix — and Its Own Limits',
      points: [
        'The main page\'s fix serializes the arguments into a string BEFORE using them as the cache key: <code>JSON.stringify(args)</code>. Two object literals with the same properties in the same order serialize to the IDENTICAL string, so the <code>Map</code>\'s reference-based key comparison now works correctly — it\'s comparing two equal strings, not two different object references.',
        'This fix has real, documented limits the main page calls out explicitly: it "doesn\'t handle circular refs or functions in args" — <code>JSON.stringify</code> throws on circular references and silently drops function-valued properties, so this memoization strategy is only safe for arguments that are plain, JSON-serializable data (numbers, strings, plain objects/arrays, booleans, null).',
        'Property ORDER also matters for this specific fix: <code>JSON.stringify({ a: 1, b: 2 })</code> and <code>JSON.stringify({ b: 2, a: 1 })</code> produce DIFFERENT strings despite representing "the same" object logically — so this simple serialization trick isn\'t a true deep-equality check, just a reliable-enough heuristic for the common case of consistently-shaped call arguments.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Memoize reference equality demo</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `let computeCallCount = 0;
function expensiveLookup(user: { id: number }) {
  computeCallCount++;
  console.log('  [actually computing] for user id', user.id, '-- call #' + computeCallCount);
  return 'result-for-' + user.id;
}

// BROKEN: naive Map cache keyed directly on the argument object.
function naiveMemoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map();
  return ((...args: any[]) => {
    const key = args[0]; // using the raw object AS the key
    if (cache.has(key)) return cache.get(key);
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

console.log('--- naiveMemoize with two SEPARATE but IDENTICAL-looking objects ---');
const naiveMemoized = naiveMemoize(expensiveLookup);
naiveMemoized({ id: 1 });  // first call -- computes, call #1
naiveMemoized({ id: 1 });  // a NEW object literal, same shape -- does this hit the cache?

console.log('--- Contrast: calling with the SAME object reference twice ---');
computeCallCount = 0;
const naiveMemoized2 = naiveMemoize(expensiveLookup);
const sharedRef = { id: 2 };
naiveMemoized2(sharedRef);
naiveMemoized2(sharedRef);  // the EXACT same reference -- does THIS hit the cache?

console.log('--- FIXED: JSON.stringify(args) as the cache key ---');
computeCallCount = 0;
function fixedMemoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map<string, any>();
  return ((...args: any[]) => {
    const key = JSON.stringify(args); // serialize for value-based equality
    if (cache.has(key)) return cache.get(key);
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}
const fixedMemoized = fixedMemoize(expensiveLookup);
fixedMemoized({ id: 1 });  // computes
fixedMemoized({ id: 1 });  // a NEW object literal, same shape -- hits cache now?`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'In the first scenario, <code>naiveMemoized({ id: 1 })</code> is called twice with two SEPARATE object literals that both have <code>id: 1</code>. Does the second call hit the cache?',
    hint: 'Ask what a plain Map actually compares when checking cache.has(key) for an object key -- the object\'s CONTENTS, or the object\'s IDENTITY (whether it\'s literally the same reference in memory)?',
    solution: `No -- the second call does NOT hit the cache. "[actually computing]"
logs TWICE with call #1 and call #2, proving expensiveLookup() ran
both times, even though both calls looked identical ({ id: 1 }).

A plain Map compares object keys by REFERENCE (identity), not by
content. Two separate object literals -- { id: 1 } written twice --
are two completely different objects in memory, even though they
have the exact same shape and values. cache.has(key) returns false
the second time because the Map has never seen THIS SPECIFIC object
reference before, regardless of what's inside it.

The second scenario proves this is specifically about IDENTITY, not
content: calling naiveMemoized2(sharedRef) twice with the exact SAME
variable (same reference both times) DOES hit the cache correctly --
"[actually computing]" only logs once, since the Map correctly
recognizes it as the same key both times.

The third scenario shows the fix: JSON.stringify(args) converts the
arguments into a STRING before using it as the key. Two object
literals with identical properties serialize to the identical
string ('[{"id":1}]' both times), so the Map's reference-equality
check now works correctly -- it's comparing two equal strings, not
two different object references -- and "[actually computing]" only
logs once.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a Map used as a memoization cache automatically recognizes two different object literals with identical properties as "the same" key, since they represent equal data.',
      reality: 'a Map compares object keys by REFERENCE (identity), not by content — two separate object literals with identical properties are always treated as different keys unless they are literally the same object reference, or the key is serialized to a string first.',
    },
    {
      thought: 'JSON.stringify(args) as a cache key is a complete, general-purpose fix for memoizing functions that take object arguments, safe to use for any function signature.',
      reality: 'JSON.stringify() has real limits called out explicitly on the main page — it throws on circular references, silently drops function-valued properties, and produces different strings for objects with the same properties in different orders, so it only reliably works for consistently-shaped, JSON-serializable arguments.',
    },
    {
      thought: 'this reference-equality cache-miss problem only affects memoization specifically — passing two identical-looking objects to any other equality check (like === or Object.is) would correctly treat them as equal too.',
      reality: 'this is a completely general property of JavaScript object comparison, not something specific to memoization — === and Object.is() ALSO return false for two separate object literals with identical properties; a memoization cache miss here is just one visible consequence of JavaScript objects always comparing by identity, never by content, without an explicit deep-equality check.',
    },
  ];
}
