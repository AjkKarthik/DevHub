import { Component } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { BeforeAfterComponent, BeforeAfterExample } from '../../../shared/before-after/before-after';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';

@Component({
  selector: 'app-aspnet-hosting-startup',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent,
    ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent,
    PageMetaComponent, PageCompleteComponent, RevisionCardComponent,
  ],
  templateUrl: './hosting-startup.html',
  styleUrl: './hosting-startup.scss',
})
export class AspnetHostingStartup {

  quickRef: QuickRefItem[] = [
    { name: 'WebApplication.CreateBuilder()', type: 'method',    desc: 'Bootstraps DI, config (json/env/cli), logging, and Kestrel in one call. Returns a WebApplicationBuilder for the service-registration phase.', since: '.NET 6+' },
    { name: 'builder.Services',              type: 'accessor',  desc: 'IServiceCollection for DI registrations — must be called before Build(). After Build(), the container is sealed.', since: '.NET 6+' },
    { name: 'builder.Configuration',         type: 'accessor',  desc: 'Layered IConfiguration: appsettings.json → env-specific → env vars → CLI args. Later layers override earlier ones.', since: '.NET 6+' },
    { name: 'builder.Build()',               type: 'method',    desc: 'Seals the service container and returns the WebApplication middleware builder. No more Add*() calls after this.', since: '.NET 6+' },
    { name: 'app.Run()',                     type: 'method',    desc: 'Starts Kestrel and blocks until the host shuts down (Ctrl+C or SIGTERM).', since: '.NET 6+' },
    { name: 'ASPNETCORE_ENVIRONMENT',        type: 'keyword',   desc: 'Environment variable controlling the active environment. Standard values: Development, Staging, Production. Must be a real env var — not appsettings.json.', since: 'Core 1+' },
    { name: 'WebApplication.CreateSlimBuilder()', type: 'method', desc: 'Stripped-down builder for trimmed/Native AOT deployments — omits Razor, HttpClient defaults, and HTTPS config.', since: '.NET 7+' },
    { name: 'IHostApplicationLifetime',      type: 'interface', desc: 'Exposes ApplicationStarted/Stopping/Stopped CancellationTokens for graceful shutdown and post-start hooks.', since: 'Core 2+' },
    { name: 'BackgroundService',             type: 'class',     desc: 'Base class for long-running hosted services. Override ExecuteAsync(stoppingToken). Register with AddHostedService<T>().', since: 'Core 2+' },
    { name: 'app.Environment.IsDevelopment()', type: 'method', desc: 'Conditional environment branching. Also IsProduction(), IsStaging(), and IsEnvironment("Custom").', since: '.NET 6+' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'WebApplication.CreateBuilder() — what it wires automatically',
      points: [
        '<code>WebApplication.CreateBuilder(args)</code> is the single entry point for modern ASP.NET Core apps. It sets up configuration, DI, logging, Kestrel, and routing with one call — eliminating the old <code>IWebHostBuilder</code> + <code>Startup.cs</code> ceremony introduced in the original .NET Core 1.0.',
        '<strong>Configuration</strong> is layered automatically in priority order: <code>appsettings.json</code> → <code>appsettings.{Environment}.json</code> → environment variables → command-line arguments. Each layer overrides the same key in a lower-priority layer. You can extend this chain by calling <code>builder.Configuration.AddJsonFile("custom.json")</code>.',
        '<strong>Logging</strong> adds Console and Debug providers in Development and Console in Production. Override by calling <code>builder.Logging.ClearProviders()</code> then adding <code>.AddSerilog()</code>, <code>.AddOpenTelemetry()</code>, etc. The logging level thresholds are configured per-category in <code>appsettings.json</code> under the <code>Logging</code> key.',
        '<strong>DI</strong> is available via <code>builder.Services</code>. ASP.NET Core itself registers dozens of internal services here (routing, model binding, anti-forgery); you add yours on top. All registrations are committed together when <code>builder.Build()</code> is called.',
        '<code>builder.WebHost</code> gives access to Kestrel-specific options and <code>builder.Host</code> gives access to the Generic Host options (shutdown timeout, environment, host lifetime). These overlap conceptually — prefer <code>builder.WebHost.ConfigureKestrel()</code> for HTTP server tuning.',
      ],
    },
    {
      heading: 'Program.cs anatomy — builder phase vs app phase',
      points: [
        'Program.cs splits into two phases: the <strong>builder phase</strong> (registering services) and the <strong>app phase</strong> (configuring middleware and endpoints). These are separated by the <code>builder.Build()</code> call — the single seam in the file.',
        'The <strong>builder phase</strong> runs from <code>CreateBuilder</code> to <code>Build()</code>. Use <code>builder.Services.Add*()</code> for DI, <code>builder.Configuration</code> for reading config, <code>builder.Logging</code> for log providers. Order within the builder phase generally does not matter because DI resolves lazily at request time.',
        '<code>var app = builder.Build()</code> seals the DI container. <strong>No more service registrations are possible after this point.</strong> Attempting to call any <code>Add*()</code> extension on <code>app.Services</code> throws <code>InvalidOperationException: Cannot modify a ServiceCollection after it has been built.</code>',
        'The <strong>app phase</strong> runs from <code>Build()</code> to <code>Run()</code>. Use <code>app.Use*()</code> to add middleware and <code>app.Map*()</code> to register endpoints. Ordering <em>critically matters</em> in the app phase — middleware executes in registration order, so <code>UseAuthentication()</code> must precede <code>UseAuthorization()</code>.',
        'After <code>Build()</code> but before <code>Run()</code> you can resolve services for one-time startup work (database migration, cache warm-up): <code>using var scope = app.Services.CreateScope(); var db = scope.ServiceProvider.GetRequiredService&lt;AppDbContext&gt;(); await db.Database.MigrateAsync();</code> This is the correct pattern — avoid resolving scoped services from the root container.',
      ],
    },
    {
      heading: 'Environments — Development, Staging, Production',
      points: [
        'The active environment is read from the <code>ASPNETCORE_ENVIRONMENT</code> environment variable at host construction time. ASP.NET Core defines three standard names: <code>Development</code>, <code>Staging</code>, and <code>Production</code>. Custom names (e.g. <code>QA</code>) are fully supported.',
        'In <strong>Development</strong>, <code>app.UseDeveloperExceptionPage()</code> is added automatically by ASP.NET Core. This returns full stack traces, exception details, and request/response headers to the browser — <strong>never ship this to Production</strong>, as it leaks internal implementation details.',
        'Use <code>app.Environment.IsDevelopment()</code> / <code>IsProduction()</code> / <code>IsStaging()</code> to branch Program.cs behavior. Also use <code>builder.Environment.IsX()</code> in the builder phase (e.g., to register an in-memory database for Development).',
        'Environment-specific <code>appsettings.{Env}.json</code> files are automatically loaded and override the base <code>appsettings.json</code>. Use them for connection strings, feature flags, and log levels per environment. Never store secrets in these files — use dotnet user-secrets in Development or a secrets provider (Key Vault, Parameter Store) in Production.',
        '<strong>Critical gotcha:</strong> <code>ASPNETCORE_ENVIRONMENT</code> must be an actual operating system environment variable or a <code>launchSettings.json</code> entry. Setting it inside <code>appsettings.json</code> has no effect because the host reads the environment variable <em>before</em> loading any JSON configuration files.',
      ],
    },
    {
      heading: 'Kestrel — the embedded cross-platform HTTP server',
      points: [
        'Kestrel is the embedded, cross-platform HTTP server inside every ASP.NET Core process. It handles HTTP/1.1, HTTP/2, and HTTP/3 (QUIC) and is production-grade on its own — Microsoft runs it directly in Azure. It replaced the old <code>System.Net.HttpListener</code> approach with a fully asynchronous, libuv-inspired I/O model.',
        'In cloud and on-premises deployments, Kestrel typically sits <strong>behind a reverse proxy</strong> (Nginx, Caddy, Azure Application Gateway, AWS ALB) which handles TLS termination, DDoS mitigation, connection rate limiting, and certificate renewal. Add <code>app.UseForwardedHeaders()</code> so Kestrel trusts the <code>X-Forwarded-For</code> and <code>X-Forwarded-Proto</code> headers the proxy injects.',
        'Configure listening addresses via the <code>ASPNETCORE_URLS</code> environment variable (e.g. <code>http://+:8080</code>) or in code with <code>builder.WebHost.UseUrls("http://+:8080")</code>. In containers, always use <code>http://+:PORT</code> (not <code>localhost</code>) so the port is exposed on all interfaces.',
        'Fine-tune Kestrel in <code>builder.WebHost.ConfigureKestrel()</code>: max request body size (default 30 MB), max concurrent connections, request header timeout, keep-alive timeout, and per-endpoint HTTP protocol version. These can also be configured in <code>appsettings.json</code> under the <code>Kestrel</code> key — useful for environment-specific limits.',
        'HTTP/3 (QUIC) requires <code>app.UseRouting()</code> or endpoint routing to be active and the <code>Microsoft.AspNetCore.Server.Kestrel.Transport.Quic</code> package on non-Windows. Enable it per-endpoint: <code>o.Protocols = HttpProtocols.Http1AndHttp2AndHttp3</code>. Verify with curl: <code>curl --http3 https://localhost:5001</code>.',
      ],
    },
    {
      heading: 'Shutdown, lifetime events, and hosted services',
      points: [
        'When the host receives <code>SIGTERM</code> (Kubernetes pod termination, container stop) or Ctrl+C, it triggers graceful shutdown: it stops accepting new requests, waits for in-flight requests to complete up to the shutdown timeout (default 30 s in .NET 8, configurable via <code>builder.Host.ConfigureHostOptions(o => o.ShutdownTimeout = TimeSpan.FromSeconds(60))</code>), then exits.',
        '<code>IHostApplicationLifetime</code> (injected as a dependency) exposes three <code>CancellationToken</code> properties: <code>ApplicationStarted</code> (fires after all hosted services have started), <code>ApplicationStopping</code> (fires when shutdown begins, before HTTP server stops), and <code>ApplicationStopped</code> (fires when everything is done). Register callbacks to flush telemetry, drain message queues, or deregister from a service mesh.',
        '<code>BackgroundService</code> is the base class for long-running work (message consumers, cache warmers, scheduled jobs). Override <code>ExecuteAsync(CancellationToken stoppingToken)</code> and loop on <code>stoppingToken.IsCancellationRequested</code>. Register with <code>builder.Services.AddHostedService&lt;MyService&gt;()</code>. Multiple services run concurrently.',
        'Use <code>Task.Delay(interval, stoppingToken)</code> inside loops — not <code>Thread.Sleep</code>. When the host cancels the token during shutdown, <code>Task.Delay</code> throws <code>OperationCanceledException</code> immediately, exiting the loop cleanly. <code>Thread.Sleep</code> blocks the thread for the full interval regardless of cancellation.',
        'Hosted services that need to access scoped services (e.g. <code>DbContext</code>) must create a DI scope explicitly: <code>using var scope = _serviceScopeFactory.CreateScope(); var db = scope.ServiceProvider.GetRequiredService&lt;AppDbContext&gt;();</code>. Never inject scoped services directly into a singleton <code>BackgroundService</code> — the root container will capture a single instance for the entire app lifetime, causing data corruption.',
      ],
    },
    {
      heading: 'CreateSlimBuilder, Generic Host, and Native AOT',
      points: [
        '<code>WebApplication.CreateSlimBuilder(args)</code> produces a much smaller startup surface: it omits Razor view infrastructure, the default <code>HttpClient</code> message handler pipeline, event source logging, Windows EventLog, and many other optional components that prevent Native AOT compatibility. The API and middleware surface are identical — only the default wiring changes.',
        'Use <code>CreateSlimBuilder</code> when publishing with <code>dotnet publish -r linux-x64 /p:PublishAot=true</code>. AOT compilation trims all code that the linker cannot prove is reachable — anything that uses reflection, <code>dynamic</code>, or late binding may be trimmed incorrectly. Most minimal API patterns (TypedResults, route groups) are AOT-compatible; controller-based MVC and Razor Pages are not.',
        'The <strong>Generic Host</strong> (<code>IHost</code>) is the underlying foundation that both <code>WebApplication</code> and non-HTTP workers share. A pure worker app (no HTTP) uses <code>Host.CreateDefaultBuilder().ConfigureServices(svcs => svcs.AddHostedService&lt;MyWorker&gt;()).Build().Run()</code> — the same lifecycle, config, and DI system, minus any web plumbing.',
        'Configure the shutdown timeout and environment with <code>builder.Host.ConfigureHostOptions(o => { o.ShutdownTimeout = ...; })</code>. In .NET 8+ you can also control the behavior when a hosted service throws during startup (continue or crash) via <code>BackgroundServiceExceptionBehavior</code>.',
        'For AOT-published services, avoid <code>JsonSerializer.Deserialize&lt;T&gt;</code> with a generic <code>T</code> at runtime — the serializer cannot discover types that are not statically referenced. Instead, use <code>JsonSerializerContext</code> source generation: <code>[JsonSerializable(typeof(MyDto))]</code> on a partial <code>JsonSerializerContext</code> subclass and pass it as the second argument to <code>Deserialize</code>.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Minimal Program.cs',
      language: 'csharp',
      code: `// ── The minimal modern Program.cs ────────────────────────────────────
// 1. Builder phase — register services
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();           // MVC controllers
builder.Services.AddEndpointsApiExplorer();  // needed for Swagger/Scalar
builder.Services.AddSwaggerGen();

// 2. Build — seals DI; no more Add*() calls after this
var app = builder.Build();

// 3. App phase — configure middleware pipeline (ORDER MATTERS)
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.UseDeveloperExceptionPage();
}

app.UseHttpsRedirection();   // redirect HTTP → HTTPS
app.UseAuthorization();      // must come after Authentication
app.MapControllers();        // register all [ApiController] routes

// 4. Start — blocks until Ctrl+C / SIGTERM
app.Run();

// ── Minimal API variant (no controllers) ─────────────────────────────
// var app = WebApplication.Create(args);
// app.MapGet("/", () => "Hello, World!");
// app.Run();`,
    },
    {
      label: 'Environment branching',
      language: 'csharp',
      code: `var builder = WebApplication.CreateBuilder(args);

// ── Env-specific services in builder phase ───────────────────────────
if (builder.Environment.IsDevelopment())
{
    builder.Services.AddDatabaseDeveloperPageExceptionFilter();
    // Use InMemory DB in Development instead of real SQL
    builder.Services.AddDbContext<AppDbContext>(o =>
        o.UseInMemoryDatabase("DevDb"));
}
else
{
    builder.Services.AddDbContext<AppDbContext>(o =>
        o.UseSqlServer(builder.Configuration.GetConnectionString("Default")));
}

var app = builder.Build();

// ── Env-specific middleware in app phase ─────────────────────────────
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();    // full stack traces in browser
    app.UseMigrationsEndPoint();        // EF migration diagnostic page
}
else
{
    app.UseExceptionHandler("/Error");  // friendly error page
    app.UseHsts();                      // HTTPS Strict Transport Security
}

// ── Checking environment anywhere ────────────────────────────────────
// app.Environment.IsProduction()
// app.Environment.IsEnvironment("QA")     // custom env name
// app.Environment.EnvironmentName         // raw string`,
    },
    {
      label: 'Kestrel config',
      language: 'csharp',
      code: `var builder = WebApplication.CreateBuilder(args);

builder.WebHost.ConfigureKestrel(options =>
{
    // Body/connection limits
    options.Limits.MaxRequestBodySize          = 100 * 1024 * 1024; // 100 MB
    options.Limits.MaxConcurrentConnections    = 1000;
    options.Limits.KeepAliveTimeout            = TimeSpan.FromMinutes(2);
    options.Limits.RequestHeadersTimeout       = TimeSpan.FromSeconds(30);

    // Per-endpoint HTTP protocols
    options.ListenLocalhost(5000, o => o.Protocols = HttpProtocols.Http1);
    options.ListenLocalhost(5001, o =>
    {
        o.Protocols = HttpProtocols.Http1AndHttp2;
        o.UseHttps("cert.pfx", "password");
    });

    // Container-friendly — listen on all interfaces
    options.ListenAnyIP(8080);
});

// ── appsettings.json alternative ──────────────────────────────────────
// "Kestrel": {
//   "Limits": { "MaxRequestBodySize": 104857600 },
//   "Endpoints": {
//     "Http":  { "Url": "http://+:5000" },
//     "Https": { "Url": "https://+:5001" }
//   }
// }

// UseForwardedHeaders is REQUIRED when behind a reverse proxy
builder.Services.Configure<ForwardedHeadersOptions>(options =>
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto);

var app = builder.Build();
app.UseForwardedHeaders();  // must be first in pipeline
app.Run();`,
    },
    {
      label: 'BackgroundService',
      language: 'csharp',
      code: `public class TickerService : BackgroundService
{
    private readonly IServiceScopeFactory _factory;
    private readonly ILogger<TickerService> _logger;

    public TickerService(IServiceScopeFactory factory, ILogger<TickerService> logger)
    {
        _factory = factory;
        _logger  = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        int count = 0;
        _logger.LogInformation("TickerService starting");

        while (!stoppingToken.IsCancellationRequested)
        {
            count++;
            _logger.LogInformation("Tick #{Count}", count);

            // Scoped service access — creates and disposes a scope per tick
            using (var scope = _factory.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                await db.Ticks.AddAsync(new Tick { Count = count }, stoppingToken);
                await db.SaveChangesAsync(stoppingToken);
            }

            // Task.Delay + stoppingToken exits immediately on shutdown
            await Task.Delay(TimeSpan.FromSeconds(1), stoppingToken);
        }

        _logger.LogInformation("TickerService stopping gracefully");
    }
}

// Registration
builder.Services.AddHostedService<TickerService>();`,
    },
    {
      label: 'Startup hooks',
      language: 'csharp',
      code: `var builder = WebApplication.CreateBuilder(args);
builder.Services.AddHostedService<TickerService>();

var app = builder.Build();

// ── Run database migrations before app starts accepting requests ──────
// Pattern: create a scope, run migrations, dispose before Run()
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();    // idempotent
}

// ── Lifetime event hooks ──────────────────────────────────────────────
var lifetime = app.Services.GetRequiredService<IHostApplicationLifetime>();

lifetime.ApplicationStarted.Register(() =>
    app.Logger.LogInformation("All hosted services running — ready to accept requests"));

lifetime.ApplicationStopping.Register(() =>
    app.Logger.LogWarning("Shutdown requested — draining in-flight requests"));

lifetime.ApplicationStopped.Register(() =>
    app.Logger.LogInformation("Host fully stopped — process exiting"));

app.MapGet("/health", () => Results.Ok(new { status = "healthy" }));
app.Run();`,
    },
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: 'Startup class pattern vs minimal hosting',
      before: `// .NET 5 and earlier: two-file ceremony
// Program.cs
public static IHostBuilder CreateHostBuilder(string[] args) =>
    Host.CreateDefaultBuilder(args)
        .ConfigureWebHostDefaults(web => web.UseStartup<Startup>());

// Startup.cs
public class Startup {
  public void ConfigureServices(IServiceCollection services) {
    services.AddControllers();
  }
  public void Configure(IApplicationBuilder app, IWebHostEnvironment env) {
    if (env.IsDevelopment()) app.UseDeveloperExceptionPage();
    app.UseRouting();
    app.UseEndpoints(e => e.MapControllers());
  }
}`,
      after: `// .NET 6+: minimal hosting — everything in Program.cs
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();

var app = builder.Build();
if (app.Environment.IsDevelopment()) app.UseDeveloperExceptionPage();
app.MapControllers();
app.Run();`,
      note: 'Minimal hosting eliminates Startup.cs — builder phase replaces ConfigureServices, app phase replaces Configure. Less ceremony, same capability. Startup.cs still works (.NET 6+ is backward-compatible) but new projects use the minimal pattern.',
    },
    {
      title: 'BackgroundService — Thread.Sleep vs Task.Delay with stoppingToken',
      before: `// Thread.Sleep ignores cancellation — blocks shutdown for full interval
protected override async Task ExecuteAsync(CancellationToken stoppingToken)
{
    while (!stoppingToken.IsCancellationRequested)
    {
        DoWork();
        Thread.Sleep(5000); // blocks 5 s even during shutdown → slow pod termination
    }
}`,
      after: `// Task.Delay + stoppingToken exits immediately on SIGTERM
protected override async Task ExecuteAsync(CancellationToken stoppingToken)
{
    while (!stoppingToken.IsCancellationRequested)
    {
        await DoWorkAsync(stoppingToken);
        await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken); // wakes on cancellation
    }
}`,
      note: 'With Thread.Sleep, Kubernetes pod termination waits the full shutdown timeout before force-killing. With Task.Delay(stoppingToken), the loop exits immediately when the token is cancelled — clean shutdown in milliseconds.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Registering services after builder.Build()',
      wrong: `var app = builder.Build();

// BUG: container is sealed — throws InvalidOperationException
app.Services.GetRequiredService<IServiceCollection>()
   .AddSingleton<MyService>();`,
      right: `// Register services BEFORE Build()
builder.Services.AddSingleton<MyService>();

var app = builder.Build();  // seals the container`,
      explanation: 'builder.Build() finalises and seals the DI container. Any registration attempt after this throws InvalidOperationException at startup. Move all builder.Services.Add*() calls to the builder phase above Build().',
    },
    {
      title: 'Using Thread.Sleep in BackgroundService instead of Task.Delay',
      wrong: `protected override async Task ExecuteAsync(CancellationToken stoppingToken)
{
    while (!stoppingToken.IsCancellationRequested)
    {
        DoWork();
        Thread.Sleep(5000); // ignores cancellation — blocks shutdown
    }
}`,
      right: `protected override async Task ExecuteAsync(CancellationToken stoppingToken)
{
    while (!stoppingToken.IsCancellationRequested)
    {
        await DoWorkAsync(stoppingToken);
        await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
    }
}`,
      explanation: 'Thread.Sleep blocks the thread and ignores cancellation — the pod/container hangs at shutdown until the full Kubernetes termination timeout elapses, then gets force-killed. Task.Delay(stoppingToken) exits immediately when the host requests shutdown.',
    },
    {
      title: 'Forgetting app.UseForwardedHeaders() behind a reverse proxy',
      wrong: `// Behind Nginx/ALB — no forwarded headers middleware
// app.HttpContext.Connection.RemoteIpAddress → always 127.0.0.1
// app.HttpContext.Request.Scheme → always "http" even if user used HTTPS`,
      right: `builder.Services.Configure<ForwardedHeadersOptions>(opts =>
    opts.ForwardedHeaders =
        ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto);

var app = builder.Build();
app.UseForwardedHeaders();  // must be FIRST in the pipeline
// Now RemoteIpAddress and Request.Scheme reflect real client values`,
      explanation: 'Without UseForwardedHeaders(), ASP.NET Core sees only the proxy\'s loopback address. Rate limiting, IP-based auth, HTTPS redirects, and link generation all produce wrong results. Add this middleware first so every subsequent middleware sees the real client IP and scheme.',
    },
    {
      title: 'Setting ASPNETCORE_ENVIRONMENT in appsettings.json',
      wrong: `// appsettings.json — this does NOT work
{
  "ASPNETCORE_ENVIRONMENT": "Development"
}
// The host reads the env var BEFORE loading any JSON files
// so this key is ignored`,
      right: `// Set it as a real environment variable:
// launchSettings.json (local dev):
// "environmentVariables": { "ASPNETCORE_ENVIRONMENT": "Development" }

// Docker:
// ENV ASPNETCORE_ENVIRONMENT=Production

// Kubernetes:
// env: [{ name: ASPNETCORE_ENVIRONMENT, value: Production }]`,
      explanation: 'The hosting infrastructure reads ASPNETCORE_ENVIRONMENT during host construction, before any configuration files are loaded. Putting it in appsettings.json has no effect — it is silently ignored. Always set it as an actual OS environment variable.',
    },
    {
      title: 'Injecting scoped services directly into a singleton BackgroundService',
      wrong: `public class ReportService : BackgroundService
{
    // BUG: DbContext is Scoped — injecting into Singleton captures one instance forever
    public ReportService(AppDbContext db) { ... }
}`,
      right: `public class ReportService : BackgroundService
{
    private readonly IServiceScopeFactory _factory;

    public ReportService(IServiceScopeFactory factory) => _factory = factory;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            using var scope = _factory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            await RunReportAsync(db, stoppingToken);
            await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
        }
    }
}`,
      explanation: 'BackgroundService is registered as a singleton. Injecting a scoped DbContext directly causes the root DI container to capture a single context instance for the entire app lifetime — resulting in stale data, missing change tracking, and concurrency exceptions. Always use IServiceScopeFactory to create a fresh scope per unit of work.',
    },
  ];

