import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
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

const quickRef: QuickRefItem[] = [
  { name: 'Vertical scaling',   type: 'keyword', desc: 'Scale up — add more CPU/RAM to existing server. Simple but has a ceiling.' },
  { name: 'Horizontal scaling', type: 'keyword', desc: 'Scale out — add more servers. Theoretically unbounded; requires stateless services.' },
  { name: 'Stateless',          type: 'keyword', desc: 'No session data on app server. State lives in shared cache or DB — enables scale-out.' },
  { name: 'Autoscaling',        type: 'keyword', desc: 'Cloud infra that adds/removes instances based on metrics (CPU, QPS, queue depth).' },
  { name: 'Load shedding',      type: 'keyword', desc: 'Deliberately drop low-priority requests under overload to protect core functionality.' },
  { name: 'Stateful services',  type: 'keyword', desc: 'Cannot be simply scaled out — DB primaries, WebSocket servers, leader nodes.' },
  { name: 'CQRS',               type: 'keyword', desc: 'Separate read and write models. Scale read replicas independently from write path.' },
  { name: 'Amdahl\'s Law',      type: 'keyword', desc: 'The serial fraction limits speedup: if 20% of work is serial, max speedup = 5× regardless of cores.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Vertical vs horizontal scaling',
    points: [
      'Vertical (scale up): bigger machine — more CPU cores, RAM, faster NVMe. Simple — no code changes.',
      'Ceiling: largest AWS instance is ~448 vCPU, 24 TB RAM. Beyond that, vertical fails.',
      'Horizontal (scale out): add identical servers behind a load balancer. Requires stateless application tier.',
      'Horizontal can be nearly infinite — DynamoDB handles millions of TPS by adding nodes.',
    ],
  },
  {
    heading: 'Making services stateless',
    points: [
      'Session state → move to Redis or a cookie (JWT). Never store session in server memory.',
      'File uploads → stream directly to S3 or object storage. Never write to local disk.',
      'Node-local caches → move to shared Redis. Local caches diverge across instances.',
      'Once stateless, autoscaling becomes trivial — any instance can serve any request.',
    ],
  },
  {
    heading: 'Autoscaling strategies',
    points: [
      'Reactive: scale when CPU > 70% or request queue depth > N. Simple but lags peak.',
      'Predictive: scale ahead of known traffic patterns (morning rush, Super Bowl).',
      'Schedule-based: pre-scale before cron jobs or batch windows.',
      'Target tracking: AWS ASG keeps average CPU at exactly 60% by adding/removing.',
    ],
  },
  {
    heading: 'Database scaling challenges',
    points: [
      'DB write path is hardest to scale — only one primary can accept writes (single-leader replication).',
      'Read scaling: add read replicas; route read-only queries to replicas.',
      'Write scaling: shard horizontally (split data across DB nodes by key).',
      'Connection pooling: hundreds of app servers × dozens of DB connections = connection exhaustion without PgBouncer or RDS Proxy.',
    ],
  },
  {
    heading: 'Vertical vs Horizontal Scaling Tradeoffs',
    points: [
      'Vertical scaling (adding more CPU/RAM to a single instance) is simpler to implement — no application changes required — but has a hard ceiling determined by the largest available machine, and creates a single point of failure with no redundancy.',
      'Horizontal scaling (adding more instances) has effectively no ceiling and provides redundancy for free, but requires the application to be designed statelessly (or with externalized state) so any instance can handle any request, which is a real architectural constraint not every system starts with.',
      'Stateful components (databases, in-memory caches with local state) are harder to scale horizontally than stateless application servers — horizontal database scaling typically requires sharding or read replicas, each with its own significant complexity compared to simply adding more application server instances behind a load balancer.',
      'A common pragmatic path: scale vertically first (cheap, fast, no architecture changes) until hitting diminishing returns or a hard capacity ceiling, then invest in horizontal scaling once the vertical ceiling genuinely becomes the bottleneck — premature horizontal scaling adds complexity before it is actually needed.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Stateless Refactor',
    language: 'typescript',
    code: `// BEFORE — stateful (cannot scale out)
const sessions = new Map<string, User>(); // server-local!

app.post('/login', (req, res) => {
  const user = authenticate(req.body);
  sessions.set(req.sessionId, user);  // problem: tied to this server
  res.send({ ok: true });
});

// AFTER — stateless (Redis for sessions)
import { createClient } from 'redis';
const redis = createClient();

app.post('/login', async (req, res) => {
  const user = await authenticate(req.body);
  const token = generateJWT(user);          // or store in Redis
  await redis.setEx(\`session:\${token}\`, 3600, JSON.stringify(user));
  res.send({ token });
});

// Now any server can serve any request by looking up token in Redis`,
  },
  {
    label: 'Autoscaling Config (AWS)',
    language: 'bash',
    code: `# AWS Auto Scaling Group — target tracking policy
aws autoscaling put-scaling-policy \\
  --auto-scaling-group-name api-asg \\
  --policy-name cpu-target-60 \\
  --policy-type TargetTrackingScaling \\
  --target-tracking-configuration '{
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ASGAverageCPUUtilization"
    },
    "TargetValue": 60.0,
    "ScaleInCooldown": 300,
    "ScaleOutCooldown": 60
  }'

# Scale on custom metric — e.g. SQS queue depth
# PredefinedMetricType: SQSQueueDepth
# TargetValue: 10  (keep < 10 messages per consumer instance)

# Warm-up period: new instances need time to JIT-compile / connect
# Use instance warm-up (120s) so metrics are not counted during startup`,
  },
  {
    label: 'CQRS Pattern',
    language: 'typescript',
    code: `// CQRS: separate read and write paths

// Write side — strong consistency, goes to primary DB
async function createOrder(order: Order): Promise<string> {
  const id = await primaryDb.insert('orders', order);
  await eventBus.publish({ type: 'OrderCreated', data: { id, ...order } });
  return id;
}

// Read side — eventually consistent, uses read replica or projected view
async function getOrderFeed(userId: string): Promise<OrderSummary[]> {
  // Read from replica or pre-materialised view (Redis, Elasticsearch)
  return readReplica.query(
    'SELECT id, status, total FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
    [userId]
  );
}

// Benefits:
// - Read replicas scale independently from writes
// - Read models can be optimised (denormalised, pre-aggregated)
// - Write model stays normalised and consistent`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Scaling prematurely',
    wrong: `// Adding sharding and microservices at 100 QPS
// because "we might need it someday"`,
    right: `// Start with a monolith + vertical scaling.
// Shard or split services only when you hit real bottlenecks.
// "Make it work, make it right, make it fast" — in that order.`,
    explanation: 'Premature optimisation adds complexity and maintenance burden before you understand the real bottleneck. Profile first, then scale the actual constraint.',
  },
  {
    title: 'Storing session on app server',
    wrong: `// Session in memory:
const sessions = {};
sessions[userId] = { cart: [...] };`,
    right: `// Session in Redis:
await redis.setEx(\`sess:\${userId}\`, 3600, JSON.stringify({ cart }));`,
    explanation: 'In-memory sessions break horizontal scaling — requests routed to a different server see no session. Move all shared state to Redis, a cookie, or a database.',
  },
  {
    title: 'Not connection-pooling to the database',
    wrong: `// Each request opens a new DB connection
const conn = await mysql.createConnection(config);`,
    right: `// Create pool once at startup; reuse connections
const pool = mysql.createPool({ ...config, connectionLimit: 20 });
// Use pool.query() — connections returned after each query`,
    explanation: 'Opening a new TCP connection + TLS handshake + auth for every request adds ~5-50ms and can exhaust the DB\'s max_connections at scale.',
  },
  {
    title: 'Scaling the write path the same as reads',
    wrong: `// "Just add more DB servers" to handle write overload`,
    right: `// Read replicas handle read scale.
// Write scale requires sharding or async write path:
// App → Queue (Kafka) → Writer service → DB
// This decouples write spikes from DB capacity`,
    explanation: 'Only one node can accept writes in single-leader replication. Read replicas only help reads. Write bottlenecks need sharding, write queues, or a different data model.',
  },
];

const challenge: Challenge = {
  title: 'Scale a monolithic API from 1k to 100k QPS',
  language: 'typescript',
  description: `Your monolithic API is handling 1,000 QPS on a single large server (32 vCPU, 128 GB RAM). You need to reach 100,000 QPS within 3 months.

Current architecture:
- Single Node.js server with in-memory session store
- PostgreSQL primary + 1 read replica
- No caching layer
- Direct client connections (no CDN)

Design the scaling roadmap:
1. What quick wins can you apply this week?
2. What stateful components need to move?
3. How do you scale the DB write path?
4. What changes require a code rewrite?`,
  hints: [
    'Quick wins: CDN for static assets, add read replicas, Redis for sessions',
    'Stateful: move sessions to Redis, move file uploads to S3',
    'DB reads: more replicas + connection pool; writes: consider queue or sharding',
    '100k QPS is 100× — rough rule: 1 server ≈ 1-5k QPS for typical APIs',
  ],
  starterCode: `interface ScalingRoadmap {
  week1: string[];
  month1: string[];
  month3: string[];
  estimatedQPS: { week1: number; month1: number; month3: number };
}

const roadmap: ScalingRoadmap = {
  week1: [
    // What quick wins can you apply immediately?
  ],
  month1: [
    // What architectural changes in month 1?
  ],
  month3: [
    // What deep changes for 100k QPS?
  ],
  estimatedQPS: { week1: 0, month1: 0, month3: 0 },
};`,
  solution: `const roadmap = {
  week1: [
    'Add CDN (Cloudflare) for static assets — offloads 40-60% of traffic',
    'Move session store from memory to Redis — enables horizontal scaling',
    'Add 3 more read replicas; route SELECTs to replicas',
    'Enable connection pooling (PgBouncer in front of PostgreSQL)',
    'Enable HTTP/2 — reduces connection overhead significantly',
  ],
  month1: [
    'Deploy 10 stateless API server instances behind ALB (autoscaling group)',
    'Add Redis caching layer for hot DB reads (cache-aside, 5 min TTL)',
    'Move file uploads to pre-signed S3 URLs — remove from API path',
    'Implement rate limiting at API gateway to protect DB from spike',
    'Move email/notification sends to background queues (SQS + Lambda)',
  ],
  month3: [
    'Shard PostgreSQL by user_id range (10 shards) for write scale',
    'Add Elasticsearch for search queries — remove full-text from SQL',
    'CQRS: separate read API (from replicas/Redis) from write API (primary)',
    'Service split: auth, orders, products as separate deployable services',
    'Global expansion: multi-region with Route 53 latency routing',
  ],
  estimatedQPS: { week1: 5_000, month1: 20_000, month3: 100_000 },
};`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What is the primary requirement for horizontal scaling to work?',
    options: ['More powerful servers', 'Stateless application tier', 'Database replication', 'CDN integration'],
    answer: 1,
    explanation: 'Horizontal scaling requires stateless services — any server can handle any request. If a server holds session data locally, requests must always route to that server (sticky sessions), defeating the purpose.',
  },
  {
    q: 'Amdahl\'s Law states that if 25% of work is serial, the maximum speedup from parallelism is?',
    options: ['Unlimited', '4×', '25×', '100×'],
    answer: 1,
    explanation: 'Amdahl\'s Law: max speedup = 1 / serial_fraction = 1 / 0.25 = 4×, regardless of how many processors you add. This is why eliminating serial bottlenecks (locks, single-threaded queues) matters.',
  },
  {
    q: 'Which scaling challenge is specific to the DATABASE WRITE path?',
    options: ['Can be solved with read replicas', 'Requires sharding or async queues — replicas do not help', 'Solved by adding more app servers', 'Solved by CDN caching'],
    answer: 1,
    explanation: 'Read replicas only help reads. Writes go to the primary node. Scaling writes requires: sharding (partition data), command queues (buffer spikes), or switching to a multi-leader DB like CockroachDB.',
  },
  { q: 'What is database connection pooling and why is it needed for scaling?', options: ['Connection pooling replicates the database across multiple servers automatically', 'Connection pooling maintains a pool of pre-established database connections shared among application threads, avoiding the overhead of creating a new connection per request', 'Connection pooling distributes queries across multiple database shards based on load', 'Connection pooling caches database query results to avoid duplicate queries'], answer: 1, explanation: 'Establishing a database connection is expensive: it involves network handshake, authentication, and session initialization, adding 20-100ms to each request. Connection pooling creates connections once at startup and reuses them for many requests. Without pooling, a service with 100 concurrent requests would need 100 simultaneous database connections, potentially exceeding the database connection limit. PgBouncer (PostgreSQL) and similar tools pool connections at the proxy layer for multiple application instances sharing a single pool. A key configuration parameter is pool size: too small causes request queuing, too large overwhelms the database.' },
  { q: 'What is auto-scaling and what are its limitations?', options: ['Auto-scaling automatically optimizes database query plans based on load', 'Auto-scaling automatically adds or removes server instances based on load metrics, but has a provisioning delay that cannot handle instantaneous traffic spikes', 'Auto-scaling eliminates the need for capacity planning by dynamically adjusting to any load', 'Auto-scaling only works for stateless services and cannot be applied to databases'], answer: 1, explanation: 'Auto-scaling monitors metrics like CPU, memory, or request rate and launches additional instances when thresholds are exceeded, then terminates them when load decreases. Limitation: provisioning delay. A new VM instance takes 2-5 minutes to start. A container starts faster (30-60 seconds) but still has delay. If traffic doubles in 10 seconds (a flash crowd), auto-scaling cannot respond fast enough. Mitigate with: pre-warming instances before expected traffic spikes, maintaining minimum idle capacity, and using fast-starting containers over VMs.' },
  { q: 'What is the difference between read scaling and write scaling strategies?', options: ['Read and write scaling use identical strategies since both require more servers', 'Read scaling adds replicas or caches to distribute read load; write scaling requires sharding data or using a different architecture since all writes must go to the same primary', 'Read scaling is always possible but write scaling is impossible beyond a single machine', 'Write scaling adds write replicas; read scaling uses a centralized cache layer'], answer: 1, explanation: 'Read scaling is straightforward: add read replicas and distribute read queries across them, or add caching layers to reduce database reads entirely. Write scaling is harder: in a leader-follower database, all writes must go to the leader, creating a single write bottleneck. Options for write scaling: sharding distributes different data partitions across different database primaries, each handling a fraction of writes. Multi-master replication allows writes to multiple nodes but requires conflict resolution. CQRS separates read and write models, allowing each to scale independently.' },
];

