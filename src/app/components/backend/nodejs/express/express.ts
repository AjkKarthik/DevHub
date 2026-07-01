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
  selector: 'app-node-express',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './express.html',
  styleUrl: './express.scss'
})
export class NodeExpress {
  quickRef: QuickRefItem[] = [
    { name: 'app.use()', type: 'method', desc: 'Mount middleware on all routes or a path prefix.' },
    { name: 'app.get/post/put/delete()', type: 'method', desc: 'Register a route handler for a specific HTTP method and path.' },
    { name: 'next()', type: 'function', desc: 'Pass control to the next middleware. next(err) triggers error middleware.' },
    { name: 'next(err)', type: 'function', desc: 'Skip to error-handling middleware (4-argument: err, req, res, next).' },
    { name: 'express.Router()', type: 'function', desc: 'Create a modular route handler — mount with app.use("/prefix", router).' },
    { name: 'express.json()', type: 'function', desc: 'Built-in middleware that parses JSON request bodies into req.body.' },
    { name: 'res.json()', type: 'method', desc: 'Send a JSON response with Content-Type: application/json.' },
    { name: 'req.params / req.query', type: 'keyword', desc: 'Route params (:id) and query string (?page=1) parsed objects.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Middleware Chain',
      points: [
        'Express is fundamentally a middleware pipeline. Every request goes through a chain of (req, res, next) functions. Middleware can modify req/res, call next() to continue, call next(err) to skip to error handling, or end the response.',
        'Order matters: middleware is executed in the order it is registered. Body parsers (express.json()) must come before route handlers that read req.body. Authentication middleware must come before protected routes.',
        'Route handlers are just middleware with a specific path and method. Multiple handlers can be attached to the same route — they run in order. If a handler calls next(), the next one runs. This enables composition: auth → validate → handle.',
        'Error middleware has 4 arguments (err, req, res, next). Express detects the 4-argument signature and routes errors to it. Calling next(error) from anywhere in the chain jumps to the nearest error handler.',
      ]
    },
    {
      heading: 'Routing and Router',
      points: [
        'express.Router() creates a mini-Express app that can be mounted at a path. This enables feature-based routing: a users.router.js handles all /users/* routes and is mounted at app.use("/users", usersRouter).',
        'Route parameters are defined with colons: app.get("/users/:id", handler). Access with req.params.id. Optional: /users/:id?. Regex: /^\/users\/([0-9]+)$/.',
        'Query strings: GET /users?page=2&limit=10 → req.query = { page: "2", limit: "10" }. Values are strings — always parse/coerce numbers.',
        'Route ordering matters: more specific routes must come before catch-all routes. app.get("/users/me") must be before app.get("/users/:id") or "me" gets matched as the :id param.',
      ]
    },
    {
      heading: 'Error Handling',
      points: [
        'Define a single centralized error handler at the end of all routes: app.use((err, req, res, next) => { ... }). This catches errors from all routes and middleware.',
        'For async route handlers, wrap in try/catch and call next(error) in the catch block. Or use a wrapper like express-async-errors (a one-liner import that patches Express to catch async rejections automatically).',
        'Error classification: operational errors (network failure, DB error, 404) return error responses. Programmer errors (null dereference, bad code) should crash the process and let PM2/Docker restart it.',
        'Structure error responses consistently: { error: { message, code, status } }. Use HTTP status codes correctly: 400 (bad request), 401 (unauthorized), 403 (forbidden), 404 (not found), 422 (validation), 500 (server error).',
      ]
    },
    {
      heading: 'Middleware Composition and Order',
      points: [
        'Express executes middleware strictly in registration order for a matching request path — a body-parsing middleware registered after a route that reads req.body will never see the parsed body, a surprisingly common source of "req.body is undefined" bugs.',
        'app.use() without a path applies to every request; app.use("/api", middleware) scopes it to a path prefix — using scoped middleware avoids unnecessary work (like auth checks) running on routes that do not need it (like a public health-check endpoint).',
        'Router-level middleware (via express.Router()) lets you compose middleware chains per feature module — a userRouter can have its own auth middleware applied only to user routes, keeping cross-cutting concerns modular rather than one giant global middleware stack.',
        'Error-handling middleware (four parameters) must be registered last, after all routes and other middleware — Express identifies it purely by parameter count, and its position in the registration order determines which errors it can catch.',
      ]
    },
    {
      heading: 'Express Request Validation Patterns',
      points: [
        'Validate request input (body, query, params) with a schema library (Zod, Joi, express-validator) as dedicated middleware before the route handler runs, rejecting malformed requests with a 400 early rather than letting invalid data reach business logic.',
        'Centralizing validation as middleware avoids duplicating manual if-checks across route handlers and produces consistent error response shapes across all endpoints, since one validation middleware pattern is reused everywhere.',
        'Sanitize as well as validate: trimming whitespace, normalizing casing on emails, and stripping unexpected fields (to prevent mass-assignment vulnerabilities where a client sends an unexpected isAdmin: true field) are separate concerns from type/format validation.',
        'Validate at the API boundary, not deep inside services — by the time a request reaches your business logic, its shape should already be guaranteed correct, letting internal code trust its inputs rather than re-validating defensively everywhere.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Basic Express app',
      language: 'typescript',
      code: `import express from 'express';
import 'express-async-errors'; // patches async error handling globally

const app = express();

// Built-in middleware
app.use(express.json());                    // parse JSON bodies
app.use(express.urlencoded({ extended: true })); // parse form data

// Custom middleware (logging)
app.use((req, res, next) => {
  console.log(\`\${req.method} \${req.url}\`);
  next(); // pass to next handler
});

// Routes
app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.get('/users/:id', async (req, res) => {
  const user = await db.findUser(req.params.id); // async errors auto-caught
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

app.post('/users', async (req, res) => {
  const user = await db.createUser(req.body);
  res.status(201).json(user);
});

// Error handler (4 args — MUST be last)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.statusCode ?? 500).json({ error: err.message });
});

app.listen(3000, () => console.log('Server on :3000'));`
    },
    {
      label: 'Router module',
      language: 'typescript',
      code: `// users.router.js
import { Router } from 'express';
import { getUser, createUser, updateUser, deleteUser } from './users.service.js';

const router = Router();

// Middleware specific to this router
router.use((req, res, next) => {
  if (!req.headers.authorization) return res.status(401).json({ error: 'Unauthorized' });
  next();
});

router.get('/',       async (req, res) => res.json(await listUsers(req.query)));
router.get('/:id',    async (req, res) => res.json(await getUser(req.params.id)));
router.post('/',      async (req, res) => res.status(201).json(await createUser(req.body)));
router.put('/:id',    async (req, res) => res.json(await updateUser(req.params.id, req.body)));
router.delete('/:id', async (req, res) => { await deleteUser(req.params.id); res.status(204).send(); });

export { router as usersRouter };

// app.js
import { usersRouter } from './users.router.js';
app.use('/users', usersRouter);
// Now: GET /users, GET /users/123, POST /users, etc.`
    },
    {
      label: 'Error handling patterns',
      language: 'typescript',
      code: `// Custom error class
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

// Route throwing an AppError
app.get('/items/:id', async (req, res) => {
  const item = await Item.findById(req.params.id);
  if (!item) throw new AppError('Item not found', 404);
  res.json(item);
});

// Central error handler
app.use((err, req, res, next) => {
  if (err.isOperational) {
    // Known, user-facing error
    return res.status(err.statusCode).json({
      error: { message: err.message, status: err.statusCode }
    });
  }
  // Programmer error — log and return generic 500
  console.error('Unexpected error:', err);
  res.status(500).json({ error: { message: 'Internal server error' } });
});

// Without express-async-errors (manual wrapping)
const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

app.get('/data', asyncHandler(async (req, res) => {
  const data = await fetchData(); // errors auto-forwarded to next(err)
  res.json(data);
}));`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Async handler without try/catch or express-async-errors',
      wrong: 'app.get("/users", async (req, res) => { const u = await db.find(); res.json(u); })',
      right: '// install express-async-errors or wrap: app.get("/users", asyncHandler(async ...))',
      explanation: 'Without express-async-errors, an unhandled async rejection in a route handler hangs the request (no response) or crashes Node. Always catch async errors and pass to next(err).'
    },
    {
      title: 'Error handler without 4 parameters',
      wrong: 'app.use((err, res) => res.status(500).json(err)); // Express ignores this!',
      right: 'app.use((err, req, res, next) => res.status(500).json({ error: err.message }));',
      explanation: 'Express identifies error-handling middleware by the presence of exactly 4 parameters. A 3-arg function is treated as regular middleware and errors are never routed to it.'
    },
    {
      title: 'Registering express.json() after route handlers',
      wrong: 'app.post("/users", handler); app.use(express.json()); // body is undefined!',
      right: 'app.use(express.json()); app.post("/users", handler); // middleware first',
      explanation: 'express.json() must be registered before any route that reads req.body. Order of app.use() calls is the order of execution in the pipeline.'
    },
    {
      title: 'Catching the same error multiple times with res.json()',
      wrong: 'app.get("/x", async (req, res) => { try { ... } catch(e) { res.status(500).json(e); next(e); } })',
      right: 'app.get("/x", async (req, res, next) => { try { ... } catch(e) { next(e); } })',
      explanation: 'Calling res.json() and then next(err) sends two responses and logs a "Cannot set headers after they are sent" error. Choose one: either respond inline or delegate to the error handler via next(err).'
    },
    {
      title: 'Specific routes defined after catch-all :param routes',
      wrong: 'app.get("/users/:id", handler); app.get("/users/me", meHandler); // "me" matches :id',
      right: 'app.get("/users/me", meHandler); app.get("/users/:id", handler); // specific first',
      explanation: 'Express matches routes in registration order. If /users/:id is defined first, /users/me matches it with id="me". Define specific routes before parameterised ones.'
    },
  ];

  challenge: Challenge = {
    title: 'Products REST API',
    language: 'typescript',
    description: 'Build a complete CRUD REST API for products using Express. Use an in-memory array as storage. Include: validation middleware (name required, price > 0), consistent error responses, and an error handler. Routes: GET /products, GET /products/:id, POST /products, PUT /products/:id, DELETE /products/:id.',
    hints: [
      'Use express.Router() for the products routes.',
      'Throw AppError(message, statusCode) from handlers and catch in a central error handler.',
      'Generate IDs with crypto.randomUUID().',
    ],
    starterCode: `import express from 'express';
const app = express();
app.use(express.json());

const products = []; // in-memory store

// TODO: validate middleware
// TODO: routes: GET /products, GET /products/:id, POST /products, PUT /products/:id, DELETE /products/:id
// TODO: error handler

app.listen(3000);`,
    solution: `import express from 'express';
import { randomUUID } from 'node:crypto';
const app = express();
app.use(express.json());

const products = [];
class AppError extends Error {
  constructor(msg, status = 500) { super(msg); this.statusCode = status; this.isOperational = true; }
}

function validate(req, res, next) {
  const { name, price } = req.body;
  if (!name || typeof name !== 'string') return next(new AppError('name is required', 400));
  if (price == null || typeof price !== 'number' || price <= 0) return next(new AppError('price must be a positive number', 400));
  next();
}

const router = express.Router();
router.get('/', (req, res) => res.json(products));
router.get('/:id', (req, res, next) => {
  const p = products.find(p => p.id === req.params.id);
  if (!p) return next(new AppError('Product not found', 404));
  res.json(p);
});
router.post('/', validate, (req, res) => {
  const p = { id: randomUUID(), ...req.body };
  products.push(p);
  res.status(201).json(p);
});
router.put('/:id', validate, (req, res, next) => {
  const i = products.findIndex(p => p.id === req.params.id);
  if (i === -1) return next(new AppError('Product not found', 404));
  products[i] = { ...products[i], ...req.body };
  res.json(products[i]);
});
router.delete('/:id', (req, res, next) => {
  const i = products.findIndex(p => p.id === req.params.id);
  if (i === -1) return next(new AppError('Product not found', 404));
  products.splice(i, 1);
  res.status(204).send();
});

app.use('/products', router);
app.use((err, req, res, next) => {
  res.status(err.statusCode ?? 500).json({ error: err.message });
});
app.listen(3000);`
  };

  quiz: QuizQuestion[] = [
    { q: 'What is the signature of an Express error-handling middleware?', options: ['(req, res)', '(err, req, res)', '(err, req, res, next)', '(error, next)'], answer: 2, explanation: 'Express error handlers have exactly 4 parameters: (err, req, res, next). Express detects this signature and routes errors to it when next(err) is called.' },
    { q: 'What does calling next() do in Express middleware?', options: ['Ends the request-response cycle', 'Passes control to the next matching middleware or route', 'Triggers the error handler', 'Restarts the middleware chain'], answer: 1, explanation: 'next() without arguments passes control to the next middleware or route handler in the chain. next(error) skips to error middleware.' },
    { q: 'Why must express.json() be registered before route handlers that use req.body?', options: ['It is not required — Express parses JSON automatically', 'Middleware runs in registration order; body must be parsed before handlers read it', 'express.json() only works on GET requests', 'It needs the route path to function'], answer: 1, explanation: 'app.use() functions execute in registration order. If express.json() is registered after a route, req.body is undefined when that route runs.' },
    { q: 'What is the purpose of express.Router()?', options: ['It replaces the main Express app', 'It creates modular route handlers that can be mounted at a path prefix', 'It adds URL rewriting', 'It handles CORS automatically'], answer: 1, explanation: 'express.Router() creates a mini-app with its own middleware and routes. Mount it with app.use("/prefix", router) to scope all its routes under that prefix.' },
    { q: 'How do you handle async errors in Express route handlers?', options: ['Express handles them automatically', 'Use try/catch and call next(error) in the catch block', 'Wrap res.json() in Promise.reject()', 'Throw errors directly — Express catches them'], answer: 1, explanation: 'Express 4 does not catch async rejections automatically. Use try/catch with next(error), or install express-async-errors which monkey-patches all route handlers to catch rejections.' },
    { q: 'What does express.json() do and why is it required?', options: ['Parses JSON query parameters', 'Parses incoming request body as JSON and makes it available at req.body', 'Serialises responses to JSON automatically', 'It is not required — Express parses JSON by default'], answer: 1, explanation: 'HTTP request bodies arrive as raw byte streams. express.json() reads the stream, buffers it, and calls JSON.parse() — the result is available on req.body. Without this middleware, req.body is undefined for JSON POST/PUT requests.' },
  ];

  qna: QnaItem[] = [
    { q: 'When should I use Express vs other Node.js frameworks?', a: 'Express: when you want maximum flexibility, a huge ecosystem, and don\'t mind assembling your own stack. Fastify: when performance matters (~2x Express throughput) and you want schema-based validation built in. NestJS: when you need a structured, Angular-like architecture for large teams. Hono: for edge runtimes (Cloudflare Workers). Express is still the most widely deployed — its simplicity and ecosystem make it a safe choice.' },
    { q: 'How do I structure a large Express application?', a: 'Feature-based folder structure: src/users/ contains users.router.js, users.controller.js, users.service.js, users.repository.js. Controller: HTTP in/out (req/res). Service: business logic (no HTTP). Repository: database access. Mount routers in app.js. This separation makes testing each layer easy and prevents "fat route handlers".' },
    { q: 'What is the difference between app.use() and app.get()?', a: 'app.use() matches any HTTP method and optionally a path prefix. app.get() matches only GET requests on an exact path. app.use("/api") handles GET /api, POST /api/users, etc. app.get("/api") only handles GET /api exactly. Use app.use() for middleware (body parsers, auth) and feature routers; app.get/post/put/delete for route handlers.' },
    { q: 'What is the execution order of Express middleware, and how does next() control it?', a: 'Express executes middleware in the exact order they are registered via app.use() or app.METHOD(), for matching routes. Calling next() inside a middleware function hands control to the next matching middleware in the chain; omitting next() (without sending a response) leaves the request hanging forever. Calling next(error) skips all remaining normal middleware and jumps directly to the nearest error-handling middleware (one with four parameters: (err, req, res, next)).' },
    { q: 'Why does Express error-handling middleware require exactly four parameters?', a: 'Express distinguishes error-handling middleware from regular middleware purely by function arity — a function with the signature (err, req, res, next) (four parameters) is registered as an error handler, while functions with three parameters (req, res, next) are treated as regular middleware even if you intend them to handle errors. This is a common bug source: accidentally writing a three-parameter "error handler" silently makes it a normal middleware that never receives the err argument.' },
    { q: 'Two feature routers each define their own body-parsing or auth middleware locally instead of sharing app-level middleware. What problem does this create as the app grows?', a: 'Duplicated per-router middleware drifts out of sync over time — one router\'s auth check gets updated to handle a new token format or role while a sibling router\'s local copy does not, creating inconsistent security or parsing behavior across features that should behave identically. The layered structure (routers mounted under app-level shared middleware, with feature-specific middleware reserved for genuinely feature-specific concerns like a particular route\'s validation schema) avoids this by having exactly one place that defines cross-cutting behavior like authentication, so a fix or policy change applies everywhere at once instead of needing to be hunted down and replicated across every router file.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Express is a middleware pipeline — request flows through (req, res, next) functions in registration order; route handlers and error handlers are just specialized middleware.',
    mustKnow: [
      'Middleware runs in registration order: body parsers before routes.',
      'next() continues chain; next(err) jumps to error middleware.',
      'Error handlers need exactly 4 args: (err, req, res, next).',
      'express.Router() for modular, mountable route groups.',
      'Async handlers need try/catch + next(err) or express-async-errors.',
      'Specific routes (GET /users/me) must be before parameterised ones (GET /users/:id).',
    ],
    interviewFocus: [
      'Explain the Express middleware pipeline and how errors flow through it.',
      'Why does the error handler need 4 parameters?',
      'How would you structure a large Express application?',
    ]
  };
}
