import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-kafka-ka-acks',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './acks-all-needs-min-insync-replicas.html',
  styleUrl: './acks-all-needs-min-insync-replicas.scss'
})
export class AcksAllNeedsMinInsyncReplicasSubtopic {
  topicLabel = 'Kafka Architecture';
  topicRoute = '/messaging/kafka-architecture';

  theory: TheoryPoint[] = [
    {
      heading: 'What acks=all really waits for',
      points: [
        'The page said <code>acks=all</code> ("all ISR replicas") prevents data loss. It waits for every replica currently in the in-sync replica set, and that set can shrink, all the way down to the leader alone.',
        'Apache Kafka\'s own KIP-926 motivation describes it: when the ISR has shrunk to one replica, <code>acks=all</code> behaves like <code>acks=1</code>, even with a replication factor of 3, because the leader is the whole set.',
        'The topic setting <code>min.insync.replicas</code> (default 1) is what forces a minimum. With <code>acks=all</code>, a write is rejected when the ISR is smaller than that number, so the leader cannot quietly acknowledge a record that no follower has.'
      ]
    },
    {
      heading: 'The RF=3 recipe and its cost',
      points: [
        'The usual pairing is replication factor 3, <code>min.insync.replicas=2</code> and <code>acks=all</code>. An acknowledged record then always exists on at least two brokers, and the topic tolerates one replica being down or out of sync.',
        'The trade-off is availability for writes. With two of three brokers gone the ISR is smaller than 2, so producers get a <code>NotEnoughReplicas</code> error. That error is retriable, so a producer keeps retrying rather than failing on the first attempt.',
        'So "RF=3 tolerates 2 broker failures" is true for committed data surviving, but not for continuing to accept durable writes. The page\'s replication bullet, the acks=0 fix, the ISR answer and the revision list now say this.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Model: which writes are acknowledged',
      language: 'typescript',
      code: `// acks=all: the leader waits for the CURRENT ISR, and rejects the write if the ISR
// is smaller than min.insync.replicas.
function produceAcksAll(isr: string[], minIsr: number) {
  if (isr.length < minIsr) return { ok: false, error: 'NotEnoughReplicas' };
  return { ok: true, copiesAtAck: isr.length };
}

console.log(produceAcksAll(['b1', 'b2', 'b3'], 1));  // { ok: true, copiesAtAck: 3 }
console.log(produceAcksAll(['b1'], 1));               // { ok: true, copiesAtAck: 1 }   <- acked with ONE copy
console.log(produceAcksAll(['b1'], 2));               // { ok: false, error: 'NotEnoughReplicas' }
console.log(produceAcksAll(['b1', 'b2'], 2));         // { ok: true, copiesAtAck: 2 }`
    },
    {
      label: 'Setting it up with kafkajs',
      language: 'typescript',
      code: `import { Kafka } from 'kafkajs';

const kafka = new Kafka({ clientId: 'app', brokers: ['broker1:9092', 'broker2:9092', 'broker3:9092'] });

// Topic side: 3 replicas, and require 2 of them in sync for an acks=all write.
const admin = kafka.admin();
await admin.connect();
await admin.createTopics({
  topics: [{
    topic: 'payments',
    numPartitions: 6,
    replicationFactor: 3,
    configEntries: [{ name: 'min.insync.replicas', value: '2' }],
  }],
});
await admin.disconnect();

// Producer side: acks -1 means all in-sync replicas.
const producer = kafka.producer();
await producer.connect();
await producer.send({
  topic: 'payments',
  acks: -1,
  messages: [{ key: 'order-123', value: JSON.stringify({ total: 149.99 }) }],
});`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'A topic has replication factor 3, <code>min.insync.replicas=2</code>, and producers use <code>acks=all</code>. Two of the three brokers fail. Can producers still write, and what happens to records that were already acknowledged?',
    hint: 'Compare the size of the remaining ISR with min.insync.replicas.',
    solution: 'Producers cannot write durably: only one replica is left in the ISR, which is smaller than min.insync.replicas of 2, so the broker rejects the writes with NotEnoughReplicas (a retriable error, so producers keep retrying until a replica returns). Records that were already acknowledged were on at least two brokers when they were acknowledged, so the surviving replica still holds them.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '<code>acks=all</code> guarantees a record is on every replica.',
      reality: 'It waits for the replicas currently in the ISR, and the ISR can shrink to the leader alone. With <code>min.insync.replicas=1</code> the leader can then acknowledge a record no follower has.'
    },
    {
      thought: 'With replication factor 3 the cluster keeps working through 2 broker failures.',
      reality: 'Committed data survives 2 failures, but with <code>acks=all</code> and <code>min.insync.replicas=2</code> writes are rejected once only one replica remains in sync.'
    },
    {
      thought: 'A rejected write with <code>NotEnoughReplicas</code> is lost.',
      reality: 'The producer was not acknowledged, and the error is retriable, so the client retries. Nothing was acknowledged and then dropped; the point of the setting is to refuse the write instead of accepting it under-replicated.'
    }
  ];
}
