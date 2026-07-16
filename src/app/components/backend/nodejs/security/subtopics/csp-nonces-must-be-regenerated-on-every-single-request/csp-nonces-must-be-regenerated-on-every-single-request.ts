import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './csp-nonces-must-be-regenerated-on-every-single-request.html',
  styleUrl: './csp-nonces-must-be-regenerated-on-every-single-request.scss'
})
export class CspNoncesMustBeRegeneratedOnEverySingleRequestSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own helmet CSP example uses scriptSrc: ["\'self\'", "\'nonce-<%= nonce %>\'"] — a template-rendered nonce value, which is exactly right, but the code doesn\'t show (and easily could be misread as) the ONE requirement that makes this actually work: that nonce value must be different on literally every single request',
      points: [
        'MDN\'s own documentation on the HTML nonce attribute states this directly: "Nonces should be generated differently each time the page loads (nonce only once!)." The whole security guarantee a CSP nonce provides rests entirely on that value being unpredictable and single-use — a script tag is only allowed to execute if its nonce="..." attribute matches the CURRENT response\'s Content-Security-Policy header, and that match is only meaningful as proof of "this script was placed by the server that generated THIS response" if the value can\'t be guessed or reused.',
        'If a nonce value is hardcoded, cached, or regenerated only occasionally (e.g., once per server deployment instead of once per response), it stops being a secret at all — anyone can view-source the page once, read the nonce value out of an existing <code>&lt;script nonce="..."&gt;</code> tag, and reuse that exact same value in an injected malicious script tag on a LATER response that happens to reuse the same nonce. The browser has no way to tell the difference; it just checks whether the nonce attribute string matches what the CSP header currently allows.',
        'MDN\'s docs note a related, reinforcing detail: browsers deliberately hide the nonce attribute\'s value from JavaScript\'s getAttribute() call specifically to prevent it from being exfiltrated via a CSS attribute selector like script[nonce~="..."] — a defense that only makes sense, and only actually helps, if the underlying value is genuinely meant to be secret and single-use in the first place.',
      ]
    },
    {
      heading: 'What "regenerated per request" actually requires in an Express app',
      points: [
        'A correct implementation generates a fresh, cryptographically random nonce value (commonly via crypto.randomBytes(16).toString(\'base64\')) inside a middleware that runs on EVERY request, stores it somewhere accessible to both the CSP header-setting code and the template-rendering code for that SAME request (e.g., res.locals.nonce), and uses that identical per-request value in both places — never a value computed once at server startup, cached in a module-level constant, or read from an environment variable.',
        'This has a direct, practical consequence for response caching: a page whose CSP nonce changes on every request cannot be cached as a single static response (by a CDN or a reverse-proxy cache) without either caching the STALE nonce value forever (defeating the whole point) or bypassing cache for that response entirely — nonce-based CSP and full-page HTTP caching are in genuine tension, and most real deployments either exclude nonce-bearing pages from cache or use a different CSP strategy (like a strict hash-based allowlist) for content that must be cacheable.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Wrong: a nonce computed once, reused for every request',
      language: 'typescript',
      code: `import crypto from 'node:crypto';

// WRONG — computed ONCE at module load time, then reused for
// every request this server process ever handles. Anyone who
// views the page source once can read this exact value and reuse
// it in an injected <script nonce="..."> tag on ANY later request,
// since the CSP header will keep allowing this same nonce forever.
const staticNonce = crypto.randomBytes(16).toString('base64');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'", \`'nonce-\${staticNonce}'\`],
    },
  },
}));

app.get('/', (req, res) => {
  res.render('index', { nonce: staticNonce }); // same value, every time
});`,
    },
    {
      label: 'Correct: a fresh nonce generated per request',
      language: 'typescript',
      code: `import crypto from 'node:crypto';

// Middleware runs on EVERY request — a genuinely fresh, random
// value each time, stored on res.locals so it's available to both
// the CSP header (set by helmet, configured below) and the
// template rendering the matching script tags for THIS response.
app.use((req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString('base64');
  next();
});

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // helmet supports a function here, evaluated PER REQUEST,
      // reading the value this specific request's middleware set.
      scriptSrc: (req, res) => [\`'self'\`, \`'nonce-\${res.locals.nonce}'\`],
    },
  },
}));

app.get('/', (req, res) => {
  res.render('index', { nonce: res.locals.nonce }); // matches THIS
                                                       // response's own
                                                       // CSP header,
                                                       // and only this one
});`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team implements CSP nonces by generating one random value when their server process starts up, storing it in a module-level constant, and using that same constant for the nonce on every request and in every rendered page for the lifetime of that server process (until the next restart/deploy). They reason "it\'s still random and unguessable, so this should be secure." Using the documented nonce security model, explain why this reasoning is flawed.',
    hint: 'Is a nonce\'s security guarantee based on the VALUE being hard to guess in the abstract, or on the value being secret specifically at the moment an attacker would need to know it to inject a matching script tag? Does viewing the page\'s HTML source once reveal the nonce value being used?',
    solution: 'The reasoning is flawed because a nonce\'s security guarantee depends on the value being unpredictable to an attacker AT THE MOMENT they need to forge a matching script tag — not on the value being cryptographically random in some abstract, one-time sense. Since this server reuses the SAME nonce value for the entire lifetime of the process, an attacker only needs to view the page\'s HTML source ONCE (via any normal page load, no special access required) to read the nonce value directly out of an existing <script nonce="..."> tag. Once they have that value, it remains valid and accepted by the CSP header for every subsequent request to that server, for as long as the server keeps running — meaning the attacker can inject their own <script nonce="[the-same-value]">malicious code</script> into any point where they can get content reflected into the page (an XSS injection point), and the browser will execute it, since the nonce genuinely matches what the CSP header currently allows. The value being "random" only matters at the moment it was FIRST generated — reusing it converts a per-request secret into a permanently-public value the instant it appears in the first page\'s HTML, completely defeating the protection MDN\'s own documentation describes nonces as requiring ("generated differently each time the page loads").'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A CSP nonce just needs to be a sufficiently long, cryptographically random string to be secure — how OFTEN it changes is a secondary concern compared to how hard the value itself is to guess.',
      reality: 'This subtopic\'s theory and exercise both show frequency of regeneration is not secondary at all — MDN\'s own documentation states nonces "should be generated differently each time the page loads," and a nonce reused across multiple requests is trivially discoverable via one page-source view, regardless of how random the original value was.'
    },
    {
      thought: 'The main page\'s own helmet CSP code example, using scriptSrc: ["\'self\'", "\'nonce-<%= nonce %>\'"], is complete and correct as shown, regardless of how the "nonce" template variable it references happens to be generated elsewhere in the app.',
      reality: 'This subtopic\'s code examples show the template syntax alone says nothing about correctness — the exact same template line is either secure or completely ineffective depending entirely on whether the "nonce" variable it references is freshly regenerated per request or computed once and reused, a detail the main page\'s own snippet doesn\'t show.'
    },
    {
      thought: 'Nonce-based CSP and standard HTTP/CDN response caching work together without any special consideration, since a nonce is just one more value in the response.',
      reality: 'This subtopic\'s theory identifies a genuine, practical tension — a page whose CSP nonce changes every request cannot be cached as a single static response without either serving a stale, security-defeating nonce forever or bypassing cache for that response, a real architectural tradeoff real deployments have to explicitly resolve.'
    }
  ];
}
