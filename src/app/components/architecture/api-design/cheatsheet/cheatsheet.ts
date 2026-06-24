import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface CheatItem {
  category: string;
  topic: string;
  summary: string;
  detail: string;
  tags: string[];
}

const ITEMS: CheatItem[] = [
  // HTTP Methods
  { category: 'HTTP Methods', topic: 'GET', summary: 'Read resource — safe, idempotent, cacheable', detail: 'GET /orders — list; GET /orders/42 — single. No body. Status: 200. Cached by default.', tags: ['http', 'rest'] },
  { category: 'HTTP Methods', topic: 'POST', summary: 'Create resource — not idempotent; use Idempotency-Key', detail: 'POST /orders → 201 Created + Location: /orders/42. Use Idempotency-Key header for retry safety.', tags: ['http', 'rest'] },
  { category: 'HTTP Methods', topic: 'PUT', summary: 'Full replace — idempotent', detail: 'PUT /orders/42 → 200 or 204. Replaces the entire resource. Missing fields set to default/null.', tags: ['http', 'rest'] },
  { category: 'HTTP Methods', topic: 'PATCH', summary: 'Partial update — use JSON Merge Patch (RFC 7396)', detail: 'PATCH /orders/42 body: { "status": "shipped" } → 200. Only send fields to update.', tags: ['http', 'rest'] },
  { category: 'HTTP Methods', topic: 'DELETE', summary: 'Remove resource — idempotent', detail: 'DELETE /orders/42 → 204 No Content. Re-deleting same resource → 204 (idempotent) or 404.', tags: ['http', 'rest'] },

  // Status Codes
  { category: 'Status Codes', topic: '200 OK', summary: 'Success with body', detail: 'GET, PUT, PATCH responses. Never return 200 with an error body.', tags: ['status', 'http'] },
  { category: 'Status Codes', topic: '201 Created', summary: 'Resource created — include Location header', detail: 'POST → 201 + Location: /orders/42. Body: the created resource.', tags: ['status', 'http'] },
  { category: 'Status Codes', topic: '204 No Content', summary: 'Success, no body', detail: 'DELETE, PUT with no response body. Do not return 204 with a body.', tags: ['status', 'http'] },
  { category: 'Status Codes', topic: '400 Bad Request', summary: 'Validation error — include details[]', detail: '{ error: { code: "validation_error", details: [{ field, issue }] } }. Client must fix request.', tags: ['status', 'errors'] },
  { category: 'Status Codes', topic: '401 Unauthorized', summary: 'Not authenticated — include WWW-Authenticate', detail: 'No token or invalid token. Include WWW-Authenticate: Bearer header. Client must authenticate.', tags: ['status', 'security'] },
  { category: 'Status Codes', topic: '403 Forbidden', summary: 'Authenticated but not authorized', detail: 'User is identified but lacks permission. Different from 401 — do not return 401 here.', tags: ['status', 'security'] },
  { category: 'Status Codes', topic: '404 Not Found', summary: 'Resource does not exist', detail: 'Never use 404 to hide a resource from unauthorized users — use 403 for that.', tags: ['status', 'errors'] },
  { category: 'Status Codes', topic: '409 Conflict', summary: 'State conflict', detail: 'Duplicate resource, optimistic lock failure, business rule violation. Explain in error body.', tags: ['status', 'errors'] },
  { category: 'Status Codes', topic: '422 Unprocessable', summary: 'Semantically invalid (business logic)', detail: 'Well-formed JSON but fails business rules (e.g., order total below minimum). Use over 400 for business errors.', tags: ['status', 'errors'] },
  { category: 'Status Codes', topic: '429 Too Many', summary: 'Rate limited — include Retry-After', detail: 'Retry-After: 60. X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset headers.', tags: ['status', 'rate-limiting'] },
  { category: 'Status Codes', topic: '500 Internal Error', summary: 'Unexpected server error — log, do not expose', detail: 'Return generic message. Log the full error with request ID. Never expose stack traces.', tags: ['status', 'errors'] },

  // URL Design
  { category: 'URL Design', topic: 'Plural nouns', summary: '/orders not /order or /getOrders', detail: 'Collections use plural nouns. Individual resources: /orders/42. Never verbs in URLs.', tags: ['url', 'rest'] },
  { category: 'URL Design', topic: 'Nested resources', summary: '/users/42/addresses for owned resources', detail: 'Max 2 levels of nesting — deeper nesting is a smell. /users/42/addresses/7 is fine; /a/b/c/d/e is not.', tags: ['url', 'rest'] },
  { category: 'URL Design', topic: 'Query params', summary: 'Filter, sort, paginate, search', detail: '?status=active&sort=-createdAt&limit=20&cursor=abc&q=search. Never filter logic in URL path.', tags: ['url', 'rest'] },
  { category: 'URL Design', topic: 'Field casing', summary: 'camelCase for JSON fields', detail: 'userId, createdAt, orderStatus. All JSON fields camelCase. URL path kebab-case: /order-items.', tags: ['url', 'naming'] },

  // Pagination
  { category: 'Pagination', topic: 'Cursor-based', summary: 'Best for real-time data; stable across mutations', detail: 'GET /orders?cursor=<opaque_token>&limit=20 → { data: [], meta: { nextCursor } }. Use for feeds.', tags: ['pagination', 'rest'] },
  { category: 'Pagination', topic: 'Offset-based', summary: 'Simple; drifts on inserts/deletes', detail: 'GET /orders?page=2&limit=20 or ?offset=20&limit=20. Simple but page drift on active data.', tags: ['pagination', 'rest'] },
  { category: 'Pagination', topic: 'Response envelope', summary: '{ data: [], meta: { nextCursor, total } }', detail: 'Always wrap paginated lists in { data: [], meta: {} }. Never return a bare array at the top level.', tags: ['pagination', 'rest'] },

  // Versioning
  { category: 'Versioning', topic: 'URL versioning', summary: '/v1/orders — explicit, discoverable', detail: 'Most common. PUT in path: /v1/, /v2/. Easy to route in API gateway. Old versions run in parallel.', tags: ['versioning'] },
  { category: 'Versioning', topic: 'Header versioning', summary: 'API-Version: 2024-01-15', detail: 'Date-based (Stripe style) or numeric. Cleaner URLs; harder to test in browser. Use for mature APIs.', tags: ['versioning'] },
  { category: 'Versioning', topic: 'Breaking change', summary: 'Remove/rename field, change type, required field', detail: 'Any change that breaks existing consumers without code changes. Requires version bump + sunset period.', tags: ['versioning', 'breaking'] },
  { category: 'Versioning', topic: 'Non-breaking', summary: 'Add optional field, new endpoint', detail: 'Adding new optional response fields or endpoints is safe. Old consumers ignore unknown fields.', tags: ['versioning', 'breaking'] },

  // Security
  { category: 'Security', topic: 'JWT verification', summary: 'Verify sig + exp + iss + aud; pin algorithm', detail: 'jwt.verify(token, secret, { algorithms: ["HS256"], issuer, audience }). Never accept alg: none.', tags: ['security', 'auth'] },
  { category: 'Security', topic: 'CORS', summary: 'Explicit origin allowlist; never * with credentials', detail: 'cors({ origin: ["https://app.co"], credentials: true }). Wildcard + credentials rejected by browser.', tags: ['security', 'cors'] },
  { category: 'Security', topic: 'Input validation', summary: 'Validate at boundary; Zod/Joi; explicit allowlist', detail: 'Never pass req.body directly to DB (mass assignment). Validate type, length, format server-side.', tags: ['security', 'validation'] },
  { category: 'Security', topic: 'HTTPS', summary: 'All traffic HTTPS; HSTS header', detail: 'Strict-Transport-Security: max-age=31536000; includeSubDomains. Redirect HTTP → HTTPS.', tags: ['security', 'transport'] },

  // Rate Limiting
  { category: 'Rate Limiting', topic: 'Token bucket', summary: 'Allows bursts up to capacity; throttles at refill rate', detail: 'Capacity=60, refill=10/s. Client can burst 60 requests then is limited to 10/s. Best for bursty clients.', tags: ['rate-limiting'] },
  { category: 'Rate Limiting', topic: 'Sliding window', summary: 'Rolling count in last N seconds; no boundary burst', detail: 'Count requests in last 60s rolling window. Fairer than fixed window. Requires Redis sorted set.', tags: ['rate-limiting'] },
  { category: 'Rate Limiting', topic: '429 Headers', summary: 'X-RateLimit-* on every response; Retry-After on 429', detail: 'X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset. Retry-After on 429 only.', tags: ['rate-limiting', 'status'] },

  // WebSocket / SSE
  { category: 'Real-Time', topic: 'WebSocket', summary: 'Full-duplex; best for chat/gaming/live collaboration', detail: 'ws:// or wss://. Persistent connection. Client AND server can push anytime. Use for bi-directional.', tags: ['realtime', 'websocket'] },
  { category: 'Real-Time', topic: 'SSE', summary: 'Server-push; text/event-stream; auto-reconnect', detail: 'EventSource API in browser. One-directional (server → client). Built-in reconnect. Works through HTTP/2.', tags: ['realtime', 'sse'] },
  { category: 'Real-Time', topic: 'Long Polling', summary: 'Fallback; server holds request until event or timeout', detail: 'Client sends GET → server holds 30s → responds with event or empty. Client immediately re-polls.', tags: ['realtime'] },

  // GraphQL
  { category: 'GraphQL', topic: 'Query', summary: 'Read data — declare exactly what fields you need', detail: 'query { user(id: "42") { id name email orders { id total } } }. No over/under-fetching.', tags: ['graphql'] },
  { category: 'GraphQL', topic: 'Mutation', summary: 'Write data — create/update/delete', detail: 'mutation { createOrder(input: { items: [...] }) { id status } }. Returns the changed object.', tags: ['graphql'] },
  { category: 'GraphQL', topic: 'N+1 problem', summary: 'Use DataLoader to batch child queries', detail: 'Each parent triggers a child query → O(n) queries. DataLoader batches into one: WHERE id IN (...).', tags: ['graphql', 'performance'] },

  // Webhooks
  { category: 'Webhooks', topic: 'HMAC verification', summary: 'X-Signature-256: sha256=<hex>; timingSafeEqual()', detail: 'HMAC-SHA256 of raw body with shared secret. Verify with crypto.timingSafeEqual — not ===.', tags: ['webhooks', 'security'] },
  { category: 'Webhooks', topic: 'Idempotency', summary: 'Deduplicate by event.id — webhooks delivered ≥ once', detail: 'Record processed event IDs. Check before handling. Return 200 immediately; process async.', tags: ['webhooks'] },
  { category: 'Webhooks', topic: 'Retry strategy', summary: 'Exponential backoff; DLQ after max retries', detail: 'Retry delays: 1m, 5m, 30m, 2h. Non-2xx or timeout = failure. Dead letter queue after all retries.', tags: ['webhooks'] },
];

const CATEGORIES = ['All', ...Array.from(new Set(ITEMS.map(i => i.category)))];

@Component({
  selector: 'app-api-cheatsheet',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cheatsheet.html',
  styleUrl: './cheatsheet.scss',
})
export class ApiCheatsheet {
  search = signal('');
  activeCategory = signal('All');
  expanded = signal<string | null>(null);

  categories = CATEGORIES;

  filtered = computed(() => {
    const q = this.search().toLowerCase();
    const cat = this.activeCategory();
    return ITEMS.filter(item => {
      const matchCat = cat === 'All' || item.category === cat;
      const matchQ = !q || item.topic.toLowerCase().includes(q)
        || item.summary.toLowerCase().includes(q)
        || item.detail.toLowerCase().includes(q)
        || item.tags.some(t => t.includes(q));
      return matchCat && matchQ;
    });
  });

  setCategory(cat: string) { this.activeCategory.set(cat); }
  toggle(topic: string) {
    this.expanded.set(this.expanded() === topic ? null : topic);
  }
}
