import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../components/shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../../components/shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../../components/shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../components/shared/code-block/code-block';
import { QnaBlockComponent, QnaItem } from '../../../../components/shared/qna-block/qna-block';

@Component({
  selector: 'app-node-cheatsheet',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent, QnaBlockComponent],
  templateUrl: './cheatsheet.html',
  styleUrl: './cheatsheet.scss'
})
export class NodeCheatsheet {
  quickRef: QuickRefItem[] = [
    { name: 'process.env.VAR', type: 'keyword', desc: 'Read environment variables. Always string — parse to Number/Boolean explicitly.' },
    { name: 'process.argv', type: 'keyword', desc: 'CLI arguments array. argv[0]=node, argv[1]=script, argv[2+]=user args.' },
    { name: 'process.exit(code)', type: 'function', desc: '0 = success, 1 = error. Triggers "exit" event synchronously before exiting.' },
    { name: '__dirname / __filename', type: 'keyword', desc: 'CJS: absolute path of current directory/file. ESM: use import.meta.url + fileURLToPath.' },
    { name: 'import.meta.url', type: 'keyword', desc: 'ESM equivalent of __filename. Use with URL/fileURLToPath for paths.' },
    { name: 'Buffer.from(str, "utf8")', type: 'function', desc: 'Create Buffer from string. Buffer.toString("base64") for encoding conversion.' },
    { name: 'os.cpus().length', type: 'function', desc: 'Number of CPU cores — use for cluster workers and worker thread pool size.' },
    { name: 'path.join() / path.resolve()', type: 'function', desc: 'join: concatenate path segments. resolve: absolute path from relative. Always use instead of string concatenation.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Core Modules Quick Reference',
      points: [
        'node:fs — file system: fs.promises.readFile, writeFile, mkdir, readdir, stat, watch. Prefer fs.promises over callbacks. fs.createReadStream/WriteStream for large files.',
        'node:path — path utilities: path.join(__dirname, "file.txt"), path.resolve(), path.basename(), path.extname(), path.dirname(). Never string-concatenate paths — slashes differ by OS.',
        'node:crypto — cryptography: randomBytes(32) for tokens, createHash("sha256") for checksums, createHmac("sha256", secret) for signatures, scrypt/bcrypt for passwords, randomUUID() for IDs.',
        'node:events — EventEmitter: extend or use instances. on(event, fn), once(event, fn), emit(event, ...args), removeListener(), setMaxListeners(). Use EventEmitter.captureRejections = true to catch async handler errors.',
      ]
    },
    {
      heading: 'Async Patterns Cheat Sheet',
      points: [
        'Callbacks → Promises: use util.promisify(fn) for Node.js error-first callbacks. For custom: new Promise((resolve, reject) => { ... }). Always prefer async/await over raw Promise chains for readability.',
        'Concurrent vs sequential: sequential = await in for loop (each waits). Concurrent = await Promise.all(items.map(fn)) (all run at once). allSettled for "all results even with failures". race for "first one wins" (timeout pattern). any for "first success".',
        'Error handling: try/catch for await. process.on("unhandledRejection") for missed .catch(). process.on("uncaughtException") for sync throws. In Express: asyncHandler wrapper → error middleware.',
        'Generators and async iteration: for await...of works on any AsyncIterable — readable streams, async generators, paginated API results. Async generators: async function*() { yield value; } — memory-efficient for large sequences.',
      ]
    },
    {
      heading: 'Event Loop Phases (Ordered)',
      points: [
        '1. Timers: runs setTimeout and setInterval callbacks whose delay has elapsed. 2. Pending I/O callbacks: I/O callbacks deferred from previous iteration.',
        '3. Idle/prepare: internal use only. 4. Poll: retrieve new I/O events; execute I/O-related callbacks. If no timers, wait here for I/O.',
        '5. Check: setImmediate() callbacks run here — always after the poll phase even if poll is empty. 6. Close callbacks: socket.on("close") etc.',
        'process.nextTick() runs after the current operation completes, BEFORE the next event loop phase — it is not actually part of the loop. Use for: resolving promises synchronously-ish, ensuring a callback runs after current synchronous code.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Core module patterns',
      language: 'typescript',
      code: `// fs: read, write, stream
import { promises as fs } from 'node:fs';
const content = await fs.readFile('file.txt', 'utf8');
await fs.writeFile('out.txt', content.toUpperCase());
await fs.mkdir('dir/subdir', { recursive: true });

// path
import path from 'node:path';
const abs  = path.resolve('..', 'config', 'app.json');
const ext  = path.extname('file.ts');  // '.ts'
const base = path.basename('/foo/bar.js', '.js'); // 'bar'

// crypto
import { randomBytes, createHash, randomUUID } from 'node:crypto';
const token = randomBytes(32).toString('hex');      // 64 hex chars
const hash  = createHash('sha256').update('data').digest('hex');
const id    = randomUUID();                         // e.g. 'f47ac10b-58cc...'

// events
import { EventEmitter } from 'node:events';
const emitter = new EventEmitter();
emitter.on('data', chunk => console.log(chunk));
emitter.once('end', () => console.log('done'));
emitter.emit('data', 'hello');
emitter.emit('end');`
    },
    {
      label: 'HTTP server + middleware patterns',
      language: 'typescript',
      code: `// Minimal HTTP server (no Express)
import { createServer } from 'node:http';
const server = createServer((req, res) => {
  const url = new URL(req.url, \`http://\${req.headers.host}\`);
  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: true }));
  }
  res.writeHead(404); res.end('Not found');
});
server.listen(3000);

// Express quick setup (common patterns)
import express from 'express';
const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Router
const router = express.Router();
router.get('/',    (req, res) => res.json({ items }));
router.post('/',   async (req, res, next) => { try { ... } catch(e) { next(e); } });
router.get('/:id', (req, res, next) => { ... });
app.use('/api/v1/items', router);

// Error middleware (must be last, 4 args)
app.use((err, req, res, next) => {
  res.status(err.statusCode ?? 500).json({ error: err.message });
});`
    },
    {
      label: 'Streams, cluster, debugging',
      language: 'typescript',
      code: `// Stream: gzip compress a file
import { createReadStream, createWriteStream } from 'node:fs';
import { createGzip } from 'node:zlib';
import { pipeline } from 'node:stream/promises';
await pipeline(createReadStream('input.log'), createGzip(), createWriteStream('input.log.gz'));

// Cluster: use all CPU cores
import cluster from 'node:cluster';
import { cpus } from 'node:os';
if (cluster.isPrimary) {
  for (let i = 0; i < cpus().length; i++) cluster.fork();
  cluster.on('exit', (w, code) => { if (code !== 0) cluster.fork(); });
} else { app.listen(3000); }

// Debugging cheat sheet
// Start with inspector: node --inspect app.js
// Then: chrome://inspect (attach Chrome DevTools)
// node --inspect-brk app.js  (break before first line)
// node --prof app.js          (CPU profiler — creates isolate-*.log)
// node --prof-process isolate-*.log > profile.txt

// Memory leak detection
// node --heap-prof app.js  (heap profiler — Chromium format)
// process.memoryUsage() for runtime snapshot
// v8.writeHeapSnapshot() for heap dump`
    },
  ];

  qna: QnaItem[] = [
    { q: 'What is the difference between require() and import?', a: 'require() is CommonJS (CJS): synchronous, loads at call time, returns module.exports. Works everywhere in .js files without configuration. import is ESM: asynchronous (static analysis), hoisted, tree-shakeable, requires "type":"module" in package.json or .mjs extension. ESM cannot require() CJS packages that use __dirname. Interop: import CJS from ESM works (gets default export = module.exports). Require ESM from CJS: not possible (use dynamic import()).' },
    { q: 'What is the difference between setImmediate and process.nextTick?', a: 'process.nextTick(fn): runs fn after the current synchronous operation completes, BEFORE any I/O or timers — not part of the event loop phases. Runs immediately after the current call stack. setImmediate(fn): runs fn in the Check phase of the event loop — AFTER poll (I/O) completes. If I/O is pending, setImmediate runs after the I/O callbacks. Use nextTick for: resolving from synchronous code with async behavior. Use setImmediate for: yielding to I/O after heavy sync work.' },
    { q: 'How do you debug a memory leak in Node.js?', a: 'Step 1: monitor process.memoryUsage().heapUsed over time — growing heap = leak. Step 2: take heap snapshots in Chrome DevTools (node --inspect + Memory tab). Take two snapshots before/after suspected leak. In Comparison view, look for objects with growing counts. Step 3: v8.writeHeapSnapshot() programmatically at intervals for production debugging. Common causes: global variables growing (arrays, Maps), event listeners never removed (EventEmitter), closures holding references, caches without eviction. Fix: use WeakMap/WeakRef for caches, removeListener() on disconnect.' },
    { q: 'What does NODE_ENV=production do?', a: "NODE_ENV=production is a convention — Node.js itself treats it no differently, but many libraries check it. Express: disables verbose error stack traces in responses, enables view cache. Morgan: switches from dev format to combined (shorter). Template engines: cache compiled templates. Libraries like sequelize disable debug logging. Always set NODE_ENV=production in production containers. Some packages behave fundamentally differently (skip devDependency-backed features) without it." },
  ];
}
