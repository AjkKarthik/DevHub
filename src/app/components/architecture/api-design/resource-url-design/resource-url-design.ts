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
  { name: 'Plural Nouns',     type: 'syntax', desc: '/users, /orders, /products — not /user or /getUsers.' },
  { name: 'Nested Resources', type: 'syntax', desc: '/users/{id}/orders — for resources that belong to another resource.' },
  { name: 'Query Params',     type: 'syntax', desc: '?filter=active&sort=name&page=2&limit=20 — for filtering, sorting, pagination.' },
  { name: 'Path Params',      type: 'syntax', desc: '/users/{id} — for identifying a specific resource by its unique identifier.' },
  { name: 'kebab-case',       type: 'keyword', desc: 'Use hyphens in multi-word path segments: /order-items, not /orderItems or /order_items.' },
  { name: 'Sub-resources',    type: 'keyword', desc: 'Limit nesting to 2 levels: /users/{id}/orders, NOT /users/{id}/orders/{oid}/items/{iid}.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Resource Naming Conventions',
    points: [
      'Resources are always plural nouns: /users, /orders, /invoices. Never verbs: /getUsers, /createOrder.',
      'Use kebab-case for multi-word path segments: /order-items, /shipping-addresses. Do NOT use camelCase (/orderItems) or underscores (/order_items) — they look different and clients may auto-URL-encode underscores.',
      'Collections are plural (/users); single items add an identifier (/users/42). Consistent plurals reduce cognitive overhead — you always know /users returns a list.',
      'Case-insensitive convention: lowercase everywhere. /Users and /users should behave the same but canonically use lowercase.',
    ],
  },
  {
    heading: 'Resource Hierarchies and Nesting',
    points: [
      'Nesting expresses ownership or containment: /users/42/orders means "orders belonging to user 42".',
      'Limit nesting to 2 levels. /users/{id}/orders is fine. /users/{id}/orders/{oid}/items/{iid}/variants is too deep — deep nesting creates fragile URLs that break when hierarchies change.',
      'Alternative to deep nesting: flatten and filter. Instead of /users/42/orders/8/items, use /order-items?orderId=8 — easier to bookmark, cache, and consume.',
      'Sub-resources for actions that don\'t fit CRUD: /orders/{id}/cancel, /users/{id}/activate. These look like verbs but represent state transitions.',
    ],
  },
  {
    heading: 'Query Parameters vs Path Parameters',
    points: [
      'Path parameters (/users/{id}): identify a specific resource. Required. Changing the value identifies a different resource.',
      'Query parameters (/users?role=admin): filtering, sorting, pagination, optional fields. Optional and combinable.',
      'Filtering: ?status=active&region=us — filter the collection by attribute values.',
      'Sorting: ?sort=name&order=asc or ?sort=-createdAt (minus prefix = descending). Consistent convention across your API.',
      'Pagination: ?page=2&limit=20 (offset-based) or ?cursor=eyJpZCI6NDJ9&limit=20 (cursor-based). Always paginate collections — never return unlimited rows.',
    ],
  },
  {
    heading: 'Actions and Non-CRUD Operations',
    points: [
      'Some operations don\'t map cleanly to CRUD: cancel an order, activate an account, send an email.',
      'Option 1: model as a state change — PATCH /orders/42 { "status": "cancelled" }. Clean, REST-aligned.',
      'Option 2: sub-resource action — POST /orders/42/cancellations. The action creates a "cancellation" resource.',
      'Option 3: RPC-style verb path — POST /orders/42/cancel. Technically not REST but pragmatic and widely used.',
      'Avoid GET for mutations. Never use GET /users/42/delete — bots, link prefetchers, and browser history will trigger it accidentally.',
    ],
  },
  {
    heading: 'URL Design as Long-Term API Surface Investment',
    points: [
      'URL structure is one of the hardest things to change after an API ships — unlike internal implementation details, resource URLs are directly embedded in every client integration, bookmark, and piece of documentation, making upfront URL design decisions unusually consequential and expensive to reverse.',
      'A consistent naming and structure convention applied across an entire API (not just individual endpoints designed in isolation) helps consumers predict URLs for resources they have not yet used, based on patterns they have already learned from other parts of the same API.',
      'Establishing URL conventions as a documented style guide (not just implicit tribal knowledge) is what keeps a growing API, built by multiple teams over time, structurally consistent — without an explicit, referenceable guide, different teams naturally converge on subtly different conventions.',
      'Reviewing proposed URL structures during API design review (before implementation begins) is far cheaper than discovering an awkward or inconsistent URL structure after the endpoint has shipped and consumers have already integrated against it.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'URL Design Examples',
    language: 'typescript',
    code: `// ── Collection endpoints ──────────────────────────────────────────────
GET /users                          // list all users
GET /users?role=admin&limit=20      // filter + paginate
POST /users                         // create a new user

// ── Single resource endpoints ──────────────────────────────────────────
GET /users/42                       // get user 42
PUT /users/42                       // replace user 42
PATCH /users/42                     // partial update user 42
DELETE /users/42                    // delete user 42

// ── Nested resources (1 level) ─────────────────────────────────────────
GET /users/42/orders                // orders belonging to user 42
POST /users/42/orders               // create order for user 42
GET /users/42/orders/8              // specific order

// ── Filtering, sorting, pagination ────────────────────────────────────
GET /products?category=electronics&minPrice=100&maxPrice=500
GET /orders?status=pending&sort=-createdAt&page=1&limit=20
GET /users?search=john&sort=name&order=asc

// ── Non-CRUD state transitions ────────────────────────────────────────
POST /orders/42/cancel              // action as sub-resource
PATCH /orders/42  { status: 'cancelled' }  // or as PATCH (preferred)
POST /users/42/activate

// ── WRONG: avoid verbs and deep nesting ───────────────────────────────
// GET /getUser?id=42          ← verb in path
// GET /deleteOrder/8          ← GET for mutation
// GET /users/42/orders/8/items/3/variants/1  ← 5 levels deep`,
  },
  {
    label: 'Express Route Structure',
    language: 'typescript',
    code: `import express from 'express';
const router = express.Router();

// Collection routes
router.get('/users', listUsers);          // GET /users?role=admin&page=2
router.post('/users', createUser);        // POST /users

// Single resource routes
router.get('/users/:id', getUser);        // GET /users/42
router.put('/users/:id', replaceUser);    // PUT /users/42
router.patch('/users/:id', updateUser);   // PATCH /users/42
router.delete('/users/:id', deleteUser);  // DELETE /users/42

// Nested resource routes
router.get('/users/:userId/orders', getUserOrders);
router.post('/users/:userId/orders', createUserOrder);

// Query parameter handling
async function listUsers(req: Request, res: Response) {
  const {
    role,
    search,
    sort = 'createdAt',
    order = 'desc',
    page = '1',
    limit = '20',
  } = req.query as Record<string, string>;

  const users = await db.users.findAll({
    where: {
      ...(role && { role }),
      ...(search && { name: { contains: search } }),
    },
    orderBy: { [sort]: order },
    skip: (parseInt(page) - 1) * parseInt(limit),
    take: parseInt(limit),
  });

  const total = await db.users.count();
  res.json({
    data: users,
    pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
  });
}`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Verbs in resource URLs',
    wrong: `GET /getUserById?id=42
POST /createOrder
GET /deleteUser?id=42`,
    right: `GET /users/42
POST /orders
DELETE /users/42`,
    explanation: 'HTTP methods (GET, POST, DELETE) are the verbs. URIs should be nouns identifying the resource. Mixing verbs into URLs leads to inconsistency — every developer invents different verbs.',
  },
  {
    title: 'Deep nesting beyond 2 levels',
    wrong: `GET /users/42/orders/8/items/3/variants/1
// 5 levels deep — URL breaks if hierarchy changes`,
    right: `GET /users/42/orders/8          // 2 levels OK
GET /order-items?orderId=8       // flat with filter`,
    explanation: 'Deep URL nesting creates fragile contracts. Limit nesting to 2 levels. Flatten deeper resources and use query parameters to express the relationship.',
  },
  {
    title: 'Using GET for state-changing operations',
    wrong: `GET /orders/42/cancel
GET /users/42/delete`,
    right: `POST /orders/42/cancel
DELETE /users/42`,
    explanation: 'GET must be safe (no side effects) and idempotent. Browsers prefetch GET links, bots crawl them, and proxies cache them — using GET for mutations causes accidental state changes.',
  },
  {
    title: 'Inconsistent naming style in URLs',
    wrong: `GET /orderItems      // camelCase
GET /shipping_address // snake_case
GET /user-profile     // kebab-case — now which style is it?`,
    right: `GET /order-items
GET /shipping-addresses
GET /user-profiles`,
    explanation: 'Pick one style (kebab-case) and use it everywhere. Inconsistent naming causes client bugs when developers guess wrong — they try /orderItems when the API uses /order-items.',
  },
];

