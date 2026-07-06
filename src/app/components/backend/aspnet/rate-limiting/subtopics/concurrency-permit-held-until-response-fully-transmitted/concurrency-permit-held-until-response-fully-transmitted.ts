import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-concurrency-permit-held-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './concurrency-permit-held-until-response-fully-transmitted.html',
  styleUrl: './concurrency-permit-held-until-response-fully-transmitted.scss',
})
export class ConcurrencyPermitHeldUntilResponseFullyTransmittedSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states "the permit is released when the handler completes" — a simplification that is only exactly true for endpoints that fully buffer their response before returning. For streaming responses, the permit is held for the ENTIRE response transmission to the client, not just the server-side compute time',
      points: [
        '<code>RateLimitingMiddleware</code> acquires a lease by calling the limiter, then wraps the rest of the pipeline in a <code>try/finally</code>: <code>await _next(context)</code> runs INSIDE the try, and the lease is disposed only in the finally block, after <code>_next(context)</code>\'s task completes. For a typical JSON-returning minimal API handler, that task completes once the response body has been fully written into the (usually buffered) output — which, for a small payload, happens almost immediately after the handler method returns.',
        'But for a <strong>streaming response</strong> — an <code>IAsyncEnumerable&lt;T&gt;</code> minimal API result, a manually chunked <code>context.Response.Body</code> write loop, or Server-Sent Events — <code>_next(context)</code>\'s task does not complete until the LAST byte has been written to the underlying connection. Writing to that connection is subject to TCP backpressure: a slow client (poor mobile connection, a client reading the stream slowly) causes the write calls to await longer, which means the whole <code>_next(context)</code> call — and therefore the concurrency permit\'s lifetime — is held open for as long as the CLIENT takes to consume the stream, not merely as long as the SERVER takes to produce it.',
      ],
    },
    {
      heading: 'The practical consequence: a concurrency limiter sized around expected SERVER-SIDE processing time (e.g. "reports take ~2 seconds to generate, so 5 concurrent permits give us headroom") silently under-provisions for slow-client scenarios that have nothing to do with report-generation speed at all',
      points: [
        'If a report-generation endpoint streams its output as it is produced (rather than buffering the whole report in memory and writing it in one shot), a client on a slow connection — or one that pauses reading mid-stream, whether accidentally or as a deliberate slow-loris-style pattern — occupies a concurrency permit for the FULL duration of that slow read, which can be many times longer than the actual generation time. Five "concurrent" permits sized for 2-second generations can be fully exhausted by five slow clients each taking 30+ seconds to finish receiving their streamed response, even though the server finished producing all the data in 2 seconds each.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Buffered vs streaming — same handler shape, very different permit lifetime',
      language: 'csharp',
      code: `// BUFFERED — the concurrency permit is held only for ~generation time.
// The whole report is built in memory, then written in one Results.Ok()
// call; _next(context) completes once that single write finishes,
// which for a buffered response is fast regardless of client speed
// (it goes into the OS socket buffer, not blocked on client reads for
// small-to-medium payloads):
app.MapPost("/reports/summary", async (ReportRequest req, CancellationToken ct) =>
{
    var report = await GenerateReportAsync(req, ct);   // ~2 seconds
    return Results.Ok(report);                          // one buffered write
}).RequireRateLimiting("expensive-op");

// STREAMING — the concurrency permit is held for as long as the CLIENT
// takes to read the entire stream, which can be far longer than the
// ~2 seconds of actual generation work:
app.MapGet("/reports/export-csv", (CancellationToken ct) =>
{
    async IAsyncEnumerable<string> StreamRows(
        [EnumeratorCancellation] CancellationToken enumCt)
    {
        await foreach (var row in GenerateReportRowsAsync(enumCt))
            yield return row.ToCsvLine();
            // Each yielded row is written to the response stream as
            // it's produced — and each write awaits the underlying
            // connection, which backpressures against the CLIENT's
            // read rate.
    }
    return Results.Stream(async (stream, ct2) =>
    {
        await foreach (var line in StreamRows(ct2))
            await stream.WriteAsync(Encoding.UTF8.GetBytes(line + "\\n"), ct2);
    }, "text/csv");
}).RequireRateLimiting("expensive-op");
// A slow client here holds the SAME concurrency slot the buffered
// endpoint above would have released seconds earlier.`,
    },
    {
      label: 'Proving the permit-lifetime difference with a slow-client simulation',
      language: 'csharp',
      code: `[Fact]
public async Task Streaming_Endpoint_Holds_Permit_Until_Client_Finishes_Reading()
{
    // Concurrency limit of 1 — the second request can only proceed
    // once the first fully releases its permit.
    await using var app = new WebApplicationFactory<Program>();
    var client = app.CreateClient();

    // Start reading the streaming response but DON'T consume it fully —
    // simulate a slow/paused client by reading only the first chunk:
    using var slowResponse = await client.GetAsync(
        "/reports/export-csv", HttpCompletionOption.ResponseHeadersRead);
    await using var slowStream = await slowResponse.Content.ReadAsStreamAsync();
    var buffer = new byte[16];
    await slowStream.ReadAsync(buffer, 0, buffer.Length);   // read a little,
                                                              // then STOP —
                                                              // never dispose
                                                              // or finish reading

    // While the first response is still "in flight" from the server's
    // perspective (permit not yet released), a second concurrent
    // request to the SAME concurrency-limited endpoint is rejected —
    // even though the SERVER finished generating all the CSV rows
    // long ago; only the CLIENT hasn't finished reading them:
    var secondResponse = await client.GetAsync("/reports/export-csv");
    Assert.Equal(HttpStatusCode.TooManyRequests, secondResponse.StatusCode);

    // Now fully drain the first stream — releasing the permit:
    await slowStream.CopyToAsync(Stream.Null);

    // A third request now succeeds — proving the permit really was
    // held by client-side read pace, not server-side generation time:
    var thirdResponse = await client.GetAsync("/reports/export-csv");
    Assert.Equal(HttpStatusCode.OK, thirdResponse.StatusCode);
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team sizes their concurrency limiter for /reports/export-csv at PermitLimit = 20, reasoning "generation takes about 1 second, so 20 concurrent permits give us 20x headroom for a burst of report requests." Explain what assumption this reasoning silently depends on, and describe a realistic scenario where the actual sustained throughput is far lower than 20 reports/second despite this configuration.',
    hint: 'Does "generation takes about 1 second" describe SERVER compute time, CLIENT read time, or the full duration _next(context) awaits inside the rate limiter middleware? What happens when those durations diverge?',
    solution: `The reasoning silently assumes server-side generation time and the
duration a concurrency permit is held are the same thing — true only
for a buffered response, false for the streaming endpoint shown in
this subtopic. "20x headroom for a burst" is calculated from the
SERVER's 1-second generation time, but the permit isn't released until
_next(context) completes, which for a streaming CSV export means until
the CLIENT has read every byte.

A realistic scenario: mobile clients on a slow or intermittent
connection, or a batch-export UI that opens all 20 downloads at once
and lets the browser's own connection-limit and buffering queue them,
each take 15-30 seconds to fully receive a large CSV export — not
because generation is slow, but because of network throughput or
client-side processing between reads (e.g. writing each chunk to disk,
updating a progress bar, or a paused browser tab). With PermitLimit=20
and each permit held for 20-30 seconds instead of 1, the sustained
throughput of the endpoint is roughly 20 permits ÷ 25 seconds ≈ 0.8
reports/second — a small fraction of the naive "20 reports/second at
full capacity" the team's sizing math implied, purely because the
sizing was based on the wrong duration.

The fix is either: size the concurrency limiter based on observed
END-TO-END request duration (including realistic client read times),
not server generation time alone; or restructure the endpoint to
buffer the full report server-side and return it as one write (making
the permit's lifetime match generation time again, at the cost of
memory for large reports); or move to a background-job + polling
pattern for large exports, where the synchronous request that holds a
rate-limiter permit is only the (fast) "start this export" call, not
the actual data transfer.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a concurrency limiter permit is released as soon as the endpoint handler method returns or its async Task completes on the server side.',
      reality: 'the permit is released only after RateLimitingMiddleware\'s wrapped _next(context) call fully completes — for streaming responses, that includes the entire response body transmission to the client, which is subject to network/client-side backpressure and can vastly outlast the actual server-side compute time.',
    },
    {
      thought: 'sizing a concurrency limiter around "how long the operation takes to compute" is sufficient regardless of whether the endpoint buffers or streams its response.',
      reality: 'that sizing assumption is only valid for buffered responses; a streaming endpoint\'s permit lifetime is dominated by how long the CLIENT takes to read the stream, which can be many times longer than generation time for slow, paused, or bandwidth-constrained clients.',
    },
    {
      thought: 'a slow client reading a streamed response slowly is purely a client-side/network problem with no server-side resource implication beyond the connection itself.',
      reality: 'if the streaming endpoint is behind a concurrency limiter, a slow client directly occupies a limited server-side concurrency permit for the full duration of its slow read — turning a client-side slowness problem into server-side throughput starvation for OTHER clients trying to use the same limited endpoint.',
    },
  ];
}
