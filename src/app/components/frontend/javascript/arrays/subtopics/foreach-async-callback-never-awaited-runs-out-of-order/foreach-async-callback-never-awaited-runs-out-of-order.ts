import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-foreach-async-out-of-order-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './foreach-async-callback-never-awaited-runs-out-of-order.html',
  styleUrl: './foreach-async-callback-never-awaited-runs-out-of-order.scss',
})
export class ForeachAsyncCallbackNeverAwaitedRunsOutOfOrderSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The QnA States the Bug — This Runs All Three Approaches Side by Side to See It',
      points: [
        'The QnA section says: "forEach ignores the return value of its callback, so returning a Promise from it does nothing — the loop does not await each iteration." This is a precise claim about a genuinely confusing async bug — but the reader never sees the actual timing difference play out.',
        'This subtopic runs the SAME staggered-delay async task through <code>forEach</code>, <code>for...of</code> with <code>await</code>, and <code>Promise.all(arr.map(...))</code> — logging a timestamped completion order for each — to directly observe which one finishes "immediately" (wrongly) and which two genuinely wait.',
      ],
    },
    {
      heading: 'Why forEach Can\'t Be Fixed by Just Adding async/await to Its Callback',
      points: [
        'Marking a callback <code>async</code> makes it RETURN a Promise — but <code>forEach</code>\'s own implementation does not inspect, store, or wait on ANY value the callback returns. It simply calls the callback for each element and immediately moves to the next one, exactly as if the callback were synchronous. The Promise the callback returns is created and then silently discarded.',
        '<code>for...of</code> with <code>await</code> inside the loop body genuinely pauses the ENCLOSING async function at each iteration — this only works because <code>for...of</code> is a language-level control-flow construct that the <code>await</code> keyword can suspend, unlike a callback passed into an ordinary method.',
        '<code>Promise.all(arr.map(async fn))</code> takes a different, PARALLEL approach: <code>map</code> immediately starts every async call without waiting (since each <code>async fn</code> call returns a Promise right away), and <code>Promise.all</code> is what actually waits for the whole batch to settle — genuinely different from the SEQUENTIAL waiting <code>for...of</code> + <code>await</code> provides.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>forEach async pitfall demo</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchItem(id: number, ms: number) {
  await delay(ms);
  return 'item-' + id;
}

const tasks = [
  { id: 1, ms: 60 },
  { id: 2, ms: 20 },
  { id: 3, ms: 40 },
];

async function runForEach() {
  console.log('forEach: starting');
  const results: string[] = [];
  tasks.forEach(async (t) => {
    const item = await fetchItem(t.id, t.ms);
    results.push(item);
  });
  console.log('forEach: loop finished, results RIGHT NOW:', results);   // note: checked immediately
}

async function runForOf() {
  console.log('for...of: starting');
  const results: string[] = [];
  for (const t of tasks) {
    const item = await fetchItem(t.id, t.ms);
    results.push(item);
  }
  console.log('for...of: loop finished, results:', results);
}

async function runPromiseAll() {
  console.log('Promise.all(map): starting');
  const results = await Promise.all(tasks.map(t => fetchItem(t.id, t.ms)));
  console.log('Promise.all(map): finished, results:', results);
}

(async () => {
  await runForEach();
  await runForOf();
  await runPromiseAll();
})();
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Open the console. Right after "forEach: loop finished", what does the results array actually contain? Compare that to for...of and Promise.all(map)\'s final results.',
    hint: 'forEach\'s own function call returns before any of the async callbacks have had a chance to actually complete — ask what results necessarily looks like at that exact moment.',
    solution: `"forEach: loop finished, results RIGHT NOW: []" -- an EMPTY array.
forEach's own call synchronously iterates and starts all three async
callbacks, but returns immediately afterward, before ANY of them have
had time to await their delay and push into results. The runForEach
function itself continues (and its own await runForEach() in the
outer IIFE resolves) without ever actually waiting for the real work
to finish.

"for...of: loop finished, results: ['item-1', 'item-2', 'item-3']"
-- correctly populated, IN ORDER, because each await genuinely
paused the for...of loop until that specific iteration's async work
completed before moving to the next.

"Promise.all(map): finished, results: ['item-1', 'item-2',
'item-3']" -- also correctly populated and in the ORIGINAL array
order (not completion order, despite item 2 finishing fastest at
20ms) -- Promise.all preserves the input order of its results
regardless of which promise actually settles first.

This confirms the QnA's claim precisely: forEach's callback returning
a Promise is completely ignored by forEach itself -- the "loop
finished" message is genuinely lying about the async work being done.
Both for...of+await (sequential) and Promise.all+map (parallel) are
real fixes, with a real behavioral difference: for...of takes
~120ms total (60+20+40, one at a time), while Promise.all takes only
~60ms (all three running concurrently, capped by the SLOWEST one).`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'marking a forEach callback as async and using await inside it makes the loop properly wait for each async operation, similar to how for...of with await works.',
      reality: 'forEach never inspects or waits on anything the callback returns — an async callback\'s Promise is created and immediately discarded, so the loop moves on and forEach itself returns before any of the async work has actually finished.',
    },
    {
      thought: 'the bug from using forEach with async callbacks is that the operations run in the wrong order.',
      reality: 'the async operations DO start in the correct order (forEach calls the callback for each element in sequence) — the actual bug is that forEach never waits for any of them, so code AFTER the forEach call runs before the async work is done, not that the async work itself runs out of order.',
    },
    {
      thought: 'for...of with await and Promise.all(arr.map(...)) are interchangeable fixes for this bug — either one works equally well in any situation.',
      reality: 'they have a genuine behavioral difference — for...of with await processes items SEQUENTIALLY (one at a time, slower but resource-gentler), while Promise.all(map) processes items in PARALLEL (all at once, faster but issues every request simultaneously) — the right choice depends on whether the operations can safely run concurrently.',
    },
  ];
}
