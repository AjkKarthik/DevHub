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
  { name: 'API Key',         type: 'keyword', desc: 'Static secret string in Authorization header or query param — simple but no expiry; rotate on compromise.' },
  { name: 'JWT Bearer',      type: 'keyword', desc: 'Short-lived signed token in Authorization: Bearer <token> — verify signature + exp + iss claims server-side.' },
  { name: 'OAuth 2.0',       type: 'keyword', desc: 'Delegation protocol — user grants app limited access to their data without sharing credentials.' },
  { name: 'HTTPS/TLS',       type: 'keyword', desc: 'All API traffic must be HTTPS — reject HTTP with 301 redirect or HSTS header.' },
  { name: 'CORS',            type: 'keyword', desc: 'Browser policy — allow only trusted origins, never Access-Control-Allow-Origin: * for credentialed requests.' },
  { name: 'Input Validation', type: 'keyword', desc: 'Validate type, length, format server-side for every field — never trust client data.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Authentication vs Authorization',
    points: [
      'Authentication (AuthN): "Who are you?" — verifying identity via API key, JWT, session cookie, mTLS client certificate.',
      'Authorization (AuthZ): "What are you allowed to do?" — checking permissions after identity is established. Often done with RBAC (roles) or ABAC (attributes).',
      'Both must be checked on every request — not just login. Middleware should reject unauthenticated requests with 401 before they reach business logic.',
      'Never return 404 "not found" to hide that a resource exists — return 403 Forbidden when the user is authenticated but not authorized. 404 is for unauthenticated paths only.',
    ],
  },
  {
    heading: 'JWT Security',
    points: [
      'JWTs consist of three base64url-encoded parts: header (algorithm), payload (claims), signature. The signature is verified using a secret (HMAC) or key pair (RS256/ES256).',
      'Always verify: signature (using your key), exp (expiry), iss (issuer), aud (audience). Accepting a JWT with invalid claims is an auth bypass.',
      'Use short expiry (15–60 minutes) + refresh tokens. If an access token is stolen, it expires quickly. Refresh tokens are stored securely (HttpOnly cookie), not localStorage.',
      'Algorithm confusion attack: never accept alg: none. Never let the client specify the algorithm. Pin the algorithm server-side when verifying.',
    ],
  },
  {
    heading: 'HTTPS and Transport Security',
    points: [
      'All API traffic must be over HTTPS — HTTP exposes tokens, request bodies, and response data to network-level eavesdropping.',
      'Redirect HTTP to HTTPS (301) + add HSTS header: `Strict-Transport-Security: max-age=31536000; includeSubDomains`.',
      'Disable TLS 1.0 and 1.1 — use TLS 1.2 minimum, prefer 1.3. Use strong cipher suites (ECDHE). Test with SSL Labs.',
      'For internal service-to-service calls, use mutual TLS (mTLS) — both sides present certificates, preventing rogue services from calling your API.',
    ],
  },
  {
    heading: 'Input Validation and Injection Prevention',
    points: [
      'Validate every input server-side: type, length, format, allowed values. Client-side validation is a UX convenience, not a security control.',
      'SQL injection: use parameterized queries / ORMs — never string-concatenate user input into SQL. This is the #1 web vulnerability.',
      'Mass assignment: never bind request body directly to a DB model — explicitly allowlist which fields can be set (e.g., never let users set `isAdmin: true`).',
      'Validate Content-Type and reject unexpected types. If you expect application/json, reject text/xml requests — parsers can behave unexpectedly with unexpected content types.',
    ],
  },
  {
    heading: 'Defense in Depth for API Security',
    points: [
      'No single security control is sufficient on its own — authentication verifies identity, authorization verifies permission, input validation prevents injection, and rate limiting prevents abuse; a genuinely secure API layers all of these rather than relying on any single mechanism to catch every threat.',
      'The OWASP API Security Top 10 (a curated list of the most common and impactful API-specific vulnerabilities) is a practical starting checklist for any API security review — Broken Object Level Authorization consistently ranks as the most prevalent and damaging API vulnerability across real-world assessments.',
      'Security should be validated at every layer independently — a client-side check is a UX convenience, never a security boundary; even data validated by an API gateway should typically be re-validated at the service level, since assuming upstream validation was correctly applied is a common source of security gaps.',
      'Security is not a one-time design decision but an ongoing practice — regular dependency scanning, penetration testing, and security-focused code review are necessary because new vulnerabilities are discovered continuously in both custom code and third-party dependencies used to build the API.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'JWT Middleware',
    language: 'typescript',
    code: `import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET!; // RS256 public key or HMAC secret

interface JwtPayload {
  sub: string;       // user ID
  iss: string;       // issuer: 'https://auth.company.com'
  aud: string;       // audience: 'https://api.company.com'
  exp: number;       // expiry (Unix timestamp)
  roles: string[];   // for RBAC
}

// Authentication middleware — runs before all route handlers
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({
      error: { code: 'missing_token', message: 'Authorization: Bearer <token> required' }
    });
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],           // PIN the algorithm — never allow 'none'
      issuer: 'https://auth.company.com',
      audience: 'https://api.company.com',
    }) as JwtPayload;

    req.user = payload; // attach to request
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: { code: 'token_expired', message: 'Token has expired' } });
    }
    return res.status(401).json({ error: { code: 'invalid_token', message: 'Invalid token' } });
  }
}

// Authorization — check roles after authentication
export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.roles.includes(role)) {
      return res.status(403).json({
        error: { code: 'forbidden', message: 'Insufficient permissions' }
      });
    }
    next();
  };
}

// Usage
app.get('/admin/users', authenticate, requireRole('admin'), (req, res) => {
  res.json({ users: [] });
});`,
  },
  {
    label: 'Input Validation',
    language: 'typescript',
    code: `import { z } from 'zod';

// Define schema for every endpoint — validated at the boundary, not inside business logic
const CreateUserSchema = z.object({
  name:  z.string().min(1).max(100),
  email: z.string().email(),
});

// Express middleware using Zod
function validate(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: {
          code: 'validation_error',
          message: 'Request body is invalid',
          details: result.error.issues.map(i => ({
            field: i.path.join('.'),
            issue: i.message,
          })),
        },
      });
    }
    req.body = result.data; // replace with parsed+sanitized data
    next();
  };
}

// ❌ BAD: mass assignment — user can set isAdmin, billingEmail, etc.
app.post('/users', authenticate, async (req, res) => {
  const user = await User.create(req.body); // never pass raw body to DB!
  res.json(user);
});

// ✅ GOOD: explicit allowlist of settable fields
app.post('/users', authenticate, validate(CreateUserSchema), async (req, res) => {
  const { name, email } = req.body; // only these two — schema enforces it
  const user = await User.create({ name, email, isAdmin: false }); // safe
  res.json(user);
});

// CORS — restrict to known origins
app.use(cors({
  origin: (origin, callback) => {
    const allowed = ['https://app.company.com', 'https://admin.company.com'];
    if (!origin || allowed.includes(origin)) callback(null, true);
    else callback(new Error('Not allowed by CORS'));
  },
  credentials: true, // needed for cookies/Authorization header
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
}));`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Accepting JWT algorithm: none (algorithm confusion attack)',
    wrong: `// Verify without specifying allowed algorithms
const payload = jwt.verify(token, secret);
// Attacker can craft: header={"alg":"none"} → signature is ignored → any payload accepted`,
    right: `// Always pin the algorithm — never allow 'none'
const payload = jwt.verify(token, secret, { algorithms: ['HS256'] });`,
    explanation: 'Without pinning the algorithm, a malicious client can send alg: none in the JWT header. Some JWT libraries honor this and skip signature verification — accepting any payload the attacker writes. Always pin the expected algorithm when calling verify().',
  },
  {
    title: 'Storing sensitive data in JWT payloads',
    wrong: `// JWT payload — base64 encoded, NOT encrypted, readable by anyone
{
  "sub": "42",
  "email": "user@example.com",
  "password": "hashed-password",   // ← never put this here
  "creditCard": "4111111111111111", // ← or this
  "ssn": "123-45-6789"             // ← or this
}`,
    right: `// Only put non-sensitive, needed-for-authorization data in the payload
{
  "sub": "42",
  "roles": ["user"],
  "iss": "https://auth.company.com",
  "exp": 1705316400
}`,
    explanation: 'JWT payloads are base64-encoded, not encrypted — anyone who has the token can decode and read it. JWTs are signed (integrity-protected), not secret. Never put passwords, PII, financial data, or health data in the payload. Keep only what\'s needed for authorization: user ID, roles, expiry, issuer.',
  },
  {
    title: 'Allowing wildcard CORS with credentials',
    wrong: `// Access-Control-Allow-Origin: * with credentials — browser rejects this AND
// any JS on any site can call your API with the user's cookies
app.use(cors({ origin: '*', credentials: true }));`,
    right: `// Explicit allowlist — only your own frontends
app.use(cors({
  origin: ['https://app.company.com', 'https://admin.company.com'],
  credentials: true,
}));`,
    explanation: 'Browsers reject Access-Control-Allow-Origin: * when credentials: true. But even if it worked, wildcard CORS means ANY website can make credentialed requests to your API using the user\'s cookies — a trivial CSRF vector. Always use an explicit allowlist of trusted origins.',
  },
  {
    title: 'Returning 404 to hide resource existence from unauthorized users',
    wrong: `// Returns 404 whether the resource doesn't exist OR the user lacks access
// Consumers can't tell if it's a bug or a permission issue
if (!order || order.userId !== req.user.id) return res.status(404).end();`,
    right: `// Return 404 only if the resource truly doesn't exist
const order = await db.orders.findById(req.params.id);
if (!order) return res.status(404).json({ error: { code: 'not_found' } });
// Return 403 if the resource exists but user lacks permission
if (order.userId !== req.user.id) return res.status(403).json({ error: { code: 'forbidden' } });`,
    explanation: 'Using 404 for permission errors makes debugging impossible — consumers file bugs thinking the resource doesn\'t exist when it does. Use 403 Forbidden when the resource exists but the user lacks access. Reserve 404 for truly non-existent resources. Exception: if revealing existence is itself a security concern (e.g., private user profiles), 404 is acceptable for unauthenticated users.',
  },
];

