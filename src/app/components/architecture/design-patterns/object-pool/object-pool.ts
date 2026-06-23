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
