import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './redis-adapter-broadcasts-to-every-instance.html',
  styleUrl: './redis-adapter-broadcasts-to-every-instance.scss'
})
export class RedisAdapterBroadcastsToEveryInstanceSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page says the Redis adapter "syncs events across all server instances" — but it never explains HOW, and the actual mechanism has a real capacity-planning consequence',
      points: [
        'The adapter does not know, ahead of time, which OTHER server instances actually have a socket sitting in a given room. It cannot "route directly to the right instance" the way a smart proxy might, because Redis pub/sub itself has no concept of per-subscriber targeting — a published message goes to every subscriber of a channel, full stop.',
        'The real mechanism, confirmed via the adapter\'s own documentation: when io.to(room).emit() runs on one instance, that instance handles its own LOCAL matching sockets directly, AND separately publishes the serialized event packet to a Redis channel. EVERY server instance in the cluster is subscribed to that channel and receives a copy of every published packet — each instance then independently checks its own LOCAL room membership and only actually delivers to whichever of its own locally-connected sockets happen to match.',
        'The practical consequence: broadcast fanout cost scales with (total broadcast volume) × (number of server instances) — not with the number of sockets actually in the target room. A room with exactly one member, on a 20-instance cluster, still causes all 20 instances to receive and evaluate every broadcast to that room; 19 of them will find no local match and silently discard it, but the network/CPU cost of receiving and checking still happened on all 20.',
      ]
    },
    {
      heading: 'Why this matters in practice, and what it does not change',
      points: [
        'This does NOT make the Redis adapter a bad choice — for the vast majority of real applications, this fanout overhead is negligible next to the alternative (no cross-instance broadcasting at all). The point is understanding the mechanism precisely enough to reason about it when scaling past dozens of instances, or when a small number of very high-frequency broadcast events start to matter.',
        'This is also why the main page\'s heartbeat/connection-count "memory management" concern and this fanout concern are separate, additive costs at scale: a given instance pays for (a) memory per locally-connected socket regardless of Redis, and (b) CPU/network to receive and locally-filter every cross-instance broadcast published anywhere in the cluster, regardless of whether it has any matching local sockets for that particular room.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'What actually happens on io.to(room).emit() with the Redis adapter',
      language: 'typescript',
      code: `import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();
io.adapter(createAdapter(pubClient, subClient));

// Instance A (one of, say, 20 running instances):
io.to('workspace-42').emit('presence-update', { userId: 7, online: true });

// What actually happens:
// 1. Instance A checks its OWN local sockets for room "workspace-42" and
//    delivers directly to any it finds — no Redis involved for these.
// 2. Instance A ALSO publishes the serialized packet to a Redis channel
//    scoped to this namespace/room (the adapter picks the channel name).
// 3. ALL 19 other instances are subscribed to that channel — every one
//    of them receives this exact packet, regardless of whether THEY
//    have any socket in "workspace-42" at all.
// 4. Each of those 19 instances independently checks ITS OWN local room
//    membership for "workspace-42". If it has zero matching local
//    sockets (the common case for a small room on a large cluster), it
//    discards the packet — but it still had to receive and check it.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team runs a 50-instance Socket.io cluster with the Redis adapter, and one particular room ("global-announcements") has exactly one connected user who happens to be on instance #12. A broadcast is sent to that room 10 times per second. A team member argues: "since only instance #12 actually has a matching socket, only instance #12 should be doing any real work for these broadcasts — the other 49 are basically free." Is this correct, based on how the Redis adapter actually works?',
    hint: 'Does the Redis adapter know in advance which instances have a matching socket before publishing, or does every subscribed instance receive every published packet regardless of whether it has a match?',
    solution: 'This is incorrect. Every one of the 50 instances is subscribed to the Redis channel(s) the adapter publishes to, so all 50 instances receive and evaluate every one of the 10-per-second broadcast packets — not just instance #12. The 49 instances without a matching local socket for "global-announcements" do end up discarding the packet after checking their local room membership, so they never actually deliver anything to a client, but they still paid the cost of receiving the message over the Redis subscription and running the local-membership check. The "basically free" framing is wrong: the cost scales with (broadcast rate) × (number of instances), not with (broadcast rate) × (number of instances that happen to have a matching socket). For a low-frequency broadcast this overhead is negligible, but it is real and worth knowing precisely when reasoning about a very large cluster or a very high-frequency broadcast pattern.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The Socket.io Redis adapter is "smart" — it knows which server instances have a matching socket in a room and only delivers the broadcast to those specific instances.',
      reality: 'This subtopic\'s theory shows the opposite is true — Redis pub/sub has no concept of per-subscriber targeting, so EVERY instance subscribed to the relevant channel receives EVERY published packet and independently filters against its own local room membership after the fact.'
    },
    {
      thought: 'A broadcast to a room with very few members (e.g. one user) costs proportionally little across a large cluster, since only the instance holding that member\'s socket does any real work.',
      reality: 'This subtopic\'s exercise shows fanout cost scales with the TOTAL NUMBER OF INSTANCES in the cluster, not the number of matching sockets — every instance receives and checks every broadcast regardless of whether it ends up finding a local match.'
    },
    {
      thought: 'The Redis adapter and per-instance connection-count limits are the same underlying capacity constraint, just described two different ways.',
      reality: 'This subtopic\'s theory clarifies these are two SEPARATE, ADDITIVE costs — memory-per-connected-socket (independent of Redis) and CPU/network to receive and locally-filter every cluster-wide broadcast (which happens regardless of how many sockets an instance actually holds).'
    }
  ];
}
