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
  { name: 'CPU profile',      type: 'keyword', desc: 'Samples the call stack at regular intervals to show where CPU time is spent. Hot functions at the top of the flamegraph.' },
  { name: 'Heap snapshot',    type: 'keyword', desc: 'Point-in-time capture of all objects in the V8 heap. Compares two snapshots to find memory leaks — objects that grew between snapshots.' },
  { name: 'Flamegraph',       type: 'keyword', desc: 'Visualisation of profiling data. X-axis = time, Y-axis = call stack depth. Width of a bar = how much time that function consumed.' },
  { name: 'Event loop lag',   type: 'keyword', desc: 'Time between scheduling a callback and it actually executing. High lag = event loop blocked by synchronous CPU work.' },
  { name: 'Memory leak',      type: 'keyword', desc: 'Objects retained in memory that are no longer needed. Common: global event listener leaks, closure-captured variables, unbounded caches.' },
  { name: 'Continuous profiling', type: 'keyword', desc: 'Low-overhead, always-on profiling in production (Pyroscope, Parca). Profiles available for any time range without triggering a profiling session.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'CPU Profiling in Node.js',
    points: [
      'Node.js V8 CPU profiler samples the call stack every 1ms. After a profiling session, you have a record of which functions were executing at each sample — the ones appearing most often consumed the most CPU.',
      'Tools: Chrome DevTools Protocol (programmatic via `--inspect`), `clinic.js flame`, `0x`, Node.js built-in `v8.writeHeapSnapshot()`, or the V8 `Profiler` module.',
      'Isolate what you profile: load the service, warm it up, start profiling, send representative traffic, stop profiling. A cold-start profile shows module loading overhead, not steady-state behaviour.',
      'Common CPU hotspots: JSON.parse/stringify on large payloads, synchronous regex on long strings, SHA/bcrypt in the hot path, synchronous file reads (never in production), and N+1 computation patterns (doing O(n²) work in a loop).',
    ],
  },
  {
    heading: 'Memory Profiling',
    points: [
      'Heap snapshot: a complete dump of all objects in V8\'s heap at a point in time. Take two snapshots separated by time — objects that grew between snapshots are candidates for memory leaks.',
      'Common Node.js memory leaks: event listeners added in request handlers but never removed (EventEmitter leak), closures capturing large objects longer than needed, unbounded Maps/Sets used as caches, module-level arrays growing per request.',
      'Heap allocation timeline: records when objects are allocated. Shows which code paths are allocating the most — useful for reducing GC pressure in high-throughput services.',
      'Use `process.memoryUsage()` to track RSS and heap metrics over time. A healthy service has stable heap usage after warmup. A leaking service shows monotonically increasing heap.',
    ],
  },
  {
    heading: 'Event Loop Monitoring',
    points: [
      'Node.js is single-threaded — the event loop processes one callback at a time. If a callback blocks for >10ms, all other callbacks (including incoming requests) wait. This manifests as high p99 latency even at low CPU utilisation.',
      'Measure event loop lag with `perf_hooks.monitorEventLoopDelay()` (Node.js 11.10+). Reports histogram of actual delay — p50/p99/max.',
      'Causes of event loop blocking: synchronous CPU-intensive operations (heavy JSON parsing, regex on large strings, crypto operations), `fs.readFileSync()` in request handlers, and `JSON.parse()` on 10MB+ payloads.',
      'Solution: offload CPU-intensive work to worker threads (`worker_threads` module). Use async versions of all I/O. Set CPU-bound operation timeouts. Consider streaming JSON parsers for large payloads.',
    ],
  },
  {
    heading: 'Continuous Profiling',
    points: [
      'Traditional profiling is on-demand: start a session, reproduce the issue, analyse results. Problems: you need to know there is an issue before you can profile, production profiling sessions are intrusive.',
      'Continuous profiling (Pyroscope, Parca, Grafana Pyroscope) runs a low-overhead profiler (<1% CPU overhead) continuously in production, aggregating samples and making them queryable for any historical time range.',
      'Example: p99 latency spiked 3 weeks ago for 10 minutes. With continuous profiling, you can query the CPU profile for that exact 10-minute window and see the hot functions — without having set up a profiling session in advance.',
      'Integration with tracing: some profilers (Pyroscope + OTel) can attach profile data to specific traces. Clicking a slow span in Jaeger shows the CPU profile from that exact operation.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Node.js Profiling',
    language: 'typescript',
    code: `import { Session } from 'inspector';
import * as fs from 'fs';

// ── CPU PROFILING ─────────────────────────────────────────────────
async function captureProfile(durationMs: number): Promise<void> {
  const session = new Session();
  session.connect();

  return new Promise<void>((resolve, reject) => {
    session.post('Profiler.enable', () => {
      session.post('Profiler.start', () => {
        setTimeout(() => {
          session.post('Profiler.stop', (err, { profile }) => {
            if (err) { reject(err); return; }
            // Write to file — open in Chrome DevTools > Performance tab
            fs.writeFileSync('profile.cpuprofile', JSON.stringify(profile));
            console.log('Profile written to profile.cpuprofile');
            session.disconnect();
            resolve();
          });
        }, durationMs);
      });
    });
  });
}

// Trigger via HTTP endpoint (admin-only):
// app.post('/admin/profile', auth, (req, res) => {
//   captureProfile(30_000).then(() => res.json({ url: '/profile.cpuprofile' }));
// });

// ── HEAP SNAPSHOT ─────────────────────────────────────────────────
import * as v8 from 'v8';

function takeHeapSnapshot(filename: string): void {
  const snapshotStream = v8.writeHeapSnapshot(filename);
  console.log(\`Heap snapshot: \${snapshotStream}\`);
  // Open in Chrome DevTools > Memory tab > Load...
}

// ── EVENT LOOP LAG MONITORING ─────────────────────────────────────
import { monitorEventLoopDelay } from 'perf_hooks';
import { Histogram } from 'prom-client';

const elHistogram = new Histogram({
  name: 'nodejs_eventloop_lag_seconds',
  help: 'Event loop lag histogram in seconds',
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
});

const elMonitor = monitorEventLoopDelay({ resolution: 20 }); // 20ms resolution
elMonitor.enable();

setInterval(() => {
  elHistogram.observe(elMonitor.mean / 1e9); // nanoseconds → seconds
  if (elMonitor.max / 1e6 > 100) { // > 100ms
    console.warn({ lagMs: elMonitor.max / 1e6 }, 'High event loop lag detected');
  }
  elMonitor.reset();
}, 5000);`,
  },
  {
    label: 'Memory Leak Detection',
    language: 'typescript',
    code: `import { Gauge } from 'prom-client';

// ── TRACK HEAP USAGE OVER TIME ────────────────────────────────────
const heapUsedGauge = new Gauge({
  name: 'nodejs_heap_used_bytes',
  help: 'V8 heap used in bytes',
  collect() {
    this.set(process.memoryUsage().heapUsed);
  }
});

const heapTotalGauge = new Gauge({
  name: 'nodejs_heap_total_bytes',
  help: 'V8 heap total in bytes',
  collect() { this.set(process.memoryUsage().heapTotal); }
});

// Alert when heap grows > 80% of total
// prometheus: nodejs_heap_used_bytes / nodejs_heap_total_bytes > 0.8

// ── COMMON LEAK PATTERNS ─────────────────────────────────────────

// ❌ Leak: EventEmitter listener added per request, never removed
app.get('/stream', (req, res) => {
  emitter.on('data', (chunk) => res.write(chunk)); // LEAK — grows per request
});

// ✅ Fix: remove listener when connection closes
app.get('/stream', (req, res) => {
  const handler = (chunk: Buffer) => res.write(chunk);
  emitter.on('data', handler);
  req.on('close', () => emitter.off('data', handler)); // cleanup on disconnect
});

// ❌ Leak: unbounded cache (Map grows forever)
const cache = new Map<string, object>();
function expensiveOp(key: string) {
  if (!cache.has(key)) cache.set(key, compute(key)); // never evicts
  return cache.get(key);
}

// ✅ Fix: use LRU cache with max size
import LRU from 'lru-cache';
const cache2 = new LRU<string, object>({ max: 1000, ttl: 1000 * 60 * 5 }); // 5 min TTL

// ── HEAP COMPARISON SCRIPT ────────────────────────────────────────
// 1. Run service under load for 30 min
// 2. node --expose-gc app.js
// 3. In Chrome DevTools: take heap snapshot → snapshot 1
// 4. Wait 30 more minutes under load
// 5. Force GC: global.gc()
// 6. Take heap snapshot 2
// 7. DevTools Comparison view: objects that grew = likely leak`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Profiling with --inspect in production without authentication',
    wrong: `# Starting production service with inspector open to public
node --inspect=0.0.0.0:9229 src/index.js
# Any network-accessible attacker can:
# - Take heap snapshots (exposing secrets from memory)
# - Execute arbitrary code via the DevTools protocol
# - Block the event loop with a profile capture`,
    right: `# Development: --inspect binds to localhost only
node --inspect=127.0.0.1:9229 src/index.js

# Production: use programmatic profiling via admin HTTP endpoint (auth required)
app.post('/admin/profile', requireAdminAuth, async (req, res) => {
  await captureProfile(30_000);
  res.download('./profile.cpuprofile');
});`,
    explanation: 'The Node.js inspector protocol (`--inspect`) provides full control of the V8 engine — heap dumps that may contain secrets, arbitrary code execution, and denial-of-service via profiling. Never bind `--inspect` to 0.0.0.0 in production. Use programmatic profiling via authenticated admin endpoints if you need production profiles, or use continuous profiling tools (Pyroscope) that are designed for production use.',
  },
  {
    title: 'Profiling a cold-start instead of a warmed-up service',
    wrong: `// Start profiling immediately on process start
captureProfile(10_000);
// Profile shows:
// - require() / module loading: 40% CPU
// - JIT compilation of first-run code paths: 30%
// - Actual request processing: 30%
// Optimising module loading doesn't help steady-state performance`,
    right: `// Warm up first: process 1000+ requests to let V8 JIT compile hot paths
// THEN start profiling steady-state behaviour
// Use autocannon or k6 for warmup:
// autocannon -c 10 -d 30 http://localhost:3000/api
// Then: app.post('/admin/profile', ...) to capture the profile`,
    explanation: 'A cold-start profile is dominated by module loading, require() resolution, and JIT compilation on first-run code paths. These are not representative of steady-state CPU usage. Warm up the service by processing 1000+ requests, let V8 compile hot paths, then start profiling. The steady-state profile shows your actual CPU bottlenecks — JSON parsing, business logic, database serialisation.',
  },
  {
    title: 'Using synchronous operations in high-traffic request handlers',
    wrong: `app.get('/config', (req, res) => {
  const config = fs.readFileSync('./config.json', 'utf8'); // BLOCKS event loop!
  const parsed = JSON.parse(config);
  res.json(parsed);
});
// readFileSync blocks the entire event loop
// All other requests wait while the file is read
// At 100 req/s, this adds hundreds of ms to every concurrent request`,
    right: `// Load config once at startup asynchronously
let config: object;
async function loadConfig() {
  config = JSON.parse(await fs.promises.readFile('./config.json', 'utf8'));
}

// In request handler: read from in-memory variable
app.get('/config', (req, res) => {
  res.json(config); // memory read — nanoseconds, no event loop blocking
});`,
    explanation: 'Any synchronous I/O or CPU operation in a Node.js request handler blocks the event loop — all other concurrent requests wait. This shows as high p99 latency under load even when individual operations are fast. Use async versions of all I/O (`fs.promises.*`), cache results in memory after async load, and offload CPU-intensive work to `worker_threads`.',
  },
  {
    title: 'Looking at average latency instead of p99 when profiling',
    wrong: `// Dashboard shows average latency = 45ms — looks fine!
// P99 latency = 850ms — 1% of users see 850ms responses
// Profiling: "average" case is fast, doesn't reveal the outlier
// 1000 users at 1 req/s → 10 users per second see 850ms responses`,
    right: `// Always profile the p99 and p999 code paths
// Use histogram_quantile(0.99, ...) not avg() in dashboards
// Trace exemplars: click the slowest traces, not random samples
// Clinic.js bubbleprof: shows event loop delays that cause p99 spikes`,
    explanation: 'Average latency hides performance problems. If 1% of requests take 1 second, the average barely moves — but 1 in 100 users has a terrible experience. Always monitor and profile p99 (99th percentile) and p999 (99.9th percentile) latency. When profiling, specifically reproduce the slow code path — send requests with the payload sizes or data conditions that trigger the slowness.',
  },
];

