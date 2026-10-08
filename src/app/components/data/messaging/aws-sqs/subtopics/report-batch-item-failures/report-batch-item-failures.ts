import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-kafka-sqs-partial-batch',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './report-batch-item-failures.html',
  styleUrl: './report-batch-item-failures.scss'
})
export class ReportBatchItemFailuresSubtopic {
  topicLabel = 'AWS SQS';
  topicRoute = '/messaging/aws-sqs';

  theory: TheoryPoint[] = [
    {
      heading: 'The Default: One Failure Fails the Whole Batch',
      points: [
        'The main page\'s own default behaviour is all-or-nothing: ReceiveMessageCommand can return up to 10 messages in one batch, and if the Lambda handler throws on ANY of them, the entire invocation fails and the WHOLE batch -- including messages that already processed successfully -- becomes visible again for redelivery.',
        'That means a batch of 10 where 9 succeed and 1 fails still redelivers all 10. Without a fix, the 9 successful ones get reprocessed too, which is only safe if every handler is fully idempotent.',
        'This is a real cost even for idempotent handlers: reprocessing 9 already-done messages wastes compute and, on a queue with a low maxReceiveCount, can push perfectly good messages toward the DLQ purely because they keep getting swept up in someone else\'s failure.'
      ]
    },
    {
      heading: 'Reporting Only the Messages That Actually Failed',
      points: [
        'ReportBatchItemFailures is an event source mapping setting (FunctionResponseTypes: [\'ReportBatchItemFailures\']) that changes what the Lambda function\'s RETURN VALUE means -- instead of success/throw being the only signal, the function can name exactly which messages in the batch failed.',
        'The handler returns { batchItemFailures: [{ itemIdentifier: messageId }, ...] } listing only the failed message IDs. Every OTHER message in the batch is treated as successfully processed and deleted immediately.',
        'This directly narrows the blast radius of the main page\'s own "batch is returned to the queue" default -- from the entire batch down to exactly the messages that actually failed, with no change to the queue\'s own redrive policy.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Default batch failure vs. ReportBatchItemFailures',
      language: 'typescript',
      code: `interface SqsRecord { messageId: string; body: string; }

// Default: any thrown error fails the WHOLE invocation.
function processBatchDefault(records: SqsRecord[], processFn: (r: SqsRecord) => void) {
  for (const r of records) {
    processFn(r); // throws -- propagates, aborting the whole handler
  }
  return { deleted: records.map(r => r.messageId) };
}

// With ReportBatchItemFailures: only the named message IDs go back to the queue.
function processBatchWithReporting(records: SqsRecord[], processFn: (r: SqsRecord) => void) {
  const batchItemFailures: { itemIdentifier: string }[] = [];
  const succeeded: string[] = [];
  for (const r of records) {
    try {
      processFn(r);
      succeeded.push(r.messageId);
    } catch {
      batchItemFailures.push({ itemIdentifier: r.messageId });
    }
  }
  return { batchItemFailures, succeeded };
}

const records: SqsRecord[] = [
  { messageId: 'm1', body: 'ok' },
  { messageId: 'm2', body: 'bad' },
  { messageId: 'm3', body: 'ok' },
];
const processFn = (r: SqsRecord) => { if (r.body === 'bad') throw new Error('fail'); };

try {
  processBatchDefault(records, processFn);
} catch (e: any) {
  console.log('Default: entire invocation throws ->', e.message);
  // -- ALL 3 messages return to the queue, including m1 and m3 which already succeeded
}

console.log(JSON.stringify(processBatchWithReporting(records, processFn)));
// {"batchItemFailures":[{"itemIdentifier":"m2"}],"succeeded":["m1","m3"]}
// -- only m2 returns to the queue; m1 and m3 are deleted as successfully processed`
    },
    {
      label: 'Real Lambda handler shape',
      language: 'typescript',
      code: `import { SQSHandler, SQSBatchResponse } from 'aws-lambda';

// Requires FunctionResponseTypes: ['ReportBatchItemFailures'] on the
// event source mapping -- returning batchItemFailures with this NOT
// enabled has no effect; Lambda silently ignores the return value.
export const handler: SQSHandler = async (event): Promise<SQSBatchResponse> => {
  const batchItemFailures: { itemIdentifier: string }[] = [];

  for (const record of event.Records) {
    try {
      await processOrder(JSON.parse(record.body));
    } catch (err) {
      console.error(\`Failed message \${record.messageId}:\`, err);
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return { batchItemFailures };
};

async function processOrder(order: unknown) { /* ... */ }`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'A Lambda function processes SQS batches of 10 messages. One message in a batch has malformed JSON and always throws. The team enables ReportBatchItemFailures and reports only that one message ID as failed. Does this fully fix the problem?',
    hint: 'Think about what happens to that ONE poison message on every future batch it lands in.',
    solution: 'It fixes the collateral damage to the other 9 messages -- they are correctly deleted instead of being needlessly reprocessed. But the poison message itself is still returned to the queue and will be redelivered, landing in a future batch again and again until it hits maxReceiveCount and is dead-lettered. ReportBatchItemFailures narrows WHICH messages get retried; it does not replace having a correctly-configured DLQ redrive policy for messages that can never succeed.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Returning batchItemFailures from a Lambda handler is enough on its own to get partial-batch retry behaviour.',
      reality: 'The event source mapping must also have FunctionResponseTypes set to [\'ReportBatchItemFailures\']. Without it, SQS ignores the return value entirely and falls back to the all-or-nothing default.'
    },
    {
      thought: 'ReportBatchItemFailures replaces the need for a DLQ redrive policy.',
      reality: 'It only controls WHICH messages get retried after a partial failure. A message that always fails still needs the queue\'s own maxReceiveCount and redrive policy to eventually land in a DLQ instead of retrying forever.'
    },
    {
      thought: 'Without ReportBatchItemFailures, a batch failure only redelivers the messages that actually failed.',
      reality: 'The real default is all-or-nothing: any thrown error fails the whole invocation, and every message in that batch -- including ones that already succeeded -- becomes visible again.'
    }
  ];
}
