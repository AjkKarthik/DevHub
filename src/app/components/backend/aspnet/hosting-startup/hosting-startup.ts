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
  selector: 'app-aspnet-hosting-startup',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './hosting-startup.html',
  styleUrl: './hosting-startup.scss',
})
export class AspnetHostingStartup {

  quickRef: QuickRefItem[] = [
    { name: 'WebApplication.CreateBuilder()',  type: 'method',  desc: 'Bootstraps DI, config (json/env/cli), logging, and Kestrel in one call', since: '.NET 6+' },
    { name: 'builder.Services',               type: 'accessor', desc: 'IServiceCollection for DI registrations; must be called before Build()', since: '.NET 6+' },
    { name: 'builder.Configuration',          type: 'accessor', desc: 'Layered IConfiguration: appsettings.json → env vars → CLI args', since: '.NET 6+' },
    { name: 'app.Build()',                    type: 'method',  desc: 'Seals the service container and returns the WebApplication middleware builder', since: '.NET 6+' },
    { name: 'app.Run()',                      type: 'method',  desc: 'Starts Kestrel and blocks until the host shuts down', since: '.NET 6+' },
    { name: 'ASPNETCORE_ENVIRONMENT',         type: 'keyword', desc: 'Controls the active environment; Development enables detailed errors & hot reload', since: 'Core 1+' },
    { name: 'WebApplication.CreateSlimBuilder()', type: 'method', desc: 'Stripped-down builder for trimmed/Native AOT deployments — no Razor, fewer defaults', since: '.NET 7+' },
    { name: 'IHostApplicationLifetime',       type: 'interface', desc: 'Exposes ApplicationStarted/Stopping/Stopped events for graceful shutdown hooks', since: 'Core 2+' },
    { name: 'BackgroundService',              type: 'class',   desc: 'Base class for long-running hosted services; override ExecuteAsync', since: 'Core 2+' },
    { name: 'app.Environment.IsDevelopment()', type: 'method', desc: 'Conditional branching by environment; also IsProduction() and IsStaging()', since: '.NET 6+' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'WebApplication.CreateBuilder() — what it wires for you',
      points: [
        '<code>WebApplication.CreateBuilder(args)</code> is the single entry point for modern ASP.NET Core apps. It sets up configuration, DI, logging, and the HTTP server with one call — eliminating the old <code>IWebHostBuilder</code> ceremony.',
        '<strong>Configuration</strong> is layered automatically: <code>appsettings.json</code> is the base, then <code>appsettings.{Environment}.json</code> overrides it, then environment variables, then command-line arguments — each layer wins over the previous one.',
        '<strong>Logging</strong> adds Console and Debug providers. You can add or replace providers by calling <code>builder.Logging.ClearProviders()</code> then <code>.AddSerilog()</code>, <code>.AddOpenTelemetry()</code>, etc.',
        '<strong>DI</strong> is ready via <code>builder.Services</code>. ASP.NET Core itself registers its core services here; you add yours. Everything registered before <code>Build()</code> is available to middleware and endpoints.',
      ],
    },
    {
      heading: 'Program.cs anatomy — builder phase vs app phase',
      points: [
        'Program.cs splits cleanly into two phases: <em>builder phase</em> (registering services) and <em>app phase</em> (configuring middleware and endpoints).',
        'The <strong>builder phase</strong> runs from <code>CreateBuilder</code> to <code>Build()</code>. Use <code>builder.Services.Add*()</code> for DI, <code>builder.Configuration</code> for config, <code>builder.Logging</code> for log providers. Order within this phase generally does not matter.',
        '<code>var app = builder.Build()</code> seals the DI container. <strong>No more service registrations</strong> are possible after this point — trying to call <code>app.Services.AddSomething()</code> throws.',
        'The <strong>app phase</strong> runs from <code>Build()</code> to <code>Run()</code>. Use <code>app.Use*()</code> to add middleware and <code>app.Map*()</code> to register endpoints. Ordering <em>does</em> matter here — middleware runs in registration order.',
      ],
    },
    {
      heading: 'Environments — Development, Staging, Production',
      points: [
        'The active environment is read from the <code>ASPNETCORE_ENVIRONMENT</code> (or <code>DOTNET_ENVIRONMENT</code>) environment variable. ASP.NET Core defines three standard names: <code>Development</code>, <code>Staging</code>, and <code>Production</code>.',
        'In <strong>Development</strong>, <code>app.UseDeveloperExceptionPage()</code> is added automatically. This returns full stack traces to the browser — never expose this in Production.',
        'Use <code>app.Environment.IsDevelopment()</code> / <code>IsProduction()</code> / <code>IsStaging()</code> to branch Program.cs behavior, or <code>builder.Environment.EnvironmentName</code> in the builder phase.',
        'Environment-specific <code>appsettings.{Env}.json</code> files override the base config automatically. For local secrets that should not be committed, use dotnet user-secrets in Development.',
      ],
    },
    {
      heading: 'Kestrel — the cross-platform web server',
      points: [
        'Kestrel is the embedded, cross-platform HTTP server inside every ASP.NET Core process. It handles HTTP/1.1, HTTP/2, and HTTP/3 and is production-grade on its own.',
        'In cloud deployments, Kestrel typically sits <strong>behind a reverse proxy</strong> (Nginx, Azure Application Gateway, Cloudflare) which handles TLS termination, load balancing, and rate limiting. Kestrel trusts the forwarded headers via <code>UseForwardedHeaders()</code>.',
        'Configure listening addresses via <code>ASPNETCORE_URLS</code> (e.g. <code>http://+:8080</code>) or in code with <code>builder.WebHost.UseUrls("http://+:8080")</code>. For HTTPS, provide a certificate in Kestrel options.',
        'Fine-tune Kestrel in <code>builder.WebHost.ConfigureKestrel()</code>: max request body size, connection limits, HTTP protocols per endpoint. For most apps the defaults are fine.',
      ],
    },
    {
      heading: 'Shutdown, lifetime, and hosted services',
      points: [
        'When the host receives <code>SIGTERM</code> or Ctrl+C, it triggers graceful shutdown: it stops accepting new requests, drains in-flight ones up to the shutdown timeout (default 30 s), then exits.',
        '<code>IHostApplicationLifetime</code> (injected as a dependency) exposes <code>ApplicationStarted</code>, <code>ApplicationStopping</code>, and <code>ApplicationStopped</code> tokens — register callbacks to release resources or flush telemetry.',
        '<code>BackgroundService</code> is the base class for long-running work (message consumers, cache warmers). Override <code>ExecuteAsync(CancellationToken)</code> and check the token to stop cleanly. Register with <code>builder.Services.AddHostedService&lt;MyService&gt;()</code>.',
        'Avoid <code>Thread.Sleep</code> inside hosted services — use <code>Task.Delay(ms, stoppingToken)</code> so the delay wakes up immediately when shutdown is requested.',
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

builder.Services.AddControllers();          // MVC controllers
builder.Services.AddEndpointsApiExplorer(); // needed for Swagger
builder.Services.AddSwaggerGen();

// 2. Build — seals DI; no more Add*() calls after this
var app = builder.Build();

// 3. App phase — configure middleware pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.UseDeveloperExceptionPage();   // auto-added in Dev, explicit here for clarity
}

app.UseHttpsRedirection();             // redirect HTTP → HTTPS
app.UseAuthorization();
app.MapControllers();                  // register all [ApiController] routes

// 4. Start — blocks until Ctrl+C / SIGTERM
app.Run();

// ── Minimal API variant (no controllers) ─────────────────────────────
// var app = WebApplication.Create(args);   // even shorter for simple apps
// app.MapGet("/", () => "Hello, World!");
// app.Run();`,
    },
    {
      label: 'Environment Branching',
      language: 'csharp',
      code: `var builder = WebApplication.CreateBuilder(args);

// ── Read env-specific config ──────────────────────────────────────────
// appsettings.json is the base; appsettings.Development.json wins in Dev
string connStr = builder.Configuration.GetConnectionString("DefaultConnection")!;
builder.Services.AddSqlServer<AppDbContext>(connStr);

// ── Environment checks in builder phase ──────────────────────────────
if (builder.Environment.IsDevelopment())
{
    builder.Services.AddDatabaseDeveloperPageExceptionFilter();
}

var app = builder.Build();

// ── Environment checks in app phase ──────────────────────────────────
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();    // full stack traces in browser
    app.UseMigrationsEndPoint();        // /applied-migrations diagnostic page
}
else
{
    app.UseExceptionHandler("/Error"); // friendly error page in production
    app.UseHsts();                     // HTTPS Strict Transport Security
}

// ── Check programmatically anywhere ──────────────────────────────────
// app.Environment.IsProduction()
// app.Environment.IsStaging()
// app.Environment.IsEnvironment("Custom")
// app.Environment.EnvironmentName  →  "Development" | "Staging" | "Production"

app.Run();`,
    },
    {
      label: 'Kestrel Config',
      language: 'csharp',
      code: `// ── Kestrel configuration options ────────────────────────────────────
var builder = WebApplication.CreateBuilder(args);

builder.WebHost.ConfigureKestrel(options =>
{
    // Max request body size (default 30 MB)
    options.Limits.MaxRequestBodySize = 100 * 1024 * 1024; // 100 MB

    // Connection limits
    options.Limits.MaxConcurrentConnections = 1000;
    options.Limits.MaxConcurrentUpgradedConnections = 100;

    // Timeouts
    options.Limits.KeepAliveTimeout = TimeSpan.FromMinutes(2);
    options.Limits.RequestHeadersTimeout = TimeSpan.FromSeconds(30);

    // Per-endpoint protocol support
    options.ListenLocalhost(5000, o => o.Protocols = HttpProtocols.Http1);
    options.ListenLocalhost(5001, o =>
    {
        o.Protocols = HttpProtocols.Http1AndHttp2;
        o.UseHttps("cert.pfx", "password");
    });
    options.ListenAnyIP(8080);   // 0.0.0.0:8080 — for containers
});

var app = builder.Build();
app.Run();

// ── appsettings.json equivalent ──────────────────────────────────────
// "Kestrel": {
//   "Limits": { "MaxRequestBodySize": 104857600 },
//   "Endpoints": {
//     "Http":  { "Url": "http://+:5000" },
//     "Https": { "Url": "https://+:5001" }
//   }
// }`,
    },
    {
      label: 'Background Service',
      language: 'csharp',
      code: `// ── Long-running hosted service ───────────────────────────────────────
public class CounterService : BackgroundService
{
    private readonly ILogger<CounterService> _logger;

    public CounterService(ILogger<CounterService> logger)
        => _logger = logger;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        int count = 0;
        _logger.LogInformation("CounterService starting");

        while (!stoppingToken.IsCancellationRequested)
        {
            count++;
            _logger.LogInformation("Tick #{Count}", count);

            // Task.Delay wakes immediately on cancellation — use it, not Thread.Sleep
            await Task.Delay(TimeSpan.FromSeconds(1), stoppingToken);
        }

        _logger.LogInformation("CounterService stopping gracefully");
    }
}

// ── Register and use lifetime events ─────────────────────────────────
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddHostedService<CounterService>();  // register the service

var app = builder.Build();

// IHostApplicationLifetime for startup / shutdown hooks
var lifetime = app.Services.GetRequiredService<IHostApplicationLifetime>();
lifetime.ApplicationStarted.Register(() =>
    app.Logger.LogInformation("Application fully started — ready to accept requests"));
lifetime.ApplicationStopping.Register(() =>
    app.Logger.LogWarning("Shutdown requested — beginning graceful drain"));

app.MapGet("/", () => "Running");
app.Run();`,
    },
  ];

