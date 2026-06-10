import { Component, signal, computed } from '@angular/core';

interface Pattern {
  name: string;
  category: string;
  intent: string;
  whenToUse: string[];
  whenNotToUse: string[];
  example: string;
  pitfalls: string[];
}

@Component({
  selector: 'app-csharp-design-patterns',
  standalone: true,
  imports: [],
  templateUrl: './design-patterns.html',
  styleUrl: './design-patterns.scss',
})
export class CsharpDesignPatterns {
  categories = ['All', 'Creational', 'Structural', 'Behavioral'];
  activeCategory = signal('All');
  expanded = signal<string | null>(null);

  patterns: Pattern[] = [
    {
      name: 'Singleton',
      category: 'Creational',
      intent: 'Guarantee a class has exactly one instance and provide a global access point to it.',
      whenToUse: [
        'A truly process-wide resource: configuration cache, in-memory metrics sink',
        'When the instance must be lazily created and thread-safe (Lazy<T> handles both)',
        'Legacy code where you cannot introduce a DI container',
      ],
      whenNotToUse: [
        'In any app with a DI container — register the service as services.AddSingleton<T>() instead; the container manages the lifetime and the class stays testable',
        'When the "singleton" holds mutable per-request state — that is a scoped service',
        'As a disguise for global variables',
      ],
      example: `// Classic thread-safe singleton (only when you have no container)
public sealed class AppMetrics
{
    private static readonly Lazy<AppMetrics> _instance =
        new(() => new AppMetrics());

    public static AppMetrics Instance => _instance.Value;

    private AppMetrics() { }

    public void Increment(string counter) { /* ... */ }
}

// The modern replacement: let the DI container own the lifetime.
// The class is a plain, testable type — no static state at all.
public sealed class AppMetricsService(TimeProvider clock) : IAppMetrics
{
    public void Increment(string counter)
        => Console.WriteLine($"{clock.GetUtcNow():O} {counter}++");
}

builder.Services.AddSingleton<IAppMetrics, AppMetricsService>();`,
      pitfalls: [
        'Static singletons hide dependencies and make unit tests order-dependent',
        'Double-checked locking by hand is easy to get wrong — use Lazy<T>',
        'A DI-registered singleton must be thread-safe and must not capture scoped services (the "captive dependency" bug)',
      ],
    },
    {
      name: 'Factory Method',
      category: 'Creational',
      intent: 'Defer the decision of which concrete type to instantiate to a dedicated creation method, so callers depend only on an abstraction.',
      whenToUse: [
        'The concrete type depends on runtime data (file extension, message type, tenant)',
        'Construction involves logic you do not want sprinkled across call sites',
        'You need to create scoped services from a singleton via IServiceScopeFactory',
      ],
      whenNotToUse: [
        'There is only one concrete type and no realistic prospect of more — just use new or DI',
        'The container can already resolve the type directly',
        'You find yourself writing a factory for the factory',
      ],
      example: `public interface IExporter { Task ExportAsync(Report r, Stream s); }

public sealed class CsvExporter : IExporter { /* ... */ }
public sealed class PdfExporter : IExporter { /* ... */ }
public sealed class JsonExporter : IExporter { /* ... */ }

// DI-friendly factory: resolves from the container, switches on data
public sealed class ExporterFactory(IServiceProvider services)
{
    public IExporter Create(string format) => format.ToLowerInvariant() switch
    {
        "csv"  => services.GetRequiredService<CsvExporter>(),
        "pdf"  => services.GetRequiredService<PdfExporter>(),
        "json" => services.GetRequiredService<JsonExporter>(),
        _ => throw new NotSupportedException($"Unknown format '{format}'"),
    };
}

builder.Services.AddTransient<CsvExporter>();
builder.Services.AddTransient<PdfExporter>();
builder.Services.AddTransient<JsonExporter>();
builder.Services.AddSingleton<ExporterFactory>();`,
      pitfalls: [
        'A giant switch in the factory is fine; a giant switch copy-pasted into five factories is not — keep one',
        'Resolving by string from IServiceProvider everywhere becomes the Service Locator anti-pattern; confine it to the factory',
        'Forgetting to register the concrete types makes the factory throw at runtime, not compile time',
      ],
    },
    {
      name: 'Builder',
      category: 'Creational',
      intent: 'Construct a complex object step by step, separating the construction recipe from the final representation.',
      whenToUse: [
        'Objects with many optional parts (HTTP requests, query definitions, host configuration — WebApplicationBuilder is exactly this)',
        'When construction must be validated as a whole before the object exists',
        'Fluent test-data builders that keep unit tests readable',
      ],
      whenNotToUse: [
        'Simple immutable data — a record with init properties and with-expressions already gives you "build a modified copy" for free',
        'Two or three constructor parameters — optional/named arguments are enough',
      ],
      example: `// Records + with-expressions cover the simple cases:
public record EmailMessage(string To, string Subject)
{
    public string? Cc { get; init; }
    public string Body { get; init; } = "";
}
var reminder = original with { Subject = "Reminder: " + original.Subject };

// A real builder earns its keep when assembly has rules:
public sealed class HttpRequestBuilder
{
    private readonly List<KeyValuePair<string, string>> _headers = [];
    private HttpMethod _method = HttpMethod.Get;
    private Uri? _uri;
    private HttpContent? _content;

    public HttpRequestBuilder WithUri(string uri)
        { _uri = new Uri(uri); return this; }
    public HttpRequestBuilder WithMethod(HttpMethod m)
        { _method = m; return this; }
    public HttpRequestBuilder WithHeader(string name, string value)
        { _headers.Add(new(name, value)); return this; }
    public HttpRequestBuilder WithJson<T>(T body)
        { _content = JsonContent.Create(body); return this; }

    public HttpRequestMessage Build()
    {
        if (_uri is null) throw new InvalidOperationException("Uri is required");
        var request = new HttpRequestMessage(_method, _uri) { Content = _content };
        foreach (var (name, value) in _headers)
            request.Headers.TryAddWithoutValidation(name, value);
        return request;
    }
}`,
      pitfalls: [
        'Builders that return a mutable product invite callers to keep mutating after Build() — return immutable results',
        'A builder reused after Build() can leak state into the next product; either reset or throw',
        'Do not write a builder where a record with { ... } expression would do — that is ceremony, not design',
      ],
    },
    {
      name: 'Adapter',
      category: 'Structural',
      intent: 'Convert the interface of an existing class into the interface your code expects, so incompatible types can collaborate.',
      whenToUse: [
        'Wrapping a third-party SDK behind your own interface so the vendor type never leaks into your domain',
        'Bridging legacy code (callback-based, DataSet-era) to modern async interfaces',
        'Making external services mockable in tests',
      ],
      whenNotToUse: [
        'You control both sides — just change one of the interfaces',
        'The adapter would be a pure 1:1 pass-through forever with no isolation benefit',
      ],
      example: `// Your domain defines the interface it wants:
public interface IPaymentGateway
{
    Task<PaymentResult> ChargeAsync(decimal amount, string token,
        CancellationToken ct = default);
}

// The vendor SDK has a different shape entirely:
public class StripeClient
{
    public Task<StripeCharge> CreateChargeAsync(StripeChargeOptions o) => ...;
}

// The adapter translates between the two worlds:
public sealed class StripePaymentAdapter(StripeClient stripe) : IPaymentGateway
{
    public async Task<PaymentResult> ChargeAsync(
        decimal amount, string token, CancellationToken ct = default)
    {
        var charge = await stripe.CreateChargeAsync(new StripeChargeOptions
        {
            AmountInCents = (long)(amount * 100),
            Source = token,
        });
        return charge.Status == "succeeded"
            ? PaymentResult.Success(charge.Id)
            : PaymentResult.Failed(charge.FailureMessage ?? "Unknown error");
    }
}

builder.Services.AddScoped<IPaymentGateway, StripePaymentAdapter>();`,
      pitfalls: [
        'Letting vendor types (StripeCharge, exceptions) leak through the adapter defeats its whole purpose',
        'Adapters that also add caching/retry/logging have become decorators wearing the wrong name — split the concerns',
        'Mapping code is boring but bug-prone; cover the unit conversion (dollars vs cents!) with tests',
      ],
    },
    {
      name: 'Decorator',
      category: 'Structural',
      intent: 'Wrap an object in another object with the same interface to add behavior before/after delegation, without modifying the original.',
      whenToUse: [
        'Cross-cutting concerns on a per-interface basis: caching, retry, logging, metrics around a repository or client',
        'Stacking optional behaviors in different combinations at composition time',
        'DelegatingHandler in HttpClient pipelines is exactly this pattern',
      ],
      whenNotToUse: [
        'App-wide cross-cutting concerns — middleware, MediatR pipeline behaviors, or interceptors scale better than decorating 40 interfaces',
        'The added behavior changes the contract semantics (callers must know) — that is a different type, not a decorator',
      ],
      example: `public interface IWeatherService
{
    Task<Forecast> GetForecastAsync(string city, CancellationToken ct = default);
}

public sealed class CachedWeatherService(
    IWeatherService inner,           // the wrapped service
    IMemoryCache cache) : IWeatherService
{
    public async Task<Forecast> GetForecastAsync(
        string city, CancellationToken ct = default)
    {
        return (await cache.GetOrCreateAsync($"weather:{city}", async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10);
            return await inner.GetForecastAsync(city, ct);
        }))!;
    }
}

// Manual composition without a library:
builder.Services.AddMemoryCache();
builder.Services.AddHttpClient<OpenMeteoWeatherService>();
builder.Services.AddScoped<IWeatherService>(sp =>
    new CachedWeatherService(
        sp.GetRequiredService<OpenMeteoWeatherService>(),
        sp.GetRequiredService<IMemoryCache>()));
// (Scrutor's services.Decorate<IWeatherService, CachedWeatherService>()
//  removes the wiring boilerplate.)`,
      pitfalls: [
        'Decorator order matters: retry-outside-cache and cache-outside-retry behave very differently — be deliberate',
        'Forgetting to pass CancellationToken through the chain silently breaks cancellation',
        'Deep stacks make stack traces and debugging painful; if you have 5+ layers, consider a pipeline abstraction instead',
      ],
    },
    {
      name: 'Facade',
      category: 'Structural',
      intent: 'Provide one simple, intention-revealing interface over a tangle of subsystems, so most callers never touch the complexity.',
      whenToUse: [
        'An operation that orchestrates several services (validate, charge, persist, email) and is invoked from multiple entry points',
        'Shielding controllers/endpoints from knowing about five collaborating services',
        'Wrapping a gnarly subsystem boundary (reporting engine, legacy module) with a clean API',
      ],
      whenNotToUse: [
        'As a mandatory pass-through layer over every service "for consistency" — that is lasagna architecture',
        'When the orchestration belongs in a domain entity or a use-case handler that already exists',
      ],
      example: `// One method, one business operation, many subsystems behind it:
public sealed class CheckoutFacade(
    ICartService carts,
    IInventoryService inventory,
    IPaymentGateway payments,
    IOrderRepository orders,
    IEmailSender email,
    ILogger<CheckoutFacade> logger)
{
    public async Task<CheckoutResult> CheckoutAsync(
        Guid cartId, string paymentToken, CancellationToken ct)
    {
        var cart = await carts.GetAsync(cartId, ct);
        if (cart.Items.Count == 0)
            return CheckoutResult.Failed("Cart is empty");

        if (!await inventory.ReserveAsync(cart.Items, ct))
            return CheckoutResult.Failed("Items out of stock");

        var payment = await payments.ChargeAsync(cart.Total, paymentToken, ct);
        if (!payment.Succeeded)
        {
            await inventory.ReleaseAsync(cart.Items, ct);
            return CheckoutResult.Failed(payment.Error);
        }

        var order = await orders.CreateFromCartAsync(cart, payment.Id, ct);
        await email.SendOrderConfirmationAsync(order, ct);
        logger.LogInformation("Order {OrderId} placed", order.Id);
        return CheckoutResult.Success(order.Id);
    }
}`,
      pitfalls: [
        'Facades attract responsibilities until they become god objects — keep one facade per use-case cluster',
        'A facade with 8 constructor dependencies is a design smell pointing at a missing domain concept',
        'Do not let callers bypass the facade for "just this one case" — partial orchestration causes inconsistent state',
      ],
    },
    {
      name: 'Repository',
      category: 'Structural',
      intent: 'Mediate between the domain and data mapping layers using a collection-like interface for aggregate roots.',
      whenToUse: [
        'You want domain/application code to depend on an interface, not on EF Core types',
        'Complex query logic worth centralizing and naming (GetOverdueInvoicesAsync)',
        'Swappable persistence in tests (in-memory fake) without spinning up a database',
      ],
      whenNotToUse: [
        'Thin CRUD apps where DbContext *is already* a repository + unit of work — wrapping it 1:1 adds nothing',
        'When you would need to expose IQueryable from the repository to make it useful — the abstraction has failed at that point',
      ],
      example: `public interface IOrderRepository
{
    Task<Order?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<Order>> GetOverdueAsync(DateOnly asOf, CancellationToken ct = default);
    void Add(Order order);
}

public sealed class EfOrderRepository(ShopDbContext db) : IOrderRepository
{
    public Task<Order?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        db.Orders.Include(o => o.Lines)
                 .FirstOrDefaultAsync(o => o.Id == id, ct);

    public async Task<IReadOnlyList<Order>> GetOverdueAsync(
        DateOnly asOf, CancellationToken ct = default) =>
        await db.Orders
            .Where(o => o.DueDate < asOf && o.Status == OrderStatus.Unpaid)
            .OrderBy(o => o.DueDate)
            .ToListAsync(ct);

    public void Add(Order order) => db.Orders.Add(order);
}

// Unit of Work note: DbContext already implements it — SaveChangesAsync
// commits all tracked changes atomically. Expose it as a small interface:
public interface IUnitOfWork { Task<int> SaveChangesAsync(CancellationToken ct = default); }
// ShopDbContext : DbContext, IUnitOfWork — handlers call repo.Add(...) then uow.SaveChangesAsync().`,
      pitfalls: [
        'Generic IRepository<T> with GetAll() invites loading whole tables; design per-aggregate methods instead',
        'Calling SaveChanges inside every repository method breaks atomicity across aggregates — commit once per use case',
        'Returning IQueryable leaks EF semantics (lazy loading, translation failures) to callers and makes the interface unfakeable',
      ],
    },
    {
      name: 'Strategy',
      category: 'Behavioral',
      intent: 'Define a family of interchangeable algorithms behind one interface and select the implementation at runtime.',
      whenToUse: [
        'Multiple ways to do one thing: pricing rules, shipping calculators, compression formats',
        'Replacing switch statements that keep growing a new arm per business rule',
        'Per-tenant or per-feature-flag behavior selection',
      ],
      whenNotToUse: [
        'Two stable branches that will never grow — an if statement is simpler and clearer',
        'The "algorithms" share no signature and you are forcing them under one interface',
      ],
      example: `public interface IShippingStrategy
{
    string Carrier { get; }
    decimal Calculate(Shipment shipment);
}

public sealed class FlatRateShipping : IShippingStrategy
{
    public string Carrier => "flat";
    public decimal Calculate(Shipment s) => 4.99m;
}

public sealed class WeightBasedShipping : IShippingStrategy
{
    public string Carrier => "weight";
    public decimal Calculate(Shipment s) => 1.20m * s.WeightKg + 2.50m;
}

// Register all strategies; pick one by key at runtime:
builder.Services.AddSingleton<IShippingStrategy, FlatRateShipping>();
builder.Services.AddSingleton<IShippingStrategy, WeightBasedShipping>();

public sealed class ShippingCalculator(IEnumerable<IShippingStrategy> strategies)
{
    public decimal Quote(Shipment shipment, string carrier) =>
        strategies.FirstOrDefault(s => s.Carrier == carrier)
            ?.Calculate(shipment)
            ?? throw new NotSupportedException($"No strategy for '{carrier}'");
}`,
      pitfalls: [
        'For a single tiny algorithm, a Func<Shipment, decimal> parameter beats a class hierarchy',
        'Strategies that need wildly different inputs are telling you they are not one family',
        'Resolving IEnumerable<T> creates every strategy even if only one is used — fine for cheap ones, use keyed services (.NET 8) for expensive ones',
      ],
    },
    {
      name: 'Observer',
      category: 'Behavioral',
      intent: 'Let multiple subscribers react to state changes in a subject without the subject knowing who they are.',
      whenToUse: [
        'One source, many independent reactions: domain events, UI notifications, cache invalidation',
        'C# events for simple in-process notification with a known lifetime',
        'IObservable<T>/Rx when you need composition: throttle, buffer, combine streams',
      ],
      whenNotToUse: [
        'When the "observer" must influence the outcome — that is a chain of responsibility or pipeline, not observation',
        'Cross-service notification — use a message bus, not in-process events',
        'When ordering between observers matters; observer order is an implementation detail',
      ],
      example: `// Plain C# events — simple, allocation-light, but manual unsubscribe:
public sealed class StockTicker
{
    public event EventHandler<PriceChangedEventArgs>? PriceChanged;

    public void Update(string symbol, decimal price) =>
        PriceChanged?.Invoke(this, new PriceChangedEventArgs(symbol, price));
}

ticker.PriceChanged += (_, e) =>
    Console.WriteLine($"{e.Symbol} is now {e.Price:C}");

// IObservable<T> (System.Reactive) — composable streams:
IObservable<PriceChange> prices = Observable
    .FromEventPattern<PriceChangedEventArgs>(ticker, nameof(ticker.PriceChanged))
    .Select(ep => new PriceChange(ep.EventArgs.Symbol, ep.EventArgs.Price));

using var subscription = prices
    .Where(p => p.Symbol == "MSFT")
    .Throttle(TimeSpan.FromSeconds(1))   // impossible with raw events
    .Subscribe(p => Console.WriteLine($"MSFT: {p.Price}"));
// Rule of thumb: events for "notify me"; IObservable for
// "give me a stream I can filter, throttle, and combine".`,
      pitfalls: [
        'Forgetting -= on long-lived publishers is the classic .NET memory leak: the publisher keeps the subscriber alive',
        'Exceptions in one event handler stop the remaining handlers — invoke defensively if subscribers are untrusted',
        'Raising events while holding a lock invites deadlocks; snapshot the delegate, release, then invoke',
      ],
    },
    {
      name: 'Command',
      category: 'Behavioral',
      intent: 'Reify an action as an object carrying everything needed to execute it, enabling queuing, logging, undo, and retry.',
      whenToUse: [
        'Undo/redo stacks in editors and designers',
        'Work that must be queued, persisted, and retried (outbox pattern, background jobs)',
        'Audit requirements: the command object *is* the audit record',
      ],
      whenNotToUse: [
        'Plain method calls that never need deferral, undo, or persistence',
        'When MediatR-style request/handler already gives you the shape you need (see Mediator)',
      ],
      example: `public interface ICommand
{
    void Execute();
    void Undo();
}

public sealed class RenameItemCommand(Item item, string newName) : ICommand
{
    private readonly string _oldName = item.Name;

    public void Execute() => item.Name = newName;
    public void Undo()    => item.Name = _oldName;
}

public sealed class CommandHistory
{
    private readonly Stack<ICommand> _undo = [];
    private readonly Stack<ICommand> _redo = [];

    public void Run(ICommand command)
    {
        command.Execute();
        _undo.Push(command);
        _redo.Clear();                  // a new action invalidates redo
    }

    public void Undo()
    {
        if (_undo.TryPop(out var cmd)) { cmd.Undo(); _redo.Push(cmd); }
    }

    public void Redo()
    {
        if (_redo.TryPop(out var cmd)) { cmd.Execute(); _undo.Push(cmd); }
    }
}`,
      pitfalls: [
        'Undo must capture state *before* execution; capturing lazily records the post-change value',
        'Commands holding live object references break when persisted/replayed later — store identifiers and re-resolve',
        'Unbounded history stacks leak memory in long sessions; cap the depth',
      ],
    },
    {
      name: 'Mediator',
      category: 'Behavioral',
      intent: 'Route requests through a central dispatcher so senders and handlers never reference each other directly.',
      whenToUse: [
        'Thin controllers: endpoint maps HTTP to a request object, handler owns the use case',
        'Cross-cutting pipeline behaviors (validation, logging, transactions) applied uniformly to every request',
        'One event fanned out to multiple independent handlers (INotification)',
      ],
      whenNotToUse: [
        'Small apps where controller → service is already clear; the indirection costs "go to definition"',
        'In-process performance hot paths — reflection-based dispatch adds overhead',
        'As a dumping ground: mediator does not fix bad use-case boundaries',
      ],
      example: `// MediatR-style request/handler:
public sealed record CreateOrderCommand(Guid CustomerId, List<OrderLineDto> Lines)
    : IRequest<Guid>;

public sealed class CreateOrderHandler(
    IOrderRepository orders,
    IUnitOfWork uow) : IRequestHandler<CreateOrderCommand, Guid>
{
    public async Task<Guid> Handle(CreateOrderCommand cmd, CancellationToken ct)
    {
        var order = Order.Create(cmd.CustomerId, cmd.Lines);
        orders.Add(order);
        await uow.SaveChangesAsync(ct);
        return order.Id;
    }
}

// Pipeline behavior — runs around EVERY request:
public sealed class ValidationBehavior<TReq, TRes>(IValidator<TReq>? validator)
    : IPipelineBehavior<TReq, TRes> where TReq : notnull
{
    public async Task<TRes> Handle(TReq request,
        RequestHandlerDelegate<TRes> next, CancellationToken ct)
    {
        if (validator is not null)
            await validator.ValidateAndThrowAsync(request, ct);
        return await next();
    }
}

// Minimal API endpoint stays one line of intent:
app.MapPost("/orders", async (CreateOrderCommand cmd, IMediator mediator) =>
    Results.Created($"/orders/{await mediator.Send(cmd)}", null));`,
      pitfalls: [
        'Handlers calling mediator.Send to other handlers creates an invisible call graph — orchestrate explicitly instead',
        'Pipeline behaviors run in registration order; a transaction behavior registered after validation wraps less than you think',
        'One request, one handler: sharing logic via base handler classes recreates the coupling you removed',
      ],
    },
    {
      name: 'Template Method',
      category: 'Behavioral',
      intent: 'Define the skeleton of an algorithm in a base class and let subclasses override specific steps without changing the structure.',
      whenToUse: [
        'A fixed workflow with variable steps: import pipelines (read → validate → transform → save)',
        'Framework hook points — BackgroundService.ExecuteAsync is a template method you fill in',
        'Enforcing invariants around the variable parts (timing, logging, error handling in the base)',
      ],
      whenNotToUse: [
        'When composition works: injecting a strategy is more flexible than inheriting a base class',
        'More than one axis of variation — inheritance gives you one; you will end up with a class explosion',
      ],
      example: `public abstract class FileImporter(ILogger logger)
{
    // The template method: fixed skeleton, sealed against override
    public async Task<ImportResult> ImportAsync(Stream file, CancellationToken ct)
    {
        var sw = Stopwatch.StartNew();
        var rows = await ParseAsync(file, ct);          // step 1 (abstract)
        var valid = rows.Where(IsValid).ToList();        // step 2 (virtual)
        await SaveAsync(valid, ct);                      // step 3 (abstract)
        logger.LogInformation("Imported {Count}/{Total} rows in {Ms}ms",
            valid.Count, rows.Count, sw.ElapsedMilliseconds);
        return new ImportResult(valid.Count, rows.Count - valid.Count);
    }

    protected abstract Task<List<ImportRow>> ParseAsync(Stream file, CancellationToken ct);
    protected abstract Task SaveAsync(List<ImportRow> rows, CancellationToken ct);
    protected virtual bool IsValid(ImportRow row) => row.Errors.Count == 0;
}

public sealed class CsvCustomerImporter(ILogger<CsvCustomerImporter> logger,
    ShopDbContext db) : FileImporter(logger)
{
    protected override Task<List<ImportRow>> ParseAsync(Stream file, CancellationToken ct)
        => CsvParser.ReadRowsAsync(file, ct);

    protected override async Task SaveAsync(List<ImportRow> rows, CancellationToken ct)
    {
        db.Customers.AddRange(rows.Select(r => r.ToCustomer()));
        await db.SaveChangesAsync(ct);
    }
}`,
      pitfalls: [
        'Too many virtual hooks turn the base class into a choose-your-own-adventure nobody can follow',
        'Base classes accumulating shared helpers become god classes; keep the base about the skeleton only',
        'Prefer Strategy when subclasses only vary one step — inheritance is the most rigid coupling C# offers',
      ],
    },
  ];

  filtered = computed(() => {
    const cat = this.activeCategory();
    return cat === 'All' ? this.patterns : this.patterns.filter(p => p.category === cat);
  });

  setCategory(cat: string): void {
    this.activeCategory.set(cat);
  }

  toggle(name: string): void {
    this.expanded.update(cur => (cur === name ? null : name));
  }

  isExpanded(name: string): boolean {
    return this.expanded() === name;
  }
}
