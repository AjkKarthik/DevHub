import { Component } from '@angular/core';
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
  selector: 'app-redis-pub-sub',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            RevisionCardComponent, PageCompleteComponent],
  templateUrl: './pub-sub.html',
  styleUrl: './pub-sub.scss',
})
export class RedisPubSub {
  quickRef: QuickRefItem[] = [
    { name: 'SUBSCRIBE channel [channel...]', type: 'keyword', desc: 'Subscribe to one or more channels; connection enters subscribe mode' },
    { name: 'UNSUBSCRIBE [channel...]', type: 'keyword', desc: 'Unsubscribe; no arg = unsubscribe from all channels' },
    { name: 'PUBLISH channel message', type: 'keyword', desc: 'Publish a message; returns subscriber count' },
    { name: 'PSUBSCRIBE pattern [pattern...]', type: 'keyword', desc: 'Pattern subscribe: glob patterns (h?llo, h*llo, h[ae]llo)' },
    { name: 'PUNSUBSCRIBE [pattern...]', type: 'keyword', desc: 'Unsubscribe from pattern subscriptions' },
    { name: 'PUBSUB CHANNELS [pattern]', type: 'keyword', desc: 'List active channels with subscribers' },
    { name: 'PUBSUB NUMSUB [channel...]', type: 'keyword', desc: 'Subscriber count per channel' },
    { name: 'PUBSUB NUMPAT', type: 'keyword', desc: 'Total count of active pattern subscriptions' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Pub/Sub Model — Fire-and-Forget',
      points: [
        'Redis Pub/Sub is a fire-and-forget messaging system. Publishers send messages to channels; all current subscribers on that channel receive the message immediately.',
        'Messages are NOT stored. If no subscribers are connected when PUBLISH is called, the message is silently dropped. There is no message history, no replay, and no acknowledgement.',
        'A connection enters subscribe mode after the first SUBSCRIBE or PSUBSCRIBE command. In this mode, the only valid commands are SUBSCRIBE, UNSUBSCRIBE, PSUBSCRIBE, PUNSUBSCRIBE, PING, and QUIT. Regular Redis commands (GET, SET) are not allowed on a subscribed connection.',
        'This means two separate connections are needed per client: one for publishing and one (in subscribe mode) for receiving.',
        'PUBLISH returns the number of clients that received the message. A return value of 0 means no subscribers were listening.',
      ],
    },
    {
      heading: 'Pattern Subscriptions (PSUBSCRIBE)',
      points: [
        'PSUBSCRIBE allows glob-style pattern matching: `?` matches one character, `*` matches any sequence, `[ae]` matches one of the listed chars.',
        'A message may be delivered to a client multiple times if it matches both a direct SUBSCRIBE and a PSUBSCRIBE pattern. The client must deduplicate if needed.',
        'Pattern subscriptions are slightly more expensive than direct subscriptions because Redis checks all active patterns for every PUBLISH.',
        'Use PSUBSCRIBE for event namespacing (e.g. `events:user:*`) and direct SUBSCRIBE for fixed channels.',
      ],
    },
    {
      heading: 'Limitations and When to Use Streams Instead',
      points: [
        'No persistence: messages lost when no subscriber is connected — not suitable for reliable job queues or event sourcing.',
        'No consumer groups: all subscribers on a channel receive every message. You cannot distribute messages across a pool of workers.',
        'No backpressure: a slow subscriber will have messages queued in Redis\'s client output buffer. If the buffer fills, Redis disconnects the subscriber.',
        'Use Pub/Sub for real-time fanout (chat, live dashboards, cache invalidation signals). Use Redis Streams for reliable, ordered, at-least-once delivery with consumer groups.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Publisher & Subscriber',
      language: 'typescript',
      code: `import Redis from 'ioredis';

// Publisher — regular connection
const publisher = new Redis();

// Subscriber — dedicated connection (cannot run regular commands)
const subscriber = new Redis();

// Subscribe to a channel
await subscriber.subscribe('notifications:user:42');

subscriber.on('message', (channel, message) => {
  console.log(\`[\${channel}] \${message}\`);
  // Parse JSON payloads
  const data = JSON.parse(message);
  console.log('Event:', data.type, data.payload);
});

// Publish a message
const received = await publisher.publish(
  'notifications:user:42',
  JSON.stringify({ type: 'ORDER_SHIPPED', payload: { orderId: 'ORD-001' } })
);
console.log(\`Delivered to \${received} subscriber(s)\`);`,
    },
    {
      label: 'Pattern Subscribe',
      language: 'typescript',
      code: `import Redis from 'ioredis';
const subscriber = new Redis();

// Subscribe to all user event channels
await subscriber.psubscribe('events:user:*');

subscriber.on('pmessage', (pattern, channel, message) => {
  // pattern: 'events:user:*'
  // channel: 'events:user:123'
  const userId = channel.split(':')[2];
  const event = JSON.parse(message);
  console.log(\`User \${userId}: \${event.type}\`);
});

// Inspect pub/sub state
const pub = new Redis();
const channels = await pub.pubsub('CHANNELS', 'events:*');
const counts = await pub.pubsub('NUMSUB', ...channels);
console.log('Active channels:', channels, 'Counts:', counts);`,
    },
    {
      label: 'Cache Invalidation',
      language: 'typescript',
      code: `import Redis from 'ioredis';
const redis = new Redis();
const subscriber = new Redis();

// Publisher: invalidate cache on data change
async function updateUser(userId: string, data: object) {
  await redis.set(\`user:\${userId}\`, JSON.stringify(data));
  await redis.publish('cache:invalidate', JSON.stringify({ key: \`user:\${userId}\` }));
}

// Subscriber: all app servers listen and evict local in-memory cache
await subscriber.subscribe('cache:invalidate');
const localCache = new Map<string, unknown>();

subscriber.on('message', (_, msg) => {
  const { key } = JSON.parse(msg);
  localCache.delete(key);
  console.log('Evicted local cache:', key);
});`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Running regular commands on a subscribed connection',
      wrong: `const redis = new Redis();
await redis.subscribe('channel');
await redis.get('somekey'); // ERR: connection is in subscribe mode`,
      right: `const subscriber = new Redis(); // dedicated subscriber connection
const publisher = new Redis();  // regular connection for other commands
await subscriber.subscribe('channel');`,
      explanation: 'Once a connection is in subscribe mode, only SUBSCRIBE, UNSUBSCRIBE, PSUBSCRIBE, PUNSUBSCRIBE, PING, and QUIT are allowed. Always use a separate connection for publishing and regular Redis operations.',
    },
    {
      title: 'Using Pub/Sub as a reliable job queue',
      wrong: `// Worker subscribes; messages are "jobs"
await subscriber.subscribe('jobs');
// If worker is down, jobs are lost`,
      right: `// Use Redis Streams or a list-based queue for reliable delivery
// XADD jobs * type "email" to "user@example.com"
// Consumer groups ensure each job is processed once`,
      explanation: 'Pub/Sub drops messages if no subscriber is connected. For reliable job queues, use Redis Streams (XADD/XREADGROUP) which persist messages and support consumer groups with acknowledgement.',
    },
    {
      title: 'Not handling subscriber disconnection',
      wrong: `subscriber.on('message', handler);
// no reconnection handling`,
      right: `subscriber.on('reconnecting', () => console.log('Reconnecting...'));
subscriber.on('ready', async () => {
  // Re-subscribe after reconnection — ioredis auto-resubscribes by default
  console.log('Resubscribed');
});`,
      explanation: 'Network interruptions drop Pub/Sub subscriptions. ioredis auto-resubscribes by default, but confirm this behaviour for your client library and handle the reconnecting event to avoid silent message loss.',
    },
  ];

  challenge: Challenge = {
    title: 'Live Dashboard Fanout',
    language: 'typescript',
    description: 'Write a `DashboardBroadcaster` class with: `publish(metric, value)` that publishes to `dashboard:metrics` channel as JSON `{metric, value, ts}`, and `subscribe(onMetric)` that subscribes and calls `onMetric` for each message. The subscriber should auto-reconnect on disconnect.',
    hints: [
      'Use two separate Redis connections — one for publish, one for subscribe',
      'ioredis handles reconnection automatically',
    ],
    starterCode: `import Redis from 'ioredis';

class DashboardBroadcaster {
  private publisher = new Redis();
  private subscriber = new Redis();

  async publish(metric: string, value: number): Promise<void> {}
  subscribe(onMetric: (metric: string, value: number, ts: number) => void): void {}
}`,
    solution: `import Redis from 'ioredis';

class DashboardBroadcaster {
  private publisher = new Redis();
  private subscriber = new Redis();
  private readonly CHANNEL = 'dashboard:metrics';

  async publish(metric: string, value: number): Promise<void> {
    await this.publisher.publish(this.CHANNEL, JSON.stringify({ metric, value, ts: Date.now() }));
  }

  subscribe(onMetric: (metric: string, value: number, ts: number) => void): void {
    this.subscriber.subscribe(this.CHANNEL);
    this.subscriber.on('message', (_, msg) => {
      const { metric, value, ts } = JSON.parse(msg);
      onMetric(metric, value, ts);
    });
  }
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What happens to a PUBLISH message when no subscribers are connected?',
      options: ['It is stored until a subscriber connects', 'It is silently dropped', 'PUBLISH returns an error', 'It is stored for 60 seconds'],
      answer: 1,
      explanation: 'Redis Pub/Sub is fire-and-forget. Messages are not stored. If no subscribers are connected when PUBLISH is called, the message is silently dropped and PUBLISH returns 0.',
    },
    {
      q: 'Which command tells you how many clients are subscribed to a specific channel?',
      options: ['PUBSUB CHANNELS', 'PUBSUB NUMSUB channel', 'PUBSUB NUMPAT', 'INFO pubsub'],
      answer: 1,
      explanation: 'PUBSUB NUMSUB channel returns the subscriber count for each specified channel. PUBSUB CHANNELS lists active channels; PUBSUB NUMPAT returns the total count of pattern subscriptions.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Can I use Redis Pub/Sub across a Redis Cluster?',
      a: 'Yes, but with limitations. In Cluster mode, PUBLISH broadcasts to all nodes, and each node fans out to its local subscribers. PUBSUB CHANNELS only shows channels on the node it is sent to, not the full cluster view. For cross-cluster pub/sub visibility, query all nodes. This makes PUBLISH work correctly, but administrative commands like PUBSUB CHANNELS need per-node querying.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Pub/Sub is fire-and-forget fanout — no persistence, no consumer groups; use separate connections for publishing vs subscribing; use Streams for reliable delivery.',
    mustKnow: [
      'Messages are NOT stored — dropped if no subscriber is connected',
      'Subscribed connection can only run SUBSCRIBE/UNSUBSCRIBE/PING — use a separate connection for other commands',
      'PUBLISH returns number of subscribers that received the message',
      'PSUBSCRIBE for glob patterns; a message may match both direct + pattern subscriptions',
      'No consumer groups — all subscribers get every message (fanout only)',
      'Use Streams instead for reliable, at-least-once delivery with acknowledgement',
    ],
    interviewFocus: [
      'What are the limitations of Redis Pub/Sub vs Streams?',
      'Why do you need two connections per client for pub/sub?',
      'How does PSUBSCRIBE differ from SUBSCRIBE?',
      'When would you choose Streams over Pub/Sub?',
    ],
  };
}
