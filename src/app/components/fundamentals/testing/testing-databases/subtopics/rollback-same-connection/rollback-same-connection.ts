import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-test-rollback-same-connection',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './rollback-same-connection.html',
  styleUrl: './rollback-same-connection.scss'
})
export class RollbackSameConnectionSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Measured on PostgreSQL 16",
      "points": [
        "The page's example inserted and selected through the same <code>client</code> it had called <code>BEGIN</code> on, so that particular test worked. Real code under test usually calls <code>pool.query</code> or its own repository, which takes a different connection.",
        "Run against a local PostgreSQL 16 with node-postgres: a row inserted on the test client after <code>BEGIN</code> was not visible to <code>pool.query</code> (count 0), because it was uncommitted on another connection.",
        "A row written through <code>pool.query</code> during the same test was committed immediately. After the test client ran <code>ROLLBACK</code>, the test client's row was gone but the pool's row was still there (count 1).",
        "So the rollback pattern only isolates tests when the code under test receives the transaction-bound client. The tab now says so, and its unused Prisma import (and the irrelevant savepoint remark) were removed."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Measured",
      "language": "typescript",
      "code": "const pool = new Pool({ /* test database */ });\nconst appCreateUser = (name: string) =>\n  pool.query('insert into users (name) values ($1)', [name]);   // app uses the pool\n\nconst client = await pool.connect();\nawait client.query('BEGIN');\nawait client.query(\"insert into users (name) values ('TestOnly')\");\n// pool sees TestOnly: 0 rows (uncommitted elsewhere)\n\nawait appCreateUser('FromApp');          // autocommits on its own connection\nawait client.query('ROLLBACK');\n// TestOnly: 0 rows, FromApp: 1 row   <- leaked into the next test"
    },
    {
      "label": "Inject the client",
      "language": "typescript",
      "code": "type Db = Pick<PoolClient, 'query'>;\n\nclass UserRepository {\n  constructor(private db: Db) {}\n  create(name: string) { return this.db.query('insert into users (name) values ($1)', [name]); }\n}\n\nbeforeEach(async () => {\n  client = await pool.connect();\n  await client.query('BEGIN');\n  repo = new UserRepository(client);   // same connection as the transaction\n});\n\nafterEach(async () => { await client.query('ROLLBACK'); client.release(); });"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "An Express route under test calls <code>repo.create()</code>, and <code>repo</code> is a module-level singleton built with the pool. The test wraps everything in BEGIN/ROLLBACK on its own client. Will the row the route creates be removed after the test?",
    "hint": "Which connection does the singleton use?",
    "solution": "No. The singleton uses the pool, so its insert autocommits on another connection and survives the ROLLBACK. Either build the app with the test client injected (a factory such as createApp({ db: client })), or reset the tables in beforeEach instead."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "Wrapping a test in BEGIN and ROLLBACK undoes everything that happened during the test.",
      "reality": "It undoes only statements sent on that connection inside that transaction."
    },
    {
      "thought": "The test client and the app see the same data during the test.",
      "reality": "Uncommitted rows are visible only to the connection that wrote them."
    }
  ];
}
