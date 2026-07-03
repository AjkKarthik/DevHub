import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
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

const quickRef: QuickRefItem[] = [
  { name: 'WebSocket',    type: 'keyword', desc: 'Full-duplex persistent connection over TCP — both sides can send messages at any time.' },
  { name: 'SSE',          type: 'keyword', desc: 'Server-Sent Events — server-to-client push over HTTP/1.1; auto-reconnects via EventSource API.' },
  { name: 'Long Polling', type: 'keyword', desc: 'Client sends request, server holds it open until data is available, then responds — cycle repeats.' },
  { name: 'Short Polling', type: 'keyword', desc: 'Client polls every N seconds regardless of updates — wasteful, causes unnecessary requests.' },
  { name: 'EventSource',  type: 'keyword', desc: 'Browser API for SSE — auto-reconnect, event ID for resumability, built-in to all modern browsers.' },
  { name: 'ws:// / wss://', type: 'keyword', desc: 'WebSocket URL schemes — wss:// is TLS-encrypted (required for HTTPS pages).' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'WebSockets — Full Duplex',
    points: [
      'WebSocket upgrades an HTTP connection to a persistent, full-duplex TCP connection. Both client and server can send messages at any time without a new request.',
      'The handshake: client sends HTTP Upgrade request; server responds 101 Switching Protocols; the TCP connection stays open.',
      'Use cases: real-time chat, multiplayer games, collaborative editing, live trading dashboards, telemetry streams where BOTH sides actively send messages.',
      'Advantages: lowest latency for bidirectional communication; binary support; single connection per client.',
      'Disadvantages: not HTTP — bypasses standard HTTP middleware (auth headers are not re-sent automatically, no caching, proxies must support WebSocket); stateful connection requires sticky sessions or a pub/sub broker for horizontal scaling.',
    ],
  },
  {
    heading: 'Server-Sent Events (SSE) — Server Push Only',
    points: [
      'SSE uses a regular HTTP connection where the server streams `data: ...\n\n` chunks indefinitely. Content-Type: text/event-stream.',
      'The browser\'s EventSource API handles SSE natively: auto-reconnects on connection drop, sends Last-Event-ID header to resume from where it left off.',
      'Use cases: live notifications, activity feeds, stock tickers, progress updates, any push-from-server pattern where the client does NOT need to send messages back.',
      'Advantages: works over HTTP/1.1 and HTTP/2; passes through all standard HTTP middleware (auth headers, CORS, CDN, load balancers); simpler than WebSocket.',
      'Disadvantages: server-to-client only — client cannot send messages on the same connection; older IE/Edge required polyfills (modern browsers all support it).',
    ],
  },
  {
    heading: 'Long Polling — The Workaround',
    points: [
      'Client sends a request; the server holds the connection open until data is available (or a timeout fires), then responds. Client immediately sends the next request.',
      'Simulates push using standard HTTP. Works everywhere — any HTTP client, any proxy, no WebSocket support needed.',
      'Disadvantages: one HTTP connection per pending request; high overhead (HTTP headers re-sent each cycle); latency is one round-trip + hold time; not truly real-time.',
      'Modern use: long polling is the fallback in Socket.io when WebSocket is not available. In new designs, prefer SSE over long polling — same server-push semantics, lower overhead.',
    ],
  },
  {
    heading: 'Choosing the Right Transport',
    points: [
      'Need bidirectional, low-latency, high-frequency messages? → WebSocket (chat, gaming, collaboration).',
      'Need server-to-client push with standard HTTP infrastructure? → SSE (notifications, feeds, progress).',
      'Need periodic data with no push requirement? → Short polling with appropriate interval (dashboard refresh every 30s).',
      'Need to support legacy environments or proxies that block WebSocket? → Long polling as a fallback.',
      'HTTP/2 note: SSE over HTTP/2 multiplexes over one TCP connection — you get many SSE streams sharing one connection, unlike HTTP/1.1 where each SSE stream holds one connection.',
    ],
  },
  {
    heading: 'Choosing the Right Real-Time Strategy for the Actual Use Case',
    points: [
      'The decision between polling, SSE, and WebSockets should be driven by the actual communication pattern needed (one-way vs bidirectional) and update frequency, not by which technology seems most modern — using WebSockets for a purely one-directional, infrequent update feed adds unjustified complexity compared to simpler alternatives.',
      'Infrastructure compatibility matters practically — WebSockets require infrastructure (load balancers, proxies, corporate firewalls) that correctly supports the protocol upgrade and long-lived connections, while SSE and polling work reliably over plain HTTP through virtually any intermediary without special configuration.',
      'Starting with the simplest approach that meets actual requirements (often polling, sometimes SSE) and only moving to WebSockets when a genuine, demonstrated need for bidirectional low-latency communication emerges avoids premature complexity that then must be operated and debugged for the lifetime of the feature.',
      'Real-time feature reliability requires planning for connection drops and reconnection from the start — regardless of which technology is chosen, the client-side reconnection and state-resynchronization logic is often more implementation effort than the initial "happy path" real-time connection itself.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'WebSocket Server + Client',
    language: 'typescript',
    code: `// WebSocket server (ws library)
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';

const httpServer = http.createServer();
const wss = new WebSocketServer({ server: httpServer });

// Track all connected clients
const clients = new Set<WebSocket>();

wss.on('connection', (ws, req) => {
  // Auth: parse token from query string (headers not available after handshake)
  const token = new URL(req.url!, 'ws://host').searchParams.get('token');
  const user = verifyToken(token);
  if (!user) return ws.close(4001, 'Unauthorized');

  clients.add(ws);
  console.log(\`Client connected: \${user.id}. Total: \${clients.size}\`);

  // Receive messages from this client
  ws.on('message', (data) => {
    const message = JSON.parse(data.toString());
    // Broadcast to all other clients
    clients.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ from: user.id, ...message }));
      }
    });
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log(\`Client disconnected. Total: \${clients.size}\`);
  });
});

// ── Client-side WebSocket ────────────────────────────────────────────────
const ws = new WebSocket(\`wss://api.example.com/ws?token=\${authToken}\`);

ws.addEventListener('open', () => {
  ws.send(JSON.stringify({ type: 'join', room: 'general' }));
});
ws.addEventListener('message', (event) => {
  const msg = JSON.parse(event.data);
  displayMessage(msg);
});
ws.addEventListener('close', (event) => {
  // Reconnect with exponential backoff
  setTimeout(() => reconnect(), Math.min(1000 * 2 ** retryCount++, 30000));
});`,
  },
  {
    label: 'SSE Server + Client',
    language: 'typescript',
    code: `// Server-Sent Events — server push only, no client messages
import express from 'express';
const app = express();

app.get('/events', authenticate, (req, res) => {
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  // Send a comment to keep the connection alive (ping every 15s)
  const keepAlive = setInterval(() => res.write(': ping\\n\\n'), 15_000);

  // Subscribe to events for this user
  const unsubscribe = eventBus.subscribe(req.user.id, (event) => {
    res.write(\`id: \${event.id}\\n\`);          // for reconnect resumption
    res.write(\`event: \${event.type}\\n\`);     // named event
    res.write(\`data: \${JSON.stringify(event.payload)}\\n\\n\`); // payload + double newline = end of event
  });

  // Send initial data immediately
  res.write(\`data: \${JSON.stringify({ type: 'connected', userId: req.user.id })}\\n\\n\`);

  // Clean up when client disconnects
  req.on('close', () => {
    clearInterval(keepAlive);
    unsubscribe();
  });
});

// ── Client-side EventSource ──────────────────────────────────────────────
const source = new EventSource('/events', {
  // withCredentials: true  // for cookie auth
});

// Named event listeners
source.addEventListener('notification', (event) => {
  const data = JSON.parse(event.data);
  showNotification(data);
});

source.addEventListener('orderUpdate', (event) => {
  updateOrderStatus(JSON.parse(event.data));
});

source.onerror = (err) => {
  // EventSource auto-reconnects — sends Last-Event-ID header
  console.log('SSE error, reconnecting...', err);
};

// To close explicitly
source.close();`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Using WebSocket when SSE suffices (server-push only)',
    wrong: `// Full WebSocket for a notification feed — client never sends messages
const ws = new WebSocket('wss://api.example.com/notifications');
// Adds complexity: auth in query param, sticky sessions, ws proxy config`,
    right: `// SSE is simpler for server-push only
const source = new EventSource('/notifications');
source.addEventListener('notification', handler);
// Works through all standard HTTP infrastructure`,
    explanation: 'WebSocket is full-duplex — overhead for a one-way push. SSE is simpler: plain HTTP, auto-reconnects via EventSource, works through CDNs and proxies, no special infrastructure needed. Use WebSocket only when the client actively sends messages back on the same connection.',
  },
  {
    title: 'Not handling WebSocket reconnection on the client',
    wrong: `const ws = new WebSocket('wss://api.example.com/ws');
// No close handler — if connection drops, client is silently disconnected forever`,
    right: `let retryCount = 0;
function connect() {
  const ws = new WebSocket('wss://api.example.com/ws');
  ws.onclose = () => {
    const delay = Math.min(1000 * 2 ** retryCount++, 30_000);
    setTimeout(connect, delay); // exponential backoff
  };
  ws.onopen = () => { retryCount = 0; }; // reset on success
}
connect();`,
    explanation: 'WebSocket connections drop due to network changes, server restarts, and idle timeouts. Without reconnection logic, the user silently loses real-time updates. Implement exponential backoff (1s, 2s, 4s, ... capped at 30s) to avoid hammering the server on reconnect.',
  },
  {
    title: 'Using short polling instead of SSE or WebSocket',
    wrong: `// Polls every second — 3600 requests/hour per client regardless of updates
setInterval(async () => {
  const updates = await fetch('/api/notifications').then(r => r.json());
  updates.forEach(showNotification);
}, 1000);`,
    right: `// SSE: server pushes only when there are actual updates
const source = new EventSource('/notifications');
source.addEventListener('notification', e => showNotification(JSON.parse(e.data)));`,
    explanation: 'Short polling at 1-second intervals means 3600 HTTP requests per hour per client, most returning empty. SSE holds one connection and the server sends only when there\'s data — zero wasted requests. Use short polling only when events are frequent and predictable enough to justify the request rate (e.g., every 60+ seconds for dashboard refreshes).',
  },
  {
    title: 'Not setting a keep-alive ping for SSE connections',
    wrong: `// No ping — load balancers and proxies close idle HTTP connections after 60s
res.writeHead(200, { 'Content-Type': 'text/event-stream' });
// If no events for 60s, the connection is silently closed by an intermediate proxy`,
    right: `// Send a comment line every 15-30s to keep the connection alive
const keepAlive = setInterval(() => res.write(': ping\\n\\n'), 15_000);
req.on('close', () => clearInterval(keepAlive));`,
    explanation: 'Load balancers (nginx, AWS ALB) close idle HTTP connections after typically 60 seconds. SSE connections with no events appear idle. Send a comment line (`: ping\n\n`) every 15-30 seconds — it counts as traffic but is ignored by the EventSource client. This keeps the connection alive through proxies.',
  },
];

const challenge: Challenge = {
  title: 'Real-Time Transport Selector',
  language: 'typescript',
  description: `Implement selectTransport(requirements: {bidirectional: boolean, highFrequency: boolean, standardProxy: boolean, browserOnly: boolean}): string:
- bidirectional + highFrequency → 'WebSocket'
- bidirectional (not high frequency) → 'WebSocket'
- !bidirectional + standardProxy → 'SSE'
- !bidirectional + !standardProxy → 'SSE or WebSocket'
- browserOnly + !bidirectional → 'SSE'
Simplify: if bidirectional is true → 'WebSocket'; else if standardProxy → 'SSE'; else → 'SSE or WebSocket'`,
  hints: ['Check bidirectional first', 'SSE is preferred when proxies need to work'],
  starterCode: `function selectTransport(req: {bidirectional: boolean, highFrequency: boolean, standardProxy: boolean, browserOnly: boolean}): string {
  // TODO
  return '';
}`,
  solution: `function selectTransport(req: {bidirectional: boolean, highFrequency: boolean, standardProxy: boolean, browserOnly: boolean}): string {
  if (req.bidirectional) return 'WebSocket';
  if (req.standardProxy) return 'SSE';
  return 'SSE or WebSocket';
}

console.log(selectTransport({ bidirectional: true, highFrequency: true, standardProxy: false, browserOnly: false }));
// WebSocket
console.log(selectTransport({ bidirectional: false, highFrequency: false, standardProxy: true, browserOnly: true }));
// SSE`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What is the key advantage of SSE over WebSocket for a notification feed?',
    options: [
      'SSE is faster than WebSocket for large message payloads',
      'SSE works over standard HTTP with auto-reconnect via EventSource — no special proxy config needed',
      'SSE supports bidirectional communication which WebSocket does not',
      'SSE uses UDP for lower latency than WebSocket\'s TCP',
    ],
    answer: 1,
    explanation: 'SSE works over plain HTTP — it passes through CDNs, load balancers, and CORS policies without special configuration. WebSocket requires proxy support (nginx ws upgrade), special firewall rules, and sticky sessions for horizontal scaling. The browser EventSource API also handles reconnection automatically with Last-Event-ID resumption.',
  },
  {
    q: 'Why should you avoid short polling (setInterval every 1 second) for real-time updates?',
    options: [
      'Short polling is deprecated in modern browsers',
      'Each poll is a full HTTP request — 3600 requests/hour per client regardless of whether there is any new data',
      'Short polling cannot handle binary data',
      'Short polling requires WebSocket support which is not universal',
    ],
    answer: 1,
    explanation: 'Short polling at 1-second intervals generates 3600 HTTP requests per hour per connected client. Most of these return empty — pure overhead. SSE (server push) sends data only when available — zero wasted requests. Use short polling only for infrequent data checks (60+ second intervals for dashboard updates).',
  },
  { q: 'What is the fundamental protocol difference between WebSockets and standard HTTP?', options: ['WebSockets use UDP for lower latency while HTTP uses TCP for reliability', 'WebSockets establish a persistent full-duplex connection after an HTTP upgrade handshake allowing both client and server to send messages at any time', 'WebSockets are a newer version of HTTP that replaces the stateless request-response model entirely', 'WebSockets use a dedicated port while HTTP uses port 80 and HTTPS uses port 443'], answer: 1, explanation: 'WebSocket upgrade: the client sends an HTTP request with Upgrade: websocket and Connection: Upgrade headers. The server responds with 101 Switching Protocols. The connection then switches from HTTP to the WebSocket protocol which is a persistent full-duplex TCP connection. Either side can send messages without waiting for the other to request first. Use cases: chat, collaborative editing, real-time games, live trading dashboards. WebSocket connections are long-lived and stateful which creates scaling challenges since each connection holds a server socket.' },
  { q: 'What is Server-Sent Events (SSE) and when is it preferable to WebSockets?', options: ['SSE is a bidirectional protocol designed for real-time game development', 'SSE is a one-way server-to-client stream over HTTP and is better than WebSockets when only the server needs to push updates to clients', 'SSE requires a permanent TCP connection and is functionally identical to WebSockets in most scenarios', 'SSE uses a different port than HTTP and requires special firewall configuration to work'], answer: 1, explanation: 'SSE uses the browser EventSource API over standard HTTP with Content-Type: text/event-stream. The server keeps the connection open and pushes events as formatted text messages. Client-to-server communication still uses regular HTTP requests. SSE advantages over WebSockets: works through HTTP proxies without special configuration, automatic reconnection is built into the browser EventSource API, supports HTTP/2 multiplexing for multiple streams over one connection. Use SSE for: live feeds, notifications, progress updates, and dashboards where only server-to-client push is needed.' },
  { q: 'What is long polling and how does it differ from regular short polling?', options: ['Long polling sends larger payloads while short polling sends smaller payloads to save bandwidth', 'With long polling the server holds the request open until an event occurs or a timeout is reached; with short polling the server responds immediately whether or not there is new data', 'Long polling uses HTTP keep-alive while short polling opens a new TCP connection for each request', 'Short polling is deprecated in HTTP/2 while long polling is the modern supported standard'], answer: 1, explanation: 'Short polling: client sends GET /events every N seconds; server responds immediately even if no new data; most responses are empty and wasteful. Long polling: client sends GET /events; server holds the connection open until an event occurs or a timeout expires (30-60 seconds); when an event occurs the server responds with data; client immediately sends a new request. Long polling is more efficient (no empty responses) but consumes a server thread per waiting client. It was the primary real-time technique before WebSockets and SSE gained broad support.' },
  { q: 'Which real-time technology is most appropriate for a live sports score dashboard where the server pushes updates every few seconds and clients never send real-time data back?', options: ['WebSockets because they provide the lowest latency for all real-time use cases', 'Server-Sent Events because the communication is one-way server-to-client and SSE has simpler infrastructure requirements', 'Short polling because sports scores do not change frequently enough to justify a persistent connection', 'Long polling because it is the most widely supported fallback option across all environments'], answer: 1, explanation: 'SSE is ideal here. Communication is one-way: server pushes score updates, clients only receive. SSE advantages for this use case: simpler than WebSockets (no upgrade handshake complexity), automatic reconnection via the browser EventSource API, works through corporate firewalls and proxies that block WebSocket upgrades, and efficient over HTTP/2. WebSockets would also work but add unnecessary bidirectional complexity for a purely server-to-client scenario. Short polling wastes requests. Long polling is less efficient than SSE.' },
];

