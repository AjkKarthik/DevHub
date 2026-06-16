import { Component } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PrerequisitesComponent, Prerequisite } from '../../../shared/prerequisites/prerequisites';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-aspnet-dependency-injection',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    CommonMistakesComponent, RevisionCardComponent, PrerequisitesComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './dependency-injection.html',
  styleUrl: './dependency-injection.scss',
})
export class AspnetDependencyInjection {

  prerequisites: Prerequisite[] = [
    { label: 'Hosting & Startup', route: '/aspnet/hosting-startup' },
    { label: 'Configuration & Options', route: '/aspnet/configuration' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'AddSingleton<TService, TImpl>()', type: 'method',    desc: 'One instance for the entire application lifetime', since: 'Core 1+' },
    { name: 'AddScoped<TService, TImpl>()',    type: 'method',    desc: 'One instance per HTTP request (per scope)', since: 'Core 1+' },
    { name: 'AddTransient<TService, TImpl>()', type: 'method',    desc: 'New instance every time the service is requested from DI', since: 'Core 1+' },
    { name: 'TryAddSingleton / Scoped / Transient', type: 'method', desc: 'Registers only if no registration exists — safe for library authors', since: 'Core 1+' },
    { name: 'services.AddScoped(typeof(IRepo<>), typeof(Repo<>))', type: 'method', desc: 'Open-generic registration — one rule covers IRepo<T> for any T', since: 'Core 1+' },
    { name: 'IServiceProvider.GetRequiredService<T>()', type: 'method', desc: 'Resolves T from the container; throws if not registered (prefer constructor injection)', since: 'Core 1+' },
    { name: 'IServiceScopeFactory',           type: 'interface', desc: 'Creates manual scopes for resolving Scoped services from Singletons (background services)', since: 'Core 1+' },
    { name: 'Keyed services [FromKeyedServices]', type: 'keyword', desc: '.NET 8+: register and resolve multiple implementations of the same interface by key', since: '.NET 8+' },
    { name: 'ActivatorUtilities.CreateInstance<T>()', type: 'method', desc: 'Instantiates a type mixing DI-resolved and manually-supplied constructor arguments', since: 'Core 1+' },
    { name: 'Captive dependency',             type: 'keyword',  desc: 'Anti-pattern: a Singleton holding a Scoped service — the Scoped service is never freed', since: 'Core 1+' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Service lifetimes — Singleton, Scoped, Transient',
      points: [
        '<strong>Singleton</strong>: one instance is created the first time it is requested and reused for the entire application lifetime. All requests share the same object — must be thread-safe because concurrent requests access it simultaneously. Use for caches, configuration wrappers, HTTP clients, and stateless services.',
        '<strong>Scoped</strong>: one instance per <em>scope</em>. In ASP.NET Core, a new <code>IServiceScope</code> is created for each HTTP request, so each request gets its own fresh instance. Perfect for <code>DbContext</code>, unit-of-work, per-request state, and services that should not bleed state between requests.',
        '<strong>Transient</strong>: a brand-new instance is created every time the service is resolved from DI — even multiple times within the same request. Best for lightweight, stateless utilities (validators, mappers, formatters). Avoid for expensive objects or objects that hold open connections.',
        'Choosing wrong costs you correctness, not just performance: a Scoped DbContext in a Singleton will serve stale entity-tracking state to every request after the first. A Transient <code>HttpClient</code> creates a new socket per resolution, exhausting ports under load.',
        'The rule of thumb: <em>Scoped by default</em> for services with per-request state; <em>Singleton</em> for thread-safe shared state; <em>Transient</em> only for cheap, truly stateless utilities that must not share any field between callers.',
        'Scope validation (enabled by default in Development via <code>WebApplication.CreateBuilder</code>) catches lifetime mismatches at startup rather than at runtime under load. Never disable it.',
      ],
    },
    {
      heading: 'Registration patterns',
      points: [
        '<strong>Interface + implementation</strong>: <code>services.AddScoped&lt;IOrderService, OrderService&gt;()</code>. Consumers depend on the abstraction — this enables mocking in tests, alternative implementations in different environments, and decorator wrapping without changing call sites.',
        '<strong>Self-registration</strong>: <code>services.AddSingleton&lt;EmailSender&gt;()</code> — no interface. Simpler but tightly coupled. Fine for internal concrete utilities that are never substituted and never need mocking.',
        '<strong>Factory registration</strong>: <code>services.AddScoped&lt;ICache&gt;(sp => new RedisCache(sp.GetRequiredService&lt;IOptions&lt;RedisOptions&gt;&gt;().Value))</code>. Use when construction logic depends on other services resolved from DI, on runtime configuration values, or on environment-specific conditions.',
        '<strong>Open-generic registration</strong>: <code>services.AddScoped(typeof(IRepository&lt;&gt;), typeof(EfRepository&lt;&gt;))</code>. One line covers <code>IRepository&lt;Order&gt;</code>, <code>IRepository&lt;Product&gt;</code>, and every other entity type — no per-entity registration needed.',
        '<strong>Multiple implementations</strong>: calling <code>AddScoped&lt;INotifier, Email&gt;()</code> then <code>AddScoped&lt;INotifier, Sms&gt;()</code> registers both. Inject <code>IEnumerable&lt;INotifier&gt;</code> to receive all; inject <code>INotifier</code> to get only the last-registered.',
        '<strong>Instance registration</strong>: <code>services.AddSingleton&lt;IConfig&gt;(myConfigInstance)</code> — supplies a pre-built instance. The container does not own its disposal; you must handle lifetime yourself.',
      ],
    },
    {
      heading: 'Captive dependency — the most common lifetime bug',
      points: [
        'A <strong>captive dependency</strong> occurs when a longer-lived service holds a reference to a shorter-lived one. The most common case: a <em>Singleton</em> that constructor-injects a <em>Scoped</em> service.',
        'The Scoped service is resolved <em>once</em> when the Singleton is first created and then held for the entire application lifetime — it is never freed at request end. The DbContext accumulates change-tracker state across thousands of requests, leaking memory and potentially returning stale or wrong data.',
        'ASP.NET Core detects this in Development with scope validation enabled by default. The startup exception reads: <em>"Cannot consume scoped service \'AppDbContext\' from singleton \'ReportService\'."</em> This is intentional — fail fast beats silently corrupt data in production.',
        'Scope validation only fires in Development by default. In Production the captive dependency silently "works" until load reveals the concurrency bug. Enable it in Production too: <code>builder.Host.UseDefaultServiceProvider(o => o.ValidateScopes = true)</code>.',
        'Fix: restructure the Singleton to not depend on the Scoped service directly. Inject <code>IServiceScopeFactory</code> and create a scope explicitly per unit-of-work — this is the correct pattern for background services and singletons that occasionally need per-operation database access.',
        'Transient-in-Singleton is also a captive dependency, though less commonly noticed — the Transient instance is captured forever in the Singleton\'s field, making it effectively a Singleton itself and potentially thread-unsafe.',
      ],
    },
    {
      heading: 'Resolving Scoped services from Singletons',
      points: [
        'Background services (<code>BackgroundService</code>) are registered as Singletons by <code>AddHostedService&lt;T&gt;()</code>. If they need Scoped services (DbContext, repositories), they must manually create and dispose a scope for each unit of work.',
        'Inject <code>IServiceScopeFactory</code> into the Singleton constructor. For each batch of work call <code>await using var scope = factory.CreateAsyncScope()</code> and resolve services from <code>scope.ServiceProvider.GetRequiredService&lt;T&gt;()</code>.',
        'Each <code>await using</code> block creates a complete scope boundary: DbContext connections are returned to the pool, unit-of-work transactions complete, and per-scope state is discarded. The next iteration starts fresh.',
        'Never store the resolved Scoped service in a field on the Singleton — that recreates the captive dependency exactly. Always resolve within the <code>using</code> block and let it go out of scope.',
        '<code>CreateAsyncScope()</code> (.NET 6+) is preferred over <code>CreateScope()</code> when any service in the scope implements <code>IAsyncDisposable</code> (DbContext does). Using the sync version with an async-disposable service produces a compiler warning and may not correctly await disposal.',
      ],
    },
    {
      heading: 'TryAdd*, keyed services, and advanced patterns',
      points: [
        '<code>TryAddSingleton&lt;T&gt;()</code> / <code>TryAddScoped&lt;T&gt;()</code> registers the service <em>only if no registration already exists</em> for that interface. Library authors use this so app code can register its own implementation first and the library fallback is used only when no override is present.',
        '<strong>Keyed services</strong> (.NET 8+): register multiple implementations of the same interface by a string (or any object) key: <code>services.AddKeyedScoped&lt;IPaymentGateway, StripeGateway&gt;("stripe")</code>. Inject with <code>[FromKeyedServices("stripe")] IPaymentGateway gw</code> or resolve via <code>sp.GetRequiredKeyedService&lt;IPaymentGateway&gt;("stripe")</code>.',
        '<strong>Decorator pattern</strong>: register the inner implementation as a concrete type, then register the interface using a factory that wraps it: <code>services.AddSingleton&lt;ICache&gt;(sp => new LoggingCache(sp.GetRequiredService&lt;MemoryCache&gt;(), sp.GetRequiredService&lt;ILogger&lt;LoggingCache&gt;&gt;()))</code>.',
        '<code>ActivatorUtilities.CreateInstance&lt;T&gt;(provider, extraArg)</code> creates an instance mixing DI-resolved services with manually supplied constructor arguments — useful for middleware, command-pattern handlers, or plugin objects not registered in DI.',
        'Use <code>services.AddOptions&lt;T&gt;().Configure&lt;IDep&gt;((opts, dep) => { ... })</code> to inject a DI service into an options configuration callback — this is cleaner than building a full <code>IConfigureOptions&lt;T&gt;</code> class for simple cases.',
      ],
    },
    {
      heading: 'Disposal, validation, and production hardening',
      points: [
        'The DI container tracks <code>IDisposable</code> and <code>IAsyncDisposable</code> services it creates and disposes them when the owning scope ends. For request-scoped services, disposal happens after the HTTP response completes. For singletons, disposal happens on application shutdown.',
        'If you resolve a Transient <code>IDisposable</code> from the <em>root</em> container (outside any scope), the root container holds it until app shutdown — effectively a memory leak. Always resolve disposables inside a scope.',
        'Enable scope validation in all environments: <code>builder.Host.UseDefaultServiceProvider(o => { o.ValidateScopes = true; o.ValidateOnBuild = true; })</code>. <code>ValidateOnBuild</code> checks that all registered service types can actually be resolved at startup — catches typos and missing registrations before the first request.',
        'For startup work requiring DI (e.g., database migrations): create a scope from <code>app.Services</code> before <code>app.Run()</code> — <code>await using var scope = app.Services.CreateAsyncScope(); await scope.ServiceProvider.GetRequiredService&lt;AppDbContext&gt;().Database.MigrateAsync();</code>',
        'Prefer constructor injection over property injection and method injection. Constructor injection makes dependencies explicit, required, and visible in the type signature — tools like the DI scope validator and code analysers can reason about them.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Registration Patterns',
      language: 'csharp',
      code: `// ── Interface + implementation (most common) ─────────────────────────
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddScoped<IOrderRepository, OrderRepository>();
builder.Services.AddSingleton<IEmailSender, SmtpEmailSender>();

// ── Concrete (no interface) ───────────────────────────────────────────
builder.Services.AddSingleton<MetricsCollector>();

// ── Factory registration ──────────────────────────────────────────────
builder.Services.AddScoped<ICache>(sp =>
{
    var opts = sp.GetRequiredService<IOptions<RedisOptions>>().Value;
    return new RedisCache(opts.ConnectionString);
});

// ── Open-generic ──────────────────────────────────────────────────────
// Covers IRepository<Order>, IRepository<Product>, etc.
builder.Services.AddScoped(typeof(IRepository<>), typeof(EfRepository<>));

// ── TryAdd* — safe for library defaults ──────────────────────────────
builder.Services.TryAddSingleton<IIdGenerator, GuidIdGenerator>();
// App can call AddSingleton<IIdGenerator, CustomIdGenerator>() first to override

// ── Keyed services (.NET 8+) ─────────────────────────────────────────
builder.Services.AddKeyedScoped<IPaymentGateway, StripeGateway>("stripe");
builder.Services.AddKeyedScoped<IPaymentGateway, PayPalGateway>("paypal");

// ── Multiple registrations for the same interface ─────────────────────
builder.Services.AddSingleton<INotifier, EmailNotifier>();
builder.Services.AddSingleton<INotifier, SmsNotifier>();
// Inject IEnumerable<INotifier> to get all three`,
    },
    {
      label: 'Constructor Injection',
      language: 'csharp',
      code: `// ── Standard constructor injection ───────────────────────────────────
public class OrderService : IOrderService
{
    private readonly IOrderRepository _repo;
    private readonly IEmailSender _email;
    private readonly ILogger<OrderService> _logger;
    private readonly OrderOptions _opts;

    public OrderService(
        IOrderRepository repo,
        IEmailSender email,
        ILogger<OrderService> logger,
        IOptions<OrderOptions> opts)  // IOptions wraps config
    {
        _repo   = repo;
        _email  = email;
        _logger = logger;
        _opts   = opts.Value;
    }

    public async Task<Order> CreateAsync(CreateOrderRequest req)
    {
        _logger.LogInformation("Creating order for {CustomerId}", req.CustomerId);
        var order = new Order(req);
        await _repo.AddAsync(order);
        await _email.SendAsync(req.Email, "Order confirmed", \$"Order {order.Id} received.");
        return order;
    }
}

// ── Keyed injection in minimal APIs ──────────────────────────────────
app.MapPost("/pay/stripe",
    ([FromKeyedServices("stripe")] IPaymentGateway gw, PaymentRequest req) =>
        gw.ChargeAsync(req));

// ── Inject IEnumerable<T> to get all registered implementations ───────
public class NotificationDispatcher
{
    private readonly IEnumerable<INotifier> _notifiers;
    public NotificationDispatcher(IEnumerable<INotifier> notifiers)
        => _notifiers = notifiers;

    public Task NotifyAllAsync(string msg) =>
        Task.WhenAll(_notifiers.Select(n => n.NotifyAsync(msg)));
}`,
    },
    {
      label: 'Captive Dependency Fix',
      language: 'csharp',
      code: `// ── THE PROBLEM: Singleton holding a Scoped service ─────────────────
// This throws in Development:
// "Cannot consume scoped service 'AppDbContext' from singleton 'ReportService'"
public class ReportService   // Singleton
{
    private readonly AppDbContext _db;   // Scoped — WRONG
    public ReportService(AppDbContext db) => _db = db;
}

// ── THE FIX: inject IServiceScopeFactory ─────────────────────────────
public class ReportService   // Singleton
{
    private readonly IServiceScopeFactory _factory;

    public ReportService(IServiceScopeFactory factory) => _factory = factory;

    public async Task<Report> GenerateAsync(int reportId)
    {
        // Create a new scope for this unit of work
        await using var scope = _factory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var data = await db.Orders
            .Where(o => o.ReportId == reportId)
            .ToListAsync();

        return new Report(data);
    }   // scope.Dispose() here — DbContext is released
}

// ── Registration ──────────────────────────────────────────────────────
builder.Services.AddSingleton<ReportService>();
builder.Services.AddScoped<AppDbContext>();   // or AddDbContext<>`,
    },
    {
      label: 'Background Service + Scope',
      language: 'csharp',
      code: `// ── Background service that needs a Scoped DbContext ─────────────────
public class OutboxProcessor : BackgroundService
{
    private readonly IServiceScopeFactory _factory;
    private readonly ILogger<OutboxProcessor> _logger;

    public OutboxProcessor(IServiceScopeFactory factory,
                           ILogger<OutboxProcessor> logger)
    {
        _factory = factory;
        _logger  = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            await ProcessBatchAsync();
            await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
        }
    }

    private async Task ProcessBatchAsync()
    {
        // Each batch gets its own scope → fresh DbContext per batch
        await using var scope = _factory.CreateAsyncScope();
        var db      = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var handler = scope.ServiceProvider.GetRequiredService<IOutboxHandler>();

        var messages = await db.OutboxMessages
            .Where(m => !m.Processed)
            .Take(50)
            .ToListAsync();

        foreach (var msg in messages)
        {
            await handler.HandleAsync(msg);
            msg.Processed = true;
        }

        await db.SaveChangesAsync();
        _logger.LogInformation("Processed {Count} outbox messages", messages.Count);
    }   // scope disposed → DbContext released
}

// ── Register ──────────────────────────────────────────────────────────
builder.Services.AddHostedService<OutboxProcessor>();`,
    },
  ];

  challenge: Challenge = {
    title: 'Layered service with correct lifetimes',
    language: 'csharp',
    description: `Build a minimal API that processes "jobs" stored in an in-memory list:
1. <code>IJobRepository</code> / <code>JobRepository</code> — stores jobs; register as <strong>Scoped</strong>.
2. <code>IJobService</code> / <code>JobService</code> — creates and lists jobs; depends on <code>IJobRepository</code>; register as <strong>Scoped</strong>.
3. <code>JobMetrics</code> — tracks total jobs created across all requests; register as <strong>Singleton</strong> (thread-safe counter using <code>Interlocked.Increment</code>).
4. <code>GET /jobs</code> returns the in-scope job list. <code>POST /jobs</code> creates a job, increments the singleton counter, and returns the new job.
5. <code>GET /metrics</code> returns the singleton counter value.`,
    hints: [
      'JobRepository can wrap a List<Job>; register it Scoped so each request gets a fresh list',
      'JobMetrics is Singleton — use private int _count and Interlocked.Increment(ref _count)',
      'JobService takes IJobRepository and JobMetrics via constructor injection',
      'Verify that /metrics grows with each POST across multiple requests',
    ],
    starterCode: `var builder = WebApplication.CreateBuilder(args);

// TODO: register IJobRepository, IJobService (Scoped), JobMetrics (Singleton)

var app = builder.Build();

// TODO: GET /jobs
// TODO: POST /jobs
// TODO: GET /metrics

app.Run();

public record Job(int Id, string Title);

public interface IJobRepository { /* ... */ }
public interface IJobService    { /* ... */ }`,
    solution: `var builder = WebApplication.CreateBuilder(args);

builder.Services.AddScoped<IJobRepository, JobRepository>();
builder.Services.AddScoped<IJobService, JobService>();
builder.Services.AddSingleton<JobMetrics>();

var app = builder.Build();

app.MapGet("/jobs",    (IJobService svc)              => Results.Ok(svc.List()));
app.MapPost("/jobs",   (JobRequest req, IJobService svc) => Results.Ok(svc.Create(req.Title)));
app.MapGet("/metrics", (JobMetrics metrics)           => Results.Ok(new { metrics.TotalCreated }));

app.Run();

public record Job(int Id, string Title);
public record JobRequest(string Title);

public interface IJobRepository
{
    void Add(Job job);
    IReadOnlyList<Job> GetAll();
    int NextId();
}

public class JobRepository : IJobRepository
{
    private readonly List<Job> _jobs = [];
    private int _seq;
    public void Add(Job job) => _jobs.Add(job);
    public IReadOnlyList<Job> GetAll() => _jobs;
    public int NextId() => ++_seq;
}

public interface IJobService
{
    Job Create(string title);
    IReadOnlyList<Job> List();
}

public class JobService : IJobService
{
    private readonly IJobRepository _repo;
    private readonly JobMetrics     _metrics;
    public JobService(IJobRepository repo, JobMetrics metrics)
    { _repo = repo; _metrics = metrics; }

    public Job Create(string title)
    {
        var job = new Job(_repo.NextId(), title);
        _repo.Add(job);
        _metrics.Record();
        return job;
    }

    public IReadOnlyList<Job> List() => _repo.GetAll();
}

public class JobMetrics
{
    private int _count;
    public void Record() => Interlocked.Increment(ref _count);
    public int TotalCreated => _count;
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'A DbContext is registered as Scoped. You inject it into a Singleton service. What happens in Development?',
      options: [
        'The DbContext is shared across all requests — no exception is thrown',
        'ASP.NET Core throws at startup: "Cannot consume scoped service from singleton"',
        'The DbContext is automatically upgraded to Singleton lifetime',
        'The injection silently fails and the property is null',
      ],
      answer: 1,
      explanation: 'Scope validation is enabled by default in Development. It detects captive dependencies — a longer-lived service (Singleton) depending on a shorter-lived one (Scoped) — and throws during host startup to prevent the subtle data-leakage bug.',
    },
    {
      q: 'Which lifetime is appropriate for a service that maintains a shared in-memory cache used by all requests?',
      options: [
        'Transient — a new cache per injection keeps data fresh',
        'Scoped — one cache per request prevents cross-request contamination',
        'Singleton — one instance shared across all requests, must be thread-safe',
        'None — in-memory caches must use IMemoryCache directly',
      ],
      answer: 2,
      explanation: 'A shared in-memory cache should be <strong>Singleton</strong> so all requests use the same instance and benefit from cached data. Because it is shared across concurrent requests, its read/write operations must be thread-safe (e.g., <code>ConcurrentDictionary</code> or <code>IMemoryCache</code>).',
    },
    {
      q: 'How does a Singleton background service safely use a Scoped DbContext?',
      options: [
        'Register the DbContext as Singleton instead',
        'Inject IServiceScopeFactory, create a scope per unit of work, resolve DbContext from scope.ServiceProvider',
        'Inject IHttpContextAccessor and resolve DbContext from the current request scope',
        'Scoped services cannot be used in background services at all',
      ],
      answer: 1,
      explanation: 'Inject <code>IServiceScopeFactory</code> into the Singleton. For each unit of work, call <code>factory.CreateAsyncScope()</code>, resolve the Scoped service from <code>scope.ServiceProvider</code>, and dispose the scope when done. This creates a proper scope boundary without relying on an HTTP request.',
    },
    {
      q: 'What does TryAddScoped<IService, Impl>() do differently from AddScoped<IService, Impl>()?',
      options: [
        'TryAdd registers the service as Transient if Scoped registration fails',
        'TryAdd registers only if no registration for IService exists yet — useful for library defaults the app can override',
        'TryAdd skips validation — it is for trusted internal services only',
        'TryAdd defers registration until the first request',
      ],
      answer: 1,
      explanation: '<code>TryAddScoped</code> is a no-op if any registration already exists for <code>IService</code>. Library authors use this so consumers can register their own implementation first, and the library\'s default is only added as a fallback. Without <code>TryAdd</code>, calling <code>AddScoped</code> twice registers two implementations.',
    },
    {
      q: 'When do you need Transient over Scoped for a service?',
      options: [
        'When the service needs to be shared across multiple requests',
        'When the service is stateless and cheap to construct, and you want a fresh instance at every injection point within a request',
        'When the service uses async/await — Scoped services cannot be async',
        'Transient is just an alias for Scoped — the lifetimes are identical',
      ],
      answer: 1,
      explanation: 'Transient creates a new instance every time the service is resolved, even within the same request. Use it for lightweight, stateless utilities (formatters, validators, mappers) where sharing state between injection points in the same request would be wrong. For most services with per-request state, Scoped is a better fit.',
    },
    {
      q: 'What does ValidateOnBuild do when added to UseDefaultServiceProvider options?',
      options: [
        'It runs all registered validators (DataAnnotations) during the build phase',
        'It verifies that every registered service type can be fully resolved at startup — catching missing registrations before the first request',
        'It prevents services from being added after Build() is called',
        'It enables scope validation only for Scoped services',
      ],
      answer: 1,
      explanation: '<code>ValidateOnBuild = true</code> causes the DI container to attempt to resolve every registered service graph at startup. If any dependency is missing or unresolvable, an exception is thrown before the app begins accepting traffic. This catches typos, forgotten registrations, and broken dependency chains before users see 500 errors.',
    },
    {
      q: 'A Transient IDisposable is resolved from the root IServiceProvider (outside any HTTP request scope). When is it disposed?',
      options: [
        'At the end of the next request',
        'Immediately after the method that resolved it returns',
        'At application shutdown — the root container holds it for the entire application lifetime',
        'It is never disposed — Transient services are not tracked by the container',
      ],
      answer: 2,
      explanation: 'The root container tracks every <code>IDisposable</code> it creates to ensure disposal happens eventually. A Transient resolved from the root container is held until the root scope ends — which is application shutdown. This is effectively a memory leak for long-running apps. Always resolve Transient disposables inside a request scope or a manually created <code>IServiceScope</code>.',
    },
    {
      q: 'You inject IEnumerable<INotifier> but only one implementation is registered. What do you get?',
      options: [
        'null',
        'An empty enumerable',
        'An enumerable containing the one registered implementation',
        'A runtime exception because IEnumerable<T> requires at least two implementations',
      ],
      answer: 2,
      explanation: 'Injecting <code>IEnumerable&lt;T&gt;</code> always returns a collection of <em>all</em> registered implementations of <code>T</code>, including zero or one. It never throws for a missing or single registration. This makes it ideal for plugin-style systems where the number of implementations varies — the consuming code loops over whatever is registered.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between GetService<T>() and GetRequiredService<T>()?',
      a: '<code>GetService&lt;T&gt;()</code> returns <code>null</code> if no registration exists. <code>GetRequiredService&lt;T&gt;()</code> throws <code>InvalidOperationException</code> if not registered. Always prefer <code>GetRequiredService</code> in production code — silent <code>null</code> returns cause NullReferenceExceptions far from the source. <code>GetService</code> is occasionally useful in optional-feature patterns where the service may intentionally be absent.',
    },
    {
      q: 'Can I register multiple implementations for the same interface?',
      a: 'Yes. Call <code>AddScoped&lt;INotifier, EmailNotifier&gt;()</code> and <code>AddScoped&lt;INotifier, SmsNotifier&gt;()</code>. Inject <code>IEnumerable&lt;INotifier&gt;</code> to receive all implementations. If you inject <code>INotifier</code> directly, only the <em>last-registered</em> implementation is returned. Use <code>IEnumerable</code> when you want to fan out to all of them.',
    },
    {
      q: 'How do keyed services work in .NET 8+?',
      a: 'Register with a string (or any object) key: <code>services.AddKeyedScoped&lt;IPaymentGateway, Stripe&gt;("stripe")</code>. Inject by key in controllers using <code>[FromKeyedServices("stripe")] IPaymentGateway gw</code>, or resolve manually with <code>sp.GetRequiredKeyedService&lt;IPaymentGateway&gt;("stripe")</code>. Keyed services replace the "named service" workarounds (factory delegates, dictionaries) that were common in earlier .NET versions.',
    },
    {
      q: 'Should I use the service locator pattern (IServiceProvider.GetRequiredService) in application code?',
      a: 'Generally no. Constructor injection is more testable, explicit, and analysable by DI scope validation. The service locator hides dependencies and bypasses scope checking. The legitimate exceptions are: factory delegates registered in DI, middleware constructors (which use method injection for scoped deps), plugin systems that must resolve types by name at runtime, and background-service scope creation via <code>IServiceScopeFactory</code>.',
    },
    {
      q: 'What happens when a Transient disposable service is resolved from the root container?',
      a: 'The root container holds a reference to every <code>IDisposable</code> instance it creates, so they are not disposed until the application shuts down — effectively becoming Singletons that are never cleaned up during normal operation. In Development, ASP.NET Core warns about this. Always resolve Transient disposables within a scope (an HTTP request or a manually created <code>IServiceScope</code>) so they are disposed when the scope ends.',
    },
    {
      q: 'How do I perform startup work that needs DI services (e.g., run database migrations)?',
      a: 'Create a scope from <code>app.Services</code> before calling <code>app.Run()</code>: <code>await using var scope = app.Services.CreateAsyncScope(); var db = scope.ServiceProvider.GetRequiredService&lt;AppDbContext&gt;(); await db.Database.MigrateAsync();</code>. This resolves Scoped services (like DbContext) safely. Alternatively, implement <code>IHostedLifecycleService</code> (.NET 8+) and put the migration in <code>StartingAsync</code> — it runs before the HTTP server begins accepting requests.',
    },
    {
      q: 'How does the Decorator pattern work with the built-in DI container?',
      a: 'The built-in container does not support decoration directly via <code>Decorate&lt;T&gt;()</code>. The workaround is factory registration: register the inner implementation as its concrete type (not the interface), then register the interface with a factory lambda that resolves the inner type and wraps it: <code>services.AddSingleton&lt;MemoryCache&gt;(); services.AddSingleton&lt;ICache&gt;(sp => new LoggingCache(sp.GetRequiredService&lt;MemoryCache&gt;()))</code>. For cleaner syntax, use <strong>Scrutor</strong> (<code>services.Decorate&lt;ICache, LoggingCache&gt;()</code>).',
    },
    {
      q: 'What is the difference between IServiceProvider.CreateScope() and IServiceScopeFactory.CreateScope()?',
      a: 'Both create a new <code>IServiceScope</code>. <code>IServiceProvider.CreateScope()</code> is an extension method that internally calls <code>IServiceScopeFactory.CreateScope()</code> — they are equivalent. The convention in background services is to inject <code>IServiceScopeFactory</code> directly because it expresses the intent more clearly and avoids a dependency on <code>IServiceProvider</code> (which is the service-locator anti-pattern). Use <code>CreateAsyncScope()</code> when any service in the scope is <code>IAsyncDisposable</code>.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Captive dependency: Singleton depending on Scoped service',
      wrong: `// BUG: Singleton captures a Scoped DbContext at construction — never freed
public class ReportService(AppDbContext db) { }   // ReportService = Singleton
builder.Services.AddSingleton<ReportService>();
builder.Services.AddDbContext<AppDbContext>();     // DbContext = Scoped
// Throws in Dev: "Cannot consume scoped service from singleton"`,
      right: `// FIX: inject IServiceScopeFactory and create a scope per unit of work
public class ReportService(IServiceScopeFactory factory)
{
    public async Task<Report> GenerateAsync(int id)
    {
        await using var scope = factory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        return new Report(await db.Orders.Where(o => o.ReportId == id).ToListAsync());
    }
}`,
      explanation: 'A Singleton capturing a Scoped service keeps it alive for the entire app lifetime — DbContext accumulates entity-tracking state across thousands of requests, leaking memory and returning stale data. Scope validation throws in Development to catch this. Use IServiceScopeFactory to create a fresh scope per unit of work.',
    },
    {
      title: 'Resolving a Transient IDisposable from the root container',
      wrong: `// BUG: root container holds IDisposable until app shutdown
var app = builder.Build();
var conn = app.Services.GetRequiredService<IDbConnection>(); // Transient + IDisposable
// conn is tracked by root IServiceProvider — never disposed during normal operation`,
      right: `// Always resolve disposables inside a scope
await using var scope = app.Services.CreateAsyncScope();
var conn = scope.ServiceProvider.GetRequiredService<IDbConnection>();
// conn is disposed when scope ends`,
      explanation: 'The root IServiceProvider tracks every IDisposable it creates. A Transient disposable resolved from the root is held until application shutdown — a slow memory leak. Always wrap resolution of disposable services in an IServiceScope so disposal happens at the right time.',
    },
    {
      title: 'Using AddScoped twice instead of TryAddScoped for library defaults',
      wrong: `// Library code
services.AddScoped<IIdGenerator, GuidIdGenerator>();   // registers first

// App code — intending to override
services.AddScoped<IIdGenerator, SequentialIdGenerator>(); // registers second

// Injecting IIdGenerator returns SequentialIdGenerator (last wins)
// Injecting IEnumerable<IIdGenerator> returns BOTH — unexpected duplicates`,
      right: `// Library code — use TryAdd so app can override
services.TryAddScoped<IIdGenerator, GuidIdGenerator>();

// App code registered first takes precedence; library default is only a fallback
services.AddScoped<IIdGenerator, SequentialIdGenerator>(); // registers before library TryAdd`,
      explanation: 'AddScoped always adds a registration, even if one exists. Injecting the interface then returns the last-registered implementation; injecting IEnumerable<T> returns all of them — causing duplicate processing in fan-out patterns. TryAddScoped is a no-op when a registration already exists, making it the correct choice for library default registrations.',
    },
    {
      title: 'Using the service locator pattern (GetRequiredService) in application services',
      wrong: `public class OrderService(IServiceProvider sp)
{
    public async Task ProcessAsync(Order order)
    {
        // Hidden dependency — not visible in the constructor signature
        var repo = sp.GetRequiredService<IOrderRepository>();
        await repo.SaveAsync(order);
    }
}`,
      right: `public class OrderService(IOrderRepository repo)   // explicit, testable
{
    public async Task ProcessAsync(Order order)
        => await repo.SaveAsync(order);
}`,
      explanation: 'Injecting IServiceProvider hides dependencies — unit tests must set up the entire container instead of just mocking one interface. Scope validation cannot analyse the hidden resolution. Constructor injection makes all dependencies explicit, enables scope validation, and keeps tests simple.',
    },
    {
      title: 'Forgetting that BackgroundService is Singleton — injecting Scoped services directly',
      wrong: `public class DataSyncJob(AppDbContext db) : BackgroundService  // WRONG
{
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        // db is the same captured instance forever — entity tracking bloat
        while (!ct.IsCancellationRequested) { await SyncAsync(db); }
    }
}
builder.Services.AddHostedService<DataSyncJob>();  // Singleton — throws in Dev`,
      right: `public class DataSyncJob(IServiceScopeFactory factory) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            await using var scope = factory.CreateAsyncScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            await SyncAsync(db);
            await Task.Delay(TimeSpan.FromSeconds(30), ct);
        }
    }
}`,
      explanation: 'AddHostedService registers the service as a Singleton. Constructor-injecting a Scoped DbContext is a captive dependency — it throws in Development. Use IServiceScopeFactory to create a fresh scope per batch of work so DbContext is properly disposed and change-tracking state resets between runs.',
    },
    {
      title: 'Not enabling ValidateOnBuild in staging/production',
      wrong: `// Default: scope validation on in Dev, but ValidateOnBuild is off
// Missing service registration surfaces as 500 on the first request in Production`,
      right: `builder.Host.UseDefaultServiceProvider(options =>
{
    options.ValidateScopes  = true;   // catch captive dependencies
    options.ValidateOnBuild = true;   // catch missing registrations at startup
});`,
      explanation: 'ValidateOnBuild walks the full service graph at startup and throws if any dependency cannot be resolved. Without it, a missing AddScoped call causes the first affected HTTP request to throw an unhandled exception. Enabling it in all environments makes misconfigured DI a startup failure rather than a runtime surprise for users.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'ASP.NET Core\'s built-in DI container manages service lifetimes — Singleton (one forever), Scoped (one per request), Transient (new every time) — and validates the dependency graph at startup to catch captive dependencies and missing registrations before they hit production.',
    mustKnow: [
      '<strong>Lifetimes</strong>: Singleton = one for the app; Scoped = one per HTTP request; Transient = new on every resolve',
      '<strong>Captive dependency</strong>: Singleton holding a Scoped service → Scoped never freed, data leaks between requests',
      'Fix captive: inject <code>IServiceScopeFactory</code>, create <code>await using var scope = factory.CreateAsyncScope()</code> per unit of work',
      '<code>TryAddScoped</code> registers only if no existing registration — use in library code so apps can override',
      '<strong>Keyed services</strong> (.NET 8+): <code>AddKeyedScoped&lt;I, Impl&gt;("key")</code> + <code>[FromKeyedServices("key")]</code> for multiple implementations',
      'Transient <code>IDisposable</code> from root container leaks until shutdown — always resolve inside a scope',
      '<code>ValidateOnBuild = true</code> walks the whole graph at startup — catches missing registrations before first request',
    ],
    interviewFocus: [
      'What is a captive dependency and how do you fix it?',
      'Why is BackgroundService a Singleton, and how do you use DbContext inside one?',
      'What is the difference between Singleton, Scoped, and Transient — and how do you choose?',
      'What does ValidateOnBuild do and why should it be enabled beyond Development?',
      'How do you register multiple implementations of the same interface and consume all of them?',
    ],
  };
}
