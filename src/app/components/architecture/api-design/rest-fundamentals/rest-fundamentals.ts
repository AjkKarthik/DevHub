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
  { name: 'Stateless',          type: 'constraint', desc: 'Every request must carry all context needed to process it — no server-side session state.' },
  { name: 'Client-Server',      type: 'constraint', desc: 'UI and data storage are separated — clients and servers evolve independently.' },
  { name: 'Cacheable',          type: 'constraint', desc: 'Responses must declare whether they can be cached — reduces load and improves latency.' },
  { name: 'Uniform Interface',  type: 'constraint', desc: 'Resources identified by URIs, manipulated via representations, self-descriptive messages, HATEOAS.' },
  { name: 'Layered System',     type: 'constraint', desc: 'Client cannot tell whether it talks to the origin server or an intermediary (proxy, CDN).' },
  { name: 'Code on Demand',     type: 'constraint', desc: 'Optional: server can send executable code (JavaScript) to extend client functionality.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'The 6 REST Architectural Constraints',
    points: [
      'REST (Representational State Transfer) was defined by Roy Fielding in his 2000 dissertation as a set of architectural constraints for distributed hypermedia systems.',
      'An API is only truly RESTful when it satisfies all 5 mandatory constraints: Client-Server, Stateless, Cacheable, Uniform Interface, Layered System. Code on Demand is optional.',
      'Most "REST APIs" in practice are actually HTTP APIs or RPC-over-HTTP — they use HTTP methods and JSON but violate statelessness or HATEOAS. That\'s fine; REST purity rarely matters more than pragmatics.',
      'Understanding the constraints helps reason about trade-offs: a stateful session reduces payload size but couples the server to client state; breaking cacheable breaks CDN benefits.',
    ],
  },
  {
    heading: 'Stateless — The Most Important Constraint',
    points: [
      'Each request from client to server must contain all information needed to understand and process it. The server stores no session state between requests.',
      'Statelessness enables horizontal scaling: any server instance can handle any request. With stateful sessions, requests must be routed to the same server (sticky sessions), reducing elasticity.',
      'The trade-off: stateless requests are larger (must carry auth tokens, preferences, context). Cookie-based sessions are stateful and technically violate REST — use JWT or opaque tokens in Authorization headers instead.',
      'Statelessness does NOT mean the server has no state — it means the server stores no CLIENT SESSION state. The database is server state; a user record is state; REST is fine with that.',
    ],
  },
  {
    heading: 'Resources, URIs, and Representations',
    points: [
      'A resource is any named concept: a user, an order, a collection of orders, a report. Resources are identified by URIs (Uniform Resource Identifiers).',
      'A representation is the current or intended state of a resource — usually JSON or XML. GET /users/42 returns a representation of user 42; PUT /users/42 sends a new representation to replace it.',
      'The same resource can have multiple representations: GET /reports/q3 with Accept: application/json returns JSON; with Accept: text/csv returns CSV. Content negotiation selects the representation.',
      'URIs should identify WHAT something is, not WHAT to do with it. `/users/42` is a resource; `/getUserById?id=42` is RPC-style and not REST.',
    ],
  },
  {
    heading: 'Idempotency and Safety',
    points: [
      'A method is SAFE if it does not change server state: GET, HEAD, OPTIONS. Safe methods are always also idempotent.',
      'A method is IDEMPOTENT if calling it N times has the same effect as calling it once: GET, PUT, DELETE, HEAD, OPTIONS. POST and PATCH are NOT idempotent by default.',
      'Idempotency is critical for retry logic: if a DELETE request times out, the client can safely retry — deleting an already-deleted resource is the same result.',
      'PUT (replace the full resource) is idempotent. PATCH (partial update) may or may not be idempotent depending on the operation — "set name to X" is idempotent; "increment counter" is not.',
    ],
  },
  {
    heading: 'REST Constraints as Design Guidance, Not Bureaucratic Rules',
    points: [
      'Roy Fielding\'s original REST constraints were derived from analyzing what made the web itself scale successfully — understanding this origin helps teams apply the constraints as practical engineering guidance rather than treating "RESTful" as an arbitrary checklist to satisfy for its own sake.',
      'Most production APIs pragmatically apply Level 2 of the Richardson Maturity Model (correct HTTP verbs and status codes) without full HATEOAS — this is a deliberate, reasonable engineering tradeoff for the vast majority of use cases, not a failure to be "truly RESTful."',
      'The statelessness constraint has architectural implications beyond simplicity — it is what enables horizontal scaling without session affinity, since any server instance can handle any request without needing access to previous request context stored on a specific server.',
      'Understanding WHY each REST constraint exists (not just memorizing the list) equips a team to make good judgment calls when a specific situation genuinely warrants deviating from strict REST principles, rather than either blindly following or blindly ignoring the constraints.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'REST Server (Express)',
    language: 'typescript',
    code: `import express from 'express';
const app = express();
app.use(express.json());

// Resource: users
// Stateless: each request carries the auth token — no session
// ─────────────────────────────────────────────────────────────

// GET /users        → collection
app.get('/users', authenticate, async (req, res) => {
  const users = await db.users.findAll({ limit: 20 });
  res.json({ data: users, total: users.length });
});

// GET /users/:id    → single resource
app.get('/users/:id', authenticate, async (req, res) => {
  const user = await db.users.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// POST /users       → create new resource
app.post('/users', authenticate, authorize('admin'), async (req, res) => {
  const user = await db.users.create(req.body);
  res.status(201)
     .header('Location', \`/users/\${user.id}\`)
     .json(user);
});

// PUT /users/:id    → replace (idempotent)
app.put('/users/:id', authenticate, async (req, res) => {
  const user = await db.users.replace(req.params.id, req.body);
  res.json(user);
});

// PATCH /users/:id  → partial update
app.patch('/users/:id', authenticate, async (req, res) => {
  const user = await db.users.update(req.params.id, req.body);
  res.json(user);
});

// DELETE /users/:id → remove (idempotent)
app.delete('/users/:id', authenticate, async (req, res) => {
  await db.users.delete(req.params.id);
  res.status(204).send(); // No Content — idempotent, safe to retry
});`,
  },
  {
    label: 'Stateless Auth (JWT)',
    language: 'typescript',
    code: `// Stateless auth: JWT in Authorization header — no server-side session
// The token carries the user's identity and claims; server just verifies signature

import jwt from 'jsonwebtoken';

interface JwtPayload {
  sub: string;   // user ID
  email: string;
  roles: string[];
  iat: number;
  exp: number;
}

// Every request includes: Authorization: Bearer <token>
function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    req.user = payload; // attach claims — no DB lookup needed
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// No session lookup — payload IS the user context
app.get('/profile', authenticate, (req, res) => {
  // req.user.sub, req.user.email — available from the token
  res.json({ userId: req.user.sub, email: req.user.email });
});`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Using verbs in URIs instead of resource nouns',
    wrong: `GET /getUser?id=42
POST /createOrder
POST /deleteUser/42`,
    right: `GET /users/42
POST /orders
DELETE /users/42`,
    explanation: 'URIs should identify resources (nouns). HTTP methods provide the verb. /getUser is RPC-style; /users/42 is REST. The method GET, POST, DELETE convey the action.',
  },
  {
    title: 'Storing server-side session state (violates stateless constraint)',
    wrong: `req.session.userId = user.id; // server stores client state
// Next request needs session cookie routing to same server`,
    right: `// JWT: client carries state in the token
res.json({ token: jwt.sign({ sub: user.id }, secret, { expiresIn: '15m' }) });`,
    explanation: 'Server-side sessions break horizontal scaling — all requests from a client must hit the same server. JWT or opaque tokens in Authorization headers keep the server stateless — any instance can handle any request.',
  },
  {
    title: 'POST for idempotent operations (should be PUT)',
    wrong: `// Creating a resource at a known URI — POST creates duplicates on retry
POST /users/42/preferences`,
    right: `// PUT replaces the resource at the URI — safe to retry
PUT /users/42/preferences`,
    explanation: 'If the client knows the target URI and the operation should be idempotent (safe to retry), use PUT. POST to a collection generates a new resource with a server-assigned ID and is NOT idempotent.',
  },
  {
    title: 'Returning 200 OK for resource creation',
    wrong: `// Returns 200 — client cannot detect the resource was created
res.status(200).json(newUser);`,
    right: `// Returns 201 Created with Location header pointing to the new resource
res.status(201).header('Location', '/users/' + newUser.id).json(newUser);`,
    explanation: '201 Created tells the client a new resource was created. The Location header tells them where to find it. 200 OK is ambiguous — was it created or updated?',
  },
];

