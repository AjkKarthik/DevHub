import { Component } from '@angular/core';
import { PageMetaComponent }      from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PrerequisitesComponent, Prerequisite } from '../../../shared/prerequisites/prerequisites';

const prerequisites: Prerequisite[] = [
  { label: 'Dependency Injection', route: '/aspnet/dependency-injection' },
  { label: 'Middleware', route: '/aspnet/middleware' },
];

const quickRef: QuickRefItem[] = [
  { name: 'AddHealthChecks()',       type: 'method',    desc: 'Registers health check services; returns IHealthChecksBuilder to add checks.' },
  { name: 'MapHealthChecks()',       type: 'method',    desc: 'Maps a health check endpoint to a route.' },
  { name: 'IHealthCheck',           type: 'interface', desc: 'Implement CheckHealthAsync(context, ct) to return HealthCheckResult.' },
  { name: 'HealthCheckResult',      type: 'class',     desc: 'Healthy / Degraded / Unhealthy with optional description and data.' },
  { name: 'AddDbContextCheck<T>()', type: 'method',    desc: 'Built-in EF Core check; runs CanConnectAsync() against the database.' },
  { name: 'AddUrlGroup()',          type: 'method',    desc: 'Checks that an external URL responds with a success status code.' },
  { name: 'UIResponseWriter',       type: 'class',     desc: 'From AspNetCore.HealthChecks.UI.Client — serialises checks to JSON.' },
  { name: 'AddOpenTelemetry()',     type: 'method',    desc: 'Entry point for OpenTelemetry tracing and metrics in .NET.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Liveness, Readiness, and Startup Probes',
    points: [
      '<strong>Liveness</strong> asks: is the process running and not deadlocked? A failed liveness check causes Kubernetes to restart the pod immediately. Never include external dependency checks here — a database outage should not cause pod restarts.',
      '<strong>Readiness</strong> asks: can this instance serve traffic right now? A failed readiness check removes the pod from the load balancer without restarting it. This is where DB, cache, and queue checks belong.',
      '<strong>Startup</strong> (Kubernetes only) gives slow-starting containers time to initialise before liveness/readiness probes run. Without it, liveness kills a pod that is still loading — a common misconfiguration.',
      'Map probes to separate paths: <code>/health/live</code> (no checks — <code>Predicate = _ => false</code>) and <code>/health/ready</code> (filtered by tag). The readiness endpoint is more expensive; never call it as the liveness probe.',
      'Use <code>HealthCheckOptions.Predicate</code> with tags to control which checks appear on each endpoint. Tags like <code>"ready"</code>, <code>"db"</code>, <code>"cache"</code> allow fine-grained filtering for different monitoring systems.',
      'Secure health endpoints: restrict liveness and readiness to internal networks using <code>.RequireHost()</code> or a network policy. A public endpoint can return aggregate status without revealing internal check names or durations.',
    ],
  },
  {
    heading: 'Built-in Checks and the Ecosystem',
    points: [
      'ASP.NET Core ships <code>AddDbContextCheck&lt;T&gt;</code> (calls <code>CanConnectAsync()</code>) and <code>AddUrlGroup</code> out of the box — no extra packages needed.',
      'The <strong>AspNetCore.Diagnostics.HealthChecks</strong> NuGet packages add checks for SQL Server, PostgreSQL, Redis, RabbitMQ, Azure Blob, SignalR, and 50+ more backends — install only what you need to avoid bloat.',
      'Per-check timeout prevents one slow dependency from blocking the entire health response. Pass a <code>TimeSpan</code> to built-in checks: <code>.AddUrlGroup(uri, timeout: TimeSpan.FromSeconds(3))</code>.',
      'The global <code>HealthCheckOptions.Timeout</code> (default 30 s) is the ceiling for the entire health check run. Ensure per-check timeouts are shorter to allow all checks to complete.',
      'Cache health check results in high-traffic APIs using <code>.AddHealthChecks().AddCheck&lt;T&gt;()</code> combined with a memory-cached wrapper — avoid running DB connectivity checks on every request in a high-RPS API.',
      'The <strong>HealthChecks UI</strong> package (<code>AspNetCore.HealthChecks.UI</code>) provides a dashboard at a configurable path. Store history in-memory, SQL, or CosmosDB. Useful for non-Kubernetes environments where there is no orchestrator probe.',
    ],
  },
  {
    heading: 'Custom IHealthCheck Implementation',
    points: [
      'Implement <code>CheckHealthAsync(HealthCheckContext context, CancellationToken ct)</code> and return one of three results: <code>HealthCheckResult.Healthy</code>, <code>.Degraded</code>, or <code>.Unhealthy</code>.',
      '<strong>Degraded</strong> is a warning state — the service works but is not at full capacity (license nearing expiry, replica count below desired, secondary cache offline). It does not trigger a restart but enables early alerting.',
      'Always attach structured <code>data</code> (<code>IReadOnlyDictionary&lt;string, object&gt;</code>) to results: expiry dates, free disk GB, queue depth, latency p99. This context is invaluable for on-call engineers.',
      'Register with <code>.AddCheck&lt;T&gt;("name", tags: ["ready"])</code>. The check is resolved from DI on each evaluation — inject <code>IServiceScopeFactory</code> if you need scoped services inside a singleton check.',
      'Wrap the body in <code>try/catch</code>: return <code>HealthCheckResult.Unhealthy("message", exception)</code> when dependencies throw. Unhandled exceptions propagate as <code>Unhealthy</code> anyway, but explicit handling lets you include context.',
      'Use <code>HealthCheckContext.Registration.FailureStatus</code> to honour the severity configured at registration time. Some hosts register an optional check as <code>HealthStatus.Degraded</code> — your check should respect this instead of hard-coding Unhealthy.',
    ],
  },
  {
    heading: 'Response Writers, Tags, and JSON Formatting',
    points: [
      'The default response is a plain-text <code>"Healthy"</code> / <code>"Degraded"</code> / <code>"Unhealthy"</code> string — almost never what monitoring tools need. Always provide a custom or UI <code>ResponseWriter</code>.',
      '<code>UIResponseWriter.WriteHealthCheckUIResponse</code> (from <code>AspNetCore.HealthChecks.UI.Client</code>) emits a rich JSON format compatible with the UI dashboard and most monitoring agents. Prefer it over rolling your own.',
      'Custom <code>ResponseWriter</code> is a <code>Func&lt;HttpContext, HealthReport, Task&gt;</code>. Set <code>ctx.Response.ContentType = "application/json"</code> before writing — do not rely on defaults.',
      'Tags enable multi-endpoint setups: tag DB and cache checks <code>"ready"</code>, tag expensive checks <code>"slow"</code>, tag critical infrastructure <code>"live"</code>. The Predicate filters by tag at the endpoint level — one set of registered checks serves many endpoints.',
      'HTTP status codes: <code>Healthy</code> → 200, <code>Degraded</code> → 200 (by default), <code>Unhealthy</code> → 503. Override with <code>HealthCheckOptions.ResultStatusCodes</code> — for example, return 200 for all statuses on the liveness endpoint so load balancers always see success.',
      'Set the <code>Content-Type</code> response header before returning. Some reverse proxies (nginx) gate traffic based on the HTTP status code of /health/ready — verify the status codes your proxy expects against what ASP.NET Core returns.',
    ],
  },
  {
    heading: 'OpenTelemetry — Traces, Metrics, and Aspire',
    points: [
      'OpenTelemetry (OTel) is the CNCF standard for distributed observability: a single instrumentation API that exports to any compatible backend (Jaeger, Zipkin, Prometheus, Grafana, Azure Monitor, Datadog) by swapping exporters.',
      '<code>AddOpenTelemetry().WithTracing()</code> captures distributed spans. Each inbound HTTP request, outbound <code>HttpClient</code> call, and EF Core query creates a child span with timing and metadata — zero code changes beyond registration.',
      '<code>.WithMetrics()</code> captures runtime metrics (GC collections, thread pool, request rate, error rate) plus custom metrics via <code>System.Diagnostics.Metrics.Meter</code>. <code>.AddPrometheusExporter()</code> exposes <code>/metrics</code> for Prometheus scraping.',
      'Create custom spans with <code>ActivitySource</code>: <code>private static readonly ActivitySource _src = new("MyService");</code> then <code>using var span = _src.StartActivity("OperationName")</code>. Add tags with <code>span?.SetTag("key", value)</code> for searchable attributes.',
      'Baggage propagates key–value pairs across process boundaries in HTTP headers — useful for passing a tenant ID or feature flag downstream without threading it through every method signature.',
      '.NET Aspire\'s <code>AddServiceDefaults()</code> wires OTel tracing, metrics, health checks, and resilience in one call. It is the recommended baseline for any new microservice — add it to the service defaults project and call it in every app.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Basic Setup',
    language: 'csharp',
    code: `builder.Services.AddHealthChecks()
    .AddDbContextCheck<AppDbContext>("database", tags: ["ready"])
    .AddUrlGroup(new Uri("https://api.github.com"), "github", tags: ["ready"])
    .AddRedis(builder.Configuration["Redis:ConnectionString"]!, "redis", tags: ["ready"]);

var app = builder.Build();

// Liveness — just "is the process alive?"
app.MapHealthChecks("/health/live", new HealthCheckOptions
{
    Predicate       = _ => false,   // no checks
    ResponseWriter  = WriteJsonResponse
});

// Readiness — all "ready" tagged checks
app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    Predicate      = c => c.Tags.Contains("ready"),
    ResponseWriter = WriteJsonResponse
});

static Task WriteJsonResponse(HttpContext ctx, HealthReport report)
{
    ctx.Response.ContentType = "application/json";
    return ctx.Response.WriteAsync(JsonSerializer.Serialize(new
    {
        status = report.Status.ToString(),
        checks = report.Entries.Select(e => new
        {
            name        = e.Key,
            status      = e.Value.Status.ToString(),
            description = e.Value.Description,
            durationMs  = e.Value.Duration.TotalMilliseconds
        })
    }));
}`,
  },
  {
    label: 'Custom IHealthCheck',
    language: 'csharp',
    code: `public class LicenseExpiryCheck(ILicenseService licenseService) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var expiry   = await licenseService.GetExpiryDateAsync(cancellationToken);
            var daysLeft = (expiry - DateTime.UtcNow).Days;

            var data = new Dictionary<string, object>
            {
                ["expiryDate"]      = expiry.ToString("yyyy-MM-dd"),
                ["daysRemaining"]   = daysLeft
            };

            return daysLeft switch
            {
                > 30  => HealthCheckResult.Healthy("License valid.", data),
                > 7   => HealthCheckResult.Degraded(\$"Expires in {daysLeft} days.", data: data),
                _     => HealthCheckResult.Unhealthy(\$"Expires in {daysLeft} days — act now!", data: data)
            };
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("Could not reach license service.", ex);
        }
    }
}

builder.Services.AddHealthChecks()
    .AddCheck<LicenseExpiryCheck>("license", tags: ["ready"]);`,
  },
  {
    label: 'EF Core + URL Checks',
    language: 'csharp',
    code: `// dotnet add package AspNetCore.HealthChecks.SqlServer
// dotnet add package AspNetCore.HealthChecks.Redis
// dotnet add package AspNetCore.HealthChecks.Uris

builder.Services.AddHealthChecks()
    // Built-in EF Core check
    .AddDbContextCheck<AppDbContext>("sql-efcore", tags: ["ready", "db"])
    // Raw SQL Server (without EF)
    .AddSqlServer(
        connectionString: builder.Configuration.GetConnectionString("Default")!,
        name: "sql-direct",
        tags: ["ready", "db"])
    // Redis connectivity
    .AddRedis(
        redisConnectionString: builder.Configuration["Redis"]!,
        name: "redis",
        tags: ["ready", "cache"])
    // External URL with timeout
    .AddUrlGroup(
        uri: new Uri("https://status.stripe.com/api/v2/status.json"),
        name: "stripe",
        httpMethod: HttpMethod.Get,
        tags: ["ready", "external"],
        timeout: TimeSpan.FromSeconds(3));`,
  },
  {
    label: 'JSON Response (UI format)',
    language: 'csharp',
    code: `// dotnet add package AspNetCore.HealthChecks.UI.Client

app.MapHealthChecks("/health", new HealthCheckOptions
{
    ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
});

// Sample output:
// {
//   "status": "Healthy",
//   "totalDuration": "00:00:00.1234567",
//   "entries": {
//     "database": { "status": "Healthy", "duration": "00:00:00.098", "tags": ["ready"] },
//     "redis":    { "status": "Healthy", ... }
//   }
// }

// Optional HealthChecks UI dashboard:
// dotnet add package AspNetCore.HealthChecks.UI
// dotnet add package AspNetCore.HealthChecks.UI.InMemory.Storage

builder.Services.AddHealthChecksUI(opts =>
{
    opts.AddHealthCheckEndpoint("API", "/health");
    opts.SetEvaluationTimeInSeconds(30);
}).AddInMemoryStorage();

app.MapHealthChecksUI(opts => opts.UIPath = "/health-ui");`,
  },
  {
    label: 'OpenTelemetry',
    language: 'csharp',
    code: `// dotnet add package OpenTelemetry.Extensions.Hosting
// dotnet add package OpenTelemetry.Instrumentation.AspNetCore
// dotnet add package OpenTelemetry.Instrumentation.Http
// dotnet add package OpenTelemetry.Exporter.Console

builder.Services.AddOpenTelemetry()
    .WithTracing(tracing => tracing
        .SetResourceBuilder(ResourceBuilder.CreateDefault()
            .AddService("MyApi", serviceVersion: "1.0"))
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation()
        .AddEntityFrameworkCoreInstrumentation()
        .AddConsoleExporter()       // dev
        .AddOtlpExporter()          // prod → OTel Collector
    )
    .WithMetrics(metrics => metrics
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation()
        .AddRuntimeInstrumentation()
        .AddPrometheusExporter()    // exposes /metrics for Prometheus
    );

// Custom span
private static readonly ActivitySource _activity = new("MyApi");

public async Task<Product?> GetProductAsync(int id)
{
    using var span = _activity.StartActivity("GetProduct");
    span?.SetTag("product.id", id);
    return await _db.Products.FindAsync(id);
}`,
  },
];

const challenge: Challenge = {
  title: 'Production-ready Health Checks',
  language: 'csharp',
  description: 'Add health checks to a web API:\n1. `/health/live` — liveness probe (always returns Healthy if the process responds).\n2. `/health/ready` — readiness probe with EF Core DB check and a custom `DiskSpaceCheck` that returns Degraded when free disk < 1 GB and Unhealthy when < 100 MB.\n3. Return JSON using a custom response writer.\n4. Restrict both endpoints to localhost only using `.RequireHost()`.',
  hints: [
    'Liveness: Predicate = _ => false (no checks)',
    'Tags: tag DB and DiskSpaceCheck with "ready"',
    'DriveInfo.GetDrives().FirstOrDefault(d => d.IsReady) gets disk info',
    '.RequireHost("localhost", "127.0.0.1") restricts to localhost',
  ],
  starterCode: `builder.Services.AddHealthChecks()
    .AddDbContextCheck<AppDbContext>("database", tags: ["ready"]);
    // TODO: add DiskSpaceCheck

app.MapHealthChecks("/health/live" /*, options */);
app.MapHealthChecks("/health/ready" /*, options */);`,
  solution: `public class DiskSpaceCheck : IHealthCheck
{
    public Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext ctx, CancellationToken ct = default)
    {
        var drive  = DriveInfo.GetDrives().FirstOrDefault(d => d.IsReady && d.DriveType == DriveType.Fixed);
        if (drive is null) return Task.FromResult(HealthCheckResult.Unhealthy("No fixed drive."));
        var freeGb = drive.AvailableFreeSpace / 1_073_741_824.0;
        var data   = new Dictionary<string, object> { ["freeGb"] = Math.Round(freeGb, 2) };
        return Task.FromResult(freeGb switch
        {
            > 1   => HealthCheckResult.Healthy(\$"{freeGb:F1} GB free.", data),
            > 0.1 => HealthCheckResult.Degraded(\$"Low disk: {freeGb:F2} GB.", data: data),
            _     => HealthCheckResult.Unhealthy(\$"Critical: {freeGb:F3} GB.", data: data),
        });
    }
}

builder.Services.AddHealthChecks()
    .AddDbContextCheck<AppDbContext>("database", tags: ["ready"])
    .AddCheck<DiskSpaceCheck>("disk", tags: ["ready"]);

static Task WriteJson(HttpContext ctx, HealthReport r)
{
    ctx.Response.ContentType = "application/json";
    return ctx.Response.WriteAsync(JsonSerializer.Serialize(new
    {
        status = r.Status.ToString(),
        checks = r.Entries.Select(e => new { name = e.Key, status = e.Value.Status.ToString(), ms = e.Value.Duration.TotalMilliseconds })
    }));
}

app.MapHealthChecks("/health/live",  new HealthCheckOptions { Predicate = _ => false, ResponseWriter = WriteJson })
   .RequireHost("localhost", "127.0.0.1");
app.MapHealthChecks("/health/ready", new HealthCheckOptions { Predicate = c => c.Tags.Contains("ready"), ResponseWriter = WriteJson })
   .RequireHost("localhost", "127.0.0.1");`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What is the difference between a liveness and a readiness check?',
    options: [
      'Liveness checks the database; readiness checks the process',
      'Liveness asks "is the process running?"; readiness asks "can it serve traffic now?"',
      'Liveness uses HTTP; readiness uses TCP',
      'They are the same — the naming is just a convention',
    ],
    answer: 1,
    explanation: 'Kubernetes uses liveness to decide whether to restart a pod and readiness to decide whether to route traffic to it. Failing liveness triggers a restart; failing readiness removes the pod from the load balancer.',
  },
  {
    q: 'What does HealthCheckResult.Degraded signal?',
    options: [
      'The application is about to crash',
      'The check is still running',
      'The service is running but not at full capacity — a warning state',
      'The check timed out',
    ],
    answer: 2,
    explanation: 'Degraded means the service is functioning but something is not optimal — e.g. high latency or a secondary dependency is offline. It does not cause a restart.',
  },
  {
    q: 'Which Predicate expression should the liveness endpoint use?',
    options: [
      'Predicate = c => c.Tags.Contains("live")',
      'Predicate = _ => true',
      'Predicate = _ => false',
      'No Predicate is needed',
    ],
    answer: 2,
    explanation: 'Predicate = _ => false means no checks are executed — the endpoint just returns Healthy if the process is responsive. Including dependency checks on the liveness probe causes unnecessary pod restarts when, e.g., the database is temporarily unavailable.',
  },
  {
    q: 'What HTTP status code does ASP.NET Core return for an Unhealthy result by default?',
    options: ['200', '400', '503', '500'],
    answer: 2,
    explanation: 'Unhealthy returns 503 Service Unavailable by default, which signals load balancers and orchestrators to stop routing traffic. Override with HealthCheckOptions.ResultStatusCodes if a different status is required.',
  },
  {
    q: 'Why should you NOT include a database check on the liveness probe in a Kubernetes deployment?',
    options: [
      'Databases cannot be checked with HTTP',
      'A database outage would cause all pods to be restarted, amplifying the outage',
      'The liveness probe only runs once at startup',
      'Health checks cannot connect to databases',
    ],
    answer: 1,
    explanation: 'If the database goes down, a liveness-failing pod gets restarted. But the new pod also fails liveness immediately. The orchestrator enters a crash-loop, taking all instances offline when only a dependency failed.',
  },
  {
    q: 'How do you inject a scoped service (like DbContext) into a custom IHealthCheck?',
    options: [
      'Mark the health check as Scoped in DI',
      'Inject IServiceScopeFactory and create a scope inside CheckHealthAsync',
      'Use a static field to hold the DbContext',
      'Health checks cannot use scoped services',
    ],
    answer: 1,
    explanation: 'Health checks are registered as Singletons. Injecting a Scoped service directly causes a captive dependency. Instead, inject IServiceScopeFactory and call CreateAsyncScope() inside CheckHealthAsync to resolve a fresh scoped DbContext for each evaluation.',
  },
  {
    q: 'What does UIResponseWriter.WriteHealthCheckUIResponse provide?',
    options: [
      'An HTML dashboard for health checks',
      'A plain-text response with status only',
      'A structured JSON response compatible with the HealthChecks UI dashboard and monitoring agents',
      'An XML format for legacy monitoring tools',
    ],
    answer: 2,
    explanation: 'From the AspNetCore.HealthChecks.UI.Client package, UIResponseWriter emits a rich JSON format that includes per-check status, duration, tags, and exception details — far more useful than the default plain-text string.',
  },
  {
    q: 'What is the purpose of OpenTelemetry Baggage?',
    options: [
      'To compress trace data before export',
      'To propagate key–value pairs across service boundaries in HTTP headers',
      'To store trace data locally on disk',
      'To replace distributed tracing entirely',
    ],
    answer: 1,
    explanation: 'Baggage flows key–value pairs with every request across process boundaries via W3C Baggage headers. Common uses include propagating tenant ID, correlation ID, or feature flags without threading them through every method signature.',
  },
  {
    q: 'What does .NET Aspire\'s AddServiceDefaults() configure automatically?',
    options: [
      'Only health check endpoints',
      'OpenTelemetry tracing and metrics, health checks, and HTTP resilience in one call',
      'Only OpenTelemetry exporters',
      'Entity Framework Core and Redis connection strings',
    ],
    answer: 1,
    explanation: 'AddServiceDefaults() (called in each app project) wires OTel tracing + metrics, liveness/readiness health check endpoints, and Polly-based HttpClient resilience — a consistent observability baseline across all services in the Aspire solution.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'Should I expose /health publicly?',
    a: 'The liveness endpoint is usually kept internal — only the orchestrator needs it. Public exposure reveals infrastructure topology. Use RequireHost() or a network policy to restrict access, or return a minimal response without check names and durations on any publicly reachable endpoint.',
  },
  {
    q: 'How does OpenTelemetry compare to Application Insights SDK?',
    a: 'OpenTelemetry is vendor-neutral — the same instrumentation exports to Jaeger, Prometheus, Azure Monitor, or any OTLP-compatible backend by swapping exporters. Application Insights SDK is Azure-specific. Microsoft now recommends OTel for all new projects; the AI SDK exports to the OTel exporter internally.',
  },
  {
    q: 'Can health checks time out?',
    a: 'Yes — set HealthCheckOptions.Timeout (default 30 s) for the entire run. Set per-check timeouts on built-in checks (AddUrlGroup, AddRedis) to prevent one slow dependency from blocking the response. A timed-out check reports Unhealthy.',
  },
  {
    q: 'How do I cache health check results to avoid hammering the database on every request?',
    a: 'Wrap the check logic in IMemoryCache with a short TTL (e.g. 10–30 seconds). Alternatively, run health checks on a background timer and store the last result — the endpoint reads the cached result instantly. This is critical for high-RPS APIs where the /health/ready endpoint is polled by every load balancer node.',
  },
  {
    q: 'What is the difference between AddDbContextCheck and AddSqlServer?',
    a: 'AddDbContextCheck<T> resolves a DbContext from DI and calls CanConnectAsync() — it exercises the full EF Core stack and validates connection string + provider config. AddSqlServer opens a raw ADO.NET connection and runs a simple query — faster and useful when you do not have EF in the project or want to test a specific connection string independently.',
  },
  {
    q: 'How do I create a custom metric with OpenTelemetry in .NET?',
    a: 'Use System.Diagnostics.Metrics.Meter: create a static readonly Meter instance, then create instruments (Counter, Histogram, ObservableGauge). Register the meter name with .AddMeter("YourMeter.Name") in the WithMetrics builder. OTel collects and exports measurements automatically — no extra code at the call site.',
  },
  {
    q: 'Can I use health checks with non-Kubernetes environments?',
    a: 'Yes — the HealthChecks UI package provides a self-hosted dashboard polling your endpoints on a configurable interval. AWS ALB, Azure Load Balancer, and nginx all support HTTP health probes. Even locally, you can curl /health/ready to see the JSON status of all your dependencies without a full distributed-tracing setup.',
  },
  {
    q: 'How does HealthCheckContext.Registration.FailureStatus work?',
    a: 'When registering a check, you can specify the failure status: .AddCheck<T>("name", failureStatus: HealthStatus.Degraded). If the check throws or returns Unhealthy, the framework uses FailureStatus instead — allowing non-critical checks to degrade rather than fail the entire readiness endpoint. Your check should call context.Registration.FailureStatus when determining what to return for boundary cases.',
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Database check on the liveness probe',
    wrong: `app.MapHealthChecks("/health/live", new HealthCheckOptions
{
    Predicate = c => c.Tags.Contains("ready") // DB check included!
});`,
    right: `app.MapHealthChecks("/health/live", new HealthCheckOptions
{
    Predicate = _ => false // No checks — process responsiveness only
});`,
    explanation: 'Including dependency checks on the liveness probe means a transient database outage triggers a pod restart. The restart fails for the same reason, causing a crash-loop that takes all replicas offline simultaneously.',
  },
  {
    title: 'Returning the default plain-text response',
    wrong: `app.MapHealthChecks("/health");
// Returns: "Healthy" — a plain string`,
    right: `app.MapHealthChecks("/health", new HealthCheckOptions
{
    ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
});
// Returns structured JSON with per-check status and durations`,
    explanation: 'The default response is a bare string that monitoring systems cannot parse. Always configure a JSON response writer so dashboards, alerting tools, and operators can see which specific check failed and how long it took.',
  },
  {
    title: 'Injecting scoped DbContext directly into a health check',
    wrong: `public class DbCheck(AppDbContext db) : IHealthCheck
{
    // Captive dependency — check is Singleton, db is Scoped
}`,
    right: `public class DbCheck(IServiceScopeFactory scopeFactory) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(...)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var ok = await db.Database.CanConnectAsync(cancellationToken);
        return ok ? HealthCheckResult.Healthy() : HealthCheckResult.Unhealthy();
    }
}`,
    explanation: 'Health checks are registered as Singletons. Injecting a Scoped DbContext creates a captive dependency — the same DbContext instance is reused across all check evaluations, causing concurrency issues and stale state.',
  },
  {
    title: 'Not setting per-check timeouts on external dependencies',
    wrong: `.AddUrlGroup(new Uri("https://slow-vendor.com/status"), "vendor", tags: ["ready"])
// No timeout — blocks entire health response for 30 s if vendor hangs`,
    right: `.AddUrlGroup(
    new Uri("https://slow-vendor.com/status"), "vendor",
    tags: ["ready"],
    timeout: TimeSpan.FromSeconds(3))
// Returns Unhealthy after 3 s instead of blocking all checks`,
    explanation: 'External URL and third-party API checks can hang for tens of seconds. Without a per-check timeout, one slow vendor blocks the entire health response — making the readiness endpoint appear unresponsive to the load balancer.',
  },
  {
    title: 'Using @media prefers-color-scheme instead of :host-context(body.dark)',
    wrong: `@media (prefers-color-scheme: dark) {
  .health-status { color: #67e8f9; }
}`,
    right: `:host-context(body.dark) .health-status {
  color: #67e8f9;
}`,
    explanation: 'DevHub toggles dark mode by adding a class to <body>. The @media query responds to the OS preference, not the site toggle — causing the health-checks page to ignore the user\'s in-app dark mode selection and appear broken.',
  },
];

