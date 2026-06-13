import { Component } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { PrerequisitesComponent, Prerequisite } from '../../../shared/prerequisites/prerequisites';

@Component({
  selector: 'app-csharp-di-dotnet',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent, RevisionCardComponent,
    CommonMistakesComponent, PrerequisitesComponent,
  ],
  templateUrl: './di-dotnet.html',
  styleUrl: './di-dotnet.scss',
})
export class CsharpDiDotnet {

  prerequisites: Prerequisite[] = [
    { label: 'Interfaces',     route: '/csharp/interfaces' },
    { label: 'Generics',       route: '/csharp/generics' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'IServiceCollection',        type: 'interface', desc: 'Builder API for registering services; available in builder.Services', since: '.NET 5+' },
    { name: 'AddTransient<T,U>()',        type: 'method',    desc: 'New instance per injection; use for lightweight, stateless services', since: '.NET Core 1.0' },
    { name: 'AddScoped<T,U>()',           type: 'method',    desc: 'One instance per HTTP request (or DI scope); use for DbContext etc.', since: '.NET Core 1.0' },
    { name: 'AddSingleton<T,U>()',        type: 'method',    desc: 'One instance for app lifetime; use for shared read-only state', since: '.NET Core 1.0' },
    { name: 'IServiceProvider',          type: 'interface', desc: 'Runtime container — use .GetRequiredService<T>() to resolve manually', since: '.NET Core 1.0' },
    { name: 'IServiceScope',             type: 'interface', desc: 'Creates a child scope — required to resolve scoped services from singleton context', since: '.NET Core 1.0' },
    { name: 'OptionsPattern',            type: 'class',     desc: 'IOptions<T>, IOptionsSnapshot<T>, IOptionsMonitor<T> — typed config binding', since: '.NET Core 2.0' },
    { name: 'Keyed Services',            type: 'method',    desc: 'AddKeyedSingleton/Scoped/Transient — resolve by key using [FromKeyedServices("key")]', since: '.NET 8' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'The built-in DI container',
      points: [
        '.NET ships with a built-in IoC container via <code>Microsoft.Extensions.DependencyInjection</code>. It is intentionally simple — it handles the 90% use case without the overhead of third-party containers like Autofac. ASP.NET Core, Worker Services, and MAUI all use it by default.',
        'Services are registered into <code>IServiceCollection</code> (the builder) and resolved from <code>IServiceProvider</code> (the container). In ASP.NET Core, registration happens in <code>Program.cs</code> using <code>builder.Services</code>.',
        'Constructor injection is the primary mechanism — list your dependencies as constructor parameters and the container injects them automatically. Property injection and method injection are not supported by the built-in container (use Autofac if you need them).',
        'The container is validated at startup by default in development (<code>ValidateOnBuild: true</code>) — misconfigured registrations (missing dependencies, captive dependency violations) are caught immediately, not at first use in production.',
      ],
    },
    {
      heading: 'Lifetimes — Transient, Scoped, Singleton',
      points: [
        '<strong>Transient</strong> — a new instance is created every time the service is requested. Use for lightweight, stateless operations (formatters, validators, mappers). Never hold mutable shared state in transient services.',
        '<strong>Scoped</strong> — one instance per scope, which in ASP.NET Core means one per HTTP request. The canonical example is <code>DbContext</code>: you want all repositories in a single request sharing the same EF Core context for change tracking and transaction support.',
        '<strong>Singleton</strong> — one instance for the entire application lifetime, shared across all requests and threads. Use for immutable shared state (configuration snapshots, compiled regex, in-memory caches). Must be thread-safe.',
        'The captive dependency problem: if a singleton depends on a scoped service, the scoped service is captured at singleton creation time and lives forever — effectively becoming a singleton itself. This breaks scoped lifetime semantics (e.g., a DbContext in a singleton). The runtime catches this in development mode; production fails silently.',
      ],
    },
    {
      heading: 'Registering services — patterns and options',
      points: [
        'Basic registration: <code>services.AddTransient&lt;IMyService, MyService&gt;()</code>. For singleton with an instance: <code>services.AddSingleton&lt;ICache&gt;(new InMemoryCache())</code>. Factory overload for complex construction: <code>services.AddScoped&lt;IRepo&gt;(sp =&gt; new Repo(sp.GetRequiredService&lt;DbContext&gt;(), "conn"))</code>.',
        'Register once, implement multiple interfaces: <code>services.AddSingleton&lt;MyHeavyService&gt;()</code> then forward: <code>services.AddSingleton&lt;IFoo&gt;(sp =&gt; sp.GetRequiredService&lt;MyHeavyService&gt;())</code> and <code>services.AddSingleton&lt;IBar&gt;(sp =&gt; sp.GetRequiredService&lt;MyHeavyService&gt;())</code>. This creates only one instance shared across both interfaces.',
        'Multiple implementations of the same interface: all registrations are kept. <code>IEnumerable&lt;T&gt;</code> as a constructor parameter injects all registered implementations — the notification pattern (send to all INotificationHandler&lt;T&gt;).',
        '.NET 8 Keyed Services: <code>services.AddKeyedSingleton&lt;ICache, RedisCache&gt;("redis")</code> and <code>services.AddKeyedSingleton&lt;ICache, MemoryCache&gt;("memory")</code>. Resolve with <code>[FromKeyedServices("redis")] ICache cache</code> in constructors or minimal API parameters.',
      ],
    },
    {
      heading: 'Options pattern — typed configuration',
      points: [
        'The Options pattern is the .NET-idiomatic way to bind configuration sections to typed classes. Register with <code>services.Configure&lt;SmtpOptions&gt;(config.GetSection("Smtp"))</code>; inject as <code>IOptions&lt;SmtpOptions&gt;</code>.',
        '<code>IOptions&lt;T&gt;</code> — singleton; reads configuration once at startup. Use for settings that never change at runtime.',
        '<code>IOptionsSnapshot&lt;T&gt;</code> — scoped; re-reads configuration per request. Use when hot-reload is needed in web apps. Cannot be injected into singletons.',
        '<code>IOptionsMonitor&lt;T&gt;</code> — singleton; uses change callbacks (<code>OnChange</code>) and <code>.CurrentValue</code>. Use in singletons that need to react to configuration changes without restarting. Works with <code>appsettings.json</code> hot-reload.',
      ],
    },
    {
      heading: 'Scopes, hosted services, and manual resolution',
      points: [
        'Background services (<code>IHostedService</code> / <code>BackgroundService</code>) are singletons. To use scoped services inside them, inject <code>IServiceScopeFactory</code> and create a scope manually: <code>using var scope = _factory.CreateScope(); var db = scope.ServiceProvider.GetRequiredService&lt;AppDbContext&gt;()</code>.',
        'Service locator anti-pattern: injecting <code>IServiceProvider</code> directly and calling <code>GetService&lt;T&gt;()</code> everywhere is an anti-pattern — it hides dependencies and makes testing harder. Reserve <code>IServiceProvider</code> for framework-level code like middleware and generic factories.',
        'Decorators: wrap a service to add cross-cutting behaviour (logging, caching, validation). Register: first register the inner impl, then re-register the interface as a factory that creates the decorator wrapping the inner: <code>sp =&gt; new LoggingRepo(sp.GetRequiredService&lt;Repo&gt;())</code>.',
        'Scrutor NuGet package provides <code>.Decorate&lt;T, TDecorator&gt;()</code> and <code>.Scan()</code> for assembly-scanning registration — common in larger applications to avoid repetitive registration boilerplate.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Registration & injection',
      language: 'csharp',
      code: `// Program.cs — service registration
var builder = WebApplication.CreateBuilder(args);

// Register by interface + implementation
builder.Services.AddScoped<IOrderRepository, SqlOrderRepository>();
builder.Services.AddScoped<IEmailService, SmtpEmailService>();
builder.Services.AddSingleton<ICacheService, MemoryCacheService>();

// Factory registration for complex construction
builder.Services.AddScoped<IProductService>(sp =>
{
    var repo    = sp.GetRequiredService<IProductRepository>();
    var cache   = sp.GetRequiredService<ICacheService>();
    var logger  = sp.GetRequiredService<ILogger<ProductService>>();
    return new ProductService(repo, cache, logger, maxCacheSize: 500);
});

var app = builder.Build();

// Constructor injection — the standard pattern
public class OrderService
{
    private readonly IOrderRepository _repo;
    private readonly IEmailService    _email;
    private readonly ILogger<OrderService> _logger;

    // Container injects all three automatically
    public OrderService(
        IOrderRepository repo,
        IEmailService    email,
        ILogger<OrderService> logger)
    {
        _repo   = repo;
        _email  = email;
        _logger = logger;
    }

    public async Task PlaceOrderAsync(Order order)
    {
        await _repo.SaveAsync(order);
        await _email.SendConfirmationAsync(order.CustomerEmail);
        _logger.LogInformation("Order {Id} placed", order.Id);
    }
}`,
    },
    {
      label: 'Lifetimes demo',
      language: 'csharp',
      code: `// Demonstrate lifetime differences
public class OperationTracker
{
    public Guid Id { get; } = Guid.NewGuid();
}

// Register all three lifetimes
builder.Services.AddTransient<TransientOp, OperationTracker>();
builder.Services.AddScoped<ScopedOp, OperationTracker>();
builder.Services.AddSingleton<SingletonOp, OperationTracker>();

// Interfaces
public interface TransientOp  { Guid Id { get; } }
public interface ScopedOp     { Guid Id { get; } }
public interface SingletonOp  { Guid Id { get; } }

// In a controller — all injected in same request
app.MapGet("/lifetime-test", (
    TransientOp  t1, TransientOp  t2,   // t1.Id != t2.Id (new each time)
    ScopedOp     s1, ScopedOp     s2,   // s1.Id == s2.Id (same per request)
    SingletonOp  g1, SingletonOp  g2) => // g1.Id == g2.Id (same always)
{
    return new
    {
        Transient1  = t1.Id,
        Transient2  = t2.Id,  // different!
        Scoped1     = s1.Id,
        Scoped2     = s2.Id,  // same as Scoped1
        Singleton1  = g1.Id,
        Singleton2  = g2.Id,  // same across all requests
    };
});

// CAPTIVE DEPENDENCY — compile-time warning in dev mode
// BAD: Singleton depends on Scoped → scoped service captured forever
public class BadSingleton(ScopedOp scoped) { }  // DI validates this
// GOOD: Use IServiceScopeFactory to create scope when needed`,
    },
    {
      label: 'Options pattern',
      language: 'csharp',
      code: `// appsettings.json
// {
//   "Email": {
//     "SmtpHost": "smtp.example.com",
//     "Port": 587,
//     "SenderAddress": "noreply@example.com"
//   }
// }

public class EmailOptions
{
    public string SmtpHost      { get; set; } = "";
    public int    Port          { get; set; } = 587;
    public string SenderAddress { get; set; } = "";
}

// Registration with validation
builder.Services.AddOptions<EmailOptions>()
    .BindConfiguration("Email")
    .ValidateDataAnnotations()     // validates [Required], [Range], etc.
    .ValidateOnStart();            // fails fast at startup if config is wrong

// IOptions<T> — singleton, config read once
public class EmailService(IOptions<EmailOptions> options)
{
    private readonly EmailOptions _opts = options.Value;
    public string SmtpHost => _opts.SmtpHost;
}

// IOptionsSnapshot<T> — scoped, re-read per request (hot-reload)
public class WeatherService(IOptionsSnapshot<WeatherOptions> snap)
{
    public string GetApiKey() => snap.Value.ApiKey;  // fresh per request
}

// IOptionsMonitor<T> — singleton, callback on change
public class ConfigWatcher(IOptionsMonitor<AppOptions> monitor)
{
    public ConfigWatcher(IOptionsMonitor<AppOptions> monitor)
    {
        monitor.OnChange(opts =>
            Console.WriteLine(\$"Config changed: {opts.FeatureFlags}"));
    }

    public string CurrentFlag => monitor.CurrentValue.FeatureFlags;
}`,
    },
    {
      label: 'Scoped services in BackgroundService',
      language: 'csharp',
      code: `// BackgroundService is a singleton — cannot directly inject scoped services
// Solution: inject IServiceScopeFactory and create a scope per unit of work

public class OrderProcessingWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<OrderProcessingWorker> _logger;

    public OrderProcessingWorker(
        IServiceScopeFactory scopeFactory,
        ILogger<OrderProcessingWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            // Create a new scope for each processing cycle
            await using AsyncServiceScope scope = _scopeFactory.CreateAsyncScope();
            IServiceProvider services = scope.ServiceProvider;

            // Resolve scoped services safely within this scope
            var db     = services.GetRequiredService<AppDbContext>();
            var queue  = services.GetRequiredService<IOrderQueue>();
            var mailer = services.GetRequiredService<IEmailService>();

            try
            {
                var pendingOrders = await db.Orders
                    .Where(o => o.Status == OrderStatus.Pending)
                    .Take(10)
                    .ToListAsync(ct);

                foreach (var order in pendingOrders)
                {
                    await queue.EnqueueAsync(order, ct);
                    await mailer.SendConfirmationAsync(order.CustomerEmail);
                    order.Status = OrderStatus.Queued;
                }

                await db.SaveChangesAsync(ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Order processing failed");
            }

            await Task.Delay(TimeSpan.FromSeconds(30), ct);
        } // scope disposed here — DbContext cleaned up correctly
    }
}`,
    },
    {
      label: 'Keyed services & decorators (.NET 8)',
      language: 'csharp',
      code: `// .NET 8 Keyed Services — multiple implementations, resolved by key

public interface INotificationSender
{
    Task SendAsync(string recipient, string message);
}

public class EmailSender  : INotificationSender { /* ... */ public Task SendAsync(string r, string m) => Task.CompletedTask; }
public class SmsSender    : INotificationSender { /* ... */ public Task SendAsync(string r, string m) => Task.CompletedTask; }
public class PushSender   : INotificationSender { /* ... */ public Task SendAsync(string r, string m) => Task.CompletedTask; }

// Register with keys
builder.Services.AddKeyedScoped<INotificationSender, EmailSender>("email");
builder.Services.AddKeyedScoped<INotificationSender, SmsSender>("sms");
builder.Services.AddKeyedScoped<INotificationSender, PushSender>("push");

// Resolve by key in constructor
public class NotificationRouter(
    [FromKeyedServices("email")] INotificationSender emailSender,
    [FromKeyedServices("sms")]   INotificationSender smsSender)
{
    public async Task RouteAsync(string channel, string to, string msg)
    {
        var sender = channel == "sms" ? smsSender : emailSender;
        await sender.SendAsync(to, msg);
    }
}

// Decorator pattern — add cross-cutting concerns without modifying original
public class LoggingNotificationSender : INotificationSender
{
    private readonly INotificationSender _inner;
    private readonly ILogger<LoggingNotificationSender> _logger;

    public LoggingNotificationSender(
        INotificationSender inner,
        ILogger<LoggingNotificationSender> logger)
    {
        _inner = inner; _logger = logger;
    }

    public async Task SendAsync(string recipient, string message)
    {
        _logger.LogInformation("Sending to {Recipient}", recipient);
        await _inner.SendAsync(recipient, message);
        _logger.LogInformation("Sent to {Recipient}", recipient);
    }
}

// Register decorator manually (or use Scrutor .Decorate<>())
builder.Services.AddScoped<EmailSender>();  // inner
builder.Services.AddScoped<INotificationSender>(sp =>
    new LoggingNotificationSender(
        sp.GetRequiredService<EmailSender>(),
        sp.GetRequiredService<ILogger<LoggingNotificationSender>>()));`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Captive dependency — singleton consuming scoped service',
      wrong: `// WRONG: MySingleton captures DbContext at startup — DbContext lives forever
// The DI container throws InvalidOperationException in dev mode
public class MySingleton(AppDbContext db)  // db is scoped — CAPTIVE!
{
    public Task<List<Product>> GetAllAsync() => db.Products.ToListAsync();
}

// Registration:
services.AddSingleton<MySingleton>();  // DI validation will catch this`,
      right: `// RIGHT: Inject IServiceScopeFactory — create scope per operation
public class MySingleton(IServiceScopeFactory scopeFactory)
{
    public async Task<List<Product>> GetAllAsync()
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        return await db.Products.ToListAsync();
    }
}`,
      explanation: 'A scoped service (like DbContext) must not outlive its scope. If injected into a singleton, it is captured at singleton-creation time and never replaced — this breaks EF Core change tracking and connection management. Use IServiceScopeFactory to create a new scope per operation.',
    },
    {
      title: 'Using IServiceProvider as a service locator',
      wrong: `public class OrderService(IServiceProvider sp)
{
    public async Task ProcessAsync(int id)
    {
        // Hidden dependencies — cannot see them without reading the method body
        var repo  = sp.GetService<IOrderRepository>();
        var email = sp.GetService<IEmailService>();
        // ...
    }
}`,
      right: `// Declare dependencies explicitly in the constructor
public class OrderService(
    IOrderRepository repo,
    IEmailService    email)
{
    public async Task ProcessAsync(int id)
    {
        var order = await repo.GetAsync(id);
        await email.SendAsync(order.CustomerEmail, "Processed");
    }
}`,
      explanation: 'Injecting IServiceProvider and calling GetService() everywhere hides your dependencies, makes the class impossible to test without a full container, and bypasses lifetime validation. Constructor injection makes all dependencies visible, testable, and validated at startup.',
    },
    {
      title: 'Registering an implementation without its interface',
      wrong: `// Registered as concrete type — nothing can inject IOrderRepository
services.AddScoped<OrderRepository>();  // NOT IOrderRepository

// This will throw because IOrderRepository is not registered
public class OrderService(IOrderRepository repo) { }`,
      right: `// Register the interface with its implementation
services.AddScoped<IOrderRepository, OrderRepository>();

// Or, if you need both the concrete and interface:
services.AddScoped<OrderRepository>();
services.AddScoped<IOrderRepository>(sp => sp.GetRequiredService<OrderRepository>());`,
      explanation: 'AddScoped<T>() registers T as both the service type AND the implementation type. When consumers depend on the interface IOrderRepository, the container does not find a registration and throws at runtime. Always register interface → implementation.',
    },
    {
      title: 'Using IOptions<T> in singletons for hot-reloadable config',
      wrong: `// IOptions<T> reads configuration ONCE at startup — never updates
// If appsettings.json changes, FeatureEnabled stays false forever
public class FeatureService(IOptions<FeatureOptions> opts)
{
    public bool IsEnabled => opts.Value.FeatureEnabled;  // stale after reload!
}
services.AddSingleton<FeatureService>();`,
      right: `// IOptionsMonitor<T> for singletons that need hot-reload
public class FeatureService(IOptionsMonitor<FeatureOptions> monitor)
{
    public bool IsEnabled => monitor.CurrentValue.FeatureEnabled;  // always fresh
}
services.AddSingleton<FeatureService>();

// Or IOptionsSnapshot<T> for scoped (per-request) services
public class FeatureController(IOptionsSnapshot<FeatureOptions> snap)
{
    public bool IsEnabled => snap.Value.FeatureEnabled;  // fresh per request
}`,
      explanation: 'IOptions<T> is a singleton that caches configuration at startup. For settings that can change at runtime (feature flags, rate limits), use IOptionsMonitor<T> in singletons (CurrentValue reflects latest) or IOptionsSnapshot<T> in scoped services (re-read per request).',
    },
  ];

  challenge: Challenge = {
    title: 'Multi-channel notification system',
    language: 'csharp',
    description: `Design and register a notification system that:
1. Has an INotificationService interface with SendAsync(string channel, string to, string message)
2. Three implementations: EmailNotification, SmsNotification, PushNotification (each just logs the channel + recipient)
3. A NotificationRouter that picks the correct implementation based on the channel string (use keyed services or a dictionary pattern)
4. A LoggingDecorator that wraps any INotificationService and logs before/after
5. Register everything in a console app's HostBuilder and call all three channels`,
    hints: [
      'Use AddKeyedScoped with "email", "sms", "push" keys',
      'NotificationRouter resolves by key using [FromKeyedServices] or IServiceProvider with GetRequiredKeyedService<T>(key)',
      'For the decorator: register concrete EmailNotification first, then re-register INotificationService as a factory that wraps it',
      'HostBuilder: use Host.CreateDefaultBuilder().ConfigureServices(...)',
      'IHostedService can call your notification router in StartAsync',
    ],
    starterCode: `using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

public interface INotificationService
{
    Task SendAsync(string channel, string to, string message);
}

// TODO: Implement EmailNotification, SmsNotification, PushNotification
// TODO: Implement NotificationRouter
// TODO: Implement LoggingDecorator

var host = Host.CreateDefaultBuilder(args)
    .ConfigureServices(services =>
    {
        // TODO: Register services
    })
    .Build();

await host.RunAsync();`,
    solution: `using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

public interface INotificationService
{
    Task SendAsync(string channel, string to, string message);
}

public class EmailNotification(ILogger<EmailNotification> logger) : INotificationService
{
    public Task SendAsync(string channel, string to, string message)
    {
        logger.LogInformation("[EMAIL] → {To}: {Message}", to, message);
        return Task.CompletedTask;
    }
}

public class SmsNotification(ILogger<SmsNotification> logger) : INotificationService
{
    public Task SendAsync(string channel, string to, string message)
    {
        logger.LogInformation("[SMS] → {To}: {Message}", to, message);
        return Task.CompletedTask;
    }
}

public class PushNotification(ILogger<PushNotification> logger) : INotificationService
{
    public Task SendAsync(string channel, string to, string message)
    {
        logger.LogInformation("[PUSH] → {To}: {Message}", to, message);
        return Task.CompletedTask;
    }
}

public class NotificationRouter(IServiceProvider sp) : INotificationService
{
    private static readonly Dictionary<string, string> Keys = new()
    {
        ["email"] = "email", ["sms"] = "sms", ["push"] = "push"
    };

    public async Task SendAsync(string channel, string to, string message)
    {
        if (!Keys.TryGetValue(channel, out var key))
            throw new ArgumentException(\$"Unknown channel: {channel}");
        var sender = sp.GetRequiredKeyedService<INotificationService>(key);
        await sender.SendAsync(channel, to, message);
    }
}

public class LoggingDecorator(
    INotificationService inner,
    ILogger<LoggingDecorator> logger) : INotificationService
{
    public async Task SendAsync(string channel, string to, string message)
    {
        logger.LogInformation("Sending via {Channel}...", channel);
        await inner.SendAsync(channel, to, message);
        logger.LogInformation("Sent via {Channel}", channel);
    }
}

public class NotificationHostedService(INotificationService router) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        await router.SendAsync("email", "user@example.com", "Welcome!");
        await router.SendAsync("sms",   "+1234567890",       "Code: 4242");
        await router.SendAsync("push",  "device-token-xyz",  "New message");
    }
}

var host = Host.CreateDefaultBuilder(args)
    .ConfigureServices(services =>
    {
        services.AddKeyedScoped<INotificationService, EmailNotification>("email");
        services.AddKeyedScoped<INotificationService, SmsNotification>("sms");
        services.AddKeyedScoped<INotificationService, PushNotification>("push");

        services.AddScoped<NotificationRouter>();
        services.AddScoped<INotificationService>(sp =>
            new LoggingDecorator(
                sp.GetRequiredService<NotificationRouter>(),
                sp.GetRequiredService<ILogger<LoggingDecorator>>()));

        services.AddHostedService<NotificationHostedService>();
    })
    .Build();

await host.RunAsync();`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What happens if you inject a Scoped service into a Singleton service?',
      options: [
        'The scoped service works correctly because the container manages the lifetime automatically',
        'The scoped service is captured at singleton creation and lives forever, violating scoped semantics — the container throws in dev mode',
        'The scoped service is re-created for each call to the singleton method',
        'A new scope is automatically created each time the scoped service is accessed through the singleton',
      ],
      answer: 1,
      explanation: 'This is the "captive dependency" problem. The singleton is created once; the scoped service it captured at construction never gets replaced. For DbContext this means one instance is reused across all requests — breaking change tracking and thread safety. The container detects and throws on this in development mode.',
    },
    {
      q: 'Which Options interface should you use in a Singleton that needs to react to runtime configuration changes?',
      options: [
        'IOptions<T> — it is already a singleton so it matches the lifetime',
        'IOptionsSnapshot<T> — it re-reads config per request',
        'IOptionsMonitor<T> — it is singleton-safe and provides CurrentValue and OnChange callbacks',
        'IConfiguration directly — it is the most flexible',
      ],
      answer: 2,
      explanation: 'IOptionsMonitor<T> is singleton-safe and its CurrentValue always reflects the latest configuration. It also provides OnChange callbacks. IOptionsSnapshot<T> is scoped and cannot be injected into a singleton. IOptions<T> reads once at startup and never updates.',
    },
    {
      q: 'What does AddScoped<IOrderRepository, SqlOrderRepository>() do?',
      options: [
        'Creates one SqlOrderRepository instance per application lifetime',
        'Creates one SqlOrderRepository instance per HTTP request scope, resolved when IOrderRepository is requested',
        'Creates a new SqlOrderRepository instance every time IOrderRepository is resolved',
        'Registers SqlOrderRepository as a static class available globally',
      ],
      answer: 1,
      explanation: 'Scoped services are created once per scope. In ASP.NET Core, a scope corresponds to an HTTP request — all components in the same request share the same instance. This is why DbContext is registered as Scoped: all repositories in a request share one context for correct change tracking.',
    },
    {
      q: 'You need to use a Scoped service inside a BackgroundService (which is a Singleton). What is the correct approach?',
      options: [
        'Inject the scoped service directly into the BackgroundService constructor',
        'Inject IServiceScopeFactory and create a new scope for each unit of work',
        'Change the scoped service\'s lifetime to Singleton to match',
        'Use a static property to share the scoped service across lifetimes',
      ],
      answer: 1,
      explanation: 'Inject IServiceScopeFactory (which is itself a singleton). In ExecuteAsync, create a scope with CreateAsyncScope(), resolve the scoped service from scope.ServiceProvider, and dispose the scope when done. This gives each processing iteration its own fresh scoped service instance with correct lifetime management.',
    },
    {
      q: 'What is the difference between GetService<T>() and GetRequiredService<T>()?',
      options: [
        'GetRequiredService<T> is faster because it skips null checks',
        'GetService<T> returns null if T is not registered; GetRequiredService<T> throws InvalidOperationException',
        'GetRequiredService<T> validates the service at compile time; GetService<T> is runtime only',
        'GetService<T> creates a new instance each call; GetRequiredService<T> reuses the registered lifetime',
      ],
      answer: 1,
      explanation: 'GetService<T>() returns null for unregistered services — which may propagate as a NullReferenceException later, making the root cause hard to find. GetRequiredService<T>() throws InvalidOperationException immediately with a clear message. Prefer GetRequiredService<T>() in application code so bugs surface early and clearly.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Should I use the built-in DI container or a third-party one like Autofac?',
      a: 'Start with the built-in container — it covers constructor injection, lifetimes, options, keyed services, and generic type resolution. Switch to Autofac (or similar) only when you need features it does not provide: property injection, named registrations beyond keyed services, AOP interceptors, or assembly-scanning registration. Autofac integrates seamlessly via UseServiceProviderFactory and the builder.Host.UseAutofac() pattern.',
    },
    {
      q: 'How do I register an open generic type like IRepository<T>?',
      a: 'Use the non-generic overload: services.AddScoped(typeof(IRepository<>), typeof(SqlRepository<>)). The container automatically constructs SqlRepository<T> for any T when IRepository<T> is requested. This avoids registering every concrete T individually.',
    },
    {
      q: 'Can I register multiple implementations of the same interface and inject all of them?',
      a: 'Yes — all registrations are kept. Add multiple AddScoped<IHandler, ConcreteHandler>() calls with different implementations. Inject IEnumerable<IHandler> in a constructor to receive all registered implementations in registration order. This is the standard pattern for pipelines, event handlers, and composite strategies.',
    },
    {
      q: 'How do I validate that all required services are registered correctly before the app starts?',
      a: 'In .NET 6+, set builder.Host.UseDefaultServiceProvider(o => { o.ValidateOnBuild = true; o.ValidateScopes = true; }) (the defaults in development). ValidateOnBuild constructs the dependency graph at startup and throws for any missing or misconfigured registrations — much better than discovering them at runtime under production load.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'The built-in .NET DI container wires dependencies via constructor injection with three lifetimes — Transient (per-injection), Scoped (per-request), Singleton (app-lifetime). The Options pattern binds typed config; keyed services resolve multiple implementations by key.',
    mustKnow: [
      'Transient = new per request; Scoped = one per HTTP request; Singleton = one per app',
      'Captive dependency: Singleton depending on Scoped → Scoped captured forever → use IServiceScopeFactory',
      'IOptions<T> = startup snapshot; IOptionsSnapshot<T> = scoped/per-request; IOptionsMonitor<T> = singleton + live reload',
      'BackgroundService is a singleton — inject IServiceScopeFactory, create scope per work unit',
      'GetRequiredService<T> throws if missing; GetService<T> returns null — prefer GetRequiredService in app code',
      '.NET 8 keyed services: AddKeyedScoped<T,U>("key") + [FromKeyedServices("key")] in constructor',
    ],
    interviewFocus: [
      '<strong>Lifetime differences?</strong> — Transient, Scoped, Singleton + when to use each',
      '<strong>Captive dependency?</strong> — Singleton holding Scoped → stale instance; fix = IServiceScopeFactory',
      '<strong>Options interfaces?</strong> — IOptions (once), IOptionsSnapshot (per-request), IOptionsMonitor (singleton + live)',
      '<strong>Service locator anti-pattern?</strong> — hiding dependencies via IServiceProvider.GetService() → prefer constructor injection',
    ],
  };
}
