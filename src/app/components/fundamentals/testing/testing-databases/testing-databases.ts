import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-testing-databases',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
            QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './testing-databases.html',
  styleUrl: './testing-databases.scss',
})
export class TestingDatabases {
  quickRef: QuickRefItem[] = [
    { name: 'SQLite :memory:',       type: 'keyword', desc: 'In-process in-memory DB — fastest option, no Docker needed.' },
    { name: 'Testcontainers',        type: 'keyword', desc: 'Real Postgres/MySQL in a Docker container — production-faithful.' },
    { name: 'Transaction rollback',  type: 'keyword', desc: 'Begin transaction before each test, rollback after — DB state reset with no commits.' },
    { name: 'Database seeding',      type: 'keyword', desc: 'Insert known fixture data before tests run so assertions have predictable targets.' },
    { name: 'Repository pattern',    type: 'keyword', desc: 'Abstracts DB access behind an interface — easy to swap real repo for a fake in tests.' },
    { name: 'EF Core InMemory',      type: 'keyword', desc: '.NET in-memory EF Core provider — fast but misses SQL-specific constraints.' },
  ];

  theory: TheoryPoint[] = [
    { heading: 'Strategies for Database Tests', points: [
      'In-memory DB (SQLite, EF Core InMemory): fastest, no infrastructure, but misses dialect-specific behaviour.',
      'Real DB via Testcontainers: slower startup but production-faithful — catches migration issues.',
      'Shared test DB: fastest for large suites but requires careful isolation between tests.',
      'Embedded DB (H2 for Java): option in JVM ecosystems — similar trade-offs to SQLite.',
    ]},
    { heading: 'Transaction Rollback Pattern', points: [
      'Begin a transaction before each test in beforeEach.',
      'Run the test — all writes are uncommitted and invisible to other connections.',
      'Rollback in afterEach — the DB is back to exactly the state before the test.',
      'Limitation: does not work if the SUT manages its own transaction scope.',
    ]},
    { heading: 'Database Seeding', points: [
      'Seed deterministic fixture data (known IDs, predictable values) before each test.',
      'Use factories or builder patterns to create test data programmatically.',
      'Clean seed data between tests with truncate + re-seed or transaction rollback.',
      'Never seed production-like random data — tests must be deterministic.',
    ]},
    { heading: 'Repository Pattern and Testability', points: [
      'An interface (IUserRepository) makes the data layer swappable.',
      'Unit tests use a fake (InMemoryUserRepository).',
      'Integration tests use the real repository against a test database.',
      'This split gives both speed (unit) and confidence (integration).',
    ]},
  ];

  codeTabs: CodeTab[] = [
    { label: 'SQLite In-Memory', language: 'typescript', code:
`import { DataSource } from 'typeorm';
import { User } from './user.entity';
import { UserRepository } from './user.repository';

let ds: DataSource;
let repo: UserRepository;

beforeAll(async () => {
  ds = new DataSource({
    type: 'sqlite',
    database: ':memory:',
    synchronize: true,        // auto-creates schema — only for tests
    entities: [User],
    logging: false,
  });
  await ds.initialize();
  repo = new UserRepository(ds.getRepository(User));
});

afterAll(async () => { await ds.destroy(); });

beforeEach(async () => {
  await ds.getRepository(User).clear(); // reset between tests
});

test('saves and retrieves a user', async () => {
  await repo.save({ name: 'Alice', email: 'alice@example.com' });
  const users = await repo.findAll();
  expect(users).toHaveLength(1);
  expect(users[0].name).toBe('Alice');
});` },
    { label: 'Transaction Rollback', language: 'typescript', code:
`import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Prisma does not natively support savepoints — use per-test schema instead.
// With raw pg or typeorm you can use beginTransaction / rollback:
import { Pool, PoolClient } from 'pg';

const pool = new Pool({ connectionString: process.env.TEST_DB_URL });
let client: PoolClient;

beforeEach(async () => {
  client = await pool.connect();
  await client.query('BEGIN');
});

afterEach(async () => {
  await client.query('ROLLBACK');
  client.release();
});

test('insert is visible within transaction but rolled back after', async () => {
  await client.query("INSERT INTO users (name) VALUES ('Bob')");
  const { rows } = await client.query("SELECT * FROM users WHERE name='Bob'");
  expect(rows).toHaveLength(1);
  // After test: ROLLBACK — 'Bob' is gone
});` },
    { label: 'EF Core InMemory (.NET)', language: 'csharp', code:
`using Microsoft.EntityFrameworkCore;
using Xunit;

public class UserRepositoryTests
{
    private AppDbContext CreateContext()
    {
        var opts = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString()) // unique per test
            .Options;
        var ctx = new AppDbContext(opts);
        ctx.Database.EnsureCreated();
        return ctx;
    }

    [Fact]
    public async Task SaveUser_CanBeRetrieved()
    {
        await using var ctx = CreateContext();
        var repo = new UserRepository(ctx);

        await repo.SaveAsync(new User { Name = "Alice", Email = "alice@example.com" });
        var users = await repo.GetAllAsync();

        Assert.Single(users);
        Assert.Equal("Alice", users[0].Name);
    }
}` },
    { label: 'Seeding Pattern', language: 'typescript', code:
`// seed helper — deterministic fixture data
async function seedUsers(prisma: PrismaClient) {
  return prisma.user.createMany({
    data: [
      { id: 1, name: 'Alice', email: 'alice@example.com', role: 'admin' },
      { id: 2, name: 'Bob',   email: 'bob@example.com',   role: 'user'  },
    ],
    skipDuplicates: true,
  });
}

// Builder pattern for flexible test data
class UserBuilder {
  private data = { name: 'Test User', email: 'test@example.com', role: 'user' };
  withName(name: string) { this.data.name = name; return this; }
  withRole(role: string) { this.data.role = role; return this; }
  build() { return { ...this.data }; }
}

test('admin can access all users', async () => {
  await seedUsers(prisma);
  const admin = new UserBuilder().withRole('admin').build();
  // ...
});` },
  ];

