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
  selector: 'app-node-performance',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './performance.html',
  styleUrl: './performance.scss'
})
export class NodePerformance {
  quickRef: QuickRefItem[] = [
    { name: 'cluster module', type: 'keyword', desc: 'Fork multiple worker processes sharing one port. Utilise all CPU cores.' },
    { name: 'PM2', type: 'keyword', desc: 'Process manager: cluster mode, auto-restart, zero-downtime deploys, monitoring.' },
    { name: 'node --prof', type: 'keyword', desc: 'CPU profiler. Generates V8 tick log. Analyse with node --prof-process.' },
    { name: 'clinic.js', type: 'keyword', desc: 'Profiling toolkit: Doctor (diagnostics), Flame (flamegraph), Bubbleprof (async viz).' },
    { name: 'perf_hooks', type: 'keyword', desc: 'node:perf_hooks: performance.now(), PerformanceObserver, createHistogram for timing.' },
    { name: 'setImmediate vs nextTick', type: 'keyword', desc: 'process.nextTick: before next event loop phase. setImmediate: after I/O poll phase.' },
    { name: '--max-old-space-size', type: 'keyword', desc: 'Increase V8 heap limit. Default ~1.5GB. Set to 80% of available RAM.' },
    { name: 'Connection pooling', type: 'keyword', desc: 'Reuse DB connections — avoid reconnect overhead per query. Pool size = CPU cores × 2.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Event Loop and CPU Bottlenecks',
      points: [
        'Node.js is single-threaded for JavaScript execution. One thread = one CPU core. The event loop processes one task at a time. Synchronous CPU work (complex calculations, large JSON.parse, regex on large strings) blocks ALL incoming requests while executing.',
        'The event loop phases: timers (setTimeout/setInterval) → pending I/O callbacks → idle/prepare → poll (wait for I/O, execute I/O callbacks) → check (setImmediate) → close callbacks. process.nextTick() runs between every phase.',
        'Identify CPU-blocking code with profiling. node --prof starts the V8 CPU profiler. Run a load test, then node --prof-process isolate.log produces a readable summary. Hotspots showing large "self" percentages are blocking the event loop.',
        'Cluster mode spawns N worker processes (N = CPU cores). The master routes incoming connections across workers with round-robin (or OS scheduling on Windows). Each worker has its own event loop and memory. Workers share nothing by default.',
      ]
    },
    {
      heading: 'Memory Management and Profiling',
      points: [
        'V8 uses generational garbage collection: new space (young gen, fast allocations, frequent GC) and old space (long-lived objects, mark-and-sweep). GC pauses are the main source of latency spikes in high-throughput Node.js apps.',
        'Memory leaks: global variables that grow, event listeners not removed on disconnect, closures holding references, caches without eviction. Detect with process.memoryUsage() over time, Node.js --heap-prof flag, or Chrome DevTools heap snapshot.',
        'v8.writeHeapSnapshot() creates a heap snapshot file. Load in Chrome DevTools Memory tab → compare snapshots to find growing object counts. Look for Detached DOM nodes, Event listeners, and unexpected object counts.',
        'Buffer allocation: Buffer.allocUnsafe() is faster but contains uninitialized memory. Buffer.alloc() zeroes memory — safer. Pool buffers for repeated operations (use a pre-allocated pool with subarray offsets) to reduce GC pressure.',
      ]
    },
    {
      heading: 'Optimisation Techniques',
      points: [
        'Compression: enable gzip/brotli compression on HTTP responses (compression middleware in Express). Brotli is 15-25% smaller than gzip but slower to compress — cache compressed responses. Compress at the reverse proxy (Nginx) level for CPU efficiency.',
        'HTTP/2: multiplexes multiple requests over one TCP connection, eliminating head-of-line blocking. Enable with http2.createSecureServer() or via Nginx. HTTP/2 server push allows sending assets before the client requests them.',
        'Connection pooling: each DB connection has overhead (authentication, TCP handshake). Pools maintain warm connections. Pool size guideline: CPU_CORES * 2 for CPU-bound backends, higher for I/O-bound. pg (PostgreSQL) default: 10. Prisma default: max(1, 2×cores).',
        'setImmediate for breaking up long sync tasks: process large arrays in chunks, yielding control after each chunk via setImmediate. This allows I/O callbacks to run between chunks, preventing complete event loop starvation.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Cluster mode',
      language: 'typescript',
      code: `import cluster from 'node:cluster';
import { cpus } from 'node:os';
import { createServer } from 'node:http';

if (cluster.isPrimary) {
  const numCPUs = cpus().length;
  console.log(\`Primary \${process.pid} starting \${numCPUs} workers\`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Auto-restart crashed workers
  cluster.on('exit', (worker, code) => {
    if (code !== 0) {
      console.log(\`Worker \${worker.process.pid} died — restarting\`);
      cluster.fork();
    }
  });
} else {
  // Each worker runs its own Express/Fastify server
  const app = express();
  // ... routes
  app.listen(3000, () => console.log(\`Worker \${process.pid} listening\`));
}

// Better: use PM2 instead of manual cluster (handles zero-downtime reloads)
// pm2 start app.js -i max        # cluster mode across all CPU cores
// pm2 reload app                 # zero-downtime rolling restart`
    },
    {
      label: 'Profiling and event loop monitoring',
      language: 'typescript',
      code: `import { performance, PerformanceObserver } from 'node:perf_hooks';

// Measure operation time
const start = performance.now();
await heavyOperation();
console.log(\`Heavy op: \${(performance.now() - start).toFixed(2)}ms\`);

// Monitor event loop lag (high lag = event loop blocked)
let lastCheck = performance.now();
setInterval(() => {
  const now = performance.now();
  const lag = now - lastCheck - 1000; // expected 1000ms, actual delta
  if (lag > 100) console.warn(\`Event loop lag: \${lag.toFixed(0)}ms\`);
  lastCheck = now;
}, 1000);

// Break up large sync work to avoid blocking
async function processLargeArray(items) {
  const CHUNK = 100;
  const results = [];
  for (let i = 0; i < items.length; i += CHUNK) {
    const chunk = items.slice(i, i + CHUNK);
    results.push(...chunk.map(processItem));
    // Yield to event loop — allow I/O to proceed between chunks
    await new Promise(resolve => setImmediate(resolve));
  }
  return results;
}

// Memory usage monitoring
setInterval(() => {
  const { rss, heapUsed, heapTotal } = process.memoryUsage();
  console.log({
    rss:       \`\${(rss / 1024 / 1024).toFixed(1)}MB\`,
    heapUsed:  \`\${(heapUsed / 1024 / 1024).toFixed(1)}MB\`,
    heapTotal: \`\${(heapTotal / 1024 / 1024).toFixed(1)}MB\`,
  });
}, 30_000);`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Running CPU-intensive work on the main thread',
      wrong: `app.post('/process', (req, res) => {
  const result = heavyCpuWork(req.body.data); // blocks event loop for all other requests!
  res.json(result);
});`,
      right: `import { Worker } from 'node:worker_threads';
app.post('/process', (req, res) => {
  const worker = new Worker('./heavy-worker.js', { workerData: req.body.data });
  worker.once('message', result => res.json(result));
});`,
      explanation: 'Synchronous CPU work blocks the event loop — all other incoming requests wait. Offload to worker_threads for CPU-bound tasks, or use a job queue (Bull) for async processing. Reserve the main thread for I/O.'
    },
    {
      title: 'Not monitoring event loop lag',
      wrong: `// No event loop monitoring — blocked event loop is silent
app.get('/health', (req, res) => res.json({ ok: true }));`,
      right: `// Measure event loop lag as a health metric
let lag = 0;
let last = Date.now();
setInterval(() => { lag = Date.now() - last - 1000; last = Date.now(); }, 1000);
app.get('/health', (req, res) => res.json({ ok: lag < 500, eventLoopLagMs: lag }));`,
      explanation: 'A blocked event loop is invisible without monitoring. Measure the delta between expected and actual setTimeout intervals — a lag > 100ms indicates blocked event loop. Expose as a health metric and alert on high lag.'
    },
    {
      title: 'Synchronous JSON parsing of large payloads',
      wrong: `app.use(express.json({ limit: '50mb' })); // 50MB JSON parsed synchronously — blocks event loop`,
      right: `// Limit body size to what's actually needed (usually 1mb is enough)
app.use(express.json({ limit: '1mb' }));
// For large data uploads: use multipart/streaming — process chunks as they arrive`,
      explanation: 'JSON.parse() is synchronous in Node.js. Parsing a 50MB JSON body blocks the event loop for tens of milliseconds — all other requests wait. Set body size limits conservatively. For large data, stream instead of parsing at once.'
    },
    {
      title: 'Too many or too few connections in DB pool',
      wrong: `const pool = new Pool({ max: 1 }); // single connection — serialises all DB calls
// OR: max: 100 — more connections than PostgreSQL can handle (default max 100 total)`,
      right: `const pool = new Pool({ max: 10 }); // ~10 per server process is a common starting point
// Rule of thumb: CPU_CORES * 2, tuned based on DB server's max_connections`,
      explanation: 'Too few connections: queries queue up, throughput limited by one connection doing work sequentially. Too many: PostgreSQL reaches its max_connections limit and rejects new connections. Start with 10 per Node.js process and tune with load testing.'
    },
  ];

  challenge: Challenge = {
    title: 'Event Loop Lag Monitor',
    language: 'typescript',
    description: 'Build an EventLoopMonitor class that tracks event loop lag over time. It should: measure lag by comparing expected vs actual setTimeout intervals, expose a getLag() method returning the current lag in ms, expose getStats() returning { avg, max, p99 } lag over the last 60 seconds, and emit a "lag" event when lag exceeds a configurable threshold.',
    hints: [
      'Use a rolling buffer of the last 60 lag samples (1 per second)',
      'p99: sort samples, take index at Math.floor(samples.length * 0.99)',
      'Extend EventEmitter to use this.emit("lag", lagMs)',
    ],
    starterCode: `import { EventEmitter } from 'node:events';

class EventLoopMonitor extends EventEmitter {
  constructor(threshold = 100) {
    super();
    this.threshold = threshold;
    // TODO: start measuring lag every 1s
  }

  getLag() { /* ... */ }
  getStats() { /* ... return { avg, max, p99 } */ }
  stop() { /* ... */ }
}

const monitor = new EventLoopMonitor(100);
monitor.on('lag', ms => console.warn(\`High lag: \${ms}ms\`));
console.log(monitor.getStats());`,
    solution: `import { EventEmitter } from 'node:events';

class EventLoopMonitor extends EventEmitter {
  constructor(threshold = 100) {
    super();
    this.threshold = threshold;
    this._lag = 0;
    this._samples = [];
    this._interval = null;
    this.start();
  }

  start() {
    let last = Date.now();
    this._interval = setInterval(() => {
      const now = Date.now();
      this._lag = Math.max(0, now - last - 1000);
      last = now;

      this._samples.push(this._lag);
      if (this._samples.length > 60) this._samples.shift();

      if (this._lag > this.threshold) this.emit('lag', this._lag);
    }, 1000);
    this._interval.unref();
  }

  getLag() { return this._lag; }

  getStats() {
    if (!this._samples.length) return { avg: 0, max: 0, p99: 0 };
    const sorted = [...this._samples].sort((a, b) => a - b);
    const avg    = sorted.reduce((s, v) => s + v, 0) / sorted.length;
    const max    = sorted[sorted.length - 1];
    const p99    = sorted[Math.floor(sorted.length * 0.99)];
    return { avg: Math.round(avg), max, p99 };
  }

  stop() { clearInterval(this._interval); }
}`
  };

  quiz: QuizQuestion[] = [
    { q: 'Why does synchronous CPU work degrade Node.js performance?', options: ['It uses more RAM', 'Node.js is single-threaded — synchronous work blocks the event loop, pausing all other requests', 'It triggers garbage collection', 'It saturates network bandwidth'], answer: 1, explanation: 'Node.js runs JavaScript on a single thread. Synchronous CPU work (parsing, calculations) occupies that thread exclusively — no other requests can be processed until the work completes. Long synchronous operations appear as response time spikes for all users.' },
    { q: 'What does cluster mode do for a Node.js application?', options: ['Runs Node.js in a Docker container', 'Spawns multiple worker processes sharing one port to utilise all CPU cores', 'Enables database connection pooling', 'Compiles JavaScript to native code'], answer: 1, explanation: 'Node.js is single-process by default — one CPU core used. Cluster mode forks N worker processes (one per CPU core), each running the full app. They share the same TCP port. Load is distributed across all workers, multiplying throughput by N.' },
    { q: 'What is event loop lag and why is it an important metric?', options: ['The time to establish a WebSocket connection', 'The gap between when a setTimeout was expected to fire and when it actually fires — indicates event loop blockage', 'The time to parse an HTTP request', 'Memory allocation time'], answer: 1, explanation: 'setInterval(fn, 1000) should fire every 1000ms. If it fires at 1200ms, the event loop lag is 200ms — something blocked the event loop for 200ms. Lag above 100ms means requests are queuing. Monitor lag as a health metric.' },
    { q: 'What is the recommended DB connection pool size per Node.js process?', options: ['Equal to the number of concurrent requests', '1 — serialize all DB calls', 'Approximately CPU_CORES × 2, tuned with load testing', 'Unlimited — let the DB pool manage it'], answer: 2, explanation: 'Too few connections serialize DB calls. Too many exceed the DB server\'s max_connections. A starting guideline is CPU_CORES × 2. Tune with load testing — watch for query queuing (too few) or DB connection errors (too many).' },
  ];

  qna: QnaItem[] = [
    { q: 'What tools do I use to profile Node.js performance?', a: 'node --prof + node --prof-process: built-in V8 CPU profiler, zero overhead option. clinic.js Doctor: identifies event loop blocking, heavy GC, and CPU usage patterns automatically. clinic.js Flame: generates flame graphs to visualize where CPU time is spent. Chrome DevTools (node --inspect): interactive profiler, heap snapshots, memory timeline. 0x: single-command flame graph generation — simplest for quick profiling. Start with Doctor for diagnosis, then Flame or DevTools for detailed investigation.' },
    { q: 'How does PM2 cluster mode differ from the built-in cluster module?', a: 'PM2 cluster mode uses the built-in cluster module internally but adds: zero-downtime reloads (rolling restart — workers replaced one at a time so the app stays up), automatic crash recovery with restart limits, startup script management (pm2 save + pm2 startup for system boot), built-in metrics dashboard (pm2 monit), and log aggregation across workers. Use PM2 in production instead of rolling your own cluster code — it handles edge cases (worker death, graceful shutdown) that are easy to get wrong.' },
    { q: 'When does Node.js need horizontal scaling vs vertical scaling?', a: 'Vertical scaling (more CPU/RAM on one server): if your bottleneck is single-process memory limits or you have a monolith not worth splitting. Node.js cluster mode helps use multiple cores. Horizontal scaling (more servers): when one server\'s CPU + memory is saturated, or you need redundancy. Node.js stateless APIs scale horizontally well (no shared memory between processes — use Redis for shared state). If the bottleneck is the database, scale the database (read replicas, sharding) before adding app servers.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Node.js performance: one thread = one core. Cluster mode uses all cores. Avoid blocking the event loop with sync CPU work. Profile with clinic.js or --prof.',
    mustKnow: [
      'Single-threaded: CPU work blocks all requests — offload to worker_threads or job queues.',
      'Cluster mode: N processes on N cores sharing one port.',
      'Event loop lag: setTimeout delta > expected = blocked event loop.',
      'setImmediate for yielding between chunks of CPU work.',
      'Connection pool size: CPU_CORES × 2 as starting point.',
      'Memory leaks: grow-without-bound globals, listeners on disconnected sockets.',
      'Profile: node --prof for CPU, --heap-prof for memory, clinic.js for automated diagnostics.',
    ],
    interviewFocus: [
      'How does Node.js handle CPU-intensive tasks without blocking the event loop?',
      'What is cluster mode and how does it improve throughput?',
      'How do you detect and diagnose a performance problem in production?',
    ]
  };
}
