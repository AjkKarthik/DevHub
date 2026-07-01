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
  { name: 'WebSocket',      type: 'keyword', desc: 'Full-duplex persistent TCP connection. Essential for real-time bidirectional messaging.' },
  { name: 'Chat server',    type: 'keyword', desc: 'Stateful server holding open WebSocket connections per user. Horizontally scaled.' },
  { name: 'Presence',       type: 'keyword', desc: 'Online/offline/away status. Redis key per user with TTL refreshed by heartbeat.' },
  { name: 'Message ID',     type: 'keyword', desc: 'Monotonically increasing ID per conversation. Enables ordering and offset-based sync.' },
  { name: 'Delivery receipt',type: 'keyword', desc: 'ACK from server (sent), recipient device (delivered), recipient read (read).' },
  { name: 'Push notification',type: 'keyword', desc: 'FCM/APNs notification when recipient is offline — triggers app background sync.' },
  { name: 'Message fanout', type: 'keyword', desc: 'Group chat: deliver message to N members. Kafka topic per group or per-member queues.' },
  { name: 'Sequence number',type: 'keyword', desc: 'Per-conversation counter ensures total ordering within a conversation thread.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'WebSocket connection management',
    points: [
      'Each online user holds one WebSocket connection to a chat server.',
      'Chat servers are stateful — they know which users are connected to them.',
      'A routing layer (Redis pub/sub or service mesh) routes messages to the correct chat server.',
      'Horizontal scaling: user A on server-1, user B on server-2. Server-1 publishes to Redis → server-2 delivers to B.',
    ],
  },
  {
    heading: 'Message flow: 1-to-1 chat',
    points: [
      'A sends message → WebSocket → Chat Server (A\'s server) → stores in DB → publishes to Redis channel.',
      'Redis pub/sub: Chat Server (B\'s server) subscribed to B\'s channel → receives message → pushes to B via WebSocket.',
      'If B is offline: message stored in DB; push notification sent via FCM/APNs; B syncs on reconnect.',
      'Delivery receipts: sent (stored), delivered (B\'s device ACK), read (B opens conversation).',
    ],
  },
  {
    heading: 'Message ordering and sequence numbers',
    points: [
      'Problem: A sends msg1, msg2. Network delivers msg2 first — client sees wrong order.',
      'Solution: per-conversation sequence number (auto-increment in DB or Snowflake ID).',
      'Client sorts incoming messages by seq_num before rendering.',
      'Optimistic UI: show message immediately with temp ID → replace with server seq_num on ACK.',
    ],
  },
  {
    heading: 'Group chat fanout',
    points: [
      'Group of 500 members: one message → 500 deliveries.',
      'Option A: Kafka topic per group. Consumers = chat servers. Message → published to topic → all chat servers consume.',
      'Option B: Service layer looks up each member\'s chat server → direct push. Faster but more complex.',
      'Large groups (> 10k members, e.g. broadcast channels): fan-out on read — members poll, no push.',
    ],
  },
  {
    heading: 'Message Delivery Guarantees and Ordering',
    points: [
      'At-least-once delivery (the common default for chat systems) guarantees a message is never silently lost, but requires the client to deduplicate messages by a unique message ID, since the same message may occasionally be delivered more than once during retries.',
      'Message ordering within a single conversation is typically enforced by a monotonically increasing sequence number per conversation — the client reorders out-of-order arrivals locally based on this sequence rather than relying on network delivery order, which is not guaranteed.',
      'Read receipts and typing indicators are separate, lower-priority event streams from actual message content — they tolerate occasional loss (a missed typing indicator is inconsequential) and should never share the same reliability guarantees or storage path as message persistence, to avoid unnecessary overhead on the critical path.',
      'Offline message delivery requires a durable queue per user — messages sent while a recipient is offline are stored server-side and delivered (with correct ordering) when the recipient reconnects, rather than being lost if no active WebSocket connection exists at send time.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'WebSocket Server',
    language: 'typescript',
    code: `// Chat server — WebSocket + Redis pub/sub routing
import WebSocket from 'ws';
import { createClient } from 'redis';

const wss = new WebSocket.Server({ port: 8080 });
const publisher = createClient();
const subscriber = createClient();
await Promise.all([publisher.connect(), subscriber.connect()]);

// Map userId → WebSocket connection (in-memory, this server only)
const connections = new Map<string, WebSocket>();

wss.on('connection', async (ws, req) => {
  const userId = authenticate(req);  // JWT from query param or header
  connections.set(userId, ws);

  // Mark user online in Redis
  await publisher.set(\`presence:\${userId}\`, 'online', { EX: 30 });

  // Subscribe to this user's incoming message channel
  await subscriber.subscribe(\`inbox:\${userId}\`, (message) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(message);
  });

  ws.on('message', async (data) => {
    const msg = JSON.parse(data.toString());
    await handleSend(userId, msg);
  });

  ws.on('close', async () => {
    connections.delete(userId);
    await publisher.del(\`presence:\${userId}\`);
    await subscriber.unsubscribe(\`inbox:\${userId}\`);
  });

  // Heartbeat: refresh presence TTL every 20s
  const heartbeat = setInterval(async () => {
    await publisher.expire(\`presence:\${userId}\`, 30);
  }, 20_000);
  ws.on('close', () => clearInterval(heartbeat));
});

async function handleSend(senderId: string, msg: ChatMessage): Promise<void> {
  // 1. Persist message
  const saved = await db.run(
    'INSERT INTO messages (conv_id, sender_id, content, seq_num) VALUES (?, ?, ?, nextval(?))',
    [msg.convId, senderId, msg.content, \`seq:\${msg.convId}\`]
  );

  // 2. Publish to recipient's inbox channel (any chat server will pick it up)
  const payload = JSON.stringify({ ...saved, type: 'message' });
  await publisher.publish(\`inbox:\${msg.recipientId}\`, payload);

  // 3. If recipient offline: send push notification
  const isOnline = await publisher.exists(\`presence:\${msg.recipientId}\`);
  if (!isOnline) await pushNotification(msg.recipientId, saved);
}`,
  },
  {
    label: 'Message Storage Schema',
    language: 'bash',
    code: `-- Message storage — Cassandra (or PostgreSQL for small scale)
-- Cassandra: optimised for writes + time-range queries by conversation

CREATE TABLE messages (
  conv_id    UUID,
  seq_num    BIGINT,         -- monotonically increasing per conversation
  message_id UUID,
  sender_id  UUID,
  content    TEXT,
  sent_at    TIMESTAMP,
  status     TEXT,           -- 'sent' | 'delivered' | 'read'
  PRIMARY KEY (conv_id, seq_num)
) WITH CLUSTERING ORDER BY (seq_num DESC);
-- Partition by conv_id: all messages in a conversation on same node
-- Cluster by seq_num DESC: newest first; efficient range queries

-- Fetch conversation history (pagination):
-- SELECT * FROM messages WHERE conv_id = ? AND seq_num < ? LIMIT 50

-- PostgreSQL alternative for small scale:
-- CREATE TABLE messages (
--   id BIGSERIAL PRIMARY KEY,
--   conv_id UUID NOT NULL,
--   sender_id UUID NOT NULL,
--   content TEXT NOT NULL,
--   sent_at TIMESTAMPTZ DEFAULT NOW(),
--   seq_num BIGINT NOT NULL  -- per-conversation sequence
-- );
-- CREATE INDEX idx_messages_conv ON messages (conv_id, seq_num DESC);

-- Conversation metadata:
CREATE TABLE conversations (
  id              UUID PRIMARY KEY,
  type            TEXT,        -- 'direct' | 'group'
  last_message_id UUID,
  last_active_at  TIMESTAMP,
  member_count    INT
);`,
  },
  {
    label: 'Sync on Reconnect',
    language: 'typescript',
    code: `// Client reconnect sync — fetch missed messages since last seen seq_num

interface SyncRequest {
  conversations: Array<{ convId: string; lastSeqNum: number }>;
}

// Client sends on WebSocket open:
// { type: 'sync', conversations: [{ convId: 'abc', lastSeqNum: 42 }, ...] }

async function handleSync(userId: string, req: SyncRequest): Promise<void> {
  const missed: Message[] = [];

  for (const { convId, lastSeqNum } of req.conversations) {
    // Verify user is a member of this conversation
    const isMember = await db.scalar(
      'SELECT 1 FROM conv_members WHERE conv_id = ? AND user_id = ?', [convId, userId]
    );
    if (!isMember) continue;

    // Fetch messages since last seen (Cassandra or PostgreSQL)
    const messages = await db.query(
      'SELECT * FROM messages WHERE conv_id = ? AND seq_num > ? ORDER BY seq_num LIMIT 200',
      [convId, lastSeqNum]
    );
    missed.push(...messages);
  }

  // Send all missed messages in one batch
  ws.send(JSON.stringify({ type: 'sync_response', messages: missed }));
}

// Client-side: on reconnect
async function onWebSocketOpen(): Promise<void> {
  const lastSeen = await localDb.getLastSeqNums();  // stored locally
  ws.send(JSON.stringify({ type: 'sync', conversations: lastSeen }));
}`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Polling instead of WebSocket for real-time chat',
    wrong: `// HTTP polling: client asks "any new messages?" every 2 seconds
setInterval(() => fetch('/api/messages?since=' + lastId), 2000);
// 1M users × 0.5 req/s = 500,000 requests/sec — all mostly empty`,
    right: `// WebSocket: server pushes messages instantly
ws.onmessage = (event) => displayMessage(JSON.parse(event.data));
// Server pushes only when there IS a new message
// 0 requests/s when idle — massive reduction in load`,
    explanation: 'Polling creates constant load proportional to user count regardless of message volume. WebSocket connections are idle (< 1KB/s heartbeat) and only transfer data when messages actually arrive.',
  },
  {
    title: 'No message sequence numbers — ordering bugs',
    wrong: `// Messages delivered by arrival time (network order)
// A sends: "Hello" then "How are you?"
// Network reorders → client displays: "How are you?" then "Hello"`,
    right: `// Per-conversation sequence number ensures ordering
// Server assigns seq_num = nextval('seq:convId') on insert
// Client sorts all received messages by seq_num before rendering`,
    explanation: 'Network reordering is real — especially on mobile. Without sequence numbers, messages display in the wrong order. Assign a monotonically increasing sequence number per conversation at the server.',
  },
  {
    title: 'Chat server routing without pub/sub',
    wrong: `// Server 1 receives message for User B
// User B is connected to Server 2
// Server 1 doesn't know which server has B
// → message lost or requires O(N) broadcast to all servers`,
    right: `// Redis pub/sub: Server 1 publishes to channel inbox:userB
// Server 2 is subscribed to inbox:userB → receives + delivers to B
// No server-to-server discovery needed — Redis is the routing layer`,
    explanation: 'Without a routing layer, chat servers cannot deliver messages to users connected to other servers. Redis pub/sub (or Kafka) acts as the message bus — any server can publish, the correct server receives and delivers.',
  },
  {
    title: 'Not handling offline users',
    wrong: `// Send WebSocket message to recipient
// If recipient offline → message silently dropped
// User never receives message after coming back online`,
    right: `// Always persist message first, then deliver:
// 1. INSERT into messages table
// 2. Try WebSocket delivery
// 3. If offline: send FCM/APNs push notification
// 4. On reconnect: client syncs from last seen seq_num`,
    explanation: 'Users go offline constantly on mobile. Messages must be persisted before delivery is attempted. Offline users receive a push notification and sync missed messages on reconnect using their last known seq_num.',
  },
];

