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
  selector: 'app-csharp-async',
  standalone: true,
  imports: [
    CommonModule, CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
    CommonMistakesComponent, RevisionCardComponent,
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
    { name: 'async void',            type: 'keyword', desc: 'Only for UI event handlers. Unhandled exceptions are unobservable and crash the process.' },
    { name: 'Task.FromResult',       type: 'method',  desc: 'Returns a completed Task<T> wrapping a known value — useful to satisfy an async interface without actual async work.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'async/await is compiler sugar for a state machine',
      points: [
        'The <code>async</code> keyword transforms the entire method into a state machine at compile time. The method returns a <code>Task</code> immediately to the caller, before any actual work starts.',
        '<code>await</code> marks a suspension point. If the awaited task is not yet complete, execution is paused and the <em>thread is released</em> back to the thread pool — not blocked.',
        'When the awaited task completes, the state machine resumes from the suspension point on a thread pool thread (or the original sync-context thread, depending on <code>ConfigureAwait</code>).',
        'This makes I/O-bound work (HTTP calls, database queries, file reads) extremely cheap in terms of thread usage — a single thread can interleave thousands of in-flight I/O operations.',
        'CPU-bound work is different: <code>await</code> alone does not offload CPU work to another thread. Use <code>await Task.Run(() => HeavyCompute())</code> to move CPU work off the calling thread.',
      ],
    },
    {
      heading: 'Never block async code — the deadlock pattern',
      points: [
        '<code>.Result</code>, <code>.Wait()</code>, and <code>GetAwaiter().GetResult()</code> on a <code>Task</code> block the calling thread synchronously until the Task completes.',
        'In environments with a <code>SynchronizationContext</code> (ASP.NET Framework, WinForms, WPF), the async continuation needs to resume on that context — but the context is held by the blocked thread. Neither side can proceed: classic deadlock.',
        'ASP.NET Core has no <code>SynchronizationContext</code>, so blocking is less likely to deadlock — but it still wastes thread pool threads, reducing server throughput under load.',
        'The fix is <strong>go async all the way</strong>: if a synchronous method needs an async result, make it async too. Blocking should only ever happen at the very top of the call chain (e.g. <code>Main</code>).',
        'If you truly cannot avoid it (e.g. a class constructor), use <code>Task.Run(() => MyAsync()).GetAwaiter().GetResult()</code> to run the async work on the thread pool, away from any sync-context.',
      ],
    },
    {
      heading: 'SynchronizationContext and ConfigureAwait',
      points: [
        'A <code>SynchronizationContext</code> represents a "where to resume" mechanism. UI frameworks install one so UI updates always happen on the UI thread.',
        'After <code>await</code>, by default the continuation is posted back to the captured <code>SynchronizationContext</code>. In a WinForms handler this means the next line after <code>await</code> runs on the UI thread — convenient for updating controls.',
        '<code>ConfigureAwait(false)</code> tells the runtime "I don\'t need to resume on the original context — any thread pool thread is fine". This avoids the overhead of marshalling back and eliminates the deadlock risk.',
        'Use <code>ConfigureAwait(false)</code> in every <code>await</code> inside library, infrastructure, and service code. Do NOT use it in UI event handlers or code that needs to access UI elements after the await.',
        'In ASP.NET Core there is no sync-context to capture, so <code>ConfigureAwait(false)</code> has no functional effect — but it is still good practice in library code for portability.',
      ],
    },
    {
      heading: 'CancellationToken is cooperative',
      points: [
        'A <code>CancellationToken</code> is a lightweight struct that carries a cancellation signal. It does not forcibly abort a thread — the called code must check it and respond.',
        'Pass the token to every async method that accepts one: <code>HttpClient.GetAsync(url, token)</code>, <code>DbContext.SaveChangesAsync(token)</code>, <code>Task.Delay(ms, token)</code>, etc.',
        'At natural pause points in your own code call <code>token.ThrowIfCancellationRequested()</code> — it throws <code>OperationCanceledException</code> if the token is cancelled.',
        'Create tokens via <code>CancellationTokenSource</code>. Combine multiple tokens (e.g. request timeout + user cancel) using <code>CancellationTokenSource.CreateLinkedTokenSource(t1, t2)</code>.',
        'Always catch <code>OperationCanceledException</code> separately from other exceptions. Log it at a lower severity (it\'s expected), clean up, and re-throw if the cancellation should propagate further up.',
      ],
    },
    {
      heading: 'async void — dangers and the only valid use',
      points: [
        '<code>async void</code> returns nothing — the caller gets no <code>Task</code> to observe. This means they cannot <code>await</code> it, catch exceptions from it, or know when it completes.',
        'If an unhandled exception escapes an <code>async void</code> method, it is posted to the <code>SynchronizationContext</code> — which in most apps means an unhandled exception that <em>crashes the process</em>.',
        'The only legitimate use is UI event handlers (<code>Button_Click</code>, <code>OnLoad</code>), where the framework signature demands <code>void</code> and the event infrastructure itself swallows the Task concept.',
        'In tests and background services, prefer <code>async Task</code> and wire it into the host\'s lifecycle. <code>async void</code> in these contexts will produce intermittent, hard-to-diagnose crashes.',
        'If you must fire-and-forget, at minimum wrap the body in a <code>try/catch</code> and log all exceptions: <code>_ = Task.Run(async () => { try { await Work(); } catch (Exception ex) { Log(ex); } });</code>',
      ],
    },
    {
      heading: 'Choose Task vs ValueTask',
      points: [
        '<code>Task</code> is a reference type allocated on the heap every time an async method is called. For most code this overhead is negligible — Task is the right default.',
        '<code>ValueTask&lt;T&gt;</code> is a struct. When the result is <em>already available</em> (e.g. a cache hit or a synchronously-completing socket read), awaiting a <code>ValueTask</code> incurs zero heap allocation.',
        'The benefit only materialises when the method <em>frequently completes synchronously</em>. If it usually suspends, <code>ValueTask</code> adds complexity with no benefit.',
        'Never await a <code>ValueTask</code> more than once — doing so is undefined behaviour. Never store a <code>ValueTask</code> in a field or cache it — it is a single-use type.',
        'Start with <code>Task</code>. Switch to <code>ValueTask</code> only when profiling shows measurable allocation pressure from high-frequency async methods — <code>IValueTaskSource</code> advanced pools are for library authors, not application code.',
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
    // Task.WhenAll re-throws the FIRST exception only.
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
    throw;  // re-throw so callers know it was cancelled
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

// ── 5. Collecting from an async stream (when you need all items) ───
var numbers = new List<int>();
await foreach (var n in GenerateNumbersAsync(10))
    numbers.Add(n);
// Or with System.Linq.Async NuGet:
// List<int> all = await GenerateNumbersAsync(10).ToListAsync();

record UserDto(int Id, string Name, string Email);`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'async void instead of async Task — unobservable exceptions crash the app',
      wrong: `// Exceptions thrown here go to the SynchronizationContext — process crash
public async void LoadDataAsync()
{
    var data = await _service.GetDataAsync();
    _items = data;  // NullReferenceException here crashes the whole app
}

// Even the caller cannot catch it:
try
{
    LoadDataAsync();  // can't await void
}
catch (Exception ex)
{
    // This catch is NEVER reached for exceptions inside async void
}`,
      right: `// Return Task — caller can await and catch exceptions normally
public async Task LoadDataAsync()
{
    var data = await _service.GetDataAsync();
    _items = data;
}

// Caller awaits and handles exceptions:
try
{
    await LoadDataAsync();
}
catch (Exception ex)
{
    _logger.LogError(ex, "Failed to load data");
}

// The ONLY valid use of async void is UI framework event handlers:
private async void Button_Click(object sender, EventArgs e)
{
    await LoadDataAsync();   // exceptions are observable here
}`,
      explanation: 'async void methods return immediately with no Task for the caller to observe. If an exception escapes, it is posted to the SynchronizationContext — in most applications this means an unhandled exception that terminates the process. Use async Task everywhere except UI event handlers where the framework signature requires void.',
    },
    {
      title: 'Blocking on async with .Result or .Wait() — deadlock under sync-context',
      wrong: `// In ASP.NET Framework / WinForms / WPF — this DEADLOCKS
public string GetUserName(int id)
{
    // .Result blocks this thread AND captures the sync-context
    // The continuation inside GetUserNameAsync needs that same context to resume
    // Neither can proceed — deadlock
    return GetUserNameAsync(id).Result;
}

public async Task<string> GetUserNameAsync(int id)
{
    var user = await _repo.GetUserAsync(id);  // needs sync-context to resume
    return user.Name;
}`,
      right: `// Go async all the way — never block mid-chain
public async Task<string> GetUserNameAsync(int id)
{
    var user = await _repo.GetUserAsync(id).ConfigureAwait(false);
    return user.Name;
}

// If you MUST call async from sync (e.g. a ctor), run on the thread pool:
public string GetUserNameSync(int id)
{
    // Task.Run offloads to thread pool — no sync-context to deadlock on
    return Task.Run(() => GetUserNameAsync(id)).GetAwaiter().GetResult();
}
// This is a last resort. Prefer making the whole call chain async.`,
      explanation: 'In environments with a SynchronizationContext (WinForms, WPF, ASP.NET Framework), blocking a thread with .Result while an async continuation needs that same context to resume creates a deadlock. The fix is to make the call async all the way up, or run it on the thread pool with Task.Run to escape the sync-context.',
    },
    {
      title: 'Awaiting in a loop instead of using Task.WhenAll — needlessly sequential',
      wrong: `// This is sequential — each download waits for the previous one to finish
// 100 URLs × 1 second each = 100 seconds total
public async Task<string[]> DownloadAllAsync(string[] urls)
{
    var results = new string[urls.Length];
    for (int i = 0; i < urls.Length; i++)
    {
        results[i] = await _http.GetStringAsync(urls[i]);  // serial!
    }
    return results;
}`,
      right: `// Start all tasks first, then await them all — concurrent!
// 100 URLs × 1 second each ≈ 1 second total (I/O-bound)
public async Task<string[]> DownloadAllAsync(string[] urls)
{
    var tasks = urls.Select(url => _http.GetStringAsync(url));
    return await Task.WhenAll(tasks);
}

// With concurrency limit (e.g. max 5 at a time):
public async Task<string[]> DownloadAllAsync(string[] urls)
{
    var semaphore = new SemaphoreSlim(5);
    var tasks = urls.Select(async url =>
    {
        await semaphore.WaitAsync();
        try   { return await _http.GetStringAsync(url); }
        finally { semaphore.Release(); }
    });
    return await Task.WhenAll(tasks);
}`,
      explanation: 'await inside a for/foreach loop executes tasks sequentially — each iteration waits for the previous one before starting. For I/O-bound work, start all tasks first and then await Task.WhenAll to run them concurrently. This can reduce total time from N×latency down to ≈ latency. Add SemaphoreSlim if you need to cap concurrency.',
    },
    {
      title: 'Dropping the CancellationToken — ignoring cancellation requests',
      wrong: `// Token accepted but never used — cancellation has no effect
public async Task<Report> GenerateReportAsync(
    int reportId, CancellationToken ct)
{
    var data    = await _repo.GetDataAsync(reportId);  // ct not forwarded
    var result  = await _engine.ProcessAsync(data);    // ct not forwarded
    return result;
}

// Even if the HTTP request is cancelled by the client,
// the server continues all the expensive work to completion.`,
      right: `// Forward ct to every async method in the chain
public async Task<Report> GenerateReportAsync(
    int reportId, CancellationToken ct)
{
    var data   = await _repo.GetDataAsync(reportId, ct);
    var result = await _engine.ProcessAsync(data, ct);
    return result;
}

// For CPU-bound loops, check manually:
foreach (var item in items)
{
    ct.ThrowIfCancellationRequested();
    Process(item);
}`,
      explanation: 'Accepting a CancellationToken but not forwarding it means the operation cannot actually be cancelled — the token is decorative. Always pass the token to every async method that accepts one (HttpClient, EF Core, Task.Delay, etc.) and call ct.ThrowIfCancellationRequested() at natural checkpoints in CPU-bound loops. Ignored cancellation wastes server resources on requests that no one is waiting for.',
    },
    {
      title: 'Awaiting a ValueTask more than once — undefined behavior',
      wrong: `// ValueTask is a single-use type — multiple awaits are undefined behavior
public async ValueTask<int> GetCountAsync()
{
    if (_cache.TryGet(out int count)) return count;  // synchronous path
    return await _db.CountAsync();
}

// BAD — awaiting the same ValueTask twice
var vt = GetCountAsync();
int first  = await vt;   // OK
int second = await vt;   // UNDEFINED BEHAVIOR — may return garbage, throw, or corrupt state`,
      right: `// Await a ValueTask exactly once
var count = await GetCountAsync();

// If you need to reuse the result, store the VALUE not the ValueTask:
var count1 = await GetCountAsync();
var count2 = await GetCountAsync();  // call again — do not re-await the same instance

// If you need Task semantics (caching, multiple awaits, etc.), use Task<T>:
public async Task<int> GetCountAsync()  // Task is safely re-awaitable
{
    if (_cache.TryGet(out int count)) return count;
    return await _db.CountAsync();
}`,
      explanation: 'ValueTask<T> is a single-use struct. Once awaited, the underlying state may have been recycled by a pooled IValueTaskSource. Awaiting the same instance twice is undefined behavior — the runtime may return incorrect values, throw, or silently corrupt state. If you need to observe a result from multiple places, use Task<T> which is safely re-awaitable, or await once and store the result value.',
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
      explanation: 'With <code>async Task</code>, exceptions are captured inside the returned Task and re-thrown when awaited. With <code>async void</code>, there is no Task to capture the exception — it propagates directly to the synchronisation context and typically crashes the process. Use <code>async void</code> only for UI event handlers.',
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
      explanation: 'By default, after awaiting, the runtime tries to resume on the original synchronisation context (e.g. the UI thread in WinForms). In library/infrastructure code this is wasteful or can cause deadlocks. <code>ConfigureAwait(false)</code> tells the runtime "any thread is fine for the continuation". Use it in all non-UI library code; skip it in UI event handlers that need to touch UI elements.',
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
      explanation: '<code>ValueTask&lt;T&gt;</code> is a struct, so if the result is already available without actual async work it can be returned without any heap allocation. However, it adds complexity — you cannot await it more than once and cannot cache it. Use it only when profiling shows measurable allocation pressure from high-frequency async methods.',
    },
    {
      q: 'Why does calling .Result on a Task inside an ASP.NET Framework controller deadlock?',
      options: [
        'Task.Result is not supported in ASP.NET Framework',
        'The calling thread blocks and holds the SynchronizationContext; the async continuation waits for that same context to resume — neither can proceed',
        '.Result is only allowed in console applications',
        'ASP.NET Framework uses a single-threaded model that prevents Task use',
      ],
      answer: 1,
      explanation: 'ASP.NET Framework installs a SynchronizationContext on the request thread. When you call <code>.Result</code>, that thread blocks and continues to hold the context. The <code>await</code> continuation inside the async method needs to post back to that same context to resume — but it is occupied. The result is a classic deadlock. Fix: go async all the way, or use <code>Task.Run(...).GetAwaiter().GetResult()</code> to escape the sync-context.',
    },
    {
      q: 'What is IAsyncEnumerable<T> and how is it consumed?',
      options: [
        'It is a thread-safe list that supports concurrent async writes',
        'It is the async counterpart to IEnumerable<T> — produces items asynchronously one at a time, consumed with await foreach',
        'It is a special IEnumerable that pre-fetches all items in the background before iteration',
        'It is only available in .NET 8+ for use with LINQ',
      ],
      answer: 1,
      explanation: '<code>IAsyncEnumerable&lt;T&gt;</code> (C# 8 / .NET Core 3.0+) lets a method produce items one at a time using <code>yield return</code> inside an <code>async</code> method. The consumer uses <code>await foreach</code> to iterate — pulling each item as it becomes available without loading the whole sequence into memory. Ideal for large database result sets, Kafka topics, file streaming, and real-time data feeds.',
    },
    {
      q: 'What is the correct way to run multiple independent async I/O operations as fast as possible?',
      options: [
        'await them inside a for loop — the runtime optimizes sequential awaits automatically',
        'Use Parallel.ForEachAsync with DegreeOfParallelism set to Environment.ProcessorCount',
        'Start all tasks before awaiting any of them, then await Task.WhenAll to collect results',
        'Use Task.Run for each operation to push them to separate thread pool threads',
      ],
      answer: 2,
      explanation: 'For I/O-bound work, start all tasks first (do NOT await each immediately — that serializes them), then call <code>await Task.WhenAll(task1, task2, task3)</code>. All tasks run concurrently on the thread pool and the total time is ≈ the duration of the slowest task, not the sum. <code>Task.Run</code> is for CPU-bound work — unnecessary for I/O-bound async methods.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between async void and async Task?',
      a: '<strong>async Task</strong> is the correct return type for virtually all async methods. The returned <code>Task</code> lets callers await completion, observe exceptions, and cancel the operation. <strong>async void</strong> has no handle for the caller to observe. If the method throws, the exception bypasses the normal try/catch mechanism and propagates to the synchronisation context — crashing the app in most environments. Use <code>async void</code> only for UI event handlers where the framework demands a void signature.',
    },
    {
      q: 'Why does .Result deadlock in some environments?',
      a: 'When you call <code>.Result</code> or <code>.Wait()</code> on a Task, the calling thread blocks and waits. Inside that Task, the <code>await</code> continuation needs to resume on the original synchronisation context (e.g. the ASP.NET request context or the UI thread). But that context is occupied by the blocked thread — so the continuation waits for the thread, the thread waits for the continuation, and you have a deadlock. The fix: go async all the way. If you must call async code synchronously, use <code>Task.Run(() => MyAsync()).GetAwaiter().GetResult()</code> to run it on the thread pool, away from the sync-context.',
    },
    {
      q: 'Can I use LINQ with async?',
      a: 'Standard LINQ (<code>Where</code>, <code>Select</code>, etc.) is synchronous — you cannot await inside a regular lambda directly. However there are several patterns: (1) <strong>Project to tasks then WhenAll:</strong> <code>var tasks = ids.Select(id => GetAsync(id)); var results = await Task.WhenAll(tasks);</code> — this runs all operations concurrently. (2) <strong>System.Linq.Async</strong> (NuGet) adds operators like <code>SelectAwait</code>, <code>WhereAwait</code>, and <code>ToListAsync()</code> for <code>IAsyncEnumerable&lt;T&gt;</code>. (3) <strong>EF Core</strong> has its own async terminal operators: <code>ToListAsync()</code>, <code>FirstOrDefaultAsync()</code>, <code>CountAsync()</code>.',
    },
    {
      q: 'What is async streaming and when should I use it?',
      a: 'Async streaming is the ability to produce and consume a sequence of items asynchronously, one at a time, without loading everything into memory first. It is powered by <code>IAsyncEnumerable&lt;T&gt;</code> (C# 8 / .NET Core 3.0+). A producer uses <code>yield return</code> inside an <code>async</code> method; the consumer iterates with <code>await foreach</code>. Use it when: streaming large database result sets (EF Core\'s <code>AsAsyncEnumerable()</code>), reading from message queues or SignalR, processing large files line-by-line, or any scenario where starting to process items before all have arrived reduces latency or memory usage.',
    },
    {
      q: 'What is the purpose of CancellationToken and how should I propagate it?',
      a: 'A <code>CancellationToken</code> carries a cooperative cancellation signal through an async call chain. Pass it as the last parameter (conventionally named <code>ct</code>) to every async method that accepts one — including <code>HttpClient</code> calls, EF Core queries, <code>Task.Delay</code>, and your own service methods. At natural checkpoints in CPU loops call <code>ct.ThrowIfCancellationRequested()</code>. Create tokens via <code>CancellationTokenSource</code>; combine multiple sources (e.g. request timeout + global shutdown) with <code>CancellationTokenSource.CreateLinkedTokenSource(t1, t2)</code>. Always catch <code>OperationCanceledException</code> separately — it is expected, not an error.',
    },
    {
      q: 'How does the async state machine work under the hood?',
      a: 'The C# compiler transforms an <code>async</code> method into a struct implementing <code>IAsyncStateMachine</code>. Each <code>await</code> becomes a numbered state. When the awaited task completes, the runtime calls <code>MoveNext()</code> on the state machine, which jumps to the next state and resumes execution. Local variables become fields on the state machine struct so they survive across suspension points. This is why <code>async</code> methods do not actually block a thread — they are just a state machine being driven by task completions.',
    },
    {
      q: 'When is ConfigureAwait(false) NOT needed?',
      a: '<code>ConfigureAwait(false)</code> is unnecessary (but harmless) in ASP.NET Core, because ASP.NET Core deliberately has no <code>SynchronizationContext</code> — continuations already resume on thread pool threads. It is also unnecessary in console apps and .NET worker services for the same reason. You DO need it in library code targeting multiple frameworks (where consumers may have a sync-context), WinForms/WPF UI layer code where you do NOT need to return to the UI thread, and in any code where avoiding the sync-context is explicitly needed for correctness or performance.',
    },
  ];

  challenge: Challenge = {
    title: 'Rate-Limited Downloader',
    description: `Implement a <code>RateLimitedDownloader</code> that downloads a list of URLs concurrently but caps the number of simultaneous downloads at 3.

Requirements:
1. Accept a list of URLs and a CancellationToken
2. Use SemaphoreSlim(3) to limit concurrency to 3 simultaneous downloads
3. Use Task.WhenAll to wait for all downloads to complete
4. Return a Dictionary&lt;string, string&gt; mapping each URL to its downloaded content
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

  revision: RevisionSummary = {
    oneLiner: 'async/await compiles to a state machine that suspends without blocking threads. Never use async void outside event handlers, never block with .Result, always forward CancellationToken, and start tasks before awaiting them to run I/O concurrently.',
    mustKnow: [
      'async/await compiles to an IAsyncStateMachine — the method returns a Task immediately, and the state machine resumes on completion.',
      'await suspends without blocking a thread — the thread pool thread is released and reused while I/O is in flight.',
      'async void swallows exceptions into the SynchronizationContext — use async Task everywhere except UI event handlers.',
      '.Result / .Wait() deadlock under a SynchronizationContext — go async all the way or use Task.Run to escape the context.',
      'ConfigureAwait(false) prevents marshalling back to the original sync-context — use in all library/infrastructure code.',
      'For concurrent I/O: start all tasks first, then await Task.WhenAll — never await in a sequential loop.',
      'CancellationToken is cooperative — forward it to every async call and check ThrowIfCancellationRequested in loops.',
    ],
    interviewFocus: [
      'Explain the deadlock: why does .Result deadlock in ASP.NET Framework? (SynchronizationContext + blocked thread)',
      'When is async void acceptable? (Only UI event handlers — never in services, tests, or library code)',
      'What does ConfigureAwait(false) do? (Skips marshalling back to the captured sync-context — safe for library code)',
      'Sequential vs concurrent await: what\'s the difference between awaiting in a loop vs. Task.WhenAll?',
      'When would you use ValueTask<T>? (High-frequency method that frequently completes synchronously — cache hits, etc.)',
    ],
  };
}
