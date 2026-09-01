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
    heading: 'The Attack Named, the Vulnerable Version Never Shown',
    points: [
      'The quiz explains the exact mechanism: "the aud claim prevents token substitution attacks: a token issued for ServiceA with aud=serviceA is invalid when presented to ServiceB... without aud validation, an attacker could take a token meant for a low-privilege service and use it against a high-privilege service on the same IdP." The main page\'s own <code>extractClaims()</code> codeTab already validates <code>audience: \'api.example.com\'</code> — it\'s protected from the start, which means the reader never actually sees what the ATTACK looks like against a service that skipped this check.',
      'This subtopic builds the vulnerable version — a second, lower-privilege service that omits the <code>audience</code> check — and shows a token legitimately issued for that low-privilege service being successfully replayed against the high-privilege one, exactly as the quiz describes.',
    ],
  },
  {
    heading: 'Why the Signature Alone Provides No Protection Here',
    points: [
      'Both services in this scenario trust the SAME identity provider and the SAME public key — the token in the attack is completely genuine, correctly signed by the real IdP, for a real user, with a real, unexpired <code>exp</code>. Every check EXCEPT audience passes cleanly.',
      'This is precisely why <code>aud</code> validation is a SEPARATE, additional check layered on top of signature verification, not something signature verification already implies: a signature proves "the IdP genuinely issued this," but says nothing on its own about "the IdP issued this FOR THIS SPECIFIC SERVICE." Only an explicit audience comparison closes that second, distinct question.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Two Services, One IdP',
    language: 'typescript',
    code: `// A read-only reporting service -- low privilege, issued tokens
// scoped specifically to it.
function issueTokenForReportingService(userId: string): string {
  return jwt.sign(
    { sub: userId, roles: ['viewer'] },
    PRIVATE_KEY,
    { algorithm: 'RS256', expiresIn: '15m', issuer: 'https://auth.example.com', audience: 'reporting.example.com' },
  );
}

// The admin service -- high privilege, trusts the SAME IdP and the
// SAME public key as the reporting service above.
function verifyTokenForAdminServiceVulnerable(token: string): Record<string, unknown> {
  return jwt.verify(token, PUBLIC_KEY, {
    algorithms: ['RS256'],
    issuer: 'https://auth.example.com',
    // NO audience check here -- this service never confirms the token
    // was actually intended for IT specifically, only that SOME
    // trusted IdP genuinely issued it to SOMEONE.
  }) as Record<string, unknown>;
}`,
  },
  {
    label: 'The Replay — Genuine Token, Wrong Service',
    language: 'typescript',
    code: `// A legitimate low-privilege user obtains a real, correctly-signed
// token for the reporting service -- nothing forged here at all.
const reportingToken = issueTokenForReportingService('u-viewer-1');

// The attacker (or the legitimate user themselves, testing boundaries)
// takes THIS SAME token -- issued and signed for reporting.example.com
// -- and presents it directly to the admin service instead.
try {
  const claims = verifyTokenForAdminServiceVulnerable(reportingToken);
  console.log('Admin service accepted the token:', claims);
  // -> ACCEPTED. Signature is genuinely valid, issuer matches, exp is
  // in the future -- every check the vulnerable verifier actually
  // performs passes cleanly. The token was never meant for this
  // service, but nothing here ever asked.
} catch (err) {
  console.log('Rejected:', (err as Error).message);
}

// ── The fix: add the SAME explicit audience check the main page's
// own extractClaims() already uses ──────────────────────────────────
function verifyTokenForAdminServiceFixed(token: string): Record<string, unknown> {
  return jwt.verify(token, PUBLIC_KEY, {
    algorithms: ['RS256'],
    issuer: 'https://auth.example.com',
    audience: 'admin.example.com',   // <-- the one line that closes the gap
  }) as Record<string, unknown>;
}

try {
  verifyTokenForAdminServiceFixed(reportingToken);
} catch (err) {
  console.log('Fixed service rejects it:', (err as Error).message);
  // -> "jwt audience invalid. expected: admin.example.com"
}`,
  },
];

const exercise: TryItExercise = {
  prompt: 'Suppose the reporting service and admin service are configured with the SAME audience value by mistake (both set to <code>\'api.example.com\'</code>, copy-pasted from the same config template). Does adding an audience check to the admin service actually stop the replay attack in THIS specific misconfiguration?',
  hint: 'The audience check compares the TOKEN\'s own <code>aud</code> claim against the value the VERIFYING service expects. What does it mean if BOTH services expect the identical value?',
  solution: `// No -- if both services are configured with the SAME audience
// value, the audience check passes for BOTH of them on the SAME
// token, and the replay succeeds despite the check being present and
// technically running correctly.

// The audience check itself works exactly as designed: it compares
// the token's aud claim against the EXPECTED value for the verifying
// service. The check isn't broken -- the CONFIGURATION is. If the
// reporting service issues tokens with aud: 'api.example.com' and the
// admin service ALSO expects audience: 'api.example.com', then a
// token genuinely intended for the reporting service satisfies the
// admin service's audience check too, simply because both services
// were configured to accept the identical value.

// This reveals the actual precondition the whole mechanism depends
// on: aud values must be UNIQUE PER SERVICE for the check to provide
// any real separation at all. A shared, generic audience value across
// multiple services (a common mistake when copying a "default" OAuth
// client configuration between services) silently defeats the
// protection the quiz describes, even though every individual line of
// verification code is written correctly.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since both services in this scenario trust the same IdP and the same signing key, adding audience validation to one of them is redundant — the IdP itself should be responsible for only issuing tokens to the right service.',
    reality: 'The IdP genuinely DOES issue the token correctly — for the reporting service, exactly as requested. The problem the attack exploits happens entirely AFTER issuance: nothing stops the holder of a validly-issued token from presenting it somewhere else. The IdP has no way to control where a token gets used once it leaves the IdP\'s hands; only the RECEIVING service, by checking <code>aud</code>, can refuse a token that wasn\'t meant for it — this responsibility cannot be shifted upstream to the issuer.',
  },
  {
    thought: 'A token replayed against the wrong service would obviously look suspicious or malformed in some way — this isn\'t really a stealthy attack.',
    reality: 'The codeTab above shows the replayed token is completely indistinguishable from a legitimate one by every check the vulnerable service actually performs — correct signature, correct issuer, unexpired. There is nothing "suspicious-looking" about it at the protocol level; the ONLY signal that something is wrong is the <code>aud</code> claim not matching what the verifying service expects, which is precisely why skipping that one specific check is enough to let the entire attack through cleanly.',
  },
];

@Component({
  selector: 'app-sec-claims-aud',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-audience-validation-attack-demonstrated.html',
  styleUrl: './the-audience-validation-attack-demonstrated.scss',
})
export class TheAudienceValidationAttackDemonstratedSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
