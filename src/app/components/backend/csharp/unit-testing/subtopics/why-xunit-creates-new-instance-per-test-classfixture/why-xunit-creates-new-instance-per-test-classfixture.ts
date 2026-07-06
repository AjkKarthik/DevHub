import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-why-xunit-creates-new-instance-per-test-classfixture-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './why-xunit-creates-new-instance-per-test-classfixture.html',
  styleUrl: './why-xunit-creates-new-instance-per-test-classfixture.scss',
})
export class WhyXunitCreatesNewInstancePerTestClassfixtureSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states the rule in one line — this is why xUnit chose it, and what it structurally guarantees',
      points: [
        'The main Unit Testing page states "xUnit creates a new instance of the test class for every test method" — a genuinely deliberate design choice, DIFFERENT from NUnit/MSTest\'s traditional model of one shared instance per class plus <code>[SetUp]</code>/<code>[TearDown]</code> attributes that reset state between tests. xUnit\'s designers chose per-test isolation specifically to eliminate an entire category of bug: state accidentally leaking between tests because a shared instance field was not properly reset.',
      ],
    },
    {
      heading: 'The structural guarantee: constructor = Arrange, field state can never leak between tests, Dispose = teardown',
      points: [
        'Because EVERY test method runs against its OWN, freshly-constructed instance of the test class, an instance field set in the constructor (or during one test method) can NEVER be accidentally observed by a DIFFERENT test method — there is no shared state to leak, by construction, rather than by developer discipline. This eliminates a classic flaky-test cause: test order dependence, where Test B only passes if Test A happened to run first and left behind some field state Test B silently relies on.',
        'The constructor runs before EVERY test as the Arrange phase; <code>IDisposable.Dispose()</code> (if the test class implements it) runs after EVERY test as teardown — this is why xUnit has no separate <code>[SetUp]</code>/<code>[TearDown]</code> attributes at all: the constructor and Dispose already fill that role naturally, once per test, with the language\'s own object lifecycle doing the work.',
      ],
    },
    {
      heading: 'IClassFixture<T> is the deliberate, explicit exception — opting back INTO shared state, for expensive fixtures only',
      points: [
        'Some setup genuinely IS expensive enough that recreating it fresh for every single test would be wasteful — a database connection, a web application factory, a large seeded dataset. <code>IClassFixture&lt;TFixture&gt;</code> lets a test class declare it wants ONE shared <code>TFixture</code> instance constructed ONCE for the whole class (xUnit injects it via the test class\'s constructor), explicitly opting back into the shared-state model the per-test-instance default otherwise avoids.',
        'This is a genuinely deliberate trade-off, not a loophole: <code>IClassFixture</code> requires the test AUTHOR to actively reason about whether the fixture is safe to share (read-only reference data, a connection pool) versus something that genuinely needs per-test isolation (mutable state that one test\'s actions could corrupt for the next) — the DEFAULT behavior protects you from this class of bug automatically; <code>IClassFixture</code> asks you to take on that responsibility explicitly, only where the performance win is worth it.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Proving each test method genuinely gets its own fresh instance',
      language: 'csharp',
      code: `public class InstanceIsolationTests
{
    private int _counter = 0; // instance field — NOT static

    public InstanceIsolationTests()
    {
        // This constructor runs ONCE PER TEST METHOD — it is the
        // Arrange phase for every single test, executed fresh:
        Console.WriteLine("Constructor ran — fresh instance");
    }

    [Fact]
    public void FirstTest_IncrementsCounter()
    {
        _counter++;
        Assert.Equal(1, _counter); // always 1 — this instance's field
                                    // starts at 0 every time
    }

    [Fact]
    public void SecondTest_IncrementsCounter()
    {
        _counter++;
        // If xUnit shared ONE instance across both tests (like
        // NUnit's classic model without explicit [SetUp] reset),
        // this could be 2 if FirstTest ran before it. Because xUnit
        // constructs a BRAND NEW instance for THIS test, _counter is
        // guaranteed to start at 0 here too, regardless of test order:
        Assert.Equal(1, _counter);
    }
}
// Output when both tests run: "Constructor ran — fresh instance"
// printed TWICE — once per test method, proving genuine isolation.`,
    },
    {
      label: 'Constructor as Arrange, Dispose as teardown — no [SetUp]/[TearDown] needed',
      language: 'csharp',
      code: `public class DatabaseTests : IDisposable
{
    private readonly SqliteConnection _connection;

    public DatabaseTests()
    {
        // Runs before EVERY test — this IS the "Arrange" / [SetUp]
        // equivalent, using the language's own constructor:
        _connection = new SqliteConnection("Data Source=:memory:");
        _connection.Open();
        SeedTestData(_connection);
    }

    [Fact]
    public void Query_ReturnsExpectedRow()
    {
        // _connection is a FRESH, freshly-seeded in-memory DB —
        // completely uninfluenced by any other test method:
        var result = _connection.QuerySingle<int>("SELECT COUNT(*) FROM Users");
        Assert.Equal(3, result);
    }

    public void Dispose()
    {
        // Runs after EVERY test — this IS the "TearDown" equivalent:
        _connection.Dispose();
    }

    private static void SeedTestData(SqliteConnection conn) { /* ... */ }
}`,
    },
    {
      label: 'IClassFixture — deliberately opting back into ONE shared, expensive instance',
      language: 'csharp',
      code: `// An expensive fixture — constructed ONCE for the whole test class,
// NOT once per test method:
public class DatabaseFixture : IDisposable
{
    public SqliteConnection Connection { get; }

    public DatabaseFixture()
    {
        Connection = new SqliteConnection("Data Source=:memory:");
        Connection.Open();
        SeedLargeReadOnlyDataset(Connection); // expensive — do this ONCE
    }

    public void Dispose() => Connection.Dispose();

    private static void SeedLargeReadOnlyDataset(SqliteConnection conn) { /* ... */ }
}

// Opting explicitly into sharing — xUnit injects the SAME
// DatabaseFixture instance into every test method's constructor call:
public class ReadOnlyQueryTests : IClassFixture<DatabaseFixture>
{
    private readonly DatabaseFixture _fixture;

    public ReadOnlyQueryTests(DatabaseFixture fixture) => _fixture = fixture;

    [Fact]
    public void Query_ReturnsExpectedCount()
    {
        // Uses the SHARED connection — safe here specifically because
        // this dataset is read-only across all tests in this class;
        // no test mutates it in a way that could affect another:
        var count = _fixture.Connection.QuerySingle<int>("SELECT COUNT(*) FROM Products");
        Assert.True(count > 0);
    }
}
// The TEST CLASS itself (ReadOnlyQueryTests) is STILL constructed
// fresh per test method, exactly as before — only the FIXTURE
// (DatabaseFixture) is genuinely shared across all of them.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A test class has a mutable in-memory list field populated in the constructor, and one test method REMOVES an item from that list. Explain why this is safe under xUnit\'s default per-test-instance model, but would NOT be safe if the same list were instead exposed via an <code>IClassFixture</code>.',
    hint: 'Consider what "fresh instance per test" guarantees about the list field\'s starting state versus what IClassFixture explicitly shares across every test method in the class.',
    solution: `public class ListTests
{
    private readonly List<int> _items;

    public ListTests()
    {
        // Runs FRESH before EVERY test method — this list starts as
        // [1, 2, 3] every single time, regardless of what any OTHER
        // test method did to ITS OWN copy of this list:
        _items = new List<int> { 1, 2, 3 };
    }

    [Fact]
    public void RemoveFirst_LeavesTwoItems()
    {
        _items.RemoveAt(0);
        Assert.Equal(2, _items.Count); // ALWAYS passes — this
                                        // test's OWN _items instance
                                        // started at 3 items, mutation
                                        // here can never affect any
                                        // OTHER test's list
    }
}

// If _items were instead exposed through an IClassFixture (a SINGLE
// shared instance across the whole test class), this SAME mutation
// would be genuinely unsafe:
public class SharedListFixture
{
    public List<int> Items { get; } = new() { 1, 2, 3 }; // constructed
                                                          // ONCE for
                                                          // the WHOLE
                                                          // class
}

public class UnsafeSharedListTests : IClassFixture<SharedListFixture>
{
    private readonly SharedListFixture _fixture;
    public UnsafeSharedListTests(SharedListFixture fixture) => _fixture = fixture;

    [Fact]
    public void RemoveFirst_LeavesTwoItems()
    {
        _fixture.Items.RemoveAt(0); // MUTATES the ONE shared list —
                                    // now permanently affects every
                                    // OTHER test in this class too
        Assert.Equal(2, _fixture.Items.Count); // passes NOW, but has
                                                // corrupted the shared
                                                // state for whichever
                                                // test runs next
    }

    [Fact]
    public void Items_StartsWithThreeElements()
    {
        // This test's outcome now depends on TEST ORDER — if
        // RemoveFirst_LeavesTwoItems ran first, _fixture.Items only
        // has 2 elements here, not the 3 a fresh instance would have
        // guaranteed. This is EXACTLY the test-order-dependence bug
        // xUnit's default per-test-instance model exists to prevent —
        // IClassFixture deliberately opts back into the risk of it,
        // for the sake of avoiding expensive re-setup.
        Assert.Equal(3, _fixture.Items.Count); // FLAKY — depends on order
    }
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'xUnit\'s per-test-instance model is just an implementation detail with no practical consequence for how tests are written.',
      reality: 'it is precisely what eliminates test-order dependence by construction — instance field state can never leak between test methods, since each one runs against its own freshly-constructed instance, unlike shared-instance frameworks that rely on [SetUp]/[TearDown] discipline to reset state.',
    },
    {
      thought: 'IClassFixture<T> is just a convenience for reducing boilerplate — functionally equivalent to constructing the same object fresh in every test\'s constructor.',
      reality: 'IClassFixture deliberately shares ONE instance across every test method in the class — a genuinely different, riskier trade-off that requires the fixture\'s state to be safe to share (read-only, or a connection pool), since one test\'s mutations ARE visible to subsequent tests.',
    },
    {
      thought: 'xUnit lacks [SetUp]/[TearDown] attributes because it is missing a feature NUnit and MSTest have.',
      reality: 'xUnit deliberately omits them because the constructor and IDisposable.Dispose() already fill that exact role, once per test, using the language\'s own object lifecycle — this is a design choice reinforcing the per-test-isolation guarantee, not a missing feature.',
    },
  ];
}
