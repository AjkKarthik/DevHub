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

@Component({
  selector: 'app-kafka-streams',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './kafka-streams.html',
  styleUrl: './kafka-streams.scss'
})
export class KafkaStreams {
  readonly quickRef: QuickRefItem[] = [
    { name: 'KStream', type: 'keyword', desc: 'Unbounded, record-by-record stream; each record independent' },
    { name: 'KTable', type: 'keyword', desc: 'Changelog stream; latest value per key (materialized view)' },
    { name: 'GlobalKTable', type: 'keyword', desc: 'KTable replicated to all instances; useful for enrichment joins' },
    { name: 'Windowing', type: 'keyword', desc: 'Group records in tumbling, hopping, or session windows for aggregation' },
    { name: 'State Store', type: 'keyword', desc: 'Local RocksDB store for aggregation; fault-tolerant via changelog topic' },
    { name: 'Topology', type: 'keyword', desc: 'DAG of stream processing steps (source → processor → sink)' },
    { name: 'KSQL / ksqlDB', type: 'keyword', desc: 'SQL interface on top of Kafka Streams for stream queries' },
    { name: 'changelog topic', type: 'keyword', desc: 'Internal Kafka topic backing a state store for recovery' },
  ];

  readonly theory: TheoryPoint[] = [
    {
      heading: 'KStream vs KTable',
      points: [
        'KStream models an unbounded sequence of events. Every record is meaningful in isolation (clicks, logins, purchases).',
        'KTable models the latest state per key. Duplicate keys update (upsert) rather than append — think of it as a materialised view.',
        'Joining KStream with KTable: stream records are enriched with the latest table value for their key.',
        'KTable is backed by a compacted changelog topic; only the latest value per key is retained.',
      ]
    },
    {
      heading: 'Windowed Aggregations',
      points: [
        'Tumbling windows: fixed, non-overlapping time windows (e.g., 1-minute buckets). No overlap.',
        'Hopping windows: fixed-size windows that advance by a smaller step (e.g., 5-min window, 1-min advance). Records may appear in multiple windows.',
        'Session windows: gap-based grouping — records within inactivity-gap of each other form a session.',
        'Results are emitted as windows close. Late records can update already-emitted windows within a grace period.',
      ]
    },
    {
      heading: 'ksqlDB: SQL on Streams',
      points: [
        'ksqlDB provides a SQL-like interface to create streams, tables, and queries over Kafka topics.',
        'CREATE STREAM builds a KStream; CREATE TABLE builds a KTable from a compacted topic.',
        'Persistent queries run continuously and write results to output topics.',
        'Pull queries let you query the current state of a materialized table synchronously.',
      ]
    },
    {
      heading: 'Stream-Table Duality in Kafka Streams',
      points: [
        'A stream can be interpreted as a sequence of changes to a table (each record is an insert/update/delete), while a table can be interpreted as the latest snapshot of a stream — this duality underlies how KStream and KTable interoperate within the same Kafka Streams application.',
        'A KTable is essentially a compacted, continuously-updated view built from a stream of changes — aggregating a KStream into a KTable produces a queryable "current state" representation from what was originally an unbounded sequence of events.',
        'Joining a KStream with a KTable (stream-table join) is a common pattern for enriching each incoming event with the latest known state of a related entity, such as enriching an order event with the customer\'s current profile data.',
        'Understanding this duality clarifies why certain operations are only available on one type — aggregation naturally produces a KTable (a stateful current view), while windowed joins between two streams naturally produce another stream (a sequence of join results over time).',
      ],
    },
    {
      heading: 'State Stores and Fault Tolerance in Kafka Streams',
      points: [
        'Kafka Streams maintains local state (for aggregations, joins) in embedded RocksDB instances co-located with each stream processing task, giving low-latency local access to state without a round-trip to an external database.',
        'Each state store is backed by a compacted Kafka changelog topic — if a stream processing instance fails, its state can be fully rebuilt on another instance by replaying the changelog topic, providing fault tolerance without manual backup/restore.',
        'Standby replicas (pre-warmed copies of state stores on other instances) reduce failover time by having a warm replica ready to take over immediately, rather than needing to replay the entire changelog from scratch after a failure.',
        'Interactive queries let external applications query a running Kafka Streams application\'s local state directly, avoiding the need to export state to a separate database purely for read access from other services.',
      ],
    },
  ];

