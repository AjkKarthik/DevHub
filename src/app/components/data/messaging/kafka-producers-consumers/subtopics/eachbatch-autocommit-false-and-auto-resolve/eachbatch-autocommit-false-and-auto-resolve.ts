import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-kafka-kp-batch',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './eachbatch-autocommit-false-and-auto-resolve.html',
  styleUrl: './eachbatch-autocommit-false-and-auto-resolve.scss'
})
export class EachbatchAutocommitFalseAndAutoResolveSubtopic {
  topicLabel = 'Kafka Producers & Consumers';
  topicRoute = '/messaging/kafka-producers-consumers';

  theory: TheoryPoint[] = [
    {
      heading: 'The eachBatch example never committed',
      points: [
        'The eachBatch consumer example set <code>autoCommit: false</code> and ended with a comment that offsets are committed for every <code>resolveOffset</code> call when the handler resolves. The quiz said the same: resolve per message and "commit the batch only after all succeed".',
        'kafkajs\'s runner does something different. After the handler returns, it calls its offset auto-commit step, which only commits when <code>autoCommit</code> is true. With it false, resolved offsets are tracked in memory and never sent to the broker unless you call <code>consumer.commitOffsets()</code> yourself.',
        '<code>resolveOffset</code> is bookkeeping, not a commit. The commit rule from the previous subtopic still applies: store the message offset plus one.'
      ]
    },
    {
      heading: 'eachBatchAutoResolve marks the whole batch done',
      points: [
        'The kafkajs option <code>eachBatchAutoResolve</code> defaults to true. When the handler returns without throwing, the runner resolves the last offset of the batch, whatever <code>resolveOffset</code> calls you made.',
        'So the page\'s loop, which exits early with <code>break</code> when <code>isRunning()</code> is false, returns normally. With auto-resolve on and <code>autoCommit</code> true, the offsets of the messages it skipped are treated as done and committed.',
        'For per-message control, set <code>eachBatchAutoResolve: false</code> and resolve and commit only the offsets you actually processed.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Model: what gets resolved and committed',
      language: 'typescript',
      code: `// One batch of offsets 0..4. The loop stops after processing 2 messages (e.g. isRunning() turned false).
function runBatch(
  offsets: number[],
  processCount: number,
  opts: { eachBatchAutoResolve: boolean; autoCommit: boolean },
) {
  let resolved: number | null = null;
  for (let i = 0; i < offsets.length; i++) {
    if (i >= processCount) break;               // early exit: the handler still returns normally
    resolved = offsets[i];                      // resolveOffset(message.offset)
  }
  if (opts.eachBatchAutoResolve) resolved = offsets[offsets.length - 1];  // resolveOffset(batch.lastOffset())
  const committed = opts.autoCommit && resolved !== null ? resolved + 1 : null;
  return { resolved, committed };
}

const offs = [0, 1, 2, 3, 4];
console.log(runBatch(offs, 2, { eachBatchAutoResolve: true,  autoCommit: true }));
// { resolved: 4, committed: 5 }   messages 2, 3, 4 were skipped but count as done
console.log(runBatch(offs, 2, { eachBatchAutoResolve: false, autoCommit: true }));
// { resolved: 1, committed: 2 }   only what was really processed
console.log(runBatch(offs, 5, { eachBatchAutoResolve: false, autoCommit: false }));
// { resolved: 4, committed: null } tracked in memory, never committed`
    },
    {
      label: 'A safe eachBatch consumer',
      language: 'typescript',
      code: `import { Kafka } from 'kafkajs';

const kafka = new Kafka({ clientId: 'batch', brokers: ['localhost:9092'] });
const consumer = kafka.consumer({ groupId: 'batch-processor' });
await consumer.connect();
await consumer.subscribe({ topic: 'user-events' });

await consumer.run({
  autoCommit: false,           // we commit ourselves
  eachBatchAutoResolve: false, // and the batch is not "done" just because the handler returned
  eachBatch: async ({ batch, resolveOffset, heartbeat, isRunning }) => {
    for (const message of batch.messages) {
      if (!isRunning()) break;                       // unprocessed messages stay uncommitted

      await handleEvent(message);
      resolveOffset(message.offset);                 // progress tracking only
      await consumer.commitOffsets([{
        topic: batch.topic,
        partition: batch.partition,
        offset: (BigInt(message.offset) + 1n).toString(),
      }]);
      await heartbeat();
    }
  },
});`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'An <code>eachBatch</code> handler has <code>autoCommit: true</code> and the default <code>eachBatchAutoResolve</code>. A batch holds offsets 0 to 4, and the loop breaks after two messages because <code>isRunning()</code> turned false. Which offset gets committed, and which messages are lost? What changes with <code>eachBatchAutoResolve: false</code>?',
    hint: 'The handler returns normally after the break. Use the model above.',
    solution: 'The handler returns without throwing, so the last offset of the batch (4) is resolved and committed as 5, and messages 2, 3 and 4 are never processed. With eachBatchAutoResolve set to false, only the two resolveOffset calls count: offset 1 is resolved and 2 is committed, so the consumer resumes at message 2.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'With <code>autoCommit: false</code>, <code>resolveOffset</code> is how I commit.',
      reality: 'It only tracks progress. With autoCommit off nothing reaches the broker unless you call <code>consumer.commitOffsets()</code>.'
    },
    {
      thought: 'Breaking out of the batch loop leaves the remaining messages unprocessed and uncommitted.',
      reality: 'By default the handler still returns normally, and <code>eachBatchAutoResolve</code> then resolves the batch\'s last offset, so the skipped messages are treated as done.'
    },
    {
      thought: 'Calling <code>resolveOffset</code> for each message is enough to control which offsets count.',
      reality: 'Only when <code>eachBatchAutoResolve</code> is false. With the default true, the last offset of the batch is resolved after the handler returns regardless.'
    }
  ];
}
