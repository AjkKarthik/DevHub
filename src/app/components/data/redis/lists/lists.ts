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
  selector: 'app-redis-lists',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            RevisionCardComponent, PageCompleteComponent],
  templateUrl: './lists.html',
  styleUrl: './lists.scss',
})
export class RedisLists {
  quickRef: QuickRefItem[] = [
    { name: 'LPUSH key val [val...]', type: 'keyword', desc: 'Prepend elements to the left (head)' },
    { name: 'RPUSH key val [val...]', type: 'keyword', desc: 'Append elements to the right (tail)' },
    { name: 'LPOP key [count]', type: 'keyword', desc: 'Remove and return element(s) from the left' },
    { name: 'RPOP key [count]', type: 'keyword', desc: 'Remove and return element(s) from the right' },
    { name: 'LRANGE key start stop', type: 'keyword', desc: 'Get a slice of the list (0 -1 = all)' },
    { name: 'LLEN key', type: 'keyword', desc: 'Number of elements in the list' },
    { name: 'LINDEX key index', type: 'keyword', desc: 'Get element by index (0-based, -1 = last)' },
    { name: 'LSET key index value', type: 'keyword', desc: 'Set element at index' },
    { name: 'LTRIM key start stop', type: 'keyword', desc: 'Trim list to specified range (circular buffer)' },
    { name: 'BLPOP / BRPOP key [timeout]', type: 'keyword', desc: 'Blocking pop — waits until element is available' },
    { name: 'LMOVE src dst LEFT RIGHT', type: 'keyword', desc: 'Atomically move element between lists' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'List Internals',
      points: [
        'Redis lists are doubly-linked lists (listpack/quicklist encoding). LPUSH and RPUSH are O(1) — pushing to either end is constant time regardless of list length.',
        'LRANGE is O(N+S) where S is the offset from head. Slicing from the head of a long list is fast; from deep within a long list is slower.',
        'Small lists (≤ list-max-listpack-size elements) use a compact listpack (ziplist) encoding. Larger lists use a quicklist — a doubly-linked list of listpack nodes.',
        'Lists are perfect for queues (RPUSH + BLPOP), stacks (LPUSH + LPOP), activity feeds (LPUSH + LTRIM to keep last N), and message buffers.',
      ],
    },
    {
      heading: 'Queue and Stack Patterns',
      points: [
        'Queue (FIFO): producers call RPUSH queue:jobs job1 job2; consumers call BLPOP queue:jobs 0 (blocks until a job arrives). Reliable, ordered delivery.',
        'Stack (LIFO): LPUSH + LPOP. Elements are returned newest-first. Useful for undo stacks, depth-first search queues.',
        'Reliable queue: LMOVE queue:pending queue:processing LEFT LEFT atomically moves a job to a processing list. After completion, LREM queue:processing 1 jobid. Pending list shows crashed jobs.',
        'BRPOPLPUSH (or LMOVE in Redis 6.2+) is the atomic "pop and push" operation used in reliable queue patterns.',
      ],
    },
    {
      heading: 'Circular Buffer with LTRIM',
      points: [
        'LPUSH + LTRIM implements a capped list (keep only the last N items): LPUSH recent:events event5; LTRIM recent:events 0 99 — keeps only 100 most recent events.',
        'This is the activity feed / audit log pattern. New events are prepended; LTRIM evicts the oldest beyond the cap.',
        'O(1) amortised per insert — LTRIM removes from the tail which is O(1).',
        'LRANGE recent:events 0 19 fetches the 20 most recent events for display.',
      ],
    },
    {
      heading: 'Blocking Operations',
      points: [
        'BLPOP key [key...] timeout — blocks until an element is available or timeout expires (0 = wait forever). Avoids busy polling.',
        'Multiple keys: BLPOP queue:high queue:low 30 — pops from the first non-empty list; priority queue pattern.',
        'Blocking commands hold a connection open. Use a dedicated connection for blocking operations — do not reuse an ioredis connection that also handles regular commands.',
        'In Redis 7.0+, LMPOP pops from the first non-empty list in a set without blocking.',
      ],
    },
    {
      heading: 'Lists as Queues: LPUSH/RPOP and Blocking Operations',
      points: [
        'Combining LPUSH (add to the left/head) with RPOP (remove from the right/tail) implements a simple FIFO queue — producers push new work items to one end while consumers pop from the other end, processing items in the order they were added.',
        'BLPOP and BRPOP block the calling client until an item becomes available (up to a configurable timeout), eliminating the need for a consumer to poll an empty list repeatedly — significantly more efficient than a loop that calls LPOP and sleeps when the list is empty.',
        'For work queues requiring reliability (ensuring a popped item is not lost if the consumer crashes mid-processing), RPOPLPUSH (or the newer LMOVE) atomically moves an item to a separate "processing" list, letting you detect and recover items whose consumer crashed before acknowledging completion.',
        'Redis Lists are implemented as a doubly-linked list of quicklist nodes internally, giving O(1) push/pop operations at either end — but random access by index (LINDEX on a large list) is O(N), making lists a poor choice for use cases requiring frequent access to arbitrary middle elements.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'List Commands',
      language: 'bash',
      code: `# Queue: push to right, pop from left (FIFO)
RPUSH queue:emails "email1" "email2" "email3"
LPOP queue:emails    # "email1"
LLEN queue:emails    # 2

# Stack: push and pop from left (LIFO)
LPUSH history page1 page2 page3
LPOP history         # "page3" (most recent)

# Slice
LRANGE queue:emails 0 -1   # all elements
LRANGE history 0 4         # first 5

# Circular buffer (keep last 100 events)
LPUSH events:recent "new_event"
LTRIM events:recent 0 99

# Blocking pop (waits up to 30s)
BLPOP queue:jobs 30   # blocks until a job appears

# Atomic move between lists (reliable queue)
LMOVE queue:pending queue:processing LEFT LEFT

# Element by index
LINDEX history 0     # first element
LINDEX history -1    # last element`,
    },
    {
      label: 'Node.js Queue',
      language: 'typescript',
      code: `import Redis from 'ioredis';
const redis = new Redis();

// Producer: enqueue jobs
async function enqueue(job: object): Promise<void> {
  await redis.rpush('queue:jobs', JSON.stringify(job));
}

// Consumer: blocking dequeue
async function startWorker(): Promise<void> {
  const workerRedis = new Redis();  // dedicated connection for blocking
  while (true) {
    const result = await workerRedis.blpop('queue:jobs', 0);
    if (!result) continue;
    const [, raw] = result;
    const job = JSON.parse(raw);
    await processJob(job);
  }
}

// Activity feed: keep last 50 events
async function addEvent(userId: string, event: string): Promise<void> {
  const key = \`feed:\${userId}\`;
  await redis.lpush(key, event);
  await redis.ltrim(key, 0, 49);
}

async function getRecentEvents(userId: string, n = 10): Promise<string[]> {
  return redis.lrange(\`feed:\${userId}\`, 0, n - 1);
}

async function processJob(job: object) { /* ... */ }`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Polling with LPOP instead of using BLPOP',
      wrong: 'while(true) { const job = await redis.lpop("queue"); if (job) process(job); await sleep(100); }',
      right: 'const result = await redis.blpop("queue", 0);',
      explanation: 'Polling wastes CPU and adds up to 100ms latency per job. BLPOP blocks the connection until a job is available, then returns immediately — zero extra latency, no wasted cycles.',
    },
    {
      title: 'Using LRANGE 0 -1 on long lists in a loop',
      wrong: 'const all = await redis.lrange("events", 0, -1); // 1M elements',
      right: 'const page = await redis.lrange("events", 0, 99); // paginate',
      explanation: 'LRANGE 0 -1 on a million-element list transfers all data over the network and loads it into memory at once. Paginate using ranges or use SCAN-like iteration.',
    },
    {
      title: 'Using the same Redis connection for BLPOP and regular commands',
      wrong: 'redis.blpop("queue", 0);\nredis.get("key"); // queued behind the blocking command',
      right: 'const blockingRedis = new Redis();\nblockingRedis.blpop("queue", 0);',
      explanation: 'BLPOP holds the connection until data arrives. Any other commands sent on the same connection are queued and block too. Use a separate connection for blocking operations.',
    },
  ];

  challenge: Challenge = {
    title: 'Priority Job Queue',
    language: 'typescript',
    description: 'Implement a two-priority job queue. `pushJob(priority, job)` should push to `queue:high` or `queue:low` based on priority. `nextJob()` should use BLPOP to pop from `queue:high` first, then `queue:low`, with a 5-second timeout.',
    hints: [
      'BLPOP accepts multiple keys — it pops from the first non-empty list',
      'Return null if the timeout expires with no job available',
    ],
    starterCode: `import Redis from 'ioredis';
const redis = new Redis();

async function pushJob(priority: 'high' | 'low', job: object): Promise<void> {}
async function nextJob(): Promise<object | null> {}`,
    solution: `import Redis from 'ioredis';
const redis = new Redis();

async function pushJob(priority: 'high' | 'low', job: object): Promise<void> {
  await redis.rpush(\`queue:\${priority}\`, JSON.stringify(job));
}

async function nextJob(): Promise<object | null> {
  const result = await redis.blpop('queue:high', 'queue:low', 5);
  if (!result) return null;
  return JSON.parse(result[1]);
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the time complexity of LPUSH and RPUSH?',
      options: ['O(N) where N is list length', 'O(log N)', 'O(1)', 'O(N) where N is the number of pushed elements'],
      answer: 2,
      explanation: 'LPUSH and RPUSH are O(1) for each element pushed to the head or tail of a doubly-linked list. The total is O(N) for N elements in one call, but each individual push is constant time.',
    },
    {
      q: 'Which command implements an atomic "pop and push to another list"?',
      options: ['RPOPLPUSH (deprecated)', 'LMOVE src dst LEFT|RIGHT LEFT|RIGHT', 'LMOVE is not atomic', 'BLPOP + RPUSH'],
      answer: 1,
      explanation: 'LMOVE (Redis 6.2+) atomically moves an element from one list to another. The deprecated RPOPLPUSH is equivalent to LMOVE src dst RIGHT LEFT.',
    },
    {
      q: 'How does BLPOP differ from LPOP?',
      options: ['BLPOP returns multiple elements; LPOP returns one', 'BLPOP blocks until an element is available or timeout is reached; LPOP returns nil immediately on empty list', 'BLPOP works on right side; LPOP on left side', 'There is no difference'],
      answer: 1,
      explanation: 'BLPOP key [key...] timeout blocks if all specified lists are empty, waiting up to timeout seconds for an element. Timeout 0 blocks indefinitely. Perfect for producer-consumer queues without polling.',
    },
    {
      q: 'What makes Redis lists suitable for a message queue?',
      options: ['Lists support message deduplication', 'LPUSH/RPOP (or RPUSH/LPOP) provides FIFO queue semantics; BLPOP enables blocking consumer without polling', 'Lists have built-in message persistence across restarts', 'Lists support publish-subscribe patterns'],
      answer: 1,
      explanation: 'Producer: RPUSH queue message. Consumer: BLPOP queue 0 (blocking dequeue). This gives a reliable FIFO queue. For advanced features (consumer groups, redelivery), use Redis Streams instead.',
    },
    {
      q: 'What does LINSERT do?',
      options: ['Inserts at the beginning of a list', 'Inserts an element before or after a pivot element in a list', 'Inserts multiple elements atomically', 'Sets an element at a specific index'],
      answer: 1,
      explanation: 'LINSERT key BEFORE|AFTER pivot element scans the list for the pivot value and inserts the element before or after it. O(N) operation. For index-based insertion use LSET (sets existing index) — lists are not designed for random inserts.',
    },
    {
      q: 'What memory encoding does Redis use for small lists?',
      options: ['skiplist', 'hashtable', 'quicklist with listpack nodes', 'linkedlist'],
      answer: 2,
      explanation: 'Redis lists use quicklist: a doubly-linked list of listpack (formerly ziplist) nodes. Small lists (< list-max-listpack-size entries of small values) use a single listpack node — very memory-efficient. Larger lists split into multiple nodes.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do I implement a capped activity feed with Redis lists?',
      a: 'LPUSH feed:userId newEvent then LTRIM feed:userId 0 N-1. The LTRIM keeps only the N most recent events. This is O(1) amortised — LTRIM removes from the tail of the list, which is constant time for doubly-linked lists.',
    },
    {
      q: 'What is the difference between LPUSH and RPUSH?',
      a: '<strong>LPUSH</strong> adds elements to the head (left) of the list. <strong>RPUSH</strong> adds to the tail (right). Multiple elements: LPUSH key a b c adds c then b then a (result: [c, b, a, ...]). Queue: RPUSH + LPOP. Stack: LPUSH + LPOP. LPUSHX/RPUSHX only push if key already exists.',
    },
    {
      q: 'How do you implement a reliable queue with Redis lists?',
      a: 'Producer: <code>RPUSH queue task</code>. Consumer: <code>BRPOPLPUSH queue processing 0</code> (atomically moves to processing list while blocking). On success: <code>LREM processing 1 task</code>. On failure: tasks remain in processing and can be recovered. This pattern is safer than BLPOP alone — tasks are not lost if consumer crashes.',
    },
    {
      q: 'What is LPOS and when do you use it?',
      a: 'LPOS key element [RANK rank] [COUNT count] finds positions of an element in a list. Returns index (0-based) or array of indices. RANK skips first N-1 matches. COUNT 0 returns all occurrences. Useful for finding an element without scanning manually. Redis 6.0.6+.',
    },
    {
      q: 'What is the quicklist encoding in Redis lists?',
      a: 'Redis lists use <strong>quicklist</strong>: a linked list of listpack nodes. Small lists use a single listpack node. As the list grows, it splits into multiple listpack nodes. This balances memory efficiency (listpack is compact) with operation performance. Configure node size with <code>list-max-listpack-size</code>.',
    },
    {
      q: 'What is the difference between LRANGE and LINDEX?',
      a: 'LRANGE key start stop returns all elements from index start to stop (inclusive, negative indices from end). LINDEX key index returns the single element at a specific index. LLEN returns list length. LRANGE 0 -1 returns all elements. For large lists, LRANGE on arbitrary ranges is O(N) — consider using streams for large ordered datasets.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Redis lists are doubly-linked: O(1) push/pop at either end — use RPUSH+BLPOP for queues, LPUSH+LTRIM for capped activity feeds.',
    mustKnow: [
      'LPUSH/RPUSH O(1); LRANGE O(N) — paginate large lists',
      'BLPOP for blocking consumers — dedicated connection required',
      'LMOVE for atomic reliable-queue patterns (pop-and-push)',
      'LTRIM for capped lists — keeps last N items (circular buffer)',
      'Lists use listpack encoding for small sizes, quicklist for large',
    ],
    interviewFocus: [
      'Why use BLPOP instead of polling with LPOP?',
      'How do you implement a reliable job queue where crashed workers don\'t lose jobs?',
      'LRANGE time complexity and pagination approach',
      'Difference between a queue and stack using Redis lists',
    ],
  };
}
