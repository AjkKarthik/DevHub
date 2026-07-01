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
  selector: 'app-kafka-architecture',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './kafka-architecture.html',
  styleUrl: './kafka-architecture.scss'
})
export class KafkaArchitecture {
  readonly quickRef: QuickRefItem[] = [
    { name: 'Broker', type: 'keyword', desc: 'Kafka server node that stores and serves partitions' },
    { name: 'Topic', type: 'keyword', desc: 'Named stream of records; split into partitions' },
    { name: 'Partition', type: 'keyword', desc: 'Ordered, immutable log segment; unit of parallelism' },
    { name: 'Offset', type: 'keyword', desc: 'Sequential position of a record within a partition' },
    { name: 'Consumer Group', type: 'keyword', desc: 'Set of consumers sharing partition assignments' },
    { name: 'Replication Factor', type: 'keyword', desc: 'Number of broker replicas for fault tolerance (min 3 in prod)' },
    { name: 'Leader / Follower', type: 'keyword', desc: 'Leader handles reads/writes; followers replicate and failover' },
    { name: 'ZooKeeper / KRaft', type: 'keyword', desc: 'Cluster metadata coordination; KRaft (built-in) replaces ZK from Kafka 3.3+' },
  ];

  readonly theory: TheoryPoint[] = [
    {
      heading: 'Topics and Partitions',
      points: [
        'A topic is an ordered log of records. It is divided into partitions for parallelism.',
        'Each partition is an append-only, ordered sequence. Records within a partition are assigned a monotonically increasing offset.',
        'Partitions are distributed across brokers. More partitions = more parallelism but more overhead.',
        'Ordering is guaranteed within a partition; across partitions it is not.',
      ]
    },
    {
      heading: 'Replication and Fault Tolerance',
      points: [
        'Each partition has a leader broker and follower replicas. Producers write to the leader; followers sync asynchronously.',
        'If the leader fails, one follower is elected as the new leader. With RF=3, the cluster tolerates 2 broker failures.',
        'In-Sync Replicas (ISR) is the set of followers sufficiently caught up with the leader.',
        'acks=all ensures the producer waits for all ISR replicas to confirm before considering the write successful.',
      ]
    },
    {
      heading: 'Consumer Groups and Offset Management',
      points: [
        'Each partition in a topic is assigned to exactly one consumer within a group — this is how load is distributed.',
        'Multiple consumer groups can read the same topic independently; each tracks its own offset.',
        'Offsets are committed to the __consumer_offsets internal topic, allowing consumers to resume after restart.',
        'Rebalancing occurs when consumers join or leave the group; partitions are reassigned automatically.',
      ]
    },
    {
      heading: 'Log Compaction vs. Retention-Based Deletion',
      points: [
        'Standard Kafka retention deletes messages after a configured time or size limit regardless of content — appropriate for event streams where only recent history matters, like application logs or metrics.',
        'Log compaction instead retains only the LATEST value for each message key, deleting older values for the same key — appropriate for topics representing current state (like a changelog of "current value of account X") rather than a pure event history.',
        'Compacted topics are commonly used to back Kafka Streams\' internal state stores and KTables, since they naturally represent "current state per key" rather than an ever-growing unbounded event log.',
        'Choosing the wrong retention strategy for a topic\'s actual use case — compacting an event-history topic, or time-deleting a current-state topic — silently loses data the consuming application actually needed.',
      ],
    },
    {
      heading: 'Why Kafka Achieves High Throughput',
      points: [
        'Kafka writes sequentially to disk (append-only log) rather than performing random-access writes, which — combined with OS page cache and zero-copy transfer — allows it to achieve throughput closer to sequential disk I/O speeds than typical random-access database throughput.',
        'Batching (producers accumulating multiple messages before sending, consumers fetching multiple records per request) amortizes network round-trip overhead across many messages, significantly improving effective throughput compared to sending one message per request.',
        'Partitioning distributes a topic\'s load across multiple brokers and disks, meaning throughput scales roughly linearly with partition count (up to the limits of the cluster) rather than being bottlenecked by a single machine\'s disk or network capacity.',
        'Kafka\'s zero-copy optimization (transferring data directly from page cache to network socket without copying through application memory) reduces CPU overhead per message, a significant factor at the high message volumes Kafka is designed to handle.',
      ],
    },
  ];

