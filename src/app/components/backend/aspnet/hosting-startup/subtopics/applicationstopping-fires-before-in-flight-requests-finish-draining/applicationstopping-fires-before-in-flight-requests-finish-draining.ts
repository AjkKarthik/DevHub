import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-applicationstopping-before-drain-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './applicationstopping-fires-before-in-flight-requests-finish-draining.html',
  styleUrl: './applicationstopping-fires-before-in-flight-requests-finish-draining.scss',
})
export class ApplicationstoppingFiresBeforeInFlightRequestsFinishDrainingSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page describes ApplicationStopping as when "shutdown begins" — this is precise, but easy to misread as "no more requests are being served"',
      points: [
        'The main Hosting &amp; Startup page defines <code>ApplicationStopping</code> as firing "when shutdown begins, before HTTP server stops." That phrasing is exactly correct, but a common misreading treats it as roughly equivalent to "the last request has finished" — it is NOT. <code>ApplicationStopping</code> fires the MOMENT the shutdown signal (SIGTERM, Ctrl+C) is received, which is the START of the drain window the main page also describes ("waits for in-flight requests to complete up to the shutdown timeout"), not the END of it.',
      ],
    },
    {
      heading: 'Between ApplicationStopping firing and the process actually exiting, requests that were ALREADY in progress continue running, potentially for the ENTIRE shutdown timeout duration',
      points: [
        'The actual sequence is: (1) SIGTERM arrives, (2) Kestrel stops ACCEPTING new connections/requests, (3) <code>ApplicationStopping</code>\'s registered callbacks fire, (4) any requests that were ALREADY in flight at the moment of steps 2-3 continue executing normally, completing whenever they naturally finish — up to the configured <code>ShutdownTimeout</code> (the main page notes this defaults to 30 seconds in .NET 8, configurable via <code>ConfigureHostOptions</code>), (5) only after ALL in-flight requests finish (or the timeout is hit, whichever comes first) does the process actually terminate.',
        'This means code registered in <code>ApplicationStopping.Register(...)</code> runs CONCURRENTLY with requests that are STILL BEING SERVED — not after them. Any cleanup logic that assumes "nothing else needs this resource anymore" at this point is making an assumption the ASP.NET Core shutdown sequence does not actually guarantee.',
      ],
    },
    {
      heading: 'The real risk: disposing or closing a SHARED resource in ApplicationStopping that an in-flight request handler is still actively using',
      points: [
        'If <code>ApplicationStopping</code> is used to close a database connection pool, dispose a shared cache client, or flush-and-close a message queue producer that request handlers ALSO depend on, any request STILL IN PROGRESS at that exact moment can throw an <code>ObjectDisposedException</code> or similar failure mid-request — turning what should have been a clean, successful response into a failed one, purely as a side effect of shutdown timing, not any actual bug in the request handler\'s own logic.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own lifetime hook example — extended with a realistic risk',
      language: 'csharp',
      code: `// From the main page's own "Startup hooks" example:
var lifetime = app.Services.GetRequiredService<IHostApplicationLifetime>();

lifetime.ApplicationStopping.Register(() =>
    app.Logger.LogWarning("Shutdown requested — draining in-flight requests"));

// This logging-only callback is perfectly safe. The RISK appears when
// a DIFFERENT callback does something more consequential:
public class SharedCacheClient : IDisposable
{
    public bool IsDisposed { get; private set; }
    public string? Get(string key) =>
        IsDisposed ? throw new ObjectDisposedException(nameof(SharedCacheClient)) : "value";
    public void Dispose() => IsDisposed = true;
}

// Registered as a singleton, shared by BOTH request handlers AND the
// shutdown hook:
builder.Services.AddSingleton<SharedCacheClient>();

var cacheClient = app.Services.GetRequiredService<SharedCacheClient>();
lifetime.ApplicationStopping.Register(() =>
{
    // DANGEROUS: disposing a resource that request handlers might
    // STILL be actively using, right now, in a different request:
    cacheClient.Dispose();
});`,
    },
    {
      label: 'The failure, made concrete — an in-flight request racing the shutdown hook',
      language: 'csharp',
      code: `app.MapGet("/product/{id}", (int id, SharedCacheClient cache) =>
{
    // If SIGTERM arrives and ApplicationStopping's Dispose() callback
    // runs WHILE this exact request is executing this line, the
    // request fails with ObjectDisposedException — NOT because of any
    // bug in THIS handler, but purely because of unlucky timing
    // relative to when the shutdown signal happened to arrive:
    var cached = cache.Get(\$"product-{id}");
    return Results.Ok(cached);
});

// TIMELINE OF A REAL FAILURE:
// t=0ms   : SIGTERM received (Kubernetes pod termination)
// t=0ms   : Kestrel stops accepting NEW connections
// t=0ms   : ApplicationStopping fires -> cacheClient.Dispose() runs
// t=2ms   : A request that started at t=-50ms (BEFORE the SIGTERM,
//           already in flight, still perfectly legitimate) reaches
//           "cache.Get(...)" -> ObjectDisposedException -> 500 error
//           returned to a client who made a completely normal request
//           moments before the pod happened to be scheduled for termination
//
// This is EXACTLY the class of bug "ApplicationStopping fires before
// requests finish draining" describes — the disposal and the request
// completion are RACING each other, with no guarantee about which
// wins, for the ENTIRE duration of the shutdown timeout window.`,
    },
    {
      label: 'The fix — defer disposal of shared, request-used resources to ApplicationStopped',
      language: 'csharp',
      code: `// ApplicationStopped fires ONLY after the HTTP server has genuinely
// finished (all in-flight requests completed, OR the shutdown timeout
// was hit and the server is forcibly stopping) — THIS is the correct
// point to dispose resources that request handlers might still need:
lifetime.ApplicationStopped.Register(() =>
{
    // Safe HERE — by the time ApplicationStopped fires, no request
    // handler should still be actively running against this resource
    // (the main page's own drain window has already fully elapsed):
    cacheClient.Dispose();
});

// If cleanup logic NEEDS to start early (e.g., beginning a graceful
// flush that takes some time) but must NOT complete/finalize until
// requests are done, split it: START the operation in
// ApplicationStopping (e.g., "stop accepting new cache writes, begin
// flushing"), but perform the ACTUAL disposal/close in
// ApplicationStopped:
private readonly SemaphoreSlim _flushComplete = new(0);

lifetime.ApplicationStopping.Register(async () =>
{
    await cacheClient.BeginGracefulFlushAsync();  // stop accepting new
                                                    // work, but don't
                                                    // dispose anything yet
    _flushComplete.Release();
});

lifetime.ApplicationStopped.Register(() =>
{
    _flushComplete.Wait(TimeSpan.FromSeconds(5));  // ensure flush had a
                                                     // chance to finish
    cacheClient.Dispose();                          // NOW safe to dispose
});`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team observes intermittent 500 errors during EVERY rolling deployment, but never during normal operation — always the SAME small number of requests fail, always right around deployment time, with an <code>ObjectDisposedException</code> stack trace pointing at a Redis connection multiplexer. Using this subtopic\'s timeline, explain the most likely root cause and how to confirm it without extensive debugging.',
    hint: 'Consider what event a "rolling deployment" actually triggers on each OLD pod being replaced (a graceful shutdown signal) and where in the shutdown sequence a Redis connection multiplexer might be getting disposed relative to requests that were already in flight when that signal arrived.',
    solution: `// The likely culprit — Redis connection lifecycle tied to ApplicationStopping:
var redis = ConnectionMultiplexer.Connect(connectionString);
builder.Services.AddSingleton<IConnectionMultiplexer>(redis);

var lifetime = app.Services.GetRequiredService<IHostApplicationLifetime>();
lifetime.ApplicationStopping.Register(() =>
{
    redis.Close();   // or redis.Dispose() — either disposes the
                      // shared multiplexer immediately on shutdown SIGNAL,
                      // not after requests actually finish
});

// MOST LIKELY ROOT CAUSE, matching the observed pattern exactly:
// A "rolling deployment" replaces OLD pods one at a time — each OLD
// pod receives SIGTERM as part of its OWN individual termination,
// triggering ApplicationStopping on THAT pod. Any request that was
// ALREADY IN FLIGHT on that SPECIFIC pod at the exact moment SIGTERM
// arrived (a small, essentially random number — whatever requests
// happened to be mid-execution right then) races against the
// redis.Close()/Dispose() call in the ApplicationStopping callback.
// Requests that reach a Redis call AFTER the multiplexer is disposed,
// but BEFORE their own execution naturally completes, throw
// ObjectDisposedException — producing EXACTLY the "small number of
// requests fail, always around deployment time" symptom, since normal
// operation (no shutdown in progress) never disposes the multiplexer
// at all.

// HOW TO CONFIRM WITHOUT EXTENSIVE DEBUGGING:
// 1. Check whether the failure timestamps correlate with pod
//    termination events in Kubernetes logs/events (kubectl get events,
//    or your cluster's equivalent) — a tight correlation between
//    "pod X received SIGTERM" and "request failure on pod X" timestamps
//    is strong confirmation.
// 2. Grep the codebase for where IConnectionMultiplexer (or any other
//    shared, request-used resource) gets Disposed/Closed, and check
//    whether that call is registered against ApplicationStopping
//    specifically (rather than ApplicationStopped).
//
// THE FIX: move the redis.Close()/Dispose() call from
// ApplicationStopping to ApplicationStopped — by the time
// ApplicationStopped fires, the HTTP server has genuinely finished
// serving in-flight requests (or the shutdown timeout was hit and it's
// forcibly stopping anyway), so no request handler should still be
// actively depending on the multiplexer.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'IHostApplicationLifetime.ApplicationStopping fires only after all in-flight HTTP requests have finished being served.',
      reality: 'ApplicationStopping fires at the very START of the shutdown sequence, the moment the signal (SIGTERM/Ctrl+C) is received — in-flight requests continue running concurrently with ApplicationStopping\'s callbacks, for up to the entire configured shutdown timeout.',
    },
    {
      thought: 'disposing a shared, request-used resource (a database connection pool, a Redis multiplexer, a cache client) in an ApplicationStopping callback is always safe, since shutdown has already begun.',
      reality: 'this creates a genuine race between the disposal and any request that was already in flight when the shutdown signal arrived — the safer point to dispose such resources is ApplicationStopped, which fires only after the HTTP server has actually finished serving in-flight requests.',
    },
    {
      thought: 'intermittent ObjectDisposedException failures that only happen during deployments must indicate a bug in the specific request handler where the exception is thrown.',
      reality: 'this is a classic symptom of a shared resource being disposed too early in the shutdown sequence (in ApplicationStopping instead of ApplicationStopped) — the request handler\'s own logic is often completely correct, and the failure is purely a timing race introduced by shutdown-hook placement.',
    },
  ];
}
