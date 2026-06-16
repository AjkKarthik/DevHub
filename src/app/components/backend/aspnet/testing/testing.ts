import { Component } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { BeforeAfterComponent, BeforeAfterExample } from '../../../shared/before-after/before-after';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { PrerequisitesComponent, Prerequisite } from '../../../shared/prerequisites/prerequisites';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';

@Component({
  selector: 'app-aspnet-testing',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    BeforeAfterComponent, CommonMistakesComponent, PrerequisitesComponent,
    PageMetaComponent, PageCompleteComponent, RevisionCardComponent,
  ],
  templateUrl: './testing.html',
  styleUrl: './testing.scss',
})
export class AspnetTesting {

  prerequisites: Prerequisite[] = [
    { label: 'Dependency Injection', route: '/aspnet/dependency-injection' },
    { label: 'EF Core Basics', route: '/aspnet/ef-core-basics' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'WebApplicationFactory<T>',       type: 'class',    desc: 'Spins up the real ASP.NET Core pipeline in-process; requests flow through real middleware, routing, and serialisation.', since: 'Core 2.1+' },
    { name: 'IClassFixture<T>',               type: 'interface', desc: 'xUnit contract: one T instance per test class. Use for WebApplicationFactory so the app starts once per class, not per test.', since: 'xUnit 2+' },
    { name: 'ConfigureTestServices()',         type: 'method',   desc: 'Runs after real DI registrations — remove old then add test doubles. Available inside ConfigureWebHost() or WithWebHostBuilder().', since: 'Core 2.1+' },
    { name: 'UseSqlite(":memory:")',           type: 'method',   desc: 'EF Core SQLite in-memory provider — enforces FK/unique constraints. Keep the SqliteConnection open to preserve the DB.', since: 'EF Core 1+' },
    { name: 'UseInMemoryDatabase()',           type: 'method',   desc: 'EF Core in-memory provider — fast but silently ignores FK/unique constraints. Only use for pure logic tests.', since: 'EF Core 1+' },
    { name: 'Substitute.For<T>()',             type: 'method',   desc: 'NSubstitute factory — creates a test double; set return values with .Returns().', since: 'NSubstitute 4+' },
    { name: 'Mock<T>',                         type: 'class',    desc: 'Moq class for configuring test doubles with Setup().Returns() and Verify() assertions.', since: 'Moq 4+' },
    { name: 'Testcontainers',                  type: 'keyword',  desc: '.NET library that starts real Docker containers (Postgres, SQL Server, Redis) in tests and cleans up afterward.', since: '.NET 6+' },
    { name: 'Respawn',                         type: 'keyword',  desc: 'Library that resets a real database to a clean state between tests by deleting rows in dependency order.', since: '.NET 5+' },
    { name: 'TestAuthHandler',                 type: 'class',    desc: 'Custom AuthenticationHandler that returns a fixed ClaimsPrincipal — eliminates JWT complexity from integration tests.', since: 'Core 2.1+' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Unit tests vs integration tests — choosing the right tool',
      points: [
        '<strong>Unit tests</strong> isolate a single class. Every external dependency is replaced by a test double (NSubstitute, Moq, hand-rolled fake). They are fast (milliseconds), deterministic, and precise — ideal for driving and verifying business logic in isolation.',
        '<strong>Integration tests</strong> spin up the real ASP.NET Core pipeline using <code>WebApplicationFactory&lt;TProgram&gt;</code>. Requests flow through real middleware, routing, model binding, filters, serialisation, and DI. They test <em>wiring</em> correctness — that all the pieces connect.',
        'Both are necessary. A test pyramid: many unit tests (cheap to run and maintain), a smaller set of integration tests (slower, but verify the whole stack), and a handful of end-to-end tests (slowest, external dependencies). Skipping unit tests makes integration tests brittle; skipping integration tests leaves wiring bugs undiscovered until production.',
        'A good split: unit-test every service method and edge case; integration-test every endpoint at least once (happy path + one error path); never write integration tests to verify business logic already covered by unit tests — that duplicates effort and slows feedback.',
        'Test naming convention: <code>MethodName_StateUnderTest_ExpectedBehaviour</code> (e.g., <code>GetById_WhenNotFound_ReturnsNull</code>). Descriptive names act as documentation — a failing test immediately tells you what broke without reading the body.',
      ],
    },
    {
      heading: 'WebApplicationFactory — the in-memory integration server',
      points: [
        '<code>WebApplicationFactory&lt;TProgram&gt;</code> boots the real application in-process — it reads <code>Program.cs</code>, runs all startup code, registers middleware and DI, and provides an <code>HttpClient</code> via <code>CreateClient()</code> that sends requests through the real pipeline without a network socket.',
        'Mark <code>Program.cs</code> as accessible: add <code>public partial class Program { }</code> at the bottom (or use the file\'s default top-level accessibility) so the test project can reference it as the type parameter.',
        'Use <code>IClassFixture&lt;WebApplicationFactory&lt;Program&gt;&gt;</code> to share one server per test class. The factory is created once, injected into the constructor, and the same in-memory server handles all tests in the class — app startup cost paid once per class, not per test.',
        'For per-test isolation, call <code>factory.WithWebHostBuilder(b => b.ConfigureTestServices(...))</code> inline — this creates a new derived factory with only the configuration you override. The base factory\'s state is preserved for other tests.',
        '<code>CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false })</code> disables redirect following — essential for testing 301/302 responses explicitly. Without this, the client silently follows redirects and you test the landing page instead of the redirect behaviour.',
      ],
    },
    {
      heading: 'Overriding DI registrations for tests',
      points: [
        '<code>ConfigureTestServices(services => { ... })</code> runs <em>after</em> all real registrations. To replace a service, call <code>services.RemoveAll&lt;IEmailService&gt;()</code> first — without this, both the real and fake are registered and <code>IEmailService</code> resolves to the last one (often the original).',
        'For replacing <code>DbContext</code>, remove the real <code>DbContextOptions&lt;AppDbContext&gt;</code> registration (not <code>AppDbContext</code> itself) and add a new one pointing to the test database. Using <code>services.RemoveAll&lt;DbContextOptions&lt;AppDbContext&gt;&gt;()</code> is the safe approach.',
        'For JWT-protected endpoints, replace the authentication scheme with a <code>TestAuthHandler</code> that always returns a fixed <code>ClaimsPrincipal</code>: <code>services.AddAuthentication("Test").AddScheme&lt;..., TestAuthHandler&gt;("Test", _ => { })</code>. Tests never need real tokens, and you can inject any roles or claims the endpoint checks.',
        'Fake services that record calls (spies) let integration tests assert that side effects happened without triggering real email sends, payment charges, or third-party API calls. A simple in-memory list on the fake is sufficient: <code>public List&lt;string&gt; SentEmails { get; } = new();</code>.',
        'Configuration overrides follow the same pattern: <code>ConfigureAppConfiguration((_, cfg) => cfg.AddInMemoryCollection(new Dictionary&lt;string, string?&gt; { ["FeatureFlags:NewCheckout"] = "true" }))</code>. The in-memory provider is added last and wins.',
      ],
    },
    {
      heading: 'EF Core test strategies — in-memory vs SQLite vs Testcontainers',
      points: [
        '<code>UseInMemoryDatabase("TestDb")</code> is the fastest option but has critical gaps: no foreign key enforcement, no unique index constraints, no SQL-level computed columns, no transactions. It is suitable only for unit tests that use <code>DbContext</code> as a simple in-memory store and do not rely on database-enforced constraints.',
        '<code>UseSqlite(":memory:")</code> gives real SQL semantics: FK constraints, unique indexes, CHECK constraints, and transactions all work. It runs in-process with zero setup. The one gotcha: the in-memory database is tied to the <code>SqliteConnection</code>. Keep the connection open for the test duration — closing drops the DB.',
        '<strong>Testcontainers</strong> (.NET library) starts a real Docker container per test run (e.g., SQL Server, PostgreSQL, Redis). Tests run against the exact same database engine as production — stored procedures, triggers, JSON operators, and proprietary type coercions all behave identically. The trade-off is speed: container startup takes ~10–30 seconds.',
        '<strong>Respawn</strong> resets a real database between tests efficiently — it introspects FK relationships and deletes rows in the correct order without dropping and recreating tables. This is faster than <code>EnsureDeleted()/EnsureCreated()</code> for large schemas and preserves static reference data that tests share.',
        'Database isolation strategy: <em>per-test</em> (each test gets a fresh DB — simplest but slow), <em>per-class</em> (seed once, clean between tests with Respawn — fastest for large suites), or <em>per-transaction</em> (wrap each test in a transaction that rolls back — elegant but breaks tests that span multiple DbContext instances).',
      ],
    },
    {
      heading: 'Test isolation, parallelism, and data management',
      points: [
        'xUnit runs test <em>classes</em> in parallel by default but test <em>methods</em> within a class sequentially. Tests that share database state must run in the same class (or use <code>[Collection]</code> to prevent parallelism), and each test must clean up after itself or use Respawn to reset state.',
        'Seed data in the constructor (if using <code>IClassFixture</code>) or in an <code>IAsyncLifetime.InitializeAsync()</code> override. Never hard-code IDs for seeded entities — let EF Core assign them and then query to find what was inserted. Hard-coded IDs cause flaky tests when the seed order changes.',
        'Avoid <code>Thread.Sleep</code> in tests — use proper async/await. Flaky tests caused by timing issues usually indicate missing awaits, fire-and-forget tasks, or event-driven code that is not properly awaited. Fix the code, not the test.',
        'Snapshot testing: capture the full HTTP response body as a JSON fixture file on first run, then compare on subsequent runs. Libraries like <strong>Verify</strong> or <strong>ApprovalTests</strong> automate this — useful for serialisation regression testing of large payloads.',
        'Test doubles hierarchy: <em>dummy</em> (not used, just fills parameters), <em>stub</em> (returns fixed values), <em>spy</em> (records calls for assertions), <em>mock</em> (pre-configured expected interactions — fails if not called), <em>fake</em> (working implementation, simpler — e.g., in-memory repository). Use the simplest double that satisfies the test.',
      ],
    },
    {
      heading: 'Testcontainers and Respawn for production-parity testing',
      points: [
        'Add the NuGet packages: <code>Testcontainers.PostgreSql</code> (or <code>.MsSql</code>, <code>.Redis</code>) and start a container in <code>IAsyncLifetime.InitializeAsync()</code>. The container is automatically stopped and removed when the test class is disposed.',
        'Pass the dynamically assigned connection string to your <code>WebApplicationFactory</code> via <code>ConfigureTestServices</code>: <code>services.RemoveAll&lt;DbContextOptions&lt;AppDbContext&gt;&gt;(); services.AddDbContext&lt;AppDbContext&gt;(o => o.UseNpgsql(container.GetConnectionString()));</code>.',
        'Run migrations against the Testcontainer to ensure the schema matches production exactly: <code>db.Database.Migrate()</code> in the fixture\'s <code>InitializeAsync</code>. Never use <code>EnsureCreated()</code> in Testcontainers tests — it skips migration history.',
        'Add Respawn for efficient reset: <code>await _respawner.ResetAsync(_connection)</code> in each test\'s setup. Respawn deletes rows in FK order and resets identity counters without dropping tables — a 100-table reset in ~10ms versus ~30s for container restart.',
        'Run Testcontainer tests in a separate test project or test collection to isolate slow container startup from fast unit/SQLite tests. CI pipelines can run them in parallel on different agents. Locally, developers run only fast tests during development and all tests before pushing.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Unit Test (xUnit + NSubstitute)',
      language: 'csharp',
      code: `public class ProductServiceTests
{
    private readonly IProductRepository _repo;
    private readonly ProductService     _sut;

    public ProductServiceTests()
    {
        _repo = Substitute.For<IProductRepository>();
        _sut  = new ProductService(_repo);
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsProduct_WhenFound()
    {
        var expected = new Product { Id = 1, Name = "Widget", Price = 9.99m };
        _repo.FindAsync(1).Returns(expected);

        var result = await _sut.GetByIdAsync(1);

        result.Should().BeEquivalentTo(expected);
        await _repo.Received(1).FindAsync(1);   // assert it was called once
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsNull_WhenNotFound()
    {
        _repo.FindAsync(Arg.Any<int>()).Returns((Product?)null);

        var result = await _sut.GetByIdAsync(99);

        result.Should().BeNull();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public async Task CreateAsync_Throws_WhenPriceInvalid(decimal price)
    {
        var act = () => _sut.CreateAsync(new CreateProductDto { Price = price });

        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*price*");
    }
}`,
    },
    {
      label: 'Integration Test (WebApplicationFactory)',
      language: 'csharp',
      code: `// Program.cs — make class accessible to the test project
// public partial class Program { }   ← add this at the bottom

public class TestWebApp : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureTestServices(services =>
        {
            // Replace real DbContext with SQLite in-memory
            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.AddDbContext<AppDbContext>(o =>
                o.UseSqlite("DataSource=:memory:"));

            // Replace real email sender with a spy
            services.RemoveAll<IEmailService>();
            services.AddSingleton<IEmailService>(new FakeEmailService());
        });
    }
}

public class ProductsEndpointTests : IClassFixture<TestWebApp>
{
    private readonly HttpClient _client;
    private readonly TestWebApp _app;

    public ProductsEndpointTests(TestWebApp app)
    {
        _app    = app;
        _client = app.CreateClient();

        // Seed the SQLite DB once per class
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.OpenConnection();   // keep connection alive
        db.Database.EnsureCreated();
        db.Products.AddRange(
            new Product { Name = "Widget", Price = 9.99m },
            new Product { Name = "Gadget", Price = 24.99m });
        db.SaveChanges();
    }

    [Fact]
    public async Task GET_Products_Returns200WithBothProducts()
    {
        var result = await _client.GetFromJsonAsync<Product[]>("/api/products");
        result.Should().HaveCount(2);
    }

    [Fact]
    public async Task POST_Product_Returns201WithLocation()
    {
        var dto      = new { Name = "Doohickey", Price = 4.99 };
        var response = await _client.PostAsJsonAsync("/api/products", dto);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        response.Headers.Location.Should().NotBeNull();
    }
}`,
    },
    {
      label: 'EF Core SQLite In-Memory',
      language: 'csharp',
      code: `public class DbFixture : IDisposable
{
    private readonly SqliteConnection _conn;
    public AppDbContext Db { get; }

    public DbFixture()
    {
        _conn = new SqliteConnection("DataSource=:memory:");
        _conn.Open();   // ← CRITICAL: closing drops the entire in-memory DB

        Db = new AppDbContext(
            new DbContextOptionsBuilder<AppDbContext>()
                .UseSqlite(_conn)
                .Options);

        Db.Database.EnsureCreated();
    }

    public void Dispose()
    {
        Db.Dispose();
        _conn.Dispose();
    }
}

public class OrderRepositoryTests : IClassFixture<DbFixture>
{
    private readonly AppDbContext _db;

    public OrderRepositoryTests(DbFixture fixture) => _db = fixture.Db;

    [Fact]
    public async Task AddOrder_EnforcesForeignKey()
    {
        // Non-existent CustomerId — SQLite FK enforcement catches this
        var order = new Order { CustomerId = 9999 };
        _db.Orders.Add(order);

        // Would silently succeed with UseInMemoryDatabase — SQLite throws
        await Assert.ThrowsAsync<DbUpdateException>(
            () => _db.SaveChangesAsync());
    }

    [Fact]
    public async Task AddOrder_PersistsWithItems()
    {
        var customer = new Customer { Name = "Alice" };
        _db.Customers.Add(customer);
        await _db.SaveChangesAsync();

        var order = new Order { CustomerId = customer.Id, Items = [new OrderItem { Sku = "A1" }] };
        _db.Orders.Add(order);
        await _db.SaveChangesAsync();

        var saved = await _db.Orders.Include(o => o.Items).FirstAsync();
        saved.Items.Should().HaveCount(1);
    }
}`,
    },
    {
      label: 'Auth Override (TestAuthHandler)',
      language: 'csharp',
      code: `// ── Test auth handler — always returns authenticated user ────────────
public class TestAuthHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> opts,
    ILoggerFactory logger,
    UrlEncoder encoder)
    : AuthenticationHandler<AuthenticationSchemeOptions>(opts, logger, encoder)
{
    public const string SchemeName = "Test";

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        // Build a ClaimsPrincipal with whatever claims the endpoints check
        var claims = new[]
        {
            new Claim(ClaimTypes.Name,           "testuser"),
            new Claim(ClaimTypes.NameIdentifier, "1"),
            new Claim(ClaimTypes.Role,           "Admin"),
        };
        var identity = new ClaimsIdentity(claims, SchemeName);
        var ticket   = new AuthenticationTicket(new ClaimsPrincipal(identity), SchemeName);
        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}

// ── Register in ConfigureTestServices ─────────────────────────────────
builder.ConfigureTestServices(services =>
{
    services.AddAuthentication(TestAuthHandler.SchemeName)
            .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>(
                TestAuthHandler.SchemeName, _ => { });
});

// ── Use in test ───────────────────────────────────────────────────────
[Fact]
public async Task ProtectedEndpoint_Returns200_WhenAuthenticated()
{
    var response = await _client.GetAsync("/api/admin/dashboard");
    response.StatusCode.Should().Be(HttpStatusCode.OK);
}

[Fact]
public async Task ProtectedEndpoint_Returns403_WithoutRole()
{
    // Override to return user WITHOUT Admin role
    // Use a separate factory with a different TestAuthHandler
    var response = await _client.GetAsync("/api/admin/audit");
    response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
}`,
    },
    {
      label: 'Testcontainers + Respawn',
      language: 'csharp',
      code: `// NuGet: Testcontainers.PostgreSql, Respawn

public class PostgresTestFixture : IAsyncLifetime
{
    private readonly PostgreSqlContainer _container = new PostgreSqlBuilder()
        .WithImage("postgres:16")
        .Build();

    private SqlConnection _conn = default!;
    private Respawner _respawner = default!;

    public string ConnectionString => _container.GetConnectionString();

    public async Task InitializeAsync()
    {
        await _container.StartAsync();

        _conn = new SqlConnection(ConnectionString);
        await _conn.OpenAsync();

        // Apply all migrations to the real Postgres container
        using var ctx = CreateDbContext();
        await ctx.Database.MigrateAsync();

        // Configure Respawn to know which tables to clean
        _respawner = await Respawner.CreateAsync(_conn, new RespawnerOptions
        {
            SchemasToInclude = ["public"],
            DbAdapter = DbAdapter.Postgres,
        });
    }

    public AppDbContext CreateDbContext()
    {
        var opts = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(ConnectionString)
            .Options;
        return new AppDbContext(opts);
    }

    public async Task ResetAsync() => await _respawner.ResetAsync(_conn);

    public async Task DisposeAsync()
    {
        await _conn.DisposeAsync();
        await _container.DisposeAsync();
    }
}

[Collection("Postgres")]
public class OrderTests(PostgresTestFixture db) : IAsyncLifetime
{
    public Task InitializeAsync() => db.ResetAsync(); // clean slate per test
    public Task DisposeAsync()    => Task.CompletedTask;

    [Fact]
    public async Task CreateOrder_SavesToRealPostgres()
    {
        await using var ctx = db.CreateDbContext();
        ctx.Orders.Add(new Order { CustomerId = 1 });
        await ctx.SaveChangesAsync();
        (await ctx.Orders.CountAsync()).Should().Be(1);
    }
}`,
    },
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: 'UseInMemoryDatabase vs SQLite :memory: for constraint testing',
      before: `// UseInMemoryDatabase — silently ignores FK and unique constraints
services.AddDbContext<AppDbContext>(o =>
    o.UseInMemoryDatabase("Test"));

// Test appears to pass even with invalid data:
var order = new Order { CustomerId = 9999 }; // customer doesn't exist
db.Orders.Add(order);
await db.SaveChangesAsync(); // ← no exception! FK not enforced → false positive`,
      after: `// SQLite :memory: — enforces FK and unique constraints like production
services.RemoveAll<DbContextOptions<AppDbContext>>();
services.AddDbContext<AppDbContext>(o =>
    o.UseSqlite("DataSource=:memory:"));

var order = new Order { CustomerId = 9999 }; // customer doesn't exist
db.Orders.Add(order);
await db.SaveChangesAsync(); // ← throws DbUpdateException — FK violation caught`,
      note: 'UseInMemoryDatabase is convenient but misleads you: constraint violations pass silently in tests while throwing in production. SQLite :memory: gives production-parity SQL semantics at nearly the same speed. Use it as the default; escalate to Testcontainers only when you need stored procedures, JSON operators, or dialect-specific behaviour.',
    },
    {
      title: 'Hard-coded seeded IDs vs query-after-insert',
      before: `// Hard-coded IDs are fragile — break when seed order or identity reset changes
public ProductsTests(TestWebApp app)
{
    // Seeds 2 products — assumes they get Id = 1 and Id = 2
    db.Products.AddRange(p1, p2);
    db.SaveChanges();
}

[Fact]
public async Task GetProduct_ReturnsWidget()
{
    var result = await _client.GetFromJsonAsync<Product>("/api/products/1"); // ← fragile
    result!.Name.Should().Be("Widget");
}`,
      after: `// Query for the seeded entity to get its actual assigned ID
public ProductsTests(TestWebApp app)
{
    db.Products.AddRange(new Product { Name = "Widget" }, new Product { Name = "Gadget" });
    db.SaveChanges();
    WidgetId = db.Products.First(p => p.Name == "Widget").Id; // ← whatever EF assigned
}

public int WidgetId { get; }

[Fact]
public async Task GetProduct_ReturnsWidget()
{
    var result = await _client.GetFromJsonAsync<Product>(\$"/api/products/{WidgetId}");
    result!.Name.Should().Be("Widget");
}`,
      note: 'Hard-coded IDs create subtle dependencies on database identity sequences. When you reset the DB, re-order seed data, or run tests in parallel, the expected ID no longer matches. Always query for what you inserted and use the actual assigned key.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Not opening the SqliteConnection before EnsureCreated()',
      wrong: `// BUG: connection closes → in-memory DB is dropped immediately
var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>()
    .UseSqlite("DataSource=:memory:")
    .Options);
db.Database.EnsureCreated();
// SqliteConnection is implicitly closed after EnsureCreated — schema gone
// Every subsequent query returns table not found`,
      right: `// Keep the connection open — the in-memory DB exists only while connection is open
_conn = new SqliteConnection("DataSource=:memory:");
_conn.Open();   // ← must call this BEFORE building the DbContext
var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>()
    .UseSqlite(_conn)  // pass the open connection, not a connection string
    .Options);
db.Database.EnsureCreated();`,
      explanation: 'SQLite in-memory databases live only as long as the connection that created them. When EF Core internally opens and closes a connection (using a connection string), the DB is destroyed immediately. Pass an explicit SqliteConnection, call Open() before creating the DbContext, and keep the connection alive for the test class lifetime.',
    },
    {
      title: 'Forgetting RemoveAll<T>() before re-registering a service in ConfigureTestServices',
      wrong: `builder.ConfigureTestServices(services =>
{
    // BUG: adds a SECOND registration alongside the real one
    services.AddSingleton<IEmailService>(new FakeEmailService());
    // Injecting IEmailService still resolves the REAL one (last registered wins,
    // but the real was registered first and may shadow the fake in some patterns)
});`,
      right: `builder.ConfigureTestServices(services =>
{
    services.RemoveAll<IEmailService>();   // ← remove ALL existing registrations first
    services.AddSingleton<IEmailService>(new FakeEmailService());
    // Now only the fake is registered
});`,
      explanation: 'ConfigureTestServices runs after all real registrations. Adding a new registration without removing the old one results in two registrations for the same interface. Injecting the interface returns the last-registered (the fake), but IEnumerable<IEmailService> returns both — and some frameworks pick the first. Always RemoveAll<T>() before re-registering to eliminate ambiguity.',
    },
    {
      title: 'Not adding "public partial class Program {}" for WebApplicationFactory',
      wrong: `// Program.cs — top-level statement file, class is internal by default
var app = WebApplication.Create(args);
app.MapGet("/", () => "Hello");
app.Run();
// No public partial class Program

// Test project:
public class ApiTests : IClassFixture<WebApplicationFactory<Program>>
// CS0234: The type or namespace name 'Program' does not exist — compile error`,
      right: `// Program.cs — add at the bottom after app.Run()
var app = WebApplication.Create(args);
app.MapGet("/", () => "Hello");
app.Run();

public partial class Program { }  // ← makes the class accessible to the test project`,
      explanation: 'Top-level statement files generate an internal Program class. The test project (a separate assembly) cannot reference internal types. Adding "public partial class Program { }" at the bottom of Program.cs promotes it to public, enabling WebApplicationFactory<Program> in the test project.',
    },
    {
      title: 'Sharing mutable test state across parallel test classes',
      wrong: `// BUG: static field shared across parallel test classes
public class TestWebApp : WebApplicationFactory<Program>
{
    public static List<string> SentEmails = [];  // shared mutable static state!
}

// Test class A seeds emails, Test class B clears them — race condition`,
      right: `// Instance field — each test class fixture gets its own FakeEmailService
public class FakeEmailService : IEmailService
{
    public List<string> SentEmails { get; } = [];   // per-fixture, not static
    public Task SendAsync(string to, string _) { SentEmails.Add(to); return Task.CompletedTask; }
}

public class TestWebApp : WebApplicationFactory<Program>
{
    public FakeEmailService EmailSpy { get; } = new();
    protected override void ConfigureWebHost(IWebHostBuilder b) =>
        b.ConfigureTestServices(s => { s.RemoveAll<IEmailService>(); s.AddSingleton<IEmailService>(EmailSpy); });
}`,
      explanation: 'xUnit runs test classes in parallel by default. Static mutable state is shared across all parallel executions — one class can clear the list while another is asserting it. Use instance fields on the fixture so each test class gets its own spy, and only use static state for truly immutable data.',
    },
    {
      title: 'Using UseInMemoryDatabase for constraint-sensitive tests',
      wrong: `// UseInMemoryDatabase silently ignores unique indexes — test always passes
services.AddDbContext<AppDbContext>(o => o.UseInMemoryDatabase("test"));

[Fact]
public async Task CreateUser_Fails_WhenEmailAlreadyExists()
{
    db.Users.Add(new User { Email = "a@b.com" });
    db.Users.Add(new User { Email = "a@b.com" });   // duplicate
    await db.SaveChangesAsync();   // ← no exception! Unique index not enforced
    // Test passes even though production would throw — false confidence
}`,
      right: `// SQLite :memory: enforces unique indexes like production
services.AddDbContext<AppDbContext>(o => o.UseSqlite(_conn));

[Fact]
public async Task CreateUser_Fails_WhenEmailAlreadyExists()
{
    db.Users.Add(new User { Email = "a@b.com" });
    db.Users.Add(new User { Email = "a@b.com" });
    await Assert.ThrowsAsync<DbUpdateException>(() => db.SaveChangesAsync());
    // Correctly fails because SQLite enforces the unique index
}`,
      explanation: 'UseInMemoryDatabase is a pure in-memory dictionary — it has no concept of SQL constraints. Unique indexes, FK constraints, and check constraints are silently ignored. Tests pass that would throw in production, giving false confidence. Use SQLite :memory: for any test that touches constraints, or Testcontainers for full production-parity.',
    },
  ];

