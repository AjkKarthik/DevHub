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
  selector: 'app-rabbitmq-exchanges',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './rabbitmq-exchanges.html',
  styleUrl: './rabbitmq-exchanges.scss'
})
export class RabbitMqExchanges {
  readonly quickRef: QuickRefItem[] = [
    { name: 'direct', type: 'keyword', desc: 'Routes by exact routing key match to bound queues' },
    { name: 'fanout', type: 'keyword', desc: 'Broadcasts to all bound queues, ignores routing key' },
    { name: 'topic', type: 'keyword', desc: 'Routes by wildcard routing key (* = one word, # = zero or more)' },
    { name: 'headers', type: 'keyword', desc: 'Routes by message header attributes instead of routing key' },
    { name: 'default exchange', type: 'keyword', desc: 'Nameless direct exchange; every queue auto-bound by its name' },
    { name: 'routing key', type: 'keyword', desc: 'String used by direct/topic exchanges to match bindings' },
    { name: 'binding key', type: 'keyword', desc: 'Pattern set when binding a queue to a topic exchange' },
    { name: 'alternate exchange', type: 'keyword', desc: 'Receives unroutable messages when no binding matches' },
  ];

  readonly theory: TheoryPoint[] = [
    {
      heading: 'Direct Exchange: Exact Key Match',
      points: [
        'A direct exchange routes a message to queues whose binding key exactly matches the routing key.',
        'Multiple queues can bind with the same key — in that case all receive the message (multicast).',
        'The built-in default exchange ("") is a direct exchange where each queue is auto-bound by its own name.',
        'Use for task routing where the task type is known at publish time (e.g. routing key "email", "sms").',
      ]
    },
    {
      heading: 'Fanout Exchange: Broadcast',
      points: [
        'A fanout exchange delivers every message to all currently bound queues, ignoring routing keys.',
        'Ideal for pub/sub: notification hub, cache invalidation, live dashboards.',
        'Dynamic subscription: bind a new queue at runtime to start receiving all future messages.',
        'No filtering — every consumer sees every message sent to the exchange.',
      ]
    },
    {
      heading: 'Topic Exchange: Wildcard Routing',
      points: [
        '* matches exactly one word in a dot-separated routing key (e.g. "order.*" matches "order.created" but not "order.item.created").',
        '# matches zero or more words (e.g. "order.#" matches "order.created", "order.item.created").',
        'Topic exchanges enable fine-grained subscriptions: analytics binds "#", audit binds "payment.#", etc.',
        'Most flexible exchange type — subsumes direct (exact match) and fanout (# binding).',
      ]
    },
  ];

  readonly codeTabs: CodeTab[] = [
    {
      label: 'Direct Exchange',
      language: 'typescript',
      code: `import amqplib from 'amqplib';

const conn = await amqplib.connect('amqp://localhost');
const ch   = await conn.createChannel();

await ch.assertExchange('notifications', 'direct', { durable: true });
await ch.assertQueue('email-q',  { durable: true });
await ch.assertQueue('sms-q',    { durable: true });

// Bind with specific routing keys
await ch.bindQueue('email-q', 'notifications', 'email');
await ch.bindQueue('sms-q',   'notifications', 'sms');

// Publish: only email-q receives this
ch.publish('notifications', 'email',
  Buffer.from(JSON.stringify({ to: 'user@example.com', subject: 'Welcome' })),
  { persistent: true }
);

// Publish: only sms-q receives this
ch.publish('notifications', 'sms',
  Buffer.from(JSON.stringify({ phone: '+1234567890', text: 'Your code: 4321' })),
  { persistent: true }
);`,
    },
    {
      label: 'Fanout Exchange',
      language: 'typescript',
      code: `import amqplib from 'amqplib';

const conn = await amqplib.connect('amqp://localhost');
const ch   = await conn.createChannel();

await ch.assertExchange('events', 'fanout', { durable: true });

// Each service gets its own queue
const { queue: analyticsQ } = await ch.assertQueue('', { exclusive: true });
const { queue: auditQ }     = await ch.assertQueue('', { exclusive: true });

// Bind both — no routing key needed
await ch.bindQueue(analyticsQ, 'events', '');
await ch.bindQueue(auditQ,     'events', '');

// Consume in analytics service
ch.consume(analyticsQ, (msg) => {
  if (msg) console.log('[analytics]', msg.content.toString());
});

// Consume in audit service
ch.consume(auditQ, (msg) => {
  if (msg) console.log('[audit]', msg.content.toString());
});

// Publish — both queues receive
ch.publish('events', '', Buffer.from(JSON.stringify({ type: 'user.login' })));`,
    },
    {
      label: 'Topic Exchange',
      language: 'typescript',
      code: `import amqplib from 'amqplib';

const conn = await amqplib.connect('amqp://localhost');
const ch   = await conn.createChannel();

await ch.assertExchange('logs', 'topic', { durable: true });

// Bind with wildcard patterns
await ch.assertQueue('all-logs',     { durable: true });
await ch.assertQueue('order-logs',   { durable: true });
await ch.assertQueue('error-logs',   { durable: true });

await ch.bindQueue('all-logs',   'logs', '#');          // everything
await ch.bindQueue('order-logs', 'logs', 'order.*');    // order.created, order.shipped
await ch.bindQueue('error-logs', 'logs', '*.error');    // payment.error, order.error

// Routing key: "order.created" → goes to all-logs + order-logs
ch.publish('logs', 'order.created',
  Buffer.from('Order #42 placed'));

// Routing key: "payment.error" → goes to all-logs + error-logs
ch.publish('logs', 'payment.error',
  Buffer.from('Card declined'));`,
    },
  ];

