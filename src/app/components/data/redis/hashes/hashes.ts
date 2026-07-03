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
  selector: 'app-redis-hashes',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            RevisionCardComponent, PageCompleteComponent],
  templateUrl: './hashes.html',
  styleUrl: './hashes.scss',
})
export class RedisHashes {
  quickRef: QuickRefItem[] = [
    { name: 'HSET key field value [f v...]', type: 'keyword', desc: 'Set one or more fields (Redis 4+, replaces HMSET)' },
    { name: 'HGET key field', type: 'keyword', desc: 'Get a single field value' },
    { name: 'HMGET key field [field...]', type: 'keyword', desc: 'Get multiple fields in one call' },
    { name: 'HGETALL key', type: 'keyword', desc: 'Return all fields and values as a flat list' },
    { name: 'HDEL key field [field...]', type: 'keyword', desc: 'Delete one or more fields' },
    { name: 'HEXISTS key field', type: 'keyword', desc: 'Returns 1 if field exists' },
    { name: 'HKEYS / HVALS / HLEN', type: 'keyword', desc: 'All field names / all values / field count' },
    { name: 'HINCRBY key field n', type: 'keyword', desc: 'Atomically increment a numeric field' },
    { name: 'HSCAN key cursor MATCH pattern', type: 'keyword', desc: 'Cursor-safe iteration over large hashes' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What is a Redis Hash?',
      points: [
        'A hash is a map of field-value pairs stored under a single key — effectively a flat object. HSET user:1 name Alice age 30 role admin creates three fields under the user:1 key.',
        'Fields and values are both strings (same binary-safe rule as top-level keys). Numeric fields can be atomically incremented with HINCRBY.',
        'Hashes are ideal for representing rows, documents, or configuration objects where you need independent field access without deserialising the entire value.',
        'A single hash can hold up to 2^32 - 1 field-value pairs (over 4 billion fields).',
      ],
    },
    {
      heading: 'Memory Efficiency: ziplist vs hashtable',
      points: [
        'For small hashes (≤ hash-max-listpack-entries, default 128 fields, and each value ≤ hash-max-listpack-value, default 64 bytes), Redis uses a compact ziplist (listpack in Redis 7+) encoding — contiguous memory, no pointer overhead.',
        'When either limit is exceeded, Redis converts the hash to a full hashtable. This uses more memory but provides O(1) field access.',
        'For many small objects (e.g., 10M user profiles), storing each as a hash key-per-user is more memory-efficient than storing as JSON strings in separate top-level keys — the ziplist encoding saves pointer overhead.',
        'The most memory-efficient pattern for millions of small objects: group 100 objects into one hash with numeric IDs as fields (the "hash-of-hashes" pattern).',
      ],
    },
    {
      heading: 'Field-Level Operations',
      points: [
        'HSET overwrites existing fields; HSETNX sets a field only if it does not already exist.',
        'HINCRBY user:1 loginCount 1 — atomic counter per object field, no read-modify-write race.',
        'HGETALL returns a flat list [field1, value1, field2, value2, ...]. Map it into an object in application code.',
        'HDEL removes one or more fields. The key itself persists until all fields are deleted.',
        'HMGET returns values in the same order as the fields requested, with nil for missing fields.',
      ],
    },
    {
      heading: 'When to Use Hashes vs Separate String Keys',
      points: [
        'Storing an object\'s fields as a single Redis hash (HSET user:1000 name "Alice" age "30") is significantly more memory-efficient than storing each field as a separate string key (user:1000:name, user:1000:age), since Redis hashes use a compact internal encoding for small hashes.',
        'Hashes let you update or read individual fields (HSET, HGET) without needing to serialize/deserialize the entire object — more efficient than storing a JSON-serialized string blob when you frequently need to read or update just one or two fields of a larger object.',
        'The hash-max-listpack-entries and hash-max-listpack-value configuration options control when Redis switches a hash\'s internal encoding from the compact listpack representation to a full hash table — relevant for memory optimization tuning when working with either very small or very large hashes.',
        'HGETALL retrieves an entire hash in one round trip, avoiding N separate GET calls for N related fields — but for hashes with many fields, consider whether you actually need every field, since HMGET lets you fetch only the specific fields required for a given operation.',
      ],
    },
    {
      heading: 'Atomic Field-Level Operations on Hashes',
      points: [
        'HINCRBY and HINCRBYFLOAT provide atomic increment operations scoped to a single field within a hash — useful for maintaining per-field counters (like tracking view counts per post attribute) without needing a separate top-level key for each counter.',
        'HSETNX sets a hash field only if it does not already exist, atomically — useful for implementing "initialize once" semantics for a specific field within a larger object, similar to how SETNX works for standalone string keys.',
        'HDEL removes one or more specific fields from a hash without affecting other fields — and once the last field is removed, Redis automatically deletes the now-empty hash key entirely, so there is no need for separate cleanup logic to remove an empty hash.',
        'HRANDFIELD (introduced in Redis 6.2) returns one or more random fields from a hash, optionally with their values — useful for sampling use cases similar to SRANDMEMBER for sets, without needing to fetch the entire hash and randomize client-side.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Hash Commands',
      language: 'bash',
      code: `# Set multiple fields
HSET user:1 name Alice age 30 role admin email alice@example.com

# Get individual fields
HGET user:1 name           # "Alice"
HMGET user:1 name email    # ["Alice", "alice@example.com"]

# Get all fields
HGETALL user:1
# 1) "name"  2) "Alice"
# 3) "age"   4) "30"
# 5) "role"  6) "admin"
# 7) "email" 8) "alice@example.com"

# Field existence
HEXISTS user:1 name        # 1
HEXISTS user:1 phone       # 0

# Field names, values, count
HKEYS user:1               # ["name", "age", "role", "email"]
HVALS user:1               # ["Alice", "30", "admin", "alice@..."]
HLEN user:1                # 4

# Atomic counter field
HINCRBY user:1 loginCount 1   # 1 (creates field if absent)
HINCRBY user:1 loginCount 1   # 2

# Delete a field
HDEL user:1 email

# Cursor-safe iteration over large hashes
HSCAN user:1 0 MATCH name* COUNT 10`,
    },
    {
      label: 'Node.js',
      language: 'typescript',
      code: `import Redis from 'ioredis';
const redis = new Redis();

// Store a user object
await redis.hset('user:1', {
  name: 'Alice',
  age: '30',
  role: 'admin',
  email: 'alice@example.com',
});

// Get single field
const name = await redis.hget('user:1', 'name');  // 'Alice'

// Get multiple fields
const [n, e] = await redis.hmget('user:1', 'name', 'email');

// Get all fields as an object
const raw = await redis.hgetall('user:1');
// { name: 'Alice', age: '30', role: 'admin', email: '...' }

// Atomic increment
await redis.hincrby('user:1', 'loginCount', 1);

// Update a single field (no need to GET+SET the whole object)
await redis.hset('user:1', 'role', 'superadmin');

// Delete a field
await redis.hdel('user:1', 'email');

// Check field existence
const exists = await redis.hexists('user:1', 'phone');  // 0`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Storing objects as JSON strings when hash operations are needed',
      wrong: 'await redis.set("user:1", JSON.stringify(user));',
      right: 'await redis.hset("user:1", user);',
      explanation: 'With JSON you must deserialise the entire object to read or update one field. Hashes let you HGET/HSET individual fields atomically and HINCRBY numeric counters.',
    },
    {
      title: 'Using HGETALL on very large hashes in production',
      wrong: 'const allData = await redis.hgetall("metrics:all");  // 100k fields',
      right: 'const cursor = await redis.hscan("metrics:all", 0, "COUNT", 100);\n// iterate pages',
      explanation: 'HGETALL on a massive hash blocks the event loop while Redis serialises the entire response. HSCAN iterates in batches without blocking.',
    },
    {
      title: 'Setting TTLs on individual hash fields',
      wrong: 'EXPIRE user:1 field_name 3600  // not how it works',
      right: 'EXPIRE user:1 3600  // TTL applies to the entire key, not fields',
      explanation: 'Redis TTLs apply to the key as a whole — you cannot expire individual hash fields. Use sorted sets (score = expiry timestamp) or separate top-level keys for per-field expiry.',
    },
    {
      title: 'Using HMSET instead of HSET',
      wrong: 'await redis.hmset("user:1", "name", "Alice", "age", "30");',
      right: 'await redis.hset("user:1", { name: "Alice", age: "30" });',
      explanation: 'HMSET was deprecated in Redis 4.0. HSET now accepts multiple field-value pairs in one call. Use HSET for all hash writes.',
    },
  ];

  challenge: Challenge = {
    title: 'Shopping Cart',
    language: 'typescript',
    description: 'Implement a Redis hash-based shopping cart. Write `addItem(cartId, itemId, qty)` to set/update item quantity, `removeItem(cartId, itemId)` to delete an item, and `getCart(cartId)` to return all items as `Record<string, number>`.',
    hints: [
      'Use the cartId as the hash key and itemId as the field',
      'HSET for add/update, HDEL for remove, HGETALL for retrieve',
      'Parse string values from HGETALL to numbers',
    ],
    starterCode: `import Redis from 'ioredis';
const redis = new Redis();

async function addItem(cartId: string, itemId: string, qty: number): Promise<void> {}
async function removeItem(cartId: string, itemId: string): Promise<void> {}
async function getCart(cartId: string): Promise<Record<string, number>> {}`,
    solution: `import Redis from 'ioredis';
const redis = new Redis();

async function addItem(cartId: string, itemId: string, qty: number): Promise<void> {
  await redis.hset(\`cart:\${cartId}\`, itemId, qty.toString());
}

async function removeItem(cartId: string, itemId: string): Promise<void> {
  await redis.hdel(\`cart:\${cartId}\`, itemId);
}

async function getCart(cartId: string): Promise<Record<string, number>> {
  const raw = await redis.hgetall(\`cart:\${cartId}\`);
  return Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, parseInt(v)]));
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What encoding does Redis use for small hashes (< 128 fields, values < 64 bytes)?',
      options: ['hashtable', 'ziplist / listpack', 'skiplist', 'intset'],
      answer: 1,
      explanation: 'Small hashes use a compact ziplist (listpack in Redis 7+) — contiguous memory without pointer overhead. This is 2-3x more memory efficient than a full hashtable for small objects.',
    },
    {
      q: 'How do you atomically increment a numeric field in a hash?',
      options: ['HGET then HSET in a transaction', 'HINCRBY key field n', 'HINCREMENT key field n', 'INCRHASH key field'],
      answer: 1,
      explanation: 'HINCRBY is atomic — it reads and increments the field in a single operation. No race conditions, even with many concurrent clients.',
    },
    {
      q: 'What does HINCRBY do?',
      options: ['Increments a hash key TTL', 'Increments the integer value of a hash field by a given amount', 'Adds a new hash field', 'Returns hash field count'],
      answer: 1,
      explanation: 'HINCRBY key field increment atomically increments the value of field in hash key by increment. If the field does not exist it is created with value 0 before applying. Use for counters within a hash (per-user metrics, aggregates).',
    },
    {
      q: 'Which command retrieves all field-value pairs from a hash?',
      options: ['HVALS key', 'HKEYS key', 'HGETALL key', 'HMGET key *'],
      answer: 2,
      explanation: 'HGETALL key returns all fields and values as alternating field/value pairs. HKEYS returns field names only; HVALS returns values only. HMGET key f1 f2 returns values for specific fields. Use HSCAN for large hashes to avoid blocking.',
    },
    {
      q: 'How do you check if a specific field exists in a Redis hash?',
      options: ['HGET key field (returns null if absent)', 'HEXISTS key field (returns 1 if exists, 0 if not)', 'HTYPE key field', 'HHAS key field'],
      answer: 1,
      explanation: 'HEXISTS key field returns 1 if the field exists in the hash, 0 if the hash or field does not exist. More explicit than checking HGET for nil when you only need existence, not the value.',
    },
    {
      q: 'What is the memory encoding optimisation for small Redis hashes?',
      options: ['Hashes always use a standard dictionary', 'Small hashes use listpack (ziplist) encoding, converting to a hash table when field count or value size exceeds thresholds', 'Hashes are always stored as sorted sets internally', 'No encoding optimisation exists for hashes'],
      answer: 1,
      explanation: 'Redis stores small hashes as listpack (formerly ziplist) — a compact sequential structure much more memory-efficient than a hash table. Configured via hash-max-listpack-entries (128) and hash-max-listpack-value (64). Exceeding thresholds converts to hashtable.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use a hash vs a JSON string vs a separate key per field?',
      a: 'Use a hash when you have a small-to-medium number of fields (< 1000) and need field-level access or atomic HINCRBY. Use JSON when you always read/write the entire object and never need partial updates. Use separate keys (user:1:name, user:1:age) only when you need per-field TTLs — otherwise the key overhead is large.',
    },
    {
      q: 'Can I set a TTL on a single field of a hash?',
      a: 'No — Redis TTLs apply to the entire key. Workarounds: (1) store expiry timestamp as a field value and check in application code; (2) use a sorted set with score = expiry time; (3) use separate top-level keys if per-field expiry is critical.',
    },
    {
      q: 'When should you use a Redis hash instead of multiple string keys?',
      a: 'Use hashes for multi-field entities (user profile with name, email, score). A hash <code>user:1001</code> is more memory-efficient than separate keys <code>user:1001:name</code>, <code>user:1001:email</code> — especially under the listpack threshold (128 fields default). You also get atomic multi-field reads with HGETALL.',
    },
    {
      q: 'How do you atomically update multiple hash fields?',
      a: '<strong>HSET key field1 val1 field2 val2</strong> (Redis 4.0+) sets multiple fields atomically — the old HMSET is deprecated. For conditional updates, use Lua or MULTI/EXEC. HSET returns the count of new fields added (0 for updated existing fields). HSETNX sets a field only if it does not exist.',
    },
    {
      q: 'How do you safely iterate a large hash?',
      a: 'Use <strong>HSCAN key cursor [MATCH pattern] [COUNT count]</strong>. Start cursor at 0; use the returned cursor for next call; repeat until returned cursor is 0. COUNT is a hint not a guarantee. Never use HGETALL on a large hash — it blocks Redis and returns potentially millions of fields in one shot.',
    },
    {
      q: 'Why does listpack encoding make individual field lookups on a hash O(n) instead of O(1), and why is this an acceptable tradeoff for small hashes?',
      a: 'Listpack stores fields sequentially as a flat, compact byte sequence rather than using hash-table buckets with computed offsets — finding a specific field means scanning entries linearly until a match is found, which is O(n) rather than the O(1) average-case lookup a real hashtable provides. This is an acceptable tradeoff specifically because listpack is only used for SMALL hashes (below hash-max-listpack-entries, default 128) — scanning at most 128 compact entries sequentially is still extremely fast in absolute terms (likely faster than a hashtable\'s pointer-chasing for such small N due to cache locality), while the memory savings from avoiding hash-table overhead (buckets, pointers, padding) are significant at that scale.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Redis hashes are maps of field-value pairs — ideal for objects, with atomic HGET/HSET per field and memory-efficient ziplist encoding for small hashes.',
    mustKnow: [
      'HSET key { field: value } — set multiple fields; HGET for single field',
      'HGETALL returns flat list; map to object in application code',
      'HINCRBY for atomic numeric field increments (no GET+SET needed)',
      'Small hashes use ziplist — memory-efficient for millions of objects',
      'TTL applies to the entire key, not individual fields',
      'HSCAN for safe iteration over large hashes (avoid HGETALL on large sets)',
    ],
    interviewFocus: [
      'Hash vs JSON string — when do you choose each?',
      'What is the ziplist encoding and why does it matter for memory?',
      'How do you implement per-field expiry when Redis doesn\'t support it natively?',
      'How is HINCRBY different from GET + SET for counters?',
    ],
  };
}
