import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-dapper-sqlite-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-dapper-repositories-with-in-memory-sqlite.html',
  styleUrl: './testing-dapper-repositories-with-in-memory-sqlite.scss',
})
export class TestingDapperRepositoriesWithInMemorySqliteSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Dapper Repositories Are Testable Against a Real (In-Memory) Database — No Mocking Required',
      points: [
        'None of the main page\'s own repository methods (GetAllAsync, GetByIdAsync, CreateAsync) are ever shown under test. Because Dapper\'s extension methods operate on the plain IDbConnection interface, and Microsoft.Data.Sqlite fully implements that interface, an in-memory SQLite database ("Data Source=:memory:") can stand in for SQL Server in a test — real SQL execution, real parameter binding, real row mapping, with no mocking framework and no actual database server involved.',
        'This is meaningfully different from mocking IDbConnection directly, which Dapper\'s own extension methods make awkward since QueryAsync&lt;T&gt; is a static extension method rather than a virtual interface member a mock can intercept. The in-memory database approach tests the REAL SQL the repository sends — catching a genuine syntax error or column-name typo that a mock could never catch.',
      ],
    },
    {
      heading: 'The Shared-Connection Rule Only Applies Inside One Test',
      points: [
        'In-memory SQLite databases are scoped to the CONNECTION OBJECT, not the connection string — the moment the connection that created the database closes, the data is gone. A new SqliteConnection(":memory:") opened afterward connects to a brand-new, empty database, even with an identical connection string. Every repository call inside one test must reuse the SAME open connection instance.',
        'This appears to contradict the main page\'s own "Registering IDbConnection as Singleton" Common Mistake — but that guidance targets PRODUCTION request handling, where a shared connection would be accessed concurrently across simultaneous requests. In a single test, one open in-memory connection used sequentially for setup and assertions is the correct, standard pattern — there is no concurrent access to make it unsafe.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'In-memory SQLite test fixture',
      language: 'csharp',
      code: `public class SqliteProductRepositoryTests : IAsyncLifetime
{
    private SqliteConnection _connection = null!;
    private ProductRepository _repo = null!;

    public async Task InitializeAsync()
    {
        // The SAME connection instance stays open for the whole test —
        // closing it would destroy the in-memory database.
        _connection = new SqliteConnection("Data Source=:memory:");
        await _connection.OpenAsync();

        await _connection.ExecuteAsync(@"
            CREATE TABLE Products (
                Id    INTEGER PRIMARY KEY AUTOINCREMENT,
                Name  TEXT NOT NULL,
                Price DECIMAL NOT NULL
            );");

        _repo = new ProductRepository(_connection);
    }

    public Task DisposeAsync()
    {
        _connection.Dispose();
        return Task.CompletedTask;
    }
}`,
    },
    {
      label: 'Tests — real SQL, real row mapping, no mocks',
      language: 'csharp',
      code: `public class SqliteProductRepositoryTests
{
    [Fact]
    public async Task CreateAsync_Then_GetByIdAsync_Returns_The_Same_Row()
    {
        await _repo.CreateAsync(new Product { Name = "Keyboard", Price = 49.99m });

        var products = (await _repo.GetAllAsync()).ToList();
        Assert.Single(products);

        var found = await _repo.GetByIdAsync(products[0].Id);
        Assert.NotNull(found);
        Assert.Equal("Keyboard", found!.Name);
    }

    [Fact]
    public async Task GetByIdAsync_Returns_Null_For_Missing_Id()
    {
        var result = await _repo.GetByIdAsync(999);
        // Proves QuerySingleOrDefaultAsync's "OrDefault" behavior against a
        // REAL empty result set — not a mock's assumption about what it returns.
        Assert.Null(result);
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate "simplifies" the fixture above by creating a fresh <code>new SqliteConnection("Data Source=:memory:")</code> inside EACH test method instead of once in <code>InitializeAsync</code>, reasoning that it keeps tests more isolated from each other. What breaks, and why does it look like it should work?',
    hint: 'Think about what "in-memory" actually means for SQLite — is the data attached to the connection STRING, or to the CONNECTION OBJECT?',
    solution: `Nothing breaks within a SINGLE test method that creates its own
connection and does all its setup and assertions against that one
instance — that part is fine, and arguably even more isolated.

The break happens if the refactor also removes the shared _connection
field the repository was constructed with, on the assumption that the
same connection STRING means "the same database": each
new SqliteConnection("Data Source=:memory:") call, even with the
byte-for-byte identical connection string, opens a connection to a
brand-new, completely empty in-memory database — because SQLite's
in-memory mode scopes the data to the CONNECTION OBJECT itself, not
the connection string. A CreateAsync call against connection A and a
GetByIdAsync call against a freshly-opened connection B — even though
both say "Data Source=:memory:" — see two totally unrelated empty
databases.

The fix is exactly what the fixture does: open ONE connection, keep it
open for the whole test (or at minimum for every operation that needs
to see the same data), and only dispose it at the very end.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Dapper repository methods can\'t be tested without mocking IDbConnection, since QueryAsync/ExecuteAsync are Dapper\'s own methods, not something the repository controls.',
      reality: 'IDbConnection is just an interface — swap in a real, fast in-memory SQLite connection instead of mocking, and the repository\'s REAL SQL runs against a REAL (if temporary) database, catching a genuine syntax or column-name bug that a mock could never catch.',
    },
    {
      thought: 'opening a fresh SqliteConnection with the same "Data Source=:memory:" string in a second test method reconnects to the same in-memory data left over from a previous test.',
      reality: 'in-memory SQLite scopes its data to the CONNECTION OBJECT, not the connection string — a new connection, even with an identical string, opens a brand-new empty database. Data only persists as long as the ORIGINAL connection stays open.',
    },
    {
      thought: 'reusing one open IDbConnection instance across every repository call in a test violates the main page\'s own "never register IDbConnection as Singleton" guidance.',
      reality: 'that guidance targets PRODUCTION request handling, where a shared connection would be accessed concurrently across simultaneous requests. Reusing one connection sequentially within a single test has no concurrent access and is the standard, correct pattern for in-memory SQLite testing.',
    },
  ];
}
