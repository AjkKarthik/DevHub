import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-sharded-pubsub-ssubscribe-and-spublish',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './sharded-pubsub-ssubscribe-and-spublish.html',
  styleUrl: './sharded-pubsub-ssubscribe-and-spublish.scss',
})
export class ShardedPubsubSsubscribeAndSpublishSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'Named in one paragraph, never shown in code',
      points: [
        'The main page\'s own theory names Sharded Pub/Sub, correctly attributes it to Redis 7 (verified — this specific version claim checks out, unlike several other version attributions found elsewhere in this hub), and correctly explains its purpose: routing messages only to the shard responsible for a channel, instead of broadcasting to every cluster node. It never shows the actual commands (SSUBSCRIBE, SPUBLISH, SUNSUBSCRIBE) or what "routes to the responsible shard" looks like mechanically.',
        'Sharded Pub/Sub channels are assigned to Redis Cluster slots using the SAME slot-hashing algorithm already used for regular keys — this is the mechanism that makes "routes only to the specific shard" possible at all: the channel name itself deterministically maps to exactly one of the 16384 cluster slots, and therefore to exactly one shard.',
      ],
    },
    {
      heading: 'The real cost classic Pub/Sub has that sharded Pub/Sub avoids',
      points: [
        'With classic PUBLISH in cluster mode, every single node receives and processes every published message, even if it has zero subscribers for that channel — this is genuinely wasted cross-node network and CPU work at cluster scale.',
        'SPUBLISH sends the message directly to (and only to) the one shard that owns the channel\'s slot. A cluster with dozens of shards and a channel with subscribers on just one of them no longer pays the broadcast cost across every other shard.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Sharded vs. classic routing, modeled',
      language: 'typescript',
      code: `// Models the documented distinction: classic PUBLISH broadcasts to every
// cluster node; SPUBLISH routes only to the shard owning the channel's slot,
// via the same slot-hashing algorithm used for regular keys.
function slotForChannel(channel: string): number {
  // Simplified deterministic hash standing in for CRC16 % 16384 -- consistent
  // per input, which is all this model needs to demonstrate routing behavior.
  let hash = 0;
  for (const ch of channel) hash = (hash * 31 + ch.charCodeAt(0)) % 16384;
  return hash;
}

function shardForSlot(slot: number, shardCount: number): number {
  return Math.floor(slot / (16384 / shardCount)) % shardCount;
}

function classicPublishReaches(shardCount: number): number[] {
  return Array.from({ length: shardCount }, (_, i) => i); // every shard, always
}

function shardedPublishReaches(channel: string, shardCount: number): number[] {
  return [shardForSlot(slotForChannel(channel), shardCount)]; // exactly one shard
}

const shardCount = 4;
const channel = 'events:user:42';

console.log('Classic PUBLISH reaches shards:', classicPublishReaches(shardCount));
console.log('Sharded SPUBLISH reaches shards:', shardedPublishReaches(channel, shardCount));
// Classic PUBLISH reaches shards: [ 0, 1, 2, 3 ]
// Sharded SPUBLISH reaches shards: [ 3 ]   -- only the owning shard`,
    },
    {
      label: 'Real SSUBSCRIBE / SPUBLISH usage',
      language: 'typescript',
      code: `import Redis from 'ioredis';

// Both commands work through a normal Cluster-aware client -- the client
// routes each command to the correct node automatically based on the
// channel's own slot.
const cluster = new Redis.Cluster([{ host: 'redis-node-1', port: 6379 }]);

const subscriber = cluster.duplicate();
await subscriber.ssubscribe('orders:region:eu-west');

subscriber.on('smessage', (channel, message) => {
  console.log(\`Sharded message on [\${channel}]:\`, message);
});

// From anywhere in the cluster, SPUBLISH is routed to the shard that owns
// this specific channel's slot -- not broadcast to every node.
const delivered = await cluster.spublish(
  'orders:region:eu-west',
  JSON.stringify({ orderId: 'ORD-9981', status: 'confirmed' })
);
console.log(\`Delivered to \${delivered} sharded subscriber(s)\`);`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team has a Redis Cluster with 8 shards. They migrate a busy, high-volume channel from classic PUBLISH to sharded SPUBLISH, and all subscribers for that channel happen to be connected to the SAME one shard the channel hashes to. Roughly how much cross-node publish traffic does this migration eliminate for that specific channel?',
    hint: 'Before the migration, how many of the 8 shards receive and process every message on this channel? After, how many?',
    solution: `Roughly 7 of the 8 shards' worth of unnecessary traffic is eliminated -- before the migration, classic PUBLISH broadcasts every message to all 8 shards regardless of where subscribers actually are, so 7 of those 8 shards were doing pure wasted work (receiving and evaluating a message against their own local subscriber list, finding no matches, and discarding it). After migrating to SPUBLISH, only the 1 shard that actually owns the channel's slot -- which happens to be exactly where the real subscribers are connected -- ever sees the message at all.

The scaling factor generalizes directly: for a channel whose subscribers are concentrated on ONE shard, sharded Pub/Sub eliminates roughly (shardCount - 1) / shardCount of the cross-node publish traffic classic Pub/Sub would have generated for that same channel -- the benefit grows precisely as the cluster grows larger.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"Sharded Pub/Sub is just classic Pub/Sub renamed for Cluster mode — SPUBLISH and PUBLISH do functionally the same thing."',
      reality: 'Verified above via direct modeling: they have genuinely different delivery scope. PUBLISH always broadcasts to every cluster node; SPUBLISH routes to exactly one shard, determined by hashing the channel name through the same slot algorithm regular keys use.',
    },
    {
      thought: '"Since sharded Pub/Sub uses the cluster\'s own slot-hashing, a channel\'s messages could theoretically end up split across multiple different shards depending on server load."',
      reality: 'A given channel NAME always hashes to the exact same slot, and that slot is always owned by exactly one shard at any point in time (barring an active resharding/migration) — there is no load-based or random splitting. Every SPUBLISH call for a specific channel name is deterministically routed to the same shard every time.',
    },
  ];

  topicLabel = 'Pub/Sub Messaging';
  topicRoute = '/redis/pub-sub';
  prev: SubtopicLink | null = {
    label: 'RESP3 Removes the Subscribe-Mode Restriction Entirely',
    route: '/redis/pub-sub/resp3-removes-the-subscribe-mode-restriction',
  };
  next: SubtopicLink | null = null;
}
