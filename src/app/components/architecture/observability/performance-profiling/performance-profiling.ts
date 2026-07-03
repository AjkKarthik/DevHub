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
  {
    heading: 'Continuous Profiling in Production',
    points: [
      'Continuous profiling collects lightweight, low-overhead performance samples (CPU, memory allocation) from production services on an ongoing basis, rather than requiring a manual, one-off profiling session — this makes it possible to investigate a performance regression that happened yesterday, not just one you can reproduce live right now.',
      'Sampling-based profilers (unlike deterministic, instrumentation-based profilers) periodically capture stack traces at a fixed interval rather than tracking every single function call — this dramatically reduces overhead, making it safe to run continuously in production without measurably affecting application performance.',
      'Flame graphs are the standard visualization for profiling data — each bar represents a function, width represents time spent (including time in called functions), and stacking represents the call hierarchy, making it immediately visually obvious which functions dominate total execution time.',
      'Correlating profiling data with other observability signals (a flame graph captured during a period of high latency shown alongside the corresponding trace) provides a powerful combined view — moving from "this endpoint is slow" (traces) to "this specific function call is why" (profiling) in one investigation.',
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
  { q: 'What is the difference between sampling profiling and instrumentation profiling?', options: ['Sampling profiling is faster but less accurate; instrumentation profiling is slower but more accurate — both measure the same things', 'Sampling profiling periodically interrupts execution to record the call stack with low overhead and approximate results, while instrumentation profiling adds measurement code to every function entry and exit with high accuracy and higher overhead', 'Sampling profiling works in production; instrumentation profiling only works in development environments', 'They are the same technique with different names depending on the language ecosystem'], answer: 1, explanation: 'Sampling profiler: at regular intervals (e.g., every 10ms), the profiler interrupts the running program and records the current call stack. CPU time is estimated from how often each function appears in samples. Overhead: very low (1-5%). Accuracy: statistical approximation. Misses functions that run faster than the sampling interval. Good for: CPU hotspot identification in production. Examples: async-profiler (Java), perf (Linux), py-spy (Python), Go pprof runtime. Instrumentation profiler: adds code before and after every function call to record entry and exit time. Overhead: can be 5-100x depending on function call frequency. Accuracy: exact timing for every function. Good for: development, finding specific bottlenecks with known location, allocation profiling. Examples: dotTrace (.NET), YourKit (Java), cProfile (Python). Production recommendation: use sampling profilers. The overhead of instrumentation profilers makes them unsuitable for continuous production profiling.' },
  { q: 'What is continuous profiling and how does it differ from on-demand profiling?', options: ['Continuous profiling runs every 24 hours; on-demand profiling runs whenever an engineer manually triggers it', 'Continuous profiling collects performance profiles non-stop in production with low overhead (1-3%), enabling historical comparison and automated anomaly detection; on-demand profiling is triggered manually for specific investigation sessions', 'Continuous profiling is only available in Google Cloud via Cloud Profiler; on-demand profiling is available in all cloud providers', 'On-demand profiling is used for CPU profiling; continuous profiling is used only for memory allocation profiling'], answer: 1, explanation: 'On-demand profiling: an engineer triggers profiling when investigating a performance problem. Runs for a fixed duration (30-120 seconds). Analyzes the result. Limitations: the problem may not be reproducible on demand. Historical data is not available. Cannot detect gradual regressions. Continuous profiling: a sampling profiler runs always at very low overhead (typically 1-3% CPU). Profiles are stored and aggregated centrally. Benefits: historical comparison: compare today versus last week for the same service. Regression detection: deploy a new version and immediately see if CPU or memory allocation patterns changed. Incident investigation: when an incident occurs, query historical profiles from exactly the incident time window. No need to reproduce on demand. Flamegraph-based: profiles are typically visualized as flamegraphs. Tools: Pyroscope (open-source), Grafana Pyroscope, Google Cloud Profiler, Datadog Continuous Profiler, Parca.' },
  { q: 'What is a flamegraph and how do you read it?', options: ['A flamegraph is a type of line chart showing CPU temperature over time during profiling sessions', 'A flamegraph is a visualization of profiling data where the x-axis shows the proportion of time in each function and the y-axis shows call stack depth; wide boxes near the top represent the most time-consuming functions', 'A flamegraph shows the call graph of all functions ever called in the application regardless of execution time', 'A flamegraph is a Kubernetes visualization showing which pods are consuming the most CPU resources'], answer: 1, explanation: 'Flamegraph reading: x-axis: represents the proportion of total profiling time (not chronological time). A wide box means the function consumed a larger fraction of CPU time. y-axis: call stack depth. Bottom row: the root frames (main, thread pool workers). Top rows: functions called deepest in the stack. Color: usually random or based on package/module — no inherent meaning unless the tool assigns specific colors to categories (kernel vs user space). How to read: find the widest boxes at the top of the stack — these are the CPU hotspots. A plateau at the top (wide flat top) indicates a function doing a lot of work directly. A tall tower of narrow boxes indicates a deep call chain where the work happens at the bottom. Click to zoom in on a specific subtree. Differential flamegraphs: two profiles subtracted — blue means faster in the new version, red means slower. Ideal for comparing before and after a change.' },
  { q: 'What are the most common causes of memory leaks in server-side applications and how do profilers detect them?', options: ['Memory leaks are only a problem in languages without garbage collectors; managed languages like Java and Go cannot have memory leaks', 'Common causes include unbounded caches or collections, event listener accumulation in long-lived connections, thread-local variable accumulation, and static field retention; profilers detect leaks by tracking memory allocation over time and identifying growing object counts', 'Memory leaks are detected by the operating system and automatically reclaimed after each request', 'Profilers detect memory leaks by running the garbage collector more frequently and flagging uncollected objects'], answer: 1, explanation: 'Common memory leak causes: unbounded cache: a cache with no size limit grows until the process runs out of memory. A HashMap used as a cache without an eviction policy. Event listeners not removed: in Node.js, EventEmitter listeners accumulate if not explicitly removed. Each WebSocket connection that does not clean up its listeners. Thread-local variables: Java ThreadLocal values stored in a thread pool thread persist across requests. Must be removed explicitly via remove() in a finally block. Static collections: static List or Map fields that grow over time. Profiler detection: heap profiler (JVM heap dump, Node.js heap snapshot, pprof memory profile): take two snapshots 10 minutes apart. Compare object counts and retained size. Objects that grew significantly are the leak suspects. Allocation profiler: records where each allocation was made. Growing allocations in one code path over time indicate the leak location.' },
];

const qna: QnaItem[] = [
  {
    q: 'How do continuous profiling tools like Pyroscope keep CPU overhead under 1% while sampling constantly, when naive profiling approaches add much higher overhead?',
    a: 'Continuous profilers achieve low overhead through a combination of techniques: sampling at a low frequency (e.g. 100Hz rather than capturing every function call), using efficient stack-walking mechanisms (sometimes leveraging eBPF or lightweight signal-based sampling rather than heavyweight instrumentation that wraps every function), and aggregating samples into compact flamegraph-ready data structures before storage rather than shipping raw per-call event streams. Compare this to instrumentation-based profiling (wrapping every function call to record entry/exit) which adds overhead proportional to call frequency and can meaningfully slow down hot code paths — sampling profilers instead pay a roughly fixed, small cost regardless of how many function calls actually happen, which is exactly why they are safe to leave running continuously in production while instrumentation profiling is typically reserved for targeted, temporary debugging sessions.',
  },
  {
    q: 'What is the difference between CPU profiling and memory profiling, and when do I need each?',
    a: '<strong>CPU profiling</strong>: samples the call stack to show where time is spent executing code. Use when: <ul><li>p99 latency is high and you need to find the slow code path</li><li>CPU utilisation is higher than expected for the request rate</li><li>You want to find optimisation opportunities in hot paths</li></ul><strong>Memory profiling</strong>: captures heap object allocations and retentions. Use when: <ul><li>RSS or heap memory grows over time without stabilising (leak)</li><li>GC pauses are causing latency spikes (too many short-lived allocations)</li><li>Memory usage is higher than expected per request</li></ul>Often you need both: a high-CPU service under memory pressure has GC running frequently — the CPU profile will show GC overhead. A memory leak can eventually cause OOM kills, which appear as pod restarts in Kubernetes. Start with CPU profiling (simpler) and move to heap analysis if memory metrics suggest a leak.',
  },
  { q: 'How do you profile a production Node.js application without disrupting traffic?', a: 'Node.js production profiling: V8 CPU profiler: Node.js --prof flag generates a V8 profiler log. Use node --prof-process to generate a human-readable report. Can be activated for a short period without restarting via signals. 0x: npx 0x -- node app.js runs the application and generates a flamegraph. Best for development/staging due to higher overhead. clinic.js: npm install -g clinic. clinic flame -- node app.js generates flamegraphs. clinic doctor -- node app.js diagnoses common performance issues (I/O bottlenecks, event loop blocking). Continuous profiling with low overhead: @pyroscope/nodejs adds a sampling profiler with 1-2% overhead. Suitable for production. Event loop blocking: node --inspect enables the V8 inspector protocol. Chrome DevTools Performance tab can profile via the inspector. Detect event loop blocking: measure event loop lag with setImmediate timing. A delay above 10ms indicates blocking. async_hooks: trace async resource creation and destruction to find resource leaks (unclosed database connections, unresolved promises). General principle: prefer sampling profilers over instrumentation profilers in production. Measure overhead before committing to any production profiling approach.' },
  { q: 'What is allocation profiling and when should you use it?', a: 'Allocation profiling: tracks where in the code objects are being allocated (created) and how much memory they consume. Distinct from CPU profiling which measures where time is spent. When to use: investigating high GC pressure: if the garbage collector runs frequently, allocation profiling reveals which code paths create the most short-lived objects. Investigating memory growth: if resident memory grows over time, allocation profiling combined with heap snapshots identifies the accumulating objects and their allocation sites. Reducing object churn: even without leaks, excessive short-lived object creation forces the GC to work hard. Allocation profiling identifies high-churn code paths. Tools: Java: async-profiler in alloc mode records allocation stack traces. JVM Flight Recorder allocation profiling. .NET: dotMemory, Visual Studio Diagnostic Tools. Python: memory_profiler, tracemalloc (built-in since Python 3.4). Go: pprof heap profile with -memprofilerate flag. Common findings: excessive string concatenation creating a new string on each operation. Boxing and unboxing in hot paths. Large collections allocated per request that could be reused via object pooling. Unnecessary intermediate collections in LINQ or stream pipelines.' },
  { q: 'How do you identify and fix N+1 query problems using profiling?', a: 'N+1 problem: a loop executes one database query for each item in a result set rather than fetching all items in one query. Classic example: fetch 100 orders, then for each order fetch the customer — 101 separate queries total. Detection via profiling: database profiling tools (slow query log, pg_stat_statements, SQL Server Query Store) show many identical queries in a short time window. APM tracing: a trace with 100 nearly identical sequential spans for the same SQL template. Application profiler: stack traces showing the query called from within a loop. Code pattern: typically hidden behind ORM lazy loading (Entity Framework, Hibernate, ActiveRecord). Fix strategies: eager loading — JOIN the related data in the original query. ORM methods: .Include() in EF Core, eager_load in Rails, prefetch_related in Django. Batch loading: collect all IDs from the first query, then fetch all related records in a single IN query. DataLoader pattern: in GraphQL, batches and deduplicates loads within a single request. Caching: cache the per-item lookup if the data does not change often. Verification: after the fix, run the query count profiler again. A fixed N+1 goes from 101 queries to 1-2 queries.' },
  { q: 'What is the connection between profiling and performance budgets?', a: 'Performance budgets: predefined thresholds for performance metrics. If a deployment causes metrics to exceed the threshold, the deployment is blocked or rolled back. Types: p99 latency budget — the API endpoint must respond within 500ms at p99. CPU budget — the service must not use more than 60% CPU at peak load. Memory budget — the service must stay below 512MB resident memory. Profiling integration with budgets: establish baseline profiles before setting budgets — profile the service under load to understand current resource consumption. Set budgets based on capacity planning: if the service consumes 200MB at 100 RPS today, a 300MB budget leaves headroom for 50% traffic growth. Regression detection: run profiling in CI for expensive operations. Compare allocation counts and CPU time against baseline. Block the PR if a function regresses by more than N%. Continuous comparison: with continuous profiling, automatically compare each deployment to the previous version. Alert if a CPU hotspot moves up or memory allocation grows. Tools: Datadog Continuous Profiler with performance regression detection, Pyroscope CI integration, k6 with performance budget assertions.' },
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
