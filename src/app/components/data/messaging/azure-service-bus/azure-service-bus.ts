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
  selector: 'app-azure-service-bus',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './azure-service-bus.html',
  styleUrl: './azure-service-bus.scss'
})
export class AzureServiceBus {
  readonly quickRef: QuickRefItem[] = [
    { name: 'Queue', type: 'keyword', desc: 'Point-to-point; one consumer receives each message' },
    { name: 'Topic', type: 'keyword', desc: 'Pub/sub; each subscription receives a copy of every message' },
    { name: 'Subscription', type: 'keyword', desc: 'Named consumer of a topic; can have filter rules' },
    { name: 'Dead-letter queue', type: 'keyword', desc: 'Receives messages that exceed max delivery count or fail filter' },
    { name: 'Lock duration', type: 'keyword', desc: 'Time a message is locked to one receiver before being re-released' },
    { name: 'Session', type: 'keyword', desc: 'FIFO message ordering within a group (sessionId property)' },
    { name: 'Peek-lock', type: 'keyword', desc: 'Receive mode that locks message without removing until completed' },
    { name: 'maxDeliveryCount', type: 'keyword', desc: 'How many times a message is retried before dead-lettering' },
  ];

  readonly theory: TheoryPoint[] = [
    {
      heading: 'Queues vs Topics with Subscriptions',
      points: [
        'A Service Bus queue provides point-to-point messaging — each message is delivered to exactly one consumer.',
        'A topic delivers messages to all subscriptions. Each subscription maintains its own copy of the message.',
        'Subscriptions can have filter rules (SQL or correlation filters) to receive only matching messages.',
        'Topics enable pub/sub patterns where multiple microservices need the same event independently.',
      ]
    },
    {
      heading: 'Message Settlement: Complete, Abandon, Dead-letter',
      points: [
        'In peek-lock mode, a received message is locked for the lock duration (default 60s).',
        'completeMessage(): removes the message from the queue/subscription. Call after successful processing.',
        'abandonMessage(): releases the lock immediately; message becomes available to other receivers.',
        'deadLetterMessage(): moves the message to the DLQ with a reason; use for messages that can\'t be processed.',
        'Exceeding maxDeliveryCount auto-dead-letters the message.',
      ]
    },
    {
      heading: 'Sessions for FIFO Ordering',
      points: [
        'Sessions enable FIFO processing within a group — all messages with the same sessionId are processed in order.',
        'A session receiver locks the entire session to one consumer at a time.',
        'Use sessions for order processing (all events for one orderId processed by one worker in sequence).',
        'Sessions require EnabledForSessions=true on the queue/subscription.',
      ]
    },
  ];

  readonly codeTabs: CodeTab[] = [
    {
      label: 'Send to Queue',
      language: 'typescript',
      code: `import { ServiceBusClient } from '@azure/service-bus';

const CONNECTION_STRING = process.env.SERVICEBUS_CONNECTION_STRING!;
const QUEUE_NAME = 'orders';

async function sendOrder(order: { id: string; total: number }) {
  const client = new ServiceBusClient(CONNECTION_STRING);
  const sender = client.createSender(QUEUE_NAME);

  try {
    await sender.sendMessages({
      body:          order,
      contentType:   'application/json',
      messageId:     order.id,        // deduplication key
      subject:       'order.placed',
      timeToLive:    24 * 60 * 60 * 1000, // 24 hours in ms
    });
    console.log('Sent order:', order.id);
  } finally {
    await sender.close();
    await client.close();
  }
}

await sendOrder({ id: 'ORD-001', total: 149.99 });`,
    },
    {
      label: 'Receive from Queue (Peek-Lock)',
      language: 'typescript',
      code: `import { ServiceBusClient } from '@azure/service-bus';

const client   = new ServiceBusClient(process.env.SERVICEBUS_CONNECTION_STRING!);
const receiver = client.createReceiver('orders', { receiveMode: 'peekLock' });

// Subscribe with handler
const subscription = receiver.subscribe({
  processMessage: async (message) => {
    const order = message.body as { id: string; total: number };
    try {
      await processOrder(order);
      await receiver.completeMessage(message);  // remove from queue
    } catch (err) {
      // Abandon: release lock, increment delivery count
      await receiver.abandonMessage(message);
    }
  },
  processError: async (err) => {
    console.error('Service Bus error:', err.error);
  },
});

async function processOrder(order: { id: string; total: number }) {
  console.log('Processing order:', order.id, 'total:', order.total);
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  await subscription.close();
  await receiver.close();
  await client.close();
});`,
    },
    {
      label: 'Topic + Subscription',
      language: 'typescript',
      code: `import { ServiceBusClient } from '@azure/service-bus';

const client = new ServiceBusClient(process.env.SERVICEBUS_CONNECTION_STRING!);

// Publisher — sends to topic
async function publishEvent(eventType: string, payload: object) {
  const sender = client.createSender('platform-events');
  await sender.sendMessages({
    body:            payload,
    subject:         eventType,
    applicationProperties: { eventType },
  });
  await sender.close();
}

// Subscriber — orders team receives all events from 'orders-subscription'
async function startOrderSubscription() {
  const receiver = client.createReceiver('platform-events', 'orders-subscription');
  receiver.subscribe({
    processMessage: async (msg) => {
      console.log('[orders]', msg.subject, msg.body);
      await receiver.completeMessage(msg);
    },
    processError: async (err) => console.error(err.error),
  });
}

// Subscriber — analytics team with SQL filter: only 'order.placed' events
// (Filter set when creating the subscription: subject = 'order.placed')
async function startAnalyticsSubscription() {
  const receiver = client.createReceiver('platform-events', 'analytics-subscription');
  receiver.subscribe({
    processMessage: async (msg) => {
      console.log('[analytics]', msg.body);
      await receiver.completeMessage(msg);
    },
    processError: async (err) => console.error(err.error),
  });
}

await startOrderSubscription();
await startAnalyticsSubscription();
await publishEvent('order.placed', { orderId: 'ORD-001', total: 99 });`,
    },
  ];

