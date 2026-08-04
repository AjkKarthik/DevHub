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
    heading: 'The Check-Then-Act Race in Release()',
    points: [
      'The main page\'s <code>ObjectPool&lt;T&gt;.Release()</code> reads ' +
      '<code>if (_pool.Count &lt; _maxSize) _pool.Add(item);</code> — two separate operations, a read then a write, ' +
      'with no atomicity between them.',
      'Under concurrent Release() calls, two threads can both read <code>_pool.Count</code> as 15 (below a maxSize ' +
      'of 16), both see the check pass, and both call Add() — the pool ends up holding 17 items, one over the ' +
      'intended cap.',
      'This is a textbook check-then-act (TOCTOU — time-of-check to time-of-use) race: the condition that was true ' +
      'at the moment of the check may no longer hold by the moment of the act, because another thread acted in ' +
      'between.',
      '<code>ConcurrentBag&lt;T&gt;</code> itself is thread-safe for individual Add()/TryTake() calls — the race is ' +
      'not inside ConcurrentBag, it is in the two-step Count-then-Add sequence built around it.',
    ],
  },
  {
    heading: 'How Bad Is It, Really?',
    points: [
      'This race does not corrupt data, throw an exception, or hand out a broken object — the pool simply ends up ' +
      'holding a few more idle instances than <code>_maxSize</code> requested. maxSize here is a soft target, not ' +
      'a hard invariant the rest of the code depends on.',
      'For a <code>StringBuilder</code> or <code>byte[]</code> pool, overshooting by a handful of instances under ' +
      'heavy concurrent Release() bursts is a minor, self-correcting memory blip — those extra instances just sit ' +
      'unused until GC or the next Acquire() reuses one.',
      'It becomes a real problem only when maxSize was chosen to enforce a hard resource ceiling (e.g. capping ' +
      'concurrent database connections) — there, the cap can be exceeded under load is exactly the failure mode ' +
      'you built the cap to prevent.',
    ],
  },
  {
    heading: 'How the Real Microsoft.Extensions.ObjectPool Avoids It',
    points: [
      '.NET\'s own <code>DefaultObjectPool&lt;T&gt;</code> (the implementation behind ' +
      '<code>ObjectPool&lt;T&gt;</code> in ASP.NET Core) never checks a Count at all — it has no Count field to ' +
      'race on in the first place.',
      'It keeps one fast-path slot (<code>_firstItem</code>) plus a fixed-size backing array. Returning an object ' +
      'tries <code>Interlocked.CompareExchange(ref _firstItem, obj, null)</code> first; if that slot is already ' +
      'occupied, it walks the array trying the same CompareExchange on each element slot.',
      'CompareExchange is a single atomic CPU instruction — write obj into this slot only if it is currently null ' +
      'happens as one indivisible step, so two threads racing for the same slot can never both succeed.',
      'If every slot (fast-path + array) is already full when Return() runs, the object is simply dropped — no ' +
      'count is incremented, nothing is added anywhere, the object is just left for the garbage collector. The cap ' +
      'is really just how many slots exist, enforced structurally rather than by checking a counter.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Lock-Free Slot Design',
    language: 'csharp',
    code: `// Simplified sketch of the REAL DefaultObjectPool<T> strategy —
// a fixed-size array of slots, each claimed via CompareExchange,
// never a Count field checked-then-acted-on.
public sealed class SlotObjectPool<T> where T : class
{
    private T? _firstItem;                 // fast path, no array indexing
    private readonly T?[] _items;           // fixed-size backing array
    private readonly Func<T> _factory;

    public SlotObjectPool(Func<T> factory, int maxSize = 16)
    {
        _factory = factory;
        _items   = new T?[maxSize - 1];     // -1: _firstItem covers one slot
    }

    public T Acquire()
    {
        var item = _firstItem;
        if (item is null || Interlocked.CompareExchange(ref _firstItem, null, item) != item)
        {
            for (int i = 0; i < _items.Length; i++)
            {
                item = _items[i];
                if (item is not null &&
                    Interlocked.CompareExchange(ref _items[i], null, item) == item)
                    return item;
            }
            return _factory();              // every slot was empty — allocate
        }
        return item;
    }

    public void Release(T item)
    {
        if (Interlocked.CompareExchange(ref _firstItem, item, null) is not null)
        {
            for (int i = 0; i < _items.Length; i++)
            {
                if (Interlocked.CompareExchange(ref _items[i], item, null) is null)
                    return;                  // claimed slot i — done
            }
            // every slot was already occupied — drop it, let the GC reclaim it.
            // No Count field means there is nothing to race on.
        }
    }
}`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The main page\'s <code>Release()</code> reads <code>if (_pool.Count &lt; _maxSize) _pool.Add(item);</code>. ' +
    'Two threads call Release() at almost the same instant, with the pool currently holding exactly ' +
    '<code>_maxSize - 1</code> items. Walk through the interleaving that makes both threads pass the check ' +
    'and both call Add() — what does the pool end up holding, and does either thread ever find out its ' +
    'Add() pushed the pool over the cap?',
  hint:
    'Both threads read <code>_pool.Count</code> BEFORE either one calls Add() — the read and the write are ' +
    'two separate steps with a gap between them, and nothing locks that gap.',
  solution:
    'Thread A reads Count = maxSize - 1, sees it is less than maxSize, and is about to call Add(). Before it ' +
    'does, Thread B also reads Count = maxSize - 1 (Thread A has not added yet, so the count has not changed), ' +
    'and B also sees it is less than maxSize. Now both threads proceed to call _pool.Add(item) — Thread A adds, ' +
    'bringing the count to maxSize, then Thread B adds too, bringing it to maxSize + 1. Neither thread ever ' +
    're-checks Count after its own Add() — the method just returns. Nothing throws, nothing is logged, and ' +
    'nobody finds out the cap was exceeded; the pool simply and silently holds one more idle item than intended.',
};

const misconceptions: Misconception[] = [
  {
    thought: 'ConcurrentBag&lt;T&gt; is thread-safe, so the whole Release() method must be thread-safe too.',
    reality:
      'Thread-safety of an individual collection operation does not compose automatically across MULTIPLE ' +
      'operations. <code>_pool.Count</code> and <code>_pool.Add(item)</code> are each individually safe to call ' +
      'from any thread, but the SEQUENCE of read Count, then decide, then Add is not — another thread can act in ' +
      'the gap between your read and your write. This is true of almost any check-then-act pattern built on top of ' +
      'a thread-safe collection, not something specific to ConcurrentBag.',
  },
  {
    thought: 'If maxSize is exceeded, something has gone seriously wrong and will crash later.',
    reality:
      'For this pool, exceeding maxSize by a small amount under a race is a soft, self-correcting overshoot — the ' +
      'pool just holds a few extra idle instances, which get reused or eventually garbage collected. It is worth ' +
      'fixing if the cap is meant to be a hard resource ceiling, but it is not a crash, a data-corruption bug, or a ' +
      'deadlock — the severity depends entirely on WHY the cap exists.',
  },
  {
    thought: 'Fixing this just means wrapping the check-then-act pair in a lock.',
    reality:
      'A lock would fix it, but at the cost of serializing every Release() call through a single lock — exactly ' +
      'the contention overhead a pool is trying to avoid in a high-throughput scenario. That is why .NET\'s own ' +
      'implementation does not use a lock either: it restructures the problem into a fixed number of slots, each ' +
      'independently claimable via a single atomic CompareExchange, so no two threads ever contend for the SAME ' +
      'slot at the same time without one of them simply losing the race and falling through cleanly.',
  },
];

@Component({
  selector: 'app-object-pool-count-check-race-condition',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './count-check-race-condition.html',
  styleUrl: './count-check-race-condition.scss',
})
export class CountCheckRaceConditionSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
