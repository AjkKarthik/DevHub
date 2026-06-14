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
  selector: 'app-csharp-tasks',
  standalone: true,
  imports: [
    CommonModule, CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
    CommonMistakesComponent, RevisionCardComponent,
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
    { name: 'Task.FromResult()',        type: 'method',  desc: 'Returns an already-completed Task<T> wrapping a known value — avoids heap allocation for synchronous paths.' },
    { name: 'Task.FromException()',     type: 'method',  desc: 'Returns a faulted Task<T> wrapping a given exception. Useful for synchronous error paths in async methods.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Task.Run is for CPU-bound work',
      points: [
        '<code>Task.Run()</code> queues a delegate on the .NET thread pool. Use it when you have expensive synchronous CPU work (sorting, encryption, image processing, large computations) that would block the calling thread.',
        'For I/O-bound work (HTTP calls, file reads, database queries) you should <strong>not</strong> use <code>Task.Run()</code>. I/O-bound async methods already release the thread via <code>await</code>; wrapping them in <code>Task.Run()</code> wastes a thread pool thread.',
        '<code>Task.Run()</code> returns a <code>Task&lt;T&gt;</code> — you can <code>await</code> it normally. The calling thread (e.g. the UI thread) is freed while the background thread does the work.',
        'Avoid <code>Task.Run()</code> in ASP.NET Core request handlers for I/O work — the request already runs on a pool thread; offloading to another pool thread adds overhead without benefit.',
        'In UI apps (WinForms, WPF, MAUI), <code>Task.Run()</code> is the correct tool to offload heavy computation from the UI thread: <code>var result = await Task.Run(() => HeavyCompute(data));</code> — then update the UI after the await.',
      ],
    },
    {
      heading: 'Fan-out with WhenAll and WhenAny',
      points: [
        '<code>Task.WhenAll(t1, t2, t3)</code> starts all tasks concurrently (they are already running when passed in) and returns a new Task that completes when <em>all</em> finish. Total time ≈ the slowest task, not the sum.',
        'If any task faults, <code>WhenAll</code> re-throws the <em>first</em> exception when awaited. To observe <strong>all</strong> exceptions, store the Task before awaiting and inspect <code>.Exception!.InnerExceptions</code> after catching.',
        '<code>Task.WhenAny(t1, t2)</code> returns as soon as the <em>first</em> task completes (successfully or faulted). The other tasks keep running — cancel them explicitly if you no longer need their results.',
        'A classic use of <code>WhenAny</code> is the timeout pattern: race the real work against a <code>Task.Delay(timeout)</code> and throw <code>TimeoutException</code> if the delay wins.',
        'Do not pass tasks to <code>WhenAll</code>/<code>WhenAny</code> using <code>await</code> inside the call: <code>await Task.WhenAll(await t1, await t2)</code> would run them sequentially. Start tasks first, then pass the running Task objects.',
      ],
    },
    {
      heading: 'Parallel.ForEach and PLINQ',
      points: [
        '<code>Parallel.ForEach</code> partitions a collection across thread pool threads. It is synchronous — the caller blocks until all work completes. It is ideal for CPU-bound per-item processing where you want to utilise all CPU cores.',
        'Use <code>ParallelOptions.MaxDegreeOfParallelism</code> to cap the number of threads (e.g. <code>Environment.ProcessorCount</code>). Unbounded parallelism can thrash the thread pool and cause performance regressions.',
        'PLINQ (<code>.AsParallel()</code>) integrates parallelism into LINQ query chains. It automatically partitions the source and merges results. Use <code>.WithDegreeOfParallelism(n)</code> and <code>.WithCancellation(ct)</code>.',
        'Both <code>Parallel.ForEach</code> and PLINQ are for CPU-bound work. Do NOT use them for I/O-bound async operations — thread blocking defeats the purpose and can actually hurt throughput.',
        'Shared mutable state inside a parallel loop requires thread-safe types: <code>ConcurrentBag&lt;T&gt;</code>, <code>ConcurrentDictionary&lt;K,V&gt;</code>, or <code>Interlocked</code> operations. Regular lists and dictionaries will corrupt under concurrent writes.',
      ],
    },
    {
      heading: 'TaskCompletionSource bridges old APIs',
      points: [
        '<code>TaskCompletionSource&lt;T&gt;</code> gives you a Task whose completion you control manually. Call <code>.SetResult(value)</code>, <code>.SetException(ex)</code>, or <code>.SetCanceled()</code> when the underlying operation finishes.',
        'It is the standard way to wrap event-driven or callback-based APIs (e.g. Socket callbacks, timer events, legacy APM patterns) so that callers can <code>await</code> them.',
        'Always pass <code>TaskCreationOptions.RunContinuationsAsynchronously</code> when creating a <code>TaskCompletionSource</code>. Without it, calling <code>SetResult()</code> runs continuations synchronously on the thread that calls <code>SetResult</code>, risking deadlocks.',
        'Use <code>TrySetResult()</code> / <code>TrySetException()</code> instead of <code>SetResult()</code> when completion may be signalled from multiple code paths — the <code>Try*</code> variants return <code>false</code> on a second call instead of throwing.',
        'For value types on hot paths, <code>ManualResetValueTaskSourceCore&lt;T&gt;</code> is a higher-performance alternative to <code>TaskCompletionSource</code> — it avoids Task heap allocation by pooling the source object. This is for advanced library authors only.',
      ],
    },
    {
      heading: 'CancellationToken and linked sources',
      points: [
        'Pass a <code>CancellationToken</code> to every method that accepts one. Cooperative cancellation means the called code must check the token — it is never forcibly aborted.',
        'Create tokens via <code>CancellationTokenSource</code>. Cancel with <code>.Cancel()</code> or set a timeout with <code>new CancellationTokenSource(TimeSpan.FromSeconds(10))</code>.',
        '<code>CancellationTokenSource.CreateLinkedTokenSource(t1, t2)</code> creates a new source that fires when <em>either</em> input token is cancelled — essential for combining a request-abort token with an application-shutdown token.',
        'At natural checkpoints in loops or long operations, call <code>ct.ThrowIfCancellationRequested()</code>. This throws <code>OperationCanceledException</code> which is the correct way to signal cancellation.',
        'Always dispose <code>CancellationTokenSource</code> and linked sources with <code>using</code> — each registered callback is a GC root until the source is disposed. Undisposed linked sources are a common memory leak in high-throughput servers.',
      ],
    },
    {
      heading: 'Task.FromResult, FromException, and completed tasks',
      points: [
        '<code>Task.FromResult(value)</code> returns an already-completed <code>Task&lt;T&gt;</code> without any async overhead — no state machine, no thread switch. Use it in interface implementations whose synchronous path satisfies the contract.',
        '<code>Task.FromException&lt;T&gt;(ex)</code> returns a faulted Task — useful for synchronous error paths in async interfaces so callers can handle both sync and async errors uniformly.',
        '<code>Task.CompletedTask</code> is the singleton completed <code>Task</code> (no result). Return it from <code>async Task</code> implementations that complete synchronously.',
        'These helpers avoid the overhead of <code>async</code> state machine allocation and thread pool scheduling — important on hot paths like cache-hit branches in an <code>IRepository</code> implementation.',
        'Be careful: <code>Task.FromResult()</code> is fine to call, but if you cache the Task itself, make sure the result is immutable. Never cache a Task that wraps a mutable object and return it to multiple callers.',
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
    await Task.Delay(50);
    return $"User_{id}";
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

    return await workTask;   // re-await to propagate any exceptions
}

// ── 3. Race multiple data sources ─────────────────────────────────
async Task<UserProfile?> GetProfileFastAsync(int userId, CancellationToken ct)
{
    using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);

    // Try cache and database simultaneously; use whichever responds first
    Task<UserProfile?> cacheTask  = _cache.GetAsync(userId, cts.Token);
    Task<UserProfile?> dbTask     = _db.GetUserAsync(userId, cts.Token);

    Task<UserProfile?> first = (Task<UserProfile?>) await Task.WhenAny(cacheTask, dbTask);

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
    t => $"Result: {t.Result}",
    TaskContinuationOptions.OnlyOnRanToCompletion);

// Modern equivalent (always prefer this):
int result  = await Task.Run(() => 42);
string msg  = $"Result: {result}";`,
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
// WRONG: Parallel.ForEach with async lambdas — fire-and-forget!
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
    // RunContinuationsAsynchronously prevents SetResult from running
    // continuations synchronously on the calling thread (avoids deadlocks)
    var tcs = new TaskCompletionSource<byte[]>(
        TaskCreationOptions.RunContinuationsAsynchronously);

    _legacyClient.ReadAsync(
        onComplete: data => tcs.TrySetResult(data),
        onError:    ex   => tcs.TrySetException(ex));

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

    ct.Register(() =>
    {
        _connection.Connected -= handler;
        tcs.TrySetCanceled(ct);
    });

    return tcs.Task;
}

// ── 3. Manual async gate (async ManualResetEvent) ─────────────────
public class AsyncGate
{
    private TaskCompletionSource _tcs = new(TaskCreationOptions.RunContinuationsAsynchronously);

    public Task WaitAsync() => _tcs.Task;

    public void Open()
    {
        _tcs.TrySetResult();
        // Reset so the gate can be used again
        _tcs = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
    }
}

// Usage:
var gate = new AsyncGate();

_ = Task.Run(async () => { await Task.Delay(500); gate.Open(); });

await gate.WaitAsync();
Console.WriteLine("Gate opened!");`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Parallel.ForEach with async lambda — silent fire-and-forget',
      wrong: `// async lambda matches Action<T> via async void — tasks are NOT awaited
Parallel.ForEach(urls, async url =>
{
    string html = await _http.GetStringAsync(url);  // returns Task
    results.Add(html);
});
// Parallel.ForEach completes immediately — downloads are still in flight
// results is empty; exceptions are unobservable; app may exit before they finish`,
      right: `// For async I/O fan-out: use Task.WhenAll
var tasks = urls.Select(url => _http.GetStringAsync(url));
string[] pages = await Task.WhenAll(tasks);

// With concurrency limit:
var sem = new SemaphoreSlim(10);
var tasks = urls.Select(async url =>
{
    await sem.WaitAsync();
    try   { return await _http.GetStringAsync(url); }
    finally { sem.Release(); }
});
string[] pages = await Task.WhenAll(tasks);

// Parallel.ForEach is ONLY for synchronous CPU-bound work:
Parallel.ForEach(files, file => results.Add(ParseCsv(File.ReadAllText(file))));`,
      explanation: 'Parallel.ForEach takes an Action<T> parameter. An async lambda becomes async void — Parallel.ForEach fires each lambda and moves on immediately, ignoring the returned Task. Downloads run as unobserved fire-and-forget operations: exceptions are lost, results are incomplete, and execution may end before work finishes. For async I/O concurrency, use Task.WhenAll with Select.',
    },
    {
      title: 'Using Task.Run for I/O-bound async methods — wastes a thread',
      wrong: `// HttpClient.GetStringAsync is already async — it releases the thread via await
// Wrapping it in Task.Run wastes a thread pool thread for nothing
public async Task<string> GetDataAsync(string url)
{
    // Task.Run occupies a thread pool thread just to start the I/O call
    return await Task.Run(async () => await _http.GetStringAsync(url));
}

// Even worse — double thread hop with no benefit:
return await Task.Run(() => _http.GetStringAsync(url).Result);`,
      right: `// For I/O-bound work: await directly, no Task.Run needed
public async Task<string> GetDataAsync(string url)
{
    return await _http.GetStringAsync(url);
}

// Task.Run is ONLY needed for CPU-bound synchronous work:
public async Task<int[]> SortAsync(int[] data)
{
    return await Task.Run(() => { Array.Sort(data); return data; });
}`,
      explanation: 'I/O-bound async methods (HttpClient, DbContext, FileStream) already use the OS async I/O infrastructure — they release the calling thread while the operation is in-flight. Wrapping them in Task.Run occupies a thread pool thread the entire time for no reason, reducing throughput under load. Reserve Task.Run for CPU-bound synchronous work that would otherwise block the caller.',
    },
    {
      title: 'Only catching the first WhenAll exception — missing all failures',
      wrong: `// WhenAll re-throws only the FIRST exception from the aggregate
try
{
    await Task.WhenAll(task1, task2, task3);  // 3 tasks may all fail
}
catch (Exception ex)
{
    // Only task1's exception is seen — task2 and task3's exceptions are lost
    _logger.LogError(ex, "A task failed");
}`,
      right: `// Store the Task BEFORE awaiting so you can inspect all exceptions after
var all = Task.WhenAll(task1, task2, task3);
try
{
    await all;
}
catch
{
    // Inspect every failure
    foreach (var ex in all.Exception!.InnerExceptions)
        _logger.LogError(ex, "Task failed: {Message}", ex.Message);

    // Or collect and rethrow as AggregateException:
    throw all.Exception!;
}`,
      explanation: 'Task.WhenAll wraps all task exceptions in an AggregateException, but when you await it, only the first inner exception is unwrapped and re-thrown. If three tasks all fail, you only see the first failure. To observe all errors, save the Task returned by WhenAll, swallow in the catch block, then inspect the .Exception.InnerExceptions collection for the full picture.',
    },
    {
      title: 'Forgetting to dispose CancellationTokenSource — callback leak',
      wrong: `// CancellationTokenSource never disposed — registered callbacks are GC roots
public async Task ProcessRequestAsync(HttpContext context)
{
    var cts = new CancellationTokenSource(TimeSpan.FromSeconds(30));
    using var linked = CancellationTokenSource
        .CreateLinkedTokenSource(cts.Token, context.RequestAborted);
    // ... but cts is never disposed!
    await DoWorkAsync(linked.Token);
    // After the method returns, cts holds registered callbacks alive
}

// In a high-throughput server, millions of undisposed CTSs = memory leak`,
      right: `// Always use 'using' for CancellationTokenSource
public async Task ProcessRequestAsync(HttpContext context)
{
    using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(30));
    using var linked = CancellationTokenSource
        .CreateLinkedTokenSource(cts.Token, context.RequestAborted);

    await DoWorkAsync(linked.Token);
}   // cts and linked are both disposed here — registrations cleaned up`,
      explanation: 'Each CancellationToken.Register() call adds a delegate to a linked list inside the CancellationTokenSource. If the source is never disposed, those callbacks remain rooted in memory for as long as the tokens that were linked to it are alive. In high-throughput servers processing thousands of requests per second, undisposed CancellationTokenSources become a significant memory leak. Always dispose them with using.',
    },
    {
      title: 'TaskCompletionSource without RunContinuationsAsynchronously — synchronous deadlock',
      wrong: `// Without RunContinuationsAsynchronously, SetResult runs continuations
// synchronously on the thread that calls SetResult
var tcs = new TaskCompletionSource<int>();  // default options

// In a lock or event handler — continuation runs HERE
lock (_lock)
{
    tcs.SetResult(42);
    // If the continuation also tries to acquire _lock → DEADLOCK
    // Or if it does expensive work → blocks this thread
}`,
      right: `// Always pass RunContinuationsAsynchronously for safety
var tcs = new TaskCompletionSource<int>(
    TaskCreationOptions.RunContinuationsAsynchronously);

lock (_lock)
{
    tcs.SetResult(42);
    // Continuations are posted to the thread pool — lock released first
}   // Safe — the lock is released before the continuation runs

// Also use TrySet* to handle races gracefully:
tcs.TrySetResult(42);    // returns false if already completed — no exception`,
      explanation: 'By default, calling SetResult() runs all awaiting continuations synchronously on the same thread — before SetResult() even returns. If that thread holds a lock, has limited stack, or is a callback from an unmanaged API, the synchronous continuation execution can cause deadlocks, stack overflows, or reentrancy bugs. TaskCreationOptions.RunContinuationsAsynchronously posts continuations to the thread pool instead, safely decoupling them from the completing thread.',
    },
  ];

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
        'Catch AggregateException directly — it is always thrown by await when WhenAll is used',
        'Use a try/catch around await Task.WhenAll — each exception is thrown separately in turn',
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
    {
      q: 'What is the purpose of TaskCreationOptions.RunContinuationsAsynchronously on a TaskCompletionSource?',
      options: [
        'It causes the Task to run on a dedicated background thread instead of the thread pool',
        'It prevents SetResult from running awaiting continuations synchronously on the thread that calls SetResult',
        'It makes the Task non-cancelable',
        'It allows the Task to be awaited multiple times',
      ],
      answer: 1,
      explanation: 'By default, calling <code>SetResult()</code> runs all continuations synchronously on the same thread — before <code>SetResult()</code> returns. If that thread holds a lock or is a narrow callback, this causes deadlocks or reentrancy bugs. <code>RunContinuationsAsynchronously</code> posts continuations to the thread pool instead, safely decoupling them from the completing thread.',
    },
    {
      q: 'What does Task.FromResult<T>(value) do differently from an async method that returns value?',
      options: [
        'Task.FromResult() runs the value computation asynchronously on the thread pool',
        'They are identical — Task.FromResult() is just shorthand for an async method',
        'Task.FromResult() returns an already-completed Task with no state machine or thread pool allocation',
        'Task.FromResult() is deprecated in .NET 6+ in favour of ValueTask.FromResult()',
      ],
      answer: 2,
      explanation: '<code>Task.FromResult(value)</code> synchronously constructs a completed <code>Task&lt;T&gt;</code> with no async state machine, no thread switch, and minimal allocation. An <code>async</code> method that just returns a value still allocates a state machine struct and, on older runtimes, a Task object. <code>Task.FromResult()</code> is the idiomatic choice for synchronous paths in async interface implementations — for example, returning a cached value.',
    },
    {
      q: 'Which collection type is safe to use inside a Parallel.ForEach body when adding results?',
      options: [
        'List<T> — it is thread-safe by default in .NET 6+',
        'ConcurrentBag<T> — a thread-safe unordered collection designed for concurrent add/take patterns',
        'Array — concurrent writes to different indices are safe, so arrays can be shared freely',
        'IEnumerable<T> — it is immutable so it is always thread-safe',
      ],
      answer: 1,
      explanation: '<code>ConcurrentBag&lt;T&gt;</code> (and other types in <code>System.Collections.Concurrent</code> — <code>ConcurrentQueue</code>, <code>ConcurrentDictionary</code>, etc.) are specifically designed for thread-safe concurrent access. <code>List&lt;T&gt;</code> is NOT thread-safe for concurrent writes — concurrent adds can corrupt internal state. Arrays are safe for concurrent writes only if each write targets a distinct index (no false sharing of cache lines).',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between Task.WhenAll and Parallel.ForEach?',
      a: 'Both run work concurrently, but they are designed for different scenarios. <strong>Task.WhenAll</strong> is async — it does NOT block the calling thread. Each task is typically an I/O-bound async operation (HTTP call, DB query) that releases its thread while waiting. <code>WhenAll</code> simply awaits all of them and collects results. <strong>Parallel.ForEach</strong> is synchronous — it blocks the calling thread until all work completes. It partitions the workload across multiple thread pool threads and is designed for CPU-bound work where you actually want to use all CPU cores simultaneously. Rule of thumb: async fan-out → <code>Task.WhenAll</code>; CPU-bound parallel loops → <code>Parallel.ForEach</code>.',
    },
    {
      q: 'How do I limit concurrency when using Task.WhenAll?',
      a: '<code>Task.WhenAll</code> has no built-in concurrency cap — if you pass 1,000 tasks it starts all 1,000 simultaneously, which can overwhelm downstream services or the thread pool. The standard solution is <strong>SemaphoreSlim</strong>: create one with the max concurrency count, call <code>await sem.WaitAsync()</code> before starting each task, and <code>sem.Release()</code> in a finally block when done. Other options include <code>ActionBlock&lt;T&gt;</code> from <code>System.Threading.Tasks.Dataflow</code> for pipeline-style processing, or <code>Channel&lt;T&gt;</code> for producer-consumer patterns with backpressure.',
    },
    {
      q: 'When should I use PLINQ versus Parallel.ForEach?',
      a: 'Both are for CPU-bound parallel work. The choice is mostly about coding style. <strong>PLINQ</strong> (<code>.AsParallel()</code>) is best when you already have a LINQ query chain and want to parallelise it — it integrates naturally with <code>Where</code>, <code>Select</code>, <code>GroupBy</code>, etc. and returns a sequence. <strong>Parallel.ForEach</strong> is better for imperative loops where you mutate shared state (e.g. adding to a <code>ConcurrentBag</code>), perform side effects, or need fine control over partitioning. Performance nuance: PLINQ has partitioner overhead and may perform worse than sequential LINQ for small collections — always benchmark before parallelising.',
    },
    {
      q: 'How does CancellationTokenSource.CreateLinkedTokenSource work?',
      a: 'It creates a new <code>CancellationTokenSource</code> that is cancelled when ANY of the supplied input tokens are cancelled. The linked source fires if the HTTP request is aborted, the app is shutting down, or you explicitly call <code>linked.Cancel()</code>. This is essential in ASP.NET Core where you want to honour both the HTTP request\'s <code>HttpContext.RequestAborted</code> token AND a global <code>IHostApplicationLifetime.ApplicationStopping</code> token. Always dispose the linked source when done with <code>using</code> — failing to dispose leaks the token registrations as GC roots.',
    },
    {
      q: 'When should I use Task.FromResult instead of an async method?',
      a: '<code>Task.FromResult(value)</code> is the correct choice for synchronous paths inside async interface implementations — for example, returning a cached value in a repository, or providing a test double that completes immediately. It avoids allocating an async state machine and skips any thread switch overhead. Use it when: you implement an async interface but the specific path has a synchronous answer; you need to return a pre-computed result in a unit test fake; or you want to short-circuit async machinery on hot paths. Do NOT use it to "fake" async work — if the underlying operation is actually async, use a proper async method.',
    },
    {
      q: 'Why should I use TrySetResult instead of SetResult on a TaskCompletionSource?',
      a: 'A <code>TaskCompletionSource</code> can only be completed once. Calling <code>SetResult()</code> a second time throws <code>InvalidOperationException</code>. In concurrent scenarios (multiple callbacks, race between timeout and success, cancellation racing with completion) it is easy to call completion from two places. <code>TrySetResult()</code> (and the corresponding <code>TrySetException()</code>, <code>TrySetCanceled()</code>) returns <code>false</code> if the Task is already completed instead of throwing. This makes race conditions safe without requiring locking around the set call.',
    },
    {
      q: 'What is the difference between Parallel.ForEach and Parallel.ForEachAsync?',
      a: '<code>Parallel.ForEach</code> takes a synchronous <code>Action&lt;T&gt;</code> and is intended for CPU-bound work. Passing an async lambda produces <code>async void</code> — tasks run fire-and-forget. <code>Parallel.ForEachAsync</code> (.NET 6+) was introduced to address this: it takes a <code>Func&lt;T, CancellationToken, ValueTask&gt;</code> and properly awaits each item\'s async work. You can also set <code>ParallelOptions.MaxDegreeOfParallelism</code> to control concurrency. For most I/O-bound fan-out, however, <code>await Task.WhenAll(items.Select(async item => ...))</code> with a <code>SemaphoreSlim</code> for rate limiting is still the most readable and flexible approach.',
    },
  ];

  challenge: Challenge = {
    title: 'Parallel Image Processor',
    description: `Implement a <code>ParallelImageProcessor</code> that processes a list of image file paths concurrently using <code>Parallel.ForEach</code>, then aggregates statistics.

Requirements:
1. Use <code>Parallel.ForEach</code> with <code>MaxDegreeOfParallelism = Environment.ProcessorCount</code>
2. Accept a <code>CancellationToken</code> via <code>ParallelOptions</code>
3. For each file path, call the provided <code>ProcessImage(string path)</code> method (returns <code>ImageStats</code>)
4. Collect all <code>ImageStats</code> results thread-safely using <code>ConcurrentBag&lt;T&gt;</code>
5. Return a <code>Summary</code> record with: <code>TotalImages</code>, <code>AverageWidthPx</code>, <code>AverageHeightPx</code>, <code>FailedCount</code>
6. Handle exceptions per item without stopping the entire loop — track failed items`,
    language: 'csharp',
    hints: [
      'Use ConcurrentBag<ImageStats> for thread-safe collection across parallel iterations',
      'Wrap ProcessImage() in a try/catch inside the loop body; use Interlocked.Increment(ref failed) on failure',
      'Pass new ParallelOptions { MaxDegreeOfParallelism = Environment.ProcessorCount, CancellationToken = ct }',
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
        var stats  = new ConcurrentBag<ImageStats>();
        int failed = 0;

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
                TotalImages:     stats.Count,
                AverageWidthPx:  stats.Average(s => s.WidthPx),
                AverageHeightPx: stats.Average(s => s.HeightPx),
                FailedCount:     failed);
    }
}`,
  };

  revision: RevisionSummary = {
    oneLiner: 'Task.Run is for CPU-bound work only; Task.WhenAll fans out I/O-bound async concurrently; Parallel.ForEach fans out CPU-bound synchronously. Never use Parallel.ForEach with async lambdas. Always dispose CancellationTokenSource and use RunContinuationsAsynchronously on TaskCompletionSource.',
    mustKnow: [
      'Task.Run queues synchronous CPU-bound work to the thread pool — do NOT use it for async I/O methods that already release the thread.',
      'Task.WhenAll awaits all tasks concurrently — start tasks first, then pass running Task objects to WhenAll. Never await inside the call.',
      'When any WhenAll task faults, await re-throws only the first exception — store the Task and inspect .Exception.InnerExceptions for all failures.',
      'Parallel.ForEach is synchronous and CPU-bound — async lambdas create fire-and-forget async void tasks. Use Task.WhenAll for async I/O fan-out.',
      'TaskCompletionSource bridges callback/event APIs to awaitable Tasks — always use RunContinuationsAsynchronously and TrySet* methods.',
      'CancellationTokenSource.CreateLinkedTokenSource(t1, t2) fires when either token is cancelled — dispose the linked source to avoid callback leaks.',
      'Task.FromResult(), Task.CompletedTask, and Task.FromException() return synchronously-completed Tasks with no state machine overhead.',
    ],
    interviewFocus: [
      'Why can\'t you use Parallel.ForEach with async lambdas? (Action<T> parameter → async void → fire-and-forget Tasks)',
      'How do you observe all exceptions from Task.WhenAll? (Store the Task before await, inspect .Exception.InnerExceptions after catching)',
      'When is Task.Run appropriate vs directly awaiting? (CPU-bound sync work vs I/O-bound async methods)',
      'What does RunContinuationsAsynchronously do on TaskCompletionSource? (Posts continuations to thread pool instead of running them synchronously on SetResult thread)',
      'How do you limit concurrency with Task.WhenAll? (SemaphoreSlim — WaitAsync to acquire, Release in finally)',
    ],
  };
}
