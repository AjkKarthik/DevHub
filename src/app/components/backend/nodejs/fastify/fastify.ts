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
  selector: 'app-node-fastify',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './fastify.html',
  styleUrl: './fastify.scss'
})
export class NodeFastify {
  quickRef: QuickRefItem[] = [
    { name: 'fastify()', type: 'function', desc: 'Create a Fastify instance with optional config (logger, https, ajv options).' },
    { name: 'fastify.get/post/put/delete()', type: 'method', desc: 'Register a route with optional schema for validation and serialisation.' },
    { name: 'schema.body / schema.params', type: 'keyword', desc: 'JSON Schema definitions compiled by AJV — validate request parts.' },
    { name: 'schema.response', type: 'keyword', desc: 'JSON Schema for response — compiled serialiser, ~2x faster than JSON.stringify.' },
    { name: 'fastify.register()', type: 'method', desc: 'Install a plugin in an encapsulated scope (own decorators/hooks/routes).' },
    { name: 'fastify.decorate()', type: 'method', desc: 'Add a property/method to the Fastify instance (db, logger, auth).' },
    { name: 'addHook()', type: 'method', desc: 'Lifecycle hooks: onRequest, preHandler, onSend, onResponse, onError.' },
    { name: 'fastify.listen()', type: 'method', desc: 'Start the HTTP server. Returns a promise (await in async context).' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Schema-Based Validation and Fast Serialisation',
      points: [
        'Fastify\'s performance edge comes from JSON Schema. You define schemas for request body, params, query, headers, and the response. AJV compiles these schemas into optimised validators at startup — no runtime validation overhead per request.',
        'The response schema is especially powerful: instead of JSON.stringify(), Fastify uses fast-json-stringify which generates a custom serialiser from your schema. This is 2x faster because it knows the exact shape and types of your response.',
        'Schema validation rejects invalid requests before they reach your handler — no manual validation code needed. A missing required field or wrong type returns a 400 with a detailed error message automatically.',
        'TypeScript integration: use JSON Schema type providers (e.g., TypeBox or Zod) to generate both the schema and TypeScript types simultaneously, ensuring they never diverge.',
      ]
    },
    {
      heading: 'Plugin System and Encapsulation',
      points: [
        'Fastify\'s plugin system is based on avvio (async dependency injection). Every plugin runs in an encapsulated scope — its decorators, hooks, and routes are only visible within that scope and its children. This prevents leaking internals between features.',
        'Use fastify.register() to install plugins. Pass scope-specific options as the second argument. Plugins can be async and are awaited before the server starts. This ensures all plugins are ready before serving requests.',
        'fastify.decorate() attaches properties to the Fastify instance — use it to share db connections, auth utilities, or configuration. fp (fastify-plugin) breaks encapsulation when you intentionally want a decorator to be available in the parent scope.',
        'Plugin authoring pattern: export an async function(fastify, opts) {}. Wrap with fp() if the plugin should share its scope with the parent.',
      ]
    },
    {
      heading: 'Lifecycle Hooks',
      points: [
        'Fastify has 9 lifecycle hooks: onRequest → preParsing → preValidation → preHandler → preSerialization → onSend → onResponse → onError → onClose. Register them with fastify.addHook().',
        'preHandler is the authentication layer — validate tokens, attach user to req, or return 401. Run before the route handler, so protected routes are never reached without auth.',
        'onError hooks allow centralised error transformation — convert AppError instances to structured JSON before Fastify sends the response. More powerful than Express\'s 4-arg error middleware.',
        'Hook scope matches registration scope — hooks registered in a plugin only apply to routes in that plugin. Global hooks (auth, logging) go on the root instance.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Fastify with schema',
      language: 'typescript',
      code: `import Fastify from 'fastify';

const fastify = Fastify({ logger: true });

// Route with schema validation and fast serialisation
fastify.post('/users', {
  schema: {
    body: {
      type: 'object',
      required: ['name', 'email'],
      properties: {
        name:  { type: 'string', minLength: 2 },
        email: { type: 'string', format: 'email' },
        age:   { type: 'integer', minimum: 0 }
      }
    },
    response: {
      201: {
        type: 'object',
        properties: {
          id:    { type: 'string' },
          name:  { type: 'string' },
          email: { type: 'string' }
        }
      }
    }
  }
}, async (request, reply) => {
  // req.body is already validated — name/email guaranteed present
  const user = await db.createUser(request.body);
  return reply.status(201).send(user);
  // Response serialised by fast-json-stringify — fields not in schema are stripped
});

await fastify.listen({ port: 3000, host: '0.0.0.0' });`
    },
    {
      label: 'Plugins and decorators',
      language: 'typescript',
      code: `import Fastify from 'fastify';
import fp from 'fastify-plugin';
import { PrismaClient } from '@prisma/client';

// Plugin that decorates fastify with a db connection
const dbPlugin = fp(async (fastify, opts) => {
  const prisma = new PrismaClient();
  await prisma.$connect();

  fastify.decorate('db', prisma);

  fastify.addHook('onClose', async () => {
    await prisma.$disconnect();
  });
});

// Auth plugin (encapsulated — only affects its child routes)
const authPlugin = async (fastify, opts) => {
  fastify.addHook('preHandler', async (request, reply) => {
    const token = request.headers.authorization?.split(' ')[1];
    if (!token) return reply.status(401).send({ error: 'Unauthorized' });
    try {
      request.user = verifyJwt(token);
    } catch {
      return reply.status(401).send({ error: 'Invalid token' });
    }
  });

  // Routes in this plugin are protected
  fastify.get('/me', async (req) => req.user);
};

const app = Fastify({ logger: true });
app.register(dbPlugin);          // db available everywhere (fp breaks encapsulation)
app.register(authPlugin, { prefix: '/api' }); // /api/me is protected
await app.listen({ port: 3000 });`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Not awaiting fastify.listen()',
      wrong: 'fastify.listen({ port: 3000 }); // errors are swallowed',
      right: 'await fastify.listen({ port: 3000 }); // or .then().catch()',
      explanation: 'fastify.listen() is async. Without await, plugin errors and port conflicts are silent. Always await or attach a .catch() handler.'
    },
    {
      title: 'Returning values from handlers instead of reply.send()',
      wrong: '// Both are fine actually — returning from async handler works in Fastify',
      right: 'return { data }; // OR reply.send({ data }); — pick one style',
      explanation: 'Fastify treats the return value of an async handler as the response body. Both return value and reply.send() work, but mixing them causes "Reply already sent" errors. Be consistent.'
    },
    {
      title: 'Registering global plugins after routes',
      wrong: 'app.get("/", handler); app.register(dbPlugin); // db not available in handler',
      right: 'app.register(dbPlugin); app.get("/", handler); // register order matters',
      explanation: 'Plugins are loaded in registration order. A route registered before a plugin cannot access that plugin\'s decorators. Register shared plugins first.'
    },
    {
      title: 'Forgetting fp() on plugins that should share scope',
      wrong: 'export default async function dbPlugin(fastify, opts) { fastify.decorate("db", ...) } // only visible in child',
      right: 'export default fp(async function dbPlugin(fastify, opts) { fastify.decorate("db", ...) })',
      explanation: 'Without fp() (fastify-plugin), a plugin runs in an encapsulated scope. Its decorators are not visible to the parent or sibling plugins. Wrap with fp() for shared decorators like db connections.'
    },
  ];

  challenge: Challenge = {
    title: 'Fastify CRUD with Schema Validation',
    language: 'typescript',
    description: 'Build a Fastify API for managing books. Schema validate: POST body (title: string required, author: string required, year: integer 1000-2025). GET /books returns array. GET /books/:id returns 404 if not found. Use response schemas to strip excess fields. Include a custom error handler that returns { error: message, statusCode }.',
    hints: [
      'fastify.setErrorHandler((error, request, reply) => {...}) for custom error handling.',
      'Use schema.response[200] and schema.response[201] for different status schemas.',
      'fastify.get("/books/:id", { schema: { params: { type:"object", properties: { id: {type:"string"} } } } })',
    ],
    starterCode: `import Fastify from 'fastify';
const fastify = Fastify({ logger: false });
const books = [];

// TODO: custom error handler
// TODO: GET /books (all)
// TODO: GET /books/:id (with schema params)
// TODO: POST /books (with body schema + response 201 schema)
// TODO: DELETE /books/:id

await fastify.listen({ port: 3001 });`,
    solution: `import Fastify from 'fastify';
import { randomUUID } from 'node:crypto';
const fastify = Fastify({ logger: false });
const books = [];

fastify.setErrorHandler((error, req, reply) => {
  reply.status(error.statusCode ?? 500).send({ error: error.message, statusCode: error.statusCode ?? 500 });
});

const bookOut = { type: 'object', properties: { id: {type:'string'}, title: {type:'string'}, author: {type:'string'}, year: {type:'integer'} } };
fastify.get('/books', { schema: { response: { 200: { type:'array', items: bookOut } } } }, async () => books);
fastify.get('/books/:id', { schema: { params: { type:'object', properties: { id:{type:'string'} }, required:['id'] }, response: { 200: bookOut } } }, async (req, reply) => {
  const b = books.find(b => b.id === req.params.id);
  if (!b) return reply.status(404).send({ error: 'Not found', statusCode: 404 });
  return b;
});
fastify.post('/books', {
  schema: {
    body: { type:'object', required:['title','author'], properties: { title:{type:'string',minLength:1}, author:{type:'string',minLength:1}, year:{type:'integer',minimum:1000,maximum:2025} } },
    response: { 201: bookOut }
  }
}, async (req, reply) => { const b = { id: randomUUID(), ...req.body }; books.push(b); return reply.status(201).send(b); });
fastify.delete('/books/:id', async (req, reply) => {
  const i = books.findIndex(b => b.id === req.params.id);
  if (i === -1) return reply.status(404).send({ error:'Not found', statusCode:404 });
  books.splice(i, 1); reply.status(204).send();
});
await fastify.listen({ port: 3001 });`
  };

  quiz: QuizQuestion[] = [
    { q: 'Why is Fastify faster than Express for JSON APIs?', options: ['It uses a different HTTP library', 'Schema-based AJV validation and fast-json-stringify serialisation eliminate per-request overhead', 'It uses WebAssembly', 'It compresses responses by default'], answer: 1, explanation: 'Fastify compiles JSON Schemas into optimised validators (AJV) and serialisers (fast-json-stringify) at startup. Each request skips validation parsing and uses the pre-compiled code — 2x faster JSON throughput vs JSON.stringify.' },
    { q: 'What does fastify-plugin (fp) do?', options: ['Adds TypeScript support', 'Breaks plugin encapsulation so decorators are visible to the parent scope', 'Creates a new Fastify instance', 'Adds automatic retry logic'], answer: 1, explanation: 'By default, Fastify plugins are encapsulated. fp() skips encapsulation so a plugin\'s decorators and hooks are available to the parent scope. Use for shared infrastructure (db, auth helpers).' },
    { q: 'Which hook runs before the route handler in Fastify?', options: ['onResponse', 'onSend', 'preHandler', 'onRequest'], answer: 2, explanation: 'preHandler runs after body parsing and validation but before the route handler. It is the right place for authentication and authorization logic.' },
    { q: 'What happens if a Fastify route returns a value not matching the response schema?', options: ['The response is sent as-is', 'Extra fields are stripped; the schema acts as a whitelist', 'An error is thrown', 'The schema is ignored for non-matching responses'], answer: 1, explanation: 'The response schema defines the serialiser. Fields not in the schema are stripped from the response. This acts as security layer (no accidental password leaks) and performance optimisation.' },
    { q: 'What is the purpose of Fastify plugins and what does fastify.register() do?', options: ['Registers middleware identically to Express use()', 'Encapsulates routes and hooks in a scope — child plugins inherit parent scope but parent does not see child additions', 'Adds global error handlers', 'Installs npm packages at runtime'], answer: 1, explanation: 'Fastify plugins create an encapsulated scope. A plugin registered with fastify.register() has its own context: hooks and decorators added inside do not leak to the parent or sibling plugins unless using fastify-plugin (which skips encapsulation). This enables modular route grouping with isolated middleware.' },
    { q: 'Why is Fastify faster than Express for JSON serialisation?', options: ['Fastify uses a C++ JSON parser', 'Fastify uses fast-json-stringify with pre-compiled serialisers from your JSON Schema — avoids JSON.stringify overhead', 'Fastify caches responses in memory', 'Fastify skips validation in production'], answer: 1, explanation: 'JSON.stringify is a general-purpose serialiser that inspects every value at runtime. fast-json-stringify compiles a serialiser function from your JSON Schema at startup — it knows the shape in advance and generates optimised code. For large payloads, this is 2–10× faster than JSON.stringify.' },
  ];

  qna: QnaItem[] = [
    { q: 'When should I choose Fastify over Express?', a: 'Fastify: when you need performance (APIs serving 50k+ req/s), want built-in schema validation without extra middleware, use TypeScript (better integration via TypeBox/Zod), or are building microservices. Express: when ecosystem maturity matters most (older libs only have Express adapters), team familiarity, or simple apps where Express\'s simplicity wins.' },
    { q: 'How does Fastify handle TypeScript?', a: 'Use @fastify/type-provider-typebox (recommended) or @fastify/type-provider-zod. Define a schema with TypeBox/Zod, pass it to the route, and request.body/params/query become fully typed — no manual interface definitions. The schema both validates at runtime AND provides TypeScript types.' },
    { q: 'Can Fastify plugins be async?', a: 'Yes — this is one of Fastify\'s major advantages. Plugins are async functions that are awaited during startup. You can do async operations in plugin setup: connecting to a database, fetching config from a secrets manager, or warming a cache. The server does not start until all plugins resolve.' },
    { q: 'Why is Fastify generally faster than Express for the same route handling logic?', a: 'Fastify uses a highly optimized radix-tree router (find-my-way) and a JSON schema-based serializer that pre-compiles response serialization into optimized functions ahead of time, rather than using generic JSON.stringify at request time. It also minimizes middleware overhead by using a more structured plugin/hook system instead of Express\'s linear middleware chain, reducing per-request function call overhead. In benchmarks this typically yields meaningfully higher requests-per-second for comparable workloads, though real-world gains depend heavily on what the route handlers themselves do.' },
    { q: 'What is the purpose of JSON Schema validation in Fastify route definitions?', a: 'Defining a schema (for body, querystring, params, and response) on a Fastify route gives you automatic, fast request validation (rejecting malformed input before your handler even runs) and automatic response serialization optimization (Fastify pre-compiles a serializer matching the schema, which is faster than generic serialization and also strips any unexpected fields from the response, preventing accidental data leakage of fields not declared in the schema).' },
    { q: 'How does the Fastify plugin system (fastify-plugin) differ from simply requiring a module?', a: 'A plain require just imports code with no awareness of Fastify\'s encapsulation context. Fastify plugins registered via fastify.register() are encapsulated by default — decorations, hooks, and routes added inside a plugin are scoped to that plugin and its children, not leaked to siblings or the parent. Wrapping a plugin with fastify-plugin explicitly breaks this encapsulation so its decorations (e.g., a database connection decorator) become available application-wide, which is the correct pattern for genuinely global, shared utilities.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Fastify is a high-performance Node.js framework — JSON Schema validation + fast-json-stringify give ~2x Express throughput; plugins with encapsulation provide structure.',
    mustKnow: [
      'JSON Schema validates request body/params/query via AJV — no manual validation.',
      'Response schema generates a fast serialiser and strips unlisted fields.',
      'fp() (fastify-plugin) makes decorators visible to parent scope.',
      'preHandler hook is the authentication layer.',
      'Always await fastify.listen() — errors are swallowed otherwise.',
      'Plugin registration order matters — shared plugins must register first.',
    ],
    interviewFocus: [
      'How does Fastify achieve higher throughput than Express?',
      'What is plugin encapsulation and when would you break it?',
      'Where do you put authentication logic in Fastify?',
    ]
  };
}