const qna: QnaItem[] = [
  {
    q: 'How do you scale WebSocket connections across multiple server instances?',
    a: 'WebSocket connections are stateful and persistent — a client connected to server A cannot receive messages published by server B. Three approaches: <ol><li><strong>Sticky sessions</strong>: the load balancer routes all requests from a client to the same server instance. Simple but defeats horizontal scaling</li><li><strong>Pub/Sub broker</strong>: all server instances subscribe to a Redis channel; when any instance receives a message, it publishes to Redis; all instances forward it to their connected clients. Socket.io Redis adapter uses this pattern</li><li><strong>Dedicated WebSocket service</strong>: a separate stateful WebSocket gateway (Ably, Pusher, AWS API Gateway WebSockets) manages connections; your stateless API services push to it via HTTP</li></ol>For most production apps, option 2 (Redis pub/sub) or option 3 (managed service) are the practical choices.',
  },
  {
    q: 'When should I use SSE vs GraphQL subscriptions?',
    a: 'Use <strong>SSE</strong> when: you\'re using REST (not GraphQL); clients need a simple, structured event stream; you want auto-reconnect and Last-Event-ID resumption; you need to work through standard HTTP proxies and CDNs without special configuration. Use <strong>GraphQL subscriptions</strong> when: you\'re already using Apollo Client or a GraphQL client that manages cache updates automatically; the subscription payload is a GraphQL type you want to normalize in the client cache; you need the subscription filter/variables defined in the same SDL schema as your queries. For simple use cases, SSE is less setup; for integrated GraphQL apps, subscriptions provide a better developer experience.',
  },
  { q: 'When should you choose WebSockets vs SSE vs polling?', a: 'WebSockets: choose for genuinely bidirectional low-latency communication where both client and server send messages (chat, multiplayer games, collaborative editing, live code editors). Requires WebSocket support at all infrastructure layers including load balancers and proxies. SSE: choose when only the server pushes data to clients (live feeds, notifications, dashboards, progress bars). Simpler infrastructure, automatic reconnection, works over HTTP/2 without extra configuration. Polling: choose when real-time updates are not truly required, data changes infrequently, or the source does not support push. Start with SSE and upgrade to WebSockets only when bidirectional communication is genuinely needed.' },
  { q: 'What are the scalability challenges of WebSockets and how do you address them?', a: 'Connection state: WebSocket connections are stateful; a client connected to Server A cannot receive messages published from Server B. Solution: use a pub/sub broker like Redis Pub/Sub so all server instances subscribe to the same channels. Connection limits: each WebSocket holds a file descriptor; one server handles thousands not millions of connections. Solution: horizontal scaling of WebSocket servers. Load balancing: standard round-robin load balancers break WebSocket connections mid-session. Solution: use sticky sessions (session affinity) or a fully stateless pub/sub architecture where any server can forward any message. Backpressure: slow clients cause server memory to grow. Solution: rate limiting per connection.' },
  { q: 'How does SSE automatic reconnection work and how do you implement event gap recovery?', a: 'Browser EventSource automatically reconnects after a dropped connection with a configurable delay (default: a few seconds). Server controls the retry interval by sending retry: 3000 (milliseconds) as part of the event stream. Event IDs for gap recovery: the server sends id: 123 with each event; the browser tracks the last received ID and sends it as the Last-Event-ID header on reconnection. Server implementation: store recent events in a ring buffer (e.g. last 60 seconds of events); on reconnection query events with ID greater than lastEventId and stream the missed events first. This provides at-least-once delivery semantics. EventSource does NOT auto-reconnect if the server intentionally closes the connection with HTTP 204.' },
  { q: 'What is the difference between WebSocket and Socket.IO?', a: 'WebSocket is a native browser API and protocol (RFC 6455) for persistent full-duplex TCP communication. It is direct, simple, and requires no library for basic usage. Socket.IO is a library built on top of WebSocket that adds: automatic reconnection, room and namespace support for grouping connections, event-based messaging with acknowledgment callbacks, and transparent fallback to long polling when WebSockets are blocked by the environment. Socket.IO is NOT pure WebSocket - a Socket.IO client cannot connect to a plain WebSocket server and vice versa because Socket.IO adds its own framing protocol. Use raw WebSocket for simple low-overhead connections. Use Socket.IO when you need rooms, broadcasting to groups, built-in reconnection, and multi-transport fallback.' },
];

const revision: RevisionSummary = {
  oneLiner: 'WebSocket: full-duplex for chat/gaming; SSE: server-push only for feeds/notifications — simpler, HTTP-native, auto-reconnect; long polling: fallback when WebSocket unavailable.',
  mustKnow: [
    'WebSocket: bidirectional, persistent TCP, lowest latency — for chat, gaming, collaboration',
    'SSE: server-to-client push only, plain HTTP, auto-reconnect via EventSource API',
    'SSE works through proxies/CDNs without config; WebSocket requires proxy WebSocket support',
    'EventSource: built-in browser API with auto-reconnect and Last-Event-ID resumption',
    'Keep-alive ping (: ping\\n\\n) prevents idle SSE connections from closing at proxies',
    'WebSocket scaling: use Redis pub/sub so all instances can broadcast to connected clients',
  ],
  interviewFocus: [
    'When would you use WebSocket vs SSE?',
    'How do you handle WebSocket reconnection on the client?',
    'How do you scale WebSocket connections across multiple servers?',
  ],
};

@Component({
  selector: 'app-api-websockets',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './websockets-sse-polling.html',
  styleUrl: './websockets-sse-polling.scss',
})
export class ApiWebsockets {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
