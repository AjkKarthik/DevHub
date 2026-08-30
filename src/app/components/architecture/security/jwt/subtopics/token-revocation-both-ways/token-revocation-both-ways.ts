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
    heading: 'A Precise Tradeoff, No Code for Either Side',
    points: [
      'The page\'s own QnA compares two revocation strategies in real detail: "tokenVersion... bumping the version invalidates every token that user currently holds... efficient... but blunt" versus "per-token JTI blacklisting... requires a growing lookup store... but you CAN target one specific compromised token precisely." The quiz repeats both approaches in its own explanation. Neither one appears in any codeTab on the page — the existing "Issue & Verify JWT" codeTab has no revocation logic at all.',
      'This subtopic builds both, wired into the SAME <code>verifyToken</code> flow from the main page, so the tradeoff the QnA describes in prose is directly visible as two working, contrasting implementations.',
    ],
  },
  {
    heading: 'Why Both Checks Have to Happen AFTER Signature Verification',
    points: [
      'Both revocation checks below run their database/Redis lookup only AFTER <code>jwt.verify()</code> has already confirmed the token is genuinely signed and unexpired. Checking revocation status BEFORE verifying the signature would mean looking up a claim from an unverified token — an attacker could set an arbitrary <code>sub</code> or <code>jti</code> in a forged, unsigned token specifically to probe or bypass the revocation store, since nothing has confirmed those claims are trustworthy yet.',
      'This mirrors the main page\'s own theory bullet — "never trust any claim in the token payload until the signature and standard claims are validated" — applied specifically to the two claims (<code>sub</code> for tokenVersion, <code>jti</code> for the blacklist) each revocation strategy depends on.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'tokenVersion — Revoke ALL of a User\'s Tokens at Once',
    language: 'typescript',
    code: `// Every issued token embeds the user's CURRENT tokenVersion at
// issue time. Bumping the stored version invalidates every token
// that still carries the OLD version, regardless of expiry.
function issueToken(userId: string, roles: string[], tokenVersion: number): string {
  return jwt.sign(
    { sub: userId, roles, tokenVersion, iss: 'https://auth.example.com', aud: 'api.example.com' },
    PRIVATE_KEY,
    { algorithm: 'RS256', expiresIn: '15m' }
  );
}

async function verifyTokenWithVersion(token: string): Promise<{ sub: string; roles: string[] }> {
  const payload = jwt.verify(token, PUBLIC_KEY, {
    algorithms: ['RS256'], issuer: 'https://auth.example.com', audience: 'api.example.com',
  }) as { sub: string; roles: string[]; tokenVersion: number };

  // Signature is already confirmed valid at this point -- only NOW is
  // it safe to trust payload.sub for a database lookup.
  const currentVersion = await db.users.getTokenVersion(payload.sub);
  if (payload.tokenVersion !== currentVersion) {
    throw new Error('Token has been revoked (version mismatch)');
  }
  return payload;
}

// "Log out everywhere" -- one write, every existing token (any
// device, any session) becomes invalid on its NEXT verification.
async function logoutEverywhere(userId: string) {
  await db.users.incrementTokenVersion(userId);
}`,
  },
  {
    label: 'JTI Blacklist — Revoke One Specific Token',
    language: 'typescript',
    code: `import { randomUUID } from 'crypto';

function issueTokenWithJti(userId: string, roles: string[]): string {
  return jwt.sign(
    { sub: userId, roles, jti: randomUUID(), iss: 'https://auth.example.com', aud: 'api.example.com' },
    PRIVATE_KEY,
    { algorithm: 'RS256', expiresIn: '15m' }
  );
}

async function verifyTokenWithBlacklist(token: string): Promise<{ sub: string; roles: string[] }> {
  const payload = jwt.verify(token, PUBLIC_KEY, {
    algorithms: ['RS256'], issuer: 'https://auth.example.com', audience: 'api.example.com',
  }) as { sub: string; roles: string[]; jti: string };

  // Signature confirmed -- now safe to trust payload.jti for the lookup.
  const isRevoked = await redis.exists(\`revoked:\${payload.jti}\`);
  if (isRevoked) throw new Error('Token has been revoked (jti blacklisted)');
  return payload;
}

// Revoke ONE specific token (e.g. "log out this device only") --
// every OTHER token this user holds keeps working normally.
async function revokeOneToken(jti: string, remainingLifetimeSeconds: number) {
  // TTL matches the token's own remaining lifetime -- the blacklist
  // entry naturally expires the moment the token itself would have,
  // so it never grows unbounded.
  await redis.set(\`revoked:\${jti}\`, '1', 'EX', remainingLifetimeSeconds);
}`,
  },
];

const exercise: TryItExercise = {
  prompt: 'A user has two active sessions: a laptop and a phone, each holding a different access token (different <code>jti</code>, same <code>tokenVersion</code>). The user reports their PHONE as stolen. Using ONLY the tokenVersion approach, can you revoke just the phone\'s token while leaving the laptop\'s session active? What about using ONLY the JTI blacklist approach?',
  hint: 'Check what value each approach actually stores and compares — is it something shared across every token a user holds, or something unique per token?',
  solution: `// tokenVersion: NO, you cannot target just the phone. Both tokens
// share the SAME userId, and tokenVersion is stored per USER, not per
// token -- bumping it invalidates BOTH the phone's token AND the
// laptop's token simultaneously. There is no way to distinguish which
// physical device a tokenVersion-checked token came from.

// JTI blacklist: YES, this works exactly as needed. Each token
// (phone's and laptop's) has its OWN unique jti generated at issue
// time. Revoking the phone's specific jti adds only THAT token's ID
// to the blacklist -- the laptop's token has a different jti, is
// never checked against the phone's blacklist entry, and continues
// verifying successfully.

// This is precisely the granularity tradeoff the main page's own QnA
// describes in the abstract -- this exercise makes it concrete with a
// real two-device scenario where the difference actually matters: a
// stolen-phone response needs per-device revocation, which only the
// JTI approach can deliver.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since JTI blacklisting can target one specific token precisely, it is simply the better approach and tokenVersion is only useful when JTI isn\'t implemented.',
    reality: 'The main page\'s own QnA is explicit that this is a genuine tradeoff, not a strictly-better-or-worse comparison: tokenVersion needs no growing external store (a single integer compare, no Redis dependency, no cleanup) and is the RIGHT tool specifically when "log out everywhere" IS the desired response (e.g. a suspected account-wide compromise, a password change) — using JTI blacklisting for that case would mean individually revoking every active token one at a time, which is both slower and needlessly complex for a scenario where blanket revocation is exactly what\'s wanted.',
  },
  {
    thought: 'The revocation check (tokenVersion comparison or JTI blacklist lookup) can run before or after jwt.verify() — the order doesn\'t really matter as long as both checks happen.',
    reality: 'The order is a real security requirement, not a stylistic choice: both revocation checks trust a CLAIM from the token payload (<code>sub</code> or <code>jti</code>) to perform their lookup, and a claim from an unverified token cannot be trusted at all — an attacker could submit an entirely forged, unsigned token with an arbitrary <code>jti</code> specifically chosen to NOT be on the blacklist, bypassing the check if it ran before signature verification. Both codeTabs above run the revocation check strictly after <code>jwt.verify()</code> has already confirmed the token is genuinely signed, for exactly this reason.',
  },
];

@Component({
  selector: 'app-sec-jwt-revocation',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './token-revocation-both-ways.html',
  styleUrl: './token-revocation-both-ways.scss',
})
export class TokenRevocationBothWaysSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
