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
const CreateOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().min(1).max(100),
  })).min(1).max(50),
  deliveryAddress: z.object({
    street: z.string().min(1).max(200),
    city:   z.string().min(1).max(100),
    zip:    z.string().regex(/^\\d{5}(-\\d{4})?$/, 'Invalid US zip code'),
  }),
  note: z.string().max(500).optional(),
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
