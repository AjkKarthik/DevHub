import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Topic {
  title: string; description: string; route: string; badge: string; available: boolean; keyPoints: string[];
}

const BADGE_CSS: Record<string, string> = {
  'REST': 'rest', 'gRPC': 'grpc', 'GraphQL': 'graphql',
  'Real-Time': 'realtime', 'Design': 'design', 'Reference': 'reference',
};
const GROUP_ORDER = ['All', 'REST', 'gRPC', 'GraphQL', 'Real-Time', 'Design', 'Reference'];

const ALL_TOPICS: Topic[] = [
  // REST
  { title: 'REST Fundamentals',         route: '/api-design', badge: 'REST', available: false,
    description: 'Six architectural constraints of REST — stateless, uniform interface, cacheable, layered system.',
    keyPoints: ['Stateless: every request carries full context', 'Uniform interface: resources identified by URI, manipulated via representations', 'HATEOAS: responses include links to next valid actions'] },
  { title: 'Resource & URL Design',     route: '/api-design', badge: 'REST', available: false,
    description: 'Naming conventions, plural nouns, nested resources, filtering, sorting, and pagination patterns.',
    keyPoints: ['Nouns for resources, verbs for HTTP methods', 'GET /orders?status=pending&page=2&limit=20', 'Avoid deep nesting (/users/1/orders/2/items/3 is too deep)'] },
  { title: 'HTTP Methods & Status Codes', route: '/api-design', badge: 'REST', available: false,
    description: 'GET/POST/PUT/PATCH/DELETE semantics, idempotency, safe methods, and the right status code per scenario.',
    keyPoints: ['GET/PUT/DELETE are idempotent; POST is not', '201 Created + Location header for successful POST', '422 Unprocessable Entity for validation errors (over 400)'] },
  { title: 'Pagination Patterns',       route: '/api-design', badge: 'REST', available: false,
    description: 'Offset, cursor, and keyset pagination — trade-offs for large datasets and real-time data.',
    keyPoints: ['Offset pagination: easy but inconsistent with inserts/deletes', 'Cursor pagination: stable for real-time feeds', 'Keyset: fastest for deep page navigation on indexed columns'] },
  { title: 'API Versioning Strategies', route: '/api-design', badge: 'REST', available: false,
    description: 'URL segment, header, query string, and content negotiation versioning — trade-offs and migration paths.',
    keyPoints: ['URL segment (/v1/) is the most discoverable', 'Header versioning keeps URLs clean but less cacheable', 'Deprecation strategy: sunset header + 12-month grace period'] },
  { title: 'Error Response Design',     route: '/api-design', badge: 'REST', available: false,
    description: 'RFC 9457 Problem Details format, consistent error schemas, and validation error response conventions.',
    keyPoints: ['application/problem+json: type, title, status, detail, instance', 'Validation errors: errors array with field-level messages', 'Never expose internal stack traces or SQL errors'] },
  { title: 'HATEOAS & Hypermedia',      route: '/api-design', badge: 'REST', available: false,
    description: 'Hypermedia as the Engine of Application State — self-describing APIs with embedded navigation links.',
    keyPoints: ['_links in the response carry allowed next actions', 'Clients can discover API capabilities without out-of-band docs', 'HAL, Siren, JSON:API are HATEOAS media type standards'] },

  // gRPC
  { title: 'Protocol Buffers',          route: '/api-design', badge: 'gRPC', available: false,
    description: 'Define services and messages in .proto files — the schema language behind gRPC.',
    keyPoints: ['Strong typing and backward compatibility with field numbers', 'Generated server stubs and client code in any language', 'Smaller and faster than JSON for structured data'] },
  { title: 'gRPC Service Patterns',     route: '/api-design', badge: 'gRPC', available: false,
    description: 'Unary, server streaming, client streaming, and bidirectional streaming — when to use each.',
    keyPoints: ['Unary: request-response (most common)', 'Server streaming: real-time feed to client', 'Bidirectional: chat, telemetry, collaborative editing'] },
  { title: 'gRPC-Web & Transcoding',    route: '/api-design', badge: 'gRPC', available: false,
    description: 'Using gRPC from browsers with gRPC-Web, and HTTP/JSON transcoding via the HTTP API descriptor.',
    keyPoints: ['gRPC-Web proxies over HTTP/1.1 for browser compatibility', 'google.api.http annotations transcode to JSON/REST', 'Envoy or grpc-gateway handles transcoding'] },

  // GraphQL
  { title: 'GraphQL Fundamentals',      route: '/api-design', badge: 'GraphQL', available: false,
    description: 'Schema Definition Language, queries, mutations, subscriptions, and the N+1 problem.',
    keyPoints: ['Query: fetch; Mutation: change; Subscription: real-time', 'SDL defines types, fields, and resolvers', 'DataLoader batches and caches resolver calls to fix N+1'] },
  { title: 'GraphQL vs REST',           route: '/api-design', badge: 'GraphQL', available: false,
    description: 'When GraphQL wins (flexible clients, BFF aggregation) and when REST wins (caching, simplicity).',
    keyPoints: ['GraphQL: no over-fetching/under-fetching; flexible per-client queries', 'REST: HTTP caching, simpler tooling, easier firewall rules', 'Hybrid: GraphQL facade over REST/gRPC microservices'] },

  // Real-Time
  { title: 'WebSockets vs SSE vs Polling', route: '/api-design', badge: 'Real-Time', available: false,
    description: 'Choosing the right real-time transport — full duplex, server push, or long polling.',
    keyPoints: ['WebSockets: full-duplex, binary, low overhead — best for chat/gaming', 'SSE: server-push over HTTP/1.1, auto-reconnect, EventSource API', 'Long polling: works everywhere but wastes connections'] },
  { title: 'Webhook Design',            route: '/api-design', badge: 'Real-Time', available: false,
    description: 'Outbound HTTP callbacks from your API to consumer endpoints — delivery guarantees and security.',
    keyPoints: ['HMAC signature in header for payload verification', 'Retry with exponential backoff on non-2xx responses', 'Idempotency key prevents duplicate processing on retries'] },

  // Design
  { title: 'API Design Principles',     route: '/api-design', badge: 'Design', available: false,
    description: 'Consumer-first, evolvable, secure-by-default — principles behind great API design.',
    keyPoints: ['Design for the client, not for the implementation', 'Postel\'s Law: be conservative in what you send, liberal in what you accept', 'API surface is forever — deprecating is painful'] },
  { title: 'OpenAPI & API Contracts',   route: '/api-design', badge: 'Design', available: false,
    description: 'OpenAPI 3.1 spec, design-first workflow, contract testing, and generating typed clients.',
    keyPoints: ['Design-first: write the spec before writing code', 'Contract testing: Pact, Dredd validate spec vs implementation', 'NSwag, Kiota generate strongly-typed clients from OpenAPI'] },
  { title: 'API Security',              route: '/api-design', badge: 'Design', available: false,
    description: 'Authentication (API keys, OAuth 2.0, JWT), authorisation, rate limiting, and OWASP API Security Top 10.',
    keyPoints: ['Never roll your own auth — use OAuth 2.0 + OIDC', 'Scope claims for fine-grained API authorisation', 'OWASP API Top 10: broken object-level auth is #1'] },
  { title: 'Breaking vs Non-Breaking Changes', route: '/api-design', badge: 'Design', available: false,
    description: 'What changes are safe, what require versioning, and how to communicate API changes to consumers.',
    keyPoints: ['Adding optional fields/endpoints is non-breaking', 'Removing or renaming fields is breaking', 'Sunset header + changelog communicate upcoming deprecations'] },
  { title: 'API Rate Limiting & Throttling', route: '/api-design', badge: 'Design', available: false,
    description: 'Token bucket, sliding window, leaky bucket algorithms — plus retry-after headers and back-pressure.',
    keyPoints: ['429 Too Many Requests with Retry-After header', 'Per-user or per-API-key limits, not just global', 'Quota vs rate limit: daily quota vs per-second burst'] },

  // Reference
  { title: 'API Design Cheat Sheet',    route: '/api-design', badge: 'Reference', available: false,
    description: 'Quick-reference for HTTP methods, status codes, URL patterns, headers, and versioning.',
    keyPoints: ['HTTP method semantics at a glance', 'Status code reference: 2xx/3xx/4xx/5xx', 'Common request/response headers'] },
  { title: 'API Interview Prep',        route: '/api-design', badge: 'Reference', available: false,
    description: '30+ API design interview questions — REST constraints, status codes, versioning, GraphQL trade-offs.',
    keyPoints: ['Entry: status codes, HTTP methods, REST principles', 'Mid: versioning, pagination, error design', 'Senior: hypermedia, GraphQL vs REST, API evolution'] },
];

@Component({
  selector: 'app-api-design-home',
  standalone: true, imports: [RouterLink],
  templateUrl: './home.html', styleUrl: './home.scss',
})
export class ApiDesignHome {
  activeFilter = signal('All');
  expandedCard = signal<string | null>(null);
  topics = computed(() => { const f = this.activeFilter(); return f === 'All' ? ALL_TOPICS : ALL_TOPICS.filter(t => t.badge === f); });
  filters = GROUP_ORDER;
  counts = computed(() => { const map: Record<string, number> = { All: ALL_TOPICS.length }; for (const t of ALL_TOPICS) map[t.badge] = (map[t.badge] ?? 0) + 1; return map; });
  availableCount = ALL_TOPICS.filter(t => t.available).length;
  totalCount = ALL_TOPICS.length;
  setFilter(f: string) { this.activeFilter.set(f); }
  badgeCss(badge: string) { return 'badge badge-' + (BADGE_CSS[badge] ?? 'rest'); }
  toggleCard(key: string, event: Event) { event.preventDefault(); this.expandedCard.update(c => c === key ? null : key); }
}
