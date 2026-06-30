import { Component } from '@angular/core';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';

@Component({
  selector: 'app-react-security',
  standalone: true,
  imports: [
    TheoryBlockComponent, CodeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    ChallengeBlockComponent, QuickRefComponent, PageMetaComponent, PageCompleteComponent,
    CommonMistakesComponent, RevisionCardComponent,
  ],
  templateUrl: './security.html',
  styleUrl: './security.scss',
})
export class ReactSecurity {
  quickRef: QuickRefItem[] = [
    { name: 'JSX escaping',                type: 'syntax',   desc: 'React escapes all string values inserted into JSX. {userContent} is safe — it can never inject HTML.' },
    { name: 'dangerouslySetInnerHTML',      type: 'keyword',  desc: 'The ONLY way to inject raw HTML into React. Always sanitize with DOMPurify first. Never bypass.' },
    { name: 'DOMPurify.sanitize(html)',     type: 'function', desc: 'Sanitizes an HTML string, removing XSS vectors. Use before any dangerouslySetInnerHTML.' },
    { name: 'Content-Security-Policy',      type: 'keyword',  desc: 'HTTP header that restricts what scripts/styles/images the browser can load. Defence-in-depth against XSS.' },
    { name: 'SameSite=Strict cookie',       type: 'keyword',  desc: 'Prevents cookies from being sent on cross-site requests — primary CSRF defence for auth cookies.' },
    { name: 'httpOnly cookie',              type: 'keyword',  desc: 'Cookie inaccessible to JavaScript — tokens cannot be stolen via XSS. Set on the server.' },
    { name: 'CSRF token (double-submit)',   type: 'keyword',  desc: 'A secret value sent in both a cookie and a request header. Server checks they match on state-changing requests.' },
    { name: 'openRedirect guard',           type: 'keyword',  desc: 'Validate redirect targets against an allowlist — never redirect to a URL from query params directly.' },
    { name: 'npm audit',                    type: 'keyword',  desc: 'Scans dependencies for known CVEs. Run in CI. Fix or override vulnerable packages promptly.' },
    { name: 'Subresource Integrity (SRI)', type: 'keyword',  desc: 'integrity attribute on <script>/<link> — browser refuses to execute if the hash does not match.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'XSS — React\'s default protection and its limits',
      points: [
        '<strong>React escapes JSX by default.</strong> Any value you insert as a JSX expression — <code>{userInput}</code> — is converted to a plain text node. HTML tags become literal characters; no script can execute. This protects against reflected and stored XSS in normal usage.',
        '<strong>dangerouslySetInnerHTML is the exception.</strong> It bypasses React\'s escaping entirely and injects raw HTML into the DOM. The name is intentional — it is dangerous. Always sanitize with <strong>DOMPurify</strong> before using it: <code>__html: DOMPurify.sanitize(userHtml)</code>.',
        '<strong>DOM XSS via href and src.</strong> React does NOT sanitize URLs in href or src attributes. Never put user-controlled values directly into <code>href={userUrl}</code> — a "javascript:" URL will execute. Validate URLs start with https:// before trusting them.',
        '<strong>eval() and new Function().</strong> Avoid passing user-controlled strings to eval, setTimeout with string args, or new Function(). These bypass all React protections. Use JSON.parse() for data, not eval().',
      ],
    },
    {
      heading: 'Content Security Policy (CSP)',
      points: [
        '<strong>CSP is a browser-enforced allowlist</strong> of sources for scripts, styles, images, and fonts. Set via the <code>Content-Security-Policy</code> HTTP header (not a meta tag — meta tags are less secure). It is defence-in-depth against XSS, not a replacement for sanitization.',
        '<strong>script-src \'self\'</strong> allows scripts only from your origin. <code>script-src \'self\' https://cdn.example.com</code> also allows a specific CDN. <code>\'unsafe-inline\'</code> allows inline scripts and must be avoided — it defeats most of CSP\'s purpose.',
        '<strong>Nonces and hashes</strong> allow specific inline scripts without \'unsafe-inline\'. The server generates a random nonce per request and adds it to both the CSP header and the script tag: <code>&lt;script nonce="abc123"&gt;</code>. Next.js supports this natively in middleware.',
        '<strong>report-uri / report-to</strong>: add a reporting endpoint to receive violation reports without blocking anything (use <code>Content-Security-Policy-Report-Only</code> during rollout). Real-world CSPs are deployed gradually: report-only first, tighten over time.',
      ],
    },
    {
      heading: 'CSRF — Cross-Site Request Forgery',
      points: [
        '<strong>CSRF attacks</strong> trick the browser into sending authenticated requests to your API from a malicious site. The browser automatically includes cookies on cross-origin requests — if your auth is cookie-based, the attacker\'s site can make authenticated API calls on behalf of the victim.',
        '<strong>SameSite=Strict</strong> is the primary modern defence. Set on auth cookies, it prevents the browser from including the cookie on any cross-site request. SameSite=Lax allows top-level GET navigations but blocks POST/PUT/DELETE. Most modern auth systems rely on SameSite alone.',
        '<strong>CSRF tokens (double-submit cookie pattern)</strong> for APIs that cannot use SameSite: the server sets a CSRF token in a readable cookie and requires it to also appear in a request header (e.g. X-CSRF-Token). Cross-origin scripts cannot read cookies, so they cannot forge the header value.',
        '<strong>Next.js Server Actions</strong> include automatic CSRF protection. Custom REST APIs must implement SameSite cookies or token verification explicitly.',
      ],
    },
    {
      heading: 'Authentication patterns',
      points: [
        '<strong>Never store JWTs in localStorage.</strong> localStorage is accessible to any JavaScript on the page — XSS can steal the token. Store session tokens in <code>httpOnly; Secure; SameSite=Strict</code> cookies. The server sets and reads them; JavaScript never touches them.',
        '<strong>Token refresh:</strong> keep short-lived access tokens (15 min) in memory (useState/Zustand) and long-lived refresh tokens in httpOnly cookies. On page load, call a /refresh endpoint to get a new access token — this is the "silent refresh" pattern.',
        '<strong>Environment variables in Next.js:</strong> NEXT_PUBLIC_* variables are bundled into the client build and visible to anyone. API keys, secrets, and database URLs must be server-only (no NEXT_PUBLIC_ prefix) — they are only available in Server Components and API routes.',
        '<strong>Sensitive data in state/logs:</strong> never log passwords, tokens, or PII to the console, Sentry, or analytics. Scrub sensitive fields from error reports. React DevTools exposes all component state to the browser — use obfuscation in production builds.',
      ],
    },
    {
      heading: 'Dependency security and open redirects',
      points: [
        '<strong>npm audit</strong> scans your dependencies for known CVEs. Run it in CI and fail the build on high/critical vulnerabilities. Use <code>npm audit fix</code> for automatic fixes, <code>--force</code> only as a last resort.',
        '<strong>Subresource Integrity (SRI):</strong> if loading scripts from a CDN, add an integrity hash: <code>&lt;script src="..." integrity="sha384-..." crossorigin="anonymous"&gt;</code>. The browser refuses to execute the script if the hash does not match — prevents CDN compromise.',
        '<strong>Open redirect:</strong> <code>/redirect?to=https://evil.com</code> is a phishing vector. Validate redirect targets: either use a path allowlist, or strip the origin and only redirect within your own domain. Never pass user-controlled strings directly to router.push() or window.location.',
        '<strong>prototype pollution</strong> in deep-merge libraries (lodash.merge, jQuery.extend) can let attackers inject properties on Object.prototype. Use structuredClone() or immer for deep cloning; always sanitize untrusted JSON before merging into app state.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'XSS prevention',
      language: 'typescript',
      code: `import DOMPurify from 'dompurify';

// ──── 1. JSX escaping (default — safe) ────────────────────────
function SafeComment({ text }: { text: string }) {
  // React converts text to a text node — no HTML executes
  return <p>{text}</p>;
}

// ──── 2. dangerouslySetInnerHTML — ALWAYS sanitize first ──────
function RichTextContent({ html }: { html: string }) {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'ul', 'li', 'br'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    FORCE_BODY: true,
  });

  return <div dangerouslySetInnerHTML={{ __html: clean }} />;
}

// ──── 3. Safe URL validation ──────────────────────────────────
const ALLOWED_PROTOCOLS = ['https:', 'http:', 'mailto:'];

function safeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
      return '#';   // block javascript:, data:, vbscript:
    }
    return url;
  } catch {
    return '#';     // block malformed URLs
  }
}

function UserLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={safeUrl(href)}    // never: href={href} with untrusted input
      target="_blank"
      rel="noopener noreferrer"   // prevents tab-napping via window.opener
    >
      {label}
    </a>
  );
}

// ──── 4. Never eval user input ────────────────────────────────
// DANGEROUS — never do this:
// const result = eval(userFormula);

// Safe — parse structured data:
function parseConfig(jsonStr: string) {
  try {
    return JSON.parse(jsonStr);   // safe — no code execution
  } catch {
    return null;
  }
}`,
    },
    {
      label: 'CSP header (Next.js)',
      language: 'typescript',
      code: `// next.config.ts — set CSP and security headers on every response
import type { NextConfig } from 'next';

const CSP = \`
  default-src 'self';
  script-src  'self' 'nonce-{NONCE}';
  style-src   'self' 'unsafe-inline';
  img-src     'self' data: https:;
  font-src    'self';
  connect-src 'self' https://api.example.com;
  frame-src   'none';
  object-src  'none';
  base-uri    'self';
  form-action 'self';
\`.replace(/\\n/g, ' ');

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy',           value: CSP },
          { key: 'X-Content-Type-Options',            value: 'nosniff'      },
          { key: 'X-Frame-Options',                   value: 'DENY'         },
          { key: 'X-XSS-Protection',                  value: '1; mode=block'},
          { key: 'Referrer-Policy',                   value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',                value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security',         value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ];
  },
};
export default nextConfig;

// middleware.ts — nonce-based CSP for inline scripts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { randomBytes } from 'crypto';

export function middleware(request: NextRequest) {
  const nonce = randomBytes(16).toString('base64');
  const csp = \`script-src 'self' 'nonce-\${nonce}'; ...\`;

  const response = NextResponse.next();
  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('x-nonce', nonce);   // pass to layout via headers()
  return response;
}`,
    },
    {
      label: 'Auth: httpOnly cookies + CSRF',
      language: 'typescript',
      code: `// ──── Server: set httpOnly cookie on login ───────────────────
// (Next.js API Route or Server Action)
import { cookies } from 'next/headers';

async function login(formData: FormData) {
  'use server';
  const { email, password } = Object.fromEntries(formData);
  const { token, csrfToken } = await authenticate(email as string, password as string);

  const cookieStore = await cookies();

  // Auth token — httpOnly prevents JS access; Secure = HTTPS only
  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,   // 7 days
  });

  // CSRF token in a readable cookie (double-submit pattern)
  cookieStore.set('csrf-token', csrfToken, {
    httpOnly: false,   // readable by JS — needed to echo it in request header
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });
}

// ──── Client: read CSRF token and echo in header ─────────────
function getCsrfToken(): string {
  return document.cookie
    .split('; ')
    .find(row => row.startsWith('csrf-token='))
    ?.split('=')[1] ?? '';
}

async function apiPost(url: string, body: unknown) {
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': getCsrfToken(),   // echo CSRF token in header
    },
    credentials: 'include',   // send httpOnly auth cookie
    body: JSON.stringify(body),
  });
}

// ──── Server: validate CSRF token ────────────────────────────
function validateCsrf(request: Request, cookieStore: ReturnType<typeof cookies>) {
  const headerToken = request.headers.get('X-CSRF-Token');
  const cookieToken = cookieStore.get('csrf-token')?.value;
  if (!headerToken || headerToken !== cookieToken) {
    throw new Error('CSRF validation failed');
  }
}`,
    },
    {
      label: 'Environment variables + secrets',
      language: 'typescript',
      code: `// ──── Next.js environment variable rules ─────────────────────
// .env.local
// DATABASE_URL=postgresql://...        ← server only (no NEXT_PUBLIC_)
// JWT_SECRET=super-secret-key         ← server only
// NEXT_PUBLIC_API_URL=https://api.ex  ← exposed to client build — OK for URLs
// NEXT_PUBLIC_STRIPE_KEY=pk_live_...  ← OK (public key by design)

// ──── Server Component (safe — runs on server) ─────────────────
async function UserDashboard() {
  // process.env.DATABASE_URL is available — never sent to client
  const users = await db.query('SELECT * FROM users', process.env.DATABASE_URL);
  return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>;
}

// ──── Client Component (bundled into JS — visible to everyone) ─
'use client';
function ApiClient() {
  // ✓ OK — NEXT_PUBLIC_ variables are intended to be public
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  // ✗ NEVER — these are undefined in client build anyway, but a typo could leak them
  // const secret = process.env.JWT_SECRET;       // undefined in client
  // const dbUrl  = process.env.DATABASE_URL;     // undefined in client

  return <div>API: {apiUrl}</div>;
}

// ──── Validate env at startup (fail fast) ──────────────────────
// env.ts
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL:            z.string().url(),
  JWT_SECRET:              z.string().min(32),
  NEXT_PUBLIC_API_URL:     z.string().url(),
});

// Throws at build/startup if any required env var is missing or malformed
export const env = envSchema.parse(process.env);`,
    },
    {
      label: 'Open redirect + prototype pollution',
      language: 'typescript',
      code: `import { useRouter, useSearchParams } from 'next/navigation';

// ──── Open redirect prevention ────────────────────────────────
const ALLOWED_REDIRECT_PATHS = ['/dashboard', '/profile', '/settings', '/'];

function useRedirectAfterLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function redirectAfterLogin() {
    const to = searchParams.get('redirect') ?? '/dashboard';

    // ✗ DANGEROUS: router.push(to) — attacker sets ?redirect=https://evil.com
    // ✓ SAFE: validate against allowlist
    if (ALLOWED_REDIRECT_PATHS.includes(to)) {
      router.push(to);
    } else {
      router.push('/dashboard');   // fallback to safe default
    }
  }

  return redirectAfterLogin;
}

// Alternative: ensure redirect is a relative path (no origin)
function safeRedirect(to: string): string {
  try {
    const url = new URL(to, 'https://placeholder.com');
    // Only allow same-origin paths
    return url.origin === 'https://placeholder.com' ? url.pathname + url.search : '/';
  } catch {
    return '/';
  }
}

// ──── Prototype pollution prevention ──────────────────────────
// DANGEROUS: merging untrusted JSON with lodash.merge
// lodash.merge({}, JSON.parse('{"__proto__": {"isAdmin": true}}'));
// → Object.prototype.isAdmin === true  (all objects affected!)

// SAFE: use structuredClone for deep copies
function mergeUserSettings(defaults: Record<string, unknown>, overrides: unknown): Record<string, unknown> {
  // validate overrides is a plain object without prototype keys
  if (typeof overrides !== 'object' || overrides === null || Array.isArray(overrides)) {
    return defaults;
  }
  const safeOverrides = Object.fromEntries(
    Object.entries(overrides as Record<string, unknown>)
      .filter(([key]) => !['__proto__', 'constructor', 'prototype'].includes(key))
  );
  return { ...structuredClone(defaults), ...safeOverrides };
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Storing JWT in localStorage (XSS-stealable)',
      wrong: `// localStorage is readable by any JS on the page
// XSS vulnerability → complete account takeover
async function login(credentials) {
  const { token } = await api.post('/login', credentials);
  localStorage.setItem('jwt', token);   // ← stolen by any XSS
}

// Reading it:
const headers = { Authorization: \`Bearer \${localStorage.getItem('jwt')}\` };`,
      right: `// Server sets httpOnly cookie — JS can never read or steal it
// No Authorization header needed — cookie is sent automatically
async function login(credentials) {
  await api.post('/login', credentials);   // server sets httpOnly cookie in response
}

// API calls include the cookie automatically:
fetch('/api/data', { credentials: 'include' });`,
      explanation: 'localStorage has no access controls — any JavaScript running on the page can read it, including injected XSS scripts. httpOnly cookies cannot be read by JavaScript at all. An XSS attack against an httpOnly-cookie app cannot steal the session token.',
    },
    {
      title: 'Using dangerouslySetInnerHTML without sanitization',
      wrong: `// userHtml comes from a database, API, or user input
// A stored XSS attack in userHtml executes immediately
function Comment({ html }: { html: string }) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}`,
      right: `import DOMPurify from 'dompurify';

function Comment({ html }: { html: string }) {
  // DOMPurify removes <script>, event handlers, javascript: URLs
  const clean = DOMPurify.sanitize(html, { ALLOWED_TAGS: ['b', 'i', 'p', 'br', 'em', 'strong'] });
  return <div dangerouslySetInnerHTML={{ __html: clean }} />;
}`,
      explanation: 'dangerouslySetInnerHTML bypasses React\'s escaping and injects raw HTML — any <script> tag or onerror attribute in the HTML executes immediately. Always sanitize with DOMPurify before injecting. Without sanitization, a stored XSS attack gives the attacker full control over the victim\'s session.',
    },
    {
      title: 'Exposing secrets via NEXT_PUBLIC_ environment variables',
      wrong: `// In .env.local — bundled into client-side JavaScript bundle
NEXT_PUBLIC_DATABASE_URL=postgresql://user:password@host/db
NEXT_PUBLIC_JWT_SECRET=my-super-secret-key
NEXT_PUBLIC_STRIPE_SECRET_KEY=sk_live_xxxx`,
      right: `// .env.local — server-only (no NEXT_PUBLIC_ prefix)
DATABASE_URL=postgresql://user:password@host/db
JWT_SECRET=my-super-secret-key
STRIPE_SECRET_KEY=sk_live_xxxx

// NEXT_PUBLIC_ only for genuinely public values:
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxx
NEXT_PUBLIC_API_URL=https://api.example.com`,
      explanation: 'Every NEXT_PUBLIC_ variable is inlined into the JavaScript bundle — anyone can view it in browser DevTools or by downloading your JS files. Database URLs, JWT secrets, and API secret keys must never have NEXT_PUBLIC_ — they are only available in Server Components and API routes.',
    },
    {
      title: 'Missing rel="noopener noreferrer" on target="_blank" links',
      wrong: `// target="_blank" without noopener — opened tab can access window.opener
// Allows tab-napping: malicious page sets window.opener.location = phishing-url
<a href={userUrl} target="_blank">{label}</a>`,
      right: `<a
  href={safeUrl(userUrl)}
  target="_blank"
  rel="noopener noreferrer"
>
  {label}
</a>`,
      explanation: 'Without rel="noopener", a tab opened via target="_blank" has a reference to the parent window via window.opener. A malicious site can use this to redirect the parent tab to a phishing page while the user is looking at the opened tab. rel="noopener" severs this reference. rel="noreferrer" also prevents the Referer header from leaking the source URL.',
    },
    {
      title: 'Trusting redirect URLs from query parameters',
      wrong: `// Attacker sends: /login?redirect=https://evil-phishing-site.com
// After login, user is redirected to the attacker's site
const { redirect } = useSearchParams();
router.push(redirect ?? '/dashboard');`,
      right: `const { redirect } = useSearchParams();
// Validate: must be a relative path within our app
const safePath = redirect?.startsWith('/') && !redirect.startsWith('//') ? redirect : '/dashboard';
router.push(safePath);`,
      explanation: 'Open redirect vulnerabilities allow attackers to use your trusted domain in phishing URLs: "Login at myapp.com" redirects to a malicious clone. Validate redirect targets: ensure they are relative paths starting with a single / (not // which can be protocol-relative), or compare against an explicit allowlist.',
    },
    {
      title: 'Logging sensitive data to the console or error trackers',
      wrong: `async function handleLogin(email: string, password: string) {
  try {
    const result = await login({ email, password });
    console.log('Login result:', result);   // logs token, user PII
  } catch (err) {
    Sentry.captureException(err, { extra: { email, password } });  // sends credentials to Sentry!
  }
}`,
      right: `async function handleLogin(email: string, password: string) {
  try {
    await login({ email, password });
  } catch (err) {
    // Only log safe context — no credentials, no tokens, no PII
    Sentry.captureException(err, { extra: { action: 'login', emailDomain: email.split('@')[1] } });
  }
}`,
      explanation: 'Console logs are visible in browser DevTools to anyone with physical access. Error trackers (Sentry, Datadog) retain logs server-side — if credentials or tokens end up there, they are stored in a third-party system outside your security perimeter. Never log passwords, tokens, SSNs, credit card numbers, or full email addresses.',
    },
  ];

  challenge: Challenge = {
    title: 'Audit and Fix a Vulnerable Component',
    language: 'typescript',
    description: `Review the following React component for security vulnerabilities and fix ALL of them:

\`\`\`tsx
function UserProfile({ user, redirectTo }: { user: any; redirectTo: string }) {
  const token = localStorage.getItem('auth-token');
  const router = useRouter();

  async function updateBio() {
    await fetch('/api/bio', {
      headers: { Authorization: \`Bearer \${token}\` },
      method: 'POST',
      body: JSON.stringify({ bio: user.bio }),
    });
    router.push(redirectTo);   // after save, redirect
  }

  return (
    <div>
      <h1>{user.name}</h1>
      <div dangerouslySetInnerHTML={{ __html: user.bio }} />
      <a href={user.website} target="_blank">{user.website}</a>
      <button onClick={updateBio}>Save</button>
    </div>
  );
}
\`\`\`

Identify and fix: (1) token storage, (2) unsanitized HTML injection, (3) unsafe URL, (4) missing noopener, (5) open redirect`,
    hints: [
      'Replace localStorage.getItem("auth-token") with credentials: "include" and remove the Authorization header',
      'Sanitize user.bio with DOMPurify.sanitize() before dangerouslySetInnerHTML',
      'Validate user.website starts with https:// before using in href',
      'Add rel="noopener noreferrer" to the external link',
      'Validate redirectTo is a safe relative path before router.push()',
    ],
    starterCode: `import { useRouter } from 'next/navigation';
// import DOMPurify from 'dompurify';   // uncomment when needed

function UserProfile({ user, redirectTo }: { user: any; redirectTo: string }) {
  const token = localStorage.getItem('auth-token');   // VULNERABILITY 1
  const router = useRouter();

  async function updateBio() {
    await fetch('/api/bio', {
      headers: { Authorization: \`Bearer \${token}\` },
      method: 'POST',
      body: JSON.stringify({ bio: user.bio }),
    });
    router.push(redirectTo);   // VULNERABILITY 5
  }

  return (
    <div>
      <h1>{user.name}</h1>
      <div dangerouslySetInnerHTML={{ __html: user.bio }} />  {/* VULNERABILITY 2 */}
      <a href={user.website} target="_blank">{user.website}</a>  {/* VULNERABILITIES 3 + 4 */}
      <button onClick={updateBio}>Save</button>
    </div>
  );
}`,
    solution: `import { useRouter } from 'next/navigation';
import DOMPurify from 'dompurify';

function safeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return ['https:', 'http:'].includes(parsed.protocol) ? url : '#';
  } catch { return '#'; }
}

function safeRedirect(to: string): string {
  return to.startsWith('/') && !to.startsWith('//') ? to : '/dashboard';
}

function UserProfile({ user, redirectTo }: { user: any; redirectTo: string }) {
  const router = useRouter();

  async function updateBio() {
    // Fix 1: use credentials: 'include' — httpOnly cookie sent automatically, no token in JS
    await fetch('/api/bio', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bio: user.bio }),
    });
    // Fix 5: validate redirect target before using it
    router.push(safeRedirect(redirectTo));
  }

  // Fix 2: sanitize before injecting HTML
  const cleanBio = DOMPurify.sanitize(user.bio, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: [],
  });

  return (
    <div>
      <h1>{user.name}</h1>
      <div dangerouslySetInnerHTML={{ __html: cleanBio }} />
      {/* Fix 3 + 4: validate URL, add noopener noreferrer */}
      <a href={safeUrl(user.website)} target="_blank" rel="noopener noreferrer">
        {user.website}
      </a>
      <button onClick={updateBio}>Save</button>
    </div>
  );
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'How does React protect against XSS by default?',
      options: ['It validates all props against a security schema', 'All JSX expressions are converted to text nodes — HTML special characters are escaped, so injected content cannot execute as markup', 'It blocks all external script loading', 'It sanitizes all string values through DOMPurify automatically'],
      answer: 1,
      explanation: 'React converts all JSX expressions ({userContent}) to text nodes using document.createTextNode(). Characters like <, >, " and & are escaped — <script> becomes &lt;script&gt; and is displayed as text, never executed. This is automatic but bypassed entirely by dangerouslySetInnerHTML.',
    },
    {
      q: 'Why is localStorage a bad place to store JWT tokens?',
      options: ['localStorage is synchronous and slow for large tokens', 'localStorage is accessible to any JavaScript on the page — XSS vulnerabilities can read the token and send it to an attacker', 'localStorage expires after 24 hours', 'localStorage tokens cannot be used in Authorization headers'],
      answer: 1,
      explanation: 'localStorage has no access controls. Any JavaScript running on the page — including injected XSS scripts — can call localStorage.getItem("token") and steal it. httpOnly cookies are completely inaccessible to JavaScript by design, so XSS cannot steal them even if it executes.',
    },
    {
      q: 'What does SameSite=Strict do for authentication cookies?',
      options: ['Encrypts the cookie value so only the server can read it', 'Prevents the browser from sending the cookie on any cross-site request — the primary defence against CSRF attacks', 'Restricts the cookie to HTTPS connections only', 'Limits the cookie to the current subdomain'],
      answer: 1,
      explanation: 'SameSite=Strict means the browser will NOT include the cookie when navigating from another site — not even on top-level GET navigations. CSRF attacks rely on the browser automatically sending auth cookies to your API from a malicious third-party site; SameSite=Strict prevents this entirely.',
    },
    {
      q: 'When is it safe to use dangerouslySetInnerHTML?',
      options: ['Never — it is always unsafe and should be replaced with JSX', 'When the HTML has been sanitized with DOMPurify (or equivalent) with an explicit allowlist of safe tags and attributes', 'When the HTML comes from your own database', 'When the user is authenticated'],
      answer: 1,
      explanation: 'dangerouslySetInnerHTML bypasses React\'s escaping. It is safe only when the HTML has been sanitized with a library like DOMPurify that strips <script>, event handlers, javascript: URLs, and other XSS vectors. "Comes from your database" is not safe — stored XSS attacks save malicious HTML to the database first.',
    },
    {
      q: 'What is an open redirect vulnerability?',
      options: ['A server that redirects all HTTP traffic to HTTPS', 'A URL parameter like ?redirect= that accepts arbitrary URLs — attackers use it to send victims from a trusted domain to a phishing site after login', 'An unsecured API endpoint that redirects without authentication', 'A misconfigured nginx redirect rule'],
      answer: 1,
      explanation: 'Open redirect: /login?redirect=https://evil.com — after login, the app redirects to the attacker\'s URL. The phishing email says "Login at myapp.com" — the domain looks legitimate but the redirect lands users on a fake site. Fix: validate redirect targets are relative paths or match an allowlist.',
    },
    {
      q: 'Which environment variables are safe to use in Next.js Client Components?',
      options: ['All process.env.* variables', 'Only NEXT_PUBLIC_* variables — they are intentionally bundled into the client build', 'Variables loaded from .env.local only', 'No environment variables — use API calls to fetch config'],
      answer: 1,
      explanation: 'Next.js only exposes environment variables prefixed with NEXT_PUBLIC_ to the client-side JavaScript bundle. All other variables (DATABASE_URL, JWT_SECRET, etc.) are undefined in client code. Never add NEXT_PUBLIC_ to secrets — they become visible to anyone who downloads your JS bundle.',
    },
    {
      q: 'Why should you add rel="noopener noreferrer" to target="_blank" links?',
      options: ['It prevents the browser from loading the page in a new tab', 'Without noopener, the opened tab can access window.opener and redirect the parent tab to a phishing page (tab-napping)', 'It encrypts the request headers for external links', 'It prevents the browser from caching external page responses'],
      answer: 1,
      explanation: 'When target="_blank" opens a new tab, that tab has window.opener pointing to your page. A malicious site can call window.opener.location = "https://phishing-site.com" to silently redirect your users while they read the opened content. rel="noopener" severs this reference.',
    },
    {
      q: 'What is the CSRF double-submit cookie pattern?',
      options: ['Sending the same form data twice to confirm intent', 'The server sets a CSRF token in a readable cookie; clients must echo it in a request header. Cross-origin scripts cannot read cookies, so they cannot forge the header value', 'Requiring two-factor authentication for state-changing requests', 'Storing the CSRF token in localStorage and comparing it to a session value'],
      answer: 1,
      explanation: 'Double-submit: server sets csrf-token in a non-httpOnly cookie (JS-readable). Client reads the cookie and echoes it in X-CSRF-Token header. Server verifies cookie value === header value. Cross-origin scripts cannot read cookies from another origin (SOP), so they cannot forge the header even if they can trigger the request.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Does React being a SPA mean I have fewer XSS risks than server-rendered pages?',
      a: 'Partially — React\'s default JSX escaping prevents the most common reflected XSS. But SPAs introduce new attack surfaces: React DevTools exposes all state, localStorage tokens are high-value targets, and dangerouslySetInnerHTML is a frequent mistake. Stored XSS (attacker saves malicious content to DB, your app renders it) is still a serious risk in React apps.',
    },
    {
      q: 'Do Next.js Server Actions protect against CSRF automatically?',
      a: 'Yes — Next.js 14+ Server Actions include built-in CSRF protection. The framework validates that state-changing requests originate from the same origin. Custom API routes (route.ts) do not get this automatic protection — you must implement SameSite cookies or CSRF tokens manually for REST endpoints.',
    },
    {
      q: 'How should I handle authentication state in a React SPA?',
      a: 'Store the session token in an httpOnly cookie (set by the server). In React, keep authenticated user info (name, role, preferences) in state or context — this is not sensitive. To check authentication on load, call a /me endpoint that reads the httpOnly cookie server-side. Never store a JWT in state that you read from localStorage.',
    },
    {
      q: 'Is npm audit enough to keep dependencies secure?',
      a: 'It covers known CVEs in your direct and transitive dependencies. It is necessary but not sufficient. Pair it with: Dependabot or Renovate for automated PRs when vulnerabilities are patched, Snyk or Socket.dev for deeper analysis (typosquatting, malicious code detection), and locking dependency versions in lockfiles (package-lock.json). Run audit in CI and fail on high/critical severity.',
    },
    {
      q: 'How do I prevent sensitive data from appearing in Sentry/error logs?',
      a: 'Configure Sentry\'s beforeSend hook to scrub sensitive fields: Sentry.init({ beforeSend(event) { delete event.request?.cookies; return event; } }). Never pass credentials in the extras or tags objects. Log only the error type and a safe contextual identifier (e.g. the user\'s ID, not email). For network errors, log the URL path but not query parameters that might contain tokens.',
    },
    {
      q: 'How do I implement Content Security Policy (CSP) in a React app?',
      a: 'Set the Content-Security-Policy HTTP header on the server (or a <meta http-equiv="Content-Security-Policy"> for static hosting). Start with a strict base: `default-src \'self\'; script-src \'self\'; style-src \'self\' \'unsafe-inline\'`. Avoid `unsafe-eval` (blocks eval) and `unsafe-inline` for scripts — use nonces or hashes instead. In Next.js, configure headers in next.config.js or via middleware. CSP is a critical second line of defence even when you sanitise inputs.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'React escapes JSX by default. The risks: dangerouslySetInnerHTML (sanitize with DOMPurify), tokens in localStorage (use httpOnly cookies), CSRF (SameSite=Strict), open redirects (validate paths).',
    mustKnow: [
      'JSX expression {x} is always a text node — cannot inject HTML. dangerouslySetInnerHTML bypasses this.',
      'Always DOMPurify.sanitize() before dangerouslySetInnerHTML — with an explicit ALLOWED_TAGS allowlist',
      'Store session tokens in httpOnly; Secure; SameSite=Strict cookies — not localStorage or sessionStorage',
      'CSRF defence: SameSite=Strict cookie attribute (modern) or double-submit cookie pattern (legacy APIs)',
      'NEXT_PUBLIC_* variables are bundled into client JS and visible to everyone — never use for secrets',
      'rel="noopener noreferrer" on all target="_blank" links — prevents tab-napping via window.opener',
      'Validate redirect URLs — allow only relative paths or an explicit allowlist, never raw query param values',
    ],
    interviewFocus: [
      'How does React prevent XSS by default, and what bypasses it?',
      'Why is localStorage insecure for JWT storage? What is the alternative?',
      'Explain the CSRF double-submit cookie pattern and when you need it',
      'What is the difference between httpOnly and SameSite cookie attributes?',
    ],
  };
}
