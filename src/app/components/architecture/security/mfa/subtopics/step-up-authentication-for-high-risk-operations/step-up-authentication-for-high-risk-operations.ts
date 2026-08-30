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
    heading: 'A Clear Recipe, No Middleware Anywhere',
    points: [
      'The QnA lays out the mechanism precisely: "tag sensitive endpoints... when the user requests a sensitive operation: check when they last performed a step-up challenge. If longer than the step-up TTL (e.g. 5 minutes ago), challenge them again." The main page\'s own login flow only ever checks MFA once, at login — nothing re-challenges for a specific sensitive action afterward.',
      'This subtopic builds exactly the mechanism described: a per-session "last step-up" timestamp, a TTL check on specific tagged routes, and the actual re-challenge response the client has to satisfy before the original request is allowed to proceed.',
    ],
  },
  {
    heading: 'Why Step-Up Needs Its Own Timestamp, Separate From Login MFA',
    points: [
      'The main page\'s own theory already establishes that a login session can last far longer than any single MFA verification event — a user might log in at 9am (verifying MFA once) and stay logged in, working normally, until 5pm. If "changing the account email" only checked "did this session ever pass MFA," a session hijacked at 2pm (via a stolen cookie or leaked JWT) would inherit that same 9am MFA pass and be treated as fully step-up-verified for the rest of the day.',
      'Tracking a SEPARATE, freshness-checked step-up timestamp means the sensitive action requires proof of a RECENT re-verification — not just "this session passed MFA at some point," closing exactly the gap the QnA names: "a stolen session cookie or leaked JWT does not give full account access immediately."',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Step-Up Middleware',
    language: 'typescript',
    code: `const STEP_UP_TTL_MS = 5 * 60_000;   // 5 minutes, per the QnA's own example

function requireStepUp(req: Request, res: Response, next: NextFunction) {
  const lastStepUpAt = req.session.lastStepUpAt as number | undefined;
  const freshEnough = lastStepUpAt && (Date.now() - lastStepUpAt) < STEP_UP_TTL_MS;

  if (!freshEnough) {
    // The ORIGINAL request is not rejected outright -- it's parked,
    // and the client is told exactly what additional proof is needed
    // before this specific action can proceed.
    return res.status(403).json({
      error: 'step_up_required',
      methods: ['totp', 'webauthn'],   // TOTP or FIDO2, per the QnA's own ranking
    });
  }
  next();
}

// Tagging a sensitive endpoint is a single middleware addition:
app.post('/account/email', requireAuth, requireStepUp, async (req, res) => {
  await db.users.updateEmail(req.user.id, req.body.newEmail);
  res.json({ message: 'Email updated' });
});

app.post('/account/bank-account', requireAuth, requireStepUp, async (req, res) => {
  await db.users.addBankAccount(req.user.id, req.body.accountDetails);
  res.json({ message: 'Bank account added' });
});

// An ordinary, low-risk endpoint stays untouched -- no step-up needed:
app.get('/account/profile', requireAuth, async (req, res) => {
  res.json(await db.users.getProfile(req.user.id));
});`,
  },
  {
    label: 'Satisfying the Step-Up Challenge',
    language: 'typescript',
    code: `// The client, upon receiving a 403 step_up_required response, must
// complete an ADDITIONAL verification before retrying the original
// request -- reusing the main page's own verifyTotp() function.
app.post('/auth/step-up', requireAuth, async (req, res) => {
  const { totpCode } = req.body;

  const valid = await verifyTotp(req.user.id, totpCode);
  if (!valid) return res.status(401).json({ error: 'Invalid code' });

  // Record the fresh timestamp -- THIS is what requireStepUp() above
  // actually checks. The original session's login-time MFA pass is
  // never consulted here at all; this is a completely separate clock.
  req.session.lastStepUpAt = Date.now();
  res.json({ message: 'Step-up verified' });
});

// Client flow:
// 1. POST /account/email -> 403 step_up_required
// 2. Prompt user for their TOTP code
// 3. POST /auth/step-up with the code -> 200, lastStepUpAt is now fresh
// 4. Retry POST /account/email -> succeeds (within the 5-minute TTL)`,
  },
];

