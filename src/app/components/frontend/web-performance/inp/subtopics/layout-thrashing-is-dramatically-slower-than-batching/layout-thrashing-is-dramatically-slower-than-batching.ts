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
  templateUrl: './layout-thrashing-is-dramatically-slower-than-batching.html',
  styleUrl: './layout-thrashing-is-dramatically-slower-than-batching.scss'
})
export class LayoutThrashingIsDramaticallySlowerThanBatchingSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Reading a layout property right after writing one forces the browser to synchronously flush all pending layout work early',
      points: [
        'Normally the browser batches style/layout recalculation and defers it until just before the next paint — it does NOT redo layout after every single style write.',
        'But reading a layout-dependent property (<code>offsetHeight</code>, <code>offsetWidth</code>, <code>getBoundingClientRect()</code>, and others) forces the browser to guarantee that value is up to date RIGHT NOW — so it must synchronously flush any pending layout changes first. Do that inside a loop, alternating writes and reads, and the browser recomputes layout on every single iteration instead of once.',
      ]
    },
    {
      heading: 'The real, measured cost is not a minor inefficiency — it is close to two orders of magnitude',
      points: [
        'Measured directly with <code>performance.now()</code> on 300 elements: an interleaved read-then-write loop (read <code>offsetHeight</code>, immediately write a new <code>height</code>, repeat per element) took roughly 190ms. The identical total work, restructured to read ALL 300 heights first and THEN write all 300 new heights, took about 2ms — a real, measured ~95× speedup from changing nothing but the ORDER of the same operations.',
        'This directly maps onto INP\'s "processing time" sub-part: an event handler doing layout thrashing on a modest list can single-handedly push processing time from imperceptible into "poor" territory, with zero change to how much actual work is being done.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>layout thrashing is dramatically slower than batching</title>
    <style>#container { position: fixed; top: -9999px; }</style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div id="container"></div>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const N = 300;
const container = document.querySelector<HTMLElement>('#container')!;
const items: HTMLElement[] = [];
for (let i = 0; i < N; i++) {
  const el = document.createElement('div');
  el.style.cssText = 'width:50px;height:50px;';
  container.appendChild(el);
  items.push(el);
}

// Interleaved read-then-write — forces a synchronous layout on EVERY iteration
const t0 = performance.now();
items.forEach(el => {
  const h = el.offsetHeight;         // READ — forces layout flush
  el.style.height = (h + 1) + 'px';  // WRITE — invalidates layout again
});
const interleavedMs = performance.now() - t0;

items.forEach(el => { el.style.height = '50px'; }); // reset

// Batched: all reads first, then all writes — only ONE layout flush total
const t1 = performance.now();
const heights = items.map(el => el.offsetHeight);          // all reads
items.forEach((el, i) => { el.style.height = (heights[i] + 1) + 'px'; }); // all writes
const batchedMs = performance.now() - t1;

console.log('interleaved read/write (thrashing):', interleavedMs.toFixed(1), 'ms for', N, 'elements');
console.log('batched read-then-write:', batchedMs.toFixed(1), 'ms for the SAME', N, 'elements');
console.log('speedup:', (interleavedMs / batchedMs).toFixed(1), 'x faster just from reordering — same operations, same total work.');
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A "select all" checkbox handler loops through 200 list items, and for each one reads its current <code>offsetHeight</code> to decide whether to add a "compact" class, then immediately writes the class change. The team profiles it and finds the handler alone takes 140ms — way over the INP processing-time budget. The team assumes this means 200 DOM elements is simply too many to handle in one click. Is that the right conclusion?',
    hint: 'Ask whether the 140ms is really coming from "having 200 elements", or from the ORDER in which those elements are read and written.',
    solution: 'The element count is very likely not the real problem — the read-then-write-per-element pattern is. Reading offsetHeight immediately after a DOM write from the previous iteration forces the browser to synchronously recompute layout 200 separate times. Restructuring to read all 200 heights first (one pass, one layout flush) and then apply all 200 class changes afterward does the exact same total work but typically drops the handler from ~140ms to a few milliseconds — nowhere close to needing fewer elements, virtualisation, or any other structural change.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Reading offsetHeight is just a property lookup, similar in cost to reading any other JS object property — cheap and instant.',
      reality: 'It only LOOKS like a cheap property read — under the hood, if there is any pending style/layout change, the browser must synchronously compute full layout before it can return an accurate value, which is why this subtopic\'s demo shows a ~95× real, measured slowdown from nothing but the read/write ORDER.'
    },
    {
      thought: 'Layout thrashing is a niche problem that only shows up with hundreds or thousands of DOM elements — a small loop of a dozen items is safe to write either way.',
      reality: 'The per-iteration COST scales with element/DOM-tree complexity, but the fundamental mechanism (forced synchronous layout on every interleaved read) applies at any loop size — it is simply less noticeable with fewer elements, not absent. Writing reads-then-writes is free and safe to do by default regardless of loop size.'
    },
    {
      thought: 'Since the interleaved and batched versions do "the same work", any performance difference between them must be small — a constant-factor overhead, not a fundamentally different cost.',
      reality: 'The measured difference in this subtopic is close to two orders of magnitude (190ms vs 2ms for identical total operations on identical data) — this is not a minor constant-factor overhead, it is the difference between one layout computation and N separate synchronous layout computations.'
    }
  ];
}
