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
  selector: 'app-aws-sqs',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './aws-sqs.html',
  styleUrl: './aws-sqs.scss'
})
export class AwsSqs {
  readonly quickRef: QuickRefItem[] = [
    { name: 'Standard Queue', type: 'keyword', desc: 'At-least-once, best-effort ordering, max throughput' },
    { name: 'FIFO Queue', type: 'keyword', desc: 'Exactly-once, strict ordering within a message group' },
    { name: 'Visibility timeout', type: 'keyword', desc: 'Time a message is hidden after receive; must delete before expiry' },
    { name: 'ReceiptHandle', type: 'keyword', desc: 'Token required to delete or change visibility of a received message' },
    { name: 'Long polling', type: 'keyword', desc: 'WaitTimeSeconds > 0; holds connection open until message arrives' },
    { name: 'DLQ', type: 'keyword', desc: 'Dead-letter queue; receives messages after maxReceiveCount retries' },
    { name: 'MessageGroupId', type: 'keyword', desc: 'FIFO queue: messages with same groupId processed in order' },
    { name: 'MessageDeduplicationId', type: 'keyword', desc: 'FIFO: prevents duplicates within 5-minute deduplication window' },
  ];

  readonly theory: TheoryPoint[] = [
    {
      heading: 'Standard vs FIFO Queues',
      points: [
        'Standard queues offer maximum throughput with at-least-once delivery and best-effort ordering.',
        'FIFO queues guarantee exactly-once processing and strict ordering within a message group, but are limited to 3,000 msg/s (with batching) per queue.',
        'Use Standard for high-throughput workloads where occasional duplicates and out-of-order delivery are acceptable.',
        'Use FIFO when order matters and duplicates must be prevented (financial transactions, state machines).',
      ]
    },
    {
      heading: 'Visibility Timeout and Deletion',
      points: [
        'When a consumer receives a message, it becomes invisible for the visibility timeout duration (default 30s).',
        'The consumer must delete the message before the timeout expires; otherwise it becomes visible again for redelivery.',
        'Extend visibility with ChangeMessageVisibility for long-running tasks.',
        'deleteMessage() requires the ReceiptHandle returned in the receive response — not the MessageId.',
      ]
    },
    {
      heading: 'Long Polling and Dead-Letter Queues',
      points: [
        'Short polling (WaitTimeSeconds=0) returns immediately even with no messages — wastes API calls and costs.',
        'Long polling (WaitTimeSeconds=1–20) holds the connection open until a message arrives or timeout — cheaper and faster.',
        'A DLQ receives messages that failed maxReceiveCount times. Essential for catching poison messages.',
        'Always configure a DLQ redrive policy in production to avoid silent message loss.',
      ]
    },
  ];