  mistakes: CommonMistake[] = [
    { title: 'Using production database for tests', wrong: 'TEST_DB_URL=postgresql://prod-server/myapp', right: 'TEST_DB_URL=postgresql://localhost/myapp_test', explanation: 'Tests must never touch production data. Always use a dedicated test database that can be wiped and re-seeded freely.' },
    { title: 'EF Core InMemory for constraint testing', wrong: 'UseInMemoryDatabase() and testing unique constraints or FK cascades', right: 'Use SQLite or Testcontainers Postgres to test DB constraints', explanation: 'EF Core InMemory does not enforce unique constraints or foreign keys — tests pass in-memory but fail against a real DB.' },
    { title: 'Not clearing DB state between tests', wrong: 'seed once in beforeAll, multiple tests modify the same rows', right: 'beforeEach(() => { await truncate(); await seed(); })', explanation: 'Dirty data from a previous test causes false failures or false passes in subsequent tests.' },
    { title: 'Synchronize: true in non-test environments', wrong: 'synchronize: true in TypeORM production config', right: 'synchronize: true only in test config; use migrations in prod', explanation: 'TypeORM synchronize drops and recreates columns to match entity definitions — catastrophic on a production database.' },
    { title: 'Seeding with random/auto-generated IDs', wrong: 'user = await repo.create({ name: "Alice" }) // auto-generated GUID', right: 'user = await repo.create({ id: "fixed-uuid-1", name: "Alice" })', explanation: 'Tests that assert on IDs or relations need deterministic IDs. Random IDs make tests non-repeatable and harder to debug.' },
  ];

  challenge: Challenge = {
    title: 'Test a repository with SQLite in-memory',
    language: 'typescript',
    description: 'Using SQLite in-memory (or a simple Map as a fake), write tests for a TodoRepository with add(text) and getAll() methods. Test: adding an item increases count, items are retrievable, and clearing removes all items.',
    hints: [
      'A Map-based fake repository is a valid in-memory approach if you don\'t have SQLite set up.',
      'Test getAll() returns items in insertion order.',
    ],
    starterCode:
`class TodoRepository {
  private todos: { id: number; text: string }[] = [];
  private nextId = 1;

  add(text: string) { this.todos.push({ id: this.nextId++, text }); }
  getAll() { return [...this.todos]; }
  clear() { this.todos = []; this.nextId = 1; }
}

// Write tests here`,
    solution:
`class TodoRepository {
  private todos: { id: number; text: string }[] = [];
  private nextId = 1;

  add(text: string) { this.todos.push({ id: this.nextId++, text }); }
  getAll() { return [...this.todos]; }
  clear() { this.todos = []; this.nextId = 1; }
}

describe('TodoRepository', () => {
  let repo: TodoRepository;

  beforeEach(() => { repo = new TodoRepository(); });

  test('starts empty', () => {
    expect(repo.getAll()).toHaveLength(0);
  });

  test('add increases item count', () => {
    repo.add('Buy milk');
    expect(repo.getAll()).toHaveLength(1);
  });

  test('items are retrievable with correct text', () => {
    repo.add('Write tests');
    expect(repo.getAll()[0].text).toBe('Write tests');
  });

  test('clear removes all items', () => {
    repo.add('Item 1');
    repo.add('Item 2');
    repo.clear();
    expect(repo.getAll()).toHaveLength(0);
  });
});`,
  };

