import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-kafka-ka-parts',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './adding-partitions-remaps-keys.html',
  styleUrl: './adding-partitions-remaps-keys.scss'
})
export class AddingPartitionsRemapsKeysSubtopic {
  topicLabel = 'Kafka Architecture';
  topicRoute = '/messaging/kafka-architecture';

  theory: TheoryPoint[] = [
    {
      heading: 'Why "start small and add more later" is not free',
      points: [
        'The first mistake block said to start with 6 to 12 partitions and increase them when throughput demands it. Kafka lets you add partitions to a topic, but the operations documentation attaches a warning: adding partitions does not change the partitioning of existing data, so it can disturb consumers that rely on that partitioning.',
        'For keyed records the partition is chosen as a hash of the key modulo the number of partitions. Change the partition count and the same key can hash to a different partition from then on, while its older records stay where they were.',
        'Per-key ordering only holds within one partition. After the change, an old event for a key sits on the old partition and a new one on the new partition, and consumers read partitions independently, so the order they see them in is no longer guaranteed.'
      ]
    },
    {
      heading: 'What follows for capacity planning',
      points: [
        'Kafka does not support reducing the number of partitions for a topic, so over-partitioning cannot be undone either. The page\'s warning against 200 partitions still stands; the missing half is that under-partitioning a keyed topic is expensive to fix.',
        'For topics where per-key order matters, size the partition count with growth headroom up front. When you must change it, the safer route is usually a new topic with the target count and a controlled migration, rather than altering the live one.',
        'For unkeyed topics, or topics where per-key order does not matter, adding partitions later is much less risky.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Model: keys move when the count changes',
      language: 'typescript',
      code: `// Illustrative hash (Kafka clients use murmur2, the effect is the same).
function hash(s: string): number {
  let h = 0x811c9dc5;
  for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 0x01000193) >>> 0; }
  return h;
}
const partitionFor = (key: string, n: number) => hash(key) % n;

const keys = ['order-101', 'order-102', 'order-103', 'order-104',
              'order-105', 'order-106', 'order-107', 'order-108'];

const before = keys.map(k => partitionFor(k, 6));   // topic with 6 partitions
const after  = keys.map(k => partitionFor(k, 8));   // after altering it to 8

console.log(before.join(','));   // 4,5,0,1,2,3,4,1
console.log(after.join(','));    // 2,7,4,1,6,3,0,5
console.log(keys.filter((_, i) => before[i] !== after[i]).length, 'of', keys.length, 'keys moved');
// 6 of 8 keys moved: order-101 was on partition 4 and its next event goes to partition 2`
    },
    {
      label: 'Adding partitions with kafkajs',
      language: 'typescript',
      code: `import { Kafka } from 'kafkajs';

const kafka = new Kafka({ clientId: 'ops', brokers: ['localhost:9092'] });
const admin = kafka.admin();
await admin.connect();

// Raises the topic to 8 partitions. Existing records stay where they are, and for
// keyed topics new records for a key may now go to a different partition.
await admin.createPartitions({
  topicPartitions: [{ topic: 'orders', count: 8 }],   // total count, not "add 2"
});

// There is no API to reduce the count: Kafka does not support that.
await admin.disconnect();`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'A keyed <code>orders</code> topic has 6 partitions, and older events for <code>order-101</code> sit on partition 4. You alter the topic to 8 partitions. Using the model above, where does the next <code>order-101</code> event go, where do the older ones stay, and what can go wrong for a consumer that expects one order\'s events in sequence?',
    hint: 'Compare the two partition numbers the model prints for order-101.',
    solution: 'The model maps order-101 to partition 2 after the change. The older events stay on partition 4. A consumer group reads partitions independently, so the new event on partition 2 can be processed before older events on partition 4, and per-order ordering across the change is not guaranteed. To avoid it, size the partition count with headroom up front, or create a new topic with the target count and migrate.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'I can start with few partitions and add more later at no cost.',
      reality: 'Adding partitions does not move existing data, and for keyed topics it changes which partition a key hashes to, which can break per-key ordering across the change.'
    },
    {
      thought: 'If I over-partition, I can reduce the partition count later.',
      reality: 'Kafka does not currently support reducing the number of partitions for a topic, so the count can only go up.'
    },
    {
      thought: 'Adding partitions re-spreads my existing records evenly.',
      reality: 'Existing records stay on their original partitions. Only new records use the new layout, so load can stay skewed toward the old partitions for a while.'
    }
  ];
}