  challenge: Challenge = {
    title: 'Environment-aware startup with a background ticker',
    language: 'csharp',
    description: `Build a minimal ASP.NET Core app that:
1. Reads a <code>TickIntervalSeconds</code> value from <code>IConfiguration</code> (default to 2 if absent).
2. Runs a <code>BackgroundService</code> that logs "Tick #N" at that interval, stopping cleanly on shutdown.
3. Adds a <code>GET /health</code> endpoint returning 200 OK with the current environment name.
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

app.MapGet("/health", (IHostEnvironment env) => Results.Ok(new { env.EnvironmentName }));

if (app.Environment.IsDevelopment())
{
    app.MapGet("/config", (TickerOptions opts) =>
        Results.Ok(new { opts.IntervalSeconds }));
}

app.Run();

// ── Support types ──────────────────────────────────────────────────────
public class TickerOptions { public int IntervalSeconds { get; set; } }

public class TickerService : BackgroundService
{
    private readonly TickerOptions _opts;
    private readonly ILogger<TickerService> _logger;

    public TickerService(TickerOptions opts, ILogger<TickerService> logger)
    {
        _opts   = opts;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        int count = 0;
        while (!stoppingToken.IsCancellationRequested)
        {
            count++;
            _logger.LogInformation("Tick #{Count}", count);
            await Task.Delay(TimeSpan.FromSeconds(_opts.IntervalSeconds), stoppingToken);
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
        'It works, but only for the next request cycle',
        'It registers the service as Transient instead',
      ],
      answer: 1,
      explanation: '<code>builder.Build()</code> seals the DI container. Any attempt to register services afterward throws <code>InvalidOperationException</code>. All <code>builder.Services.Add*()</code> calls must happen before <code>Build()</code>.',
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
      explanation: '<code>ASPNETCORE_ENVIRONMENT</code> (or <code>DOTNET_ENVIRONMENT</code>) sets the environment name. Standard values are <code>Development</code>, <code>Staging</code>, and <code>Production</code>. The value is read during host construction and exposed as <code>app.Environment.EnvironmentName</code>.',
    },
    {
      q: 'Why should you use Task.Delay(ms, stoppingToken) rather than Thread.Sleep(ms) in a BackgroundService?',
      options: [
        'Thread.Sleep uses more CPU and should always be avoided',
        'Task.Delay is async and wakes immediately when the cancellation token is triggered, enabling fast shutdown',
        'Thread.Sleep does not work inside async methods',
        'Task.Delay has a built-in retry mechanism',
      ],
      answer: 1,
      explanation: '<code>Thread.Sleep</code> blocks the thread and ignores cancellation — the service keeps sleeping until the full interval elapses even during shutdown. <code>Task.Delay(ms, stoppingToken)</code> wakes up immediately when the host cancels the token, allowing fast, graceful shutdown.',
    },
    {
      q: 'In a production deployment, what role does Kestrel play when behind Nginx?',
      options: [
        'Kestrel is not used — Nginx replaces it entirely',
        'Kestrel handles TLS termination; Nginx handles HTTP routing',
        'Kestrel handles the actual HTTP requests from the app side; Nginx is the public-facing reverse proxy',
        'Kestrel is a load balancer that distributes to multiple Nginx workers',
      ],
      answer: 2,
      explanation: 'Kestrel is the embedded HTTP server inside your ASP.NET Core process. Nginx (or any reverse proxy) sits in front of it, handling TLS termination, load balancing, and static asset caching. Traffic flows: client → Nginx → Kestrel → app code. Kestrel trusts forwarded-header metadata from the proxy.',
    },
    {
      q: 'Which call in Program.cs makes it impossible to add more services via builder.Services?',
      options: [
        'app.Run()',
        'app.Build()',
        'builder.Build()',
        'WebApplication.CreateBuilder()',
      ],
      answer: 2,
      explanation: '<code>builder.Build()</code> finalises and seals the service container. After this call the DI graph is locked. Middleware and endpoint registration (the <em>app phase</em>) happens after <code>Build()</code>, but service registration must happen before.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between WebApplication.Create() and WebApplication.CreateBuilder()?',
      a: '<code>WebApplication.Create(args)</code> is a shortcut that immediately builds a <code>WebApplication</code> with default settings — useful for ultra-minimal apps. You cannot register services before it. <code>WebApplication.CreateBuilder(args)</code> returns a <code>WebApplicationBuilder</code> that you can customise (add services, configure logging, etc.) before calling <code>Build()</code>. For any real app, use <code>CreateBuilder</code>.',
    },
    {
      q: 'What does WebApplication.CreateSlimBuilder() give you and when should you use it?',
      a: '<code>CreateSlimBuilder()</code> omits many defaults that prevent Native AOT compatibility — things like HttpClient message handlers, HTTPS certificate loading, EventLog on Windows, and Razor-related infrastructure. Use it when you are building a microservice or serverless function that must be published with <code>dotnet publish -r linux-x64 /p:PublishAot=true</code>. For conventional apps, <code>CreateBuilder</code> is easier and more capable.',
    },
    {
      q: 'How does layered configuration work? Which source wins?',
      a: 'ASP.NET Core stacks configuration providers in priority order: <code>appsettings.json</code> (lowest) → <code>appsettings.{Env}.json</code> → environment variables → command-line arguments (highest). Later sources override earlier ones for the same key. For example, if <code>appsettings.json</code> sets <code>"Port": 5000</code> and the env var <code>PORT=8080</code> exists, the app sees 8080. You can add custom providers (Azure Key Vault, AWS Parameter Store) at any position in this chain.',
    },
    {
      q: 'How do I pass settings to a BackgroundService from configuration?',
      a: 'The idiomatic pattern is <strong>IOptions&lt;T&gt;</strong>: define a settings class (e.g. <code>TickerSettings</code>), call <code>builder.Services.Configure&lt;TickerSettings&gt;(builder.Configuration.GetSection("Ticker"))</code>, then inject <code>IOptions&lt;TickerSettings&gt;</code> into the service constructor. Access the value via <code>options.Value.IntervalSeconds</code>. This is tested easily: you can provide fake <code>IOptions</code> wrapping test values without touching real config files.',
    },
    {
      q: 'What is IHostApplicationLifetime and when do I need it?',
      a: 'It exposes three <code>CancellationToken</code> properties: <code>ApplicationStarted</code> (fires after all hosted services are running), <code>ApplicationStopping</code> (fires when shutdown begins), and <code>ApplicationStopped</code> (fires after the HTTP server has stopped). Inject it when you need to perform work at these moments — flushing a telemetry buffer, deregistering from a service mesh, or printing a "ready" banner after all warm-up steps complete. For most hosted services, the <code>stoppingToken</code> passed to <code>ExecuteAsync</code> is sufficient.',
    },
    {
      q: 'Can I run multiple hosted services in the same app?',
      a: 'Yes. Call <code>AddHostedService&lt;T&gt;()</code> multiple times for different services. They all start in registration order when <code>app.Run()</code> is called (concurrently by default) and stop in reverse order during shutdown. Each receives its own <code>stoppingToken</code>. If startup order matters, implement <code>IHostedLifecycleService</code> (.NET 8+) for finer-grained start/stop hooks, or chain service dependencies via injected <code>IHostApplicationLifetime</code>.',
    },
    {
      q: 'What is ASPNETCORE_URLS and how does it differ from builder.WebHost.UseUrls()?',
      a: 'Both control which addresses Kestrel listens on. <code>ASPNETCORE_URLS</code> is an environment variable — it overrides code-level <code>UseUrls()</code>, which is why it is preferred for containerised deployments where you want to change the port without rebuilding. The format is a semicolon-separated list: <code>http://+:8080;https://+:8443</code>. <code>UseUrls()</code> in code is a reasonable default that operators can then override with the env var.',
    },
  ];
}
