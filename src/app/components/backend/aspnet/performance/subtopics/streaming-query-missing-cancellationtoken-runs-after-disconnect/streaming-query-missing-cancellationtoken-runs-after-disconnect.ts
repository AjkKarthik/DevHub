import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-streaming-query-cancellation-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './streaming-query-missing-cancellationtoken-runs-after-disconnect.html',
  styleUrl: './streaming-query-missing-cancellationtoken-runs-after-disconnect.scss',
})
export class StreamingQueryMissingCancellationtokenRunsAfterDisconnectSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own "Async Streaming" code tab contains two IAsyncEnumerable examples side by side — the manual StreamPrices() method correctly threads a [EnumeratorCancellation] CancellationToken through its loop, but the EF Core AsAsyncEnumerable() example directly above it does not accept or thread a token at all, despite the page\'s own "Common Perf Patterns" tab stating "Always pass CancellationToken — cancels work when client disconnects" as a general rule',
      points: [
        '<code>app.MapGet("/orders/export", async IAsyncEnumerable&lt;OrderDto&gt;(AppDbContext db) =&gt; db.Orders.OrderBy(...).Select(...).AsAsyncEnumerable())</code> has no <code>CancellationToken</code> parameter anywhere in its signature — there is nothing for ASP.NET Core to pass the request\'s cancellation signal INTO, and nothing for EF Core\'s underlying database command to observe if the client disconnects mid-stream.',
        'Minimal API handlers CAN accept a <code>CancellationToken</code> parameter directly — the framework binds it to the current request\'s <code>HttpContext.RequestAborted</code> token automatically, which becomes cancelled the moment the client disconnects (closes the tab, loses network, or the connection is otherwise torn down). Without this parameter present AND threaded into the EF Core query, that signal has no path INTO the database call at all.',
      ],
    },
    {
      heading: 'The practical consequence for a large export streamed via IAsyncEnumerable specifically: if the client disconnects partway through a 100,000-row export, the underlying SQL query and its database connection keep running/reading to completion on the SERVER side — continuing to hold a connection-pool slot and consume database CPU for a client that already left, for however long the remainder of that large result set takes to read',
      points: [
        'This is subtly different from the more familiar "buffer everything with ToListAsync(), then a disconnect just means the response write fails" case — with streaming, the query is ACTIVELY being read row-by-row over the FULL duration of the export, which is precisely when a mid-stream disconnect is common (someone starts a large export, realizes it will take a while, and navigates away) and precisely when failing to observe cancellation wastes the most server-side resource, for the longest possible duration.',
        'The fix is a small, mechanical addition: accept <code>CancellationToken</code> as a handler parameter and pass it into <code>AsAsyncEnumerable()</code>\'s consuming enumeration — or, since <code>AsAsyncEnumerable()</code> itself takes no token parameter (the token is supplied when the ENUMERATOR is advanced, i.e., inside the framework\'s own response-writing loop, or explicitly via <code>WithCancellation()</code> if consuming it manually) — the practical fix in a minimal API is simply DECLARING the <code>CancellationToken</code> parameter at all, since ASP.NET Core\'s IAsyncEnumerable response-writing machinery automatically observes <code>HttpContext.RequestAborted</code> during enumeration REGARDLESS of whether the handler also declares it as a parameter — meaning the real, more precise gotcha is about whether EF Core\'s query ACTUALLY gets cancelled promptly, which depends on the underlying ADO.NET command observing that same aborted-connection signal during its read loop.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own two streaming examples, contrasted',
      language: 'csharp',
      code: `// Example 1 — the main page's manual streaming method — CORRECTLY
// threads cancellation:
public async IAsyncEnumerable<PriceUpdate> StreamPrices(
    string symbol,
    [EnumeratorCancellation] CancellationToken ct = default)
{
    while (!ct.IsCancellationRequested)
    {
        yield return new PriceUpdate(symbol, await FetchPriceAsync(symbol));
        await Task.Delay(500, ct);   // observes cancellation every 500ms
    }
}
// A client disconnect promptly stops the loop — no wasted background work.

// Example 2 — the main page's EF Core streaming example — the
// handler itself never declares a CancellationToken parameter at all:
app.MapGet("/orders/export", async IAsyncEnumerable<OrderDto>(AppDbContext db) =>
    db.Orders
      .OrderBy(o => o.Id)
      .Select(o => new OrderDto(o.Id, o.Total))
      .AsAsyncEnumerable());

// Even though ASP.NET Core's own response-writing machinery observes
// HttpContext.RequestAborted while enumerating the IAsyncEnumerable
// (so a disconnect DOES eventually stop the HTTP response write), the
// underlying EF Core query itself was never given an explicit
// cancellation path via a declared token — whether the actual SQL
// command execution and row-reading loop responds PROMPTLY to that
// same disconnect depends on the ADO.NET provider observing the
// connection's own aborted state, which is a less immediate signal
// than an explicitly threaded token checked every iteration.`,
    },
    {
      label: 'The fix and a test proving cancellation propagates promptly to the query',
      language: 'csharp',
      code: `// THE FIX — explicitly declare and thread the token, matching the
// page's own "Common Perf Patterns" rule and its OWN StreamPrices example:
app.MapGet("/orders/export", (AppDbContext db, CancellationToken ct) =>
    db.Orders
      .OrderBy(o => o.Id)
      .Select(o => new OrderDto(o.Id, o.Total))
      .AsAsyncEnumerable()
      .WithCancellation(ct));   // <-- makes the cancellation path explicit
                                //     and immediate, not dependent on
                                //     framework-level best-effort observation

// A test proving the fix actually stops server-side work promptly —
// using a slow, artificially large query and simulating a client
// disconnect mid-stream:
[Fact]
public async Task Export_Stops_Reading_Database_Promptly_After_Client_Disconnects()
{
    var readCount = 0;
    await using var app = new TestWebApp(); // seeds a large dataset
    var client = app.CreateClient();

    using var cts = new CancellationTokenSource();
    var request = new HttpRequestMessage(HttpMethod.Get, "/orders/export");

    var responseTask = client.SendAsync(
        request, HttpCompletionOption.ResponseHeadersRead, cts.Token);
    var response = await responseTask;
    await using var stream = await response.Content.ReadAsStreamAsync();

    // Read just a few bytes, then simulate the client disconnecting:
    var buffer = new byte[64];
    await stream.ReadAsync(buffer, 0, buffer.Length);
    cts.Cancel();   // simulates the client tearing down the connection

    // Give the server a moment to observe the cancellation and stop:
    await Task.Delay(200);

    // Assert the SERVER-SIDE row counter (incremented per row read
    // from the database, via a test-only interceptor) stopped growing
    // shortly after cancellation, rather than continuing to the full
    // 100,000-row dataset:
    var countAfterDelay = TestQueryInterceptor.RowsRead;
    await Task.Delay(500);
    Assert.Equal(countAfterDelay, TestQueryInterceptor.RowsRead);
    // If cancellation were NOT propagating to the query, RowsRead
    // would keep climbing toward 100,000 well after this point.
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate argues the fix is unnecessary: "ASP.NET Core already aborts the HTTP response write when the client disconnects — the export effectively stops from the CLIENT\'s perspective either way, so whether the SERVER-side query keeps running a bit longer doesn\'t matter." Explain precisely what this argument overlooks, focusing on where the actual resource cost lives.',
    hint: 'The client and the argument both care about the HTTP RESPONSE. But what resource is the EF Core query itself consuming WHILE it keeps running — and is that resource scoped to the (already-gone) HTTP response, or to something else entirely that outlives the response?',
    solution: `The argument conflates "the client stops receiving data" with "the
server stops doing work" — these are two independent things, and the
resource cost this subtopic is actually about lives entirely on the
SECOND one. Even if the HTTP response write correctly aborts the
moment RequestAborted fires, the underlying EF Core query — if not
ALSO explicitly cancelled — keeps executing on the database
connection, continuing to occupy a slot in the connection pool and
consume the database server's own CPU and I/O for however long it
takes to either finish reading the full result set or hit some
independent, unrelated timeout. None of that resource consumption is
visible to, or bounded by, the HTTP response's own lifecycle — the
response can be fully torn down while the database query underneath
it keeps running for seconds or minutes longer, especially for a
100,000-row export.

This connects directly to an earlier ASP.NET Core Health Checks
subtopic's own point about connection pool contention: an
uncancelled, still-running export query holds a pool connection
that could otherwise serve a DIFFERENT request (or a health check's
own CanConnectAsync() call) — under load, several abandoned exports
each holding a connection for their FULL uncancelled duration can
meaningfully degrade the connection pool's availability for
everyone else, exactly the kind of shared-resource pressure that
subtopic describes, just triggered by a different root cause (missing
query cancellation rather than a slow database).

The teammate's argument is correct about the HTTP LAYER's behavior but
incorrect about the DATABASE layer's — "the client stopped receiving
data" and "the server stopped doing work on the client's behalf" are
only the same fact if the cancellation signal is EXPLICITLY threaded
all the way down to the query, which is exactly what the missing
CancellationToken parameter prevents from happening reliably.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'if ASP.NET Core aborts the HTTP response write when a client disconnects, any underlying database query producing that response is automatically stopped too, since the response is what triggered the query in the first place.',
      reality: 'the HTTP response being torn down and the underlying database query actually stopping are two independent events — without an explicitly threaded CancellationToken reaching the query itself, the query can keep executing and consuming a connection-pool slot for its full remaining duration, well after the client (and the response) are gone.',
    },
    {
      thought: 'a minimal API handler returning IAsyncEnumerable<T> automatically propagates client-disconnect cancellation into every downstream async operation inside it, since the framework "handles streaming."',
      reality: 'ASP.NET Core\'s response-writing machinery observes the request\'s aborted state at the HTTP layer, but whether that signal reaches an EF Core query specifically depends on the handler explicitly declaring a CancellationToken parameter and threading it into the query (e.g. via WithCancellation()) — omitting it leaves the underlying database read loop without an explicit, immediate cancellation path.',
    },
    {
      thought: 'a mid-stream client disconnect during a large data export is a rare enough edge case that not explicitly wiring cancellation into the streaming query is a low-priority gap.',
      reality: 'mid-stream disconnects are actually MORE common for large exports specifically — a user starting a large export, realizing it will take a while, and navigating away is a routine interaction pattern — making this exactly the scenario where failing to propagate cancellation wastes the most server-side resource, for the longest duration, not an unlikely corner case.',
    },
  ];
}
