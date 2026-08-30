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
    heading: '"Token Families" Named, Never Built',
    points: [
      'The quiz explains the mechanism in real detail: "each refresh invalidates the old refresh token and issues a new one. If a refresh token is replayed after use, the server detects the re-use and invalidates all refresh tokens for that session... implement refresh token families to track rotation." No codeTab anywhere on the page shows what a "family" actually is or how reuse detection is implemented.',
      'This subtopic builds it directly: a chain of refresh tokens linked by a shared <code>familyId</code>, where using an ALREADY-USED token is treated as a signal the family has been compromised — not just a rejected request.',
    ],
  },
  {
    heading: 'Why Reusing an Old Token Is Suspicious, Not Just Invalid',
    points: [
      'In normal operation, a client always uses its MOST RECENT refresh token — each refresh exchanges the current token for a new one and the old one is discarded. If a token that was already rotated away shows up again, there are only two explanations: the legitimate client somehow has a stale copy (unlikely with correct client-side token replacement), or an ATTACKER has a copy of an old, already-superseded token — meaning the family was compromised at some point in the past, and the attacker and the legitimate user are now racing each other to refresh.',
      'This is why the correct response to a reused token isn\'t just "reject this one request" — it\'s "invalidate the ENTIRE family," since at this point neither the server nor the legitimate user can tell which of the two parties currently holds the family\'s latest, valid token.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Issuing the First Token in a Family',
    language: 'typescript',
    code: `import { randomUUID } from 'crypto';

// A "family" is just a shared ID linking every refresh token that
// descended from the same original login -- created once, at login.
async function login(userId: string): Promise<{ accessToken: string; refreshToken: string }> {
  const familyId = randomUUID();
  const refreshToken = randomUUID();

  await db.refreshTokens.create({
    token: refreshToken,
    familyId,
    userId,
    used: false,
    createdAt: new Date(),
  });

  return { accessToken: issueToken(userId, []), refreshToken };
}`,
  },
  {
    label: 'Rotation With Reuse Detection',
    language: 'typescript',
    code: `async function refresh(oldRefreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
  const record = await db.refreshTokens.findByToken(oldRefreshToken);
  if (!record) throw new Error('Unknown refresh token');

  if (record.used) {
    // REUSE DETECTED: this token was already exchanged once before.
    // Someone else -- an attacker holding a stolen copy -- is now
    // trying to use the SAME already-superseded token. We cannot tell
    // whether the legitimate user or the attacker sent THIS request,
    // so the only safe response is to burn the entire family.
    await db.refreshTokens.invalidateFamily(record.familyId);
    throw new Error('Refresh token reuse detected -- session terminated');
  }

  // Normal case: mark this token used, issue a new one in the SAME family.
  await db.refreshTokens.markUsed(oldRefreshToken);

  const newRefreshToken = randomUUID();
  await db.refreshTokens.create({
    token: newRefreshToken,
    familyId: record.familyId,   // stays linked to the same family
    userId: record.userId,
    used: false,
    createdAt: new Date(),
  });

  return { accessToken: issueToken(record.userId, []), refreshToken: newRefreshToken };
}`,
  },
];

const exercise: TryItExercise = {
  prompt: 'An attacker steals refresh token <code>T1</code> from a user\'s device. The LEGITIMATE user\'s browser refreshes first, exchanging <code>T1</code> for <code>T2</code> (normal, unnoticed). Ten seconds later, the attacker tries to use their stolen copy of <code>T1</code>. Trace exactly what <code>refresh()</code> does with the attacker\'s request, and what happens to the LEGITIMATE user\'s session as a result.',
  hint: 'By the time the attacker\'s request arrives, has <code>T1</code>\'s <code>used</code> field already been set — and by whom?',
  solution: `// The attacker's request is rejected AND the legitimate user's
// currently-active session (T2) is also invalidated as a side effect
// -- this is the intended, correct behavior, not a bug.

// Tracing it: the legitimate user's refresh ran FIRST, so by the time
// the attacker's request for T1 arrives, T1.used is already true (set
// during the legitimate user's own successful refresh). The
// attacker's request hits the "if (record.used)" branch, which
// invalidates the ENTIRE family -- including T2, the token the
// legitimate user is now actually holding and relying on.

// This means the legitimate user gets logged out too, even though
// THEY did nothing wrong -- a real, deliberate cost of this design.
// The alternative (silently rejecting only the attacker's stale
// request, leaving T2 valid) would mean the server has no way to
// distinguish "an attacker's stolen-but-outdated copy showed up" from
// "the family was never actually compromised, this is just some
// harmless duplicate request" -- and choosing to trust T2 anyway
// risks leaving an attacker with a still-valid path back in if T2
// itself was ALSO compromised in the same theft. Forcing a full
// re-login is the safe failure mode: it costs the legitimate user one
// inconvenient re-authentication, in exchange for guaranteeing the
// attacker's stolen token can never be leveraged into a lasting
// session.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'When refresh token reuse is detected, only the SPECIFIC reused token should be rejected — invalidating the whole family unfairly punishes the legitimate user too.',
    reality: 'The Try It above traces exactly why this "unfair" cost is the correct tradeoff: once reuse is detected, the server genuinely cannot tell which of the two parties (the legitimate user or the attacker) is holding the family\'s CURRENT valid token — both a "the attacker still has other stolen tokens too" scenario and a "this was actually harmless" scenario look identical from the server\'s point of view at the moment reuse is detected. Invalidating the whole family and forcing re-authentication is the only response that closes the attacker\'s access under EITHER possibility, at the cost of one inconvenient re-login for the legitimate user.',
  },
  {
    thought: 'A "token family" is a special cryptographic construct — a signed chain, or a different kind of token entirely.',
    reality: 'In the implementation above, a family is nothing more than a shared, ordinary UUID (<code>familyId</code>) stored alongside each refresh token row in the database — the "chain" is just a foreign-key-style relationship between database rows, not any special token FORMAT or cryptographic linking mechanism. The actual security mechanism is the <code>used</code> boolean and the invalidate-on-reuse LOGIC, not anything intrinsic to how the tokens themselves are constructed.',
  },
];

@Component({
  selector: 'app-sec-jwt-refresh-rotation',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './refresh-token-rotation-with-reuse-detection.html',
  styleUrl: './refresh-token-rotation-with-reuse-detection.scss',
})
export class RefreshTokenRotationWithReuseDetectionSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