const challenge: Challenge = {
  title: 'JWT Claim Validator',
  language: 'typescript',
  description: `Implement validateJwtClaims(claims: JwtClaims, options: ValidateOptions): string[] that validates:
1. exp > now (token not expired)
2. iss matches options.issuer
3. aud matches options.audience
Returns array of error strings (empty = valid).

type JwtClaims = { sub: string; iss: string; aud: string; exp: number }
type ValidateOptions = { issuer: string; audience: string; now?: number }`,
  hints: [
    'claims.exp is a Unix timestamp in seconds; Date.now() returns milliseconds',
    'options.now defaults to Math.floor(Date.now() / 1000) for testing override',
  ],
  starterCode: `type JwtClaims = { sub: string; iss: string; aud: string; exp: number };
type ValidateOptions = { issuer: string; audience: string; now?: number };

function validateJwtClaims(claims: JwtClaims, options: ValidateOptions): string[] {
  const errors: string[] = [];
  const now = options.now ?? Math.floor(Date.now() / 1000);
  // Check exp, iss, aud
  return errors;
}`,
  solution: `type JwtClaims = { sub: string; iss: string; aud: string; exp: number };
type ValidateOptions = { issuer: string; audience: string; now?: number };

function validateJwtClaims(claims: JwtClaims, options: ValidateOptions): string[] {
  const errors: string[] = [];
  const now = options.now ?? Math.floor(Date.now() / 1000);
  if (claims.exp <= now) errors.push('Token has expired');
  if (claims.iss !== options.issuer) errors.push(\`Invalid issuer: expected \${options.issuer}\`);
  if (claims.aud !== options.audience) errors.push(\`Invalid audience: expected \${options.audience}\`);
  return errors;
}

const claims = { sub: '42', iss: 'https://auth.co', aud: 'https://api.co', exp: 9999999999 };
console.log(validateJwtClaims(claims, { issuer: 'https://auth.co', audience: 'https://api.co' })); // []
console.log(validateJwtClaims(claims, { issuer: 'https://other.co', audience: 'https://api.co' })); // 1 error`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What is the "algorithm confusion" attack on JWT verification?',
    options: [
      'Using a weak HMAC key that can be brute-forced to forge tokens',
      'Sending alg: none in the JWT header to bypass signature verification in vulnerable libraries',
      'Switching from RS256 to HS256 to use the public key as an HMAC secret',
      'Intercepting the token in transit because HTTPS was not enforced',
    ],
    answer: 1,
    explanation: 'Some JWT libraries trust the alg header from the token itself. If alg is none, they skip signature verification — accepting any payload the attacker writes. Fix: always pin the algorithm server-side when calling verify(), never let the token\'s alg header decide how to verify it.',
  },
  {
    q: 'A user requests a resource they are authenticated for but do not have permission to access. What HTTP status should the API return?',
    options: [
      '401 Unauthorized — the user needs to re-authenticate with higher privilege credentials',
      '404 Not Found — to prevent information leakage about the resource existence',
      '403 Forbidden — authenticated but not authorized to access this resource',
      '400 Bad Request — the user sent an incorrect resource ID',
    ],
    answer: 2,
    explanation: '403 Forbidden means the server understood the request, the user is authenticated, but they lack permission to access this specific resource. 401 means the user is NOT authenticated (no token or invalid token). 404 is for truly non-existent resources — using 404 for permission errors makes debugging hard and logs misleading.',
  },
  { q: 'What is API throttling and how does it differ from rate limiting?', options: ['Throttling is server-side; rate limiting is client-side', 'Rate limiting caps the number of requests in a time window; throttling slows down the response (adding delay) rather than rejecting requests', 'Throttling applies to data transfers; rate limiting applies to request counts', 'Both terms are identical and interchangeable in all API contexts'], answer: 1, explanation: 'Rate limiting: hard cap on requests. When exceeded, the server returns 429 Too Many Requests. The excess request is rejected immediately. Throttling: intentional delay is added to responses when the caller is over a soft limit. The request is not rejected, just slowed down. Use cases: throttling is used when the caller is a legitimate partner who is over their quota temporarily. Helps prevent denial of service while still serving the request. Rate limiting is used for strict enforcement. Most API gateways support both: initial throttling for moderate overuse, hard rate limit for severe overuse. Return Retry-After header to help clients back off correctly.' },
  { q: 'What is API key rotation and what best practices apply to key management?', options: ['Rotating API keys means changing the API key format monthly for compliance', 'Generating new API keys and invalidating old ones on a schedule or after compromise; best practices include separate keys per environment, scoped permissions, and monitoring usage anomalies', 'Rotating API keys means distributing the key to multiple consumers', 'API key rotation is only required for keys used in banking and healthcare'], answer: 1, explanation: 'API key rotation: replace old keys with new ones periodically or after a suspected compromise. Best practices: one key per consumer and per environment (dev, staging, prod keys are separate). Scoped keys (read-only key for reporting consumers). Time-limited keys with automatic expiry. Zero-downtime rotation: the new key is accepted before the old key is revoked. Monitor key usage: detect unusual patterns (a key suddenly making requests from a new country or at an unusual volume). Key revocation: immediately revoke compromised keys. Audit logs: log all key issuances, rotations, and revocations. Never log raw key values — log only the key ID or a prefix.' },
  { q: 'What is mutual authentication in API security and when is it used?', options: ['Both the client and server provide credentials before any data is exchanged; used for high-trust B2B integrations where IP allowlisting is insufficient', 'The client authenticates twice with two different credentials for extra security', 'The server authenticates to the client using a certificate; the client authenticates using a password', 'A protocol where two separate APIs authenticate with each other before forwarding requests'], answer: 0, explanation: 'Mutual authentication (mTLS): standard TLS authenticates the server to the client. Mutual TLS adds client certificate authentication. The server requests a client certificate during the TLS handshake. The client presents a certificate issued by a trusted CA. The server validates the client certificate before processing any request. Use cases: B2B API integrations where a partner company provides a client certificate. High-value financial or healthcare APIs where API key alone is insufficient. Zero trust internal service mesh (Istio uses mTLS by default). Advantages over API keys: the private key never leaves the client. Certificate compromise requires physical or logical device access, not just a key string.' },
  { q: 'What is injection attack prevention in API endpoint design?', options: ['Use HTTP instead of HTTPS to avoid TLS injection vulnerabilities', 'Validate and sanitize all inputs at API boundaries, use parameterized queries, and limit accepted character sets to prevent SQL, NoSQL, command, and other injection attacks', 'Block all non-alphanumeric characters to prevent injection in all APIs', 'Injection attacks only affect web applications, not APIs'], answer: 1, explanation: 'API injection prevention: validate all input: type check (is this field actually a number?). Length limits (username must be under 100 characters). Format validation (email must match email regex). Allowlist character sets for fields that do not need special characters. Parameterized queries for all database access — never concatenate API inputs into SQL strings. NoSQL operator filtering: sanitize or reject inputs containing operator characters. Command injection prevention: never pass API input to shell commands. Use library functions with argument arrays instead. Content-Type validation: reject requests with unexpected Content-Types to prevent content-type confusion attacks. Apply the same input validation to path parameters, query parameters, headers, and body.' },
  { q: 'What are the main OAuth 2.0 grant types and when should each be used?', options: ['OAuth 2.0 has one grant type — Authorization Code — all other flows are just parameter variations', 'Authorization Code + PKCE (user-facing apps), Client Credentials (service-to-service), Device Code (TV/CLI), and Refresh Token — Implicit is deprecated', 'Grant types determine token lifespan — client credentials tokens expire in 5 minutes, auth code tokens in 60 minutes', 'Grant types are mutually exclusive — each application can only register for one grant type'], answer: 1, explanation: 'Authorization Code + PKCE: the recommended flow for any app where a user logs in. Redirects user to auth server, receives a code, exchanges for tokens. PKCE (Proof Key for Code Exchange) prevents interception attacks for public clients (SPAs, mobile apps). Required for all public clients per OAuth 2.1. Client Credentials: machine-to-machine auth with no user. Service A authenticates with its own credentials and receives a token. Used for backend service calls. Device Authorization: for devices with limited input (smart TVs, CLIs). Device shows a code; user enters it on another device. Implicit Flow: deprecated — token was returned directly from the authorization endpoint. Replaced by Auth Code + PKCE for all client-side scenarios. Refresh tokens: long-lived tokens that exchange for new access tokens. Never expose to the browser — store server-side.' },
  { q: 'What is the structure of a JWT and how does signature verification work?', options: ['A JWT is a Base64-encoded blob with a symmetric key embedded for self-verification', 'A JWT has three Base64URL-encoded parts: header (algorithm, type), payload (claims), and signature — verified via the same secret (HMAC) or corresponding public key (RSA/EC)', 'JWT verification requires a round-trip to the issuing server on every request to check revocation', 'A JWT payload is encrypted by default — the signature only checks integrity of the ciphertext'], answer: 1, explanation: 'JWT structure: header.payload.signature. Header: { "alg": "RS256", "typ": "JWT" }. Payload claims: { "sub": "user123", "iss": "auth.example.com", "exp": 1700000000, "aud": "api.example.com" }. Standard claims: iss (issuer), sub (subject), aud (audience), exp (expiry), iat (issued at). Signature: HMAC-SHA256(base64url(header) + "." + base64url(payload), secret) for symmetric; sign with private key, verify with public key for RSA/EC. Verification steps: decode header, verify signature with the algorithm in the header, check exp has not passed, validate aud matches this service, validate iss matches the expected auth server. CRITICAL: JWTs are signed but NOT encrypted by default — the payload is readable by anyone who decodes it. Never put sensitive data in the payload. "alg: none" attack: always validate the alg header — an attacker can set alg to "none" to bypass signature verification in permissive libraries.' },
  { q: 'What is the OWASP API Security Top 10 and which is the most critical risk?', options: ['A list of common API performance problems — rate limits, payload sizes, response times', 'Critical risks including Broken Object Level Authorization (most critical), Broken Authentication, Excessive Data Exposure, and Unrestricted Resource Consumption', 'Applies only to REST APIs — GraphQL and gRPC have separate OWASP frameworks', 'A compliance certification APIs must pass before production in regulated industries'], answer: 1, explanation: 'OWASP API Security Top 10 (2023): API1 — Broken Object Level Authorization (BOLA): most common and critical. Failing to verify the caller owns the requested object. Example: GET /orders/123 returns another user\'s order without checking ownership. Fix: always verify the authenticated user owns or has permission for the specific resource. API2 — Broken Authentication: weak tokens, missing expiry, no brute-force protection. API3 — Broken Object Property Level Authorization: returning or accepting fields the user should not access (mass assignment). API4 — Unrestricted Resource Consumption: no rate limiting, bulk operations exhaust server resources. API5 — Broken Function Level Authorization: lower-privilege users access admin endpoints. API7 — Server Side Request Forgery: API fetches a URL provided by the user. API8 — Security Misconfiguration: debug endpoints enabled, permissive CORS, verbose errors. API9 — Improper Inventory Management: shadow APIs and undocumented endpoints.' },
  { q: 'How should API keys be stored and transmitted securely?', options: ['API keys can be stored in environment variables in client-side JavaScript since they are not as sensitive as passwords', 'API keys should be hashed (SHA-256) in the database so a breach does not expose working keys, transmitted only via HTTPS headers not query parameters, and scoped to minimum permissions', 'API keys are inherently secure because they are long random strings — no special precautions are needed', 'API keys should be stored using bcrypt hashing for consistency with password storage'], answer: 1, explanation: 'API key storage: never store raw keys in the database. Store a SHA-256 hash. On each request, hash the incoming key and compare against stored hashes — a database breach exposes only useless hashes. Transmission: always over HTTPS. Use headers (Authorization: Bearer key or X-API-Key: key) NOT query parameters — query params appear in server logs, browser history, and CDN logs. Example leak: GET /api/data?api_key=secret123 gets logged everywhere. Scoping: API keys should have limited scopes (read-only, specific resources). Rotation support: allow multiple active keys per account so old keys can be revoked after the new key is deployed (zero-downtime rotation). Rate limiting per key: apply rate limits at the key level — a compromised key cannot exhaust your infrastructure. Audit log: log every API key creation, rotation, and revocation with timestamp and actor.' },
];