  readonly codeTabs: CodeTab[] = [
    {
      label: 'Send & Receive (Standard)',
      language: 'typescript',
      code: `import { SQSClient, SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';

const sqs      = new SQSClient({ region: 'us-east-1' });
const QUEUE_URL = process.env.SQS_QUEUE_URL!;

// Send
async function sendMessage(payload: object) {
  await sqs.send(new SendMessageCommand({
    QueueUrl:    QUEUE_URL,
    MessageBody: JSON.stringify(payload),
    MessageAttributes: {
      EventType: { DataType: 'String', StringValue: 'order.placed' },
    },
  }));
  console.log('Sent:', payload);
}

// Receive and process
async function pollQueue() {
  const response = await sqs.send(new ReceiveMessageCommand({
    QueueUrl:            QUEUE_URL,
    MaxNumberOfMessages: 10,
    WaitTimeSeconds:     20,     // long polling
    VisibilityTimeout:   60,     // 60s to process
    MessageAttributeNames: ['All'],
  }));

  for (const message of response.Messages ?? []) {
    try {
      const body = JSON.parse(message.Body!);
      await processOrder(body);
      // Delete on success
      await sqs.send(new DeleteMessageCommand({
        QueueUrl:      QUEUE_URL,
        ReceiptHandle: message.ReceiptHandle!,
      }));
    } catch (err) {
      console.error('Processing failed — will retry:', err);
      // Do NOT delete; message returns after VisibilityTimeout
    }
  }
}

async function processOrder(order: unknown) { console.log('Processing:', order); }`,
    },
    {
      label: 'FIFO Queue',
      language: 'typescript',
      code: `import { SQSClient, SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';
import { randomUUID } from 'crypto';

const sqs      = new SQSClient({ region: 'us-east-1' });
const FIFO_URL = process.env.SQS_FIFO_QUEUE_URL!; // must end in .fifo

// Send — FIFO requires MessageGroupId + MessageDeduplicationId
async function sendOrderEvent(orderId: string, event: object) {
  await sqs.send(new SendMessageCommand({
    QueueUrl:               FIFO_URL,
    MessageBody:            JSON.stringify(event),
    MessageGroupId:         orderId,          // ordered per order
    MessageDeduplicationId: randomUUID(),     // dedup within 5-min window
  }));
}

// Send multiple events for same order — guaranteed to arrive in order
await sendOrderEvent('ORD-001', { status: 'created' });
await sendOrderEvent('ORD-001', { status: 'payment_accepted' });
await sendOrderEvent('ORD-001', { status: 'shipped' });

// Receive — returned in MessageGroupId order
const response = await sqs.send(new ReceiveMessageCommand({
  QueueUrl:            FIFO_URL,
  MaxNumberOfMessages: 10,
  WaitTimeSeconds:     10,
}));

for (const msg of response.Messages ?? []) {
  const event = JSON.parse(msg.Body!);
  console.log(\`Order \${msg.Attributes?.MessageGroupId}: \${event.status}\`);
  await sqs.send(new DeleteMessageCommand({
    QueueUrl: FIFO_URL, ReceiptHandle: msg.ReceiptHandle!,
  }));
}`,
    },
    {
      label: 'DLQ + Redrive',
      language: 'typescript',
      code: `import { SQSClient, SetQueueAttributesCommand, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';

const sqs = new SQSClient({ region: 'us-east-1' });

// Configure redrive policy: after 5 failures → DLQ
async function configureDLQ(mainQueueUrl: string, dlqArn: string) {
  await sqs.send(new SetQueueAttributesCommand({
    QueueUrl: mainQueueUrl,
    Attributes: {
      RedrivePolicy: JSON.stringify({
        deadLetterTargetArn: dlqArn,
        maxReceiveCount:     '5',
      }),
    },
  }));
  console.log('DLQ configured');
}

// Monitor DLQ: receive and log poison messages
async function monitorDLQ(dlqUrl: string) {
  const response = await sqs.send(new ReceiveMessageCommand({
    QueueUrl:        dlqUrl,
    WaitTimeSeconds: 10,
    MessageAttributeNames: ['All'],
  }));

  for (const msg of response.Messages ?? []) {
    console.error('[DLQ] Poison message:', {
      id:         msg.MessageId,
      body:       msg.Body,
      attributes: msg.Attributes,
    });
    // Alert, inspect, and optionally delete
    await sqs.send(new DeleteMessageCommand({
      QueueUrl: dlqUrl, ReceiptHandle: msg.ReceiptHandle!,
    }));
  }
}`,
    },
  ];

  readonly mistakes: CommonMistake[] = [
    {
      title: 'Using short polling instead of long polling',
      wrong: `// WaitTimeSeconds=0 — returns immediately even with no messages
const response = await sqs.send(new ReceiveMessageCommand({
  QueueUrl: QUEUE_URL,
  // no WaitTimeSeconds → 0 by default
}));
// Burns API calls, incurs costs, adds latency`,
      right: `const response = await sqs.send(new ReceiveMessageCommand({
  QueueUrl:        QUEUE_URL,
  WaitTimeSeconds: 20,  // wait up to 20s for messages
}));`,
      explanation: 'Short polling sends empty responses immediately. Long polling (WaitTimeSeconds > 0) waits until a message arrives, reducing API call count and cost by up to 90%.'
    },
    {
      title: 'Not deleting messages after successful processing',
      wrong: `for (const msg of messages) {
  await processMessage(msg);
  // Forgot to delete — message becomes visible again after timeout
}`,
      right: `for (const msg of messages) {
  await processMessage(msg);
  await sqs.send(new DeleteMessageCommand({
    QueueUrl: QUEUE_URL, ReceiptHandle: msg.ReceiptHandle!,
  }));
}`,
      explanation: 'SQS does not auto-delete on receive. The consumer must call deleteMessage with the ReceiptHandle after successful processing to remove the message permanently.'
    },
    {
      title: 'Not extending visibility for long-running tasks',
      wrong: `// VisibilityTimeout=30s, task takes 120s
const msgs = await receive({ VisibilityTimeout: 30 });
await slowTask(msgs[0]); // 120s — message becomes visible at 30s and redelivered`,
      right: `const msgs = await receive({ VisibilityTimeout: 30 });
// Extend visibility before it expires
const extendInterval = setInterval(async () => {
  await sqs.send(new ChangeMessageVisibilityCommand({
    QueueUrl: QUEUE_URL, ReceiptHandle: msgs[0].ReceiptHandle!, VisibilityTimeout: 30,
  }));
}, 20_000);
await slowTask(msgs[0]);
clearInterval(extendInterval);
await deleteMessage(msgs[0].ReceiptHandle!);`,
      explanation: 'The visibility timeout must cover the full processing time. For long tasks, extend it periodically with ChangeMessageVisibility to prevent premature redelivery.'
    },
    {
      title: 'Not configuring a DLQ redrive policy',
      wrong: `// Queue with no DLQ — after maxReceiveCount failures, message deleted silently
// No visibility into poison messages`,
      right: `// Always set a DLQ redrive policy in production
await sqs.send(new SetQueueAttributesCommand({
  QueueUrl: QUEUE_URL,
  Attributes: {
    RedrivePolicy: JSON.stringify({ deadLetterTargetArn: DLQ_ARN, maxReceiveCount: '5' }),
  },
}));`,
      explanation: 'Without a DLQ, poison messages that fail maxReceiveCount times are silently deleted. A DLQ captures them for inspection and replay.'
    },
  ];