const challenge: Challenge = {
  title: 'Detect event loop blocking',
  language: 'typescript',
  description: `Implement detectBlocking(fn: () => void, threshold: number): { blocked: boolean; durationMs: number }
Measures how long fn() runs synchronously. If it exceeds threshold ms, blocked = true.

Use Date.now() to measure elapsed time before and after calling fn().`,
  hints: ['Record start time before calling fn()', 'Compute elapsed = end - start', 'blocked = elapsed >= threshold'],
  starterCode: `function detectBlocking(
  fn: () => void,
  threshold: number
): { blocked: boolean; durationMs: number } {
  return { blocked: false, durationMs: 0 };
}

const fast = detectBlocking(() => {
  let x = 0; for (let i = 0; i < 1000; i++) x += i;
}, 10);
console.log(fast); // { blocked: false, durationMs: ~0 }

const slow = detectBlocking(() => {
  const end = Date.now() + 50; while (Date.now() < end) {}
}, 10);
console.log(slow); // { blocked: true, durationMs: ~50 }`,
  solution: `function detectBlocking(
  fn: () => void,
  threshold: number
): { blocked: boolean; durationMs: number } {
  const start = Date.now();
  fn();
  const durationMs = Date.now() - start;
  return { blocked: durationMs >= threshold, durationMs };
}

const fast = detectBlocking(() => {
  let x = 0; for (let i = 0; i < 1000; i++) x += i;
}, 10);
console.log(fast);

const slow = detectBlocking(() => {
  const end = Date.now() + 50; while (Date.now() < end) {}
}, 10);
console.log(slow);`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'A Node.js service has low CPU utilisation (< 20%) but high p99 latency (800ms). What is the most likely cause?',
    options: [
      'Insufficient CPU capacity — the service needs more CPU cores to handle concurrent requests',
      'Event loop blocking — a synchronous operation in a request handler is occupying the event loop for 700+ ms, causing all other requests to queue',
      'Memory pressure — heap is nearly full and GC pauses are causing the high latency',
      'Network congestion — packet retransmission is adding 800ms to every request',
    ],
    answer: 1,
    explanation: 'Low CPU + high p99 latency is the classic event loop blocking signature. Node.js is single-threaded — one request\'s synchronous CPU work blocks ALL other requests. At 20% CPU, there is processing capacity, but the event loop is periodically occupied by a blocking call (synchronous file read, large JSON parse, or heavy computation). Use `monitorEventLoopDelay()` to confirm and the CPU profiler to find the hot synchronous function.',
  },
  {
    q: 'You take two heap snapshots 30 minutes apart. The Comparison view shows "Array" objects increased from 1,200 to 52,000. What does this indicate?',
    options: [
      'The service processed more requests, creating more temporary Array objects as expected',
      'Array objects growing between two GC cycles is normal — GC will clean them up in the next cycle',
      'There is likely a memory leak — Arrays being added to an unbounded collection (Map, Set, or global array) that is not being garbage collected',
      'The Node.js heap is compressed — more Array objects with smaller total size is better performance',
    ],
    answer: 2,
    explanation: 'The heap Comparison view shows objects that survived garbage collection between two snapshots (not temporary allocations). If Arrays grew from 1,200 to 52,000 and these are long-lived objects, they are being retained in memory — typical of an unbounded cache (Map/Set with no eviction), event listener accumulation, or a global array that grows per request. Garbage-collectible objects would not appear in the comparison if GC ran before the second snapshot.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'What is continuous profiling and when is it better than on-demand profiling?',
    a: 'Continuous profiling (tools: Grafana Pyroscope, Parca, Polar Signals) runs a low-overhead sampling profiler (<1% CPU overhead) continuously in production. Profiles are stored and queryable for any historical time window.<br><br><strong>When it is better</strong>: <ul><li>Intermittent performance issues that are hard to reproduce on demand</li><li>Post-incident analysis: "what was the CPU profile during that 15-minute spike 3 days ago?"</li><li>Long-term performance regression tracking: compare profile from 2 weeks ago vs today</li><li>Identifying which code change caused a CPU regression across deployments</li></ul><strong>On-demand profiling is sufficient for</strong>: <ul><li>Reproducible performance issues you can trigger in staging</li><li>Load testing scenarios where you control the timing</li><li>Startup performance where you need the cold-start profile specifically</li></ul>Continuous profiling is most valuable for production systems where you cannot predict when performance issues will occur, or for post-hoc analysis of incidents that have already resolved.',
  },
  {
    q: 'What is the difference between CPU profiling and memory profiling, and when do I need each?',
    a: '<strong>CPU profiling</strong>: samples the call stack to show where time is spent executing code. Use when: <ul><li>p99 latency is high and you need to find the slow code path</li><li>CPU utilisation is higher than expected for the request rate</li><li>You want to find optimisation opportunities in hot paths</li></ul><strong>Memory profiling</strong>: captures heap object allocations and retentions. Use when: <ul><li>RSS or heap memory grows over time without stabilising (leak)</li><li>GC pauses are causing latency spikes (too many short-lived allocations)</li><li>Memory usage is higher than expected per request</li></ul>Often you need both: a high-CPU service under memory pressure has GC running frequently — the CPU profile will show GC overhead. A memory leak can eventually cause OOM kills, which appear as pod restarts in Kubernetes. Start with CPU profiling (simpler) and move to heap analysis if memory metrics suggest a leak.',
  },
];

