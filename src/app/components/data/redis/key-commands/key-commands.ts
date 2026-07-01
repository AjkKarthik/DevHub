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
  selector: 'app-redis-key-commands',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            RevisionCardComponent, PageCompleteComponent],
  templateUrl: './key-commands.html',
  styleUrl: './key-commands.scss',
})
export class RedisKeyCommands {
  quickRef: QuickRefItem[] = [
    { name: 'SCAN cursor [MATCH p] [COUNT n] [TYPE t]', type: 'keyword', desc: 'Cursor-safe key iteration (use instead of KEYS)' },
    { name: 'TYPE key', type: 'keyword', desc: 'Returns string|hash|list|set|zset|stream' },
    { name: 'OBJECT ENCODING key', type: 'keyword', desc: 'Internal encoding: listpack, quicklist, skiplist, etc.' },
    { name: 'OBJECT IDLETIME key', type: 'keyword', desc: 'Seconds since key was last accessed' },
    { name: 'RENAME key newkey', type: 'keyword', desc: 'Atomically rename; overwrites newkey if it exists' },
    { name: 'RENAMENX key newkey', type: 'keyword', desc: 'Rename only if newkey does not exist' },
    { name: 'PERSIST key', type: 'keyword', desc: 'Remove TTL — make key permanent' },
    { name: 'PEXPIRE key ms', type: 'keyword', desc: 'Set TTL in milliseconds' },
    { name: 'EXPIRETIME key', type: 'keyword', desc: 'Unix timestamp when key expires (Redis 7+)' },
    { name: 'DUMP key', type: 'keyword', desc: 'Serialise a key\'s value (for RESTORE)' },
    { name: 'RESTORE key ttl data', type: 'keyword', desc: 'Restore a DUMP-serialised value' },
    { name: 'UNLINK key [key...]', type: 'keyword', desc: 'Non-blocking delete (frees memory in background)' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'SCAN vs KEYS — Why It Matters',
      points: [
        'KEYS pattern is O(N) and blocks Redis for the entire scan. On a 10M-key instance with a broad pattern, KEYS can take seconds — blocking all other commands.',
        'SCAN cursor [MATCH p] [COUNT n] iterates in batches using a cursor. Each call processes approximately COUNT keys and returns a new cursor (0 = iteration complete). Never blocks for long.',
        'COUNT is a hint, not a limit — Redis may return fewer or more keys per call. Always check the cursor, not the count, to determine completion.',
        'SCAN does not guarantee no duplicates — a key may appear twice during resharding. Deduplicate results in application code if exact counts matter.',
        'TYPE and OBJECT ENCODING filters in SCAN (Redis 6.0+) reduce the result set server-side, avoiding transferring and discarding unwanted keys in the client.',
      ],
    },
    {
      heading: 'Key Expiry Mechanics',
      points: [
        'TTL is stored per-key in Redis\'s expiry dictionary. Redis uses two mechanisms to expire keys: passive expiry (check on access) and active expiry (background sweep of 20 random keys with TTL every 100ms).',
        'PERSIST removes the TTL from a key, making it permanent. Useful when you decide to promote a cached value to persistent storage.',
        'PEXPIRE / PTTL work in milliseconds for fine-grained control. EXPIRETIME / PEXPIRETIME (Redis 7+) return the absolute Unix timestamp when the key will expire.',
        'Keys with no TTL never expire automatically — they persist until explicitly deleted or evicted by maxmemory policy.',
        'EXPIREAT key timestamp — set expiry as an absolute Unix timestamp instead of a relative duration.',
      ],
    },
    {
      heading: 'OBJECT ENCODING and Memory',
      points: [
        'OBJECT ENCODING key reveals the internal Redis encoding: `int`, `embstr`, `raw` for strings; `listpack` or `quicklist` for lists; `intset` or `hashtable` for sets; `listpack` or `skiplist` for sorted sets.',
        'Understanding encoding helps diagnose memory usage. A hash with 200 fields switches from `listpack` to `hashtable` — the threshold is configurable.',
        'OBJECT FREQ key returns the LFU access frequency (integer counter). Only meaningful when using LFU eviction policy.',
        'DEBUG OBJECT key shows encoding, serialised length, and LRU/LFU info — useful for offline memory analysis.',
      ],
    },
    {
      heading: 'DUMP / RESTORE for Migration',
      points: [
        'DUMP key produces a Redis-serialised RDB payload. RESTORE destkey ttl payload recreates the key on any Redis instance.',
        'MIGRATE host port key 0 timeout COPY — atomically move a key to another Redis instance without downtime. COPY leaves the source intact.',
        'Use DUMP/RESTORE for targeted key migration between Redis versions or instances without a full data dump.',
        'UNLINK is an asynchronous DELETE — it removes the key from the keyspace immediately (making it invisible) but frees memory lazily in a background thread. Prefer UNLINK over DEL for large values.',
      ],
    },
    {
      heading: 'TTL Management and Key Expiration Semantics',
      points: [
        'EXPIRE sets a time-to-live on an existing key, after which Redis automatically deletes it — essential for implementing caching (data becomes stale after N seconds) and session management (a session automatically expires after inactivity) without needing a separate cleanup process.',
        'TTL returns the remaining time-to-live for a key, or special values -1 (key exists but has no expiration set) and -2 (key does not exist at all) — a common bug is not distinguishing between these two negative return values, which represent very different situations.',
        'PERSIST removes an existing expiration from a key, making it permanent again — useful when a key\'s lifecycle needs to change dynamically (a temporary session key that should be made permanent once a user completes registration, for example).',
        'Redis uses a combination of lazy expiration (checking TTL when a key is accessed) and active expiration (a background process periodically sampling and removing expired keys) — this hybrid approach balances memory reclamation speed against the CPU cost of constantly scanning the entire keyspace for expired keys.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'SCAN Pattern',
      language: 'typescript',
      code: `import Redis from 'ioredis';
const redis = new Redis();

// Safe full-keyspace scan
async function scanAllKeys(pattern: string): Promise<string[]> {
  const keys: string[] = [];
  let cursor = '0';
  do {
    const [nextCursor, batch] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 200);
    keys.push(...batch);
    cursor = nextCursor;
  } while (cursor !== '0');
  return keys;
}

// Scan only hash keys
async function scanHashes(pattern: string): Promise<string[]> {
  const keys: string[] = [];
  let cursor = '0';
  do {
    const [next, batch] = await redis.scan(cursor, 'MATCH', pattern, 'TYPE', 'hash', 'COUNT', 100);
    keys.push(...batch);
    cursor = next;
  } while (cursor !== '0');
  return keys;
}

// Inspect a key
async function inspectKey(key: string) {
  const [type, enc, ttl] = await Promise.all([
    redis.type(key),
    redis.object('ENCODING', key),
    redis.ttl(key),
  ]);
  return { key, type, encoding: enc, ttlSeconds: ttl };
}

// Non-blocking delete of large keys
await redis.unlink('cache:large:dataset');`,
    },
    {
      label: 'TTL Management',
      language: 'bash',
      code: `# Set expiry
SET session:abc "user1"
EXPIRE session:abc 3600        # TTL in seconds
PEXPIRE session:abc 5000       # TTL in milliseconds
EXPIREAT session:abc 1735689600  # Unix timestamp

# Check expiry
TTL session:abc     # remaining seconds (-1 = no expiry, -2 = missing)
PTTL session:abc    # remaining milliseconds
EXPIRETIME session:abc   # absolute Unix timestamp (Redis 7+)

# Remove expiry
PERSIST session:abc   # key never expires now

# Rename
RENAME temp:cache:key perm:cache:key  # atomic rename

# Check and migrate
TYPE session:abc              # string
OBJECT ENCODING session:abc   # embstr or raw
OBJECT IDLETIME session:abc   # seconds since last access

# Non-blocking delete (background memory free)
UNLINK large:hash:data`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using KEYS in production codebase',
      wrong: 'const keys = await redis.keys("cache:*");',
      right: `async function scan(pattern: string) {
  let cur = '0'; const keys: string[] = [];
  do { const [c, b] = await redis.scan(cur, 'MATCH', pattern, 'COUNT', 200);
       keys.push(...b); cur = c; } while (cur !== '0');
  return keys; }`,
      explanation: 'KEYS blocks the Redis event loop. On a busy production instance with millions of keys, a single KEYS call can pause Redis for multiple seconds, causing timeouts for all other clients.',
    },
    {
      title: 'Using DEL for large values instead of UNLINK',
      wrong: 'await redis.del("cache:large:list"); // blocks while freeing memory',
      right: 'await redis.unlink("cache:large:list"); // async memory free',
      explanation: 'DEL frees the memory synchronously, blocking the event loop for the duration. UNLINK removes the key from the keyspace instantly and frees memory in a background thread.',
    },
    {
      title: 'Not accounting for SCAN duplicates',
      wrong: 'const keys = await scanAllKeys("*"); const uniqueCount = keys.length;',
      right: 'const keys = await scanAllKeys("*"); const uniqueCount = new Set(keys).size;',
      explanation: 'SCAN may return duplicate keys during cursor iteration if resharding or rehashing occurs concurrently. Deduplicate results before counting or processing.',
    },
  ];

  challenge: Challenge = {
    title: 'Key Inspector',
    language: 'typescript',
    description: 'Write `auditKeys(pattern)` that scans all keys matching the pattern and returns a summary object: `{ total, byType: Record<string, number>, expiringSoon: string[] }` where `expiringSoon` contains keys with TTL < 60 seconds.',
    hints: [
      'Use SCAN to iterate; TYPE key for each match',
      'TTL < 60 and > 0 means expiring soon (-1 = never, -2 = missing)',
    ],
    starterCode: `import Redis from 'ioredis';
const redis = new Redis();

async function auditKeys(pattern: string): Promise<{
  total: number;
  byType: Record<string, number>;
  expiringSoon: string[];
}> {}`,
    solution: `import Redis from 'ioredis';
const redis = new Redis();

async function auditKeys(pattern: string) {
  const allKeys: string[] = [];
  let cursor = '0';
  do {
    const [c, batch] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 200);
    allKeys.push(...batch);
    cursor = c;
  } while (cursor !== '0');

  const byType: Record<string, number> = {};
  const expiringSoon: string[] = [];

  await Promise.all(allKeys.map(async key => {
    const [type, ttl] = await Promise.all([redis.type(key), redis.ttl(key)]);
    byType[type] = (byType[type] ?? 0) + 1;
    if (ttl > 0 && ttl < 60) expiringSoon.push(key);
  }));

  return { total: allKeys.length, byType, expiringSoon };
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does SCAN return when iteration is complete?',
      options: ['An empty array', 'cursor = "0"', 'cursor = "-1"', 'null'],
      answer: 1,
      explanation: 'SCAN returns cursor "0" (string zero) when the full keyspace has been iterated. Loop condition: continue while cursor !== "0".',
    },
    {
      q: 'What does TTL return for a key with no expiry?',
      options: ['-2', '0', '-1', 'null'],
      answer: 2,
      explanation: 'TTL returns -1 for a key that exists but has no expiry. It returns -2 for a key that does not exist at all.',
    },
    {
      q: 'Why should you use SCAN instead of KEYS in production?',
      options: ['SCAN is faster than KEYS', 'SCAN is cursor-based and non-blocking; KEYS blocks Redis for the entire iteration', 'KEYS requires authentication; SCAN does not', 'SCAN returns results in alphabetical order'],
      answer: 1,
      explanation: 'KEYS pattern blocks the Redis event loop while iterating all keys — catastrophic on large datasets. SCAN returns a cursor-based batch, spreading work across multiple calls without blocking. Always use SCAN (or HSCAN/SSCAN/ZSCAN) in production.',
    },
    {
      q: 'What does the OBJECT ENCODING command return?',
      options: ['The Redis data type of the key', 'The internal memory encoding used for the key value (e.g., listpack, skiplist, embstr)', 'The TTL encoding format', 'The serialisation protocol version'],
      answer: 1,
      explanation: 'OBJECT ENCODING key returns the internal representation: embstr/raw (strings), ziplist/listpack/quicklist (lists), intset/listpack/hashtable (sets), etc. Useful for memory optimisation — listpack is much smaller than full structures.',
    },
    {
      q: 'What does DUMP / RESTORE do in Redis?',
      options: ['Deletes and recreates a key', 'Serialises a key value to RDB format (DUMP) and deserialises it into a key (RESTORE) — enabling key migration between instances', 'Creates a backup of the entire database', 'Compresses a key value'],
      answer: 1,
      explanation: 'DUMP key returns the RDB-serialised value of a key. RESTORE key ttl serialised-value creates a key from the serialised value. Used by MIGRATE command to move individual keys between Redis instances atomically.',
    },
    {
      q: 'What happens to TTL when you rename a key with RENAME?',
      options: ['The TTL is preserved on the new key name', 'The TTL is reset to -1 (no expiry) after rename', 'The rename fails if the source has a TTL', 'The TTL is transferred only if both keys are of the same type'],
      answer: 0,
      explanation: 'RENAME copies the key with its TTL to the new name and deletes the old key. The TTL is preserved. If the destination key already exists, it is overwritten (including its TTL). Use RENAMENX to rename only if destination does not exist.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do I find which keys are using the most memory?',
      a: 'Use `redis-cli --bigkeys` which scans all keys and reports the largest by data type. For more granular analysis, use `redis-cli --memkeys` (Redis 7+) to sort all keys by memory usage. In production, run during low-traffic periods since it uses SCAN internally.',
    },
    {
      q: 'How do you check the remaining TTL of a key?',
      a: '<strong>TTL key</strong> returns remaining TTL in seconds (-1 = no expiry, -2 = key does not exist). <strong>PTTL key</strong> returns in milliseconds for higher precision. <strong>PERSIST key</strong> removes the expiry making the key permanent. <strong>EXPIRETIME key</strong> (Redis 7+) returns the Unix timestamp when the key expires.',
    },
    {
      q: 'What does the TYPE command return and when do you use it?',
      a: 'TYPE key returns the type: <code>string</code>, <code>list</code>, <code>set</code>, <code>zset</code>, <code>hash</code>, <code>stream</code>, or <code>none</code> (key not found). Use it to inspect unknown keys. For memory encoding details use OBJECT ENCODING key. For size use OBJECT FREQ, MEMORY USAGE key.',
    },
    {
      q: 'What does MEMORY USAGE return and why is it useful?',
      a: 'MEMORY USAGE key [SAMPLES count] returns the total memory in bytes consumed by the key including value, metadata, and pointer overhead. Useful for identifying large keys. Use with SCAN to find memory hogs: scan all keys and check MEMORY USAGE on samples. Redis 4.0+.',
    },
    {
      q: 'How do you atomically set a key with an expiry?',
      a: 'Use <code>SET key value EX seconds</code> or <code>SET key value PX milliseconds</code> — atomically sets value and expiry. Old pattern (SETNX + EXPIRE) was non-atomic: a crash between the two commands left immortal keys. The modern SET options are the correct approach. Also: SETEX (deprecated but still works), GETSET (replaced by SET ... GET).',
    },
    {
      q: 'What is the OBJECT ENCODING command used for?',
      a: 'OBJECT ENCODING key shows the internal memory encoding: <code>embstr</code>/<code>raw</code> (strings), <code>listpack</code>/<code>quicklist</code> (lists), <code>intset</code>/<code>hashtable</code> (sets), <code>listpack</code>/<code>skiplist</code> (sorted sets), <code>listpack</code>/<code>hashtable</code> (hashes). Small structures use compact encodings — understand thresholds to optimise memory.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Use SCAN (never KEYS) for safe key iteration; UNLINK for non-blocking deletes; PERSIST/EXPIRE for TTL management; OBJECT ENCODING to inspect internals.',
    mustKnow: [
      'SCAN cursor MATCH pattern COUNT n — safe iteration (cursor=0 means done)',
      'KEYS is O(N) and blocks — never use in production',
      'UNLINK for async background delete of large values',
      'TTL returns -1 (no expiry) or -2 (missing); PERSIST removes TTL',
      'OBJECT ENCODING reveals internal representation for memory analysis',
      'SCAN may return duplicates — deduplicate if counting unique keys',
    ],
    interviewFocus: [
      'Why is KEYS dangerous and what should you use instead?',
      'Difference between DEL and UNLINK',
      'How does Redis expire keys internally (active + passive)?',
      'OBJECT ENCODING — why does it matter for memory optimisation?',
    ],
  };
}
