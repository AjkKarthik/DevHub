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
  { name: 'Unary RPC',             type: 'keyword', desc: 'Single request → single response. Most common pattern — like a REST call.' },
  { name: 'Server Streaming',      type: 'keyword', desc: 'Single request → stream of responses. Push updates, real-time feeds, large data exports.' },
  { name: 'Client Streaming',      type: 'keyword', desc: 'Stream of requests → single response. Bulk uploads, file chunking.' },
  { name: 'Bidirectional Streaming', type: 'keyword', desc: 'Stream of requests ↔ stream of responses. Chat, telemetry, collaborative editing.' },
  { name: 'Deadline',              type: 'keyword', desc: 'Client-set timeout for the entire RPC call — propagated across service boundaries.' },
  { name: 'Metadata',              type: 'keyword', desc: 'Key-value pairs sent with a call — equivalent to HTTP headers (auth tokens, tracing IDs).' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Unary RPC',
    points: [
      'The simplest pattern: one request message, one response message. `rpc GetUser(GetUserRequest) returns (User);`',
      'Equivalent to a REST API call. Use for standard CRUD operations, lookups, and command/query calls where you need a single result.',
      'Supports deadlines, metadata (equivalent to headers), and cancellation — all propagated transparently across service calls.',
      'Error handling: gRPC uses Status codes (OK, NOT_FOUND, INVALID_ARGUMENT, UNAUTHENTICATED, PERMISSION_DENIED, INTERNAL) — map directly to HTTP status codes when transcoding.',
    ],
  },
  {
    heading: 'Server-Side Streaming RPC',
    points: [
      'One request, a stream of responses. The server sends multiple messages until it closes the stream. `rpc WatchUsers(WatchRequest) returns (stream User);`',
      'Use cases: real-time event feeds, push notifications, large dataset export (avoid loading all rows into memory), log tailing.',
      'The client reads messages from the stream with a for-await loop until the server closes it or an error occurs.',
      'The server can send partial results progressively — the client processes each message as it arrives rather than waiting for the complete response.',
    ],
  },
  {
    heading: 'Client-Side Streaming RPC',
    points: [
      'A stream of request messages, one final response. `rpc ImportUsers(stream CreateUserRequest) returns (ImportResult);`',
      'Use cases: bulk data uploads, chunked file transfer, batch operations where sending individual requests would have too much per-call overhead.',
      'The client sends messages and eventually closes the stream. The server processes all messages and returns a single summary response.',
      'Less common than unary or server streaming. Often replaced by batching in a single unary request.',
    ],
  },
  {
    heading: 'Bidirectional Streaming RPC',
    points: [
      'Both client and server send and receive streams simultaneously. `rpc Chat(stream ChatMessage) returns (stream ChatMessage);`',
      'Use cases: real-time chat, multiplayer game state sync, collaborative document editing, telemetry ingestion with acknowledgements.',
      'The two streams are independent — the server does not need to wait for the client to finish sending to start responding.',
      'Built on HTTP/2 multiplexing — both directions share one connection. Backpressure is handled automatically by the HTTP/2 flow control.',
      'Most complex pattern — only reach for it when truly bidirectional, low-latency, or high-throughput scenarios justify the complexity.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'gRPC Server (Node.js)',
    language: 'typescript',
    code: `import * as grpc from '@grpc/grpc-js';
import { UserServiceService } from './generated/user/v1/user_grpc_pb';

const server = new grpc.Server();

server.addService(UserServiceService, {
  // 1. Unary RPC — request/response
  async getUser(call, callback) {
    const id = call.request.getId();
    const user = await db.users.findById(id);
    if (!user) {
      return callback({
        code: grpc.status.NOT_FOUND,
        message: \`User \${id} not found\`,
      });
    }
    const response = new User();
    response.setId(user.id);
    response.setEmail(user.email);
    callback(null, response);
  },

  // 2. Server streaming — push updates to client
  watchUsers(call) {
    const statusFilter = call.request.getStatusesList();

    // Send initial snapshot
    db.users.findMany({ where: { status: { in: statusFilter } } })
      .then(users => users.forEach(u => {
        const msg = new User(); msg.setId(u.id); msg.setEmail(u.email);
        call.write(msg);
      }));

    // Listen for DB changes and stream them
    const unsubscribe = db.users.watch(statusFilter, (user) => {
      const msg = new User(); msg.setId(user.id);
      call.write(msg);
    });

    // Clean up when client disconnects
    call.on('cancelled', () => unsubscribe());
    call.on('error', () => unsubscribe());
  },

  // 3. Client streaming — receive bulk upload
  importUsers(call, callback) {
    const users: User[] = [];
    call.on('data', (req) => users.push(req));
    call.on('end', async () => {
      const result = await db.users.bulkCreate(users.map(u => ({ email: u.getEmail() })));
      const response = new ImportResult();
      response.setCreatedCount(result.length);
      callback(null, response);
    });
  },

  // 4. Bidirectional streaming — chat
  chat(call) {
    call.on('data', async (message) => {
      // Broadcast to all other connected clients
      const response = new ChatMessage();
      response.setContent(message.getContent());
      response.setSender(message.getSender());
      call.write(response); // echo back + broadcast
    });
    call.on('end', () => call.end());
  },
});

server.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), () => {
  server.start();
});`,
  },
  {
    label: 'gRPC Client Usage',
    language: 'typescript',
    code: `import * as grpc from '@grpc/grpc-js';
import { UserServiceClient } from './generated/user/v1/user_grpc_pb';

const client = new UserServiceClient('localhost:50051', grpc.credentials.createInsecure());

// 1. Unary call with deadline
async function getUser(id: string) {
  const req = new GetUserRequest(); req.setId(id);
  const deadline = new Date(); deadline.setSeconds(deadline.getSeconds() + 5); // 5s deadline

  return new Promise((resolve, reject) => {
    client.getUser(req, { deadline }, (err, res) => {
      if (err) return reject(err);
      resolve(res);
    });
  });
}

// 2. Server streaming — async iteration
async function watchUsers() {
  const req = new WatchUsersRequest();
  req.setStatusesList([UserStatus.USER_STATUS_ACTIVE]);

  const stream = client.watchUsers(req);
  for await (const user of stream) {
    console.log('User update:', user.getEmail());
  }
  // Stream ends when server closes it
}

// 3. Client streaming — bulk upload
async function importUsers(emails: string[]) {
  return new Promise((resolve, reject) => {
    const call = client.importUsers((err, response) => {
      if (err) return reject(err);
      resolve(response.getCreatedCount());
    });

    for (const email of emails) {
      const req = new CreateUserRequest(); req.setEmail(email);
      call.write(req);
    }
    call.end(); // signals "done sending"
  });
}

// Metadata (equivalent to HTTP headers) — auth token, trace ID
const metadata = new grpc.Metadata();
metadata.set('authorization', 'Bearer ' + token);
metadata.set('x-request-id', requestId);
client.getUser(req, metadata, callback);`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Not setting deadlines on gRPC calls',
    wrong: `// No deadline — hangs indefinitely if downstream is slow
client.getUser(req, callback);`,
    right: `const deadline = new Date(Date.now() + 5000); // 5-second deadline
client.getUser(req, { deadline }, callback);`,
    explanation: 'Without a deadline, a gRPC call waits forever if the server is slow or unresponsive. Always set a deadline. Deadlines propagate across service chains — if service A calls B which calls C, A\'s deadline flows to B and C, preventing cascading slow calls.',
  },
  {
    title: 'Using bidirectional streaming when server streaming suffices',
    wrong: `// Client sends one message but service is defined as bidirectional streaming
rpc GetFeed(stream EmptyRequest) returns (stream FeedItem);`,
    right: `// Server streaming is simpler — only the server streams
rpc WatchFeed(WatchFeedRequest) returns (stream FeedItem);`,
    explanation: 'Bidirectional streaming is the most complex pattern. Only use it when you genuinely need concurrent, independent streams in both directions. If the client sends one message and the server streams many, server-streaming is the right pattern.',
  },
  {
    title: 'Ignoring the cancelled/error events on server streaming',
    wrong: `watchOrders(call) {
  const interval = setInterval(() => call.write(getUpdate()), 1000);
  // Never cleans up — interval runs forever after client disconnects
}`,
    right: `watchOrders(call) {
  const interval = setInterval(() => call.write(getUpdate()), 1000);
  call.on('cancelled', () => clearInterval(interval));
  call.on('error',     () => clearInterval(interval));
}`,
    explanation: 'When a client disconnects from a server-streaming call, the server receives a "cancelled" event. Without cleanup, intervals, subscriptions, and database watchers continue running — leaking resources for every disconnected client.',
  },
  {
    title: 'Returning gRPC errors without a status code',
    wrong: `callback(new Error('User not found')); // generic Error — becomes INTERNAL (500)`,
    right: `callback({ code: grpc.status.NOT_FOUND, message: 'User not found' });`,
    explanation: 'Generic Errors become grpc.status.INTERNAL (the equivalent of HTTP 500). Use specific gRPC status codes: NOT_FOUND, INVALID_ARGUMENT, PERMISSION_DENIED, UNAUTHENTICATED, ALREADY_EXISTS, RESOURCE_EXHAUSTED, DEADLINE_EXCEEDED. Clients can handle specific codes differently.',
  },
];

