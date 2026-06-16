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
  selector: 'app-aspnet-ef-performance',
  standalone: true,
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
            QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
            PageMetaComponent, PageCompleteComponent,
            CommonMistakesComponent, RevisionCardComponent, PrerequisitesComponent],
  templateUrl: './ef-performance.html',
  styleUrl: './ef-performance.scss',
})
export class AspnetEfPerformance {

  prerequisites: Prerequisite[] = [
    { label: 'EF Core Basics',         route: '/aspnet/ef-core-basics' },
    { label: 'EF Core Relationships',  route: '/aspnet/ef-relationships' },
  ];

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
        '<strong>3. Avoid the N+1 pattern.</strong> Include() related data upfront or use split queries — never access navigation properties inside a loop without loading them first. Use EF Core query logging or MiniProfiler to catch N+1 in development.',
        '<strong>Paginate all list queries.</strong> Never call ToListAsync() on an unbounded table. Always apply Skip() + Take() with a stable ORDER BY. Without pagination, a single list query can return millions of rows and exhaust memory.',
        '<strong>Use AnyAsync() over CountAsync() for existence checks.</strong> <code>db.Products.AnyAsync(p => p.IsActive)</code> generates <code>SELECT TOP 1</code>, not <code>SELECT COUNT(*)</code> — stops at the first match. CountAsync() scans the entire result set.',
        '<strong>Choose AsSplitQuery() for multi-collection Includes.</strong> Joining two one-to-many collections multiplies rows (cartesian explosion). AsSplitQuery() runs each collection as a separate SELECT and EF Core stitches them together — avoiding the row explosion at the cost of multiple round trips.',
      ],
    },
    {
      heading: 'Bulk Operations (EF Core 7+)',
      points: [
        '<code>ExecuteDeleteAsync()</code> and <code>ExecuteUpdateAsync()</code> generate single SQL DELETE/UPDATE statements without loading entities. For "soft delete all expired records" operations, this is 100× faster than the load-loop-save pattern.',
        'These methods bypass the change tracker entirely — <code>SaveChangesAsync()</code> is not needed or called. They also bypass any interceptors or entity events that hook into the change tracker (SavedChanges, SavingChanges).',
        'Bulk operations work on <code>IQueryable&lt;T&gt;</code> — compose the WHERE clause with LINQ first, then call <code>ExecuteDeleteAsync()</code>. EF Core translates it all into one SQL statement with a WHERE subquery.',
        '<code>ExecuteUpdateAsync()</code> uses a SetProperty fluent API: <code>setters.SetProperty(p => p.IsActive, false).SetProperty(p => p.UpdatedAt, DateTime.UtcNow)</code>. Multiple SetProperty calls are combined into a single UPDATE statement.',
        'Bulk operations do not participate in the current transaction by default. Wrap them in <code>await using var tx = await db.Database.BeginTransactionAsync()</code> if you need atomicity with other operations.',
        'EF Core 8 added <code>ExecuteInsertAsync()</code> for bulk inserts. For very large inserts, consider SqlBulkCopy (SQL Server) or COPY (PostgreSQL) via Dapper or ADO.NET — EF Core generates individual INSERTs even with AddRange().',
      ],
    },
    {
      heading: 'Raw SQL & Compiled Queries',
      points: [
        '<code>FromSqlRaw()</code> lets you write raw SQL that returns entities — useful for complex queries, full-text search, or CTEs that EF Core cannot translate. The result is still tracked (add AsNoTracking() for reads) and you can chain LINQ on top.',
        'Always use <code>FromSqlInterpolated()</code> or parameterised raw SQL for user input — <strong>never</strong> string-concatenate user input into SQL. EF Core parameterises interpolated strings automatically as DbParameters.',
        '<code>EF.CompileQuery()</code> compiles a LINQ expression at startup, eliminating the LINQ-to-SQL translation cost on every call. Beneficial for high-frequency queries — a typical translation costs 1–5 ms per query.',
        '<code>EF.CompileAsyncQuery()</code> is the async variant. The compiled delegate takes the DbContext as its first argument, then any query parameters. Store compiled queries as static readonly fields to ensure they are compiled only once.',
        'Raw SQL results must match the entity shape — columns are mapped by name. If your SELECT omits a non-nullable column, EF Core throws. Use DTO projections with <code>SqlQuery&lt;T&gt;()</code> (EF Core 8) for arbitrary result shapes without needing a DbSet.',
        '<code>db.Database.SqlQueryRaw&lt;T&gt;()</code> (EF Core 8) maps raw SQL to any type — not just entity types. Eliminates the need for Dapper for simple scalar or unmapped-type queries while keeping the same connection/transaction context.',
      ],
    },
    {
      heading: 'DbContext Pooling & Connection Reuse',
      points: [
        '<code>AddDbContextPool&lt;T&gt;()</code> keeps a pool of DbContext instances and reuses them between requests instead of constructing and disposing on every request. Reduces allocations significantly under high throughput.',
        'Pooled contexts have constraints: they cannot store state (no extra fields that persist between requests), constructor parameters must be deterministic from DI, and <code>OnConfiguring</code> is called only once per pool slot.',
        'For connection-level pooling (not DbContext-level), the built-in ADO.NET connection pool handles socket reuse. EF Core opens and closes connections per operation — the ADO.NET pool recycles physical connections beneath transparently.',
        'Use <code>IDbContextFactory&lt;T&gt;</code> (registered via <code>AddDbContextFactory()</code>) when you need DbContext instances in Singleton services or parallel async work. Each <code>factory.CreateDbContext()</code> call produces an independent, scoped instance.',
        'Default pool size is 1024. Tune it with the <code>poolSize</code> parameter on <code>AddDbContextPool()</code>. Size it to your expected concurrent request count — too small and requests queue waiting for a context; too large and you waste memory.',
        'Monitor pool pressure with EF Core metrics (System.Diagnostics.Metrics, exposed via OpenTelemetry). High queue depth or pool exhaustion shows up as latency spikes and is a sign to increase pool size or reduce query duration.',
      ],
    },
    {
      heading: 'Query Interceptors & Diagnostic Tooling',
      points: [
        'Implement <code>IDbCommandInterceptor</code> to wrap every SQL command — log slow queries, add query hints, or inject query tags. Register with <code>opts.AddInterceptors(new MyInterceptor())</code> in AddDbContext().',
        '<code>db.Database.LogTo(Console.WriteLine, LogLevel.Information)</code> enables simple query logging in development. Each executed SQL statement is printed with parameters and execution duration.',
        '<strong>Query tags</strong> annotate generated SQL with a comment for debugging: <code>.TagWith("ProductList")</code> adds <code>-- ProductList</code> at the top of the SQL. Tags appear in slow-query logs and profiler traces.',
        'MiniProfiler.AspNetCore.EF integrates EF Core query collection into the profiler toolbar — shows count, duration, and duplicates per HTTP request. Essential for catching N+1 in integration tests.',
        'EF Core emits OpenTelemetry activity spans under <code>Microsoft.EntityFrameworkCore</code>. Export to Jaeger, Zipkin, or Application Insights to get per-query latency in production distributed traces.',
        'Set <code>EnableSensitiveDataLogging()</code> in development to log parameter values alongside SQL. Never enable it in production — it logs personal data and credentials.',
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
    {
      q: 'What does AsNoTrackingWithIdentityResolution() add over plain AsNoTracking()?',
      options: [
        'It enables write operations on the returned entities',
        'It deduplicates entities by primary key so the same row maps to one object instance',
        'It adds an index hint to the generated SQL',
        'It forces all lazy loading to be disabled',
      ],
      answer: 1,
      explanation: 'Plain AsNoTracking() can return multiple object instances for the same row when an entity is reachable via multiple Include paths. WithIdentityResolution deduplicates — you get one object per PK value — at the cost of slightly more bookkeeping than plain AsNoTracking().',
    },
    {
      q: 'Which approach is fastest for checking if any row matches a condition?',
      options: [
        'db.Products.Where(p => p.IsActive).CountAsync() > 0',
        'db.Products.Where(p => p.IsActive).AnyAsync()',
        'db.Products.Where(p => p.IsActive).FirstOrDefaultAsync() != null',
        'db.Products.Where(p => p.IsActive).ToListAsync().Count > 0',
      ],
      answer: 1,
      explanation: 'AnyAsync() generates SELECT TOP 1 / SELECT 1 WHERE EXISTS — it stops as soon as one row is found. CountAsync() scans all matching rows; FirstOrDefaultAsync() is similar but returns an entity; ToListAsync().Count materialises the entire result set into memory.',
    },
    {
      q: 'Where should you store a compiled EF Core query (EF.CompileQuery result)?',
      options: [
        'As an instance field on the DbContext',
        'As a static readonly field — compiled once per process lifetime',
        'In the DI container as a Scoped service',
        'Inside the method that uses it, created on each call',
      ],
      answer: 1,
      explanation: 'Compiled queries must be static readonly to be compiled only once at startup. Creating them inside a method or as instance fields defeats the purpose — the compilation overhead would be paid on every call.',
    },
    {
      q: 'What does TagWith() do in an EF Core query?',
      options: [
        'Adds a SQL hint like NOLOCK to the query',
        'Embeds a SQL comment in the generated query for identification in logs and profiler traces',
        'Tags the entity for cache invalidation',
        'Enables query result caching with the given tag as the cache key',
      ],
      answer: 1,
      explanation: 'TagWith("label") prepends a SQL comment (-- label) to the generated query. The comment appears in slow-query logs, profiler output, and database traces — making it easy to identify which code path generated a slow query without reading execution plans.',
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
    {
      q: 'When should I use Dapper alongside EF Core instead of raw SQL methods?',
      a: 'Use Dapper for queries that EF Core cannot translate or that require very specific SQL (complex CTEs, dynamic column selection, PIVOT queries, or performance-critical hotpaths where you want zero ORM overhead). EF Core and Dapper can share the same connection — open the EF Core connection manually with db.Database.OpenConnectionAsync() and pass db.Database.GetDbConnection() to Dapper. This keeps them in the same transaction if needed.',
    },
    {
      q: 'How do I use IDbContextFactory for background services?',
      a: 'Register with builder.Services.AddDbContextFactory<AppDbContext>(opts => ...) and inject IDbContextFactory<AppDbContext> into your Singleton background service. Call await using var db = await factory.CreateDbContextAsync(ct) inside each work unit — this creates a fresh, scoped DbContext that is disposed after the unit completes. Never inject DbContext directly into a Singleton; it is a Scoped service and causes lifetime mismatches.',
    },
    {
      q: 'Does AsSplitQuery() always improve performance?',
      a: 'Not always — it trades row-count explosion for multiple round trips. AsSplitQuery() wins when the cartesian product is large (multiple collection Includes with many items each). It loses when the extra round trips outweigh the row reduction — for example, when network latency is high or the collections are small. Measure with and without using EF Core logging or a profiler before committing to a global QuerySplittingBehavior setting.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Forgetting AsNoTracking() on read-only queries',
      wrong: `var products = await db.Products
    .Include(p => p.Category)
    .ToListAsync(ct);
// Change tracker snapshots all 500 entities — wasted memory`,
      right: `var products = await db.Products
    .Include(p => p.Category)
    .AsNoTracking()
    .ToListAsync(ct);`,
      explanation: 'Every tracked query snapshots entity state for change detection. On read-only endpoints (GET list, GET by id without update), this overhead is pure waste. Add AsNoTracking() by default and only omit it when you intend to call SaveChanges().',
    },
    {
      title: 'Using CountAsync() for existence checks',
      wrong: `bool hasActive = await db.Products
    .CountAsync(p => p.IsActive) > 0; // scans all rows`,
      right: `bool hasActive = await db.Products
    .AnyAsync(p => p.IsActive); // SELECT TOP 1 — stops immediately`,
      explanation: 'CountAsync() aggregates every matching row. AnyAsync() short-circuits after finding one match — it generates EXISTS or SELECT TOP 1. Always use AnyAsync() for boolean existence checks.',
    },
    {
      title: 'Calling SaveChangesAsync() inside a loop (N+1 writes)',
      wrong: `foreach (var order in orders)
{
    order.Status = "Processed";
    await db.SaveChangesAsync(); // 1 UPDATE per iteration
}`,
      right: `foreach (var order in orders)
    order.Status = "Processed";

await db.SaveChangesAsync(); // 1 batch UPDATE for all
// Or use ExecuteUpdateAsync() for even better performance`,
      explanation: 'EF Core batches all pending changes in a single SaveChangesAsync() call. Calling it inside a loop sends one UPDATE per iteration — N round trips instead of 1. For bulk updates, prefer ExecuteUpdateAsync() which generates a single SQL UPDATE statement.',
    },
    {
      title: 'Storing instance state in a pooled DbContext',
      wrong: `public class AppDbContext : DbContext
{
    public string? CurrentUserId { get; set; } // persists between requests in pool!
}
// Set at request start, read mid-request — leaks to next request`,
      right: `// Pass user context through constructor or method parameters
// Or use IHttpContextAccessor injected at service level, not DbContext level
public class ProductService(AppDbContext db, IHttpContextAccessor http) { }`,
      explanation: 'When AddDbContextPool is used, DbContext instances are reset and reused. Any instance fields you add will retain their values across requests — a data isolation bug. DbContext must be stateless; pass per-request state through service constructors or method parameters.',
    },
    {
      title: 'Using FromSqlRaw() with string concatenation (SQL injection)',
      wrong: `string filter = Request.Query["name"];
var results = await db.Products
    .FromSqlRaw(\`SELECT * FROM Products WHERE Name = '\` + filter + \`'\`)
    .ToListAsync(); // SQL INJECTION RISK`,
      right: `string filter = Request.Query["name"];
var results = await db.Products
    .FromSqlInterpolated(\$"SELECT * FROM Products WHERE Name = {filter}")
    .ToListAsync(); // parameterised automatically`,
      explanation: 'FromSqlRaw() with string concatenation is a SQL injection vector. Use FromSqlInterpolated() — EF Core wraps interpolated values as SQL parameters automatically. Alternatively, use FromSqlRaw() with explicit SqlParameter objects.',
    },
    {
      title: 'Compiling queries inside methods instead of as static fields',
      wrong: `public async Task<Product?> GetAsync(int id)
{
    var query = EF.CompileAsyncQuery(...); // recompiled every call!
    return await query(db, id);
}`,
      right: `private static readonly Func<AppDbContext, int, Task<Product?>> _getById =
    EF.CompileAsyncQuery((AppDbContext db, int id) =>
        db.Products.AsNoTracking().FirstOrDefault(p => p.Id == id));

public Task<Product?> GetAsync(int id) => _getById(db, id);`,
      explanation: 'EF.CompileAsyncQuery() performs LINQ-to-SQL translation at the point of the call. If you call it inside a method, the translation runs on every invocation — defeating its purpose. Always store compiled queries as static readonly fields so they are compiled once at startup.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'EF Core performance hinges on avoiding unnecessary tracking, projecting only needed columns, batching writes, and using bulk operations for set-based mutations.',
    mustKnow: [
      'AsNoTracking() on all read-only queries — eliminates change-tracker snapshot overhead',
      'Select() projection generates column-specific SQL instead of SELECT *',
      'AnyAsync() over CountAsync() for existence — short-circuits after one row',
      'AsSplitQuery() prevents cartesian explosion when including multiple collection navigations',
      'ExecuteDeleteAsync() / ExecuteUpdateAsync() — single-SQL bulk mutations without loading entities (EF Core 7+)',
      'EF.CompileAsyncQuery() as static readonly — eliminate LINQ translation on hot paths',
      'AddDbContextPool() reuses DbContext instances — DbContext must remain stateless',
    ],
    interviewFocus: [
      'Explain cartesian explosion and when to use AsSplitQuery() vs single-query Include()',
      'How does AddDbContextPool differ from AddDbContext, and what constraint does it impose?',
      'When would you choose ExecuteUpdateAsync() over loading entities and calling SaveChangesAsync()?',
      'What is the difference between AsNoTracking() and AsNoTrackingWithIdentityResolution()?',
      'How do you safely pass user input to raw SQL in EF Core?',
    ],
  };
}
