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
  templateUrl: './engineio-ping-pong-not-websocket-protocol-frames.html',
  styleUrl: './engineio-ping-pong-not-websocket-protocol-frames.scss'
})
export class EngineioPingPongNotWebsocketProtocolFramesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s quick-ref lists "Heartbeat / ping-pong" as one concept with one description ("ws: ws.ping(); client: pong event") — but Socket.io uses a completely different mechanism than the raw ws library does',
      points: [
        'The ws library (raw WebSocket) uses WebSocket\'s own PROTOCOL-LEVEL ping/pong, defined in RFC 6455 as control frames. When a server sends a ping control frame, ANY conformant WebSocket client implementation — browsers included — automatically responds with a pong control frame at the protocol layer, with zero application-level JavaScript required on the client side.',
        'Socket.io does NOT use this mechanism at all — it cannot, because Socket.io\'s underlying transport layer, Engine.IO, also supports HTTP long-polling as a fallback transport, and HTTP long-polling has no concept of a "control frame" whatsoever; it is just a sequence of ordinary HTTP requests and responses. A heartbeat mechanism that only worked over WebSocket would leave long-polling connections with no way to detect a dead connection.',
        'So Engine.IO implements its OWN application-level heartbeat: regular Engine.IO packets with packet type "ping" and "pong", sent as ordinary message payloads over whichever transport happens to be active — identical in shape whether the underlying transport is a raw WebSocket or an HTTP long-polling request. This is a transport-agnostic heartbeat built entirely above the protocol layer, not a use of WebSocket\'s built-in one.',
      ]
    },
    {
      heading: 'A specific, easy-to-get-backwards detail: who sends the ping?',
      points: [
        'In Engine.IO\'s current protocol (used by Socket.io v3 and v4), the SERVER sends the ping packet, and the CLIENT must reply with a pong within the configured pingTimeout — the reverse of what the raw ws library\'s "server pings, and gets a pong back" pattern might suggest is universal. This specific direction (server-initiated) was a deliberate protocol change from an earlier version, made because relying on client-side browser timers for scheduling pings turned out to be unreliable.',
        'Practical consequence: if a Socket.io server process itself hangs or is overloaded enough to stop sending its scheduled pings, connected clients will NOT proactively notice anything wrong at the Engine.IO heartbeat layer — since the client\'s only job is to respond to pings it receives, not to independently ping the server. A separate, application-level "have I heard from the server recently" check would be needed to detect that specific failure mode.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'ws library: real protocol-level control frames',
      language: 'typescript',
      code: `import { WebSocketServer } from 'ws';
const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws) => {
  ws.isAlive = true;
  // 'pong' fires when the CLIENT'S WebSocket IMPLEMENTATION responds to
  // our ping — this is automatic at the protocol layer in every
  // conformant client (including every browser). No client-side JS
  // needed to make this response happen.
  ws.on('pong', () => { ws.isAlive = true; });
});

setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    ws.ping(); // sends an actual RFC 6455 ping CONTROL FRAME
  });
}, 30_000);`,
    },
    {
      label: 'Socket.io / Engine.IO: application-level packets, works over polling too',
      language: 'typescript',
      code: `const io = new Server(httpServer, {
  pingInterval: 25_000, // server sends an Engine.IO "ping" packet this often
  pingTimeout: 20_000,  // disconnect if no "pong" packet arrives within this
});

// There is no ws.ping()/pong-event equivalent to write here — the
// heartbeat is handled entirely INSIDE Engine.IO's own protocol layer,
// invisible to your application code. Both server and client SDKs
// implement it automatically.
//
// Crucially: this exact same mechanism works identically whether the
// active transport is a real WebSocket OR an HTTP long-polling
// connection — because it's just Engine.IO packets sent as ordinary
// payloads, not real WebSocket control frames, which don't exist for
// the long-polling transport at all.
io.on('connection', (socket) => {
  // socket.conn.on('packet', ...) would show raw engine.io ping/pong
  // packets flowing if you inspected at that layer — but application
  // code never needs to touch this directly.
});`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer migrating a raw ws-based server to Socket.io writes: "I need to keep my existing ws.on(\'pong\', ...) heartbeat-tracking code, just adapted to Socket.io\'s API — something like socket.on(\'pong\', ...)." Explain why this reasoning is based on a wrong assumption about how Socket.io implements its heartbeat.',
    hint: 'Does Socket.io use the same underlying mechanism as raw ws (RFC 6455 protocol-level ping/pong control frames)? Consider that Socket.io must also support HTTP long-polling as a transport — does that transport have any concept of a "control frame" at all?',
    solution: 'The reasoning is wrong because Socket.io does not use WebSocket\'s protocol-level ping/pong control frames at all — there is no socket.on(\'pong\', ...) event to port the old code to, because the ws library\'s pong event specifically reports a WebSocket CONTROL FRAME response, and Socket.io\'s heartbeat is implemented as its own separate, application-level Engine.IO ping/pong packet exchange instead. This is not an arbitrary design choice: Socket.io\'s Engine.IO transport layer also supports HTTP long-polling as a fallback, and HTTP long-polling has no concept of a WebSocket control frame whatsoever — a heartbeat built on real WebSocket ping/pong frames would simply not exist for polling connections. Engine.IO\'s own ping/pong packets work identically over either transport, which is exactly why Socket.io had to build its own heartbeat rather than reusing WebSocket\'s built-in one. The developer should configure pingInterval/pingTimeout on the Socket.io server instead of looking for an equivalent to ws\'s pong event — the mechanism is handled entirely inside Engine.IO, invisible to application code.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Socket.io\'s heartbeat mechanism (mentioned in the main page\'s quick-ref) is the same WebSocket protocol-level ping/pong that the raw ws library uses — just accessed through Socket.io\'s API instead.',
      reality: 'This subtopic\'s theory shows these are two completely different mechanisms — raw ws uses real RFC 6455 control frames automatically handled by any conformant client, while Socket.io\'s Engine.IO layer implements its own application-level ping/pong packets that work identically over both WebSocket and HTTP long-polling.'
    },
    {
      thought: 'Since raw WebSocket ping/pong is protocol-level and automatic, Socket.io could have just used the same mechanism — building a separate one was an unnecessary design choice.',
      reality: 'This subtopic\'s theory clarifies WebSocket control frames simply do not exist for Socket.io\'s HTTP long-polling fallback transport — Engine.IO needed one heartbeat mechanism that worked identically across both of its transports, which native WebSocket ping/pong cannot provide.'
    },
    {
      thought: 'In both the raw ws library and Socket.io, it is the CLIENT that initiates the ping and the server that responds with pong — the direction is the same in both cases.',
      reality: 'This subtopic\'s theory notes the direction is actually the opposite of what many assume for Socket.io — the SERVER sends the Engine.IO ping packet and the CLIENT must respond with pong, a deliberate protocol design (not simply mirroring the raw ws library\'s typical server-pings pattern) made because relying on client-side browser timers for scheduling was unreliable.'
    }
  ];
}
