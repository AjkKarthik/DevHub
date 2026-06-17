import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';
import { BeforeAfterComponent, BeforeAfterExample } from '../../../shared/before-after/before-after';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { PrerequisitesComponent, Prerequisite } from '../../../shared/prerequisites/prerequisites';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';

@Component({
  selector: 'app-aspnet-aspire',
  standalone: true,
  imports: [
    PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent, PageCompleteComponent,
    BeforeAfterComponent, CommonMistakesComponent, PrerequisitesComponent, RevisionCardComponent,
  ],
  templateUrl: './aspire.html',
  styleUrl: './aspire.scss',
})
export class AspnetAspire {

  prerequisites: Prerequisite[] = [
    { label: 'Dependency Injection', route: '/aspnet/dependency-injection' },
    { label: 'Deployment & Hosting', route: '/aspnet/deployment' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'AddProject<T>()',             type: 'method',  desc: 'Add a .NET project to the Aspire AppHost for orchestration. T is the generated project class.', since: 'Aspire 8+' },
    { name: 'AddRedis()',                  type: 'method',  desc: 'Add a Redis container to the AppHost. Returns a resource reference for WithReference().', since: 'Aspire 8+' },
    { name: 'AddPostgres()',               type: 'method',  desc: 'Add a PostgreSQL container; chain .AddDatabase("name") to create a named database resource.', since: 'Aspire 8+' },
    { name: 'WithReference()',             type: 'method',  desc: 'Injects connection info (connection string or service endpoint) into a dependent project as env vars.', since: 'Aspire 8+' },
    { name: 'AddServiceDefaults()',        type: 'method',  desc: 'Extension on IHostApplicationBuilder — wires OpenTelemetry, health checks, and resilience in one call.', since: 'Aspire 8+' },
    { name: 'MapDefaultEndpoints()',       type: 'method',  desc: 'Maps /health and /alive endpoints automatically — no manual MapHealthChecks() needed.', since: 'Aspire 8+' },
    { name: 'WithExternalHttpEndpoints()', type: 'method',  desc: 'Exposes a service endpoint to the Aspire dashboard and to browsers for direct HTTP access.', since: 'Aspire 8+' },
    { name: 'https+http://name',           type: 'keyword', desc: 'Service discovery URI — Aspire resolves "name" to the actual address, preferring HTTPS with HTTP fallback.', since: 'Aspire 8+' },
    { name: 'azd up',                      type: 'keyword', desc: 'Azure Developer CLI: provision Azure resources (Container Apps, Redis, Postgres) and deploy all services.', since: 'azd 1.0+' },
    { name: 'AddRabbitMQ()',               type: 'method',  desc: 'Add a RabbitMQ container to the AppHost for message-based integration between services.', since: 'Aspire 8+' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What .NET Aspire solves — the multi-service local dev problem',
      points: [
        'Building a microservice app locally traditionally requires: a docker-compose.yml to spin up Redis/Postgres/RabbitMQ, manual environment variables to wire services together, hardcoded port numbers across configs, and separate tooling to view logs from each service. Aspire replaces all of this with a C# AppHost.',
        'Run the AppHost and Aspire automatically starts the required containers, launches your .NET projects with injected connection strings and service URLs, and opens a built-in dashboard showing logs, metrics, and distributed traces from every service in real time.',
        'Aspire is a <strong>local development and integration testing tool</strong>, not a production orchestrator. It dramatically reduces onboarding friction — a new developer clones the repo and runs the AppHost without reading a README about port numbers or environment variable setup.',
        'The AppHost is a regular .NET console project that references <code>Aspire.Hosting</code>. You describe your topology in C# (projects, containers, databases, queues) and Aspire interprets it at runtime — starting processes, pulling Docker images, and setting environment variables.',
        'Aspire integrates with the Azure Developer CLI (<code>azd</code>). Running <code>azd init</code> inside the AppHost generates Bicep infrastructure templates and a deployment manifest. <code>azd up</code> provisions Azure Container Apps, managed databases, and caches, then deploys all services in one command.',
      ],
    },
    {
      heading: 'AppHost composition — describing your topology in code',
      points: [
        'The AppHost\'s <code>Program.cs</code> is a declarative topology: <code>AddRedis("redis")</code> creates a Redis resource; <code>AddPostgres("postgres").AddDatabase("mydb")</code> creates a PostgreSQL instance with a named database; <code>AddProject&lt;Projects.MyApp_Api&gt;("api")</code> adds a .NET project.',
        '<code>WithReference(resource)</code> wires a resource to a project — Aspire injects the connection string or endpoint as environment variables that the standard IConfiguration system reads automatically. No manual env-var names to remember.',
        'Container ports are randomly assigned each run — Aspire\'s service discovery layer translates logical names to actual ports. Services reference each other by name (<code>"https+http://api"</code>), never by localhost:5123.',
        '<code>WithExternalHttpEndpoints()</code> marks a service as accessible from outside the AppHost process — this makes its URL appear in the dashboard and allows browsers to call it directly during development.',
        'You can add non-.NET resources too: <code>AddDockerfile("nginx", "./nginx/Dockerfile")</code> builds and runs any Docker image. <code>AddParameter("jwt-secret")</code> prompts for secrets at startup. <code>AddAzureServiceBus()</code> uses the Azure emulator locally and real Azure in CI.',
      ],
    },
    {
      heading: 'Service defaults — OTel, health checks, and resilience in one call',
      points: [
        'The ServiceDefaults project (generated by <code>dotnet new aspire-servicedefaults</code>) is a shared class library that exposes <code>AddServiceDefaults()</code>. Every service project references it and calls <code>builder.AddServiceDefaults()</code> in its <code>Program.cs</code> — one call wires everything.',
        '<code>AddServiceDefaults()</code> configures <strong>OpenTelemetry</strong> (traces, metrics, logs exported to the Aspire dashboard via OTLP), <strong>health checks</strong> (<code>/health</code> and <code>/alive</code> via <code>app.MapDefaultEndpoints()</code>), and <strong>standard HTTP resilience</strong> (retries + circuit breaker via <code>AddStandardResilienceHandler()</code>).',
        'Service discovery is enabled by <code>AddServiceDiscovery()</code> inside ServiceDefaults. It reads <code>services__api__https__0</code> environment variables (injected by Aspire) and resolves <code>"https+http://api"</code> to the actual address — transparent to the HttpClient.',
        'You can extend ServiceDefaults with app-specific defaults — logging enrichment, custom metrics, shared authentication policies. All services inherit the change with a single shared project update.',
        'In non-Aspire environments (staging, production), the same ServiceDefaults code works: OTel is exported to whatever OTLP endpoint <code>OTEL_EXPORTER_OTLP_ENDPOINT</code> points to (Jaeger, Tempo, Application Insights). The Aspire dashboard is a local dev convenience, not a requirement.',
      ],
    },
    {
      heading: 'Aspire dashboard — distributed tracing and observability',
      points: [
        'The Aspire dashboard starts automatically when you run the AppHost (typically at <code>http://localhost:15137</code>). It shows <strong>structured logs</strong> from every service in a unified view, filterable by level, service, and trace ID.',
        '<strong>Distributed traces</strong> visualise a single request flowing across multiple services. Click any trace to see a waterfall of spans — API receives the HTTP request, calls the worker, which queries Redis, which queries Postgres — with timing for each step. No Jaeger to configure.',
        '<strong>Metrics</strong> show real-time graphs of request rate, error rate, latency percentiles (P50/P95/P99), and .NET runtime metrics (GC, thread pool, memory). These come automatically from OpenTelemetry instrumentation in the SDK.',
        'The dashboard is <strong>ephemeral</strong> — data is held in memory for the duration of the AppHost run. For persistent long-term observability, export OTel data to a backend (Prometheus + Grafana, Application Insights, Datadog) alongside the local dashboard.',
        'Each service\'s <strong>environment variables</strong> and <strong>resource details</strong> are visible in the dashboard. This is invaluable during debugging — you can inspect exactly what connection string was injected into a service without reading documentation or grepping config files.',
      ],
    },
    {
      heading: 'Aspire integrations — the resource ecosystem',
      points: [
        'Aspire provides NuGet packages for dozens of popular infrastructure components. Install the AppHost integration (<code>Aspire.Hosting.Redis</code>) for the AppHost composition, and the client integration (<code>Aspire.StackExchange.Redis</code>) in service projects for the actual client with automatic OTel instrumentation.',
        'Available integrations (partial list): Redis (<code>AddRedis/AddRedisDistributedCache</code>), PostgreSQL (<code>AddPostgres/AddNpgsqlDbContext</code>), SQL Server (<code>AddSqlServer/AddSqlServerDbContext</code>), RabbitMQ (<code>AddRabbitMQ/AddRabbitMQClient</code>), Kafka (<code>AddKafka</code>), MongoDB (<code>AddMongoDB</code>), Azure Service Bus, Azure Blob Storage.',
        'Each client integration automatically instruments the client library with OpenTelemetry — Redis commands, database queries, and message sends all appear as spans in the distributed trace without any manual instrumentation code.',
        'For resources not covered by an official integration: <code>builder.AddContainer("my-service", "my-image:tag").WithEndpoint(port: 8080)</code> adds any Docker image. The container is started by Aspire and its endpoint is available for service discovery.',
        'In CI pipelines, Aspire AppHosts can be used for integration test infrastructure — spin up the full stack, run tests against real services, tear down. Libraries like <code>Aspire.Hosting.Testing</code> provide <code>DistributedApplicationTestingBuilder</code> for programmatic control in test suites.',
      ],
    },
    {
      heading: 'Deploying Aspire apps — azd and container publishing',
      points: [
        '<code>azd init</code> inside the AppHost detects the Aspire topology and generates an <code>azure.yaml</code> manifest and Bicep templates for Azure. <code>azd up</code> provisions Azure Container Apps (one per service), Azure Cache for Redis, and Azure Database for PostgreSQL Flexible Server — then deploys all container images.',
        'Aspire generates the deployment manifest from the AppHost <code>dotnet run --publisher manifest --output-path aspire-manifest.json</code>. This JSON describes every resource, connection, and image — tools (azd, custom CI scripts) read it to produce deployment targets.',
        'For non-Azure targets, <code>dotnet publish</code> produces standard container images for each service. Deploy them to any Kubernetes cluster or container platform — the AppHost only runs locally; production uses the standard container deployment pipeline.',
        'Secrets in production: <code>azd</code> stores secrets in Azure Key Vault and wires them to Container Apps as managed identity references. Connection strings injected by Aspire locally become Key Vault references in production — the same <code>IConfiguration</code> key, different secret backend.',
        'Aspire is evolving rapidly (introduced in .NET 8, major updates in .NET 9 and 9.1). New integrations ship between .NET releases as NuGet packages. Check the <code>dotnet/aspire</code> GitHub repo and the official Aspire documentation for the latest integration catalogue.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'AppHost Definition',
      language: 'csharp',
      code: `// MyApp.AppHost/Program.cs
var builder = DistributedApplication.CreateBuilder(args);

// ── Infrastructure resources ────────────────────────────────────────────
var redis    = builder.AddRedis("redis");
var postgres = builder.AddPostgres("postgres")
                      .AddDatabase("appdb");
var rabbit   = builder.AddRabbitMQ("messaging");

// ── Service projects ─────────────────────────────────────────────────────
var api = builder.AddProject<Projects.MyApp_Api>("api")
    .WithReference(redis)
    .WithReference(postgres)
    .WithReference(rabbit)
    .WithExternalHttpEndpoints();       // ← show in dashboard + allow browser access

builder.AddProject<Projects.MyApp_Worker>("worker")
    .WithReference(redis)
    .WithReference(rabbit)
    .WithReference(api);               // ← worker discovers API by name

builder.Build().Run();

// Running the AppHost starts:
//   • Redis + PostgreSQL + RabbitMQ containers (via Docker)
//   • api  project (injected: ConnectionStrings__appdb, ConnectionStrings__redis, …)
//   • worker project (same injection)
//   • Aspire dashboard → http://localhost:15137`,
    },
    {
      label: 'Service Defaults',
      language: 'csharp',
      code: `// MyApp.ServiceDefaults/Extensions.cs  (dotnet new aspire-servicedefaults)

public static class Extensions
{
    public static IHostApplicationBuilder AddServiceDefaults(
        this IHostApplicationBuilder builder)
    {
        // OpenTelemetry — traces + metrics → Aspire dashboard via OTLP
        builder.ConfigureOpenTelemetry();

        // Health checks — /health and /alive via app.MapDefaultEndpoints()
        builder.AddDefaultHealthChecks();

        // Service discovery + HTTP resilience (retries + circuit breaker)
        builder.Services.AddServiceDiscovery();
        builder.Services.ConfigureHttpClientDefaults(http =>
        {
            http.AddStandardResilienceHandler();
            http.AddServiceDiscovery();
        });
        return builder;
    }
}

// ── Each service project (API, Worker, etc.) ─────────────────────────
var builder = WebApplication.CreateBuilder(args);
builder.AddServiceDefaults();               // ← one call wires OTel + health + discovery

builder.AddNpgsqlDbContext<AppDbContext>("appdb");      // name = AppHost database name
builder.AddRedisDistributedCache("redis");

var app = builder.Build();
app.MapDefaultEndpoints();                  // ← maps /health and /alive
app.Run();`,
    },
    {
      label: 'Service Discovery',
      language: 'csharp',
      code: `// AddServiceDefaults() enables service discovery automatically.
// Use "https+http://serviceName" as the HttpClient base address.
// Aspire injects the real address as env vars at startup.

builder.Services.AddHttpClient<ApiClient>(client =>
{
    // "api" matches AddProject(..."api") in the AppHost
    client.BaseAddress = new Uri("https+http://api");
});

public class ApiClient(HttpClient http)
{
    public Task<Product[]?> GetProductsAsync()
        => http.GetFromJsonAsync<Product[]>("/api/products");
}

// ── What Aspire injects (env vars) ────────────────────────────────────
// services__api__https__0 = https://localhost:7456
// services__api__http__0  = http://localhost:5123
// ConnectionStrings__appdb = Host=localhost;Port=5432;Database=appdb;User=...
// ConnectionStrings__redis = localhost:6379

// The discovery provider reads services__api__* and resolves
// "https+http://api" → the actual address at runtime.
// Your code never sees the port numbers — only the logical name.`,
    },
    {
      label: 'Redis + Postgres Integration',
      language: 'csharp',
      code: `// Aspire.StackExchange.Redis  → builder.AddRedisDistributedCache / AddRedisClient
// Aspire.Npgsql.EntityFrameworkCore.PostgreSQL → builder.AddNpgsqlDbContext

var builder = WebApplication.CreateBuilder(args);
builder.AddServiceDefaults();

// Each name must match the AppHost resource name exactly
builder.AddNpgsqlDbContext<AppDbContext>("appdb");

// Choose one Redis integration per use case:
builder.AddRedisDistributedCache("redis");   // IDistributedCache
// OR: builder.AddRedisOutputCache("redis");  // Output caching middleware
// OR: builder.AddRedisClient("redis");       // IConnectionMultiplexer (raw)

var app = builder.Build();
app.MapDefaultEndpoints();

app.MapGet("/products", async (AppDbContext db, CancellationToken ct) =>
    await db.Products.AsNoTracking().ToListAsync(ct));

app.MapGet("/cached", async (IDistributedCache cache) =>
{
    var hit = await cache.GetStringAsync("latest");
    if (hit is not null) return Results.Ok(hit + " (cached)");

    var value = DateTime.UtcNow.ToString("o");
    await cache.SetStringAsync("latest", value,
        new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(1)
        });
    return Results.Ok(value + " (fresh)");
});

app.Run();`,
    },
    {
      label: 'RabbitMQ Messaging',
      language: 'csharp',
      code: `// AppHost: var rabbit = builder.AddRabbitMQ("messaging");
// Service: builder.AddRabbitMQClient("messaging");  (Aspire.RabbitMQ.Client)

// Producer (API project)
app.MapPost("/orders", async (CreateOrderDto dto, IConnection rabbit) =>
{
    using var channel = rabbit.CreateModel();
    channel.QueueDeclare("orders", durable: true, exclusive: false, autoDelete: false);

    var body = JsonSerializer.SerializeToUtf8Bytes(dto);
    channel.BasicPublish(
        exchange: "",
        routingKey: "orders",
        basicProperties: null,
        body: body);

    return Results.Accepted();
});

// Consumer (Worker project)
public class OrderWorker(IConnection rabbit, ILogger<OrderWorker> logger)
    : BackgroundService
{
    protected override Task ExecuteAsync(CancellationToken ct)
    {
        var channel = rabbit.CreateModel();
        channel.QueueDeclare("orders", durable: true, exclusive: false, autoDelete: false);

        var consumer = new EventingBasicConsumer(channel);
        consumer.Received += (_, ea) =>
        {
            var dto = JsonSerializer.Deserialize<CreateOrderDto>(ea.Body.Span);
            logger.LogInformation("Processing order: {Id}", dto?.ProductId);
            channel.BasicAck(ea.DeliveryTag, multiple: false);
        };

        channel.BasicConsume("orders", autoAck: false, consumer);
        ct.WaitHandle.WaitOne();
        return Task.CompletedTask;
    }
}`,
    },
    {
      label: 'Deploy with azd',
      language: 'csharp',
      code: `# Prerequisites: winget install microsoft.azd

# 1. Initialise deployment manifest inside AppHost
cd MyApp.AppHost
azd init
# Detects Aspire; creates:
#   azure.yaml      — service manifest
#   infra/          — Bicep templates (Container Apps, managed Redis, managed Postgres)

# 2. Authenticate
azd auth login

# 3. Provision Azure resources + build + deploy (first time)
azd up
# Creates:
#   Azure Container Apps environment (one CA per .NET project)
#   Azure Cache for Redis
#   Azure Database for PostgreSQL Flexible Server
#   Azure Container Registry (builds and pushes images)
#   Key Vault (stores secrets; wired via managed identity — not env vars)

# 4. Subsequent code-only deployments
azd deploy

# 5. See service URLs and status
azd show

# ── GitHub Actions CI/CD ────────────────────────────────────────────────
# - uses: azure/login@v1
# - run: azd pipeline config   # creates service principal + GH secrets once
# - run: azd deploy --no-prompt`,
    },
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: 'Manual docker-compose + hardcoded ports vs Aspire AppHost',
      before: `# docker-compose.yml — maintain separately, keep in sync with .env files
services:
  redis:
    image: redis:7
    ports: ["6379:6379"]
  postgres:
    image: postgres:16
    ports: ["5432:5432"]
    environment:
      POSTGRES_PASSWORD: dev-password

# .env (or launchSettings.json for each project — kept manually in sync)
# ConnectionStrings__Default=Host=localhost;Port=5432;Database=app;User=postgres;Password=dev-password
# ConnectionStrings__Redis=localhost:6379
# Each developer must set these up manually; ports clash if running multiple projects`,
      after: `// AppHost/Program.cs — single source of truth, no docker-compose.yml
var builder = DistributedApplication.CreateBuilder(args);

var redis    = builder.AddRedis("redis");
var postgres = builder.AddPostgres("postgres").AddDatabase("app");

builder.AddProject<Projects.MyApp_Api>("api")
    .WithReference(redis)
    .WithReference(postgres)
    .WithExternalHttpEndpoints();

builder.Build().Run();

// Ports are random each run — no clashes, no manual .env files
// Connection strings injected automatically via service discovery
// New developer: git clone → dotnet run in AppHost → done`,
      note: 'Aspire eliminates the docker-compose.yml, .env files, and manual port coordination that plague multi-service local development. The AppHost is the single source of truth — topology is code, not YAML, and it stays in sync with the C# project references.',
    },
    {
      title: 'Manual OTel setup per service vs AddServiceDefaults()',
      before: `// api/Program.cs — repeated in every service project
builder.Services.AddOpenTelemetry()
    .WithTracing(t => t
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation()
        .AddEntityFrameworkCoreInstrumentation()
        .AddOtlpExporter(o => o.Endpoint = new Uri("http://jaeger:4317")))
    .WithMetrics(m => m
        .AddAspNetCoreInstrumentation()
        .AddRuntimeInstrumentation()
        .AddPrometheusExporter());

builder.Services.AddHealthChecks()
    .AddCheck("self", () => HealthCheckResult.Healthy());

// worker/Program.cs — same boilerplate duplicated
// Every change to OTel config must be made in every project`,
      after: `// ServiceDefaults/Extensions.cs — write once, shared across all projects
// api/Program.cs
builder.AddServiceDefaults();  // OTel + health checks + service discovery + resilience

// worker/Program.cs
builder.AddServiceDefaults();  // identical one-liner
// worker/Worker.cs, frontend/Program.cs — all the same

// Update OTel config in one place → all services inherit it immediately
// No per-service boilerplate to keep in sync`,
      note: 'Without ServiceDefaults, every service duplicates the same 20–30 lines of OTel, health check, and resilience setup — and each must be updated in N places when the configuration changes. AddServiceDefaults() is a shared extension that all services call once; changes propagate automatically.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Hardcoding ports in service config instead of using service discovery',
      wrong: `// worker/appsettings.json
{
  "ApiBaseUrl": "https://localhost:7456"   // ← hardcoded port
}

// worker/Program.cs
builder.Services.AddHttpClient<ApiClient>(c =>
    c.BaseAddress = new Uri(builder.Configuration["ApiBaseUrl"]!));
// Breaks whenever Aspire assigns a different port (every run)
// Breaks in CI where ports differ from local dev`,
      right: `// worker/Program.cs — no hardcoded ports; service discovery handles it
builder.AddServiceDefaults();    // enables discovery

builder.Services.AddHttpClient<ApiClient>(c =>
    c.BaseAddress = new Uri("https+http://api"));   // ← "api" = AppHost name

// Aspire injects: services__api__https__0=https://localhost:7456
// Discovery resolves "api" to the actual address at runtime, every run`,
      explanation: 'Aspire assigns random ports each run to avoid conflicts between simultaneously running projects. Hardcoding a port makes the app fragile — it fails silently when the port changes. The "https+http://serviceName" scheme delegates resolution to the discovery provider, which reads the injected environment variables Aspire sets for the actual address.',
    },
    {
      title: 'Naming mismatch between AppHost resource and service AddXxx() call',
      wrong: `// AppHost: resource registered as "cache"
var redis = builder.AddRedis("cache");   // ← name "cache"
builder.AddProject<Projects.MyApp_Api>("api").WithReference(redis);

// api/Program.cs: uses a different name
builder.AddRedisDistributedCache("redis");   // ← name "redis" — does not match!
// Injects env var: ConnectionStrings__cache=...
// Service looks for: ConnectionStrings__redis — not found → null connection string → crash`,
      right: `// AppHost: resource registered as "redis"
var redis = builder.AddRedis("redis");   // ← name "redis"
builder.AddProject<Projects.MyApp_Api>("api").WithReference(redis);

// api/Program.cs: same name "redis"
builder.AddRedisDistributedCache("redis");   // ← matches exactly
// Aspire injects: ConnectionStrings__redis=...
// Service reads: ConnectionStrings__redis — found, correct`,
      explanation: 'Aspire uses the resource name as the IConfiguration key under ConnectionStrings. The name passed to AddRedis("X") in the AppHost must exactly match the name passed to AddRedisDistributedCache("X") in the service project. A mismatch results in a null connection string that causes a runtime crash or silent fall-through to a default.',
    },
    {
      title: 'Forgetting AddServiceDefaults() in a service project',
      wrong: `// worker/Program.cs — AddServiceDefaults() omitted
var builder = Host.CreateApplicationBuilder(args);
// No AddServiceDefaults() call

builder.Services.AddHostedService<SyncWorker>();
builder.Build().Run();

// Result:
// - No distributed traces from this service in the Aspire dashboard
// - No health endpoints — k8s probes fail
// - Service discovery not enabled — "https+http://api" resolves to nothing
// - No HTTP resilience — failed calls are not retried`,
      right: `var builder = Host.CreateApplicationBuilder(args);
builder.AddServiceDefaults();   // ← wire OTel + health + discovery + resilience

builder.Services.AddHostedService<SyncWorker>();
builder.Build().Run();
// Worker now appears in the Aspire dashboard with traces and metrics
// Health endpoint available for k8s probes (via MapDefaultEndpoints in an API)`,
      explanation: 'AddServiceDefaults() is easy to forget because omitting it does not cause an immediate error — the service starts and runs. The symptoms appear later: missing traces in the dashboard, 404 on health probes, silent HTTP failures without retries. Every service project that participates in Aspire orchestration must call AddServiceDefaults().',
    },
    {
      title: 'Using the Aspire AppHost as a production orchestrator',
      wrong: `# Deploying the AppHost to production (wrong)
docker build -t myapp-apphost .
docker run myapp-apphost   # ← running AppHost in production

# The AppHost:
# - Starts Docker containers with random ports (inappropriate for prod)
# - Exposes the local Aspire dashboard (security risk)
# - Is designed for local dev — has no HA, no scaling, no secret management`,
      right: `# The AppHost is a local dev tool only.
# For production: use dotnet publish per service + container orchestration

dotnet publish MyApp.Api -c Release --os linux --arch x64 /t:PublishContainer
dotnet publish MyApp.Worker -c Release --os linux --arch x64 /t:PublishContainer

# Deploy images to Kubernetes, Azure Container Apps, etc.
# OR use azd up to provision and deploy via the manifest:
cd MyApp.AppHost && azd up   # provisions ACA + Redis + Postgres, deploys images`,
      explanation: 'The Aspire AppHost is a local development tool — it starts Docker containers on the developer\'s machine with randomly assigned ports, runs .NET projects as child processes, and opens a local dashboard. In production, each service is a standalone container image deployed to a container orchestration platform. Use azd up (for Azure) or standard container deployment for production.',
    },
    {
      title: 'Not calling WithExternalHttpEndpoints() on services you need to reach from a browser',
      wrong: `// api project not marked external — browser cannot reach it from Aspire dashboard
var api = builder.AddProject<Projects.MyApp_Api>("api")
    .WithReference(postgres);
// .WithExternalHttpEndpoints() missing

// Result:
// - API URL does not appear in the Aspire dashboard
// - Navigating to the API from a browser requires guessing the random port
// - Swagger UI is not accessible during development`,
      right: `var api = builder.AddProject<Projects.MyApp_Api>("api")
    .WithReference(postgres)
    .WithExternalHttpEndpoints();   // ← marks API as externally accessible

// Result:
// - API URL appears in the Aspire dashboard's Resources table with a clickable link
// - Direct browser access works (Swagger, testing endpoints manually)
// - Other services still discover the API by name, not this external URL`,
      explanation: 'WithExternalHttpEndpoints() tells Aspire that the service\'s HTTP endpoints should be accessible from outside the AppHost process — browsers, Postman, or any external tool. Without it, the service runs and is reachable by other services via discovery, but its URL is not advertised in the dashboard and port-mapping is not configured for browser access.',
    },
  ];

