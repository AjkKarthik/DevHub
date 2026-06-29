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
  selector: 'app-redis-strings',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            RevisionCardComponent, PageCompleteComponent],
  templateUrl: './strings.html',
  styleUrl: './strings.scss',
})
export class RedisStrings {
  quickRef: QuickRefItem[] = [
    { name: 'SET key value [EX s] [NX|XX]', type: 'keyword', desc: 'Store string; NX=only if absent, XX=only if exists' },
    { name: 'GET key', type: 'keyword', desc: 'Retrieve value or nil' },
    { name: 'GETSET key new', type: 'keyword', desc: 'Atomically set and return old value' },
    { name: 'GETDEL key', type: 'keyword', desc: 'Get value then delete the key atomically' },
    { name: 'GETEX key EX s', type: 'keyword', desc: 'Get value and refresh its TTL atomically' },
    { name: 'INCR / INCRBY key [n]', type: 'keyword', desc: 'Atomic counter increment; creates key at 0 if missing' },
    { name: 'DECR / DECRBY key [n]', type: 'keyword', desc: 'Atomic counter decrement' },
    { name: 'APPEND key value', type: 'keyword', desc: 'Append string to existing value; returns new length' },
    { name: 'STRLEN key', type: 'keyword', desc: 'Length of stored string in bytes' },
    { name: 'SETBIT / GETBIT / BITCOUNT', type: 'keyword', desc: 'Bit-level operations on string values' },
    { name: 'MSET / MGET key val...', type: 'keyword', desc: 'Set/get multiple keys atomically (MSET) / in one call (MGET)' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'String Type Internals',
      points: [
        'Redis strings are binary-safe byte sequences up to 512 MB. They can hold text, serialized JSON, binary data, integers, or floating-point numbers.',
        'Internally Redis uses three encodings: int (for integers that fit in a long), embstr (strings ≤44 bytes, stored inline with the Redis object), and raw (heap-allocated for longer strings).',
        'When a string value is a valid integer, Redis stores it as an int and can perform INCR/DECR/INCRBY without serialisation overhead.',
        'Strings are the most memory-efficient type for single values. For objects with multiple fields, hashes are more efficient than serialized JSON strings.',
      ],
    },
    {
      heading: 'SET Options: NX, XX, EX, PX, GET',
      points: [
        'SET key value NX — set only if the key does not exist. Returns OK or nil. Classic distributed lock pattern.',
        'SET key value XX — set only if the key already exists. Useful for updating cache entries that must already be present.',
        'SET key value EX 300 — set with a 300-second TTL atomically. Equivalent to SET + EXPIRE but atomic.',
        'SET key value PX 5000 — TTL in milliseconds instead of seconds.',
        'SET key value GET — returns the old value while setting the new one. Useful for compare-and-swap without a separate GETSET.',
        'Combine options: SET lock:resource uuid NX EX 30 — distributed lock with auto-expiry.',
      ],
    },
    {
      heading: 'Counters with INCR / INCRBY',
      points: [
        'INCR is atomic — even with 1000 concurrent clients calling INCR on the same key, no increment is lost. This is the correct way to implement counters.',
        'If the key does not exist, INCR treats it as 0 and returns 1. No initialisation needed.',
        'INCRBYFLOAT supports fractional increments, but the internal representation is a float string — avoid for high-precision financial counters (use integers scaled by factor).',
        'Rate limiting pattern: INCR user:1:requests; EXPIRE user:1:requests 60 — count requests in a 60-second window.',
      ],
    },
    {
      heading: 'Bit Operations',
      points: [
        'SETBIT key offset 1 — set bit at byte offset. Redis allocates bytes transparently as needed.',
        'GETBIT key offset — read a single bit. Returns 0 for unset or out-of-range offsets.',
        'BITCOUNT key [start end] — count set bits in the string, optionally over a byte range.',
        'BITPOS key bit [start end] — find the first set or cleared bit. Useful for allocating free user IDs from a bitmask.',
        'Use case: daily active users — store one bit per user ID per day. 10M users = 1.25 MB per day.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'String Commands',
      language: 'bash',
      code: `# Basic set and get
SET greeting "Hello, Redis!"
GET greeting               # "Hello, Redis!"
STRLEN greeting            # 13

# TTL and conditional set
SET session:abc "user123" EX 1800    # 30 min TTL
SET lock:resource uuid NX EX 30     # distributed lock
SET cache:key newdata XX             # update only if exists

# Atomic get-then-something
GETDEL temp:key            # get and delete
GETEX session:abc EX 1800  # get and refresh TTL

# Counters
SET page:views 0
INCR page:views            # 1
INCR page:views            # 2
INCRBY page:views 10       # 12
DECR page:views            # 11

# Multiple keys
MSET k1 v1 k2 v2 k3 v3
MGET k1 k2 k3              # ["v1", "v2", "v3"]

# Bit operations
SETBIT active:2024-01-15 1001 1   # user 1001 active today
BITCOUNT active:2024-01-15         # total active users`,
    },
    {
      label: 'Node.js Patterns',
      language: 'typescript',
      code: `import Redis from 'ioredis';
const redis = new Redis();

// Distributed lock: SET NX EX
async function acquireLock(resource: string, ttlMs: number): Promise<string | null> {
  const token = Math.random().toString(36);
  const ok = await redis.set(\`lock:\${resource}\`, token, 'PX', ttlMs, 'NX');
  return ok === 'OK' ? token : null;
}

async function releaseLock(resource: string, token: string): Promise<void> {
  // Lua ensures we only delete OUR lock
  const script = \`
    if redis.call("GET", KEYS[1]) == ARGV[1] then
      return redis.call("DEL", KEYS[1])
    else return 0 end
  \`;
  await redis.eval(script, 1, \`lock:\${resource}\`, token);
}

// Atomic counter
async function trackPageView(page: string): Promise<number> {
  const key = \`views:\${page}:\${new Date().toISOString().slice(0, 10)}\`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 86400 * 7); // keep 7 days
  return count;
}

// Daily active users with bitmaps
async function markActiveUser(userId: number, date: string): Promise<void> {
  await redis.setbit(\`active:\${date}\`, userId, 1);
}

async function getDailyActiveCount(date: string): Promise<number> {
  return redis.bitcount(\`active:\${date}\`);
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using SET + EXPIRE separately instead of SET EX',
      wrong: 'await redis.set(key, value);\nawait redis.expire(key, 300);',
      right: 'await redis.set(key, value, "EX", 300);',
      explanation: 'Two separate commands are not atomic. If the process crashes between SET and EXPIRE, the key persists forever with no TTL. SET EX is a single atomic operation.',
    },
    {
      title: 'Incrementing with GET + SET instead of INCR',
      wrong: 'const v = parseInt(await redis.get(key)); await redis.set(key, v + 1);',
      right: 'await redis.incr(key);',
      explanation: 'GET + SET has a race condition — two concurrent processes can read the same value and both write back the same incremented result, losing one increment. INCR is atomic.',
    },
    {
      title: 'Storing complex objects as JSON strings',
      wrong: 'await redis.set("user:1", JSON.stringify({ name, age, email }));',
      right: 'await redis.hset("user:1", { name, age, email });',
      explanation: 'JSON requires deserialising the entire object to read one field. Hashes let you GET/SET individual fields with HGET/HSET, and HINCRBY for numeric fields atomically.',
    },
    {
      title: 'Not checking the return value of SET NX for locking',
      wrong: 'await redis.set("lock:res", "1", "NX"); // assume lock acquired',
      right: 'const ok = await redis.set("lock:res", token, "NX", "EX", 30);\nif (ok !== "OK") throw new Error("Lock not acquired");',
      explanation: 'SET NX returns null (not OK) if the lock was already held. Ignoring this means multiple callers proceed thinking they hold the lock — defeating the purpose entirely.',
    },
  ];

  challenge: Challenge = {
    title: 'Rate Limiter (Fixed Window)',
    language: 'typescript',
    description: 'Implement a simple fixed-window rate limiter using Redis strings. Write `isAllowed(userId, limit, windowSeconds)` that returns true if the user is within their rate limit for the current window, false otherwise.',
    hints: [
      'Key: `ratelimit:{userId}:{Math.floor(Date.now() / (windowSeconds * 1000))}`',
      'Use INCR to increment the counter atomically',
      'On first request (count === 1), set the key\'s TTL to windowSeconds',
    ],
    starterCode: `import Redis from 'ioredis';
const redis = new Redis();

async function isAllowed(userId: string, limit: number, windowSeconds: number): Promise<boolean> {
  // TODO: implement fixed-window rate limiting
}`,
    solution: `import Redis from 'ioredis';
const redis = new Redis();

async function isAllowed(userId: string, limit: number, windowSeconds: number): Promise<boolean> {
  const window = Math.floor(Date.now() / (windowSeconds * 1000));
  const key = \`ratelimit:\${userId}:\${window}\`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, windowSeconds);
  return count <= limit;
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does SET key value NX return if the key already exists?',
      options: ['The existing value', 'OK', 'nil (null)', 'An error'],
      answer: 2,
      explanation: 'SET NX returns OK when the key was set (it was absent), and nil (null in Node.js) when the key already existed and no change was made.',
    },
    {
      q: 'INCR on a key that does not exist returns:',
      options: ['An error', '0', '1', 'nil'],
      answer: 2,
      explanation: 'Redis treats a missing key as 0 for INCR. It creates the key, sets it to 0, increments to 1, and returns 1. No initialisation is needed.',
    },
    {
      q: 'Which encoding does Redis use internally for small integers stored as strings?',
      options: ['raw', 'embstr', 'int', 'ziplist'],
      answer: 2,
      explanation: 'When a string value can be represented as a long integer, Redis uses the int encoding — storing the number directly in the Redis object without heap allocation. INCR/DECR operate on this type without serialisation.',
    },
    {
      q: 'What does SETNX do and why is it important?',
      options: ['Deletes a string if it has no TTL', 'Sets a key only if it does not exist — atomically — used for distributed locking', 'Sets a negative TTL', 'Creates a set from a string'],
      answer: 1,
      explanation: 'SETNX key value is atomic — either sets the key or returns 0 if already exists. Foundation of distributed locks: acquire = SETNX lock owner; release = check + DEL. Modern usage: SET key value NX EX seconds (combines NX + expiry atomically).',
    },
    {
      q: 'What does INCRBYFLOAT do and what precision issue should you know?',
      options: ['Increments a key by a float, storing the result as a float — but floating-point precision issues may occur', 'Rounds all float increments to 2 decimal places automatically', 'Only works on keys created with HSET', 'Converts integers to floats before incrementing'],
      answer: 0,
      explanation: 'INCRBYFLOAT key increment increments the stored float. Redis stores the result as a string. Standard IEEE 754 double precision applies — avoid for exact financial calculations. For currency, store amounts in integer cents and use INCR.',
    },
    {
      q: 'What does GETRANGE do?',
      options: ['Returns a random substring', 'Returns a substring of the string stored at a key, specified by start and end byte offsets', 'Returns the type of a value', 'Returns the range of keys matching a pattern'],
      answer: 1,
      explanation: 'GETRANGE key start end returns the substring (0-indexed, negative indices from end). Example: GETRANGE key 0 3 returns first 4 bytes. SETRANGE key offset value overwrites part of the string. Useful for compact binary storage.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the maximum size of a Redis string value?',
      a: '512 MB. This applies to both keys and values. In practice, storing values larger than a few KB is unusual — large payloads should be stored in object storage (S3, Blob) with only the reference (URL or ID) stored in Redis.',
    },
    {
      q: 'How do I atomically get an old value and set a new one?',
      a: 'Use GETSET (deprecated in Redis 6.2) or SET key newvalue GET. The GET option on SET returns the previous value while atomically writing the new one. For conditional swap, use a Lua script.',
    },
    {
      q: 'What replaced GETSET in Redis 6.2 and why?',
      a: 'GETSET is deprecated in Redis 6.2. Use <code>SET key newvalue GET</code> — the GET option returns the old value atomically. Cleaner API and works with all SET options (EX, PX, NX, XX). GETDEL (get and delete atomically) and GETEX (get and optionally set expiry) were also added in 6.2.',
    },
    {
      q: 'What is the difference between SETNX and SET key value NX?',
      a: 'Both set a key only if it does not exist. <strong>SETNX</strong> (old) has no option to set expiry atomically — you needed SETNX + EXPIRE (two commands, non-atomic). <strong>SET key value NX EX seconds</strong> (Redis 2.6.12+) is atomic — no risk of a zombie key with no expiry. SETNX is deprecated; use SET with NX.',
    },
    {
      q: 'How do Redis INCR commands handle non-integer values?',
      a: 'INCR / INCRBY / DECR / DECRBY fail with an error if the stored value is not representable as a 64-bit signed integer. INCRBYFLOAT works on float values. If the key does not exist, Redis treats it as 0 before incrementing. Strings used as counters are stored as integers internally for efficiency.',
    },
    {
      q: 'What is MSET and when should you use it?',
      a: 'MSET key1 val1 key2 val2 ... sets multiple keys atomically in a single round trip. MSETNX sets all keys only if none of them exist (all-or-nothing). MGET key1 key2 ... retrieves multiple values in one call. Use MSET/MGET to batch operations and reduce round trips — significant latency saving over individual SET/GET in loops.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Redis strings are binary-safe byte sequences supporting atomic counters (INCR), conditional set (NX/XX), bit operations, and automatic TTL.',
    mustKnow: [
      'SET key value NX EX 30 — atomic lock pattern (set only if absent, auto-expire)',
      'INCR/INCRBY are atomic — correct way to implement counters, no GET+SET',
      'SET key value EX s — atomic set with TTL (never SET then EXPIRE separately)',
      'MSET/MGET for multi-key operations in one round-trip',
      'BITCOUNT for counting set bits — efficient for user activity tracking',
      'Strings up to 512 MB; int encoding for numeric strings',
    ],
    interviewFocus: [
      'Why is INCR atomic and why does it matter for counters?',
      'How do you implement a distributed lock with Redis strings?',
      'When would you use bitmaps instead of regular strings or sets?',
      'SET NX vs SETNX — what changed and why?',
    ],
  };
}
