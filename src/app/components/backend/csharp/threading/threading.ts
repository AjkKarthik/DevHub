import { Component } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-csharp-threading',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './threading.html',
  styleUrl: './threading.scss',
})
export class CsharpThreading {

  quickRef: QuickRefItem[] = [
    { name: 'Thread',                  type: 'class',    desc: 'Raw OS thread. Use for long-running, dedicated background work. Prefer Task/async for most scenarios.' },
    { name: 'ThreadPool',              type: 'class',    desc: 'Managed pool of threads. QueueUserWorkItem schedules a callback on a pool thread. The foundation of Task.' },
    { name: 'lock(obj)',               type: 'keyword',  desc: 'Mutual exclusion — only one thread can be inside the lock block at a time. Compiles to Monitor.Enter/Exit.' },
    { name: 'Monitor',                 type: 'class',    desc: 'Lower-level equivalent of lock. Monitor.Enter/Exit, TryEnter with timeout, Wait/Pulse for signaling.' },
    { name: 'Interlocked',             type: 'class',    desc: 'Atomic operations on a single variable. Increment, Decrement, Exchange, CompareExchange — no lock needed.' },
    { name: 'volatile',                type: 'keyword',  desc: 'Prevents the compiler and CPU from caching a field in a register. Ensures reads/writes are always from main memory.' },
    { name: 'ConcurrentDictionary<K,V>', type: 'class', desc: 'Thread-safe dictionary. GetOrAdd, AddOrUpdate, TryGetValue are atomic. Replaces Dictionary + lock in most cases.' },
    { name: 'ConcurrentQueue<T>',      type: 'class',    desc: 'Lock-free, thread-safe FIFO queue. TryDequeue returns false if empty rather than throwing.' },
    { name: 'ConcurrentBag<T>',        type: 'class',    desc: 'Unordered, thread-safe collection. Optimised for scenarios where the same thread adds and removes items.' },
    { name: 'SemaphoreSlim',           type: 'class',    desc: 'Limits the number of threads (or tasks) that can access a resource concurrently. Supports async via WaitAsync().' },
    { name: 'Thread.IsBackground',     type: 'accessor', desc: 'Background threads do not prevent the process from exiting. Foreground threads keep the process alive.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Threads vs Tasks vs async/await',
      points: [
        'A <code>Thread</code> is an OS-level execution unit. Creating one is expensive (~1 MB of stack, kernel object). Raw threads are appropriate for long-running, dedicated work — e.g. a background service that runs for the lifetime of the process.',
        'The <code>ThreadPool</code> maintains a pool of worker threads. Scheduling work via the pool is cheap because threads are reused. <code>Task.Run</code> and <code>async/await</code> are built on top of the thread pool.',
        'For I/O-bound work (network, disk, database), <code>async/await</code> is always preferable — it does not occupy a thread while waiting. For CPU-bound parallelism, use <code>Task.Run</code> or <code>Parallel</code> to spread work across pool threads.',
        'Raw threads should be a last resort. Prefer <code>Task</code>, <code>async/await</code>, or <code>Parallel</code> for almost all new code.',
      ],
    },
    {
      heading: 'Mutual exclusion with lock and Monitor',
      points: [
        'The <code>lock(obj) { ... }</code> statement ensures only one thread executes the body at a time. It compiles to <code>Monitor.Enter(obj, ref taken)</code> / <code>Monitor.Exit(obj)</code> in a try/finally block.',
        'The lock object must be a reference type, private to the class, and used only as a lock token — never expose it. A common pattern: <code>private readonly object _lock = new();</code>.',
        '<code>Monitor.TryEnter(obj, timeout)</code> attempts to acquire the lock within a time limit, returning false rather than blocking forever — useful for deadlock avoidance.',
        'Never call external code, blocking I/O, or async methods while holding a lock. Keep critical sections short. Consider whether <code>ConcurrentDictionary</code> or <code>Interlocked</code> can replace the lock entirely.',
      ],
    },
    {
      heading: 'Deadlocks and avoidance',
      points: [
        'A deadlock occurs when two threads each hold a lock the other needs. Thread A holds Lock 1 and waits for Lock 2; Thread B holds Lock 2 and waits for Lock 1 — both wait forever.',
        'Avoidance strategy 1: <strong>always acquire locks in the same order</strong>. If all code that needs both locks always takes Lock 1 first, the deadlock cycle cannot form.',
        'Avoidance strategy 2: <strong>use <code>Monitor.TryEnter</code> with a timeout</strong>. If you cannot acquire the second lock in time, release the first lock, wait briefly, and retry.',
        'Avoidance strategy 3: <strong>minimize lock scope</strong>. The fewer resources you hold simultaneously, the less opportunity for cycles to form.',
      ],
    },
    {
      heading: 'Atomic operations and volatile',
      points: [
        '<code>Interlocked</code> provides CPU-level atomic read-modify-write operations. <code>Interlocked.Increment(ref counter)</code> atomically increments a shared integer without any lock — much faster than <code>lock</code> for simple counters.',
        'The <code>volatile</code> keyword prevents the JIT compiler and CPU from caching a field in a register. Without it, a change made by one thread may not be visible to another thread due to CPU caching or instruction reordering.',
        '<code>volatile</code> only guarantees visibility for simple reads and writes. It does not make a read-modify-write operation atomic. Use <code>Interlocked</code> for that.',
        'For complex state that must be updated atomically across multiple fields, use <code>lock</code>. For a single numeric counter or flag, <code>Interlocked</code> or <code>volatile</code> suffices and is faster.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Thread & ThreadPool',
      language: 'csharp',
      code: `using System.Threading;

// ── 1. Creating and starting a raw Thread ────────────────────────────────
var t = new Thread(() =>
{
    Console.WriteLine(\`Worker thread: \${Thread.CurrentThread.ManagedThreadId}\`);
    Thread.Sleep(500); // simulate work
    Console.WriteLine("Worker done");
});

// IsBackground = true: thread does not prevent the process from exiting
t.IsBackground = true;
t.Name = "MyWorker";
t.Start();

// Wait for the thread to finish
t.Join();
Console.WriteLine("Main thread: worker has completed");

// ── 2. Thread with parameter ──────────────────────────────────────────────
var t2 = new Thread(state =>
{
    string? msg = (string?)state;
    Console.WriteLine(\`Received: \${msg}\`);
});
t2.Start("hello from main");
t2.Join();

// ── 3. ThreadPool.QueueUserWorkItem — cheap, pooled ───────────────────────
ThreadPool.QueueUserWorkItem(_ =>
{
    Console.WriteLine(\`Pool thread: \${Thread.CurrentThread.ManagedThreadId}\`);
});

// With typed state (no boxing)
ThreadPool.QueueUserWorkItem(static ctx =>
{
    Console.WriteLine(\`Processing item: \${ctx}\`);
}, "item-42", preferLocal: false);

// ── 4. Inspecting the thread pool ─────────────────────────────────────────
ThreadPool.GetMinThreads(out int minWorker, out int minIO);
ThreadPool.GetMaxThreads(out int maxWorker, out int maxIO);
Console.WriteLine(\`Thread pool: min=\${minWorker}/\${minIO} max=\${maxWorker}/\${maxIO}\`);

// ── 5. Thread-local storage — each thread gets its own value ─────────────
var threadLocalRandom = new ThreadLocal<Random>(() => new Random());

Parallel.For(0, 4, i =>
{
    // Each thread has its own Random instance — no locking needed
    int r = threadLocalRandom.Value!.Next(100);
    Console.WriteLine(\`Thread \${Thread.CurrentThread.ManagedThreadId}: \${r}\`);
});

threadLocalRandom.Dispose();`,
    },
    {
      label: 'lock & Monitor',
      language: 'csharp',
      code: `using System.Threading;

// ── Thread-safe counter using lock ────────────────────────────────────────
public class SafeCounter
{
    private int _count;
    private readonly object _lock = new();   // dedicated lock object

    public void Increment()
    {
        lock (_lock)                          // only one thread at a time
        {
            _count++;
        }
    }

    public int Value
    {
        get { lock (_lock) { return _count; } }
    }
}

// ── Demonstrate race condition vs lock ────────────────────────────────────
int unsafeCount = 0;
var safeCounter = new SafeCounter();

var threads = Enumerable.Range(0, 10).Select(_ => new Thread(() =>
{
    for (int i = 0; i < 1000; i++)
    {
        unsafeCount++;         // RACE CONDITION — not atomic
        safeCounter.Increment(); // thread-safe
    }
})).ToArray();

foreach (var t in threads) t.Start();
foreach (var t in threads) t.Join();

Console.WriteLine(\`Unsafe: \${unsafeCount} (should be 10000, probably isn't)\`);
Console.WriteLine(\`Safe:   \${safeCounter.Value} (always 10000)\`);

// ── Monitor.TryEnter — avoid blocking forever ─────────────────────────────
object resource = new();
bool acquired = false;
try
{
    Monitor.TryEnter(resource, TimeSpan.FromMilliseconds(200), ref acquired);
    if (acquired)
    {
        Console.WriteLine("Got the lock");
        // do work
    }
    else
    {
        Console.WriteLine("Could not acquire lock within timeout — back off");
    }
}
finally
{
    if (acquired) Monitor.Exit(resource);
}

// ── Deadlock example and fix ──────────────────────────────────────────────
object lockA = new(), lockB = new();

// BAD — can deadlock if two threads acquire in different orders:
// Thread 1: lock(lockA) then lock(lockB)
// Thread 2: lock(lockB) then lock(lockA)  ← deadlock

// GOOD — always acquire in the same order:
void SafeTransfer(object from, object to, Action transfer)
{
    // Impose a consistent order using object identity
    object first  = RuntimeHelpers.GetHashCode(from) < RuntimeHelpers.GetHashCode(to) ? from : to;
    object second = first == from ? to : from;

    lock (first)
    {
        lock (second)
        {
            transfer();
        }
    }
}`,
    },
    {
      label: 'Interlocked & volatile',
      language: 'csharp',
      code: `using System.Threading;

// ── Interlocked — atomic operations, no lock needed ──────────────────────
public class AtomicCounter
{
    private int _value;

    // Atomically increment — equivalent to _value++ but thread-safe
    public int Increment() => Interlocked.Increment(ref _value);

    public int Decrement() => Interlocked.Decrement(ref _value);

    // Atomically set and return old value
    public int Exchange(int newValue) => Interlocked.Exchange(ref _value, newValue);

    // Atomically set to newValue only if current value == expected
    public bool CompareAndSwap(int expected, int newValue)
        => Interlocked.CompareExchange(ref _value, newValue, expected) == expected;

    public int Value => Volatile.Read(ref _value); // safe read
}

// ── Benchmark: Interlocked vs lock ────────────────────────────────────────
// Interlocked.Increment is ~10x faster than lock for a simple counter.
// Use lock only when you need to protect multiple fields atomically.

// ── volatile — visibility guarantee ──────────────────────────────────────
public class BackgroundWorker
{
    // volatile: ensures the main thread sees updates from background threads
    // without volatile, the JIT may cache _running in a register
    private volatile bool _running = true;

    public void Start()
    {
        var thread = new Thread(() =>
        {
            while (_running)    // reads from main memory each time
            {
                DoWork();
                Thread.Sleep(10);
            }
            Console.WriteLine("Worker stopped");
        }) { IsBackground = true };
        thread.Start();
    }

    public void Stop() => _running = false;  // visible to worker thread

    private void DoWork() { /* ... */ }
}

// ── Lock-free stack using CompareExchange ─────────────────────────────────
// Demonstrates CAS-loop (compare-and-swap) — the building block of lock-free data structures
public class LockFreeStack<T>
{
    private sealed class Node { public T Value; public Node? Next; public Node(T v) => Value = v; }
    private Node? _head;

    public void Push(T item)
    {
        var node = new Node(item);
        Node? old;
        do
        {
            old = _head;
            node.Next = old;
            // Replace head with node only if head is still 'old' (no other thread changed it)
        } while (Interlocked.CompareExchange(ref _head, node, old) != old);
    }

    public bool TryPop(out T? result)
    {
        Node? old;
        do
        {
            old = _head;
            if (old == null) { result = default; return false; }
        } while (Interlocked.CompareExchange(ref _head, old.Next, old) != old);
        result = old.Value;
        return true;
    }
}`,
    },
    {
      label: 'Concurrent Collections',
      language: 'csharp',
      code: `using System.Collections.Concurrent;
using System.Threading;

// ── ConcurrentDictionary — thread-safe key-value store ───────────────────
var cache = new ConcurrentDictionary<int, string>(concurrencyLevel: 4, capacity: 100);

// TryAdd — returns false if key already exists
cache.TryAdd(1, "one");

// GetOrAdd — atomically get or create. Factory runs at most once per key.
string val = cache.GetOrAdd(2, key => \`value-for-\${key}\`);

// AddOrUpdate — atomically update existing or add new
cache.AddOrUpdate(
    key: 1,
    addValue: "ONE",
    updateValueFactory: (key, existing) => existing.ToUpper());

// TryGetValue, TryRemove
if (cache.TryGetValue(1, out string? v))
    Console.WriteLine(\`Found: \${v}\`);

cache.TryRemove(1, out _);

// ── ConcurrentQueue — thread-safe FIFO ────────────────────────────────────
var queue = new ConcurrentQueue<string>();

// Multiple producers
Parallel.For(0, 5, i => queue.Enqueue(\`item-\${i}\`));

// Single consumer
while (queue.TryDequeue(out string? item))
    Console.WriteLine(\`Dequeued: \${item}\`);

// ── SemaphoreSlim — limit concurrent access ───────────────────────────────
// Useful for rate-limiting: allow at most 3 concurrent DB connections
var sem = new SemaphoreSlim(initialCount: 3, maxCount: 3);

async Task ProcessWithLimitAsync(string item, CancellationToken ct)
{
    await sem.WaitAsync(ct);    // async-friendly — does not block a thread
    try
    {
        Console.WriteLine(\`Processing \${item} on thread \${Thread.CurrentThread.ManagedThreadId}\`);
        await Task.Delay(100, ct);
    }
    finally
    {
        sem.Release();
    }
}

var tasks = Enumerable.Range(1, 10)
    .Select(i => ProcessWithLimitAsync(\`item-\${i}\`, CancellationToken.None));
await Task.WhenAll(tasks);

// ── BlockingCollection — producer/consumer with bounded capacity ──────────
// Wraps ConcurrentQueue with blocking semantics
using var bc = new BlockingCollection<int>(boundedCapacity: 5);

// Producer thread
var producer = Task.Run(() =>
{
    for (int i = 0; i < 10; i++)
    {
        bc.Add(i);                  // blocks if capacity is full
        Console.WriteLine(\`Produced: \${i}\`);
    }
    bc.CompleteAdding();            // signal no more items
});

// Consumer thread
var consumer = Task.Run(() =>
{
    foreach (int item in bc.GetConsumingEnumerable())
        Console.WriteLine(\`Consumed: \${item}\`);
});

await Task.WhenAll(producer, consumer);`,
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'What does the lock keyword compile to under the hood?',
      options: [
        'A hardware memory barrier instruction',
        'Monitor.Enter and Monitor.Exit wrapped in a try/finally block',
        'A call to Mutex.WaitOne and Mutex.ReleaseMutex',
        'An Interlocked.CompareExchange loop',
      ],
      answer: 1,
      explanation: 'The C# compiler translates <code>lock(obj) { ... }</code> into a <code>bool taken = false; try { Monitor.Enter(obj, ref taken); ... } finally { if (taken) Monitor.Exit(obj); }</code> pattern. The <code>ref taken</code> ensures <code>Exit</code> is only called if <code>Enter</code> succeeded, preventing an <code>SynchronizationLockException</code> if the thread is aborted between Enter and the try.',
    },
    {
      q: 'Why is Interlocked.Increment preferred over lock for a simple counter?',
      options: [
        'Interlocked.Increment supports async/await',
        'lock cannot protect integer fields',
        'Interlocked.Increment is a single atomic CPU instruction — no kernel object, no blocking, significantly lower overhead than acquiring a lock',
        'Interlocked.Increment automatically handles overflow',
      ],
      answer: 2,
      explanation: '<code>Interlocked.Increment</code> uses the x86/ARM atomic <code>LOCK XADD</code> instruction — a single CPU-level operation. <code>lock</code> must acquire a kernel-level monitor object, which involves context switching if the lock is contested. For a single variable, <code>Interlocked</code> is roughly 10x faster and never causes contention. Use <code>lock</code> only when you need to protect multiple fields atomically.',
    },
    {
      q: 'What is the difference between a foreground and background thread?',
      options: [
        'Background threads run at lower CPU priority',
        'Background threads cannot access the UI thread',
        'The process will exit when all foreground threads complete, even if background threads are still running. Background threads are automatically terminated when the last foreground thread ends.',
        'Foreground threads are managed by the OS; background threads are managed by the .NET runtime',
      ],
      answer: 2,
      explanation: 'The .NET runtime keeps the process alive as long as at least one foreground thread is running. When the last foreground thread finishes, the runtime terminates all remaining background threads and exits. By default, <code>Thread</code> creates a foreground thread. Set <code>IsBackground = true</code> for worker threads that should not prevent application shutdown.',
    },
    {
      q: 'When should you use ConcurrentDictionary instead of Dictionary with a lock?',
      options: [
        'Only when the dictionary has more than 1000 entries',
        'When multiple threads will read and write the dictionary concurrently — ConcurrentDictionary uses fine-grained internal locking per bucket, dramatically reducing contention compared to a single external lock',
        'ConcurrentDictionary is never better — Dictionary + lock is always faster',
        'When you need the dictionary to be sorted',
      ],
      answer: 1,
      explanation: '<code>ConcurrentDictionary</code> uses striped locking internally — it divides the dictionary into segments (default: 4 × CPU count) and only locks the relevant segment per operation. Under concurrent load, threads writing to different buckets rarely contend. A single external <code>lock</code> around a regular <code>Dictionary</code> serializes all reads and writes — one thread at a time — which becomes a bottleneck under load.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is a deadlock and how do you avoid one?',
      a: `A deadlock is a situation where two or more threads are permanently blocked, each waiting for a resource held by another. The classic example: Thread A holds Lock 1 and waits for Lock 2; Thread B holds Lock 2 and waits for Lock 1 — neither can proceed.<br><br>
<strong>Prevention strategies:</strong><br>
1. <strong>Consistent lock ordering</strong> — if code ever needs multiple locks, always acquire them in the same global order (e.g. by object hash code or ID).<br>
2. <strong>Lock timeout</strong> — use <code>Monitor.TryEnter(obj, timeout, ref taken)</code> instead of <code>Monitor.Enter</code>. If the timeout expires, release what you have and retry.<br>
3. <strong>Minimize lock scope</strong> — hold locks for the shortest time possible and never call external code or blocking I/O while holding a lock.<br>
4. <strong>Prefer higher-level abstractions</strong> — <code>ConcurrentDictionary</code>, <code>Interlocked</code>, and <code>Channel&lt;T&gt;</code> often eliminate the need for explicit locks entirely.`,
    },
    {
      q: 'When should I use a raw Thread vs Task.Run?',
      a: `Use a raw <code>Thread</code> when:<br>
- The work runs for the lifetime of the process (e.g. a long-running background service loop)<br>
- You need to control thread properties that tasks cannot set: <code>IsBackground</code>, <code>Name</code>, <code>Priority</code>, <code>ApartmentState</code> (COM interop)<br>
- You are implementing a thread-per-connection server or similar low-level pattern<br><br>
Use <code>Task.Run</code> (thread pool) for:<br>
- CPU-bound work that runs and completes — image resizing, sorting, parsing<br>
- Offloading a computation from the UI thread<br>
- Any work that should participate in cancellation and exception handling via the <code>Task</code> model<br><br>
For I/O-bound work, use <code>async/await</code> — no thread is consumed while waiting.`,
    },
    {
      q: 'What does volatile actually guarantee?',
      a: `<code>volatile</code> provides two guarantees:<br><br>
1. <strong>Visibility</strong> — reads and writes to a volatile field always go to main memory, never a CPU cache or register. A change made by one thread is immediately visible to all other threads.<br>
2. <strong>Ordering</strong> — reads are acquire-fences and writes are release-fences, preventing certain compiler and CPU reorderings around the access.<br><br>
<code>volatile</code> does <em>not</em> make compound operations atomic. <code>volatile int x; x++;</code> is still a race condition because increment is read-modify-write — three separate operations. Use <code>Interlocked.Increment</code> for atomic arithmetic.<br><br>
Common use: a <code>volatile bool _running</code> flag that a background thread checks and the main thread sets to stop the worker.`,
    },
    {
      q: 'What is SemaphoreSlim and why is it better than Semaphore for async code?',
      a: `<code>SemaphoreSlim</code> is a lightweight semaphore that limits the number of threads (or tasks) that can enter a critical section concurrently. It is ideal for rate-limiting: "allow at most 5 concurrent database connections."<br><br>
The key advantage over <code>Semaphore</code>: <code>SemaphoreSlim.WaitAsync()</code>. This returns a <code>Task</code> that completes when a slot is available — without blocking a thread. With the classic <code>Semaphore.WaitOne()</code>, the calling thread blocks until a slot opens, consuming a thread pool thread the whole time.<br><br>
Pattern:<br>
<code>await semaphore.WaitAsync(cancellationToken);</code><br>
<code>try { /* critical section */ }</code><br>
<code>finally { semaphore.Release(); }</code><br><br>
<code>SemaphoreSlim</code> can be used across async boundaries; the classic <code>Semaphore</code> is kernel-based and intended for cross-process synchronization.`,
    },
  ];

  challenge: Challenge = {
    title: 'Thread-Safe In-Memory Cache',
    description: `Implement a thread-safe in-memory cache that stores string values with TTL (time-to-live) expiry.

Requirements:
1. Use ConcurrentDictionary as the backing store
2. Each cache entry stores the value and the time it expires (DateTime.UtcNow + TTL)
3. Set(key, value, ttl) adds or updates an entry
4. TryGet(key, out value) returns true with the value only if the entry exists AND has not expired
5. Expired entries should be silently treated as missing (return false from TryGet)
6. Evict() removes all expired entries from the dictionary (can be called periodically)
7. Count property returns number of currently non-expired entries`,
    language: 'csharp',
    hints: [
      'Store a record/struct with both Value and ExpiresAt in the ConcurrentDictionary',
      'In TryGet: after TryGetValue, also check entry.ExpiresAt > DateTime.UtcNow',
      'In Evict: enumerate Keys and call TryRemove for any entry where ExpiresAt <= DateTime.UtcNow',
      'Count can iterate Values and count where ExpiresAt > DateTime.UtcNow — no lock needed since ConcurrentDictionary is already thread-safe',
    ],
    starterCode: `public class TtlCache
{
    // TODO: define a private record or struct to hold (Value, ExpiresAt)
    // TODO: add a ConcurrentDictionary field

    public void Set(string key, string value, TimeSpan ttl)
    {
        // TODO: store entry with expiry = DateTime.UtcNow + ttl
        throw new NotImplementedException();
    }

    public bool TryGet(string key, out string? value)
    {
        // TODO: look up key, check expiry, return value or false
        throw new NotImplementedException();
    }

    public void Evict()
    {
        // TODO: remove all expired entries
        throw new NotImplementedException();
    }

    public int Count
    {
        // TODO: count non-expired entries
        get => throw new NotImplementedException();
    }
}`,
    solution: `public class TtlCache
{
    private record CacheEntry(string Value, DateTime ExpiresAt);

    private readonly ConcurrentDictionary<string, CacheEntry> _store = new();

    public void Set(string key, string value, TimeSpan ttl)
    {
        var entry = new CacheEntry(value, DateTime.UtcNow + ttl);
        _store[key] = entry;   // AddOrUpdate in one step
    }

    public bool TryGet(string key, out string? value)
    {
        if (_store.TryGetValue(key, out var entry) &&
            entry.ExpiresAt > DateTime.UtcNow)
        {
            value = entry.Value;
            return true;
        }

        value = null;
        return false;
    }

    public void Evict()
    {
        var now = DateTime.UtcNow;
        foreach (var key in _store.Keys)
        {
            if (_store.TryGetValue(key, out var entry) && entry.ExpiresAt <= now)
                _store.TryRemove(key, out _);
        }
    }

    public int Count => _store.Values.Count(e => e.ExpiresAt > DateTime.UtcNow);
}`,
  };
}
