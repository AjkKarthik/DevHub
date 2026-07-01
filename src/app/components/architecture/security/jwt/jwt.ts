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
  { name: 'JWT',    type: 'keyword', desc: 'JSON Web Token — base64url-encoded header.payload.signature, self-contained and stateless.' },
  { name: 'Header', type: 'keyword', desc: 'alg + typ — specifies signing algorithm (RS256, HS256) and token type.' },
  { name: 'Payload', type: 'keyword', desc: 'Claims: registered (iss, sub, aud, exp, iat) + application-specific (roles, email).' },
  { name: 'Signature', type: 'keyword', desc: 'Cryptographic proof that the header and payload have not been tampered with.' },
  { name: 'RS256',  type: 'keyword', desc: 'Recommended: RSA private key signs; public key verifies — key pair, not shared secret.' },
  { name: 'HS256',  type: 'keyword', desc: 'Symmetric HMAC — same key signs and verifies. Only for single-service use; never share the key.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'JWT Structure',
    points: [
      'A JWT is three base64url-encoded JSON objects joined by dots: `header.payload.signature`.',
      'Header: `{ "alg": "RS256", "typ": "JWT" }` — declares the signing algorithm.',
      'Payload: claims — `sub` (subject/user ID), `iss` (issuer), `aud` (audience), `exp` (expiry Unix timestamp), `iat` (issued-at), plus any app-specific claims.',
      'Signature: computed over `base64url(header) + "." + base64url(payload)` using the secret/private key. Tamper with the payload and the signature becomes invalid.',
      'JWTs are NOT encrypted by default — the payload is only base64url encoded, not secret. Never put sensitive data (passwords, SSNs) in a JWT payload unless using JWE.',
    ],
  },
  {
    heading: 'RS256 vs HS256',
    points: [
      'RS256 (asymmetric): a private key signs; the public key verifies. Multiple services can verify tokens without access to the signing key. The gold standard for APIs.',
      'HS256 (symmetric): the same secret signs and verifies. Every service that needs to verify tokens must share the secret — a breach of any one service compromises all.',
      'RS256 enables key rotation: rotate the private key, publish the new public key at `/.well-known/jwks.json`, old tokens naturally expire. No shared secret rotation needed.',
      'Use HS256 only when there is a single issuer and a single verifier (e.g., a self-contained monolith) and the secret is properly managed.',
    ],
  },
  {
    heading: 'Token Validation — What to Check',
    points: [
      '`iss` (issuer): verify the token was issued by your expected authorization server.',
      '`aud` (audience): verify the token was intended for your service — prevents token reuse across services.',
      '`exp` (expiry): verify `exp > now` — reject expired tokens.',
      'Signature: verify using the correct public key (fetch from JWKS endpoint, keyed by `kid` in the header).',
      '`kid` (key ID): allows key rotation — the header declares which public key to use for verification.',
    ],
  },
  {
    heading: 'Common JWT Security Pitfalls',
    points: [
      'Algorithm confusion: the `alg: none` attack — some libraries accepted unsigned tokens if `alg` was set to `none`. Always specify allowed algorithms explicitly.',
      'RS256/HS256 confusion: an RS256 token can be re-signed as HS256 using the public key as the HMAC secret if the library allows the caller to specify the algorithm. Always hard-code the expected algorithm.',
      'Storing JWTs in localStorage: accessible to any JavaScript on the page — XSS vulnerabilities steal all tokens. Store access tokens in memory; use httpOnly cookies for refresh tokens.',
      'Long-lived tokens: JWTs cannot be invalidated before expiry (stateless). Keep access tokens short (15 min); use token blacklisting or short expiry for sensitive operations.',
    ],
  },
  {
    heading: 'JWT Algorithm Confusion Attacks',
    points: [
      'A classic JWT vulnerability: if a server accepts both RS256 (asymmetric, public/private key) and HS256 (symmetric, shared secret) without restricting which algorithm is acceptable, an attacker can take a token signed with RS256, re-sign it with HS256 using the server\'s PUBLIC key as the HMAC secret (which is often not actually secret), and the server incorrectly validates it as authentic.',
      'The fix is to always explicitly specify and enforce the expected algorithm on the verification side (never trust the alg field in the token header to determine how to verify it) — most modern JWT libraries support an explicit algorithms allowlist parameter for exactly this reason.',
      'The "none" algorithm attack is a related historical vulnerability — some early JWT library implementations would accept a token with alg: "none" and no signature at all as valid, allowing complete forgery; modern libraries reject this by default, but always verify your specific library and configuration.',
      'Never decode a JWT payload and trust its claims without ALSO verifying the signature — reading claims from a decoded-but-unverified token is a common and dangerous shortcut, since anyone can construct a syntactically valid JWT with arbitrary claims and no valid signature.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Issue & Verify JWT (RS256)',
    language: 'typescript',
    code: `import jwt from 'jsonwebtoken';
import fs from 'fs';

const PRIVATE_KEY = fs.readFileSync('./keys/private.pem');
const PUBLIC_KEY  = fs.readFileSync('./keys/public.pem');

// ── Issue token ──────────────────────────────────────────────────────────────
function issueToken(userId: string, roles: string[]): string {
  return jwt.sign(
    { sub: userId, roles, iss: 'https://auth.example.com', aud: 'api.example.com' },
    PRIVATE_KEY,
    { algorithm: 'RS256', expiresIn: '15m', keyid: 'key-2024-01' }
  );
}

// ── Verify token — always specify algorithm explicitly ───────────────────────
function verifyToken(token: string): { sub: string; roles: string[] } {
  const payload = jwt.verify(token, PUBLIC_KEY, {
    algorithms: ['RS256'], // NEVER omit — prevents alg:none and RS256→HS256 attacks
    issuer:     'https://auth.example.com',
    audience:   'api.example.com',
  }) as { sub: string; roles: string[] };

  return payload;
}

// ── Express middleware ───────────────────────────────────────────────────────
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });

  try {
    const token = header.slice(7);
    const payload = verifyToken(token);
    (req as any).user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}`,
  },
  {
    label: 'JWKS Endpoint + Dynamic Key Fetch',
    language: 'typescript',
    code: `import jwksClient from 'jwks-rsa';
import jwt from 'jsonwebtoken';

// ── JWKS client — fetches & caches public keys from well-known endpoint ──────
const client = jwksClient({
  jwksUri:  'https://auth.example.com/.well-known/jwks.json',
  cache:    true,
  rateLimit: true,
  jwksRequestsPerMinute: 5,
});

async function verifyJwt(token: string): Promise<Record<string, unknown>> {
  const decoded = jwt.decode(token, { complete: true });
  if (!decoded || typeof decoded === 'string') throw new Error('Malformed JWT');

  // Use kid from header to fetch the correct public key
  const key = await client.getSigningKey(decoded.header.kid);
  const publicKey = key.getPublicKey();

  return jwt.verify(token, publicKey, {
    algorithms: ['RS256'],
    issuer:   'https://auth.example.com',
    audience: 'api.example.com',
  }) as Record<string, unknown>;
}

// ── Key rotation — expose JWKS endpoint ─────────────────────────────────────
// When rotating keys: add the new key to JWKS, issue new tokens with the new kid.
// Old tokens (with old kid) continue to verify using the old public key (keep it in JWKS).
// Remove old key from JWKS only after all old tokens have expired.`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Not specifying the allowed algorithm (alg:none attack)',
    wrong: `jwt.verify(token, publicKey); // allows any algorithm including 'none'`,
    right: `jwt.verify(token, publicKey, { algorithms: ['RS256'] }); // explicit`,
    explanation: 'Without specifying algorithms, some JWT libraries accept tokens with `"alg":"none"` — no signature required. Always hard-code the expected algorithm.',
  },
  {
    title: 'Not verifying the audience claim',
    wrong: `jwt.verify(token, publicKey, { algorithms: ['RS256'], issuer: '...' }); // no audience`,
    right: `jwt.verify(token, publicKey, { algorithms: ['RS256'], issuer: '...', audience: 'api.example.com' });`,
    explanation: 'Without audience validation, a token issued for service A can be replayed against service B. The `aud` claim binds a token to its intended recipient.',
  },
  {
    title: 'Storing sensitive data in the JWT payload',
    wrong: `jwt.sign({ sub: userId, ssn: '123-45-6789', creditCard: '...' }, key);`,
    right: `jwt.sign({ sub: userId, roles: ['user'] }, key); // minimal claims only`,
    explanation: 'JWT payloads are base64url encoded, not encrypted — they are readable by anyone with the token. Store only non-sensitive identifiers and roles; fetch sensitive data server-side using the user ID.',
  },
  {
    title: 'Using long-lived access tokens with no revocation',
    wrong: `jwt.sign({ sub: userId }, key, { expiresIn: '30d' }); // 30-day access token`,
    right: `jwt.sign({ sub: userId }, key, { expiresIn: '15m' }); // short-lived + refresh token`,
    explanation: 'JWTs are stateless — once issued they cannot be revoked before expiry without a token blacklist (which reintroduces state). Short access tokens (15 min) limit the damage window of a stolen token.',
  },
];

