import { Component } from '@angular/core';
import { PageMetaComponent }      from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

const quickRef: QuickRefItem[] = [
  { name: 'WebApplicationFactory<T>',  type: 'class',    desc: 'Spins up the real ASP.NET pipeline in-process for integration tests.' },
  { name: 'CreateClient()',            type: 'method',   desc: 'Returns an HttpClient wired to the in-memory test server.' },
  { name: '[Fact] / [Theory]',         type: 'keyword',  desc: 'xUnit attributes for parameterless and data-driven test methods.' },
  { name: 'Substitute.For<T>()',       type: 'method',   desc: 'NSubstitute factory — creates a test double for an interface.' },
  { name: 'Mock<T>',                   type: 'class',    desc: 'Moq class for creating and configuring test doubles.' },
  { name: 'ConfigureTestServices()',   type: 'method',   desc: 'Override DI registrations inside WebApplicationFactory.' },
  { name: 'UseInMemoryDatabase()',     type: 'method',   desc: 'EF Core in-memory provider (logic tests; no SQL constraints).' },
  { name: 'UseSqlite(":memory:")',     type: 'method',   desc: 'SQLite in-memory provider (enforces FK/constraints, closer to prod).' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Unit tests vs integration tests',
    points: [
      '<strong>Unit tests</strong> isolate a class — inject test doubles for all dependencies, no HTTP, no database. Fast and precise. Use them to drive business logic.',
      '<strong>Integration tests</strong> spin up the real pipeline with <code>WebApplicationFactory&lt;T&gt;</code> and test routing, middleware, auth, and serialisation together.',
      'The rule of thumb: unit tests for logic correctness, integration tests for wiring correctness — both are necessary.',
    ],
  },
  {
    heading: 'WebApplicationFactory & in-memory server',
    points: [
      '<code>WebApplicationFactory&lt;TEntryPoint&gt;</code> implements <code>IClassFixture</code> so the app starts once per test class. Requests flow through the real middleware stack in-process — no network.',
      'Override <code>ConfigureWebHost</code> to swap DI registrations, change configuration, or replace the database before the test run.',
      '<code>CreateClient()</code> returns an <code>HttpClient</code> pre-wired to the in-memory server — use it exactly like a production client.',
    ],
  },
  {
    heading: 'Overriding DI for tests',
    points: [
      '<code>ConfigureTestServices(services =&gt; { ... })</code> runs after real registrations — call <code>services.RemoveAll&lt;T&gt;()</code> before re-registering to avoid duplicates.',
      'Typical swaps: replace a real <code>IEmailService</code> with a no-op fake, replace <code>DbContext</code> with an in-memory variant, replace <code>IHttpClientFactory</code> with a mocked handler.',
      'For JWT auth, replace the scheme with a <code>TestAuthHandler</code> that always returns a fixed <code>ClaimsPrincipal</code> — eliminates token complexity from integration tests.',
    ],
  },
  {
    heading: 'EF Core test strategies',
    points: [
      '<code>UseInMemoryDatabase</code> is fast but has no SQL constraints (no FK enforcement, no unique indexes).',
      '<code>UseSqlite(":memory:")</code> is nearly as fast and enforces constraints — the better default. Keep the <code>SqliteConnection</code> open for the test lifetime (closing drops the DB).',
      'Always call <code>EnsureCreated()</code> in test setup and <code>EnsureDeleted()</code> in teardown for a clean slate per test class.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Unit Test (xUnit + NSubstitute)',
    language: 'csharp',
    code: `public class ProductServiceTests
{
    private readonly IProductRepository _repo;
    private readonly ProductService _sut;

    public ProductServiceTests()
    {
        _repo = Substitute.For<IProductRepository>();
        _sut  = new ProductService(_repo);
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

        await act.Should().ThrowAsync<ArgumentException>();
    }
}`,
  },
  {
    label: 'Integration Test (WebApplicationFactory)',
    language: 'csharp',
    code: `public class CustomWebApp : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureTestServices(services =>
        {
            var desc = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
            if (desc != null) services.Remove(desc);

            services.AddDbContext<AppDbContext>(o =>
                o.UseSqlite("DataSource=:memory:"));
        });
    }
}

public class ProductsEndpointTests : IClassFixture<CustomWebApp>
{
    private readonly HttpClient _client;

    public ProductsEndpointTests(CustomWebApp app)
    {
        _client = app.CreateClient();

        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.OpenConnection();
        db.Database.EnsureCreated();
    }

    [Fact]
    public async Task GET_Products_Returns200()
    {
        var response = await _client.GetAsync("/api/products");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task POST_Product_Returns201WithLocation()
    {
        var dto = new { Name = "Widget", Price = 9.99 };
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
        _conn.Open();   // keep connection open — closing drops the DB

        var opts = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_conn)
            .Options;

        Db = new AppDbContext(opts);
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

    public OrderRepositoryTests(DbFixture f) => _db = f.Db;

    [Fact]
    public async Task AddOrder_PersistsWithItems()
    {
        var order = new Order { CustomerId = 1, Items = [new OrderItem { Sku = "A1" }] };
        _db.Orders.Add(order);
        await _db.SaveChangesAsync();

        var saved = await _db.Orders.Include(o => o.Items).FirstAsync();
        saved.Items.Should().HaveCount(1);
    }
}`,
  },
  {
    label: 'Overriding Services',
    language: 'csharp',
    code: `public class TestWebApp : WebApplicationFactory<Program>
{
    public FakeEmailService EmailSpy { get; } = new();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<IEmailService>();
            services.AddSingleton<IEmailService>(EmailSpy);

            // Replace JWT auth with a test scheme that auto-authenticates
            services.AddAuthentication("Test")
                .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>(
                    "Test", _ => { });
        });
    }
}

public class TestAuthHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> opts,
    ILoggerFactory logger,
    UrlEncoder encoder)
    : AuthenticationHandler<AuthenticationSchemeOptions>(opts, logger, encoder)
{
    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var claims   = new[] { new Claim(ClaimTypes.Name, "testuser"), new Claim("sub", "1") };
        var identity = new ClaimsIdentity(claims, "Test");
        var ticket   = new AuthenticationTicket(new ClaimsPrincipal(identity), "Test");
        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}`,
  },
  {
    label: 'Minimal API Integration Test',
    language: 'csharp',
    code: `// Make Program accessible: add "public partial class Program { }" to Program.cs

public class MinimalApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public MinimalApiTests(WebApplicationFactory<Program> app)
    {
        _client = app.WithWebHostBuilder(builder =>
        {
            builder.ConfigureTestServices(services =>
            {
                services.AddDbContext<AppDbContext>(o =>
                    o.UseInMemoryDatabase("MinApiTest"));
            });
        }).CreateClient();
    }

    [Fact]
    public async Task HealthCheck_ReturnsHealthy()
    {
        var result = await _client.GetStringAsync("/health");
        result.Should().Be("Healthy");
    }

    [Fact]
    public async Task GetTodo_Returns404_ForMissingId()
    {
        var resp = await _client.GetAsync("/todos/9999");
        resp.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}`,
  },
];

const challenge: Challenge = {
  title: 'Test a Products API',
  language: 'csharp',
  description: 'Write tests for a simple Products API:\n1. Unit test `ProductService.GetByIdAsync` — returns the product when found, returns null when not found.\n2. Integration test `GET /api/products` — seed two products via EF Core SQLite in-memory, assert the response contains both.',
  hints: [
    'Use NSubstitute: `_repo.FindAsync(1).Returns(product)`',
    'Share the WebApplicationFactory via `IClassFixture<T>` — one server per class',
    'In ConfigureTestServices, swap the real DbContext for SQLite ":memory:"',
    'Call db.Database.OpenConnection() before EnsureCreated() to keep the SQLite file alive',
  ],
  starterCode: `public class ProductService(IProductRepository repo)
{
    public Task<Product?> GetByIdAsync(int id) => repo.FindAsync(id);
}

// Program.cs
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddDbContext<AppDbContext>(o => o.UseSqlServer("..."));
builder.Services.AddScoped<IProductRepository, ProductRepository>();
var app = builder.Build();
app.MapGet("/api/products", async (AppDbContext db) => await db.Products.ToListAsync());
app.Run();
public partial class Program { }`,
  solution: `public class ProductServiceTests
{
    [Fact]
    public async Task GetById_ReturnsProduct_WhenFound()
    {
        var repo = Substitute.For<IProductRepository>();
        repo.FindAsync(1).Returns(new Product { Id = 1, Name = "Widget" });
        var result = await new ProductService(repo).GetByIdAsync(1);
        result!.Name.Should().Be("Widget");
    }

    [Fact]
    public async Task GetById_ReturnsNull_WhenNotFound()
    {
        var repo = Substitute.For<IProductRepository>();
        repo.FindAsync(Arg.Any<int>()).Returns((Product?)null);
        var result = await new ProductService(repo).GetByIdAsync(99);
        result.Should().BeNull();
    }
}

public class TestApp : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder b) =>
        b.ConfigureTestServices(s =>
        {
            s.RemoveAll<DbContextOptions<AppDbContext>>();
            s.AddDbContext<AppDbContext>(o => o.UseSqlite("DataSource=:memory:"));
        });
}

public class ProductsIntegrationTests : IClassFixture<TestApp>
{
    private readonly HttpClient _client;
    public ProductsIntegrationTests(TestApp app)
    {
        _client = app.CreateClient();
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.OpenConnection();
        db.Database.EnsureCreated();
        db.Products.AddRange(new Product { Name = "A" }, new Product { Name = "B" });
        db.SaveChanges();
    }

    [Fact]
    public async Task GetProducts_ReturnsBothProducts()
    {
        var products = await _client.GetFromJsonAsync<Product[]>("/api/products");
        products.Should().HaveCount(2);
    }
}`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What is the primary advantage of using WebApplicationFactory over mocking every dependency?',
    options: [
      'It is faster than unit tests',
      'It tests the real middleware pipeline, routing, and serialisation together',
      'It runs tests in a separate process',
      'It automatically generates test data',
    ],
    answer: 1,
    explanation: 'WebApplicationFactory spins up the real ASP.NET Core pipeline in-memory, so routing, filters, middleware, serialisation, and auth all behave as in production.',
  },
  {
    q: 'Why is SQLite :memory: preferred over UseInMemoryDatabase for integration tests?',
    options: [
      'SQLite is faster',
      'UseInMemoryDatabase does not support async operations',
      'SQLite enforces foreign key constraints and unique indexes that InMemory silently ignores',
      'UseInMemoryDatabase requires a real database server',
    ],
    answer: 2,
    explanation: 'The EF Core InMemory provider has no SQL constraint enforcement. SQLite ":memory:" uses real SQL rules, catching bugs that InMemory would miss.',
  },
  {
    q: 'How do you replace a DI service for a single test scenario in WebApplicationFactory?',
    options: [
      'Edit appsettings.json',
      'Use ConfigureTestServices() inside WithWebHostBuilder()',
      'Modify the static service collection',
      'Set an environment variable',
    ],
    answer: 1,
    explanation: 'ConfigureTestServices runs after the real registrations, so you can Remove and re-add any service specifically for that test.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'Can I share one WebApplicationFactory across multiple test classes?',
    a: 'Yes — use a shared fixture class that implements IAsyncLifetime, create the factory once, and pass it via IClassFixture<SharedFixture>. This avoids restarting the app for every class but means test isolation relies on data cleanup rather than fresh app state.',
  },
  {
    q: 'How do I test endpoints protected by JWT auth?',
    a: 'Replace the real auth scheme with a TestAuthHandler in ConfigureTestServices. The handler always returns a successful AuthenticateResult with your chosen claims. Alternatively, issue a real JWT in the test using the same key as the test configuration.',
  },
  {
    q: 'Do I need a separate test project?',
    a: 'Best practice is a separate xUnit project (e.g. MyApi.Tests) that references the main project. This avoids shipping test dependencies to production and allows referencing the public partial class Program marker without touching production code.',
  },
];

@Component({
  selector: 'app-aspnet-testing',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent, PageCompleteComponent],
  templateUrl: './testing.html',
  styleUrl: './testing.scss',
})
export class AspnetTesting {
  quickRef  = quickRef;
  theory    = theory;
  codeTabs  = codeTabs;
  challenge = challenge;
  quiz      = quiz;
  qna       = qna;
}
