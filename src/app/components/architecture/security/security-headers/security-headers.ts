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
  { name: 'HSTS',              type: 'keyword', desc: 'HTTP Strict Transport Security — forces HTTPS for the domain for a specified duration.' },
  { name: 'CSP',               type: 'keyword', desc: 'Content-Security-Policy — restricts resource sources; prevents XSS and data injection.' },
  { name: 'X-Frame-Options',   type: 'keyword', desc: 'DENY / SAMEORIGIN — prevents clickjacking by blocking iframe embedding.' },
  { name: 'X-Content-Type',    type: 'keyword', desc: 'X-Content-Type-Options: nosniff — prevents MIME-type sniffing attacks.' },
  { name: 'Referrer-Policy',   type: 'keyword', desc: 'Controls what referrer info is sent with requests — use no-referrer or strict-origin.' },
  { name: 'Permissions-Policy', type: 'keyword', desc: 'Restricts browser feature access (camera, mic, geolocation) for your page.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Essential Security Headers',
    points: [
      'Security headers are HTTP response headers that instruct the browser to apply protective behaviors. They are low-effort, high-impact defenses.',
      'HSTS: `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` — browser never connects over HTTP for the specified duration. Preload list embeds the domain in browsers.',
      'CSP: `Content-Security-Policy: default-src \'self\'; script-src \'self\' \'nonce-xxx\'` — restricts which origins can load scripts, styles, images, fonts. Mitigates XSS.',
      'X-Frame-Options: `DENY` — browser refuses to render the page in any iframe. Prevents clickjacking. Superseded by CSP `frame-ancestors` but still add both for compatibility.',
    ],
  },
  {
    heading: 'MIME Type and Content Sniffing',
    points: [
      '`X-Content-Type-Options: nosniff` — prevents browsers from guessing the MIME type of a response. Without it, a browser might execute a text file as JavaScript if it looks like JS.',
      'Attack: attacker uploads a `.jpg` file containing JavaScript. Browser sniffs it as `text/javascript` and executes it. `nosniff` forces the browser to respect the declared Content-Type.',
      '`Content-Type` must be set correctly for all responses — `application/json` for APIs, `text/html; charset=utf-8` for HTML. Do not serve HTML as `text/plain`.',
    ],
  },
  {
    heading: 'Referrer and Permissions Policy',
    points: [
      '`Referrer-Policy: strict-origin-when-cross-origin` — sends full URL as referrer for same-origin requests; only the origin (no path/query) for cross-origin. Prevents leaking sensitive URL tokens to third parties.',
      '`Referrer-Policy: no-referrer` — most restrictive; no referrer sent at all. Use on pages with sensitive URL params (password reset, SSO tokens).',
      '`Permissions-Policy: geolocation=(), camera=(), microphone=()` — disables access to browser features your app does not use. Limits attack surface if XSS occurs.',
    ],
  },
  {
    heading: 'HSTS and HTTPS',
    points: [
      'HSTS max-age: how long (seconds) the browser enforces HTTPS. Minimum 1 year (31536000) for production. Start with a short value while testing.',
      '`includeSubDomains`: all subdomains also require HTTPS. Include only if ALL subdomains have valid certs.',
      '`preload`: opt-in to the browser preload list — domain is baked into the browser binary; it will NEVER connect over HTTP. Difficult to reverse — do not add until you are certain HTTPS is permanent.',
      'HSTS only applies after the first HTTPS visit. The very first request can still be HTTP (SSLstrip attack). The preload list prevents this first-visit risk.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Security Headers (helmet)',
    language: 'typescript',
    code: `import helmet from 'helmet';
import crypto from 'crypto';

// ── Per-request CSP nonce ────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.locals['cspNonce'] = crypto.randomBytes(16).toString('base64');
  next();
});

app.use(helmet({
  // ── HSTS ──────────────────────────────────────────────────────────────────
  hsts: {
    maxAge:            31536000, // 1 year in seconds
    includeSubDomains: true,
    preload:           true,
  },

  // ── Content Security Policy ────────────────────────────────────────────────
  contentSecurityPolicy: {
    directives: {
      defaultSrc:       ["'none'"],
      scriptSrc:        ["'self'", (req: any, res: any) => \`'nonce-\${res.locals['cspNonce']}'\`],
      styleSrc:         ["'self'", (req: any, res: any) => \`'nonce-\${res.locals['cspNonce']}'\`],
      imgSrc:           ["'self'", 'data:', 'https://cdn.example.com'],
      fontSrc:          ["'self'"],
      connectSrc:       ["'self'", 'https://api.example.com'],
      objectSrc:        ["'none'"],
      frameAncestors:   ["'none'"],   // clickjacking protection
      baseUri:          ["'self'"],
      formAction:       ["'self'"],
      upgradeInsecureRequests: [],
    },
  },

  // ── MIME sniffing ──────────────────────────────────────────────────────────
  noSniff: true, // X-Content-Type-Options: nosniff

  // ── Clickjacking ───────────────────────────────────────────────────────────
  frameguard: { action: 'deny' }, // X-Frame-Options: DENY

  // ── Referrer ───────────────────────────────────────────────────────────────
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },

  // ── Cross-Origin policies ──────────────────────────────────────────────────
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy:   { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-origin' },
}));

// ── Permissions Policy (not in helmet by default — add manually) ────────────
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=(), payment=()');
  next();
});`,
  },
  {
    label: 'Security Headers Audit',
    language: 'typescript',
    code: `// ── Audit your headers with a fetch check (CI integration) ─────────────────
interface HeaderCheck {
  header:   string;
  required: boolean;
  validate: (value: string | null) => boolean;
  hint:     string;
}

const REQUIRED_HEADERS: HeaderCheck[] = [
  {
    header:   'strict-transport-security',
    required: true,
    validate: v => v !== null && v.includes('max-age='),
    hint:     'Add: Strict-Transport-Security: max-age=31536000; includeSubDomains',
  },
  {
    header:   'content-security-policy',
    required: true,
    validate: v => v !== null && v.includes('default-src'),
    hint:     'Add a CSP with at least default-src',
  },
  {
    header:   'x-content-type-options',
    required: true,
    validate: v => v === 'nosniff',
    hint:     'Add: X-Content-Type-Options: nosniff',
  },
  {
    header:   'x-frame-options',
    required: true,
    validate: v => v === 'DENY' || v === 'SAMEORIGIN',
    hint:     'Add: X-Frame-Options: DENY',
  },
  {
    header:   'referrer-policy',
    required: false,
    validate: v => v !== null,
    hint:     'Add: Referrer-Policy: strict-origin-when-cross-origin',
  },
];

async function auditSecurityHeaders(url: string) {
  const response = await fetch(url, { method: 'HEAD' });
  const results = REQUIRED_HEADERS.map(check => ({
    header: check.header,
    present: check.validate(response.headers.get(check.header)),
    hint: check.hint,
  }));

  results.forEach(r => {
    const status = r.present ? '✓' : '✗';
    if (!r.present) console.warn(\`\${status} \${r.header}: \${r.hint}\`);
  });

  return results;
}`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Serving the app without HSTS — HTTPS downgrades possible',
    wrong: `// No HSTS header — browser will try HTTP if redirected
// First request could be intercepted before HTTPS redirect`,
    right: `res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');`,
    explanation: 'Without HSTS, an attacker on the network can intercept the first HTTP request before the 301 redirect to HTTPS (SSLstrip attack). HSTS tells the browser to always use HTTPS for this domain for the specified duration.',
  },
  {
    title: 'CSP with unsafe-inline or unsafe-eval',
    wrong: `Content-Security-Policy: script-src 'self' 'unsafe-inline' 'unsafe-eval'`,
    right: `Content-Security-Policy: script-src 'self' 'nonce-abc123'`,
    explanation: '`unsafe-inline` allows any inline `<script>` — completely negates XSS protection from CSP. `unsafe-eval` allows `eval()` and `new Function()` — common XSS escalation paths. Use nonces for inline scripts instead.',
  },
  {
    title: 'Missing X-Content-Type-Options — MIME sniffing attacks',
    wrong: `// No nosniff header — browser may execute a .jpg file containing JavaScript`,
    right: `res.setHeader('X-Content-Type-Options', 'nosniff');`,
    explanation: 'Without nosniff, browsers may execute responses as a different MIME type than declared. An attacker who uploads a file with JS content disguised as an image can get the browser to execute it. nosniff forces the browser to respect the declared Content-Type.',
  },
  {
    title: 'Leaking sensitive URL parameters in the Referer header',
    wrong: `// Default: full URL sent as Referer to third-party resources
// https://app.example.com/reset-password?token=abc123 → leaked to CDN/analytics`,
    right: `res.setHeader('Referrer-Policy', 'no-referrer'); // no Referer sent at all
// Or: 'strict-origin-when-cross-origin' for most pages`,
    explanation: 'Password reset tokens, SSO state, and session info can appear in URLs. The Referer header sends these to every third-party resource (analytics, CDN, embedded fonts) on the page. Use `no-referrer` on sensitive pages, `strict-origin-when-cross-origin` elsewhere.',
  },
];

