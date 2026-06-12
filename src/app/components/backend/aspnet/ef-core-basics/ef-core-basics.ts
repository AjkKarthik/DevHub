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
  selector: 'app-aspnet-ef-core-basics',
  standalone: true,
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
            QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
            PageMetaComponent, PageCompleteComponent],
  templateUrl: './ef-core-basics.html',
  styleUrl: './ef-core-basics.scss',
})
export class AspnetEfCoreBasics {

  quickRef: QuickRefItem[] = [
    { name: 'DbContext',              type: 'class',     desc: 'Unit of work — tracks entities and coordinates saves to the database' },
    { name: 'DbSet<T>',              type: 'class',     desc: 'Repository for entity T — queried with LINQ, returns IQueryable<T>' },
    { name: 'OnModelCreating()',      type: 'method',    desc: 'Configure the model with Fluent API inside the DbContext' },
    { name: 'SaveChangesAsync()',     type: 'method',    desc: 'Flush all tracked changes to the database in a transaction' },
    { name: 'Add() / Update() / Remove()', type: 'method', desc: 'Mark an entity as Added/Modified/Deleted in the change tracker' },
    { name: 'Find() / FindAsync()',   type: 'method',    desc: 'Lookup by PK — checks the tracker first, then hits the DB' },
    { name: 'AsNoTracking()',         type: 'method',    desc: 'Returns entities without attaching them — faster for read-only queries' },
    { name: 'dotnet ef migrations',   type: 'keyword',   desc: 'CLI: add, remove, update-database — manages schema evolution scripts' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'DbContext — the Unit of Work',
      points: [
        'A <code>DbContext</code> subclass is the central object in EF Core. It exposes <code>DbSet&lt;T&gt;</code> properties for each entity and tracks all changes made to those objects.',
        'Register with <code>builder.Services.AddDbContext&lt;AppDbContext&gt;(options =&gt; options.UseSqlServer(connectionString))</code>. Lifetime is <strong>Scoped</strong> by default — one instance per HTTP request. Never inject it into Singleton services.',
        'EF Core providers map to different databases: <code>UseSqlServer</code>, <code>UseNpgsql</code> (PostgreSQL), <code>UseSqlite</code> (great for tests/dev), <code>UseInMemoryDatabase</code> (unit tests only — no real SQL semantics).',
      ],
    },
    {
      heading: 'Querying with LINQ',
      points: [
        '<code>DbSet&lt;T&gt;</code> implements <code>IQueryable&lt;T&gt;</code> — LINQ queries are translated to SQL and executed on the database, not in memory. Call <code>ToListAsync()</code>, <code>FirstOrDefaultAsync()</code>, or <code>SingleAsync()</code> to materialise results.',
        'EF Core uses <strong>deferred execution</strong> — building a query (Where, OrderBy, Select) does not hit the database until a materialising call. This lets you compose queries in layers.',
        'Always use <code>cancellationToken</code> parameters in web apps: <code>ToListAsync(ct)</code>, <code>SaveChangesAsync(ct)</code>. This lets ASP.NET Core cancel the query if the client disconnects.',
      ],
    },
    {
      heading: 'Change Tracking & SaveChanges',
      points: [
        'When you query entities without <code>AsNoTracking()</code>, EF Core takes a snapshot. Mutating properties sets the entity state to <code>Modified</code>. Calling <code>SaveChangesAsync()</code> generates and runs the appropriate SQL for all tracked changes in a single transaction.',
        '<code>context.Add(entity)</code> marks the entity <code>Added</code> — EF Core will INSERT it. <code>context.Remove(entity)</code> marks it <code>Deleted</code> — DELETE on save. <code>context.Update(entity)</code> marks all scalar properties <code>Modified</code> — use this for detached entities only.',
        'For <strong>detached update patterns</strong> (entity came from a different scope or was deserialized), prefer loading from the DB first and updating properties — this avoids accidental overwrites and is safer for partial updates.',
      ],
    },
    {
      heading: 'Migrations',
      points: [
        'Migrations capture schema changes as incremental C# scripts. <code>dotnet ef migrations add &lt;Name&gt;</code> scaffolds a migration from the current model diff. <code>dotnet ef database update</code> applies pending migrations to the database.',
        'In production, <strong>never</strong> call <code>Database.MigrateAsync()</code> at app startup unless you understand the risks (table locks on large tables, parallel deploy issues). Instead, run migrations out-of-band with a deployment script or a one-off task.',
        '<code>dotnet ef migrations script</code> generates idempotent SQL — safe to run against a live database and great for audit trails in CI/CD pipelines.',
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
    public int    Id    { get; set; }
    public string Name  { get; set; } = "";
    public decimal Price { get; set; }
    public bool   IsActive { get; set; } = true;
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
        });
    }
}

