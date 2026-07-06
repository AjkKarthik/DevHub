import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-linq-based-repository-methods-with-ef-core-in-memory-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-linq-based-repository-methods-with-ef-core-in-memory.html',
  styleUrl: './testing-linq-based-repository-methods-with-ef-core-in-memory.scss',
})
export class TestingLinqBasedRepositoryMethodsWithEfCoreInMemorySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main topic\'s EF Core examples, never actually verified',
      points: [
        'The main LINQ page has an entire "LINQ to Objects vs LINQ to EF" theory section explaining that "the same LINQ operator may behave differently" between in-memory and EF Core evaluation, and a Common Mistake specifically about accidentally materializing an EF Core query too early — but it never shows how to WRITE A TEST that would catch either of these regressions before they reach production.',
      ],
    },
    {
      heading: 'Two genuinely different testing strategies — and what each one actually proves',
      points: [
        'The EF Core IN-MEMORY PROVIDER (<code>Microsoft.EntityFrameworkCore.InMemory</code>) lets you run REAL <code>DbContext</code> LINQ queries against an in-process fake store, with no real database required — fast, no external dependency, good for testing REPOSITORY LOGIC (does this method return the right records for these inputs?).',
        'CRITICALLY, the in-memory provider does NOT use the same query translation pipeline as a real SQL provider — it evaluates queries largely in-memory (LINQ to Objects style) rather than genuinely generating and validating SQL. This means a query that WORKS against the in-memory provider can still THROW at runtime against a real SQL Server/PostgreSQL provider if it uses an operator the real provider cannot translate — the main topic\'s own "operators EF cannot translate" gotcha is a real gap the in-memory provider will NOT catch for you.',
      ],
    },
    {
      heading: 'What the in-memory provider IS good for testing',
      points: [
        'Filtering/sorting/grouping LOGIC correctness: does <code>Find(o =&gt; o.Amount &gt; 100)</code> return the right subset of a known seeded dataset? This is exactly the kind of test the previous subtopic\'s <code>OrderRepository.Find(Expression&lt;Func&lt;Order,bool&gt;&gt;)</code> deserves — seed a few <code>Order</code> rows into an in-memory <code>DbContext</code>, call the repository method, and assert the returned set matches expectations.',
        'N+1 query REGRESSIONS are HARDER to catch with the in-memory provider specifically, since it does not execute real round-trip SQL queries the way a real database does — for genuinely verifying "does this <code>Select</code> avoid firing one query per row," you need either a real (test) database with query LOGGING enabled, or EF Core\'s own <code>IDbCommandInterceptor</code>/logging infrastructure counting actual command executions — the in-memory provider\'s query count characteristics do not perfectly mirror a real provider\'s.',
      ],
    },
    {
      heading: 'Testing the eager-vs-lazy materialization mistake directly',
      points: [
        'The main topic\'s "materialising with ToList() in the middle of an EF Core chain" mistake CAN be verified with a plain unit test, even in-memory: assert that a repository method\'s return type is <code>IQueryable&lt;T&gt;</code> (not already materialized) at the point filters are meant to compose — a method signature returning <code>IQueryable&lt;Order&gt;</code> that INTERNALLY calls <code>.ToList()</code> too early would still COMPILE with that signature (since <code>List&lt;T&gt;.AsQueryable()</code> satisfies it), so this specific bug needs either a code-review discipline or, more reliably, asserting on QUERY EXECUTION COUNT via a logging interceptor rather than the return type alone.',
        'A more directly testable version of the SAME concern: verify a repository method that is SUPPOSED to filter server-side actually returns a LAZY <code>IQueryable&lt;T&gt;</code> the caller can further compose — chain an ADDITIONAL <code>.Where()</code> onto the repository\'s result and confirm the final filtered set is correct, proving the method didn\'t silently materialize and discard queryability partway through.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Testing repository filtering logic with the EF Core in-memory provider',
      language: 'csharp',
      code: `using Microsoft.EntityFrameworkCore;

public class AppDbContext : DbContext
{
    public DbSet<Order> Orders => Set<Order>();
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
}

public class Order
{
    public int Id { get; set; }
    public decimal Amount { get; set; }
    public bool IsActive { get; set; }
}

public class OrderRepository(AppDbContext db)
{
    public IQueryable<Order> Find(Expression<Func<Order, bool>> predicate)
        => db.Orders.Where(predicate);
}

public class OrderRepositoryTests
{
    private AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()) // unique DB per test — isolation
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task Find_ReturnsOnlyMatchingOrders()
    {
        await using var db = CreateContext();
        db.Orders.AddRange(
            new Order { Id = 1, Amount = 50m,  IsActive = true },
            new Order { Id = 2, Amount = 150m, IsActive = true },
            new Order { Id = 3, Amount = 200m, IsActive = false });
        await db.SaveChangesAsync();

        var repo = new OrderRepository(db);
        var results = await repo.Find(o => o.Amount > 100 && o.IsActive).ToListAsync();

        Assert.Single(results);
        Assert.Equal(2, results[0].Id);
    }
}`,
    },
    {
      label: 'Proving the repository result stays queryable — catching early materialization',
      language: 'csharp',
      code: `[Fact]
public async Task Find_ReturnsLazyIQueryable_ComposableWithFurtherFilters()
{
    await using var db = CreateContext();
    db.Orders.AddRange(
        new Order { Id = 1, Amount = 50m,  IsActive = true },
        new Order { Id = 2, Amount = 150m, IsActive = true },
        new Order { Id = 3, Amount = 300m, IsActive = true });
    await db.SaveChangesAsync();

    var repo = new OrderRepository(db);

    // If Find() had a bug that called .ToList() too early (the main topic's
    // "materialising mid-chain" mistake), this ADDITIONAL .Where() would
    // still technically compile (List<T> has its own Where via LINQ to
    // Objects) — but composing it directly onto the result and verifying
    // the RIGHT final set is the practical way to prove queryability
    // was preserved all the way through, matching the intended design.
    var furtherFiltered = repo.Find(o => o.IsActive)
                              .Where(o => o.Amount > 100)
                              .OrderByDescending(o => o.Amount);

    var results = await furtherFiltered.ToListAsync();

    Assert.Equal(2, results.Count);
    Assert.Equal(300m, results[0].Amount); // correctly ordered descending
    Assert.Equal(150m, results[1].Amount);
}`,
    },
    {
      label: 'What the in-memory provider does NOT catch — a real translation gap',
      language: 'csharp',
      code: `// A predicate using a CUSTOM C# method — untranslatable by a REAL SQL provider.
static bool IsHighValue(decimal amount) => amount > 100;

public IQueryable<Order> FindHighValue(IQueryable<Order> source)
    => source.Where(o => IsHighValue(o.Amount)); // custom method call in the expression

[Fact]
public async Task FindHighValue_WorksAgainstTheInMemoryProvider()
{
    await using var db = CreateContext();
    db.Orders.Add(new Order { Id = 1, Amount = 150m, IsActive = true });
    await db.SaveChangesAsync();

    // This PASSES against the in-memory provider — it evaluates largely
    // in-memory rather than genuinely validating SQL translatability.
    var results = await FindHighValue(db.Orders).ToListAsync();
    Assert.Single(results);
}

// BUT the exact same code, run against a REAL SQL Server/PostgreSQL
// provider, throws InvalidOperationException — EF Core's real query
// translator has no SQL equivalent for an arbitrary C# method call.
//
// This is precisely the main topic's "LINQ to EF" gotcha: the in-memory
// provider's pass does NOT prove the code is safe against a real database.
// For genuine translation-safety confidence, either:
//   1. Run a SMALL SET of critical queries against a real (test) database
//      provider (e.g. SQLite in-memory mode, which DOES validate SQL
//      translation, unlike the EF InMemory provider), or
//   2. Rely on integration tests against a real staging database before
//      deploying query logic that uses anything beyond simple property
//      comparisons and standard LINQ operators.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Write a test proving that <code>OrderRepository.Find</code> returns an EMPTY list (not an exception, not null) when no orders match the predicate — a boundary case worth its own explicit test alongside the "returns matching orders" happy path.',
    hint: 'Seed the in-memory context with orders that all have IsActive = false or low amounts, call repo.Find with a predicate none of them satisfy, and assert the resulting list is empty (Assert.Empty) rather than null or throwing.',
    solution: `[Fact]
public async Task Find_ReturnsEmptyList_WhenNoOrdersMatch()
{
    await using var db = CreateContext();
    db.Orders.AddRange(
        new Order { Id = 1, Amount = 10m, IsActive = false },
        new Order { Id = 2, Amount = 20m, IsActive = false });
    await db.SaveChangesAsync();

    var repo = new OrderRepository(db);
    var results = await repo.Find(o => o.Amount > 1000).ToListAsync();

    Assert.Empty(results); // not null, not an exception — a clean empty result
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a LINQ query that passes its tests against the EF Core in-memory provider is guaranteed to work correctly against a real SQL Server or PostgreSQL database.',
      reality: 'the in-memory provider does NOT use the same query translation pipeline as a real SQL provider — a query using an untranslatable construct (like a custom C# method call in a predicate) can pass in-memory while throwing InvalidOperationException against a real database, exactly matching the main topic\'s own "operators EF cannot translate" warning.',
    },
    {
      thought: 'the EF Core in-memory provider is a reliable way to test for N+1 query regressions, since you can just count how many "queries" ran.',
      reality: 'the in-memory provider does not execute real round-trip SQL commands the way a genuine database provider does, so its query-count characteristics do not perfectly mirror production behavior — catching N+1 regressions reliably needs either a real test database with query logging or EF Core\'s own command interceptor infrastructure.',
    },
    {
      thought: 'if a repository method\'s return type is declared as IQueryable&lt;T&gt;, that alone proves it hasn\'t accidentally materialized the query too early internally.',
      reality: 'a method that calls .ToList() internally and then .AsQueryable() on the result still satisfies an IQueryable&lt;T&gt; return type while having already lost server-side composability — proving queryability was preserved requires composing an ADDITIONAL filter onto the result and verifying it still produces the correct final set, not just checking the declared return type.',
    },
  ];
}