  readonly mistakes: CommonMistake[] = [
    {
      title: 'Using fanout when only specific consumers should receive a message',
      wrong: `// Fanout sends to ALL queues — auth queue gets payment messages too
await ch.assertExchange('events', 'fanout', { durable: true });
ch.publish('events', '', Buffer.from(JSON.stringify(paymentEvent)));`,
      right: `// Topic exchange: payment consumers bind 'payment.#', auth consumers bind 'auth.#'
await ch.assertExchange('events', 'topic', { durable: true });
ch.publish('events', 'payment.completed', Buffer.from(JSON.stringify(paymentEvent)));`,
      explanation: 'Fanout broadcasts indiscriminately. Use direct or topic exchanges when only specific services should receive specific event types.'
    },
    {
      title: 'Forgetting to rebind queues after exchange recreation',
      wrong: `// Exchange deleted and recreated — old bindings are gone
await ch.deleteExchange('events');
await ch.assertExchange('events', 'direct', { durable: true });
// queue-a is no longer bound!`,
      right: `// Always re-assert bindings after recreating an exchange
await ch.assertExchange('events', 'direct', { durable: true });
await ch.bindQueue('queue-a', 'events', 'key-a');`,
      explanation: 'Deleting an exchange removes all its bindings. Re-assert all bindings when recreating.'
    },
    {
      title: 'Confusing * and # in topic routing keys',
      wrong: `// Expecting 'order.#' to match 'order' (no dot)
// '#' matches zero or more words — 'order.#' does NOT match bare 'order'`,
      right: `// Bind 'order' explicitly or use '#' on its own
await ch.bindQueue('q', 'logs', 'order');    // exact match
await ch.bindQueue('q', 'logs', 'order.#'); // order.anything`,
      explanation: '# matches zero or more dot-separated words AFTER the preceding dot. Use a separate exact binding for the bare key.'
    },
    {
      title: 'Publishing to the wrong exchange name',
      wrong: `// Typo: 'notification' instead of 'notifications'
ch.publish('notification', 'email', Buffer.from(msg));
// No exchange named 'notification' — message silently dropped`,
      right: `// Assert the exchange before publishing to catch typos
await ch.assertExchange('notifications', 'direct', { durable: true });
ch.publish('notifications', 'email', Buffer.from(msg));`,
      explanation: 'AMQP drops messages published to non-existent exchanges. Always assert the exchange in producer code, or configure an alternate exchange to catch unroutable messages.'
    },
  ];