  readonly codeTabs: CodeTab[] = [
    {
      label: 'Admin: Create Topic',
      language: 'typescript',
      code: `import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'my-app',
  brokers: ['broker1:9092', 'broker2:9092', 'broker3:9092'],
});

const admin = kafka.admin();
await admin.connect();

await admin.createTopics({
  topics: [{
    topic: 'orders',
    numPartitions: 6,        // 6 partitions for parallelism
    replicationFactor: 3,   // 3 replicas per partition
    configEntries: [
      { name: 'retention.ms',  value: '604800000' }, // 7 days
      { name: 'cleanup.policy', value: 'delete' },
    ],
  }],
});

const metadata = await admin.fetchTopicMetadata({ topics: ['orders'] });
console.log(JSON.stringify(metadata, null, 2));

await admin.disconnect();`,
    },
    {
      label: 'Producer with acks=all',
      language: 'typescript',
      code: `import { Kafka, CompressionTypes } from 'kafkajs';

const kafka    = new Kafka({ clientId: 'producer', brokers: ['localhost:9092'] });
const producer = kafka.producer({
  allowAutoTopicCreation: false,  // prevent accidental topic creation
  idempotent: true,               // exactly-once send semantics
  maxInFlightRequests: 5,
});

await producer.connect();

await producer.send({
  topic: 'orders',
  acks: -1,                        // -1 = acks from all ISR replicas
  compression: CompressionTypes.GZIP,
  messages: [
    {
      key: 'order-123',            // same key → same partition → ordered
      value: JSON.stringify({ id: 'order-123', total: 149.99 }),
      headers: { source: 'web-app' },
    },
  ],
});

console.log('Sent to orders topic');
await producer.disconnect();`,
    },
    {
      label: 'Consumer Group',
      language: 'typescript',
      code: `import { Kafka, EachMessagePayload } from 'kafkajs';

const kafka    = new Kafka({ clientId: 'consumer', brokers: ['localhost:9092'] });
const consumer = kafka.consumer({ groupId: 'order-processor' });

await consumer.connect();
await consumer.subscribe({ topic: 'orders', fromBeginning: false });

await consumer.run({
  eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
    const order = JSON.parse(message.value!.toString());
    console.log(
      \`Partition \${partition} offset \${message.offset}:\`,
      order.id
    );
    await processOrder(order);
    // Offset committed automatically after eachMessage resolves
  },
});

async function processOrder(order: { id: string; total: number }) {
  console.log('Processing', order.id, 'total:', order.total);
}`,
    },
  ];

  readonly mistakes: CommonMistake[] = [
    {
      title: 'Creating too many partitions upfront',
      wrong: `// 200 partitions for a low-throughput topic
await admin.createTopics({
  topics: [{ topic: 'user-events', numPartitions: 200, replicationFactor: 3 }],
});`,
      right: `// Start with 6-12 partitions; scale up as needed
await admin.createTopics({
  topics: [{ topic: 'user-events', numPartitions: 6, replicationFactor: 3 }],
});`,
      explanation: 'Each partition has overhead (file handles, memory, leader election). Over-partitioning wastes broker resources. Start conservatively and increase when throughput demands it.'
    },
    {
      title: 'Using acks=0 in production (fire and forget)',
      wrong: `await producer.send({
  topic: 'payments',
  acks: 0,   // producer doesn't wait for broker confirmation — data loss risk
  messages: [{ value: JSON.stringify(payment) }],
});`,
      right: `await producer.send({
  topic: 'payments',
  acks: -1,  // wait for all ISR replicas
  messages: [{ value: JSON.stringify(payment) }],
});`,
      explanation: 'acks=0 offers highest throughput but zero durability guarantee. For financial data, always use acks=-1 (all ISR).'
    },
    {
      title: 'Not setting a message key, breaking per-entity ordering',
      wrong: `// Random partition selection — events for same order land on different partitions
await producer.send({ topic: 'orders',
  messages: [{ value: JSON.stringify(order) }] });  // no key`,
      right: `// Same orderId key → same partition → guaranteed order
await producer.send({ topic: 'orders',
  messages: [{ key: order.id, value: JSON.stringify(order) }] });`,
      explanation: 'Without a key, Kafka round-robins across partitions. Events for the same entity can arrive out of order at the consumer.'
    },
    {
      title: 'Ignoring rebalance events causing duplicate processing',
      wrong: `consumer.run({
  eachMessage: async ({ message }) => {
    await longRunningTask(message); // takes 60s
    // consumer might rebalance mid-task; partition reassigned; task replayed
  },
});`,
      right: `consumer.run({
  eachMessage: async ({ message }) => {
    await idempotentTask(message); // safe to replay
    // commit offset only after idempotent processing
  },
});`,
      explanation: 'Rebalances can interrupt processing. Consumers should be idempotent so replayed messages cause no harm.'
    },
  ];

