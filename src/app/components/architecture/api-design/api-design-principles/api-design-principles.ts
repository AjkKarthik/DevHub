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
  { name: 'Principle of Least Surprise', type: 'keyword', desc: 'API behaves exactly as a developer expects — consistent naming, predictable errors, no hidden side effects.' },
  { name: 'Contract-First Design',        type: 'keyword', desc: 'Define the OpenAPI spec before writing code — API shape is stable before any implementation starts.' },
  { name: 'Evolutionary Compatibility',  type: 'keyword', desc: 'New fields are additive; required fields and field types never change without a version bump.' },
  { name: 'Idempotency',                 type: 'keyword', desc: 'Repeated identical requests produce the same result — safe to retry GET, PUT, DELETE; use Idempotency-Key for POST.' },
  { name: 'Single Responsibility',       type: 'keyword', desc: 'Each endpoint does one thing — avoid multipurpose endpoints with mode-switching flags in the body.' },
  { name: 'Consistency over Cleverness', type: 'keyword', desc: 'Same naming, casing, date format, and error shape across ALL endpoints in your API.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Design for Developers, Not for Your Database',
    points: [
      'Expose domain concepts, not table names. /orders not /tbl_order; /products/{id}/reviews not /get_product_reviews_by_product_id.',
      'Consumers should not need to know your implementation: which database you use, how many microservices are behind an endpoint, or your internal ID scheme.',
      'Resource granularity should match consumer use cases. If every consumer always needs user + preferences together, return them together — not as two separate calls.',
      'Principle of Least Surprise: every endpoint should behave exactly as a developer who read your docs would expect. If GET is destructive or POST returns different shapes depending on a hidden flag, you violated this principle.',
    ],
  },
  {
    heading: 'Consistency — the Most Important Design Value',
    points: [
      'Inconsistency is the #1 cause of API usability bugs. If some endpoints use camelCase and others use snake_case, consumers get runtime errors.',
      'Standardise: naming convention (camelCase for JSON), date format (ISO 8601: 2024-01-15T10:30:00Z), pagination (cursor or page+limit — pick one), error shape (always the same fields).',
      'Use a shared error envelope for ALL endpoints: `{ error: { code, message, details[] } }`. Never return raw strings or vary the error shape by endpoint.',
      'If you have multiple teams building an API, an OpenAPI spec and a linter (Spectral) enforces consistency automatically — not a style guide that gets ignored.',
    ],
  },
  {
    heading: 'Contract-First API Design',
    points: [
      'Write the OpenAPI (or GraphQL schema) first. This separates "what the API does" from "how it does it" — frontend, backend, and mobile teams can work in parallel against a mock.',
      'Contract-first catches design mistakes early (wrong response shapes, missing fields) before any implementation exists. Much cheaper to fix a YAML file than deployed code.',
      'Tools: Swagger Editor, Stoplight, Postman — let you mock the spec and generate client code before a single server line is written.',
      'The spec is the source of truth. Generate server stubs and client SDKs from it. If someone needs to change the API, change the spec first — not the code.',
    ],
  },
  {
    heading: 'Idempotency and Safety',
    points: [
      'Safe methods: GET, HEAD, OPTIONS — no state change. Clients cache them freely.',
      'Idempotent methods: GET, PUT, DELETE — multiple identical requests produce the same result. A DELETE that returns 404 on re-request is still idempotent because server state is the same.',
      'POST is neither safe nor idempotent by default. Use Idempotency-Key header to make POST operations idempotent: client generates a UUID, server deduplicates retries with the same key within a time window (e.g., 24h).',
      'Design operations to be retry-safe. Network failures and timeouts are normal — consumers WILL retry. If your POST creates duplicate records on retry, you have a safety bug.',
    ],
  },
  {
    heading: 'API Design as a Product Decision, Not Just a Technical One',
    points: [
      'An API is a user interface for developers — every naming choice, error format, and endpoint structure directly shapes how easy or frustrating the API is to integrate with, making API design fundamentally a product design discipline, not purely a technical implementation detail.',
      'Designing for the consumer\'s mental model (organizing endpoints around what a developer is trying to accomplish, not around internal database tables) produces APIs that feel intuitive, reducing both integration time and the volume of support questions from confused consumers.',
      'Documentation quality is as much a part of API design as the endpoints themselves — an excellently designed API with poor or missing documentation is functionally almost as unusable as a poorly designed one, since developers cannot discover and correctly use capabilities they do not know exist.',
      'Treating the API contract as a durable product surface (not an implementation detail that can change freely) forces disciplined thinking about backward compatibility from the very first design, rather than accumulating breaking-change debt that becomes progressively more painful to address later.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Good vs Bad Design',
    language: 'typescript',
    code: `// ❌ BAD: implementation-leaking, inconsistent, hard to use
GET  /tbl_order/getOrdersByUserId?user_id=42&include_deleted=true
POST /create_order
GET  /productReviews_List?productID=5&maxItems=10&StartIndex=0

// ✅ GOOD: domain-focused, consistent, discoverable
GET  /orders?userId=42&status=active
POST /orders
GET  /products/5/reviews?limit=10&cursor=<token>

// ❌ BAD error shapes (varies by endpoint)
// Endpoint A: { "message": "not found" }
// Endpoint B: { "error_code": 404, "description": "User not found" }
// Endpoint C: "Unauthorized"

// ✅ GOOD: consistent error envelope for ALL endpoints
interface ApiError {
  error: {
    code: string;       // 'not_found', 'validation_error', 'unauthorized'
    message: string;    // human-readable
    details?: Array<{ field: string; issue: string }>; // for validation errors
    requestId: string;  // for support/tracing
  };
}

// ❌ BAD: POST that is not idempotent (retry creates duplicates)
POST /orders
→ 201 Created { id: 'order-1' }
POST /orders  // retry (consumer didn't see the 201)
→ 201 Created { id: 'order-2' }  // DUPLICATE order

// ✅ GOOD: Idempotency-Key makes POST retry-safe
POST /orders
Headers: { 'Idempotency-Key': 'client-uuid-xyz' }
→ 201 Created { id: 'order-1' }

POST /orders  // retry with same key
Headers: { 'Idempotency-Key': 'client-uuid-xyz' }
→ 200 OK { id: 'order-1' }  // same response — no duplicate`,
  },
  {
    label: 'API Design Checklist',
    language: 'typescript',
    code: `// Resource naming
// ✅ Plural nouns for collections: /orders, /users, /products
// ✅ Singular resource: /orders/{id}, /users/{id}
// ✅ Nested for owned resources: /users/{id}/addresses
// ❌ Avoid verbs in URLs: /getOrders, /createUser, /deleteProduct

// HTTP method semantics
// GET    /orders          → list orders (safe, idempotent, cacheable)
// GET    /orders/{id}     → get one order
// POST   /orders          → create order (not idempotent — use Idempotency-Key)
// PUT    /orders/{id}     → full replace (idempotent)
// PATCH  /orders/{id}     → partial update (use JSON Merge Patch or JSON Patch)
// DELETE /orders/{id}     → delete (idempotent)

// Status codes
// 200 OK         — success (GET, PUT, PATCH, POST returning existing resource)
// 201 Created    — resource created (POST); include Location: /orders/{newId}
// 204 No Content — success with no body (DELETE, PUT that replaces)
// 400 Bad Request — validation error; include details[]
// 401 Unauthorized — not authenticated (send WWW-Authenticate header)
// 403 Forbidden   — authenticated but not authorized
// 404 Not Found   — resource doesn't exist
// 409 Conflict    — state conflict (e.g., duplicate, optimistic lock failed)
// 422 Unprocessable — well-formed but semantically invalid (business logic error)
// 429 Too Many Requests — rate limited (send Retry-After header)
// 500 Internal Server Error — unexpected server error (log it; don't expose internals)

// Naming consistency
// ✅ camelCase for JSON fields: { userId, createdAt, orderStatus }
// ✅ ISO 8601 dates: "2024-01-15T10:30:00Z" (UTC always)
// ✅ Money as integer cents or string decimal — never float: 9999 (cents) or "99.99"
// ✅ Booleans: isActive, hasPermission (not active_flag, permission_bit)`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Using verbs in resource URLs',
    wrong: `GET  /getUser?id=42
POST /createOrder
GET  /fetchProductsByCategory?cat=electronics
POST /deleteAccount`,
    right: `GET    /users/42
POST   /orders
GET    /products?category=electronics
DELETE /accounts/{id}`,
    explanation: 'HTTP verbs (GET, POST, PUT, DELETE) already express the action. The URL should identify the resource, not the action. Mixing verbs in URLs creates an inconsistent API that forces consumers to learn every endpoint individually rather than understanding the pattern.',
  },
  {
    title: 'Returning 200 OK for errors',
    wrong: `// Returns 200 OK with an error in the body
GET /orders/999
→ 200 OK
{ "success": false, "errorCode": 404, "message": "Not found" }`,
    right: `// Use proper HTTP status codes — consumers can handle them without parsing body
GET /orders/999
→ 404 Not Found
{ "error": { "code": "not_found", "message": "Order 999 does not exist" } }`,
    explanation: 'HTTP status codes are the primary signaling mechanism. Returning 200 with an error body breaks HTTP clients, caching, monitoring tools, and any consumer that checks status codes (which they all should). Use proper 4xx/5xx codes — they are unambiguous and universally understood.',
  },
  {
    title: 'Designing APIs around internal implementation details',
    wrong: `// Exposes table structure and internal IDs — breaks if you refactor
GET /tbl_users_v2/get_by_legacy_user_id?uid=42&include_soft_deleted=1
POST /proc_create_order_with_validation`,
    right: `// Domain-focused — implementation-agnostic
GET  /users/42?includeDeleted=false
POST /orders`,
    explanation: 'API consumers should not know or care about your table names, stored procedures, legacy system naming, or internal conventions. Domain-focused URLs survive refactoring (changing database, splitting microservices) without breaking consumers.',
  },
  {
    title: 'Inconsistent date and money formats across endpoints',
    wrong: `// Endpoint A: Unix timestamp integer
{ "createdAt": 1705312200 }
// Endpoint B: formatted string
{ "created_at": "15 Jan 2024 10:30 AM" }
// Money as float
{ "price": 9.99 }  // floating point precision issues`,
    right: `// Always ISO 8601 UTC
{ "createdAt": "2024-01-15T10:30:00Z" }
// Money as integer cents OR string decimal — never float
{ "price": 999 }  // cents: 999 = $9.99`,
    explanation: 'Inconsistent formats force consumers to add format-detection code per endpoint. ISO 8601 is unambiguous, timezone-aware, and sortable as a string. Money as float causes rounding errors (0.1 + 0.2 ≠ 0.3 in IEEE 754) — store and transmit as integer cents or string decimal.',
  },
];

