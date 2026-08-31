import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

const theory: TheoryPoint[] = [
  {
    heading: '"All Instances Subscribe to a Redis Channel" — Made Concrete',
    points: [
      'The main page’s own QnA on WebSocket scaling names the mechanism precisely: "all server instances subscribe to a Redis channel; when any instance receives a message, it publishes to Redis; all instances forward it to their connected clients." No codeTab on the page shows this fanout actually happening across separate server processes.',
      'The core problem this solves: the main page’s own WebSocket codeTab tracks connected clients in a plain in-memory <code>Set&lt;WebSocket&gt;</code> — but that Set only ever contains clients connected to THAT ONE server process. A message received by server A has no way to reach a client connected to server B without some shared coordination layer between them.',
      'Redis Pub/Sub (or any equivalent message broker) provides exactly that shared layer: every server instance both PUBLISHES incoming messages to a shared channel AND SUBSCRIBES to that same channel, so a message originating on any one instance gets forwarded to every instance’s own local clients — including the instance where it originated.',
      'This is architecturally similar to the discriminator/reference-resolver pattern this hub covers elsewhere for GraphQL federation — a shared, minimal piece of coordination (a channel name, an entity key) lets otherwise-independent components stay in sync without needing direct knowledge of each other.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Cross-Instance Fanout via Pub/Sub',
    language: 'typescript',
    code: `interface Client {
  id: string;
  received: unknown[];
}

// A minimal stand-in for a real Redis client's pub/sub API.
class FakePubSub {
  private subscribers = new Map<string, Set<(message: unknown) => void>>();

  subscribe(channel: string, handler: (message: unknown) => void): void {
    if (!this.subscribers.has(channel)) this.subscribers.set(channel, new Set());
    this.subscribers.get(channel)!.add(handler);
  }

  publish(channel: string, message: unknown): void {
    for (const handler of this.subscribers.get(channel) ?? []) handler(message);
  }
}

class ServerInstance {
  // Only clients connected DIRECTLY to THIS instance -- exactly like
  // the main page's own in-memory clients Set, scoped to one process.
  private localClients = new Set<Client>();

  constructor(private id: string, private bus: FakePubSub) {
    // Every instance subscribes to the SAME channel -- this is what
    // lets a message from ANY instance reach clients on EVERY instance.
    this.bus.subscribe('room:general', (message) => this.forwardToLocalClients(message));
  }

  connectClient(client: Client): void {
    this.localClients.add(client);
  }

  private forwardToLocalClients(message: unknown): void {
    for (const client of this.localClients) client.received.push(message);
  }

  broadcast(message: unknown): void {
    // Instances never talk to each other directly -- they only ever
    // publish to the shared bus, exactly like real Redis pub/sub.
    this.bus.publish('room:general', message);
  }
}

const bus = new FakePubSub();
const instanceA = new ServerInstance('A', bus);
const instanceB = new ServerInstance('B', bus);

const clientOnA: Client = { id: 'client1', received: [] };
const clientOnB: Client = { id: 'client2', received: [] };
instanceA.connectClient(clientOnA);
instanceB.connectClient(clientOnB);

// A message originates on instance A -- can a client that has NEVER
// connected to instance A still receive it?
instanceA.broadcast({ text: 'hello from A' });

console.log('clientOnA received:', clientOnA.received);
console.log('clientOnB received:', clientOnB.received);
// Both arrays contain the message -- clientOnB received it purely
// through the shared bus, with zero direct connection to instance A.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The <code>ServerInstance</code> class above subscribes to the pub/sub channel INSIDE its own constructor, and its <code>broadcast()</code> method only ever calls <code>this.bus.publish()</code> — it never calls <code>this.forwardToLocalClients()</code> directly. Why does <code>instanceA.broadcast(...)</code> still correctly deliver the message to <code>clientOnA</code> (a client connected to the SAME instance that originated the message)?',
  hint: 'When <code>instanceA.broadcast()</code> calls <code>this.bus.publish(\'room:general\', message)</code>, which subscribers does <code>publish()</code> notify — only OTHER instances\' handlers, or every handler registered on that channel, including instance A’s own?',
  solution: `// instanceA.broadcast() delivers to clientOnA because instanceA
// subscribed to the SAME channel it publishes to -- publish() has no
// concept of "everyone except the publisher," it simply notifies every
// handler registered for that channel, and instanceA's own handler
// (registered in its own constructor) is one of them.

// This means the message actually takes a real round trip even for the
// LOCAL client: instanceA.broadcast() -> bus.publish() -> instanceA's
// own subscribed handler -> forwardToLocalClients() -> clientOnA. It
// never takes a shortcut straight from broadcast() to
// forwardToLocalClients() for local clients.

// This is a deliberate design choice, not an accident: it means every
// server instance has exactly ONE code path for delivering a message to
// its local clients (through the pub/sub subscription), whether that
// message originated locally or on a completely different instance --
// no separate "local fast path" and "remote path" to keep in sync with
// each other as the system evolves.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Redis Pub/Sub-based WebSocket scaling means the WebSocket connections themselves are somehow shared or moved between server instances.',
    reality: 'The codeTab above shows each <code>ServerInstance</code> keeping its OWN separate <code>localClients</code> Set — a client’s actual WebSocket connection stays with whichever single instance it originally connected to, for the lifetime of that connection. Only the MESSAGE data travels between instances (via the shared pub/sub bus); the underlying TCP connections themselves are never transferred.',
  },
  {
    thought: 'A message published by an instance only reaches OTHER instances’ clients — the originating instance has to deliver to its own local clients some other way.',
    reality: 'The Try It above demonstrates the opposite: the originating instance’s own local clients are reached through the EXACT SAME pub/sub subscription every other instance uses — there is no special-cased "local delivery" path bypassing the shared bus. This is precisely what keeps the delivery logic simple and uniform.',
  },
  {
    thought: 'This pattern requires every server instance to know how many OTHER instances exist, or their addresses, to correctly fan out a message.',
    reality: 'Neither <code>ServerInstance</code> nor the <code>FakePubSub</code> stand-in above ever references another instance by name, address, or count — <code>instanceA</code> has zero knowledge that <code>instanceB</code> even exists. Each instance only knows about the shared CHANNEL name; the pub/sub broker itself is what handles routing to however many subscribers happen to be listening, a number that can grow or shrink freely as instances scale up or down.',
  },
];

@Component({
  selector: 'app-api-realtime-pubsub-fanout',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './redis-pub-sub-fanout-across-server-instances.html',
  styleUrl: './redis-pub-sub-fanout-across-server-instances.scss',
})
export class RedisPubSubFanoutAcrossServerInstancesSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
