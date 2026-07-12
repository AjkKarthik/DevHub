import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './memoization-genuinely-skips-recomputation-for-repeated-inputs.html',
  styleUrl: './memoization-genuinely-skips-recomputation-for-repeated-inputs.scss'
})
export class MemoizationGenuinelySkipsRecomputationForRepeatedInputsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A memoized function genuinely runs the real computation fewer times — this is directly countable, not just theoretically true',
      points: [
        'Wrapping an expensive function with a cache keyed by its arguments means that on a repeated call with the SAME arguments, the wrapper returns the cached result and never invokes the real underlying function body at all.',
        'This is directly measurable by instrumenting the real function with its own internal call counter — calling the memoized wrapper 4 times (with only 2 distinct argument values among them) results in the real underlying function running exactly 2 times, confirmed via the counter, not assumed from reading the memoize() implementation.',
      ]
    },
    {
      heading: 'This is exactly the mechanism behind useMemo (React) and computed signals (Angular) — same idea, framework-managed cache key',
      points: [
        'A framework\'s computed/memo primitive is conceptually the same pattern demonstrated here: a cache keyed by dependencies, only recomputing when a dependency actually changes — the framework just manages the cache key (the dependency array or signal graph) instead of a plain JSON.stringify(args) key.',
        'The main page\'s "re-running expensive calculations on every render" mistake is exactly the unmemoized version of this demo\'s first function — every call (every render) re-executes the real work, even when nothing that affects the result has changed.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>memoization genuinely skips recomputation for repeated inputs</title>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `let realCallCount = 0;

function expensiveCalc(n: number): number {
  realCallCount++; // instrument the REAL function body
  let result = 0;
  for (let i = 0; i < n; i++) result += Math.sqrt(i);
  return result;
}

function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map<string, ReturnType<T>>();
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key)!;
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

const memoizedCalc = memoize(expensiveCalc);

console.log('calling memoizedCalc(1000) three times, memoizedCalc(2000) once, memoizedCalc(1000) once more:');
memoizedCalc(1000);
memoizedCalc(1000);
memoizedCalc(1000);
memoizedCalc(2000);
memoizedCalc(1000);

console.log('total wrapper calls: 5');
console.log('real underlying function calls (the actual expensive work):', realCallCount, '(expected 2 — one per DISTINCT input)');
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A dashboard component calls formatCurrency(amount, locale) inside its render function to display 200 line items, each re-rendered whenever the user scrolls (a common list virtualization re-render pattern). Profiling shows formatCurrency itself is cheap, but it is called thousands of times per second during scrolling and shows up as a real bottleneck in the flame graph. Most of the 200 items show the SAME amount and locale repeatedly across re-renders. Would memoizing formatCurrency actually help here?',
    hint: 'Ask what memoization actually eliminates — repeated CALLS, or repeated calls with the SAME arguments specifically.',
    solution: 'Yes, memoizing would help, and the "cheap per call but expensive in aggregate" pattern is exactly memoization\'s sweet spot — confirmed in this subtopic\'s demo, where 5 wrapper calls with only 2 distinct argument sets resulted in the real function running just 2 times. Since most of the 200 items repeat the same amount/locale combination across scroll re-renders, memoizing formatCurrency would skip re-running the actual formatting logic for every repeated (amount, locale) pair, only doing real work for genuinely new combinations — directly reducing the thousands of real formatting calls down to the number of DISTINCT combinations actually seen.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Memoization is a general "make repeated calls faster" trick that works by making the function itself run faster on subsequent calls.',
      reality: 'It does not make the underlying function run faster at all — this subtopic\'s demo shows the real function is called EXACTLY the same number of times it needs to be (once per distinct input) and does not run at all for a repeated input, rather than running quickly.'
    },
    {
      thought: 'A memoized function still runs its real logic every time it is called — the cache is just consulted afterward as a sanity check or for logging purposes.',
      reality: 'The cache is consulted FIRST, and the real function body is skipped entirely on a cache hit — confirmed directly in this subtopic\'s demo via the real call counter staying at 2 despite 5 total wrapper invocations.'
    },
    {
      thought: 'Memoization is really only useful for CPU-heavy calculations (complex math, large data transforms) — memoizing a cheap function like formatCurrency provides no meaningful benefit.',
      reality: 'The benefit scales with CALL FREQUENCY as much as per-call cost — a cheap function called thousands of times per second (as in this subtopic\'s Try It exercise) can still show up as a real bottleneck purely from call volume, and memoization helps exactly the same way there as it does for a single expensive calculation.'
    }
  ];
}