  readonly mistakes: CommonMistake[] = [
    {
      title: 'Not completing messages after successful processing',
      wrong: `receiver.subscribe({
  processMessage: async (msg) => {
    await processOrder(msg.body);
    // forgot completeMessage → message re-delivered after lock expires
  },
});`,
      right: `receiver.subscribe({
  processMessage: async (msg) => {
    await processOrder(msg.body);
    await receiver.completeMessage(msg); // remove from queue
  },
});`,
      explanation: 'Without completeMessage(), the message stays locked until lock duration expires, then becomes visible again. It will be redelivered and eventually dead-lettered after maxDeliveryCount retries.'
    },
    {
      title: 'Using receiveAndDelete mode for tasks that can fail',
      wrong: `// receiveAndDelete: message deleted the moment it's received
const receiver = client.createReceiver('orders', { receiveMode: 'receiveAndDelete' });
// If processing fails, message is GONE — no retry, no DLQ`,
      right: `// peekLock: message stays until explicitly completed or abandoned
const receiver = client.createReceiver('orders', { receiveMode: 'peekLock' });
// On failure: abandonMessage (retry) or deadLetterMessage (DLQ)`,
      explanation: 'receiveAndDelete is only safe when message loss is acceptable. Use peekLock for any task that must not be lost on processing failure.'
    },
    {
      title: 'Not renewing the message lock for long-running operations',
      wrong: `processMessage: async (msg) => {
  await longRunningTask(msg.body); // takes 2 minutes
  await receiver.completeMessage(msg); // lock expired at 60s → already re-queued!
}`,
      right: `processMessage: async (msg) => {
  const renewLock = setInterval(async () => {
    await receiver.renewMessageLock(msg);
  }, 30_000); // renew every 30s
  try {
    await longRunningTask(msg.body);
    await receiver.completeMessage(msg);
  } finally { clearInterval(renewLock); }
}`,
      explanation: 'The default lock duration is 60s. Long-running processors must periodically renew the lock via renewMessageLock() to prevent the message from being re-queued mid-processing.'
    },
    {
      title: 'Not checking the dead-letter queue',
      wrong: `// DLQ is ignored in monitoring and operations
// Poison messages accumulate silently, data lost`,
      right: `// Subscribe to DLQ with a separate receiver and alert/replay
const dlqReceiver = client.createReceiver('orders', {
  subQueueType: 'deadLetter',
});
// Inspect deadLetterReason, deadLetterErrorDescription
// Replay or alert on each message`,
      explanation: 'The DLQ is a holding area for unprocessable messages. Without monitoring it, poison messages accumulate silently. Always subscribe to the DLQ or set up alerts.'
    },
  ];