  quiz: QuizQuestion[] = [
    { q: 'Why is EF Core InMemory provider not recommended for testing database constraints?', options: ['It is too slow', 'It does not enforce unique constraints or foreign keys', 'It requires a running database server', 'It only supports SQL Server'], answer: 1, explanation: 'EF Core InMemory is a simple in-memory store — it does not run SQL or enforce DB constraints. Tests pass in-memory but fail against a real database that enforces them.' },
    { q: 'What is the advantage of the transaction rollback pattern for DB tests?', options: ['It is the only way to reset a database', 'It commits data faster', 'It resets DB state without deleting data — just roll back the uncommitted transaction', 'It works with EF Core InMemory'], answer: 2, explanation: 'Rolling back means no data was ever committed. The DB returns to exactly its pre-test state with minimal I/O — faster than truncate and re-seed.' },
    { q: 'When should you use Testcontainers over SQLite for testing?', options: ['Always — Testcontainers is always better', 'When you need to test PostgreSQL/MySQL-specific features like JSON operators or full-text search', 'Only in production environments', 'When Docker is not available'], answer: 1, explanation: 'SQLite is faster but does not support dialect-specific SQL. Use Testcontainers to test against the actual DB engine (Postgres, MySQL, MSSQL) when dialect features matter.' },
  { q: 'What is the recommended approach for database integration tests?', options: ['Use a shared staging database', 'Use a real database in a Docker container per test run, reset between tests', 'Use in-memory H2/SQLite always', 'Mock all database calls'], answer: 1, explanation: 'Testcontainers spins up real Docker database instances per test run. This tests against the same DB engine as production, catches schema/query issues, and provides clean state. Far more reliable than mocking or using different DB engines.' },
  { q: 'What is the best strategy for isolating test data between tests?', options: ['Truncate all tables before each test', 'Wrap each test in a transaction and rollback after', 'Use separate tables per test', 'Reset the entire database between tests'], answer: 1, explanation: 'Transaction rollback (wrap test in a transaction, rollback in afterEach) is fastest — no data remains. Only works if the ORM/DB supports it in test mode. Alternative: TRUNCATE relevant tables in beforeEach.' },
  { q: 'What is a database migration strategy for CI integration tests?', options: ['Apply migrations manually before running CI', 'Run Flyway/Liquibase/Prisma migrate in test setup against a clean DB', 'Skip migrations in tests', 'Use a pre-seeded dump'], answer: 1, explanation: 'Run migrations (Flyway, Prisma migrate, Liquibase) in the test setup against the test DB container. This ensures the schema matches production. Seed reference data in a beforeAll, reset mutable data in beforeEach.' },
  ];

  qna: QnaItem[] = [
    { q: 'Should I use a real database or a fake in unit tests?', a: 'Unit tests should use a fake (in-memory repository) — no real DB, no I/O, millisecond speed. Integration tests use the real database to verify SQL queries, migrations, and constraints. The repository pattern makes this split easy.' },
    { q: 'How do I handle database migrations in test setups?', a: 'Run migrations as part of the test setup (beforeAll). With Testcontainers, start the container, then apply migrations before seeding. With SQLite, `synchronize: true` is acceptable for tests. Never apply migrations to the production DB during test runs.' },
    { q: 'What is a good seeding strategy for complex relational data?', a: 'Use the builder pattern (UserBuilder, OrderBuilder) for flexible test data, and factory functions for common fixtures. Keep seed data minimal — only create what each test actually needs. Shared fixtures lead to tests that are hard to understand in isolation.' },
  { q: 'How do you test database transactions in integration tests?', a: 'Verify atomicity: insert rows in a transaction, force a failure mid-transaction (throw inside the TX), assert the previously inserted rows do NOT exist after rollback. Test idempotency: run the same operation twice, assert DB state is consistent. Use the real DB — mocking transactions gives false confidence.' },
  { q: 'How do you use Testcontainers for database tests in Node.js?', a: 'const container = await new PostgreSqlContainer().start(). Get connection string with container.getConnectionUri(). Run Prisma: DATABASE_URL=container.getConnectionUri() npx prisma migrate deploy. Run tests against the container. In afterAll: await container.stop(). Each CI run gets a fresh container with no shared state.' },
  { q: 'What is a seed script in database testing?', a: 'A seed script pre-populates the database with reference data needed for tests (lookup tables, admin users, test accounts). Run in beforeAll for expensive data or beforeEach for mutable data. Keep seeds minimal — only what tests actually need. Organise seed factories that generate realistic test data for different scenarios.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Test databases with in-memory SQLite for speed or Testcontainers for production-faithful tests — always reset state between tests.',
    mustKnow: [
      'SQLite :memory: — fastest, no Docker, misses dialect features',
      'Testcontainers — real DB engine in Docker, production-faithful',
      'EF Core InMemory — does NOT enforce constraints (use SQLite instead)',
      'Transaction rollback — fastest state reset, no commits to disk',
      'Seed deterministic fixture data; never use random IDs in tests',
      'Repository pattern lets you swap real repo for fake in unit tests',
    ],
    interviewFocus: [
      'Trade-off between in-memory DB vs real DB for tests',
      'Why EF Core InMemory is insufficient for constraint testing',
      'Transaction rollback pattern for fast DB state reset',
    ],
  };
}
