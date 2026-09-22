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
    { name: 'Dead-letter queue', type: 'keyword', desc: 'Receives messages that exceed max delivery count, are dead-lettered explicitly, or (if enabled) expire; a message that matches no subscription filter is not dead-lettered' },
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
        'Sessions are switched on with requiresSession (RequiresSession in .NET) when the queue or subscription is created; it cannot be changed later. Once on, every message must carry a sessionId, and a message without one is dead-lettered with the reason "Session ID is null".',
      ]
    },
    {
      heading: 'Sessions and Ordered Delivery in Service Bus',
      points: [
        'Service Bus sessions group related messages (all messages for a given order ID, for example) and guarantee they are delivered in order to a single consumer at a time — without sessions, Service Bus makes no ordering guarantee across concurrent consumers.',
        'A session-enabled queue requires the consumer to explicitly accept a session before receiving its messages, and only one consumer can hold a given session at a time — this serializes processing per session while still allowing different sessions to be processed in parallel.',
        'Sessions add complexity and limit parallelism to one receiver per session, and clients can no longer send or receive regular messages on a session-enabled entity, so use them when per-entity processing order matters rather than as a default for every queue.',
        'Duplicate detection is off by default. Turn it on with requiresDuplicateDetection when the queue or topic is created (Standard and Premium only); the history window defaults to 10 minutes, with a minimum of 20 seconds and a maximum of 7 days. A duplicate send still succeeds but the message is dropped, and only the messageId is compared. It complements rather than replaces consumer-side idempotency for messages arriving outside the window.',
      ],
    },
    {
      heading: 'Topics and Subscriptions for Pub/Sub Patterns',
      points: [
        'Service Bus topics let multiple independent subscriptions each receive a copy of every published message — each subscription behaves like its own queue with its own filter rules, enabling true publish-subscribe patterns beyond simple point-to-point queues.',
        'SQL-like filter expressions on a subscription let it receive only messages matching specific criteria (a property value, a custom header), avoiding the need for every subscriber to receive and then discard irrelevant messages.',
        'Auto-forwarding lets a subscription automatically forward matching messages to another queue or topic, enabling multi-stage routing topologies without requiring an intermediate consumer to manually relay messages.',
        'Choosing between a single topic with multiple filtered subscriptions versus multiple separate topics depends on whether the different consumer groups genuinely need independent lifecycle management (dead-lettering, scaling) or simply different message subsets.',
      ],
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
      messageId:     order.id,        // dedup key, but only if duplicate detection was enabled when the queue was created
      subject:       'order.placed',
      timeToLive:    24 * 60 * 60 * 1000, // 24 hours in ms; on expiry the message is dead-lettered only if dead-lettering on expiration is enabled, otherwise it is deleted
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
      title: 'Not settling messages you receive yourself',
      wrong: `// receiveMessages() does not settle anything for you
const messages = await receiver.receiveMessages(10, { maxWaitTimeInMs: 5000 });
for (const msg of messages) {
  await processOrder(msg.body);
  // forgot completeMessage → message re-delivered after the lock expires
}`,
      right: `const messages = await receiver.receiveMessages(10, { maxWaitTimeInMs: 5000 });
for (const msg of messages) {
  await processOrder(msg.body);
  await receiver.completeMessage(msg); // remove from queue
}
// subscribe() is different: autoCompleteMessages defaults to true, so it completes for you`,
      explanation: 'With receiveMessages(), or with subscribe() when autoCompleteMessages is false, an unsettled message stays locked until the lock expires, then becomes visible again and is redelivered, and is dead-lettered after maxDeliveryCount (default 10). With subscribe() and the default settings the SDK completes the message after processMessage returns and abandons it if the handler throws.'
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
      wrong: `// Messages received with receiveMessages() are never auto-renewed
const [msg] = await receiver.receiveMessages(1);
await longRunningTask(msg.body); // takes 2 minutes
await receiver.completeMessage(msg); // lock expired at 60s → MessageLockLost, already re-queued!`,
      right: `const [msg] = await receiver.receiveMessages(1);
const renewLock = setInterval(async () => {
  await receiver.renewMessageLock(msg);
}, 30_000); // renew every 30s
try {
  await longRunningTask(msg.body);
  await receiver.completeMessage(msg);
} finally { clearInterval(renewLock); }
// With subscribe() the SDK renews for you, up to maxAutoLockRenewalDurationInMs (default 5 minutes)`,
      explanation: 'The default lock duration is 1 minute and the maximum you can configure is 5 minutes. A message taken with receiveMessages() must be renewed by hand with renewMessageLock() if processing can outlast the lock. A subscribe() handler is renewed automatically for up to 5 minutes by default; raise maxAutoLockRenewalDurationInMs for longer work.'
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
    { q: 'What does enabling sessions (requiresSession) on a queue provide?', options: ['Message deduplication', 'FIFO ordering within a session group', 'Dead-letter routing', 'Automatic retry delays'], answer: 1, explanation: 'Sessions guarantee that all messages with the same sessionId are processed by one receiver in order, enabling FIFO per-entity processing.' },
    { q: 'What is the maximum message size on the Service Bus Standard tier?', options: ['1MB', '256KB', '100MB', 'Unlimited'], answer: 1, explanation: 'Standard tier caps message size at 256KB. Premium tier raises this to 100MB over AMQP (the default per entity is 1MB and it is raised per entity), useful for larger payloads without external blob references.' },
    { q: 'What does AutoForwarding allow you to do between Service Bus entities?', options: ['Automatically retry failed deliveries', 'Chain a queue or subscription to forward messages to another queue/topic', 'Compress messages in transit', 'Convert AMQP messages to HTTP'], answer: 1, explanation: 'AutoForwarding lets a queue or subscription forward all its messages directly to another queue or topic, useful for building processing pipelines without custom relay code.' },
  ];

  readonly qna: QnaItem[] = [
    { q: 'How does Service Bus message deduplication work?', a: 'Enable it with requiresDuplicateDetection when the queue or topic is created (it cannot be switched on later, and the Basic tier does not support it), then set duplicateDetectionHistoryTimeWindow (default 10 minutes, 20 seconds to 7 days). Within that window a message with the same messageId is accepted but dropped, so a retrying producer sees a successful send. Only the messageId is compared, so it should be derived from the business operation, not a fresh GUID per attempt.' },
    { q: 'What is the difference between Standard and Premium tiers?', a: 'Standard tier uses shared infrastructure with variable throughput. Premium tier provides dedicated processing units (messaging units), predictable performance, VNet integration, and supports larger message sizes (up to 100MB over AMQP vs 256KB; the Premium default per entity is 1MB and you raise it per queue or topic, and HTTP and SBMP stay at 1MB).' },
    { q: 'Can I use Service Bus with .NET and Node.js consumers simultaneously?', a: 'Yes. Service Bus is protocol-agnostic (AMQP 1.0). @azure/service-bus SDK for Node.js and Azure.Messaging.ServiceBus for .NET both use AMQP and can share the same queues and topics.' },
    { q: 'What happens if a Service Bus topic has zero subscriptions when a message is published to it?', a: 'The message is simply discarded — Service Bus topics have no built-in persistence or dead-lettering for messages published when no subscription exists to receive them (unlike a queue, which always retains the message until a consumer receives and completes it). This differs from Kafka topics, where messages persist for the retention period regardless of whether any consumer is currently subscribed — a subscription created AFTER a Service Bus message was published will never see that earlier message.' },
    { q: 'How do Service Bus message locks work?', a: 'In PeekLock mode (default), receiving a message locks it for LockDuration (default 1 minute, max 5 minutes). Consumer must Complete() or Abandon() before expiry. If the lock expires, the message is redelivered and Complete() fails with a lock-lost error. Use RenewMessageLockAsync for long-running tasks, or a processor or subscribe() handler, which renews for you for up to 5 minutes by default. ReceiveAndDelete deletes on receive immediately — no retry on failure.' },
    { q: 'When should you use Service Bus vs Event Grid vs Storage Queues?', a: 'Use Service Bus for ordered delivery (sessions), large messages (up to 100MB Premium), SQL filtering, or distributed transactions. Use Event Grid for event-driven notifications from Azure/SaaS services. Use Storage Queues for simple, cost-effective task queuing with no ordering needs and messages up to 64KB.' },
  ].filter(q => q.a) as QnaItem[];

  readonly revision: RevisionSummary = {
    oneLiner: 'Azure Service Bus: queue=point-to-point, topic=pub/sub; peekLock+complete for reliable processing; sessions for FIFO.',
    mustKnow: [
      'Queue: one consumer per message; topic: all subscriptions get a copy',
      'peekLock (not receiveAndDelete) for tasks that cannot be lost on failure',
      'completeMessage() removes the message; abandonMessage() releases lock for retry',
      'maxDeliveryCount exhausted → auto-dead-letter; always monitor DLQ',
      'Renew message lock (renewMessageLock) for long-running processors',
      'Sessions: FIFO per sessionId; requiresSession is set when the queue or subscription is created',
    ],
    interviewFocus: [
      'Queue vs topic/subscription: when to use each',
      'peekLock vs receiveAndDelete: reliability trade-offs',
      'Message settlement: complete, abandon, deadLetter, defer',
      'Sessions for ordered processing per entity (order, user)',
    ],
  };
}
