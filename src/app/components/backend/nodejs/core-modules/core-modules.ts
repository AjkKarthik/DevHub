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
  selector: 'app-node-core-modules',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './core-modules.html',
  styleUrl: './core-modules.scss'
})
export class NodeCoreModules {
  quickRef: QuickRefItem[] = [
    { name: 'node:fs/promises', type: 'keyword', desc: 'Async file I/O: readFile, writeFile, mkdir, readdir, stat, unlink.' },
    { name: 'node:path', type: 'keyword', desc: 'Cross-platform path ops: join, resolve, dirname, basename, extname, parse.' },
    { name: 'node:os', type: 'keyword', desc: 'System info: cpus(), freemem(), totalmem(), platform(), homedir(), tmpdir().' },
    { name: 'node:events', type: 'keyword', desc: 'EventEmitter: emit, on, once, off, removeListener, removeAllListeners.' },
    { name: 'node:crypto', type: 'keyword', desc: 'Hashing: createHash, randomBytes, randomUUID, pbkdf2, scrypt, timingSafeEqual.' },
    { name: 'node:child_process', type: 'keyword', desc: 'spawn, exec, execFile, fork — run external processes from Node.' },
    { name: 'node:worker_threads', type: 'keyword', desc: 'True parallelism: Worker, workerData, parentPort, MessageChannel.' },
    { name: 'node:url', type: 'keyword', desc: 'URL parsing and construction: URL class, URLSearchParams, fileURLToPath.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'File System (fs) and Path',
      points: [
        'fs/promises provides promisified versions of all fs operations — always prefer over callback-based fs. Use fs.createReadStream()/createWriteStream() for large files to avoid loading them into memory.',
        'path.join() concatenates path segments using the OS separator. path.resolve() resolves to an absolute path from right to left. Always use path.join or path.resolve instead of string concatenation for cross-platform safety.',
        'fs.stat() checks if a file exists and gets metadata. fs.mkdir({ recursive: true }) is the cross-platform replacement for "mkdir -p". fs.watch() monitors file changes (use chokidar for reliable cross-platform watching).',
        'Security: never use user-supplied paths directly with fs. Always resolve and validate against an allowed base directory to prevent path traversal attacks.',
      ]
    },
    {
      heading: 'EventEmitter',
      points: [
        'EventEmitter is the backbone of Node.js. HTTP servers, streams, child processes — all extend EventEmitter. Use emitter.on(event, listener) for persistent listeners and emitter.once(event, listener) for one-time listeners.',
        'Always call emitter.off() or removeListener() when a listener is no longer needed — especially in long-lived processes. Forgotten listeners are a common source of memory leaks.',
        'The "error" event is special: if emitted with no listener, Node.js throws an uncaught exception. Always attach an error listener on EventEmitters: emitter.on("error", handler).',
        'For async event handling, prefer modern patterns like EventEmitter.on() with async generators (events.on()) or convert to streams using stream.pipeline(). Do not make event callbacks async without proper error handling.',
      ]
    },
    {
      heading: 'Crypto and child_process',
      points: [
        'crypto.createHash("sha256").update(data).digest("hex") — synchronous hashing for short strings. For passwords, use crypto.pbkdf2() (async, thread pool) or scrypt(). Never use MD5 or SHA1 for security.',
        'crypto.randomBytes(32) — cryptographically secure random bytes. crypto.randomUUID() — generates a v4 UUID. Both run on the thread pool for large inputs.',
        'child_process.spawn() is the low-level primitive — streams stdin/stdout. exec() buffers the entire output (OK for small output). execFile() is like exec() but skips shell — safer for user input. fork() spawns a Node.js process with IPC.',
        'Always handle the "error" event and check exit codes on child processes. Use { shell: false } and pass arguments as an array to prevent shell injection.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'fs/promises',
      language: 'typescript',
      code: `import { readFile, writeFile, readdir, mkdir, stat, unlink } from 'node:fs/promises';
import { join } from 'node:path';

// Read a file
const text = await readFile('config.json', 'utf8');
const config = JSON.parse(text);

// Write atomically (write to tmp, rename)
await writeFile('output.json', JSON.stringify(data, null, 2), 'utf8');

// Create nested dirs
await mkdir(join('data', 'reports', '2025'), { recursive: true });

// List files with filter
const files = await readdir('src');
const jsFiles = files.filter(f => f.endsWith('.js'));

// Check existence
try {
  const info = await stat('optional.txt');
  console.log('size:', info.size);
} catch (err) {
  if (err.code === 'ENOENT') console.log('not found');
  else throw err;
}

// Large file streaming
import { createReadStream, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
await pipeline(
  createReadStream('big.csv'),
  createWriteStream('copy.csv')
);`
    },
    {
      label: 'EventEmitter',
      language: 'typescript',
      code: `import { EventEmitter } from 'node:events';

class OrderService extends EventEmitter {
  async placeOrder(order) {
    // process...
    this.emit('order:placed', order);
    this.emit('metrics', { type: 'order', ms: 42 });
  }
}

const svc = new OrderService();

// Persistent listener
svc.on('order:placed', (order) => {
  console.log('Email notification:', order.id);
});

// One-time listener
svc.once('order:placed', (order) => {
  console.log('First order ever:', order.id);
});

// ALWAYS handle errors
svc.on('error', (err) => {
  console.error('OrderService error:', err);
});

// Cleanup (important in long-running apps)
const metricsListener = (m) => record(m);
svc.on('metrics', metricsListener);
// ... later:
svc.off('metrics', metricsListener);

// Async listener with error handling
svc.on('order:placed', async (order) => {
  try { await saveToDb(order); }
  catch (err) { svc.emit('error', err); } // re-emit to error handler
});`
    },
    {
      label: 'crypto & child_process',
      language: 'typescript',
      code: `import { createHash, randomBytes, randomUUID, pbkdf2 } from 'node:crypto';
import { promisify } from 'node:util';
import { spawn } from 'node:child_process';

// Hash (sync, for non-passwords)
const hash = createHash('sha256').update('data').digest('hex');

// UUID
const id = randomUUID(); // '550e8400-e29b-41d4-a716-446655440000'

// Secure random token
const token = randomBytes(32).toString('hex');

// Password hashing (async, uses thread pool)
const pbkdf2Async = promisify(pbkdf2);
const key = await pbkdf2Async('password', 'salt', 100_000, 64, 'sha512');

// Spawn external process (safe — no shell)
const proc = spawn('ls', ['-la', '/tmp'], { shell: false });
let output = '';
proc.stdout.on('data', chunk => output += chunk);
proc.stderr.on('data', chunk => console.error(chunk.toString()));
proc.on('close', code => {
  if (code !== 0) throw new Error(\`Process exited \${code}\`);
  console.log(output);
});
proc.on('error', err => console.error('spawn failed:', err));`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using fs.existsSync() then operating on the file',
      wrong: 'if (fs.existsSync(path)) { const data = await readFile(path); }',
      right: 'try { const data = await readFile(path); } catch (e) { if (e.code !== "ENOENT") throw e; }',
      explanation: 'A race condition exists between existsSync() and readFile(). The file can be deleted between the check and the read. Attempt the operation and handle ENOENT in the catch.'
    },
    {
      title: 'No error listener on EventEmitter',
      wrong: 'emitter.emit("error", new Error("bad")); // throws uncaught exception',
      right: 'emitter.on("error", err => console.error(err)); emitter.emit("error", err);',
      explanation: 'The "error" event is special in Node.js. If emitted with no listener, it throws and crashes the process. Always attach an error listener.'
    },
    {
      title: 'Using exec() with user input (shell injection)',
      wrong: 'exec(`ls ${userInput}`); // rm -rf / if userInput = "; rm -rf /"',
      right: 'spawn("ls", [userInput], { shell: false }); // arguments array is safe',
      explanation: 'exec() passes the command to a shell. Attacker-controlled input can inject shell commands. Always use spawn() with an arguments array and shell: false.'
    },
    {
      title: 'Using MD5 or SHA1 for password hashing',
      wrong: 'createHash("md5").update(password).digest("hex")',
      right: 'await scrypt(password, salt, 64) // or pbkdf2 / argon2 via npm',
      explanation: 'MD5 and SHA1 are fast and GPU-crackable. Passwords need a slow, salted algorithm: scrypt, pbkdf2, or argon2. createHash is for data integrity, not passwords.'
    },
    {
      title: 'Forgetting to remove EventEmitter listeners',
      wrong: 'server.on("request", () => emitter.on("update", handler)); // leaks on each request',
      right: 'server.on("request", () => { emitter.once("update", handler); }); // or cleanup in handler',
      explanation: 'Adding listeners inside event handlers without removing them creates unbounded memory growth. Use once() for one-shot needs or always pair on() with off() in cleanup.'
    },
  ];

  challenge: Challenge = {
    title: 'File Watcher with EventEmitter',
    language: 'typescript',
    description: 'Build a FileWatcher class that extends EventEmitter and watches a directory using fs.watch(). Emit "created", "modified", and "deleted" events with { filename, path } payloads. Include an error event for watch failures. Provide start() and stop() methods. Debounce events for 200ms to avoid duplicate rapid-fire events.',
    hints: [
      'fs.watch(dir, { recursive: false }, (eventType, filename) => {}) works on most platforms.',
      'Use a Map to track debounce timers per filename.',
      'Store the watcher returned by fs.watch() so stop() can call watcher.close().',
    ],
    starterCode: `import { EventEmitter } from 'node:events';
import { watch } from 'node:fs';

class FileWatcher extends EventEmitter {
  constructor(dir) {
    super();
    this.dir = dir;
    this._watcher = null;
    this._timers = new Map();
  }

  start() {
    // TODO: watch this.dir, emit created/modified/deleted
  }

  stop() {
    // TODO: close watcher, clear timers
  }
}`,
    solution: `import { EventEmitter } from 'node:events';
import { watch, statSync } from 'node:fs';
import { join } from 'node:path';

class FileWatcher extends EventEmitter {
  constructor(dir) {
    super();
    this.dir = dir;
    this._watcher = null;
    this._timers = new Map();
  }

  start() {
    this._watcher = watch(this.dir, { persistent: false }, (event, filename) => {
      if (!filename) return;
      const path = join(this.dir, filename);
      clearTimeout(this._timers.get(filename));
      this._timers.set(filename, setTimeout(() => {
        this._timers.delete(filename);
        try {
          statSync(path);
          this.emit(event === 'rename' ? 'created' : 'modified', { filename, path });
        } catch {
          this.emit('deleted', { filename, path });
        }
      }, 200));
    });
    this._watcher.on('error', err => this.emit('error', err));
  }

  stop() {
    this._watcher?.close();
    for (const t of this._timers.values()) clearTimeout(t);
    this._timers.clear();
  }
}`
  };

  quiz: QuizQuestion[] = [
    { q: 'What is the difference between path.join() and path.resolve()?', options: ['They are identical', 'join() concatenates with OS separator; resolve() returns an absolute path', 'join() is async, resolve() is sync', 'resolve() only works on Windows'], answer: 1, explanation: 'path.join() concatenates segments with the OS path separator. path.resolve() works right-to-left and returns an absolute path, using cwd() as the base if no absolute segment is found.' },
    { q: 'What happens when you emit("error") on an EventEmitter with no error listener?', options: ['Nothing — it is silently ignored', 'The error is logged to console.error', 'Node.js throws an uncaught exception', 'The error is queued for the next tick'], answer: 2, explanation: 'The "error" event is special. Node.js throws the error as an uncaught exception if there is no listener, potentially crashing the process. Always add emitter.on("error", handler).' },
    { q: 'Which crypto function should you use for hashing passwords?', options: ['createHash("sha256")', 'createHash("md5")', 'pbkdf2 or scrypt', 'createHmac("sha1")'], answer: 2, explanation: 'createHash is fast (by design) and GPU-crackable for passwords. Passwords need slow algorithms with salt: pbkdf2, scrypt, or argon2. These are designed to be computationally expensive.' },
    { q: 'Why is spawn() with { shell: false } safer than exec() for user input?', options: ['spawn() is faster', 'Arguments array bypasses shell interpretation; exec() runs in a shell', 'exec() does not support user input', 'spawn() validates input automatically'], answer: 1, explanation: 'exec() passes the command string to a shell (/bin/sh). Attacker input like "; rm -rf /" becomes a shell command. spawn() with an args array never invokes a shell — each argument is passed directly to the OS.' },
    { q: 'When would you use fs.createReadStream() instead of fs.readFile()?', options: ['Always — streams are always faster', 'For large files to avoid loading them fully into memory', 'When you need the file encoding', 'When reading JSON files'], answer: 1, explanation: 'readFile() buffers the entire file in memory before calling your callback. For large files (logs, videos, CSV exports), streams process data in chunks without ever loading the full file.' },
    { q: 'What does url.URLSearchParams provide over manually parsing query strings?', options: ['Faster string concatenation', 'A standard API for parsing and serialising query strings without manual splitting/encoding', 'URL validation against DNS', 'Rate limiting per query parameter'], answer: 1, explanation: 'new URLSearchParams(queryString) handles percent-encoding, multiple values for the same key (getAll()), and serialisation with toString(). Manual string splitting with "&" and "=" does not handle edge cases like encoded ampersands or duplicate keys correctly.' },
  ];

  qna: QnaItem[] = [
    { q: 'Which core modules should every Node.js developer know well?', a: 'Tier 1 (daily use): fs/promises, path, events, crypto (randomBytes, randomUUID, createHash). Tier 2 (frequently): stream, child_process, url, os, util, net, http. Tier 3 (specialized): worker_threads, cluster, dns, tls. Start with Tier 1 and learn others as needed.' },
    { q: 'How do you handle ENOENT (file not found) without crashing?', a: 'Wrap fs operations in try/catch and check error.code: try { const data = await readFile(path); } catch (e) { if (e.code === "ENOENT") return null; throw e; }. The code property is set by the OS and reliable across platforms.' },
    { q: 'What is the node: prefix (e.g., import { readFile } from "node:fs/promises")?', a: 'The node: prefix (since Node 14.18) explicitly marks built-in modules. It prevents naming conflicts if an npm package has the same name as a built-in, makes imports self-documenting, and enables faster resolution. Prefer it in new code: import from "node:fs", "node:path", etc.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Node.js core modules — fs/promises, path, events, crypto, child_process — are the toolbox every backend developer uses daily without installing npm packages.',
    mustKnow: [
      'fs/promises: async file ops; createReadStream for large files.',
      'path.join() for safe path concatenation; path.resolve() for absolute paths.',
      'EventEmitter: always handle the "error" event or Node.js will throw.',
      'crypto: createHash for data integrity; pbkdf2/scrypt for passwords; randomBytes/randomUUID for tokens.',
      'spawn({ shell: false }) + args array to prevent shell injection.',
      'Prefer the node: prefix (node:fs, node:path) for built-in imports.',
    ],
    interviewFocus: [
      'What happens if an EventEmitter emits "error" with no listener?',
      'Why use spawn() over exec() when handling user input?',
      'When would you use streams vs readFile?',
    ]
  };
}
