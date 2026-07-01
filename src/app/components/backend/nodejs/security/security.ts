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
  selector: 'app-node-security',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './security.html',
  styleUrl: './security.scss'
})
export class NodeSecurity {
  quickRef: QuickRefItem[] = [
    { name: 'helmet()', type: 'function', desc: 'Sets 15+ HTTP security headers: CSP, HSTS, X-Frame-Options, no-sniff, referrer policy.' },
    { name: 'express-rate-limit', type: 'keyword', desc: 'Rate limiting middleware. WindowMs + max controls request rate per IP.' },
    { name: 'CORS', type: 'keyword', desc: 'Cross-Origin Resource Sharing. Set allowed origins, methods, headers explicitly.' },
    { name: 'bcrypt.hash()', type: 'function', desc: 'Hash passwords with bcrypt (cost factor 12). Never store plain text or MD5/SHA.' },
    { name: 'DOMPurify / validator', type: 'keyword', desc: 'Sanitise user input. validator.js for format checks, DOMPurify for HTML sanitisation.' },
    { name: 'SQL/NoSQL injection', type: 'keyword', desc: 'Use parameterized queries and ODM/ORM. Never interpolate user input into queries.' },
    { name: 'CSRF token', type: 'keyword', desc: 'Anti-CSRF double-submit cookie or synchronizer token for state-changing requests.' },
    { name: 'Content-Security-Policy', type: 'keyword', desc: 'HTTP header restricting script/style sources — primary defence against XSS.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'HTTP Security Headers with Helmet',
      points: [
        'Helmet sets security-focused HTTP response headers. A single app.use(helmet()) adds: Content-Security-Policy, Strict-Transport-Security (HSTS), X-Content-Type-Options (no-sniff), X-Frame-Options (clickjacking), Referrer-Policy, and Permissions-Policy.',
        'Content-Security-Policy (CSP) is the most important header. It tells the browser which script/style sources are allowed. A strict CSP prevents XSS from loading external malicious scripts. Start with default-src: "self" and incrementally add trusted domains.',
        'HSTS forces HTTPS for all future requests for a domain (max-age=31536000 is 1 year). includeSubDomains extends to all subdomains. preload submits the domain to browser HSTS preload lists — no first-request downgrade attack possible.',
        'X-Content-Type-Options: nosniff prevents browsers from MIME-sniffing responses (serving HTML disguised as an image to bypass XSS filters). X-Frame-Options: DENY prevents clickjacking by blocking the page from being loaded in an iframe.',
      ]
    },
    {
      heading: 'Input Validation, Injection Prevention, and Rate Limiting',
      points: [
        'Validate all input at system boundaries: HTTP body, query params, headers, cookies. Use Zod or Joi for schema validation — reject requests that fail validation before they reach business logic. Never trust client data.',
        'SQL injection: use parameterized queries (prepared statements). ORM/ODM layers (Prisma, Mongoose) parameterize automatically — never bypass with string interpolation. NoSQL injection: validate that objects from user input are not passed directly to MongoDB queries ({ $where } operator injection).',
        'Rate limiting protects against brute force, credential stuffing, and DoS. Apply more aggressive limits to auth endpoints (/login: 5/min) than API endpoints (100/min). Use redis-based sliding window limits (express-rate-limit with Redis store) for multi-instance deployments — in-memory limits only work on single processes.',
        'CORS: always set an explicit allowlist of origins (never * for authenticated APIs). Configure allowed methods and headers. Credentials (cookies, auth headers) require { credentials: true } on the client AND explicit origin (not *) on the server.',
      ]
    },
    {
      heading: 'Password Security and Secret Management',
      points: [
        'Never store plain-text passwords. Use bcrypt with cost factor 12 (2^12 = 4096 hash iterations). bcrypt is intentionally slow — makes brute force expensive. Argon2id is the modern alternative and winner of the Password Hashing Competition.',
        'Never log passwords, tokens, or credit card numbers. Sanitize error messages before logging — an error from a DB query might include the query with embedded user input. Use structured logging and configure log sanitizers.',
        'Secrets (API keys, DB passwords, JWT secrets) must live in environment variables — never in source code. Use dotenv locally, and a secrets manager (AWS Secrets Manager, HashiCorp Vault, Doppler) in production. Rotate secrets regularly.',
        'Dependency security: run npm audit regularly, pin dependency versions (package-lock.json), use Dependabot or Snyk for automated vulnerability alerts. A supply chain attack in a popular npm package (event-stream 2018, colors 2022) can compromise your app without any change to your code.',
      ]
    },
    {
      heading: 'Input Validation and Injection Prevention',
      points: [
        'Never trust client input — validate type, format, and range for every field on every request, using a schema library (Zod, Joi) as dedicated middleware rather than scattered manual checks that are easy to forget on new endpoints.',
        'SQL/NoSQL injection is prevented primarily by parameterized queries (never string-concatenating user input into a query) — for MongoDB specifically, also sanitize input to strip keys starting with $ or containing . that could inject query operators.',
        'Cross-Site Scripting (XSS) prevention requires context-aware output encoding — data rendered into HTML needs HTML-entity encoding, data rendered into a URL needs URL encoding; a single generic "sanitize everything" approach often misses context-specific escaping needs.',
        'Rate limiting (per-IP for anonymous traffic, per-account for authenticated) mitigates brute-force credential attacks and API abuse — apply stricter limits to sensitive endpoints (login, password reset) than to general read endpoints.',
      ]
    },
    {
      heading: 'Secure Headers and Transport Security',
      points: [
        'The helmet middleware sets a battery of security-related HTTP response headers with secure defaults in one line — Content-Security-Policy, X-Frame-Options, Strict-Transport-Security — encoding well-researched defaults so teams do not need to rediscover this knowledge manually.',
        'HTTPS should be enforced everywhere in production, including redirecting any HTTP request to HTTPS — sensitive data (auth tokens, passwords) sent over plain HTTP is trivially interceptable on any network path between client and server.',
        'CORS configuration should specify an explicit allowlist of trusted origins, never a wildcard combined with credentials — Access-Control-Allow-Origin: * with Access-Control-Allow-Credentials: true is an invalid, browser-rejected combination for good reason.',
        'Dependency vulnerabilities are a real attack surface — run npm audit (or a dedicated tool like Snyk/Dependabot) regularly and keep dependencies patched, since a known CVE in a transitive dependency is a common real-world compromise vector.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Helmet, CORS, rate limiting',
      language: 'typescript',
      code: `import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

const app = express();

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'", "'nonce-<%= nonce %>'"],  // allow only nonce-tagged scripts
      imgSrc:     ["'self'", 'data:', 'https://cdn.example.com'],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
}));

// CORS — explicit allowlist
const allowedOrigins = ['https://myapp.com', 'https://www.myapp.com'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error('Not allowed by CORS'));
  },
  credentials: true,           // allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Global rate limit
app.use(rateLimit({ windowMs: 60 * 1000, max: 100, standardHeaders: true }));

// Strict limit on auth endpoints
const authLimiter = rateLimit({ windowMs: 60 * 1000, max: 5, message: { error: 'Too many attempts' } });
app.use('/auth', authLimiter);`
    },
    {
      label: 'Input validation and password hashing',
      language: 'typescript',
      code: `import { z } from 'zod';
import bcrypt from 'bcrypt';
import validator from 'validator';

// Zod schema validation
const registerSchema = z.object({
  email:    z.string().email().max(255).toLowerCase(),
  password: z.string().min(8).max(128),
  name:     z.string().min(2).max(100).trim(),
  website:  z.string().url().optional(),
});

app.post('/auth/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
  }
  const { email, password, name } = parsed.data;

  // Hash password — cost factor 12
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await db.users.create({ email, passwordHash, name });

  res.status(201).json({ id: user.id, email: user.email });
});

// Protect against NoSQL injection — validate operators
function sanitizeMongoFilter(filter) {
  for (const [key, value] of Object.entries(filter)) {
    if (typeof value === 'object' && value !== null) {
      const operators = Object.keys(value).filter(k => k.startsWith('$'));
      const allowedOps = ['$in', '$nin', '$gt', '$gte', '$lt', '$lte'];
      if (operators.some(op => !allowedOps.includes(op))) {
        throw new Error(\`Disallowed operator: \${operators.join(',')}\`);
      }
    }
  }
  return filter;
}`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Wildcard CORS with credentials',
      wrong: `app.use(cors({ origin: '*', credentials: true })); // browsers block this combination`,
      right: `app.use(cors({ origin: 'https://myapp.com', credentials: true }));`,
      explanation: 'Browsers reject Access-Control-Allow-Origin: * with Access-Control-Allow-Credentials: true. This is intentional security — wildcarding origins while sending cookies would allow any site to make credentialed requests on behalf of a user. Use an explicit origin allowlist.'
    },
    {
      title: 'Storing passwords with MD5 or SHA',
      wrong: `import { createHash } from 'crypto';
const hash = createHash('md5').update(password).digest('hex');`,
      right: `import bcrypt from 'bcrypt';
const hash = await bcrypt.hash(password, 12); // 2^12 iterations`,
      explanation: 'MD5 and SHA hashes are fast by design — a GPU can compute billions per second, making brute force trivial. bcrypt is slow by design (adjustable cost factor). A bcrypt hash with cost 12 takes ~250ms — brute force of a stolen database takes thousands of years.'
    },
    {
      title: 'Rate limiting in memory for multi-instance apps',
      wrong: `app.use(rateLimit({ windowMs: 60000, max: 100 })); // in-memory — bypassed with 2+ instances`,
      right: `import { RedisStore } from 'rate-limit-redis';
app.use(rateLimit({ store: new RedisStore({ client: redisClient }), windowMs: 60000, max: 100 }));`,
      explanation: 'In-memory rate limiting tracks counts per process. With 4 server instances, a user can make 4× the configured limit by distributing requests. Use a Redis-backed store to share rate limit state across all instances.'
    },
    {
      title: 'Logging sensitive user data',
      wrong: `console.log('Register request:', req.body); // logs password in plaintext`,
      right: `const { password, ...safe } = req.body;
logger.info('Register request', { email: safe.email }); // log only safe fields`,
      explanation: 'Request bodies often contain passwords, tokens, and PII. Logging req.body directly stores this in log files and monitoring systems. Always destructure and log only the fields needed for debugging.'
    },
  ];

  challenge: Challenge = {
    title: 'Security Middleware Stack',
    language: 'typescript',
    description: 'Build an Express security middleware stack that: (1) applies helmet with a strict CSP, (2) validates Content-Type is application/json for POST/PUT/PATCH, (3) rejects requests with bodies larger than 10kb, (4) sanitizes all string fields in req.body to trim whitespace and remove null bytes. Apply the stack as a single use() call chain.',
    hints: [
      'express.json({ limit: "10kb" }) handles the body size limit',
      'Check req.headers["content-type"] for application/json prefix',
      'Null byte: str.replace(/\\0/g, "") prevents null byte injection',
    ],
    starterCode: `import express from 'express';
import helmet from 'helmet';

const app = express();

// TODO: build security middleware stack
// 1. helmet with CSP
// 2. body size limit (10kb) + content-type validation
// 3. body sanitizer (trim + null bytes)

app.post('/data', (req, res) => res.json(req.body));
app.listen(3000);`,
    solution: `import express from 'express';
import helmet from 'helmet';

const app = express();

// 1. Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: { defaultSrc: ["'self'"], scriptSrc: ["'self'"] },
  },
}));

// 2. JSON body parser with size limit
app.use(express.json({ limit: '10kb' }));

// 3. Content-Type validation for mutation requests
app.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    if (!req.headers['content-type']?.startsWith('application/json')) {
      return res.status(415).json({ error: 'Content-Type must be application/json' });
    }
  }
  next();
});

// 4. Body sanitizer
function sanitizeStrings(obj) {
  if (typeof obj === 'string') return obj.trim().replace(/\x00/g, '');
  if (Array.isArray(obj))     return obj.map(sanitizeStrings);
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, sanitizeStrings(v)]));
  }
  return obj;
}
app.use((req, res, next) => {
  if (req.body) req.body = sanitizeStrings(req.body);
  next();
});

app.post('/data', (req, res) => res.json(req.body));
app.listen(3000);`
  };

  quiz: QuizQuestion[] = [
    { q: 'What does helmet() do for Node.js security?', options: ['Encrypts HTTP body', 'Sets 15+ HTTP security headers including CSP, HSTS, and X-Frame-Options', 'Validates input schemas', 'Implements rate limiting'], answer: 1, explanation: 'Helmet sets security-focused HTTP response headers that protect against common attacks: Content-Security-Policy (XSS), Strict-Transport-Security (HTTPS downgrade), X-Content-Type-Options (MIME sniffing), X-Frame-Options (clickjacking).' },
    { q: 'Why is bcrypt preferred over SHA-256 for password hashing?', options: ['bcrypt produces longer hashes', 'bcrypt is slow by design — the cost factor makes brute force expensive', 'bcrypt is a one-way hash; SHA-256 is reversible', 'bcrypt includes a salt automatically'], answer: 1, explanation: 'SHA-256 is designed to be fast — GPUs can compute billions per second. bcrypt is designed to be slow: the cost factor (2^N iterations) is adjustable. A stolen bcrypt-hashed database takes thousands of years to brute force at cost 12.' },
    { q: 'Why does CORS: origin: "*" with credentials: true not work?', options: ['Wildcard CORS is deprecated', 'Browsers block this combination — sending cookies to any origin would enable CSRF from any site', 'express-cors does not support it', 'It requires HTTP/2'], answer: 1, explanation: 'Browsers intentionally reject wildcard origin + credentials. If allowed, any malicious website could make authenticated requests using the victim\'s cookies. Always use an explicit origin allowlist when credentials are involved.' },
    { q: 'What is NoSQL injection in MongoDB?', options: ['Injecting JavaScript into Mongoose schemas', 'Passing MongoDB operators like $where or $regex from user input to bypass query logic', 'SQL-style injection in aggregate pipelines', 'Overflowing MongoDB document size'], answer: 1, explanation: 'MongoDB queries use operators like $where, $regex, $gt. If user input is passed directly to a query as an object ({ password: { $gt: "" } }), it can bypass authentication. Always validate that input does not contain unexpected operators.' },
    { q: 'Does adding helmet() to an Express app protect a public GraphQL or REST endpoint from a poorly-configured Content-Security-Policy that still allows inline scripts?', options: ['Yes, helmet always blocks inline scripts by default', 'No — helmet\'s default CSP is permissive enough to allow inline scripts unless you explicitly tighten the policy yourself', 'CSP only applies to server-rendered HTML, never to APIs', 'helmet automatically detects and blocks XSS payloads regardless of CSP config'], answer: 1, explanation: 'helmet ships a reasonable default CSP, but defaults are intentionally permissive to avoid breaking apps out of the box — they still commonly allow \'unsafe-inline\' for compatibility. Getting real XSS protection from CSP requires explicitly configuring directives (script-src, style-src) to your app\'s actual needs and removing unsafe-inline/unsafe-eval; simply calling helmet() with no config is a starting point, not a complete defense.' },
    { q: 'What is CSRF and how do you protect against it in a Node.js REST API?', options: ['Cross-Site Request Forgery — protect with CORS, SameSite cookies, and/or CSRF tokens', 'Client-Side Request Forgery — use HTTPS only', 'Content Security Resource Failure — use helmet', 'CSRF does not affect REST APIs'], answer: 0, explanation: 'CSRF tricks an authenticated user\'s browser into making unintended requests to your API using their session cookie. For REST APIs using JWT in Authorization headers: CSRF is not an issue (browsers do not auto-send custom headers). For cookie-based sessions: use SameSite=Strict cookies (browser won\'t send on cross-origin requests) and/or CSRF tokens. CORS does not prevent CSRF.' },
  ];

  qna: QnaItem[] = [
    { q: 'What are the most critical security headers to set?', a: 'Content-Security-Policy (prevents XSS from loading external scripts), Strict-Transport-Security (forces HTTPS, prevents downgrade attacks), X-Content-Type-Options: nosniff (prevents MIME sniffing attacks), X-Frame-Options: DENY or SAMEORIGIN (prevents clickjacking), Referrer-Policy: no-referrer (prevents leaking URLs in referrer headers). Helmet sets all of these with sensible defaults — add it on day one.' },
    { q: 'If SameSite=Strict cookies already block cross-origin requests from sending the session cookie, why do teams still add a CSRF token on top?', a: 'SameSite protection has gaps that a token closes: older browsers that predate SameSite support ignore the attribute entirely and send cookies cross-origin as before; SameSite=Strict itself blocks the cookie even on legitimate top-level navigations from an external link (forcing many real apps to use the weaker Lax, which still allows top-level GET navigations to carry cookies — enough for some CSRF attack shapes); and subdomain-based attacks (a compromised or attacker-controlled sibling subdomain) are same-site by the cookie\'s definition, so SameSite does not block them at all. A CSRF token is defense that does not depend on cookie attributes or browser support, so combining both is standard practice rather than redundant.' },
    { q: 'How do I audit npm packages for vulnerabilities?', a: 'Run npm audit regularly — it compares installed packages against the Node Security Advisory database. Fix with npm audit fix (auto-updates safe). Review npm audit fix --force changes manually (may introduce breaking changes). Use Dependabot (GitHub) or Snyk for automated PRs on vulnerable dependencies. Subscribe to security mailing lists for your major dependencies. Lock package versions with package-lock.json and verify integrity with npm ci in CI.' },
    { q: 'Your app sits behind a CDN or reverse proxy that also injects its own security headers — do helmet\'s headers and the proxy\'s headers simply combine, or can they conflict?', a: 'They can conflict, and the outcome depends on how the proxy handles duplicate headers: some proxies overwrite the app\'s header with their own, some append a second header of the same name (which browsers may interpret inconsistently, especially for headers like Content-Security-Policy where multiple values must all be satisfied simultaneously, effectively intersecting the policies), and some pass the app\'s header through untouched. This is worth verifying with the actual response headers seen by the browser (not just what helmet sets server-side) — a proxy silently stripping or overriding your CSP is a common source of "why isn\'t helmet working" confusion.' },
    { q: 'How do you protect a Node.js API against NoSQL injection attacks in a MongoDB-backed application?', a: 'NoSQL injection occurs when unsanitized user input is passed directly into a MongoDB query object, allowing an attacker to inject operators like $gt or $ne (e.g., sending { "username": { "$ne": null } } as a login parameter to bypass authentication logic). Mitigate by validating that incoming request fields are the expected primitive types (string, number) rather than objects before using them in queries, and use a sanitization middleware (express-mongo-sanitize) that strips any keys starting with $ or containing . from request bodies, params, and query strings.' },
    { q: 'What is the principle behind rate limiting as a security control, beyond just preventing API abuse?', a: 'Rate limiting (via express-rate-limit, Redis-backed counters, or an API gateway) prevents not just resource exhaustion from legitimate traffic spikes but also mitigates brute-force credential-stuffing attacks against login endpoints, automated scraping, and amplification of denial-of-service attempts — by capping how many requests a single IP or account can make in a time window, an attacker attempting thousands of password guesses per second is throttled to a rate that makes the attack impractically slow.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Node.js security requires defence in depth: helmet headers, validated inputs, bcrypt passwords, parameterized queries, explicit CORS, and rate limiting on auth endpoints.',
    mustKnow: [
      'helmet() sets 15+ security headers — CSP, HSTS, X-Frame-Options, no-sniff.',
      'bcrypt cost factor 12 for passwords — never MD5/SHA/plain text.',
      'Parameterized queries prevent SQL/NoSQL injection — never interpolate user input.',
      'CORS: explicit origin allowlist + credentials:true — never wildcard + credentials.',
      'Rate limit auth endpoints (5/min) harder than API endpoints (100/min).',
      'Secrets in environment variables — never in source code.',
      'Validate all input at boundaries with Zod/Joi before business logic.',
    ],
    interviewFocus: [
      'What security headers does helmet set and why?',
      'How do you prevent SQL/NoSQL injection in Node.js?',
      'What is the difference between authentication and authorization?',
    ]
  };
}