const qna: QnaItem[] = [
  {
    q: 'When should I choose vertical over horizontal scaling?',
    a: 'For stateful services that are hard to shard (single-leader DB primaries, legacy monoliths), vertical scaling is simpler. It avoids distributed-systems complexity. Use it as a first step — upgrade the machine before adding complexity. Only go horizontal when vertical hits its ceiling or cost curve.',
  },
  {
    q: 'An app connects to a connection pooler (PgBouncer) running in "transaction" pooling mode instead of "session" mode to squeeze more concurrency out of a limited connection count. What application-level assumption breaks as a result, and what class of bugs does this introduce?',
    a: 'Transaction-mode pooling returns a physical connection to the shared pool as soon as the current transaction commits, rather than holding it for the client\'s entire session — this means any session-scoped state (SET search_path, session-level temp tables, prepared statements, advisory locks meant to persist across statements, session variables) can silently vanish or leak between unrelated client requests, because the NEXT statement from the same application connection might get handed a completely different physical connection that does not have that session state. This is a common production surprise when teams switch pooling modes purely for concurrency gains without auditing their code for session-state assumptions — the fix is either avoiding session-scoped features entirely, explicitly re-setting needed state at the start of every transaction, or staying on session-mode pooling (at the cost of the connection-count savings) for code that genuinely needs session semantics.',
  },
  { q: 'How do you scale a stateful service that cannot be simply replicated?', a: 'Stateful services maintain per-session or per-user state that must be available on subsequent requests. Strategies: externalize state by moving it to a shared store like Redis, making the service stateless and freely scalable. Sticky sessions route each user to the same instance for the session lifetime; this avoids shared state but limits load distribution and complicates deployments. Partitioned state: shard state by user ID so each server owns a partition of users; a routing layer sends each request to the correct shard. Eventual consistency: if users can tolerate seeing slightly stale state, allow writes anywhere and sync via replication. The best approach is to externalize state where possible, making the application tier stateless.' },
  { q: 'What is a rate limiter and how do you implement one in a distributed system?', a: 'A rate limiter restricts how many requests a client can make in a time window to prevent abuse and ensure fair resource allocation. Algorithms: fixed window counts requests in a fixed time slot; simple but allows burst at window boundaries. Sliding window log records timestamps of each request; more accurate but memory-intensive. Token bucket maintains a token counter that refills at a rate up to a capacity; bursts are allowed up to capacity. Leaky bucket smooths burst traffic into a constant output rate. For distributed rate limiting across multiple API gateway instances, use Redis with atomic Lua scripts or the Redis INCR and EXPIRE commands to maintain shared counters that all instances check.' },
  { q: 'How do you identify scaling bottlenecks in a system under load?', a: 'Load test with gradually increasing traffic and monitor each component. Key metrics to watch: CPU and memory utilization on application servers. Database connection pool exhaustion and query latency. Cache hit ratio: if it drops under load, the cache is too small or is being bypassed. Thread pool queue depth: if requests queue, the thread pool is too small. Network throughput approaching NIC saturation. Identify the first resource that saturates: that is the current bottleneck. Remove it, then re-test to find the next bottleneck. Common progression: single-server app bottlenecks on CPU or memory first, then database connections, then disk I/O, then network. Use APM tools like Datadog or New Relic to correlate latency spikes with resource saturation.' },
  { q: 'What is CQRS (Command Query Responsibility Segregation) and how does it help with scaling?', a: 'CQRS separates the write model (commands) from the read model (queries) into distinct services or databases. The write side handles commands like CreateOrder and updates the authoritative write store. Changes are published as events, and read-side projections consume these events to build denormalized read models optimized for specific query patterns. Scaling benefit: the read side can be scaled and optimized independently of the write side. Read models can be materialized views, Elasticsearch indexes, or Redis caches tailored to each query. Write models can remain simple and strongly consistent. The tradeoff is eventual consistency: the read side lags the write side by the event propagation delay, so queries may return slightly stale data immediately after a write.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Scale up (vertical) for stateful services; scale out (horizontal) for stateless services — move session/state to Redis first.',
  mustKnow: [
    'Vertical: add CPU/RAM, simple, but has hardware ceiling',
    'Horizontal: add servers behind LB, requires stateless services',
    'Stateless: move sessions to Redis/JWT, files to S3, caches to Redis',
    'Autoscaling: reactive (CPU threshold), predictive, schedule-based',
    'Read replicas scale reads; sharding/queues scale writes',
    'Connection pooling essential at 100+ app server instances',
  ],
  interviewFocus: [
    'Always make the app tier stateless before scaling horizontally',
    'DB write scaling is the hardest — mention sharding or async queue',
    'State what metric triggers autoscaling (CPU, queue depth, latency)',
    'Mention Amdahl\'s Law to show understanding of scaling limits',
  ],
};

@Component({
  selector: 'app-sysdesign-scaling',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './scaling.html',
  styleUrl: './scaling.scss',
})
export class SysdesignScaling {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
