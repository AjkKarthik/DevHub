import { Component } from '@angular/core';
import { PageMetaComponent }      from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

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
    heading: 'Liveness vs readiness',
    points: [
      '<strong>Liveness</strong>: is the process running and not deadlocked? If liveness fails, the orchestrator (k8s) restarts the pod. The liveness probe should never check external dependencies — a DB outage must not cause pod restarts.',
      '<strong>Readiness</strong>: can this instance serve traffic right now? If readiness fails, the pod is removed from the load balancer but not restarted. Include DB, cache, and dependency checks here.',
      'Map them to separate paths: <code>/health/live</code> (no checks — just "is the process alive?") and <code>/health/ready</code> (all "ready" tagged checks). Use <code>HealthCheckOptions.Predicate</code> to filter.',
    ],
  },
  {
    heading: 'Built-in checks',
    points: [
      'ASP.NET Core ships <code>AddDbContextCheck&lt;T&gt;</code> (calls <code>CanConnectAsync()</code>) and <code>AddUrlGroup</code> out of the box.',
      'The <strong>AspNetCore.Diagnostics.HealthChecks</strong> NuGet package adds checks for Redis, RabbitMQ, SQL Server, Azure Blob, and many more — install only what you need.',
      'Use <code>tags</code> to categorise checks and filter which endpoint exposes them. The default response is a plain string — always provide a JSON <code>ResponseWriter</code> for monitoring tools.',
    ],
  },
  {
    heading: 'Custom IHealthCheck',
    points: [
      'Implement <code>CheckHealthAsync</code> and return <code>HealthCheckResult.Healthy</code>, <code>.Degraded</code>, or <code>.Unhealthy</code>. Inject services normally — the check is resolved from DI.',
      '<strong>Degraded</strong> means functional but not at full capacity (e.g. license expiring, secondary cache offline) — a warning state that does not trigger restarts.',
      'Register with <code>AddCheck&lt;T&gt;("name", tags: ["ready"])</code>. Set per-check timeouts on built-in checks to avoid blocking the response on slow dependencies.',
    ],
  },
  {
    heading: 'OpenTelemetry (OTel)',
    points: [
      'OpenTelemetry is the vendor-neutral observability standard for .NET. <code>AddOpenTelemetry().WithTracing()</code> captures distributed traces; <code>.WithMetrics()</code> captures metrics.',
      'Export to the OTel Collector, then on to Jaeger, Prometheus, Grafana, or Azure Monitor by swapping exporters — the instrumentation code stays the same.',
      'The .NET Aspire <code>AddServiceDefaults()</code> extension pre-wires OTel, health checks, and resilience in one call — the recommended starting point for new services.',
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
                > 7   => HealthCheckResult.Degraded($"Expires in {daysLeft} days.", data: data),
                _     => HealthCheckResult.Unhealthy($"Expires in {daysLeft} days — act now!", data: data)
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

// Custom span in your code
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
            > 1   => HealthCheckResult.Healthy($"{freeGb:F1} GB free.", data),
            > 0.1 => HealthCheckResult.Degraded($"Low disk: {freeGb:F2} GB.", data: data),
            _     => HealthCheckResult.Unhealthy($"Critical: {freeGb:F3} GB.", data: data),
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
];

const qna: QnaItem[] = [
  {
    q: 'Should I expose /health publicly?',
    a: 'The liveness endpoint is usually kept internal — only the orchestrator needs it. Public exposure reveals infrastructure topology. Use RequireHost() or a network policy to restrict access, or return a minimal response without check details on the public endpoint.',
  },
  {
    q: 'How does OpenTelemetry compare to Application Insights SDK?',
    a: 'OpenTelemetry is vendor-neutral — the same instrumentation exports to Jaeger, Prometheus, Azure Monitor, or any OTLP-compatible backend by swapping exporters. Application Insights SDK is Azure-specific. Microsoft now recommends OTel for new projects.',
  },
  {
    q: 'Can health checks time out?',
    a: 'Yes — set HealthCheckOptions.Timeout (default 30 s). You can also pass a TimeSpan per-check to AddUrlGroup and similar built-in checks. A timed-out check reports Unhealthy.',
  },
];

@Component({
  selector: 'app-aspnet-health-checks',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent, PageCompleteComponent],
  templateUrl: './health-checks.html',
  styleUrl: './health-checks.scss',
})
export class AspnetHealthChecks {
  quickRef  = quickRef;
  theory    = theory;
  codeTabs  = codeTabs;
  challenge = challenge;
  quiz      = quiz;
  qna       = qna;
}
