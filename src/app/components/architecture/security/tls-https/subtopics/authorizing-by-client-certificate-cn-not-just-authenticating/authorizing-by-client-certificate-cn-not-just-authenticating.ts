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
    heading: 'Authentication Answers "Who" — Authorization Answers "Allowed to Do What"',
    points: [
      'The main page\'s own mTLS codeTab extracts <code>cert.subject.CN</code> and logs it as "Authenticated service" — but it never checks whether THAT service is actually allowed to call THIS endpoint. Every service with a certificate signed by the trusted client CA can reach every mTLS-protected route.',
      'This is the same authentication-vs-authorization gap the Security & Auth hub\'s own API Security topic covers for JWTs and API keys — a valid client certificate proves identity, not permission, and mTLS alone stops at the first question.',
      'The fix is the same shape as any other authorization layer: a lookup keyed by the authenticated identity (here, the certificate\'s CN) checked against what the current request is trying to do — just running one layer lower, at the TLS/transport level instead of an application-level token.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Every Authenticated Service Reaches Every Endpoint',
    language: 'typescript',
    code: `// Extending the main page's own mTLS codeTab -- requestCert/
// rejectUnauthorized are already configured exactly as shown there.
app.get('/api/internal/refunds', (req, res) => {
  const socket = req.socket as tls.TLSSocket;
  const cert = socket.getPeerCertificate();

  if (!cert || !socket.authorized) {
    return res.status(401).json({ error: 'Client certificate required' });
  }

  const clientService = cert.subject.CN;
  console.log(\`Authenticated service: \${clientService}\`);

  // No check on WHICH service this is -- "payment-service",
  // "marketing-newsletter-sender", or any other service holding a
  // cert from the same trusted client CA can all reach this refund
  // endpoint equally. mTLS confirmed WHO is calling; nothing here
  // confirms they're ALLOWED to call this specific, sensitive route.
  await issueRefund(req.body);
  res.json({ success: true });
});`,
  },
  {
    label: 'Fixed: A Per-Service Authorization Check',
    language: 'typescript',
    code: `// A service-to-permission map -- the mTLS equivalent of an RBAC
// role table, keyed by certificate CN instead of a user ID.
const SERVICE_PERMISSIONS: Record<string, string[]> = {
  'payment-service':   ['refunds:issue', 'payments:charge'],
  'reporting-service':  ['refunds:read'],
  'newsletter-service': [], // authenticated, but no internal-API access at all
};

function requireServicePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const socket = req.socket as tls.TLSSocket;
    const cert = socket.getPeerCertificate();

    if (!cert || !socket.authorized) {
      return res.status(401).json({ error: 'Client certificate required' });
    }

    const clientService = cert.subject.CN;
    const allowed = SERVICE_PERMISSIONS[clientService] ?? [];

    if (!allowed.includes(permission)) {
      return res.status(403).json({
        error: \`Service '\${clientService}' is not authorized for '\${permission}'\`,
      });
    }

    (req as any).clientService = clientService;
    next();
  };
}

app.get(
  '/api/internal/refunds',
  requireServicePermission('refunds:issue'),
  async (req, res) => {
    await issueRefund(req.body);
    res.json({ success: true });
  }
);

// newsletter-service now gets a 403 before issueRefund() ever runs --
// even though its certificate is perfectly valid and signed by the
// same trusted CA as payment-service's own certificate.`,
  },
];

const exercise: TryItExercise = {
  prompt: 'A NEW service, <code>fraud-detection-service</code>, needs read-only access to refund records but was never added to <code>SERVICE_PERMISSIONS</code> at all. It presents a valid client certificate signed by the correct CA and calls <code>GET /api/internal/refunds</code> (protected by <code>requireServicePermission(\'refunds:read\')</code>). What happens?',
  hint: 'Check what <code>SERVICE_PERMISSIONS[clientService]</code> evaluates to for a key that was never added to the object at all.',
  solution: `// The request is rejected with 403, not 401.

// SERVICE_PERMISSIONS['fraud-detection-service'] is undefined (the
// key was never added) -- the ?? [] fallback turns that into an empty
// array, and [].includes('refunds:read') is false. The service is
// correctly AUTHENTICATED (its certificate is valid, socket.authorized
// is true) but has zero permissions on record, so it fails the
// AUTHORIZATION check specifically.

// This is the deliberately safe default: a service simply missing
// from the permissions map is treated as having NO access, rather
// than either crashing (a missing-key lookup returning undefined
// where an array was expected) or silently defaulting to full access.
// Onboarding a new service requires an explicit permissions entry --
// there's no way to accidentally end up over-permissioned by omission.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since mTLS requires every client to present a valid, CA-signed certificate, every authenticated service is implicitly trusted to call any mTLS-protected endpoint.',
    reality: 'mTLS establishes WHO is calling — it says nothing about WHAT they\'re allowed to do. A per-service permission check is a completely separate, additional layer, the same way a valid JWT doesn\'t automatically grant access to every endpoint in a token-based system.',
  },
  {
    thought: 'A service missing from the permissions map should fail closed with an error (like a 500), since it\'s an unexpected/misconfigured state.',
    reality: 'The fix above treats a missing entry as "authenticated, zero permissions" (a 403) rather than erroring — this is the SAFE default: a newly-deployed service that was forgotten from the permissions map is blocked from doing anything, not accidentally granted access or crashing the request handler.',
  },
  {
    thought: 'Authorization by certificate CN is fundamentally different from authorization by JWT claims or API key scopes.',
    reality: 'The SHAPE is identical — an authenticated identity checked against a permission map before the handler runs. Only the SOURCE of the identity differs (a certificate\'s CN instead of a JWT claim or an API key\'s associated scopes); the authorization logic itself is the same pattern this hub\'s own API Security topic already teaches at the application layer.',
  },
];

@Component({
  selector: 'app-sec-tls-mtls-authz',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './authorizing-by-client-certificate-cn-not-just-authenticating.html',
  styleUrl: './authorizing-by-client-certificate-cn-not-just-authenticating.scss',
})
export class AuthorizingByClientCertificateCnNotJustAuthenticatingSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
