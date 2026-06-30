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
  { q: 'What is gRPC-Web and how does it differ from standard gRPC?', options: ['gRPC-Web is gRPC running over WebSockets instead of HTTP/2', 'gRPC-Web is a modified protocol that runs over HTTP/1.1 and is usable from browser JavaScript, unlike standard gRPC which requires HTTP/2 trailers that browsers do not support', 'gRPC-Web is a REST translation layer built into the gRPC framework', 'gRPC-Web adds encryption to standard gRPC connections'], answer: 1, explanation: 'Browser gRPC limitation: standard gRPC uses HTTP/2 trailers (the final headers sent at the end of an HTTP/2 stream). Browsers do not expose HTTP/2 trailers to JavaScript, so native gRPC is not usable from browsers. gRPC-Web: a variant of gRPC that encodes trailers in the response body using a special frame format. Works over HTTP/1.1. A proxy (Envoy, grpc-web-proxy) converts gRPC-Web requests to standard gRPC requests. Limitations: does not support client streaming or bidirectional streaming (only unary and server streaming). All streaming is buffered before delivery in some implementations. gRPC-Web vs gRPC: gRPC-Web has higher overhead per request due to HTTP/1.1 connection limits and the encoding format. Connect Protocol is an alternative that is both REST-compatible and gRPC-compatible from browsers.' },
  { q: 'What is the Connect Protocol and how does it improve on gRPC-Web?', options: ['Connect is a competing API style from Meta that uses Thrift instead of Protocol Buffers', 'Connect Protocol is a simpler gRPC-compatible protocol by Buf that works with standard HTTP/1.1 and HTTP/2; unlike gRPC-Web it supports all stream types and works with standard HTTP clients without a proxy', 'Connect Protocol is a middleware for adding HTTP/2 support to existing gRPC-Web servers', 'Connect Protocol converts gRPC services to GraphQL schemas automatically'], answer: 1, explanation: 'Connect Protocol (buf.build): an HTTP protocol that is fully compatible with gRPC and gRPC-Web. Designed to be simple and work without a proxy. Supports unary, server streaming, client streaming, and bidirectional streaming from the browser. Works with standard HTTP clients: a Connect unary request looks like a regular HTTP POST with JSON or binary body. Any HTTP client can call it (curl, fetch). Content negotiation: clients set Content-Type to application/proto or application/json. JSON encoding allows human-readable debugging. gRPC compatibility: the Connect server handles standard gRPC requests from non-browser clients simultaneously on the same port. Advantage: eliminates the need for an Envoy transcoding proxy for browser clients. Simpler deployment.' },
  { q: 'What is Envoy proxy transcoding and how does it translate gRPC to REST?', options: ['Envoy replaces gRPC with REST by converting the service definition to OpenAPI', 'Envoy gRPC-JSON transcoding reads google.api.http annotations in .proto files and translates incoming REST/JSON requests to gRPC calls, forwarding them to the backend gRPC service', 'Envoy transcoding caches gRPC responses and serves them as REST to reduce load on the gRPC service', 'Envoy transcoding requires a separate gRPC gateway service; Envoy only handles routing'], answer: 1, explanation: 'Envoy gRPC-JSON transcoding: the .proto service definition is annotated with HTTP bindings using google.api.http options. Envoy is configured with the transcoder filter and the .proto descriptor. Incoming REST request: GET /v1/users/123. Envoy transforms this to a gRPC GetUser call with request { id: 123 }. The gRPC response is serialized to JSON and returned. Benefits: one implementation (gRPC service) serves both gRPC clients and REST clients. No code changes to the backend. The gRPC service does not need to handle JSON serialization. Used by Google Cloud APIs (Cloud Endpoints, Apigee). Limitations: the HTTP binding configuration in .proto files couples HTTP concerns to the service definition. Not all gRPC features have clean REST equivalents (streaming).' },
  { q: 'How does gRPC streaming compare to WebSockets and Server-Sent Events?', options: ['gRPC streaming is HTTP/2 only; WebSockets and SSE work with HTTP/1.1; they serve completely different use cases with no overlap', 'gRPC streaming is bidirectional and uses HTTP/2 multiplexing; WebSockets are bidirectional over a persistent TCP connection; SSE is one-directional (server to client) over HTTP; all three enable real-time communication with different protocol tradeoffs', 'WebSockets and SSE are deprecated in favor of gRPC streaming in modern architectures', 'gRPC streaming requires Protocol Buffers; WebSockets and SSE can only use JSON'], answer: 1, explanation: 'Comparison: gRPC bidirectional streaming: binary (Protocol Buffers), HTTP/2 multiplexed, strongly typed schema, code-generated clients. Best for service-to-service real-time communication with type safety. WebSockets: full-duplex TCP persistent connection. Works over HTTP/1.1 upgrade. No schema enforcement. Application-defined message format (JSON common). Best for browser real-time features where gRPC-Web limitations apply and message format flexibility is needed. Server-Sent Events (SSE): HTTP/1.1 or HTTP/2, one-directional (server pushes). Automatic reconnection built into the browser. Simple text format. Best for read-only live updates (news feed, metrics dashboard, log streaming) from browsers. gRPC streaming is not suitable for browser clients (use gRPC-Web, Connect, or WebSocket instead).' },
  { q: 'What is gRPC-Web and how does it differ from standard gRPC?', options: ['gRPC-Web is gRPC running over WebSockets instead of HTTP/2', 'gRPC-Web is a modified protocol that runs over HTTP/1.1 and is usable from browser JavaScript, unlike standard gRPC which requires HTTP/2 trailers that browsers do not support', 'gRPC-Web is a REST translation layer built into the gRPC framework', 'gRPC-Web adds encryption to standard gRPC connections'], answer: 1, explanation: 'Browser gRPC limitation: standard gRPC uses HTTP/2 trailers (the final headers sent at the end of an HTTP/2 stream). Browsers do not expose HTTP/2 trailers to JavaScript, so native gRPC is not usable from browsers. gRPC-Web: a variant of gRPC that encodes trailers in the response body using a special frame format. Works over HTTP/1.1. A proxy (Envoy, grpc-web-proxy) converts gRPC-Web requests to standard gRPC requests. Limitations: does not support client streaming or bidirectional streaming (only unary and server streaming). All streaming is buffered before delivery in some implementations. gRPC-Web vs gRPC: gRPC-Web has higher overhead per request due to HTTP/1.1 connection limits and the encoding format. Connect Protocol is an alternative that is both REST-compatible and gRPC-compatible from browsers.' },
  { q: 'What is the Connect Protocol and how does it improve on gRPC-Web?', options: ['Connect is a competing API style from Meta that uses Thrift instead of Protocol Buffers', 'Connect Protocol is a simpler gRPC-compatible protocol by Buf that works with standard HTTP/1.1 and HTTP/2; unlike gRPC-Web it supports all stream types and works with standard HTTP clients without a proxy', 'Connect Protocol is a middleware for adding HTTP/2 support to existing gRPC-Web servers', 'Connect Protocol converts gRPC services to GraphQL schemas automatically'], answer: 1, explanation: 'Connect Protocol (buf.build): an HTTP protocol that is fully compatible with gRPC and gRPC-Web. Designed to be simple and work without a proxy. Supports unary, server streaming, client streaming, and bidirectional streaming from the browser. Works with standard HTTP clients: a Connect unary request looks like a regular HTTP POST with JSON or binary body. Any HTTP client can call it (curl, fetch). Content negotiation: clients set Content-Type to application/proto or application/json. JSON encoding allows human-readable debugging. gRPC compatibility: the Connect server handles standard gRPC requests from non-browser clients simultaneously on the same port. Advantage: eliminates the need for an Envoy transcoding proxy for browser clients. Simpler deployment.' },
  { q: 'What is Envoy proxy transcoding and how does it translate gRPC to REST?', options: ['Envoy replaces gRPC with REST by converting the service definition to OpenAPI', 'Envoy gRPC-JSON transcoding reads google.api.http annotations in .proto files and translates incoming REST/JSON requests to gRPC calls, forwarding them to the backend gRPC service', 'Envoy transcoding caches gRPC responses and serves them as REST to reduce load on the gRPC service', 'Envoy transcoding requires a separate gRPC gateway service; Envoy only handles routing'], answer: 1, explanation: 'Envoy gRPC-JSON transcoding: the .proto service definition is annotated with HTTP bindings using google.api.http options. Envoy is configured with the transcoder filter and the .proto descriptor. Incoming REST request: GET /v1/users/123. Envoy transforms this to a gRPC GetUser call with request { id: 123 }. The gRPC response is serialized to JSON and returned. Benefits: one implementation (gRPC service) serves both gRPC clients and REST clients. No code changes to the backend. The gRPC service does not need to handle JSON serialization. Used by Google Cloud APIs (Cloud Endpoints, Apigee). Limitations: the HTTP binding configuration in .proto files couples HTTP concerns to the service definition. Not all gRPC features have clean REST equivalents (streaming).' },
  { q: 'How does gRPC streaming compare to WebSockets and Server-Sent Events?', options: ['gRPC streaming is HTTP/2 only; WebSockets and SSE work with HTTP/1.1; they serve completely different use cases with no overlap', 'gRPC streaming is bidirectional and uses HTTP/2 multiplexing; WebSockets are bidirectional over a persistent TCP connection; SSE is one-directional (server to client) over HTTP; all three enable real-time communication with different protocol tradeoffs', 'WebSockets and SSE are deprecated in favor of gRPC streaming in modern architectures', 'gRPC streaming requires Protocol Buffers; WebSockets and SSE can only use JSON'], answer: 1, explanation: 'Comparison: gRPC bidirectional streaming: binary (Protocol Buffers), HTTP/2 multiplexed, strongly typed schema, code-generated clients. Best for service-to-service real-time communication with type safety. WebSockets: full-duplex TCP persistent connection. Works over HTTP/1.1 upgrade. No schema enforcement. Application-defined message format (JSON common). Best for browser real-time features where gRPC-Web limitations apply and message format flexibility is needed. Server-Sent Events (SSE): HTTP/1.1 or HTTP/2, one-directional (server pushes). Automatic reconnection built into the browser. Simple text format. Best for read-only live updates (news feed, metrics dashboard, log streaming) from browsers. gRPC streaming is not suitable for browser clients (use gRPC-Web, Connect, or WebSocket instead).' },
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
  { q: 'What are the deployment considerations for gRPC-Web in a Kubernetes environment?', a: 'gRPC-Web Kubernetes deployment: Envoy sidecar or gateway: deploy Envoy as a sidecar or gateway that handles gRPC-Web transcoding. The application pod only runs the gRPC server. Envoy handles the protocol translation. Ingress: most Kubernetes ingress controllers (NGINX, Traefik) do not support HTTP/2 trailers end-to-end. Use an Envoy-based ingress (Contour, Istio Ingress Gateway) or configure the NGINX ingress with grpc_pass support. TLS termination: gRPC requires TLS in most configurations. The Ingress terminates TLS. Envoy can communicate with backend pods over mTLS (service mesh) or plaintext. Health checks: Kubernetes health checks use HTTP. Expose a health endpoint separately from gRPC, or use grpc_health_v1.Health/Check with a gRPC-aware health check probe (Kubernetes 1.24+ supports gRPC liveness/readiness probes natively).' },
  { q: 'What are the browser CORS considerations for gRPC-Web and Connect?', a: 'Browser CORS for gRPC-Web: gRPC-Web requests from a browser are cross-origin XHR requests (unless the API is served from the same origin). The proxy must include CORS headers: Access-Control-Allow-Origin. Access-Control-Allow-Methods: POST (gRPC-Web always uses POST). Access-Control-Allow-Headers: content-type, x-grpc-web, x-user-agent (gRPC-Web specific headers). Access-Control-Expose-Headers: grpc-status, grpc-message (response headers that gRPC-Web uses). Preflight: browsers send OPTIONS preflight for cross-origin requests. The proxy must handle OPTIONS correctly. Envoy grpc-web filter handles CORS automatically when configured. Connect Protocol CORS: Connect unary requests use standard HTTP POST with standard Content-Type. Standard CORS configuration works. No special headers needed beyond the standard API CORS policy.' },
  { q: 'How do you generate TypeScript gRPC-Web client code from .proto files?', a: 'TypeScript code generation from .proto files: protoc plugins: protoc-gen-js (JavaScript message classes). protoc-gen-grpc-web (gRPC-Web client stubs). buf.build toolchain (recommended modern approach): buf generate uses a buf.gen.yaml configuration. Specifies which plugins to use (ts-proto, protoc-gen-grpc-web). Generates TypeScript interfaces and client classes. Generated code: message classes with serialization/deserialization. Type-safe service client stubs. Enum types. Build integration: add proto compilation as a build step. Check generated code into source control or regenerate on each build. ts-proto (preferred): generates plain TypeScript interfaces instead of class-based code. Better TypeScript compatibility. Works with both gRPC-Web and Connect Protocol. Types are tree-shakeable and compatible with modern bundlers.' },
  { q: 'What is the buf schema registry and how does it help with gRPC API management?', a: 'Buf Schema Registry (BSR): a managed registry for Protocol Buffer schemas. Features: central repository for .proto files, accessible by teams and tooling. Module versioning: pin to specific schema versions in your buf.yaml. Breaking change detection: buf breaking command compares schemas to detect field number changes, type changes, and other breaking changes. Can be enforced in CI. Lint enforcement: buf lint enforces naming conventions and proto style guide. Remote plugins: run protoc plugins in the cloud without local installation. Dependency management: depend on published modules (like npm for protobufs). Google Common Protos, gRPC Health, and OpenAPI annotations are published to BSR. Documentation: auto-generated API documentation from .proto comments. Team collaboration: different teams can publish and consume schemas independently. Integration: generated SDKs for multiple languages can be published alongside the schemas.' },
  { q: 'What are the deployment considerations for gRPC-Web in a Kubernetes environment?', a: 'gRPC-Web Kubernetes deployment: Envoy sidecar or gateway: deploy Envoy as a sidecar or gateway that handles gRPC-Web transcoding. The application pod only runs the gRPC server. Envoy handles the protocol translation. Ingress: most Kubernetes ingress controllers (NGINX, Traefik) do not support HTTP/2 trailers end-to-end. Use an Envoy-based ingress (Contour, Istio Ingress Gateway) or configure the NGINX ingress with grpc_pass support. TLS termination: gRPC requires TLS in most configurations. The Ingress terminates TLS. Envoy can communicate with backend pods over mTLS (service mesh) or plaintext. Health checks: Kubernetes health checks use HTTP. Expose a health endpoint separately from gRPC, or use grpc_health_v1.Health/Check with a gRPC-aware health check probe (Kubernetes 1.24+ supports gRPC liveness/readiness probes natively).' },
  { q: 'What are the browser CORS considerations for gRPC-Web and Connect?', a: 'Browser CORS for gRPC-Web: gRPC-Web requests from a browser are cross-origin XHR requests (unless the API is served from the same origin). The proxy must include CORS headers: Access-Control-Allow-Origin. Access-Control-Allow-Methods: POST (gRPC-Web always uses POST). Access-Control-Allow-Headers: content-type, x-grpc-web, x-user-agent (gRPC-Web specific headers). Access-Control-Expose-Headers: grpc-status, grpc-message (response headers that gRPC-Web uses). Preflight: browsers send OPTIONS preflight for cross-origin requests. The proxy must handle OPTIONS correctly. Envoy grpc-web filter handles CORS automatically when configured. Connect Protocol CORS: Connect unary requests use standard HTTP POST with standard Content-Type. Standard CORS configuration works. No special headers needed beyond the standard API CORS policy.' },
  { q: 'How do you generate TypeScript gRPC-Web client code from .proto files?', a: 'TypeScript code generation from .proto files: protoc plugins: protoc-gen-js (JavaScript message classes). protoc-gen-grpc-web (gRPC-Web client stubs). buf.build toolchain (recommended modern approach): buf generate uses a buf.gen.yaml configuration. Specifies which plugins to use (ts-proto, protoc-gen-grpc-web). Generates TypeScript interfaces and client classes. Generated code: message classes with serialization/deserialization. Type-safe service client stubs. Enum types. Build integration: add proto compilation as a build step. Check generated code into source control or regenerate on each build. ts-proto (preferred): generates plain TypeScript interfaces instead of class-based code. Better TypeScript compatibility. Works with both gRPC-Web and Connect Protocol. Types are tree-shakeable and compatible with modern bundlers.' },
  { q: 'What is the buf schema registry and how does it help with gRPC API management?', a: 'Buf Schema Registry (BSR): a managed registry for Protocol Buffer schemas. Features: central repository for .proto files, accessible by teams and tooling. Module versioning: pin to specific schema versions in your buf.yaml. Breaking change detection: buf breaking command compares schemas to detect field number changes, type changes, and other breaking changes. Can be enforced in CI. Lint enforcement: buf lint enforces naming conventions and proto style guide. Remote plugins: run protoc plugins in the cloud without local installation. Dependency management: depend on published modules (like npm for protobufs). Google Common Protos, gRPC Health, and OpenAPI annotations are published to BSR. Documentation: auto-generated API documentation from .proto comments. Team collaboration: different teams can publish and consume schemas independently. Integration: generated SDKs for multiple languages can be published alongside the schemas.' },
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
