import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-transient-handler-pool-rotation-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './why-transient-delegatinghandlers-shared-across-pool-rotation.html',
  styleUrl: './why-transient-delegatinghandlers-shared-across-pool-rotation.scss',
})
export class WhyTransientDelegatinghandlersSharedAcrossPoolRotationSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page says handlers are "created fresh per handler pool rotation" and warns not to store per-request state — but doesn\'t connect these two facts into the actual scale of the problem',
      points: [
        'The main HttpClient &amp; Resilience page states two separate facts: (1) <code>DelegatingHandler</code> subclasses must be registered as Transient, and are created fresh "per handler pool rotation" (default every 2 minutes); and (2) "Do not store request-specific state... as fields on the handler... it may be reused across many concurrent requests within the pool lifetime." What these two facts COMBINE to mean, which the main page never states explicitly: registering a handler as Transient in DI does NOT give you "one instance per HTTP request" the way Transient normally implies for a typical service injected into a controller — for a pooled <code>DelegatingHandler</code>, Transient actually means "one instance per ~2-minute pool generation," and that SINGLE instance is the one every concurrent request during that entire 2-minute window flows through.',
      ],
    },
    {
      heading: 'This is a genuine scale mismatch worth quantifying: under moderate production load, a single "Transient" handler instance can be concurrently executing hundreds or thousands of overlapping SendAsync calls before it is ever replaced',
      points: [
        'If an API handles, say, 200 requests per second through a typed client, and the handler pool rotates every 2 minutes (120 seconds), a SINGLE <code>DelegatingHandler</code> instance participates in roughly <strong>24,000 overlapping requests</strong> before that generation is retired — all sharing the SAME object instance, all potentially executing <code>SendAsync</code> concurrently on different threads at the same moment. Any instance FIELD written by one request\'s <code>SendAsync</code> call is directly, immediately visible to (and can be overwritten by) every OTHER concurrent request\'s <code>SendAsync</code> call running on a different thread at the same time — a textbook shared-mutable-state race condition, hiding behind DI\'s normally reassuring "Transient" label.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A handler that stores per-request state as an instance field — looks reasonable, is actually a race condition',
      language: 'csharp',
      code: `// LOOKS reasonable at first glance — Transient registration, one
// instance "per request" is the usual mental model for Transient DI
// services:
public class RequestTimingHandler : DelegatingHandler
{
    // BUG: an instance FIELD, storing STATE specific to the CURRENT
    // request being processed:
    private Stopwatch? _stopwatch;

    protected override async Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request, CancellationToken ct)
    {
        _stopwatch = Stopwatch.StartNew();   // starts timing THIS request

        var response = await base.SendAsync(request, ct);

        // BUG: by the time THIS line runs, '_stopwatch' may have
        // already been OVERWRITTEN by a DIFFERENT concurrent request
        // that also called SendAsync on the SAME shared handler
        // instance, in between this request's own two statements —
        // 'Elapsed' now reports a COMPLETELY WRONG duration, possibly
        // even a duration for a DIFFERENT request entirely:
        Console.WriteLine($"Request took {_stopwatch.Elapsed.TotalMilliseconds}ms");

        return response;
    }
}

builder.Services.AddTransient<RequestTimingHandler>();
builder.Services.AddHttpClient<IProductApiClient, ProductApiClient>()
    .AddHttpMessageHandler<RequestTimingHandler>();

// THIS BUG WOULD NEVER SURFACE IN A LOW-TRAFFIC MANUAL TEST — a single
// developer hitting the endpoint once at a time never has two
// concurrent SendAsync calls racing on the same '_stopwatch' field.
// It ONLY appears under REAL CONCURRENT PRODUCTION LOAD, once enough
// simultaneous requests are flowing through the SAME pool-generation
// handler instance to actually interleave their field writes.`,
    },
    {
      label: 'The fix — use a LOCAL VARIABLE (stack-allocated per call) instead of an instance field',
      language: 'csharp',
      code: `public class RequestTimingHandler : DelegatingHandler
{
    // NO instance fields for per-request state at all.

    protected override async Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request, CancellationToken ct)
    {
        // A LOCAL VARIABLE — every concurrent call to SendAsync gets
        // its OWN independent 'stopwatch' on its OWN call stack (or,
        // for an async method, its own compiler-generated state
        // machine instance). Concurrent requests through the SAME
        // handler OBJECT never share or race on this value, because
        // it is never stored on the shared object itself:
        var stopwatch = Stopwatch.StartNew();

        var response = await base.SendAsync(request, ct);

        Console.WriteLine($"Request took {stopwatch.Elapsed.TotalMilliseconds}ms");

        return response;
    }
}

// THE GENERAL RULE THIS SUBTOPIC ESTABLISHES: because a "Transient"
// DelegatingHandler is actually shared across potentially THOUSANDS of
// concurrent requests within one ~2-minute pool generation, it must be
// written with the SAME thread-safety discipline as a genuine
// Singleton service — local variables and method parameters for
// anything request-specific, no instance fields holding per-request
// data, ever. The main page's own rule ("read from HttpRequestMessage
// options or from DI") is the SAME underlying advice, but a local
// variable used purely WITHIN a single SendAsync call (like the
// Stopwatch example here) is equally safe and often simpler than
// threading data through HttpRequestMessage.Options.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Given the ~24,000-overlapping-requests-per-generation estimate from this subtopic (at 200 req/s over a 2-minute rotation), write a stress test that would reliably reproduce the race condition in the BROKEN RequestTimingHandler shown in this subtopic — one that would pass on a low-concurrency test run but fail under genuine concurrent load.',
    hint: 'Consider that reproducing a race condition reliably requires genuinely CONCURRENT execution, not sequential requests one after another — use Task.WhenAll or Parallel.ForEachAsync to fire many requests through the SAME handler instance at the same time, and check whether any request\'s reported elapsed time is implausibly wrong (e.g., wildly larger or smaller than a deliberately-varied artificial delay).',
    solution: `A concurrency stress test that fires many requests simultaneously
through the SAME handler instance, each with a DIFFERENT, deliberately
distinguishable artificial delay, and checks whether any request's
reported timing is implausible given its own known delay:

[Fact]
public async Task RequestTimingHandler_ConcurrentRequests_DoNotCorruptEachOthersElapsedTime()
{
    var reportedTimings = new ConcurrentBag<(int RequestId, double ElapsedMs)>();
    var handler = new RequestTimingHandler(reportedTimings.Add);  // modified
                                                                    // to report
                                                                    // via callback
                                                                    // instead of
                                                                    // Console.WriteLine,
                                                                    // for test
                                                                    // observability
    handler.InnerHandler = new DelayingFakeHandler();  // a fake that
                                                         // delays by an
                                                         // amount specific
                                                         // to each request

    var invoker = new HttpMessageInvoker(handler);

    // Fire 200 requests CONCURRENTLY through the SAME handler
    // instance — simulating a slice of the real production load this
    // subtopic estimates:
    var tasks = Enumerable.Range(0, 200).Select(async requestId =>
    {
        var request = new HttpRequestMessage(HttpMethod.Get, "http://test/");
        request.Options.Set(new HttpRequestOptionsKey<int>("delayMs"),
            requestId % 10 == 0 ? 500 : 10);   // some requests
                                                 // deliberately slower
        await invoker.SendAsync(request, default);
    });

    await Task.WhenAll(tasks);

    // If the BROKEN version (instance field '_stopwatch') is used,
    // many of the 200 reported timings will be WILDLY inconsistent
    // with their own request's actual configured delay — a request
    // configured for a 10ms delay might report an elapsed time of
    // 480ms, because a DIFFERENT concurrent request's Stopwatch
    // overwrote '_stopwatch' in between this request's start and
    // finish. With the FIXED version (local variable), every
    // reported timing should closely match its own configured delay:
    foreach (var (requestId, elapsedMs) in reportedTimings)
    {
        var expectedDelay = requestId % 10 == 0 ? 500 : 10;
        Assert.InRange(elapsedMs, expectedDelay * 0.5, expectedDelay * 3.0);
    }
}

This test's KEY property is genuine concurrency (Task.WhenAll firing
all 200 requests essentially simultaneously, not sequentially) combined
with per-request DISTINGUISHABLE expected values (the deliberately
varied delay) — without both of these, a race condition on a shared
instance field can easily go unnoticed even in a dedicated test, since
sequential execution never actually interleaves the field writes the
way real concurrent production traffic does.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'registering a DelegatingHandler as Transient in DI means DI creates a fresh instance for every single outgoing HTTP request, the same way Transient works for a typical service injected into a controller.',
      reality: 'for a pooled DelegatingHandler, "Transient" actually means a fresh instance is created once per handler POOL ROTATION (default ~2 minutes) — that single instance is then shared across every concurrent request that flows through the typed client during that entire window, potentially thousands of overlapping calls.',
    },
    {
      thought: 'a race condition on a DelegatingHandler\'s instance field would be caught during normal development testing, since developers regularly test their endpoints.',
      reality: 'a race condition on shared handler state only manifests under GENUINE CONCURRENT load — a developer manually testing one request at a time, sequentially, never triggers the interleaving that causes the bug, which is exactly why it can ship to production undetected and only surface under real traffic.',
    },
    {
      thought: 'storing per-request timing or correlation data as a private instance field on a DelegatingHandler is safe as long as the field is only read and written within the same SendAsync method.',
      reality: 'reading and writing within the same method does not protect against a DIFFERENT concurrent invocation of that same method (on the same shared handler instance, from a different thread) writing to and reading from the SAME field in between — a local variable, not an instance field, is what actually isolates each call\'s own state.',
    },
  ];
}
