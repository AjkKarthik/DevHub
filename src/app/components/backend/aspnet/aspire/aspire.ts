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
  { name: 'AddProject<T>()',              type: 'method',  desc: 'Add a .NET project to the Aspire AppHost for orchestration.' },
  { name: 'AddRedis()',                   type: 'method',  desc: 'Add a Redis container to the AppHost; returns a resource reference.' },
  { name: 'AddPostgres()',                type: 'method',  desc: 'Add a PostgreSQL container; chain .AddDatabase() for a named DB.' },
  { name: 'WithReference()',              type: 'method',  desc: 'Wire a resource (DB, cache, service) to a project — injects connection info.' },
  { name: 'AddServiceDefaults()',         type: 'method',  desc: 'Extension on IHostApplicationBuilder — wires OTel, health checks, resilience.' },
  { name: 'WithExternalHttpEndpoints()',  type: 'method',  desc: 'Exposes a service endpoint to the Aspire dashboard and external callers.' },
  { name: 'https+http://name',            type: 'keyword', desc: 'Service discovery URI — Aspire resolves "name" to the actual address.' },
  { name: 'azd up',                       type: 'keyword', desc: 'Azure Developer CLI command to provision and deploy an Aspire app.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'What .NET Aspire solves',
    points: [
      'Multi-service local dev without Aspire requires docker-compose, manual .env wiring, and hardcoded ports. Aspire replaces all of that with a C# AppHost where you compose resources and projects in code.',
      'Run the AppHost and Aspire starts your Redis container, Postgres container, API project, and worker project — all wired together with injected connection strings and a built-in dashboard.',
      'The dashboard shows logs, distributed traces, and metrics from all services in one place — no separate Jaeger/Prometheus setup needed for local development.',
    ],
  },
  {
    heading: 'AppHost composition',
    points: [
      'The AppHost is a separate .NET project. <code>AddProject&lt;T&gt;()</code> references another project; <code>AddRedis/AddPostgres</code> spin up containers. <code>WithReference()</code> injects connection info into the dependent service.',
      'Container ports are random each run — service discovery resolves names to addresses, so you never hardcode ports in service config.',
      '<code>WithExternalHttpEndpoints()</code> exposes a service to the Aspire dashboard and to browsers, allowing direct access during development.',
    ],
  },
  {
    heading: 'Service defaults & observability',
    points: [
      'Each service project calls <code>builder.AddServiceDefaults()</code> — a shared extension method that wires OpenTelemetry (traces + metrics exported to the dashboard), health checks, and standard HTTP resilience.',
      'Service discovery is automatic: <code>builder.Services.AddHttpClient&lt;ApiClient&gt;(c =&gt; c.BaseAddress = new Uri("https+http://api"))</code> resolves "api" to the registered service address.',
      '<code>app.MapDefaultEndpoints()</code> maps <code>/health</code> and <code>/alive</code> automatically — no manual health check wiring needed in service projects.',
    ],
  },
  {
    heading: 'Deploying Aspire apps',
    points: [
      'Use <code>azd init</code> inside the AppHost to generate an <code>azure.yaml</code> manifest and Bicep templates. <code>azd up</code> provisions Azure Container Apps, Redis, and Postgres, then deploys all services.',
      'Aspire generates the deployment manifest automatically from the AppHost topology — no manual ARM/Bicep needed for standard scenarios.',
      'For non-Azure targets, the containers produced by <code>dotnet publish</code> deploy to any Kubernetes cluster or container hosting platform.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'AppHost Definition',
    language: 'csharp',
    code: `// MyApp.AppHost/Program.cs
var builder = DistributedApplication.CreateBuilder(args);

// Infrastructure
var redis    = builder.AddRedis("redis");
var postgres = builder.AddPostgres("postgres")
                      .AddDatabase("appdb");

// Projects
var api = builder.AddProject<Projects.MyApp_Api>("api")
    .WithReference(redis)
    .WithReference(postgres)
    .WithExternalHttpEndpoints();

builder.AddProject<Projects.MyApp_Worker>("worker")
    .WithReference(redis)
    .WithReference(api);     // worker can call the API by service name

builder.Build().Run();

// Running the AppHost starts:
//   • Redis + Postgres containers
//   • API project (with injected connection strings)
//   • Worker project
//   • Aspire dashboard (http://localhost:15137)`,
  },
  {
    label: 'Service Defaults',
    language: 'csharp',
    code: `// MyApp.ServiceDefaults/Extensions.cs (generated by dotnet new aspire-servicedefaults)

public static class Extensions
{
    public static IHostApplicationBuilder AddServiceDefaults(
        this IHostApplicationBuilder builder)
    {
        builder.ConfigureOpenTelemetry();
        builder.AddDefaultHealthChecks();
        builder.Services.AddServiceDiscovery();
        builder.Services.ConfigureHttpClientDefaults(http =>
        {
            http.AddStandardResilienceHandler();
            http.AddServiceDiscovery();
        });
        return builder;
    }
}

// ── In each service project (API, Worker, etc.) ──────────────────────────────
var builder = WebApplication.CreateBuilder(args);
builder.AddServiceDefaults();              // one call wires everything

builder.AddRedisClient("redis");           // name matches AppHost AddRedis("redis")
builder.AddNpgsqlDbContext<AppDbContext>("appdb");

var app = builder.Build();
app.MapDefaultEndpoints();                 // /health and /alive
app.Run();`,
  },
  {
    label: 'Service Discovery',
    language: 'csharp',
    code: `// AddServiceDefaults() sets up the discovery provider automatically.
// Use "https+http://serviceName" as the HttpClient base address.

builder.Services.AddHttpClient<ApiClient>(client =>
{
    // "api" matches the AddProject name in the AppHost
    client.BaseAddress = new Uri("https+http://api");
});

public class ApiClient(HttpClient http)
{
    public Task<Product[]?> GetProductsAsync()
        => http.GetFromJsonAsync<Product[]>("/api/products");
}

// ── Environment variables Aspire injects into services ────────────────────────
// services__api__http__0=http://localhost:5123
// services__api__https__0=https://localhost:7456
// ConnectionStrings__redis=localhost:6379
// ConnectionStrings__appdb=Host=localhost;Port=5432;Database=appdb;...`,
  },
  {
    label: 'Redis + Postgres Integration',
    language: 'csharp',
    code: `// API/Program.cs
var builder = WebApplication.CreateBuilder(args);
builder.AddServiceDefaults();

// Redis — name matches AppHost AddRedis("redis")
builder.AddRedisDistributedCache("redis");          // IDistributedCache
// OR: builder.AddRedisOutputCache("redis");         // Output caching
// OR: builder.AddRedisClient("redis");              // IConnectionMultiplexer

// Postgres — name matches AppHost AddDatabase("appdb")
builder.AddNpgsqlDbContext<AppDbContext>("appdb");

var app = builder.Build();
app.MapDefaultEndpoints();

app.MapGet("/products", async (AppDbContext db) =>
    await db.Products.AsNoTracking().ToListAsync());

app.MapGet("/cached", async (IDistributedCache cache) =>
{
    var hit = await cache.GetStringAsync("key");
    if (hit is not null) return hit;
    await cache.SetStringAsync("key", "hello",
        new() { AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(1) });
    return "miss — cached now";
});`,
  },
  {
    label: 'Deploy with azd',
    language: 'csharp',
    code: `# Prerequisites: winget install microsoft.azd

# 1. Initialise deployment manifest
cd MyApp.AppHost
azd init     # detects Aspire; creates azure.yaml + infra/ Bicep

# 2. Authenticate
azd auth login

# 3. Provision and deploy
azd up
# Provisions: Azure Container Apps + Redis + PostgreSQL
# Builds images via Azure Container Registry
# Deploys all services with wired connection strings

# 4. Subsequent code-only deploys
azd deploy

# 5. See all service URLs
azd show

# ── CI/CD (GitHub Actions) ────────────────────────────────────────────────────
# - uses: azure/login@v1
# - run: azd pipeline config    # sets up service principal + secrets
# - run: azd deploy --no-prompt`,
  },
];

