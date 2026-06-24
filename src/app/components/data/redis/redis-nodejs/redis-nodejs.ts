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
  selector: 'app-redis-nodejs',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            RevisionCardComponent, PageCompleteComponent],
  templateUrl: './redis-nodejs.html',
  styleUrl: './redis-nodejs.scss',
})
export class RedisNodejs {
  quickRef: QuickRefItem[] = [
    { name: 'ioredis', type: 'syntax', desc: 'Feature-rich client: Sentinel, Cluster, pipelining, Lua, auto-reconnect' },
    { name: 'node-redis (redis)', type: 'syntax', desc: 'Official client: promises, TypeScript-first, Redis Stack support' },
    { name: 'redis.pipeline()', type: 'method', desc: 'ioredis: batch commands, one round-trip, returns array of results' },
    { name: 'redis.multi()', type: 'method', desc: 'ioredis: MULTI/EXEC transaction — .exec() returns results array' },
    { name: 'client.sendCommand()', type: 'method', desc: 'node-redis: run arbitrary/unsupported commands' },
    { name: 'ioredis.Cluster()', type: 'class', desc: 'Cluster-aware client with automatic slot routing' },
    { name: 'createClient({ socket: { reconnectStrategy } })', type: 'syntax', desc: 'node-redis: custom reconnect with exponential backoff' },
    { name: 'redis.duplicate()', type: 'method', desc: 'ioredis: create a copy of the connection (same config, new socket)' },
    { name: 'redis.defineCommand()', type: 'method', desc: 'ioredis: register a custom Lua script as a named method' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'ioredis vs node-redis',
      points: [
        'ioredis is battle-tested, with built-in Sentinel + Cluster support, auto-reconnect, pipeline queuing during reconnect, and custom command definitions via defineCommand().',
        'node-redis (npm package `redis`) is the official client maintained by Redis. It is TypeScript-first, supports Redis Stack modules natively (client.json, client.ft, client.ts), and uses modern async/await APIs.',
        'Both support pipelining, transactions (MULTI/EXEC), Pub/Sub, and Lua scripting. Key differences: ioredis has a slightly nicer Cluster API; node-redis has first-class Stack module support.',
        'For Redis Stack (RedisSearch, RedisJSON), prefer node-redis — it ships typed helpers for FT.*, JSON.*, TS.* commands. For vanilla Redis with Sentinel/Cluster, either works well.',
      ],
    },
    {
      heading: 'Connection Management',
      points: [
        'Create the client once at application startup — do not create a new connection per request. Redis connections are long-lived TCP sockets.',
        'For Pub/Sub, use a dedicated connection via `redis.duplicate()` (ioredis) or `client.duplicate()` (node-redis). A subscribed connection cannot run regular commands.',
        'ioredis buffers commands during reconnection automatically — commands issued while disconnected are queued and replayed once the connection is restored. node-redis v4+ has similar behaviour.',
        'Connection pooling: Redis connections are cheap but not free. For very high concurrency, a connection pool (via ioredis-pool or connection-manager) avoids head-of-line blocking on a single connection.',
        'Always handle `error` events on the client to prevent uncaught exceptions from crashing Node.js.',
      ],
    },
    {
      heading: 'Pipelining for Throughput',
      points: [
        'Pipelining sends multiple commands in a single TCP packet and reads all replies at once, eliminating per-command round-trip latency.',
        'ioredis: `const pipeline = redis.pipeline(); pipeline.set(...); pipeline.incr(...); const results = await pipeline.exec();`',
        'Pipelining is NOT the same as transactions — commands run in order but are not atomic. Use MULTI/EXEC for atomicity.',
        'Use pipelining when you have 5+ independent commands to run in sequence — the throughput improvement is significant on network-latency-sensitive deployments.',
        'Avoid very large pipelines (>1000 commands) — they hold all replies in memory and can cause temporary latency spikes.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'ioredis Setup',
      language: 'typescript',
      code: `import Redis from 'ioredis';

// Singleton — create once, reuse everywhere
const redis = new Redis({
  host: process.env.REDIS_HOST ?? 'localhost',
  port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  password: process.env.REDIS_PASSWORD,
  db: 0,
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    return Math.min(times * 200, 5000); // exponential backoff, max 5s
  },
  lazyConnect: true, // connect on first command, not on creation
});

redis.on('connect', () => console.log('Redis connected'));
redis.on('error', (err) => console.error('Redis error:', err));
redis.on('reconnecting', () => console.log('Redis reconnecting...'));

// Pipelining
async function batchWrite(items: Array<{ key: string; value: string }>) {
  const pipeline = redis.pipeline();
  for (const { key, value } of items) {
    pipeline.set(key, value, 'EX', 3600);
  }
  const results = await pipeline.exec();
  return results?.every(([err]) => err === null);
}

// Custom Lua command
redis.defineCommand('rateLimit', {
  numberOfKeys: 1,
  lua: \`
    local count = redis.call('INCR', KEYS[1])
    if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
    return count
  \`,
});

// Usage: (redis as any).rateLimit('rl:user:42', '60')`,
    },
    {
      label: 'node-redis Setup',
      language: 'typescript',
      code: `import { createClient } from 'redis';

const client = createClient({
  url: process.env.REDIS_URL ?? 'redis://localhost:6379',
  socket: {
    reconnectStrategy(retries) {
      if (retries > 10) return new Error('Redis max retries exceeded');
      return Math.min(retries * 100, 3000);
    },
    connectTimeout: 5000,
  },
});

client.on('error', (err) => console.error('Redis error:', err));
await client.connect();

// Pipeline (multi-exec = transaction; for plain batch use pipeline)
const results = await client.multi()
  .set('key1', 'value1')
  .incr('counter')
  .expire('key1', 3600)
  .exec(); // returns [OK, count, 1]

// Pub/Sub with node-redis
const subscriber = client.duplicate();
await subscriber.connect();
await subscriber.subscribe('channel', (message) => {
  console.log('Received:', message);
});`,
    },
    {
      label: 'Session Store (Express)',
      language: 'typescript',
      code: `import express from 'express';
import session from 'express-session';
import { createClient } from 'redis';
import connectRedis from 'connect-redis';

const app = express();
const redisClient = createClient({ url: 'redis://localhost:6379' });
await redisClient.connect();

const RedisStore = connectRedis(session);

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}));

app.get('/profile', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  res.json({ userId: req.session.userId });
});`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Creating a new Redis connection per request',
      wrong: `app.get('/data', async (req, res) => {
  const redis = new Redis(); // new connection on every request!
  const data = await redis.get('key');
  res.json(data);
});`,
      right: `const redis = new Redis(); // singleton at module level
app.get('/data', async (req, res) => {
  const data = await redis.get('key');
  res.json(data);
});`,
      explanation: 'Each new Redis() opens a TCP connection that takes ~1ms to establish and consumes server-side connection resources. Creating per-request connections exhausts Redis\'s connection limit under load and adds unnecessary latency.',
    },
    {
      title: 'Not handling Redis errors — crashing Node.js',
      wrong: `const redis = new Redis();
// No error listener — unhandled error events crash Node.js`,
      right: `const redis = new Redis();
redis.on('error', (err) => {
  console.error('Redis error (non-fatal):', err.message);
  // alert/metric here, but don't crash
});`,
      explanation: 'In Node.js, unhandled EventEmitter error events terminate the process. Always attach an error listener to Redis clients. Transient connection errors should log and alert, not crash the application.',
    },
    {
      title: 'Using await in a loop instead of pipelining',
      wrong: `for (const key of keys) {
  await redis.get(key); // N round-trips — slow
}`,
      right: `const pipeline = redis.pipeline();
for (const key of keys) pipeline.get(key);
const results = await pipeline.exec(); // 1 round-trip`,
      explanation: 'Awaiting each Redis command individually causes N network round-trips. On a server with 1ms Redis latency, 100 commands take 100ms serially. Pipelining sends all 100 in one packet and processes them in ~1ms total.',
    },
  ];

  challenge: Challenge = {
    title: 'Redis Cache Middleware',
    language: 'typescript',
    description: 'Write an Express middleware `cacheMiddleware(redis, ttlSec)` that caches GET responses in Redis. Key = `cache:${req.path}`. On hit, return cached JSON with header `X-Cache: HIT`. On miss, capture the response, cache it, and add `X-Cache: MISS`.',
    hints: [
      'Override res.json to intercept the response body before sending',
      'Use req.path as the cache key; skip non-GET methods',
    ],
    starterCode: `import Redis from 'ioredis';
import { Request, Response, NextFunction } from 'express';

function cacheMiddleware(redis: Redis, ttlSec: number) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // implement
  };
}`,
    solution: `import Redis from 'ioredis';
import { Request, Response, NextFunction } from 'express';

function cacheMiddleware(redis: Redis, ttlSec: number) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') return next();
    const key = \`cache:\${req.path}\`;
    const cached = await redis.get(key);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(JSON.parse(cached));
    }
    const originalJson = res.json.bind(res);
    res.json = (body: unknown) => {
      redis.set(key, JSON.stringify(body), 'EX', ttlSec);
      res.setHeader('X-Cache', 'MISS');
      return originalJson(body);
    };
    next();
  };
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the main advantage of pipelining over sequential await calls?',
      options: [
        'Commands run in parallel on the Redis server',
        'Multiple commands are sent in one network round-trip',
        'Pipelining adds transaction atomicity',
        'Commands skip the Redis queue',
      ],
      answer: 1,
      explanation: 'Pipelining batches multiple commands into a single TCP write, eliminating per-command round-trip latency. The Redis server still processes them sequentially — the benefit is purely network I/O reduction, not server-side parallelism.',
    },
    {
      q: 'Why does a Pub/Sub subscriber need its own dedicated Redis connection?',
      options: [
        'Redis limits connections per client',
        'A subscribed connection only accepts SUBSCRIBE/UNSUBSCRIBE commands — regular commands are rejected',
        'Pub/Sub uses a different Redis port',
        'node-redis requires it for security',
      ],
      answer: 1,
      explanation: 'Once a connection enters subscribe mode (after SUBSCRIBE/PSUBSCRIBE), it can only run SUBSCRIBE, UNSUBSCRIBE, PSUBSCRIBE, PUNSUBSCRIBE, PING, and QUIT. Regular commands (GET, SET) return errors. Always use a dedicated connection for pub/sub.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Should I use ioredis or node-redis for a new project?',
      a: 'For vanilla Redis features (strings, hashes, lists, sorted sets, streams, transactions): either works — ioredis has a slightly more mature Sentinel/Cluster API and has been around longer. For Redis Stack (RedisSearch, RedisJSON, RedisTimeSeries): prefer node-redis which ships typed helpers for all Stack commands. For new projects, node-redis v4+ is a solid choice as the official maintained client with TypeScript-first design. For migration from existing ioredis codebases, the effort rarely justifies switching.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Create one Redis connection at startup (reuse everywhere); use pipeline() for batched commands; duplicate() for Pub/Sub; always attach an error event listener.',
    mustKnow: [
      'One connection at startup — never create per-request connections',
      'pipeline(): batches N commands into 1 round-trip (not atomic)',
      'multi(): MULTI/EXEC transaction — atomic but not pipelined by default',
      'Pub/Sub needs a dedicated connection (subscribed mode rejects regular commands)',
      'Always attach error listener — unhandled Redis errors crash Node.js',
      'ioredis: better Cluster/Sentinel; node-redis: better for Redis Stack modules',
    ],
    interviewFocus: [
      'What is pipelining and how does it differ from a transaction?',
      'Why do you need a separate connection for Pub/Sub?',
      'How do you handle Redis reconnection in a Node.js application?',
      'ioredis vs node-redis — when would you choose each?',
    ],
  };
}