const challenge: Challenge = {
  title: 'JWT Payload Decoder',
  language: 'typescript',
  description: `Implement decodeJwtPayload(token: string): Record<string, unknown> that:
1. Splits the token on "." and takes the second segment (payload)
2. Base64url-decodes it (replace - with +, _ with /, pad with = as needed)
3. JSON.parses the result
4. Throws 'Invalid JWT format' if the token doesn't have 3 parts`,
  hints: [
    'base64url: replace - → + and _ → / before atob()',
    'Padding: add "=" until length is a multiple of 4',
    'atob() decodes base64 to string',
  ],
  starterCode: `function decodeJwtPayload(token: string): Record<string, unknown> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT format');
  // TODO: base64url-decode parts[1] and JSON.parse
  return {};
}`,
  solution: `function decodeJwtPayload(token: string): Record<string, unknown> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT format');

  let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) base64 += '=';

  const json = atob(base64);
  return JSON.parse(json);
}

// Test
const testToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsInJvbGVzIjpbInVzZXIiXSwiZXhwIjoxNzAwMDAwMDAwfQ.signature';
const payload = decodeJwtPayload(testToken);
console.log(payload); // { sub: 'user-123', roles: ['user'], exp: 1700000000 }`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'Why should you always specify `algorithms: [\'RS256\']` when calling jwt.verify()?',
    options: [
      'For performance — the library checks fewer code paths',
      'To prevent the alg:none attack where a token with no signature is accepted',
      'Required by the JWT specification',
      'To enable automatic key rotation',
    ],
    answer: 1,
    explanation: 'Without specifying allowed algorithms, some libraries accept tokens where `"alg":"none"` — meaning the token has no signature and anyone can forge claims. Always hard-code the expected algorithm to close this attack vector.',
  },
  {
    q: 'What is in a JWT payload, and is it secret?',
    options: [
      'Encrypted user data — fully secret',
      'Base64url-encoded claims — readable by anyone with the token, NOT secret',
      'A symmetric encryption key',
      'The signature verification key',
    ],
    answer: 1,
    explanation: 'JWT payloads are base64url encoded, not encrypted. Decode the middle segment of any JWT and you get plaintext JSON. Never put passwords, SSNs, or sensitive data in a JWT payload — use JWE (JSON Web Encryption) if you need encrypted payloads.',
  },
  { q: 'What is the alg:none vulnerability in JWT and how is it exploited?', options: ['Setting the algorithm to none removes the signature requirement; servers that accept alg:none tokens trust any payload without verification', 'The none algorithm is the most secure because it removes the need for a key', 'Attackers set alg:none to bypass expiration check only', 'alg:none vulnerability only affects symmetric algorithms like HS256'], answer: 0, explanation: 'JWT alg:none attack: some JWT libraries accept tokens with algorithm set to none and no signature. An attacker creates a token: { alg: none, typ: JWT } with arbitrary payload { sub: admin }. If the library accepts alg:none, it decodes the payload without signature verification, treating it as valid. The attacker becomes admin without knowing any secret. Fix: explicitly specify the allowed algorithm in the library configuration. Never accept the algorithm field from the token itself. Most modern libraries reject alg:none by default, but always configure explicitly: new JwtParser().requireAlgorithm(HS256).' },
  { q: 'What is JWT RS256 vs HS256 and what is the algorithm confusion attack?', options: ['RS256 and HS256 produce different key lengths; there is no interoperability between them', 'RS256 uses RSA asymmetric signing (private key signs, public key verifies); HS256 uses a shared secret; the algorithm confusion attack makes an HS256 server use the RS256 public key as the HMAC secret', 'RS256 is deprecated; HS256 is the recommended algorithm for all use cases', 'RS256 is for server-to-server; HS256 is for client-to-server tokens; they cannot be confused'], answer: 1, explanation: 'RS256: asymmetric. Server signs with private key. Clients verify with the public key (which is public). HS256: symmetric. Both parties share the same secret key. Algorithm confusion attack: if the server uses the RS256 public key as the HS256 HMAC secret to verify tokens, and the server accepts either RS256 or HS256, an attacker can: obtain the RS256 public key (it is public). Sign a forged token with HS256 using that public key as the HMAC secret. The server verifies it with HS256 using the public key as the secret — it matches. Fix: validate that the algorithm in the token matches the expected algorithm. Reject any token that specifies an algorithm other than the configured one.' },
  { q: 'What are the security considerations for JWT expiration and token refresh?', options: ['JWTs should have long expiration times so users are not repeatedly logged out', 'Short-lived access tokens (15 min) reduce the window of use if stolen; refresh tokens (longer-lived, stored securely, rotatable) issue new access tokens without re-authentication', 'JWT expiration is a hint only; servers should not enforce it strictly to avoid user disruption', 'Refresh tokens must have the same expiration as access tokens to maintain session consistency'], answer: 1, explanation: 'Short-lived access tokens (15 minutes): limits the window if an access token is stolen. The stolen token becomes invalid quickly. Long-lived session maintenance: use refresh tokens. A refresh token has a longer lifetime (hours/days) and is stored securely (HttpOnly cookie, secure storage). To refresh: client sends refresh token to the /token endpoint. Server validates the refresh token and issues a new access token. Refresh token rotation: each refresh invalidates the old refresh token and issues a new one. If a refresh token is replayed after use, the server detects the re-use and invalidates all refresh tokens for that session (detect potential theft). Implement refresh token families to track rotation.' },
  { q: 'How do you implement JWT token revocation given that JWTs are stateless?', options: ['JWTs cannot be revoked; once issued they are valid until expiration', 'Since JWTs are self-contained, revocation requires server-side tracking of revoked tokens in a denylist or using very short expiration times', 'JWT revocation is handled automatically by the aud claim expiring', 'Set the exp claim to the current time to immediately invalidate a token'], answer: 1, explanation: 'JWT statelessness means the server does not need to store session state, but this also means there is no built-in revocation mechanism. Revocation strategies: token denylist (blocklist): on logout or revoke, store the jti (JWT ID) in Redis with a TTL equal to the remaining token lifetime. Each request checks the denylist. Fast but adds Redis dependency. Short expiration: use 1-15 minute tokens. Revocation is implicit when the token expires. Require reauthentication for sensitive operations. Refresh token revocation: revoke the refresh token in the database; the short-lived access token expires naturally. Version counter: store a token version per user. Increment on logout. Reject tokens with outdated version numbers. Each option trades statefulness for revocation granularity.' },
];