  challenge: Challenge = {
    title: 'Environment-aware startup with a background ticker',
    language: 'csharp',
    description: `Build a minimal ASP.NET Core app that:<br/>
1. Reads a <code>TickIntervalSeconds</code> value from <code>IConfiguration</code> (default 2 if absent).<br/>
2. Runs a <code>BackgroundService</code> that logs "Tick #N" at that interval, stopping cleanly on shutdown.<br/>
3. Adds a <code>GET /health</code> endpoint returning 200 OK with the current environment name.<br/>
4. In Development only, adds a <code>GET /config</code> endpoint that returns the interval value.`,
    hints: [
      'Read config with builder.Configuration.GetValue<int>("TickIntervalSeconds", 2)',
      'Pass the interval to the service via IOptions<T> or by registering a typed settings class',
      'Use Task.Delay(TimeSpan.FromSeconds(interval), stoppingToken) inside ExecuteAsync',
      'Branch with app.Environment.IsDevelopment() to conditionally add the /config endpoint',
    ],
    starterCode: `using Microsoft.Extensions.Hosting;

var builder = WebApplication.CreateBuilder(args);

// TODO: read TickIntervalSeconds from config

// TODO: register TickerService as a hosted service

var app = builder.Build();

// TODO: GET /health returns 200 with environment name

// TODO: GET /config (Development only) returns interval value

app.Run();

// TODO: implement TickerService : BackgroundService`,
    solution: `using Microsoft.Extensions.Hosting;

var builder = WebApplication.CreateBuilder(args);

int interval = builder.Configuration.GetValue<int>("TickIntervalSeconds", 2);
builder.Services.AddSingleton(new TickerOptions { IntervalSeconds = interval });
builder.Services.AddHostedService<TickerService>();

var app = builder.Build();

app.MapGet("/health", (IHostEnvironment env) =>
    Results.Ok(new { env.EnvironmentName }));

if (app.Environment.IsDevelopment())
{
    app.MapGet("/config", (TickerOptions opts) =>
        Results.Ok(new { opts.IntervalSeconds }));
}

app.Run();

// ── Support types ──────────────────────────────────────────────────────
public class TickerOptions { public int IntervalSeconds { get; set; } }

public class TickerService(TickerOptions opts, ILogger<TickerService> logger)
    : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        int count = 0;
        while (!stoppingToken.IsCancellationRequested)
        {
            count++;
            logger.LogInformation("Tick #{Count}", count);
            await Task.Delay(TimeSpan.FromSeconds(opts.IntervalSeconds), stoppingToken);
        }
    }
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What happens if you call builder.Services.AddSingleton<T>() after builder.Build()?',
      options: [
        'The service is registered but ignored at runtime',
        'An InvalidOperationException is thrown — the container is sealed after Build()',
        'It works, but the service is registered as Transient instead',
        'It registers for the next app.Run() cycle',
      ],
      answer: 1,
      explanation: 'builder.Build() seals the DI container. Any attempt to register services afterward throws InvalidOperationException with the message "Cannot modify a ServiceCollection after it has been built." All Add*() calls must happen in the builder phase before Build().',
    },
    {
      q: 'Which environment variable controls the active ASP.NET Core environment?',
      options: [
        'DOTNET_RUNTIME_ENV',
        'APP_ENVIRONMENT',
        'ASPNETCORE_ENVIRONMENT',
        'ASPNET_ENV',
      ],
      answer: 2,
      explanation: 'ASPNETCORE_ENVIRONMENT (or DOTNET_ENVIRONMENT) sets the environment name. Standard values are Development, Staging, and Production. It must be a real OS environment variable — setting it inside appsettings.json has no effect because the host reads it before any JSON files are loaded.',
    },
    {
      q: 'Why should you use Task.Delay(ms, stoppingToken) rather than Thread.Sleep(ms) in a BackgroundService?',
      options: [
        'Thread.Sleep uses more CPU and should always be avoided',
        'Task.Delay is async and wakes immediately when the cancellation token is cancelled, enabling fast graceful shutdown',
        'Thread.Sleep does not compile inside async methods',
        'Task.Delay has a built-in retry mechanism on failure',
      ],
      answer: 1,
      explanation: 'Thread.Sleep blocks the thread and ignores cancellation — the service keeps sleeping the full interval even during host shutdown, causing Kubernetes pod termination to time out and force-kill the container. Task.Delay(ms, stoppingToken) throws OperationCanceledException immediately when the token is cancelled, exiting the loop cleanly.',
    },
    {
      q: 'In a production deployment, what role does Kestrel play when behind Nginx?',
      options: [
        'Kestrel is not used — Nginx replaces it entirely',
        'Kestrel handles TLS termination; Nginx handles HTTP routing',
        'Kestrel handles the actual HTTP requests on the app side; Nginx is the public-facing reverse proxy',
        'Kestrel is a load balancer that distributes to multiple Nginx workers',
      ],
      answer: 2,
      explanation: 'Kestrel is the embedded HTTP server inside the ASP.NET Core process. Nginx (or any reverse proxy) sits in front of it handling TLS termination, load balancing, and static asset caching. Traffic flows: client → Nginx (TLS, static assets) → Kestrel (app code). UseForwardedHeaders() is required so Kestrel trusts the X-Forwarded-For and X-Forwarded-Proto headers Nginx injects.',
    },
    {
      q: 'Which call seals the DI container, making no further service registrations possible?',
      options: [
        'app.Run()',
        'app.UseRouting()',
        'builder.Build()',
        'WebApplication.CreateBuilder()',
      ],
      answer: 2,
      explanation: 'builder.Build() finalises and seals the service container. This is the dividing line between the builder phase (service registration) and the app phase (middleware and endpoints). Middleware registration with app.Use*() and endpoint registration with app.Map*() happen after Build().',
    },
    {
      q: 'Why should you use IServiceScopeFactory in a BackgroundService instead of injecting DbContext directly?',
      options: [
        'DbContext is not thread-safe and must be recreated on each thread',
        'BackgroundService is a singleton — injecting a scoped DbContext directly captures a single instance forever, causing stale data and concurrency issues',
        'DbContext cannot be used in async methods',
        'IServiceScopeFactory provides connection pooling for DbContext',
      ],
      answer: 1,
      explanation: 'BackgroundService is registered as a singleton. Injecting a scoped service (like DbContext) into a singleton causes the DI container to capture a single instance for the entire app lifetime. Use IServiceScopeFactory.CreateScope() per unit of work to get a fresh DbContext that is properly disposed after each iteration.',
    },
    {
      q: 'What does WebApplication.CreateSlimBuilder() omit compared to CreateBuilder(), and when should you use it?',
      options: [
        'It omits all middleware and must be configured manually from scratch',
        'It omits Razor views, default HttpClient infrastructure, and Windows EventLog — use it for Native AOT-published microservices',
        'It omits the DI container — services must use static registration',
        'It omits Kestrel — you must configure a different HTTP server',
      ],
      answer: 1,
      explanation: 'CreateSlimBuilder() strips out components that prevent Native AOT compatibility: Razor infrastructure, the default HttpClient message handler chain, EventLog/EventSource logging on Windows, and HTTPS developer certificate loading. The API surface (services, configuration, middleware, endpoints) is identical. Use it when publishing with /p:PublishAot=true for small, fast container starts.',
    },
  ];

  qna: QnaItem[] = [
    { q: 'What is the difference between WebApplication.Create() and WebApplication.CreateBuilder()?', a: '<code>WebApplication.Create(args)</code> is a shortcut that immediately builds a <code>WebApplication</code> with default settings — useful for ultra-minimal one-file apps. You cannot register services before it builds. <code>WebApplication.CreateBuilder(args)</code> returns a <code>WebApplicationBuilder</code> that you can customise (add services, configure logging, swap providers) before calling <code>Build()</code>. For any real app, use <code>CreateBuilder</code>.' },
    { q: 'What does WebApplication.CreateSlimBuilder() give you and when should you use it?', a: '<code>CreateSlimBuilder()</code> omits defaults that prevent Native AOT compatibility — Razor, HttpClient message handlers, Windows EventLog, HTTPS certificate loading. Use it when publishing with <code>dotnet publish -r linux-x64 /p:PublishAot=true</code> for serverless functions or microservices that need sub-100 ms cold starts. For conventional apps, <code>CreateBuilder</code> is easier and more capable.' },
    { q: 'How does layered configuration work? Which source wins?', a: 'ASP.NET Core stacks providers in priority order (lowest to highest): <code>appsettings.json</code> → <code>appsettings.{Env}.json</code> → environment variables → command-line arguments. Later sources override the same key in earlier ones. For secrets: use <strong>dotnet user-secrets</strong> in Development (between env-specific JSON and env vars) or a cloud secrets provider (Key Vault, AWS Parameter Store) in Production. You can inspect the merged config at runtime with <code>IConfiguration.GetDebugView()</code>.' },
    { q: 'How do I pass settings to a BackgroundService from configuration?', a: 'The idiomatic pattern is <strong>IOptions&lt;T&gt;</strong>: define a settings class, call <code>builder.Services.Configure&lt;TickerSettings&gt;(builder.Configuration.GetSection("Ticker"))</code>, then inject <code>IOptions&lt;TickerSettings&gt;</code> into the service constructor and access <code>options.Value.IntervalSeconds</code>. This is unit-testable — pass fake <code>IOptions</code> wrapping test values without touching real config files. Use <code>IOptionsSnapshot&lt;T&gt;</code> for scoped services that need per-request config refresh.' },
    { q: 'What is IHostApplicationLifetime and when do I need it?', a: 'It exposes three <code>CancellationToken</code> properties: <code>ApplicationStarted</code> (fires after all hosted services are running), <code>ApplicationStopping</code> (fires when shutdown begins), and <code>ApplicationStopped</code> (fires after the HTTP server has stopped). Inject it when you need to flush a telemetry buffer after startup, deregister from a service mesh during stopping, or emit a "ready" log line only after all warm-up steps complete. For most background services, the <code>stoppingToken</code> passed to <code>ExecuteAsync</code> is sufficient.' },
    { q: 'Can I run multiple hosted services in the same app?', a: 'Yes. Call <code>AddHostedService&lt;T&gt;()</code> multiple times for different services. They all start concurrently when <code>app.Run()</code> is called and stop in reverse registration order during shutdown. Each receives its own <code>stoppingToken</code>. For ordered startup, implement <code>IHostedLifecycleService</code> (.NET 8+) which provides <code>StartingAsync</code>, <code>StartedAsync</code>, <code>StoppingAsync</code>, and <code>StoppedAsync</code> for fine-grained control.' },
    { q: 'What is ASPNETCORE_URLS and how does it differ from builder.WebHost.UseUrls()?', a: 'Both control which addresses Kestrel listens on. <code>ASPNETCORE_URLS</code> is an environment variable — it <strong>overrides</strong> code-level <code>UseUrls()</code>, making it preferred for containerised deployments where you change the port without rebuilding. Format: semicolon-separated list — <code>http://+:8080;https://+:8443</code>. Use <code>http://+:PORT</code> (not <code>localhost</code>) in containers so the port is exposed on all network interfaces.' },
    { q: 'How do I run EF Core migrations automatically on app startup?', a: 'Create a DI scope after <code>builder.Build()</code> but before <code>app.Run()</code>: <code>using var scope = app.Services.CreateScope(); var db = scope.ServiceProvider.GetRequiredService&lt;AppDbContext&gt;(); await db.Database.MigrateAsync();</code> This pattern is idempotent (safe to call on every deploy) and runs migrations before any traffic reaches the app. In production, prefer running migrations as a Kubernetes init container or separate deployment step to avoid locking issues during rolling deploys.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'ASP.NET Core hosting starts with WebApplication.CreateBuilder() which wires config, DI, and Kestrel in one call; the builder phase (before Build()) registers services, the app phase (after Build()) configures middleware — and the DI container is sealed permanently when Build() is called.',
    mustKnow: [
      '<code>builder.Build()</code> seals the DI container — all <code>builder.Services.Add*()</code> calls must happen before it',
      'Configuration priority: appsettings.json → appsettings.{Env}.json → env vars → CLI args — later sources win',
      '<code>ASPNETCORE_ENVIRONMENT</code> must be a real OS env var — setting it in appsettings.json is silently ignored',
      'Middleware ordering in the app phase is critical — <code>UseAuthentication()</code> must precede <code>UseAuthorization()</code>',
      'Use <code>Task.Delay(interval, stoppingToken)</code> in BackgroundService — not Thread.Sleep — for fast graceful shutdown',
      'Scoped services (like DbContext) cannot be injected directly into singleton BackgroundService — use <code>IServiceScopeFactory</code>',
      'Add <code>app.UseForwardedHeaders()</code> as the first middleware when deployed behind a reverse proxy',
    ],
    interviewFocus: [
      'What happens if you call builder.Services.AddSingleton() after builder.Build()?',
      'Why use Task.Delay(stoppingToken) over Thread.Sleep() in a BackgroundService?',
      'Why does ASPNETCORE_ENVIRONMENT in appsettings.json have no effect?',
      'How does Kestrel relate to Nginx in a production deployment and what middleware is required?',
      'Why can\'t you inject DbContext directly into a BackgroundService, and what is the correct pattern?',
    ],
  };
}
