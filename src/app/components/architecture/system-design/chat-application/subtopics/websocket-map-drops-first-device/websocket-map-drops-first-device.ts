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
  templateUrl: './websocket-map-drops-first-device.html',
  styleUrl: './websocket-map-drops-first-device.scss'
})
export class WebsocketMapSilentlyDropsFirstDeviceOnMultiLoginSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A Map keyed by userId can only ever hold ONE connection per user',
      points: [
        'The main page\'s own "WebSocket Server" code sample used connections.set(userId, ws) — a <code>Map&lt;string, WebSocket&gt;</code> keyed by user ID. The Challenge on the SAME page explicitly requires handling the case "A → sends message; B is: ... (3) on different device," which implies B can be connected from more than one device (e.g. phone AND web) at once. The original code cannot represent that: a second device\'s connection call to .set(userId, ws) silently OVERWRITES the reference to the first device\'s WebSocket, and the first device\'s "close" handler later runs connections.delete(userId) — deleting the SECOND device\'s entry by mistake. The page has been corrected to use a <code>Map&lt;string, Set&lt;WebSocket&gt;&gt;</code>.',
        'This is catchable purely by reading the page\'s own code against its own stated requirement — no external research needed. A data structure that can hold at most one value per key cannot correctly represent "this key can have multiple simultaneous values."',
      ]
    },
    {
      heading: 'Two separate failure modes hiding in the original single-connection Map',
      points: [
        'Silent message loss: if User B opens the app on their phone (connection 1, mapped) then also opens it on desktop (connection 2 overwrites connection 1\'s map entry), any message routed through the direct in-memory connections.get(userId) lookup only reaches the desktop connection — the phone silently stops receiving pushes, with no error anywhere.',
        'Premature disconnect cleanup: when the FIRST device eventually closes its connection, its close handler runs connections.delete(userId) — but by then the map entry actually belongs to the SECOND device. This deletes the second (still-open) device\'s entry, clears its Redis presence key, and unsubscribes its inbox channel — while the second device\'s WebSocket is still technically open and the user thinks they\'re receiving messages.',
        'The fix keeps a <code>Set&lt;WebSocket&gt;</code> per user instead of a single WebSocket: adding a device inserts into the set, closing a device removes just that connection from the set, and cleanup (presence + Redis unsubscribe) only fires once the set is empty — i.e. once every device for that user has disconnected.',
      ]
    },
    {
      heading: 'A second, related fix: don\'t double-subscribe to the same Redis channel',
      points: [
        'A naive fix of just switching to a Set might still call <code>subscriber.subscribe(inbox:userId, ...)</code> on every new device connection — registering a second callback on the same channel for most Redis client libraries, which can lead to duplicate delivery or inconsistent behavior depending on the client\'s own semantics.',
        'The corrected version only calls subscriber.subscribe() the FIRST time a user connects (when their connection set was previously empty), and the subscription\'s own callback fans a single incoming message out to every WebSocket currently in that user\'s connection set — one Redis subscription per user, regardless of how many devices they have open.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Single-connection Map vs. multi-device Set',
      language: 'typescript',
      code: `// Before: one WebSocket per user -- breaks multi-device
const connectionsSingle = new Map<string, WebSocket>();

function onConnectSingle(userId: string, ws: WebSocket) {
  connectionsSingle.set(userId, ws); // 2nd device SILENTLY overwrites 1st
}

function onCloseSingle(userId: string) {
  connectionsSingle.delete(userId); // may delete the WRONG device's entry
}

// After: a Set of WebSockets per user -- multi-device safe
const connectionsMulti = new Map<string, Set<WebSocket>>();

function onConnectMulti(userId: string, ws: WebSocket) {
  if (!connectionsMulti.has(userId)) connectionsMulti.set(userId, new Set());
  connectionsMulti.get(userId)!.add(ws); // adds alongside existing devices
}

function onCloseMulti(userId: string, ws: WebSocket) {
  const conns = connectionsMulti.get(userId);
  conns?.delete(ws); // removes only THIS device's connection
  if (conns && conns.size === 0) connectionsMulti.delete(userId); // last device gone
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A chat server maps connections.set(userId, ws) — one WebSocket per user ID. User B opens the app on their phone, then also opens it on their laptop. B\'s phone stops receiving new messages entirely, with no error logged anywhere. What is happening, and what data structure fixes it?',
    hint: 'When B\'s laptop calls connections.set(userId, ws) with the SAME userId as the phone\'s earlier call, what happens to the phone\'s WebSocket reference that was already stored under that key?',
    solution: 'A Map can hold only one value per key — when the laptop connects, connections.set(userId, ws) overwrites the phone\'s WebSocket reference with the laptop\'s, silently dropping the phone from the map. Any message delivery that looks up connections.get(userId) now only finds the laptop, so the phone stops receiving pushes with no error surfaced anywhere (the phone\'s WebSocket is still open, it\'s just no longer reachable). The fix is a Map<string, Set<WebSocket>> — each user ID maps to a SET of connections, one per active device, so a new device connecting adds to the set rather than overwriting a single slot, and closing one device only removes that device\'s entry from the set.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'For chat-app connection tracking, a user ID always maps to exactly one active WebSocket connection at a time, so <code>Map&lt;userId, WebSocket&gt;</code> is a sufficient data structure.',
      reality: 'Per this subtopic\'s theory, a single user routinely has multiple devices (phone, web, desktop) connected simultaneously — this page\'s own Challenge explicitly names "on different device" as a state to design for, which a one-connection-per-user Map cannot represent.'
    },
    {
      thought: 'Switching connections.set(userId, ws) to a <code>Set&lt;WebSocket&gt;</code> per user is the entire fix needed for multi-device support.',
      reality: 'Per this subtopic\'s theory, the Redis pub/sub subscription also needs to change — subscribing once per DEVICE (rather than once per USER) can register duplicate callbacks on the same channel; the corrected version subscribes once per user and fans out locally to every device in that user\'s connection set.'
    },
    {
      thought: 'A bug like a Map silently overwriting an existing entry would be caught immediately by any reasonable test suite or manual testing.',
      reality: 'Per this subtopic\'s theory, this specific bug produces NO error, exception, or log message anywhere — the overwritten device\'s WebSocket stays technically open and connected, it just silently stops being reachable from the server\'s message-routing logic, making it the kind of bug that only surfaces as an unexplained user complaint ("I stopped getting notifications on my phone").'
    }
  ];
}
