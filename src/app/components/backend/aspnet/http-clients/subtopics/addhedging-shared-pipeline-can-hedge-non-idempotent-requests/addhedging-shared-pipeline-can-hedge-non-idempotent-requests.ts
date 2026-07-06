import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-addhedging-non-idempotent-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './addhedging-shared-pipeline-can-hedge-non-idempotent-requests.html',
  styleUrl: './addhedging-shared-pipeline-can-hedge-non-idempotent-requests.scss',
})
export class AddhedgingSharedPipelineCanHedgeNonIdempotentRequestsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own Q&A warns "never hedge non-idempotent mutations (POST/PUT)" — but its OWN typed-client pattern wraps ALL of one API\'s endpoints (both reads and writes) in a SINGLE class, and resilience is typically attached ONCE per typed client, not per HTTP method',
      points: [
        'The main HttpClient &amp; Resilience page\'s own "Typed Clients" section recommends: "Pair one typed client with one downstream API" — meaning a SINGLE typed client class (like <code>IProductApiClient</code>) commonly exposes BOTH read methods (<code>GetAsync</code>, <code>ListAsync</code>) AND write methods (<code>CreateAsync</code>, <code>UpdateAsync</code>) for the same downstream API. Resilience pipelines, including hedging, are configured via <code>.AddResilienceHandler(...)</code> chained directly onto the <code>AddHttpClient&lt;T&gt;()</code> call — meaning ONE pipeline configuration applies to EVERY request that typed client makes, regardless of which method (GET, POST, PUT) initiated it.',
      ],
    },
    {
      heading: 'Adding .AddHedging() to a typed client\'s shared pipeline — intending it only for the read methods\' latency benefit — silently ALSO applies hedging to every POST/PUT call made through the SAME client, unless ShouldHandle explicitly filters by HTTP method',
      points: [
        'Polly v8\'s hedging strategy (like every other resilience strategy) operates at the <code>DelegatingHandler</code> / pipeline level — it inspects the outgoing <code>HttpRequestMessage</code> and its resulting response, but by DEFAULT it does not distinguish GET from POST at all unless the pipeline\'s <code>ShouldHandle</code> predicate is EXPLICITLY written to check <code>request.Method</code>. A developer who adds <code>.AddHedging()</code> to a typed client specifically to speed up its <code>ListAsync</code> read method, without realizing the SAME pipeline also wraps <code>CreateAsync</code>, has just enabled speculative PARALLEL execution of order-creation requests — meaning a single logical "create order" call from application code can result in TWO order-creation HTTP requests actually reaching the downstream API, with the "loser" request cancelled client-side AFTER the downstream may have already fully processed and committed it.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A typed client wrapping BOTH reads and writes — hedging added for read latency, silently also affecting writes',
      language: 'csharp',
      code: `public interface IProductApiClient
{
    Task<Product?> GetAsync(int id, CancellationToken ct = default);          // READ
    Task<IReadOnlyList<Product>> ListAsync(CancellationToken ct = default);    // READ
    Task<Product> CreateAsync(CreateProductDto dto, CancellationToken ct);     // WRITE — non-idempotent!
}

// A developer adds hedging specifically because ListAsync's latency is
// too high for a customer-facing catalog page — they were NOT thinking
// about CreateAsync at all when making this change:
builder.Services
    .AddHttpClient<IProductApiClient, ProductApiClient>(c =>
        c.BaseAddress = new Uri("https://api.example.com"))
    .AddResilienceHandler("product-pipeline", builder =>
    {
        builder.AddHedging(new HttpHedgingStrategyOptions
        {
            MaxHedgedAttempts = 2,
            Delay = TimeSpan.FromMilliseconds(300),
            // BUG: no ShouldHandle filtering by HTTP method at all —
            // this hedging strategy applies EQUALLY to every request
            // this typed client makes, GET or POST:
        });
    });

// THE SILENT CONSEQUENCE: 'CreateAsync' now ALSO gets hedged. If the
// downstream API takes longer than 300ms to respond to a CreateAsync
// call (a perfectly plausible latency for a write that touches a
// database), Polly fires a SECOND, PARALLEL "create product" request
// — meaning the downstream API can receive and fully process TWO
// separate product-creation requests for what the calling code
// believes is ONE logical operation. Whichever response arrives first
// is treated as "the" result; the other request is cancelled
// CLIENT-SIDE only — the downstream almost certainly still completes
// processing it, since HTTP request cancellation from the client
// rarely stops server-side work already in progress.`,
    },
    {
      label: 'The fix — explicitly restrict hedging to safe, idempotent HTTP methods via ShouldHandle',
      language: 'csharp',
      code: `builder.Services
    .AddHttpClient<IProductApiClient, ProductApiClient>(c =>
        c.BaseAddress = new Uri("https://api.example.com"))
    .AddResilienceHandler("product-pipeline", builder =>
    {
        builder.AddHedging(new HttpHedgingStrategyOptions
        {
            MaxHedgedAttempts = 2,
            Delay = TimeSpan.FromMilliseconds(300),
            // FIX: explicitly restrict hedging to safe, idempotent
            // HTTP methods only — GET and HEAD are safe to duplicate;
            // POST, PUT, PATCH, DELETE are NOT, since they cause
            // side effects:
            ShouldHandle = args =>
                ValueTask.FromResult(
                    args.ActionContext.CallbackContext is HttpRequestMessage req
                        && (req.Method == HttpMethod.Get || req.Method == HttpMethod.Head)),
        });
    });

// NOW: a GET request to ListAsync or GetAsync is eligible for hedging
// (speculative parallel requests, first response wins — perfectly
// safe, since reading data twice has no side effects). A POST request
// to CreateAsync is NEVER hedged, regardless of how long it takes to
// respond — exactly matching the main page's own Q&A guidance, but
// now ACTUALLY ENFORCED by the pipeline's configuration rather than
// just stated as a principle to remember.

// AN EVEN CLEANER ALTERNATIVE: split the typed client's resilience
// configuration by creating TWO separate named/typed HttpClient
// registrations — one for read operations (with hedging) and one for
// write operations (without) — if the read/write split is significant
// enough to warrant the extra registration. For a SINGLE typed client
// wrapping both, the explicit ShouldHandle method check above is the
// more direct fix.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Propose a test that would catch a regression where the ShouldHandle fix from this subtopic is accidentally removed or loosened in a future edit — one that specifically proves a POST request through this typed client is NEVER hedged, using the same style of counting fake handler introduced in the sibling retry-testing subtopic.',
    hint: 'Consider a fake handler that introduces an artificial delay long enough to trigger hedging (longer than the configured hedging Delay), and counts how many times it was actually invoked for a GET vs a POST request through the same pipeline.',
    solution: `A test using a delaying, counting fake handler — proving GET requests
DO get hedged (multiple invocations) while POST requests through the
SAME pipeline do NOT (exactly one invocation), even when both are slow
enough to exceed the hedging delay threshold:

public class DelayingCountingFakeHandler : DelegatingHandler
{
    public int InvocationCount { get; private set; }
    private readonly TimeSpan _delay;

    public DelayingCountingFakeHandler(TimeSpan delay) => _delay = delay;

    protected override async Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request, CancellationToken ct)
    {
        Interlocked.Increment(ref _count);   // thread-safe increment,
                                               // since hedged requests
                                               // run CONCURRENTLY
        await Task.Delay(_delay, ct);
        return new HttpResponseMessage(HttpStatusCode.OK);
    }

    private int _count;
    public int Count => _count;
}

[Fact]
public async Task GetRequest_IsHedged_MultipleAttemptsMade()
{
    // Delay LONGER than the configured 300ms hedging threshold —
    // this SHOULD trigger a second, parallel hedged attempt for GET:
    var fakeHandler = new DelayingCountingFakeHandler(TimeSpan.FromMilliseconds(500));
    var services = BuildServicesWithProductPipeline(fakeHandler);
    var client = services.GetRequiredService<IProductApiClient>();

    await client.ListAsync(default);

    // The pipeline's ShouldHandle correctly allows hedging for GET —
    // expect MORE than one invocation (the primary attempt plus at
    // least one hedged attempt):
    Assert.True(fakeHandler.Count > 1,
        $"Expected hedging to fire for a slow GET request, but only {fakeHandler.Count} attempt(s) were made");
}

[Fact]
public async Task PostRequest_IsNeverHedged_ExactlyOneAttemptMade()
{
    // SAME slow delay — if ShouldHandle were accidentally loosened to
    // also match POST, this test would catch it:
    var fakeHandler = new DelayingCountingFakeHandler(TimeSpan.FromMilliseconds(500));
    var services = BuildServicesWithProductPipeline(fakeHandler);
    var client = services.GetRequiredService<IProductApiClient>();

    await client.CreateAsync(new CreateProductDto("Widget", 9.99m), default);

    // THE KEY ASSERTION: exactly ONE invocation, proving POST is
    // NEVER hedged regardless of latency — if a future edit to
    // ShouldHandle accidentally dropped the HTTP-method check, this
    // test's count would jump above 1, immediately catching the
    // regression before it reaches production:
    Assert.Equal(1, fakeHandler.Count);
}

Both tests use the SAME slow delay specifically so the only variable
distinguishing them is the HTTP method — proving the ShouldHandle
filter, not just the delay threshold, is what determines hedging
eligibility.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'adding .AddHedging() to a typed client\'s resilience pipeline only affects the specific method call the developer was thinking about when they added it (e.g., only the slow read method they were trying to speed up).',
      reality: 'a resilience pipeline attached via .AddResilienceHandler() on a typed client applies to EVERY request that client makes, across every method (GET, POST, PUT) — hedging silently applies to write operations too unless ShouldHandle explicitly filters by HTTP method.',
    },
    {
      thought: 'cancelling the "losing" hedged request on the client side after the "winning" request responds first means the losing request never actually executes on the downstream server.',
      reality: 'HTTP client-side cancellation rarely stops server-side processing already underway — for a non-idempotent write, the downstream API can fully complete and commit the "losing" duplicate request\'s side effects regardless of the client abandoning that connection.',
    },
    {
      thought: 'the main page\'s own guidance ("never hedge non-idempotent mutations") is sufficient protection as long as developers remember and follow it.',
      reality: 'a shared typed client wrapping both read and write methods makes this guidance easy to violate ACCIDENTALLY — a developer adding hedging specifically for a slow read method has no obvious signal that the SAME pipeline configuration change also silently affects every write method on that same client, unless the pipeline explicitly filters by HTTP method.',
    },
  ];
}