const challenge: Challenge = {
  title: 'Compose a 3-Service App with Aspire',
  language: 'csharp',
  description: 'Create an Aspire AppHost that orchestrates:\n1. **API project** (`Products.Api`) with a Postgres database and Redis cache.\n2. **Worker project** (`Products.Worker`) that references Redis and the API.\n3. Both projects call `builder.AddServiceDefaults()` in their `Program.cs`.\n4. The Worker uses `HttpClient` with base address `https+http://products-api` to call the API.',
  hints: [
    'AddProject<Projects.Products_Api>("products-api") — the name is the service discovery key',
    'AddPostgres("postgres").AddDatabase("products-db") creates a database resource',
    'WithReference(redis) and WithReference(db) inject into the project',
    'In the Worker: builder.Services.AddHttpClient<ApiClient>(c => c.BaseAddress = new Uri("https+http://products-api"))',
  ],
  starterCode: `// MyApp.AppHost/Program.cs
var builder = DistributedApplication.CreateBuilder(args);
// TODO: Add Redis, Postgres/DB, API project, Worker project
builder.Build().Run();

// Products.Api/Program.cs
var builder = WebApplication.CreateBuilder(args);
// TODO: AddServiceDefaults, AddNpgsqlDbContext, AddRedisClient
var app = builder.Build();
app.MapGet("/products", () => new[] { "Widget", "Gadget" });
app.Run();`,
  solution: `// MyApp.AppHost/Program.cs
var builder = DistributedApplication.CreateBuilder(args);
var redis    = builder.AddRedis("redis");
var postgres = builder.AddPostgres("postgres").AddDatabase("products-db");
var api = builder.AddProject<Projects.Products_Api>("products-api")
    .WithReference(redis).WithReference(postgres).WithExternalHttpEndpoints();
builder.AddProject<Projects.Products_Worker>("worker")
    .WithReference(redis).WithReference(api);
builder.Build().Run();

// Products.Api/Program.cs
var builder = WebApplication.CreateBuilder(args);
builder.AddServiceDefaults();
builder.AddNpgsqlDbContext<AppDbContext>("products-db");
builder.AddRedisDistributedCache("redis");
var app = builder.Build();
app.MapDefaultEndpoints();
app.MapGet("/products", async (AppDbContext db) => await db.Products.ToListAsync());
app.Run();

// Products.Worker/Program.cs
var builder = Host.CreateApplicationBuilder(args);
builder.AddServiceDefaults();
builder.Services.AddHttpClient<ApiClient>(c =>
    c.BaseAddress = new Uri("https+http://products-api"));
builder.Services.AddHostedService<SyncWorker>();
builder.Build().Run();`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What is the purpose of WithReference() in the Aspire AppHost?',
    options: [
      'It copies the source code of one project into another',
      'It injects the connection string or service endpoint of a resource into a dependent project as environment variables',
      'It sets up Docker networking between containers',
      'It enables hot reload between services',
    ],
    answer: 1,
    explanation: 'WithReference() tells Aspire to inject the named resource\'s connection information into the target project — the service project reads it via standard IConfiguration without knowing the actual port.',
  },
  {
    q: 'What does "https+http://api" mean in service discovery?',
    options: [
      'The service uses both HTTP and HTTPS simultaneously',
      'It is a discovery URI — Aspire resolves it to the actual address of the "api" service, preferring HTTPS with HTTP fallback',
      'It redirects all HTTP to HTTPS',
      'It is invalid syntax and throws at startup',
    ],
    answer: 1,
    explanation: 'The https+http:// scheme is an Aspire service discovery convention. The discovery provider resolves "api" to the registered address, trying HTTPS first and falling back to HTTP for local development.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'Does Aspire replace Docker Compose for local development?',
    a: 'For .NET-centric stacks, yes — Aspire starts containers automatically and injects connection strings without a docker-compose.yml. For polyglot environments with non-.NET services not available as Aspire integrations, you may still need Docker Compose for those specific containers.',
  },
  {
    q: 'Can I use Aspire without deploying to Azure?',
    a: 'Yes — Aspire is a local development and orchestration tool independent of Azure. azd is optional. You can deploy the containerised services to any Kubernetes cluster or container hosting platform. The Bicep templates generated by azd init are adaptable.',
  },
  {
    q: 'What is the ServiceDefaults project and do I need it?',
    a: 'ServiceDefaults is a shared class library (generated by dotnet new aspire-servicedefaults) containing the AddServiceDefaults() extension. It standardises OTel, health checks, and resilience across all services. You don\'t strictly need it — you can wire those individually — but it ensures consistency and is the official Aspire convention.',
  },
];

@Component({
  selector: 'app-aspnet-aspire',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent, PageCompleteComponent],
  templateUrl: './aspire.html',
  styleUrl: './aspire.scss',
})
export class AspnetAspire {
  quickRef  = quickRef;
  theory    = theory;
  codeTabs  = codeTabs;
  challenge = challenge;
  quiz      = quiz;
  qna       = qna;
}
