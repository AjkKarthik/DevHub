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
    heading: 'Named Precisely, Never Shown as Actual Vulnerable Code',
    points: [
      'The theory explains the mechanism exactly: "an attacker can take a token signed with RS256, re-sign it with HS256 using the server\'s PUBLIC key as the HMAC secret... and the server incorrectly validates it as authentic." The main page\'s own "Issue & Verify JWT" codeTab already shows the FIX (<code>algorithms: [\'RS256\']</code>, hard-coded) — but never shows the VULNERABLE version this fix is actually defending against, so the exact shape of the mistake stays abstract.',
      'This subtopic builds both sides concretely — verified against real, documented exploit mechanics via WebSearch before publishing — including tracing exactly how an attacker with only the (public, non-secret) RSA public key forges a token the vulnerable server accepts as genuine.',
    ],
  },
  {
    heading: 'Why the Public Key Being "Public" Is the Whole Attack',
    points: [
      'RS256\'s entire security model depends on the PRIVATE key staying secret — the public key is, by design, meant to be shared freely (it\'s typically published at a <code>/.well-known/jwks.json</code> endpoint, exactly as the main page\'s own "JWKS Endpoint" codeTab does). HS256\'s security model depends on its ONE key being secret to BOTH parties.',
      'The vulnerability exists specifically when a server\'s verification code uses the SAME key material for both algorithms — accepting either RS256 or HS256, and using the (intentionally public) RSA public key as the HS256 HMAC secret. HMAC treats whatever key it\'s given as opaque secret material; it has no way to know that key was actually meant to be public.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Vulnerable — Trusts the Token\'s Own alg Header',
    language: 'typescript',
    code: `// DANGEROUS: allows BOTH algorithms, and lets the verification key
// vary based on what the TOKEN ITSELF claims its algorithm is.
function verifyTokenVulnerable(token: string): Record<string, unknown> {
  const decoded = jwt.decode(token, { complete: true });
  if (!decoded) throw new Error('Invalid token');

  // The vulnerable step: the key used for verification depends on
  // the attacker-controlled "alg" field in the token's OWN header.
  const key = decoded.header.alg === 'HS256' ? PUBLIC_KEY : PUBLIC_KEY;
  //          ^ whichever branch runs, PUBLIC_KEY (meant to be freely
  //            shareable) ends up being used as the HS256 HMAC secret

  return jwt.verify(token, key, {
    algorithms: ['RS256', 'HS256'],   // accepts EITHER algorithm
  }) as Record<string, unknown>;
}`,
  },
  {
    label: 'The Forgery — Constructed With Only the (Public) Public Key',
    language: 'typescript',
    code: `import crypto from 'crypto';

// An attacker with NOTHING but the server's own published public key
// (fetched from the JWKS endpoint the main page's own codeTab exposes)
// can forge a token the vulnerable verifier above will accept.
function forgeAdminToken(publicKeyPem: string): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = { sub: 'attacker', roles: ['admin'], iss: 'https://auth.example.com', aud: 'api.example.com' };

  const encode = (obj: object) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const signingInput = \`\${encode(header)}.\${encode(payload)}\`;

  // HMAC-SHA256, using the RSA PUBLIC key's own PEM text as the
  // "secret" -- HMAC has no concept of "this key was meant to be
  // public," it just uses whatever bytes it's given.
  const signature = crypto
    .createHmac('sha256', publicKeyPem)
    .update(signingInput)
    .digest('base64url');

  return \`\${signingInput}.\${signature}\`;
}

// The forged token passes verifyTokenVulnerable() above completely:
// verifyTokenVulnerable() reads alg:"HS256" from the header, selects
// PUBLIC_KEY as the "secret," computes the identical HMAC the attacker
// just computed, and the signatures match -- roles: ['admin'] is
// now treated as authentic, despite the attacker never having access
// to the actual private key at any point.`,
  },
];

const exercise: TryItExercise = {
  prompt: 'The main page\'s own "Issue & Verify JWT" codeTab calls <code>jwt.verify(token, PUBLIC_KEY, { algorithms: [\'RS256\'] })</code> — a single algorithm, hard-coded. Does the exact forged token built above (with <code>alg: \'HS256\'</code> in its header) pass this specific verification call?',
  hint: 'Check what jsonwebtoken\'s <code>algorithms</code> option actually does when the token\'s own header <code>alg</code> doesn\'t appear in the list.',
  solution: `// No -- it fails immediately, before any signature computation even
// happens.

// jsonwebtoken's algorithms option is an ALLOWLIST: the library checks
// the token's own header alg field against the provided array BEFORE
// attempting any verification. The forged token's header says
// alg: 'HS256', and the main page's real verifyToken() call only
// allows ['RS256'] -- 'HS256' is not in that list, so the library
// rejects the token outright with a JsonWebTokenError ("invalid
// algorithm"), never even reaching the point of computing an HMAC or
// checking a signature at all.

// This is exactly why the main page's own explicit-algorithms
// approach is the correct, complete fix -- not merely A fix among
// several -- for this entire attack class: the vulnerability in the
// FIRST codeTab above exists specifically because it allowed BOTH
// algorithms and let the key selection branch on the token's own
// claim. Restricting to a single, hard-coded algorithm removes the
// attacker's ability to choose HS256 in the first place, closing the
// vulnerability at its actual root cause rather than patching around
// individual forged-token symptoms.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'The RS256→HS256 confusion attack requires the attacker to somehow obtain the server\'s SECRET signing key.',
    reality: 'The attacker only ever needs the PUBLIC key — which is, by design, meant to be freely shared (published at a JWKS endpoint precisely so any service can verify tokens without needing the private key). The entire attack works because the vulnerable server\'s code reuses that intentionally-public value as an HS256 secret, not because any actual secret was leaked or compromised.',
  },
  {
    thought: 'Allowing a server to accept multiple algorithms (RS256 AND HS256) is a reasonable flexibility feature as long as each token is verified correctly.',
    reality: 'The vulnerability above shows this flexibility IS the vulnerability — the moment a server accepts more than one algorithm and lets the token\'s own header influence which key/algorithm combination gets used, an attacker gets to choose the weakest link in that combination. The main page\'s own theory states the general fix directly: "always hard-code the expected algorithm" — a single, fixed algorithm removes the attacker\'s ability to choose at all, rather than trying to make every accepted combination individually safe.',
  },
];

@Component({
  selector: 'app-sec-jwt-alg-confusion',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-rs256-to-hs256-confusion-attack-demonstrated.html',
  styleUrl: './the-rs256-to-hs256-confusion-attack-demonstrated.scss',
})
export class TheRs256ToHs256ConfusionAttackDemonstratedSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
