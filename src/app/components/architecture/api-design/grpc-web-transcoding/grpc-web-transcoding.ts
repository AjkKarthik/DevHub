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
  { name: 'gRPC-Web',        type: 'keyword', desc: 'Browser-compatible gRPC proxy protocol — wraps gRPC over HTTP/1.1 for browser clients.' },
  { name: 'Envoy Proxy',     type: 'keyword', desc: 'The standard gRPC-Web proxy — translates gRPC-Web browser requests to native gRPC.' },
  { name: 'grpc-gateway',    type: 'keyword', desc: 'Go plugin that generates a JSON/REST reverse proxy from .proto google.api.http annotations.' },
  { name: 'Transcoding',     type: 'keyword', desc: 'Mapping gRPC methods to REST/JSON endpoints via google.api.http annotations in .proto files.' },
  { name: 'Connect',         type: 'keyword', desc: 'Modern replacement for gRPC-Web — works natively in browsers without a proxy, supports fetch.' },
  { name: 'google.api.http', type: 'keyword', desc: 'Proto annotation that maps an rpc to an HTTP verb + path for REST transcoding.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Why gRPC Needs Browser Adapters',
    points: [
      'Native gRPC uses HTTP/2 with binary framing that browsers cannot access directly — the Fetch API and XHR do not expose the HTTP/2 trailer frames required by the gRPC protocol.',
      'gRPC-Web is a modified protocol that works over HTTP/1.1 (and HTTP/2) by encoding trailers in the response body, allowing browsers to consume gRPC-like APIs.',
      'A proxy (Envoy, nginx with ngx_http_grpc_module, or grpc-gateway) sits between the browser and the backend, translating gRPC-Web requests to native gRPC upstream.',
      'The alternative: Connect protocol (buf.build/connect) works natively in browsers using fetch — no proxy required. Connect clients are compatible with gRPC servers.',
    ],
  },
  {
    heading: 'gRPC-Web with Envoy',
    points: [
      'Architecture: Browser → (gRPC-Web / HTTP 1.1) → Envoy → (gRPC / HTTP 2) → Backend service.',
      'Envoy configuration: add the `grpc_web` HTTP filter and the upstream gRPC cluster. The filter translates protocols transparently.',
      'gRPC-Web supports unary and server-streaming. Client and bidirectional streaming are NOT supported in gRPC-Web (browser XHR limitations).',
      'Generated gRPC-Web clients use the same .proto files — just a different generator flag: `--grpc-web_out=import_style=typescript,mode=grpcweb:./src`.',
    ],
  },
  {
    heading: 'HTTP Transcoding with grpc-gateway',
    points: [
      'grpc-gateway reads `google.api.http` annotations in .proto files and generates a reverse proxy that exposes gRPC methods as REST/JSON endpoints.',
      'Each rpc gets an HTTP annotation: `option (google.api.http) = { get: "/v1/users/{id}" };` — this maps `GetUser(GetUserRequest{ id })` to `GET /v1/users/{id}`.',
      'The gateway handles JSON ↔ protobuf conversion automatically. Field names are converted from snake_case (proto) to camelCase (JSON).',
      'This lets you run one gRPC server and expose both a gRPC API (for internal services) and a REST/JSON API (for external clients) simultaneously.',
    ],
  },
  {
    heading: 'Connect Protocol',
    points: [
      'Connect (by Buf) is a modern RPC framework that is wire-compatible with gRPC/gRPC-Web but also works natively in browsers via fetch.',
      'Connect servers speak three protocols simultaneously: Connect (simple JSON/binary over HTTP), gRPC, and gRPC-Web — clients pick which to use.',
      'Connect TypeScript clients: `@connectrpc/connect` — works in browsers with fetch, Node.js, and Deno. No proxy required for browser usage.',
      'Connect simplifies the stack: one server handles native gRPC clients (other microservices) AND browser clients (Connect/fetch) without a separate proxy.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'HTTP Transcoding (.proto)',
    language: 'typescript',
    code: `// .proto with google.api.http transcoding annotations
syntax = "proto3";

import "google/api/annotations.proto";

service UserService {
  rpc GetUser(GetUserRequest) returns (User) {
    option (google.api.http) = {
      get: "/v1/users/{id}"
      // Maps: GET /v1/users/42 → GetUser({ id: "42" })
    };
  }

  rpc CreateUser(CreateUserRequest) returns (User) {
    option (google.api.http) = {
      post: "/v1/users"
      body: "*"
      // Maps: POST /v1/users with JSON body → CreateUser(request)
    };
  }

  rpc ListUsers(ListUsersRequest) returns (ListUsersResponse) {
    option (google.api.http) = {
      get: "/v1/users"
      // Query params: ?page_size=20&page_token=xxx
      // Map to ListUsersRequest fields automatically
    };
  }

  rpc UpdateUser(UpdateUserRequest) returns (User) {
    option (google.api.http) = {
      patch: "/v1/users/{user.id}"
      body: "user"
      // PUT/PATCH with specific field path from request
    };
  }

  rpc DeleteUser(DeleteUserRequest) returns (google.protobuf.Empty) {
    option (google.api.http) = {
      delete: "/v1/users/{id}"
    };
  }
}

// grpc-gateway generates a REST proxy from these annotations:
// GET  /v1/users/42   → calls GetUser gRPC with { id: "42" }
// POST /v1/users      → calls CreateUser gRPC with JSON body
// GET  /v1/users      → calls ListUsers gRPC with query params`,
  },
  {
    label: 'Connect Browser Client',
    language: 'typescript',
    code: `// Connect protocol — native browser gRPC without proxy
import { createPromiseClient } from '@connectrpc/connect';
import { createConnectTransport } from '@connectrpc/connect-web';
import { UserService } from './generated/user/v1/user_connect';

// createConnectTransport uses fetch — works in any browser
const transport = createConnectTransport({
  baseUrl: 'https://api.example.com',
  // No proxy needed! Connect speaks JSON over fetch by default
});

const client = createPromiseClient(UserService, transport);

// Unary call — async/await, fully typed
async function getUser(id: string) {
  const user = await client.getUser({ id });
  // user is typed: user.email, user.status, user.tags, etc.
  console.log(user.email);
  return user;
}

// Server streaming — async iteration in the browser
async function watchUsers() {
  const stream = client.watchUsers({ statuses: ['USER_STATUS_ACTIVE'] });
  for await (const user of stream) {
    console.log('Received user update:', user.email);
  }
}

// Error handling — Connect maps gRPC status codes to ConnectError
import { ConnectError, Code } from '@connectrpc/connect';

try {
  const user = await client.getUser({ id: 'invalid' });
} catch (err) {
  if (err instanceof ConnectError) {
    if (err.code === Code.NotFound) {
      console.log('User not found');
    } else if (err.code === Code.Unauthenticated) {
      redirectToLogin();
    }
  }
}`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Trying to use native gRPC directly in the browser',
    wrong: `// Native @grpc/grpc-js does NOT work in browsers
// gRPC uses HTTP/2 trailers that browsers cannot access via fetch/XHR
import { UserServiceClient } from '@grpc/grpc-js';
const client = new UserServiceClient('localhost:50051', credentials);`,
    right: `// Use Connect for browsers (no proxy needed)
import { createPromiseClient } from '@connectrpc/connect';
import { createConnectTransport } from '@connectrpc/connect-web';
const client = createPromiseClient(UserService, createConnectTransport({ baseUrl: '...' }));`,
    explanation: 'Browsers cannot access HTTP/2 trailer frames, which gRPC requires for status codes. Use gRPC-Web (requires Envoy proxy) or Connect (native browser fetch, no proxy) for browser-based gRPC clients.',
  },
  {
    title: 'Expecting client streaming to work with gRPC-Web',
    wrong: `// gRPC-Web does NOT support client streaming or bidirectional streaming
// Only unary and server streaming work in gRPC-Web
rpc UploadFiles(stream FileChunk) returns (UploadResult);
// ↑ Cannot be used from a browser via gRPC-Web`,
    right: `// Option 1: Use Connect protocol (supports all 4 patterns in browsers)
// Option 2: Batch the upload in a single unary call
rpc UploadFiles(UploadFilesRequest) returns (UploadResult);
// where UploadFilesRequest contains repeated FileChunk chunks = 1;`,
    explanation: 'gRPC-Web (the Envoy proxy protocol) only supports unary and server streaming. Client streaming and bidirectional streaming require the full HTTP/2 trailer support that browsers don\'t have. Use Connect protocol for full streaming support in browsers.',
  },
  {
    title: 'Not handling CORS for gRPC-Web or Connect endpoints',
    wrong: `// gRPC-Web requests from the browser are subject to CORS
// Missing CORS configuration causes browser preflight failures`,
    right: `// Envoy CORS filter for gRPC-Web
http_filters:
  - name: envoy.filters.http.cors
  - name: envoy.filters.http.grpc_web
// Or Connect server CORS middleware
app.use(cors({ origin: 'https://app.example.com', exposedHeaders: ['Grpc-Status', 'Grpc-Message'] }))`,
    explanation: 'gRPC-Web and Connect requests from a browser are cross-origin XHR/fetch requests subject to CORS. Configure CORS at the proxy (Envoy) or server level, and make sure to expose gRPC headers (Grpc-Status, Grpc-Message, Grpc-Status-Details-Bin) in CORS exposed headers.',
  },
  {
    title: 'Generating gRPC-Web clients with the wrong mode',
    wrong: `// grpcweb mode generates client that only works with Envoy proxy
protoc --grpc-web_out=import_style=typescript,mode=grpcweb:./src user.proto`,
    right: `// Use Connect (buf generate) for modern browser clients — no proxy
buf generate  # generates @connectrpc/connect compatible clients
# Or use grpcwebtext for base64-encoded text mode if Envoy is available`,
    explanation: 'The grpcweb mode requires an Envoy proxy. The grpcwebtext mode uses base64 encoding and also requires a proxy. For new projects, use Connect (buf generate) which creates fetch-based clients that work directly in browsers without any proxy.',
  },
];

