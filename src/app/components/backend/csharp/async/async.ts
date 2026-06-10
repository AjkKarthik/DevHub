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
  selector: 'app-csharp-async',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './async.html',
  styleUrl: './async.scss',
})
export class CsharpAsync {

  quickRef: QuickRefItem[] = [
    { name: 'async',                 type: 'keyword', desc: 'Marks a method as asynchronous; enables use of await inside it. Returns Task, Task<T>, or ValueTask<T>.' },
    { name: 'await',                 type: 'keyword', desc: 'Suspends the current method until the awaited Task completes, without blocking the thread.' },
    { name: 'Task',                  type: 'class',   desc: 'Represents an asynchronous operation with no return value. The async equivalent of void.' },
    { name: 'Task<T>',               type: 'class',   desc: 'Represents an asynchronous operation that produces a result of type T.' },
    { name: 'ValueTask<T>',          type: 'class',   desc: 'A struct-based alternative to Task<T> that avoids heap allocation when the result is available synchronously.' },
    { name: 'CancellationToken',     type: 'class',   desc: 'Cooperative cancellation token passed through async call chains. Check IsCancellationRequested or call ThrowIfCancellationRequested().' },
    { name: 'ConfigureAwait(false)', type: 'method',  desc: 'Instructs the runtime not to marshal the continuation back to the original synchronisation context — essential in library code.' },
    { name: 'Task.WhenAll',          type: 'method',  desc: 'Awaits all supplied tasks concurrently. Throws AggregateException if any task faults.' },
    { name: 'Task.WhenAny',          type: 'method',  desc: 'Returns when the first of the supplied tasks completes. Useful for timeouts and race conditions.' },
    { name: 'IAsyncEnumerable<T>',   type: 'class',   desc: 'Async counterpart to IEnumerable<T>. Use with await foreach and yield return in async iterators.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'async/await is compiler sugar',
      points: [
        'The <code>async</code> keyword transforms the entire method into a state machine at compile time. The method returns a <code>Task</code> immediately to the caller.',
        '<code>await</code> marks a suspension point. If the awaited task is not yet complete, the method\'s execution is paused and the thread is returned to the thread pool.',
        'When the awaited task completes, the state machine resumes from the suspension point — without blocking any thread in the meantime.',
        'This makes I/O-bound work (HTTP calls, database queries, file reads) extremely cheap in terms of thread usage.',
      ],
    },
    {
      heading: 'Never block async code',
      points: [
        '<code>.Result</code>, <code>.Wait()</code>, and <code>GetAwaiter().GetResult()</code> on a <code>Task</code> block the calling thread synchronously.',
        'In environments with a synchronisation context (ASP.NET Framework, WinForms, WPF), blocking can cause a deadlock: the blocked thread holds the context while the async continuation waits for the same context to resume.',
        'In ASP.NET Core there is no synchronisation context, so blocking is less likely to deadlock — but it still wastes thread pool threads needlessly.',
        'The fix is simple: <strong>go async all the way</strong>. If you need to call async code from a synchronous entry point, use <code>Task.Run()</code> and <code>.GetAwaiter().GetResult()</code> only at the very top of the call chain, never deep inside library code.',
      ],
    },
    {
      heading: 'CancellationToken is cooperative',
      points: [
        'A <code>CancellationToken</code> is a lightweight struct that carries a cancellation signal. It does not forcibly abort a thread — the called code must check it.',
        'Pass the token to every async method that accepts one: <code>HttpClient.GetAsync(url, token)</code>, <code>DbContext.SaveChangesAsync(token)</code>, etc.',
        'At natural pause points in your own code call <code>token.ThrowIfCancellationRequested()</code> — it throws <code>OperationCanceledException</code> if cancelled.',
        'Create tokens via <code>CancellationTokenSource</code>. Combine multiple tokens (e.g. request timeout + user cancel) using <code>CancellationTokenSource.CreateLinkedTokenSource(t1, t2)</code>.',
      ],
    },
    {
      heading: 'Choose Task vs ValueTask',
      points: [
        '<code>Task</code> is a reference type — it is allocated on the heap every time an async method is called. For the vast majority of code this overhead is negligible.',
        '<code>ValueTask&lt;T&gt;</code> is a struct. When the result is <em>already available</em> (e.g. a cache hit), awaiting a <code>ValueTask</code> incurs zero heap allocation.',
        'Do not overuse <code>ValueTask</code>: it is slightly more complex to consume and should only replace <code>Task</code> on hot paths where profiling shows allocation pressure.',
        'Never await a <code>ValueTask</code> more than once, and never cache or share one — it is a single-use type.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'async/await Basics',
      language: 'csharp',
      code: `using System.Net.Http;
using System.Net.Http.Json;

// ── 1. Basic async method returning Task<T> ───────────────────────
public async Task<string> FetchPageAsync(string url)
{
    using var http = new HttpClient();

    // await suspends this method — thread is NOT blocked
    string html = await http.GetStringAsync(url);
    return html;
}

// ── 2. async method with try/catch ────────────────────────────────
public async Task<User?> GetUserAsync(int id)
{
    using var http = new HttpClient();

    try
    {
        // GetFromJsonAsync deserialises JSON directly
        var user = await http.GetFromJsonAsync<User>($"https://api.example.com/users/{id}");
        return user;
    }
    catch (HttpRequestException ex)
    {
        Console.WriteLine($"HTTP error: {ex.StatusCode}");
        return null;
    }
}

// ── 3. Returning Task (no value) ──────────────────────────────────
public async Task SendNotificationAsync(string message)
{
    await Task.Delay(100); // simulate async work
    Console.WriteLine($"Sent: {message}");
}

// ── 4. ConfigureAwait(false) in library code ──────────────────────
// Prevents the continuation from capturing the synchronisation context.
// Use in reusable library/infrastructure code — NOT in UI event handlers.
public async Task<byte[]> ReadBytesAsync(string path)
{
    using var fs = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read,
                                  bufferSize: 4096, useAsync: true);
    var buffer = new byte[fs.Length];

    // .ConfigureAwait(false) — safe for non-UI callers, avoids context switching overhead
    await fs.ReadAsync(buffer, 0, buffer.Length).ConfigureAwait(false);
    return buffer;
}

// ── 5. async void — EVENT HANDLERS ONLY ──────────────────────────
// Exceptions thrown inside async void are unobservable and will crash the app.
// Use async Task in all other cases.
private async void Button_Click(object sender, EventArgs e)
{
    string result = await FetchPageAsync("https://example.com");
    Console.WriteLine(result.Length);
}

record User(int Id, string Name);`,
    },
    {
      label: 'Parallelism',
      language: 'csharp',
      code: `// ── 1. Task.WhenAll — run all tasks concurrently ─────────────────
// Sequential (slow — ~3 s total):
var a = await GetDataAsync("A");  // waits 1 s
var b = await GetDataAsync("B");  // waits 1 s
var c = await GetDataAsync("C");  // waits 1 s

// Parallel (fast — ~1 s total):
Task<string> tA = GetDataAsync("A");
Task<string> tB = GetDataAsync("B");
Task<string> tC = GetDataAsync("C");

string[] results = await Task.WhenAll(tA, tB, tC); // all three run concurrently

// ── 2. Task.WhenAny — first to complete wins ──────────────────────
Task<string> fast   = GetDataAsync("fast");
Task<string> slow   = GetDataAsync("slow");
Task<string> first  = await Task.WhenAny(fast, slow);
Console.WriteLine(await first); // result of whichever finished first

// Timeout pattern using WhenAny:
var work    = DoWorkAsync();
var timeout = Task.Delay(TimeSpan.FromSeconds(5));

if (await Task.WhenAny(work, timeout) == timeout)
    throw new TimeoutException("Work did not complete in time");

string workResult = await work; // safe to await — already completed

// ── 3. Limiting concurrency with SemaphoreSlim ────────────────────
// Download 100 URLs but no more than 5 at a time
async Task DownloadAllAsync(IEnumerable<string> urls)
{
    var semaphore = new SemaphoreSlim(5); // max 5 concurrent
    var tasks = urls.Select(async url =>
    {
        await semaphore.WaitAsync();       // acquire a slot
        try
        {
            using var http = new HttpClient();
            string html = await http.GetStringAsync(url);
            Console.WriteLine($"Downloaded {url}: {html.Length} chars");
        }
        finally
        {
            semaphore.Release();           // always release
        }
    });

    await Task.WhenAll(tasks);
}

// ── 4. Collecting errors from Task.WhenAll ────────────────────────
try
{
    await Task.WhenAll(MayFailAsync("A"), MayFailAsync("B"), MayFailAsync("C"));
}
catch (Exception)
{
    // Task.WhenAll re-throws the FIRST exception
    // To see ALL exceptions, inspect the Task:
    var allTasks = new[] { MayFailAsync("A"), MayFailAsync("B") };
    var whenAll  = Task.WhenAll(allTasks);
    try { await whenAll; } catch { /* ignored */ }
    foreach (var ex in whenAll.Exception?.InnerExceptions ?? [])
        Console.WriteLine(ex.Message);
}

static Task<string> GetDataAsync(string key) =>
    Task.FromResult($"data-{key}");

static async Task DoWorkAsync() { await Task.Delay(2000); }
static async Task MayFailAsync(string key) { await Task.Delay(10); throw new Exception(key); }`,
    },
    {
      label: 'CancellationToken',
      language: 'csharp',
      code: `// ── 1. Passing CancellationToken through the call chain ───────────
public async Task<Order> ProcessOrderAsync(int orderId, CancellationToken ct = default)
{
    // Always forward ct to every awaited call
    var order   = await _repo.GetOrderAsync(orderId, ct);
    var payment = await _payments.ChargeAsync(order, ct);
    await _repo.SaveAsync(order, ct);
    return order;
}

// ── 2. Checking cancellation manually ─────────────────────────────
public async Task<List<string>> BatchProcessAsync(
    IEnumerable<string> items, CancellationToken ct)
{
    var results = new List<string>();
    foreach (var item in items)
    {
        // Cooperative check — throws OperationCanceledException if cancelled
        ct.ThrowIfCancellationRequested();

        string result = await ProcessItemAsync(item, ct);
        results.Add(result);
    }
    return results;
}

// ── 3. Creating and triggering cancellation ────────────────────────
using var cts = new CancellationTokenSource();

// Cancel after 10 seconds automatically
using var cts2 = new CancellationTokenSource(TimeSpan.FromSeconds(10));

// Manual cancel on user request:
_ = Task.Run(() =>
{
    Console.ReadKey();   // press any key to cancel
    cts.Cancel();
});

try
{
    await ProcessOrderAsync(42, cts.Token);
}
catch (OperationCanceledException)
{
    Console.WriteLine("Operation was cancelled.");
}

// ── 4. Linked token sources ────────────────────────────────────────
// Combine a request-scoped token (from ASP.NET) with a global shutdown token
public async Task HandleRequestAsync(
    CancellationToken requestToken,
    CancellationToken shutdownToken)
{
    using var linked = CancellationTokenSource
        .CreateLinkedTokenSource(requestToken, shutdownToken);

    // Cancelled if EITHER the request is aborted OR the app is shutting down
    await DoWorkAsync(linked.Token);
}

// ── 5. Handling OperationCanceledException properly ────────────────
try
{
    await LongOperationAsync(ct);
}
catch (OperationCanceledException ex) when (ex.CancellationToken == ct)
{
    // Only catch OUR cancellation — not some other token's
    Console.WriteLine("Cancelled as expected, cleaning up...");
    // Note: re-throw if you want the cancellation to propagate
    throw;
}

static async Task ProcessItemAsync(string item, CancellationToken ct) =>
    await Task.Delay(50, ct);
static async Task LongOperationAsync(CancellationToken ct) =>
    await Task.Delay(5000, ct);
static async Task DoWorkAsync(CancellationToken ct) =>
    await Task.Delay(1000, ct);`,
    },
    {
      label: 'Async Streams',
      language: 'csharp',
      code: `using System.Runtime.CompilerServices;

// ── 1. Producing an async stream with IAsyncEnumerable<T> ─────────
// yield return works inside async methods — items are pushed one at a time
public async IAsyncEnumerable<int> GenerateNumbersAsync(
    int count,
    [EnumeratorCancellation] CancellationToken ct = default)
{
    for (int i = 0; i < count; i++)
    {
        ct.ThrowIfCancellationRequested();
        await Task.Delay(100, ct); // simulate async work per item
        yield return i;
    }
}

// ── 2. Consuming with await foreach ───────────────────────────────
await foreach (int number in GenerateNumbersAsync(10))
{
    Console.WriteLine(number); // 0, 1, 2, ... 9 — one per 100 ms
}

// ── 3. Cancelling an async stream ─────────────────────────────────
using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(3));

try
{
    // WithCancellation pipes the token to [EnumeratorCancellation]
    await foreach (int n in GenerateNumbersAsync(100).WithCancellation(cts.Token))
    {
        Console.WriteLine(n); // stops after ~3 seconds
    }
}
catch (OperationCanceledException)
{
    Console.WriteLine("Stream cancelled.");
}

// ── 4. Real-world: streaming large database results ────────────────
public async IAsyncEnumerable<UserDto> StreamUsersAsync(
    [EnumeratorCancellation] CancellationToken ct = default)
{
    // EF Core supports async streaming via AsAsyncEnumerable()
    await foreach (var user in _dbContext.Users
                                         .Where(u => u.IsActive)
                                         .AsAsyncEnumerable()
                                         .WithCancellation(ct))
    {
        yield return new UserDto(user.Id, user.Name, user.Email);
    }
}

// Caller — processes each row as it arrives; never loads all rows into memory
await foreach (var dto in StreamUsersAsync(ct))
{
    await _emailService.SendWelcomeAsync(dto, ct);
}

// ── 5. Collecting from an async stream ────────────────────────────
// When you DO need all items, ToListAsync() (System.Linq.Async) is convenient:
// List<int> all = await GenerateNumbersAsync(10).ToListAsync();

record UserDto(int Id, string Name, string Email);`,
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'What is the primary danger of using async void instead of async Task?',
      options: [
        'async void methods run slower than async Task methods',
        'Unhandled exceptions in async void methods are unobservable and crash the application',
        'async void methods cannot use await inside them',
        'async void methods are not supported in .NET 6+',
      ],
      answer: 1,
      explanation: 'With <code>async Task</code>, exceptions are captured inside the returned Task and re-thrown when awaited. With <code>async void</code>, there is no Task to capture the exception — it propagates directly to the synchronisation context and typically crashes the process. Use <code>async void</code> only for event handlers.',
    },
    {
      q: 'What does ConfigureAwait(false) do and when should you use it?',
      options: [
        'It disables exception handling inside the async method',
        'It prevents the method from being awaited at all',
        'It tells the runtime not to resume on the original synchronisation context, avoiding deadlocks and overhead in library code',
        'It forces the Task to complete synchronously',
      ],
      answer: 2,
      explanation: 'By default, after awaiting, the runtime tries to resume on the original synchronisation context (e.g. the UI thread in WinForms). In library/infrastructure code this is wasteful or can cause deadlocks. <code>ConfigureAwait(false)</code> tells the runtime "any thread is fine for the continuation". Use it everywhere in non-UI library code; skip it in UI event handlers.',
    },
    {
      q: 'What is the difference between Task.WhenAll and Task.WhenAny?',
      options: [
        'Task.WhenAll runs tasks sequentially; Task.WhenAny runs them in parallel',
        'Task.WhenAll waits for all tasks to complete; Task.WhenAny returns when the first task completes',
        'Task.WhenAll returns only the first result; Task.WhenAny returns all results',
        'They are identical — just different method names for the same behaviour',
      ],
      answer: 1,
      explanation: '<code>Task.WhenAll</code> completes only when every supplied task has finished, and returns an array of all results. <code>Task.WhenAny</code> completes as soon as the first task finishes and returns that single Task. Use <code>WhenAny</code> for timeout patterns or racing multiple sources.',
    },
    {
      q: 'When should you prefer ValueTask<T> over Task<T>?',
      options: [
        'Always — ValueTask<T> is strictly faster in every scenario',
        'When the method is async void and returns no value',
        'On hot paths where the result is frequently available synchronously (e.g. a cache hit), to avoid heap allocation',
        'When you need to await the result multiple times',
      ],
      answer: 2,
      explanation: '<code>ValueTask&lt;T&gt;</code> is a struct, so if the result is already available without actual async work it can be returned without any heap allocation. However, it adds complexity — you cannot await it more than once and cannot cache it. Use it only when profiling shows measurable allocation pressure from <code>Task</code>.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between async void and async Task?',
      a: `<strong>async Task</strong> is the correct return type for virtually all async methods. The returned <code>Task</code> lets callers <code>await</code> completion, observe exceptions, and cancel the operation.<br><br>
<strong>async void</strong> has no handle for the caller to observe. If the method throws, the exception bypasses the normal <code>try/catch</code> mechanism and propagates to the synchronisation context — crashing the app. Use <code>async void</code> only for event handlers (e.g. <code>Button_Click</code>) where the framework expects a <code>void</code> signature.`,
    },
    {
      q: 'Why does .Result deadlock?',
      a: `When you call <code>.Result</code> or <code>.Wait()</code> on a <code>Task</code>, the calling thread blocks and waits for the Task to complete. Inside that Task the <code>await</code> continuation needs to resume on the original synchronisation context (e.g. the ASP.NET request context or the UI thread). But that context is occupied by the blocked thread — so the continuation waits for the thread, the thread waits for the continuation, and you have a classic deadlock.<br><br>
The fix: <strong>go async all the way</strong>. If you must call async code synchronously (e.g. in a constructor), use <code>Task.Run(() => MyAsync()).GetAwaiter().GetResult()</code> to run it on the thread pool away from the synchronisation context — but treat this as a last resort.`,
    },
    {
      q: 'Can I use LINQ with async?',
      a: `Standard LINQ (<code>Where</code>, <code>Select</code>, etc.) is synchronous — you cannot <code>await</code> inside a regular <code>Select</code> lambda directly. However there are several patterns:<br><br>
1. <strong>Project to tasks then WhenAll:</strong> <code>var tasks = ids.Select(id => GetAsync(id)); var results = await Task.WhenAll(tasks);</code><br>
2. <strong>System.Linq.Async</strong> (NuGet) adds async LINQ operators like <code>SelectAwait</code>, <code>WhereAwait</code>, and <code>ToListAsync()</code> that work with <code>IAsyncEnumerable&lt;T&gt;</code>.<br>
3. <strong>EF Core</strong> has its own async LINQ terminal operators: <code>ToListAsync()</code>, <code>FirstOrDefaultAsync()</code>, <code>CountAsync()</code>.`,
    },
    {
      q: 'What is async streaming?',
      a: `Async streaming is the ability to produce and consume a sequence of items <em>asynchronously</em>, one at a time, without loading the entire sequence into memory first.<br><br>
It is powered by <code>IAsyncEnumerable&lt;T&gt;</code> (C# 8 / .NET Core 3.0+). A producer uses <code>yield return</code> inside an <code>async</code> method returning <code>IAsyncEnumerable&lt;T&gt;</code>. The consumer iterates with <code>await foreach</code>.<br><br>
Real-world uses: streaming large database result sets (EF Core's <code>AsAsyncEnumerable()</code>), reading from Kafka/SignalR, processing large files line-by-line, or any scenario where you want to start processing items before all have been fetched.`,
    },
  ];

  challenge: Challenge = {
    title: 'Rate-Limited Downloader',
    description: `Implement a RateLimitedDownloader that downloads a list of URLs concurrently but caps the number of simultaneous downloads at 3.

Requirements:
1. Accept a list of URLs and a CancellationToken
2. Use SemaphoreSlim(3) to limit concurrency to 3 simultaneous downloads
3. Use Task.WhenAll to wait for all downloads to complete
4. Return a Dictionary<string, string> mapping each URL to its downloaded content
5. Propagate exceptions properly (do not swallow them)`,
    language: 'csharp',
    hints: [
      'Create a SemaphoreSlim(3, 3) — initial count and max count both 3',
      'Use urls.Select(url => DownloadOneAsync(url, semaphore, ct)) to create the tasks, then Task.WhenAll',
      'In the per-URL method: await semaphore.WaitAsync(ct) to acquire, then finally semaphore.Release()',
      'Use a ConcurrentDictionary or lock to safely write results from multiple tasks',
    ],
    starterCode: `public class RateLimitedDownloader
{
    private readonly HttpClient _http = new();

    public async Task<Dictionary<string, string>> DownloadAllAsync(
        IEnumerable<string> urls,
        CancellationToken ct = default)
    {
        // TODO: create SemaphoreSlim to limit to 3 concurrent downloads
        // TODO: project each URL to a Task using Select
        // TODO: use Task.WhenAll to await all tasks
        // TODO: return results dictionary
        throw new NotImplementedException();
    }

    private async Task DownloadOneAsync(
        string url,
        // TODO: add semaphore and results parameters
        CancellationToken ct)
    {
        // TODO: acquire semaphore, download, release semaphore
        throw new NotImplementedException();
    }
}`,
    solution: `public class RateLimitedDownloader
{
    private readonly HttpClient _http = new();

    public async Task<Dictionary<string, string>> DownloadAllAsync(
        IEnumerable<string> urls,
        CancellationToken ct = default)
    {
        var semaphore = new SemaphoreSlim(3, 3);
        var results   = new System.Collections.Concurrent.ConcurrentDictionary<string, string>();

        var tasks = urls.Select(url => DownloadOneAsync(url, semaphore, results, ct));
        await Task.WhenAll(tasks);

        return new Dictionary<string, string>(results);
    }

    private async Task DownloadOneAsync(
        string url,
        SemaphoreSlim semaphore,
        System.Collections.Concurrent.ConcurrentDictionary<string, string> results,
        CancellationToken ct)
    {
        await semaphore.WaitAsync(ct);          // block until a slot is available
        try
        {
            string content = await _http.GetStringAsync(url, ct);
            results[url] = content;
        }
        finally
        {
            semaphore.Release();                 // always release, even on exception
        }
    }
}`,
  };
}