const qna: QnaItem[] = [
  {
    q: 'When should you use API keys vs JWTs?',
    a: '<ul><li><strong>API Keys</strong>: best for server-to-server (M2M) integrations — a backend service calling your API. Simple: generate a random secret, hash it in the DB, verify on each request. No expiry negotiation. Rotate on compromise. Send in Authorization: Bearer or X-API-Key header.</li><li><strong>JWTs</strong>: best for user sessions in browser/mobile apps — short-lived (15–60m), self-contained (contain claims without a DB lookup), combined with OAuth 2.0 / OIDC flows. Supports refresh token rotation for longer sessions.</li><li><strong>Use both</strong>: internal/third-party integrations get API keys; user-facing clients get JWTs. Some platforms (Stripe) use API keys exclusively even for SDKs — simpler and very effective for M2M.</li></ul>API keys are not "less secure" than JWTs — they just have different properties. The critical security controls are: HTTPS always, keys hashed server-side (like passwords — never store plaintext), rate limiting, and rotation capability.',
  },
  {
    q: 'What security headers should every API set?',
    a: `<ul>
      <li><strong>Strict-Transport-Security</strong>: max-age=31536000; includeSubDomains — forces HTTPS for 1 year</li>
      <li><strong>X-Content-Type-Options</strong>: nosniff — prevents MIME-type sniffing in older browsers</li>
      <li><strong>X-Frame-Options</strong>: DENY — prevents clickjacking (for APIs serving HTML/docs)</li>
      <li><strong>Content-Security-Policy</strong>: default-src 'none' — for APIs, block all browser content execution</li>
      <li><strong>Referrer-Policy</strong>: no-referrer — don't leak referrer to third-party resources</li>
      <li><strong>Permissions-Policy</strong>: geolocation=(), camera=() — disable unneeded browser APIs</li>
    </ul>
    Use the Helmet.js middleware for Express/Node.js — it sets all recommended security headers with one line: <code>app.use(helmet())</code>.`,
  },
  { q: 'How do you implement API authentication for third-party integrations?', a: 'Third-party integration authentication options: OAuth 2.0 Client Credentials: the partner authenticates with client ID and secret to get a short-lived access token. Scalable, tokens expire automatically, supports scoped access. Best for active partner relationships. API Keys: simple string keys issued to each partner. Easy to implement. Rotate on schedule or compromise. Use separate keys per partner. Mutual TLS: high-security B2B integrations (financial, healthcare). The partner provides a client certificate. Requires PKI setup on both sides. JWT with partner-signed tokens: the partner issues signed JWTs using their private key. Your API verifies with their public key. Good when the partner needs to embed custom claims. Combination: use mTLS for transport-level partner identity plus JWT for user-level claims (common in banking APIs). Rate limit per partner key to prevent one partner from impacting others.' },
  { q: 'What is an API gateway security policy and what does it enforce?', a: 'API gateway security policy: the gateway sits in front of all backend APIs and enforces security controls centrally, so each backend service does not need to implement them. Common gateway security policies: authentication (validate JWT or API key before forwarding). Authorization (validate scopes against the requested endpoint). Rate limiting (cap requests per API key or IP). IP allowlisting and denylisting. TLS termination and certificate validation. WAF (Web Application Firewall) rules: block SQL injection patterns, OWASP Top 10 attack signatures. Request size limits (block oversized payloads that could cause DoS). Header injection prevention (strip or validate X-Forwarded headers). CORS policy enforcement. Benefits: centralized audit logging of all API calls. Single place to update security policies without redeploying backend services. Consistent security posture across all APIs.' },
  { q: 'How do you secure API responses to prevent information disclosure?', a: 'Response security: return only the data the caller is authorized to see. Enforce field-level access control (a non-admin user should not see internal cost fields). Do not echo back internal system details in responses: stack traces in production error messages. Internal IP addresses in error details. Database table names or query structure in SQL error messages. Server version headers (Server: Apache/2.4.1). Error response design: return generic 500 errors with a correlation ID for diagnostics. Log the full error details server-side but return only the correlation ID to the client. Sensitive fields in responses: consider masking or truncating sensitive data (return last 4 digits of credit card, not the full number). Add Vary headers when responses differ by user to prevent shared caches from serving wrong-user data.' },
  { q: 'Why did OWASP add API3 (Broken Object Property Level Authorization) as distinct from API1 (Broken Object Level Authorization) in the API Security Top 10?', a: 'API1 (BOLA) is about accessing the WRONG OBJECT entirely — changing an ID in a URL to view someone else\'s record. API3 is a subtler, distinct failure: the caller IS authorized to access the correct object, but the response exposes (or accepts as writable) individual FIELDS within that object they should not see or modify — an endpoint returning a user\'s full profile including an internal admin-only "creditLimit" field to a regular user, or accepting a "role" field in a profile update request that lets a user silently grant themselves admin (mass assignment). OWASP separated these because the fix for each is different: BOLA requires object-level ownership checks, while API3 requires field-level filtering on both the read and write paths — a team that only checks "does this user own this object" can still ship an API3 vulnerability by over-serializing or over-accepting fields on an object the user IS legitimately allowed to touch.' },
  { q: 'What is PKCE and why is it required for public clients?', a: 'PKCE (Proof Key for Code Exchange, pronounced "pixie"): an extension to OAuth 2.0 Authorization Code Flow preventing authorization code interception attacks. Problem: public clients (SPAs, mobile apps) cannot keep a client_secret secret — it is embedded in client-side code. An attacker who intercepts the authorization code can exchange it for tokens without the secret. PKCE flow: the client generates a random code_verifier (43-128 characters). Computes code_challenge = BASE64URL(SHA256(code_verifier)). Sends code_challenge with the initial authorization request. The auth server stores it. When exchanging the code for tokens, the client sends the code_verifier. The auth server hashes it and compares to the stored challenge. Attack prevention: an intercepted code is useless without the code_verifier. PKCE is now required for ALL public clients per OAuth 2.1 draft. It is also recommended for confidential clients as defense in depth. Replaces Implicit Flow for SPAs — the old approach of returning tokens in URL fragments was insecure.' },
  { q: 'How do you implement rate limiting for APIs and what headers should be returned?', a: 'Rate limiting algorithms: token bucket — a bucket refills at a constant rate; requests consume tokens; allows burst up to bucket size. Leaky bucket — requests processed at constant rate; overflow queued or rejected. Sliding window — count requests in a moving time window; more accurate. Fixed window — count per fixed interval; susceptible to boundary bursts. Storage: use Redis for distributed rate limiting across multiple API instances. Key: user ID, API key, or IP. Response headers (standardized): RateLimit-Limit: 100 (max requests per window). RateLimit-Remaining: 45 (remaining in current window). RateLimit-Reset: 1700000060 (Unix timestamp of window reset). Retry-After: 30 (seconds until limit resets — returned on 429). Status code: 429 Too Many Requests. Granularity: rate limit by different dimensions — global (protect infrastructure), per-user (fair usage), per-endpoint (expensive operations get lower limits), per-client (partner vs anonymous). Token bucket is recommended for natural burst handling.' },
  { q: 'What is CORS and what security risks does misconfiguration introduce?', a: 'CORS (Cross-Origin Resource Sharing): a browser security mechanism that prevents JavaScript from making cross-origin requests unless the server explicitly permits them. How it works: browser sends a preflight OPTIONS request for complex requests. Server responds with Access-Control-Allow-Origin, Access-Control-Allow-Methods, Access-Control-Allow-Headers. Secure configuration: specify exact allowed origins (Access-Control-Allow-Origin: https://app.example.com). NEVER use * with credentials — Access-Control-Allow-Credentials: true combined with * is invalid; browsers block it. Security risks of misconfiguration: reflecting the Origin header — some implementations echo back whatever Origin the request sends, permitting any origin. A malicious site makes cross-origin requests using the victim\'s session cookies. Null origin: allowing null permits requests from local files and sandboxed iframes — a known exploit vector. Overly broad wildcards: allowing *.example.com may inadvertently allow attacker-controlled subdomains. Testing: curl -H "Origin: https://evil.com" to verify what your API reflects. CORS is a browser enforcement only — it does not protect from server-to-server requests.' },
  { q: 'How does mutual TLS (mTLS) improve API security compared to bearer tokens?', a: 'Standard TLS: the server presents a certificate; the client verifies it. The client is identified only at the application layer (via bearer token, API key). mTLS: both server and client present X.509 certificates. The server verifies the client certificate against a trusted CA before any application data is exchanged. Benefits over bearer tokens: phishing-resistant — a certificate cannot be phished or reused from a different device because the private key never leaves the client hardware. Certificate-bound tokens (OAuth 2.0 mTLS, RFC 8705): the access token is cryptographically bound to the client certificate. Even if the token is stolen, it is unusable without the certificate. Network-layer authentication — the client is identified before the application layer processes the request. Use cases: service-to-service in zero-trust networks; Open Banking (FAPI requires mTLS); high-value B2B integrations. Istio and other service meshes use mTLS between all pods automatically. Challenges: certificate lifecycle management (issuance, rotation, revocation). Automating rotation with cert-manager or Vault PKI is essential.' },
];

const revision: RevisionSummary = {
  oneLiner: 'API security: always HTTPS, pin JWT algorithms, validate all inputs, use 401/403 correctly, restrict CORS to known origins, never trust the client.',
  mustKnow: [
    'AuthN (who are you?) vs AuthZ (what can you do?) — checked on every request',
    'JWT: verify signature + exp + iss + aud; pin algorithm; never store PII in payload',
    'Short-lived access tokens (15–60m) + refresh token rotation in HttpOnly cookie',
    'Input validation with Zod/Joi server-side; explicit allowlist for mass-assignment protection',
    'CORS: explicit origin allowlist, never wildcard with credentials: true',
    '401 = not authenticated; 403 = authenticated but not authorized; use both correctly',
  ],
  interviewFocus: [
    'What is the JWT algorithm confusion attack and how do you prevent it?',
    'What is the difference between 401 and 403?',
    'How do you prevent mass assignment vulnerabilities in an API?',
  ],
};

@Component({
  selector: 'app-api-security',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './api-security.html',
  styleUrl: './api-security.scss',
})
export class ApiApiSecurity {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