  readonly challenge: Challenge = {
    title: 'Multi-Service Notification Router',
    language: 'typescript',
    description: 'Set up a topic exchange named "platform-events". Bind three queues: "billing-q" listens to "billing.*", "user-q" listens to "user.*", and "admin-q" listens to "#". Publish three events with different routing keys and verify each queue receives the correct subset.',
    hints: [
      'Use ch.assertExchange with type "topic"',
      'Bind each queue with ch.bindQueue using the wildcard patterns',
      'Use ch.get() to check queue contents without a running consumer',
    ],
    starterCode: `import amqplib from 'amqplib';

async function setup() {
  const conn = await amqplib.connect('amqp://localhost');
  const ch   = await conn.createChannel();
  // TODO: exchange, queues, bindings, publish 3 events
}`,
    solution: `import amqplib from 'amqplib';

async function setup() {
  const conn = await amqplib.connect('amqp://localhost');
  const ch   = await conn.createChannel();

  await ch.assertExchange('platform-events', 'topic', { durable: true });

  await ch.assertQueue('billing-q', { durable: true });
  await ch.assertQueue('user-q',    { durable: true });
  await ch.assertQueue('admin-q',   { durable: true });

  await ch.bindQueue('billing-q', 'platform-events', 'billing.*');
  await ch.bindQueue('user-q',    'platform-events', 'user.*');
  await ch.bindQueue('admin-q',   'platform-events', '#');

  ch.publish('platform-events', 'billing.invoice',
    Buffer.from('Invoice created'));          // → billing-q + admin-q

  ch.publish('platform-events', 'user.registered',
    Buffer.from('New user'));                 // → user-q + admin-q

  ch.publish('platform-events', 'system.health',
    Buffer.from('Health OK'));                // → admin-q only

  console.log('Published. billing-q: 1, user-q: 1, admin-q: 3');
  await ch.close(); await conn.close();
}`,
  };

  readonly quiz: QuizQuestion[] = [
    { q: 'Which exchange type broadcasts to ALL bound queues regardless of routing key?', options: ['direct', 'fanout', 'topic', 'headers'], answer: 1, explanation: 'Fanout ignores routing keys and delivers to every bound queue.' },
    { q: 'In a topic exchange, which binding key matches "order.item.shipped"?', options: ['order.*', 'order.#', 'order.item', 'order'], answer: 1, explanation: '"order.#" matches zero or more words after "order.". "order.*" only matches one word after "order.".' },
    { q: 'What does the default (nameless "") exchange provide?', options: ['Fanout to all queues', 'A direct exchange where queues bind by their own name', 'A topic exchange with # binding', 'Headers-based routing'], answer: 1, explanation: 'Every queue is auto-bound to the default exchange using its own name as the routing key.' },
    { q: 'What happens to a message published to a topic exchange with no matching binding?', options: ['Delivered to all queues', 'Returned to producer', 'Dropped (or sent to alternate exchange)', 'Requeued with delay'], answer: 2, explanation: 'Unroutable messages are dropped unless an alternate exchange is configured on the exchange.' },
  ];

  readonly qna: QnaItem[] = [
    { q: 'When should I use a headers exchange over a topic exchange?', a: 'Headers exchanges route based on arbitrary message header key-value pairs rather than a routing key string. Use them when routing criteria don\'t map naturally to a dot-separated key, e.g., routing by content-type and priority simultaneously.' },
    { q: 'Can one queue bind to multiple exchanges?', a: 'Yes. A queue can have bindings to many exchanges simultaneously. Messages from any exchange whose binding matches will be delivered to the same queue.' },
    { q: 'What is an alternate exchange and when is it useful?', a: 'An alternate exchange receives messages that couldn\'t be routed by the main exchange (no matching binding). It\'s set via the x-alternate-exchange argument and is useful for debugging, dead-letter monitoring, or fallback handling.' },
  ];

  readonly revision: RevisionSummary = {
    oneLiner: 'Choose exchange type by routing need: direct=exact, fanout=broadcast, topic=wildcard pattern.',
    mustKnow: [
      'Direct: exact routing key match; fanout: all queues; topic: * (one word) / # (many words)',
      'Default exchange ("") auto-binds every queue by its own name',
      'Fanout ignores routing keys — all queues receive all messages',
      'Topic is the most flexible — subsumes direct and fanout with right binding keys',
      'Unroutable messages are dropped unless alternate exchange configured',
      'Queues can bind to multiple exchanges; one exchange can route to many queues',
    ],
    interviewFocus: [
      'When to use each exchange type with real examples',
      'Topic wildcard: * vs # — common interview trap',
      'How fanout enables pub/sub without Kafka',
      'Alternate exchange for unroutable message handling',
    ],
  };
}
