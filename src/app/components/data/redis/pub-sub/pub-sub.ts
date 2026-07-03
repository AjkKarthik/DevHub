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
    {
      heading: 'Redis Pub/Sub Limitations Compared to a Message Queue',
      points: [
        'Redis Pub/Sub is fire-and-forget — messages published to a channel are delivered only to subscribers currently connected at the moment of publish; a subscriber that connects even a moment after a message was published will never see it, unlike a durable message queue.',
        'There is no message persistence or replay capability in basic Pub/Sub — if no subscribers are connected when a message is published, that message is simply lost forever, making Pub/Sub unsuitable for use cases requiring guaranteed delivery.',
        'Redis Streams (a separate, more capable data structure) address these limitations by persisting messages and supporting consumer groups with acknowledgment — appropriate for use cases genuinely requiring reliable message delivery, while Pub/Sub remains appropriate for real-time, ephemeral notifications where occasional missed messages are acceptable.',
        'Pub/Sub is commonly used for cross-instance coordination in a horizontally-scaled application — such as notifying all connected WebSocket server instances that a specific user\'s data changed, so each instance can push an update to any of that user\'s connections it happens to be holding.',
      ],
    },
    {
      heading: 'Pattern Subscriptions and Sharded Pub/Sub',
      points: [
        'PSUBSCRIBE lets a client subscribe to a pattern (like news.* to receive all messages published to any channel starting with "news.") rather than a single exact channel name — useful for building flexible routing where the exact set of channels is not known in advance.',
        'Sharded Pub/Sub (introduced in Redis 7, using SSUBSCRIBE) is specifically designed for Redis Cluster deployments — regular Pub/Sub messages are broadcast to every node in a cluster regardless of where subscribers are connected, while sharded Pub/Sub routes messages only to the specific shard responsible for that channel, reducing unnecessary cross-node traffic.',
        'Because Pub/Sub delivery is not persisted, a client experiencing a brief disconnect and reconnect will have missed any messages published during that gap — application logic that requires no message loss must use Streams instead, or implement its own gap-detection and recovery mechanism on top of Pub/Sub.',
        'Monitoring the number of active subscribers per channel (PUBSUB NUMSUB) helps verify that a publish-side feature is actually reaching the expected number of connected consumers, useful for debugging situations where published messages appear to have no effect.',
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
    {
      q: 'Are Redis Pub/Sub messages persisted?',
      options: ['Yes, for 24 hours by default', 'No, messages are fire-and-forget — subscribers that are offline miss messages', 'Yes, until acknowledged', 'Yes, if AOF is enabled'],
      answer: 1,
      explanation: 'Redis Pub/Sub is fire-and-forget — messages are not stored. If a subscriber is offline, they miss messages. For durability and consumer groups with replay, use Redis Streams instead of Pub/Sub.',
    },
    {
      q: 'What does PSUBSCRIBE do differently from SUBSCRIBE?',
      options: ['PSUBSCRIBE persists messages; SUBSCRIBE does not', 'PSUBSCRIBE subscribes to channels matching a glob pattern; SUBSCRIBE subscribes to exact channel names', 'PSUBSCRIBE is for private channels', 'PSUBSCRIBE uses push protocol; SUBSCRIBE uses pull'],
      answer: 1,
      explanation: 'PSUBSCRIBE pattern (e.g., news.*) subscribes to all channels matching the glob. Messages arrive as pmessage events with the matched pattern and channel. Useful when you do not know channel names in advance.',
    },
    {
      q: 'Can you use regular Redis commands on a connection in SUBSCRIBE mode?',
      options: ['Yes, all commands work normally', 'No, a subscribed connection can only use SUBSCRIBE, UNSUBSCRIBE, PSUBSCRIBE, PUNSUBSCRIBE, PING, and RESET', 'Yes, but only read commands', 'Only after unsubscribing from all channels'],
      answer: 1,
      explanation: 'Once you SUBSCRIBE, the connection enters subscriber mode — it can only receive messages and use the listed commands. Other commands return errors. Always use a dedicated connection for Pub/Sub; do not share it with regular commands.',
    },
    {
      q: 'What are Redis keyspace notifications?',
      options: ['Notifications sent to the Redis admin when memory is low', 'Pub/Sub events published when keys are modified — enabling subscribers to react to SET, DEL, EXPIRE events', 'Alerts triggered by slow queries', 'Notifications for cluster topology changes'],
      answer: 1,
      explanation: 'Keyspace notifications (notify-keyspace-events config) publish messages on __keyevent@db__:event or __keyspace@db__:key channels when keys are modified. Useful for cache invalidation or TTL expiry triggers. Disabled by default (performance cost).',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Can I use Redis Pub/Sub across a Redis Cluster?',
      a: 'Yes, but with limitations. In Cluster mode, PUBLISH broadcasts to all nodes, and each node fans out to its local subscribers. PUBSUB CHANNELS only shows channels on the node it is sent to, not the full cluster view. For cross-cluster pub/sub visibility, query all nodes. This makes PUBLISH work correctly, but administrative commands like PUBSUB CHANNELS need per-node querying.',
    },
    {
      q: 'How do you subscribe to multiple channels in Redis?',
      a: '<code>SUBSCRIBE ch1 ch2 ch3</code> subscribes to multiple exact channels in one command. Messages arrive as arrays: [type, channel, message]. <code>PSUBSCRIBE news.* sports.*</code> subscribes to glob patterns. Use separate SUBSCRIBE/PSUBSCRIBE calls or pass multiple names to a single call. Each subscription returns a confirmation message.',
    },
    {
      q: 'What is the difference between Pub/Sub and Redis Streams for messaging?',
      a: 'Pub/Sub: real-time broadcast, no persistence, offline subscribers miss messages, no consumer groups. Streams: persistent (until trimmed), consumer groups for reliable delivery, message acknowledgment, replay from any offset. Use Pub/Sub for ephemeral broadcasts (live updates, presence); use Streams for reliable message queues.',
    },
    {
      q: 'How do you implement presence detection with Redis Pub/Sub?',
      a: 'On connect: PUBLISH presence:join userId. On disconnect: PUBLISH presence:leave userId. Subscribers track online users in a set. Add a heartbeat: publish every 30s with SETEX user:online:id 60 1 (auto-expires = offline detection). Keyspace notifications on expired events can also detect disconnection.',
    },
    {
      q: 'Are Redis keyspace notification events guaranteed to be delivered to a subscriber, and what does that mean for using them as a reliability-critical mechanism?',
      a: 'No — keyspace notifications are delivered via ordinary Redis Pub/Sub under the hood, which inherits Pub/Sub\'s at-most-once, fire-and-forget delivery semantics: if a subscriber is disconnected, slow, or simply not yet connected when a key expires or changes, that notification is lost forever with no replay mechanism, no persistence, and no way to know it was missed. This makes keyspace notifications a reasonable BEST-EFFORT trigger for things like cache-warming or logging, but a poor foundation for anything requiring reliable delivery (like guaranteed session cleanup or billing-critical expiry handling) — for guaranteed processing of expiry-like events, a Redis Stream (which persists entries and supports consumer groups with acknowledgment) is the more appropriate building block.',
    },
    {
      q: 'Can Redis Pub/Sub messages be delivered to offline subscribers?',
      a: 'No. Pub/Sub is fire-and-forget — if a subscriber is offline, the message is lost. This is a fundamental design constraint. If you need guaranteed delivery to offline consumers, use <strong>Redis Streams</strong> (persisted, consumer groups, replay) or a dedicated message broker like RabbitMQ or Kafka.',
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