const exercise: TryItExercise = {
  prompt: 'A user successfully completes a step-up challenge at 2:00:00pm to change their email. At 2:04:00pm, they try to add a bank account (also tagged with <code>requireStepUp</code>). At 2:06:30pm, they try to change their email again. Using the code above with its 5-minute TTL, which of these two later requests succeeds without a new challenge?',
  hint: 'The TTL check compares against ONE shared <code>lastStepUpAt</code> timestamp on the session — it has no memory of WHICH specific action originally triggered the step-up.',
  solution: `// The 2:04pm bank-account request SUCCEEDS without a new challenge;
// the 2:06:30pm email request REQUIRES a fresh challenge.

// requireStepUp() only checks "how long ago was the LAST successful
// step-up," regardless of which sensitive action triggered it --
// there's no per-action tracking, just one shared timestamp on the
// session. At 2:04pm, only 4 minutes have passed since the 2:00pm
// step-up (< 5 minute TTL) -- freshEnough is true, so the bank-account
// request proceeds immediately, EVEN THOUGH the user never specifically
// step-up-verified "adding a bank account" -- they verified something
// else, 4 minutes ago, and that's treated as sufficient.

// At 2:06:30pm, 6.5 minutes have passed since the ORIGINAL 2:00pm
// step-up -- past the 5-minute TTL -- freshEnough is false, so this
// request is rejected with step_up_required, even though it's asking
// for the SAME action (changing email) the user already step-up-
// verified once, just too long ago now.

// This reveals a real design choice worth naming explicitly: this
// implementation treats "step-up freshness" as a property of the
// SESSION, not of each individual sensitive action -- a reasonable,
// simpler design for many applications, but one where a user
// performing several DIFFERENT sensitive actions in quick succession
// only needs to step-up ONCE, not once per action type. A stricter
// design (per-action-type step-up timestamps) would require the
// bank-account request to trigger its own separate challenge too,
// even at 2:04pm -- a real tradeoff between security granularity and
// user friction that the QnA's own one-sentence description doesn't
// surface.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Step-up authentication and the original login MFA check are really the same mechanism — step-up just re-runs the login MFA check.',
    reality: 'They intentionally track completely SEPARATE state: the login MFA check happens once, at session creation, and its result is baked into the session forever (until logout). <code>requireStepUp()</code> checks a DIFFERENT, continuously-refreshing timestamp (<code>lastStepUpAt</code>) that specifically measures RECENCY — a session that logged in with MFA eight hours ago has a perfectly valid login-MFA pass, but would still fail <code>requireStepUp()</code>\'s 5-minute freshness check, exactly as intended.',
  },
  {
    thought: 'A stolen session cookie or leaked JWT gives an attacker full account access, since step-up auth only protects specific tagged endpoints.',
    reality: 'This is precisely backwards from the QnA\'s own stated benefit — "a stolen session cookie or leaked JWT does not give full account access immediately... the attacker is blocked at the step-up challenge for high-value actions." An attacker with a stolen session CAN read low-risk endpoints (like the untouched <code>/account/profile</code> in the codeTab above) immediately, but is blocked from HIGH-VALUE actions (changing email, adding a bank account) by <code>requireStepUp()</code>, since they have no way to satisfy a fresh TOTP/WebAuthn challenge without the legitimate user\'s own second factor.',
  },
];

@Component({
  selector: 'app-sec-mfa-stepup',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './step-up-authentication-for-high-risk-operations.html',
  styleUrl: './step-up-authentication-for-high-risk-operations.scss',
})
export class StepUpAuthenticationForHighRiskOperationsSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
