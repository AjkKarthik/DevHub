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
  selector: 'app-integration-testing',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
            QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './integration-testing.html',
  styleUrl: './integration-testing.scss',
})
export class IntegrationTesting {
  quickRef: QuickRefItem[] = [
    { name: 'Integration Test',         type: 'keyword', desc: 'Tests multiple units together with real dependencies (DB, HTTP, queue).' },
    { name: 'Testcontainers',           type: 'keyword', desc: 'Library that spins up Docker containers (Postgres, Redis, etc.) for tests.' },
    { name: 'WebApplicationFactory',    type: 'class',   desc: '.NET class that starts a real ASP.NET Core pipeline in-process for testing.' },
    { name: 'Supertest',                type: 'keyword', desc: 'Node.js library for testing HTTP servers without starting a real port.' },
    { name: 'Transaction rollback',     type: 'keyword', desc: 'Wrap each test in a DB transaction and rollback after — fast state reset.' },
    { name: 'Test isolation',           type: 'keyword', desc: 'Each test must start with known state regardless of test order.' },
  ];

  theory: TheoryPoint[] = [
    { heading: 'What Integration Tests Cover', points: [
      'Integration tests verify that units work correctly when wired together.',
      'They catch mismatches between a service and its real database schema.',
      'They verify HTTP routing, middleware, and serialisation — things unit tests cannot reach.',
      'The cost: slower than unit tests, require infrastructure (DB, message broker, cache).',
    ]},
    { heading: 'Testcontainers', points: [
      'Testcontainers spins up a real Docker container (Postgres, MySQL, Redis, Kafka) for each test run.',
      'Containers are started before the test suite and stopped after — completely isolated from dev data.',
      'Available for Node.js (`testcontainers` npm), .NET (`Testcontainers.PostgreSql`), Java, Go, Python.',
      'Requires Docker to be running on the test machine (or in CI with Docker-in-Docker).',
    ]},
    { heading: 'WebApplicationFactory (.NET)', points: [
      'Creates a real in-process ASP.NET Core host — all middleware, DI, routing wired up.',
      'Use CreateClient() to get an HttpClient pointed at the test server.',
      'Override services with test doubles via ConfigureTestServices().',
      'Pair with Testcontainers to get a real database behind the API.',
    ]},
    { heading: 'State Management Between Tests', points: [
      'Option 1: Transaction rollback — begin a transaction before each test, rollback after. Fast but fragile with nested transactions.',
      'Option 2: Recreate schema — drop and recreate tables. Slow but reliable.',
      'Option 3: Seed + delete — insert test data, delete after. Works across connections.',
      'Never share mutable state between tests — use beforeEach to reset.',
    ]},
  ];

  codeTabs: CodeTab[] = [
    { label: 'Supertest (Node)', language: 'typescript', code:
`import request from 'supertest';
import { app } from '../src/app';
import { db } from '../src/db';

beforeEach(async () => { await db.migrate.latest(); await db.seed.run(); });
afterEach(async () => { await db.migrate.rollback(); });
afterAll(async () => { await db.destroy(); });

describe('GET /users/:id', () => {
  test('returns the seeded user', async () => {
    const res = await request(app).get('/users/1');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 1, name: 'Alice' });
  });

  test('returns 404 for unknown user', async () => {
    const res = await request(app).get('/users/999');
    expect(res.status).toBe(404);
  });
});` },
    { label: 'Testcontainers (Node)', language: 'typescript', code:
`import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

beforeAll(async () => {
  const container = await new PostgreSqlContainer().start();
  process.env.DATABASE_URL = container.getConnectionUri();
  prisma = new PrismaClient();
  await prisma.\$executeRawUnsafe('-- run migrations here');
});

afterAll(async () => { await prisma.\$disconnect(); });

test('creates a user and finds it', async () => {
  const user = await prisma.user.create({
    data: { name: 'Bob', email: 'bob@example.com' },
  });
  const found = await prisma.user.findUnique({ where: { id: user.id } });
  expect(found?.name).toBe('Bob');
});` },
    { label: 'WebApplicationFactory (.NET)', language: 'csharp', code:
`public class UsersApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public UsersApiTests(WebApplicationFactory<Program> factory)
    {
        _client = factory
            .WithWebHostBuilder(builder =>
                builder.ConfigureTestServices(services =>
                {
                    // Replace real DB with SQLite in-memory for speed
                    services.RemoveAll<DbContextOptions<AppDbContext>>();
                    services.AddDbContext<AppDbContext>(opt =>
                        opt.UseSqlite("Data Source=:memory:"));
                }))
            .CreateClient();
    }

    [Fact]
    public async Task GetUser_ReturnsOk()
    {
        var response = await _client.GetAsync("/users/1");
        response.EnsureSuccessStatusCode();
        var user = await response.Content.ReadFromJsonAsync<UserDto>();
        Assert.NotNull(user);
    }
}` },
  ];

