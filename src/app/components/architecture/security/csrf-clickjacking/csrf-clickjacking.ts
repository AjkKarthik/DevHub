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
  { name: 'CSRF',             type: 'keyword', desc: 'Cross-Site Request Forgery — tricks a user\'s browser into making authenticated requests to another site.' },
  { name: 'SameSite Cookie',  type: 'keyword', desc: 'Cookie attribute (Strict/Lax) — browser only sends it on same-site requests, blocking CSRF.' },
  { name: 'CSRF Token',       type: 'keyword', desc: 'Server-issued secret embedded in forms; server verifies it on every state-changing request.' },
  { name: 'Clickjacking',     type: 'keyword', desc: 'Overlaying an invisible iframe over a decoy page to trick users into clicking hidden elements.' },
  { name: 'X-Frame-Options',  type: 'keyword', desc: 'HTTP header — DENY or SAMEORIGIN prevents your site being embedded in iframes.' },
  { name: 'frame-ancestors',  type: 'keyword', desc: 'CSP directive — restricts which origins can embed your page in an iframe (replaces X-Frame-Options).' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'CSRF — How It Works',
    points: [
      'CSRF exploits the fact that browsers automatically attach cookies to cross-site requests. A victim visits evil.com while logged into bank.com.',
      'evil.com contains `<img src="https://bank.com/transfer?to=attacker&amount=1000">`. The browser fires the request and attaches the bank.com session cookie.',
      'The bank server receives an authenticated request from the victim\'s browser — but the victim never intended to make it.',
      'State-changing endpoints (POST/PUT/DELETE) are the target. GET requests should never have side effects (idempotency principle).',
    ],
  },
  {
    heading: 'CSRF Defenses',
    points: [
      'SameSite cookies: `SameSite=Strict` — cookie is never sent on cross-site requests. `SameSite=Lax` — cookie sent on top-level navigation GETs (links) but not cross-site POST/PUT. The modern primary defense.',
      'CSRF tokens: server generates a random secret per session, embeds it in forms, verifies on every mutating request. Double-submit cookie pattern: also acceptable for APIs.',
      'Custom request headers: AJAX requests with `X-Requested-With: XMLHttpRequest` or `Content-Type: application/json` cannot be sent cross-site without CORS approval — implicit CSRF protection for JSON APIs.',
      'Origin/Referer validation: verify the `Origin` or `Referer` header matches your domain on sensitive endpoints. Not sufficient alone — can be absent.',
    ],
  },
  {
    heading: 'Clickjacking — How It Works',
    points: [
      'Attacker creates a malicious page with a transparent `<iframe>` showing your site, overlaid on a decoy button (e.g., "Win a prize!").',
      'The victim sees the decoy button and clicks — but their click actually lands on the hidden iframe (e.g., "Confirm Transfer" button on your bank site).',
      'The click executes as an authenticated action because the victim\'s session cookie is sent with the iframe request.',
      'Particularly dangerous for one-click operations: account deletion, wire transfers, follow/like, permission grants.',
    ],
  },
  {
    heading: 'Clickjacking Defenses',
    points: [
      '`X-Frame-Options: DENY` — browser refuses to render your page in any iframe, frame, or object.',
      '`X-Frame-Options: SAMEORIGIN` — allows iframing only from the same origin (e.g., for your own apps).',
      'CSP `frame-ancestors` directive: `Content-Security-Policy: frame-ancestors \'none\'` — preferred over X-Frame-Options; more expressive (can whitelist specific origins).',
      'Frame-busting JavaScript (legacy): `if (top !== self) top.location = self.location`. Unreliable — can be defeated with `sandbox` attribute on the iframe.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'CSRF Protection (Express)',
    language: 'typescript',
    code: `import csrf from 'csurf';
import cookieParser from 'cookie-parser';

app.use(cookieParser());

// ── Option 1: CSRF token middleware ─────────────────────────────────────────
const csrfProtection = csrf({ cookie: { httpOnly: true, sameSite: 'strict' } });

// Apply to all state-changing routes
app.use('/api/', csrfProtection);

// Token endpoint — frontend fetches this before submitting forms
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Verified automatically by the middleware on POST/PUT/DELETE
app.post('/api/transfer', csrfProtection, async (req, res) => {
  // If CSRF token missing or wrong, csurf throws ForbiddenError
  await transferFunds(req.body);
  res.json({ success: true });
});

// ── Option 2: SameSite cookies (modern — no token needed) ──────────────────
// Session cookie with SameSite=Strict prevents cross-site requests from
// carrying the session cookie entirely
res.cookie('session', token, {
  httpOnly:  true,
  secure:    true,
  sameSite: 'strict', // cross-site requests: cookie not sent
  path:      '/',
});

// ── Origin validation (additional layer) ────────────────────────────────────
function validateOrigin(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin ?? req.headers.referer;
  const allowed = ['https://app.example.com', 'https://admin.example.com'];
  if (req.method !== 'GET' && origin && !allowed.some(o => origin.startsWith(o))) {
    return res.status(403).json({ error: 'Origin not allowed' });
  }
  next();
}`,
  },
  {
    label: 'Clickjacking Protection Headers',
    language: 'typescript',
    code: `import helmet from 'helmet';

// ── Helmet sets both X-Frame-Options and CSP frame-ancestors ─────────────────
app.use(helmet({
  frameguard: { action: 'deny' }, // X-Frame-Options: DENY
  contentSecurityPolicy: {
    directives: {
      frameAncestors: ["'none'"], // CSP: frame-ancestors 'none'
      // ... other directives
    },
  },
}));

// ── Manual header setting ────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "frame-ancestors 'none'");
  next();
});

// ── Allow embedding on same origin only (e.g., your own dashboard) ───────────
// X-Frame-Options: SAMEORIGIN
// CSP: frame-ancestors 'self'

// ── Allow specific origins ────────────────────────────────────────────────────
// CSP: frame-ancestors https://trusted-partner.com
// (X-Frame-Options cannot specify individual origins — CSP is required)

// ── Angular frontend: check if framed (defence in depth) ─────────────────────
// In main.ts or app initialisation:
// if (window.top !== window.self) {
//   window.top!.location.href = window.self.location.href; // escape frame
// }`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Using SameSite=None without Secure — no CSRF protection',
    wrong: `res.cookie('session', token, { sameSite: 'none' }); // cross-site requests send the cookie`,
    right: `res.cookie('session', token, { sameSite: 'strict', secure: true, httpOnly: true });`,
    explanation: '`SameSite=None` explicitly allows cross-site cookie sending (required for embedded third-party widgets). Without it (using Strict or Lax), the cookie is not sent on cross-site requests, which is what prevents CSRF. Never use `SameSite=None` for session cookies.',
  },
  {
    title: 'Relying only on Referer header for CSRF protection',
    wrong: `if (req.headers.referer?.includes('example.com')) { proceed(); }`,
    right: `// Use SameSite=Strict cookie + CSRF token for reliable protection
// Referer can be absent (privacy settings) or spoofed in some scenarios`,
    explanation: 'The Referer header can be absent (stripped by browsers for privacy, or when browsing in incognito) and is not a reliable defense on its own. Use SameSite cookies as the primary defense, with CSRF tokens for extra protection on sensitive endpoints.',
  },
  {
    title: 'Not protecting against clickjacking on one-click-action pages',
    wrong: `// Payment confirmation page has no X-Frame-Options or CSP frame-ancestors`,
    right: `// Add to all pages, especially sensitive ones:
res.setHeader('X-Frame-Options', 'DENY');
res.setHeader('Content-Security-Policy', "frame-ancestors 'none'");`,
    explanation: 'Clickjacking is particularly dangerous on pages that perform a sensitive action on a single click (confirm transfer, delete account, grant permission). These pages MUST prevent embedding.',
  },
  {
    title: 'CSRF protection on GET endpoints with side effects',
    wrong: `// GET endpoint that transfers funds — any page can trigger via <img src>
app.get('/api/transfer', requireAuth, transferFunds);`,
    right: `// GET must be idempotent — no side effects
// Use POST/PUT/DELETE for state-changing operations
app.post('/api/transfer', requireAuth, csrfProtection, transferFunds);`,
    explanation: 'GET requests are particularly dangerous for CSRF because they can be triggered by `<img src="...">`, CSS `url()`, and other passive HTML attributes — no JavaScript required. Always use POST/PUT/DELETE for state changes.',
  },
];