  readonly challenge: Challenge = {
    title: 'Batch SQS Processor with Partial Failure',
    language: 'typescript',
    description: 'Receive up to 10 messages from an SQS queue. Process each message independently. Delete only successfully processed messages. For failed messages, extend their visibility timeout by 60 seconds (for retry) instead of deleting. Log a summary at the end.',
    hints: [
      'ReceiveMessage returns Messages array',
      'Use DeleteMessageBatch for successful messages',
      'Use ChangeMessageVisibilityBatch for failed messages',
    ],
    starterCode: `import { SQSClient } from '@aws-sdk/client-sqs';

const sqs = new SQSClient({ region: 'us-east-1' });

async function processBatch(queueUrl: string) {
  // TODO: receive, process each, delete success, extend visibility on failure
}`,
    solution: `import { SQSClient, ReceiveMessageCommand, DeleteMessageBatchCommand, ChangeMessageVisibilityBatchCommand } from '@aws-sdk/client-sqs';

const sqs = new SQSClient({ region: 'us-east-1' });

async function processBatch(queueUrl: string) {
  const response = await sqs.send(new ReceiveMessageCommand({
    QueueUrl: queueUrl, MaxNumberOfMessages: 10, WaitTimeSeconds: 10, VisibilityTimeout: 30,
  }));

  const messages = response.Messages ?? [];
  if (!messages.length) { console.log('No messages'); return; }

  const toDelete: string[] = [];
  const toExtend: string[] = [];

  for (const msg of messages) {
    try {
      await simulateProcess(msg.Body!);
      toDelete.push(msg.ReceiptHandle!);
    } catch {
      toExtend.push(msg.ReceiptHandle!);
    }
  }

  if (toDelete.length) {
    await sqs.send(new DeleteMessageBatchCommand({
      QueueUrl: queueUrl,
      Entries: toDelete.map((h, i) => ({ Id: String(i), ReceiptHandle: h })),
    }));
  }

  if (toExtend.length) {
    await sqs.send(new ChangeMessageVisibilityBatchCommand({
      QueueUrl: queueUrl,
      Entries: toExtend.map((h, i) => ({ Id: String(i), ReceiptHandle: h, VisibilityTimeout: 60 })),
    }));
  }

  console.log(\`Processed: \${messages.length} | Deleted: \${toDelete.length} | Deferred: \${toExtend.length}\`);
}

async function simulateProcess(body: string) {
  if (Math.random() < 0.3) throw new Error('Random failure');
  console.log('OK:', body.slice(0, 50));
}`,
  };

