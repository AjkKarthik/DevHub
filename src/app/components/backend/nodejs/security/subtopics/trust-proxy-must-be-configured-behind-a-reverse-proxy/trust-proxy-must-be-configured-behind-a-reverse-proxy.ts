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
  templateUrl: './trust-proxy-must-be-configured-behind-a-reverse-proxy.html',
  styleUrl: './trust-proxy-must-be-configured-behind-a-reverse-proxy.scss'
})
export class TrustProxyMustBeConfiguredBehindAReverseProxySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own mistake entry fixes rate limiting IN MEMORY vs. Redis-backed for MULTI-INSTANCE apps — a real, correct fix for one problem, but it silently assumes req.ip is already correct in the first place, which is a completely separate, EARLIER problem most production deployments actually have',
      points: [
        'Every real production Node.js app sits behind at least one reverse proxy, load balancer, or CDN — meaning the TCP connection Express actually sees terminates at that proxy, not at the end user\'s browser. Express\'s own req.ip only reflects the true client IP if it is told to read it from a forwarding header (X-Forwarded-For) instead of the raw socket connection — and that behavior is controlled entirely by the trust proxy application setting, which defaults to OFF.',
        'Failure mode one, with trust proxy left at its default (disabled) behind a proxy: req.ip returns the PROXY\'S OWN IP address for literally every request, regardless of which real user made it. Since express-rate-limit keys its counters off req.ip by default, this means every single user on the entire application shares ONE rate-limit bucket — express-rate-limit\'s own troubleshooting documentation describes this outcome directly, calling it "effectively a global" rate limiter. A handful of legitimate users making normal requests can lock out the entire application for everyone.',
        'Failure mode two, with trust proxy set too permissively (bare true, which Express\'s own documentation warns trusts every hop unconditionally): a malicious client can set their OWN X-Forwarded-For header to any arbitrary value on every request. Express, configured to trust it unconditionally, reads that attacker-controlled value as req.ip — meaning the attacker can present a DIFFERENT fake IP on every single request, trivially bypassing IP-based rate limiting entirely, no matter how well-configured the Redis-backed store from the main page\'s own fix is.',
      ]
    },
    {
      heading: 'The documented, correct middle ground',
      points: [
        'Both Express\'s and express-rate-limit\'s own documentation converge on the same recommendation: set trust proxy to a SPECIFIC number of hops (app.set(\'trust proxy\', 1) for exactly one reverse proxy in front of the app) or a specific trusted IP/subnet — not the unconditional true, and not leaving it unset behind a proxy that IS actually there.',
        'Express\'s own docs add a crucial operational requirement this setting depends on: whichever reverse proxy sits in front of the app must itself be configured to STRIP or OVERWRITE any X-Forwarded-For header a client tries to set on their own, before appending its own — otherwise trust proxy: 1 still ends up trusting a value the original client controlled, just one hop removed from directly setting it. Correct rate limiting behind a proxy genuinely depends on BOTH the app\'s trust proxy setting AND the proxy\'s own header-sanitization behavior being correct together.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Two ways this silently breaks the main page\'s own rate limiter',
      language: 'typescript',
      code: `import rateLimit from 'express-rate-limit';

// The main page's own multi-instance fix — genuinely correct for
// the problem IT addresses (sharing rate-limit STATE across
// instances). But this alone does nothing to fix req.ip itself.
app.use(rateLimit({ store: new RedisStore({ client: redisClient }), windowMs: 60000, max: 100 }));

// FAILURE MODE 1 — app is behind a proxy, but trust proxy was
// never set (the default). req.ip is the PROXY's IP for every
// request — express-rate-limit's own docs describe this as
// "effectively a global" limiter shared by all users:
console.log(req.ip); // e.g. "10.0.0.5" — the load balancer's IP,
                       // identical for every single client

// FAILURE MODE 2 — trust proxy is set, but too permissively:
app.set('trust proxy', true); // trusts EVERY hop unconditionally
// An attacker sends: X-Forwarded-For: 1.2.3.4  (any value they like)
// req.ip now reads whatever the attacker put in that header —
// a DIFFERENT fake IP on every request trivially defeats
// IP-based rate limiting, regardless of the Redis store above.`,
    },
    {
      label: 'The documented fix: a specific hop count, matched to real infrastructure',
      language: 'typescript',
      code: `// For an app with EXACTLY ONE reverse proxy/load balancer in
// front of it (a common single-CDN-or-single-LB setup):
app.set('trust proxy', 1); // trust exactly 1 hop — the immediate
                            // proxy's own X-Forwarded-For entry,
                            // not an arbitrary chain of any length

app.use(rateLimit({
  store: new RedisStore({ client: redisClient }),
  windowMs: 60000,
  max: 100,
}));

// Now: req.ip correctly reflects the REAL client IP (assuming the
// proxy itself strips/overwrites any X-Forwarded-For value the
// client tried to set before appending its own — Express's own
// docs make this an explicit prerequisite, not an implementation
// detail you can ignore) — each real user gets their own rate
// limit bucket, and spoofing X-Forwarded-For from outside the
// proxy no longer has any effect, since that hop is stripped
// before reaching the trusted layer.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team deployed the main page\'s own Redis-backed rate limiter behind a single CDN/load balancer, but never configured Express\'s trust proxy setting. During a routine traffic spike, legitimate users across many different accounts and IP addresses suddenly all get 429 Too Many Requests errors together, as if they were all sharing one limit. The team is confused, since they specifically added the Redis store to fix "the multi-instance rate limiting problem" already. What is actually happening, and why doesn\'t the Redis store fix it?',
    hint: 'The Redis store solves the problem of SHARING rate-limit counters across multiple server instances — does it change what value req.ip actually holds for each incoming request in the first place?',
    solution: 'This is a completely different, earlier problem than the one the Redis store solves — the Redis store correctly shares rate-limit STATE across server instances, but it still keys that shared state by whatever req.ip happens to be, and since trust proxy was never configured while the app sits behind a load balancer, req.ip returns the LOAD BALANCER\'S OWN IP address for every single request, regardless of which real user made it. This means every user across the entire application is being tracked under ONE shared rate-limit bucket (keyed by that one proxy IP), even though the Redis store is correctly synchronizing that single bucket\'s count across all server instances — the multi-instance sharing works perfectly, it\'s just sharing the WRONG key. During a traffic spike, that one shared bucket fills up quickly from the combined traffic of every legitimate user, and everyone gets rate-limited together, exactly matching the symptom described. The fix is setting trust proxy to the correct number of hops (app.set(\'trust proxy\', 1) for a single load balancer) so req.ip correctly reflects each real client\'s own IP address, restoring one rate-limit bucket per actual user rather than one shared bucket for the entire application.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The main page\'s own fix for rate limiting — switching from an in-memory store to a Redis-backed store for multi-instance deployments — is sufficient on its own to make IP-based rate limiting work correctly in any production environment.',
      reality: 'This subtopic\'s theory and exercise both show this fixes a genuinely different, separate problem (sharing counter STATE across instances) — it does nothing to ensure req.ip itself reflects the correct client IP, which depends entirely on the trust proxy setting being configured correctly for the app\'s actual network topology.'
    },
    {
      thought: 'Setting app.set(\'trust proxy\', true) is always a safe, sufficient way to make req.ip work correctly behind any reverse proxy setup.',
      reality: 'This subtopic\'s code example and theory both show the opposite — Express\'s own documentation warns bare true trusts every hop unconditionally, letting a client spoof X-Forwarded-For to present a different fake IP on every request, trivially bypassing IP-based rate limiting.'
    },
    {
      thought: 'Configuring trust proxy correctly on the Express app side is by itself sufficient to guarantee req.ip is trustworthy, regardless of how the reverse proxy in front of it is configured.',
      reality: 'This subtopic\'s theory clarifies this depends on BOTH sides being correct together — Express\'s own docs make it an explicit prerequisite that the proxy itself must strip or overwrite any client-supplied X-Forwarded-For header before appending its own, or a correctly-configured trust proxy hop count still ends up trusting a value the original client controlled.'
    }
  ];
}