  readonly challenge: Challenge = {
    title: 'Kafka Topic Inspector',
    language: 'typescript',
    description: 'Using kafkajs Admin API, write a function that prints topic metadata (partitions, leaders, replicas, ISR) for a given topic name. Then list all consumer groups and their lag for that topic.',
    hints: [
      'admin.fetchTopicMetadata returns partition metadata',
      'admin.fetchOffsets and admin.fetchTopicOffsetsByTimestamp help calculate lag',
      'Consumer group offsets via admin.fetchOffsets({ groupId, topics })',
    ],
    starterCode: `import { Kafka } from 'kafkajs';

async function inspectTopic(topicName: string) {
  const kafka = new Kafka({ brokers: ['localhost:9092'] });
  const admin = kafka.admin();
  await admin.connect();
  // TODO: print partition metadata and consumer group lag
  await admin.disconnect();
}`,
    solution: `import { Kafka } from 'kafkajs';

async function inspectTopic(topicName: string) {
  const kafka = new Kafka({ brokers: ['localhost:9092'] });
  const admin = kafka.admin();
  await admin.connect();

  // Partition metadata
  const meta = await admin.fetchTopicMetadata({ topics: [topicName] });
  const topic = meta.topics[0];
  console.log(\`Topic: \${topic.name}\`);
  for (const p of topic.partitions) {
    console.log(\`  Partition \${p.partitionId}: leader=\${p.leader}, ISR=[\${p.isr}]\`);
  }

  // Latest offsets per partition
  const latestOffsets = await admin.fetchTopicOffsets(topicName);
  console.log('\\nLatest offsets:');
  for (const o of latestOffsets) {
    console.log(\`  Partition \${o.partition}: offset \${o.offset}\`);
  }

  // Consumer groups
  const groups = await admin.listGroups();
  for (const group of groups.groups) {
    const offsets = await admin.fetchOffsets({ groupId: group.groupId, topics: [topicName] });
    console.log(\`\\nGroup: \${group.groupId}\`);
    for (const t of offsets) {
      for (const p of t.partitions) {
        const latest = latestOffsets.find(o => o.partition === p.partition);
        const lag = latest ? Number(latest.offset) - Number(p.offset) : '?';
        console.log(\`  Partition \${p.partition}: committed=\${p.offset} lag=\${lag}\`);
      }
    }
  }
  await admin.disconnect();
}`,
  };

  readonly quiz: QuizQuestion[] = [
    { q: 'How does Kafka guarantee ordering within a topic?', options: ['Across all partitions', 'Within a single partition only', 'Per consumer group', 'Using timestamps'], answer: 1, explanation: 'Kafka guarantees order within a partition. Across partitions there is no ordering guarantee.' },
    { q: 'What does replication factor 3 mean?', options: ['3 consumers per group', '3 partitions per topic', '3 copies of each partition on different brokers', '3 acks required'], answer: 2, explanation: 'RF=3 means each partition has 3 copies (1 leader + 2 followers) on separate brokers, tolerating 2 broker failures.' },
    { q: 'What is the maximum number of consumers in one group that can actively read from a topic with 4 partitions?', options: ['1', '4', '8', 'Unlimited'], answer: 1, explanation: 'Each partition is assigned to at most one consumer per group. With 4 partitions, 4 consumers is the effective limit; extra consumers are idle.' },
    { q: 'What does setting idempotent=true on a Kafka producer enable?', options: ['Exactly-once delivery to consumers', 'Exactly-once send semantics (no duplicates on retry)', 'Message deduplication at consumer', 'Stronger acks requirement'], answer: 1, explanation: 'Idempotent producer prevents duplicate records from producer retries by assigning a sequence number to each record.' },
    { q: 'What determines message ordering guarantees in Kafka?', options: ['Message timestamps', 'Messages with the same key go to the same partition, ensuring order within that partition', 'Consumer group size', 'Topic replication factor'], answer: 1, explanation: 'Kafka guarantees order only within a partition. All messages with the same key hash to the same partition, ensuring ordered processing per key (e.g., all events for userId 123 are ordered).' },
    { q: 'What is the role of the KRaft controller in Kafka 3.3+?', options: ['Manages consumer group rebalancing only', 'Replaces ZooKeeper for cluster metadata management using Raft consensus', 'Handles message compaction', 'Acts as a proxy for producers'], answer: 1, explanation: 'KRaft (Kafka Raft) replaces ZooKeeper for storing and managing cluster metadata (broker registrations, topic configs, partition assignments) using the Raft consensus algorithm — simpler deployment, faster failover.' },
  ];