const challenge: Challenge = {
  title: 'URL Path Validator',
  language: 'typescript',
  description: `Implement validateApiPath(path: string): { valid: boolean; issues: string[] } that:
1. Rejects paths with verbs: get, create, delete, update, fetch, list (case-insensitive segment match)
2. Rejects paths deeper than 4 segments (e.g., /a/b/c/d/e has 5 segments — too deep)
3. Rejects camelCase segments (segments containing uppercase letters: /userProfile is wrong, /user-profile is right)
Return all issues found, not just the first.`,
  hints: [
    'Split the path by "/" and filter empty strings to get segments',
    'Check each segment against a verb list',
    'Check for uppercase letters with /[A-Z]/.test(segment)',
  ],
  starterCode: `function validateApiPath(path: string): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  // TODO: validate the path
  return { valid: issues.length === 0, issues };
}`,
  solution: `function validateApiPath(path: string): { valid: boolean; issues: string[] } {
  const VERBS = ['get', 'create', 'delete', 'update', 'fetch', 'list'];
  const issues: string[] = [];
  const segments = path.split('/').filter(Boolean);

  if (segments.length > 4) {
    issues.push(\`Path has \${segments.length} segments — limit nesting to 4\`);
  }

  for (const seg of segments) {
    const lower = seg.toLowerCase();
    // Skip path params like {id} or :id
    if (seg.startsWith('{') || seg.startsWith(':')) continue;
    if (VERBS.includes(lower)) issues.push(\`Segment "\${seg}" is a verb — use a noun\`);
    if (/[A-Z]/.test(seg)) issues.push(\`Segment "\${seg}" uses camelCase — use kebab-case\`);
  }

  return { valid: issues.length === 0, issues };
}

console.log(validateApiPath('/users/42/orders'));           // valid
console.log(validateApiPath('/getUserById'));               // invalid: verb
console.log(validateApiPath('/orderItems'));                // invalid: camelCase
console.log(validateApiPath('/a/b/c/d/e'));                // invalid: too deep`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'Which URL correctly follows REST naming conventions for creating an order for user 42?',
    options: [
      'GET /createOrderForUser?userId=42',
      'POST /users/42/createOrder',
      'POST /users/42/orders',
      'PUT /orders/new?userId=42',
    ],
    answer: 2,
    explanation: 'POST /users/42/orders is correct: plural noun "orders" nested under "users/42" to express the relationship. HTTP POST is the verb for creation. No verbs in the URI — the path is all nouns.',
  },
  {
    q: 'When should you use query parameters vs path parameters?',
    options: [
      'Path params for required values; query params for filtering, sorting, pagination',
      'Query params for all parameters to keep URLs clean',
      'Path params always — they are more secure',
      'Query params for POST; path params for GET',
    ],
    answer: 0,
    explanation: 'Path parameters (/users/{id}) identify a specific resource — they are required and selecting a different value identifies a different resource. Query parameters (?sort=name&limit=20) are optional and used for filtering, sorting, and pagination of collections.',
  },
  { q: 'What naming convention should REST API URLs use for resource collections?', options: ['CamelCase for all resource names like /userProfiles', 'Plural lowercase nouns with hyphens for multi-word names like /user-profiles', 'Singular PascalCase nouns like /UserProfile', 'UPPERCASE with underscores like /USER_PROFILES'], answer: 1, explanation: 'REST URL convention: plural nouns (/users, /orders), lowercase letters, hyphens for multi-word resources (/user-profiles not /userProfiles or /user_profiles). The collection is plural because /users represents the users collection and /users/123 is a specific item within it. Trailing slashes, file extensions, and verbs in paths are all anti-patterns in REST URL design.' },
  { q: 'What URL structure correctly expresses the relationship orders belonging to user 123?', options: ['/users/orders/123 to get order 123 for any user', '/users/123/orders to list orders belonging to user 123', '/orders?user=123 is the only valid REST approach for nested resources', '/users.123.orders using dot notation for hierarchical data'], answer: 1, explanation: 'Nested resource URL /users/123/orders expresses the hierarchy: collection -> specific item -> sub-collection. The pattern reads naturally as orders within user 123. Keep nesting to 2-3 levels maximum. For deeply nested resources consider flattening: /orders?userId=123 is an equivalent alternative that is easier to extend with additional filters. Both hierarchical nesting and query-parameter filtering are valid REST approaches.' },
  { q: 'What HTTP method and URL pattern performs a partial update of a user resource?', options: ['POST /users/123 with changed fields only', 'PATCH /users/123 with only the changed fields', 'PUT /users/123/update with the full changed object', 'PUT /users/update/123 with changed fields'], answer: 1, explanation: 'PATCH /users/123 sends only the fields you want to change (partial update). PUT /users/123 replaces the entire resource (full replacement). POST /users creates a new resource. URL verbs like /update, /edit, and /delete are anti-patterns in REST because the HTTP method IS the verb. A well-designed REST URL is a noun path like /users/123 and the HTTP method determines the action.' },
  { q: 'How should filtering, sorting, and pagination be expressed in REST API URLs?', options: ['Dedicated sub-endpoints like /users/filter and /users/sort', 'Query parameters like /users?status=active&sort=name&page=2&limit=20', 'Encoded in the URL path like /users/active/name/2/20', 'HTTP headers exclusively to keep URLs clean and short'], answer: 1, explanation: 'Query parameters are the standard for filtering, sorting, and pagination because they are optional modifiers of the resource collection. /users returns all users; /users?status=active filters; /users?sort=name sorts; /users?page=2&limit=20 paginates. Path parameters identify which resource; query parameters modify how it is retrieved. Encoding filter logic in the path creates an explosion of endpoint variations and is an anti-pattern.' },
  { q: 'What naming convention should REST API URLs use for resource collections?', options: ['CamelCase for all resource names like /userProfiles', 'Plural lowercase nouns with hyphens for multi-word names like /user-profiles', 'Singular PascalCase nouns like /UserProfile', 'UPPERCASE with underscores like /USER_PROFILES'], answer: 1, explanation: 'REST URL convention: plural nouns (/users, /orders), lowercase letters, hyphens for multi-word resources (/user-profiles not /userProfiles or /user_profiles). The collection is plural because /users represents the users collection and /users/123 is a specific item within it. Trailing slashes, file extensions, and verbs in paths are all anti-patterns in REST URL design.' },
  { q: 'What URL structure correctly expresses the relationship orders belonging to user 123?', options: ['/users/orders/123 to get order 123 for any user', '/users/123/orders to list orders belonging to user 123', '/orders?user=123 is the only valid REST approach for nested resources', '/users.123.orders using dot notation for hierarchical data'], answer: 1, explanation: 'Nested resource URL /users/123/orders expresses the hierarchy: collection -> specific item -> sub-collection. The pattern reads naturally as orders within user 123. Keep nesting to 2-3 levels maximum. For deeply nested resources consider flattening: /orders?userId=123 is an equivalent alternative that is easier to extend with additional filters. Both hierarchical nesting and query-parameter filtering are valid REST approaches.' },
  { q: 'What HTTP method and URL pattern performs a partial update of a user resource?', options: ['POST /users/123 with changed fields only', 'PATCH /users/123 with only the changed fields', 'PUT /users/123/update with the full changed object', 'PUT /users/update/123 with changed fields'], answer: 1, explanation: 'PATCH /users/123 sends only the fields you want to change (partial update). PUT /users/123 replaces the entire resource (full replacement). POST /users creates a new resource. URL verbs like /update, /edit, and /delete are anti-patterns in REST because the HTTP method IS the verb. A well-designed REST URL is a noun path like /users/123 and the HTTP method determines the action.' },
  { q: 'How should filtering, sorting, and pagination be expressed in REST API URLs?', options: ['Dedicated sub-endpoints like /users/filter and /users/sort', 'Query parameters like /users?status=active&sort=name&page=2&limit=20', 'Encoded in the URL path like /users/active/name/2/20', 'HTTP headers exclusively to keep URLs clean and short'], answer: 1, explanation: 'Query parameters are the standard for filtering, sorting, and pagination because they are optional modifiers of the resource collection. /users returns all users; /users?status=active filters; /users?sort=name sorts; /users?page=2&limit=20 paginates. Path parameters identify which resource; query parameters modify how it is retrieved. Encoding filter logic in the path creates an explosion of endpoint variations and is an anti-pattern.' },
];