  readonly codeTabs: CodeTab[] = [
    {
      label: 'Filter & Map (kafkajs)',
      language: 'typescript',
      code: `import { Kafka } from 'kafkajs';

// Simple stream processing: filter high-value orders, enrich, forward
const kafka    = new Kafka({ brokers: ['localhost:9092'] });
const consumer = kafka.consumer({ groupId: 'order-enricher' });
const producer = kafka.producer({ idempotent: true });

await consumer.connect();
await producer.connect();
await consumer.subscribe({ topic: 'raw-orders' });

await consumer.run({
  eachMessage: async ({ message }) => {
    const order = JSON.parse(message.value!.toString());

    // Filter: only process high-value orders
    if (order.total < 100) return;

    // Map/Enrich
    const enriched = {
      ...order,
      tier:      order.total > 500 ? 'premium' : 'standard',
      processedAt: new Date().toISOString(),
    };

    // Sink: write to output topic
    await producer.send({
      topic: 'enriched-orders',
      messages: [{ key: message.key, value: JSON.stringify(enriched) }],
      acks: -1,
    });
  },
});`,
    },
    {
      label: 'Windowed Count (Java Streams DSL)',
      language: 'typescript',
      code: `// Java Kafka Streams DSL example (shown as pseudocode in TypeScript style)
// In production, use the Java or Scala Kafka Streams library

/*
StreamsBuilder builder = new StreamsBuilder();

KStream<String, PageView> views = builder.stream("page-views");

// Count views per userId in 1-minute tumbling windows
views
  .groupByKey()
  .windowedBy(TimeWindows.ofSizeWithNoGrace(Duration.ofMinutes(1)))
  .count()
  .toStream()
  .foreach((windowedKey, count) -> {
    System.out.println(
      windowedKey.key() + " views: " + count +
      " window: " + windowedKey.window().startTime()
    );
  });

KafkaStreams streams = new KafkaStreams(builder.build(), config);
streams.start();
*/

// Node.js alternative: manual windowing with kafkajs
const windows = new Map<string, { count: number; start: number }>();
const WINDOW_MS = 60_000;

async function processPageView(userId: string, ts: number) {
  const key = \`\${userId}:\${Math.floor(ts / WINDOW_MS)}\`;
  const w   = windows.get(key) ?? { count: 0, start: Math.floor(ts / WINDOW_MS) * WINDOW_MS };
  w.count++;
  windows.set(key, w);
  console.log(\`User \${userId}: \${w.count} views in window starting \${new Date(w.start).toISOString()}\`);
}`,
    },
    {
      label: 'ksqlDB',
      language: 'typescript',
      code: `-- ksqlDB (SQL syntax)

-- 1. Create a stream over a Kafka topic
CREATE STREAM orders_stream (
  order_id VARCHAR,
  user_id  VARCHAR,
  total    DOUBLE,
  ts       BIGINT
) WITH (
  kafka_topic   = 'orders',
  value_format  = 'JSON',
  timestamp     = 'ts'
);

-- 2. Filter and aggregate: revenue per user in 5-minute windows
CREATE TABLE user_revenue AS
  SELECT
    user_id,
    WINDOWSTART AS window_start,
    SUM(total)  AS total_revenue,
    COUNT(*)    AS order_count
  FROM orders_stream
    WINDOW TUMBLING (SIZE 5 MINUTES)
  WHERE total > 0
  GROUP BY user_id
  EMIT CHANGES;

-- 3. Pull query: current state for a specific user
SELECT * FROM user_revenue WHERE user_id = 'u123';

-- 4. Push query: continuous output of new results
SELECT * FROM user_revenue EMIT CHANGES;`,
    },
  ];

  readonly mistakes: CommonMistake[] = [
    {
      title: 'Using KStream when KTable semantics are needed',
      wrong: `// KStream appends — sending same user_id twice gives 2 records
// Table query would show outdated data
CREATE STREAM user_profiles (user_id VARCHAR KEY, email VARCHAR)
WITH (kafka_topic='user-profiles', value_format='JSON');`,
      right: `-- KTable upserts — latest profile per user_id
CREATE TABLE user_profiles (user_id VARCHAR PRIMARY KEY, email VARCHAR)
WITH (kafka_topic='user-profiles', value_format='JSON', key_format='KAFKA');`,
      explanation: 'Use KTable when you want the latest value per key (user profile, product price). Use KStream when each event is independently meaningful (clicks, purchases).'
    },
    {
      title: 'Ignoring late data in windowed aggregations',
      wrong: `// Window closes, but late records arrive 2 minutes later
// Default grace=0 — late records dropped silently`,
      right: `// Java Kafka Streams: add grace period
TimeWindows.ofSizeAndGrace(Duration.ofMinutes(1), Duration.ofMinutes(2))`,
      explanation: 'Streaming data arrives out of order. Configure a grace period to allow late records to update already-closed windows, at the cost of delayed finalization.'
    },
    {
      title: 'Blocking eachMessage with heavy stateful aggregation',
      wrong: `eachMessage: async ({ message }) => {
  // Expensive in-memory aggregation on every message
  globalState[key] = merge(globalState[key], message);
  if (shouldFlush()) await flushToDatabase(globalState);
}`,
      right: `// Use Kafka Streams state stores (RocksDB) for fault-tolerant, scalable state
// Or micro-batch with eachBatch and flush periodically`,
      explanation: 'In-memory state in a kafkajs consumer is lost on restart and does not scale. Use Kafka Streams state stores or an external store with periodic checkpointing.'
    },
    {
      title: 'Joining streams without co-partitioning',
      wrong: `// orders topic: 6 partitions, users topic: 3 partitions
// Stream-stream join across different partition counts fails`,
      right: `// Ensure both topics have the same number of partitions
// and the same partitioning logic (same key serializer)
// Both keyed by the same join key (userId)`,
      explanation: 'Kafka Streams joins require both topics to be co-partitioned: same number of partitions, same key type, and same partitioning strategy.'
    },
  ];

