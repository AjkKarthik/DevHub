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
