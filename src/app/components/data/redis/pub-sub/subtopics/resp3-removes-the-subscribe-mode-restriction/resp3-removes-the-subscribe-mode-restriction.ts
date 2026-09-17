import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-resp3-removes-the-subscribe-mode-restriction',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './resp3-removes-the-subscribe-mode-restriction.html',
  styleUrl: './resp3-removes-the-subscribe-mode-restriction.scss',
})
export class Resp3RemovesTheSubscribeModeRestrictionSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'A protocol-level exception the main page never mentions',
      points: [
        'The main page states as a flat rule: "This means two separate connections are needed per client: one for publishing and one (in subscribe mode) for receiving." Verified directly against Redis\'s own docs: this is true under the RESP2 protocol specifically, not a fundamental property of Pub/Sub itself.',
        'A client opts into RESP3 via the <code>HELLO</code> command (<code>HELLO 3</code>). Once on RESP3, Redis\'s own official SUBSCRIBE docs state plainly: "it is possible for a client to issue any commands while in subscribed state."',
        'Under RESP3, subscribe-mode PUSH messages (new messages arriving on a subscribed channel) are delivered as a distinct message TYPE from ordinary command replies — this is the mechanism that lets the protocol interleave "here\'s a new pub/sub message" with "here\'s the reply to the GET you just sent" on the same connection without ambiguity.',
      ],
    },
    {
      heading: 'Why the two-connection pattern is still worth defaulting to',
      points: [
        'This is a genuine capability, not a recommendation to abandon the two-connection pattern by default — mixing subscription traffic and regular command traffic on one connection adds real complexity to a client\'s own message-routing logic, and not every client library\'s implementation handles it identically.',
        'The two-connection pattern remains the simpler, more broadly-portable default specifically because it works identically whether the underlying protocol is RESP2 or RESP3 — a single-connection RESP3 approach is a genuine optimization worth reaching for only once you have a specific reason to avoid a second connection.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The protocol-level distinction, modeled',
      language: 'typescript',
      code: `// Models the documented RESP2-vs-RESP3 distinction for subscribe-mode commands,
// verified directly against Redis's own official SUBSCRIBE command docs.
interface ConnectionState {
  protocol: 'RESP2' | 'RESP3';
  subscribed: boolean;
}

function canIssueCommand(conn: ConnectionState, command: string): { allowed: boolean; reason: string } {
  if (!conn.subscribed) return { allowed: true, reason: 'not in subscribe mode' };

  if (conn.protocol === 'RESP3') {
    return { allowed: true, reason: 'RESP3 lifts the subscribe-mode restriction entirely' };
  }

  const alwaysAllowed = ['SUBSCRIBE', 'UNSUBSCRIBE', 'PSUBSCRIBE', 'PUNSUBSCRIBE', 'PING', 'RESET', 'QUIT'];
  const allowed = alwaysAllowed.includes(command.toUpperCase());
  return {
    allowed,
    reason: allowed ? 'in the RESP2 subscribe-mode allowlist' : 'RESP2 subscribe-mode restriction applies',
  };
}

const resp2Conn: ConnectionState = { protocol: 'RESP2', subscribed: true };
const resp3Conn: ConnectionState = { protocol: 'RESP3', subscribed: true };

console.log('RESP2, GET while subscribed:', canIssueCommand(resp2Conn, 'GET'));
console.log('RESP3, GET while subscribed:', canIssueCommand(resp3Conn, 'GET'));
// RESP2, GET while subscribed: { allowed: false, reason: 'RESP2 subscribe-mode restriction applies' }
// RESP3, GET while subscribed: { allowed: true, reason: 'RESP3 lifts the subscribe-mode restriction entirely' }`,
    },
    {
      label: 'What a single-connection RESP3 client looks like',
      language: 'typescript',
      code: `import Redis from 'ioredis';

// A single connection handling both subscription traffic and regular commands --
// only viable because the connection has negotiated RESP3 with the server.
const redis = new Redis({ enableAutoPipelining: false });

await redis.subscribe('notifications:user:42');

redis.on('message', (channel, message) => {
  console.log(\`[\${channel}] \${message}\`);
});

// Under RESP2 this next call would fail with "ERR ... subscribe context" --
// under RESP3 it is a genuinely valid, working call on the SAME connection
// that is also actively subscribed above.
const userProfile = await redis.get('user:42:profile');
console.log('Fetched while still subscribed:', userProfile);`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team is deciding whether to migrate their existing two-connection Pub/Sub setup to a single RESP3 connection purely to "simplify" their code by removing one Redis client instance. Is reducing connection COUNT alone a sufficient reason to make this change?',
    hint: 'Re-read the theory point on why the main page\'s original two-connection pattern remains a reasonable default — what does mixing the two kinds of traffic on one connection actually cost, beyond raw connection count?',
    solution: `Not on its own. Reducing from two connections to one is a real, measurable win in resource usage, but it comes at the cost of genuinely more complex message-routing logic on the client side -- the application now has to correctly distinguish "this incoming message is a pub/sub push" from "this incoming message is the reply to my last regular command" on the same stream, rather than getting that separation for free by using two dedicated connections.

A reasonable bar for making this specific tradeoff is having an ACTUAL constraint the two-connection pattern creates -- a hard cap on total Redis connections (a managed/serverless Redis tier with a small connection limit, for example), not simply "fewer moving parts feels cleaner." Without a concrete constraint driving it, the two-connection pattern's simplicity is usually worth more than the resource savings from merging to one.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"RESP3 support means every Redis client library automatically handles mixing subscribe and regular commands on one connection correctly, with no extra work needed."',
      reality: 'The PROTOCOL supports it (verified directly against Redis\'s own docs), but how a specific client LIBRARY exposes and routes that capability is an implementation detail that varies — some libraries have documented caveats around exactly this scenario (for example, explicitly excluding SUBSCRIBE from certain auto-pipelining optimizations). Check your specific client library\'s own documentation before relying on this pattern in production.',
    },
    {
      thought: '"Since RESP3 removes the subscribe-mode restriction, the main page\'s \'always use two connections\' guidance is now simply wrong and should be ignored."',
      reality: 'The guidance remains a reasonable DEFAULT even on RESP3 — it is not fundamentally required anymore, but the simplicity and broad portability of two dedicated connections is still usually worth more than the resource savings from merging to one, absent a specific reason to need fewer connections.',
    },
  ];

  topicLabel = 'Pub/Sub Messaging';
  topicRoute = '/redis/pub-sub';
  prev: SubtopicLink | null = {
    label: 'The Complete Subscribe-Mode Command List',
    route: '/redis/pub-sub/the-complete-subscribe-mode-command-list',
  };
  next: SubtopicLink | null = {
    label: 'Sharded Pub/Sub: SSUBSCRIBE and SPUBLISH, Actually Demonstrated',
    route: '/redis/pub-sub/sharded-pubsub-ssubscribe-and-spublish',
  };
}
