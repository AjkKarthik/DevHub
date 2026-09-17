import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-default-scheduler-microtask-then-nexttick',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './default-scheduler-microtask-then-nexttick.html',
  styleUrl: './default-scheduler-microtask-then-nexttick.scss',
})
export class DefaultSchedulerMicrotaskThenNexttickSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'What the real default scheduler does',
      points: [
        'Verified by reading the installed <code>dataloader</code> package\'s own source (v2.2.3) directly: the default <code>batchScheduleFn</code> is NOT a bare <code>process.nextTick(fn)</code> call.',
        'It is <code>resolvedPromise.then(() => process.nextTick(fn))</code> — a shared, cached <code>Promise.resolve()</code> instance whose <code>.then()</code> callback is what actually schedules the dispatch as a <code>process.nextTick</code> job.',
        'DataLoader\'s own source comment explains why: a bare <code>process.nextTick(fn)</code> could dispatch BEFORE pending <code>.then()</code> continuations from the current tick get a chance to call <code>load()</code> — the extra microtask hop guarantees dispatch happens after the current microtask queue has been given a chance to enqueue more loads.',
      ],
    },
    {
      heading: 'The practical consequence: microtask hops don\'t break the batch',
      points: [
        'Verified via direct execution against the real package: a synchronous <code>load()</code> call, one issued from inside <code>Promise.resolve().then(() => loader.load(...))</code>, and even one issued after 50 chained <code>await Promise.resolve()</code> hops all land in the SAME batch call.',
        'Only a genuine macrotask — <code>setImmediate</code>, <code>setTimeout</code>, or a real I/O callback — breaks out of the current batch and starts a new one.',
        'Practically: an async resolver that awaits an already-resolved value (an in-memory cache hit, a Promise that settles through other microtasks) before calling <code>loader.load(id)</code> does NOT risk missing the batch. Only awaiting something that crosses a real asynchronous boundary does.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Real dataloader source — the default scheduler',
      language: 'typescript',
      code: `// node_modules/dataloader/index.js (v2.2.3) -- the actual default
// batchScheduleFn, confirmed by reading the installed package directly

var resolvedPromise; // shared, cached across all dispatches

var enqueuePostPromiseJob =
  typeof process === 'object' && typeof process.nextTick === 'function'
    ? function (fn) {
        if (!resolvedPromise) {
          resolvedPromise = Promise.resolve();
        }
        // NOT a bare process.nextTick(fn) call --
        // a microtask that THEN schedules the nextTick job.
        resolvedPromise.then(function () {
          process.nextTick(fn);
        });
      }
    : typeof setImmediate === 'function'
      ? function (fn) { setImmediate(fn); }
      : function (fn) { setTimeout(fn); };

// This is what "by default uses process.nextTick" actually means --
// it is process.nextTick reached THROUGH a microtask, not directly.`,
    },
    {
      label: 'Verified: microtask hops still land in the same batch',
      language: 'typescript',
      code: `import DataLoader from 'dataloader';

const batchCalls: string[][] = [];
const loader = new DataLoader(async (keys) => {
  batchCalls.push([...keys] as string[]);
  return keys.map(k => \`v-\${k}\`);
});

async function manyHops(key: string, hops: number) {
  for (let i = 0; i < hops; i++) await Promise.resolve();
  return loader.load(key);
}

loader.load('sync');
manyHops('hops-5', 5);
manyHops('hops-50', 50);

setTimeout(() => {
  console.log(batchCalls);
  // [ [ 'sync', 'hops-5', 'hops-50' ] ]  -- ALL land in ONE batch call,
  // even the one that awaited Promise.resolve() 50 times in a row.
}, 50);`,
    },
    {
      label: 'A real macrotask DOES break out',
      language: 'typescript',
      code: `import DataLoader from 'dataloader';

const batchCalls: string[][] = [];
const loader = new DataLoader(async (keys) => {
  batchCalls.push([...keys] as string[]);
  return keys.map(k => \`v-\${k}\`);
});

loader.load('sync');

Promise.resolve().then(() => loader.load('microtask')); // joins the batch

setImmediate(() => loader.load('macrotask')); // does NOT join the batch

setTimeout(() => {
  console.log(batchCalls);
  // [ [ 'sync', 'microtask' ], [ 'macrotask' ] ]
}, 50);`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A resolver does <code>const cached = await getFromInMemoryCache(id); return loader.load(cached ?? id);</code> where <code>getFromInMemoryCache</code> returns an already-settled Promise with no real I/O. A second, sibling resolver in the same query calls <code>loader.load(otherId)</code> with no <code>await</code> at all beforehand. Do both <code>load()</code> calls land in the same batch, or does the <code>await</code> in the first resolver push it into a later batch?',
    hint: 'The deciding factor verified in this subtopic is not "was there an await at all" — it is whether everything before the load() call resolves via microtasks only, or whether it crosses a real macrotask/I/O boundary.',
    solution: `Both land in the same batch. getFromInMemoryCache returning an already-resolved Promise means the await only costs one (or a few) microtask turns -- exactly the case verified above where even 50 chained microtask hops still joined the original batch.

The rule is not "any await risks missing the batch"; it is "only a genuine macrotask (setImmediate, setTimeout, a real network/disk I/O callback) breaks out of the current batch." A resolver awaiting a synchronous in-memory cache lookup is functionally indistinguishable from a synchronous resolver as far as DataLoader's batching window is concerned.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"DataLoader only batches load() calls made completely synchronously — any await before calling load() risks missing the batch."',
      reality: 'Verified false. The default scheduler is a microtask (<code>Promise.resolve().then(...)</code>) that then schedules a <code>process.nextTick</code> job, specifically so loads issued during ANY pending microtask/promise-chain flush still land in the same batch. Only a real macrotask (<code>setImmediate</code>, <code>setTimeout</code>, actual I/O) breaks out.',
    },
    {
      thought: '"batchScheduleFn\'s default of \'process.nextTick\' means dispatch happens via a single, direct process.nextTick(dispatchFn) call."',
      reality: 'The real default wraps that call inside a shared <code>Promise.resolve().then(...)</code> first — a genuine two-step hybrid, confirmed by reading the installed <code>dataloader</code> package\'s own source directly. This extra microtask hop is what lets loads from <code>.then()</code> continuations join the batch at all.',
    },
    {
      thought: '"process.nextTick and microtasks (Promise.then) are the same mechanism with different names."',
      reality: 'They are two separate queues in Node.js, and DataLoader\'s own source comment explicitly reasons about the interaction between them — the whole point of wrapping <code>process.nextTick</code> inside a <code>Promise.then()</code> is to guarantee the dispatch happens after the microtask ("PromiseJobs") queue has been given a chance to enqueue more loads.',
    },
  ];

  topicLabel = 'DataLoader & N+1 Problem';
  topicRoute = '/graphql/dataloader';
  prev: SubtopicLink | null = null;
  next: SubtopicLink | null = {
    label: 'cacheKeyFn Is Required to Deduplicate Object Keys',
    route: '/graphql/dataloader/cachekeyfn-required-for-object-keys',
  };
}
