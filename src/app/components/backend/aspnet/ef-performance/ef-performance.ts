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
  selector: 'app-aspnet-ef-performance',
  standalone: true,
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
            QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
            PageMetaComponent, PageCompleteComponent],
  templateUrl: './ef-performance.html',
  styleUrl: './ef-performance.scss',
})
export class AspnetEfPerformance {

  quickRef: QuickRefItem[] = [
    { name: 'AsNoTracking()',              type: 'method',  desc: 'Skip change-tracker snapshot — essential for all read-only queries' },
    { name: 'AsSplitQuery()',              type: 'method',  desc: 'Splits multi-collection Include into separate SELECTs — avoids cartesian explosion' },
    { name: 'EF.CompileQuery()',           type: 'method',  desc: 'Pre-compiles LINQ to SQL at startup — eliminates translation overhead per call' },
    { name: 'ExecuteDeleteAsync()',        type: 'method',  desc: 'EF Core 7+ bulk DELETE without loading entities into memory' },
    { name: 'ExecuteUpdateAsync()',        type: 'method',  desc: 'EF Core 7+ bulk UPDATE without loading entities into memory' },
    { name: 'FromSqlRaw()',               type: 'method',  desc: 'Execute raw SQL and map results — useful for complex queries EF cannot translate' },
    { name: 'ExecuteSqlRawAsync()',        type: 'method',  desc: 'Execute non-query raw SQL (INSERT/UPDATE/DELETE stored procs)' },
    { name: 'AddDbContextPool<T>()',       type: 'method',  desc: 'Pool DbContext instances — reduces allocation cost under high load' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'The Three Biggest EF Core Performance Wins',
      points: [
        '<strong>1. AsNoTracking() everywhere you read.</strong> The change tracker snapshots every entity returned from a tracked query. For list endpoints that never call SaveChanges(), this overhead is pure waste. Add AsNoTracking() or use AsNoTrackingWithIdentityResolution() when you Include() navigations and need deduplication.',
        '<strong>2. Project with Select() instead of loading full entities.</strong> <code>Select(p => new { p.Id, p.Name })</code> generates a <code>SELECT id, name</code> — not <code>SELECT *</code>. Smaller result sets, less memory, less network. Especially impactful with wide tables or eager loading.',
        '<strong>3. Avoid the N+1 pattern.</strong> Include() related data upfront or use split queries — never access navigation properties inside a loop without loading them first. Use EF Core\'s query logging or MiniProfiler to catch N+1 in development.',
      ],
    },
    {
      heading: 'Bulk Operations (EF Core 7+)',
      points: [
        '<code>ExecuteDeleteAsync()</code> and <code>ExecuteUpdateAsync()</code> generate single SQL DELETE/UPDATE statements without loading entities. For "soft delete all expired records" operations, this is 100× faster than load-loop-save.',
        'These methods bypass the change tracker entirely — <code>SaveChangesAsync()</code> is not needed or called. They also bypass any interceptors or entity events that hook into the change tracker.',
        'Bulk operations work on <code>IQueryable&lt;T&gt;</code> — compose the WHERE clause with LINQ first, then call <code>ExecuteDeleteAsync()</code>. EF Core translates it all into one SQL statement.',
      ],
    },
    {
      heading: 'Raw SQL & Compiled Queries',
      points: [
        '<code>FromSqlRaw()</code> lets you write raw SQL that returns entities — useful for complex queries, full-text search, or CTEs that EF Core cannot translate. The result is still tracked (add AsNoTracking() for reads) and you can chain LINQ on top: <code>.FromSqlRaw(...).Where(p => p.IsActive)</code>.',
        'Always use <code>FromSqlInterpolated()</code> or parameterised raw SQL for user input — <strong>never</strong> string-concatenate user input into SQL. EF Core parameterises interpolated strings automatically.',
        '<code>EF.CompileQuery()</code> compiles a LINQ expression at startup, eliminating the LINQ-to-SQL translation cost on every call. Beneficial for high-frequency queries — a typical translation costs 1–5 ms per query.',
      ],
    },
    {
      heading: 'DbContext Pooling & Connection Reuse',
      points: [
        '<code>AddDbContextPool&lt;T&gt;()</code> keeps a pool of DbContext instances and reuses them between requests instead of constructing and disposing on every request. Reduces allocations significantly under high throughput.',
        'Pooled contexts have constraints: they cannot store state (no extra fields that would persist between requests), constructor parameters must be deterministic from DI, and <code>OnConfiguring</code> is only called once.',
        'For connection-level pooling (not DbContext-level), use the built-in ADO.NET connection pool or <code>pgbouncer</code> for PostgreSQL. EF Core opens and closes connections per operation unless you explicitly open them yourself — the pool handles socket reuse beneath.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'AsNoTracking + Projection',
      language: 'csharp',
      code: `// Bad: loads all columns, snapshots all entities
var products = await db.Products.ToListAsync(ct);

// Better: read-only, skip change tracker
var products = await db.Products.AsNoTracking().ToListAsync(ct);

// Best: project to a DTO — SELECT id, name, price only
record ProductDto(int Id, string Name, decimal Price);

var products = await db.Products
    .Where(p => p.IsActive)
    .OrderBy(p => p.Name)
    .Select(p => new ProductDto(p.Id, p.Name, p.Price))
    .AsNoTracking()
    .ToListAsync(ct);

// Pagination (always paginate large tables)
var page     = 1;
var pageSize = 20;
var paged = await db.Products
    .Where(p => p.IsActive)
    .OrderBy(p => p.Id)           // stable sort for pagination
    .Skip((page - 1) * pageSize)
    .Take(pageSize)
    .Select(p => new ProductDto(p.Id, p.Name, p.Price))
    .AsNoTracking()
    .ToListAsync(ct);`,
    },
    {
      label: 'Bulk Operations (EF 7+)',
      language: 'csharp',
      code: `// Bulk DELETE — no entity loading, single SQL DELETE
await db.Products
    .Where(p => !p.IsActive && p.UpdatedAt < DateTime.UtcNow.AddMonths(-6))
    .ExecuteDeleteAsync(ct);

// Bulk UPDATE — no entity loading, single SQL UPDATE
await db.Products
    .Where(p => p.CategoryId == oldCategoryId)
    .ExecuteUpdateAsync(setters =>
        setters.SetProperty(p => p.CategoryId, newCategoryId)
               .SetProperty(p => p.UpdatedAt, DateTime.UtcNow),
        ct);

// Compare with the load-loop-save anti-pattern (O(N) queries):
// var products = await db.Products.Where(...).ToListAsync();
// foreach (var p in products) p.CategoryId = newCategoryId;
// await db.SaveChangesAsync();
// ↑ This is N+2 round trips; ExecuteUpdateAsync is 1.`,
    },
    {
      label: 'Compiled Queries',
      language: 'csharp',
      code: `// Define compiled queries at class or static level — compiled once at startup
private static readonly Func<AppDbContext, int, Task<Product?>> GetProductById =
    EF.CompileAsyncQuery((AppDbContext db, int id) =>
        db.Products.AsNoTracking().FirstOrDefault(p => p.Id == id));

private static readonly Func<AppDbContext, bool, IAsyncEnumerable<Product>> GetByStatus =
    EF.CompileAsyncQuery((AppDbContext db, bool active) =>
        db.Products.Where(p => p.IsActive == active).AsNoTracking());

// Usage in a service
public Task<Product?> GetAsync(int id, CancellationToken ct)
    => GetProductById(db, id);

public async Task<List<Product>> GetActiveAsync(CancellationToken ct)
{
    var results = new List<Product>();
    await foreach (var p in GetByStatus(db, true).WithCancellation(ct))
        results.Add(p);
    return results;
}`,
    },
    {
      label: 'Raw SQL',
      language: 'csharp',
      code: `// FromSqlInterpolated — parameters are automatically safe (no injection)
int minStock = 10;
var lowStock = await db.Products
    .FromSqlInterpolated(\$"SELECT * FROM Products WHERE Stock < {minStock}")
    .AsNoTracking()
    .ToListAsync(ct);

// FromSqlRaw with explicit parameters
var param = new SqlParameter("@min", minStock);
var lowStock = await db.Products
    .FromSqlRaw("SELECT * FROM Products WHERE Stock < @min", param)
    .AsNoTracking()
    .ToListAsync(ct);

// NEVER do this — SQL injection risk:
// .FromSqlRaw(\$"SELECT * FROM Products WHERE Stock < {userInput}") ← WRONG

// ExecuteSqlRawAsync — non-query (no result mapping)
await db.Database.ExecuteSqlRawAsync(
    "EXEC dbo.CleanupExpiredSessions @before",
    new SqlParameter("@before", DateTime.UtcNow.AddDays(-30)),
    ct);`,
    },
    {
      label: 'DbContext Pool + Split Query',
      language: 'csharp',
      code: `// DbContext pooling — reuse instances between requests
builder.Services.AddDbContextPool<AppDbContext>(opts =>
    opts.UseSqlServer(connectionString), poolSize: 128);

// ──────────────────────────────────────────────────────────────────
// AsSplitQuery — avoids cartesian explosion with multiple Includes

// Without AsSplitQuery: one JOIN → cartesian product
// 100 orders × 10 items × 3 properties = 3,000 rows in result set

var orders = await db.Orders
    .Include(o => o.Items)
        .ThenInclude(i => i.Product)
    .Include(o => o.Tags)
    .AsSplitQuery()        // ← runs 3 separate SELECTs instead of 1 big JOIN
    .AsNoTracking()
    .ToListAsync(ct);

// Set globally to split all queries with multiple collection includes:
opts.UseSqlServer(cs)
    .UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery);`,
    },
  ];

  challenge: Challenge = {
    title: 'Optimise a Slow Products Endpoint',
    language: 'csharp',
    description: 'You have been given a slow endpoint that loads all products. Optimise it using EF Core best practices. Requirements: (1) The original endpoint loads all entities with tracked queries — fix it. (2) Add pagination (page + pageSize query params). (3) Project to a DTO (ProductSummary: Id, Name, Price, CategoryName) — join to Category. (4) Add a bulk-deactivate endpoint: POST /products/deactivate-old — deactivates products not updated in the last 90 days using ExecuteUpdateAsync.',
    hints: [
      'AsNoTracking() + Select() for the list endpoint',
      'Skip((page-1)*pageSize).Take(pageSize) for pagination',
      'Select can navigate: Select(p => new ProductSummary(p.Id, p.Name, p.Price, p.Category.Name))',
      'ExecuteUpdateAsync with SetProperty(p => p.IsActive, false) and a Where() filter',
    ],
    starterCode: `// SLOW original endpoint — optimise this:
app.MapGet("/products", async (AppDbContext db) =>
    await db.Products.Include(p => p.Category).ToListAsync());

// TODO: optimised with AsNoTracking, Select projection, pagination

// TODO: POST /products/deactivate-old — bulk update using ExecuteUpdateAsync`,
    solution: `record ProductSummary(int Id, string Name, decimal Price, string CategoryName);

// Optimised endpoint
app.MapGet("/products", async (
    int page, int pageSize, AppDbContext db, CancellationToken ct) =>
{
    page     = Math.Max(1, page);
    pageSize = Math.Clamp(pageSize, 1, 100);

    var items = await db.Products
        .Where(p => p.IsActive)
        .OrderBy(p => p.Name)
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .Select(p => new ProductSummary(p.Id, p.Name, p.Price, p.Category.Name))
        .AsNoTracking()
        .ToListAsync(ct);

    return Results.Ok(items);
});

// Bulk deactivate old products (EF Core 7+)
app.MapPost("/products/deactivate-old", async (AppDbContext db, CancellationToken ct) =>
{
    var cutoff = DateTime.UtcNow.AddDays(-90);
    var count = await db.Products
        .Where(p => p.IsActive && p.UpdatedAt < cutoff)
        .ExecuteUpdateAsync(s =>
            s.SetProperty(p => p.IsActive,   false)
             .SetProperty(p => p.UpdatedAt,  DateTime.UtcNow),
            ct);
    return Results.Ok(new { Deactivated = count });
});`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What causes a cartesian explosion in EF Core queries?',
      options: [
        'Running SaveChangesAsync() in a loop',
        'Using Include() on multiple collection navigations — the resulting JOIN multiplies rows',
        'Using AsNoTracking() with related entities',
        'Calling ToListAsync() on a large table',
      ],
      answer: 1,
      explanation: 'Joining two one-to-many collections (e.g., Order → Items and Order → Tags) multiplies the row count: 10 items × 5 tags = 50 rows per order. AsSplitQuery() avoids this by running separate SELECT statements instead of one big JOIN.',
    },
    {
      q: 'Does ExecuteDeleteAsync() call SaveChangesAsync() internally?',
      options: [
        'Yes, it wraps SaveChangesAsync()',
        'No — it executes a direct SQL DELETE and bypasses the change tracker entirely',
        'Yes, but only if there are tracked entities',
        'No, you must call SaveChangesAsync() after',
      ],
      answer: 1,
      explanation: 'ExecuteDeleteAsync() and ExecuteUpdateAsync() bypass the change tracker and execute SQL directly. SaveChangesAsync() is neither called nor needed — these are "one-shot" bulk operations.',
    },
    {
      q: 'Which is the safest way to pass user input into a raw SQL query?',
      options: [
        'FromSqlRaw() with string concatenation',
        'FromSqlInterpolated() — EF Core parameterises the interpolated values',
        'ExecuteSqlRawAsync() with string.Format()',
        'No raw SQL should ever accept user input',
      ],
      answer: 1,
      explanation: 'FromSqlInterpolated() automatically wraps interpolated values as SQL parameters — no injection risk. Never concatenate user input into the SQL string; always use parameterised queries.',
    },
    {
      q: 'What constraint does AddDbContextPool impose on your DbContext?',
      options: [
        'Must be Singleton lifetime',
        'Cannot store state as instance fields that persist between requests',
        'Cannot use async methods',
        'Can only work with one database provider',
      ],
      answer: 1,
      explanation: 'Pooled DbContexts are reset and reused between requests. Any instance fields beyond what EF Core manages (extra properties, injected services stored as fields) will survive between request scopes — a source of data leaks. The context must be stateless aside from EF Core internals.',
    },
    {
      q: 'When is EF.CompileQuery() most beneficial?',
      options: [
        'For queries that run once at startup',
        'For high-frequency queries where LINQ translation overhead (1-5ms) is measurable',
        'For all queries — always compile them',
        'Only for raw SQL queries',
      ],
      answer: 1,
      explanation: 'EF Core translates LINQ to SQL on every call unless compiled. On a high-traffic endpoint executing 1000 req/s, eliminating a 2ms translation per query saves 2 seconds of CPU per second. For low-frequency or startup queries the benefit is negligible.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do I detect N+1 queries and other EF Core performance issues?',
      a: 'Three options: (1) Enable EF Core query logging (LogTo or UseMiniProfiler) in development — each executed SQL statement is logged with timing. (2) MiniProfiler.AspNetCore shows all queries on a per-request basis in the dev toolbar. (3) Application Insights or OpenTelemetry traces capture EF Core spans in production with durations. Count the queries per request — anything over 3-5 for a normal page warrants investigation.',
    },
    {
      q: 'What is the difference between AsNoTracking() and AsNoTrackingWithIdentityResolution()?',
      a: 'AsNoTracking() is fastest but does not deduplicate — if the same entity appears in two Include paths, you get two object instances. AsNoTrackingWithIdentityResolution() deduplicates using identity keys: you get one object per PK value, wired into both navigation properties. Use the latter when you Include() the same entity from multiple paths and need referential consistency.',
    },
    {
      q: 'Can I use raw SQL while still getting entity mapping?',
      a: 'Yes. db.Products.FromSqlRaw("SELECT * FROM Products WHERE ...") returns IQueryable<Product> — EF Core maps column names to properties by convention. You can also chain LINQ on top: .FromSqlRaw(...).Where(p => p.IsActive).OrderBy(p => p.Name).ToListAsync(). The final SQL merges your raw SQL as a subquery with the LINQ filter.',
    },
    {
      q: 'Does EF Core support database connection pooling?',
      a: 'ADO.NET connection pooling is built into the SqlClient and Npgsql drivers — EF Core benefits automatically without any configuration. Connections are opened, used, and returned to the pool per operation. AddDbContextPool<T>() pools the DbContext wrapper on top of that, reducing allocation overhead further.',
    },
    {
      q: 'How do I efficiently load a single column or aggregate without loading full entities?',
      a: 'Use LINQ projection or aggregation methods that EF Core translates directly: db.Products.Select(p => p.Name).ToListAsync() — generates SELECT name FROM Products. For counts: CountAsync(), SumAsync(p => p.Price), MaxAsync(p => p.Price). These all run server-side and return scalars without loading any entity.',
    },
  ];
}