const qna: QnaItem[] = [
  {
    q: 'How do you revoke a JWT before it expires?',
    a: 'JWTs are stateless — there is no built-in revocation. Options: <ol><li><strong>Short expiry</strong>: 15-minute access tokens — theft window is naturally limited. Pair with refresh token rotation.</li><li><strong>Token blacklist</strong>: store revoked token JTIs (JWT ID claim) in Redis; check on every request. Reintroduces state but enables instant revocation.</li><li><strong>Token version</strong>: store a <code>tokenVersion</code> per user in DB; include it in the JWT. On revocation, increment the DB version — all old tokens fail version check. Cheaper than per-token blacklisting.</li></ol>',
  },
  {
    q: 'What is the difference between a JWT and a session cookie?',
    a: '<strong>Session cookie</strong>: stores a random session ID; all session data is server-side (DB or Redis). Scalable only with shared session store. Easy to invalidate. <strong>JWT</strong>: self-contained — all claims are in the token; server is stateless. Scales horizontally with no shared store. Hard to revoke before expiry. Trade-off: session cookies give instant revocation at the cost of a server-side store; JWTs eliminate the store at the cost of revocation complexity.',
  },
  { q: 'What should you validate when receiving a JWT from a client?', a: 'Complete JWT validation checklist: verify the signature using the correct algorithm and key (reject if invalid). Verify the algorithm is the expected one (reject alg:none and unexpected algorithms). Verify iss (issuer) matches the expected value. Verify aud (audience) matches the intended service. Verify exp (expiration) is in the future (reject expired tokens). Verify nbf (not-before) is in the past, if present. Optionally verify iat (issued-at) for detecting unusual timestamps. Check the jti (JWT ID) against a revocation denylist if token revocation is implemented. Do not trust any claim in the token payload until the signature and standard claims are validated. In .NET: AddJwtBearer() validates all of these when properly configured with authority and audience. Never manually parse a JWT without going through a validated library.' },
  { q: 'What are the security risks of storing JWTs in localStorage vs HttpOnly cookies?', a: 'localStorage: accessible from JavaScript. If the site has any XSS vulnerability, the attacker JavaScript can read the token and exfiltrate it. Easy to implement, no CSRF concerns. HttpOnly cookie: inaccessible from JavaScript, even if XSS is present. The browser automatically includes it in requests, so no JavaScript management needed. However, HttpOnly cookies are subject to CSRF attacks (a cross-site form submission automatically includes the cookie). Mitigate CSRF with SameSite=Lax/Strict. Session storage: accessible from JavaScript (same XSS risk as localStorage), cleared on tab close. Recommendation: HttpOnly + Secure + SameSite=Lax cookies provide the best defense when combined with CSRF protection. localStorage is acceptable only when the site has strong XSS prevention and the token scope is minimal.' },
  { q: 'What is the JWT best practice for sensitive claims and data minimization?', a: 'JWT payloads are Base64-encoded and can be decoded by anyone holding the token. Sensitive claims to avoid: passwords or password hashes (never). Personally Identifiable Information beyond what is necessary (minimize). Financial data or health records. Internal system architecture details that aid attackers. Appropriate claims: user ID (sub) for identity. Roles or permissions needed for the relying party. Token metadata (iss, aud, exp, iat, jti). Feature flags or preferences. For truly sensitive data: use JWE (JSON Web Encryption) to encrypt the payload. Store sensitive data server-side and include only a reference identifier in the JWT. Apply data minimization: include only claims that the receiving service actually needs.' },
  { q: 'How do you implement JWT for microservice-to-microservice authentication?', a: 'Service-to-service JWT patterns: machine-to-machine (M2M) tokens: each service has its own client ID and client secret. Services request access tokens from the identity provider using the OAuth 2.0 Client Credentials flow. The token contains service identity claims (sub = service ID, scope = target service permissions). Downstream services validate the token against the issuer. Short expiry (1-5 minutes) since services can refresh automatically. Propagation pattern: a user request arrives with a user JWT. The API gateway issues a new service JWT (or propagates the user JWT with scope restriction) for downstream calls. Mutual TLS (mTLS): an alternative where services authenticate via client certificates instead of JWTs. Both approaches can be combined: mTLS for transport authentication and JWT for authorization claims.' },
];

const revision: RevisionSummary = {
  oneLiner: 'A JWT is a signed (not encrypted) header.payload.signature — always verify iss, aud, exp, and algorithm explicitly; keep access tokens short-lived.',
  mustKnow: [
    'JWT = header.payload.signature — base64url encoded, NOT encrypted',
    'Payload is readable by anyone — never store sensitive data',
    'Always specify algorithms explicitly — prevents alg:none and RS256→HS256 attacks',
    'Always verify iss, aud, exp — prevents issuer spoofing, token reuse, expired tokens',
    'RS256 (asymmetric) preferred over HS256 (shared secret) for multi-service architectures',
    'Short-lived access tokens (15 min) limit theft impact; pair with refresh token rotation',
  ],
  interviewFocus: [
    'Explain the alg:none attack and how to prevent it',
    'Why is it important to validate the aud claim?',
    'How would you implement JWT revocation?',
  ],
};

@Component({
  selector: 'app-sec-jwt',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './jwt.html',
  styleUrl: './jwt.scss',
})
export class SecJwt {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
