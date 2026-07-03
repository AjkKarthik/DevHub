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
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './service-bus.html',
  styleUrl: './service-bus.scss'
})
export class AzureServiceBus {

  quickRef: QuickRefItem[] = [
    { name: 'Queue', type: 'type', desc: 'Point-to-point messaging: one sender, one receiver. Messages stored durably until consumed. FIFO within a session. Max message size: 256 KB (Standard), 100 MB (Premium).' },
    { name: 'Topic', type: 'type', desc: 'Publish-subscribe: one sender, multiple receivers. Each receiver has its own Subscription that filters the topic. Subscriptions can apply SQL-based filter rules.' },
    { name: 'Subscription', type: 'type', desc: 'A named view of a Topic for a specific consumer. Has its own message lock, dead-letter queue, and filter rules. Consumers receive only messages matching the subscription filter.' },
    { name: 'Peek-Lock', type: 'type', desc: 'Two-phase receive: lock the message (invisible to others), process it, then complete (delete) or abandon (make visible again). Default for reliable processing.' },
    { name: 'Dead-Letter Queue', type: 'type', desc: 'Sub-queue for messages that cannot be processed — expired TTL, exceeded delivery count, or explicitly dead-lettered. Each queue/subscription has its own DLQ.' },
    { name: 'Session', type: 'type', desc: 'Group related messages under a session ID for ordered, exclusive processing. A session-enabled queue/topic delivers all messages of a session to a single receiver in order.' },
    { name: 'AMQP', type: 'type', desc: 'Advanced Message Queuing Protocol — the wire protocol used by Service Bus SDKs. Service Bus also supports AMQP over WebSocket for environments that block TCP 5671.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Queues vs Topics & Subscriptions',
      points: [
        'Queue: single consumer per message. Sender writes to the queue; one consumer receives and processes each message. Ideal for load levelling — producer and consumer work at different rates, queue absorbs the difference. Competing consumers (multiple receivers on the same queue) scale horizontally.',
        'Topic: fan-out to multiple consumers. Sender publishes to a topic; each Subscription receives an independent copy of messages matching its filter. Use for broadcasting events (order placed → inventory, billing, and notification services each get the event via separate subscriptions).',
        'Subscription filters: SQL filter (WHERE body or property expressions), Correlation filter (match on CorrelationId, SessionId, To, etc. — more efficient than SQL), or True filter (receive all messages). Filters reduce the load on consumers by pre-filtering at the broker.',
        'Standard vs Premium tier: Standard uses shared infrastructure, max 256 KB messages, no VNet integration, variable throughput. Premium uses dedicated compute, up to 100 MB messages, VNet injection, Private Endpoints, Geo-Disaster Recovery, and predictable performance. Use Premium for production.',
        'Namespace: the top-level container for queues and topics. Has a globally unique hostname (mynamespace.servicebus.windows.net). Tier is set at namespace level (Standard/Premium). All queues/topics in a namespace share the tier.',
      ]
    },
    {
      heading: 'Message Processing Patterns',
      points: [
        'Peek-Lock (recommended): receiver calls ReceiveMessages() with peek-lock mode. The message is locked (invisible) for the lock duration (default 60 seconds, max 5 minutes). Receiver processes it, then calls CompleteMessage() to delete it from the queue. If processing fails, AbandonMessage() makes it immediately visible again.',
        'Receive-and-Delete: message is deleted as soon as it is delivered to the receiver. Faster but not reliable — if the receiver crashes after receiving but before processing, the message is permanently lost. Only use for idempotent, non-critical workloads where loss is acceptable.',
        'Delivery count: every receive-and-abandon increments the delivery count. When delivery count exceeds MaxDeliveryCount (default 10), the message is automatically moved to the Dead-Letter Queue with reason MaxDeliveryCountExceeded. Inspect the DLQ to diagnose processing failures.',
        'Lock renewal: if message processing takes longer than the lock duration, renew the lock before it expires using RenewMessageLockAsync(). An expired lock causes the message to become visible again — another consumer may pick it up, causing duplicate processing. Design consumers to be idempotent or renew locks proactively.',
        'Batch processing: ReceiveMessagesAsync(maxMessages: 10) retrieves up to 10 messages in one call — more efficient than one-at-a-time for high-throughput scenarios. Process the batch, then complete all at once. Message ordering is not guaranteed across batches unless using sessions.',
      ]
    },
    {
      heading: 'Sessions & Ordering',
      points: [
        'Sessions provide ordered, exclusive processing of related messages. Set SessionId on messages when sending (e.g., order ID, customer ID). Enable sessions on the queue or subscription. A session receiver holds an exclusive lock on all messages with a given SessionId until it closes the session.',
        'Use sessions for: multi-step workflows where steps must run in order (order creation → payment → fulfilment), per-customer processing (process each customer\'s events in order), and saga patterns (correlate multiple messages belonging to the same transaction).',
        'Session state: a session receiver can store and retrieve a small blob of session state (arbitrary bytes) on the broker. Useful for storing workflow progress — survives consumer restarts without external state storage.',
        'Without sessions: Service Bus provides best-effort ordering within a single sender. Competing consumers on the same queue can receive messages out of order. If ordering is critical across competing consumers, sessions are mandatory.',
        'Session timeout: if a session receiver is idle (no messages consumed) for longer than the session lock timeout, the session is released and another consumer can pick it up. Configure an appropriate lock duration to avoid unintended session transfer.',
      ]
    },
    {
      heading: 'Dead-Letter Queue & Geo-Disaster Recovery',
      points: [
        'Every queue and subscription has a built-in Dead-Letter Queue (DLQ) at path: queuename/$DeadLetterQueue. Messages land there on: MaxDeliveryCount exceeded, TTL expired (if DeadLetteringOnMessageExpiration=true), or explicit Dead-Letter by consumer (DeadLetterMessageAsync()).',
        'Monitor the DLQ: high DLQ depth indicates processing failures. Set up Azure Monitor alerts on the DLQ message count metric. Process DLQ messages manually (inspect + replay) or with an automated DLQ handler that logs failures and retries after fixing the root cause.',
        'Geo-Disaster Recovery (Premium): pairs a primary and secondary namespace. Metadata (queues, topics, subscriptions, rules) is replicated to the secondary. On failover, the secondary namespace takes over the primary\'s alias. Messages already in the primary at failover time are lost — GDR is metadata-only replication.',
        'Geo-Replication (Premium, newer feature): active-active or active-passive replication of both metadata AND messages between two namespaces. Messages sent to the primary are also replicated to the secondary. Failover does not lose in-flight messages. Requires Premium tier.',
        'Message TTL: set TimeToLive on messages or as a queue/subscription default. Expired messages are either discarded or moved to DLQ (DeadLetteringOnMessageExpiration=true). Set TTLs to prevent stale messages accumulating — a message still valid after 7 days may no longer be actionable.',
      ]
    },
    {
      heading: 'Queues vs. Topics — Choosing the Right Messaging Model',
      points: [
        'A Service Bus queue implements point-to-point messaging — each message is consumed by exactly ONE receiver, appropriate for work-distribution scenarios where a pool of workers competes to process items from a shared queue.',
        'A Service Bus topic implements publish-subscribe — each message is delivered to EVERY subscription on the topic, appropriate when multiple independent consumers each need their own copy of every message (an order-placed event triggering both a shipping process and an analytics update).',
        'Subscriptions on a topic can apply SQL-like filters to receive only a subset of messages matching specific criteria, letting a single topic serve many different consumer interests without each subscriber needing to filter irrelevant messages after receiving them.',
        'Choosing a topic when a queue would suffice adds unnecessary overhead (managing subscriptions, filters) for a use case that only ever needs one consumer per message — the choice should reflect the actual number of independent consumers the message needs to reach.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Send & Receive (TypeScript)',
      language: 'typescript',
      code: `import { ServiceBusClient } from '@azure/service-bus';
import { DefaultAzureCredential } from '@azure/identity';

// Use Managed Identity (no connection string needed)
const sbClient = new ServiceBusClient(
  'mynamespace.servicebus.windows.net',
  new DefaultAzureCredential()
);

// --- SENDER ---
const sender = sbClient.createSender('my-queue');

await sender.sendMessages({
  body: { orderId: 'ord-123', total: 49.99 },
  contentType: 'application/json',
  sessionId: 'customer-456',   // for session-enabled queues
  timeToLive: 3_600_000,        // 1 hour in ms
});

await sender.close();

// --- RECEIVER (Peek-Lock) ---
const receiver = sbClient.createReceiver('my-queue', {
  receiveMode: 'peekLock',
});

const messages = await receiver.receiveMessages(10, { maxWaitTimeInMs: 5000 });

for (const msg of messages) {
  try {
    console.log('Processing:', msg.body);
    await processOrder(msg.body);
    await receiver.completeMessage(msg);   // delete from queue
  } catch (err) {
    console.error('Failed:', err);
    await receiver.abandonMessage(msg);    // return to queue for retry
  }
}

await receiver.close();
await sbClient.close();`
    },
    {
      label: 'Topic & Subscription',
      language: 'bash',
      code: `# Create Service Bus namespace (Premium for VNet/large messages)
az servicebus namespace create \\
  --name my-sb-ns --resource-group my-rg \\
  --location eastus --sku Premium

# Create topic
az servicebus topic create \\
  --namespace-name my-sb-ns --resource-group my-rg \\
  --name order-events \\
  --max-size-in-megabytes 1024

# Create subscriptions for each consumer
az servicebus topic subscription create \\
  --namespace-name my-sb-ns --resource-group my-rg \\
  --topic-name order-events --name inventory-sub \\
  --max-delivery-count 5 \\
  --dead-lettering-on-message-expiration true

az servicebus topic subscription create \\
  --namespace-name my-sb-ns --resource-group my-rg \\
  --topic-name order-events --name billing-sub \\
  --max-delivery-count 5

# Add SQL filter: inventory-sub only receives orders for UK region
az servicebus topic subscription rule create \\
  --namespace-name my-sb-ns --resource-group my-rg \\
  --topic-name order-events --subscription-name inventory-sub \\
  --name uk-only \\
  --filter-sql-expression "region = 'UK'"

# Monitor DLQ depth
az monitor metrics list \\
  --resource /subscriptions/<subId>/resourceGroups/my-rg/providers/Microsoft.ServiceBus/namespaces/my-sb-ns \\
  --metric "DeadletteredMessages" \\
  --output table`
    },
    {
      label: 'Sessions & Dead-Letter',
      language: 'typescript',
      code: `import { ServiceBusClient } from '@azure/service-bus';
import { DefaultAzureCredential } from '@azure/identity';

const sbClient = new ServiceBusClient('mynamespace.servicebus.windows.net', new DefaultAzureCredential());

// Session receiver — processes ONE session exclusively
const sessionReceiver = await sbClient.acceptNextSession('order-queue');
console.log('Processing session:', sessionReceiver.sessionId);

// Restore session state (e.g. saga progress)
const stateBuffer = await sessionReceiver.getSessionState();
const state = stateBuffer ? JSON.parse(stateBuffer.toString()) : { step: 0 };

const messages = await sessionReceiver.receiveMessages(20, { maxWaitTimeInMs: 5000 });
for (const msg of messages) {
  await processStep(msg.body, state);
  state.step++;
  await sessionReceiver.completeMessage(msg);
}

// Save saga progress back to session state
await sessionReceiver.setSessionState(Buffer.from(JSON.stringify(state)));
await sessionReceiver.close();

// --- DLQ processor ---
const dlqReceiver = sbClient.createReceiver('order-queue', {
  receiveMode: 'peekLock',
  subQueueType: 'deadLetter',  // connect to DLQ
});

const dlqMessages = await dlqReceiver.receiveMessages(10);
for (const msg of dlqMessages) {
  console.log('DLQ reason:', msg.deadLetterReason);
  console.log('DLQ error:', msg.deadLetterErrorDescription);
  console.log('Body:', msg.body);
  // After investigation: replay or discard
  await dlqReceiver.completeMessage(msg); // discard from DLQ
}
await dlqReceiver.close();`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using Receive-and-Delete mode for critical message processing',
      wrong: `const receiver = sbClient.createReceiver('my-queue', { receiveMode: 'receiveAndDelete' });`,
      right: `const receiver = sbClient.createReceiver('my-queue', { receiveMode: 'peekLock' });
// Then: completeMessage() on success, abandonMessage() on failure`,
      explanation: 'Receive-and-Delete deletes the message as soon as it is delivered — if the consumer crashes between receiving and processing, the message is permanently lost. Peek-Lock is the reliable default: the message is invisible to others while you process it. Call completeMessage() to delete it on success, or abandonMessage() to return it to the queue for retry.'
    },
    {
      title: 'Not handling message lock expiry for long-running processing',
      wrong: `// Processing takes 10 minutes but lock duration is 60 seconds — another consumer picks up the same message`,
      right: `// Renew lock periodically: await receiver.renewMessageLock(msg);
// Or increase lock duration on the queue to accommodate processing time`,
      explanation: 'The default message lock is 60 seconds (max 5 minutes at namespace level). If processing takes longer, the lock expires and the message becomes visible again — another consumer picks it up, causing duplicate processing. Renew the lock every 30–45 seconds during long processing, or increase the queue lock duration. Design processors to be idempotent so duplicate delivery is safe.'
    },
    {
      title: 'Ignoring the Dead-Letter Queue — messages pile up silently',
      wrong: `# No DLQ monitoring — poisoned messages accumulate, filling the queue`,
      right: `az monitor metrics alert create --metric DeadletteredMessages --threshold 1 ...`,
      explanation: 'The DLQ absorbs messages that repeatedly fail processing. Without monitoring, it fills silently while the main queue appears healthy. Set an Azure Monitor alert on the DeadletteredMessages metric for every queue and subscription. Investigate DLQ messages promptly — they reveal processing bugs, schema mismatches, or downstream failures. A DLQ depth > 0 in production always warrants investigation.'
    },
    {
      title: 'Using Standard tier for production workloads needing VNet isolation',
      wrong: `az servicebus namespace create --sku Standard  # No VNet, no Private Endpoint, shared infra`,
      right: `az servicebus namespace create --sku Premium  # VNet injection, Private Endpoints, dedicated compute`,
      explanation: 'Standard tier uses shared infrastructure and does not support VNet integration or Private Endpoints. If your services are in a VNet and security policy requires all traffic to stay private, Standard tier cannot meet this requirement. Premium tier provides dedicated compute, VNet injection, Private Endpoints, messages up to 100 MB, and Geo-Disaster Recovery. Use Premium for any production workload with network isolation requirements.'
    },
  ];

  challenge: Challenge = {
    title: 'Message retry with exponential back-off',
    language: 'typescript',
    description: 'Service Bus retries messages up to MaxDeliveryCount times. Simulate the retry logic with exponential back-off:\n\nWrite retryWithBackoff<T>(fn: () => Promise<T>, maxAttempts: number, baseDelayMs: number): Promise<T> that retries fn up to maxAttempts times. Each retry waits baseDelayMs * 2^(attempt-1) ms. Throws the last error if all attempts fail.',
    hints: [
      'Use a for loop from 1 to maxAttempts',
      'On failure (catch), if not the last attempt, await a delay',
      'Delay = baseDelayMs * Math.pow(2, attempt - 1)',
      'A helper sleep = (ms: number) => new Promise(r => setTimeout(r, ms))',
    ],
    starterCode: `export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number,
  baseDelayMs: number
): Promise<T> {
  // implement retry with exponential back-off
  throw new Error('not implemented');
}`,
    solution: `const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number,
  baseDelayMs: number
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        console.log(\`Attempt \${attempt} failed. Retrying in \${delay}ms...\`);
        await sleep(delay);
      }
    }
  }
  throw lastError;
}

// Usage
let calls = 0;
const result = await retryWithBackoff(async () => {
  calls++;
  if (calls < 3) throw new Error('Transient failure');
  return 'success';
}, 5, 100);
console.log(result, 'after', calls, 'attempts'); // 'success' after 3 attempts`
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the difference between a Queue and a Topic in Azure Service Bus?',
      options: [
        'Queues support ordering; Topics do not',
        'Queue = point-to-point (one receiver per message); Topic = pub/sub (each Subscription gets a copy)',
        'Topics are faster; Queues provide better durability',
        'Queues are for Premium tier only; Topics work on Standard tier'
      ],
      answer: 1,
      explanation: 'Queue: one sender, one receiver per message — the first receiver to complete the message removes it. Topic: one sender, multiple Subscriptions each receive an independent copy. Use Queues for load-levelling between one producer and one consumer group. Use Topics when multiple independent consumers need the same event (inventory, billing, notifications all receive "order placed").'
    },
    {
      q: 'What happens when a message\'s delivery count exceeds MaxDeliveryCount?',
      options: [
        'The message is silently discarded',
        'The message is moved to the Dead-Letter Queue with reason MaxDeliveryCountExceeded',
        'The message is returned to the sender',
        'The queue is paused until an admin intervenes'
      ],
      answer: 1,
      explanation: 'Each time a message is received and abandoned (or the lock expires), the delivery count increments. When it exceeds MaxDeliveryCount (default 10), the message is automatically moved to the Dead-Letter Queue (DLQ) with deadLetterReason: MaxDeliveryCountExceeded. Monitor the DLQ to diagnose processing failures — messages there indicate a bug in your consumer or an unprocessable message.'
    },
    {
      q: 'What do Sessions in Azure Service Bus guarantee?',
      options: [
        'Messages are delivered exactly once with no duplicates',
        'All messages with the same SessionId are delivered in order to a single exclusive receiver',
        'Messages are processed faster via session-level batching',
        'Sessions enable AMQP WebSocket support for corporate firewalls'
      ],
      answer: 1,
      explanation: 'Sessions group messages by SessionId. A session receiver holds an exclusive lock on all messages in a session — no other consumer can receive messages from that session simultaneously. Messages are delivered in enqueue order within the session. This enables ordered, exclusive processing of related messages (e.g., all steps of a customer\'s order workflow, in sequence, by a single consumer).'
    },
    {
      q: 'What is the key difference between Peek-Lock and Receive-and-Delete receive modes?',
      options: [
        'Peek-Lock is for queues; Receive-and-Delete is for topics',
        'Peek-Lock locks the message during processing and requires explicit completion; Receive-and-Delete deletes the message immediately on delivery',
        'Peek-Lock supports sessions; Receive-and-Delete does not',
        'Receive-and-Delete is only available in Premium tier'
      ],
      answer: 1,
      explanation: 'Peek-Lock is the reliable mode: message is locked (invisible to others) during processing. On success call CompleteMessage() to delete it; on failure call AbandonMessage() to return it to the queue. Receive-and-Delete is fire-and-forget: the message is deleted the moment it is delivered. If the consumer crashes before processing completes, the message is lost permanently.'
    },
    {
      q: 'What does Azure Service Bus Geo-Disaster Recovery replicate?',
      options: [
        'Both metadata (queues, topics) and in-flight messages',
        'Only metadata (queue/topic/subscription definitions) — in-flight messages at failover time are lost',
        'Only in-flight messages — the consumer must recreate entities after failover',
        'Full replication of all data including message history up to 7 days'
      ],
      answer: 1,
      explanation: 'Classic Geo-Disaster Recovery (GDR) replicates only metadata (namespace entities: queues, topics, subscriptions, rules) to the secondary namespace. Messages already in the primary namespace at failover time are not replicated and are lost after failover. The newer Geo-Replication feature (Premium tier) replicates both metadata AND messages — use it when message loss on failover is unacceptable.'
    },
    {
      q: 'If a topic subscription has no active receiver for an extended period, what happens to the messages accumulating in that subscription?',
      options: [
        'They are automatically forwarded to all other subscriptions on the same topic',
        'They accumulate in that subscription\'s own dedicated message store until the subscription\'s max size is reached or the message TTL expires — other subscriptions on the same topic are unaffected',
        'The entire topic stops accepting new messages for all subscriptions until the idle subscription is drained',
        'Service Bus automatically deletes the idle subscription after 24 hours',
      ],
      answer: 1,
      explanation: 'Each subscription on a topic maintains its OWN independent copy of every matching message in its own logical queue-like store — a subscription with no consumer simply accumulates messages up to its configured max size or until messages expire via TTL, completely independently of every other subscription on the same topic. This isolation is what makes topics safe for fan-out to consumers with very different processing speeds or uptime: a slow or temporarily offline consumer\'s subscription filling up does not back up or block delivery to any other subscription\'s consumers.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use Azure Service Bus vs Azure Storage Queue vs Azure Event Hub?',
      a: '<strong>Service Bus</strong>: enterprise messaging — ordered delivery (sessions), dead-letter, message transactions, topics with filter rules, peek-lock, large messages (100 MB Premium). Use for: order processing, saga workflows, command patterns. <strong>Storage Queue</strong>: simple, cheap, at-least-once delivery. Max 64 KB messages. No ordering, no DLQ. Use for: decoupling services when reliability requirements are modest and cost is a priority. <strong>Event Hub</strong>: high-throughput event streaming (millions/sec), partitioned, configurable retention (1–90 days), consumer groups replay events from any position. Use for: telemetry ingestion, clickstream, IoT. Rule: complex business messaging → Service Bus; simple queuing → Storage Queue; big-data streaming → Event Hub.'
    },
    {
      q: 'How do you implement idempotent message processing with Service Bus?',
      a: 'Idempotency means processing the same message twice produces the same result as processing it once. Service Bus delivers at-least-once — duplicate delivery happens when a lock expires or a consumer crashes after receiving but before completing. Strategies: (1) <strong>MessageId deduplication</strong>: enable duplicate detection on the queue (deduplication window 10 seconds–7 days) — Service Bus discards messages with the same MessageId within the window. (2) <strong>Database upsert</strong>: use the MessageId as an idempotency key in your database — "INSERT ... ON CONFLICT DO NOTHING". (3) <strong>State check</strong>: before processing, check if the order is already in a processed state in your DB. The MessageId is exposed as msg.messageId on the received message.'
    },
    {
      q: 'What is a message forwarding chain and when is it useful?',
      a: 'Service Bus supports <strong>message forwarding</strong>: configure a queue or subscription to automatically forward messages to another queue or topic after they are received (ForwardTo property) or dead-lettered (ForwardDeadLetteredMessagesTo). Use cases: (1) <strong>Message routing</strong>: route messages through an intermediate queue for transformation or enrichment before reaching the final consumer. (2) <strong>DLQ consolidation</strong>: forward dead-lettered messages from many queues to a central dead-letter analysis queue. (3) <strong>Fan-out without topics</strong>: forward from one queue to multiple queues for consumer-specific processing (though Topics are usually cleaner for this).'
    },
    {
      q: 'How do you secure access to Azure Service Bus?',
      a: 'Two models: (1) <strong>Shared Access Signatures (SAS)</strong>: namespace or entity-level authorization rules with permissions (Send, Listen, Manage). Connection string embeds the rule name and key. Rotate keys regularly. (2) <strong>Entra ID RBAC</strong> (preferred): Azure Service Bus Data Sender (send only), Azure Service Bus Data Receiver (receive/complete only), Azure Service Bus Data Owner (full). Assign to a Managed Identity or service principal. No connection string in code — <code>new ServiceBusClient(namespace, new DefaultAzureCredential())</code>. Use RBAC for all new workloads; SAS only for legacy integrations or external partners that cannot use Entra ID.'
    },
    {
      q: 'What is message deferral in Service Bus and when do you use it?',
      a: '<strong>Message deferral</strong> (DeferMessageAsync): a receiver defers a message it is not ready to process yet — it stays in the queue but is no longer visible to competing consumers. Only the consumer that deferred it can retrieve it later by its sequence number (stored by the deferring consumer). Use deferral when messages arrive out of order but must be processed in sequence — defer early-arriving messages until their prerequisites complete. Unlike abandon (which returns the message to the queue for any consumer), deferral hides it exclusively for the same consumer. Use sessions instead when possible — they handle ordering more elegantly.'
    },
    {
      q: 'What is the dead-letter queue in Azure Service Bus and when are messages moved there?',
      a: 'The dead-letter queue (DLQ) is a sub-queue that receives messages that cannot be delivered or processed. Messages are moved there when: max delivery count is exceeded, TTL expires with DeadLetterOnMessageExpiration enabled, or an application explicitly dead-letters a message. Monitor the DLQ to detect processing failures and implement alerting on its count.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Azure Service Bus is enterprise messaging — Queues (point-to-point), Topics/Subscriptions (pub/sub with SQL filters), Sessions (ordered exclusive processing), and Dead-Letter Queue for unprocessable messages.',
    mustKnow: [
      'Queue = one receiver; Topic = pub/sub with Subscriptions each getting an independent copy',
      'Peek-Lock: lock message during processing → CompleteMessage() or AbandonMessage() — never Receive-and-Delete for critical flows',
      'Sessions: SessionId groups messages; exclusive, ordered delivery to one receiver per session',
      'DLQ: messages with DeliveryCount > MaxDeliveryCount (default 10) auto-moved here — monitor and alert on DLQ depth',
      'Premium tier: dedicated compute, up to 100 MB messages, VNet injection, Private Endpoints, Geo-Replication',
      'RBAC with Managed Identity: no connection strings — use Azure Service Bus Data Sender/Receiver roles',
    ],
    interviewFocus: [
      'What is the difference between a Queue and a Topic with Subscriptions?',
      'Explain Peek-Lock vs Receive-and-Delete and when you would use each',
      'What are Sessions in Service Bus and what ordering guarantees do they provide?',
      'What happens when MaxDeliveryCount is exceeded and how do you handle the DLQ?',
    ],
  };
}
