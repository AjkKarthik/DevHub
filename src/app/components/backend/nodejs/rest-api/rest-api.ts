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
  selector: 'app-node-rest-api',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './rest-api.html',
  styleUrl: './rest-api.scss'
})
export class NodeRestApi {
  quickRef: QuickRefItem[] = [
    { name: 'GET /resources', type: 'syntax', desc: 'List collection or retrieve a single resource. Never modify state.' },
    { name: 'POST /resources', type: 'syntax', desc: 'Create a new resource. Returns 201 with the created object.' },
    { name: 'PUT /resources/:id', type: 'syntax', desc: 'Full replace. PATCH for partial update. Returns 200 or 204.' },
    { name: 'DELETE /resources/:id', type: 'syntax', desc: 'Remove a resource. Returns 204 (no content).' },
    { name: 'z.parse()', type: 'function', desc: 'Zod: validate and parse input — throws ZodError on failure.' },
    { name: 'z.safeParse()', type: 'function', desc: 'Zod: returns { success, data, error } — use in middleware to format errors.' },
    { name: 'RFC 9457 Problem Details', type: 'keyword', desc: 'Standard error format: { type, title, status, detail, instance }.' },
    { name: 'cursor pagination', type: 'keyword', desc: 'Stable pagination: ?cursor=lastId&limit=20 vs ?page=2 (offset pagination).' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'RESTful Resource Design',
      points: [
        'Resources are nouns, not verbs. /users/:id (correct) vs /getUser/:id (wrong). HTTP methods encode the action: GET (read), POST (create), PUT/PATCH (update), DELETE (remove).',
        'Nested resources for containment: GET /users/:id/orders (orders belonging to a user). Keep nesting to 2 levels max — deeper nesting becomes unwieldy. For queries spanning resources, use a top-level endpoint.',
        'Versioning: /api/v1/users. Never change v1 after release. Deprecate with Sunset headers. Alternatively, use Accept header versioning (Accept: application/vnd.myapp.v1+json).',
        'Pagination: cursor-based is preferred for large, frequently updated datasets (stable, no drifting pages). Offset-based (?page=2&limit=20) is simpler but breaks under concurrent inserts/deletes.',
      ]
    },
    {
      heading: 'Input Validation with Zod',
      points: [
        'Validate at the boundary: all user input entering your system must be validated before reaching business logic. Never trust request.body, request.params, or request.query without parsing.',
        'Zod generates TypeScript types from schemas: const schema = z.object({...}); type Input = z.infer<typeof schema>. One declaration gives both runtime validation and compile-time types.',
        'Use z.coerce for strings-to-numbers (query params are always strings): z.coerce.number().int().min(1). Use .transform() to normalize data after parsing.',
        'Build a validate middleware factory: validate(schema)(req, res, next). This keeps route handlers clean and reusable validation logic.',
      ]
    },
    {
      heading: 'Controller/Service/Repository Layering',
      points: [
        'Controller: handles HTTP concerns — parsing request, calling service, formatting response, setting status codes. No business logic here.',
        'Service: contains business logic — no HTTP objects (req/res), no SQL. Calls repositories. Returns domain objects or throws domain errors.',
        'Repository: database access layer — SQL queries or ORM calls. Returns raw data. Swappable: change the DB without touching service or controller.',
        'Error propagation: repositories throw database-specific errors. Services catch them and rethrow as domain errors (UserNotFoundError, DuplicateEmailError). Controllers map domain errors to HTTP responses.',
      ]
    },
    {
      heading: 'Resource-Oriented URL Design',
      points: [
        'REST URLs should represent resources (nouns), not actions (verbs) — /orders/123/cancel violates this; DELETE /orders/123 or a state-changing PATCH more correctly expresses the intent through the HTTP method, not the URL path.',
        'Use plural nouns for collections consistently (/users not /user) and nest resources to express ownership relationships (/users/123/orders) while keeping nesting to 2-3 levels max — deeper nesting becomes unwieldy and tightly couples clients to the resource hierarchy.',
        'Query parameters modify HOW a resource collection is retrieved (filtering, sorting, pagination — /orders?status=pending&sort=-createdAt), while path segments identify WHICH resource is being accessed — conflating the two creates an inconsistent, harder-to-document API.',
        'Version the API from the first release (even v1) using a URL prefix (/v1/orders) — this establishes the pattern before you need it, avoiding a painful retrofit when the first genuinely breaking change eventually arrives.',
      ]
    },
    {
      heading: 'Response Shape Consistency',
      points: [
        'Establish one consistent envelope shape for all responses (or deliberately none) — mixing raw arrays, wrapped objects, and inconsistent field naming (camelCase here, snake_case there) across different endpoints creates a confusing, error-prone client experience.',
        'Error responses should follow a single, predictable structure across every endpoint — ideally aligned with RFC 7807 Problem Details (type, title, status, detail) — so client error-handling code can be written once and reused everywhere rather than per-endpoint.',
        'Always use ISO 8601 for date/time fields (2024-01-15T10:30:00Z) — never locale-specific or ambiguous formats — since this is universally parseable across every client language and timezone-unambiguous by including the Z (UTC) or explicit offset.',
        'Pagination metadata (total count, next/prev cursor, page size) should appear in the same location and shape across every paginated endpoint — a client building generic pagination UI components should not need endpoint-specific parsing logic.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Zod validation middleware',
      language: 'typescript',
      code: `import { z } from 'zod';

// Reusable validation factory
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      type: 'https://api.example.com/errors/validation',
      title: 'Validation Failed',
      status: 400,
      errors: result.error.issues.map(i => ({
        field: i.path.join('.'),
        message: i.message,
      }))
    });
  }
  req.validatedBody = result.data; // attach parsed + coerced data
  next();
};

// Schema definition
const createUserSchema = z.object({
  name:  z.string().min(2).max(100),
  email: z.string().email(),
  age:   z.coerce.number().int().min(0).max(150).optional(),
  role:  z.enum(['user', 'admin']).default('user'),
});

// Route with validation
router.post('/', validate(createUserSchema), async (req, res) => {
  const user = await userService.create(req.validatedBody); // typed, safe
  res.status(201).json(user);
});`
    },
    {
      label: 'Controller/Service/Repository',
      language: 'typescript',
      code: `// users.repository.js
export class UsersRepository {
  async findById(id) {
    return db.query('SELECT * FROM users WHERE id = $1', [id]);
  }
  async create(data) {
    return db.query('INSERT INTO users(name,email) VALUES($1,$2) RETURNING *', [data.name, data.email]);
  }
}

// users.service.js
export class UsersService {
  constructor(private repo = new UsersRepository()) {}

  async getUser(id) {
    const user = await this.repo.findById(id);
    if (!user) throw new NotFoundError('User not found');
    return user;
  }

  async createUser(data) {
    const existing = await this.repo.findByEmail(data.email);
    if (existing) throw new ConflictError('Email already registered');
    return this.repo.create(data);
  }
}

// users.controller.js
const svc = new UsersService();
router.get('/:id', async (req, res, next) => {
  try {
    const user = await svc.getUser(req.params.id);
    res.json(user);
  } catch (err) { next(err); }
});`
    },
    {
      label: 'Pagination patterns',
      language: 'typescript',
      code: `// Cursor pagination (stable, recommended)
router.get('/', async (req, res) => {
  const limit  = Math.min(parseInt(req.query.limit) || 20, 100);
  const cursor = req.query.cursor; // last item's ID from previous page

  const items = await db.query(
    \`SELECT * FROM posts WHERE ($1::uuid IS NULL OR id > $1)
     ORDER BY id ASC LIMIT $2\`,
    [cursor || null, limit + 1] // fetch one extra to detect hasMore
  );

  const hasMore = items.length > limit;
  const data = hasMore ? items.slice(0, limit) : items;

  res.json({
    data,
    pagination: {
      hasMore,
      nextCursor: hasMore ? data[data.length - 1].id : null,
      limit,
    }
  });
});

// Offset pagination (simpler but drifts on mutations)
router.get('/offset', async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = (page - 1) * limit;
  const [items, total] = await Promise.all([db.find(limit, offset), db.count()]);
  res.json({ data: items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using verbs in URLs instead of nouns',
      wrong: 'GET /getUser, POST /createUser, DELETE /removeUser',
      right: 'GET /users/:id, POST /users, DELETE /users/:id',
      explanation: 'REST URLs are nouns (resources). HTTP methods provide the verb. Using verbs in paths duplicates the method and breaks REST semantics.'
    },
    {
      title: 'Returning 200 for all responses including errors',
      wrong: 'res.status(200).json({ error: "Not found" })',
      right: 'res.status(404).json({ error: "Not found" })',
      explanation: 'HTTP status codes communicate outcome to clients and monitoring tools. 200 means success. APIs that always return 200 break client error handling and hide issues in logs.'
    },
    {
      title: 'Exposing raw database errors to clients',
      wrong: 'catch (err) { res.status(500).json({ error: err.message }); } // leaks DB internals',
      right: 'catch (err) { logger.error(err); res.status(500).json({ error: "Internal server error" }); }',
      explanation: 'Database error messages often contain table names, column names, and query fragments. This leaks schema information to attackers. Log the full error internally and return a generic message.'
    },
    {
      title: 'Validating input in the service layer instead of controller',
      wrong: '// Service does req.body.name check — now service knows about HTTP',
      right: '// Controller validates req.body; service receives clean domain data',
      explanation: 'The service should receive already-validated data. Services knowing about HTTP violates separation of concerns — they become untestable without mocking HTTP objects.'
    },
    {
      title: 'Using offset pagination for large datasets',
      wrong: 'SELECT * FROM posts OFFSET 50000 LIMIT 20; -- 50000 rows scanned and discarded',
      right: 'SELECT * FROM posts WHERE id > $cursor ORDER BY id LIMIT 20; -- index seek only',
      explanation: 'Offset pagination scans and discards all rows up to the offset — O(n) cost grows with page number. Cursor pagination uses an index to jump directly to the position.'
    },
  ];

  challenge: Challenge = {
    title: 'RESTful Blog API',
    language: 'typescript',
    description: 'Build a RESTful API for blog posts with proper layering. Requirements: Zod validation (title: 1-200 chars, content: 1-5000 chars, tags: string array optional). Cursor-based pagination on GET /posts. 201 on create, 204 on delete, 404 when not found. RFC 9457 error format. Three layers: controller handles HTTP, service handles logic, repository handles data.',
    hints: [
      'Use a Map<string, Post> as in-memory repository.',
      'Pagination: GET /posts?limit=10&cursor=lastId.',
      'RFC 9457: { type, title, status, detail } JSON response format.',
    ],
    starterCode: `// repository, service, and controller layers
const posts = new Map();

class PostsRepository { /* findAll(cursor, limit), findById(id), create(data), delete(id) */ }
class PostsService { /* getPosts(cursor, limit), getPost(id), createPost(data), deletePost(id) */ }
// controller uses PostsService`,
    solution: `import { randomUUID } from 'node:crypto';
import { z } from 'zod';

class NotFoundError extends Error { constructor(m) { super(m); this.status = 404; } }

class PostsRepository {
  #store = new Map();
  findAll(cursor, limit) {
    const all = [...this.#store.values()].sort((a,b) => a.id.localeCompare(b.id));
    const start = cursor ? all.findIndex(p => p.id === cursor) + 1 : 0;
    return all.slice(start, start + limit + 1);
  }
  findById(id) { return this.#store.get(id); }
  create(data) { const p = { id: randomUUID(), ...data, createdAt: new Date().toISOString() }; this.#store.set(p.id, p); return p; }
  delete(id) { return this.#store.delete(id); }
}

class PostsService {
  #repo = new PostsRepository();
  getPosts(cursor, limit = 20) { return this.#repo.findAll(cursor, Math.min(limit, 100)); }
  getPost(id) { const p = this.#repo.findById(id); if (!p) throw new NotFoundError('Post not found'); return p; }
  createPost(data) { return this.#repo.create(data); }
  deletePost(id) { if (!this.#repo.delete(id)) throw new NotFoundError('Post not found'); }
}

const schema = z.object({ title: z.string().min(1).max(200), content: z.string().min(1).max(5000), tags: z.array(z.string()).optional() });
const svc = new PostsService();

router.get('/', (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const items = svc.getPosts(req.query.cursor, limit);
  const hasMore = items.length > limit;
  res.json({ data: hasMore ? items.slice(0,-1) : items, pagination: { hasMore, nextCursor: hasMore ? items[limit-1].id : null } });
});
router.get('/:id', (req, res, next) => { try { res.json(svc.getPost(req.params.id)); } catch(e){next(e);} });
router.post('/', (req, res, next) => { const r = schema.safeParse(req.body); if (!r.success) return res.status(400).json({ type:'validation', title:'Bad Request', status:400, detail: r.error.issues }); try { res.status(201).json(svc.createPost(r.data)); } catch(e){next(e);} });
router.delete('/:id', (req, res, next) => { try { svc.deletePost(req.params.id); res.status(204).send(); } catch(e){next(e);} });`
  };

  quiz: QuizQuestion[] = [
    { q: 'What HTTP status code should a successful resource creation return?', options: ['200', '201', '202', '204'], answer: 1, explanation: '201 Created is the correct status for a successful POST that creates a resource. 200 is for successful GET/PUT/PATCH. 204 is for successful DELETE (no content). 202 is for async operations.' },
    { q: 'What is the controller\'s responsibility in the Controller/Service/Repository pattern?', options: ['Database queries', 'Business logic', 'HTTP parsing, calling service, formatting response', 'Caching'], answer: 2, explanation: 'The controller handles HTTP: parse request, validate input, call service, format response, set status code. No business logic, no SQL. Keeping this boundary clean makes services independently testable.' },
    { q: 'Why is cursor pagination preferred over offset pagination for large datasets?', options: ['It is easier to implement', 'Cursor uses an index seek instead of scanning all previous rows', 'Offset pagination only works with SQL', 'Cursors support sorting'], answer: 1, explanation: 'SELECT ... OFFSET N scans and discards N rows every time — O(N) cost grows with page number. Cursor pagination queries WHERE id > cursor which uses an index jump — O(1) regardless of position.' },
    { q: 'Which Zod method should you use in middleware to return a formatted error instead of throwing?', options: ['z.parse()', 'z.safeParse()', 'z.strict()', 'z.validate()'], answer: 1, explanation: 'z.safeParse() returns { success: boolean, data?, error? } without throwing. In middleware you format the error yourself and call res.status(400).json(). z.parse() throws a ZodError which would need a try/catch.' },
    { q: 'What HTTP status code should a successful POST (resource creation) return?', options: ['200 OK', '201 Created', '202 Accepted', '204 No Content'], answer: 1, explanation: '201 Created signals that the request was successful and a new resource was created. Include the Location header pointing to the new resource, or return the created resource in the body. 200 implies the resource already existed. 202 is for async operations where creation is still in progress.' },
    { q: 'What is the purpose of the ETag header in REST APIs?', options: ['Authenticates the request', 'A version token for the resource — clients send it in If-None-Match to get 304 Not Modified or If-Match to prevent lost updates', 'Tracks request timing', 'Identifies the server region'], answer: 1, explanation: 'ETag is a hash or version number for a resource. (1) Caching: client sends If-None-Match: "abc123"; if unchanged, server returns 304 Not Modified, saving bandwidth. (2) Optimistic locking: client sends PUT with If-Match: "abc123"; if the resource changed since (new ETag), server returns 412 Precondition Failed, preventing overwrite of concurrent changes.' },
  ];

  qna: QnaItem[] = [
    { q: 'Should REST APIs use HTTP verbs or path actions?', a: 'HTTP verbs. GET /orders (list), POST /orders (create), PUT /orders/123 (replace), PATCH /orders/123 (partial update), DELETE /orders/123 (remove). Never GET /getOrders or POST /cancelOrder — the verb is in the HTTP method. The exception: complex actions that map poorly to CRUD can use POST /orders/123/cancel with a command body.' },
    { q: 'What is RFC 9457 Problem Details?', a: 'A standard JSON error format for HTTP APIs: { "type": "https://api.example.com/errors/not-found", "title": "Resource Not Found", "status": 404, "detail": "User 123 does not exist", "instance": "/users/123" }. Standardised error shapes let clients parse errors programmatically. Content-Type: application/problem+json.' },
    { q: 'How do you handle validation errors consistently across all routes?', a: 'Build a validate(schema) middleware factory that wraps Zod safeParse and returns a structured error on failure. Apply it as route-level middleware: router.post("/", validate(createSchema), controller). The controller only runs if validation passes. Central error middleware handles all other error types.' },
    { q: 'How do you implement consistent API versioning in an Express or Fastify REST API?', a: 'The most common approach for Node.js APIs is URL path versioning — mounting separate routers at /api/v1 and /api/v2 (app.use("/api/v1", v1Router)) so each version can evolve independently while sharing common middleware (auth, logging). For smaller, more gradual changes, header-based versioning (Accept: application/vnd.myapi.v2+json) is also used, though it requires more careful content-negotiation middleware and is less discoverable than explicit URL paths.' },
    { q: 'What is the correct way to handle async errors in Express route handlers without unhandled promise rejection warnings?', a: 'Express (pre-v5) does not automatically catch rejected promises thrown inside async route handlers — an unhandled rejection in an async handler bypasses Express\'s error-handling middleware entirely unless explicitly caught. Wrap async handlers with a helper (a manual try/catch calling next(err), or a utility like express-async-handler) that catches rejections and forwards them to next(), ensuring they reach your centralized error-handling middleware instead of crashing silently or hanging the request.' },
    { q: 'How should a Node.js REST API validate and sanitize incoming request bodies before processing them?', a: 'Use a schema validation library (Zod, Joi, or class-validator with NestJS) as dedicated middleware that runs before the route handler, rejecting malformed requests with a 400 status and clear validation error details before any business logic executes. This centralizes validation logic (rather than scattering manual if-checks throughout handlers), produces consistent error response shapes across all endpoints, and prevents invalid or malicious data from ever reaching database queries or business logic.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'RESTful APIs: nouns in URLs, HTTP verbs as actions, Zod validation at the boundary, controller/service/repository separation, and proper HTTP status codes.',
    mustKnow: [
      'Resources are nouns; HTTP methods are verbs: GET (read), POST (create), PUT/PATCH (update), DELETE (remove).',
      'Validate all input at the controller boundary with Zod before business logic.',
      'Controller: HTTP only. Service: business logic, no HTTP. Repository: data access.',
      '201 for create, 204 for delete, 400 for validation, 404 for not found, 500 for server error.',
      'Cursor pagination over offset pagination for large/live datasets.',
      'Never expose database error messages to clients.',
    ],
    interviewFocus: [
      'What is the difference between PUT and PATCH?',
      'How do you structure a large REST API (controller/service/repository)?',
      'Why is cursor pagination better than offset for large datasets?',
    ]
  };
}
