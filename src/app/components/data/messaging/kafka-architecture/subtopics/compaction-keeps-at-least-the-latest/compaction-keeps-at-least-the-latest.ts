import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-kafka-ka-compact',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './compaction-keeps-at-least-the-latest.html',
  styleUrl: './compaction-keeps-at-least-the-latest.scss'
})
export class CompactionKeepsAtLeastTheLatestSubtopic {
  topicLabel = 'Kafka Architecture';
  topicRoute = '/messaging/kafka-architecture';

  theory: TheoryPoint[] = [
    {
      heading: 'A floor, not a promise of one record per key',
      points: [
        'The page said compaction "retains only the latest value" per key. The documented guarantee is weaker and different: the log is guaranteed to keep at least the last state for each key. Older values for a key may still be there.',
        'Confluent\'s log compaction documentation says explicitly that compaction does not guarantee only one record with a given key exists at any time, because compaction timing is non-deterministic.',
        'The active segment, the one currently being written to, is never compacted. So a key can have an older record in a closed segment and a newer one in the active segment until the segment rolls and the cleaner runs again.'
      ]
    },
    {
      heading: 'Two more details worth knowing',
      points: [
        'Consumers that stay caught up with the head of the log see every record as it is written, with sequential offsets. Compaction only rewrites the tail, so "latest value only" describes what a late reader of the compacted log finds, not what a live reader sees.',
        'A record with a null value is a tombstone: it marks the key as deleted. The tombstone itself is kept for <code>delete.retention.ms</code> (24 hours by default) so downstream consumers have time to observe the delete before it is purged.',
        'Do not build logic that assumes exactly one record per key in a compacted topic. Read it as "at least the last value per key" and keep the last value you have seen for each key.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Model: what one compaction pass leaves',
      language: 'typescript',
      code: `type Rec = { key: string; value: string | null; offset: number };

// The cleaner scans closed segments only; the active segment is never touched.
function compact(closed: Rec[], active: Rec[]): Rec[] {
  const latest = new Map<string, number>();
  for (const r of closed) latest.set(r.key, r.offset);          // newest per key, closed part only
  const kept = closed.filter(r => latest.get(r.key) === r.offset);
  return [...kept, ...active];
}

const closed: Rec[] = [
  { key: 'k1', value: 'v1', offset: 0 }, { key: 'k2', value: 'v1', offset: 1 },
  { key: 'k1', value: 'v2', offset: 2 }, { key: 'k1', value: 'v3', offset: 3 },
];
const active: Rec[] = [
  { key: 'k2', value: 'v2', offset: 4 }, { key: 'k1', value: 'v4', offset: 5 },
];

console.log(compact(closed, active).map(r => r.key + ':' + r.value + '@' + r.offset).join('  '));
// k2:v1@1  k1:v3@3  k2:v2@4  k1:v4@5
// Each key still has TWO records: the newer one in the active segment is untouched,
// and the older one in the closed segment survives until a later pass.`
    },
    {
      label: 'Compaction settings and a delete',
      language: 'typescript',
      code: `import { Kafka } from 'kafkajs';

const kafka = new Kafka({ clientId: 'app', brokers: ['localhost:9092'] });
const admin = kafka.admin();
await admin.connect();
await admin.createTopics({
  topics: [{
    topic: 'account-balances',
    numPartitions: 6,
    replicationFactor: 3,
    configEntries: [
      { name: 'cleanup.policy',      value: 'compact' },
      { name: 'delete.retention.ms', value: '86400000' },   // keep tombstones 24 hours (the default)
    ],
  }],
});
await admin.disconnect();

// Deleting a key: send a tombstone (null value) with the same key.
const producer = kafka.producer();
await producer.connect();
await producer.send({ topic: 'account-balances', messages: [{ key: 'acct-42', value: null }] });`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'Using the model above, how many records exist for <code>k1</code> after the compaction pass, and would a consumer that has been reading at the head of the log all along have seen <code>v1</code> and <code>v2</code>?',
    hint: 'One value is in a closed segment, and one is in the active segment.',
    solution: 'k1 still has two records after the pass: v3 in the closed segment and v4 in the active segment. v1 and v2 were removed from the closed segment. A consumer that stayed at the head saw every record as it was written, including v1 and v2, because compaction only affects the older tail of the log.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A compacted topic holds exactly one record per key.',
      reality: 'It guarantees at least the last value per key. Older records can remain until the cleaner reaches them, and the active segment is never compacted, so several records per key can exist at once.'
    },
    {
      thought: 'Compaction rewrites what live consumers see.',
      reality: 'Consumers staying current with the head of the log see every write. Compaction changes the tail, which matters to readers that start from the beginning.'
    },
    {
      thought: 'Sending a null-value record removes the key from the log immediately.',
      reality: 'The tombstone marks the key for deletion and is retained for <code>delete.retention.ms</code> (24 hours by default) so downstream consumers can see the delete, and only then is it purged.'
    }
  ];
}
