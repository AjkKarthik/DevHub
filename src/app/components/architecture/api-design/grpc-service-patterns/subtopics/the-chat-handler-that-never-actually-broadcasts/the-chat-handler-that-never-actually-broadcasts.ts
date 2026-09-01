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
    heading: 'The Comment Claimed a Broadcast — the Code Could Only Ever Echo',
    points: [
      'The main page’s own bidirectional-streaming <code>chat()</code> handler was labeled "// Broadcast to all other connected clients" and "// echo back + broadcast" — but the only thing the original code did was call <code>call.write(response)</code> on the exact SAME <code>call</code> object the message arrived on. In a gRPC bidirectional stream, <code>call</code> is scoped to ONE specific connection; there was no way for that code to reach any OTHER client’s stream at all.',
      'A real chat server needs a REGISTRY of every currently-connected call — a plain collection the handler adds to when a client connects and removes from when a client disconnects — so a message from one client can be written to every OTHER call object in that registry.',
      'This has now been fixed on the main page with an <code>activeChatCalls</code> set: added on connect, removed on both <code>\'end\'</code> and <code>\'cancelled\'</code> (a client can disconnect either by finishing normally OR by the connection dropping), and iterated over — skipping the sender’s own <code>call</code> — for every incoming message.',
      'Cleaning up on BOTH <code>\'end\'</code> and <code>\'cancelled\'</code> matters — this hub’s own mistake block on this exact page already warns about leaking resources (intervals, subscriptions) by only listening for one disconnect event; a chat registry that only removed calls on <code>\'end\'</code> would accumulate dead, unreachable call references from every client whose connection simply dropped.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Simulating the Broadcast Registry',
    language: 'typescript',
    code: `// A minimal stand-in for grpc-js's ServerDuplexStream -- write() just
// records what a given "client" received, mirroring how a real call
// object would push a message down its own stream.
class MockCall {
  received: unknown[] = [];
  constructor(public id: string) {}
  write(msg: unknown) { this.received.push(msg); }
}

const activeChatCalls = new Set<MockCall>();

function handleIncomingMessage(call: MockCall, message: { text: string }) {
  activeChatCalls.add(call); // registered on first message, for this demo
  for (const other of activeChatCalls) {
    if (other !== call) other.write({ from: call.id, ...message });
  }
}

function disconnect(call: MockCall) {
  activeChatCalls.delete(call);
}

const alice = new MockCall('alice');
const bob = new MockCall('bob');

handleIncomingMessage(alice, { text: 'hi from alice' });
handleIncomingMessage(bob, { text: 'hi from bob' });

console.log('alice received:', alice.received);
// [ { from: 'bob', text: 'hi from bob' } ]
console.log('bob received:', bob.received);
// [] -- alice's message arrived before bob had connected/registered,
// so there was no OTHER client yet to broadcast it to.

disconnect(alice);
const carol = new MockCall('carol');
handleIncomingMessage(carol, { text: 'hi from carol' });

console.log('bob received after alice left, carol joined:', bob.received);
// [ { from: 'carol', text: 'hi from carol' } ] -- bob is still
// registered and gets carol's message; alice does not, since she
// disconnected and was removed from the registry.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The original, buggy code (<code>call.write(response)</code> on the sender’s own <code>call</code>) is functionally identical to a WORKING, correctly-scoped echo server — a server that sends every message straight back to the SAME client that sent it, and only that client. What real, deployable feature does an echo server correctly implement, that the ORIGINAL comment’s stated intent (chat) needed but never got?',
  hint: 'If the original code had been labeled honestly — "echo the message back to its own sender" instead of "broadcast to all other connected clients" — would there have been a bug at all?',
  solution: `// The original code was NOT broken in the sense of "doesn't compile"
// or "throws an error" -- it correctly, faithfully implements an echo
// server: every message a client sends comes straight back to that
// SAME client, and nothing else. That's a real, legitimate pattern
// (useful for connectivity testing, latency measurement, or a simple
// "did my message get through" acknowledgment).

// The actual bug was a MISMATCH between what the code does (echo) and
// what the comment claimed it did (broadcast to other clients) -- the
// two are genuinely different features serving genuinely different
// purposes. An echo server has no use for a registry of other
// connections at all; a broadcast chat server cannot function without
// one. If the comment had honestly said "echo back to sender," this
// page's code would have needed NO fix whatsoever -- the bug existed
// entirely in the gap between the stated intent and the actual
// behavior, not in the code being objectively wrong in isolation.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Calling <code>call.write()</code> inside a bidirectional streaming handler sends the message to every client currently connected to the service.',
    reality: '<code>call</code> is scoped to exactly ONE specific client connection — <code>call.write()</code> can only ever push a message down THAT one stream. Reaching any other connected client requires the handler to maintain its own separate collection of every active <code>call</code> object and explicitly iterate over it, exactly as the <code>activeChatCalls</code> registry does.',
  },
  {
    thought: 'The original, buggy chat handler would have thrown an error or failed some test, which is how a bug like this normally gets caught.',
    reality: 'The original code ran perfectly correctly as an echo server — it never throws, never crashes, and a test sending a message and checking that THE SAME CLIENT receives a reply would pass without issue. The bug was only detectable by checking whether a DIFFERENT connected client also received the message — exactly the kind of gap a plausible-looking comment can mask from a quick read.',
  },
  {
    thought: 'Cleaning up on the <code>\'end\'</code> event alone is sufficient — a client that disconnects always triggers <code>\'end\'</code> eventually.',
    reality: 'A client can disconnect WITHOUT a clean <code>\'end\'</code> — a dropped network connection, a crashed client process, or an explicit cancellation all fire <code>\'cancelled\'</code> instead. The fixed registry removes the call on BOTH events specifically because relying on <code>\'end\'</code> alone would leave dead call references sitting in <code>activeChatCalls</code> indefinitely for every client whose connection simply dropped rather than closed cleanly.',
  },
];

@Component({
  selector: 'app-api-grpc-chat-broadcast',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-chat-handler-that-never-actually-broadcasts.html',
  styleUrl: './the-chat-handler-that-never-actually-broadcasts.scss',
})
export class TheChatHandlerThatNeverActuallyBroadcastsSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