const challenge: Challenge = {
  title: 'gRPC HTTP Annotation Parser',
  language: 'typescript',
  description: `Implement parseHttpAnnotation(annotation: string): { method: string; path: string } that extracts the HTTP method and path from a google.api.http annotation string.
Input examples:
- '{ get: "/v1/users/{id}" }' → { method: 'GET', path: '/v1/users/{id}' }
- '{ post: "/v1/users", body: "*" }' → { method: 'POST', path: '/v1/users' }
- '{ delete: "/v1/users/{id}" }' → { method: 'DELETE', path: '/v1/users/{id}' }
Supported methods: get, post, put, patch, delete`,
  hints: [
    'Use a regex to find the method keyword and its path value',
    'Map the lowercase proto method to uppercase HTTP method',
  ],
  starterCode: `function parseHttpAnnotation(annotation: string): { method: string; path: string } {
  // TODO: parse the annotation
  return { method: '', path: '' };
}`,
  solution: `function parseHttpAnnotation(annotation: string): { method: string; path: string } {
  const methods = ['get', 'post', 'put', 'patch', 'delete'];
  for (const m of methods) {
    const match = annotation.match(new RegExp(\`\${m}:\\s*"([^"]+)"\`));
    if (match) return { method: m.toUpperCase(), path: match[1] };
  }
  return { method: '', path: '' };
}

console.log(parseHttpAnnotation('{ get: "/v1/users/{id}" }'));
// { method: 'GET', path: '/v1/users/{id}' }
console.log(parseHttpAnnotation('{ post: "/v1/users", body: "*" }'));
// { method: 'POST', path: '/v1/users' }`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'Why can\'t browsers use native gRPC without a proxy?',
    options: [
      'gRPC uses a proprietary binary format that browsers cannot decode',
      'Browsers cannot access HTTP/2 trailer frames required by the gRPC protocol',
      'gRPC requires WebSocket connections which browsers handle differently',
      'gRPC uses UDP while browsers only support TCP',
    ],
    answer: 1,
    explanation: 'gRPC encodes status codes and metadata in HTTP/2 trailer frames (sent after the response body). The browser\'s Fetch API and XHR APIs do not expose trailer frames — they can only access response headers (sent before the body). This is why gRPC-Web and Connect exist: they encode trailers in the body or use different mechanisms that work with browser APIs.',
  },
  {
    q: 'What is the main advantage of the Connect protocol over gRPC-Web?',
    options: [
      'Connect is faster than gRPC-Web for large payloads',
      'Connect supports all 4 streaming patterns in browsers without requiring an Envoy proxy',
      'Connect uses smaller protocol buffers than standard gRPC',
      'Connect automatically generates .proto files from REST APIs',
    ],
    answer: 1,
    explanation: 'The main advantage of Connect over gRPC-Web is that it works natively in browsers using the Fetch API — no Envoy proxy required. Connect also supports all 4 streaming patterns (unary, server, client, bidirectional) in browsers, while gRPC-Web only supports unary and server streaming.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'Should I use gRPC-Web, Connect, or REST transcoding for my browser clients?',
    a: '<strong>Connect</strong> (buf.build/connect): recommended for new projects. Works natively in browsers via fetch, supports all streaming patterns, no proxy needed, wire-compatible with gRPC servers. Best developer experience. <strong>gRPC-Web</strong>: use if you already have Envoy in your stack and want to reuse existing gRPC-Web generated clients. Only supports unary + server streaming. Requires Envoy or nginx proxy. <strong>REST transcoding</strong> (grpc-gateway): best for public APIs that must be REST/JSON — third-party clients, mobile apps expecting REST, documentation tooling (Swagger/OpenAPI). One server speaks both gRPC and REST simultaneously.',
  },
  {
    q: 'Can gRPC-gateway expose both gRPC and REST from the same service?',
    a: 'Yes — that\'s exactly what grpc-gateway is designed for. You run your gRPC server normally (port 50051 for gRPC). grpc-gateway generates a reverse proxy (Go binary) that listens on port 8080 for REST/JSON requests and translates them to gRPC calls to your backend. The same .proto service definition drives both. Many teams use this pattern: internal services use gRPC directly (faster, typed); external clients use the REST gateway (familiar, easy to test with curl). The google.api.http annotations in the .proto file define the REST mapping.',
  },
];

const revision: RevisionSummary = {
  oneLiner: 'Browsers cannot use native gRPC — use Connect (fetch-based, no proxy) or gRPC-Web (requires Envoy); HTTP transcoding via grpc-gateway exposes gRPC as REST from the same service.',
  mustKnow: [
    'Browsers cannot access HTTP/2 trailers — native gRPC doesn\'t work in browsers',
    'gRPC-Web: requires Envoy proxy; supports unary + server streaming only',
    'Connect: native browser fetch, no proxy, all 4 streaming patterns, wire-compatible with gRPC',
    'HTTP transcoding: google.api.http annotations map rpc → REST endpoint via grpc-gateway',
    'grpc-gateway generates a Go reverse proxy: gRPC on port 50051, REST on port 8080 from same service',
    'CORS must be configured for browser-based gRPC-Web/Connect requests',
  ],
  interviewFocus: [
    'Why can\'t browsers use native gRPC directly?',
    'What is the difference between gRPC-Web and Connect?',
    'How does HTTP transcoding work with grpc-gateway?',
  ],
};

@Component({
  selector: 'app-api-grpc-web',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './grpc-web-transcoding.html',
  styleUrl: './grpc-web-transcoding.scss',
})
export class ApiGrpcWeb {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