const challenge: Challenge = {
  title: 'Design WhatsApp\'s message delivery system',
  language: 'typescript',
  description: `Design the message delivery system for a WhatsApp-like app.

Scale:
- 2 billion users, 100M daily active
- 100 billion messages/day = ~1.15M messages/sec
- 1-to-1 and group chats (max 256 members)
- Must work reliably on poor mobile connections

Requirements:
1. Messages delivered in order within a conversation
2. Exactly-once delivery (no duplicates on retry)
3. Offline support: messages delivered when user reconnects
4. Read receipts: single tick (sent), double tick (delivered), blue (read)
5. End-to-end encryption hint (key exchange approach)

Design the message flow for all three user states:
A → sends message; B is: (1) online, (2) offline, (3) on different device`,
  hints: [
    'Sequence number per conversation ensures ordering',
    'Idempotency key on message prevents duplicates on retry',
    'Offline: push notification (FCM) + sync on reconnect via seq_num',
    'E2E encryption: Signal protocol — sender encrypts with recipient\'s public key',
  ],
  starterCode: `type UserState = 'online_same_server' | 'online_diff_server' | 'offline';

interface MessageFlow {
  state: UserState;
  steps: string[];
  deliveryReceiptFlow: string;
}`,
  solution: `const flows: MessageFlow[] = [
  {
    state: 'online_same_server',
    steps: [
      '1. A sends message via WebSocket to Chat Server S1',
      '2. S1 validates + assigns seq_num (atomic increment per conv_id)',
      '3. S1 persists to Cassandra (conv_id, seq_num, content, status=sent)',
      '4. S1 delivers directly to B\'s WebSocket connection (same server)',
      '5. B\'s client ACKs delivery → S1 updates status=delivered',
      '6. S1 pushes delivery receipt back to A via WebSocket',
    ],
    deliveryReceiptFlow: 'Sent (1 tick) → stored in DB → Delivered (2 ticks) → B ACKs → Read (blue ticks) → B opens conversation',
  },
  {
    state: 'online_diff_server',
    steps: [
      '1–3. Same as above (persist + assign seq_num)',
      '4. S1 publishes message to Redis channel inbox:userB',
      '5. S2 (B\'s server) subscribed to inbox:userB → receives → pushes to B',
      '6. B ACKs → S2 publishes receipt to Redis channel inbox:userA',
      '7. S1 receives receipt → pushes to A',
    ],
    deliveryReceiptFlow: 'Same receipt flow via Redis pub/sub routing',
  },
  {
    state: 'offline',
    steps: [
      '1–3. Same (persist + assign seq_num, status=sent)',
      '4. S1 checks presence:userB (Redis key) → absent → user is offline',
      '5. S1 sends FCM/APNs push notification to B\'s device tokens',
      '6. B\'s device wakes → connects WebSocket → sends sync { convId, lastSeqNum }',
      '7. Server queries Cassandra for messages WHERE seq_num > lastSeqNum',
      '8. Sends batch to B → B ACKs each → receipts delivered to A',
    ],
    deliveryReceiptFlow: 'Sent (1 tick) only until B reconnects. Then Delivered (2 ticks) on batch ACK.',
  },
];

// E2E Encryption hint (Signal protocol):
// Key exchange: B publishes public key to key server on registration
// A fetches B\'s public key → encrypts message locally → sends ciphertext
// Server stores ciphertext — cannot read content
// B decrypts with private key (never leaves device)
// seq_num still assigned by server (plaintext metadata)`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'Why use Redis pub/sub for routing messages between chat servers?',
    options: [
      'Redis is faster than WebSocket',
      'Any server can publish to a user\'s channel; the server holding that user\'s connection will deliver it',
      'Redis stores message history',
      'Redis provides end-to-end encryption',
    ],
    answer: 1,
    explanation: 'Chat servers are stateful — each user connects to exactly one server. Redis pub/sub allows server-1 (holding sender\'s connection) to publish to a channel, and server-2 (holding recipient\'s connection) to receive and deliver it — without server-to-server discovery.',
  },
  {
    q: 'How do you guarantee message ordering in a chat app?',
    options: [
      'Use timestamps from the client device',
      'Assign a per-conversation monotonically increasing sequence number at the server',
      'Use WebSocket frame ordering',
      'Sort by message ID (UUID)',
    ],
    answer: 1,
    explanation: 'Client timestamps are unreliable (clock drift, device time changes). UUIDs are random, not ordered. The server assigns a sequence number (auto-increment per conversation) — clients sort received messages by seq_num before rendering.',
  },
  {
    q: 'What is the correct approach when a message recipient is offline?',
    options: [
      'Drop the message — they should request it again',
      'Keep retrying the WebSocket delivery until they connect',
      'Persist the message in DB, send a push notification, deliver on reconnect via seq_num sync',
      'Store in Redis until they come online',
    ],
    answer: 2,
    explanation: 'Messages must be persisted first (DB is durable). Then a push notification (FCM/APNs) wakes the app. On reconnect, the client sends its last known seq_num per conversation and the server streams all missed messages.',
  },
  { q: 'Why are WebSockets preferred over HTTP polling for chat applications?', options: ['WebSockets use less CPU than HTTP on the server side', 'WebSockets maintain a persistent bidirectional connection enabling real-time push from server to client without repeated polling', 'HTTP polling is deprecated and no longer supported by browsers', 'WebSockets support larger message payloads than HTTP'], answer: 1, explanation: 'HTTP polling requires the client to repeatedly send requests to check for new messages, adding latency and unnecessary load when there are no messages. WebSockets establish a persistent full-duplex TCP connection over a single handshake, allowing the server to push messages to the client immediately when they arrive with minimal overhead per message. This reduces latency from polling interval to near real-time and eliminates the constant HTTP request overhead. Server-Sent Events (SSE) are an alternative for server-to-client push only when the client does not need to send messages.' },
  { q: 'How do you scale WebSocket connections across multiple server instances?', options: ['WebSockets cannot be scaled horizontally; vertical scaling only', 'Use a sticky session load balancer to keep each client connected to the same server, and a pub/sub layer like Redis for cross-server message delivery', 'Each user must reconnect every time to ensure load distribution', 'Run a single WebSocket server that handles all connections for the entire system'], answer: 1, explanation: 'WebSocket scaling challenge: a client maintains a persistent connection to one server, but messages may need to reach clients connected to other servers. Approach: sticky sessions ensure a client always reconnects to the same server (important for in-memory state). A pub/sub layer like Redis Pub/Sub or Kafka broadcasts messages across servers: when server A receives a message, it publishes to a channel, and all servers subscribed to that channel deliver it to their connected clients. This allows horizontal scaling while maintaining real-time delivery across all servers.' },
  { q: 'How would you design message persistence for a chat system?', options: ['Store messages only in memory for maximum speed and drop them on server restart', 'Persist all messages to a database immediately on send and use the DB as the source of truth for history', 'Store only the last 24 hours of messages to limit storage costs', 'Use eventual consistency and accept that some messages may never be persisted'], answer: 1, explanation: 'Message persistence requires writing each message to a database before or during delivery. Write the message to the DB in the send flow so the server can acknowledge receipt to the sender. For message history retrieval, query the DB with pagination. Choice of DB: Cassandra is popular for chat because it handles time-series data well with partition key on conversation ID and clustering key on timestamp, enabling efficient range scans for history. For at-most-once delivery guarantees, use idempotency keys to deduplicate retried sends.' },
];

