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
  { name: 'Rate Limiting',   type: 'keyword', desc: 'Restrict requests per client per window — prevents brute force, DoS, and credential stuffing.' },
  { name: 'BOLA/IDOR',       type: 'keyword', desc: 'Broken Object Level Authorization — accessing another user\'s resource by changing an ID in the URL.' },
  { name: 'BFLA',            type: 'keyword', desc: 'Broken Function Level Authorization — calling an admin endpoint without the required role.' },
  { name: 'Mass Assignment',  type: 'keyword', desc: 'Attacker sets unexpected fields (isAdmin: true) via over-permissive model binding.' },
  { name: 'API Key',          type: 'keyword', desc: 'Opaque credential for service-to-service auth — rotate regularly, scope to minimum permissions.' },
  { name: 'CORS',             type: 'keyword', desc: 'Cross-Origin Resource Sharing — restrict which origins can call your API.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'OWASP API Security Top 10',
    points: [
      'BOLA (Broken Object Level Authorization): the #1 API vulnerability. Attacker changes `/api/orders/123` to `/api/orders/456` and gets another user\'s order. Fix: verify ownership on every object request.',
      'BFLA (Broken Function Level Authorization): calling admin endpoints without admin role — `/api/admin/users` returns 200 for a regular user. Fix: enforce role/permission checks on every function.',
      'Broken Authentication: missing or weak token validation, no rate limiting on login endpoints, long-lived tokens without rotation.',
      'Unrestricted Resource Consumption: no rate limits, no pagination limits, no file size limits — enables DoS and resource exhaustion.',
      'Excessive Data Exposure: returning full user objects with SSN, salary, internal fields — the frontend only displays a subset, but the API sends everything.',
    ],
  },
  {
    heading: 'Rate Limiting Strategies',
    points: [
      'Fixed window: N requests per minute. Simple but has burst problem at window boundary (2N requests in 2 seconds).',
      'Sliding window log: track each request timestamp; count requests in the past N seconds. Accurate but memory-heavy.',
      'Token bucket: N tokens replenish at a fixed rate; each request consumes a token. Allows controlled bursting.',
      'Apply separate limits per route type: auth endpoints (login, register) = strict (5/min); read endpoints = lenient (100/min); write endpoints = moderate (20/min).',
      'Rate limit by: IP (general), user ID (authenticated), API key (partner). Use all three layers.',
    ],
  },
  {
    heading: 'Input Validation & Mass Assignment',
    points: [
      'Mass assignment: if you bind all request body fields to a model, an attacker can set `isAdmin: true` or `price: 0.01`. Always use an allowlist of accepted fields.',
      'Validate input at the API boundary — type, format, length, range. Use a validation library (Zod, class-validator, Joi).',
      'Validate business rules too: a quantity of -1 or a discount of 200% may be structurally valid JSON but logically invalid.',
      'Sanitize file uploads: validate MIME type server-side (not client-supplied Content-Type), scan with antivirus, store outside webroot.',
    ],
  },
  {
    heading: 'CORS, API Keys, and Secrets',
    points: [
      'CORS: only allow origins you explicitly trust. `Access-Control-Allow-Origin: *` is fine for public read-only APIs; never use it for authenticated APIs.',
      'API keys: store hashed (SHA-256) in DB — only compare hashes. Prefix keys for easy scanning (`sk_live_...`). Rotate on compromise.',
      'Never log API keys, tokens, or passwords — they end up in log aggregation tools (Splunk, Datadog) and are exfiltrated in log breaches.',
      'Secrets in environment variables: acceptable for configuration, but use a secrets manager (AWS Secrets Manager, HashiCorp Vault) for production — enables rotation without redeployment.',
    ],
  },
  {
    heading: 'API Rate Limiting and Abuse Prevention',
    points: [
      'Rate limiting protects APIs from brute-force credential attacks and denial-of-service abuse by capping how many requests a client (per IP, per API key, or per authenticated account) can make in a time window, returning 429 Too Many Requests when exceeded.',
      'Apply stricter limits to sensitive endpoints (login, password reset, token issuance) than to general read endpoints — these are the highest-value targets for automated attack tools and deserve tighter default thresholds.',
      'Distributed rate limiting (using Redis or a similar shared store) is required in any horizontally-scaled deployment — per-instance in-memory counters allow an attacker to multiply their effective limit by the number of server instances.',
      'Combine rate limiting with anomaly detection where possible — a sudden spike in failed authentication attempts from a single account, even under the rate limit, can indicate a credential-stuffing attempt worth flagging separately.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Rate Limiting + BOLA Prevention',
    language: 'typescript',
    code: `import rateLimit from 'express-rate-limit';
import { z } from 'zod';

// ── Rate limiter for auth endpoints ──────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs:         60 * 1000, // 1 minute
  max:              5,          // 5 attempts per IP per minute
  message:          { error: 'Too many attempts — try again in a minute' },
  standardHeaders:  true,
  legacyHeaders:    false,
  keyGenerator:     (req) => req.ip ?? 'unknown',
});

const apiLimiter = rateLimit({ windowMs: 60 * 1000, max: 100 });

app.use('/api/', apiLimiter);
app.post('/api/auth/login',    authLimiter, login);
app.post('/api/auth/register', authLimiter, register);

// ── BOLA prevention — verify object ownership ─────────────────────────────
app.get('/api/orders/:id', requireAuth, async (req, res) => {
  const order = await db.orders.findById(req.params.id);

  if (!order) return res.status(404).json({ error: 'Not found' });

  // CRITICAL: verify the authenticated user owns this resource
  if (order.userId !== req.user.sub) {
    return res.status(403).json({ error: 'Access denied' }); // NOT 404 — don't leak existence
  }

  res.json(order);
});

// ── Mass assignment prevention with Zod ───────────────────────────────────
const UpdateOrderSchema = z.object({
  quantity:    z.number().int().min(1).max(100),
  notes:       z.string().max(500).optional(),
  // NOT: userId, isAdmin, price, status — these must not be user-settable
});

app.patch('/api/orders/:id', requireAuth, async (req, res) => {
  const parsed = UpdateOrderSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const order = await db.orders.findById(req.params.id);
  if (!order || order.userId !== req.user.sub) return res.status(403).json({ error: 'Access denied' });

  const updated = await db.orders.update(req.params.id, parsed.data); // only allowlisted fields
  res.json(updated);
});`,
  },
  {
    label: 'API Key Management',
    language: 'typescript',
    code: `import crypto from 'crypto';

// ── Issue API key — store hash, return plaintext once ─────────────────────
async function createApiKey(userId: string, label: string): Promise<{ key: string }> {
  // Prefixed for easy GitHub/scanner detection: "sk_live_..."
  const rawKey = \`sk_live_\${crypto.randomBytes(32).toString('hex')}\`;
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

  await db.apiKeys.create({
    userId,
    label,
    keyHash,       // store the hash — never the raw key
    createdAt: new Date(),
    lastUsedAt: null,
  });

  return { key: rawKey }; // show once; user must copy it
}

// ── Validate API key on each request ─────────────────────────────────────
async function validateApiKey(rawKey: string) {
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
  const record  = await db.apiKeys.findByHash(keyHash);
  if (!record) return null;

  await db.apiKeys.updateLastUsed(record.id); // track usage for rotation decisions
  return record;
}

// ── Middleware ────────────────────────────────────────────────────────────
app.use('/api/v1/', async (req, res, next) => {
  const key = req.headers['x-api-key'];
  if (!key || typeof key !== 'string') return res.status(401).json({ error: 'API key required' });

  const record = await validateApiKey(key);
  if (!record) return res.status(401).json({ error: 'Invalid API key' });

  (req as any).apiKeyRecord = record;
  next();
});`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Not checking object ownership (BOLA / IDOR)',
    wrong: `// Returns order by ID with no ownership check
app.get('/api/orders/:id', requireAuth, async (req, res) => {
  const order = await db.orders.findById(req.params.id);
  res.json(order); // attacker changes ID to access any order
});`,
    right: `app.get('/api/orders/:id', requireAuth, async (req, res) => {
  const order = await db.orders.findById(req.params.id);
  if (!order || order.userId !== req.user.sub) return res.status(403).json({ error: 'Access denied' });
  res.json(order);
});`,
    explanation: 'BOLA (Broken Object Level Authorization) is the #1 API vulnerability. Always verify that the authenticated user owns or is authorized to access the specific object they are requesting — never trust a client-supplied ID alone.',
  },
  {
    title: 'Using `Access-Control-Allow-Origin: *` on authenticated endpoints',
    wrong: `// Allows ANY site to call your authenticated API
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Credentials', 'true'); // also wrong with *`,
    right: `const ALLOWED_ORIGINS = ['https://app.example.com', 'https://admin.example.com'];
const origin = req.headers.origin;
if (ALLOWED_ORIGINS.includes(origin ?? '')) {
  res.setHeader('Access-Control-Allow-Origin', origin!);
}`,
    explanation: '`Access-Control-Allow-Origin: *` allows any website to make cross-origin requests to your API. Fine for public CDN assets; never for authenticated APIs. Browsers also prohibit combining `*` with `Allow-Credentials: true`.',
  },
  {
    title: 'Exposing excessive data in API responses',
    wrong: `// Returns full DB row including internal fields
res.json(await db.users.findById(userId));
// Response: { id, email, passwordHash, ssn, salary, internalNotes, ... }`,
    right: `const user = await db.users.findById(userId);
res.json({ id: user.id, email: user.email, displayName: user.displayName }); // explicit allowlist`,
    explanation: 'Returning the full DB model sends sensitive internal fields to clients. Always project to an explicit allowlist of fields. A client that only displays `email` and `name` should not receive `passwordHash`, `ssn`, or `salary`.',
  },
  {
    title: 'Logging API keys and tokens',
    wrong: `console.log('Request received:', req.headers); // logs Authorization: Bearer eyJ...
logger.info({ body: req.body }); // logs { apiKey: 'sk_live_abc...' }`,
    right: `logger.info({
  method: req.method,
  path:   req.path,
  userId: req.user?.sub,
  // Never log: headers.authorization, body.password, body.apiKey
});`,
    explanation: 'Logging tokens and API keys causes them to appear in log aggregation tools, monitoring dashboards, and cloud storage — all of which may have weaker access controls than the API itself. Redact sensitive fields before logging.',
  },
];

