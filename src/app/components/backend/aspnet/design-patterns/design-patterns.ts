import { Component, signal } from '@angular/core';

interface DesignPattern { name: string; badges: string[]; summary: string; code: string; }

@Component({
  selector: 'app-aspnet-design-patterns',
  standalone: true,
  imports: [],
  templateUrl: './design-patterns.html',
  styleUrl: './design-patterns.scss',
})
export class AspnetDesignPatterns {
  openIndex = signal<number | null>(null);
  toggle(i: number) { this.openIndex.update(n => n === i ? null : i); }

  patterns: DesignPattern[] = [
    {
      name: 'Repository Pattern',
      badges: ['Data', 'Testability'],
      summary: 'Wraps data access behind an interface, decoupling business logic from EF Core. Makes unit testing easy — swap the real repo for an in-memory fake without touching the service. Register as Scoped to align with DbContext lifetime.',
      code: `public interface IProductRepository {
    Task<Product?> FindAsync(int id, CancellationToken ct = default);
    Task AddAsync(Product p, CancellationToken ct = default);
}

public class EfProductRepository(AppDbContext db) : IProductRepository {
    public Task<Product?> FindAsync(int id, CancellationToken ct)
        => db.Products.FindAsync([id], ct).AsTask();
    public async Task AddAsync(Product p, CancellationToken ct) {
        db.Products.Add(p);
        await db.SaveChangesAsync(ct);
    }
}

// Registration
builder.Services.AddScoped<IProductRepository, EfProductRepository>();`,
    },
    {
      name: 'Unit of Work',
      badges: ['Data', 'Transactions'],
      summary: 'Groups multiple repository operations under a single SaveChanges call. EF Core\'s DbContext IS the unit of work — but wrapping it with an interface keeps services testable and decouples the transaction boundary from individual repos.',
      code: `public interface IUnitOfWork {
    IProductRepository Products { get; }
    IOrderRepository   Orders   { get; }
    Task<int> SaveAsync(CancellationToken ct = default);
}

public class AppUnitOfWork(AppDbContext db,
    IProductRepository products, IOrderRepository orders) : IUnitOfWork {
    public IProductRepository Products => products;
    public IOrderRepository   Orders   => orders;
    public Task<int> SaveAsync(CancellationToken ct) => db.SaveChangesAsync(ct);
}`,
    },
    {
      name: 'CQRS with MediatR',
      badges: ['Architecture', 'MediatR'],
      summary: 'Separates reads (Queries) from writes (Commands). MediatR dispatches a Command or Query to its single Handler, eliminating fat service classes. Combine with FluentValidation pipeline behaviours for clean cross-cutting validation.',
      code: `// Command
public record CreateOrderCommand(int ProductId, int Qty) : IRequest<int>;

// Handler
public class CreateOrderHandler(IUnitOfWork uow) : IRequestHandler<CreateOrderCommand, int> {
    public async Task<int> Handle(CreateOrderCommand cmd, CancellationToken ct) {
        var order = new Order(cmd.ProductId, cmd.Qty);
        await uow.Orders.AddAsync(order, ct);
        await uow.SaveAsync(ct);
        return order.Id;
    }
}

// Endpoint
app.MapPost("/orders", async (CreateOrderCommand cmd, IMediator mediator) =>
    Results.Created($"/orders/{await mediator.Send(cmd)}", null));`,
    },
    {
      name: 'Decorator via DI',
      badges: ['DI', 'Cross-cutting'],
      summary: 'Wrap an existing service with a decorator that adds logging, caching, or metrics without modifying the original. Scrutor\'s .Decorate<TService, TDecorator>() makes registration one-liners.',
      code: `// Decorator adds caching around the real repository
public class CachedProductRepository(
    IProductRepository inner,
    IMemoryCache cache) : IProductRepository
{
    public async Task<Product?> FindAsync(int id, CancellationToken ct) =>
        await cache.GetOrCreateAsync($"product:{id}", async entry => {
            entry.SlidingExpiration = TimeSpan.FromMinutes(5);
            return await inner.FindAsync(id, ct);
        });
    public Task AddAsync(Product p, CancellationToken ct) => inner.AddAsync(p, ct);
}

// With Scrutor:
builder.Services.AddScoped<IProductRepository, EfProductRepository>();
builder.Services.Decorate<IProductRepository, CachedProductRepository>();`,
    },
    {
      name: 'Options Pattern',
      badges: ['Configuration', 'DI'],
      summary: 'Binds a configuration section to a strongly-typed class, provides validated settings, and supports hot reload. The three interfaces — IOptions, IOptionsSnapshot, IOptionsMonitor — cover different lifetime scenarios.',
      code: `public class SmtpOptions {
    [Required] public string Host { get; set; } = "";
    [Range(1, 65535)] public int Port { get; set; } = 587;
    public bool UseTls { get; set; } = true;
}

// Registration
builder.Services
    .AddOptions<SmtpOptions>()
    .BindConfiguration("Smtp")
    .ValidateDataAnnotations()
    .ValidateOnStart();

// Usage
public class EmailService(IOptions<SmtpOptions> opts) {
    private readonly SmtpOptions _smtp = opts.Value;
}`,
    },
    {
      name: 'Endpoint Filter',
      badges: ['Minimal APIs', 'Cross-cutting'],
      summary: 'Filters run before and after a Minimal API endpoint handler — the middleware of routes. Use them for validation, logging, or transformation without polluting handlers.',
      code: `public class ValidationFilter<T> : IEndpointFilter
    where T : class
{
    public async ValueTask<object?> InvokeAsync(
        EndpointFilterInvocationContext ctx, EndpointFilterDelegate next)
    {
        var model = ctx.Arguments.OfType<T>().FirstOrDefault();
        if (model is null) return Results.BadRequest("No model found");

        var results = new List<ValidationResult>();
        if (!Validator.TryValidateObject(model, new(model), results, true))
            return Results.ValidationProblem(
                results.ToDictionary(r => r.MemberNames.First(), r => new[] { r.ErrorMessage! }));

        return await next(ctx);
    }
}

app.MapPost("/orders", (CreateOrderDto dto) => Results.Ok(dto))
   .AddEndpointFilter<ValidationFilter<CreateOrderDto>>();`,
    },
    {
      name: 'Pipeline Behaviour (MediatR)',
      badges: ['CQRS', 'Cross-cutting'],
      summary: 'MediatR pipeline behaviours wrap every command/query with cross-cutting logic (validation, logging, performance timing) without touching individual handlers — equivalent to middleware but scoped to MediatR dispatches.',
      code: `public class ValidationBehaviour<TRequest, TResponse>(
    IEnumerable<IValidator<TRequest>> validators)
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    public async Task<TResponse> Handle(
        TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken ct)
    {
        if (!validators.Any()) return await next();
        var ctx     = new ValidationContext<TRequest>(request);
        var results = await Task.WhenAll(validators.Select(v => v.ValidateAsync(ctx, ct)));
        var failures = results.SelectMany(r => r.Errors).Where(f => f != null).ToList();
        if (failures.Count > 0) throw new ValidationException(failures);
        return await next();
    }
}

// Register
builder.Services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehaviour<,>));`,
    },
    {
      name: 'Outbox Pattern',
      badges: ['Messaging', 'Reliability'],
      summary: 'Write domain events to an outbox table in the same transaction as the business data. A background service (outbox processor) reliably publishes them. Prevents lost events when the message broker is down.',
      code: `// Save event atomically with business data
await using var tx = await db.Database.BeginTransactionAsync();
db.Orders.Add(order);
db.OutboxMessages.Add(new OutboxMessage {
    Type    = nameof(OrderCreated),
    Payload = JsonSerializer.Serialize(new OrderCreated(order.Id)),
    OccurredAt = DateTime.UtcNow
});
await db.SaveChangesAsync();
await tx.CommitAsync();

// BackgroundService polls and publishes
var pending = await db.OutboxMessages
    .Where(m => m.ProcessedAt == null)
    .OrderBy(m => m.OccurredAt)
    .Take(50)
    .ToListAsync();

foreach (var msg in pending) {
    await bus.PublishAsync(msg.Type, msg.Payload);
    msg.ProcessedAt = DateTime.UtcNow;
}
await db.SaveChangesAsync();`,
    },
    {
      name: 'Result Pattern',
      badges: ['Error Handling', 'Domain'],
      summary: 'Return a Result<T> from service methods instead of throwing exceptions for expected failures. The caller explicitly handles success and failure cases — no accidental swallowed exceptions. Use with Minimal APIs\' Results.Problem for clean error responses.',
      code: `public class Result<T> {
    public bool IsSuccess { get; }
    public T?   Value     { get; }
    public string? Error  { get; }

    private Result(T value)           => (IsSuccess, Value) = (true, value);
    private Result(string error)      => (IsSuccess, Error) = (false, error);

    public static Result<T> Ok(T v)       => new(v);
    public static Result<T> Fail(string e) => new(e);
}

// Service
public async Task<Result<Order>> PlaceOrderAsync(int productId) {
    var product = await _repo.FindAsync(productId);
    if (product is null) return Result<Order>.Fail("Product not found");
    if (product.Stock < 1) return Result<Order>.Fail("Out of stock");
    var order = new Order(productId);
    await _repo.SaveAsync(order);
    return Result<Order>.Ok(order);
}

// Endpoint
app.MapPost("/orders/{productId}", async (int productId, IOrderService svc) => {
    var result = await svc.PlaceOrderAsync(productId);
    return result.IsSuccess ? Results.Created($"/orders/{result.Value!.Id}", result.Value)
                            : Results.Problem(result.Error, statusCode: 422);
});`,
    },
    {
      name: 'Specification Pattern',
      badges: ['Data', 'Domain'],
      summary: 'Encapsulate query criteria (Where, Include, OrderBy) in a reusable Specification object. Repository.FindAsync(new ActiveProductsSpec()) is readable and composable without polluting the repo with many Find-by-X overloads.',
      code: `public abstract class Specification<T> {
    public Expression<Func<T, bool>>? Criteria { get; protected set; }
    public List<Expression<Func<T, object>>> Includes { get; } = [];
    public Expression<Func<T, object>>? OrderBy { get; protected set; }
}

public class ActiveProductsByCategory(string category)
    : Specification<Product>
{
    public ActiveProductsByCategory(string category) {
        Criteria = p => p.IsActive && p.Category == category;
        Includes.Add(p => p.Images);
        OrderBy  = p => p.Name;
    }
}

// Repository applies the spec
public async Task<List<T>> FindAsync(Specification<T> spec) {
    IQueryable<T> q = _db.Set<T>();
    if (spec.Criteria is not null)   q = q.Where(spec.Criteria);
    foreach (var inc in spec.Includes) q = q.Include(inc);
    if (spec.OrderBy is not null)    q = q.OrderBy(spec.OrderBy);
    return await q.AsNoTracking().ToListAsync();
}`,
    },
    {
      name: 'Health Check as Adapter',
      badges: ['Operations', 'Reliability'],
      summary: 'Implement IHealthCheck for every external dependency (DB, Redis, downstream API). Expose /health/ready (all checks) and /health/live (no checks) as separate endpoints. Kubernetes uses liveness to restart pods and readiness to route traffic.',
      code: `public class StripeHealthCheck(IHttpClientFactory factory) : IHealthCheck {
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext ctx, CancellationToken ct = default)
    {
        try {
            var client  = factory.CreateClient("stripe");
            var resp    = await client.GetAsync("/v1/balance", ct);
            return resp.IsSuccessStatusCode
                ? HealthCheckResult.Healthy("Stripe API reachable.")
                : HealthCheckResult.Degraded($"Stripe returned {resp.StatusCode}.");
        }
        catch (Exception ex) {
            return HealthCheckResult.Unhealthy("Stripe unreachable.", ex);
        }
    }
}

builder.Services.AddHealthChecks()
    .AddDbContextCheck<AppDbContext>("db", tags: ["ready"])
    .AddCheck<StripeHealthCheck>("stripe", tags: ["ready"]);

app.MapHealthChecks("/health/live",  new() { Predicate = _ => false });
app.MapHealthChecks("/health/ready", new() { Predicate = c => c.Tags.Contains("ready") });`,
    },
    {
      name: 'Minimal API Module',
      badges: ['Architecture', 'Minimal APIs'],
      summary: 'Organise Minimal API routes into extension methods on IEndpointRouteBuilder. Each feature area registers its own routes — Program.cs stays clean and routes are colocated with their feature logic.',
      code: `// Features/Orders/OrderEndpoints.cs
public static class OrderEndpoints {
    public static IEndpointRouteBuilder MapOrderEndpoints(
        this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/orders")
            .RequireAuthorization()
            .WithTags("Orders");

        group.MapGet("/",      GetOrders);
        group.MapGet("/{id}", GetOrder);
        group.MapPost("/",    CreateOrder);
        group.MapDelete("/{id}", CancelOrder);
        return app;
    }

    static async Task<IResult> GetOrders(IOrderService svc)
        => TypedResults.Ok(await svc.GetAllAsync());

    static async Task<IResult> GetOrder(int id, IOrderService svc)
        => await svc.FindAsync(id) is { } order
            ? TypedResults.Ok(order)
            : TypedResults.NotFound();
}

// Program.cs
app.MapOrderEndpoints();
app.MapProductEndpoints();`,
    },
  ];
}