const qna: QnaItem[] = [
  {
    q: 'How do you scale WebSocket connections to millions of users?',
    a: 'Each chat server maintains N open WebSocket connections limited by memory and file descriptors (~50k–100k per server on modern hardware). Scale horizontally: add more chat servers. A load balancer with sticky sessions (by user ID) routes each user to the same server. Redis pub/sub provides cross-server message routing. For 1B active users: 1M connections × 1000 servers. Nginx/HAProxy terminate TLS; chat servers handle the WebSocket protocol.',
  },
  {
    q: 'How do you implement read receipts efficiently?',
    a: 'Receipts are events: (1) Sent: server ACKs the message store. (2) Delivered: recipient\'s client ACKs on receiving the message via WebSocket or sync. (3) Read: client fires a "read" event when the user opens the conversation. These events are published back to the sender via the same Redis pub/sub channel. Store the latest read seq_num per (user, conversation) pair — a single row in a receipts table, updated in-place.',
  },
  { q: 'How do you implement online presence indicators (user online/offline/last seen) at scale?', a: 'Presence tracking: each WebSocket connection registers the user as online in a shared store like Redis when connected and removes the entry when disconnected. Use heartbeat messages every 30-60 seconds to detect silent disconnections from clients that lost connectivity without a graceful close. For last seen timestamps, update a user table on disconnect. At scale with millions of users, presence updates are very high frequency. Batch presence updates and use eventual consistency: publish presence changes to a fanout service that notifies only the contacts of the changed user. Avoid broadcasting every user status change to all users globally; scope fanout to the user contact list.' },
  { q: 'How do you ensure message ordering in a distributed chat system?', a: 'Ordering challenges: messages may arrive out of order due to network variability, or two users may send simultaneously causing ambiguous order. Solutions: use server-side sequence numbers assigned by the chat server or database before acknowledgment. Clients display messages in sequence number order rather than receive order. For group chats, a central server assigns sequence numbers per conversation, creating a total ordering. Alternative: use Lamport timestamps or vector clocks to establish causal ordering. At the storage layer, Cassandra clustering keys on timestamp provide per-partition ordering. For real-time delivery, accept approximate ordering and let message history from the DB provide the authoritative order.' },
  { q: 'How do you design push notifications for a chat app when users are offline?', a: 'When a message cannot be delivered via WebSocket because the recipient is offline, queue it for push notification delivery. Flow: check if the recipient has an active WebSocket connection; if not, write the message to the database and enqueue a push notification job. The notification service sends via APNs for iOS and FCM for Android, including a notification payload with sender name and message preview. On reconnect, the client fetches missed messages from the server using the last-seen message ID. Avoid duplicate notifications by checking whether the recipient came online between the queue step and the push send. Respect notification preferences and quiet hours stored in user settings.' },
  { q: 'What database would you choose for storing chat messages and why?', a: 'Cassandra is the most common choice for chat message storage due to its time-series characteristics. Design: partition by conversation_id so all messages for a conversation are co-located, with a clustering key on timestamp for ordered retrieval. Cassandra handles high write throughput and provides fast range scans for message history within a conversation. It scales horizontally without expensive joins. Alternatives: a relational DB works for small scale but sharding becomes complex as message volume grows. DynamoDB with conversation_id as partition key and message_id as sort key provides managed scalability. Avoid storing messages as JSON blobs in a key-value store as this makes efficient history queries difficult.' },
];

const revision: RevisionSummary = {
  oneLiner: 'WebSocket per user; Redis pub/sub routes cross-server; seq_num orders messages; persist first then deliver; push + sync for offline users.',
  mustKnow: [
    'WebSocket: full-duplex persistent connection; essential for real-time chat',
    'Redis pub/sub: routes messages between chat servers without server discovery',
    'Sequence number per conversation: monotonic, assigned server-side, ensures ordering',
    'Offline flow: persist → push notification → reconnect sync by seq_num',
    'Delivery receipts: sent (stored), delivered (device ACK), read (conversation opened)',
    'Group chat fan-out: Kafka topic per group or per-member delivery queues',
  ],
  interviewFocus: [
    'Draw the message flow: A online, B on different server — Redis pub/sub routing',
    'Explain seq_num and why client timestamps fail for ordering',
    'Offline delivery: persist → FCM → reconnect sync — what seq_num enables',
    'How to scale to 1B users: horizontal chat servers + Redis cluster',
  ],
};

@Component({
  selector: 'app-sysdesign-chat-application',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './chat-application.html',
  styleUrl: './chat-application.scss',
})
export class SysdesignChatApplication {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
