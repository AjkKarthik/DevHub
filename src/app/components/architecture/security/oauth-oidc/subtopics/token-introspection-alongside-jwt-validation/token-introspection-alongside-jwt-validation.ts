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
    heading: 'A Recommended "Hybrid Approach," Never Built',
    points: [
      'The QnA explains the tradeoff precisely: local JWT validation is "fast but the server cannot know if the token was revoked since issuance," while token introspection (RFC 7662) "adds latency but provides real-time revocation status." It even names the fix — "hybrid approach: validate JWT locally (fast). Periodically introspect or check a local revocation list." The main page\'s own "Token Validation (OIDC)" codeTab only ever does local JWT validation — introspection appears nowhere in code.',
      'This subtopic builds both halves of the hybrid approach together: the existing local validation from the main page, PLUS a real introspection call, wired so introspection only runs for the operations where the extra latency is actually worth paying for.',
    ],
  },
  {
    heading: 'Why "Introspect Everything" Defeats the Point of Using JWTs at All',
    points: [
      'If every single API request called the introspection endpoint, the resource server would be making a network round-trip to the authorization server on every request — exactly the per-request overhead that self-contained, locally-verifiable JWTs exist to avoid in the first place. At that point, opaque tokens with mandatory introspection would be simpler than JWTs.',
      'The QnA\'s own guidance — "short token lifetime (15 min) reduces the window during which a revoked token is still locally valid" — is what makes SELECTIVE introspection viable: local validation handles the overwhelming majority of requests cheaply, and introspection is reserved specifically for operations where a revoked-but-not-yet-expired token would be genuinely dangerous (payments, admin actions, data export) — not every request.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Local JWT Validation (from the Main Page)',
    language: 'typescript',
    code: `// The main page's own local validation -- fast, no network call,
// but has no way to know if the token was revoked after issuance.
async function validateLocally(accessToken: string): Promise<Record<string, unknown>> {
  const decoded = jwt.decode(accessToken, { complete: true });
  if (!decoded) throw new Error('Invalid token format');

  const key = await client.getSigningKey(decoded.header.kid);
  return jwt.verify(accessToken, key.getPublicKey(), {
    algorithms: ['RS256'],
    issuer: 'https://auth.example.com',
    audience: 'my-api',
  }) as Record<string, unknown>;
}`,
  },
  {
    label: 'Introspection, Reserved for High-Risk Operations',
    language: 'typescript',
    code: `// RFC 7662: a network call to the authorization server for
// real-time revocation status -- reserved for operations where a
// revoked-but-not-yet-expired token is genuinely dangerous.
async function introspect(accessToken: string): Promise<{ active: boolean; [key: string]: unknown }> {
  const res = await fetch('https://auth.example.com/introspect', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      // The introspection endpoint itself requires the RESOURCE
      // SERVER to authenticate -- otherwise anyone could probe token
      // validity, an information-disclosure risk of its own.
      Authorization: 'Basic ' + Buffer.from('resource-server-id:resource-server-secret').toString('base64'),
    },
    body: new URLSearchParams({ token: accessToken }),
  });
  return res.json();
}

// ── The hybrid approach: cheap local validation for most requests,
// introspection layered on top for a specific high-risk endpoint ────
async function requireValidToken(req: Request, opts: { requireFreshRevocationCheck?: boolean } = {}) {
  const claims = await validateLocally(req.headers.get('Authorization')!.replace('Bearer ', ''));

  if (opts.requireFreshRevocationCheck) {
    const { active } = await introspect(req.headers.get('Authorization')!.replace('Bearer ', ''));
    if (!active) throw new Error('Token has been revoked');
  }

  return claims;
}

// Ordinary read endpoint: local validation only -- fast.
app.get('/orders/:id', (req) => requireValidToken(req));

// A payment/admin endpoint: pay the extra round-trip for real-time
// revocation status, since a revoked token still being locally "valid"
// for up to 15 minutes is an unacceptable risk here specifically.
app.post('/admin/refund', (req) => requireValidToken(req, { requireFreshRevocationCheck: true }));`,
  },
];

const exercise: TryItExercise = {
  prompt: 'A user\'s access token is stolen and immediately reported. The security team revokes it at the authorization server at 10:00:00. The token was issued at 09:50:00 with a 15-minute expiry (10:05:00). At 10:02:00, the attacker uses the stolen token to call <code>GET /orders/42</code> and then <code>POST /admin/refund</code>. What happens on each call, given the code above?',
  hint: 'Trace which endpoint calls <code>requireValidToken</code> with <code>requireFreshRevocationCheck: true</code>, and what "revoked" actually means for a check that never asks the authorization server anything.',
  solution: `// GET /orders/42 at 10:02:00 SUCCEEDS -- local validation only checks
// the JWT's own signature and standard claims (iss, aud, exp). The
// token is cryptographically valid and not yet expired (10:05:00 is
// still 3 minutes away) -- local validation has no way to know the
// authorization server revoked it two minutes earlier, since
// revocation is server-side state a self-contained JWT can never
// encode. The attacker's read succeeds.

// POST /admin/refund at 10:02:00 FAILS -- this endpoint additionally
// calls introspect(), which asks the authorization server directly:
// "is this specific token still active?" The authorization server's
// own revocation record (set at 10:00:00) is authoritative and
// up-to-date, so introspection correctly returns { active: false },
// and requireValidToken throws before the refund can be processed.

// This is exactly the intended tradeoff, not a partial failure: the
// low-risk read endpoint accepted a stolen-but-not-yet-expired token
// for up to 3 more minutes (bounded by the token's own short 15-minute
// lifetime), while the specific high-risk endpoint that needed
// real-time revocation awareness got it, at the cost of one extra
// network round-trip only on THAT call.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Adding token introspection to an endpoint makes local JWT signature/claims validation unnecessary — introspection alone is sufficient.',
    reality: 'The codeTab above always runs local validation FIRST, even on the introspection-gated endpoint — introspection checks whether the token is still ACTIVE (not revoked), but says nothing about whether the caller correctly proves possession of a token this server should trust in the first place. Skipping local validation and relying on introspection alone would mean trusting whatever the introspection endpoint says about a token string an attacker could have fabricated entirely, without ever proving it was legitimately issued.',
  },
  {
    thought: 'The right fix for the revocation-awareness gap is just shortening the access token lifetime even further (e.g. to 1 minute) instead of using introspection.',
    reality: 'This is a real, valid alternative lever the QnA also names — but it trades one cost for another rather than eliminating the tradeoff: an extremely short-lived token forces FAR more frequent refresh-token round-trips for every legitimate client, adding load and complexity across the entire system to reduce a risk window that selective introspection can close to zero (for the specific operations that need it) without touching every other request\'s performance at all.',
  },
];

@Component({
  selector: 'app-sec-oauth-introspection',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './token-introspection-alongside-jwt-validation.html',
  styleUrl: './token-introspection-alongside-jwt-validation.scss',
})
export class TokenIntrospectionAlongsideJwtValidationSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
