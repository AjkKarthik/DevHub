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
  selector: 'app-aspnet-http-clients',
  standalone: true,
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
            QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
            PageMetaComponent, PageCompleteComponent],
  templateUrl: './http-clients.html',
  styleUrl: './http-clients.scss',
})
export class AspnetHttpClients {

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
        '<code>new HttpClient()</code> per request exhausts the socket pool — even after disposal, sockets stay in TIME_WAIT. <code>IHttpClientFactory</code> pools the inner <code>HttpMessageHandler</code> and recycles it on a configurable interval (default 2 minutes).',
        'The factory also rotates handlers to pick up DNS changes — long-lived <code>HttpClient</code> instances can cache stale DNS entries for the lifetime of the app.',
        'Three registration patterns: <strong>basic</strong> (inject <code>IHttpClientFactory</code>, call <code>CreateClient()</code>), <strong>named</strong> (pre-configure by name), <strong>typed</strong> (wrap <code>HttpClient</code> in a service class). Typed clients are the recommended pattern for most scenarios.',
      ],
    },
    {
      heading: 'Typed Clients',
      points: [
        'A typed client is a class that takes <code>HttpClient</code> as a constructor dependency. Register with <code>builder.Services.AddHttpClient&lt;IProductApiClient, ProductApiClient&gt;()</code> and configure the base address and headers there.',
        'Typed clients are registered as <strong>transient</strong> — each injection creates a new instance. The underlying handler is still pooled by the factory, so this is safe.',
        'Pair one typed client with one downstream API. The client class encapsulates endpoints, serialization, and error handling — callers see a clean domain method, not raw HTTP.',
      ],
    },
    {
      heading: 'Resilience with Microsoft.Extensions.Resilience',
      points: [
        '<code>AddStandardResilienceHandler()</code> adds a pre-configured pipeline: rate limiter → total request timeout → retry (exponential back-off, up to 3 attempts) → circuit breaker (50% failure threshold) → per-attempt timeout. One line covers most production needs.',
        'Resilience pipelines use <strong>Polly v8</strong> under the hood. Strategies compose left to right — the outermost strategy (rate limiter) wraps all inner ones.',
        'Override individual strategy options via the configure callback: <code>.AddStandardResilienceHandler(o =&gt; o.Retry.MaxRetryAttempts = 5)</code>. Use <code>AddResilienceHandler()</code> for a fully custom pipeline.',
      ],
    },
    {
      heading: 'DelegatingHandlers (HttpClient Middleware)',
      points: [
        '<code>DelegatingHandler</code> subclasses work like middleware — override <code>SendAsync</code>, call <code>base.SendAsync()</code>, and inspect the request/response before and after.',
        'Common uses: inject bearer tokens from a token cache, add <code>X-Correlation-Id</code> headers, log request durations, and retry specific error codes.',
        'Register in the pipeline with <code>.AddHttpMessageHandler&lt;MyHandler&gt;()</code>. Handlers are applied in registration order — outermost first on the request, innermost first on the response.',
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
  ];
}
