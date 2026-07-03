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
  selector: 'app-api-testing',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
            QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './api-testing.html',
  styleUrl: './api-testing.scss',
})
export class ApiTesting {
  quickRef: QuickRefItem[] = [
    { name: 'Supertest',      type: 'keyword', desc: 'Node.js HTTP testing library — request(app).get("/path").expect(200).' },
    { name: 'given/when/then',type: 'keyword', desc: 'BDD-style structure: setup → act → assert. Maps to Arrange/Act/Assert.' },
    { name: 'Status code',    type: 'keyword', desc: 'Verify the correct HTTP status: 200 OK, 201 Created, 400 Bad Request, 404 Not Found.' },
    { name: 'Schema validation',type:'keyword', desc: 'Assert the response body shape matches the expected schema (Zod, Joi, Ajv).' },
    { name: 'res.body',       type: 'keyword', desc: 'Parsed response body in Supertest — accessible after .expect() or .then().' },
    { name: 'Authorization header',type:'keyword',desc:'Test authenticated endpoints by adding .set("Authorization", "Bearer token").' },
  ];

  theory: TheoryPoint[] = [
    { heading: 'What API Tests Verify', points: [
      'Status codes: 200, 201, 400, 401, 403, 404, 422, 500 — each has a specific meaning.',
      'Response body: correct structure, types, and values.',
      'Headers: Content-Type, Location (for 201), and custom headers.',
      'Error responses: correct error codes and human-readable messages.',
      'Authentication: protected routes return 401 without a valid token.',
    ]},
    { heading: 'Supertest', points: [
      'Supertest wraps an Express/Fastify/Koa app and makes HTTP requests in-process — no real port needed.',
      'Chain .get/post/put/delete, .send(body), .set(header), .expect(status), .expect(body).',
      'Returns a promise — use async/await or return the chain.',
      'Works with Jest, Vitest, Mocha — any test runner.',
    ]},
    { heading: 'Schema Validation in API Tests', points: [
      'Assert that the response body matches the documented API contract.',
      'Use Zod: UserSchema.parse(res.body) — throws if the shape is wrong.',
      'Use toMatchObject() for partial matches — only assert the fields you care about.',
      'Schema tests catch when a backend change silently drops a required field.',
    ]},
    { heading: 'Testing Authentication', points: [
      'Generate a test JWT or use a test user seeded in beforeAll.',
      '.set("Authorization", "Bearer " + token) adds the auth header.',
      'Test the 401 path: omit the token and expect 401.',
      'Test the 403 path: use a low-privilege token and try to access an admin endpoint.',
    ]},
    { heading: 'Contract-First vs. Implementation-First API Testing', points: [
      'Contract-first testing validates that an API conforms to a pre-agreed schema (OpenAPI/Swagger) before implementation details are tested, catching breaking changes to the public interface independent of internal logic correctness.',
      'Implementation-first testing (writing tests against whatever the API currently returns) risks tests that pass despite the API violating its documented contract, since nothing checks the response shape against a schema.',
      'Schema validation libraries (like ajv for JSON Schema) can be layered onto existing API tests to add contract verification without rewriting the entire test suite from scratch.',
      'Testing error responses (4xx/5xx status codes, error body shape) is as important as testing the happy path, since consumers build error-handling logic that depends on a stable, predictable error contract.',
    ]},
  ];

