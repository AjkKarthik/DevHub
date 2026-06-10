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
  selector: 'app-csharp-tasks',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './tasks.html',
  styleUrl: './tasks.scss',
})
export class CsharpTasks {

  quickRef: QuickRefItem[] = [
    { name: 'Task.Run()',               type: 'method',  desc: 'Queues CPU-bound work on the thread pool. Returns a Task<T>. Use for expensive synchronous work; NOT for I/O-bound work.' },
    { name: 'Task<T>',                  type: 'class',   desc: 'Represents an asynchronous operation that produces a value of type T.' },
    { name: 'Task.WhenAll()',           type: 'method',  desc: 'Awaits all supplied tasks concurrently. Returns when every task completes. Collects all exceptions.' },
    { name: 'Task.WhenAny()',           type: 'method',  desc: 'Returns when the FIRST of the supplied tasks completes. Useful for timeouts and racing multiple sources.' },
    { name: 'Parallel.ForEach()',       type: 'method',  desc: 'Runs a foreach loop body in parallel using thread pool threads. Good for CPU-bound per-item work.' },
    { name: 'Parallel.For()',           type: 'method',  desc: 'Runs a for loop in parallel. Supports ParallelOptions for concurrency limits and cancellation.' },
    { name: 'AsParallel()',             type: 'method',  desc: 'PLINQ entry point. Converts an IEnumerable<T> to ParallelQuery<T> for parallel LINQ queries.' },
    { name: 'TaskCompletionSource<T>',  type: 'class',   desc: 'Manually controlled Task. Use to bridge callback-based or event-based APIs into the Task model.' },
    { name: 'CancellationToken',        type: 'class',   desc: 'Cooperative cancellation signal. Pass through call chains; check ThrowIfCancellationRequested().' },
    { name: 'AggregateException',       type: 'class',   desc: 'Wraps one or more exceptions from Task.WhenAll or Parallel operations. Inspect InnerExceptions.' },
    { name: 'ContinueWith()',           type: 'method',  desc: 'Schedules a continuation after a task. Prefer await over ContinueWith in modern code.' },
    { name: 'ParallelOptions',          type: 'class',   desc: 'Configuration for Parallel.For/ForEach. Set MaxDegreeOfParallelism and CancellationToken.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Task.Run is for CPU-bound work',
      points: [
        '<code>Task.Run()</code> queues a delegate on the .NET thread pool. Use it when you have expensive synchronous CPU work (sorting, encryption, image processing) that would block the calling thread.',
        'For I/O-bound work (HTTP calls, file reads, database queries) you should <strong>not</strong> use <code>Task.Run()</code>. I/O-bound async methods already release the thread via <code>await</code>; wrapping them in <code>Task.Run()</code> wastes a thread pool thread.',
        '<code>Task.Run()</code> returns a <code>Task&lt;T&gt;</code> — you can <code>await</code> it normally. The calling thread (e.g. the UI thread) is freed while the background thread does the work.',
        'Avoid <code>Task.Run()</code> in ASP.NET Core request handlers for I/O work — the request already runs on a pool thread; offloading to another pool thread adds overhead without benefit.',
      ],
    },
    {
      heading: 'Fan-out with WhenAll and WhenAny',
      points: [
        '<code>Task.WhenAll(t1, t2, t3)</code> starts all tasks concurrently (they are already running when passed in) and returns a new Task that completes when all finish.',
        'If any task faults, <code>WhenAll</code> re-throws the first exception when awaited. To observe ALL exceptions, inspect the returned Task\'s <code>.Exception.InnerExceptions</code> after catching.',
        '<code>Task.WhenAny(t1, t2)</code> returns as soon as the first task completes (successfully or faulted). The other tasks keep running — cancel them explicitly if you no longer need them.',
        'A classic use of <code>WhenAny</code> is the timeout pattern: race the real work against a <code>Task.Delay(timeout)</code> and throw if the delay wins.',
      ],
    },
    {
      heading: 'Parallel.ForEach and PLINQ',
      points: [
        '<code>Parallel.ForEach</code> partitions a collection across thread pool threads. It is synchronous — the caller blocks until all work completes. It is ideal for CPU-bound per-item processing.',
        'Use <code>ParallelOptions.MaxDegreeOfParallelism</code> to cap the number of threads (e.g. <code>Environment.ProcessorCount</code>). Unbounded parallelism can thrash the thread pool.',
        'PLINQ (<code>.AsParallel()</code>) integrates parallelism into LINQ query chains. It automatically partitions the source and merges results. Use <code>.WithDegreeOfParallelism(n)</code> and <code>.WithCancellation(ct)</code>.',
        'Both <code>Parallel.ForEach</code> and PLINQ are for CPU-bound work. Do NOT use them for I/O-bound async operations — thread blocking defeats the purpose.',
      ],
    },
    {
      heading: 'TaskCompletionSource bridges old APIs',
      points: [
        '<code>TaskCompletionSource&lt;T&gt;</code> gives you a Task whose completion you control manually. Call <code>.SetResult(value)</code>, <code>.SetException(ex)</code>, or <code>.SetCanceled()</code>.',
        'It is the standard way to wrap event-driven or callback-based APIs (e.g. Socket callbacks, timer events, legacy APM patterns) so that callers can <code>await</code> them.',
        'For value types on hot paths, prefer <code>TaskCompletionSource</code> (non-generic) overloads or <code>ManualResetValueTaskSourceCore&lt;T&gt;</code> to avoid heap allocations.',
        'Always handle the case where <code>SetResult/SetException</code> might be called multiple times — subsequent calls throw <code>InvalidOperationException</code>. Use <code>TrySetResult()</code> to avoid this.',
      ],
    },
    {
      heading: 'CancellationToken and linked sources',
      points: [
        'Pass a <code>CancellationToken</code> to every method that accepts one. Cooperative cancellation means the called code must check the token — it is never forcibly aborted.',
        'Create tokens via <code>CancellationTokenSource</code>. Cancel with <code>.Cancel()</code> or set a timeout with <code>new CancellationTokenSource(TimeSpan.FromSeconds(10))</code>.',
        '<code>CancellationTokenSource.CreateLinkedTokenSource(t1, t2)</code> creates a new source that fires when EITHER input token is cancelled — useful for combining a request timeout with an application shutdown token.',
        'At natural checkpoints in loops or long operations, call <code>ct.ThrowIfCancellationRequested()</code>. This throws <code>OperationCanceledException</code> which is the correct way to signal cancellation.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Task.Run & WhenAll',
      language: 'csharp',
      code: `// ── 1. Task.Run for CPU-bound work ───────────────────────────────
// Expensive computation — offload to thread pool so UI thread stays responsive
public async Task<int[]> SortLargeArrayAsync(int[] data)
{
    // Task.Run queues the lambda on a thread pool thread
    return await Task.Run(() =>
    {
        Array.Sort(data);   // blocks the pool thread, NOT the caller
        return data;
    });
}

// ── 2. Task<T> returning a value ──────────────────────────────────
public async Task<string> GetUserNameAsync(int id)
{
    // Simulate DB call — returns value via Task<T>
    await Task.Delay(50);
    return \$"User_{id}";
}

// ── 3. Fan-out with Task.WhenAll ─────────────────────────────────
// Start all three tasks WITHOUT awaiting each in turn
Task<string> t1 = GetUserNameAsync(1);
Task<string> t2 = GetUserNameAsync(2);
Task<string> t3 = GetUserNameAsync(3);

// All three run concurrently — total time ≈ max(t1,t2,t3) not sum
string[] names = await Task.WhenAll(t1, t2, t3);
Console.WriteLine(string.Join(", ", names));
// Output: User_1, User_2, User_3

// ── 4. Collecting ALL exceptions from WhenAll ─────────────────────
var tasks = new[]
{
    Task.FromException<int>(new Exception("fail A")),
    Task.FromResult(42),
    Task.FromException<int>(new Exception("fail C")),
};

var combined = Task.WhenAll(tasks);
try   { await combined; }
catch { /* swallow to inspect all */ }

foreach (var ex in combined.Exception!.InnerExceptions)
    Console.WriteLine(ex.Message);  // fail A, fail C`,
    },
    {
      label: 'WhenAny & Timeout',
      language: 'csharp',
      code: `// ── 1. WhenAny — first to complete wins ──────────────────────────
async Task<string> SlowSource()  { await Task.Delay(2000); return "slow"; }
async Task<string> FastSource()  { await Task.Delay(200);  return "fast"; }

Task<string> slow = SlowSource();
Task<string> fast = FastSource();

Task<string> winner = await Task.WhenAny(slow, fast);
Console.WriteLine(await winner);   // "fast"

// ── 2. Timeout pattern ────────────────────────────────────────────
async Task<string> DoWorkWithTimeoutAsync(CancellationToken ct)
{
    using var cts     = CancellationTokenSource.CreateLinkedTokenSource(ct);
    var workTask      = DoExpensiveWorkAsync(cts.Token);
    var timeoutTask   = Task.Delay(TimeSpan.FromSeconds(5), ct);

    var completed = await Task.WhenAny(workTask, timeoutTask);

    if (completed == timeoutTask)
    {
        await cts.CancelAsync();   // cancel the work
        throw new TimeoutException("Work did not complete within 5 s");
    }

    return await workTask;   // re-await to propagate exceptions
}

// ── 3. Race multiple data sources ─────────────────────────────────
async Task<UserProfile> GetProfileAsync(int userId, CancellationToken ct)
{
    using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);

    // Try cache and database simultaneously; use whichever responds first
    Task<UserProfile?> cacheTask  = _cache.GetAsync(userId, cts.Token);
    Task<UserProfile>  dbTask     = _db.GetUserAsync(userId, cts.Token);

    Task first = await Task.WhenAny(cacheTask, dbTask);

    if (first == cacheTask && await cacheTask is { } cached)
    {
        await cts.CancelAsync();  // no need for DB result
        return cached;
    }

    return await dbTask;
}

// ── 4. ContinueWith (legacy — prefer await instead) ───────────────
// Old-style continuation chaining — avoid in new code
Task<int> legacyWork = Task.Run(() => 42);
Task<string> formatted = legacyWork.ContinueWith(
    t => \$"Result: {t.Result}",
    TaskContinuationOptions.OnlyOnRanToCompletion);

// Modern equivalent (always prefer this):
int result  = await Task.Run(() => 42);
string msg  = \$"Result: {result}";`,
    },
    {
      label: 'Parallel & PLINQ',
      language: 'csharp',
      code: `using System.Collections.Concurrent;

// ── 1. Parallel.ForEach ───────────────────────────────────────────
// Process a large list of files in parallel — CPU-bound work
var files    = Directory.GetFiles(@"C:\Data", "*.csv");
var results  = new ConcurrentBag<string>();

Parallel.ForEach(files, new ParallelOptions
{
    MaxDegreeOfParallelism = Environment.ProcessorCount,
    CancellationToken      = ct,
}, file =>
{
    string content = File.ReadAllText(file);   // CPU-bound: parse CSV
    results.Add(ProcessCsv(content));
});

// ── 2. Parallel.For ───────────────────────────────────────────────
int[] squares = new int[1000];
Parallel.For(0, 1000, i =>
{
    squares[i] = i * i;   // safe: each iteration writes to a unique index
});

// ── 3. PLINQ with AsParallel ──────────────────────────────────────
int[] data = Enumerable.Range(1, 10_000_000).ToArray();

// Sequential LINQ:
var seq = data.Where(x => x % 2 == 0).Select(x => x * x).Sum();

// Parallel LINQ — same syntax, runs on multiple cores:
long pSum = data
    .AsParallel()
    .WithDegreeOfParallelism(Environment.ProcessorCount)
    .WithCancellation(ct)
    .Where(x => x % 2 == 0)
    .Select(x => (long)(x * x))
    .Sum();

// ── 4. PLINQ with ordering preserved ─────────────────────────────
// By default PLINQ does NOT preserve order (faster).
// AsOrdered() re-enables ordering at a performance cost.
var ordered = data
    .AsParallel()
    .AsOrdered()
    .Select(x => x * 2)
    .Take(100)
    .ToList();

// ── 5. Parallel vs async — know the difference ────────────────────
// WRONG: Parallel.ForEach with async lambdas doesn't work as expected
// The lambda returns Task which Parallel.ForEach ignores — fire-and-forget!
// Parallel.ForEach(urls, async url => { await _http.GetStringAsync(url); }); // BAD

// RIGHT for async I/O work: use Task.WhenAll instead
var downloadTasks = urls.Select(url => _http.GetStringAsync(url));
string[] pages    = await Task.WhenAll(downloadTasks);

static string ProcessCsv(string content) => content.ToUpper();`,
    },
    {
      label: 'TaskCompletionSource',
      language: 'csharp',
      code: `// TaskCompletionSource bridges callback/event APIs into the Task model.

// ── 1. Wrapping a callback-based API ─────────────────────────────
// Imagine a legacy API: void ReadAsync(Action<byte[]> onComplete, Action<Exception> onError)
public Task<byte[]> ReadLegacyAsync()
{
    var tcs = new TaskCompletionSource<byte[]>(
        TaskCreationOptions.RunContinuationsAsynchronously);

    _legacyClient.ReadAsync(
        onComplete: data => tcs.SetResult(data),
        onError:    ex   => tcs.SetException(ex));

    return tcs.Task;   // caller can await this
}

// ── 2. Wrapping an event ──────────────────────────────────────────
public Task<bool> WaitForConnectionAsync(CancellationToken ct = default)
{
    var tcs = new TaskCompletionSource<bool>(
        TaskCreationOptions.RunContinuationsAsynchronously);

    EventHandler? handler = null;
    handler = (_, _) =>
    {
        _connection.Connected -= handler;
        tcs.TrySetResult(true);   // TrySet* is safe if called multiple times
    };

    _connection.Connected += handler;

    // Support cancellation
    ct.Register(() =>
    {
        _connection.Connected -= handler;
        tcs.TrySetCanceled(ct);
    });

    return tcs.Task;
}

// ── 3. Manual signal (like ManualResetEvent but async) ────────────
public class AsyncGate
{
    private TaskCompletionSource _tcs = new(TaskCreationOptions.RunContinuationsAsynchronously);

    // Callers await this — they block until Open() is called
    public Task WaitAsync() => _tcs.Task;

    public void Open()
    {
        _tcs.TrySetResult();
        // Reset for next use
        _tcs = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
    }
}

// Usage:
var gate = new AsyncGate();

// Producer opens the gate after setup
_ = Task.Run(async () => { await Task.Delay(500); gate.Open(); });

// Multiple consumers can await the same gate
await gate.WaitAsync();
Console.WriteLine("Gate opened!");`,
    },
  ];

  challenge: Challenge = {
    title: 'Parallel Image Processor',
    description: `Implement a ParallelImageProcessor that processes a list of image file paths concurrently using Parallel.ForEach, then aggregates statistics.

Requirements:
1. Use Parallel.ForEach with MaxDegreeOfParallelism = Environment.ProcessorCount
2. Accept a CancellationToken via ParallelOptions
3. For each file path, call the provided ProcessImage(string path) method (returns ImageStats)
4. Collect all ImageStats results thread-safely using ConcurrentBag<T>
5. Return a Summary record with: TotalImages, AverageWidthPx, AverageHeightPx, FailedCount
6. Handle exceptions per item without stopping the entire loop — track failed items`,
    language: 'csharp',
    hints: [
      'Use ConcurrentBag<ImageStats> for thread-safe collection across parallel iterations',
      'Wrap ProcessImage() in a try/catch inside the loop body; increment a thread-safe counter on failure using Interlocked.Increment',
      'Pass new ParallelOptions { MaxDegreeOfParallelism = ..., CancellationToken = ct }',
      'Compute averages from the ConcurrentBag after Parallel.ForEach completes',
    ],
    starterCode: `public record ImageStats(int WidthPx, int HeightPx);
public record Summary(int TotalImages, double AverageWidthPx, double AverageHeightPx, int FailedCount);

public class ParallelImageProcessor
{
    // Simulate image processing — do not modify
    private ImageStats ProcessImage(string path)
    {
        if (path.Contains("bad")) throw new InvalidOperationException("Corrupt file");
        var rng = new Random(path.GetHashCode());
        return new ImageStats(rng.Next(100, 4000), rng.Next(100, 3000));
    }

    public Summary Process(IEnumerable<string> paths, CancellationToken ct = default)
    {
        // TODO: implement parallel processing
        throw new NotImplementedException();
    }
}`,
    solution: `public record ImageStats(int WidthPx, int HeightPx);
public record Summary(int TotalImages, double AverageWidthPx, double AverageHeightPx, int FailedCount);

public class ParallelImageProcessor
{
    private ImageStats ProcessImage(string path)
    {
        if (path.Contains("bad")) throw new InvalidOperationException("Corrupt file");
        var rng = new Random(path.GetHashCode());
        return new ImageStats(rng.Next(100, 4000), rng.Next(100, 3000));
    }

    public Summary Process(IEnumerable<string> paths, CancellationToken ct = default)
    {
        var stats   = new ConcurrentBag<ImageStats>();
        int failed  = 0;

        Parallel.ForEach(paths, new ParallelOptions
        {
            MaxDegreeOfParallelism = Environment.ProcessorCount,
            CancellationToken      = ct,
        }, path =>
        {
            try
            {
                stats.Add(ProcessImage(path));
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                Interlocked.Increment(ref failed);
            }
        });

        return stats.Count == 0
            ? new Summary(0, 0, 0, failed)
            : new Summary(
                TotalImages:    stats.Count,
                AverageWidthPx: stats.Average(s => s.WidthPx),
                AverageHeightPx: stats.Average(s => s.HeightPx),
                FailedCount:    failed);
    }
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'When should you use Task.Run() vs directly awaiting an async method?',
      options: [
        'Task.Run() should always be used to ensure work runs on a thread pool thread',
        'Task.Run() is for CPU-bound synchronous work; await an async method directly for I/O-bound operations',
        'They are interchangeable — Task.Run() is just a verbose way to call async methods',
        'Task.Run() is only needed in console applications, not ASP.NET',
      ],
      answer: 1,
      explanation: '<code>Task.Run()</code> queues a synchronous delegate to the thread pool — it is designed for CPU-bound work that would otherwise block the caller. I/O-bound async methods already release the calling thread via <code>await</code>; wrapping them in <code>Task.Run()</code> wastes an extra thread pool thread and adds overhead without benefit.',
    },
    {
      q: 'What happens when you use Parallel.ForEach with an async lambda?',
      options: [
        'It works correctly — Parallel.ForEach automatically awaits each async lambda',
        'A compile error occurs because Parallel.ForEach does not accept async delegates',
        'The async lambda returns a Task that Parallel.ForEach ignores, creating fire-and-forget tasks',
        'Parallel.ForEach runs async lambdas sequentially to avoid race conditions',
      ],
      answer: 2,
      explanation: '<code>Parallel.ForEach</code> has an <code>Action&lt;T&gt;</code> parameter. An async lambda matches <code>async void</code>, so <code>Parallel.ForEach</code> fires off each lambda and immediately moves to the next iteration without waiting for the async work to complete. This creates unobserved fire-and-forget tasks. For async I/O fan-out, use <code>Task.WhenAll(items.Select(async item => ...))</code>.',
    },
    {
      q: 'What is the correct way to observe ALL exceptions from Task.WhenAll when multiple tasks fail?',
      options: [
        'Catch AggregateException directly and inspect its InnerExceptions property',
        'Use a try/catch around await Task.WhenAll — each exception is thrown separately',
        'Store the Task returned by Task.WhenAll before awaiting it; after catching, inspect .Exception.InnerExceptions',
        'Task.WhenAll never throws — failed tasks are silently ignored',
      ],
      answer: 2,
      explanation: 'When you <code>await Task.WhenAll(...)</code>, only the first exception is re-thrown. To see all failures, save the Task first: <code>var t = Task.WhenAll(...); try { await t; } catch { }</code>. Then inspect <code>t.Exception!.InnerExceptions</code> — this contains every exception from every failed task.',
    },
    {
      q: 'What is TaskCompletionSource used for?',
      options: [
        'Automatically completing tasks after a set timeout',
        'Bridging callback-based or event-based APIs into the awaitable Task model',
        'Measuring the elapsed time of a Task',
        'Limiting how many Tasks can run simultaneously',
      ],
      answer: 1,
      explanation: '<code>TaskCompletionSource&lt;T&gt;</code> lets you create a <code>Task&lt;T&gt;</code> whose completion you control manually. You call <code>SetResult()</code>, <code>SetException()</code>, or <code>SetCanceled()</code> when the underlying callback/event fires. This is the standard way to make legacy APM (begin/end), callback-based, or event-driven APIs awaitable with modern async/await code.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between Task.WhenAll and Parallel.ForEach?',
      a: `Both run work concurrently, but they are designed for different scenarios.<br><br>
<strong>Task.WhenAll</strong> is async — it does NOT block the calling thread. Each task is typically an I/O-bound async operation (HTTP call, DB query) that releases its thread while waiting. <code>WhenAll</code> simply awaits all of them and collects results.<br><br>
<strong>Parallel.ForEach</strong> is synchronous — it blocks the calling thread until all work completes. It partitions the workload across multiple thread pool threads. It is designed for CPU-bound work where you actually want to use all CPU cores simultaneously.<br><br>
Rule of thumb: async fan-out → <code>Task.WhenAll</code>; CPU-bound parallel loops → <code>Parallel.ForEach</code>.`,
    },
    {
      q: 'How do I limit concurrency when using Task.WhenAll?',
      a: `<code>Task.WhenAll</code> has no built-in concurrency cap — if you pass 1,000 tasks it starts all 1,000 simultaneously, which can overwhelm downstream services or the thread pool.<br><br>
The standard solution is <strong>SemaphoreSlim</strong>:<br>
<pre>var sem = new SemaphoreSlim(10); // max 10 at a time
var tasks = items.Select(async item => {
    await sem.WaitAsync(ct);
    try   { return await ProcessAsync(item, ct); }
    finally { sem.Release(); }
});
var results = await Task.WhenAll(tasks);</pre>
Other options include <code>ActionBlock&lt;T&gt;</code> from <code>System.Threading.Tasks.Dataflow</code> (NuGet) for pipeline-style processing, or <code>Channel&lt;T&gt;</code> for producer-consumer patterns.`,
    },
    {
      q: 'When should I use PLINQ versus Parallel.ForEach?',
      a: `Both are for CPU-bound parallel work. The choice is mostly about coding style:<br><br>
<strong>PLINQ</strong> (<code>.AsParallel()</code>) is best when you already have a LINQ query chain and want to parallelise it. It integrates naturally with <code>Where</code>, <code>Select</code>, <code>GroupBy</code>, etc. It returns a sequence.<br><br>
<strong>Parallel.ForEach</strong> is better for imperative loops where you mutate shared state (e.g. adding to a <code>ConcurrentBag</code>), perform side effects, or need fine control over partitioning.<br><br>
Performance nuances: PLINQ has partitioner overhead and may perform worse than sequential LINQ for small collections. Always benchmark before parallelising — the break-even point is typically tens of thousands of items or significant per-item CPU work.`,
    },
    {
      q: 'How does CancellationTokenSource.CreateLinkedTokenSource work?',
      a: `It creates a new <code>CancellationTokenSource</code> that is cancelled when ANY of the supplied input tokens are cancelled.<br><br>
<pre>using var linked = CancellationTokenSource
    .CreateLinkedTokenSource(requestToken, shutdownToken);</pre>
The linked token fires if: the HTTP request is aborted (<code>requestToken</code>), or the app is shutting down (<code>shutdownToken</code>), or you explicitly call <code>linked.Cancel()</code>.<br><br>
This is essential in ASP.NET Core where you want to honour both the HTTP request's <code>HttpContext.RequestAborted</code> token AND a global <code>IHostApplicationLifetime.ApplicationStopping</code> token. Always dispose the linked source when done to avoid token registration leaks.`,
    },
  ];
}