const challenge: Challenge = {
  title: 'Design a consistent API response',
  language: 'typescript',
  description: `You receive poorly designed API responses from a legacy system. Transform them into a consistent, well-designed envelope.
Input: { success: true, data: { user_id: 42, full_name: "John", date_joined: 1705312200, balance: 9.99 } }
Output: { data: { userId: 42, fullName: "John", joinedAt: "2024-01-15T10:30:00Z", balanceCents: 999 }, meta: { requestId: "req-001" } }

Requirements:
- Convert snake_case keys to camelCase
- Convert Unix timestamp to ISO 8601 string (1705312200 * 1000)
- Convert float dollars to integer cents (multiply by 100, round)
- Wrap in { data: ..., meta: { requestId } }`,
  hints: [
    'Use new Date(timestamp * 1000).toISOString() for Unix → ISO 8601',
    'Math.round(float * 100) for dollars → cents',
  ],
  starterCode: `function transformResponse(legacy: any, requestId: string): any {
  // Extract the user from legacy.data
  // Convert field names and formats
  // Return consistent envelope
  return {};
}

const legacy = { success: true, data: { user_id: 42, full_name: "John", date_joined: 1705312200, balance: 9.99 } };
console.log(JSON.stringify(transformResponse(legacy, 'req-001'), null, 2));`,
  solution: `function transformResponse(legacy: any, requestId: string): any {
  const u = legacy.data;
  return {
    data: {
      userId: u.user_id,
      fullName: u.full_name,
      joinedAt: new Date(u.date_joined * 1000).toISOString(),
      balanceCents: Math.round(u.balance * 100),
    },
    meta: { requestId },
  };
}

const legacy = { success: true, data: { user_id: 42, full_name: "John", date_joined: 1705312200, balance: 9.99 } };
console.log(JSON.stringify(transformResponse(legacy, 'req-001'), null, 2));`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'Which is the best URL design for getting reviews of a specific product?',
    options: [
      'GET /getProductReviews?productId=5',
      'POST /reviews/fetch { "productId": 5 }',
      'GET /products/5/reviews',
      'GET /review-list?product_id=5&type=all',
    ],
    answer: 2,
    explanation: 'Nested resource URLs (/products/5/reviews) express ownership and hierarchy naturally. They follow REST conventions: the collection /reviews is scoped under /products/5. Using GET expresses read intent. Avoid verbs in URLs (getProductReviews), POST for reads (breaks caching), and inconsistent casing.',
  },
  {
    q: 'What is the correct approach for making a POST request idempotent?',
    options: [
      'POST is always idempotent because HTTP guarantees it',
      'Use PUT instead — PUT is idempotent by definition',
      'Include an Idempotency-Key header; the server deduplicates requests with the same key',
      'Return 200 instead of 201 on duplicate requests',
    ],
    answer: 2,
    explanation: 'POST is not idempotent by default — retrying creates duplicates. The Idempotency-Key pattern fixes this: the client generates a unique key (UUID) per logical operation, sends it in the header, and the server returns the cached response for any retry with the same key within a time window (typically 24h). This makes POST retry-safe without changing its semantics.',
  },
  { q: 'What is the single responsibility principle applied to API endpoints?', options: ['Each API endpoint should handle only one HTTP method', 'Each API endpoint should do one thing well, serving a specific use case rather than being a generic catch-all endpoint that handles multiple unrelated operations', 'An API should expose only one resource per service', 'Each API should be owned by one team only'], answer: 1, explanation: 'Single responsibility for API endpoints: each endpoint has one purpose. Example: GET /reports should not also trigger email sending as a side effect. POST /orders creates an order; it should not also update the inventory count in a way that is not clearly documented. Side effects should be documented or eliminated. An endpoint that does too many things is difficult to understand, test, and evolve without breaking callers. Separate concerns: CQRS (Command Query Responsibility Segregation) takes this further by having completely separate models for read and write operations.' },
  { q: 'What is API consistency and why does it reduce cognitive load for consumers?', options: ['All APIs in a company must use the same programming language and framework', 'Consistent naming, error formats, pagination conventions, and authentication across all APIs so developers can learn the pattern once and apply it everywhere', 'All endpoints must return the same response schema regardless of the resource type', 'Consistent API performance SLAs defined in the same unit across all services'], answer: 1, explanation: 'API consistency: when all APIs in an organization follow the same conventions, developers who know one API immediately understand others. Consistency areas: naming (all resources plural: /users, /orders, not /user, /order). Error format (always { error: { code: string, message: string } }). Pagination (always cursor or offset with the same field names). Authentication (always Bearer token in Authorization header). Date formats (always ISO 8601). HTTP status codes (always 400 for client errors, 500 for server errors). Without consistency: developers have to read full documentation for every API. Naming mismatches cause bugs. Error parsing code must handle multiple formats.' },
  { q: 'What is backward compatibility in API design and what changes break it?', options: ['Backwards compatibility means maintaining support for all deprecated API versions indefinitely', 'An API change is backward compatible if existing clients continue to work without modification; breaking changes include removing fields, changing field types, and removing endpoint paths', 'Backward compatibility only applies to major API versions', 'Adding new optional request parameters always breaks backward compatibility'], answer: 1, explanation: 'Backward-compatible changes (safe to make in a minor release): adding new optional response fields (existing clients ignore them). Adding new optional request parameters with defaults. Adding new endpoints. Adding new values to non-strict enums. Breaking changes (require a major version bump or new endpoint): removing required or optional fields from responses (clients that read them break). Changing field types (string to number). Making optional fields required. Removing or renaming endpoints. Changing HTTP method for an operation. Changing status code semantics. The Robustness Principle: be conservative in what you send, liberal in what you accept — but this can hide problems.' },
  { q: 'What is the difference between RPC-style APIs and resource-oriented APIs?', options: ['RPC APIs use TCP; resource-oriented APIs use HTTP', 'RPC-style APIs model operations as procedure calls (doThis, calculateThat); resource-oriented APIs model data resources and use HTTP methods to express operations on them', 'RPC APIs are internal only; resource-oriented APIs are public', 'RPC APIs are stateless; resource-oriented APIs maintain session state'], answer: 1, explanation: 'RPC-style API: endpoints represent actions. POST /sendEmail, POST /calculateShipping, GET /getUserById. The URL is a verb. Often uses POST for all operations. Google Cloud APIs originally used RPC style. Resource-oriented (REST-like) API: endpoints represent nouns (resources). GET /users/123, POST /orders, DELETE /carts/456/items/789. HTTP method expresses the action on the resource. More intuitive for CRUD operations and entity management. RPC style is better for operations that do not map cleanly to resources (complex calculations, workflows). Resource-oriented is better for entity management and data querying. Many real-world APIs are hybrids.' },
  { q: 'What is API-first design and why is it preferred over code-first?', options: ['Write all client integration code before the backend so the backend is tested against real clients', 'Define the API contract (OpenAPI spec, Proto, SDL) before any implementation, enabling parallel development, mock servers, and contract-based testing', 'Deploy the API gateway first and write backend services to match the gateway routing rules', 'Generate client SDKs from the database schema automatically before writing business logic'], answer: 1, explanation: 'API-first: the contract is the source of truth, agreed upon before server or client code is written. Parallel development: frontend and backend teams work simultaneously once the spec is defined. Mock servers generated from the spec allow frontend work without a live backend. Contract-based testing: consumer-driven contracts catch regressions. Early feedback: spec reviews before any code is written — changes are cheap at the design phase. Tooling: OpenAPI (REST), Proto (gRPC), SDL (GraphQL) serve as the contracts. Code-first risks: the API shape emerges from implementation details — class names and method signatures leak into the API. Inconsistencies accumulate. Refactoring the contract requires changing implementation, clients, and documentation simultaneously.' },
  { q: 'What are the six architectural constraints of REST defined by Roy Fielding?', options: ['Client-server, stateless, cacheable, uniform interface, layered system, and code-on-demand', 'REST, JSON, HTTPS, CRUD, idempotent methods, and resource URIs', 'Versioning, pagination, authentication, error responses, rate limiting, and documentation', 'Synchronous, request-response, text-based, discoverable, typed, and versioned'], answer: 0, explanation: 'The six REST constraints from Roy Fielding\'s 2000 dissertation: 1. Client-server: UI and data storage are separated. 2. Stateless: each request contains all information needed — no session state on the server. 3. Cacheable: responses define cacheability via headers. 4. Uniform interface: consistent interface across all resources — identified by URIs, manipulated through representations, self-descriptive messages, HATEOAS. 5. Layered system: client cannot tell if connected directly to the server or an intermediary (proxy, CDN). 6. Code-on-demand (optional): servers can send executable code (JavaScript). Most REST APIs implement the first five. HATEOAS is the most commonly omitted constraint in practice — most Level 2 REST APIs skip it.' },
  { q: 'What is the difference between safe and idempotent HTTP methods?', options: ['Safe methods do not modify state; idempotent methods can modify state but produce the same result when called multiple times', 'Safe methods are HTTPS-only while idempotent methods work over HTTP or HTTPS', 'Idempotent methods are thread-safe; safe methods must be called sequentially', 'Safe and idempotent are synonyms — all safe methods are idempotent and vice versa'], answer: 0, explanation: 'Safe methods: do not modify server state. GET, HEAD, OPTIONS are safe. No side effects — clients can call freely. Idempotent methods: calling N times has the same effect as calling once. GET, HEAD, OPTIONS, PUT, DELETE are idempotent. POST is NOT idempotent (each POST may create a new resource). PATCH is NOT guaranteed idempotent (depends on the operation). Safe implies idempotent but not vice versa: PUT is idempotent but not safe (modifies state, but calling twice gives the same result). DELETE is idempotent — deleting an already-deleted resource returns 404 but has no additional side effects. Practical importance: intermediaries use these properties for retry logic. A 503 on GET is safe to retry. A 503 on POST is not — it might create a duplicate.' },
  { q: 'What is HATEOAS and why is it the highest level of REST maturity?', options: ['A security framework that prevents unauthorized hypertext access in RESTful services', 'Hypermedia As The Engine Of Application State — responses include links to available next actions so clients navigate the API dynamically from response data rather than hard-coding URLs', 'A performance optimization where responses include cached links to reduce round trips for related resources', 'A requirement that all API responses be returned as HTML so hypermedia links are natively clickable in browsers'], answer: 1, explanation: 'HATEOAS: Level 3 of the Richardson Maturity Model. Each response includes hypermedia controls — links to what the client can do next. Example: GET /orders/123 returns { "orderId": 123, "status": "pending", "_links": { "self": { "href": "/orders/123" }, "cancel": { "href": "/orders/123/cancel", "method": "DELETE" }, "pay": { "href": "/orders/123/payment", "method": "POST" } } }. The client does not hard-code URLs — it follows links from the response. Benefits: server can change URLs without breaking clients. Self-documenting — the response reveals what is possible. Loose coupling — clients adapt to state changes dynamically. Why rarely implemented: clients must parse link relations; teams find Level 2 (HTTP verbs + status codes) sufficient for most use cases. HATEOAS shines in complex workflow APIs where available actions change based on resource state.' },
];