const revision: RevisionSummary = {
  oneLiner: 'Health checks expose /health/live (liveness) and /health/ready (readiness) endpoints that Kubernetes and load balancers probe; OpenTelemetry adds vendor-neutral distributed tracing and metrics.',
  mustKnow: [
    'Liveness = process alive? (no dependency checks, triggers restart on failure); Readiness = can serve traffic? (dependencies included, removes from LB on failure)',
    'Predicate = _ => false on the liveness endpoint — never add dependency checks there',
    'AddDbContextCheck<T>() calls CanConnectAsync(); tag checks with "ready" and filter in MapHealthChecks Predicate',
    'HealthCheckResult.Degraded is a warning state (service works, not at full capacity) — does not trigger restarts',
    'IHealthCheck is Singleton — inject IServiceScopeFactory to resolve Scoped services inside CheckHealthAsync',
    'UIResponseWriter.WriteHealthCheckUIResponse emits structured JSON; default response is a bare plain-text string',
    'OpenTelemetry: AddOpenTelemetry().WithTracing() + .WithMetrics(); custom spans via ActivitySource; Aspire\'s AddServiceDefaults() pre-wires everything',
  ],
  interviewFocus: [
    'Why should the liveness probe have no dependency checks? (DB outage → crash-loop killing all replicas)',
    'How do you prevent a slow external URL check from blocking the entire health response? (per-check timeout)',
    'How do you safely use DbContext in a Singleton health check? (IServiceScopeFactory + CreateAsyncScope)',
    'What is the difference between OpenTelemetry traces and metrics? (traces = per-request spans; metrics = aggregate counters/histograms)',
  ],
};

@Component({
  selector: 'app-aspnet-health-checks',
  standalone: true,
  imports: [
    PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent, PageCompleteComponent,
    CommonMistakesComponent, RevisionCardComponent, PrerequisitesComponent,
  ],
  templateUrl: './health-checks.html',
  styleUrl: './health-checks.scss',
})
export class AspnetHealthChecks {
  prerequisites = prerequisites;
  quickRef      = quickRef;
  theory        = theory;
  codeTabs      = codeTabs;
  challenge     = challenge;
  quiz          = quiz;
  qna           = qna;
  mistakes      = mistakes;
  revision      = revision;
}