const qna: QnaItem[] = [
  {
    q: 'How should I handle actions that don\'t map to CRUD — like "cancel order" or "send invoice"?',
    a: 'Three approaches: <ol><li><strong>PATCH with status</strong>: <code>PATCH /orders/42 { "status": "cancelled" }</code> — cleanest, REST-aligned, the status field is a first-class attribute</li><li><strong>Sub-resource action</strong>: <code>POST /orders/42/cancellations</code> — models the action as creating a new resource (a cancellation record)</li><li><strong>Verb path</strong>: <code>POST /orders/42/cancel</code> — pragmatic and widely understood, technically RPC-style but popular</li></ol>Prefer option 1 (PATCH with status) when the action is simply a state transition. Use option 2 when the action has its own attributes (cancellation reason, timestamp). Avoid GET for any action with side effects.',
  },
  {
    q: 'Should I version in the URL path (/v1/users) or in headers?',
    a: 'URL versioning (<code>/v1/users</code>) is more discoverable and simpler to test in a browser. Header versioning (<code>Accept: application/vnd.api.v1+json</code>) keeps URLs "clean" but is harder to share and cache. Most public APIs (GitHub, Stripe, Twilio) use URL versioning because it\'s obvious, bookmarkable, and supported by all HTTP clients without special headers. Header versioning is preferred in some enterprise APIs for cache flexibility. Pick one and be consistent.',
  },
  { q: 'What is the difference between path parameters and query parameters?', a: 'Path parameters identify a specific resource or sub-resource and are required parts of the URL. Example: /users/123 where 123 identifies the specific user. Query parameters are optional modifiers that filter, sort, or paginate. Example: /users?role=admin. Rule of thumb: if removing the parameter changes WHICH resource you access, it belongs in the path. If it changes HOW you retrieve or display the resource, it belongs as a query parameter. Path params are for resource identity; query params are for resource retrieval options.' },
  { q: 'What are the key naming conventions for REST resource URLs?', a: 'Use lowercase letters throughout. Separate multi-word resources with hyphens not underscores (user-profiles not user_profiles). Use plural nouns for collections (/users, /orders). Avoid verbs in URLs because the HTTP method is the verb. Avoid file extensions (/users not /users.json - use Accept header for format negotiation). Avoid trailing slashes. Keep URLs short and intuitive. Use consistent patterns across the entire API. Abbreviations that harm readability (/usr, /ord) and implementation-revealing names (/database/users) are anti-patterns.' },
  { q: 'How deep should URL nesting go and when should you flatten relationships?', a: 'Limit nesting to 2-3 levels maximum. /users/123/orders is fine. /users/123/orders/456/items/789/reviews becomes unwieldy and tightly couples clients to the resource hierarchy. Flatten when: the nested URL becomes too long, the sub-resource makes sense independently, or you need to query across parent boundaries. Alternative: use query parameters. /orders?userId=123 is equivalent to /users/123/orders and easier to extend with additional filter criteria. Flattening also makes caching and authorization simpler.' },
  { q: 'What are common URL anti-patterns to avoid in REST API design?', a: 'Avoid verbs in paths: /getUsers, /createOrder, /deleteUser/123 - use HTTP methods instead. Avoid file extensions: /users.json (use Accept header). Avoid inconsistent plurality: mixing /user and /users across the same API. Avoid version numbers inside resource paths: /users/v1/123 (put version at root: /v1/users/123). Avoid implementation-revealing names: /database/users, /table/orders. Avoid deeply nested URLs beyond 3 levels. Avoid abbreviations that reduce readability. Avoid including technology names in URLs like /api/php/users.' },
  { q: 'What is the difference between path parameters and query parameters?', a: 'Path parameters identify a specific resource or sub-resource and are required parts of the URL. Example: /users/123 where 123 identifies the specific user. Query parameters are optional modifiers that filter, sort, or paginate. Example: /users?role=admin. Rule of thumb: if removing the parameter changes WHICH resource you access, it belongs in the path. If it changes HOW you retrieve or display the resource, it belongs as a query parameter. Path params are for resource identity; query params are for resource retrieval options.' },
  { q: 'What are the key naming conventions for REST resource URLs?', a: 'Use lowercase letters throughout. Separate multi-word resources with hyphens not underscores (user-profiles not user_profiles). Use plural nouns for collections (/users, /orders). Avoid verbs in URLs because the HTTP method is the verb. Avoid file extensions (/users not /users.json - use Accept header for format negotiation). Avoid trailing slashes. Keep URLs short and intuitive. Use consistent patterns across the entire API. Abbreviations that harm readability (/usr, /ord) and implementation-revealing names (/database/users) are anti-patterns.' },
  { q: 'How deep should URL nesting go and when should you flatten relationships?', a: 'Limit nesting to 2-3 levels maximum. /users/123/orders is fine. /users/123/orders/456/items/789/reviews becomes unwieldy and tightly couples clients to the resource hierarchy. Flatten when: the nested URL becomes too long, the sub-resource makes sense independently, or you need to query across parent boundaries. Alternative: use query parameters. /orders?userId=123 is equivalent to /users/123/orders and easier to extend with additional filter criteria. Flattening also makes caching and authorization simpler.' },
  { q: 'What are common URL anti-patterns to avoid in REST API design?', a: 'Avoid verbs in paths: /getUsers, /createOrder, /deleteUser/123 - use HTTP methods instead. Avoid file extensions: /users.json (use Accept header). Avoid inconsistent plurality: mixing /user and /users across the same API. Avoid version numbers inside resource paths: /users/v1/123 (put version at root: /v1/users/123). Avoid implementation-revealing names: /database/users, /table/orders. Avoid deeply nested URLs beyond 3 levels. Avoid abbreviations that reduce readability. Avoid including technology names in URLs like /api/php/users.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Resources are plural nouns in kebab-case, identified by path parameters; filtering/sorting/pagination use query parameters; limit nesting to 2 levels.',
  mustKnow: [
    'Plural nouns: /users, /orders, /order-items — never /user or /getOrders',
    'Path params identify a resource (/users/{id}); query params filter/sort/paginate',
    'Limit nesting to 2 levels: /users/{id}/orders is fine; deeper is fragile',
    'kebab-case for multi-word segments: /order-items not /orderItems',
    'GET must never change state — use POST/PATCH/DELETE for mutations',
    'State transitions: PATCH with status field or POST to sub-resource action',
  ],
  interviewFocus: [
    'When would you use a nested URL vs a flat URL with query params?',
    'What is the difference between path parameters and query parameters?',
    'How do you design URLs for non-CRUD operations like "cancel order"?',
  ],
};

@Component({
  selector: 'app-api-resource-url-design',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './resource-url-design.html',
  styleUrl: './resource-url-design.scss',
})
export class ApiResourceUrlDesign {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
