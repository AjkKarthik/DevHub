import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../components/shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../../components/shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../../components/shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../components/shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../../components/shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../../components/shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../../components/shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../../components/shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../../components/shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../../components/shared/page-complete/page-complete';

@Component({
  selector: 'app-node-websockets',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './websockets.html',
  styleUrl: './websockets.scss'
})
export class NodeWebsockets {
  quickRef: QuickRefItem[] = [
    { name: 'WebSocket', type: 'class', desc: 'Full-duplex persistent TCP connection between client and server. Browser-native API.' },
    { name: 'ws library', type: 'keyword', desc: 'Lightweight Node.js WebSocket server. High performance, no built-in rooms/events.' },
    { name: 'Socket.io', type: 'keyword', desc: 'WebSocket library with rooms, events, namespaces, auto-reconnect, and HTTP fallback.' },
    { name: 'io.to(room).emit()', type: 'method', desc: 'Broadcast event to all sockets in a room. Room is any string identifier.' },
    { name: 'socket.join(room)', type: 'method', desc: 'Add a socket to a named room for targeted broadcasts.' },
    { name: 'Heartbeat / ping-pong', type: 'keyword', desc: 'Periodic ping to detect dead connections. ws: ws.ping(); client: pong event.' },
    { name: 'Sticky sessions', type: 'keyword', desc: 'Required for Socket.io in multi-server deployments — route same client to same server.' },
    { name: 'Socket.io Redis adapter', type: 'keyword', desc: 'Syncs events across multiple Socket.io instances via Redis pub/sub.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'WebSocket Protocol and When to Use It',
      points: [
        'WebSocket is a protocol (RFC 6455) that starts as an HTTP upgrade request and then becomes a persistent, full-duplex TCP connection. Both sides can send messages at any time — unlike HTTP where the client always initiates.',
        'Use WebSockets for: real-time collaboration (Google Docs), live chat, live dashboards, multiplayer games, live notifications, stock tickers. Do NOT use for: simple request/response (use REST), infrequent updates (use polling or SSE), one-way server pushes (use Server-Sent Events — simpler, auto-reconnect, HTTP/2 multiplexed).',
        'Server-Sent Events (SSE) vs WebSockets: SSE is one-directional (server → client), uses HTTP, auto-reconnects, works through proxies easily, limited to text. WebSocket is bidirectional, binary-capable, requires special proxy config. For notification feeds and live dashboards, SSE is often the right choice.',
        'The ws npm package is a minimal WebSocket server. Socket.io builds on ws but adds: named events, rooms, namespaces, automatic reconnection with exponential backoff, transport fallback to HTTP long-polling for restrictive environments.',
      ]
    },
    {
      heading: 'Rooms, Namespaces, and Broadcasting',
      points: [
        'Socket.io rooms are named groups of sockets. socket.join("room-name") subscribes a socket to a room. io.to("room-name").emit("event", data) sends to all sockets in the room. Rooms are created and destroyed automatically — no setup needed.',
        'Namespaces (/chat, /dashboard) partition the Socket.io server. Each namespace has its own event listeners, middleware, and rooms. Clients connect to a namespace: const socket = io("http://server/chat"). Use for separating different real-time features of the same app.',
        'Broadcasting: socket.broadcast.emit() sends to all connected sockets EXCEPT the sender. io.emit() sends to ALL connected sockets. io.to(room).emit() sends to all in a room. socket.to(room).emit() sends to all in a room except the sender.',
        'Authentication in Socket.io: use the io.use() middleware (runs before connection). Extract and verify a JWT from socket.handshake.auth.token. Attach the user to socket.data.user. Reject with next(new Error("Unauthorized")) to refuse the connection.',
      ]
    },
    {
      heading: 'Scaling WebSockets and Production Considerations',
      points: [
        'WebSockets are stateful — a socket is tied to one server process. To scale horizontally, use the Socket.io Redis adapter (@socket.io/redis-adapter). It syncs events across all server instances via Redis pub/sub. io.to(room).emit() automatically delivers to the right instance.',
        'Sticky sessions: if using HTTP long-polling as fallback, clients must always connect to the same server (because the polling session is in memory). Configure your load balancer with sticky sessions (IP hash or cookie-based) or disable polling: { transports: ["websocket"] }.',
        'Connection management: track active sockets in a Map keyed by userId. When a user disconnects and reconnects, update the Map. Use heartbeats (ws.ping() + pong timeout) to detect zombie connections — OS-level TCP keepalive can take minutes to detect a dropped connection.',
        'Memory management: each socket keeps state. At 10,000 concurrent connections, even 1KB per socket = 10MB. Monitor active connections and implement per-user connection limits. Close idle connections after a timeout.',
      ]
    },
    {
      heading: 'WebSocket Protocol Fundamentals',
      points: [
        'A WebSocket connection begins as a standard HTTP request with an Upgrade: websocket header — the server responds with 101 Switching Protocols, after which the connection becomes a persistent, full-duplex TCP connection outside the normal HTTP request/response model.',
        'Once established, either side can send messages at any time without waiting for a request — this is the fundamental difference from HTTP polling, enabling genuine real-time, server-initiated push without the client needing to ask first.',
        'WebSocket messages can be text (typically JSON) or binary frames — for structured application data, most implementations serialize to JSON text frames for simplicity, though binary framing offers lower overhead for high-frequency or large-payload use cases.',
        'Unlike HTTP requests, a WebSocket connection is stateful and long-lived — the server must track connection state (which user, what subscriptions) for the lifetime of the connection, a fundamentally different operational model than stateless REST request handling.',
      ]
    },
    {
      heading: 'Scaling WebSocket Servers Horizontally',
      points: [
        'A client connected to one server instance cannot directly receive a message published from a different instance — since each WebSocket connection is pinned to the specific process that accepted it, unlike a stateless HTTP request that any instance can serve.',
        'A shared pub/sub layer (Redis Pub/Sub, or the official adapter for Socket.IO) lets any server instance publish a message and have it relayed to clients connected on any other instance, solving the cross-instance broadcast problem.',
        'Sticky sessions at the load balancer (routing a client\'s reconnection attempts back to the same server instance where reasonable) reduce unnecessary connection churn, though a properly pub/sub-backed architecture should function correctly even without them.',
        'Connection count is a real capacity constraint per instance — unlike stateless HTTP where a server handles a request and immediately frees resources, each open WebSocket connection consumes a file descriptor and some memory for the entire session duration, directly limiting how many concurrent users one instance can serve.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Socket.io chat server',
      language: 'typescript',
      code: `import { createServer } from 'node:http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: 'https://myapp.com', credentials: true },
  transports: ['websocket', 'polling'],  // prefer websocket, fall back to polling
});

// Auth middleware — runs before every connection
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  try {
    socket.data.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    next(new Error('Unauthorized'));
  }
});

// Namespace: /chat
const chat = io.of('/chat');
chat.on('connection', (socket) => {
  const userId = socket.data.user.sub;
  console.log(\`User \${userId} connected\`);

  // Join a room
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-joined', { userId, roomId }); // notify others
  });

  // Broadcast message to room
  socket.on('send-message', ({ roomId, message }) => {
    const payload = { userId, message, timestamp: Date.now() };
    io.of('/chat').to(roomId).emit('new-message', payload); // including sender
    // persist to DB
    db.messages.create({ ...payload, roomId });
  });

  socket.on('disconnect', (reason) => {
    console.log(\`User \${userId} disconnected: \${reason}\`);
  });
});

httpServer.listen(3000);`
    },
    {
      label: 'ws library + heartbeat',
      language: 'typescript',
      code: `import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

// Track connections by userId
const clients = new Map(); // userId → WebSocket

wss.on('connection', (ws, req) => {
  // Parse auth from URL query: ws://server?token=...
  const url = new URL(req.url, 'http://localhost');
  const token = url.searchParams.get('token');
  let userId;
  try {
    ({ sub: userId } = jwt.verify(token, process.env.JWT_SECRET));
  } catch {
    ws.close(1008, 'Unauthorized');
    return;
  }

  clients.set(userId, ws);
  ws.isAlive = true;

  ws.on('pong', () => { ws.isAlive = true; });  // heartbeat response

  ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    handleMessage(userId, msg, clients);
  });

  ws.on('close', () => clients.delete(userId));
});

// Heartbeat — detect dead connections every 30s
const heartbeat = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) { ws.terminate(); return; }
    ws.isAlive = false;
    ws.ping();
  });
}, 30_000);

wss.on('close', () => clearInterval(heartbeat));

// Send to specific user
function sendToUser(userId, event, data) {
  const ws = clients.get(userId);
  if (ws?.readyState === ws.OPEN) {
    ws.send(JSON.stringify({ event, data }));
  }
}`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Not authenticating WebSocket connections',
      wrong: `io.on('connection', (socket) => {
  // anyone can connect — no auth check
  socket.on('admin-action', handleAdmin);
});`,
      right: `io.use((socket, next) => {
  try { socket.data.user = jwt.verify(socket.handshake.auth.token, SECRET); next(); }
  catch { next(new Error('Unauthorized')); }
});`,
      explanation: 'WebSocket connections bypass standard HTTP auth middleware. Authentication must be done in Socket.io middleware (io.use()) or the initial HTTP upgrade handler. Without it, any anonymous client can send messages.'
    },
    {
      title: 'Broadcasting room events without joining the room',
      wrong: `socket.on('join-room', (roomId) => {
  io.to(roomId).emit('user-joined', userId); // before joining — sender not in room
});`,
      right: `socket.on('join-room', async (roomId) => {
  await socket.join(roomId);       // join first
  socket.to(roomId).emit('user-joined', userId); // then notify others
});`,
      explanation: 'socket.join() must be awaited before broadcasting to the room. Without joining, the socket cannot receive subsequent events broadcast to that room, and io.to() room stats are inaccurate.'
    },
    {
      title: 'Not handling disconnects — memory leak from stale entries',
      wrong: `io.on('connection', (socket) => {
  onlineUsers.set(socket.data.userId, socket.id); // never cleaned up
});`,
      right: `io.on('connection', (socket) => {
  onlineUsers.set(socket.data.userId, socket.id);
  socket.on('disconnect', () => onlineUsers.delete(socket.data.userId));
});`,
      explanation: 'Every socket that connects without a disconnect handler leaks memory — the Map entry stays forever. Always register a disconnect listener to clean up userId mappings, room presence lists, and any other socket-associated state.'
    },
    {
      title: 'Using Socket.io across multiple servers without Redis adapter',
      wrong: `// Server A broadcasts to room "lobby" — only reaches clients on Server A
io.to('lobby').emit('update', data);`,
      right: `import { createAdapter } from '@socket.io/redis-adapter';
const pubClient = createClient({ url: redisUrl });
const subClient = pubClient.duplicate();
io.adapter(createAdapter(pubClient, subClient));
// Now io.to('lobby').emit() reaches all clients across all servers`,
      explanation: "Without the Redis adapter, each Socket.io instance only knows about its own sockets. A room broadcast reaches only clients connected to that server. Redis pub/sub synchronizes events across all instances."
    },
  ];

  challenge: Challenge = {
    title: 'Presence Tracking System',
    language: 'typescript',
    description: 'Build a Socket.io presence system that tracks which users are online in named "workspaces". When a user joins a workspace, broadcast the updated online user list to everyone in that workspace. When they disconnect, remove them and broadcast the update. Support a user querying who is online with a getPresence event.',
    hints: [
      'Use a Map<workspaceId, Set<userId>> to track presence',
      'socket.join(workspaceId) for room-based broadcasts',
      'io.to(workspaceId).emit("presence", [...onlineUsers])',
    ],
    starterCode: `import { Server } from 'socket.io';
const io = new Server(httpServer);

const workspacePresence = new Map(); // workspaceId → Set<userId>

io.on('connection', (socket) => {
  const userId = socket.handshake.auth.userId;

  // TODO: handle 'join-workspace' event
  // TODO: handle 'getPresence' event
  // TODO: handle 'disconnect' and clean up all workspaces
});`,
    solution: `import { Server } from 'socket.io';
const io = new Server(httpServer);

const workspacePresence = new Map(); // workspaceId → Set<userId>

io.on('connection', (socket) => {
  const userId = socket.handshake.auth.userId;
  const joinedWorkspaces = new Set();

  socket.on('join-workspace', (workspaceId) => {
    socket.join(workspaceId);
    joinedWorkspaces.add(workspaceId);

    if (!workspacePresence.has(workspaceId)) workspacePresence.set(workspaceId, new Set());
    workspacePresence.get(workspaceId).add(userId);

    io.to(workspaceId).emit('presence', {
      workspaceId,
      online: [...workspacePresence.get(workspaceId)],
    });
  });

  socket.on('getPresence', (workspaceId, callback) => {
    const online = [...(workspacePresence.get(workspaceId) ?? [])];
    callback({ workspaceId, online });
  });

  socket.on('disconnect', () => {
    for (const workspaceId of joinedWorkspaces) {
      workspacePresence.get(workspaceId)?.delete(userId);
      io.to(workspaceId).emit('presence', {
        workspaceId,
        online: [...(workspacePresence.get(workspaceId) ?? [])],
      });
    }
  });
});`
  };

  quiz: QuizQuestion[] = [
    { q: 'What is the difference between io.emit() and socket.broadcast.emit()?', options: ['io.emit is faster', 'io.emit sends to ALL sockets; socket.broadcast.emit sends to all EXCEPT the sender', 'socket.broadcast sends to a specific room', 'There is no practical difference'], answer: 1, explanation: 'io.emit() broadcasts to every connected socket including the sender. socket.broadcast.emit() sends to all sockets except the one that triggered it. Use broadcast for events where the sender does not need to receive their own message.' },
    { q: 'Why do multi-server Socket.io deployments need the Redis adapter?', options: ['Redis stores WebSocket frames for reliability', 'Without it, room broadcasts only reach clients on the same server instance', 'Redis provides WebSocket compression', 'The Redis adapter adds authentication'], answer: 1, explanation: 'Each Socket.io server instance only tracks its own connections. io.to(room).emit() on Server A cannot reach clients connected to Server B. The Redis adapter syncs events via pub/sub so broadcasts reach all clients regardless of which server they\'re on.' },
    { q: 'When should you use Server-Sent Events (SSE) instead of WebSockets?', options: ['When bidirectional communication is needed', 'For one-directional server-to-client updates (notifications, live feeds) — simpler and HTTP/2 friendly', 'When binary data must be transmitted', 'When low latency is critical'], answer: 1, explanation: 'SSE is one-directional (server → client), uses HTTP (works through proxies, load balancers, CDNs without config), auto-reconnects, and is multiplexed in HTTP/2. For notification feeds, dashboards, and live updates where the client only listens — SSE is simpler than WebSockets.' },
    { q: 'What is the purpose of WebSocket heartbeats?', options: ['To compress messages', 'To detect dead connections that the OS has not yet closed at the TCP layer', 'To synchronize clocks between client and server', 'To authenticate connections periodically'], answer: 1, explanation: 'TCP connections can die silently (network failure, proxy timeout) without either side receiving a TCP close. OS-level TCP keepalive can take minutes to detect this. Application-level heartbeats (ws.ping() + pong timeout) detect dead connections within seconds.' },
    { q: 'How do you scale Socket.io across multiple Node.js instances?', options: ['Socket.io scales automatically', 'Use the Socket.io Redis adapter — broadcasts fan out through Redis pub/sub to all server instances', 'Use a sticky session load balancer only', 'Socket.io cannot scale beyond one instance'], answer: 1, explanation: 'A Socket.io event emitted on server A reaches only clients connected to A. With the Redis adapter (@socket.io/redis-adapter), server A publishes to a Redis channel; all other servers subscribe and re-emit to their local clients. The result: broadcasting from any server instance reaches all connected clients across all instances.' },
    { q: 'What is the WebSocket handshake and how does it relate to HTTP?', options: ['WebSocket is a completely separate protocol unrelated to HTTP', 'WebSocket starts as an HTTP request with an Upgrade header — the server switches the connection to WebSocket protocol', 'WebSocket uses UDP instead of TCP', 'The handshake requires TLS certificates'], answer: 1, explanation: 'The WebSocket handshake is an HTTP Upgrade request. Client sends: Upgrade: websocket, Connection: Upgrade, Sec-WebSocket-Key. Server responds 101 Switching Protocols. After this, the TCP connection is handed off to the WebSocket protocol — no more HTTP overhead, just framed messages. This is why WebSockets work through HTTP load balancers.' },
  ];

  qna: QnaItem[] = [
    { q: 'How do I handle WebSocket reconnection on the client?', a: 'Socket.io handles reconnection automatically with exponential backoff — no extra code needed. For the raw ws API or custom solutions: catch the close event, implement exponential backoff (setTimeout(() => reconnect(), delay * 2^attempt)), cap the max delay (30s), and stop after N attempts. After reconnecting, re-authenticate (send auth token again), re-join rooms, and request any missed events since last connection timestamp.' },
    { q: 'How do I send messages to a specific user (not a room) in Socket.io?', a: 'Maintain a Map of userId → socketId. When a user connects, store their socketId: userSockets.set(userId, socket.id). To send: io.to(userSockets.get(targetUserId)).emit("event", data). For multi-server deployments with the Redis adapter, use socket IDs directly — the adapter routes to the correct server. Alternatively, have each user automatically join a personal room named by userId and emit to that room.' },
    { q: 'What are WebSocket subprotocols and when would you use them?', a: 'Subprotocols are application-level agreements about message format negotiated during the WebSocket handshake (Sec-WebSocket-Protocol header). Examples: graphql-ws for GraphQL subscriptions, mqtt for IoT messaging. You would define a custom subprotocol when building a framework-level protocol on top of raw WebSockets — typically when building tooling, not applications. Most application developers use Socket.io\'s event system instead of defining subprotocols.' },
    { q: 'What is the difference between the native ws library and Socket.IO for Node.js WebSocket servers?', a: 'The ws library implements the raw WebSocket protocol (RFC 6455) with minimal overhead and no additional abstractions — you handle reconnection, rooms/broadcasting, and fallback transport yourself. Socket.IO builds on top of WebSocket (with an automatic fallback to HTTP long-polling for environments where WebSocket is blocked) and adds higher-level features out of the box: automatic reconnection with exponential backoff, room/namespace-based broadcasting, and acknowledgment callbacks for request-response-style messaging over the socket — at the cost of a custom framing protocol that is not plain WebSocket-compatible with non-Socket.IO clients.' },
    { q: 'How do you scale a Node.js WebSocket server horizontally across multiple instances?', a: 'Since a WebSocket connection is stateful and pinned to the specific server process that accepted it, a client connected to instance A cannot directly receive a message published from instance B. Use a shared pub/sub layer (Redis Pub/Sub, with the @socket.io/redis-adapter for Socket.IO) so any instance can publish a message and have it relayed to clients connected on any other instance — combined with sticky sessions at the load balancer level so a client\'s reconnect attempts land back on a server that still has reasonable session affinity where needed.' },
    { q: 'Why is authenticating a WebSocket connection different from authenticating a typical REST API request?', a: 'A WebSocket connection is established once (via an HTTP upgrade handshake) and then stays open for the lifetime of the session — unlike REST where every request can carry its own auth header. Authentication typically happens during the initial handshake (validating a token passed as a query parameter or in the upgrade request headers before accepting the connection) and the authenticated identity is then attached to the long-lived connection object for the duration of the session — requiring separate handling for token expiry mid-connection, since there is no natural per-message re-authentication unless explicitly implemented.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'WebSockets enable full-duplex real-time communication. Socket.io adds rooms, events, and reconnection. Scale with Redis adapter + sticky sessions.',
    mustKnow: [
      'WebSocket = persistent full-duplex TCP. Upgrade from HTTP.',
      'SSE for server→client only; WebSocket for bidirectional.',
      'Socket.io rooms: socket.join(room) → io.to(room).emit().',
      'Auth in io.use() middleware before connection completes.',
      'Heartbeats detect dead connections faster than OS TCP keepalive.',
      'Multi-server: Redis adapter syncs room broadcasts across instances.',
      'Disconnect handler required — stale Map/Set entries = memory leak.',
    ],
    interviewFocus: [
      'How does Socket.io scale across multiple servers?',
      'What is the difference between WebSockets and Server-Sent Events?',
      'How do you authenticate WebSocket connections?',
    ]
  };
}
