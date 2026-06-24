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
