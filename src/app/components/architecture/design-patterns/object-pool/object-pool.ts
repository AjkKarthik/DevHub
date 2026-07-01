import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

const quickRef: QuickRefItem[] = [
  { name: 'Intent',        type: 'keyword', desc: 'Reuse a set of initialised objects rather than creating and destroying them on demand.' },
  { name: 'Pool',          type: 'class',   desc: 'Manages a collection of reusable objects; hands them out and takes them back.' },
  { name: 'Acquire/Rent',  type: 'method',  desc: 'Client borrows an object from the pool; the pool marks it as in-use.' },
  { name: 'Release/Return', type: 'method', desc: 'Client returns the object; pool resets its state and makes it available again.' },
  { name: 'ArrayPool<T>',  type: 'class',   desc: '.NET built-in pool for arrays — avoids repeated large array allocations on the heap.' },
  { name: 'ObjectPool<T>', type: 'class',   desc: 'Microsoft.Extensions.ObjectPool — generic pool used by ASP.NET Core for StringBuilder etc.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'What is the Object Pool Pattern?',
    points: [
      'Object Pool maintains a set of pre-initialised reusable objects instead of creating/destroying them on every use.',
      'When a client needs an object, it acquires (rents) one from the pool; when done, it returns it.',
      'Ideal for objects that are expensive to create (DB connections, threads, large buffers) but cheap to reset.',
      'Reduces GC pressure, startup latency, and resource exhaustion in high-throughput scenarios.',
    ],
  },
  {
    heading: 'Acquire / Release Lifecycle',
    points: [
      'Acquire: pool checks if a free object is available; if yes, hands it out. If no, creates a new one (up to max).',
      'Release: client returns the object; pool resets it to a clean state and marks it as available.',
      'If the client forgets to return the object, it leaks — implement IDisposable to ensure return via `using`.',
      'Pool may shrink idle objects after a timeout to free memory when demand drops.',
    ],
  },
  {
    heading: 'When to Use Object Pool',
    points: [
      'Database connections: creating a connection is expensive — pools keep several open and share them.',
      'Thread pools: OS thread creation is costly — the ThreadPool reuses worker threads.',
      'Large buffers: ArrayPool<T> avoids repeated LOH allocations for byte[] in I/O-heavy code.',
      'Game entities: bullet/particle systems reuse game objects instead of allocating each frame.',
    ],
  },
  {
    heading: '.NET Built-in Pools',
    points: [
      'ArrayPool<byte>.Shared.Rent(size) / Return(array) — zero-alloc buffer management.',
      'ObjectPool<StringBuilder> in Microsoft.Extensions.ObjectPool — reused in ASP.NET Core pipelines.',
      'MemoryPool<T> in System.Buffers — memory segments for async I/O pipelines.',
      'SqlConnection pooling is automatic in ADO.NET — the pool is managed by the provider, not you.',
    ],
  },
  {
    heading: 'Object Pool for Expensive-to-Create, Reusable Resources',
    points: [
      'Object Pool maintains a set of pre-created, reusable objects (database connections, thread pool workers) that are checked out for use and returned when finished, avoiding the repeated cost of creating and destroying genuinely expensive objects on every use.',
      'This pattern is only worth its added complexity when object creation is GENUINELY expensive relative to how often objects are needed — pooling cheap-to-create objects (like simple value objects) adds unnecessary bookkeeping overhead without any meaningful performance benefit.',
      'Pooled objects must be properly reset to a clean, safe state before being reused — failing to reset internal state between uses (leftover data from a previous user of a pooled connection or buffer) is a common and serious source of bugs, since the object appears "fresh" but silently carries residual state.',
      'Modern managed-memory languages (with generational garbage collectors) have made Object Pool less broadly necessary than it once was for general object allocation — the pattern remains genuinely valuable for specifically expensive, external resources like database connections or network sockets, rather than as a default optimization for ordinary object creation.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Generic Pool',
    language: 'csharp',
    code: `// Generic Object Pool with IDisposable lease
public sealed class ObjectPool<T> where T : class
{
    private readonly ConcurrentBag<T> _pool = new();
    private readonly Func<T>          _factory;
    private readonly Action<T>?       _reset;
    private readonly int              _maxSize;

    public ObjectPool(Func<T> factory, Action<T>? reset = null, int maxSize = 16)
    {
        _factory = factory;
        _reset   = reset;
        _maxSize = maxSize;
    }

    public T Acquire() =>
        _pool.TryTake(out var item) ? item : _factory();

    public void Release(T item)
    {
        _reset?.Invoke(item);
        if (_pool.Count < _maxSize)
            _pool.Add(item);
    }

    // IDisposable lease — ensures return even if exception thrown
    public PoolLease<T> AcquireLease() => new(this, Acquire());
}

public readonly struct PoolLease<T>(ObjectPool<T> pool, T value) : IDisposable
    where T : class
{
    public T Value { get; } = value;
    public void Dispose() => pool.Release(Value);
}

// Usage
var pool = new ObjectPool<StringBuilder>(
    factory: () => new StringBuilder(1024),
    reset:   sb => sb.Clear());

using var lease = pool.AcquireLease();
lease.Value.Append("Hello, pool!");
Console.WriteLine(lease.Value); // returned to pool on Dispose`,
  },
  {
    label: 'ArrayPool<T>',
    language: 'csharp',
    code: `// .NET built-in ArrayPool — most common pool usage
using System.Buffers;

public async Task ProcessStreamAsync(Stream source)
{
    // Rent a buffer from the shared pool — no heap allocation
    byte[] buffer = ArrayPool<byte>.Shared.Rent(8192);
    try
    {
        int read;
        while ((read = await source.ReadAsync(buffer)) > 0)
        {
            // Process only the bytes actually read
            ProcessBytes(buffer.AsSpan(0, read));
        }
    }
    finally
    {
        // ALWAYS return — even on exception
        ArrayPool<byte>.Shared.Return(buffer, clearArray: true);
    }
}

// ObjectPool<T> from Microsoft.Extensions.ObjectPool
using Microsoft.Extensions.ObjectPool;

var provider = new DefaultObjectPoolProvider();
var pool     = provider.CreateStringBuilderPool();

var sb = pool.Get();
try   { sb.Append("pooled string"); Console.WriteLine(sb); }
finally { pool.Return(sb); } // sb is cleared, returned to pool`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Forgetting to return the object to the pool',
    wrong: `var conn = pool.Acquire();
conn.ExecuteQuery("SELECT …");
// forgot pool.Release(conn) — connection leaked!`,
    right: `using var lease = pool.AcquireLease();
lease.Value.ExecuteQuery("SELECT …");
// Dispose() auto-returns on scope exit`,
    explanation: 'Pool objects that are never returned cause pool exhaustion — subsequent Acquire() calls block or create unbounded new instances. Always use `using` / try-finally to guarantee Return().',
  },
  {
    title: 'Not resetting state before returning to the pool',
    wrong: `pool.Release(stringBuilder); // still contains old data`,
    right: `stringBuilder.Clear();
pool.Release(stringBuilder);`,
    explanation: 'The next Acquire() will receive the object with the previous caller\'s state. Reset all mutable state (Clear(), zero out fields) before returning.',
  },
  {
    title: 'Using pooled arrays without tracking actual length',
    wrong: `byte[] buf = ArrayPool<byte>.Shared.Rent(1024);
Process(buf); // buf.Length may be > 1024 (pool rounds up)`,
    right: `byte[] buf = ArrayPool<byte>.Shared.Rent(1024);
int read = stream.Read(buf, 0, 1024);
Process(buf.AsSpan(0, read)); // use actual data length`,
    explanation: 'Rented arrays are often larger than requested. Always track the logical length separately and use Span<byte>(buffer, 0, actualLength) to avoid processing garbage bytes.',
  },
  {
    title: 'Pooling objects that are cheap to create',
    wrong: `// Pooling a simple DTO with 3 int fields — no benefit`,
    right: `// Pool only expensive-to-create objects: connections, large buffers, threads`,
    explanation: 'Object pools add complexity (reset logic, lease tracking). Only pool objects where creation/destruction cost is measurably higher than pool management overhead.',
  },
];

const challenge: Challenge = {
  title: 'Worker Pool',
  language: 'typescript',
  description: `Implement an object pool for "worker" objects that are expensive to create.
The pool should have acquire() and release() methods.
Workers have a doWork(task: string) method and a reset() method.
Demonstrate that the same worker instance is reused across calls.`,
  hints: [
    'Use an array to hold available workers',
    'acquire() pops from the array or creates a new worker',
    'release() calls reset() then pushes back to the array',
  ],
  starterCode: `class Worker {
  private id: number;
  private taskCount = 0;

  constructor(id: number) {
    this.id = id;
    console.log(\`Worker \${id} created (expensive!)\`);
  }

  doWork(task: string): void {
    this.taskCount++;
    console.log(\`Worker \${this.id} (task #\${this.taskCount}): \${task}\`);
  }

  reset(): void { /* keep id, reset transient state */ }
}

class WorkerPool {
  // TODO: implement acquire() and release()
}`,
  solution: `class Worker {
  private taskCount = 0;
  constructor(public readonly id: number) {
    console.log(\`Worker \${id} created (expensive!)\`);
  }
  doWork(task: string): void {
    this.taskCount++;
    console.log(\`Worker \${this.id} (task #\${this.taskCount}): \${task}\`);
  }
  reset(): void { /* transient state cleared */ }
}

class WorkerPool {
  private available: Worker[] = [];
  private nextId = 1;

  acquire(): Worker {
    if (this.available.length > 0) {
      const w = this.available.pop()!;
      console.log(\`Reusing Worker \${w.id}\`);
      return w;
    }
    return new Worker(this.nextId++);
  }

  release(worker: Worker): void {
    worker.reset();
    this.available.push(worker);
  }
}

const pool = new WorkerPool();
const w1 = pool.acquire(); // Worker 1 created
w1.doWork('task A');
pool.release(w1);

const w2 = pool.acquire(); // Reusing Worker 1
w2.doWork('task B');
pool.release(w2);`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What is the primary benefit of the Object Pool pattern?',
    options: [
      'It makes objects immutable',
      'It reduces the cost of creating and destroying expensive objects by reusing them',
      'It ensures only one instance of an object exists',
      'It makes object creation thread-safe',
    ],
    answer: 1,
    explanation: 'Object Pool avoids repeated expensive construction/destruction by maintaining a set of pre-initialised objects that are handed out and returned. The main benefit is performance in high-throughput scenarios.',
  },
  {
    q: '`ArrayPool<byte>.Shared.Rent(1024)` in .NET may return an array larger than 1024 bytes. How should you handle this?',
    options: [
      'It will always return exactly 1024 bytes',
      'Use only the first 1024 bytes (or actual bytes read) via Span<byte>(buffer, 0, actualLength)',
      'Call Resize() on the returned array',
      'The extra bytes are automatically zeroed out',
    ],
    answer: 1,
    explanation: 'Rented arrays are rounded up to the next power-of-two bucket. Always track the logical length separately and use Span or slice the array to avoid reading garbage bytes in the oversized portion.',
  },
  {
    q: 'What must ALWAYS happen when an object is returned to a pool?',
    options: [
      'The object must be serialized to disk',
      'The pool must create a new replacement object',
      'The object must be reset to a clean state before being made available again',
      'The object must be validated against a schema',
    ],
    answer: 2,
    explanation: 'Before returning an object to the pool, all mutable state must be reset. The next caller who acquires it must receive a clean object — stale state from the previous user causes subtle, hard-to-debug bugs.',
  },
  { q: 'What is the Object Pool pattern and what performance problem does it solve?', options: ['A collection of related utility methods grouped for convenience', 'A creational pattern that maintains a pool of reusable objects to avoid the overhead of creating and destroying expensive objects repeatedly', 'A pool of database query results cached in memory', 'A pattern for pooling hardware resources like CPU cores'], answer: 1, explanation: 'Creating some objects is expensive: database connections establish a network connection and authentication handshake, threads require OS-level resources, or HTTP clients initialize TLS sessions. If many short-lived operations each create and destroy such an object, the creation overhead dominates the operation cost. Object Pool preallocates a set of objects. A client borrows an object from the pool, uses it briefly, then returns it. The pool recycles it for the next client. Peak load is handled by the pool size, not by constantly creating new objects.' },
  { q: 'How does Object Pool manage object lifecycle?', options: ['Objects in the pool are never destroyed; they live for the entire application lifetime', 'The pool creates objects upfront or on demand up to a maximum; lends them to clients; clients return them after use; the pool resets and recycles them', 'Clients own the objects permanently after borrowing; the pool never reclaims them', 'The pool destroys and recreates objects after each use to prevent state leakage'], answer: 1, explanation: 'Pool lifecycle: initialization (eager: create all objects at startup; lazy: create on first request). Borrow: client requests an object; pool provides one if available; if not, waits or creates a new one (up to max pool size). Use: client uses the object for its operation. Return: client returns the object; pool may reset/clean it (clear request state, reset connection). Recycle: the cleaned object goes back to the available list. Eviction: idle objects beyond a timeout may be closed and removed. Validation: before lending, check the object is still valid (database connection alive).' },
  { q: 'What is the risk of clients not returning objects to the pool?', options: ['The pool automatically reclaims unreturned objects after a timeout', 'Pool exhaustion: the pool runs out of available objects; new borrowers block indefinitely or fail, degrading or halting the application', 'Unreturned objects cause memory leaks but do not affect borrowing', 'The pool creates extra objects beyond the maximum to compensate'], answer: 1, explanation: 'Pool exhaustion is a critical failure mode. If clients borrow objects but never return them (due to exceptions, forgotten returns, or bugs), the pool drains. New borrowers block waiting for a return that never comes. In a web application, all request threads may end up blocked waiting for a database connection that leaked. Prevention: use try-finally or using/with blocks to guarantee return. .NET HttpClientFactory and SqlConnection use IDisposable so Dispose() returns to the pool. Timeouts on borrow operations prevent infinite blocking. Monitor pool usage metrics to detect leaks early.' },
];

