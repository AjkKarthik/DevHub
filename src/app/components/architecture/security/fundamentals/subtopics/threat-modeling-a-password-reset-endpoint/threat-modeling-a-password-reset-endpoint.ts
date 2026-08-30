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
    heading: 'Six Categories Named, Never Walked Through One Feature',
    points: [
      'The main page\'s own quiz question defines all six STRIDE categories with a one-line mitigation each: "Spoofing... Tampering... Repudiation... Information Disclosure... Denial of Service... Elevation of Privilege." No codeTab on the page ever applies all six to ONE concrete feature — the mitigations stay abstract, one clause per category.',
      'This subtopic threat-models a single, realistic feature — a password-reset endpoint — through all six STRIDE categories, in the exact order the main page\'s own quiz lists them, tracing a concrete threat and mitigation for each.',
    ],
  },
  {
    heading: 'Why Password Reset Is a Good STRIDE Teaching Example',
    points: [
      'A password-reset flow genuinely touches all six categories at once — it deals with identity (Spoofing), a stored token (Tampering), an audit trail question (Repudiation), a secret value in transit (Information Disclosure), a public unauthenticated endpoint (Denial of Service), and a privilege boundary the moment the new password is accepted (Elevation of Privilege) — unlike many simpler CRUD endpoints where two or three categories genuinely don\'t apply at all.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'STRIDE Applied to POST /reset-password',
    language: 'typescript',
    code: `// The feature: POST /reset-password/request { email }
//              POST /reset-password/confirm { token, newPassword }

// S — Spoofing: could an attacker impersonate the account owner?
// Threat: attacker requests a reset for someone ELSE'S email, then
// intercepts or guesses the reset link sent to that email.
// Mitigation: the reset token must be delivered ONLY to the
// email address on file -- never returned in the API response itself.
//
// D — Denial of Service (mitigation applied here, as middleware):
// rate-limit by IP so an attacker can't flood the email service's
// send quota or the database's write capacity -- this hub's own
// RateLimiter (from the main page's own Challenge) applies directly.
app.post('/reset-password/request', rateLimiter.middleware({ maxRequests: 3, windowMs: 60_000 }),
  async (req, res) => {
    const { email } = req.body;
    const user = await db.users.findByEmail(email);
    if (user) {
      const token = crypto.randomBytes(32).toString('hex'); // T, below
      await db.resetTokens.create({ userId: user.id, token, expiresAt: Date.now() + 15 * 60_000 });
      await emailService.send(user.email, \`Reset link: /reset?token=\${token}\`);
    }

    // R — Repudiation: log every request, whether or not the email
    // exists -- an audit trail the user (or support) can review if
    // they claim "I never asked for this."
    await auditLog.record({ event: 'password_reset_requested', userId: user?.id, ip: req.ip, at: new Date() });

    // I — Information Disclosure: never reveal whether the email is
    // registered -- a real, well-known enumeration vulnerability.
    // The SAME response either way, regardless of what happened above.
    res.status(200).json({ message: 'If that email exists, a reset link was sent.' });
  });

// T — Tampering: could the reset token be modified or forged?
// Threat: attacker guesses or brute-forces a short/predictable token.
// Mitigation: cryptographically random token (32 bytes = 256 bits of
// entropy), stored server-side, compared exactly -- never derived
// from guessable user data (no "userId + timestamp" style tokens).
// Applied above via crypto.randomBytes(32) rather than, say,
// \`\${user.id}-\${Date.now()}\`.

// E — Elevation of Privilege: could confirming a reset let an
// attacker take over a DIFFERENT account than the one the token
// was issued for?
// Threat: the confirm endpoint trusts a client-supplied userId
// instead of deriving the account SOLELY from the token itself.
app.post('/reset-password/confirm', async (req, res) => {
  const { token, newPassword } = req.body;
  const record = await db.resetTokens.findValid(token);   // token IS the identity -- no separate userId param
  if (!record) return res.status(400).json({ error: 'Invalid or expired token' });
  await db.users.updatePassword(record.userId, await hashPassword(newPassword));
  await db.resetTokens.invalidate(token);   // single-use -- prevents replay
  res.status(200).json({ message: 'Password updated' });
});`,
  },
];

const exercise: TryItExercise = {
  prompt: 'The confirm endpoint above calls <code>db.resetTokens.invalidate(token)</code> AFTER updating the password. Which STRIDE category does forgetting this specific call put at risk, and how?',
  hint: 'Think about what happens if the SAME valid token is submitted to <code>/reset-password/confirm</code> a second time.',
  solution: `// Elevation of Privilege -- specifically, a REPLAY attack against
// the token. Without invalidating it, the same token could be
// submitted again (by the legitimate user's own retried request,
// OR by an attacker who intercepted the token earlier) to set the
// password to something else, EVEN AFTER the account owner has
// already completed their intended reset.

// This is also a mild Repudiation risk: without single-use
// enforcement, the audit log alone can't distinguish "the real
// owner reset their password once" from "someone replayed their
// token to reset it again" -- the log would show two legitimate-
// looking confirm events for the same token.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'STRIDE is only useful for large, complex systems — a single endpoint like password reset is too small to need a full six-category threat model.',
    reality: 'This subtopic\'s own worked example shows the opposite — a SINGLE endpoint genuinely triggers real threats across ALL SIX categories, several of which (email enumeration, token replay) are well-documented, real-world vulnerability classes specifically in password-reset flows. STRIDE scales down to a single feature just as naturally as it scales up to a whole system; the main page\'s own theory bullet ("Threat modelling at design time... is the cheapest way to find architectural flaws before a line of code is written") applies at any size.',
  },
  {
    thought: 'Since the SAME response is returned whether or not the email exists, the Information Disclosure mitigation makes the endpoint completely safe from enumeration.',
    reality: 'It closes the MOST common enumeration channel (the response body), but a careful attacker can still sometimes distinguish the two cases through a SIDE channel — response TIMING (looking up a real user and sending an email takes measurably longer than the early-return "no such user" path), unless that timing is deliberately equalized too. This is a genuinely deeper rabbit hole than the main page\'s own coverage of Information Disclosure goes, worth knowing exists even if this subtopic\'s own fix (matching response bodies) is the right FIRST step.',
  },
];

@Component({
  selector: 'app-sec-fund-stride',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './threat-modeling-a-password-reset-endpoint.html',
  styleUrl: './threat-modeling-a-password-reset-endpoint.scss',
})
export class ThreatModelingAPasswordResetEndpointSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
