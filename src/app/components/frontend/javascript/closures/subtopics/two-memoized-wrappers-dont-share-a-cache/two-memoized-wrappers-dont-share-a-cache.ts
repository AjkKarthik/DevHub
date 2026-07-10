import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-memoize-private-cache-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './two-memoized-wrappers-dont-share-a-cache.html',
  styleUrl: './two-memoized-wrappers-dont-share-a-cache.scss',
})
export class TwoMemoizedWrappersDontShareACacheSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Theory Says "Each Memoized Function Gets Its Own Private Cache" — This Verifies It Directly',
      points: [
        'The Practical Closure Patterns section states: "Cache the results of expensive function calls using a closure over a Map. Each memoized function gets its own private cache." This is a strong claim about isolation — it implies TWO separate calls to <code>memoize()</code> never leak cache state between each other, even when wrapping the SAME underlying function.',
        'This subtopic creates two separate <code>memoize(slowSquare)</code> wrappers, calls the first with a specific input (triggering a real computation, tracked with a call counter), then calls the SECOND wrapper with the exact same input — and checks whether the second one gets a cache hit or genuinely recomputes.',
      ],
    },
    {
      heading: 'Why Each memoize() Call Creates a Genuinely Separate Cache',
      points: [
        'Look at the main page\'s own <code>memoize</code> implementation: <code>const cache = new Map();</code> is declared INSIDE the <code>memoize</code> function body, not at module level. Every time <code>memoize(fn)</code> is called, a BRAND NEW <code>Map</code> object is created, and the returned wrapper function closes over THAT specific Map instance.',
        'Two calls to <code>memoize(slowSquare)</code> — even wrapping the literal same underlying function — each get their own separate call to the outer <code>memoize</code> function, which means each gets its own separate <code>new Map()</code>. The two wrapper functions are two distinct closures, each referencing a distinct Map in memory; there is no way for one\'s cache entries to become visible to the other.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>memoize private cache demo</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `let realComputeCount = 0;

function slowSquare(n: number): number {
  realComputeCount++;   // tracks how many times the REAL function body actually ran
  return n * n;
}

function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map();   // a NEW Map every time memoize() is called
  return ((...args: any[]) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

// Two SEPARATE calls to memoize(), wrapping the SAME underlying function.
const memoizedA = memoize(slowSquare);
const memoizedB = memoize(slowSquare);

console.log('Calling memoizedA(5)...');
memoizedA(5);
console.log('realComputeCount after memoizedA(5):', realComputeCount);

console.log('Calling memoizedB(5) with the SAME input...');
memoizedB(5);
console.log('realComputeCount after memoizedB(5):', realComputeCount);

console.log('');
console.log('If the caches were shared, the second call would NOT increment realComputeCount.');
console.log('Final realComputeCount:', realComputeCount);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Open the console. After calling memoizedA(5), what is realComputeCount? After then calling memoizedB(5) with the same input, does realComputeCount increment again?',
    hint: 'Ask whether memoizedA and memoizedB reference the SAME Map object in memory, or two separate ones — each created by its own call to memoize().',
    solution: `realComputeCount is 1 after memoizedA(5) — the real slowSquare
function body ran once, as expected for a fresh call.

realComputeCount becomes 2 after memoizedB(5), even though the
input (5) is identical to what memoizedA already computed. This
confirms the theory section's claim: memoizedB's cache is genuinely
empty at this point, because it's a completely different Map object
than memoizedA's — created by memoizedB's own separate call to
memoize(slowSquare), which ran the "const cache = new Map();" line
independently.

If the two wrappers had somehow shared a cache (for example, if
memoize used a module-level Map instead of one created fresh inside
the function body), realComputeCount would have stayed at 1 after
memoizedB(5) -- the second call would have found "5" already cached
from memoizedA's earlier call.

The practical takeaway matches the theory exactly, now demonstrated
rather than just stated: the private-cache guarantee memoize()
provides comes specifically from where the "new Map()" line sits --
inside the outer function, so it re-runs (creating a genuinely new,
separate cache) every single time memoize() itself is called, not
just once when the module first loads.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'memoize(fn) uses a single, shared cache internally — calling memoize() on the same underlying function twice reuses the same cache both times.',
      reality: 'each call to memoize(fn) creates a BRAND NEW Map via its own execution of "const cache = new Map();" — two separate memoize() calls produce two wrapper functions with two completely independent caches, even when wrapping the identical underlying function.',
    },
    {
      thought: 'if two memoized wrappers happen to disagree about whether an input is cached, that indicates a bug in the memoize implementation.',
      reality: 'this is the CORRECT, intended behavior — each memoize() call is meant to produce an independently-cached wrapper, precisely so that different use sites of the same expensive function don\'t interfere with each other\'s cache state.',
    },
    {
      thought: 'the cache in a memoize() closure works the same way as a module-level variable — its lifetime and scope are effectively global to the file.',
      reality: 'the cache\'s lifetime is scoped to ONE SPECIFIC call to memoize() — it lives inside that call\'s closure, not at module level, which is exactly why multiple calls to memoize() produce multiple independent caches instead of one shared one.',
    },
  ];
}