  readonly qna: QnaItem[] = [
    { q: 'What replaced ZooKeeper in modern Kafka?', a: 'KRaft (Kafka Raft Metadata mode) was introduced in Kafka 2.8 and became production-ready in 3.3. It replaces ZooKeeper with a built-in Raft-based controller, simplifying deployment and improving metadata scalability.' },
    { q: 'How do I determine the right number of partitions for a topic?', a: 'A common rule: target throughput / throughput per partition. If your topic needs 100 MB/s and each partition can handle ~10 MB/s, use 10+ partitions. Also consider your consumer group size — you can\'t have more active consumers than partitions.' },
    { q: 'What is In-Sync Replica (ISR) and why does it matter for acks=-1?', a: 'ISR is the set of replicas fully caught up with the leader\'s log. With acks=-1, the producer waits for confirmation from all ISR members. If a follower lags too far (replica.lag.time.max.ms), it is removed from ISR, and the write still succeeds without waiting for it.' },
    { q: 'How does Kafka log compaction work and when do you use it?', a: 'Log compaction retains only the latest value per key — older records with the same key are removed during compaction. Enable with <code>cleanup.policy=compact</code>. Use for change-data-capture (CDC), event sourcing where you only need current state, or Kafka as a key-value store. Compaction runs in the background; consumers still read the compacted log.' },
    { q: 'What is the consumer group rebalance protocol and what triggers it?', a: 'Rebalancing redistributes partition ownership among consumers in a group. Triggered by: consumer joins/leaves, consumer heartbeat timeout, topic partition count change, or subscription change. During rebalance, all consumers stop processing (stop-the-world). Incremental Cooperative Rebalancing (Kafka 2.4+) minimizes disruption by only revoking partitions that need to move.' },
    { q: 'How does Kafka achieve high throughput for producers?', a: 'Key optimisations: (1) <strong>Batching</strong>: producers buffer messages (linger.ms, batch.size) and send in batches; (2) <strong>Compression</strong>: snappy/lz4/zstd reduces network I/O; (3) <strong>Sequential I/O</strong>: Kafka appends to partition logs (disk sequential writes are fast); (4) <strong>Zero-copy</strong>: sendfile syscall transfers data from disk to network without userspace copy.' },
  ];

  readonly revision: RevisionSummary = {
    oneLiner: 'Kafka: topics → partitions → ordered log; consumer groups for parallel consumption; replicas for fault tolerance.',
    mustKnow: [
      'Topic split into partitions; order guaranteed within partition, not across',
      'Consumer group: each partition assigned to one consumer; more consumers than partitions → idle consumers',
      'Replication factor: RF=3 → 1 leader + 2 followers; tolerates 2 broker failures',
      'acks=-1 (all ISR) for durability; acks=0 for fire-and-forget (data loss risk)',
      'Message key → same partition → ordered processing per entity',
      'KRaft replaces ZooKeeper from Kafka 3.3+ for simpler cluster management',
    ],
    interviewFocus: [
      'Partition count impact on throughput and consumer parallelism',
      'ISR and acks: how acks=-1 prevents data loss',
      'Consumer group rebalancing: triggers and impact on processing',
      'Offset management: committed offsets, resume on restart',
    ],
  };
}
