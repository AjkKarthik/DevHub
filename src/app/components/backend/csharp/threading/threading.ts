import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';

@Component({
  selector: 'app-csharp-threading',
  standalone: true,
  imports: [
    CommonModule, CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
    CommonMistakesComponent, RevisionCardComponent,
  ],
  templateUrl: './threading.html',
  styleUrl: './threading.scss',
})
export class CsharpThreading {

  quickRef: QuickRefItem[] = [
    { name: 'Thread',                    type: 'class',    desc: 'Raw OS thread. Use for long-running, dedicated background work. Prefer Task/async for most scenarios.' },
    { name: 'ThreadPool',                type: 'class',    desc: 'Managed pool of threads. QueueUserWorkItem schedules a callback on a pool thread. The foundation of Task.' },
    { name: 'lock(obj)',                 type: 'keyword',  desc: 'Mutual exclusion — only one thread can be inside the lock block at a time. Compiles to Monitor.Enter/Exit.' },
    { name: 'Monitor',                   type: 'class',    desc: 'Lower-level equivalent of lock. Monitor.Enter/Exit, TryEnter with timeout, Wait/Pulse for signaling.' },
    { name: 'Interlocked',               type: 'class',    desc: 'Atomic operations on a single variable. Increment, Decrement, Exchange, CompareExchange — no lock needed.' },
    { name: 'volatile',                  type: 'keyword',  desc: 'Prevents the compiler and CPU from caching a field in a register. Ensures reads/writes are always from main memory.' },
    { name: 'ConcurrentDictionary<K,V>', type: 'class',    desc: 'Thread-safe dictionary. GetOrAdd, AddOrUpdate, TryGetValue are atomic. Replaces Dictionary + lock in most cases.' },
    { name: 'ConcurrentQueue<T>',        type: 'class',    desc: 'Lock-free, thread-safe FIFO queue. TryDequeue returns false if empty rather than throwing.' },
    { name: 'ConcurrentBag<T>',          type: 'class',    desc: 'Unordered, thread-safe collection. Optimised for scenarios where the same thread adds and removes items.' },
    { name: 'SemaphoreSlim',             type: 'class',    desc: 'Limits the number of threads (or tasks) that can access a resource concurrently. Supports async via WaitAsync().' },
    { name: 'Thread.IsBackground',       type: 'accessor', desc: 'Background threads do not prevent the process from exiting. Foreground threads keep the process alive.' },
    { name: 'ManualResetEventSlim',      type: 'class',    desc: 'Lightweight manual reset event for signaling between threads. Wait() blocks until Set() is called.' },
    { name: 'CountdownEvent',            type: 'class',    desc: 'Blocks until a count reaches zero — useful for coordinating a known number of concurrent operations.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Threads vs Tasks vs async/await',
      points: [
        'A <code>Thread</code> is an OS-level execution unit with its own stack (~1 MB) and kernel object. Creating one is expensive. Raw threads are appropriate for long-running, dedicated background work — e.g. a background service loop that runs for the lifetime of the process.',
        'The <code>ThreadPool</code> maintains a pool of pre-created worker threads. Scheduling work via the pool is cheap because threads are reused. <code>Task.Run</code> and <code>async/await</code> are built on top of the thread pool.',
        'For I/O-bound work (network, disk, database), <code>async/await</code> is always preferable — it does not occupy a thread while waiting. The thread is released back to the pool while the I/O is in flight.',
        'For CPU-bound parallelism, use <code>Task.Run</code> or <code>Parallel</code> to spread work across pool threads. These manage thread lifecycle automatically and integrate with cancellation and exception handling.',
        'Raw threads should be a last resort in modern .NET. Prefer <code>Task</code>, <code>async/await</code>, or <code>Parallel</code> for almost all new code — they are safer, more composable, and support cancellation natively.',
      ],
    },
    {
      heading: 'Mutual exclusion with lock and Monitor',
      points: [
        'The <code>lock(obj) { ... }</code> statement ensures only one thread executes the body at a time. It compiles to <code>Monitor.Enter(obj, ref taken)</code> / <code>Monitor.Exit(obj)</code> inside a try/finally block.',
        'The lock object must be a reference type, private to the class, and used <em>only</em> as a lock token — never expose it publicly. Pattern: <code>private readonly object _lock = new();</code>.',
        '<code>Monitor.TryEnter(obj, timeout, ref taken)</code> attempts to acquire the lock within a time limit, returning false rather than blocking forever — useful for deadlock detection and avoidance.',
        'Never call external code, blocking I/O, or async methods while holding a lock. Keep critical sections as short as possible to minimize contention.',
        'Before reaching for a lock, ask whether <code>ConcurrentDictionary</code>, <code>Interlocked</code>, or a <code>Channel&lt;T&gt;</code> can replace it entirely — lock-free alternatives eliminate contention completely for common patterns.',
      ],
    },
    {
      heading: 'Deadlocks and avoidance',
      points: [
        'A deadlock occurs when two or more threads each hold a lock the other needs. Thread A holds Lock 1 and waits for Lock 2; Thread B holds Lock 2 and waits for Lock 1 — both wait forever with no way to proceed.',
        'Avoidance strategy 1: <strong>always acquire locks in the same global order</strong>. If all code that needs both Lock 1 and Lock 2 always takes Lock 1 first, the deadlock cycle cannot form.',
        'Avoidance strategy 2: <strong>use <code>Monitor.TryEnter</code> with a timeout</strong>. If you cannot acquire the second lock in time, release the first, wait briefly (with jitter), and retry.',
        'Avoidance strategy 3: <strong>minimize lock scope</strong>. Hold locks for the shortest possible time. Never perform I/O, call external code, or cross a service boundary while holding a lock.',
        'Avoidance strategy 4: <strong>use higher-level lock-free types</strong> — <code>ConcurrentDictionary</code>, <code>Interlocked</code>, and <code>Channel&lt;T&gt;</code> eliminate the possibility of this class of deadlock entirely for common data access patterns.',
      ],
    },
    {
      heading: 'Atomic operations and volatile',
      points: [
        '<code>Interlocked</code> provides CPU-level atomic read-modify-write operations using the <code>LOCK</code> prefix instruction. <code>Interlocked.Increment(ref counter)</code> atomically increments a shared integer — roughly 10x faster than a <code>lock</code> for a simple counter.',
        'The <code>volatile</code> keyword prevents the JIT compiler and CPU from caching a field in a register. Without it, a change made by one thread may not be visible to another thread due to CPU cache coherence delays or instruction reordering.',
        '<code>volatile</code> only guarantees visibility for simple reads and writes. It does <em>not</em> make a read-modify-write operation atomic. <code>volatile int x; x++;</code> is still a race condition.',
        'Use <code>Volatile.Read(ref field)</code> and <code>Volatile.Write(ref field, value)</code> as an alternative to the keyword — these work with local variables and provide the same guarantees without requiring the field to be declared volatile.',
        'For complex state that must be updated atomically across multiple fields, use <code>lock</code>. For a single numeric counter or boolean flag, <code>Interlocked</code> or <code>volatile</code> suffice and are significantly faster.',
      ],
    },
    {
      heading: 'Concurrent collections',
      points: [
        '<code>ConcurrentDictionary&lt;K,V&gt;</code> uses striped internal locking (one lock per bucket segment) so concurrent reads and writes to different keys rarely contend, unlike a <code>Dictionary</code> behind a single external lock.',
        '<code>GetOrAdd(key, factory)</code> is <em>atomic</em> as a whole, but the factory may be called more than once under high contention — it is evaluated without the lock. Only the first result is stored. Do not use GetOrAdd for factories with expensive side effects.',
        '<code>ConcurrentQueue&lt;T&gt;</code> is a lock-free FIFO queue built on interlocked pointer swaps. <code>TryDequeue</code> returns false if empty — no blocking, no exceptions.',
        '<code>BlockingCollection&lt;T&gt;</code> wraps a concurrent collection and adds blocking/bounding semantics: <code>Add()</code> blocks when the capacity is full; <code>GetConsumingEnumerable()</code> blocks when empty until <code>CompleteAdding()</code> is called.',
        '<code>SemaphoreSlim.WaitAsync()</code> is the async-friendly way to rate-limit concurrent task access — it does not block a thread pool thread while waiting for a slot, unlike <code>Semaphore.WaitOne()</code>.',
      ],
    },
    {
      heading: 'Signaling and coordination primitives',
      points: [
        '<code>ManualResetEventSlim</code> lets one or more threads block at <code>Wait()</code> until another thread calls <code>Set()</code>. Once set, it stays open until explicitly <code>Reset()</code> — useful for "gate open" patterns.',
        '<code>AutoResetEvent</code> automatically resets after releasing a single waiting thread — like a turnstile. Each <code>Set()</code> releases exactly one waiting thread.',
        '<code>CountdownEvent</code> blocks until an internal count reaches zero. Each participating thread calls <code>Signal()</code> when done; the coordinating thread calls <code>Wait()</code>. Similar to a barrier for a known number of operations.',
        '<code>Barrier</code> synchronizes a set number of threads at a rendezvous point — all must call <code>SignalAndWait()</code> before any can proceed. Useful for multi-phase parallel algorithms where all workers must complete phase N before starting phase N+1.',
        'Prefer these lightweight managed primitives over their kernel-based equivalents (<code>Mutex</code>, <code>Semaphore</code>, <code>EventWaitHandle</code>) for in-process synchronization. Kernel-based primitives cross process boundaries but are far more expensive to acquire.',
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
    Console.WriteLine($"Worker thread: {Thread.CurrentThread.ManagedThreadId}");
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
    Console.WriteLine($"Received: {msg}");
});
t2.Start("hello from main");
t2.Join();

// ── 3. ThreadPool.QueueUserWorkItem — cheap, pooled ───────────────────────
ThreadPool.QueueUserWorkItem(_ =>
{
    Console.WriteLine($"Pool thread: {Thread.CurrentThread.ManagedThreadId}");
});

// With typed state (no boxing):
ThreadPool.QueueUserWorkItem(static ctx =>
{
    Console.WriteLine($"Processing item: {ctx}");
}, "item-42", preferLocal: false);

// ── 4. Thread-local storage — each thread gets its own value ─────────────
var threadLocalRandom = new ThreadLocal<Random>(() => new Random());

Parallel.For(0, 4, i =>
{
    // Each thread has its own Random instance — no locking needed
    int r = threadLocalRandom.Value!.Next(100);
    Console.WriteLine($"Thread {Thread.CurrentThread.ManagedThreadId}: {r}");
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
    private readonly object _lock = new();   // dedicated, private lock object

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

// ── Race condition vs lock ────────────────────────────────────────────────
int unsafeCount = 0;
var safeCounter = new SafeCounter();

var threads = Enumerable.Range(0, 10).Select(_ => new Thread(() =>
{
    for (int i = 0; i < 1000; i++)
    {
        unsafeCount++;           // RACE CONDITION — not atomic
        safeCounter.Increment(); // thread-safe
    }
})).ToArray();

foreach (var t in threads) t.Start();
foreach (var t in threads) t.Join();

Console.WriteLine($"Unsafe: {unsafeCount} (should be 10000, probably isn't)");
Console.WriteLine($"Safe:   {safeCounter.Value} (always 10000)");

// ── Monitor.TryEnter — avoid blocking forever ─────────────────────────────
object resource = new();
bool acquired = false;
try
{
    Monitor.TryEnter(resource, TimeSpan.FromMilliseconds(200), ref acquired);
    if (acquired)
        Console.WriteLine("Got the lock");
    else
        Console.WriteLine("Could not acquire lock within timeout — back off");
}
finally
{
    if (acquired) Monitor.Exit(resource);
}

// ── Deadlock prevention — consistent lock ordering ────────────────────────
object lockA = new(), lockB = new();

// BAD — can deadlock if two threads acquire in different orders
// Thread 1: lock(lockA) then lock(lockB)
// Thread 2: lock(lockB) then lock(lockA)  ← cycle = deadlock

// GOOD — always acquire in the same order using identity hash
void SafeTransfer(object from, object to, Action transfer)
{
    object first  = RuntimeHelpers.GetHashCode(from) < RuntimeHelpers.GetHashCode(to) ? from : to;
    object second = first == from ? to : from;
    lock (first) { lock (second) { transfer(); } }
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

    // Atomically set to newValue only if current value == expected (CAS)
    public bool CompareAndSwap(int expected, int newValue)
        => Interlocked.CompareExchange(ref _value, newValue, expected) == expected;

    public int Value => Volatile.Read(ref _value);
}

// ── volatile — visibility guarantee ──────────────────────────────────────
public class BackgroundWorker
{
    // volatile: ensures the worker thread sees updates from the main thread
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

// ── Lock-free stack using CompareExchange (CAS loop) ─────────────────────
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
            // Replace head with node ONLY if head is still 'old' (no other thread changed it)
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

cache.TryAdd(1, "one");

// GetOrAdd — atomically get or create (factory may run more than once under contention)
string val = cache.GetOrAdd(2, key => $"value-for-{key}");

// AddOrUpdate — atomically update existing or add new
cache.AddOrUpdate(
    key: 1,
    addValue: "ONE",
    updateValueFactory: (key, existing) => existing.ToUpper());

if (cache.TryGetValue(1, out string? v))
    Console.WriteLine($"Found: {v}");

cache.TryRemove(1, out _);

// ── ConcurrentQueue — thread-safe FIFO ────────────────────────────────────
var queue = new ConcurrentQueue<string>();

// Multiple producers
Parallel.For(0, 5, i => queue.Enqueue($"item-{i}"));

// Single consumer
while (queue.TryDequeue(out string? item))
    Console.WriteLine($"Dequeued: {item}");

// ── SemaphoreSlim — limit concurrent access ───────────────────────────────
var sem = new SemaphoreSlim(initialCount: 3, maxCount: 3);

async Task ProcessWithLimitAsync(string item, CancellationToken ct)
{
    await sem.WaitAsync(ct);    // async-friendly — does not block a thread
    try
    {
        Console.WriteLine($"Processing {item} on thread {Thread.CurrentThread.ManagedThreadId}");
        await Task.Delay(100, ct);
    }
    finally
    {
        sem.Release();
    }
}

var tasks = Enumerable.Range(1, 10)
    .Select(i => ProcessWithLimitAsync($"item-{i}", CancellationToken.None));
await Task.WhenAll(tasks);

// ── BlockingCollection — producer/consumer with bounded capacity ──────────
using var bc = new BlockingCollection<int>(boundedCapacity: 5);

var producer = Task.Run(() =>
{
    for (int i = 0; i < 10; i++)
    {
        bc.Add(i);                  // blocks if capacity is full
        Console.WriteLine($"Produced: {i}");
    }
    bc.CompleteAdding();
});

var consumer = Task.Run(() =>
{
    foreach (int i in bc.GetConsumingEnumerable())
        Console.WriteLine($"Consumed: {i}");
});

await Task.WhenAll(producer, consumer);`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Locking on this, typeof(T), or a public object — accessible from outside the class',
      wrong: `// BAD — external code can lock on the same object and cause a deadlock
public class OrderService
{
    public void ProcessOrder(Order o)
    {
        lock (this)  // anyone with a reference to this instance can lock on it too!
        {
            _orders.Add(o);
        }
    }

    // Even worse:
    public static void UpdateConfig()
    {
        lock (typeof(OrderService))  // public type object — any code can lock on it
        {
            _config = LoadConfig();
        }
    }
}`,
      right: `// GOOD — use a private, dedicated lock object
public class OrderService
{
    private readonly object _ordersLock = new();
    private readonly object _configLock = new();

    public void ProcessOrder(Order o)
    {
        lock (_ordersLock)   // private — no external code can interfere
        {
            _orders.Add(o);
        }
    }

    public static void UpdateConfig()
    {
        lock (_configLock)   // private static lock object
        {
            _config = LoadConfig();
        }
    }
}`,
      explanation: 'When you lock on this, external code holding a reference to the same object can lock on it too and create a deadlock. Locking on typeof(X) is even more dangerous — any code in any assembly can lock on any Type object. Always lock on a private, dedicated object whose reference is never exposed.',
    },
    {
      title: 'volatile does not make compound operations atomic',
      wrong: `// volatile only guarantees VISIBILITY — not atomicity of compound operations
public class Statistics
{
    public volatile int Count = 0;

    public void Record(int value)
    {
        Count++;  // READ, INCREMENT, WRITE — three separate operations
        // Two threads can both read Count = 5, both write Count = 6
        // Result: one increment is lost — RACE CONDITION even with volatile
    }
}

int total = 0;
volatile int safeTotal = 0;  // still NOT safe for ++`,
      right: `// Use Interlocked for atomic arithmetic on a single variable
public class Statistics
{
    private int _count;   // NOT volatile — Interlocked handles visibility

    public void Record()
    {
        Interlocked.Increment(ref _count);  // truly atomic read-modify-write
    }

    public int Count => Volatile.Read(ref _count);
}

// OR use lock when you need to update multiple fields atomically:
private readonly object _lock = new();
public void Record(int value)
{
    lock (_lock) { _count++; _sum += value; }  // multi-field atomic update
}`,
      explanation: 'volatile guarantees that reads and writes to a field always go to main memory (preventing CPU cache or register optimizations). But Count++ is not a single operation — it is read, add 1, write — three steps that can be interrupted between any of them. Two threads can both read the same value, both add 1, and both write the same incremented value — losing one increment. Use Interlocked for atomic arithmetic.',
    },
    {
      title: 'Calling async methods inside a lock — continuation resumes holding the lock',
      wrong: `// async does not release the lock while waiting — the lock is held across the await
private readonly object _lock = new();

public async Task UpdateAsync(string key, string value)
{
    lock (_lock)
    {
        // await does NOT release the lock here
        // The lock is held for the entire duration of the await
        await _db.SaveAsync(key, value);  // ERROR: cannot await inside lock
    }
    // Compiler error: "Cannot await in the body of a lock statement"
}

// Some try to work around it with Monitor directly — still wrong:
Monitor.Enter(_lock);
await SomeAsyncOperation();  // lock held while thread is released to pool — disaster
Monitor.Exit(_lock);`,
      right: `// Option 1: do async work outside the lock
public async Task UpdateAsync(string key, string value)
{
    // Do the async I/O first
    string result = await _db.SaveAsync(key, value);

    // Then take the lock only for the synchronous in-memory update
    lock (_lock)
    {
        _localCache[key] = result;
    }
}

// Option 2: use SemaphoreSlim for async-compatible mutual exclusion
private readonly SemaphoreSlim _sem = new(1, 1);

public async Task UpdateAsync(string key, string value)
{
    await _sem.WaitAsync();
    try
    {
        await _db.SaveAsync(key, value);   // async work inside sem — legal
        _localCache[key] = value;
    }
    finally
    {
        _sem.Release();
    }
}`,
      explanation: 'The C# compiler correctly prevents await inside a lock statement. The reason: lock holds a Monitor object tied to a thread, but after an await the continuation may resume on a different thread pool thread — and Monitor.Exit must be called from the same thread that called Monitor.Enter. For async mutual exclusion, use SemaphoreSlim(1, 1) — it uses WaitAsync() and Release() which are not thread-affine.',
    },
    {
      title: 'ConcurrentDictionary.GetOrAdd factory runs multiple times under contention',
      wrong: `// GetOrAdd is NOT atomic for the factory — it can run multiple times
var db = new ConcurrentDictionary<int, Connection>();

Connection conn = db.GetOrAdd(tenantId, id =>
{
    // This factory may execute on multiple threads simultaneously for the same key!
    // Only one Connection will be stored, but multiple are created and discarded
    return new Connection(connectionString);  // expensive resource — leaked!
});`,
      right: `// Option 1: Use GetOrAdd with a pre-built value for cheap/idempotent values
Connection conn = db.GetOrAdd(tenantId, new Connection(connectionString));
// Problem: connection is ALWAYS created even if the key exists — just not stored

// Option 2: Use Lazy<T> to ensure the factory runs exactly once per key
var db = new ConcurrentDictionary<int, Lazy<Connection>>();

Lazy<Connection> lazy = db.GetOrAdd(tenantId, id =>
    new Lazy<Connection>(() => new Connection(connectionString)));

Connection conn = lazy.Value;  // factory runs exactly once (Lazy guarantees it)

// Option 3: For expensive resources, use lock or full AddOrUpdate logic
Connection GetOrCreate(int id)
{
    if (db.TryGetValue(id, out var existing)) return existing;
    var newConn = new Connection(connectionString);
    return db.GetOrAdd(id, newConn);
    // If another thread won the race, newConn is discarded — dispose it if needed
}`,
      explanation: 'ConcurrentDictionary.GetOrAdd(key, factory) evaluates the factory outside of any lock — multiple threads can call it simultaneously for the same key. Only one result is stored, but the others are discarded. If the factory creates expensive or non-disposable resources (DB connections, file handles, HTTP clients), this causes leaks. Wrap in Lazy<T> so only the first-stored lazy evaluates the factory, or use a dedicated lock for resource creation.',
    },
    {
      title: 'Forgetting to release SemaphoreSlim — slot never returned',
      wrong: `// If an exception throws before Release(), the slot is permanently consumed
var sem = new SemaphoreSlim(3, 3);

public async Task ProcessAsync(string item, CancellationToken ct)
{
    await sem.WaitAsync(ct);
    // ... exception thrown here ...
    var result = await _service.DoWorkAsync(item, ct);  // throws!
    sem.Release();   // NEVER REACHED — semaphore count permanently decremented
}

// After 3 exceptions, no more tasks can enter — system hangs`,
      right: `// Always put Release() in a finally block
public async Task ProcessAsync(string item, CancellationToken ct)
{
    await sem.WaitAsync(ct);
    try
    {
        var result = await _service.DoWorkAsync(item, ct);
    }
    finally
    {
        sem.Release();   // always runs, even on exception or cancellation
    }
}`,
      explanation: 'SemaphoreSlim.WaitAsync() decrements the semaphore count. If an exception or cancellation prevents the corresponding Release() call, that slot is permanently consumed. After enough failures, the semaphore count reaches zero and all future WaitAsync() calls block forever — a hung system with no obvious cause. The fix is the same as for any resource: always Release() in a finally block.',
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
      explanation: 'The C# compiler translates <code>lock(obj) { ... }</code> into <code>bool taken = false; try { Monitor.Enter(obj, ref taken); ... } finally { if (taken) Monitor.Exit(obj); }</code>. The <code>ref taken</code> pattern ensures <code>Exit</code> is only called if <code>Enter</code> succeeded, preventing an exception if the thread is aborted between Enter and the try.',
    },
    {
      q: 'Why is Interlocked.Increment preferred over lock for a simple counter?',
      options: [
        'Interlocked.Increment supports async/await',
        'lock cannot protect integer fields',
        'Interlocked.Increment is a single atomic CPU instruction — no kernel object, no blocking, ~10x lower overhead',
        'Interlocked.Increment automatically handles integer overflow',
      ],
      answer: 2,
      explanation: '<code>Interlocked.Increment</code> uses the x86/ARM atomic <code>LOCK XADD</code> instruction — a single CPU-level operation. <code>lock</code> must acquire a kernel-level monitor object, which involves context switching if contested. For a single variable, <code>Interlocked</code> is roughly 10x faster and never causes thread contention. Use <code>lock</code> only when you need to protect multiple fields atomically.',
    },
    {
      q: 'What is the difference between a foreground and background thread?',
      options: [
        'Background threads run at lower CPU priority',
        'Background threads cannot access the UI thread',
        'The process exits when all foreground threads complete, even if background threads are still running — they are terminated automatically',
        'Foreground threads are managed by the OS; background threads are managed by the .NET runtime',
      ],
      answer: 2,
      explanation: 'The .NET runtime keeps the process alive as long as at least one foreground thread is running. When the last foreground thread finishes, the runtime terminates all remaining background threads and exits the process. <code>Thread</code> creates a foreground thread by default. Set <code>IsBackground = true</code> for workers that should not block application shutdown.',
    },
    {
      q: 'When should you use ConcurrentDictionary instead of Dictionary with a lock?',
      options: [
        'Only when the dictionary has more than 1000 entries',
        'When multiple threads will read and write concurrently — ConcurrentDictionary uses per-bucket locking, dramatically reducing contention vs a single external lock',
        'ConcurrentDictionary is never better — Dictionary + lock is always faster',
        'When you need the dictionary to be sorted',
      ],
      answer: 1,
      explanation: '<code>ConcurrentDictionary</code> uses striped internal locking — one lock per bucket segment (default: 4 × CPU count). Threads writing to different buckets rarely contend. A single external <code>lock</code> around a regular <code>Dictionary</code> serializes all reads and writes — one thread at a time — which becomes a bottleneck under concurrent load.',
    },
    {
      q: 'Why can you NOT await inside a lock statement in C#?',
      options: [
        'It is a CLR limitation — Monitor objects cannot be used with the thread pool',
        'The compiler prevents it because Monitor.Exit must be called from the same thread as Monitor.Enter, but await may resume on a different thread pool thread',
        'await is not supported in synchronous methods that use lock',
        'lock is a keyword — async code cannot be used inside keywords',
      ],
      answer: 1,
      explanation: '<code>Monitor.Exit</code> must be called from the same thread that called <code>Monitor.Enter</code>. After an <code>await</code>, the continuation may resume on a different thread pool thread. The C# compiler raises a compile error to prevent this invalid use. For async mutual exclusion, use <code>SemaphoreSlim(1, 1)</code> with <code>WaitAsync()</code> and <code>Release()</code> — these are not thread-affine.',
    },
    {
      q: 'What does SemaphoreSlim.WaitAsync() do differently from Semaphore.WaitOne()?',
      options: [
        'WaitAsync() has no timeout and blocks indefinitely',
        'WaitAsync() returns a Task that completes when a slot is available — without blocking the calling thread',
        'WaitAsync() can only be called once per SemaphoreSlim instance',
        'WaitAsync() uses a kernel mutex internally, making it cross-process safe',
      ],
      answer: 1,
      explanation: '<code>SemaphoreSlim.WaitAsync()</code> returns an awaitable <code>Task</code>. If a slot is available immediately, the Task is already completed and no thread is blocked. If not, the caller\'s async method is suspended (the thread is released to the pool) until a slot opens. <code>Semaphore.WaitOne()</code> blocks the calling thread synchronously — under load this can starve the thread pool.',
    },
    {
      q: 'What does volatile guarantee and what does it NOT guarantee?',
      options: [
        'volatile makes all operations on a field atomic — reads, writes, and compound operations',
        'volatile guarantees visibility (reads/writes go to main memory, not CPU cache) and basic ordering, but NOT atomicity of compound operations like x++',
        'volatile is equivalent to Interlocked for integer fields',
        'volatile prevents the JIT from compiling the field access — it always goes through a method call',
      ],
      answer: 1,
      explanation: '<code>volatile</code> prevents the JIT and CPU from caching a field value in a register or reordering accesses around it — ensuring visibility across threads. But <code>x++</code> on a volatile int is still three operations (read, add, write) that can be interleaved by other threads. For atomic arithmetic, use <code>Interlocked.Increment</code>. For complex multi-field state, use <code>lock</code>.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is a deadlock and how do you avoid one?',
      a: 'A deadlock is a situation where two or more threads are permanently blocked, each waiting for a resource held by another. The classic example: Thread A holds Lock 1 and waits for Lock 2; Thread B holds Lock 2 and waits for Lock 1 — neither can proceed. Prevention strategies: (1) <strong>Consistent lock ordering</strong> — always acquire multiple locks in the same global order. (2) <strong>Lock timeout</strong> — use <code>Monitor.TryEnter(obj, timeout)</code> and release held locks if acquisition fails, then retry. (3) <strong>Minimize lock scope</strong> — hold locks for the shortest possible time and never call external code while holding one. (4) <strong>Prefer lock-free alternatives</strong> — <code>ConcurrentDictionary</code>, <code>Interlocked</code>, and <code>Channel&lt;T&gt;</code> eliminate entire classes of deadlock.',
    },
    {
      q: 'When should I use a raw Thread vs Task.Run?',
      a: 'Use a raw <code>Thread</code> when: the work runs for the lifetime of the process (a background service loop); you need thread-specific properties like <code>ApartmentState</code> for COM interop, <code>Name</code> for debugging, or non-default <code>Priority</code>; or you are building a low-level thread-per-connection server. Use <code>Task.Run</code> for: CPU-bound work that runs and completes (image resizing, sorting, parsing); offloading a computation from the UI thread; anything that should participate in cancellation and exception handling via the Task model. For I/O-bound work, use <code>async/await</code> — no thread is consumed while waiting.',
    },
    {
      q: 'A class has `volatile bool _isReady;` and a `readonly List<string> _items = new();` field. A writer thread populates `_items` and then sets `_isReady = true;`. A reader thread checks `if (_isReady) { read from _items }`. Does volatile\'s ordering guarantee actually protect the reader from seeing an incompletely-populated `_items`, even though `_items` itself is not volatile?',
      a: 'Yes — this is precisely the pattern volatile\'s acquire/release fence semantics are designed to support: the volatile write to `_isReady = true` acts as a release fence, meaning all memory writes that happened BEFORE it in program order (including populating `_items`) are guaranteed to be visible to any thread that subsequently reads `_isReady` via an acquire fence and observes `true`. This works even though `_items` itself is not volatile, because the guarantee is about ORDERING relative to the volatile operation, not about making every touched field volatile individually — this "publish via a volatile flag" pattern is a common, correct way to safely publish a fully-constructed object graph across threads with only one field marked volatile, as long as every write to the non-volatile data happens strictly before the volatile write that publishes it.',
    },
    {
      q: 'What is SemaphoreSlim and why is it better than Semaphore for async code?',
      a: '<code>SemaphoreSlim</code> is a lightweight semaphore that limits the number of threads (or tasks) that can enter a section concurrently — ideal for rate-limiting concurrent access (e.g. max 5 DB connections). The key advantage: <code>SemaphoreSlim.WaitAsync()</code> returns a Task that completes when a slot is available, without blocking a thread. <code>Semaphore.WaitOne()</code> blocks the calling thread synchronously, consuming a thread pool thread the whole time. Use the pattern: <code>await sem.WaitAsync(ct); try { ... } finally { sem.Release(); }</code>. Dispose the SemaphoreSlim when done — it has an internal event that can be a native handle.',
    },
    {
      q: 'How do ConcurrentDictionary and Dictionary+lock compare in performance?',
      a: '<code>ConcurrentDictionary</code> uses striped internal locking with one lock per bucket segment (default: 4 × CPU core count). Under concurrent load, threads writing to different keys rarely share the same lock segment, so contention is low. A <code>Dictionary</code> protected by a single external <code>lock</code> serializes ALL reads and writes through one lock — under load this becomes a global serialization point. <code>ConcurrentDictionary</code> wins in read-heavy or multi-writer scenarios. For read-only access after initialization, a plain <code>Dictionary</code> (or <code>ImmutableDictionary</code>) is faster because there is no locking overhead at all. For very low-contention single-threaded scenarios, the overhead of ConcurrentDictionary is measurable — profile before switching.',
    },
    {
      q: 'What is the difference between ManualResetEventSlim and AutoResetEvent?',
      a: '<code>ManualResetEventSlim</code>: once <code>Set()</code> is called, the gate stays open — all waiting threads are released and any future <code>Wait()</code> calls return immediately until <code>Reset()</code> is called. Useful for broadcasting a "go" signal to multiple threads. <code>AutoResetEvent</code>: calling <code>Set()</code> releases exactly one waiting thread and then automatically resets — like a turnstile. Each pass requires a separate <code>Set()</code>. <code>ManualResetEventSlim</code> is the preferred in-process variant of both (it uses a spin wait before falling back to a kernel event, making it faster for short waits). The kernel-based <code>ManualResetEvent</code> / <code>AutoResetEvent</code> are heavier and intended for cross-process synchronization.',
    },
    {
      q: 'What is CountdownEvent used for?',
      a: '<code>CountdownEvent</code> blocks at <code>Wait()</code> until an internal counter reaches zero. Each participating thread calls <code>Signal()</code> when it finishes its piece of work. Unlike <code>Task.WhenAll</code> (which is async), <code>CountdownEvent</code> is a synchronous synchronization primitive that is useful when coordinating raw threads or when you need a "barrier" for a known number of concurrent synchronous operations. Example: initialize with count = 10, start 10 threads each calling <code>Signal()</code> when done, call <code>Wait()</code> to block the coordinator until all 10 signal. <code>Barrier</code> is a related type for multi-phase parallel algorithms where all participants must reach a phase boundary before any continue.',
    },
  ];

  challenge: Challenge = {
    title: 'Thread-Safe In-Memory Cache',
    description: `Implement a thread-safe in-memory cache that stores string values with TTL (time-to-live) expiry.

Requirements:
1. Use <code>ConcurrentDictionary</code> as the backing store
2. Each cache entry stores the value and the time it expires (<code>DateTime.UtcNow + TTL</code>)
3. <code>Set(key, value, ttl)</code> adds or updates an entry
4. <code>TryGet(key, out value)</code> returns true with the value only if the entry exists AND has not expired
5. Expired entries are silently treated as missing (return false from TryGet)
6. <code>Evict()</code> removes all expired entries (call periodically)
7. <code>Count</code> property returns the number of currently non-expired entries`,
    language: 'csharp',
    hints: [
      'Store a record or struct with both Value and ExpiresAt in the ConcurrentDictionary',
      'In TryGet: after TryGetValue, also check entry.ExpiresAt > DateTime.UtcNow',
      'In Evict: enumerate Keys and call TryRemove for any entry where ExpiresAt <= DateTime.UtcNow',
      'Count can iterate Values and count where ExpiresAt > DateTime.UtcNow — ConcurrentDictionary handles thread safety',
    ],
    starterCode: `public class TtlCache
{
    // TODO: define a private record/struct to hold (Value, ExpiresAt)
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
        get => throw new NotImplementedException();
    }
}`,
    solution: `public class TtlCache
{
    private record CacheEntry(string Value, DateTime ExpiresAt);

    private readonly ConcurrentDictionary<string, CacheEntry> _store = new();

    public void Set(string key, string value, TimeSpan ttl)
    {
        _store[key] = new CacheEntry(value, DateTime.UtcNow + ttl);
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

  revision: RevisionSummary = {
    oneLiner: 'Use Task/async for most concurrency; raw Thread only for long-running dedicated workers. lock compiles to Monitor.Enter/Exit — always use a private object. Interlocked is ~10x faster than lock for a single counter. SemaphoreSlim.WaitAsync() is the async-compatible mutex replacement.',
    mustKnow: [
      'Thread = expensive OS resource (~1 MB stack). ThreadPool reuses threads. Task.Run builds on the pool. async/await releases the thread during I/O.',
      'lock(obj) → Monitor.Enter/Exit in try/finally. Lock object must be private readonly — never lock(this) or lock(typeof(T)).',
      'Deadlock: two threads each hold a lock the other needs. Prevention: consistent lock order, Monitor.TryEnter timeout, minimize scope.',
      'volatile: visibility guarantee only — ensures main-memory reads/writes. Does NOT make compound operations (x++) atomic.',
      'Interlocked.Increment: single atomic CPU instruction. Use for counters/flags. Use lock for multi-field atomic updates.',
      'SemaphoreSlim(1,1) is the async-compatible mutex — WaitAsync() does not block a thread while waiting for the slot.',
      'ConcurrentDictionary uses per-bucket locking. GetOrAdd factory may run multiple times under contention — use Lazy<T> for expensive factories.',
    ],
    interviewFocus: [
      'Explain the deadlock scenario and its three prevention strategies (lock ordering, timeout, scope minimization)',
      'What does volatile guarantee vs Interlocked? (visibility vs atomicity)',
      'Why can you not await inside a lock? (Monitor.Exit must run on same thread as Monitor.Enter)',
      'SemaphoreSlim vs Semaphore: why prefer SemaphoreSlim for async code? (WaitAsync vs blocking WaitOne)',
      'When does ConcurrentDictionary.GetOrAdd factory run more than once? (No lock around factory — high contention can call it multiple times, only first stored)',
    ],
  };
}
