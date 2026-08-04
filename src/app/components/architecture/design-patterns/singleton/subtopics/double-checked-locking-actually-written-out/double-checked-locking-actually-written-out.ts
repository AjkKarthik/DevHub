import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './double-checked-locking-actually-written-out.html',
  styleUrl: './double-checked-locking-actually-written-out.scss'
})
export class DoubleCheckedLockingActuallyWrittenOutSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Named twice, never shown as a full codeTab',
      points: [
        'The theory section names it directly: "Double-checked locking: checks the instance twice with a lock in between — avoids lock on every call." The QnA goes further, embedding an inline sketch: <code>if (_instance == null) { lock(_lock) { if (_instance == null) { _instance = new Singleton(); } } }</code>.',
        'Both mentions are correct as far as they go — but neither is a complete, compilable codeTab, and the QnA\'s own sketch OMITS the one detail it separately says is required: "The field must be marked <code>volatile</code>... to prevent CPU instruction reordering from allowing a partially constructed instance to be observed."',
        'This subtopic writes the complete version — the sketch plus the <code>volatile</code> field the QnA says is necessary but never actually includes in the code it shows.',
      ]
    },
    {
      heading: 'Why the double check exists, and why volatile matters',
      points: [
        'The OUTER check (<code>if (_instance == null)</code> before the lock) is a fast path: once the instance exists, every subsequent call skips the lock entirely — locking is only paid for during the brief window before initialization completes.',
        'The INNER check (repeated inside the lock) exists because multiple threads can pass the OUTER check simultaneously before any of them acquires the lock — without the inner check, each of those threads would proceed to create its own instance once it gets the lock, defeating the singleton entirely.',
        '<code>volatile</code> matters because of instruction reordering: without it, the compiler or CPU is permitted to make the assignment to <code>_instance</code> VISIBLE to another thread before the constructor has actually finished running — a second thread could then read a non-null <code>_instance</code> that points to a partially-constructed object. <code>volatile</code> (or <code>Interlocked</code>) prevents that reordering.',
        'This is precisely why the page\'s own theory recommends <code>Lazy&lt;T&gt;</code> as the preferred alternative — it achieves the identical thread-safety guarantee with none of this manual reasoning required, since the BCL implementation already handles the memory-ordering correctness internally.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Complete double-checked locking, including the volatile field',
      language: 'csharp',
      code: `public sealed class MetricsCollector
{
    // volatile IS the detail the QnA's own inline sketch omits --
    // without it, a second thread could observe a non-null reference
    // to an object whose constructor hasn't finished running yet.
    private static volatile MetricsCollector? _instance;
    private static readonly object _lock = new();

    private readonly Dictionary<string, long> _counters = new();

    private MetricsCollector() { }

    public static MetricsCollector Instance
    {
        get
        {
            // OUTER check -- the fast path. Once _instance is set,
            // every future call returns here without ever touching
            // the lock.
            if (_instance == null)
            {
                lock (_lock)
                {
                    // INNER check -- required because multiple threads
                    // can pass the outer check before any of them
                    // acquires the lock. Without this, each of those
                    // threads would construct its own instance here.
                    if (_instance == null)
                    {
                        _instance = new MetricsCollector();
                    }
                }
            }
            return _instance;
        }
    }

    public void Increment(string counterName) =>
        _counters[counterName] = _counters.GetValueOrDefault(counterName) + 1;
}

// The Lazy<T> equivalent shown elsewhere on the main page achieves the
// SAME guarantee with none of the manual lock/volatile reasoning:
public sealed class MetricsCollectorLazy
{
    private static readonly Lazy<MetricsCollectorLazy> _lazy =
        new(() => new MetricsCollectorLazy());
    public static MetricsCollectorLazy Instance => _lazy.Value;
    private MetricsCollectorLazy() { }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate removes the volatile keyword, arguing: "The lock statement already provides a memory barrier, so volatile is redundant here." Is dropping volatile safe?',
    hint: 'Does the lock() block protect the READ of _instance that happens OUTSIDE the lock, in the outer check?',
    solution: 'No -- this is a genuinely dangerous simplification. The lock statement DOES provide a memory barrier, but only around the code INSIDE the lock block. The OUTER check (if (_instance == null), before the lock is ever acquired) reads _instance with no lock protecting it at all -- that read relies entirely on volatile to guarantee it observes a fully-constructed object rather than a reference that became visible before the constructor finished. Removing volatile reopens exactly the race condition double-checked locking exists to close: a thread taking the fast path (skipping the lock because it sees a non-null _instance) could observe a partially-initialized object. This is precisely why the page\'s own theory recommends Lazy<T> instead of hand-rolling this pattern -- it is easy to remove exactly the detail that makes it correct while believing the simplification is safe.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The lock statement inside double-checked locking provides enough memory-ordering safety on its own — volatile is just extra caution.',
      reality: 'Per this subtopic\'s theory, the lock only protects code INSIDE the lock block — the outer, unlocked check that makes the pattern fast in the common case has no protection from the lock at all, which is exactly what volatile provides.'
    },
    {
      thought: 'The inner check inside the lock is redundant with the outer check — if the outer check already confirmed the instance was null, checking again inside the lock is unnecessary.',
      reality: 'Per this subtopic\'s theory, multiple threads can pass the outer check simultaneously, before any of them has acquired the lock — the inner check is what prevents each of those threads from constructing its own separate instance once it gets the lock.'
    },
    {
      thought: 'Since <code>Lazy&lt;T&gt;</code> is described as simpler, double-checked locking must be functionally weaker or less thread-safe.',
      reality: 'Per this subtopic\'s theory, both achieve the identical thread-safety guarantee — <code>Lazy&lt;T&gt;</code> is preferred purely because it does not require getting the manual lock/volatile reasoning right yourself, not because double-checked locking (done correctly) is any less safe.'
    }
  ];
}