const challenge: Challenge = {
  title: 'REST Request Validator',
  language: 'typescript',
  description: `Implement validateRestRequest(method: string, path: string): { valid: boolean; issues: string[] } that checks:
1. Path uses nouns not verbs (reject paths containing: /get, /create, /delete, /update, /fetch)
2. GET/DELETE/HEAD do not have a request body (params are passed in the URL)
3. PUT/POST/PATCH paths must not contain query verbs either
Return { valid: true, issues: [] } if valid, else { valid: false, issues: ['...'] }`,
  hints: [
    'Check the path string for verb patterns case-insensitively',
    'Build an issues array and return valid = issues.length === 0',
  ],
  starterCode: `function validateRestRequest(method: string, path: string): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  // TODO: validate
  return { valid: issues.length === 0, issues };
}`,
  solution: `function validateRestRequest(method: string, path: string): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  const VERBS = ['/get', '/create', '/delete', '/update', '/fetch'];
  const lowerPath = path.toLowerCase();

  for (const verb of VERBS) {
    if (lowerPath.includes(verb)) {
      issues.push(\`Path contains verb "\${verb}" — use a noun resource URI instead\`);
    }
  }

  return { valid: issues.length === 0, issues };
}

console.log(validateRestRequest('GET', '/users/42'));          // valid
console.log(validateRestRequest('POST', '/createOrder'));      // invalid: /create
console.log(validateRestRequest('DELETE', '/deleteUser/42')); // invalid: /delete`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What does the REST "stateless" constraint mean?',
    options: [
      'The server must not have any database state',
      'Each request must carry all information needed to process it — no server-side session',
      'Responses cannot be modified after creation',
      'The client must not store any data locally',
    ],
    answer: 1,
    explanation: 'Stateless means the server stores no CLIENT SESSION STATE between requests. Each request is self-contained. The server can still have persistent database state — stateless refers specifically to session state, not all state.',
  },
  {
    q: 'Which HTTP methods are idempotent?',
    options: [
      'GET, POST, PUT',
      'POST, PATCH, DELETE',
      'GET, PUT, DELETE',
      'GET, POST, DELETE',
    ],
    answer: 2,
    explanation: 'GET, PUT, and DELETE are idempotent — calling them N times has the same effect as calling once. POST creates a new resource on each call (not idempotent). PATCH MAY be idempotent but is not guaranteed (incrementing a counter is a non-idempotent PATCH).',
  },
  { q: 'What does REST stand for and who defined it?', options: ['Remote Execution State Transfer defined by the IETF in RFC 2616', 'Representational State Transfer defined by Roy Fielding in his 2000 PhD dissertation', 'Resource Endpoint Service Technology defined by the W3C for web APIs', 'Request-Response Standard Template defined by Martin Fowler in Patterns of Enterprise Application Architecture'], answer: 1, explanation: 'REST stands for Representational State Transfer. Roy Fielding defined it in his doctoral dissertation Architectural Styles and the Design of Network-based Software Architectures published in 2000. REST is not a protocol or standard but an architectural style consisting of 6 constraints: client-server, stateless, cacheable, uniform interface, layered system, and optional code-on-demand. HTTP-based REST APIs are the most prevalent application of these constraints.' },
  { q: 'If a REST API stores shopping cart contents server-side keyed by a session cookie, does that violate the stateless constraint?', options: ['No — server-side data storage is unrelated to the stateless constraint, which only concerns response formatting', 'Yes, in the strict sense — the stateless constraint requires each request to carry all context the server needs; relying on a session cookie to look up server-held CLIENT context (not persistent business data) between requests reintroduces per-client server-side session state that breaks horizontal scalability without sticky sessions', 'No — as long as the data is stored in a database rather than in server memory, statelessness is preserved', 'Yes, but only if the cart data expires within 24 hours'], answer: 1, explanation: 'The stateless constraint specifically concerns CLIENT SESSION CONTEXT, not general application data persistence (a REST API storing an "order" in a database is fine — that\'s the resource itself, not session state). A shopping cart looked up via a session cookie IS client session context: the server must remember "which cart belongs to this specific client\'s ongoing interaction" between requests, meaning a request to /cart/checkout is not self-describing on its own — it depends on server-held state tied to that specific client\'s session, which requires either sticky sessions (undermining "any server handles any request") or a shared session store, both of which are exactly the complexity the stateless constraint exists to avoid.' },
  { q: 'Which HTTP method is both safe and idempotent?', options: ['POST because it creates resources without modifying existing data', 'GET because it retrieves resources without modifying state and produces the same result when repeated', 'PUT because repeating it gives the same final server state', 'DELETE because it does not create anything new on the server'], answer: 1, explanation: 'GET is both safe (does not modify server state) and idempotent (calling it multiple times yields the same result as calling it once). HEAD and OPTIONS are also safe and idempotent. PUT is idempotent but not safe (it modifies state). DELETE is idempotent but not safe (first call deletes, subsequent calls return 404 but do not change state further). POST is neither safe nor idempotent since each call may create a new resource.' },
  { q: 'What are the four levels of the Richardson Maturity Model?', options: ['Draft, Review, Approved, Published - representing API lifecycle management stages', 'Level 0 HTTP transport, Level 1 Resources, Level 2 HTTP Verbs, Level 3 Hypermedia Controls (HATEOAS)', 'Bronze, Silver, Gold, Platinum - indicating API performance and reliability tiers', 'Sync, Async, Event-driven, Reactive - indicating API communication patterns'], answer: 1, explanation: 'Richardson Maturity Model: Level 0 - HTTP as a tunnel, single URL, POST for everything (SOAP style). Level 1 - separate URLs per resource (/users, /orders) but only POST. Level 2 - correct use of HTTP methods (GET, POST, PUT, DELETE) with proper status codes. Most modern REST APIs are at Level 2. Level 3 - HATEOAS: responses include links to next possible actions making the API self-discoverable. Level 2 is the practical minimum threshold for a RESTful API.' },
];