  readonly challenge: Challenge = {
    title: 'Rolling 5-Minute Revenue Counter',
    language: 'typescript',
    description: 'Build a kafkajs consumer that reads "orders" topic messages (each has userId and total). Maintain a rolling 5-minute window count of total revenue per userId. Every 30 seconds, log the current window totals and prune expired windows.',
    hints: [
      'Use a Map<string, {total, windowStart}> keyed by userId+windowBucket',
      'windowBucket = Math.floor(Date.now() / 300000)',
      'Prune entries where windowStart < Date.now() - 300000',
    ],
    starterCode: `import { Kafka } from 'kafkajs';

const windows = new Map<string, { total: number; windowStart: number }>();
const WINDOW_MS = 5 * 60 * 1000;

async function startCounter() {
  const kafka    = new Kafka({ brokers: ['localhost:9092'] });
  const consumer = kafka.consumer({ groupId: 'revenue-counter' });
  // TODO: consume orders, maintain window, log every 30s
}`,
    solution: `import { Kafka } from 'kafkajs';

const windows = new Map<string, { total: number; windowStart: number }>();
const WINDOW_MS = 5 * 60 * 1000;

function getWindowKey(userId: string): string {
  const bucket = Math.floor(Date.now() / WINDOW_MS);
  return \`\${userId}:\${bucket}\`;
}

function pruneExpired() {
  const cutoff = Date.now() - WINDOW_MS;
  for (const [k, v] of windows.entries()) {
    if (v.windowStart < cutoff) windows.delete(k);
  }
}

async function startCounter() {
  const kafka    = new Kafka({ brokers: ['localhost:9092'] });
  const consumer = kafka.consumer({ groupId: 'revenue-counter' });

  await consumer.connect();
  await consumer.subscribe({ topic: 'orders' });

  setInterval(() => {
    pruneExpired();
    console.log('--- 5-min window revenue ---');
    for (const [k, v] of windows.entries()) {
      console.log(k, '→ $' + v.total.toFixed(2));
    }
  }, 30_000);

  await consumer.run({
    eachMessage: async ({ message }) => {
      const { userId, total } = JSON.parse(message.value!.toString());
      const key = getWindowKey(userId);
      const w   = windows.get(key) ?? {
        total: 0,
        windowStart: Math.floor(Date.now() / WINDOW_MS) * WINDOW_MS,
      };
      w.total += total;
      windows.set(key, w);
    },
  });
}`,
  };