  challenge: Challenge = {
    title: 'Test a Products API',
    language: 'csharp',
    description: `Write tests for a simple Products API:
1. <strong>Unit test</strong> <code>ProductService.GetByIdAsync</code> — returns the product when found (stub the repo with NSubstitute), returns null when not found.
2. <strong>Integration test</strong> <code>GET /api/products</code> — set up <code>WebApplicationFactory</code> with SQLite <code>:memory:</code>, seed two products, assert the response returns both.
3. <strong>Integration test</strong> <code>POST /api/products</code> — assert the response is 201 Created with a Location header.`,
    hints: [
      'Unit test: Substitute.For<IProductRepository>() + _repo.FindAsync(1).Returns(product)',
      'Remember to add "public partial class Program { }" at the bottom of Program.cs',
      'In ConfigureTestServices, call RemoveAll<DbContextOptions<AppDbContext>>() before adding SQLite',
      'Keep the SqliteConnection open: _conn.Open() before creating the DbContext',
    ],
    starterCode: `// ProductService.cs
public class ProductService(IProductRepository repo)
{
    public Task<Product?> GetByIdAsync(int id) => repo.FindAsync(id);
    public async Task<Product> CreateAsync(CreateProductDto dto)
    {
        var p = new Product { Name = dto.Name, Price = dto.Price };
        await repo.AddAsync(p);
        return p;
    }
}

// Program.cs
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddDbContext<AppDbContext>(o => o.UseSqlServer("..."));
builder.Services.AddScoped<IProductRepository, ProductRepository>();
builder.Services.AddScoped<IProductService, ProductService>();
var app = builder.Build();
app.MapGet("/api/products", async (AppDbContext db) => await db.Products.ToListAsync());
app.MapPost("/api/products", async (CreateProductDto dto, IProductService svc) =>
{
    var p = await svc.CreateAsync(dto);
    return Results.CreatedAtRoute("GetProduct", new { id = p.Id }, p);
});
app.MapGet("/api/products/{id:int}", async (int id, AppDbContext db) =>
    await db.Products.FindAsync(id) is { } p ? Results.Ok(p) : Results.NotFound())
   .WithName("GetProduct");
app.Run();
public partial class Program { }`,
    solution: `// ── Unit tests ───────────────────────────────────────────────────────
public class ProductServiceTests
{
    private readonly IProductRepository _repo = Substitute.For<IProductRepository>();
    private ProductService Sut => new(_repo);

    [Fact]
    public async Task GetById_ReturnsProduct_WhenFound()
    {
        var expected = new Product { Id = 1, Name = "Widget", Price = 9.99m };
        _repo.FindAsync(1).Returns(expected);
        var result = await Sut.GetByIdAsync(1);
        result.Should().BeEquivalentTo(expected);
    }

    [Fact]
    public async Task GetById_ReturnsNull_WhenNotFound()
    {
        _repo.FindAsync(Arg.Any<int>()).Returns((Product?)null);
        (await Sut.GetByIdAsync(99)).Should().BeNull();
    }
}

// ── Integration tests ─────────────────────────────────────────────────
public class TestWebApp : WebApplicationFactory<Program>
{
    private readonly SqliteConnection _conn = new("DataSource=:memory:");

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        _conn.Open();
        builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.AddDbContext<AppDbContext>(o => o.UseSqlite(_conn));
        });
    }

    public void Seed(Action<AppDbContext> seed)
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.EnsureCreated();
        seed(db);
        db.SaveChanges();
    }
}

public class ProductsApiTests : IClassFixture<TestWebApp>
{
    private readonly HttpClient _client;

    public ProductsApiTests(TestWebApp app)
    {
        _client = app.CreateClient();
        app.Seed(db => db.Products.AddRange(
            new Product { Name = "Widget", Price = 9.99m },
            new Product { Name = "Gadget", Price = 24.99m }));
    }

    [Fact]
    public async Task GetProducts_ReturnsBoth()
    {
        var products = await _client.GetFromJsonAsync<Product[]>("/api/products");
        products.Should().HaveCount(2);
    }

    [Fact]
    public async Task PostProduct_Returns201WithLocation()
    {
        var dto      = new { Name = "Doohickey", Price = 4.99 };
        var response = await _client.PostAsJsonAsync("/api/products", dto);
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        response.Headers.Location.Should().NotBeNull();
    }
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the primary advantage of WebApplicationFactory over mocking every dependency?',
      options: [
        'It runs faster than unit tests because it skips serialisation',
        'It tests the real middleware pipeline, routing, auth, and serialisation together — verifying wiring correctness',
        'It runs tests in a separate process for isolation',
        'It automatically generates test data from the OpenAPI spec',
      ],
      answer: 1,
      explanation: 'WebApplicationFactory boots the real ASP.NET Core pipeline in-process. Requests flow through real middleware, routing, model binding, filters, authentication, and JSON serialisation — testing that all the pieces are correctly wired, not just that individual classes work in isolation.',
    },
    {
      q: 'Why is SQLite :memory: preferred over UseInMemoryDatabase for integration tests?',
      options: [
        'SQLite is significantly faster than the InMemory provider',
        'UseInMemoryDatabase does not support async operations',
        'SQLite enforces FK constraints and unique indexes that UseInMemoryDatabase silently ignores',
        'UseInMemoryDatabase requires a running database server',
      ],
      answer: 2,
      explanation: 'The EF Core InMemory provider has no SQL constraint enforcement — unique indexes, FK constraints, and check constraints are silently ignored. Tests pass that would throw in production, giving false confidence. SQLite :memory: uses real SQL semantics at nearly the same speed.',
    },
    {
      q: 'How do you replace a DI service for all tests in a WebApplicationFactory subclass?',
      options: [
        'Edit appsettings.json in the test project',
        'Call services.RemoveAll<T>() then re-add the fake inside ConfigureTestServices()',
        'Modify the static IServiceCollection at app startup',
        'Set ASPNETCORE_ENVIRONMENT=Test and use conditional registration in Program.cs',
      ],
      answer: 1,
      explanation: 'ConfigureTestServices runs after all real registrations. Without RemoveAll<T>(), the real service remains registered alongside the fake — both exist in the container. RemoveAll removes all registrations for that interface before the fake is added, ensuring only the test double is resolved.',
    },
    {
      q: 'What must you add to Program.cs to use WebApplicationFactory<Program> from a test project?',
      options: [
        'Nothing — top-level program files are always public',
        '"public partial class Program { }" at the bottom of Program.cs',
        'A using directive in the test project: "using extern alias Program"',
        'An InternalsVisibleTo attribute targeting the test assembly',
      ],
      answer: 1,
      explanation: 'Top-level statement files generate an internal Program class by default. The test project (a separate assembly) cannot reference internal types. Adding "public partial class Program { }" at the bottom of Program.cs makes the class public and accessible to the test project.',
    },
    {
      q: 'What happens if you close the SqliteConnection used by an in-memory SQLite DbContext?',
      options: [
        'The connection is automatically reopened on the next query',
        'The in-memory database is destroyed — all tables and data are gone',
        'EF Core persists the in-memory data to a temp file automatically',
        'Only writes are lost; reads still work from EF Core\'s change tracker',
      ],
      answer: 1,
      explanation: 'SQLite in-memory databases exist only while at least one connection to them is open. When the connection closes, the database is destroyed. You must keep the SqliteConnection open for the entire test class lifetime — pass the open connection object to DbContextOptionsBuilder, not a connection string.',
    },
    {
      q: 'What does Respawn do in a testing context?',
      options: [
        'It restarts the WebApplicationFactory between tests for a clean server state',
        'It efficiently resets a real database between tests by deleting rows in FK order without dropping tables',
        'It generates random test data based on your EF Core model',
        'It rolls back database transactions automatically after each test',
      ],
      answer: 1,
      explanation: 'Respawn introspects your database schema (FK relationships, table dependencies) and generates DELETE statements in the correct order to clean all data between tests without dropping and recreating tables. This is much faster than EnsureDeleted()/EnsureCreated() for large schemas and preserves reference data tables you can exclude.',
    },
    {
      q: 'When using IClassFixture<WebApplicationFactory<Program>>, how often is the app started?',
      options: [
        'Once per test method — a fresh app for each test',
        'Once per test class — shared across all test methods in the class',
        'Once per test run — shared across all test classes in the assembly',
        'Twice per class — once for setup and once for teardown',
      ],
      answer: 1,
      explanation: 'IClassFixture<T> creates one instance of T per test class and injects it into every test method\'s constructor. The WebApplicationFactory (and its in-memory server) starts once when the class begins and is disposed when the class is done. This is why seeding data in the constructor seeds once and all test methods share it.',
    },
  ];

  qna: QnaItem[] = [
    { q: 'Can I share one WebApplicationFactory across multiple test classes?', a: 'Yes — create a shared collection fixture: implement <code>IAsyncLifetime</code>, expose the factory and HttpClient, then use <code>[CollectionDefinition("Api")]</code> and <code>[Collection("Api")]</code> attributes. All test classes in the collection share one server and one startup cost. The trade-off is that tests must clean up after themselves (use Respawn or explicit deletes) because they share database state.' },
    { q: 'How do I test endpoints that require specific roles or claims?', a: 'Replace the auth scheme with a <code>TestAuthHandler</code> in <code>ConfigureTestServices</code>: <code>services.AddAuthentication("Test").AddScheme&lt;..., TestAuthHandler&gt;("Test", ...)</code>. The handler\'s <code>HandleAuthenticateAsync</code> returns a fixed <code>ClaimsPrincipal</code> with whatever claims the endpoint checks. For role-specific tests, create a separate factory or call <code>factory.WithWebHostBuilder()</code> with a different handler returning different claims.' },
    { q: 'Do I need a separate test project?', a: 'Best practice is a separate xUnit project (e.g. <code>MyApi.Tests</code>) that references the main project. This avoids shipping test-only packages (<code>xunit</code>, <code>NSubstitute</code>, <code>Testcontainers</code>) to production artifacts, and lets you reference <code>Program</code> from the test assembly without the <code>internal</code> visibility restriction.' },
    { q: 'How do I test that a background service processes messages?', a: 'Use <code>IHostedService</code> directly in unit tests: call <code>StartAsync(CancellationToken.None)</code> then trigger the condition (e.g., add a message to the channel), then call <code>StopAsync(CancellationToken.None)</code> and assert the outcome. For integration tests, start the full app with <code>WebApplicationFactory</code>, seed the input, wait with <code>Task.Delay</code> or poll with a retry loop (using <code>Polly</code>), then assert. Avoid <code>Thread.Sleep</code> — use a <code>SemaphoreSlim</code> in the fake service that you can await.' },
    { q: 'When should I use Testcontainers vs SQLite :memory:?', a: 'Use SQLite <code>:memory:</code> as the default for integration tests — it is fast, requires no Docker, enforces common SQL constraints, and works in CI with no extra setup. Escalate to Testcontainers when your code uses database-specific features: stored procedures, JSON operators (<code>jsonb</code>), proprietary type coercions, full-text search, or migrations that use dialect-specific syntax. Run Testcontainer tests in a separate project or <code>[Collection]</code> so they don\'t slow down the fast-feedback suite.' },
    { q: 'How do I test that a specific email was sent during an integration test?', a: 'Register a spy fake in <code>ConfigureTestServices</code>: <code>public class FakeEmailService : IEmailService { public List&lt;string&gt; SentTo { get; } = []; public Task SendAsync(string to, ...) { SentTo.Add(to); return Task.CompletedTask; } }</code>. Expose the fake on the <code>WebApplicationFactory</code> subclass (<code>public FakeEmailService EmailSpy { get; } = new();</code>) and assert against <code>factory.EmailSpy.SentTo</code> after the request.' },
    { q: 'How do I test minimal APIs vs controller endpoints — any difference?', a: 'No difference from the test\'s perspective. Both are reachable via the <code>HttpClient</code> returned by <code>WebApplicationFactory.CreateClient()</code>. The test sends an HTTP request and asserts the response status, body, and headers — the routing mechanism (minimal API or controller) is an implementation detail. The main difference is that minimal API handlers are harder to unit-test in isolation (they are lambda methods), so integration tests carry more weight.' },
    { q: 'My integration test intermittently fails — how do I debug flakiness?', a: 'Common causes: (1) <strong>Shared mutable state</strong> — static fields, leaked DB state from a prior test; fix with Respawn or per-test seeding. (2) <strong>Parallel execution race</strong> — use <code>[Collection("serial")]</code> to prevent parallelism. (3) <strong>Hard-coded IDs</strong> — seed order changed; query by name/value instead. (4) <strong>Time-dependent logic</strong> — inject an <code>ISystemClock</code> or <code>TimeProvider</code> and control time in tests. (5) <strong>Eventual consistency</strong> — background work not awaited; use a channel or completion signal instead of <code>Task.Delay</code>.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Unit tests verify logic with test doubles; integration tests use WebApplicationFactory to verify the full ASP.NET Core pipeline in-process — always pair SQLite :memory: for constraint-safe DB testing, RemoveAll<T>() before re-registering fakes, and add ValidateOnBuild to catch missing registrations early.',
    mustKnow: [
      'WebApplicationFactory boots the real pipeline in-process — use IClassFixture to start it once per test class',
      'Add <code>public partial class Program { }</code> to Program.cs so the test project can reference it',
      'ConfigureTestServices runs AFTER real registrations — always call RemoveAll<T>() before re-adding a fake',
      'SQLite :memory: enforces FK/unique constraints; UseInMemoryDatabase silently ignores them — default to SQLite',
      'Keep SqliteConnection open for the test class lifetime — closing it destroys the in-memory database',
      'TestAuthHandler replaces JWT complexity in integration tests — return any ClaimsPrincipal you need',
      'Testcontainers for production-parity (stored procs, dialect-specific features); Respawn to reset rows efficiently',
    ],
    interviewFocus: [
      'What is the difference between unit tests and integration tests — when do you use each?',
      'Why use SQLite :memory: instead of UseInMemoryDatabase for EF Core integration tests?',
      'Why must you call RemoveAll<T>() before re-registering a fake in ConfigureTestServices?',
      'How do you test a JWT-protected endpoint without issuing a real token?',
      'What is Respawn and why is it better than EnsureDeleted()/EnsureCreated() between tests?',
    ],
  };
}