  readonly quiz: QuizQuestion[] = [
    { q: 'Which SQS queue type guarantees strict ordering within a message group?', options: ['Standard queue', 'FIFO queue', 'Priority queue', 'DLQ'], answer: 1, explanation: 'FIFO queues guarantee exactly-once processing and strict ordering per MessageGroupId.' },
    { q: 'What does long polling (WaitTimeSeconds > 0) improve?', options: ['Message ordering', 'API call efficiency and cost', 'Deduplication', 'Visibility timeout'], answer: 1, explanation: 'Long polling holds the connection until messages arrive or timeout, reducing empty responses and unnecessary API calls.' },
    { q: 'What token is required to delete a received SQS message?', options: ['MessageId', 'ReceiptHandle', 'MessageDeduplicationId', 'GroupId'], answer: 1, explanation: 'deleteMessage requires the ReceiptHandle returned in the receive response. MessageId alone cannot delete a message.' },
    { q: 'What happens after a message exceeds maxReceiveCount without a DLQ configured?', options: ['Message is retained indefinitely', 'Message is silently deleted', 'Message is sent back to the producer', 'Message is archived to S3'], answer: 1, explanation: 'Without a DLQ, SQS silently deletes messages that exceed maxReceiveCount. A DLQ redrive policy captures them for inspection.' },
    { q: 'What is the maximum SQS message retention period?', options: ['4 days (default only)', '7 days', '14 days (maximum)', '30 days'], answer: 2, explanation: 'SQS retains messages from 1 minute to 14 days maximum (default 4 days). Messages not consumed before expiry are automatically deleted.' },
    { q: 'Why does an SQS message reappear after being received?', options: ['The consumer ACKed it incorrectly', 'Visibility timeout expired before the consumer deleted it', 'Another consumer re-queued it', 'SQS replicates messages automatically'], answer: 1, explanation: 'After receive, the message is hidden for the visibility timeout. If not deleted before expiry, SQS makes it visible again — enabling automatic retry when a consumer crashes.' },
  ];

  readonly qna: QnaItem[] = [
    { q: 'What is the maximum message size in SQS?', a: 'SQS supports messages up to 256KB. For larger payloads, use the SQS Extended Client Library which stores the body in S3 and sends only a reference in the SQS message — the Claim Check pattern.' },
    { q: 'Can Lambda consume SQS directly?', a: 'Yes. Lambda SQS event source mapping polls the queue, batches messages, and invokes Lambda. On success, processed messages are deleted automatically. On function error, the batch is returned to the queue (or sent to DLQ if configured as a Lambda destination).' },
    { q: 'How does FIFO deduplication work?', a: 'Within a 5-minute window, FIFO queues deduplicate messages with the same MessageDeduplicationId. If the content-based deduplication option is enabled, AWS hashes the message body automatically. Use explicit IDs for critical deduplication scenarios.' },
    { q: 'How does SQS dead-letter queue (DLQ) work?', a: 'When a message exceeds <strong>maxReceiveCount</strong> (receive attempts without deletion), SQS automatically moves it to the DLQ. Configure a DLQ with a longer retention period to inspect failed messages. CloudWatch alarms on DLQ depth detect processing failures. Redrive policy lets you move messages back to the source queue after fixing bugs.' },
    { q: 'What is SQS long polling and why should you use it?', a: '<strong>Long polling</strong> (WaitTimeSeconds 1-20s) holds the connection until a message arrives or timeout — reduces empty responses and API cost. <strong>Short polling</strong> returns immediately even when empty, wasting API calls. Enable: set ReceiveMessageWaitTimeSeconds on the queue or WaitTimeSeconds per request. Reduces cost up to 50% on sparse queues.' },
    { q: 'How does SQS FIFO ensure exactly-once processing?', a: 'FIFO queues use <strong>MessageDeduplicationId</strong> (5-minute deduplication window) to reject duplicate sends. <strong>MessageGroupId</strong> groups messages for strict ordering within the group. <strong>ContentBasedDeduplication</strong> auto-generates dedup ID from SHA-256 of the body. Throughput is capped at 300 msg/s (3,000 with batching).' },
  ];

  readonly revision: RevisionSummary = {
    oneLiner: 'SQS Standard=at-least-once, high-throughput; FIFO=exactly-once, ordered per group; always use long polling + DLQ.',
    mustKnow: [
      'Standard: at-least-once, best-effort ordering; FIFO: exactly-once, ordered by MessageGroupId',
      'Visibility timeout: message hidden during processing; must delete before expiry',
      'deleteMessage requires ReceiptHandle (not MessageId)',
      'Long polling (WaitTimeSeconds=20) reduces cost vs short polling',
      'DLQ redrive policy: maxReceiveCount failures → dead-letter queue',
      'Extend visibility with ChangeMessageVisibility for tasks exceeding timeout',
    ],
    interviewFocus: [
      'Standard vs FIFO trade-offs: when ordering and exactly-once matter',
      'Visibility timeout mechanics: hidden, not locked; must delete before expiry',
      'DLQ: how to configure and why it\'s required in production',
      'Lambda + SQS integration: event source mapping, batch failure handling',
    ],
  };
}