const challenge: Challenge = {
  title: 'CSRF Token Generator',
  language: 'typescript',
  description: `Implement a simple CSRF token system:
1. generateCsrfToken(): string — returns a 32-byte hex random string
2. storeCsrfToken(sessionId: string, token: string, store: Map<string, string>): void — stores token by session ID
3. validateCsrfToken(sessionId: string, token: string, store: Map<string, string>): boolean — returns true only if the stored token matches`,
  hints: [
    'Use Math.random().toString(16) for hex simulation',
    'Map.get() for lookup; strict equality check',
  ],
  starterCode: `function generateCsrfToken(): string {
  // TODO: return 64 char hex string (simulate 32 random bytes)
  return '';
}

function storeCsrfToken(sessionId: string, token: string, store: Map<string, string>): void {
  // TODO
}

function validateCsrfToken(sessionId: string, token: string, store: Map<string, string>): boolean {
  // TODO
  return false;
}`,
  solution: `function generateCsrfToken(): string {
  return Array.from({ length: 8 }, () =>
    Math.floor(Math.random() * 0xFFFFFFFF).toString(16).padStart(8, '0')
  ).join('');
}

function storeCsrfToken(sessionId: string, token: string, store: Map<string, string>): void {
  store.set(sessionId, token);
}

function validateCsrfToken(sessionId: string, token: string, store: Map<string, string>): boolean {
  const stored = store.get(sessionId);
  return stored !== undefined && stored === token;
}

const store = new Map<string, string>();
const session = 'sess-abc123';
const token = generateCsrfToken();
storeCsrfToken(session, token, store);
console.log(validateCsrfToken(session, token, store));        // true
console.log(validateCsrfToken(session, 'wrong-token', store)); // false
console.log(token.length === 64); // true`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'Which cookie attribute is the modern primary defense against CSRF?',
    options: [
      'HttpOnly — prevents JavaScript from reading the cookie',
      'SameSite=Strict — browser does not send the cookie on cross-site requests',
      'Secure — cookie only sent over HTTPS',
      'Path=/ — cookie sent on all paths',
    ],
    answer: 1,
    explanation: '`SameSite=Strict` prevents the browser from sending the session cookie on ANY cross-site request — form submissions, AJAX calls, image requests from other origins. This directly blocks CSRF because the attacker\'s cross-site request has no session cookie attached.',
  },
  {
    q: 'What does `X-Frame-Options: DENY` prevent?',
    options: [
      'CSRF attacks via form submission',
      'Your page being embedded in an iframe on another site, preventing clickjacking',
      'Cross-site script execution',
      'Cookie theft via JavaScript',
    ],
    answer: 1,
    explanation: '`X-Frame-Options: DENY` instructs browsers to refuse rendering your page inside any `<iframe>`, `<frame>`, or `<object>` element. This prevents clickjacking attacks where an attacker overlays your site invisibly on their page to capture user clicks.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'Why are JSON APIs with custom headers partially CSRF-resistant without tokens?',
    a: 'Browsers enforce CORS preflight for cross-site requests that use non-simple methods (PUT, DELETE) or non-simple headers/content types (like <code>Content-Type: application/json</code>). A cross-site page cannot trigger a preflight and get a successful response without the server\'s CORS approval. This means a malicious site cannot make a cross-site POST with <code>Content-Type: application/json</code> that carries the victim\'s session cookie — the preflight blocks it. However, this only works if your API correctly validates Content-Type. SameSite cookies + explicit CSRF tokens are still best practice.',
  },
  {
    q: 'Can SameSite=Lax replace CSRF tokens entirely?',
    a: 'For most applications, <code>SameSite=Lax</code> provides good CSRF protection. Lax sends the cookie on top-level navigation GETs (clicking a link) but not on cross-site POST/PUT/DELETE. Some edge cases remain: <ul><li>Navigational GETs with side effects (violates REST principles but happens)</li><li>Old browsers that do not support SameSite</li><li>Short-window attacks in the first 2 minutes after cookie issuance (Chrome bug bounty research)</li></ul>For high-security applications (banking, payment, admin), combine <code>SameSite=Strict</code> with CSRF tokens for defence in depth.',
  },
];

const revision: RevisionSummary = {
  oneLiner: 'CSRF: browser auto-sends cookies cross-site — defend with SameSite=Strict; Clickjacking: invisible iframe overlays — defend with X-Frame-Options: DENY or CSP frame-ancestors \'none\'.',
  mustKnow: [
    'CSRF: cross-site request carries victim\'s session cookie automatically — no user interaction needed',
    'SameSite=Strict: primary CSRF defense — cookie not sent on any cross-site request',
    'CSRF token: server-issued secret verified on every mutating request — defence in depth',
    'GET endpoints must never have side effects — CSRF trivially triggered via <img src="">',
    'Clickjacking: invisible iframe overlay tricks user into clicking hidden buttons',
    'X-Frame-Options: DENY or CSP frame-ancestors \'none\' prevents iframe embedding',
  ],
  interviewFocus: [
    'How does SameSite=Strict prevent CSRF?',
    'What is clickjacking and how do you prevent it?',
    'Why are GET requests particularly dangerous for CSRF?',
  ],
};

@Component({
  selector: 'app-sec-csrf-clickjacking',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './csrf-clickjacking.html',
  styleUrl: './csrf-clickjacking.scss',
})
export class SecCsrfClickjacking {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