// Registration
builder.Services.AddDbContext<AppDbContext>(opts =>
    opts.UseSqlServer(builder.Configuration.GetConnectionString("Default")));`,
    },
    {
      label: 'CRUD Operations',
      language: 'csharp',
      code: `// Inject via constructor
public class ProductService(AppDbContext db)
{
    // Read — list active products
    public Task<List<Product>> GetActiveAsync(CancellationToken ct)
        => db.Products
             .Where(p => p.IsActive)
             .OrderBy(p => p.Name)
             .AsNoTracking()
             .ToListAsync(ct);

    // Read — single by PK (checks tracker first)
    public ValueTask<Product?> GetByIdAsync(int id, CancellationToken ct)
        => db.Products.FindAsync([id], ct);

    // Create
    public async Task<Product> CreateAsync(string name, decimal price, CancellationToken ct)
    {
        var product = new Product { Name = name, Price = price };
        db.Products.Add(product);
        await db.SaveChangesAsync(ct);
        return product;         // Id is populated after save
    }

    // Update (load-then-modify pattern — safe for partial updates)
    public async Task UpdatePriceAsync(int id, decimal newPrice, CancellationToken ct)
    {
        var product = await db.Products.FindAsync([id], ct)
            ?? throw new KeyNotFoundException();
        product.Price = newPrice;
        await db.SaveChangesAsync(ct);
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
      code: `// LINQ is translated to SQL — no in-memory filtering
var expensiveProducts = await db.Products
    .Where(p => p.Price > 100 && p.IsActive)
    .OrderByDescending(p => p.Price)
    .Select(p => new { p.Id, p.Name, p.Price })  // project to avoid over-fetching
    .ToListAsync(ct);

// Pagination
int page = 2, pageSize = 20;
var paged = await db.Products
    .Where(p => p.IsActive)
    .OrderBy(p => p.Name)
    .Skip((page - 1) * pageSize)
    .Take(pageSize)
    .ToListAsync(ct);

// Count without loading entities
int total = await db.Products.CountAsync(p => p.IsActive, ct);

// Any — more efficient than Count() > 0
bool hasActive = await db.Products.AnyAsync(p => p.IsActive, ct);

// Single with null check
var product = await db.Products
    .SingleOrDefaultAsync(p => p.Id == id, ct);`,
    },
    {
      label: 'Migrations',
      language: 'csharp',
      code: `// Install the EF Core CLI tool:
// dotnet tool install --global dotnet-ef

// Add initial migration
// dotnet ef migrations add InitialCreate --project MyApp

// Apply migrations to the database
// dotnet ef database update

// Generate idempotent SQL script (for production deploys)
// dotnet ef migrations script --idempotent --output migrate.sql

// Remove the last unapplied migration
// dotnet ef migrations remove

// ── In code: apply at startup (DEV / integration tests only) ──
app.Services.CreateScope()
    .ServiceProvider.GetRequiredService<AppDbContext>()
    .Database.MigrateAsync();
// For production, run migrations out-of-band — never inline at startup`,
    },
    {
      label: 'Connection String',
      language: 'csharp',
      code: `// appsettings.json
// {
//   "ConnectionStrings": {
//     "Default": "Server=localhost;Database=MyApp;Trusted_Connection=True;TrustServerCertificate=True"
//   }
// }

// Registration (reads from config automatically)
builder.Services.AddDbContext<AppDbContext>(opts =>
    opts.UseSqlServer(
        builder.Configuration.GetConnectionString("Default"),
        sqlOpts => sqlOpts.CommandTimeout(30)));

// SQLite (great for development & integration tests)
builder.Services.AddDbContext<AppDbContext>(opts =>
    opts.UseSqlite("Data Source=myapp.db"));

// In-memory (unit tests — no real SQL, no migrations)
services.AddDbContext<AppDbContext>(opts =>
    opts.UseInMemoryDatabase("TestDb"));`,
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
      explanation: 'DbContext is Scoped — one instance per HTTP request (or per DI scope). This is intentional: the context tracks entities for the duration of a request and is disposed at the end. Never use Singleton scope.',
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
      explanation: 'Without AsNoTracking(), EF Core takes identity snapshots of every returned entity. AsNoTracking() skips this overhead — beneficial for read-only queries where you will not call SaveChanges().',
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
      explanation: 'Running MigrateAsync() on startup is convenient for local dev and integration tests, but risky in production — it can cause table locks on large tables and race conditions during parallel pod deploys. Use idempotent SQL scripts or deployment tasks in production.',
    },
    {
      q: 'Which approach is safer for updating a specific field on a detached entity?',
      options: [
        'context.Update(entity) — marks all fields Modified',
        'Load the entity from the DB, set the field, then SaveChangesAsync()',
        'context.Attach(entity) followed by Update()',
        'Delete and re-insert the entity',
      ],
      answer: 1,
      explanation: 'context.Update(entity) marks ALL scalar properties Modified and overwrites every field — this can clobber data written by concurrent requests. Loading first ensures only the changed property is included in the UPDATE statement.',
    },
    {
      q: 'Why is LINQ deferred execution important in EF Core?',
      options: [
        'It avoids running any SQL at all',
        'It lets you compose queries incrementally — SQL is generated only when materialised (ToListAsync, etc.)',
        'It caches query results automatically',
        'It prevents N+1 query problems',
      ],
      answer: 1,
      explanation: 'Building a LINQ query (Where, OrderBy, Select) constructs an expression tree — no SQL runs until a materialising operator like ToListAsync() or FirstOrDefaultAsync() is called. This lets service layers build queries from multiple conditions without extra round trips.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between Add() and Attach() in EF Core?',
      a: 'Add(entity) marks the entity and its reachable graph as Added — EF Core will INSERT all of them on SaveChanges. Attach(entity) marks the entity as Unchanged — EF Core starts tracking it without planning any SQL. Use Attach when you have a fully populated entity you just want to start tracking (e.g., to set one property Modified manually).',
    },
    {
      q: 'How do I reset/clear tracked entities without disposing the context?',
      a: 'Call context.ChangeTracker.Clear() (EF Core 5+). This detaches all tracked entities, effectively giving the context a clean state. Useful in background loops where you reuse the context across iterations.',
    },
    {
      q: 'What is the N+1 query problem and how does EF Core trigger it?',
      a: 'N+1 happens when you load a list of N entities and then access a navigation property on each one inside a loop — each access fires an additional lazy-load query. EF Core disables lazy loading by default, so the navigation property is simply null until you explicitly Include() it. Enable UseLazyLoadingProxies() deliberately only when you understand the implications.',
    },
    {
      q: 'Can I use EF Core outside of ASP.NET Core (e.g., in a console app)?',
      a: 'Yes. Override OnConfiguring(DbContextOptionsBuilder) in your DbContext to configure the provider directly. Or use a HostBuilder to set up DI and IConfiguration exactly like ASP.NET Core — the EF Core packages have no ASP.NET Core dependency.',
    },
    {
      q: 'How do I use EF Core with multiple databases or schemas?',
      a: 'Register multiple DbContext subclasses — each with its own connection string or provider. For separate schemas in one database, set the default schema in OnModelCreating: modelBuilder.HasDefaultSchema("reporting"). You can also use HasAnnotation("Relational:Schema", "...") per entity.',
    },
  ];
}
