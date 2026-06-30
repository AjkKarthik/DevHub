import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../components/shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../../components/shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../../components/shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../components/shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../../components/shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../../components/shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../../components/shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../../components/shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../../components/shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../../components/shared/page-complete/page-complete';

@Component({
  selector: 'app-node-jwt-auth',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './jwt-auth.html',
  styleUrl: './jwt-auth.scss'
})
export class NodeJwtAuth {
  quickRef: QuickRefItem[] = [
    { name: 'jwt.sign(payload, secret, options)', type: 'function', desc: 'Create a signed JWT. Include exp, iss, aud in options for production tokens.' },
    { name: 'jwt.verify(token, secret)', type: 'function', desc: 'Verify and decode a JWT. Throws JsonWebTokenError or TokenExpiredError on failure.' },
    { name: 'Access token', type: 'keyword', desc: 'Short-lived JWT (15m–1h) sent in Authorization header. Stateless — verify without DB.' },
    { name: 'Refresh token', type: 'keyword', desc: 'Long-lived opaque token (7–30d) stored in DB. Used to get new access tokens.' },
    { name: 'httpOnly cookie', type: 'keyword', desc: 'Stores refresh token server-side; inaccessible to JavaScript — prevents XSS theft.' },
    { name: 'RS256 / ES256', type: 'keyword', desc: 'Asymmetric signing: private key signs, public key verifies. Safe to expose public key.' },
    { name: 'HS256', type: 'keyword', desc: 'Symmetric signing with a shared secret. Both sign and verify need the same secret.' },
    { name: 'Token blacklist', type: 'keyword', desc: 'Redis set of invalidated JTI (JWT IDs) for logout/revocation before expiry.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'JWT Structure and Verification',
      points: [
        'A JWT is three Base64URL-encoded parts: header.payload.signature. The header specifies the algorithm (alg: HS256, RS256). The payload contains claims: sub (subject/user ID), iat (issued at), exp (expiry), and custom data. The signature is a cryptographic hash of header + payload.',
        'Verifying a JWT does not require a database lookup — the server re-computes the signature using its secret and compares. If the signature matches and exp is in the future, the token is valid. This is what makes JWTs stateless and horizontally scalable.',
        'Claims to always include: sub (user ID), iat (issue time), exp (expiry), jti (unique token ID for revocation), iss (issuer), aud (intended audience). Never put sensitive data (passwords, payment info) in the payload — it is base64 encoded, NOT encrypted.',
        'Algorithm security: never accept "none" algorithm. Validate the alg header matches expected. RS256/ES256 are preferred for multi-service auth — services hold only the public key to verify, not the private signing key.',
      ]
    },
    {
      heading: 'Access Tokens and Refresh Tokens',
      points: [
        'Access tokens are short-lived (15 minutes to 1 hour) JWTs sent in the Authorization: Bearer header. Short expiry limits the damage window if a token is stolen. They are stateless — no DB lookup needed to validate.',
        'Refresh tokens are long-lived (7–30 days) opaque tokens stored in the database. When the access token expires, the client sends the refresh token to /auth/refresh to get a new access token. Store refresh tokens hashed in the DB (like passwords).',
        'Refresh token rotation: each /refresh call invalidates the old refresh token and issues a new one. Detect theft: if an already-used refresh token is presented, invalidate the entire family (all tokens for that user). This is called refresh token family rotation.',
        'Logout: delete the refresh token from the database. The access token remains valid until it expires — this is a trade-off of stateless auth. Add the JTI to a Redis blacklist if immediate revocation is required.',
      ]
    },
    {
      heading: 'Secure Token Storage and Transport',
      points: [
        'Access tokens in localStorage are accessible to any JavaScript on the page — XSS attacks can steal them. Storing in memory (React state) is safer but lost on page refresh. In-memory + silent refresh is the recommended SPA pattern.',
        'Refresh tokens should be stored in httpOnly cookies with Secure and SameSite=Strict flags. httpOnly makes them inaccessible to JavaScript. Secure sends them only over HTTPS. SameSite=Strict prevents CSRF. This combination protects against both XSS and CSRF for refresh tokens.',
        'Cookie vs Authorization header: httpOnly cookie is the more secure transport for tokens. Authorization header requires JavaScript to manage (vulnerable to XSS). For third-party clients or mobile apps, Authorization header with in-memory token storage is standard.',
        'Rate limit authentication endpoints — /login, /register, /refresh — more aggressively than other routes. Use a sliding window with a lower limit (5 attempts per minute vs 100 for API routes). Lock accounts after N failed attempts.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'JWT sign, verify, middleware',
      language: 'typescript',
      code: `import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';

const ACCESS_SECRET  = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

export function signAccessToken(userId) {
  return jwt.sign(
    { sub: userId, jti: randomUUID() },
    ACCESS_SECRET,
    { expiresIn: '15m', issuer: 'devhub-api', audience: 'devhub-client' }
  );
}

export function signRefreshToken(userId, family) {
  return jwt.sign(
    { sub: userId, family, jti: randomUUID() },
    REFRESH_SECRET,
    { expiresIn: '7d' }
  );
}

// Auth middleware
export function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });
  const token = auth.slice(7);
  try {
    req.user = jwt.verify(token, ACCESS_SECRET, {
      issuer:   'devhub-api',
      audience: 'devhub-client',
    });
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(401).json({ error: 'Token expired' });
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Protected route
app.get('/me', requireAuth, (req, res) => res.json({ userId: req.user.sub }));`
    },
    {
      label: 'Refresh token rotation',
      language: 'typescript',
      code: `import bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';

// Login — issue both tokens
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await db.users.findByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.passwordHash)))
    return res.status(401).json({ error: 'Invalid credentials' });

  const family = randomUUID();  // each device gets its own token family
  const refreshToken = signRefreshToken(user.id, family);
  const accessToken  = signAccessToken(user.id);

  await db.refreshTokens.create({
    userId:      user.id,
    tokenHash:   await bcrypt.hash(refreshToken, 10),
    family,
    expiresAt:   new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  res.cookie('refresh_token', refreshToken, {
    httpOnly: true, secure: true, sameSite: 'Strict', maxAge: 7 * 24 * 3600 * 1000,
  });
  res.json({ accessToken });
});

// Refresh — rotate the refresh token
app.post('/auth/refresh', async (req, res) => {
  const refreshToken = req.cookies.refresh_token;
  if (!refreshToken) return res.status(401).json({ error: 'No refresh token' });

  let payload;
  try { payload = jwt.verify(refreshToken, REFRESH_SECRET); }
  catch { return res.status(401).json({ error: 'Invalid refresh token' }); }

  const stored = await db.refreshTokens.findByFamily(payload.family);
  if (!stored) return res.status(401).json({ error: 'Token family reused — possible theft' });

  if (!(await bcrypt.compare(refreshToken, stored.tokenHash))) {
    // Token reuse detected — invalidate entire family
    await db.refreshTokens.deleteByFamily(payload.family);
    return res.status(401).json({ error: 'Token reuse detected' });
  }

  await db.refreshTokens.delete(stored.id);  // invalidate old token

  const newRefresh = signRefreshToken(payload.sub, payload.family);
  const newAccess  = signAccessToken(payload.sub);
  await db.refreshTokens.create({ userId: payload.sub, tokenHash: await bcrypt.hash(newRefresh, 10), family: payload.family, expiresAt: new Date(Date.now() + 7 * 86400 * 1000) });

  res.cookie('refresh_token', newRefresh, { httpOnly: true, secure: true, sameSite: 'Strict', maxAge: 7 * 24 * 3600 * 1000 });
  res.json({ accessToken: newAccess });
});`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Storing sensitive data in JWT payload',
      wrong: `jwt.sign({ userId, email, role, password: user.password }, secret)`,
      right: `jwt.sign({ sub: userId, role }, secret, { expiresIn: '15m' })`,
      explanation: 'JWT payloads are Base64-encoded, not encrypted. Anyone with the token can decode and read the payload. Never include passwords, payment info, SSNs, or API keys. Include only the minimum needed: user ID, role, expiry.'
    },
    {
      title: 'Using a weak or hardcoded JWT secret',
      wrong: `const secret = 'mysecret'; // hardcoded, short, predictable`,
      right: `// Generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
const secret = process.env.JWT_SECRET; // 256-bit random secret from env`,
      explanation: 'A short or predictable secret can be brute-forced offline given any valid JWT. JWT secrets should be at least 256 bits (32 bytes) of cryptographic randomness, stored as an environment variable, never in source code.'
    },
    {
      title: 'Not validating iss and aud claims',
      wrong: `jwt.verify(token, secret) // accepts tokens from any issuer`,
      right: `jwt.verify(token, secret, { issuer: 'api.myapp.com', audience: 'myapp-client' })`,
      explanation: 'Without iss/aud validation, a token issued by your dev server or a different service is accepted by your production server. Always validate issuer and audience to prevent token substitution attacks.'
    },
    {
      title: 'Refresh tokens in localStorage',
      wrong: `localStorage.setItem('refresh_token', token); // accessible to any JS — XSS risk`,
      right: `// Store refresh token in httpOnly cookie set by server
res.cookie('refresh_token', token, { httpOnly: true, secure: true, sameSite: 'Strict' });`,
      explanation: 'localStorage is accessible to all JavaScript on the page. An XSS vulnerability anywhere on the site exposes the refresh token. httpOnly cookies are inaccessible to JavaScript entirely — the browser sends them automatically but JS cannot read them.'
    },
  ];

  challenge: Challenge = {
    title: 'Auth Middleware with Role Check',
    language: 'typescript',
    description: 'Build an Express middleware system: requireAuth(req, res, next) that verifies a Bearer JWT and attaches req.user. requireRole(...roles) that returns middleware checking req.user.role is in the allowed list. Combine them to protect /admin routes. Handle expired tokens with a specific 401 message distinct from invalid tokens.',
    hints: [
      'requireRole returns a middleware function (currying pattern)',
      'Check err.name === "TokenExpiredError" for specific expiry message',
      'Route: app.get("/admin", requireAuth, requireRole("admin"), handler)',
    ],
    starterCode: `import jwt from 'jsonwebtoken';
const SECRET = process.env.JWT_SECRET;

function requireAuth(req, res, next) {
  // TODO: extract Bearer token, verify, attach req.user
}

function requireRole(...roles) {
  // TODO: return middleware that checks req.user.role
}

app.get('/admin', requireAuth, requireRole('admin'), (req, res) => {
  res.json({ message: 'Admin only', user: req.user });
});`,
    solution: `import jwt from 'jsonwebtoken';
const SECRET = process.env.JWT_SECRET;

function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header required' });
  }
  try {
    req.user = jwt.verify(auth.slice(7), SECRET, {
      issuer:   process.env.JWT_ISSUER,
      audience: process.env.JWT_AUDIENCE,
    });
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Invalid token', code: 'INVALID_TOKEN' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions', required: roles });
    }
    next();
  };
}

app.get('/admin', requireAuth, requireRole('admin'), (req, res) => {
  res.json({ message: 'Admin only', user: req.user });
});
app.get('/moderator', requireAuth, requireRole('admin', 'moderator'), (req, res) => {
  res.json({ user: req.user });
});`
  };

  quiz: QuizQuestion[] = [
    { q: 'Why should JWT payloads never contain sensitive data?', options: ['JWTs have a size limit', 'JWT payloads are Base64-encoded, not encrypted — anyone can decode them', 'JWT signing fails with large payloads', 'Sensitive data increases verification time'], answer: 1, explanation: 'The JWT payload is Base64URL-encoded — not encrypted. Anyone who has the token (including an attacker who stole it) can decode and read all claims. Include only user ID, role, and expiry — never passwords, credit cards, or SSNs.' },
    { q: 'What is the purpose of refresh token rotation?', options: ['To reduce database load', 'Each use of a refresh token invalidates it and issues a new one — reuse detection catches stolen tokens', 'To extend access token lifetimes', 'To synchronize tokens across servers'], answer: 1, explanation: 'Rotation invalidates the old refresh token on each use. If an attacker steals and uses a refresh token, when the legitimate client tries to use the original (now invalidated) token, the server detects reuse and can invalidate the entire token family.' },
    { q: 'Why store refresh tokens in httpOnly cookies rather than localStorage?', options: ['Cookies have higher storage limits', 'httpOnly cookies are inaccessible to JavaScript — XSS attacks cannot steal them', 'Cookies are sent automatically by browsers', 'localStorage is too slow'], answer: 1, explanation: 'httpOnly cookies cannot be read by JavaScript — document.cookie does not include them. An XSS attack that injects malicious JS into your page cannot steal the refresh token. localStorage has no such protection.' },
    { q: 'What is the difference between HS256 and RS256 JWT algorithms?', options: ['HS256 is newer', 'HS256 is symmetric (shared secret); RS256 is asymmetric (private key signs, public key verifies)', 'RS256 produces shorter tokens', 'HS256 requires a certificate'], answer: 1, explanation: 'HS256 uses one shared secret for both signing and verification — all services need the secret. RS256 uses a key pair: only the auth server needs the private key to sign; other services verify with the public key (safe to expose). RS256 is preferred for microservices.' },
    { q: 'What is the exp claim in a JWT and what happens when it is in the past?', options: ['exp is the expiry date in ISO format', 'exp is Unix timestamp in seconds; jwt.verify() throws TokenExpiredError if Date.now()/1000 > exp', 'exp is set by the client', 'exp only matters for refresh tokens'], answer: 1, explanation: 'exp (expiration) is a Unix timestamp (seconds since epoch). jwt.verify() automatically checks exp against the current time. If the token is expired, it throws TokenExpiredError. Set short exp for access tokens (15min) and longer for refresh tokens (7–30 days). Always check exp on the server — never trust the client to check it.' },
    { q: 'What is token blacklisting and when is it needed?', options: ['Blocking tokens from specific IP addresses', 'Storing invalidated tokens server-side to force logout before exp — needed when immediate revocation is required', 'Encrypting tokens before storage', 'Rotating tokens every minute'], answer: 1, explanation: 'JWTs are stateless — once issued, they are valid until exp. If a user logs out, changes password, or is banned, the old token is still technically valid. Token blacklisting stores invalidated JTI (JWT ID) claims in Redis until token expiry. Alternative: short-lived access tokens (15min) with refresh token rotation — blacklisting is only needed if 15min window is unacceptable.' },
  ];

  qna: QnaItem[] = [
    { q: 'How do you implement logout with JWTs?', a: 'Delete the refresh token from the database and clear the httpOnly cookie. The access token remains valid until it expires (15m–1h) — this is the core trade-off of stateless auth. For immediate revocation, add the access token\'s JTI to a Redis blacklist with TTL matching the token expiry. The auth middleware checks the blacklist on every request. Most applications accept the short expiry window without blacklisting.' },
    { q: 'Should I use JWTs or server-side sessions?', a: 'JWTs: stateless, no DB lookup per request, natural fit for microservices and mobile apps, horizontal scaling without sticky sessions. Sessions: easy to revoke instantly (delete from DB/Redis), no payload size concerns, simpler token theft response. For microservices with shared auth: JWTs. For single-server web apps where instant revocation and smaller complexity matter: sessions. Both are valid — the choice depends on your architecture.' },
    { q: 'What is a token family and why does it matter?', a: 'A token family is a group of refresh tokens issued to one device/login. Each device gets a unique family ID. When a refresh token is used, it is invalidated and a new one with the same family is issued. If an already-used token from a family is presented (reuse detected), ALL tokens in that family are invalidated — logging out that device entirely. This limits the blast radius of a stolen token to one device rather than all sessions.' },
    { q: 'Why should you store the JWT signing secret as an environment variable rather than hardcoding it in source?', a: 'A hardcoded secret committed to version control is permanently exposed in git history, readable by anyone with repository access including former collaborators or leaked clones — and rotating it requires a code change and redeploy rather than a simple config update. Storing it as an environment variable (or better, in a secrets manager) keeps it out of source control, allows different secrets per environment, and supports rotation without code changes.' },
    { q: 'What is the security risk of storing a JWT in localStorage versus an httpOnly cookie?', a: 'Tokens in localStorage are accessible to any JavaScript running on the page, making them vulnerable to theft via XSS attacks — a single injected script can read and exfiltrate the token. An httpOnly cookie is inaccessible to JavaScript entirely, eliminating that attack vector, though it introduces its own consideration: CSRF protection (via SameSite cookie attributes and/or CSRF tokens) becomes necessary since the browser will automatically attach the cookie to same-origin requests.' },
    { q: 'How do you implement JWT refresh token rotation securely in a Node.js API?', a: 'Issue a short-lived access token (minutes) and a longer-lived refresh token (days/weeks), storing the refresh token hashed in the database alongside a unique ID. On each refresh, validate the incoming refresh token against the stored hash, issue a new access token AND a new refresh token, and invalidate (delete or mark used) the old refresh token — this "rotation" means a stolen refresh token can only be used once before detection, since reuse of an already-rotated token signals a likely compromise and should trigger revoking the entire token family.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'JWTs are stateless auth tokens — short-lived access tokens + long-lived refresh tokens with rotation. Never put sensitive data in payload; store refresh tokens in httpOnly cookies.',
    mustKnow: [
      'JWT: header.payload.signature — payload is Base64, NOT encrypted.',
      'Access token: 15m–1h, stateless verify. Refresh token: 7–30d, stored in DB.',
      'Refresh token rotation: invalidate on use, detect reuse, invalidate family on theft.',
      'httpOnly cookies prevent XSS from stealing refresh tokens.',
      'Always validate iss and aud claims in jwt.verify().',
      'HS256: shared secret. RS256: private sign, public verify.',
      'Logout: delete refresh token from DB + clear cookie. Blacklist JTI for immediate revocation.',
    ],
    interviewFocus: [
      'How does refresh token rotation prevent token theft?',
      'Why are JWTs not encrypted, and what does that mean for what you put in them?',
      'How do you implement logout with stateless JWTs?',
    ]
  };
}
