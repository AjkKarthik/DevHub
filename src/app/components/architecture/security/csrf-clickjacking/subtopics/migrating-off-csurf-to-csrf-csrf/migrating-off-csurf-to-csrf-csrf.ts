import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

const theory: TheoryPoint[] = [
  {
    heading: 'Why csurf Is No Longer the Right Default',
    points: [
      'The main page\'s own "CSRF Protection (Express)" codeTab uses <code>csurf</code> — but <code>csurf</code> is officially deprecated, confirmed via Express.js\'s own 2025 cleanup announcement listing it among packages the project no longer maintains.',
      'Deprecated does not mean instantly broken — existing code using <code>csurf</code> keeps working — but it means no further security patches, and new projects should not adopt it.',
      '<code>csrf-csrf</code> is a maintained, actively-developed replacement implementing the same underlying idea (a server-issued secret validated against a value the client sends back) via the Double Submit Cookie pattern the main page\'s own quiz already names and explains.',
    ],
  },
  {
    heading: 'How csrf-csrf\'s Double Submit Pattern Works',
    points: [
      '<code>doubleCsrf()</code> returns four things: <code>generateCsrfToken</code> (issues a new token), <code>doubleCsrfProtection</code> (the validating middleware), <code>validateRequest</code>, and <code>invalidCsrfTokenError</code>.',
      'A token-issuing endpoint calls <code>generateCsrfToken(req, res)</code> — this sets an HMAC-based token in a cookie AND returns the same value to hand to the frontend.',
      'The frontend sends that value back in a request header (<code>x-csrf-token</code> by default) on every mutating request; <code>doubleCsrfProtection</code> compares the header value against the cookie\'s HMAC, exactly matching the Double Submit Cookie pattern\'s own definition from the main page\'s quiz.',
      'Unlike csurf\'s session-backed tokens, this needs no server-side session storage at all — the HMAC secret and the cookie value are enough to validate the token statelessly.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'The csrf-csrf Setup',
    language: 'typescript',
    code: `import { doubleCsrf } from 'csrf-csrf';
import cookieParser from 'cookie-parser';

app.use(cookieParser());

const {
  generateCsrfToken,
  doubleCsrfProtection,
} = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET!,
  getSessionIdentifier: (req) => req.session.id,
  cookieName: '__Host-psifi.x-csrf-token', // __Host- prefix, see the Try It
  cookieOptions: { sameSite: 'strict', secure: true },
  size: 32,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
});

// ── Token endpoint -- frontend fetches this before submitting forms ──────────
app.get('/api/csrf-token', (req, res) => {
  const csrfToken = generateCsrfToken(req, res);
  res.json({ csrfToken });
});

// ── Every mutating route just adds the middleware -- no per-route token
//    lookup code needed, doubleCsrfProtection does the comparison itself ────
app.post('/api/transfer', doubleCsrfProtection, async (req, res) => {
  await transferFunds(req.body);
  res.json({ success: true });
});`,
  },
  {
    label: 'Frontend: Fetching and Sending the Token',
    language: 'typescript',
    code: `// 1. Fetch a token once, before the first mutating request
const { csrfToken } = await fetch('/api/csrf-token', {
  credentials: 'include', // send/receive the __Host- cookie
}).then(r => r.json());

// 2. Send it back in the configured header on every mutating request
await fetch('/api/transfer', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    'x-csrf-token': csrfToken, // matches the cookieName's HMAC server-side
  },
  body: JSON.stringify({ to: 'alice', amount: 50 }),
});

// If the header is missing, wrong, or the cookie was never set, the
// server's doubleCsrfProtection middleware rejects the request BEFORE
// the route handler runs -- exactly like csurf's ForbiddenError, just
// without needing any server-side session state to check against.`,
  },
];

const exercise: TryItExercise = {
  prompt: 'The <code>doubleCsrf()</code> config sets <code>cookieName: "__Host-psifi.x-csrf-token"</code> — a cookie name with the <code>__Host-</code> prefix. What does that prefix require the browser to enforce, and why does it matter for CSRF protection specifically?',
  hint: 'The <code>__Host-</code> prefix is a browser-enforced cookie naming convention, not a feature csrf-csrf invents on its own.',
  solution: `// The __Host- prefix is a browser-level guarantee (not something
// csrf-csrf invents) -- any cookie named with it MUST also have:
//   - Secure     (HTTPS only)
//   - Path=/
//   - no Domain attribute (cannot be scoped to a parent/sibling domain)
//
// Browsers REFUSE to set the cookie at all if any of these conditions
// aren't met -- it's enforced, not just a naming convention.

// Why it matters for CSRF: it rules out a subdomain-takeover-style
// attack where a malicious subdomain (evil.example.com) sets its own
// cookie with the SAME name, scoped to the whole example.com domain,
// silently shadowing or overwriting the real CSRF cookie. __Host-
// makes that structurally impossible -- the cookie can only ever be
// set by the EXACT origin that served it.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'csrf-csrf needs a database or session store to track issued tokens, just like the main page\'s own CSRF Token Generator Challenge.',
    reality: 'It\'s stateless — the HMAC secret plus the cookie\'s own value are enough to validate a token on each request; no <code>Map</code>, database, or session lookup is needed at all, unlike the main page\'s own Challenge (which deliberately builds the session-backed version to teach the underlying concept).',
  },
  {
    thought: 'Since csurf is "just deprecated," not removed, it\'s still fine to reach for in a brand-new project.',
    reality: 'Deprecated means no further security patches from its maintainers — a brand-new project has no reason to start on unmaintained security-critical code when actively-maintained alternatives (csrf-csrf, lusca, tiny-csrf) exist.',
  },
  {
    thought: 'The <code>x-csrf-token</code> header name is a hardcoded requirement of the Double Submit Cookie pattern itself.',
    reality: 'It\'s just csrf-csrf\'s configurable default — the Double Submit Cookie pattern itself only requires SOME way for the client to echo the value back (a header or a hidden form field both satisfy it); csrf-csrf lets you rename the header via its own config.',
  },
];

@Component({
  selector: 'app-sec-csrf-migrate',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './migrating-off-csurf-to-csrf-csrf.html',
  styleUrl: './migrating-off-csurf-to-csrf-csrf.scss',
})
export class MigratingOffCsurfToCsrfCsrfSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
