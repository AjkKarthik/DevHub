import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-kafka-kp-commit',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './manual-commit-needs-offset-plus-one.html',
  styleUrl: './manual-commit-needs-offset-plus-one.scss'
})
export class ManualCommitNeedsOffsetPlusOneSubtopic {
  topicLabel = 'Kafka Producers & Consumers';
  topicRoute = '/messaging/kafka-producers-consumers';

  theory: TheoryPoint[] = [
    {
      heading: 'What the fourth mistake block got wrong',
      points: [
        'The mistake block warned that with <code>autoCommit</code> "the offset is already committed" if the handler throws. With <code>eachMessage</code> in kafkajs that is not how it works: the docs say offsets are committed automatically after processing, and a handler that throws does not get its offset committed, so the default is already at-least-once.',
        'Its "right" version set <code>autoCommit: false</code> and destructured a <code>commitOffsets</code> from the eachMessage payload. That field is not in the payload, which contains only topic, partition, message, heartbeat and pause. The example also never committed anything, so with autoCommit off every restart would reprocess from the last committed offset.',
        'The page\'s own theory point says it right: the committed offset is the next message to process, not the last one processed. A manual commit has to follow that rule.'
      ]
    },
    {
      heading: 'Committing by hand, correctly',
      points: [
        '<code>consumer.commitOffsets()</code> is the lowest-level option: it ignores the auto-commit settings. The kafkajs docs say to store the message offset plus one, so the same message is not consumed again.',
        'Offsets are strings that can exceed the safe integer range, so add one with <code>BigInt</code> rather than <code>Number</code> arithmetic.',
        'Commit after the work succeeds, per message or per group of messages you have finished. Committing before the work is the pattern that can lose messages when the process crashes.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Model: committed offset is the next one to read',
      language: 'typescript',
      code: `// Offsets 0..4 exist. The consumer processed 0, 1 and 2, then restarted.
function resumeFrom(committed: number, total: number) {
  const out: number[] = [];
  for (let o = committed; o < total; o++) out.push(o);
  return out;
}

console.log(resumeFrom(2, 5));   // [ 2, 3, 4 ]  stored the last PROCESSED offset: message 2 runs again
console.log(resumeFrom(3, 5));   // [ 3, 4 ]     stored offset + 1: resumes at the next message`
    },
    {
      label: 'Manual commit in kafkajs',
      language: 'typescript',
      code: `import { Kafka } from 'kafkajs';

const kafka = new Kafka({ clientId: 'app', brokers: ['localhost:9092'] });
const consumer = kafka.consumer({ groupId: 'order-processor' });
await consumer.connect();
await consumer.subscribe({ topic: 'orders' });

await consumer.run({
  autoCommit: false,                         // nothing is committed unless we do it
  eachMessage: async ({ topic, partition, message }) => {
    await riskyWork(message);                // may throw: then no commit happens

    await consumer.commitOffsets([{
      topic,
      partition,
      offset: (BigInt(message.offset) + 1n).toString(),   // the NEXT offset to read
    }]);
  },
});`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'A consumer processed offsets 0, 1 and 2 of a five-message partition (offsets 0 to 4) and stored offset 2 with <code>commitOffsets</code>. After a restart, which messages does it read, and what should it have stored?',
    hint: 'The committed offset is where the consumer starts reading next.',
    solution: 'It reads offsets 2, 3 and 4, so message 2 is processed a second time. It should have stored offset 3 (message offset plus one), after which it resumes at 3 and reads only 3 and 4.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'With <code>autoCommit</code> on, the offset is committed before my handler finishes.',
      reality: 'In kafkajs <code>eachMessage</code> offsets are committed after processing, and a handler that throws is not committed, so the default gives at-least-once processing.'
    },
    {
      thought: 'The <code>eachMessage</code> payload includes a <code>commitOffsets</code> function.',
      reality: 'It provides topic, partition, message, heartbeat and pause. Manual commits go through <code>consumer.commitOffsets()</code> on the consumer itself.'
    },
    {
      thought: 'I should store <code>message.offset</code> when I commit manually.',
      reality: 'Store the message offset plus one. The stored value is where the consumer resumes, so storing the processed offset replays that message after a restart.'
    }
  ];
}
