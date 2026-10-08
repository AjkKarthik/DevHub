import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-test-sqlite-in-memory-connection',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './sqlite-in-memory-connection.html',
  styleUrl: './sqlite-in-memory-connection.scss'
})
export class SqliteInMemoryConnectionSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "One connection, one database",
      "points": [
        "With SQLite, <code>Data Source=:memory:</code> creates a database that exists only for the connection that opened it. When that connection closes, the database is gone.",
        "EF Core opens and closes connections per operation when you give it a connection string. In the page's example each request's <code>DbContext</code> would therefore see a brand new, empty database.",
        "Nothing called <code>EnsureCreated()</code> or ran migrations either, so even within one connection there would be no <code>Users</code> table, and <code>GET /users/1</code> could not return OK.",
        "The EF Core testing docs describe the fix the page now uses: open a <code>SqliteConnection</code> yourself, keep it open for the whole test run, pass it to <code>UseSqlite(connection)</code>, and create the schema once."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Fixed factory setup",
      "language": "csharp",
      "code": "builder.ConfigureTestServices(services =>\n{\n    services.RemoveAll<DbContextOptions<AppDbContext>>();\n\n    var connection = new SqliteConnection(\"Data Source=:memory:\");\n    connection.Open();                          // keep the DB alive\n    services.AddSingleton(connection);\n    services.AddDbContext<AppDbContext>(o => o.UseSqlite(connection));\n});\n\n// after CreateClient():\nusing var scope = factory.Services.CreateScope();\nscope.ServiceProvider.GetRequiredService<AppDbContext>().Database.EnsureCreated();"
    },
    {
      "label": "Why the string version fails",
      "language": "csharp",
      "code": "// Request 1: new DbContext -> opens connection A -> empty DB A\n// Request 2: new DbContext -> opens connection B -> empty DB B\n// (A was deleted when its connection closed)\n//\n// And with no EnsureCreated(): 'no such table: Users'"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "The factory is shared through <code>IClassFixture</code>, so every test in the class uses the same open connection. What does that mean for data one test inserts?",
    "hint": "One connection means one database.",
    "solution": "All tests in the class share the same in-memory database, so rows inserted by one test are visible to the next. Reset data per test (delete rows, or wrap each test in a transaction that is rolled back), or create a fresh factory and connection per test if isolation matters more than speed."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "Data Source=:memory: gives one in-memory database for the whole app.",
      "reality": "It gives one database per open connection. EF Core opening a new connection means a new empty database."
    },
    {
      "thought": "EF Core creates the tables automatically on first use.",
      "reality": "Only if you call EnsureCreated() or apply migrations."
    }
  ];
}