const challenge: Challenge = {
  title: 'Security Header Validator',
  language: 'typescript',
  description: `Implement validateSecurityHeaders(headers: Record<string, string>): string[] that returns an array of missing/incorrect header warnings. Check:
1. 'strict-transport-security' must include 'max-age='
2. 'x-content-type-options' must be 'nosniff'
3. 'x-frame-options' must be 'DENY' or 'SAMEORIGIN'
4. 'content-security-policy' must exist
Return [] if all are correct.`,
  hints: [
    'Lowercase header names for comparison',
    'Use Array.includes() for x-frame-options values',
    'push() warning strings for each failure',
  ],
  starterCode: `function validateSecurityHeaders(headers: Record<string, string>): string[] {
  const warnings: string[] = [];
  const h = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
  // TODO
  return warnings;
}`,
  solution: `function validateSecurityHeaders(headers: Record<string, string>): string[] {
  const warnings: string[] = [];
  const h = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));

  if (!h['strict-transport-security']?.includes('max-age=')) {
    warnings.push('Missing or invalid Strict-Transport-Security (need max-age=)');
  }
  if (h['x-content-type-options'] !== 'nosniff') {
    warnings.push('Missing X-Content-Type-Options: nosniff');
  }
  if (!['DENY', 'SAMEORIGIN'].includes(h['x-frame-options'])) {
    warnings.push('Missing X-Frame-Options: DENY or SAMEORIGIN');
  }
  if (!h['content-security-policy']) {
    warnings.push('Missing Content-Security-Policy');
  }
  return warnings;
}

console.log(validateSecurityHeaders({
  'Strict-Transport-Security': 'max-age=31536000',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy': "default-src 'self'",
})); // []

console.log(validateSecurityHeaders({})); // 4 warnings`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What does HSTS (HTTP Strict Transport Security) protect against?',
    options: [
      'SQL injection attacks via HTTPS',
      'SSLstrip — downgrading HTTPS to HTTP to intercept traffic',
      'Man-in-the-middle certificate spoofing',
      'XSS via HTTPS responses',
    ],
    answer: 1,
    explanation: 'HSTS tells the browser to always connect over HTTPS for the specified duration. This prevents SSLstrip attacks where a network attacker intercepts the first HTTP request before the server can redirect to HTTPS. The preload list eliminates even the first unprotected request.',
  },
  {
    q: 'Why is `X-Content-Type-Options: nosniff` a security measure?',
    options: [
      'It prevents the server from sending incorrect MIME types',
      'It stops browsers from guessing a resource\'s type — preventing execution of files disguised as safe MIME types',
      'It encrypts the Content-Type header',
      'It blocks requests from browsers that do not send Content-Type',
    ],
    answer: 1,
    explanation: 'Without nosniff, browsers may "sniff" the actual content of a response and execute it differently than its declared MIME type. An attacker who uploads a file containing JavaScript disguised as an image could get the browser to execute it. nosniff forces the browser to use only the declared Content-Type.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'What is the difference between X-Frame-Options and CSP frame-ancestors?',
    a: '<strong>X-Frame-Options</strong>: older header, only allows DENY or SAMEORIGIN — cannot specify individual third-party origins. Supported by all browsers. <strong>CSP frame-ancestors</strong>: more flexible — can allow specific origins (<code>frame-ancestors https://trusted.com</code>). When both are set, CSP takes precedence in modern browsers. Recommendation: set both for maximum compatibility. Use <code>X-Frame-Options: DENY</code> and <code>Content-Security-Policy: frame-ancestors \'none\'</code> for full clickjacking protection.',
  },
  {
    q: 'How do you test your application\'s security headers?',
    a: 'Free tools: <ul><li><strong>SecurityHeaders.com</strong>: grades your headers and shows what\'s missing</li><li><strong>Mozilla Observatory</strong>: comprehensive scan including TLS and cookies</li><li><strong>OWASP ZAP</strong>: automated security scanner (CLI-friendly for CI)</li></ul>In code: use a HEAD request in a test/CI step to assert all required headers are present with correct values. The helmet library\'s defaults cover most common requirements — audit with SecurityHeaders.com after adding it.',
  },
];

const revision: RevisionSummary = {
  oneLiner: 'Security headers are browser instructions set once in middleware — HSTS forces HTTPS, CSP restricts sources, nosniff prevents MIME attacks, X-Frame-Options prevents clickjacking.',
  mustKnow: [
    'HSTS: max-age=31536000 + includeSubDomains — forces HTTPS, prevents SSLstrip',
    'CSP: default-src \'none\'; script-src \'self\' \'nonce-xxx\' — prevents inline XSS execution',
    'X-Content-Type-Options: nosniff — browser respects declared MIME type only',
    'X-Frame-Options: DENY + CSP frame-ancestors \'none\' — prevents clickjacking',
    'Referrer-Policy: strict-origin-when-cross-origin — prevents leaking sensitive URL params',
    'Permissions-Policy — disables browser features you don\'t use (reduces XSS attack surface)',
  ],
  interviewFocus: [
    'What does HSTS protect against and what is the preload list?',
    'Why is unsafe-inline in CSP dangerous?',
    'What does X-Content-Type-Options: nosniff prevent?',
  ],
};

@Component({
  selector: 'app-sec-security-headers',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './security-headers.html',
  styleUrl: './security-headers.scss',
})
export class SecSecurityHeaders {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