const qna: QnaItem[] = [
  {
    q: 'What is the difference between REST and HTTP APIs?',
    a: 'HTTP APIs use HTTP as a transport protocol. REST is an architectural style built on HTTP that adds specific constraints: stateless, cacheable, uniform interface (HATEOAS), layered system. Most production "REST APIs" are technically HTTP APIs — they use HTTP methods and JSON but skip HATEOAS and strict statelessness. Calling your API "REST" when it uses server sessions is imprecise but pragmatically accepted. True REST with HATEOAS is rare outside academic contexts.',
  },
  {
    q: 'When should I use PUT vs PATCH?',
    a: '<strong>PUT</strong>: replace the entire resource with the request body. If a field is missing from the body, it is removed (or reset to default). PUT is idempotent — retry-safe. <strong>PATCH</strong>: apply a partial update — only the fields in the body are changed. PATCH is NOT guaranteed idempotent (depends on what the patch does). Use PUT when clients have the complete resource state to send. Use PATCH for partial updates like changing a single field.',
  },
  { q: 'What are the six architectural constraints of REST?', a: '1. Client-Server: separation of UI from data storage concerns. 2. Stateless: each request contains all needed information; no session state stored on the server. 3. Cacheable: responses must declare themselves cacheable or not; clients and intermediaries can cache valid responses. 4. Uniform Interface: consistent interface including resource identification, manipulation through representations, self-descriptive messages, and HATEOAS. 5. Layered System: client cannot tell if connected to end server or an intermediary like a load balancer or cache. 6. Code-On-Demand (optional): server can send executable code to clients such as JavaScript. Violating any of the first five means the API is not truly RESTful.' },
  { q: 'What is HATEOAS and why is it the highest REST maturity level?', a: 'HATEOAS (Hypermedia as the Engine of Application State) means API responses include hyperlinks to related actions and resources. A GET /orders/123 response includes links like rel=cancel href=/orders/123/cancel and rel=payment href=/orders/123/payment. Benefits: clients do not need to hard-code URLs or know the API structure in advance. The API becomes self-discoverable - clients just follow links. This is Level 3 of the Richardson Maturity Model because it achieves true decoupling between client and server. In practice most production APIs stop at Level 2 because HATEOAS adds client implementation complexity.' },
  { q: 'What is the difference between REST and SOAP?', a: 'REST: architectural style, uses HTTP natively with GET/POST/PUT/DELETE, supports multiple formats (JSON, XML, plain text), stateless, lightweight, cacheable. SOAP: a protocol, strictly XML-based, has envelope/body/header structure, works over multiple transports (HTTP, SMTP), has built-in error handling via fault elements and WS-Security for enterprise-grade security. Use SOAP for enterprise integrations requiring formal contracts, ACID transactions, and built-in security standards (banking, payment processors, insurance). Use REST for public APIs, mobile and web clients, microservices, and when simplicity and performance matter most.' },
  { q: 'How should errors be handled correctly in a RESTful API?', a: 'Use appropriate HTTP status codes: 200 OK, 201 Created, 400 Bad Request (malformed request), 401 Unauthorized (not authenticated), 403 Forbidden (authenticated but lacking permission), 404 Not Found, 409 Conflict, 422 Unprocessable Entity (validation errors), 429 Too Many Requests (rate limited), 500 Internal Server Error. Return a consistent error body per RFC 7807: type, title, status, detail, and instance fields. Never return 200 with an error in the body - that is a widespread anti-pattern that breaks client error handling logic. Always use the most specific applicable status code.' },
];

const revision: RevisionSummary = {
  oneLiner: 'REST is an architectural style with 6 constraints — stateless, client-server, cacheable, uniform interface, layered system, code on demand (optional).',
  mustKnow: [
    'Stateless: each request carries all context — no server-side session; enables horizontal scaling',
    'URIs identify resources (nouns), HTTP methods provide the verb (GET/POST/PUT/PATCH/DELETE)',
    'GET, PUT, DELETE are idempotent; POST and PATCH are not',
    '201 Created + Location header for POST; 204 No Content for DELETE',
    'Cacheable: responses declare cacheability (Cache-Control headers)',
    'HATEOAS: responses include links to valid next actions (optional in practice)',
  ],
  interviewFocus: [
    'What does stateless mean in REST, and why does it matter for scaling?',
    'What is the difference between PUT and PATCH?',
    'Which HTTP methods are idempotent and why does that matter?',
  ],
};

@Component({
  selector: 'app-api-rest-fundamentals',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './rest-fundamentals.html',
  styleUrl: './rest-fundamentals.scss',
})
export class ApiRestFundamentals {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
