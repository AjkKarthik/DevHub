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
  selector: 'app-aspnet-dependency-injection',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './dependency-injection.html',
  styleUrl: './dependency-injection.scss',
})
export class AspnetDependencyInjection {

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
        '<strong>Singleton</strong>: one instance is created the first time it is requested and reused for the entire application lifetime. Safe for stateless services and caches. Must be thread-safe because multiple requests access the same instance concurrently.',
        '<strong>Scoped</strong>: one instance per <em>scope</em>. In ASP.NET Core, a new scope is created per HTTP request, so each request gets its own instance — ideal for DbContext, unit-of-work, and per-request state. Never use across requests.',
        '<strong>Transient</strong>: a fresh instance is created every time the service is resolved from DI. Best for lightweight, stateless services (validators, formatters). Avoid for expensive objects — a new instance is allocated on every injection point.',
        'The rule of thumb: <em>Scoped by default</em> for services with per-request state; <em>Singleton</em> for thread-safe shared state; <em>Transient</em> for cheap stateless utilities.',
      ],
    },
    {
      heading: 'Registration patterns',
      points: [
        '<strong>Interface + implementation</strong>: <code>services.AddScoped&lt;IOrderService, OrderService&gt;()</code>. Consumers depend on the abstraction, enabling substitution (mocks in tests, alternative implementations).',
        '<strong>Self-registration</strong>: <code>services.AddSingleton&lt;EmailSender&gt;()</code> — no interface. Simpler but tightly coupled. Fine for concrete utilities that are never swapped.',
        '<strong>Factory registration</strong>: <code>services.AddScoped&lt;ICache&gt;(sp => new RedisCache(sp.GetRequiredService&lt;IOptions&lt;RedisOptions&gt;&gt;().Value))</code>. Use when construction logic depends on other services or runtime values.',
        '<strong>Open-generic registration</strong>: <code>services.AddScoped(typeof(IRepository&lt;&gt;), typeof(Repository&lt;&gt;))</code>. One line covers all <code>IRepository&lt;T&gt;</code> variants for any entity type.',
      ],
    },
    {
      heading: 'Captive dependency — the most common lifetime bug',
      points: [
        'A <strong>captive dependency</strong> occurs when a longer-lived service holds a reference to a shorter-lived one. The most common case: a <em>Singleton</em> that depends on a <em>Scoped</em> service.',
        'The Scoped service is resolved <em>once</em> when the Singleton is first created and then held forever — it is never freed at the end of a request. This defeats the point of Scoped (per-request isolation) and can cause data leakage between requests.',
        'ASP.NET Core detects this in Development with scope validation (enabled by default). The startup exception message is: <em>"Cannot consume scoped service from singleton"</em>.',
        'Fix: restructure so the Singleton does not depend on the Scoped service directly. Inject <code>IServiceScopeFactory</code> and create a scope explicitly when you need per-operation work (see the code tab).',
      ],
    },
    {
      heading: 'Resolving Scoped services from Singletons',
      points: [
        'Background services (<code>BackgroundService</code>) are Singletons. If they need to use Scoped services (DbContext, repositories), they must create a manual scope for each unit of work.',
        'Inject <code>IServiceScopeFactory</code> into the Singleton constructor. Inside the method that does work, call <code>using var scope = factory.CreateScope()</code> and resolve the Scoped service from <code>scope.ServiceProvider</code>.',
        'Each <code>using</code> block creates and disposes a complete scope — DbContext connections are released, unit-of-work transactions are committed or rolled back, and per-scope state is reset.',
        'Never store the resolved Scoped service in a field on the Singleton — that recreates the captive dependency. Always resolve fresh from the scope within the unit-of-work boundary.',
      ],
    },
    {
      heading: 'TryAdd*, keyed services, and advanced registration',
      points: [
        '<code>TryAddSingleton&lt;T&gt;()</code> / <code>TryAddScoped&lt;T&gt;()</code> registers the service <em>only if no registration already exists</em> for that interface. Library authors use this so app code can override library defaults.',
        '<strong>Keyed services</strong> (.NET 8+): register multiple implementations of the same interface with a key: <code>services.AddKeyedScoped&lt;IPaymentGateway, Stripe&gt;("stripe")</code> and <code>services.AddKeyedScoped&lt;IPaymentGateway, PayPal&gt;("paypal")</code>. Inject with <code>[FromKeyedServices("stripe")] IPaymentGateway gateway</code>.',
        '<strong>Decorator pattern</strong> via DI: register the inner implementation first, then register the outer one using a factory that wraps it: <code>services.AddSingleton&lt;ICache, DecoratedCache&gt;(sp => new DecoratedCache(sp.GetRequiredService&lt;MemoryCache&gt;()))</code>.',
        '<code>ActivatorUtilities.CreateInstance&lt;T&gt;(provider, extraArg1, extraArg2)</code> creates an instance by mixing DI-resolved services with manually supplied constructor arguments. Useful for middleware and command handlers not registered in DI.',
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
      a: 'Create a scope from <code>app.Services</code> before calling <code>app.Run()</code>: <code>using var scope = app.Services.CreateScope(); var db = scope.ServiceProvider.GetRequiredService&lt;AppDbContext&gt;(); await db.Database.MigrateAsync();</code>. This resolves Scoped services (like DbContext) safely. Alternatively, implement <code>IHostedLifecycleService</code> (.NET 8+) and put the migration in <code>StartingAsync</code> — it runs before the HTTP server begins accepting requests.',
    },
  ];
}
