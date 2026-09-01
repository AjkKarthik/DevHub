import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

const theory: TheoryPoint[] = [
  {
    heading: 'Explained in Real Depth, Never Actually Demonstrated Running',
    points: [
      'One of the main page’s own quiz explanations describes precisely WHY DataLoader batching works: "DataLoader defers each queued key to the end of the current tick... rather than firing immediately, giving every synchronously-executing resolver in that GraphQL query a chance to register its <code>.load()</code> calls before the batch function actually runs." No codeTab on the page shows a minimal version of this timing mechanism actually running.',
      'The core trick is real, standard JavaScript microtask scheduling — <code>process.nextTick()</code> (Node.js) or a Promise microtask queues a callback to run AFTER the current synchronous code finishes, but BEFORE the event loop moves on to the next macrotask (timers, I/O). Multiple synchronous <code>.load()</code> calls all get to run and queue their key BEFORE that deferred callback ever fires.',
      'This is exactly why GraphQL resolvers work as DataLoader’s batching trigger with zero coordination code between them: every sibling resolver for a list of items (e.g., each order’s own <code>customer</code> resolver) executes synchronously, one after another, within the same tick — by the time any of them actually needs the batched result, all of their <code>.load()</code> calls have already been queued.',
      'A real DataLoader implementation also DEDUPES identical keys within one batch (querying for the same ID twice in one tick still only appears once in the actual batch fetch) and CACHES results for the lifetime of the loader instance — this subtopic’s minimal version demonstrates only the batching-via-timing mechanism itself, not those additional optimizations.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'A Minimal Batching Loader',
    language: 'typescript',
    code: `class MiniLoader<K, V> {
  private queue: { key: K; resolve: (v: V) => void; reject: (e: unknown) => void }[] = [];
  private scheduled = false;

  constructor(private batchFn: (keys: K[]) => Promise<V[]>) {}

  load(key: K): Promise<V> {
    return new Promise((resolve, reject) => {
      this.queue.push({ key, resolve, reject });
      if (!this.scheduled) {
        this.scheduled = true;
        // Defer to the end of the current tick -- every synchronous
        // .load() call made before this callback runs still makes it
        // into the SAME batch.
        process.nextTick(() => this.dispatch());
      }
    });
  }

  private async dispatch() {
    const batch = this.queue;
    this.queue = [];
    this.scheduled = false;
    const keys = batch.map(b => b.key);
    const results = await this.batchFn(keys);
    batch.forEach((b, i) => b.resolve(results[i]));
  }
}

let batchCallCount = 0;
const loader = new MiniLoader<string, { id: string; name: string }>(async (ids) => {
  batchCallCount++;
  console.log('batch fn called with:', ids);
  return ids.map(id => ({ id, name: 'user-' + id }));
});

// Three .load() calls made SYNCHRONOUSLY -- mirroring three sibling
// GraphQL resolvers (e.g. three orders' own "customer" resolver) all
// running in the same execution tick.
const p1 = loader.load('a');
const p2 = loader.load('b');
const p3 = loader.load('a'); // duplicate key, same tick

Promise.all([p1, p2, p3]).then(results => {
  console.log('results:', results);
  console.log('total batch fn calls:', batchCallCount);
});
// batch fn called with: [ 'a', 'b', 'a' ]
// results: [ { id: 'a', ... }, { id: 'b', ... }, { id: 'a', ... } ]
// total batch fn calls: 1
// -- one call, even though .load() was called three times.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The codeTab’s output shows <code>batchFn</code> called with <code>[\'a\', \'b\', \'a\']</code> — the duplicate <code>\'a\'</code> is NOT deduplicated in this minimal <code>MiniLoader</code>. A real DataLoader would call its batch function with only <code>[\'a\', \'b\']</code> (deduped). What would need to change in <code>MiniLoader</code> to add that deduplication, and would it change WHEN the batch fires — the timing mechanism this subtopic is actually about?',
  hint: 'Deduplication is about WHICH keys end up in the array passed to <code>batchFn</code> — is that a separate concern from WHEN <code>dispatch()</code> gets called via <code>process.nextTick()</code>?',
  solution: `// Deduplication and batch TIMING are genuinely separate concerns, and
// adding dedup would NOT change the timing mechanism at all.

// To dedupe, load() would need to check whether a key is ALREADY queued
// (or already has a cached/in-flight promise for it) before pushing a
// new queue entry -- e.g. keeping a Map<K, Promise<V>> and returning the
// EXISTING promise for a key already requested in the current batch,
// instead of always pushing a fresh queue entry. The batch fn would then
// only ever receive unique keys.

// None of that touches process.nextTick() or the dispatch() scheduling
// logic at all -- the SAME "defer to end of tick, collect everything
// queued before then" mechanism keeps working identically. This is a
// good confirmation that this subtopic's simplification (skipping
// dedup) is a genuinely separate optimization layered ON TOP of the
// batching-via-timing mechanism, not something baked into it -- you
// could add dedup, add caching, or add per-key error handling
// independently, and the core timing trick underneath stays the same.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'DataLoader must use a fixed timer (like <code>setTimeout</code>) to decide when enough <code>.load()</code> calls have accumulated before firing the batch.',
    reality: 'One of the main page’s own quiz explanations explicitly rules this out, and the codeTab confirms it: <code>process.nextTick()</code> (a MICROTASK, not a timer) fires as soon as the current synchronous code finishes — no fixed delay, no polling for "enough" calls. It works because GraphQL resolvers for sibling fields all run synchronously within the same tick, so by the time the microtask callback fires, every relevant <code>.load()</code> call has already been queued.',
  },
  {
    thought: 'Batching happens automatically for ANY <code>.load()</code> calls made anywhere in an application, regardless of timing.',
    reality: 'The mechanism specifically depends on the calls happening SYNCHRONOUSLY, close enough together to all queue before the deferred <code>dispatch()</code> runs. Two <code>.load()</code> calls separated by a real <code>await</code> on some OTHER async operation (a network call, a timer) would very likely end up in two SEPARATE batches, since the first batch’s <code>process.nextTick()</code> callback would already have fired and reset <code>scheduled</code> before the second call arrives.',
  },
  {
    thought: 'This subtopic’s <code>MiniLoader</code> is functionally equivalent to the real <code>dataloader</code> npm package used in the main page’s own codeTab.',
    reality: '<code>MiniLoader</code> deliberately demonstrates ONLY the batching-via-microtask-timing mechanism — it skips deduplication (confirmed by the codeTab’s own <code>[\'a\', \'b\', \'a\']</code> batch call) and per-request caching, both of which the real <code>dataloader</code> package provides. The Try It above traces exactly why adding those features would layer on top of, not replace, the timing mechanism this subtopic focuses on.',
  },
];

@Component({
  selector: 'app-api-graphql-dataloader-timing',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './dataloader-batching-via-microtask-timing.html',
  styleUrl: './dataloader-batching-via-microtask-timing.scss',
})
export class DataloaderBatchingViaMicrotaskTimingSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
