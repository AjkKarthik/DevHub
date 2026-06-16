import { Component } from '@angular/core';
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
import { PrerequisitesComponent, Prerequisite } from '../../../shared/prerequisites/prerequisites';

@Component({
  selector: 'app-aspnet-http-clients',
  standalone: true,
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
            QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
            PageMetaComponent, PageCompleteComponent,
            CommonMistakesComponent, RevisionCardComponent, PrerequisitesComponent],
  templateUrl: './http-clients.html',
  styleUrl: './http-clients.scss',
})
export class AspnetHttpClients {

  prerequisites: Prerequisite[] = [
    { label: 'Dependency Injection', route: '/aspnet/dependency-injection' },
    { label: 'Middleware',           route: '/aspnet/middleware' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'IHttpClientFactory',              type: 'interface', desc: 'Creates and manages HttpClient lifetimes — prevents socket exhaustion' },
    { name: 'AddHttpClient<T>()',              type: 'method',    desc: 'Registers a typed client bound to a named HttpClient' },
    { name: 'AddHttpClient("name")',           type: 'method',    desc: 'Registers a named client for use via CreateClient("name")' },
    { name: 'AddStandardResilienceHandler()', type: 'method',    desc: 'Adds retry + circuit breaker + timeout in one call (.NET 8+)' },
    { name: 'AddResilienceHandler()',          type: 'method',    desc: 'Custom resilience pipeline via Polly v8 strategies' },
    { name: 'DelegatingHandler',              type: 'class',     desc: 'Middleware for HttpClient — add auth, logging, or correlation IDs' },
    { name: 'ResiliencePipeline',             type: 'class',     desc: 'Polly v8 composable pipeline of strategies' },
    { name: 'HttpClientHandler',              type: 'class',     desc: 'Primary handler — configure SSL, cookies, redirects' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Why IHttpClientFactory?',
      points: [
        '<code>new HttpClient()</code> per request exhausts the socket pool — even after disposal, sockets stay in TIME_WAIT for up to 4 minutes. Under load this causes <code>SocketException: address already in use</code>. <code>IHttpClientFactory</code> pools the inner <code>HttpMessageHandler</code> and reuses connections across requests.',
        'The handler pool rotates on a configurable interval (default 2 minutes). Each rotation creates a new handler, picks up fresh DNS, and retires the old handler after in-flight requests complete. Long-lived static <code>HttpClient</code> instances cache stale DNS for the app lifetime — a real problem with service discovery in Kubernetes.',
        'Three registration patterns: <strong>basic</strong> (inject <code>IHttpClientFactory</code>, call <code>CreateClient()</code> — lightweight but no pre-configuration), <strong>named</strong> (pre-configure headers/base address by string key), <strong>typed</strong> (wrap <code>HttpClient</code> in a service class — recommended for complex integrations).',
        'All three patterns share the same pooled handler infrastructure. The difference is in how you obtain and configure the client — the socket efficiency is identical across all three.',
        'Call <code>services.AddHttpClient()</code> to register the factory (included automatically with <code>AddControllers()</code> and <code>AddEndpointsApiExplorer()</code>). For minimal APIs without MVC, call it explicitly.',
        'Handler lifetime vs client lifetime: <code>HttpClient</code> instances are lightweight wrappers — create and dispose freely. The expensive <code>HttpMessageHandler</code> (which holds the socket pool) is managed by the factory and is NOT disposed when the client is disposed.',
      ],
    },
    {
      heading: 'Typed Clients',
      points: [
        'A typed client is a class that takes <code>HttpClient</code> as a constructor dependency and wraps it with domain methods. Register with <code>AddHttpClient&lt;IProductApiClient, ProductApiClient&gt;(c => c.BaseAddress = ...)</code>. The factory injects a pre-configured <code>HttpClient</code> when the class is resolved.',
        'Typed clients are registered as <strong>transient</strong> — each injection creates a new instance with a fresh <code>HttpClient</code>. The underlying handler is pooled, so this is safe. However, injecting a transient typed client into a singleton is a captive dependency bug — the singleton will always use the first handler instance, missing DNS rotations.',
        'Pair one typed client with one downstream API. The client class encapsulates endpoint paths, serialization options, and error handling — callers get clean domain methods (<code>GetProductAsync(id)</code>) instead of raw <code>GetFromJsonAsync</code> calls scattered through services.',
        'Implement an interface for the typed client so callers depend on the abstraction, not the implementation. This makes mocking trivial in tests — replace the interface with a <code>Mock&lt;IProductApiClient&gt;</code> without any HTTP infrastructure.',
        'Avoid putting business logic in typed clients — they should be pure HTTP adapters. Map domain exceptions (e.g., convert <code>HttpRequestException</code> to <code>ProductNotFoundException</code>) but do not make authorization or caching decisions.',
        'Use <code>GetFromJsonAsync&lt;T&gt;()</code>, <code>PostAsJsonAsync()</code>, and <code>PutAsJsonAsync()</code> from <code>System.Net.Http.Json</code> for clean, allocation-efficient JSON serialization without manual <code>ReadAsStringAsync()</code> + <code>JsonSerializer.Deserialize()</code>.',
      ],
    },
    {
      heading: 'Resilience with Microsoft.Extensions.Resilience',
      points: [
        '<code>AddStandardResilienceHandler()</code> (NuGet: <code>Microsoft.Extensions.Http.Resilience</code>) adds five strategies in a pre-configured pipeline: <strong>rate limiter → total request timeout → retry → circuit breaker → per-attempt timeout</strong>. This single call covers the most common production failure modes.',
        'Strategy execution order is outer-to-inner on the request, inner-to-outer on the response. The total timeout wraps the retry loop — if all retry attempts together exceed the total timeout, the pipeline cancels rather than letting the client hang indefinitely.',
        'Retry strategy defaults: exponential backoff, 3 attempts, jitter. The retry fires on <code>HttpStatusCode.RequestTimeout</code>, <code>ServiceUnavailable</code>, <code>TooManyRequests</code>, and transient network errors. Override <code>ShouldHandle</code> to retry (or not) specific status codes.',
        'Circuit breaker prevents hammering a failing downstream: once the failure ratio exceeds the threshold (50% by default over 30 seconds with ≥10 requests), the circuit opens and rejects requests immediately for the break duration (30s default). This protects the downstream from an avalanche of retries during an outage.',
        'Use <code>AddResilienceHandler("name", builder => ...)</code> for a fully custom Polly v8 pipeline. Compose strategies with <code>.AddTimeout()</code>, <code>.AddRetry()</code>, <code>.AddCircuitBreaker()</code>, <code>.AddHedging()</code> in the order you want them to execute (outermost first).',
        'Hedging strategy (Polly v8): sends a parallel request if the primary does not respond within a threshold. The first response wins; the slower one is cancelled. Useful for read-only operations where latency matters more than duplicate calls (e.g. product catalog lookups).',
      ],
    },
    {
      heading: 'DelegatingHandlers (HttpClient Middleware)',
      points: [
        '<code>DelegatingHandler</code> subclasses work like ASP.NET Core middleware but for outgoing requests — override <code>SendAsync</code>, call <code>await base.SendAsync(request, ct)</code> to forward the request, then inspect the response. The handler chain is just a chain of responsibility.',
        'Common handlers: <strong>token injection</strong> (bearer token from a cache), <strong>correlation ID propagation</strong> (<code>X-Correlation-Id</code> from <code>IHttpContextAccessor</code>), <strong>request logging</strong> (method, URL, duration, status), <strong>response caching</strong> (short-circuit on cache hit), <strong>retry on 401</strong> (refresh token, retry once).',
        'Register with <code>.AddHttpMessageHandler&lt;MyHandler&gt;()</code> after <code>AddHttpClient&lt;T&gt;()</code>. Multiple handlers chain in registration order — first registered is outermost (executes first on the request). Add resilience handlers AFTER your custom handlers so resilience wraps all the infrastructure.',
        'Register <code>DelegatingHandler</code> subclasses as <strong>Transient</strong> in DI. If they depend on scoped services (e.g., <code>IHttpContextAccessor</code>), they must be Transient — the factory resolves handlers fresh for each handler pool rotation.',
        'Do not store request-specific state (user identity, correlation ID) as fields on the handler. The handler instance is created fresh per handler pool but may be reused across many concurrent requests within the pool lifetime. Read request context from the <code>HttpRequestMessage</code> options or from DI.',
        'Primary handler (<code>HttpClientHandler</code>) is the innermost: configure SSL certificate validation, proxy, cookies, redirect following, and compression here via <code>.ConfigurePrimaryHttpMessageHandler()</code>. Override this in tests to inject a <code>FakeHttpMessageHandler</code> without making real HTTP calls.',
      ],
    },
    {
      heading: 'Testing and Production Patterns',
      points: [
        'For unit tests, replace the primary handler with a fake: inject a <code>MockHttpMessageHandler</code> (or use the <code>RichardSzalay.MockHttp</code> NuGet package) that returns pre-configured responses. Configure it via <code>.ConfigurePrimaryHttpMessageHandler(() => fakeHandler)</code> in the test service collection.',
        'For integration tests with <code>WebApplicationFactory</code>, configure <code>ConfigureTestServices(services => { ... })</code> to replace the typed client registration with one using a <code>FakeHttpMessageHandler</code>. This tests the full DI wiring without making real HTTP calls.',
        'Base address trailing slash matters: <code>new Uri("https://api.example.com")</code> (no trailing slash) makes relative paths replace the entire path. <code>new Uri("https://api.example.com/")</code> (with slash) appends relative paths correctly. Set the base address with a trailing slash and use relative paths without a leading slash in <code>GetFromJsonAsync("products/1")</code>.',
        'Timeout configuration: set a sensible default timeout on the <code>HttpClient</code> (e.g., 30s) and use per-attempt timeouts in the resilience pipeline for finer control. The <code>HttpClient.Timeout</code> is the global ceiling; resilience per-attempt timeout is shorter and fires on each retry attempt independently.',
        'Use <code>HttpRequestException</code> (with <code>StatusCode</code> property in .NET 5+) for network-level errors and <code>HttpResponseMessage.EnsureSuccessStatusCode()</code> to throw on non-2xx responses. In typed clients, catch and rethrow as domain exceptions for clean caller APIs.',
        'Observability: both <code>AddStandardResilienceHandler</code> and custom pipelines emit OpenTelemetry metrics and traces automatically via <code>Microsoft.Extensions.Http.Resilience</code> + <code>OpenTelemetry.Extensions.Hosting</code>. You get retry count, circuit breaker state, and per-request latency histograms without any extra code.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Typed Client',
      language: 'csharp',
      code: `public interface IProductApiClient
{
    Task<Product?> GetAsync(int id, CancellationToken ct = default);
    Task<IReadOnlyList<Product>> ListAsync(CancellationToken ct = default);
}

public class ProductApiClient : IProductApiClient
{
    private readonly HttpClient _http;
    public ProductApiClient(HttpClient http) => _http = http;

    public async Task<Product?> GetAsync(int id, CancellationToken ct)
        => await _http.GetFromJsonAsync<Product>(\`/products/\${id}\`, ct);

    public async Task<IReadOnlyList<Product>> ListAsync(CancellationToken ct)
        => await _http.GetFromJsonAsync<List<Product>>("/products", ct)
           ?? [];
}

// Registration
builder.Services.AddHttpClient<IProductApiClient, ProductApiClient>(c =>
{
    c.BaseAddress = new Uri("https://api.example.com");
    c.DefaultRequestHeaders.Add("Accept", "application/json");
    c.Timeout = TimeSpan.FromSeconds(30);
});`,
    },
    {
      label: 'Standard Resilience',
      language: 'csharp',
      code: `// NuGet: Microsoft.Extensions.Http.Resilience
builder.Services.AddHttpClient<IProductApiClient, ProductApiClient>(c =>
    c.BaseAddress = new Uri("https://api.example.com"))
.AddStandardResilienceHandler(opts =>
{
    // Override defaults:
    opts.Retry.MaxRetryAttempts  = 3;
    opts.Retry.Delay             = TimeSpan.FromMilliseconds(500);
    opts.Retry.BackoffType       = DelayBackoffType.Exponential;
    opts.CircuitBreaker.SamplingDuration = TimeSpan.FromSeconds(60);
    opts.TotalRequestTimeout.Timeout     = TimeSpan.FromSeconds(15);
});

// The pipeline (outer → inner):
// Rate limiter → Total timeout → Retry → Circuit breaker → Per-attempt timeout`,
    },
    {
      label: 'Custom Pipeline',
      language: 'csharp',
      code: `// Full control with Polly v8 strategies
builder.Services
    .AddHttpClient<IPaymentApiClient, PaymentApiClient>(c =>
        c.BaseAddress = new Uri("https://payments.example.com"))
    .AddResilienceHandler("payment-pipeline", builder =>
    {
        builder
            .AddTimeout(TimeSpan.FromSeconds(5))
            .AddRetry(new HttpRetryStrategyOptions
            {
                MaxRetryAttempts = 2,
                Delay            = TimeSpan.FromSeconds(1),
                ShouldHandle     = args =>
                    ValueTask.FromResult(
                        args.Outcome.Result?.StatusCode
                            is HttpStatusCode.RequestTimeout
                            or HttpStatusCode.ServiceUnavailable)
            })
            .AddCircuitBreaker(new HttpCircuitBreakerStrategyOptions
            {
                FailureRatio          = 0.5,
                SamplingDuration      = TimeSpan.FromSeconds(30),
                MinimumThroughput     = 10,
                BreakDuration         = TimeSpan.FromSeconds(15),
            });
    });`,
    },
    {
      label: 'DelegatingHandler',
      language: 'csharp',
      code: `// Inject a bearer token on every outgoing request
public class BearerTokenHandler : DelegatingHandler
{
    private readonly ITokenCache _cache;
    public BearerTokenHandler(ITokenCache cache) => _cache = cache;

    protected override async Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request, CancellationToken ct)
    {
        var token = await _cache.GetTokenAsync(ct);
        request.Headers.Authorization =
            new AuthenticationHeaderValue("Bearer", token);

        var response = await base.SendAsync(request, ct);

        // Optionally retry once on 401 with a refreshed token
        if (response.StatusCode == HttpStatusCode.Unauthorized)
        {
            token = await _cache.RefreshTokenAsync(ct);
            request.Headers.Authorization =
                new AuthenticationHeaderValue("Bearer", token);
            response = await base.SendAsync(request, ct);
        }
        return response;
    }
}

// Registration
builder.Services.AddTransient<BearerTokenHandler>();
builder.Services.AddHttpClient<IProductApiClient, ProductApiClient>()
    .AddHttpMessageHandler<BearerTokenHandler>();`,
    },
    {
      label: 'Named Client',
      language: 'csharp',
      code: `// Named client — useful for multiple APIs without a typed wrapper
builder.Services.AddHttpClient("weather", c =>
{
    c.BaseAddress = new Uri("https://api.weather.example.com");
    c.DefaultRequestHeaders.Add("x-api-key", "abc123");
});

// In a service: inject IHttpClientFactory
public class WeatherService(IHttpClientFactory factory)
{
    public async Task<WeatherDto?> GetAsync(string city)
    {
        var client = factory.CreateClient("weather");
        return await client.GetFromJsonAsync<WeatherDto>(\`/forecast?city=\${city}\`);
    }
}`,
    },
  ];

  challenge: Challenge = {
    title: 'Resilient Typed Client',
    language: 'csharp',
    description: 'Build a typed HttpClient for a downstream GitHub API. Requirements: (1) Create IGitHubClient with GetUserAsync(string username). (2) Register it with base address https://api.github.com, Accept header application/vnd.github.v3+json, and a User-Agent header. (3) Add AddStandardResilienceHandler() with MaxRetryAttempts = 2 and TotalRequestTimeout of 10 seconds. (4) Use it in a minimal API GET /users/{username} endpoint.',
    hints: [
      'HttpClient BaseAddress must end with "/" for relative paths to resolve correctly',
      'GitHub API requires a User-Agent header — missing it returns 403',
      'AddStandardResilienceHandler() chains resilience in one call',
      'GetFromJsonAsync<T>() deserializes the response and returns null on 404',
    ],
    starterCode: `var builder = WebApplication.CreateBuilder(args);

// TODO: register IGitHubClient / GitHubClient typed client
// Base: https://api.github.com/
// Headers: Accept: application/vnd.github.v3+json, User-Agent: DevHub
// Resilience: standard, MaxRetryAttempts = 2, TotalRequestTimeout = 10s

var app = builder.Build();

// TODO: GET /users/{username} — returns the GitHub user or 404
app.Run();

public interface IGitHubClient
{
    Task<GitHubUser?> GetUserAsync(string username, CancellationToken ct = default);
}

public record GitHubUser(string Login, string? Name, int Followers);`,
    solution: `var builder = WebApplication.CreateBuilder(args);

builder.Services
    .AddHttpClient<IGitHubClient, GitHubClient>(c =>
    {
        c.BaseAddress = new Uri("https://api.github.com/");
        c.DefaultRequestHeaders.Add("Accept", "application/vnd.github.v3+json");
        c.DefaultRequestHeaders.Add("User-Agent", "DevHub");
    })
    .AddStandardResilienceHandler(opts =>
    {
        opts.Retry.MaxRetryAttempts        = 2;
        opts.TotalRequestTimeout.Timeout   = TimeSpan.FromSeconds(10);
    });

var app = builder.Build();

app.MapGet("/users/{username}", async (string username, IGitHubClient gh) =>
{
    var user = await gh.GetUserAsync(username);
    return user is null ? Results.NotFound() : Results.Ok(user);
});

app.Run();

public interface IGitHubClient
{
    Task<GitHubUser?> GetUserAsync(string username, CancellationToken ct = default);
}

public class GitHubClient(HttpClient http) : IGitHubClient
{
    public Task<GitHubUser?> GetUserAsync(string username, CancellationToken ct)
        => http.GetFromJsonAsync<GitHubUser>(\`users/\${username}\`, ct);
}

public record GitHubUser(string Login, string? Name, int Followers);`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Why should you never use "new HttpClient()" per request?',
      options: [
        'It is not thread-safe',
        'It exhausts the socket pool — sockets stay in TIME_WAIT even after disposal',
        'It does not support HTTPS',
        'It creates a memory leak in the GC',
      ],
      answer: 1,
      explanation: 'TCP sockets stay in a TIME_WAIT state for ~4 minutes after closing. Creating a new HttpClient per request quickly exhausts the available port range, causing SocketException under load.',
    },
    {
      q: 'What is the transient lifetime of a typed client wrapping?',
      options: [
        'The HttpClient is transient — a new socket is created every request',
        'The typed class is transient but the inner HttpMessageHandler is pooled',
        'Both the client and handler are singleton',
        'The typed client is scoped to the HTTP request',
      ],
      answer: 1,
      explanation: 'IHttpClientFactory creates a new HttpClient (and typed wrapper) per injection, but the underlying HttpMessageHandler is pooled and shared. This is the key design: fresh client configuration, pooled connections.',
    },
    {
      q: 'What does AddStandardResilienceHandler() add by default?',
      options: [
        'Only retry logic',
        'Only circuit breaker + timeout',
        'Rate limiter, total timeout, retry, circuit breaker, and per-attempt timeout',
        'Retry and exponential backoff only',
      ],
      answer: 2,
      explanation: 'The standard pipeline chains five strategies: rate limiter (outermost) → total request timeout → retry with exponential backoff → circuit breaker → per-attempt timeout (innermost). Each protects against a different failure mode.',
    },
    {
      q: 'DelegatingHandlers are applied in which order relative to the request/response?',
      options: [
        'Outermost first on request AND response',
        'Outermost first on request; innermost first on response',
        'Innermost first on both',
        'Random — handlers run concurrently',
      ],
      answer: 1,
      explanation: 'DelegatingHandlers form a chain. On the outgoing request: first-registered (outermost) executes first. On the incoming response: the innermost handler processes first, then unwinds outward — exactly like ASP.NET Core middleware.',
    },
    {
      q: 'When would you choose a named client over a typed client?',
      options: [
        'Named clients are always faster',
        'When you need to call multiple different APIs without creating a class per API',
        'Named clients support resilience; typed clients do not',
        'Named clients work in background services; typed clients do not',
      ],
      answer: 1,
      explanation: 'Typed clients couple a class to one API — clean for complex integrations. Named clients (CreateClient("name")) are lighter-weight when you need a preconfigured client without creating a wrapper class for each API.',
    },
    {
      q: 'Why should you register DelegatingHandlers as Transient rather than Singleton?',
      options: [
        'Singleton handlers are not supported by the factory',
        'Transient handlers prevent state sharing across concurrent requests and work with the factory\'s handler rotation cycle',
        'Singleton handlers cannot call base.SendAsync()',
        'Transient handlers are faster because they skip pooling',
      ],
      answer: 1,
      explanation: 'DelegatingHandler instances are tied to the handler pool rotation. They must be Transient so the factory can create a fresh instance for each pool generation. A Singleton handler would be reused across all rotations and could hold stale state or references to disposed scoped services.',
    },
    {
      q: 'What is the correct way to use a typed HttpClient inside an IHostedService (background service)?',
      options: [
        'Inject the typed client directly into the constructor',
        'Use IServiceScopeFactory to create a scope per iteration and resolve the typed client from it',
        'Register the typed client as Singleton to match the hosted service lifetime',
        'Use a named client instead — typed clients cannot be used in background services',
      ],
      answer: 1,
      explanation: 'Typed clients are Transient; hosted services are Singleton. Injecting a Transient into a Singleton creates a captive dependency where the first handler instance is captured for the service\'s lifetime, missing DNS rotations. IServiceScopeFactory creates a fresh scope each iteration, allowing the factory to manage handler lifetimes correctly.',
    },
    {
      q: 'What does the circuit breaker strategy do when it "opens"?',
      options: [
        'It queues requests until the downstream recovers',
        'It immediately rejects requests with an exception without making HTTP calls, for the configured break duration',
        'It retries the request on a different server',
        'It reduces the timeout to detect recovery faster',
      ],
      answer: 1,
      explanation: 'An open circuit rejects requests immediately (throwing BrokenCircuitException) without attempting any HTTP call. This protects the downstream from being overwhelmed during an outage and gives it time to recover. After the break duration, the circuit enters half-open state and allows one probe request.',
    },
    {
      q: 'What is the effect of setting BaseAddress as "https://api.example.com" (no trailing slash) vs "https://api.example.com/" (with trailing slash)?',
      options: [
        'No difference — HttpClient normalizes both forms',
        'Without trailing slash, relative paths replace the entire path; with trailing slash, they append correctly',
        'Without trailing slash, HttpClient throws an exception on the first request',
        'The trailing slash only matters for HTTPS, not HTTP',
      ],
      answer: 1,
      explanation: 'URI combination rules: "https://api.example.com" + "products/1" → "https://api.example.com/products/1" (works). But "https://api.example.com/v1" + "products/1" → "https://api.example.com/products/1" (drops /v1). With a trailing slash: "https://api.example.com/v1/" + "products/1" → "https://api.example.com/v1/products/1". Always include the trailing slash.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How does IHttpClientFactory prevent socket exhaustion?',
      a: 'The factory pools HttpMessageHandler instances. When you call CreateClient(), it returns a new HttpClient configured to use a handler from the pool. Handlers are retired after a configurable interval (default 2 minutes) and replaced — this also picks up DNS changes. The pooled handlers keep the underlying TCP connections alive and reuse them.',
    },
    {
      q: 'What is the difference between AddStandardResilienceHandler and AddResilienceHandler?',
      a: 'AddStandardResilienceHandler() installs a pre-built pipeline (rate limiter + total timeout + retry + circuit breaker + per-attempt timeout) with sensible defaults that cover most production scenarios. AddResilienceHandler() lets you compose a custom Polly v8 pipeline from scratch for fine-grained control over each strategy.',
    },
    {
      q: 'Can I use DelegatingHandlers with typed clients?',
      a: 'Yes. Call .AddHttpMessageHandler<MyHandler>() after AddHttpClient<T>(). The handler is applied to every request made by that typed client. Register DelegatingHandler subclasses as Transient in DI to avoid sharing state between requests.',
    },
    {
      q: 'How do I inject a typed client into a background service (IHostedService)?',
      a: 'Typed clients are Transient. A background service is effectively Singleton scope — directly injecting a Transient into it creates a captive dependency. Instead inject IHttpClientFactory and call CreateClient() inside the loop, or use IServiceScopeFactory to create a scope per iteration and resolve the typed client from it.',
    },
    {
      q: 'How do I set request-specific headers (e.g., per-user auth tokens) on a typed client?',
      a: 'Use a DelegatingHandler that reads the token from a scoped cache or IHttpContextAccessor and sets Authorization on the outgoing request. Do NOT store per-request data on the typed client itself — it is Transient but handlers are pooled, so handler state CAN be shared across requests if you are not careful.',
    },
    {
      q: 'How do I test a typed HttpClient without making real HTTP calls?',
      a: 'Replace the primary handler in tests: <code>.ConfigurePrimaryHttpMessageHandler(() => fakeHandler)</code> where <code>fakeHandler</code> is a <code>MockHttpMessageHandler</code> (from <code>RichardSzalay.MockHttp</code>) or a custom subclass that returns pre-configured responses. In WebApplicationFactory integration tests, call <code>ConfigureTestServices</code> to re-register the typed client with the fake handler. The typed client class is unaware of the substitution — only the transport changes.',
    },
    {
      q: 'When does the standard resilience pipeline NOT retry a failed request?',
      a: 'The retry strategy only fires on transient failures — by default: <code>HttpRequestException</code>, <code>RequestTimeout</code>, <code>ServiceUnavailable</code>, and <code>TooManyRequests</code> status codes. It does NOT retry on <code>BadRequest</code>, <code>Unauthorized</code>, <code>NotFound</code>, or other 4xx client errors, because these are deterministic failures where retrying would not help. Override <code>ShouldHandle</code> to customise which responses trigger a retry.',
    },
    {
      q: 'What is request hedging and when should you use it?',
      a: 'Hedging (<code>.AddHedging()</code> in Polly v8) sends a parallel speculative request if the primary does not respond within a threshold (e.g. 500ms). The first response to arrive wins; the other is cancelled. Use hedging for read-only, idempotent operations where tail latency matters more than duplicate requests — product catalog lookups, weather data, read-heavy APIs. Never hedge non-idempotent mutations (POST/PUT) as it causes duplicate side effects.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Creating new HttpClient() per request',
      wrong: `// In a controller or service — called on every request
public async Task<Product?> GetProductAsync(int id)
{
    using var client = new HttpClient(); // socket exhaustion under load!
    client.BaseAddress = new Uri("https://api.example.com");
    return await client.GetFromJsonAsync<Product>(\`/products/\${id}\`);
}`,
      right: `// Inject a typed client or IHttpClientFactory instead
public class ProductService(IProductApiClient client)
{
    public Task<Product?> GetProductAsync(int id)
        => client.GetAsync(id);
}
// Register once: builder.Services.AddHttpClient<IProductApiClient, ProductApiClient>()`,
      explanation: 'new HttpClient() per call creates a new socket per call. Sockets stay in TIME_WAIT for minutes after disposal, exhausting the port range under load. IHttpClientFactory pools the underlying HttpMessageHandler — sockets are reused, not created per request.',
    },
    {
      title: 'Injecting a typed client into a Singleton service',
      wrong: `// Singleton service captures the typed client (Transient) at first resolution
public class BackgroundWorker : IHostedService
{
    private readonly IProductApiClient _client;
    public BackgroundWorker(IProductApiClient client) // Captive dependency!
        => _client = client;
}`,
      right: `public class BackgroundWorker(IServiceScopeFactory scopeFactory) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            using var scope = scopeFactory.CreateScope();
            var client = scope.ServiceProvider.GetRequiredService<IProductApiClient>();
            await client.SyncAsync(ct);
            await Task.Delay(TimeSpan.FromMinutes(1), ct);
        }
    }
}`,
      explanation: 'Typed clients are Transient; hosted services are effectively Singleton. Capturing a Transient in a Singleton keeps the first handler instance alive indefinitely, bypassing the factory\'s 2-minute handler rotation and missing DNS changes. Create a new scope per work iteration instead.',
    },
    {
      title: 'Missing trailing slash on BaseAddress',
      wrong: `builder.Services.AddHttpClient<IProductApiClient, ProductApiClient>(c =>
{
    c.BaseAddress = new Uri("https://api.example.com/v1"); // No trailing slash!
});
// In client: GetFromJsonAsync("products/1")
// Result: https://api.example.com/products/1  ← /v1 was dropped!`,
      right: `builder.Services.AddHttpClient<IProductApiClient, ProductApiClient>(c =>
{
    c.BaseAddress = new Uri("https://api.example.com/v1/"); // Trailing slash
});
// In client: GetFromJsonAsync("products/1")
// Result: https://api.example.com/v1/products/1  ← correct`,
      explanation: 'URI combination rules: when the base URI path does not end with "/", the relative URI replaces the last path segment. Always set BaseAddress with a trailing slash, and use relative paths WITHOUT a leading slash in GetFromJsonAsync() calls.',
    },
    {
      title: 'Registering DelegatingHandlers as Singleton',
      wrong: `// Singleton handler — shared across all handler pool rotations
builder.Services.AddSingleton<BearerTokenHandler>();
builder.Services.AddHttpClient<IApiClient, ApiClient>()
    .AddHttpMessageHandler<BearerTokenHandler>();`,
      right: `// Transient handler — fresh instance per pool rotation
builder.Services.AddTransient<BearerTokenHandler>();
builder.Services.AddHttpClient<IApiClient, ApiClient>()
    .AddHttpMessageHandler<BearerTokenHandler>();`,
      explanation: 'Singleton handlers are created once and reused across all handler pool rotations. If the handler holds references to scoped services or stale tokens, those are never refreshed. Transient handlers are created fresh per rotation, ensuring they resolve current dependencies from DI.',
    },
    {
      title: 'Not handling circuit breaker open state in callers',
      wrong: `// Caller assumes the client always returns a result or null
var product = await _client.GetAsync(productId);
return product ?? DefaultProduct();`,
      right: `try
{
    var product = await _client.GetAsync(productId);
    return product ?? DefaultProduct();
}
catch (BrokenCircuitException)
{
    // Circuit is open — return cached/default without waiting for the downstream
    _logger.LogWarning("Product API circuit open, using cached data");
    return _cache.GetOrDefault(productId) ?? DefaultProduct();
}
catch (HttpRequestException ex)
{
    _logger.LogError(ex, "Product API request failed");
    return DefaultProduct();
}`,
      explanation: 'When the circuit breaker opens, Polly throws BrokenCircuitException immediately — the typed client throws, not returns null. Callers must handle this exception and return cached or default data. Unhandled BrokenCircuitException propagates as a 500 to the client, wasting the protection the circuit breaker was supposed to provide.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'IHttpClientFactory pools HttpMessageHandler instances to prevent socket exhaustion; typed clients wrap HttpClient in a domain class; resilience pipelines (Polly v8) add retry, circuit breaker, and timeout in a composable chain.',
    mustKnow: [
      '<code>new HttpClient()</code> per request exhausts sockets — always use <code>IHttpClientFactory</code>',
      'Typed clients are Transient wrappers; the inner <code>HttpMessageHandler</code> is pooled and rotated every 2 minutes for DNS refresh',
      '<code>AddStandardResilienceHandler()</code> chains: rate limiter → total timeout → retry → circuit breaker → per-attempt timeout',
      'Injecting a typed client into a Singleton is a captive dependency — use <code>IServiceScopeFactory</code> in background services',
      '<code>DelegatingHandler</code> subclasses must be registered as <strong>Transient</strong> and form a middleware chain on outgoing requests',
      'BaseAddress must end with "/" for relative paths to append correctly; without it, path segments get replaced',
      'Circuit breaker throws <code>BrokenCircuitException</code> when open — callers must catch and fall back',
    ],
    interviewFocus: [
      'Why does IHttpClientFactory prevent socket exhaustion, and what does "handler pooling" mean?',
      'What is the captive dependency problem with typed clients and hosted services?',
      'Standard resilience pipeline strategies and their execution order (outer → inner)',
      'How do you test a typed HttpClient without making real network calls?',
    ],
  };
}