const qna: QnaItem[] = [
  {
    q: 'Should we do contract-first or code-first API design?',
    a: 'Contract-first is almost always the right approach for public or cross-team APIs. Write the OpenAPI spec first — define the resource shapes, endpoints, error responses, and auth. This gives you: <ol><li>A mockable spec (frontend can build against a mock before the server exists)</li><li>Early design feedback (catch shape mistakes in YAML, not in deployed code)</li><li>Auto-generated client SDKs and server stubs</li><li>Automatic documentation</li><li>Linting with Spectral to enforce consistency rules</li></ol>Code-first is acceptable for internal APIs in a monorepo where one team owns both sides, or when rapidly prototyping. But for APIs with external consumers, contract-first is the industry standard because changing a spec is cheaper than migrating clients away from a deployed endpoint.',
  },
  {
    q: 'How do you handle filtering, sorting, and searching on list endpoints?',
    a: 'Use query parameters for all three: <ul><li><strong>Filter</strong>: <code>GET /orders?status=pending&customerId=42</code> — field-name params directly</li><li><strong>Sort</strong>: <code>?sort=createdAt&order=desc</code> or <code>?sort=-createdAt</code> (minus prefix for descending — common convention)</li><li><strong>Search</strong>: <code>?q=laptop</code> for full-text search across relevant fields</li><li><strong>Field selection (sparse fieldsets)</strong>: <code>?fields=id,name,price</code> — return only requested fields</li></ul>For complex filtering (AND/OR, range queries), consider a filter DSL in a single query param: <code>?filter[price][gte]=100&filter[price][lte]=500</code> (JSON:API style). Avoid accepting filter logic in the body of a GET request — it breaks caching and HTTP semantics.',
  },
  { q: 'How do you design an API for both human readability and machine efficiency?', a: 'Human readability: use descriptive field names (createdAt not cat, maximumRetryCount not mrc). Use consistent naming conventions (camelCase for JSON, snake_case for query params is common). Include meaningful HTTP status codes. Provide human-readable error messages. Self-descriptive URLs (/users/123/orders rather than /q?t=ord&u=123). Machine efficiency: keep response payloads lean. Do not return fields the caller did not ask for. Use gzip compression. Support sparse fieldsets via a fields query parameter (?fields=id,name). Enable conditional requests (ETag/If-None-Match) so clients skip downloading unchanged data. Support batch endpoints for high-volume operations. The two goals are mostly compatible: good naming has no performance cost. Lean payloads benefit both humans (less to read) and machines (less to parse and transfer).' },
  { q: 'What is the principle of least surprise in API design?', a: 'Principle of least surprise (POLA): an API should behave the way a developer would expect based on common conventions and the API documentation, without hidden side effects or unexpected behaviors. Violations: a DELETE endpoint that does not actually delete but archives (returning 200 is surprising). A GET endpoint that logs an action and sends an email. POST /users returning 200 instead of 201 when a user is created. PUT /users/123 creating a new user if 123 does not exist without documenting this. An endpoint that silently drops unknown fields instead of returning a 400 error (field misspellings go undetected). Application: follow HTTP semantics strictly. Document any deviation prominently. Test your API from a first-time user perspective. Run usability tests by having developers who have not seen the API try to use it from the documentation alone.' },
  { q: 'How do you handle optional versus required fields in API requests?', a: 'Required fields: the operation cannot proceed without them. Return 400 with a clear error message listing the missing field name. Validate at the start of the handler, before any side effects. Optional fields: have sensible defaults documented. Do not assume a missing optional field means the same as an explicit null. Missing: the client did not provide it (use default). Null: the client explicitly set it to null (clear the value). JSON does not distinguish the two natively; use explicit sentinel values or partial update semantics. API contract documentation: mark all fields as required or optional explicitly. Use OpenAPI required array in schemas. Avoid changing a field from optional to required in a minor version (breaking change). When adding a new required field, deprecate the old endpoint and create a new one rather than breaking existing clients.' },
  { q: 'What is API discoverability and how do you implement it?', a: 'Discoverability: clients can explore and understand an API without reading full documentation. Techniques: hypermedia (HATEOAS): responses include links to related actions. A GET /orders/123 response includes links to /orders/123/cancel and /orders/123/items. The OpenAPI document (swagger.json) is discoverable at a well-known path: GET /openapi.json or GET /v1/openapi.yaml. Interactive documentation (Swagger UI, Redoc) generated from the OpenAPI document. Consistent error codes that tell the client what to do next: 401 means authenticate, 403 means the action is forbidden even if authenticated, 404 means the resource does not exist. Meaningful HTTP headers (Link headers for pagination, Allow header on 405 responses). API catalog or developer portal listing all available APIs with status and versioning.' },
  { q: 'What is API governance and why does it matter in large organizations?', a: 'API governance: policies, processes, and tooling to ensure consistency, quality, and security across all APIs in an organization. Without governance: each team designs APIs with different conventions — inconsistent error formats, varying auth schemes, different versioning strategies. Consumers learn a different mental model per API. Core elements: style guide — mandated conventions for URL naming, HTTP methods, status codes, error format, pagination, date formats (always ISO 8601). Review process — API specs reviewed before implementation, often as a design review or PR against a spec repository. Linting — automated tools (Spectral for OpenAPI, buf lint for gRPC) enforce the style guide on every commit. API catalog — a central registry listing all available APIs, their owners, and their specs. Security policy — auth requirements, rate limiting standards. Breaking change policy — required approval before any breaking change. Anti-pattern: heavyweight governance that slows teams creates shadow APIs and undocumented endpoints. Good governance catches problems early with lightweight, automated checks.' },
  { q: 'What is the Richardson Maturity Model and what does each level represent?', a: 'The Richardson Maturity Model ranks REST APIs from Level 0 to Level 3 based on how well they use HTTP and REST constraints. Level 0 — Swamp of POX: a single URI for all operations, actions encoded in the request body, essentially RPC over HTTP. Example: POST /api with body { "action": "getUser", "id": 1 }. Level 1 — Resources: individual URIs per resource (/users/1, /orders/5) but still using a single HTTP method (usually POST) for all actions. Level 2 — HTTP Verbs: uses appropriate HTTP methods (GET, POST, PUT, DELETE, PATCH) and status codes correctly. The most common practical target. The vast majority of production REST APIs are Level 2. Level 3 — Hypermedia (HATEOAS): responses include links to available actions. Clients navigate the API through hypermedia controls dynamically. Practical guidance: aim for Level 2 minimum. Level 3 is valuable for complex workflow APIs where available actions depend on resource state.' },
  { q: 'How do you design APIs for versioning and stability from day one?', a: 'Design for change principles: use nouns not verbs in resource names — nouns are stable, verbs encode behavior that may change. Use plural nouns consistently (/users not /user). Prefix paths with a version identifier (/v1/) from the first release — even v1 should be explicit. Avoid exposing internal IDs or structure — use opaque identifiers. Build in extensibility: design responses with room to grow. A _links object for future HATEOAS. A meta object for pagination and metadata. Use camelCase or snake_case consistently — changing is a breaking change for strict clients. Make fields optional by default: prefer null or absence over required fields that might need to change. Date formats: always ISO 8601 (2024-01-15T10:30:00Z) — never locale-specific formats. Avoid tight coupling: do not expose your database schema through the API — use a dedicated DTO. This decoupling allows internal refactoring without changing the API contract. Test backward compatibility: write consumer contract tests from day one and run them on every deployment.' },
  { q: 'What are the trade-offs between REST, GraphQL, and gRPC?', a: 'REST: pros — widely understood, great browser support, HTTP caching works naturally, simple and stateless. cons — over-fetching (getting more than needed), under-fetching (needing multiple requests), no built-in schema enforcement. Best for: public APIs, CRUD APIs, browser-facing APIs. GraphQL: pros — clients request exactly the data they need, strongly typed schema, one endpoint for all operations, great for complex data graphs. cons — HTTP caching is harder (all queries POST to one endpoint), N+1 problem (requires DataLoader), harder to rate limit by operation. Best for: complex client data requirements, mobile apps (bandwidth-sensitive), rapid frontend iteration. gRPC: pros — high performance via binary Protocol Buffers, built-in streaming (unary, server-streaming, client-streaming, bidirectional), strongly typed, auto-generated clients. cons — not browser-friendly without grpc-web, binary format harder to debug. Best for: service-to-service in microservices, high-throughput internal APIs. Decision: external/public API → REST or GraphQL; complex frontend data needs → GraphQL; internal service mesh → gRPC.' },
];

const revision: RevisionSummary = {
  oneLiner: 'API design is about developer experience — consistency, predictability, idempotency, and contract-first specs over implementation-leaking endpoints.',
  mustKnow: [
    'Design for domain concepts, not database tables — /orders not /tbl_order',
    'Consistency beats cleverness: same naming, date format, error shape everywhere',
    'Use proper HTTP status codes — never 200 with an error body',
    'Verbs belong in HTTP methods, not URLs — GET/POST/PUT/PATCH/DELETE on nouns',
    'Contract-first: write OpenAPI spec before implementation; mock early',
    'Make POST idempotent with Idempotency-Key header; GET/PUT/DELETE are inherently idempotent',
  ],
  interviewFocus: [
    'What is the principle of least surprise in API design?',
    'How do you make a POST endpoint idempotent?',
    'Why is contract-first design preferable for public APIs?',
  ],
};

@Component({
  selector: 'app-api-design-principles',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './api-design-principles.html',
  styleUrl: './api-design-principles.scss',
})
export class ApiDesignPrinciples {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