  mistakes: CommonMistake[] = [
    { title: 'Running integration tests in the unit test suite', wrong: 'mix DB tests with pure unit tests in one Jest run', right: 'separate suites: "jest --testPathPattern=unit" and "jest --testPathPattern=integration"', explanation: 'Integration tests are 10–100x slower. Mixing them makes every CI check painfully slow.' },
    { title: 'Shared mutable DB state', wrong: 'seed once in beforeAll and never reset — tests pass alone but fail in order', right: 'reset state in beforeEach or use transaction rollback per test', explanation: 'Test A creates a record that test B then finds unexpectedly. Tests must be order-independent.' },
    { title: 'Testing through the real DB without rollback', wrong: 'INSERT in test, commit, never clean up', right: 'wrap each test in a transaction and rollback, or delete inserted rows in afterEach', explanation: 'Leftover data causes intermittent failures and makes debugging extremely painful.' },
    { title: 'Hardcoding localhost ports in tests', wrong: 'const BASE = "http://localhost:3000"', right: 'use supertest(app) or WebApplicationFactory — no real port needed', explanation: 'Real ports conflict in parallel CI runs and require the server to be running separately.' },
    { title: 'Testing too many layers in one test', wrong: 'one integration test verifies UI → API → service → DB → email → queue', right: 'one test per layer boundary; keep scope to two or three layers max', explanation: 'A massive integration test is slow, fragile, and hard to debug. Each integration test should verify one specific boundary.' },
  ];

  challenge: Challenge = {
    title: 'Write an integration test for a REST endpoint',
    language: 'typescript',
    description: 'Using Supertest, write integration tests for a POST /items endpoint that creates an item in an in-memory store and returns it with status 201. Test success case and validation failure (missing name field → 400).',
    hints: [
      'Use supertest: request(app).post("/items").send({ name: "Widget" })',
      'Test the 400 path by omitting required fields.',
    ],
    starterCode:
`import express from 'express';
import request from 'supertest';

const app = express();
app.use(express.json());

const items: { id: number; name: string }[] = [];
let nextId = 1;

app.post('/items', (req, res) => {
  if (!req.body.name) return res.status(400).json({ error: 'name required' });
  const item = { id: nextId++, name: req.body.name };
  items.push(item);
  res.status(201).json(item);
});

// Write tests here`,
    solution:
`import express from 'express';
import request from 'supertest';

const app = express();
app.use(express.json());

const items: { id: number; name: string }[] = [];
let nextId = 1;

app.post('/items', (req, res) => {
  if (!req.body.name) return res.status(400).json({ error: 'name required' });
  const item = { id: nextId++, name: req.body.name };
  items.push(item);
  res.status(201).json(item);
});

describe('POST /items', () => {
  beforeEach(() => { items.length = 0; nextId = 1; });

  test('creates item and returns 201', async () => {
    const res = await request(app).post('/items').send({ name: 'Widget' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: 1, name: 'Widget' });
  });

  test('returns 400 when name is missing', async () => {
    const res = await request(app).post('/items').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('name required');
  });
});`,
  };

  quiz: QuizQuestion[] = [
    { q: 'What does Testcontainers do?', options: ['Mocks database calls in memory', 'Spins up real Docker containers (Postgres, Redis, etc.) for test runs', 'Provides a fake HTTP server', 'Runs tests in isolated Node.js workers'], answer: 1, explanation: 'Testcontainers starts real Docker containers before the test suite and tears them down after — giving you a genuine database with no production data risk.' },
    { q: 'Why should integration tests be in a separate test suite from unit tests?', options: ['Integration tests cannot use the same assertion library', 'Unit tests require a browser; integration tests do not', 'Integration tests are much slower and should not block the fast unit-test feedback loop', 'They are never separated in practice'], answer: 2, explanation: 'Unit tests run in milliseconds and give immediate feedback. Mixing slow integration tests delays that loop. Separate suites let you run unit tests on every save and integration tests on CI.' },
    { q: 'What is the fastest way to reset database state between integration tests?', options: ['Truncate all tables', 'Start a new Docker container per test', 'Wrap each test in a transaction and rollback after', 'Delete the entire database and recreate it'], answer: 2, explanation: 'Transaction rollback is the fastest reset strategy — no data is ever committed to disk. Starting new containers per test is extremely slow.' },
  ];

  qna: QnaItem[] = [
    { q: 'How do I run Testcontainers in CI (GitHub Actions)?', a: 'GitHub Actions runners have Docker installed by default. Just run your test command — Testcontainers will pull and start the container automatically. For self-hosted runners, ensure Docker is available. The `TESTCONTAINERS_RYUK_DISABLED=true` env var can help in restricted environments.' },
    { q: 'Should I use an in-memory SQLite DB or Testcontainers for .NET tests?', a: 'SQLite in-memory is faster but risks missing PostgreSQL/MSSQL-specific behaviour (JSON operators, full-text search, specific types). Use SQLite for speed in unit-like integration tests. Use Testcontainers with the real DB engine for tests that must match production exactly.' },
    { q: 'How many integration tests should I have relative to unit tests?', a: 'The testing pyramid suggests integration tests should be the middle tier — more than E2E but fewer than unit tests. A typical ratio is 10:1 (unit to integration). Focus integration tests on critical API contracts, DB schema assumptions, and cross-service boundaries.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Integration tests verify real collaborations — use Testcontainers for real DBs, Supertest/WAF for APIs, and reset state per test.',
    mustKnow: [
      'Integration tests test units wired together with real dependencies',
      'Testcontainers: Docker containers for Postgres, Redis, Kafka in tests',
      'Supertest: HTTP testing without a real server port',
      'WebApplicationFactory: in-process ASP.NET Core for .NET integration tests',
      'Always reset DB state between tests (rollback, truncate, or seed+delete)',
      'Run integration tests in a separate suite from unit tests',
    ],
    interviewFocus: [
      'What an integration test covers vs a unit test',
      'How Testcontainers enables real-infrastructure testing',
      'Strategies for isolating DB state between tests',
    ],
  };
}
