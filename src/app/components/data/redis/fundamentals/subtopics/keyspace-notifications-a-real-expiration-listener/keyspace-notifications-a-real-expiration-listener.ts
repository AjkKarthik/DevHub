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
    heading: 'Named in One QnA Sentence, Never Actually Built',
    points: [
      'The main page\'s own QnA on keyspace notifications names the exact config flag (<code>notify-keyspace-events KEA</code>) and the exact channel naming convention (<code>__keyevent@db__:event</code>, <code>__keyspace@db__:key</code>) — but no codeTab anywhere on the page ever subscribes to one.',
      'There are two complementary channel families for the SAME underlying event: <code>__keyevent@&lt;db&gt;__:&lt;event&gt;</code> — subscribe by EVENT TYPE (e.g. all expirations across every key), receiving the KEY NAME as the message payload; <code>__keyspace@&lt;db&gt;__:&lt;key&gt;</code> — subscribe by SPECIFIC KEY, receiving the EVENT NAME as the message payload.',
      'This is genuinely different from polling <code>TTL</code>/<code>EXISTS</code> on a schedule — the notification arrives exactly when Redis actually expires (or otherwise mutates) the key, with zero polling overhead and no risk of missing a change between polls.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'A Real Expiration Listener',
    language: 'typescript',
    code: `import Redis from 'ioredis';

// Step 1: enable notifications for expired-key events specifically
// (per the main page's own QnA -- 'KEA' enables ALL event classes;
// 'Ex' is a narrower, expiration-only alternative worth knowing too).
const admin = new Redis();
await admin.config('SET', 'notify-keyspace-events', 'Ex');

// Step 2: subscribe on a SEPARATE connection -- a client in
// subscriber mode cannot also run ordinary commands on the same
// connection.
const subscriber = new Redis();
await subscriber.psubscribe('__keyevent@0__:expired');

subscriber.on('pmessage', (_pattern, _channel, expiredKey) => {
  // The message payload IS the key name that just expired.
  console.log('Key expired:', expiredKey);
  if (expiredKey.startsWith('session:')) {
    console.log('A user session just expired -- clean up related state here.');
  }
});

// Trigger it: set a key with a very short TTL and watch it fire.
const appClient = new Redis();
await appClient.set('session:demo', 'someUserId', 'EX', 1);
// ~1 second later: 'Key expired: session:demo' logs from the
// subscriber above -- no polling loop anywhere in this code.

// Pure-JS model of the channel/message pairing, verified directly:
function simulateKeyspaceNotification(db: number, eventType: string, keyName: string) {
  return {
    keyeventChannel: \`__keyevent@\${db}__:\${eventType}\`,
    keyeventMessage: keyName,   // payload is the KEY name
    keyspaceChannel: \`__keyspace@\${db}__:\${keyName}\`,
    keyspaceMessage: eventType, // payload is the EVENT name
  };
}
console.log(simulateKeyspaceNotification(0, 'expired', 'session:abc123'));
// -> { keyeventChannel: '__keyevent@0__:expired', keyeventMessage: 'session:abc123',
//      keyspaceChannel: '__keyspace@0__:session:abc123', keyspaceMessage: 'expired' }`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A teammate subscribes to <code>__keyspace@0__:session:demo</code> instead of the <code>__keyevent@0__</code> channel shown above, wanting to watch ONE specific session key. What message do they receive when that key expires, and how is it different from the keyevent version?',
  hint: 'Use the verified channel/message pairing in the code above — keyspace and keyevent swap which piece of information is the CHANNEL and which is the MESSAGE.',
  solution: `// They receive the message "expired" (the EVENT NAME) on the
// channel __keyspace@0__:session:demo.
//
// This is the mirror image of the __keyevent@0__:expired subscription:
// there, the CHANNEL already names the event type, and the MESSAGE
// carries which key it happened to. Here, the CHANNEL already names
// the specific key, and the MESSAGE carries which event happened to
// it (which matters more once you subscribe to a keyspace channel
// covering multiple event types, not just expiration, for that one
// key).`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'A keyspace notification subscriber can share the same Redis connection as the rest of the application, since it\'s just another command being sent to Redis.',
    reality: 'Once a connection issues (P)SUBSCRIBE, that connection enters a dedicated subscriber mode and can no longer run ordinary commands like GET/SET on the SAME connection. A real application needs a SEPARATE connection for subscribing, exactly as shown above (a separate ioredis client instance for the subscriber).',
  },
  {
    thought: 'Keyspace notifications guarantee delivery — if the application subscriber is briefly disconnected, it will receive the missed events once it reconnects.',
    reality: 'Redis pub/sub (which keyspace notifications are built on) is fire-and-forget: if no subscriber is connected at the moment an event fires, that notification is gone forever, with no replay or backlog. An application needing guaranteed delivery of key-change events should reach for Redis Streams instead, which do support consumer groups and replay.',
  },
];

@Component({
  selector: 'app-redis-fund-keyspace-notify',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './keyspace-notifications-a-real-expiration-listener.html',
  styleUrl: './keyspace-notifications-a-real-expiration-listener.scss',
})
export class KeyspaceNotificationsARealExpirationListenerSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
