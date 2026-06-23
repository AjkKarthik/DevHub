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
  { name: 'Claim',        type: 'keyword', desc: 'Key-value assertion about a subject: { sub, email, roles, department }.' },
  { name: 'Identity',     type: 'keyword', desc: 'Verified set of claims about a user — issued by a trusted Identity Provider.' },
  { name: 'Principal',    type: 'keyword', desc: 'The entity making a request — a user, service account, or application.' },
  { name: 'ClaimsPrincipal', type: 'class', desc: '.NET: represents the current user; holds claims from authentication tokens.' },
  { name: 'Tenant',       type: 'keyword', desc: 'In multi-tenant systems, a claim scoping access to a specific organisation.' },
  { name: 'Scope',        type: 'keyword', desc: 'OAuth 2.0 scope claim — limits what the token can access (openid, profile, read:orders).' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'What Is a Claim?',
    points: [
      'A claim is a statement about a subject — a key-value pair: `{ "sub": "u-123", "email": "alice@example.com", "role": "editor" }`.',
      'Claims are assertions made by an issuer (Identity Provider). A token\'s claims are only as trustworthy as the issuer.',
      'Registered JWT claims: `iss` (issuer), `sub` (subject), `aud` (audience), `exp` (expiry), `iat` (issued-at), `jti` (JWT ID).',
      'Application claims: any additional key-value pairs your system adds — roles, department, tenant ID, subscription tier.',
    ],
  },
  {
    heading: 'Claims-Based Identity Model',
    points: [
      'Instead of "look up this user in the DB on every request", the token carries all the claims needed to make access decisions.',
      'The token is cryptographically signed — recipients can verify claims without calling the issuer on every request (stateless).',
      'Identity is established at token issuance; authorization decisions use the claims in the token.',
      'Down-scoping: a token can carry a subset of a user\'s permissions for a specific delegated operation — the `scope` claim limits what actions are possible.',
    ],
  },
  {
    heading: 'Multi-Tenant Identity',
    points: [
      'In SaaS applications, every claim must be scoped to a tenant. The `tid` (tenant ID) claim gates all data access.',
      'Every data query must filter by `tenantId === user.tenantId` — tenant leakage (cross-tenant data access) is a critical security vulnerability.',
      'Validate the tenant claim on every request — a compromised token from Tenant A must never access Tenant B\'s data.',
      'Service accounts: give each tenant integration a scoped service account with only the permissions it needs for that tenant.',
    ],
  },
  {
    heading: 'Claim Validation Best Practices',
    points: [
      'Never trust user-supplied claims without verification. Claims in a valid, signature-verified JWT can be trusted (assuming the signing key is secure).',
      'Do not read claims from request headers set by the client — only from verified tokens. A client can set any header they want.',
      'Validate all registered claims: `iss`, `aud`, `exp`. Missing `aud` validation is a common vulnerability (tokens intended for service A accepted by service B).',
      'Sensitive operations: re-verify freshness — check `iat` or require a fresh token (`max_age` in OIDC) rather than accepting a 12-hour-old token for account deletion.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Claims Extraction Middleware',
    language: 'typescript',
    code: `import jwt from 'jsonwebtoken';

interface UserClaims {
  sub:        string;
  email:      string;
  roles:      string[];
  tenantId:   string;
  department: string;
  scope:      string;
}

// ── Extract and validate claims from Bearer token ────────────────────────────
function extractClaims(token: string): UserClaims {
  const payload = jwt.verify(token, PUBLIC_KEY, {
    algorithms: ['RS256'],
    issuer:   'https://auth.example.com',
    audience: 'api.example.com',
  }) as Record<string, unknown>;

  // Validate required claims
  if (typeof payload['sub']      !== 'string') throw new Error('Missing sub');
  if (typeof payload['tenantId'] !== 'string') throw new Error('Missing tenantId');

  return {
    sub:        payload['sub'] as string,
    email:      payload['email'] as string ?? '',
    roles:      Array.isArray(payload['roles']) ? payload['roles'] as string[] : [],
    tenantId:   payload['tenantId'] as string,
    department: payload['department'] as string ?? '',
    scope:      payload['scope'] as string ?? '',
  };
}

// ── Middleware ───────────────────────────────────────────────────────────────
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });

  try {
    (req as any).claims = extractClaims(header.slice(7));
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// ── Tenant-scoped data access ─────────────────────────────────────────────────
app.get('/api/orders', requireAuth, async (req, res) => {
  const { tenantId, sub } = (req as any).claims as UserClaims;
  // ALWAYS filter by tenantId — never let one tenant see another's data
  const orders = await db.orders.findAll({ where: { tenantId } });
  res.json(orders);
});`,
  },
  {
    label: 'Scope-Based API Authorization',
    language: 'typescript',
    code: `// ── OAuth 2.0 scopes limit what a token can do ───────────────────────────────
// Token scope: "read:orders write:orders"  — no admin access
// Admin token scope: "read:orders write:orders admin:users"

function requireScope(requiredScope: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const claims = (req as any).claims as UserClaims;
    const scopes = claims.scope.split(' ');
    if (!scopes.includes(requiredScope)) {
      return res.status(403).json({ error: \`Scope '\${requiredScope}' required\` });
    }
    next();
  };
}

// Routes scoped to specific permissions
app.get('/api/orders',        requireAuth, requireScope('read:orders'),  listOrders);
app.post('/api/orders',       requireAuth, requireScope('write:orders'), createOrder);
app.get('/api/admin/users',   requireAuth, requireScope('admin:users'),  listUsers);

// ── Down-scoped token for third-party integrations ────────────────────────────
// Issue a limited token for webhooks / integration partners
function issueIntegrationToken(tenantId: string, allowedScopes: string[]): string {
  return jwt.sign(
    { tenantId, scope: allowedScopes.join(' '), type: 'integration' },
    PRIVATE_KEY,
    { algorithm: 'RS256', expiresIn: '1h', issuer: 'https://auth.example.com', audience: 'api.example.com' }
  );
}`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Trusting claims from request headers set by the client',
    wrong: `// Client sets X-User-Id header — anyone can fake this
const userId = req.headers['x-user-id'];`,
    right: `// Extract claims only from verified JWT in Authorization header
const { sub: userId } = (req as any).claims; // set by requireAuth middleware after jwt.verify()`,
    explanation: 'Any HTTP client can set arbitrary request headers. Claims must only come from cryptographically verified tokens (JWT signature check). Never use custom headers like `X-User-Id` for authentication or authorization.',
  },
  {
    title: 'Not filtering data queries by tenantId',
    wrong: `// No tenant filter — returns ALL orders from all tenants!
const orders = await db.orders.findAll({ where: { userId: req.claims.sub } });`,
    right: `// Always scope queries to the authenticated tenant
const orders = await db.orders.findAll({
  where: { userId: req.claims.sub, tenantId: req.claims.tenantId }
});`,
    explanation: 'Tenant leakage — serving one tenant\'s data to another — is a critical SaaS security bug. Every query must include `tenantId` from the verified token claims, even when also filtering by `userId`.',
  },
  {
    title: 'Embedding sensitive data in JWT claims for convenience',
    wrong: `// Avoid putting sensitive data in token payload
jwt.sign({ sub: userId, ssn: '123-45-6789', salary: 95000 }, key)`,
    right: `// Store only stable identifiers; fetch sensitive data server-side
jwt.sign({ sub: userId, roles: ['employee'], tenantId }, key)`,
    explanation: 'JWT payloads are base64url encoded (not encrypted) and logged, cached, and stored in many places. Use tokens for identity and authorization claims only; fetch sensitive PII from the DB when needed.',
  },
  {
    title: 'Not re-verifying identity for sensitive operations',
    wrong: `// Use a 12-hour-old JWT to delete the account — no freshness check
app.delete('/api/account', requireAuth, deleteAccount);`,
    right: `// Require recent authentication for destructive operations
app.delete('/api/account', requireAuth, requireRecentAuth(5 * 60), deleteAccount); // iat within 5 min`,
    explanation: 'A valid JWT might be hours old — the user may have walked away, or the device may be compromised. For sensitive operations (account deletion, payment, email change), check `iat` (issued-at) and reject stale tokens, or use OIDC `prompt=login` for fresh authentication.',
  },
];

