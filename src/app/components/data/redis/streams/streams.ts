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
  selector: 'app-redis-streams',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            RevisionCardComponent, PageCompleteComponent],
  templateUrl: './streams.html',
  styleUrl: './streams.scss',
})
export class RedisStreams {
  quickRef: QuickRefItem[] = [
    { name: 'XADD key [MAXLEN ~ n] * field value [...]', type: 'keyword', desc: 'Append an entry; * auto-generates ID; MAXLEN trims to ~n entries' },
    { name: 'XREAD COUNT n BLOCK ms STREAMS key id', type: 'keyword', desc: 'Read up to n entries after id; BLOCK ms waits for new entries ($ = latest)' },
    { name: 'XREADGROUP GROUP g consumer STREAMS key >', type: 'keyword', desc: 'Read undelivered entries from consumer group (> = new messages)' },
    { name: 'XACK key group id [id...]', type: 'keyword', desc: 'Acknowledge processed entries (removes from PEL)' },
    { name: 'XPENDING key group - + count [consumer]', type: 'keyword', desc: 'List pending (unacknowledged) entries' },
    { name: 'XCLAIM key group consumer min-idle-ms id', type: 'keyword', desc: 'Re-assign a stale pending entry to another consumer' },
    { name: 'XAUTOCLAIM key group consumer min-idle-ms start', type: 'keyword', desc: 'Auto-claim idle pending entries (Redis 6.2+)' },
    { name: 'XLEN key', type: 'keyword', desc: 'Number of entries in the stream' },
    { name: 'XRANGE key start end [COUNT n]', type: 'keyword', desc: 'Read a range of entries by ID (- = min, + = max)' },
    { name: 'XGROUP CREATE key group id [MKSTREAM]', type: 'keyword', desc: 'Create a consumer group at a given ID ($ = from now)' },
    { name: 'XTRIM key MAXLEN ~ n', type: 'keyword', desc: 'Trim stream to approximately n entries' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Streams vs Pub/Sub vs Lists',
      points: [
        'Redis Streams are a persistent, ordered log of entries — similar to Kafka topics. Unlike Pub/Sub, messages are stored and can be replayed. Unlike lists, entries have auto-generated IDs and support consumer groups.',
        'Entry IDs are `<milliseconds>-<sequence>` (e.g. `1700000000000-0`). Entries are always appended; the log is append-only and ordered by time.',
        'MAXLEN ~ n uses approximate trimming (faster than exact) — Redis trims to approximately n entries using radix tree node boundaries.',
        'Use Streams when you need: persisted messages, multiple independent consumers, message acknowledgement (at-least-once delivery), or the ability to replay past events.',
        'Use Pub/Sub for ephemeral real-time fanout where message loss is acceptable. Use Lists for simple FIFO queues without consumer group semantics.',
      ],
    },
    {
      heading: 'Consumer Groups',
      points: [
        'XGROUP CREATE stream group id creates a consumer group. id = `$` means the group only sees new messages (not historical); id = `0` means start from the beginning.',
        'XREADGROUP GROUP g consumer STREAMS key > delivers the next undelivered entries to the named consumer and tracks them in the Pending Entry List (PEL).',
        'The PEL tracks every message delivered to a consumer until XACK is called. This enables at-least-once delivery: unacknowledged messages can be re-claimed by other consumers.',
        'XPENDING shows the PEL — entries delivered but not yet acknowledged. Use this to detect stuck consumers.',
        'XCLAIM / XAUTOCLAIM re-assigns idle pending entries to another consumer — essential for handling crashed consumers.',
        'Multiple consumer groups on the same stream are independent — each group sees all messages independently (like independent Kafka consumer groups).',
      ],
    },
    {
      heading: 'Blocking Reads and Backpressure',
      points: [
        'XREAD BLOCK 0 STREAMS key $ blocks indefinitely until a new entry arrives — zero-latency consumer without polling.',
        'XREADGROUP BLOCK ms also supports blocking. Use a short block timeout (e.g. 2000ms) and loop to also check for idle pending entries periodically.',
        'Multiple consumers in a group with XREADGROUP get different entries in round-robin fashion — natural load balancing across worker processes.',
        'For backpressure, combine MAXLEN on XADD with producers that check XLEN before appending — slow down producers when the stream is too large.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Producer',
      language: 'typescript',
      code: `import Redis from 'ioredis';
const redis = new Redis();

// Append an entry to the stream (auto-generate ID with *)
async function publishEvent(type: string, payload: object): Promise<string> {
  const id = await redis.xadd(
    'events',
    'MAXLEN', '~', '10000',  // keep approx 10k entries
    '*',                      // auto-generate ID
    'type', type,
    'payload', JSON.stringify(payload),
    'ts', String(Date.now()),
  );
  return id!; // entry ID like "1700000000000-0"
}

await publishEvent('ORDER_PLACED', { orderId: 'ORD-001', total: 49.99 });
await publishEvent('USER_SIGNUP', { userId: 'usr-42', email: 'user@example.com' });

const length = await redis.xlen('events');
console.log(\`Stream has \${length} entries\`);`,
    },
    {
      label: 'Consumer Group',
      language: 'typescript',
      code: `import Redis from 'ioredis';
const redis = new Redis();

// Create consumer group (once at startup)
try {
  await redis.xgroup('CREATE', 'events', 'processors', '$', 'MKSTREAM');
} catch (e: any) {
  if (!e.message.includes('BUSYGROUP')) throw e; // already exists
}

// Worker consumer loop
async function worker(consumerId: string) {
  while (true) {
    // Read up to 10 new messages, block 2s
    const results = await redis.xreadgroup(
      'GROUP', 'processors', consumerId,
      'COUNT', '10',
      'BLOCK', '2000',
      'STREAMS', 'events', '>',
    ) as Array<[string, Array<[string, string[]]>]> | null;

    if (!results) continue; // timeout — check for pending entries next

    for (const [_stream, entries] of results) {
      for (const [id, fields] of entries) {
        const data = Object.fromEntries(
          fields.reduce<[string, string][]>((acc, f, i) => i % 2 === 0 ? [...acc, [f, fields[i + 1]]] : acc, [])
        );
        try {
          await processEvent(data.type, JSON.parse(data.payload));
          await redis.xack('events', 'processors', id);
        } catch (err) {
          console.error('Failed to process', id, err);
          // leave in PEL for re-claim
        }
      }
    }
  }
}

async function processEvent(type: string, payload: object) {
  console.log('Processing:', type, payload);
}`,
    },
    {
      label: 'Claim Idle Entries',
      language: 'typescript',
      code: `import Redis from 'ioredis';
const redis = new Redis();

// Reclaim entries idle for >30s (crashed consumer recovery)
async function reclaimStaleMessages(consumerId: string) {
  const minIdleMs = 30_000;
  const result = await redis.xautoclaim(
    'events', 'processors', consumerId,
    String(minIdleMs), '0-0', 'COUNT', '50',
  ) as [string, Array<[string, string[]]>];

  const [_nextId, claimed] = result;
  console.log(\`Reclaimed \${claimed.length} stale entries\`);

  for (const [id] of claimed) {
    // process and ack
    await redis.xack('events', 'processors', id);
  }
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Creating consumer group with $ and missing historical events',
      wrong: `// New deployment — want to process all existing events
await redis.xgroup('CREATE', 'events', 'processors', '$', 'MKSTREAM');
// Only sees events AFTER this point — historical events skipped`,
      right: `// Process from beginning:
await redis.xgroup('CREATE', 'events', 'processors', '0', 'MKSTREAM');
// Process only new events:
await redis.xgroup('CREATE', 'events', 'processors', '$', 'MKSTREAM');`,
      explanation: '$ means "only new messages after group creation". If you need to process historical messages (e.g. during initial data migration or replay), create the group with id "0" to start from the beginning.',
    },
    {
      title: 'Not acknowledging messages on processing failure',
      wrong: `for (const [id] of entries) {
  processEvent(id); // if this throws, entry stays in PEL forever
  await redis.xack('events', 'group', id);
}`,
      right: `for (const [id] of entries) {
  try { await processEvent(id); await redis.xack('events', 'group', id); }
  catch { /* leave in PEL; XAUTOCLAIM will re-deliver after idle timeout */ }
}`,
      explanation: 'Messages not acknowledged stay in the PEL indefinitely. Implement a recovery loop using XAUTOCLAIM to re-deliver messages that have been pending beyond a threshold, and implement idempotent processing to handle re-delivery safely.',
    },
    {
      title: 'Not trimming the stream — unbounded memory growth',
      wrong: 'await redis.xadd("events", "*", "type", "click");  // no MAXLEN',
      right: 'await redis.xadd("events", "MAXLEN", "~", "100000", "*", "type", "click");',
      explanation: 'Without MAXLEN, streams grow indefinitely and consume all available memory. Use MAXLEN ~ n (approximate, faster) on XADD or periodic XTRIM to keep the stream bounded.',
    },
  ];

  challenge: Challenge = {
    title: 'Stream Metrics Aggregator',
    language: 'typescript',
    description: 'Write `getStreamStats(streamKey, groupName)` that returns `{ length, pendingCount, consumerCount }` for a stream. Use XLEN for length, XPENDING for pending count, and XINFO GROUPS for consumer count.',
    hints: [
      'redis.xlen(key) → number',
      'redis.xpending(key, group, "-", "+", 1) returns summary with pending count',
      'redis.xinfo("GROUPS", key) returns array of group info objects',
    ],
    starterCode: `import Redis from 'ioredis';
const redis = new Redis();

async function getStreamStats(streamKey: string, groupName: string) {
  // implement here
}`,
    solution: `import Redis from 'ioredis';
const redis = new Redis();

async function getStreamStats(streamKey: string, groupName: string) {
  const [length, pending, groups] = await Promise.all([
    redis.xlen(streamKey),
    redis.xpending(streamKey, groupName, '-', '+', 1),
    redis.xinfo('GROUPS', streamKey),
  ]);
  const groupInfo = (groups as string[][]).find(g => g.includes(groupName));
  const consumerIdx = groupInfo ? groupInfo.indexOf('consumers') : -1;
  const consumerCount = consumerIdx !== -1 ? parseInt(groupInfo![consumerIdx + 1], 10) : 0;
  const pendingCount = Array.isArray(pending) ? (pending as unknown[][])[0]?.[3] as number ?? 0 : 0;
  return { length, pendingCount, consumerCount };
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does XREADGROUP with ">" as the ID mean?',
      options: [
        'Read from the beginning of the stream',
        'Read all entries greater than a specific ID',
        'Read new entries not yet delivered to any consumer in the group',
        'Read the last N entries',
      ],
      answer: 2,
      explanation: '">" is the special ID that means "deliver new, undelivered messages". Any other ID reads from the PEL (pending entries previously delivered to this consumer).',
    },
    {
      q: 'What is the PEL in Redis Streams?',
      options: [
        'Persistent Event Log — the stream file on disk',
        'Pending Entry List — delivered-but-unacknowledged messages per consumer',
        'Primary Entry List — master copy of stream entries',
        'Pub/Sub Event Layer — pub/sub integration for streams',
      ],
      answer: 1,
      explanation: 'The PEL (Pending Entry List) tracks messages delivered to a consumer group consumer but not yet acknowledged with XACK. It enables at-least-once delivery and crash recovery via XCLAIM/XAUTOCLAIM.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do Streams compare to Kafka?',
      a: 'Redis Streams and Kafka share the append-only log model with consumer groups, but differ in scale and features. Redis Streams are in-memory (with optional persistence), have lower latency, and are simpler to operate. Kafka is designed for massive throughput (millions of events/sec), long-term retention, partitioning across brokers, and exactly-once semantics. Use Redis Streams for moderate-volume, low-latency event processing within your existing Redis infrastructure. Use Kafka for high-volume event streaming, multi-datacenter replication, or long-term event sourcing.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Streams are a persistent ordered log with consumer groups — XADD to append, XREADGROUP to distribute, XACK to confirm; XAUTOCLAIM recovers from crashed consumers.',
    mustKnow: [
      'XADD * auto-generates timestamp-based IDs; MAXLEN ~ n trims the stream',
      'Consumer groups: each group sees all messages independently',
      '">" in XREADGROUP means new undelivered messages; other IDs read PEL',
      'XACK removes entry from PEL — must ack after successful processing',
      'XAUTOCLAIM re-delivers entries idle beyond a threshold (crash recovery)',
      'Always trim streams with MAXLEN to prevent unbounded memory growth',
    ],
    interviewFocus: [
      'Streams vs Pub/Sub — when to use each?',
      'How does the PEL enable at-least-once delivery?',
      'What does XAUTOCLAIM do and when would you use it?',
      'How do you handle a crashed consumer in a consumer group?',
    ],
  };
}
