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
  selector: 'app-redis-fundamentals',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            RevisionCardComponent, PageCompleteComponent],
  templateUrl: './fundamentals.html',
  styleUrl: './fundamentals.scss',
})
export class RedisFundamentals {
  quickRef: QuickRefItem[] = [
    { name: 'SET key value [EX s]', type: 'keyword', desc: 'Store a value; EX sets TTL in seconds' },
    { name: 'GET key', type: 'keyword', desc: 'Retrieve value or nil if missing' },
    { name: 'DEL key [key...]', type: 'keyword', desc: 'Delete one or more keys' },
    { name: 'EXPIRE key seconds', type: 'keyword', desc: 'Set a TTL; key auto-deletes when it expires' },
    { name: 'TTL key', type: 'keyword', desc: 'Remaining TTL in seconds (-1 = no expiry, -2 = missing)' },
    { name: 'EXISTS key', type: 'keyword', desc: 'Returns 1 if key exists, 0 otherwise' },
    { name: 'TYPE key', type: 'keyword', desc: 'Returns data type: string, hash, list, set, zset, stream' },
    { name: 'KEYS pattern', type: 'keyword', desc: 'Glob-style key scan — NEVER in production (blocking)' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What is Redis?',
      points: [
        'Redis (Remote Dictionary Server) is an in-memory data structure store that can be used as a cache, message broker, and primary database.',
        'It is single-threaded — one event loop processes all commands sequentially, avoiding lock contention and achieving predictable, microsecond latency.',
        'Data lives entirely in RAM by default, giving sub-millisecond reads and writes that disk-based databases cannot match for hot workloads.',
        'Redis is not just a key-value store — it natively understands strings, hashes, lists, sets, sorted sets, streams, and more, enabling rich operations server-side.',
      ],
    },
    {
      heading: 'Core Architecture',
      points: [
        'Single-threaded event loop: Redis serialises all commands through one thread. Network I/O is multiplexed with epoll/kqueue so thousands of clients can connect without multiple threads.',
        'In-memory storage: the full dataset resides in RAM. Persistence (RDB snapshots, AOF log) writes to disk asynchronously without blocking the event loop.',
        'Copy-on-write for persistence: BGSAVE forks the process. The child writes a snapshot while the parent continues serving requests using OS copy-on-write pages.',
        'Pipelining: clients can send multiple commands without waiting for replies, dramatically reducing round-trip overhead for bulk operations.',
      ],
    },
    {
      heading: 'Redis vs Memcached',
      points: [
        'Memcached stores only strings; Redis supports rich data structures (hashes, sorted sets, streams) enabling complex operations in a single round-trip.',
        'Memcached is multi-threaded and scales reads across cores; Redis is single-threaded per instance but can be clustered across many nodes.',
        'Redis has optional persistence (RDB/AOF); Memcached is volatile-only — restart loses all data.',
        'Redis supports pub/sub, Lua scripting, transactions, and geospatial commands; Memcached does not.',
        'Choose Memcached only when you need purely volatile multi-threaded caching and don\'t need any of Redis\'s advanced features.',
      ],
    },
    {
      heading: 'Key Naming Conventions',
      points: [
        'Use colon-separated namespaces: user:1234:profile, order:session:abc. This creates a logical hierarchy visible in tools like Redis Insight.',
        'Keep keys short but descriptive — long key names consume memory and are slower to compare. Avoid embedding timestamps in key names; use TTL instead.',
        'Binary-safe: keys and values can be any byte sequence up to 512 MB, including binary data and newlines.',
        'The maximum number of keys is 2^32 - 1 per instance (4 billion keys).',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Basic Commands',
      language: 'bash',
      code: `# Start Redis server
redis-server

# Connect with CLI
redis-cli

# String operations
SET user:1:name "Alice"
SET user:1:age 30 EX 3600      # expires in 1 hour
GET user:1:name                 # "Alice"
TTL user:1:age                  # remaining seconds

# Atomic counter
INCR page:views                 # 1
INCRBY page:views 5             # 6

# Multiple operations
MSET color red size large style bold
MGET color size style

# Delete
DEL user:1:name
EXISTS user:1:name              # 0

# Key inspection
TYPE user:1:age                 # string
KEYS user:*                     # list keys (avoid in prod)
SCAN 0 MATCH user:* COUNT 100  # safe, cursor-based`,
    },
    {
      label: 'Node.js (ioredis)',
      language: 'typescript',
      code: `import Redis from 'ioredis';

const redis = new Redis({ host: 'localhost', port: 6379 });

// Basic string operations
await redis.set('user:1:name', 'Alice');
await redis.set('session:token', 'xyz', 'EX', 3600);  // TTL 1h
const name = await redis.get('user:1:name');  // 'Alice'
const ttl  = await redis.ttl('session:token');  // ~3600

// Atomic counter
await redis.incr('page:views');
await redis.incrby('page:views', 5);

// Check existence
const exists = await redis.exists('user:1:name');  // 1

// Delete
await redis.del('user:1:name');

// Pipeline — send multiple commands in one round-trip
const pipeline = redis.pipeline();
pipeline.set('a', '1');
pipeline.set('b', '2');
pipeline.get('a');
const results = await pipeline.exec();

await redis.quit();`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using KEYS in production',
      wrong: 'KEYS user:*',
      right: 'SCAN 0 MATCH user:* COUNT 100',
      explanation: 'KEYS blocks the event loop for the entire key scan — on a 10M-key instance this can pause Redis for seconds. SCAN returns results in batches without blocking.',
    },
    {
      title: 'Creating a new Redis connection per request',
      wrong: 'const redis = new Redis(); await redis.get(key); await redis.quit();',
      right: 'const redis = new Redis(); // singleton — reuse across all requests',
      explanation: 'TCP connection setup is expensive. Create one Redis client at startup and share it across the application lifetime.',
    },
    {
      title: 'Storing everything as JSON strings',
      wrong: 'SET user:1 JSON.stringify({ name, age, role })',
      right: 'HSET user:1 name Alice age 30 role admin',
      explanation: 'A hash allows atomic field updates (HSET user:1 age 31), range queries, and field-level operations without deserialising the entire object.',
    },
    {
      title: 'Not setting TTLs on cached data',
      wrong: 'SET cache:product:123 data',
      right: 'SET cache:product:123 data EX 300',
      explanation: 'Without a TTL, cached entries accumulate forever and consume memory. Stale data is served long after the source changes. Always set a TTL appropriate to your freshness requirement.',
    },
    {
      title: 'Treating Redis as a durable primary store without configuring persistence',
      wrong: '// Redis in default config — AOF off, RDB save only every 15min',
      right: 'appendonly yes  # in redis.conf — write AOF log on every write',
      explanation: 'Default Redis is not durable — a crash loses data since the last RDB snapshot. For durability, enable AOF (appendonly yes) or accept that Redis is a cache that can be repopulated.',
    },
  ];

  challenge: Challenge = {
    title: 'Session Store',
    language: 'typescript',
    description: 'Implement a simple session store using Redis. Write two functions: `createSession(userId, ttlSeconds)` that stores a session token mapping to a userId (with TTL), and `getSession(token)` that returns the userId or null if expired/missing.',
    hints: [
      'Generate a unique token with crypto.randomUUID() or a UUID library',
      'Use SET with the EX option to set the TTL atomically',
      'GET returns null when a key is missing or expired',
    ],
    starterCode: `import Redis from 'ioredis';

const redis = new Redis();

async function createSession(userId: string, ttlSeconds: number): Promise<string> {
  // TODO: generate token, store in Redis with TTL, return token
}

async function getSession(token: string): Promise<string | null> {
  // TODO: look up token, return userId or null
}`,
    solution: `import Redis from 'ioredis';
import { randomUUID } from 'crypto';

const redis = new Redis();

async function createSession(userId: string, ttlSeconds: number): Promise<string> {
  const token = randomUUID();
  await redis.set(\`session:\${token}\`, userId, 'EX', ttlSeconds);
  return token;
}

async function getSession(token: string): Promise<string | null> {
  return redis.get(\`session:\${token}\`);
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Why is Redis single-threaded?',
      options: ['Memory bandwidth limits', 'Avoids lock contention and context switching overhead', 'RAM is too slow for multiple threads', 'Redis was written in 1990'],
      answer: 1,
      explanation: 'Single-threaded event loop eliminates mutex locks and context switching. All commands execute serially with predictable, microsecond latency. Network I/O is still multiplexed across thousands of clients.',
    },
    {
      q: 'What does KEYS pattern do and why is it dangerous?',
      options: ['Returns matching keys safely using cursors', 'Blocks the event loop while scanning all keys', 'Reads only indexed keys', 'Deletes matching keys'],
      answer: 1,
      explanation: 'KEYS scans the entire keyspace in one blocking call. On large instances this pauses all other commands for seconds. Use SCAN with a cursor instead — it returns results in batches without blocking.',
    },
    {
      q: 'Which command removes a key\'s TTL without deleting it?',
      options: ['DEL', 'EXPIRE key 0', 'PERSIST', 'UNSET'],
      answer: 2,
      explanation: 'PERSIST key removes the expiry, making the key permanent. EXPIRE key 0 would immediately expire (and delete) the key. DEL deletes the key entirely.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How does Redis achieve sub-millisecond latency?',
      a: 'Three factors combine: (1) All data is in RAM — no disk seeks. (2) Single-threaded event loop eliminates lock contention. (3) Simple data structures (hash tables, skip lists, zip lists) with O(1) or O(log n) operations. Network round-trip time is usually the dominant cost for LAN clients.',
    },
    {
      q: 'Can Redis hold more data than available RAM?',
      a: 'Not in standard mode — Redis uses RAM for all data. When memory is exhausted, behaviour depends on the maxmemory-policy: noeviction (default) returns errors; LRU/LFU policies evict old keys to make room. Redis 7.x introduced Redis on Flash (enterprise) for tiered storage, but this is not open source.',
    },
    {
      q: 'What is the difference between TTL and PTTL?',
      a: 'TTL returns the remaining time-to-live in seconds. PTTL returns it in milliseconds for higher precision. Both return -1 if the key has no expiry, -2 if the key does not exist.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Redis is a single-threaded, in-memory data structure server with sub-millisecond latency and optional persistence.',
    mustKnow: [
      'Single-threaded event loop — all commands are serialised, no locks needed',
      'Data lives in RAM; persistence (RDB/AOF) is optional and asynchronous',
      'Supports rich data types: strings, hashes, lists, sets, sorted sets, streams',
      'Key naming: use colon namespaces (user:1:profile)',
      'KEYS blocks — always use SCAN in production',
      'TTL controls key expiry; PERSIST removes expiry',
    ],
    interviewFocus: [
      'Why is Redis single-threaded and what are the trade-offs?',
      'How does Redis achieve persistence without blocking the event loop?',
      'Redis vs Memcached — when would you choose each?',
      'What happens when Redis runs out of memory?',
    ],
  };
}
