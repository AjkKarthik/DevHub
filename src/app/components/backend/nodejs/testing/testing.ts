import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../components/shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../../components/shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../../components/shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../components/shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../../components/shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../../components/shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../../components/shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../../components/shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../../components/shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../../components/shared/page-complete/page-complete';

@Component({
  selector: 'app-node-testing',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './testing.html',
  styleUrl: './testing.scss'
})
export class NodeTesting {
  quickRef: QuickRefItem[] = [
    { name: 'jest.fn()', type: 'function', desc: 'Create a mock function. Track calls, arguments, return values.' },
    { name: 'jest.spyOn(obj, method)', type: 'function', desc: 'Spy on an existing method — replace with mock, restore with mockRestore().' },
    { name: 'jest.mock("module")', type: 'function', desc: 'Replace an entire module with auto-mocked or manual mock version.' },
    { name: 'supertest(app)', type: 'function', desc: 'Test HTTP endpoints without starting a real server. Returns a test agent.' },
    { name: 'beforeEach / afterEach', type: 'function', desc: 'Setup/teardown per test. beforeAll/afterAll for suite-level setup.' },
    { name: 'expect(x).toEqual(y)', type: 'method', desc: 'Deep equality assertion. toBe for reference equality. toMatchObject for partial match.' },
    { name: 'testcontainers', type: 'keyword', desc: 'Spin up real Docker containers (Postgres, Redis) for integration tests.' },
    { name: 'node:test', type: 'keyword', desc: 'Built-in Node.js test runner (v18+). No dependencies: import { test, describe } from "node:test".' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Testing Pyramid and Test Types',
      points: [
        'The testing pyramid: unit tests (many, fast, isolated) → integration tests (fewer, test component boundaries) → end-to-end tests (few, test full user flows). Each layer provides different confidence. Most ROI is in integration tests for APIs — they catch real integration bugs without the fragility of E2E.',
        'Unit tests: test one function/class in isolation. Mock all dependencies. Fast (<5ms per test). Test business logic, transformations, and edge cases. Use Jest or the built-in node:test runner (v18+).',
        'Integration tests for REST APIs: use Supertest to send real HTTP requests to your Express app without starting a real server. Test the full request/response cycle including middleware, validation, and error handling. Use a real test database or testcontainers for DB-layer tests.',
        'Contract tests: verify that your API matches its contract (OpenAPI spec, or client expectations). Tools: Pact (consumer-driven contracts), dredd (OpenAPI spec testing). Catches breaking changes before they reach consumers.',
      ]
    },
    {
      heading: 'Mocking and Test Isolation',
      points: [
        'Mock external dependencies to isolate units: jest.mock("../services/emailService") replaces the entire module with auto-mocked stubs. All exported functions become jest.fn(). Use mockResolvedValue() and mockRejectedValue() for async mock returns.',
        'jest.spyOn(object, "method") wraps an existing method with a spy without fully replacing it. Call .mockImplementation() to change behavior, or just let the original run while tracking calls. Restore with mockRestore() in afterEach to avoid test pollution.',
        'Module mocking pitfall: jest.mock() is hoisted to the top of the file (before imports). The mock factory runs before any imports. If you need dynamic mock values, use jest.spyOn() or return a mutable object from the mock factory.',
        'Avoid over-mocking: mocking DB layers for integration tests defeats the purpose. Use a real test DB (in Docker via testcontainers, or an in-memory SQLite for SQL apps). Mock only at system boundaries: external HTTP APIs, email providers, payment gateways.',
      ]
    },
    {
      heading: 'Testing Async Code and Databases',
      points: [
        'Jest handles async tests with async/await: it("should do X", async () => { ... }). Return the promise or await it. Forgetting to await an assertion on a promise means the test passes before the assertion runs.',
        'Test database setup: create a fresh schema per test suite (beforeAll), clean tables between tests (beforeEach with TRUNCATE or DELETE FROM), tear down after all tests (afterAll). Never share test state between tests — order-dependent tests hide bugs.',
        'Testcontainers for integration tests: spin up a real PostgreSQL or Redis container per test suite. Tests run against a real DB — no mocking, no missed edge cases. Slower (~5s startup) but finds real bugs. Libraries: @testcontainers/postgresql, @testcontainers/redis.',
        'Error path testing is as important as happy path. Test what happens when DB throws, when external API fails, when validation fails. Use mockRejectedValue() for async errors, or deliberately pass invalid data. These paths are easiest to miss and most critical in production.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Unit tests and mocking',
      language: 'typescript',
      code: `// users.service.test.js
import { UserService } from './users.service';
import { UserRepository } from './users.repository';

// Mock the repository module
jest.mock('./users.repository');

describe('UserService', () => {
  let service;
  let mockRepo;

  beforeEach(() => {
    mockRepo  = new UserRepository();   // auto-mocked by jest.mock()
    service   = new UserService(mockRepo);
    jest.clearAllMocks();               // reset call counts between tests
  });

  test('findById returns user when found', async () => {
    const fakeUser = { id: 1, name: 'Alice', email: 'alice@example.com' };
    mockRepo.findById.mockResolvedValue(fakeUser);

    const result = await service.findById(1);

    expect(result).toEqual(fakeUser);
    expect(mockRepo.findById).toHaveBeenCalledWith(1);
    expect(mockRepo.findById).toHaveBeenCalledTimes(1);
  });

  test('findById throws NotFoundException when user missing', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(service.findById(999)).rejects.toThrow('User 999 not found');
  });

  test('create hashes password before saving', async () => {
    const spy = jest.spyOn(require('bcrypt'), 'hash').mockResolvedValue('hashed123');
    mockRepo.create.mockResolvedValue({ id: 1, email: 'test@test.com' });

    await service.create({ email: 'test@test.com', password: 'plain123' });

    expect(spy).toHaveBeenCalledWith('plain123', 10);
    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ passwordHash: 'hashed123' })
    );
    spy.mockRestore();
  });
});`
    },
    {
      label: 'Integration tests with Supertest',
      language: 'typescript',
      code: `// users.integration.test.js
import request from 'supertest';
import { app } from '../app';
import { db } from '../db';

describe('Users API', () => {
  beforeAll(async () => {
    // Connect to test database (set NODE_ENV=test to use test DB)
    await db.migrate.latest();
  });

  beforeEach(async () => {
    await db('users').del();   // clean state before each test
  });

  afterAll(async () => {
    await db.destroy();        // close pool
  });

  test('POST /users creates a user', async () => {
    const res = await request(app)
      .post('/users')
      .send({ name: 'Alice', email: 'alice@test.com', password: 'Pass123!' })
      .expect(201);

    expect(res.body).toMatchObject({ name: 'Alice', email: 'alice@test.com' });
    expect(res.body).not.toHaveProperty('password');      // never expose password
    expect(res.body.id).toBeDefined();
  });

  test('POST /users returns 400 for invalid email', async () => {
    const res = await request(app)
      .post('/users')
      .send({ name: 'Alice', email: 'not-an-email', password: 'Pass123!' })
      .expect(400);

    expect(res.body.error).toBeDefined();
  });

  test('GET /users/:id returns 404 for missing user', async () => {
    await request(app).get('/users/99999').expect(404);
  });

  test('authenticated routes require valid JWT', async () => {
    await request(app)
      .get('/users/me')
      .set('Authorization', 'Bearer invalidtoken')
      .expect(401);
  });
});`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Forgetting to await async assertions',
      wrong: `test('should reject invalid token', () => {
  expect(verifyToken('bad')).rejects.toThrow('Invalid'); // test passes before assertion runs!
});`,
      right: `test('should reject invalid token', async () => {
  await expect(verifyToken('bad')).rejects.toThrow('Invalid');
});`,
      explanation: 'Without await, the test function returns before the Promise assertion resolves. Jest sees a synchronous test with no assertion failures — it passes even if verifyToken resolves instead of rejecting. Always await async expectations.'
    },
    {
      title: 'Not clearing mocks between tests',
      wrong: `jest.mock('./emailService');
test('sends welcome email', async () => {
  await registerUser({ email: 'a@b.com' });
  expect(emailService.send).toHaveBeenCalledTimes(1); // passes
});
test('sends welcome email for second user', async () => {
  await registerUser({ email: 'c@d.com' });
  expect(emailService.send).toHaveBeenCalledTimes(1); // fails — cumulative calls from test 1!
});`,
      right: `afterEach(() => { jest.clearAllMocks(); }); // reset call counts between tests`,
      explanation: 'Mock call counts accumulate across tests. jest.clearAllMocks() resets call history, instances, and contexts. jest.resetAllMocks() also clears return values. jest.restoreAllMocks() restores spied originals. Put clearAllMocks() in afterEach.'
    },
    {
      title: 'Testing implementation details instead of behavior',
      wrong: `test('service calls repository exactly once', () => {
  service.findUser(1);
  expect(repo.findById.mock.calls.length).toBe(1); // tests HOW, not WHAT
});`,
      right: `test('findUser returns user by ID', async () => {
  repo.findById.mockResolvedValue({ id: 1, name: 'Alice' });
  const user = await service.findUser(1);
  expect(user.name).toBe('Alice'); // tests observable behavior
});`,
      explanation: 'Tests that verify internal call counts break when you refactor. Testing that the service calls the repository once is an implementation detail — it breaks if you add caching. Test observable behavior: what does the function return? What side effects occur?'
    },
    {
      title: 'Sharing test state between tests',
      wrong: `const createdUser = {}; // shared state
test('creates user', async () => {
  const user = await service.create({ email: 'a@b.com' });
  createdUser.id = user.id; // sets shared state
});
test('finds created user', async () => {
  const found = await service.findById(createdUser.id); // depends on previous test!
});`,
      right: `test('finds user after creating it', async () => {
  const user  = await service.create({ email: 'a@b.com' }); // create in same test
  const found = await service.findById(user.id);
  expect(found).toBeDefined();
});`,
      explanation: 'Tests that depend on shared state fail when run in isolation or different order. Each test should be self-contained: set up its own data, perform its action, and assert the result. Tests that pass in order but fail individually are hiding bugs.'
    },
  ];

  challenge: Challenge = {
    title: 'REST API Integration Test Suite',
    language: 'typescript',
    description: 'Write a Jest integration test suite for a simple task API (POST /tasks, GET /tasks, GET /tasks/:id, DELETE /tasks/:id). Use Supertest for HTTP requests. The tests should: verify 201 status and returned task on create, verify all tasks are returned on GET /, verify 404 on GET /:id for missing task, verify task is gone after DELETE. Set up a fresh in-memory array (mocked store) before each test.',
    hints: [
      'Use jest.mock or beforeEach to reset the tasks array between tests',
      'request(app).post("/tasks").send(body).expect(201)',
      'expect(res.body).toMatchObject({ title: "..." }) for partial match',
    ],
    starterCode: `import request from 'supertest';
import { app, resetTasks } from './app'; // app exports reset helper for tests

describe('Tasks API', () => {
  beforeEach(() => {
    resetTasks(); // clear tasks array between tests
  });

  test('POST /tasks creates a task', async () => { /* ... */ });
  test('GET /tasks returns all tasks', async () => { /* ... */ });
  test('GET /tasks/:id returns 404 for missing task', async () => { /* ... */ });
  test('DELETE /tasks/:id removes the task', async () => { /* ... */ });
});`,
    solution: `import request from 'supertest';
import express from 'express';
import { randomUUID } from 'node:crypto';

// In-memory store with reset helper
let tasks = [];
export function resetTasks() { tasks = []; }

const app = express();
app.use(express.json());
app.post('/tasks', (req, res) => {
  const task = { id: randomUUID(), title: req.body.title, done: false };
  tasks.push(task);
  res.status(201).json(task);
});
app.get('/tasks', (req, res) => res.json(tasks));
app.get('/tasks/:id', (req, res) => {
  const task = tasks.find(t => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Not found' });
  res.json(task);
});
app.delete('/tasks/:id', (req, res) => {
  const i = tasks.findIndex(t => t.id === req.params.id);
  if (i === -1) return res.status(404).json({ error: 'Not found' });
  tasks.splice(i, 1);
  res.status(204).end();
});

// Tests
describe('Tasks API', () => {
  beforeEach(resetTasks);

  test('POST /tasks creates a task', async () => {
    const res = await request(app).post('/tasks').send({ title: 'Buy milk' }).expect(201);
    expect(res.body).toMatchObject({ title: 'Buy milk', done: false });
    expect(res.body.id).toBeDefined();
  });

  test('GET /tasks returns all tasks', async () => {
    await request(app).post('/tasks').send({ title: 'Task 1' });
    await request(app).post('/tasks').send({ title: 'Task 2' });
    const res = await request(app).get('/tasks').expect(200);
    expect(res.body).toHaveLength(2);
  });

  test('GET /tasks/:id returns 404 for missing task', async () => {
    await request(app).get('/tasks/nonexistent-id').expect(404);
  });

  test('DELETE /tasks/:id removes the task', async () => {
    const { body: task } = await request(app).post('/tasks').send({ title: 'Delete me' });
    await request(app).delete(\`/tasks/\${task.id}\`).expect(204);
    await request(app).get(\`/tasks/\${task.id}\`).expect(404);
  });
});`
  };

  quiz: QuizQuestion[] = [
    { q: 'What is the testing pyramid and why does it matter?', options: ['A project folder structure', 'Unit (many, fast) → Integration (fewer) → E2E (few, slow) — more coverage at lower levels is cheaper and faster', 'A sequence of test execution', 'A code coverage requirement'], answer: 1, explanation: 'Unit tests are fastest but test only isolated logic. Integration tests test component interactions (most ROI for APIs). E2E tests catch user-flow bugs but are slow and fragile. Heavily investing in the foundation (unit + integration) gives maximum feedback speed at lowest cost.' },
    { q: 'Why should you await expect(...).rejects.toThrow() in Jest?', options: ['Jest requires all tests to be async', 'Without await, the test completes before the Promise settles — the assertion never runs and the test passes incorrectly', 'rejects is deprecated in newer Jest versions', 'It has nothing to do with async behavior'], answer: 1, explanation: 'expect().rejects.toThrow() returns a Promise. Without await, the test function returns synchronously before the assertion Promise resolves. Jest sees no failing assertions — the test passes. Always await async assertions.' },
    { q: 'What does jest.clearAllMocks() do?', options: ['Removes all mocked modules', 'Resets call counts, instances, and results of all mocks — does not restore original implementations', 'Stops the test suite', 'Removes mock files from disk'], answer: 1, explanation: 'clearAllMocks() resets the state of all mock functions (call counts, return values tracking) without changing their implementation. Use in afterEach to prevent test pollution. jest.resetAllMocks() also clears return value overrides. jest.restoreAllMocks() restores spied originals.' },
    { q: 'What is the main benefit of Supertest over starting a real HTTP server?', options: ['Supertest is faster to install', 'Supertest sends requests directly to the Express app instance without binding to a port — no port conflicts, no async server startup', 'Supertest supports more HTTP methods', 'Supertest runs tests in parallel'], answer: 1, explanation: 'Supertest binds to the app but does not listen on a network port. No race conditions with port binding, no OS port number management, no connection setup/teardown. You can run hundreds of Supertest tests concurrently without port conflicts.' },
  ];

  qna: QnaItem[] = [
    { q: 'Should I mock the database in integration tests?', a: 'No — mocking the database in what you call integration tests gives false confidence. A mocked DB test verifies that your code calls the mock correctly, not that your SQL/ORM queries actually work. Real integration tests hit a real database (in-memory SQLite for simple apps, a Docker container via testcontainers for PostgreSQL/MySQL). The extra setup is worth it: you catch schema mismatches, constraint violations, and query bugs that mocks can\'t.' },
    { q: 'How do I test error handling paths in async Node.js code?', a: 'For mocked dependencies: mockRejectedValue(new Error("DB down")) makes the mock throw. For integration tests: deliberately send invalid input (missing required fields, wrong types) and verify status codes. For middleware: test with malformed JWTs, missing auth headers, oversized bodies. A common mistake is testing only happy paths — error paths are where bugs live in production because they\'re rarely executed and hard to reproduce manually.' },
    { q: 'What is the difference between jest.mock() and jest.spyOn()?', a: 'jest.mock("module") replaces the entire module before it loads — all exports become jest.fn() stubs with no implementation. Used when you want full control over a dependency. jest.spyOn(obj, "method") wraps an existing method while preserving the original implementation — useful when you want the original to run but also track calls or temporarily change behavior. spyOn requires mockRestore() in afterEach to avoid test pollution; jest.mock() is automatically restored between test files.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Testing pyramid: unit (isolated, mocked) → integration (real HTTP + DB) → E2E. Use Supertest for API tests. Always await async assertions. Clear mocks between tests.',
    mustKnow: [
      'Unit: test one function, mock all dependencies. Integration: test real HTTP + DB.',
      'await expect(fn()).rejects.toThrow() — always await async assertions.',
      'jest.clearAllMocks() in afterEach — prevents call count pollution between tests.',
      'Supertest: HTTP requests without starting a real server — no port conflicts.',
      'jest.mock() hoisted before imports. jest.spyOn() wraps existing methods.',
      'Never share state between tests — each test sets up its own data.',
      'Test error paths as rigorously as happy paths.',
    ],
    interviewFocus: [
      'What is the testing pyramid and which layer gives best ROI for APIs?',
      'How do you test that an async function rejects in Jest?',
      'When would you use jest.mock() vs jest.spyOn()?',
    ]
  };
}