const challenge: Challenge = {
  title: 'BOLA-Safe Endpoint',
  language: 'typescript',
  description: `Implement safeGetOrder(userId: string, orderId: string, db: DB): Promise<Order | null> that:
1. Fetches the order by orderId
2. Returns null if the order doesn't exist
3. Returns null (and does NOT throw) if order.userId !== userId
4. Returns the order only if the requesting user owns it`,
  hints: [
    'Return null consistently for not-found and unauthorized — same response prevents enumeration',
    'Always check ownership before returning',
  ],
  starterCode: `interface Order { id: string; userId: string; total: number; items: string[]; }
interface DB { orders: { findById(id: string): Promise<Order | null> } }

async function safeGetOrder(userId: string, orderId: string, db: DB): Promise<Order | null> {
  // TODO
  return null;
}`,
  solution: `interface Order { id: string; userId: string; total: number; items: string[]; }
interface DB { orders: { findById(id: string): Promise<Order | null> } }

async function safeGetOrder(userId: string, orderId: string, db: DB): Promise<Order | null> {
  const order = await db.orders.findById(orderId);
  if (!order) return null;
  if (order.userId !== userId) return null; // same response — prevents ID enumeration
  return order;
}

// Test
const fakeDb = {
  orders: {
    findById: async (id: string) =>
      id === 'order-1' ? { id: 'order-1', userId: 'user-A', total: 99, items: ['item1'] } : null
  }
};
console.log(await safeGetOrder('user-A', 'order-1', fakeDb)); // order
console.log(await safeGetOrder('user-B', 'order-1', fakeDb)); // null (unauthorized)
console.log(await safeGetOrder('user-A', 'order-99', fakeDb)); // null (not found)`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What is BOLA (Broken Object Level Authorization)?',
    options: [
      'Using HTTP instead of HTTPS for API requests',
      'Accessing another user\'s resource by changing an ID in the URL (e.g., /orders/123 → /orders/456)',
      'Calling an admin endpoint with a regular user\'s token',
      'Returning too many fields in an API response',
    ],
    answer: 1,
    explanation: 'BOLA is the #1 API security vulnerability per OWASP. The fix is always checking object ownership: after fetching a resource by ID, verify that the authenticated user is authorized to access that specific object — not just authenticated.',
  },
  {
    q: 'What is mass assignment and how is it prevented?',
    options: [
      'Sending too many requests per second — prevented by rate limiting',
      'Binding all request fields to a model — prevented by using an allowlist of accepted fields (Zod schema)',
      'Returning too many records — prevented by pagination',
      'SQL injection via form fields — prevented by parameterized queries',
    ],
    answer: 1,
    explanation: 'Mass assignment: if you bind all request body fields to a model, attackers can set internal fields like `isAdmin: true` or `price: 0.01`. Prevention: validate and allowlist exactly which fields can be set via a schema (Zod, class-validator, Joi).',
  },
  { q: 'What is the principle of least privilege in API security?', options: ['APIs should use the least number of HTTP verbs', 'Each API client should be granted only the minimum permissions required to perform its intended function', 'APIs should return the least amount of data possible', 'API tokens should expire as quickly as possible'], answer: 1, explanation: 'Principle of least privilege: grant each client only the specific scopes and permissions it needs for its intended function. A read-only analytics client should not have write permissions on orders. A mobile app should not have access to admin endpoints. Implement via OAuth 2.0 scopes: the analytics client requests read:orders scope; write:orders is not in its access token. If that client is compromised, the blast radius is limited to read-only access. Review permissions regularly and remove any that are no longer needed.' },
  { q: 'What is API rate limiting and what attacks does it prevent?', options: ['A limit on the size of API responses', 'Restricting how many requests a client can make in a time window, preventing brute force, credential stuffing, and denial-of-service attacks', 'A limit on the number of API endpoints an application can expose', 'Restricting API access to specific geographic regions'], answer: 1, explanation: 'Rate limiting caps the number of API requests a client can make in a time window (e.g., 100 requests per minute per API key). Attacks prevented: brute force (trying thousands of password combinations — rate-limited to prevent exhaustive search). Credential stuffing (replaying leaked credential lists — limited call volume reduces effectiveness). DoS protection (a buggy or malicious client flooding the API — rate limiting caps damage). Implement via sliding window counters in Redis. Return HTTP 429 with a Retry-After header when the limit is exceeded.' },
  { q: 'What is CORS and when must you configure it carefully in APIs?', options: ['Cross-Origin Resource Sharing; a mechanism that controls which web origins can call an API from a browser', 'A caching strategy for API responses across multiple regions', 'A rate limiting technique for cross-domain API traffic', 'A cryptographic protocol for securing cross-service communication'], answer: 0, explanation: 'CORS (Cross-Origin Resource Sharing) is a browser security feature. When JavaScript on origin-A tries to call an API on origin-B, the browser first sends a preflight OPTIONS request. The API responds with Access-Control-Allow-Origin indicating which origins are permitted. Misconfiguration risks: setting Access-Control-Allow-Origin: * with Access-Control-Allow-Credentials: true allows any malicious site to make credentialed API calls from a victim browser. Always set specific allowed origins. Never combine wildcard origin with credentials. Validate the Origin header server-side and do not simply echo it back.' },
  { q: 'What is HMAC request signing and when do you need it beyond HTTPS?', options: ['A way to encrypt API payloads in addition to TLS', 'Signing HTTP requests with a shared secret so the server can verify the request was not tampered with and came from the authorized client, even over TLS', 'A method for hashing API keys before storing them', 'Signing API responses to prevent data modification by intermediaries'], answer: 1, explanation: 'HTTPS encrypts the transport but does not prove that the request body was not modified by a man-in-the-middle proxy, or that the client is who it claims to be beyond the API key. HMAC signing: the client computes HMAC(secretKey, canonicalRequest) where canonicalRequest includes the HTTP method, path, headers, and body hash. The server recomputes the HMAC and compares. Benefits: request body integrity (tampering changes the HMAC). Replay attack prevention (include a timestamp and nonce in the signed message). Used by AWS Signature Version 4, Stripe webhook signatures, and payment APIs.' },
];

