import { Component } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PrerequisitesComponent, Prerequisite } from '../../../shared/prerequisites/prerequisites';

@Component({
  selector: 'app-aspnet-ef-core-basics',
  standalone: true,
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
            QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
            PageMetaComponent, PageCompleteComponent,
            CommonMistakesComponent, RevisionCardComponent, PrerequisitesComponent],
  templateUrl: './ef-core-basics.html',
  styleUrl: './ef-core-basics.scss',
})
export class AspnetEfCoreBasics {

  prerequisites: Prerequisite[] = [
    { label: 'Dependency Injection', route: '/aspnet/dependency-injection' },
    { label: 'Configuration', route: '/aspnet/configuration' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'DbContext',                   type: 'class',   desc: 'Unit of work — tracks entities and coordinates saves to the database' },
    { name: 'DbSet<T>',                   type: 'class',   desc: 'Repository for entity T — queried with LINQ, returns IQueryable<T>' },
    { name: 'OnModelCreating()',           type: 'method',  desc: 'Configure the model with Fluent API inside the DbContext' },
    { name: 'SaveChangesAsync()',          type: 'method',  desc: 'Flush all tracked changes to the database in a single transaction' },
    { name: 'Add() / Update() / Remove()', type: 'method', desc: 'Mark an entity as Added/Modified/Deleted in the change tracker' },
    { name: 'Find() / FindAsync()',        type: 'method',  desc: 'PK lookup — checks the tracker first, then hits the DB' },
    { name: 'AsNoTracking()',              type: 'method',  desc: 'Returns entities without attaching them — faster for read-only queries' },
    { name: 'AsNoTrackingWithIdentityResolution()', type: 'method', desc: 'AsNoTracking but deduplicates related entities in memory' },
    { name: 'ChangeTracker.Clear()',       type: 'method',  desc: 'Detaches all tracked entities — resets context state' },
    { name: 'dotnet ef migrations add',    type: 'keyword', desc: 'Scaffold a migration from the current model diff' },
    { name: 'dotnet ef database update',   type: 'keyword', desc: 'Apply pending migrations to the target database' },
    { name: 'dotnet ef migrations script', type: 'keyword', desc: 'Generate idempotent SQL for production deployments' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'DbContext — the Unit of Work',
      points: [
        'A <code>DbContext</code> subclass is the central object in EF Core. It exposes <code>DbSet&lt;T&gt;</code> properties for each entity and tracks all changes made to those objects within its lifetime.',
        'Register with <code>builder.Services.AddDbContext&lt;AppDbContext&gt;(options =&gt; options.UseSqlServer(connectionString))</code>. Lifetime is <strong>Scoped</strong> by default — one instance per HTTP request, disposed at request end.',
        'Never inject DbContext into a <strong>Singleton</strong> service — the singleton outlives the context and causes a captive dependency bug. Use <code>IDbContextFactory&lt;T&gt;</code> or <code>IServiceScopeFactory</code> in singletons.',
        'EF Core providers map to different databases: <code>UseSqlServer</code>, <code>UseNpgsql</code> (PostgreSQL), <code>UseSqlite</code> (great for tests/dev), <code>UseInMemoryDatabase</code> (unit tests only — no real SQL semantics or transactions).',
        'Override <code>OnModelCreating(ModelBuilder)</code> to configure entities with the Fluent API — constraints, column types, indexes, relationships. Prefer Fluent API over Data Annotations for complex configurations.',
        'Call <code>context.ChangeTracker.Clear()</code> (EF Core 5+) to detach all tracked entities and reset the context state without disposing it — useful in background service loops.',
      ],
    },
    {
      heading: 'Querying with LINQ',
      points: [
        '<code>DbSet&lt;T&gt;</code> implements <code>IQueryable&lt;T&gt;</code> — LINQ queries are translated to SQL and executed on the database, not in memory. Call <code>ToListAsync()</code>, <code>FirstOrDefaultAsync()</code>, or <code>SingleAsync()</code> to materialise results.',
        'EF Core uses <strong>deferred execution</strong> — building a query (<code>Where</code>, <code>OrderBy</code>, <code>Select</code>) does not hit the database until a materialising call. This lets you compose queries in layers across service methods.',
        'Always use <code>cancellationToken</code> parameters in web apps: <code>ToListAsync(ct)</code>, <code>SaveChangesAsync(ct)</code> — this allows ASP.NET Core to cancel the database operation if the client disconnects.',
        'Project to DTOs with <code>Select()</code> to avoid over-fetching — return only the columns you need. Fetching entire entity graphs when you only display 2 fields wastes DB and network bandwidth.',
        '<code>AnyAsync(predicate)</code> is more efficient than <code>CountAsync() &gt; 0</code> when you only need a boolean — it short-circuits at the first match. <code>CountAsync()</code> scans the full result set.',
        'Split complex queries with <code>AsSplitQuery()</code> (EF Core 5+) when joining many related collections — this avoids the Cartesian explosion that occurs when using a single query with multiple <code>Include</code> collections.',
      ],
    },
    {
      heading: 'Change Tracking & SaveChanges',
      points: [
        'When you query entities without <code>AsNoTracking()</code>, EF Core takes a snapshot of their original values. Mutating properties sets the entity state to <code>Modified</code>. <code>SaveChangesAsync()</code> generates the minimal UPDATE SQL for only changed properties.',
        '<code>context.Add(entity)</code> marks the entity (and reachable graph) as <code>Added</code> — INSERT on save. <code>context.Remove(entity)</code> marks it <code>Deleted</code>. <code>context.Update(entity)</code> marks ALL scalar properties <code>Modified</code> — avoid for partial updates.',
        'For <strong>detached update patterns</strong> (entity from a different scope or deserialized from a request body), prefer loading from the DB first and updating only the required properties — prevents accidental overwrites of fields you didn\'t intend to change.',
        '<code>context.Attach(entity)</code> starts tracking without marking anything Modified — follow with explicit property state changes: <code>context.Entry(entity).Property(p => p.Price).IsModified = true</code>.',
        '<code>SaveChangesAsync()</code> wraps all changes in a single implicit transaction. For explicit multi-step transactions, use <code>await using var tx = await db.Database.BeginTransactionAsync()</code>.',
        'Avoid calling <code>SaveChangesAsync()</code> in a loop — batch all changes first and call it once. Each <code>SaveChangesAsync()</code> call is a round trip to the database.',
      ],
    },
    {
      heading: 'Migrations',
      points: [
        'Migrations capture schema changes as incremental C# scripts. <code>dotnet ef migrations add &lt;Name&gt;</code> scaffolds a migration from the current model diff. <code>dotnet ef database update</code> applies pending migrations to the database.',
        'In production, <strong>never</strong> call <code>Database.MigrateAsync()</code> at app startup unless you understand the risks — table locks on large tables during migration, race conditions with parallel pod deployments.',
        '<code>dotnet ef migrations script --idempotent</code> generates SQL that is safe to re-run — it checks which migrations have already been applied and skips them. Ideal for CI/CD pipelines and audit trails.',
        'Keep migrations small and focused. A migration that adds a column, backfills it, and then makes it NOT NULL should be split into three separate migrations to avoid locking the table during the backfill on large datasets.',
        '<code>dotnet ef dbcontext scaffold "connection-string" Microsoft.EntityFrameworkCore.SqlServer -o Models</code> reverse-engineers a DbContext from an existing database — useful when adopting EF Core on a legacy schema.',
        'Always review generated migration code before applying it. EF Core may generate destructive operations (DROP COLUMN) that look identical to a rename from its model-diff perspective.',
      ],
    },
    {
      heading: 'Performance Essentials',
      points: [
        'Use <code>AsNoTracking()</code> on all read-only queries. The change tracker takes memory and CPU to maintain snapshots — turning it off for read-only paths provides measurable throughput gains under load.',
        '<code>AsNoTrackingWithIdentityResolution()</code> (EF Core 5+) is like <code>AsNoTracking()</code> but still deduplicates related entities in memory — useful when navigations can produce duplicates in a no-tracking query.',
        'Avoid <code>Count()</code> for existence checks — use <code>AnyAsync()</code>. Avoid <code>ToList().Count</code> — use <code>CountAsync()</code> directly on the query.',
        'Use compiled queries (<code>EF.CompileAsyncQuery</code>) for hot-path queries that run thousands of times per second — query translation is cached once at startup instead of per-call.',
        'Avoid loading the entire graph when you only need navigation IDs. Use <code>Select()</code> to project, or query the foreign key directly with <code>.Select(o => o.CustomerId)</code>.',
        'Monitor SQL output during development with <code>options.LogTo(Console.WriteLine)</code> or Serilog/OpenTelemetry integration — many performance bugs are invisible until you see the generated SQL.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'DbContext Setup',
      language: 'csharp',
      code: `// Entity
public class Product
{
    public int     Id       { get; set; }
    public string  Name     { get; set; } = "";
    public decimal Price    { get; set; }
    public bool    IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
}

// DbContext
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Product> Products { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Product>(e =>
        {
            e.HasKey(p => p.Id);
            e.Property(p => p.Name).IsRequired().HasMaxLength(200);
            e.Property(p => p.Price).HasColumnType("decimal(18,2)");
            e.HasIndex(p => p.IsActive);   // speed up filtering by active status
            e.Property(p => p.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
        });
    }
}

// Registration
builder.Services.AddDbContext<AppDbContext>(opts =>
    opts.UseSqlServer(
        builder.Configuration.GetConnectionString("Default"),
        sql => sql.CommandTimeout(30)));`,
    },
    {
      label: 'CRUD Operations',
      language: 'csharp',
      code: `public class ProductService(AppDbContext db)
{
    // Read — AsNoTracking for read-only queries
    public Task<List<Product>> GetActiveAsync(CancellationToken ct)
        => db.Products
             .Where(p => p.IsActive)
             .OrderBy(p => p.Name)
             .Select(p => new Product { Id = p.Id, Name = p.Name, Price = p.Price })
             .AsNoTracking()
             .ToListAsync(ct);

    // PK lookup — checks change tracker first, then DB
    public ValueTask<Product?> GetByIdAsync(int id, CancellationToken ct)
        => db.Products.FindAsync([id], ct);

    // Create
    public async Task<Product> CreateAsync(Product product, CancellationToken ct)
    {
        db.Products.Add(product);
        await db.SaveChangesAsync(ct);   // Id populated after save
        return product;
    }

    // Update — load-then-modify (safe for partial updates)
    public async Task UpdatePriceAsync(int id, decimal newPrice, CancellationToken ct)
    {
        var product = await db.Products.FindAsync([id], ct)
            ?? throw new KeyNotFoundException();
        product.Price = newPrice;
        await db.SaveChangesAsync(ct);   // only Price column in UPDATE
    }

    // Delete
    public async Task DeleteAsync(int id, CancellationToken ct)
    {
        var product = await db.Products.FindAsync([id], ct)
            ?? throw new KeyNotFoundException();
        db.Products.Remove(product);
        await db.SaveChangesAsync(ct);
    }
}`,
    },
    {
      label: 'Querying & Filtering',
      language: 'csharp',
      code: `// LINQ → SQL — no in-memory filtering
var expensiveProducts = await db.Products
    .Where(p => p.Price > 100 && p.IsActive)
    .OrderByDescending(p => p.Price)
    .Select(p => new { p.Id, p.Name, p.Price })   // project to avoid over-fetch
    .AsNoTracking()
    .ToListAsync(ct);

// Pagination (keyset preferred over offset for large tables)
int page = 2, pageSize = 20;
var paged = await db.Products
    .Where(p => p.IsActive)
    .OrderBy(p => p.Name)
    .Skip((page - 1) * pageSize)
    .Take(pageSize)
    .AsNoTracking()
    .ToListAsync(ct);

// Existence — AnyAsync is faster than CountAsync() > 0
bool hasActive = await db.Products.AnyAsync(p => p.IsActive, ct);

// Count without loading
int total = await db.Products.CountAsync(p => p.IsActive, ct);

// Enable SQL logging in development
optionsBuilder.LogTo(Console.WriteLine, LogLevel.Information)
              .EnableSensitiveDataLogging();`,
    },
    {
      label: 'Change Tracking',
      language: 'csharp',
      code: `// Explicit transaction across multiple saves
await using var tx = await db.Database.BeginTransactionAsync(ct);
try
{
    var order = new Order { CustomerId = 1 };
    db.Orders.Add(order);
    await db.SaveChangesAsync(ct);

    var item = new OrderItem { OrderId = order.Id, ProductId = 42, Qty = 2 };
    db.OrderItems.Add(item);
    await db.SaveChangesAsync(ct);

    await tx.CommitAsync(ct);
}
catch
{
    await tx.RollbackAsync(ct);
    throw;
}

// Attach + selective property modification (detached entity pattern)
db.Attach(product);
db.Entry(product).Property(p => p.Price).IsModified = true;
await db.SaveChangesAsync(ct);   // UPDATE Products SET Price=... WHERE Id=...

// Clear change tracker in a long-running background loop
while (!stoppingToken.IsCancellationRequested)
{
    await ProcessBatchAsync(ct);
    db.ChangeTracker.Clear();    // detach processed entities
}`,
    },
    {
      label: 'Migrations',
      language: 'csharp',
      code: `// Install the EF Core CLI tool:
// dotnet tool install --global dotnet-ef

// Scaffold initial migration
// dotnet ef migrations add InitialCreate --project MyApp

// Apply to database
// dotnet ef database update

// Generate idempotent SQL (safe for production — checks which are applied)
// dotnet ef migrations script --idempotent --output deploy/migrate.sql

// Remove the last unapplied migration
// dotnet ef migrations remove

// Reverse-engineer from existing database
// dotnet ef dbcontext scaffold "connection-string" Microsoft.EntityFrameworkCore.SqlServer -o Models

// Apply programmatically — DEV / integration tests ONLY
using (var scope = app.Services.CreateScope())
    await scope.ServiceProvider
               .GetRequiredService<AppDbContext>()
               .Database.MigrateAsync();
// ❌ NEVER do this in production at startup — use deployment scripts`,
    },
  ];

  challenge: Challenge = {
    title: 'Product Catalog CRUD',
    language: 'csharp',
    description: 'Build a minimal Product Catalog API with EF Core. Requirements: (1) Define a Product entity (Id, Name, Description, Price, Category). (2) Create an AppDbContext with a Products DbSet. (3) Register with SQLite ("Data Source=catalog.db"). (4) Implement 4 minimal API endpoints: GET /products (list all, AsNoTracking), GET /products/{id}, POST /products, DELETE /products/{id}. (5) Use SaveChangesAsync with cancellation tokens.',
    hints: [
      'Register DbContext: builder.Services.AddDbContext<AppDbContext>(o => o.UseSqlite("Data Source=catalog.db"))',
      'Call Database.EnsureCreatedAsync() in development instead of migrations for simple demos',
      'AsNoTracking() on read-only queries avoids snapshot overhead',
      'FindAsync([id], ct) checks the change tracker first — more efficient than FirstOrDefault for PK lookups',
    ],
    starterCode: `var builder = WebApplication.CreateBuilder(args);

// TODO: register AppDbContext with SQLite

var app = builder.Build();

// TODO: GET /products — list all products (AsNoTracking)
// TODO: GET /products/{id} — return product or 404
// TODO: POST /products — create from body, return 201
// TODO: DELETE /products/{id} — remove or 404

app.Run();

// TODO: Product entity (Id, Name, Description, Price, Category)
// TODO: AppDbContext with Products DbSet`,
    solution: `var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(o =>
    o.UseSqlite("Data Source=catalog.db"));

var app = builder.Build();

// Ensure DB exists (dev shortcut — use migrations in production)
using (var scope = app.Services.CreateScope())
    await scope.ServiceProvider.GetRequiredService<AppDbContext>()
               .Database.EnsureCreatedAsync();

app.MapGet("/products", async (AppDbContext db, CancellationToken ct) =>
    await db.Products.AsNoTracking().ToListAsync(ct));

app.MapGet("/products/{id:int}", async (int id, AppDbContext db, CancellationToken ct) =>
{
    var p = await db.Products.FindAsync([id], ct);
    return p is null ? Results.NotFound() : Results.Ok(p);
});

app.MapPost("/products", async (Product product, AppDbContext db, CancellationToken ct) =>
{
    db.Products.Add(product);
    await db.SaveChangesAsync(ct);
    return Results.Created(\`/products/\${product.Id}\`, product);
});

app.MapDelete("/products/{id:int}", async (int id, AppDbContext db, CancellationToken ct) =>
{
    var p = await db.Products.FindAsync([id], ct);
    if (p is null) return Results.NotFound();
    db.Products.Remove(p);
    await db.SaveChangesAsync(ct);
    return Results.NoContent();
});

app.Run();

public class Product
{
    public int     Id          { get; set; }
    public string  Name        { get; set; } = "";
    public string  Description { get; set; } = "";
    public decimal Price       { get; set; }
    public string  Category    { get; set; } = "";
}

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Product> Products { get; set; }
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the default lifetime of DbContext registered with AddDbContext<T>()?',
      options: ['Transient', 'Scoped', 'Singleton', 'Per-request (custom)'],
      answer: 1,
      explanation: 'DbContext is Scoped — one instance per HTTP request (or per DI scope). This is intentional: the context tracks entities for the duration of a request and is disposed at the end.',
    },
    {
      q: 'What does AsNoTracking() do?',
      options: [
        'Disables SQL query logging',
        'Returns entities without attaching them to the change tracker — faster for read-only operations',
        'Prevents the query from being cached',
        'Marks all returned entities as Deleted',
      ],
      answer: 1,
      explanation: 'Without AsNoTracking(), EF Core takes identity snapshots of every returned entity. AsNoTracking() skips this overhead — beneficial for read-only queries where SaveChanges() will not be called.',
    },
    {
      q: 'When should you run migrations at app startup with Database.MigrateAsync()?',
      options: [
        'Always — it is the recommended approach',
        'Only in development and integration test environments',
        'Only in production',
        'Never — use the CLI only',
      ],
      answer: 1,
      explanation: 'Running MigrateAsync() on startup is convenient for local dev and integration tests, but risky in production — table locks on large tables and race conditions during parallel pod deploys. Use idempotent SQL scripts in production.',
    },
    {
      q: 'Which approach is safer for updating a specific field on a detached entity?',
      options: [
        'context.Update(entity) — marks all fields Modified',
        'Load the entity from the DB, set the field, then SaveChangesAsync()',
        'context.Attach(entity) followed by context.Update()',
        'Delete and re-insert the entity',
      ],
      answer: 1,
      explanation: 'context.Update(entity) marks ALL scalar properties Modified — it overwrites every field and can clobber data written by concurrent requests. Loading first ensures only the changed property is in the UPDATE statement.',
    },
    {
      q: 'Why is LINQ deferred execution important in EF Core?',
      options: [
        'It avoids running any SQL at all',
        'It lets you compose queries incrementally — SQL is generated only when materialised',
        'It caches query results automatically',
        'It prevents N+1 query problems',
      ],
      answer: 1,
      explanation: 'Building a LINQ query constructs an expression tree — no SQL runs until ToListAsync() or FirstOrDefaultAsync() is called. This lets service layers compose queries from multiple conditions without extra round trips.',
    },
    {
      q: 'Why is AnyAsync() preferred over CountAsync() > 0 for existence checks?',
      options: [
        'AnyAsync returns a string, CountAsync returns an int',
        'AnyAsync short-circuits at the first match; CountAsync scans the full result set',
        'AnyAsync uses a different SQL operator that is faster on indexed columns',
        'CountAsync does not work with nullable columns',
      ],
      answer: 1,
      explanation: 'AnyAsync() generates SELECT TOP 1 1 WHERE ... and stops as soon as one row is found. CountAsync() generates COUNT(*) which must scan every matching row. For large tables the difference is significant.',
    },
    {
      q: 'What does SaveChangesAsync() do with multiple tracked entity changes?',
      options: [
        'Saves each entity in a separate transaction',
        'Wraps all changes in a single implicit database transaction',
        'Only saves the last changed entity',
        'Calls the database once per changed property',
      ],
      answer: 1,
      explanation: 'SaveChangesAsync() wraps ALL pending changes (INSERT, UPDATE, DELETE) in a single database transaction. Either all succeed together, or all roll back together.',
    },
    {
      q: 'Which CLI command generates SQL that is safe to re-run against a production database?',
      options: [
        'dotnet ef database update',
        'dotnet ef migrations script --idempotent',
        'dotnet ef migrations apply',
        'dotnet ef migrations run --safe',
      ],
      answer: 1,
      explanation: 'dotnet ef migrations script --idempotent generates SQL that checks the __EFMigrationsHistory table and only applies migrations that have not yet been run. Safe to run multiple times without duplicating changes.',
    },
    {
      q: 'What problem occurs when you inject DbContext into a Singleton service?',
      options: [
        'The context is never disposed — memory leak',
        'Captive dependency — the Singleton outlives the Scoped DbContext; the context is used after disposal',
        'Concurrent requests share the same context — race conditions in the change tracker',
        'All of the above',
      ],
      answer: 3,
      explanation: 'All three are real consequences. The Scoped DbContext injected into a Singleton is captured for the Singleton lifetime. It may be disposed and reused, change tracker state leaks between requests, and concurrent access to EF Core change tracker is not thread-safe.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between Add() and Attach() in EF Core?',
      a: 'Add(entity) marks the entity and its reachable navigation graph as Added — EF Core will INSERT all of them on SaveChanges. Attach(entity) marks the entity as Unchanged — EF Core starts tracking it without planning any SQL. Use Attach when you have a fully populated entity you want to start tracking to then explicitly mark some properties Modified.',
    },
    {
      q: 'How do I reset/clear tracked entities without disposing the context?',
      a: 'Call context.ChangeTracker.Clear() (EF Core 5+). This detaches all tracked entities, giving the context a clean state. Useful in background service loops where you reuse the context across iterations to prevent unbounded memory growth from accumulated tracked entities.',
    },
    {
      q: 'What is the N+1 query problem and how does EF Core trigger it?',
      a: 'N+1 happens when you load a list of N entities and then access a navigation property on each one in a loop — each access fires a separate lazy-load query. EF Core disables lazy loading by default, so the navigation property is null until you Include() it. Enable UseLazyLoadingProxies() deliberately only when you understand the N+1 implications.',
    },
    {
      q: 'Can I use EF Core outside of ASP.NET Core (e.g., in a console app)?',
      a: 'Yes. Override OnConfiguring(DbContextOptionsBuilder) in your DbContext to configure the provider directly. Or use a HostBuilder to set up DI and IConfiguration exactly like ASP.NET Core — the EF Core packages have no ASP.NET Core dependency.',
    },
    {
      q: 'How do I use EF Core with multiple databases or schemas?',
      a: 'Register multiple DbContext subclasses — each with its own connection string or provider. For separate schemas in one database, set the default schema in OnModelCreating: modelBuilder.HasDefaultSchema("reporting"). You can also apply schema per entity with .ToTable("Orders", schema: "sales").',
    },
    {
      q: 'What is the difference between UseInMemoryDatabase and UseSqlite for testing?',
      a: 'UseInMemoryDatabase has no real SQL semantics — no transactions, no constraints, no concurrent access. UseSqlite(:memory:) is a real SQLite database with full SQL support, constraints, and transactions. Prefer SQLite for integration tests that need real SQL behavior.',
    },
    {
      q: 'How should I handle concurrency conflicts in EF Core?',
      a: 'Add a [Timestamp] / byte[] RowVersion property to your entity and configure it with .IsRowVersion() or .IsConcurrencyToken(). When two requests update the same row, the second SaveChanges() throws DbUpdateConcurrencyException. Catch it and decide: reload + retry, or return 409 Conflict to the caller.',
    },
    {
      q: 'Why should I avoid calling SaveChangesAsync() in a loop?',
      a: 'Each SaveChangesAsync() call is a round trip to the database. Calling it N times for N entities is N round trips. Instead, add all entities first (db.Products.AddRange(products)) and call SaveChangesAsync() once — EF Core batches the INSERTs into fewer commands depending on the provider.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Injecting DbContext into a Singleton service',
      wrong: `public class MyCache : IMyCache
{
    private readonly AppDbContext _db;
    public MyCache(AppDbContext db) => _db = db; // ❌ Singleton capturing Scoped
}

builder.Services.AddSingleton<IMyCache, MyCache>();`,
      right: `public class MyCache(IDbContextFactory<AppDbContext> factory) : IMyCache
{
    public async Task RefreshAsync(CancellationToken ct)
    {
        await using var db = await factory.CreateDbContextAsync(ct); // ✓ own scope
        var data = await db.Products.AsNoTracking().ToListAsync(ct);
        // ...
    }
}

builder.Services.AddDbContextFactory<AppDbContext>(...);
builder.Services.AddSingleton<IMyCache, MyCache>();`,
      explanation: 'DbContext is Scoped — injecting it into a Singleton causes it to be shared across requests and used after disposal. Use IDbContextFactory<T> in Singletons to create a fresh context per operation.',
    },
    {
      title: 'Using context.Update() for partial updates',
      wrong: `// PATCH /products/{id} — client sends only { "price": 99.99 }
var dto = await req.ReadFromJsonAsync<UpdateProductDto>();
var product = new Product { Id = id, Price = dto.Price };
db.Update(product);   // ❌ marks ALL columns Modified — Name/Category get overwritten`,
      right: `// Load from DB, then update only the changed field
var product = await db.Products.FindAsync([id], ct)
    ?? throw new NotFoundException();
product.Price = dto.Price;   // only Price is Modified
await db.SaveChangesAsync(ct); // UPDATE Products SET Price=... WHERE Id=...`,
      explanation: 'context.Update(entity) marks every scalar property as Modified and overwrites all columns — including ones the client did not send. Load-then-modify ensures only changed properties appear in the UPDATE statement.',
    },
    {
      title: 'Calling SaveChangesAsync() inside a loop',
      wrong: `foreach (var dto in importedProducts)
{
    db.Products.Add(new Product { Name = dto.Name, Price = dto.Price });
    await db.SaveChangesAsync(ct);   // ❌ — N database round trips
}`,
      right: `var products = importedProducts
    .Select(dto => new Product { Name = dto.Name, Price = dto.Price })
    .ToList();
db.Products.AddRange(products);
await db.SaveChangesAsync(ct);   // ✓ — 1 round trip, batched INSERTs`,
      explanation: 'Each SaveChangesAsync() is a database round trip. For bulk inserts, add all entities first with AddRange() and call SaveChangesAsync() once — EF Core batches the statements into fewer commands.',
    },
    {
      title: 'Running Database.MigrateAsync() on startup in production',
      wrong: `// Program.cs — production app
var app = builder.Build();
using var scope = app.Services.CreateScope();
await scope.ServiceProvider.GetRequiredService<AppDbContext>()
           .Database.MigrateAsync();   // ❌ — table locks, deploy race conditions`,
      right: `// In production: generate idempotent SQL and run in deployment pipeline
// dotnet ef migrations script --idempotent --output deploy/migrate.sql

// In development/tests only:
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    await scope.ServiceProvider.GetRequiredService<AppDbContext>()
               .Database.MigrateAsync();   // ✓ dev-only
}`,
      explanation: 'Running migrations at startup in production causes exclusive table locks on large tables and race conditions when multiple pods start simultaneously. Generate an idempotent SQL script and run it as a separate deployment step.',
    },
    {
      title: 'Forgetting AsNoTracking() on read-only queries',
      wrong: `// GET /products — read-only list endpoint
var products = await db.Products
    .Where(p => p.IsActive)
    .ToListAsync(ct);   // ❌ change tracker snapshots every entity`,
      right: `var products = await db.Products
    .Where(p => p.IsActive)
    .AsNoTracking()     // ✓ no snapshot overhead
    .ToListAsync(ct);`,
      explanation: 'Without AsNoTracking(), EF Core stores a snapshot of every returned entity\'s original values in the change tracker. For read-only endpoints that will never call SaveChanges(), this wastes memory and CPU. Always add AsNoTracking() to read-only queries.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'EF Core is an ORM that maps C# entities to database tables via a DbContext (Unit of Work + IQueryable), with LINQ-to-SQL query translation, change tracking, and migration-based schema evolution.',
    mustKnow: [
      'DbContext is Scoped — one per request; never inject into Singleton (use IDbContextFactory instead)',
      'AsNoTracking() on read-only queries skips change-tracker snapshot overhead',
      'Load-then-modify is safer than context.Update() for partial updates — Update() marks ALL columns Modified',
      'SaveChangesAsync() wraps all tracked changes in a single implicit transaction',
      'LINQ uses deferred execution — SQL runs only when materialised by ToListAsync(), FirstOrDefaultAsync(), etc.',
      'AnyAsync() is faster than CountAsync() > 0 — short-circuits at first match',
      'Never call SaveChangesAsync() in a loop — use AddRange() and save once',
    ],
    interviewFocus: [
      'What is the default DbContext lifetime and why should it never be Singleton?',
      'When would you use AsNoTracking() and what does it trade off?',
      'What is the danger of context.Update() for partial updates?',
      'What is the difference between Database.MigrateAsync() and idempotent migration scripts for production?',
      'How does EF Core handle concurrency conflicts?',
    ],
  };
}
