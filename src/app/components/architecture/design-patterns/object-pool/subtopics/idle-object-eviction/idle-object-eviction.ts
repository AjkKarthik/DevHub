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
    heading: 'A Promise the Main Page Never Shows in Code',
    points: [
      'The main page\'s theory states: "Pool may shrink idle objects after a timeout to free memory when demand ' +
      'drops" — but neither codeTab (the generic <code>ObjectPool&lt;T&gt;</code> or the ArrayPool/StringBuilder ' +
      'examples) implements anything of the sort.',
      'The shown <code>ObjectPool&lt;T&gt;</code> only ever grows toward maxSize and stays there — once maxSize ' +
      'idle instances exist, they sit in the pool forever, even during long quiet periods with no traffic at all.',
      'For cheap objects (StringBuilder) that memory is trivial. For a pool of something heavier — a pool of ' +
      'pre-warmed HTTP clients, or database connections above the driver\'s own pool — holding maxSize instances ' +
      'permanently, even at 3am with zero requests, is real, avoidable waste.',
    ],
  },
  {
    heading: 'What Idle Eviction Actually Needs',
    points: [
      'Each returned item needs a timestamp recorded at Release() time — the pool cannot know how long an item ' +
      'has been idle unless it tracks when it stopped being used.',
      'A periodic sweep (a background <code>Timer</code>, not something run inline on Acquire/Release) walks the ' +
      'idle items and removes any whose timestamp is older than the configured idle timeout.',
      'Because items are timestamped in Release() order and typically consumed in the reverse order they were ' +
      'added, a FIFO-oriented structure (a queue) makes "find and remove the oldest expired entries" a cheap ' +
      'peek-from-the-front operation — this is one of the reasons a pool built for eviction reaches for a queue ' +
      'rather than the main page\'s <code>ConcurrentBag&lt;T&gt;</code>.',
    ],
  },
  {
    heading: 'Eviction Is Not the Same as Disposal',
    points: [
      'Removing an item from the pool\'s internal collection only stops the POOL from tracking it — for a plain ' +
      '<code>StringBuilder</code>, that is enough, the object is simply left for the garbage collector.',
      'For anything holding an unmanaged or external resource — a database connection, a file handle, a socket — ' +
      'evicting it from the pool without also calling <code>Dispose()</code> silently leaks the underlying ' +
      'resource, even though the pool itself looks perfectly clean.',
      'A correct sweep checks whether the evicted item implements <code>IDisposable</code> and disposes it as ' +
      'part of eviction — "removed from the pool" and "cleaned up" have to happen together for disposable pooled ' +
      'resources.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Timestamped Pool with Sweep',
    language: 'csharp',
    code: `public sealed class TimestampedObjectPool<T> : IDisposable where T : class
{
    private sealed record Entry(T Item, DateTime ReturnedAt);

    private readonly ConcurrentQueue<Entry> _pool = new();
    private readonly Func<T>          _factory;
    private readonly Action<T>?       _reset;
    private readonly TimeSpan         _idleTimeout;
    private readonly Timer            _sweepTimer;

    public TimestampedObjectPool(Func<T> factory, Action<T>? reset, TimeSpan idleTimeout)
    {
        _factory     = factory;
        _reset       = reset;
        _idleTimeout = idleTimeout;
        // Sweep runs on a background timer thread — never on the Acquire/Release hot path.
        _sweepTimer  = new Timer(_ => Sweep(), null, idleTimeout, idleTimeout);
    }

    public T Acquire() =>
        _pool.TryDequeue(out var entry) ? entry.Item : _factory();

    public void Release(T item)
    {
        _reset?.Invoke(item);
        _pool.Enqueue(new Entry(item, DateTime.UtcNow));
    }

    private void Sweep()
    {
        var cutoff = DateTime.UtcNow - _idleTimeout;

        // FIFO order: the front of the queue is always the OLDEST entry, so we
        // can stop the moment we see one that hasn't expired yet.
        while (_pool.TryPeek(out var oldest) && oldest.ReturnedAt < cutoff)
        {
            if (_pool.TryDequeue(out var evicted))
                (evicted.Item as IDisposable)?.Dispose(); // don't just drop it — clean it up
        }
    }

    public void Dispose()
    {
        _sweepTimer.Dispose();
        while (_pool.TryDequeue(out var entry))
            (entry.Item as IDisposable)?.Dispose();
    }
}

// Usage: connections idle for over 2 minutes get closed, not just forgotten
var pool = new TimestampedObjectPool<SqlConnection>(
    factory: () => new SqlConnection(connStr),
    reset:   conn => { /* nothing to reset for a connection */ },
    idleTimeout: TimeSpan.FromMinutes(2));`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The <code>Sweep()</code> method loops with <code>while (_pool.TryPeek(out var oldest) &amp;&amp; ' +
    'oldest.ReturnedAt &lt; cutoff)</code> instead of dequeuing every entry and checking each one. Why does ' +
    'stopping at the FIRST non-expired entry give the correct result here, instead of missing some expired ' +
    'entries further back in the queue?',
  hint:
    'Look at the order entries are added in Release() — what do you know about the relative age of an entry ' +
    'compared to the one enqueued right after it?',
  solution:
    'Entries are enqueued in Release() in the exact order they were returned, and this is a FIFO queue, so the ' +
    'entry at the front is always the OLDEST one still in the pool — everything behind it was returned later ' +
    'and is therefore younger. If the front entry has not expired yet, every entry behind it is even younger ' +
    'and cannot have expired either, so it is safe to stop the whole sweep right there. This only works because ' +
    'the structure is FIFO and insertion order tracks recency — a LIFO structure like the main page\'s ' +
    'ConcurrentBag would not give this guarantee, since a newly-returned item could sit "in front of" a much ' +
    'older one.',
};

const misconceptions: Misconception[] = [
  {
    thought: 'Idle eviction and the maxSize cap are two names for the same control.',
    reality:
      'They solve different problems and work together, not as alternatives. maxSize bounds the WORST case — how ' +
      'large the pool is allowed to grow under peak concurrent load. Idle eviction reclaims memory during the ' +
      'AVERAGE case — shrinking the pool back down once that peak load has passed and objects sit unused. A pool ' +
      'can have a high maxSize for burst capacity and still stay small most of the time thanks to eviction.',
  },
  {
    thought: 'Running a periodic sweep will slow down every Acquire() and Release() call.',
    reality:
      'The sweep in this design runs on its own background <code>Timer</code> callback, entirely separate from ' +
      'the Acquire()/Release() call path. Callers never wait on the sweep — the only cost they pay is that an ' +
      'Acquire() shortly after a sweep ran might have to create a fresh instance instead of reusing one that was ' +
      'just evicted.',
  },
  {
    thought: 'Once an item is evicted from the pool, it is automatically cleaned up.',
    reality:
      'Removing an entry from the pool\'s own collection only stops the pool from handing it out again — it does ' +
      'nothing to the object itself. For plain in-memory objects that is fine, but for anything wrapping an ' +
      'external resource (a connection, a file handle), the sweep has to explicitly call <code>Dispose()</code> ' +
      'on the evicted item, or the underlying resource leaks even though the pool\'s own bookkeeping looks clean.',
  },
];

@Component({
  selector: 'app-object-pool-idle-object-eviction',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './idle-object-eviction.html',
  styleUrl: './idle-object-eviction.scss',
})
export class IdleObjectEvictionSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