const qna: QnaItem[] = [
  {
    q: 'What is the difference between BOLA and BFLA?',
    a: '<strong>BOLA (Broken Object Level Authorization)</strong>: accessing another user\'s specific resource by changing an object ID — e.g., <code>/api/orders/456</code> returns user B\'s order to user A. Fix: check ownership on every object fetch. <strong>BFLA (Broken Function Level Authorization)</strong>: calling a function (endpoint) that requires elevated privileges without having them — e.g., a regular user calling <code>/api/admin/users/delete</code> and it succeeds. Fix: enforce role/permission middleware on every function.',
  },
  {
    q: 'How should you handle resource not found vs. access denied in APIs?',
    a: 'Return the SAME response (403 or 404) for both not-found and unauthorized on resources the user shouldn\'t know about. If you return 404 for non-existent and 403 for existing-but-unauthorized, an attacker can enumerate which IDs exist by observing the response code. Common pattern: if object not found OR not owned, return 403 "Access denied" — this prevents ID enumeration while avoiding the security-through-obscurity of always returning 404.',
  },
  { q: 'How do you prevent API key leakage in client applications?', a: 'API keys in client-side code (JavaScript, mobile apps) are visible to anyone who inspects the code or network traffic. Prevention strategies: never embed production API keys in frontend JavaScript. Use a backend proxy: the frontend calls your own backend which holds the API key and calls the third-party API. For mobile apps, use certificate pinning and obfuscation but accept that determined attackers can extract keys. Restrict API keys by referrer (browser key restrictions), IP address, or bundle ID where the provider supports it. Use short-lived tokens derived from a server-side flow (OAuth 2.0) instead of static API keys for sensitive operations. Rotate keys regularly and monitor for unusual usage patterns.' },
  { q: 'What is the difference between authentication and authorization in API security?', a: 'Authentication: who is this caller? Verifies identity by validating credentials (API key, JWT, client certificate). The server confirms the requester is who they claim to be. Authorization: what is this caller allowed to do? After authentication, checks whether the authenticated identity has permission to perform the requested action on the requested resource. Example: a valid JWT proves you are user ID 42 (authentication). Whether user 42 is allowed to DELETE /orders/999 depends on authorization rules (is user 42 the owner of order 999 or an admin?). APIs should implement both: reject unauthenticated requests first, then perform fine-grained authorization checks per operation.' },
  { q: 'How do you securely handle API versioning during security patches?', a: 'Security patches often require breaking changes (removing vulnerable endpoints, changing authentication schemes). Versioning strategies for security: maintain old versions only as long as clients can migrate. Clearly document the deprecation timeline. For critical vulnerabilities, force migration faster by disabling the vulnerable version with an HTTP 410 Gone response. Communicate via multiple channels (email, API documentation, status page). When patching without versioning: use feature flags to enable the fix for clients that have opted in. For JWT algorithm confusion vulnerabilities, block the dangerous algorithm in the same version without a new endpoint. Monitor usage of deprecated endpoints to track migration progress.' },
  { q: 'What is an API gateway and what security responsibilities does it handle?', a: 'An API gateway sits between clients and backend services, handling cross-cutting security concerns: authentication and authorization (validate JWT or API keys before requests reach services). Rate limiting and throttling (protect backends from overload). TLS termination (manage certificates centrally). Request validation (schema validation, size limits). WAF integration (block known attack patterns). Logging and monitoring (centralized audit trail of all API calls). IP allowlisting and geolocation blocking. The gateway pattern avoids duplicating these security controls in every backend service. Examples: AWS API Gateway, Kong, Azure API Management, NGINX. Backends can trust that incoming requests from the gateway have already passed authentication and rate limiting checks.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Secure APIs: check object ownership (BOLA), enforce role checks on every function (BFLA), rate limit auth endpoints, validate with allowlists (no mass assignment), and never log tokens.',
  mustKnow: [
    'BOLA: change ID → access other user\'s object. Fix: verify ownership on every object request',
    'BFLA: call admin endpoint without admin role. Fix: permission middleware on every function',
    'Rate limiting: auth endpoints 5/min, read 100/min; apply per-IP and per-user',
    'Mass assignment: bind only allowlisted fields (Zod schema) — never all body fields',
    'CORS: whitelist specific origins for authenticated APIs — never `Access-Control-Allow-Origin: *`',
    'API keys: store SHA-256 hash in DB; never log raw keys or tokens',
  ],
  interviewFocus: [
    'What is BOLA and how do you prevent it?',
    'Explain mass assignment and how Zod prevents it',
    'How would you design rate limiting for a login endpoint?',
  ],
};

@Component({
  selector: 'app-sec-api-security',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './api-security.html',
  styleUrl: './api-security.scss',
})
export class SecApiSecurity {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