const challenge: Challenge = {
  title: 'gRPC Pattern Identifier',
  language: 'typescript',
  description: `Implement identifyGrpcPattern(proto: string): string that parses a proto rpc definition and returns the pattern name:
- 'rpc Method(Request) returns (Response)' → 'Unary'
- 'rpc Method(stream Request) returns (Response)' → 'Client Streaming'
- 'rpc Method(Request) returns (stream Response)' → 'Server Streaming'
- 'rpc Method(stream Request) returns (stream Response)' → 'Bidirectional Streaming'`,
  hints: [
    'Check if "stream" appears before "returns" (client streaming)',
    'Check if "stream" appears after "returns" (server streaming)',
    'Both = bidirectional; neither = unary',
  ],
  starterCode: `function identifyGrpcPattern(proto: string): string {
  // TODO: identify the gRPC pattern
  return 'Unknown';
}`,
  solution: `function identifyGrpcPattern(proto: string): string {
  const parts = proto.split('returns');
  if (parts.length !== 2) return 'Unknown';
  const [requestPart, responsePart] = parts;
  const clientStream = requestPart.includes('stream');
  const serverStream = responsePart.includes('stream');

  if (clientStream && serverStream) return 'Bidirectional Streaming';
  if (clientStream) return 'Client Streaming';
  if (serverStream) return 'Server Streaming';
  return 'Unary';
}

console.log(identifyGrpcPattern('rpc GetUser(GetUserRequest) returns (User)'));
// Unary
console.log(identifyGrpcPattern('rpc WatchUsers(WatchRequest) returns (stream User)'));
// Server Streaming
console.log(identifyGrpcPattern('rpc Chat(stream ChatMessage) returns (stream ChatMessage)'));
// Bidirectional Streaming`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'Which gRPC pattern is best for a real-time social media feed where the server pushes new posts to connected clients?',
    options: [
      'Unary — client polls for new posts periodically',
      'Client streaming — client sends filter preferences continuously',
      'Server streaming — client sends one subscription request, server streams updates',
      'Bidirectional streaming — both client and server stream simultaneously',
    ],
    answer: 2,
    explanation: 'Server streaming is ideal for push-based feeds: the client sends one subscription request (e.g., "give me posts from these accounts") and the server streams new posts as they arrive. Bidirectional streaming would be used if the client also needed to send messages back while receiving (e.g., sending likes/reactions in real time).',
  },
  {
    q: 'What is a gRPC Deadline and why should every call have one?',
    options: [
      'The maximum message size the server will accept',
      'A client-set timeout that propagates across all downstream service calls in a chain',
      'The server\'s SLA for processing the request',
      'The maximum number of streaming messages allowed',
    ],
    answer: 1,
    explanation: 'A gRPC Deadline is a client-set absolute time by which the call must complete. It propagates automatically across the entire call chain — if service A calls B calls C, all three services know the deadline and can stop work early if it\'s passed. Without deadlines, a slow downstream service causes every upstream service to wait indefinitely.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'When should I use gRPC instead of REST?',
    a: '<strong>Use gRPC when</strong>: you control both client and server; services communicate internally (microservices); you need high throughput or low latency; you want strong typing and generated code; you\'re using streaming (bidirectional, server push). <strong>Use REST when</strong>: building public APIs for third-party developers; the client is a browser without gRPC-Web; human readability (logs, curl testing) matters; simplicity is more important than performance. <strong>Hybrid</strong>: use gRPC for internal microservice-to-microservice calls, REST for external-facing gateway endpoints. Many teams use gRPC internally and transcode to REST at the API gateway layer.',
  },
  {
    q: 'How does gRPC handle errors differently from REST?',
    a: 'gRPC uses a structured Status with a code (enum) and message string. Common codes: OK (0), CANCELLED (1), UNKNOWN (2), INVALID_ARGUMENT (3), NOT_FOUND (5), ALREADY_EXISTS (6), PERMISSION_DENIED (7), UNAUTHENTICATED (16), RESOURCE_EXHAUSTED (8), INTERNAL (13), DEADLINE_EXCEEDED (4). gRPC also supports rich error details (google.rpc.Status with details Any[] for typed error payloads). Unlike HTTP where any body can carry error details, gRPC error details travel in the trailing metadata — client libraries expose them via the Status object, not the response message.',
  },
];

const revision: RevisionSummary = {
  oneLiner: 'gRPC has 4 patterns: Unary (1→1), Server Streaming (1→N), Client Streaming (N→1), Bidirectional (N↔N) — always set deadlines; use specific Status codes for errors.',
  mustKnow: [
    'Unary: rpc Method(Req) returns (Res) — request/response like REST',
    'Server streaming: returns (stream Res) — push updates, large exports',
    'Client streaming: (stream Req) returns (Res) — bulk uploads',
    'Bidirectional: (stream Req) returns (stream Res) — chat, telemetry',
    'Always set deadlines — they propagate across service chains preventing cascades',
    'Use specific Status codes (NOT_FOUND, INVALID_ARGUMENT) not generic Errors',
  ],
  interviewFocus: [
    'What are the 4 gRPC service patterns and when do you use each?',
    'What is a gRPC Deadline and why does it matter for microservices?',
    'When would you choose gRPC over REST for a new service?',
  ],
};

@Component({
  selector: 'app-api-grpc-patterns',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './grpc-service-patterns.html',
  styleUrl: './grpc-service-patterns.scss',
})
export class ApiGrpcPatterns {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
