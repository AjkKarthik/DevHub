import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Question {
  id: string;
  difficulty: 'junior' | 'mid' | 'senior';
  topic: string;
  q: string;
  a: string;
}

const QUESTIONS: Question[] = [
  // Junior
  {
    id: 'q1', difficulty: 'junior', topic: 'REST',
    q: 'What does REST stand for and what are its core constraints?',
    a: 'REST stands for Representational State Transfer. Core constraints: (1) Client-Server — separation of concerns; (2) Stateless — each request contains all needed info, no session stored server-side; (3) Cacheable — responses must declare cacheability; (4) Uniform Interface — consistent resource identification, manipulation via representations, self-descriptive messages, HATEOAS; (5) Layered System — intermediaries (caches, load balancers) transparent to client; (6) Code on Demand (optional) — server can send executable code.',
  },
  {
    id: 'q2', difficulty: 'junior', topic: 'HTTP',
    q: 'What is the difference between PUT and PATCH?',
    a: 'PUT performs a full replacement of the resource — the request body must contain the complete resource; any missing fields are cleared or set to defaults. PUT is idempotent: calling it multiple times with the same body results in the same state. PATCH performs a partial update — only the fields in the request body are changed; other fields remain as-is. PATCH is not inherently idempotent (though it can be designed to be). Best practice: use JSON Merge Patch (RFC 7396) or JSON Patch (RFC 6902) formats for PATCH bodies.',
  },
  {
    id: 'q3', difficulty: 'junior', topic: 'HTTP',
    q: 'When should you use 401 vs 403?',
    a: '401 Unauthorized means the request lacks valid authentication credentials — the user is not identified. The client should authenticate (or re-authenticate) and retry. Include a WWW-Authenticate header. 403 Forbidden means the user IS authenticated but does not have permission to access this resource. Re-authenticating will not help. The user\'s identity is known but they lack the required role or permission. Memory aid: 401 = "I don\'t know who you are"; 403 = "I know who you are, but you can\'t do this."',
  },
  {
    id: 'q4', difficulty: 'junior', topic: 'REST',
    q: 'What is idempotency in the context of HTTP methods?',
    a: 'An operation is idempotent if performing it multiple times produces the same result as performing it once. Idempotent HTTP methods: GET (no state change), HEAD (same), PUT (full replace → same result every time), DELETE (first call deletes; subsequent calls → 404 or 204, but the server state is the same — resource is deleted). Not idempotent: POST (creates a new resource each time). Idempotency matters for retry safety: network failures mean requests are retried — idempotent methods are safe to retry without side effects.',
  },
  {
    id: 'q5', difficulty: 'junior', topic: 'Status Codes',
    q: 'What status code do you return when creating a resource? What header should accompany it?',
    a: '201 Created. Include a Location header pointing to the URL of the newly created resource: Location: /orders/42. The response body should contain the created resource with its server-assigned ID and timestamps. Never return 200 OK for a resource creation — 201 explicitly communicates that a new resource was created.',
  },

  // Mid
  {
    id: 'q6', difficulty: 'mid', topic: 'Pagination',
    q: 'What is cursor-based pagination and when would you use it over offset-based?',
    a: 'Cursor-based pagination uses an opaque pointer (cursor) to a position in the dataset instead of a numeric offset. The server returns nextCursor with each page; the client sends ?cursor=<token> to get the next page. Advantages over offset: (1) Stable — inserts or deletes between pages don\'t cause skipped/duplicated items; (2) Efficient at scale — no OFFSET n SQL scan; uses indexed cursor comparison (WHERE id > last_id). Use cursor-based for: feeds, real-time data, large datasets, infinite scroll. Use offset-based when: users need to jump to page N directly (admin tables, report exports), or data is infrequently mutated.',
  },
  {
    id: 'q7', difficulty: 'mid', topic: 'Versioning',
    q: 'What are the tradeoffs between URL versioning (/v1/orders) and header versioning (API-Version: 2024-01-15)?',
    a: 'URL versioning (/v1/orders): explicit and discoverable — the version is visible in the URL, easy to test in a browser, simple to route at the API gateway level. Downside: "unclean" URLs; changing the version requires updating all client bookmarks/SDKs. Header versioning (API-Version: header): cleaner URLs; the resource URL never changes; clients opt into new versions per-request. Downside: harder to test in browser, easier to miss in client code, less discoverable. Date-based headers (Stripe: "2024-01-15") are more expressive than numeric versions. In practice, most teams use URL versioning for its simplicity; sophisticated APIs (Stripe, GitHub) use header versioning. The most important thing is picking one and being consistent.',
  },
  {
    id: 'q8', difficulty: 'mid', topic: 'Security',
    q: 'How do you prevent mass assignment vulnerabilities in an API?',
    a: 'Mass assignment happens when you directly bind the request body to a database model — a consumer can set fields you did not intend (isAdmin: true, balance: 999999). Prevention: (1) Explicit allowlist — only extract the specific fields you want: const { name, email } = req.body; (2) Schema validation with Zod/Joi — the schema defines which fields are accepted; unknown fields are stripped; (3) DTO pattern (OOP) — a separate Data Transfer Object class with only the allowed fields; (4) ORM protection — Sequelize allowlist (fields: [\'name\', \'email\']), TypeORM whitelist. Never pass req.body directly to a DB create/update call.',
  },
  {
    id: 'q9', difficulty: 'mid', topic: 'Rate Limiting',
    q: 'Explain the token bucket algorithm. How does it differ from fixed window rate limiting?',
    a: 'Token bucket: the server maintains a bucket with a maximum capacity (e.g., 60 tokens). Tokens are added at a fixed refill rate (e.g., 1 token/second). Each request consumes one token. If the bucket is empty, the request is rejected (429). If tokens have accumulated, the client can burst up to the bucket capacity. This naturally handles bursty traffic — a client that has been idle can make 60 requests immediately, then is throttled to 1/second. Fixed window: counts requests in a fixed time slot (e.g., 0:00–1:00). At the boundary, a client can make 100 requests at 0:59 and another 100 at 1:00 — a 200-request burst in 2 seconds. Token bucket prevents this; sliding window is another alternative that also prevents boundary bursts.',
  },
  {
    id: 'q10', difficulty: 'mid', topic: 'Webhooks',
    q: 'Why must webhook consumers be idempotent and how do you implement it?',
    a: 'Webhooks are delivered "at least once" — network failures and timeouts cause the sender to retry the same event. Without idempotency, retried deliveries cause duplicate processing (e.g., charging a user twice). Implementation: (1) Each event has a unique UUID event.id as the idempotency key; (2) Before processing, check if event.id exists in a processed_events table; (3) If found, skip and return 200 (it was already handled); (4) If not found, insert event.id first, then process; (5) Return 200 immediately before heavy processing — use async queue for the work. The insert-before-process pattern prevents double-processing if your handler crashes after partial work.',
  },

  // Senior
  {
    id: 'q11', difficulty: 'senior', topic: 'GraphQL',
    q: 'What is the N+1 problem in GraphQL and how do you solve it?',
    a: 'N+1: a GraphQL query for a list of N users also requests their orders. The naive resolver fetches users (1 query), then fires one query per user to get their orders (N queries) — total: N+1 queries, killing database performance at scale. Solution: DataLoader — a batching and caching library. Instead of firing a query immediately, each resolver registers a key with DataLoader. At the end of the current tick, DataLoader fires ONE batched query: SELECT * FROM orders WHERE userId IN (1,2,3,...,N). The key properties: (1) batching — groups all same-tick requests into one query; (2) per-request caching — same key in the same request returns cached result; (3) scoped per request — create a new DataLoader instance per HTTP request to prevent cross-request cache leaks.',
  },
  {
    id: 'q12', difficulty: 'senior', topic: 'Breaking Changes',
    q: 'Walk through how you would handle an unavoidable breaking change in a high-traffic public API.',
    a: 'Process: (1) Design the v2 schema first — understand exactly what changes, minimise the delta from v1. (2) Deploy v2 alongside v1 — both run in production; v2 is the new path. (3) Announce early — release notes, email to registered developers, in-app notification, minimum 6 months notice for external APIs. (4) Add Deprecation: true and Sunset: <date> headers to all v1 responses — tooling surfaces these to developers. (5) Monitor v1 usage — log consumers by API key/user agent; track which are still on v1 as sunset approaches. (6) Reach out directly to high-traffic v1 consumers — assign a migration owner; provide migration guides, code samples. (7) At sunset, return 410 Gone from v1 (not 404 — 410 is permanent and explicitly signals the resource is intentionally removed). (8) Keep v1 in maintenance mode (security patches only) for 30 days post-sunset before decommissioning.',
  },
  {
    id: 'q13', difficulty: 'senior', topic: 'Architecture',
    q: 'When would you choose GraphQL over REST? What are the tradeoffs?',
    a: 'Choose GraphQL when: (1) Clients have highly varied data needs (mobile vs web vs desktop need different field subsets) — GraphQL eliminates over-fetching; (2) BFF (Backend for Frontend) aggregation — multiple services\' data in one query without multiple HTTP round trips; (3) Rapid frontend iteration — frontend can request new field combinations without backend changes; (4) Strong typing is valued — the schema is the contract. Tradeoffs: (5) Caching is harder — every query hits the same URL (/graphql), breaking HTTP cache semantics; requires query-result caching (Apollo Server); (6) N+1 problem — must use DataLoader; (7) File uploads need multipart spec extension; (8) Monitoring harder — all requests to one endpoint, must instrument at query level; (9) Overly broad queries can be abused — need query depth/complexity limits. Stick with REST when: simple CRUD, caching is critical, consumers are external and predictable, or the team is small and GraphQL tooling overhead is not justified.',
  },
  {
    id: 'q14', difficulty: 'senior', topic: 'Security',
    q: 'What is the JWT algorithm confusion attack and how do you defend against it?',
    a: 'The attack: some JWT libraries trust the alg header field from the token itself when verifying. An attacker crafts a token with alg: none in the header and any claims they want in the payload — no signature needed. The vulnerable library sees alg: none, skips signature verification, and accepts the forged token. A more subtle variant: if your app uses RS256 (asymmetric), an attacker switches alg to HS256 and signs with the public key (which is often public). A library that accepts both algorithms will verify the HMAC using the public key — which it can. Defense: (1) Always pin the algorithm server-side: jwt.verify(token, secret, { algorithms: [\'HS256\'] }) — never let the token\'s alg field influence how you verify; (2) Reject tokens where alg is none explicitly; (3) Use a well-maintained JWT library (jsonwebtoken, jose) that has this fixed by default; (4) Separate keys for different algorithms — use asymmetric keys (RS256/ES256) for distributed verification.',
  },
  {
    id: 'q15', difficulty: 'senior', topic: 'Design',
    q: 'How do you design an API to handle long-running operations (jobs that take minutes)?',
    a: 'Do not make the client wait for the HTTP response — that is fragile (timeouts, connection drops). Use the async job pattern: (1) Client POSTs a request → server immediately responds 202 Accepted with { jobId: "job_abc", statusUrl: "/jobs/job_abc" }; (2) Server queues the work (message queue, job system); (3) Client polls GET /jobs/job_abc → { status: "running", progress: 42 } until status: "completed" | "failed"; (4) On completion: { status: "completed", result: { ... }, resultUrl: "/reports/xyz" }; (5) Alternatively: use webhook + Idempotency-Key — client registers a callback URL; server POSTs to it on job completion. Headers: 202 Accepted (not 200 or 201), Location: /jobs/job_abc for the status URL. The polling interval should be communicated (Retry-After header on the 202 or status endpoint). Consider Server-Sent Events for real-time progress without polling.',
  },
];

const TOPICS = ['All', ...Array.from(new Set(QUESTIONS.map(q => q.topic)))];
const DIFFICULTIES = ['All', 'junior', 'mid', 'senior'] as const;

@Component({
  selector: 'app-api-interview-prep',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './interview-prep.html',
  styleUrl: './interview-prep.scss',
})
export class ApiInterviewPrep {
  activeDiff = signal<string>('All');
  activeTopic = signal('All');
  expanded = signal<string | null>(null);

  topics = TOPICS;
  difficulties = DIFFICULTIES;

  filtered = computed(() => {
    const d = this.activeDiff();
    const t = this.activeTopic();
    return QUESTIONS.filter(q =>
      (d === 'All' || q.difficulty === d) &&
      (t === 'All' || q.topic === t)
    );
  });

  setDiff(d: string) { this.activeDiff.set(d); }
  setTopic(t: string) { this.activeTopic.set(t); }
  toggle(id: string) { this.expanded.set(this.expanded() === id ? null : id); }

  diffLabel(d: string) {
    return d === 'junior' ? 'Junior' : d === 'mid' ? 'Mid-Level' : d === 'senior' ? 'Senior' : d;
  }
}