  codeTabs: CodeTab[] = [
    { label: 'Supertest Basics', language: 'typescript', code:
`import request from 'supertest';
import { app } from '../src/app';

describe('GET /users', () => {
  test('returns list of users with status 200', async () => {
    const res = await request(app)
      .get('/users')
      .set('Accept', 'application/json');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('POST /users', () => {
  test('creates a user and returns 201', async () => {
    const res = await request(app)
      .post('/users')
      .send({ name: 'Alice', email: 'alice@example.com' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: 'Alice', email: 'alice@example.com' });
    expect(res.body.id).toBeDefined();
  });

  test('returns 400 for missing email', async () => {
    const res = await request(app).post('/users').send({ name: 'Alice' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });
});` },
    { label: 'Auth Testing', language: 'typescript', code:
`import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../src/app';

const TEST_SECRET = 'test-secret';

function makeToken(payload: object) {
  return jwt.sign(payload, TEST_SECRET, { expiresIn: '1h' });
}

describe('GET /admin/users', () => {
  test('returns 401 with no token', async () => {
    const res = await request(app).get('/admin/users');
    expect(res.status).toBe(401);
  });

  test('returns 403 for non-admin user', async () => {
    const token = makeToken({ id: 1, role: 'user' });
    const res = await request(app)
      .get('/admin/users')
      .set('Authorization', \`Bearer \${token}\`);
    expect(res.status).toBe(403);
  });

  test('returns 200 for admin user', async () => {
    const token = makeToken({ id: 1, role: 'admin' });
    const res = await request(app)
      .get('/admin/users')
      .set('Authorization', \`Bearer \${token}\`);
    expect(res.status).toBe(200);
  });
});` },
    { label: 'Schema Validation', language: 'typescript', code:
`import { z } from 'zod';
import request from 'supertest';
import { app } from '../src/app';

const UserSchema = z.object({
  id:    z.number(),
  name:  z.string(),
  email: z.string().email(),
  createdAt: z.string().datetime(),
});

const UsersListSchema = z.array(UserSchema);

test('GET /users returns valid user schema', async () => {
  const res = await request(app).get('/users');
  expect(res.status).toBe(200);

  // Throws ZodError with details if shape is wrong
  const users = UsersListSchema.parse(res.body);
  expect(users.length).toBeGreaterThan(0);
});

test('GET /users/:id returns single valid user', async () => {
  const res = await request(app).get('/users/1');
  expect(res.status).toBe(200);

  const user = UserSchema.parse(res.body);
  expect(user.id).toBe(1);
});` },
  ];

  mistakes: CommonMistake[] = [
    { title: 'Testing against production API', wrong: 'const BASE = "https://api.myapp.com"', right: 'request(app) // in-process, no real server', explanation: 'API tests must run against a controlled test environment. Hitting production risks dirty data and makes tests unreliable.' },
    { title: 'Only checking status code', wrong: 'expect(res.status).toBe(200); // done', right: 'expect(res.body).toMatchObject({ id: 1, name: "Alice" })', explanation: 'A 200 with an empty body or wrong shape is still a bug. Always assert on the response body shape and key values.' },
    { title: 'Not testing the unhappy path', wrong: 'only test the success case', right: 'test 400 (missing fields), 401 (no token), 404 (not found)', explanation: 'Most bugs live in error handling. Test every distinct failure path — they\'re often the most important contracts.' },
    { title: 'Hardcoding tokens in tests', wrong: 'const TOKEN = "eyJhbGci..." // real token pasted in test', right: 'generate tokens with makeToken({ id: 1, role: "user" }) using the test secret', explanation: 'Real tokens expire and encode production secrets. Generate minimal test tokens programmatically using the test environment secret.' },
    { title: 'Not cleaning up created resources', wrong: 'POST /users creates Alice; next test finds two Alices', right: 'delete created resources in afterEach, or use transaction rollback', explanation: 'API tests that create data must clean up after themselves. Leftover data causes subtle failures in later tests.' },
  ];

  challenge: Challenge = {
    title: 'Write API tests for a products endpoint',
    language: 'typescript',
    description: 'Write Supertest tests for GET /products and POST /products. Test: (1) GET returns array with 200, (2) POST with valid body returns 201 with the created product, (3) POST without name returns 400.',
    hints: [
      'request(app).get("/products").expect(200)',
      'Use .send({ name: "Widget", price: 9.99 }) for the POST body.',
    ],
    starterCode:
`import request from 'supertest';
import express from 'express';

const app = express();
app.use(express.json());
const products: any[] = [];
app.get('/products', (req, res) => res.json(products));
app.post('/products', (req, res) => {
  if (!req.body.name) return res.status(400).json({ error: 'name required' });
  const p = { id: products.length + 1, ...req.body };
  products.push(p);
  res.status(201).json(p);
});

// Write tests here`,
    solution:
`describe('Products API', () => {
  beforeEach(() => { products.length = 0; });

  test('GET /products returns array', async () => {
    const res = await request(app).get('/products');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('POST /products creates product', async () => {
    const res = await request(app)
      .post('/products')
      .send({ name: 'Widget', price: 9.99 });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: 'Widget', price: 9.99 });
    expect(res.body.id).toBeDefined();
  });

  test('POST /products without name returns 400', async () => {
    const res = await request(app).post('/products').send({ price: 9.99 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });
});`,
  };

