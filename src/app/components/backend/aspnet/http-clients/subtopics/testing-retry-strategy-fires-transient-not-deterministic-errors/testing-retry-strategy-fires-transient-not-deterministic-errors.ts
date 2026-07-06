import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-retry-strategy-fires-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-retry-strategy-fires-transient-not-deterministic-errors.html',
  styleUrl: './testing-retry-strategy-fires-transient-not-deterministic-errors.scss',
})
export class TestingRetryStrategyFiresTransientNotDeterministicErrorsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own Q&A explains WHICH status codes the retry strategy targets by default — but nothing on the page shows a test proving that behavior actually holds for a specific typed client\'s configuration',
      points: [
        'The main HttpClient &amp; Resilience page\'s Q&amp;A states the default retry strategy fires on <code>HttpRequestException</code>, <code>RequestTimeout</code>, <code>ServiceUnavailable</code>, and <code>TooManyRequests</code>, but explicitly does NOT retry <code>BadRequest</code>, <code>Unauthorized</code>, or <code>NotFound</code> — "because these are deterministic failures where retrying would not help." This is a documentation claim about a THIRD-PARTY library\'s default behavior — worth directly verifying against your OWN typed client\'s actual configuration, especially after a custom <code>ShouldHandle</code> override (as the main page\'s own "Custom Pipeline" code tab shows) potentially narrows or widens which codes trigger a retry.',
      ],
    },
    {
      heading: 'A fake DelegatingHandler that counts how many times it was invoked — combined with a handler that returns a SPECIFIC status code every time — directly proves how many attempts the resilience pipeline actually makes for that code',
      points: [
        'By substituting the typed client\'s primary handler with a fake that always returns a KNOWN status code and counting invocations, a test can directly assert "for a 503, the pipeline attempts N times" versus "for a 404, the pipeline attempts exactly ONCE" — turning the main page\'s own prose description of retry behavior into an executable, regression-proof specification of the ACTUAL configured pipeline, not just the library\'s documented defaults.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A counting fake handler that returns a configurable status code every time',
      language: 'csharp',
      code: `public class CountingFakeHandler : DelegatingHandler
{
    public int InvocationCount { get; private set; }
    private readonly HttpStatusCode _statusToReturn;

    public CountingFakeHandler(HttpStatusCode statusToReturn)
        => _statusToReturn = statusToReturn;

    protected override Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request, CancellationToken ct)
    {
        InvocationCount++;
        return Task.FromResult(new HttpResponseMessage(_statusToReturn));
    }
}

public static IServiceCollection AddTestProductApiClient(
    this IServiceCollection services, CountingFakeHandler fakeHandler)
{
    services
        .AddHttpClient<IProductApiClient, ProductApiClient>(c =>
            c.BaseAddress = new Uri("https://api.example.com"))
        .AddStandardResilienceHandler(opts =>
        {
            opts.Retry.MaxRetryAttempts = 3;
            opts.Retry.Delay = TimeSpan.FromMilliseconds(1);   // fast for tests
        })
        .ConfigurePrimaryHttpMessageHandler(() => fakeHandler);

    return services;
}`,
    },
    {
      label: 'The tests that directly prove the retry strategy\'s actual behavior for THIS typed client\'s configuration',
      language: 'csharp',
      code: `public class RetryBehaviorTests
{
    [Fact]
    public async Task ServiceUnavailable_TriggersFullRetryAttempts()
    {
        var fakeHandler = new CountingFakeHandler(HttpStatusCode.ServiceUnavailable);
        var services = new ServiceCollection();
        services.AddTestProductApiClient(fakeHandler);
        var provider = services.BuildServiceProvider();

        var client = provider.GetRequiredService<IProductApiClient>();

        // A 503 is a TRANSIENT failure per the main page's own Q&A —
        // this should be retried up to MaxRetryAttempts + the original
        // attempt (3 retries + 1 initial = 4 total calls to the fake
        // handler):
        await Assert.ThrowsAnyAsync<Exception>(() => client.GetAsync(1, default));

        Assert.Equal(4, fakeHandler.InvocationCount);
    }

    [Fact]
    public async Task NotFound_NeverRetries_CallsHandlerExactlyOnce()
    {
        var fakeHandler = new CountingFakeHandler(HttpStatusCode.NotFound);
        var services = new ServiceCollection();
        services.AddTestProductApiClient(fakeHandler);
        var provider = services.BuildServiceProvider();

        var client = provider.GetRequiredService<IProductApiClient>();

        // A 404 is a DETERMINISTIC failure per the main page's own
        // Q&A — retrying would never help, since the resource genuinely
        // doesn't exist. This directly proves the pipeline calls the
        // handler EXACTLY ONCE, not the full retry count:
        var result = await client.GetAsync(1, default);

        Assert.Null(result);   // GetFromJsonAsync returns null on 404
        Assert.Equal(1, fakeHandler.InvocationCount);
    }

    [Fact]
    public async Task BadRequest_NeverRetries_CallsHandlerExactlyOnce()
    {
        var fakeHandler = new CountingFakeHandler(HttpStatusCode.BadRequest);
        var services = new ServiceCollection();
        services.AddTestProductApiClient(fakeHandler);
        var provider = services.BuildServiceProvider();

        var client = provider.GetRequiredService<IProductApiClient>();

        await Assert.ThrowsAsync<HttpRequestException>(() => client.ListAsync(default));

        Assert.Equal(1, fakeHandler.InvocationCount);
    }
}

// WHAT THESE TESTS ACTUALLY PROVE: not just "the library's documented
// default behavior" in the abstract, but that THIS SPECIFIC typed
// client's ACTUAL configured pipeline (registered exactly as it is in
// Program.cs) behaves as documented. If a future edit to the
// AddStandardResilienceHandler() options callback accidentally widened
// ShouldHandle to also retry 404s (a plausible copy-paste mistake from
// a DIFFERENT endpoint's requirements), the second test above would
// immediately fail with an invocation count greater than 1.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The main page\'s own "Custom Pipeline" code tab shows a ShouldHandle override for RequestTimeout and ServiceUnavailable specifically. Write a test that would catch a regression where a future edit to that ShouldHandle lambda accidentally ALSO matches TooManyRequests (429) — a status code the main page\'s STANDARD pipeline retries by default, but this CUSTOM pipeline was deliberately scoped to exclude.',
    hint: 'Consider that this is the OPPOSITE assertion direction from the tests in this subtopic\'s main content — rather than proving a status code DOES retry, this test needs to prove a status code explicitly does NOT retry for a pipeline that deliberately narrowed its own ShouldHandle logic.',
    solution: `A test proving the CUSTOM pipeline's narrower ShouldHandle does NOT
retry 429, even though the STANDARD pipeline would have:

public class CustomPipelineRetryScopeTests
{
    [Fact]
    public async Task TooManyRequests_DoesNotRetry_OnTheCustomPaymentPipeline()
    {
        // Using the main page's own "Custom Pipeline" tab's exact
        // configuration — ShouldHandle only matches RequestTimeout and
        // ServiceUnavailable, deliberately EXCLUDING TooManyRequests:
        var fakeHandler = new CountingFakeHandler(HttpStatusCode.TooManyRequests);
        var services = new ServiceCollection();
        services
            .AddHttpClient<IPaymentApiClient, PaymentApiClient>(c =>
                c.BaseAddress = new Uri("https://payments.example.com"))
            .AddResilienceHandler("payment-pipeline", builder =>
            {
                builder
                    .AddTimeout(TimeSpan.FromSeconds(5))
                    .AddRetry(new HttpRetryStrategyOptions
                    {
                        MaxRetryAttempts = 2,
                        Delay = TimeSpan.FromMilliseconds(1),
                        ShouldHandle = args =>
                            ValueTask.FromResult(
                                args.Outcome.Result?.StatusCode
                                    is HttpStatusCode.RequestTimeout
                                    or HttpStatusCode.ServiceUnavailable)
                    });
            })
            .ConfigurePrimaryHttpMessageHandler(() => fakeHandler);

        var provider = services.BuildServiceProvider();
        var client = provider.GetRequiredService<IPaymentApiClient>();

        await Assert.ThrowsAsync<HttpRequestException>(() => client.ChargeAsync(default));

        // THE KEY ASSERTION: exactly ONE call, proving TooManyRequests
        // is correctly EXCLUDED from this custom pipeline's retry
        // scope — even though it IS retried by the standard pipeline
        // elsewhere in the app. If a future edit widened this
        // ShouldHandle lambda to also match TooManyRequests (perhaps
        // copy-pasted from a different endpoint's requirements without
        // fully considering payment-specific idempotency concerns),
        // this test's invocation count would jump to 3 (1 + 2 retries),
        // failing immediately:
        Assert.Equal(1, fakeHandler.InvocationCount);
    }
}

This reinforces a distinct but related lesson from this subtopic's main
content: for a CUSTOM pipeline with a deliberately narrowed
ShouldHandle, it's just as important to test what does NOT get retried
as what does — since payment endpoints in particular often have
strict idempotency requirements that make retrying rate-limited
requests (429) far riskier than retrying a generic service-unavailable
error, and this distinction is exactly the kind of business-specific
judgment call a generic library default cannot encode on its own.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the retry behavior documented in the main page\'s Q&A (which status codes retry by default) automatically applies to every typed client in an app, regardless of custom configuration.',
      reality: 'a custom ShouldHandle override (as the main page\'s own "Custom Pipeline" tab demonstrates) can narrow or widen which status codes trigger a retry for a SPECIFIC client — testing the actual configured pipeline, not just trusting documented library defaults, is what verifies the real behavior.',
    },
    {
      thought: 'testing a resilience pipeline requires making real HTTP calls to a live (or staging) downstream API to observe retry behavior.',
      reality: 'a fake DelegatingHandler that returns a fixed, known status code and counts its own invocations directly and deterministically proves how many attempts the pipeline makes for that code — no real network calls or live downstream service needed.',
    },
    {
      thought: 'a custom pipeline\'s ShouldHandle logic only needs testing for the status codes it IS supposed to retry.',
      reality: 'proving a status code explicitly does NOT retry (like TooManyRequests on a payment pipeline deliberately scoped to exclude it) is just as important as proving one does, especially for endpoints with strict idempotency requirements where an accidentally widened retry scope creates real business risk.',
    },
  ];
}