  challenge: Challenge = {
    title: 'Compose a 3-Service App with Aspire',
    language: 'csharp',
    description: `Create an Aspire AppHost that orchestrates a 3-service application:
1. <strong>AppHost</strong>: add Redis, PostgreSQL with a database named <code>"products-db"</code>, an API project (<code>"products-api"</code>), and a Worker project (<code>"products-worker"</code>).
2. <strong>API project</strong>: call <code>AddServiceDefaults()</code>, register <code>AppDbContext</code> via <code>AddNpgsqlDbContext("products-db")</code>, register Redis with <code>AddRedisDistributedCache("redis")</code>, expose a <code>GET /products</code> endpoint.
3. <strong>Worker project</strong>: call <code>AddServiceDefaults()</code>, register an <code>HttpClient&lt;ApiClient&gt;</code> with base address <code>"https+http://products-api"</code>.`,
    hints: [
      'AddProject<Projects.Products_Api>("products-api") — name is the service discovery key',
      'AddPostgres("postgres").AddDatabase("products-db") creates the DB resource',
      'WithReference(redis) and WithReference(db) inject connection info into projects',
      'In the Worker: builder.Services.AddHttpClient<ApiClient>(c => c.BaseAddress = new Uri("https+http://products-api"))',
    ],
    starterCode: `// MyApp.AppHost/Program.cs
var builder = DistributedApplication.CreateBuilder(args);
// TODO: Add Redis, Postgres, database, API project, Worker project
builder.Build().Run();

// Products.Api/Program.cs
var builder = WebApplication.CreateBuilder(args);
// TODO: AddServiceDefaults, AddNpgsqlDbContext, AddRedisDistributedCache
var app = builder.Build();
app.MapGet("/products", () => new[] { "Widget", "Gadget" });
app.Run();`,
    solution: `// MyApp.AppHost/Program.cs
var builder = DistributedApplication.CreateBuilder(args);

var redis    = builder.AddRedis("redis");
var postgres = builder.AddPostgres("postgres").AddDatabase("products-db");

var api = builder.AddProject<Projects.Products_Api>("products-api")
    .WithReference(redis)
    .WithReference(postgres)
    .WithExternalHttpEndpoints();

builder.AddProject<Projects.Products_Worker>("products-worker")
    .WithReference(redis)
    .WithReference(api);

builder.Build().Run();

// Products.Api/Program.cs
var builder = WebApplication.CreateBuilder(args);
builder.AddServiceDefaults();
builder.AddNpgsqlDbContext<AppDbContext>("products-db");
builder.AddRedisDistributedCache("redis");
var app = builder.Build();
app.MapDefaultEndpoints();
app.MapGet("/products", async (AppDbContext db) =>
    await db.Products.AsNoTracking().ToListAsync());
app.Run();

// Products.Worker/Program.cs
var builder = Host.CreateApplicationBuilder(args);
builder.AddServiceDefaults();
builder.Services.AddHttpClient<ApiClient>(c =>
    c.BaseAddress = new Uri("https+http://products-api"));
builder.Services.AddHostedService<SyncWorker>();
builder.Build().Run();

public class ApiClient(HttpClient http)
{
    public Task<string[]?> GetProductsAsync()
        => http.GetFromJsonAsync<string[]>("/products");
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the purpose of WithReference() in the Aspire AppHost?',
      options: [
        'It copies the source code of one project into another at build time',
        'It injects the resource\'s connection string or endpoint into a dependent project as environment variables',
        'It sets up Docker network bridges between container services',
        'It enables hot reload between services during development',
      ],
      answer: 1,
      explanation: 'WithReference() tells Aspire to inject the named resource\'s connection information (connection string for databases/caches, or service endpoint URLs for projects) into the target project as IConfiguration-readable environment variables. The service project reads them via the standard config system without knowing actual port numbers.',
    },
    {
      q: 'What does the "https+http://api" service discovery URI mean?',
      options: [
        'The service listens on both HTTP and HTTPS simultaneously on different ports',
        'Aspire resolves "api" to the actual service address, preferring HTTPS with HTTP as fallback',
        'All HTTP traffic to "api" is permanently redirected to HTTPS',
        'It is an invalid URI scheme that throws UriFormatException at startup',
      ],
      answer: 1,
      explanation: 'The https+http:// scheme is an Aspire service discovery convention. The discovery provider looks up services__api__https__0 (HTTPS) first, then services__api__http__0 (HTTP fallback), and resolves the logical name "api" to an actual host:port. Your code never specifies port numbers — only the logical service name.',
    },
    {
      q: 'What does AddServiceDefaults() configure in a service project?',
      options: [
        'Only the database connection string and Redis cache registration',
        'OpenTelemetry (traces + metrics), health checks, service discovery, and HTTP resilience (retries + circuit breaker)',
        'The HTTPS certificate and Kestrel listen ports',
        'Environment-specific appsettings.json file selection',
      ],
      answer: 1,
      explanation: 'AddServiceDefaults() is a shared extension method that wires: OpenTelemetry exporting traces and metrics to the Aspire dashboard (and any configured OTLP backend), health check registration, service discovery via the injected services__* environment variables, and a standard HTTP resilience policy (retries + circuit breaker) on all HttpClient registrations.',
    },
    {
      q: 'Why does Aspire assign random ports to services on each run?',
      options: [
        'Random ports are a security feature to prevent port scanning',
        'To avoid port conflicts when running multiple Aspire apps or projects simultaneously on one machine',
        'Kestrel requires random ports when running without a certificate',
        'The Aspire dashboard requires unique ports to identify services',
      ],
      answer: 1,
      explanation: 'Fixed ports cause conflicts when running multiple Aspire solutions simultaneously, or when other processes already use those ports. Random assignment eliminates the conflict but requires service discovery — services cannot hardcode ports and must use the "https+http://serviceName" scheme to let Aspire resolve the actual address.',
    },
    {
      q: 'Where should you NOT run the Aspire AppHost?',
      options: [
        'In integration tests — Aspire cannot run in a CI pipeline',
        'In production — the AppHost is a local dev orchestration tool, not a production runtime',
        'On macOS — the AppHost is Windows-only',
        'As a non-root user — the AppHost requires elevated Docker permissions always',
      ],
      answer: 1,
      explanation: 'The AppHost is designed for local development: it starts Docker containers on the developer\'s machine, assigns random ports, and opens a local dashboard. In production, each service is a standalone container image deployed to a container orchestration platform (Kubernetes, Azure Container Apps). Use azd up to deploy the Aspire app to Azure, not the AppHost itself.',
    },
    {
      q: 'What happens if the resource name in the AppHost (AddRedis("cache")) differs from the name in the service (AddRedisClient("redis"))?',
      options: [
        'Aspire throws a configuration error at AppHost startup listing the mismatch',
        'The service cannot find the injected connection string — it gets a null or missing value and likely throws at runtime',
        'Aspire automatically matches resources by type (both are Redis) and ignores the name',
        'The service creates a new Redis instance using its own name',
      ],
      answer: 1,
      explanation: 'Aspire injects the connection string under the key ConnectionStrings__{resourceName}. If the AppHost registers AddRedis("cache") but the service calls AddRedisClient("redis"), the service looks for ConnectionStrings__redis — which does not exist. The result is a null/missing connection string that causes a runtime crash. Names must match exactly between AppHost and service project.',
    },
    {
      q: 'What does MapDefaultEndpoints() register in an ASP.NET Core service?',
      options: [
        'A catch-all 404 handler for undefined routes',
        '/health and /alive endpoints wired to the health checks registered by AddServiceDefaults()',
        'Swagger UI and OpenAPI spec endpoints at /swagger',
        'The Aspire dashboard endpoint at /aspire',
      ],
      answer: 1,
      explanation: 'MapDefaultEndpoints() is part of the ServiceDefaults extension and maps two endpoints: /health (checks all registered health checks — database, Redis, etc.) and /alive (a liveness probe that returns 200 with no dependency checks). These map to Kubernetes readiness and liveness probes respectively.',
    },
  ];

  qna: QnaItem[] = [
    { q: 'Does Aspire replace Docker Compose for local development?', a: 'For .NET-centric stacks with official Aspire integrations, yes — Aspire starts containers automatically and injects connection strings without a docker-compose.yml. For polyglot environments or niche infrastructure not covered by an Aspire integration, you may still use <code>builder.AddContainer("name", "image:tag")</code> to run arbitrary Docker images, or keep docker-compose for those specific services while using Aspire for .NET services.' },
    { q: 'Can I use Aspire without deploying to Azure?', a: 'Yes — Aspire is a local development and orchestration tool independent of Azure. <code>azd</code> is optional. The AppHost runs locally during development regardless of where you deploy. For production, <code>dotnet publish</code> produces standard container images deployable to any Kubernetes cluster, Google Cloud Run, AWS Fargate, or any container platform. The Bicep templates generated by <code>azd init</code> are just one deployment path.' },
    { q: 'What is the ServiceDefaults project and do I need it?', a: 'ServiceDefaults is a shared class library (generated by <code>dotnet new aspire-servicedefaults</code>) containing the <code>AddServiceDefaults()</code> extension method. It standardises OpenTelemetry, health checks, service discovery, and resilience across all services — change the config once, all services inherit it. You don\'t strictly need it (you can wire those components individually), but it enforces consistency and is the official Aspire convention. Skipping it means duplicating boilerplate in every service.' },
    { q: 'How does Aspire handle secrets in local development?', a: 'For local development, Aspire generates random passwords for managed containers (Postgres, RabbitMQ) and injects them as connection strings automatically — you never configure passwords for local containers. For secrets that come from outside (API keys, external service credentials), use <code>builder.AddParameter("apiKey", secret: true)</code> in the AppHost — Aspire prompts for the value at startup or reads it from the .NET user-secrets store for the AppHost project.' },
    { q: 'How do Aspire integrations differ from manually adding NuGet packages?', a: 'Aspire integration packages (e.g., <code>Aspire.StackExchange.Redis</code>) wrap the underlying client library with: (1) automatic OTel instrumentation — Redis commands appear as spans in distributed traces; (2) health checks — the integration registers a health check automatically; (3) configuration binding — reads the connection string by name from IConfiguration with a consistent pattern; (4) resilience — some integrations add retry policies. Without the Aspire integration, you get the raw client and must wire OTel, health checks, and config binding manually.' },
    { q: 'Can I use Aspire for integration tests in CI?', a: 'Yes — the <code>Aspire.Hosting.Testing</code> NuGet package provides <code>DistributedApplicationTestingBuilder</code>. Use it to start the AppHost topology programmatically in a test fixture: the full stack (real Redis, real Postgres via containers, real service projects) starts in-process or in Docker. Integration tests run against the real stack, not mocks. This is powerful for catching wiring bugs that mocks would miss, but slow — run it as a separate CI job from fast unit tests.' },
    { q: 'How do I add a non-.NET service (e.g., a Python microservice) to an Aspire AppHost?', a: 'Use <code>builder.AddDockerfile("python-service", "./python/Dockerfile")</code> to build and run any Dockerfile. Expose endpoints with <code>.WithEndpoint(port: 8000, scheme: "http")</code> and wire it to .NET projects with <code>WithReference(pythonService)</code>. Aspire injects the resolved endpoint address into dependent services just like it does for .NET projects. The Python service appears in the dashboard with its logs. There is no automatic OTel instrumentation for non-.NET services — add that to the Python service manually.' },
    { q: 'What is the difference between the Aspire dashboard and production APM tools?', a: 'The Aspire dashboard is <strong>ephemeral and local</strong> — data is in memory, only visible while the AppHost runs, intended for a single developer\'s session. It is a zero-configuration development convenience. Production APM tools (Application Insights, Datadog, Jaeger + Tempo, Prometheus + Grafana) are <strong>persistent and shared</strong> — data is stored long-term, visible to the whole team, with alerting, SLO tracking, and historical analysis. ServiceDefaults exports OTel to both: to the dashboard locally (via OTLP to localhost) and to the production APM (via OTEL_EXPORTER_OTLP_ENDPOINT environment variable in the container).' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Aspire replaces docker-compose and manual .env wiring with a C# AppHost that composes services in code; service discovery eliminates hardcoded ports; AddServiceDefaults() wires OTel/health/resilience in one call; naming between AppHost AddRedis("X") and service AddRedisClient("X") must match exactly; the AppHost is a local dev tool — use azd up for production.',
    mustKnow: [
      'AppHost/Program.cs is the single topology definition: AddRedis/AddPostgres for infra, AddProject<T>() for .NET services, WithReference() to wire them',
      'Ports are random per run — never hardcode; use "https+http://serviceName" for service discovery',
      'Resource names must match exactly: AddRedis("X") in AppHost ↔ AddRedisDistributedCache("X") in service',
      'AddServiceDefaults() in every service project: wires OTel, health checks, discovery, and HTTP resilience',
      'app.MapDefaultEndpoints() maps /health and /alive — needed for k8s probes in production',
      'WithExternalHttpEndpoints() exposes a service URL in the dashboard for browser access',
      'The AppHost is local dev only — production deploys individual container images via azd or standard CI/CD',
    ],
    interviewFocus: [
      'What problem does .NET Aspire solve compared to docker-compose for local development?',
      'What does WithReference() do and how does Aspire inject configuration into service projects?',
      'Why does Aspire use random ports and how does service discovery compensate?',
      'What does AddServiceDefaults() configure — list at least three things?',
      'When should you use the Aspire AppHost vs deploying directly to production with azd?',
    ],
  };
}
