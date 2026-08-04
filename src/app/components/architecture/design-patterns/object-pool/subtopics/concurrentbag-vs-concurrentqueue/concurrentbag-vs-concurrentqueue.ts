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
    heading: 'maxSize Caps Idle Instances, Not Concurrent Rentals',
    points: [
      'The main page\'s <code>Acquire()</code> is <code>_pool.TryTake(out var item) ? item : _factory();</code> — ' +
      'if the pool is empty it just calls the factory, with no check against maxSize anywhere in that path.',
      'maxSize is only ever consulted in <code>Release()</code>, to decide whether a RETURNED object is worth ' +
      'keeping for reuse. It caps how many idle instances the pool retains — it does not cap how many instances ' +
      'can be created and in active use at the same time.',
      'This matches how .NET\'s own <code>Microsoft.Extensions.ObjectPool</code> actually behaves too — ' +
      '<code>Get()</code> never blocks and never refuses to create a new instance; only <code>Return()</code> ' +
      'consults the retained-capacity limit. A pool that needs a hard concurrency ceiling (e.g. "never more than ' +
      '20 database connections open at once") needs a different mechanism layered on top — typically a ' +
      '<code>SemaphoreSlim</code> that Acquire() waits on.',
    ],
  },
  {
    heading: 'Why the Main Page Reaches for ConcurrentBag',
    points: [
      '<code>ConcurrentBag&lt;T&gt;</code> is explicitly optimized, per Microsoft\'s own documentation, for ' +
      'scenarios where the SAME thread both adds and removes items — it keeps a separate thread-local list per ' +
      'thread, so a thread taking from its own list needs no locking at all.',
      'Add()/TryTake() on your own thread\'s local list behaves LIFO (last returned, first reused) — which gives ' +
      'good cache locality: the object you just released is often still warm (e.g. a StringBuilder\'s backing ' +
      'array is still resident) when you reacquire moments later.',
      'If a thread\'s own local list is empty, ConcurrentBag falls back to "stealing" from another thread\'s ' +
      'list — this works, but needs locking and is the slow path, exactly the case Microsoft\'s own docs call out ' +
      'as the pattern ConcurrentBag is NOT optimized for.',
    ],
  },
  {
    heading: 'Why the QnA Reaches for ConcurrentQueue + SemaphoreSlim Instead',
    points: [
      'The main page\'s own QnA, answering "how do you implement a thread-safe Object Pool," describes ' +
      '<code>ConcurrentQueue&lt;T&gt;</code> plus a <code>SemaphoreSlim</code> rather than ConcurrentBag — a ' +
      'genuinely different design, not just a different data structure.',
      'A pool built around a thread pool or ASP.NET Core request pipeline rarely has "the same thread both ' +
      'acquires and releases" — with async/await, a continuation after an awaited call routinely resumes on a ' +
      'DIFFERENT thread-pool thread than the one that started it. That is precisely the dedicated-producer/' +
      'dedicated-consumer pattern ConcurrentBag is documented as being weak at.',
      '<code>SemaphoreSlim</code> adds something ConcurrentBag alone cannot: a caller can <code>await ' +
      'semaphore.WaitAsync()</code> to actually BLOCK until a slot frees up, giving a real hard cap on concurrent ' +
      'rentals — the exact capability the main page\'s own maxSize field does not provide by itself.',
      'ConcurrentQueue is also strictly FIFO, so every pooled instance gets cycled through roughly evenly — no ' +
      'instance sits unused at the bottom of the collection indefinitely the way it theoretically could with a ' +
      'bag under uneven thread-local load.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Hard Concurrency Cap with SemaphoreSlim',
    language: 'csharp',
    code: `// A pool that actually enforces "never more than maxConcurrent in use" —
// something neither the main page's ObjectPool<T> nor DefaultObjectPool<T> does.
public sealed class BoundedObjectPool<T> where T : class
{
    private readonly ConcurrentQueue<T> _idle = new();
    private readonly SemaphoreSlim      _slots;
    private readonly Func<T>            _factory;

    public BoundedObjectPool(Func<T> factory, int maxConcurrent)
    {
        _factory = factory;
        _slots   = new SemaphoreSlim(maxConcurrent, maxConcurrent);
    }

    public async Task<T> AcquireAsync(CancellationToken ct = default)
    {
        // Blocks here if maxConcurrent are already checked out — a REAL cap,
        // unlike a bare Count-based maxSize that only bounds idle instances.
        await _slots.WaitAsync(ct);
        return _idle.TryDequeue(out var item) ? item : _factory();
    }

    public void Release(T item)
    {
        _idle.Enqueue(item);
        _slots.Release(); // frees one waiting AcquireAsync() call, if any
    }
}

// Usage: at most 20 connections ever exist across the whole app, and the
// 21st caller genuinely waits instead of silently allocating a 21st one.
var pool = new BoundedObjectPool<SqlConnection>(
    factory: () => new SqlConnection(connStr),
    maxConcurrent: 20);

var conn = await pool.AcquireAsync();
try   { /* use conn */ }
finally { pool.Release(conn); }`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The main page\'s <code>ObjectPool&lt;T&gt;</code> is constructed with <code>maxSize: 16</code>. If 50 ' +
    'threads call <code>Acquire()</code> at the exact same instant on a completely empty pool, how many ' +
    '<code>SqlConnection</code> instances (or whatever T is) actually get created? Now answer the same question ' +
    'for the <code>BoundedObjectPool&lt;T&gt;</code> shown above, constructed with ' +
    '<code>maxConcurrent: 16</code>.',
  hint:
    'Trace exactly which line of Acquire() checks maxSize (or the semaphore) in each version — is that check ' +
    'on the acquire path, the release path, or both?',
  solution:
    'For the main page\'s ObjectPool&lt;T&gt;: all 50 threads call TryTake() on an empty bag, all 50 fail, and ' +
    'all 50 fall through to _factory() — so all 50 instances get created. maxSize never enters into Acquire() at ' +
    'all; it only matters later, when up to 16 of those 50 are kept after being Release()d. For ' +
    'BoundedObjectPool&lt;T&gt;: the SemaphoreSlim starts with 16 available slots, so only 16 of the 50 ' +
    'AcquireAsync() calls proceed immediately and create/reuse an instance — the other 34 genuinely await inside ' +
    'WaitAsync() until a slot is freed by a Release() call. Only ever 16 instances are in existence at once.',
};

const misconceptions: Misconception[] = [
  {
    thought: 'maxSize on the main page\'s pool means "at most 16 objects will ever be created."',
    reality:
      'It means "at most 16 idle objects are retained for reuse when returned" — a very different guarantee. ' +
      'Under enough concurrent demand, the pool will happily create far more than maxSize instances; it simply ' +
      'will not hang onto more than maxSize of them once they come back via Release().',
  },
  {
    thought: 'ConcurrentBag is just a slower or older alternative to ConcurrentQueue — pick whichever.',
    reality:
      'They target different access patterns, not different performance tiers of the same thing. ConcurrentBag ' +
      'is FASTER specifically when the same thread both adds and removes (no locking on the common path), and ' +
      'ConcurrentQueue is more predictable when producers and consumers are different threads, or when strict ' +
      'FIFO fairness across all callers actually matters.',
  },
  {
    thought: 'Adding a SemaphoreSlim is just a stylistic choice — ConcurrentBag with a count check does the ' +
      'same job.',
    reality:
      'A Count-based check is a check-then-act race (see the earlier subtopic on exactly this) and, more ' +
      'fundamentally, it can only ever refuse to RETAIN an object — it has no way to make a caller wait. ' +
      'SemaphoreSlim.WaitAsync() is a genuinely different capability: it lets Acquire() itself block until ' +
      'capacity is free, which is the only way to guarantee a hard ceiling on concurrently-in-use instances.',
  },
];

@Component({
  selector: 'app-object-pool-concurrentbag-vs-concurrentqueue',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './concurrentbag-vs-concurrentqueue.html',
  styleUrl: './concurrentbag-vs-concurrentqueue.scss',
})
export class ConcurrentbagVsConcurrentqueueSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