const challenge: Challenge = {
  title: 'Claims Validator',
  language: 'typescript',
  description: `Implement validateClaims(claims: Record<string, unknown>): { valid: boolean; missing: string[] } that:
1. Requires: sub (non-empty string), tenantId (non-empty string), roles (non-empty array), exp (number > Date.now()/1000)
2. Returns valid: true only if ALL are present and valid
3. Returns missing: list of invalid/missing claim names`,
  hints: [
    'Check typeof for string fields',
    'Array.isArray for roles',
    'exp > Math.floor(Date.now() / 1000) for expiry',
  ],
  starterCode: `function validateClaims(claims: Record<string, unknown>): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  // TODO
  return { valid: missing.length === 0, missing };
}`,
  solution: `function validateClaims(claims: Record<string, unknown>): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  if (typeof claims['sub'] !== 'string' || !claims['sub']) missing.push('sub');
  if (typeof claims['tenantId'] !== 'string' || !claims['tenantId']) missing.push('tenantId');
  if (!Array.isArray(claims['roles']) || claims['roles'].length === 0) missing.push('roles');
  if (typeof claims['exp'] !== 'number' || claims['exp'] <= Math.floor(Date.now() / 1000)) {
    missing.push('exp');
  }

  return { valid: missing.length === 0, missing };
}

console.log(validateClaims({ sub: 'u1', tenantId: 't1', roles: ['admin'], exp: 9999999999 }));
// { valid: true, missing: [] }
console.log(validateClaims({ sub: '', tenantId: 't1', roles: [], exp: 0 }));
// { valid: false, missing: ['sub', 'roles', 'exp'] }`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'Which claim is the stable, unique identifier for a user in OIDC/JWT?',
    options: ['email', 'sub (subject)', 'name', 'preferred_username'],
    answer: 1,
    explanation: 'The `sub` (subject) claim is the Identity Provider\'s permanent, unique identifier for the user. Email addresses can change; names are not unique. Always store and look up users by `sub` + issuer combination.',
  },
  {
    q: 'In a multi-tenant SaaS, what is the most critical claim to validate on every request?',
    options: ['email', 'exp (expiry)', 'tenantId', 'iat (issued-at)'],
    answer: 2,
    explanation: 'The `tenantId` claim scopes all data access. Failure to validate and filter by `tenantId` on every request leads to tenant leakage — one tenant accessing another\'s data. This is a critical security vulnerability in SaaS applications.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'What is the difference between a claim and a scope in OAuth/OIDC?',
    a: '<strong>Scope</strong> is a request-time parameter that controls what claims the token contains and what APIs it can access. Scopes are granted by the user during the authorization flow: <code>openid profile email read:orders</code>. <strong>Claims</strong> are the actual key-value pairs inside the resulting token: <code>sub</code>, <code>email</code>, <code>name</code>. Requesting the <code>email</code> scope grants the <code>email</code> claim. The <code>scope</code> claim in the token records which scopes were granted — used by resource servers to check if the token is authorized for a specific operation.',
  },
  {
    q: 'How do you handle claim changes mid-session (e.g., user is demoted from admin)?',
    a: 'JWTs are immutable after issuance — a token granted admin claims retains them until expiry. Strategies: <ol><li><strong>Short expiry</strong>: 5–15 min access tokens. Changes take effect on the next token refresh.</li><li><strong>Token blacklist</strong>: add the token\'s JTI to Redis on role change; check on every request. Reintroduces state.</li><li><strong>Database check on sensitive operations</strong>: for critical operations (admin actions), verify current role from DB rather than trusting the token claim.</li><li><strong>Token versioning</strong>: store a <code>claimsVersion</code> per user in DB; include it in tokens; increment on role change — old tokens fail version check.</li></ol>',
  },
];

const revision: RevisionSummary = {
  oneLiner: 'Claims are signed key-value assertions about a user — validate all registered claims (iss, aud, exp), scope every query by tenantId, and never trust client-supplied headers.',
  mustKnow: [
    'Claim = key-value assertion in a signed token; registered JWT claims: sub, iss, aud, exp, iat',
    'sub is the stable user identifier — not email or name',
    'Multi-tenant: every DB query must filter by tenantId from verified claims',
    'Never trust claims from HTTP headers set by the client — only from verified JWTs',
    'OAuth scope claim limits what a token can access — validate scope on every protected endpoint',
    'Sensitive operations: check iat freshness or require re-authentication',
  ],
  interviewFocus: [
    'Why use sub instead of email as the user identifier?',
    'What is tenant leakage and how do you prevent it?',
    'How do you handle claim changes (role demotion) with JWTs?',
  ],
};

@Component({
  selector: 'app-sec-claims-identity',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './claims-identity.html',
  styleUrl: './claims-identity.scss',
})
export class SecClaimsIdentity {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