const revision: RevisionSummary = {
  oneLiner: 'CPU profiler shows where time is spent. Heap snapshots find memory leaks. Event loop lag = blocked event loop = high p99 at low CPU. Continuous profiling for production history.',
  mustKnow: [
    'CPU profiler: samples call stack every 1ms — hot functions appear widest in flamegraph. Warm up before profiling.',
    'Event loop blocking: synchronous operation in request handler blocks ALL concurrent requests. Low CPU + high p99 = classic symptom.',
    'Heap snapshot comparison: objects growing between snapshots = memory leak candidates. Common: EventEmitter leak, unbounded Map/Set.',
    'process.memoryUsage().heapUsed — track over time. Monotonically increasing = leak.',
    'Never use --inspect bound to 0.0.0.0 in production — use authenticated admin endpoint for programmatic profiling.',
    'Continuous profiling (Pyroscope): <1% overhead, always-on, queryable for any historical window — essential for post-incident CPU analysis.',
  ],
  interviewFocus: [
    'How do you diagnose high p99 latency at low CPU in a Node.js service?',
    'What causes memory leaks in Node.js? Name two common patterns.',
    'What is continuous profiling and how does it differ from on-demand profiling?',
  ],
};

@Component({
  selector: 'app-obs-profiling',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './performance-profiling.html',
  styleUrl: './performance-profiling.scss',
})
export class ObsPerformanceProfiling {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
