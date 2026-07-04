import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-asnotracking-genuinely-untracked-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-asnotracking-queries-genuinely-arent-tracked-sqlite.html',
  styleUrl: './testing-asnotracking-queries-genuinely-arent-tracked-sqlite.scss',
})
export class TestingAsnotrackingQueriesGenuinelyArentTrackedSqliteSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own Common Mistake shows adding AsNoTracking() as the fix for change-tracker overhead — but nothing on the page proves the fix actually works for a SPECIFIC query, rather than trusting the method name alone',
      points: [
        'The main EF Core Basics page\'s "Forgetting AsNoTracking()" mistake shows the fix as simply chaining <code>.AsNoTracking()</code> onto a query. This is easy to verify visually in a code review for a SIMPLE query — but a more complex query involving <code>.Include()</code>, a custom projection, or a query built up across several service-layer method calls could accidentally lose the <code>AsNoTracking()</code> call along a refactor, and the ONLY symptom would be slightly higher memory/CPU use under load — nothing that fails a build or an obvious functional test.',
      ],
    },
    {
      heading: '<code>context.ChangeTracker.Entries().Count()</code> directly and deterministically proves whether a query attached anything to the tracker — using UseSqlite as the main page\'s own Q&A recommends, since UseInMemoryDatabase has no real SQL semantics to translate the query against',
      points: [
        'After running a query, <code>context.ChangeTracker.Entries()</code> enumerates every entity the CURRENT context instance is tracking. For a query correctly using <code>AsNoTracking()</code>, this count should be <code>0</code> regardless of how many rows the query returned. For the SAME query WITHOUT <code>AsNoTracking()</code>, the count should equal the number of rows returned. This turns "is this query read-only-safe" into a directly assertable, regression-proof fact — rather than something only a code reviewer scanning for the method name can catch.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A test proving GetActiveAsync (the main page\'s own AsNoTracking example) attaches ZERO entities to the tracker',
      language: 'csharp',
      code: `using Microsoft.EntityFrameworkCore;
using Xunit;

public class ProductServiceTrackingTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly ProductService _service;

    public ProductServiceTrackingTests()
    {
        // Real SQLite, in-memory — as the main page's own Q&A
        // recommends over UseInMemoryDatabase specifically because it
        // has genuine SQL semantics, not just an in-process fake store:
        var connection = new SqliteConnection("Data Source=:memory:");
        connection.Open();
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(connection)
            .Options;

        _db = new AppDbContext(options);
        _db.Database.EnsureCreated();
        _db.Products.AddRange(
            new Product { Name = "Laptop", Price = 999.99m, IsActive = true },
            new Product { Name = "Mouse",  Price = 19.99m,  IsActive = true },
            new Product { Name = "Old Model", Price = 49.99m, IsActive = false });
        _db.SaveChanges();
        _db.ChangeTracker.Clear();   // reset AFTER seeding, before the real test

        _service = new ProductService(_db);
    }

    [Fact]
    public async Task GetActiveAsync_ReturnsResults_ButAttachesZeroEntitiesToTracker()
    {
        var results = await _service.GetActiveAsync(default);

        Assert.Equal(2, results.Count);   // 2 active products exist

        // THE KEY ASSERTION: regardless of how many rows came back, the
        // change tracker should be tracking EXACTLY ZERO entities — this
        // is what actually proves AsNoTracking() is present and working,
        // not just that the query returned the right DATA:
        Assert.Equal(0, _db.ChangeTracker.Entries().Count());
    }

    public void Dispose() => _db.Dispose();
}`,
    },
    {
      label: 'The exact regression this test catches — AsNoTracking() silently dropped during a refactor',
      language: 'csharp',
      code: `// BEFORE a refactor — matches the main page's own correct example:
public Task<List<Product>> GetActiveAsync(CancellationToken ct)
    => db.Products
         .Where(p => p.IsActive)
         .OrderBy(p => p.Name)
         .Select(p => new Product { Id = p.Id, Name = p.Name, Price = p.Price })
         .AsNoTracking()
         .ToListAsync(ct);

// AFTER a "simplification" refactor — a developer restructures the
// query to add a new filter parameter, and in the process of moving
// the query into a separate expression variable, ACCIDENTALLY drops
// the .AsNoTracking() call (a genuinely easy mistake when refactoring
// a long fluent chain):
public Task<List<Product>> GetActiveAsync(CancellationToken ct, string? categoryFilter = null)
{
    var query = db.Products.Where(p => p.IsActive);

    if (categoryFilter is not null)
        query = query.Where(p => p.Category == categoryFilter);

    // BUG: '.AsNoTracking()' never made it into this rewritten version —
    // it compiles fine, runs fine, returns the CORRECT DATA, and passes
    // any test asserting only on the returned VALUES:
    return query.OrderBy(p => p.Name)
                 .Select(p => new Product { Id = p.Id, Name = p.Name, Price = p.Price })
                 .ToListAsync(ct);
}

// WITH THE BUG PRESENT: the test's data-content assertion
// ('Assert.Equal(2, results.Count)') STILL PASSES — the query still
// returns the correct 2 active products. Only the tracker-count
// assertion ('Assert.Equal(0, _db.ChangeTracker.Entries().Count())')
// FAILS, now reporting 2 tracked entities instead of 0 — directly
// surfacing the exact class of silent performance regression the main
// page's own Common Mistake warns about, the moment it's reintroduced.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The test in this subtopic uses UseSqlite("Data Source=:memory:") rather than UseInMemoryDatabase(), citing the main page\'s own Q&A guidance. Explain specifically why UseInMemoryDatabase would be a WORSE choice for THIS PARTICULAR test — one that verifies change-tracker behavior — beyond the general "no real SQL semantics" reason the main page gives for OTHER testing scenarios.',
    hint: 'Consider whether change tracking itself (as opposed to query TRANSLATION to SQL) is a provider-specific behavior or a provider-agnostic EF Core CORE feature — does the choice of database provider actually affect whether AsNoTracking() works correctly at all?',
    solution: `Interestingly, change tracking itself is NOT provider-specific — it's a
core EF Core feature implemented above the provider layer, so
AsNoTracking() would actually behave IDENTICALLY whether you're using
UseSqlite, UseSqlServer, or UseInMemoryDatabase. This means, for THIS
SPECIFIC test (verifying tracker entry counts), UseInMemoryDatabase
would not actually give a WRONG answer about tracking behavior.

However, there's still a good reason to prefer UseSqlite even for this
specific test: the main page's own broader guidance — "prefer SQLite
for integration tests that need real SQL behavior" — is really about
using ONE consistent, realistic test database setup across your ENTIRE
test suite, rather than switching providers based on which specific
behavior an individual test happens to verify. If a test file mixes
UseInMemoryDatabase for tracking tests and UseSqlite for query-
translation tests, a reader has to remember WHICH provider each test
uses and WHY — a genuine cognitive and maintenance cost. Using the SAME
SQLite setup everywhere means every test in the file exercises the
SAME database behavior, and any future test ADDED to this same test
class (e.g., one that verifies a WHERE clause translates correctly,
which DOES depend on real SQL semantics) automatically gets the correct
provider without a developer needing to remember to switch it.

The more precise, defensible answer: UseInMemoryDatabase would NOT
break the specific tracker-count assertion in this subtopic's test —
but consistently using UseSqlite across an entire test class (rather
than picking the "just-barely-sufficient" provider per test) is the
better default, since it means every test in that file is exercising
genuinely realistic database behavior, reducing the risk that a
DIFFERENT test added later silently relies on InMemoryDatabase's looser
semantics without anyone noticing.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'reviewing a query for the visible presence of the .AsNoTracking() method call in source code is sufficient to guarantee a query is genuinely read-only-safe.',
      reality: 'a refactor that restructures a fluent LINQ chain into intermediate variables can silently drop an AsNoTracking() call while the query still compiles, runs, and returns correct data — only an assertion on context.ChangeTracker.Entries().Count() directly proves whether tracking is actually disabled.',
    },
    {
      thought: 'a test asserting on the CORRECT DATA a query returns also verifies that query is not unnecessarily tracking entities.',
      reality: 'a query missing AsNoTracking() still returns the exact same correct data — the ONLY observable difference is the change tracker\'s entry count, which requires its own dedicated assertion separate from any check on the returned values.',
    },
    {
      thought: 'change tracking behavior in EF Core is provider-specific, so a test verifying AsNoTracking() must use the SAME database provider (like SQLite) that production actually uses, or the test result would be unreliable.',
      reality: 'change tracking is a core, provider-AGNOSTIC EF Core feature implemented above the provider layer — AsNoTracking() behaves identically regardless of which database provider is configured; the preference for UseSqlite over UseInMemoryDatabase is about testing REALISTIC QUERY TRANSLATION consistently across a whole test suite, not a requirement for THIS specific tracking assertion to be correct.',
    },
  ];
}