  readonly challenge: Challenge = {
    title: 'Scheduled Message Publisher',
    language: 'typescript',
    description: 'Use Azure Service Bus scheduled messages to send a reminder 5 minutes from now. The message should include the original orderId and a reminderType "payment-due". After scheduling, fetch the sequenceNumber and cancel the scheduled message programmatically.',
    hints: [
      'sender.scheduleMessages(messages, scheduledEnqueueTime)',
      'sender.cancelScheduledMessages(sequenceNumbers)',
      'scheduledEnqueueTime is a Date object set 5 minutes in the future',
    ],
    starterCode: `import { ServiceBusClient } from '@azure/service-bus';

async function scheduleAndCancel(orderId: string) {
  const client = new ServiceBusClient(process.env.SERVICEBUS_CONNECTION_STRING!);
  // TODO: schedule message for 5 minutes from now, then cancel it
}`,
    solution: `import { ServiceBusClient } from '@azure/service-bus';

async function scheduleAndCancel(orderId: string) {
  const client = new ServiceBusClient(process.env.SERVICEBUS_CONNECTION_STRING!);
  const sender = client.createSender('orders');

  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);

  // Schedule the reminder
  const [seqNum] = await sender.scheduleMessages(
    [{
      body:          { orderId, reminderType: 'payment-due' },
      subject:       'order.reminder',
      messageId:     \`reminder-\${orderId}\`,
    }],
    fiveMinutesFromNow
  );
  console.log('Scheduled at', fiveMinutesFromNow, 'seqNum:', seqNum);

  // Cancel it (e.g., payment received before reminder fires)
  await sender.cancelScheduledMessages([seqNum]);
  console.log('Cancelled scheduled message', seqNum);

  await sender.close();
  await client.close();
}`,
  };

  readonly quiz: QuizQuestion[] = [
    { q: 'What is the difference between a Service Bus queue and a topic?', options: ['Queue is pub/sub; topic is point-to-point', 'Queue is point-to-point; topic delivers to all subscriptions', 'Topic has a DLQ; queue does not', 'Queue has sessions; topic does not'], answer: 1, explanation: 'A queue delivers each message to one consumer. A topic delivers each message to all subscriptions independently.' },
    { q: 'What happens when a message exceeds maxDeliveryCount?', options: ['It is silently deleted', 'It is moved to the dead-letter queue automatically', 'The consumer is disconnected', 'It is sent back to the producer'], answer: 1, explanation: 'Service Bus automatically moves a message to the DLQ when it has been delivered and abandoned maxDeliveryCount times.' },
    { q: 'Which receive mode should you use for tasks that must not be lost on failure?', options: ['receiveAndDelete', 'peekLock', 'sessionReceiver', 'prefetchCount'], answer: 1, explanation: 'peekLock keeps the message in the queue (locked) until the consumer explicitly completes, abandons, or dead-letters it.' },
    { q: 'What does enableSessions on a queue provide?', options: ['Message deduplication', 'FIFO ordering within a session group', 'Dead-letter routing', 'Automatic retry delays'], answer: 1, explanation: 'Sessions guarantee that all messages with the same sessionId are processed by one receiver in order, enabling FIFO per-entity processing.' },
  ];

  readonly qna: QnaItem[] = [
    { q: 'How does Service Bus message deduplication work?', options: ['Not needed — peeked messages are never duplicated'] },
    { q: 'How does Service Bus message deduplication work?', a: 'Set duplicateDetectionHistoryTimeWindow on the queue. Within that window, messages with the same messageId are deduplicated at the broker level. Useful for idempotent publish when producers might retry on transient failures.' },
    { q: 'What is the difference between Standard and Premium tiers?', a: 'Standard tier uses shared infrastructure with variable throughput. Premium tier provides dedicated processing units (messaging units), predictable performance, VNet integration, and supports larger message sizes (up to 100MB vs 256KB).' },
    { q: 'Can I use Service Bus with .NET and Node.js consumers simultaneously?', a: 'Yes. Service Bus is protocol-agnostic (AMQP 1.0). @azure/service-bus SDK for Node.js and Azure.Messaging.ServiceBus for .NET both use AMQP and can share the same queues and topics.' },
  ].filter(q => q.a) as QnaItem[];

  readonly revision: RevisionSummary = {
    oneLiner: 'Azure Service Bus: queue=point-to-point, topic=pub/sub; peekLock+complete for reliable processing; sessions for FIFO.',
    mustKnow: [
      'Queue: one consumer per message; topic: all subscriptions get a copy',
      'peekLock (not receiveAndDelete) for tasks that cannot be lost on failure',
      'completeMessage() removes the message; abandonMessage() releases lock for retry',
      'maxDeliveryCount exhausted → auto-dead-letter; always monitor DLQ',
      'Renew message lock (renewMessageLock) for long-running processors',
      'Sessions: FIFO per sessionId; requires EnabledForSessions on queue/subscription',
    ],
    interviewFocus: [
      'Queue vs topic/subscription: when to use each',
      'peekLock vs receiveAndDelete: reliability trade-offs',
      'Message settlement: complete, abandon, deadLetter, defer',
      'Sessions for ordered processing per entity (order, user)',
    ],
  };
}