const qna: QnaItem[] = [
  {
    q: 'Is SQL connection pooling in ADO.NET the Object Pool pattern?',
    a: 'Yes — SqlConnection pooling is an automatic Object Pool managed by the ADO.NET provider. Calling connection.Open() acquires from the pool; Dispose() returns it. The pool is configured via the connection string (Max Pool Size, Min Pool Size). You do not manage the pool directly.',
  },
  {
    q: 'What is the difference between ObjectPool<T> and ArrayPool<T>?',
    a: 'ArrayPool<T> is specialized for arrays — it buckets by size, allowing extremely fast rent/return with zero allocation. ObjectPool<T> (Microsoft.Extensions.ObjectPool) is a general-purpose pool for any class, with configurable policies for creation and reset. Use ArrayPool<T> for byte[]/char[] buffers; ObjectPool<T> for domain objects like StringBuilder.',
  },
  { q: 'How does connection pooling in database drivers work?', a: 'ADO.NET (C#) SqlConnection uses a built-in connection pool. When you open a connection, the pool checks if an available connection to the same database exists. If yes, it returns a reused connection. If no, it creates a new one up to the configured max. When you Dispose() or close the connection, it does not actually close the TCP connection; it returns it to the pool for reuse. Configuration: min pool size (preallocated), max pool size (100 default), connection timeout, lifetime. The pool health-checks connections on borrow. Same pattern in JDBC (HikariCP, c3p0), Python (SQLAlchemy pool), and Node.js (pg-pool for PostgreSQL). Always use connection pools in production; never open raw connections per request.' },
  { q: 'How do you implement a thread-safe Object Pool?', a: 'Thread-safe pool implementation: use a concurrent queue or blocking collection to hold available objects. On borrow: TryDequeue(out obj) -- if it succeeds, return obj; if the queue is empty, create a new one if below max capacity; else block or throw timeout. On return: Enqueue(obj) after resetting state. In .NET, ConcurrentQueue<T> and SemaphoreSlim form a standard pattern. BlockingCollection<T> provides built-in blocking. .NET ObjectPool<T> (Microsoft.Extensions.ObjectPool) provides a production-grade implementation. In Java, Apache Commons Pool2 provides validated, evicting, and bounded pool implementations. Key considerations: atomic operations for count tracking, bounded max size, and configurable wait timeout.' },
  { q: 'What is the difference between Object Pool and Flyweight?', a: 'Both patterns share objects to reduce creation overhead, but with different mechanics and purposes. Object Pool: objects are borrowed exclusively by one client at a time. Pool lends and reclaims. Clients use the object with mutable state (execute a query on a connection). Prevents creation overhead by reusing expensive-to-create objects. Flyweight: objects are shared simultaneously by many clients. No borrowing or returning. Objects contain only intrinsic (immutable) state; extrinsic state is passed by callers. Prevents memory overhead by sharing immutable state. Use Object Pool for exclusive, stateful, expensive-to-create objects; use Flyweight for concurrent, immutable, memory-heavy objects.' },
  { q: 'When is Object Pool over-engineering?', a: 'Object Pool is over-engineering when: the objects are cheap to create (plain data objects, simple value types, most DTOs). The pool management complexity (borrow/return, leak detection, health checks) exceeds the creation cost savings. Object creation takes microseconds while pool operations also cost microseconds. The application has low concurrency and rarely needs multiple instances simultaneously. For most application objects, new() is fast enough and garbage collection handles cleanup. Reserve Object Pool for genuinely expensive resources: database connections, thread instances, network connections, TLS sessions, large pre-initialized buffers, and GPU or hardware resource handles.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Object Pool reuses expensive-to-create objects by maintaining a pool of pre-initialised instances — reducing GC pressure and creation latency.',
  mustKnow: [
    'acquire() borrows an object; release() resets state and returns it to the pool',
    'Always return pooled objects — use IDisposable + using for guaranteed return',
    'Always reset all mutable state before returning to the pool',
    'Rented ArrayPool<T> arrays may be larger than requested — always track actual length',
    '.NET: ArrayPool<T>, ObjectPool<T>, MemoryPool<T>, SqlConnection pooling',
  ],
  interviewFocus: [
    'What happens if a pooled object is never returned?',
    'How does ADO.NET SqlConnection pooling work under the hood?',
    'When is Object Pool beneficial vs. harmful (over-pooling)?',
  ],
};

@Component({
  selector: 'app-dp-object-pool',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './object-pool.html',
  styleUrl: './object-pool.scss',
})
export class DpObjectPool {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
