import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Topic {
  title: string; description: string; route: string; badge: string; available: boolean; keyPoints: string[];
}

const BADGE_CSS: Record<string, string> = {
  'Foundations': 'foundations', 'HTTP & APIs': 'http', 'Async & Streams': 'async',
  'Database': 'database', 'Auth & Security': 'auth', 'Performance': 'performance',
  'Tooling': 'tooling', 'Reference': 'reference',
};
const GROUP_ORDER = ['All', 'Foundations', 'HTTP & APIs', 'Async & Streams', 'Database', 'Auth & Security', 'Performance', 'Tooling', 'Reference'];

const ALL_TOPICS: Topic[] = [
  { title: 'Node.js Architecture',      route: '/node', badge: 'Foundations', available: false,
    description: 'Event loop, libuv, V8 engine, single-threaded non-blocking I/O, and how Node.js handles concurrency.',
    keyPoints: ['Event loop: phases — timers, I/O callbacks, poll, check, close', 'libuv provides OS-level async I/O via thread pool (4 threads by default)', 'Single thread executes JS; I/O offloaded — never block the event loop'] },
  { title: 'Modules & CommonJS',        route: '/node', badge: 'Foundations', available: false,
    description: 'require vs ES modules import/export, module caching, circular dependencies, and package.json type field.',
    keyPoints: ['CJS: require() is synchronous; ES modules: import is async (top-level await)', 'package.json "type":"module" switches to ESM; .cjs/.mjs for explicit choice', 'Module cache: same module required twice returns cached export'] },
  { title: 'Node.js Core Modules',      route: '/node', badge: 'Foundations', available: false,
    description: 'fs, path, os, events, child_process, worker_threads, crypto — the essential Node built-ins.',
    keyPoints: ['fs/promises: async file operations; fs.createReadStream for large files', 'EventEmitter: backbone of Node.js — extend it for custom event-driven APIs', 'worker_threads: true parallelism for CPU-bound tasks in Node'] },
  { title: 'Express.js',                route: '/node', badge: 'HTTP & APIs', available: false,
    description: 'Routing, middleware chain, error handling, request/response lifecycle, and structuring Express apps.',
    keyPoints: ['Middleware: (req, res, next) — chain transforms request before handler', 'Error middleware: (err, req, res, next) — 4-argument signature', 'Router: modular route handlers; express.Router() for feature modules'] },
  { title: 'Fastify',                   route: '/node', badge: 'HTTP & APIs', available: false,
    description: 'Schema-based validation, plugins, lifecycle hooks, and why Fastify is faster than Express.',
    keyPoints: ['JSON Schema validation at route level — compiled to fast validator', 'Plugin system with decorators: add properties to fastify instance', '70k+ req/s vs Express 35k — schema-based serialisation eliminates overhead'] },
  { title: 'REST API Design in Node',   route: '/node', badge: 'HTTP & APIs', available: false,
    description: 'CRUD routes, status codes, input validation with Zod/Joi, and clean controller/service separation.',
    keyPoints: ['Zod schema → type inference + runtime validation in one declaration', 'Controller: HTTP in/out; Service: business logic; Repository: data access', 'Never send raw error messages — map to RFC 9457 Problem Details'] },
  { title: 'Promises & Async/Await',    route: '/node', badge: 'Async & Streams', available: false,
    description: 'Async patterns in Node.js — util.promisify, error-first callbacks, async iteration, unhandled rejections.',
    keyPoints: ['util.promisify wraps callback-style APIs into Promise-based', 'process.on("unhandledRejection") catches missed .catch()', 'for await...of with async generators for streaming pagination'] },
  { title: 'Streams & Buffers',         route: '/node', badge: 'Async & Streams', available: false,
    description: 'Readable, Writable, Transform, Duplex streams — piping, backpressure, and processing large files.',
    keyPoints: ['pipe() manages backpressure automatically — consumer controls producer speed', 'Transform stream: modify data as it flows (compression, encryption)', 'stream.pipeline() with error handling is safer than pipe()'] },
  { title: 'Database with Prisma',      route: '/node', badge: 'Database', available: false,
    description: 'Prisma ORM — schema, migrations, CRUD, relations, transactions, and raw SQL escape hatch.',
    keyPoints: ['schema.prisma: model → table mapping with type-safe client generation', 'prisma migrate dev: generates and applies SQL migrations', 'Transactions: prisma.$transaction([]) or interactive transactions'] },
  { title: 'MongoDB with Mongoose',     route: '/node', badge: 'Database', available: false,
    description: 'Schema definition, models, virtuals, middleware hooks, and aggregation pipeline with Mongoose.',
    keyPoints: ['Schema: define shape, types, validators, and defaults', 'Middleware: pre/post hooks on save, validate, find operations', 'Lean queries: .lean() returns plain JS objects — faster, no Mongoose methods'] },
  { title: 'Auth with JWT & Passport',  route: '/node', badge: 'Auth & Security', available: false,
    description: 'JWT-based authentication, refresh token rotation, Passport.js strategies, and session vs token trade-offs.',
    keyPoints: ['jsonwebtoken: sign access token (15m) + refresh token (7d)', 'Passport LocalStrategy: username/password; JwtStrategy: bearer token', 'Refresh token rotation: issue new refresh on every use, invalidate old'] },
  { title: 'Security Best Practices',   route: '/node', badge: 'Auth & Security', available: false,
    description: 'Helmet.js, rate limiting, input sanitisation, SQL/NoSQL injection prevention, and dependency audits.',
    keyPoints: ['helmet(): sets 11 security headers in one middleware call', 'express-rate-limit: per-IP limits with Redis store for multi-process', 'npm audit + Snyk: scan dependencies for known CVEs in CI pipeline'] },
  { title: 'Node.js Performance',       route: '/node', badge: 'Performance', available: false,
    description: 'Profiling with clinic.js, clustering, PM2, memory leak detection, and event loop lag monitoring.',
    keyPoints: ['Clustering: spawn one Node process per CPU core via cluster module', 'PM2: process manager with cluster mode, auto-restart, log aggregation', 'clinic.js flame: CPU profiler; clinic.js doctor: event loop lag and I/O bottlenecks'] },
  { title: 'Testing Node.js Apps',      route: '/node', badge: 'Tooling', available: false,
    description: 'Vitest/Jest for unit tests, supertest for HTTP integration tests, and test database strategies.',
    keyPoints: ['supertest: HTTP assertions without starting a server — inject directly into Express/Fastify app', 'Vitest: ESM-native, fast — preferred over Jest for modern projects', 'Test containers: spin up real Postgres/Redis in Docker for integration tests'] },
  { title: 'Environment Config & dotenv',   route: '/node', badge: 'Foundations', available: false,
    description: 'Config management in Node.js — dotenv, env validation with Zod, and 12-factor app principles.',
    keyPoints: ['dotenv: loads .env into process.env', 'Never commit .env — add to .gitignore', 'Validate env at startup with Zod or Joi', '12-factor: config via environment not code', 'node:config or convict for multi-env configs'] },
  { title: 'Error Handling Patterns',      route: '/node', badge: 'Async & Streams', available: false,
    description: 'Structured error handling in Node.js — error classes, operational vs programmer errors, and never crashing.',
    keyPoints: ['Custom AppError class extends Error', 'Operational errors (network) vs bugs — handle differently', 'never-throw pattern: return Result<T, E>', 'Express error middleware catches thrown errors', 'process.on("uncaughtException") — log and exit'] },
  { title: 'Logging with Winston/Pino',    route: '/node', badge: 'Performance', available: false,
    description: 'Structured JSON logging with Winston or Pino — levels, transports, correlation IDs, and log shipping.',
    keyPoints: ['Pino: 5x faster than Winston via pino-http', 'Log levels: fatal/error/warn/info/debug/trace', 'Correlation ID via AsyncLocalStorage', 'redact: hide sensitive fields in output', 'Ship logs to Elasticsearch or CloudWatch'] },
  { title: 'WebSockets with Socket.io',    route: '/node', badge: 'HTTP & APIs', available: false,
    description: 'Real-time bidirectional communication — rooms, namespaces, acknowledgements, and scaling.',
    keyPoints: ['io.on("connection", socket => ...)', 'socket.join("room") for broadcast groups', 'socket.emit / io.to("room").emit', 'Acknowledgements: callback-based confirm', 'Redis adapter for multi-server scaling'] },
  { title: 'GraphQL API with Node.js',     route: '/node', badge: 'HTTP & APIs', available: false,
    description: 'Build GraphQL APIs with Apollo Server or Mercurius — schema, resolvers, and DataLoader.',
    keyPoints: ['Apollo Server 4 with Express or standalone', 'typeDefs SDL + resolvers object pattern', 'DataLoader: batch and cache N+1 DB calls', 'Context: attach auth user to every resolver', 'Subscriptions with WebSocket transport'] },
  { title: 'Caching with Redis',           route: '/node', badge: 'Performance', available: false,
    description: 'Add Redis caching to Node.js apps — cache-aside, TTL, cache invalidation, and ioredis.',
    keyPoints: ['ioredis client: single instance + cluster support', 'Cache-aside: check Redis → fetch DB → store', 'TTL with setex("key", seconds, value)', 'Cache invalidation on mutation', 'Distributed rate limiting with Redis counters'] },
  { title: 'Worker Threads',               route: '/node', badge: 'Performance', available: false,
    description: 'CPU-bound parallelism in Node.js using worker_threads — thread pools, MessageChannel.',
    keyPoints: ['new Worker(path, { workerData }) launches thread', 'parentPort.postMessage / worker.on("message")', 'SharedArrayBuffer for shared memory', 'Worker pool pattern for task queues', 'Avoid for I/O-bound work — event loop handles that'] },
  { title: 'Deploying Node.js Apps',       route: '/node', badge: 'Tooling', available: false,
    description: 'Docker containers, PM2 cluster mode, health checks, graceful shutdown, and 12-factor deployment.',
    keyPoints: ['Multi-stage Dockerfile for lean Node image', 'PM2: cluster mode + zero-downtime reload', 'Graceful shutdown: SIGTERM → drain requests', 'Health check endpoint /health for liveness', 'Structured logging + exit code on fatal error'] },
  { title: 'NestJS',                     route: '/node', badge: 'HTTP & APIs', available: false,
    description: 'Enterprise Node.js with Angular-inspired architecture — modules, controllers, providers, DI, and guards.',
    keyPoints: ['@Module, @Controller, @Injectable: Angular-like structure in Node.js', 'Dependency injection built-in: constructor injection with NestJS IoC container', 'Guards (@UseGuards), Interceptors, Pipes, Filters — the NestJS request pipeline', 'Built on Express (or Fastify): drop-in and platform-agnostic', 'CQRS, microservices, WebSockets, GraphQL all first-class in NestJS ecosystem'] },
  { title: 'Node.js Cheat Sheet',       route: '/node', badge: 'Reference', available: false,
    description: 'Core modules quick reference, async patterns, common middleware, and debugging commands.',
    keyPoints: ['Event loop phases at a glance', 'Common core module methods: fs, path, os, crypto', 'Debugging: node --inspect + Chrome DevTools; NODE_ENV best practices'] },
  { title: 'Node.js Interview Prep',    route: '/node', badge: 'Reference', available: false,
    description: '35+ Node.js interview questions — event loop, streams, clustering, security, and performance.',
    keyPoints: ['Explain the Node.js event loop in detail', 'What is backpressure in streams and how do you handle it?', 'How would you scale a Node.js app across multiple CPU cores?'] },
];

@Component({
  selector: 'app-nodejs-home',
  standalone: true, imports: [RouterLink],
  templateUrl: './home.html', styleUrl: './home.scss',
})
export class NodejsHome {
  activeFilter = signal('All');
  expandedCard = signal<string | null>(null);
  topics = computed(() => { const f = this.activeFilter(); return f === 'All' ? ALL_TOPICS : ALL_TOPICS.filter(t => t.badge === f); });
  filters = GROUP_ORDER;
  counts = computed(() => { const map: Record<string, number> = { All: ALL_TOPICS.length }; for (const t of ALL_TOPICS) map[t.badge] = (map[t.badge] ?? 0) + 1; return map; });
  availableCount = ALL_TOPICS.filter(t => t.available).length;
  totalCount = ALL_TOPICS.length;
  setFilter(f: string) { this.activeFilter.set(f); }
  badgeCss(badge: string) { return 'badge badge-' + (BADGE_CSS[badge] ?? 'foundations'); }
  toggleCard(key: string, event: Event) { event.preventDefault(); this.expandedCard.update(c => c === key ? null : key); }
}