  quiz: QuizQuestion[] = [
    { q: 'What does Supertest allow you to test without?', options: ['A test runner', 'A real running server on a port', 'An HTTP client', 'A database'], answer: 1, explanation: 'Supertest wraps the Express (or similar) app directly and makes in-process HTTP requests — no need to start a server on a port, avoiding port conflicts in CI.' },
    { q: 'Why should you validate the response body schema and not just the status code?', options: ['Status codes are unreliable', 'A 200 with a wrong body shape is still a contract violation — schema validation catches silent breakages', 'Response bodies are always correct if the status is 200', 'Supertest cannot check status codes'], answer: 1, explanation: 'A status 200 only means "no server error." The body could be missing fields, have wrong types, or be empty. Schema tests catch these regressions.' },
    { q: 'How should you generate auth tokens for API tests?', options: ['Copy a token from the browser DevTools', 'Use the production secret and a real user\'s credentials', 'Generate minimal test JWTs programmatically using the test environment secret', 'Skip auth testing — it is too complex'], answer: 2, explanation: 'Real tokens expire and leak production credentials into test files. Generate test tokens with a test-only secret and minimal payload directly in the test setup.' },
  { q: 'What HTTP status code should a POST that creates a resource return?', options: ['200 OK', '201 Created', '204 No Content', '202 Accepted'], answer: 1, explanation: '201 Created indicates successful resource creation. The response should include the Location header pointing to the new resource URI. 200 is for successful reads/updates; 204 for operations with no response body.' },
  { q: 'What is the purpose of API contract testing?', options: ['Testing API performance', 'Verifying the API response matches the agreed schema/contract between consumer and provider', 'Testing API authentication', 'Load testing endpoints'], answer: 1, explanation: 'Contract testing ensures the API response structure, types, and fields match what consumers expect. Prevents breaking changes from reaching consumers — separate from functional testing.' },
  { q: 'What tool is commonly used for API testing in Node.js environments?', options: ['Selenium', 'Supertest', 'Cypress component testing', 'Playwright page objects'], answer: 1, explanation: 'Supertest wraps an Express/Fastify app and provides HTTP assertion methods: request(app).get(\'/api/users\').expect(200).expect(\'Content-Type\', /json/).then(response => ...).' },
  ];

  qna: QnaItem[] = [
    { q: 'Should I use Supertest or Playwright for API testing?', a: 'Supertest for in-process API tests (fast, no browser, great for unit-like API tests). Playwright for end-to-end API tests that are part of a user journey, or when you need to test the API and UI together. Supertest is faster and simpler for pure backend API validation.' },
    { q: 'How do I test file upload endpoints?', a: 'Use supertest\'s .attach("field", "/path/to/file") method. Example: request(app).post("/upload").attach("file", Buffer.from("content"), "test.txt"). For multipart forms, chain multiple .field() and .attach() calls.' },
    { q: 'How do I test paginated endpoints?', a: 'Test the first page: GET /items?page=1&limit=10 → expect 10 items and a total/nextPage field. Test the last page: the items array should be shorter. Test out-of-range page → expect 400 or empty array. Test that the order is stable across pages.' },
  { q: 'How do you test authentication in API tests?', a: 'Generate a test JWT in beforeEach: const token = jwt.sign({ userId: 1 }, testSecret); attach it to requests as a Bearer header: await request(app).get(\'/api/me\').set(\'Authorization\', "Bearer " + token). For OAuth, use a mock auth server or stub the token verification middleware. Test unauthorized access by omitting the token and expecting 401.' },
  { q: 'How do you test rate-limited API endpoints?', a: 'Send requests up to the documented limit and assert 200s, then send one more and assert a 429 response with a Retry-After header (or X-RateLimit-Remaining: 0). To avoid tests taking as long as the real rate-limit window, either use a test-only config with a much lower limit/shorter window, or mock the rate limiter\'s clock/store directly rather than actually waiting out the window in the test.' },
  { q: 'What is the difference between API integration tests and E2E API tests?', a: '<strong>Integration tests</strong>: test the API with real dependencies (real DB, real services) but isolated from the frontend — fast, focused. <strong>E2E tests</strong>: test the full system through the UI, following real user flows that trigger API calls. Integration tests catch API regressions; E2E catches system-level failures.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'API tests verify status codes, response body shape, headers, and auth — Supertest enables in-process testing without a real server.',
    mustKnow: [
      'Supertest: request(app).get/post.send.set.expect — no real port',
      'Always test status code AND response body shape',
      'Test the unhappy paths: 400, 401, 403, 404',
      'Generate test JWTs programmatically — never use real tokens',
      'Schema validation with Zod catches silent contract breakages',
      'Clean up created resources in afterEach',
    ],
    interviewFocus: [
      'What Supertest provides over a real HTTP client',
      'Why schema validation matters beyond status codes',
      'Testing all HTTP status paths — not just the success case',
    ],
  };
}