  readonly quiz: QuizQuestion[] = [
    { q: 'What is the key difference between KStream and KTable?', options: ['KStream is faster', 'KTable upserts; KStream appends', 'KStream uses more memory', 'KTable cannot be joined'], answer: 1, explanation: 'KStream appends every record; KTable upserts, keeping only the latest value per key — it models current state.' },
    { q: 'Which window type is appropriate for non-overlapping fixed-size time buckets?', options: ['Session window', 'Hopping window', 'Tumbling window', 'Sliding window'], answer: 2, explanation: 'Tumbling windows are fixed-size and non-overlapping, e.g., 1-minute buckets with no overlap.' },
    { q: 'What backs a Kafka Streams state store for fault tolerance?', options: ['External Redis cache', 'ZooKeeper znodes', 'An internal changelog Kafka topic', 'Consumer group offsets'], answer: 2, explanation: 'State stores are backed by a changelog topic. On restart, the store is rebuilt by replaying the changelog.' },
    { q: 'What does EMIT CHANGES do in ksqlDB?', options: ['Runs a one-time query', 'Runs a continuous push query streaming updates', 'Deletes the stream', 'Compacts the underlying topic'], answer: 1, explanation: 'EMIT CHANGES turns a ksqlDB query into a push query that continuously streams results as new data arrives.' },
    { q: 'What is a GlobalKTable, and how does it differ from a regular KTable?', options: ['They are identical — GlobalKTable is just a deprecated name', 'A GlobalKTable replicates the FULL topic data to every stream task instance (not partitioned), enabling joins without requiring co-partitioning; a regular KTable is partitioned like the source topic', 'A GlobalKTable can only be used for windowed aggregations', 'A GlobalKTable is stored in memory only, never persisted to a state store'], answer: 1, explanation: 'A regular KTable is partitioned the same way as its source topic — joining it with a KStream requires both to be co-partitioned (same key, same partition count) so matching keys land on the same task. A GlobalKTable instead loads the ENTIRE topic\'s data onto every task instance, trading higher memory use for the ability to join against small reference/lookup tables (e.g. a product catalog) without needing co-partitioning at all.' },
    { q: 'What is a state store in Kafka Streams and how is it fault-tolerant?', options: ['An in-memory cache cleared on restart', 'A local RocksDB store backed by a Kafka changelog topic for recovery', 'A shared database all stream tasks write to', 'An S3 bucket for state snapshots'], answer: 1, explanation: 'Kafka Streams uses RocksDB (or in-memory) stores locally per task, backed by a Kafka changelog topic. On restart, the store is rebuilt from the changelog — fault-tolerant without external coordination.' },
  ];

  readonly qna: QnaItem[] = [
    { q: 'What is the difference between Kafka Streams and ksqlDB?', a: 'Kafka Streams is a Java client library embedded in your application. ksqlDB is a standalone service with a SQL interface. Both compile to the same stream processing topology. Use ksqlDB for rapid prototyping and SQL familiarity; use Kafka Streams for custom logic and language flexibility.' },
    { q: 'How does Kafka Streams handle failures?', a: 'On restart, a Streams application rebuilds local state stores from their changelog topics and resumes from committed offsets. With standby replicas configured, a standby instance keeps a warm copy so failover is near-instant.' },
    { q: 'Can I do stateful processing in Node.js with kafkajs?', a: 'Yes, but kafkajs has no built-in state store. You manage state yourself (in-memory Map, Redis, or a database). For complex stateful processing (windowing, joins), use Kafka Streams (Java/Scala) or ksqlDB rather than implementing it manually.' },
    { q: 'How does windowed aggregation work in Kafka Streams?', a: 'Kafka Streams supports: <strong>Tumbling windows</strong> (fixed, non-overlapping — count events per 5-minute window), <strong>Hopping windows</strong> (fixed size, overlapping — 5-min window every 1 min), <strong>Session windows</strong> (dynamic, gap-based — group events within inactivity gap). Aggregation results are emitted when the window closes or on late arrival (grace period).' },
    { q: 'What is the Kafka Streams processor topology?', a: 'A topology defines the stream processing graph: <strong>Source processors</strong> (read from Kafka topics), <strong>Stream processors</strong> (apply transformations: map, filter, join, aggregate), <strong>Sink processors</strong> (write to Kafka topics). Topologies are compiled to tasks distributed across stream threads. Use the DSL for common patterns; Processor API for custom logic.' },
    { q: 'How do you test Kafka Streams applications?', a: '<strong>TopologyTestDriver</strong>: unit-test a topology without a real Kafka cluster. Create test input records with TestInputTopic, read output with TestOutputTopic. Verify state stores directly. Fast, deterministic — no timing issues. For integration tests, use EmbeddedKafka (Testcontainers with Kafka image) with a real topology running against test topics.' },
  ];

  readonly revision: RevisionSummary = {
    oneLiner: 'KStream=event log (append), KTable=latest state (upsert); windows aggregate over time; ksqlDB adds SQL.',
    mustKnow: [
      'KStream: each record is an event; KTable: latest value per key (materialised view)',
      'Join KStream + KTable to enrich events with current entity state',
      'Tumbling: fixed non-overlapping; Hopping: overlapping; Session: gap-based',
      'State stores backed by changelog topics — fault-tolerant and rebuildable',
      'ksqlDB: CREATE STREAM/TABLE + EMIT CHANGES for continuous push queries',
      'Co-partitioning required for stream-stream joins (same partition count + key)',
    ],
    interviewFocus: [
      'KStream vs KTable: when each is appropriate with real examples',
      'Windowing types: tumbling vs hopping vs session, and their trade-offs',
      'State store fault tolerance via changelog topics',
      'ksqlDB vs Kafka Streams: choosing between SQL and code',
    ],
  };
}
