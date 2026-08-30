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
    heading: 'The Attack and Its Fix, Both Named, Neither Built',
    points: [
      'The quiz describes MFA fatigue precisely: "after stealing credentials via phishing, the attacker logs in with the victim credentials... repeatedly [sends push notifications], late at night, hoping the victim taps Approve to stop the notifications." It also names the fix: "number matching: the authentication push includes a number displayed on the login screen. The user must enter the matching number in the authenticator app, not just approve." Nothing on the main page shows a push-approval flow at all — every codeTab is TOTP or backup-code based.',
      'This subtopic builds the plain "tap to approve" flow the quiz\'s own attack description assumes, then the number-matching fix on top of it, so the exact mechanical difference between "vulnerable to fatigue" and "resistant to fatigue" is visible in code, not just prose.',
    ],
  },
  {
    heading: 'Why Number Matching Specifically Defeats the Fatigue Attack',
    points: [
      'A plain push notification only requires the victim to tap ONE button — "Approve" or "Deny" — with no information from the login screen itself. Late-night notification fatigue works precisely because approving requires no attention to context; a half-asleep user can tap Approve just to make the buzzing stop.',
      'Number matching forces the user to look at BOTH screens and correlate them — they must read a 2-3 digit number off the browser\'s own login screen, then find and tap that SAME number among several displayed choices in the authenticator app. This is a meaningfully higher-friction action that requires actually engaging with what\'s being approved, not a button any distracted tap can satisfy.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Vulnerable — Plain Approve/Deny Push',
    language: 'typescript',
    code: `// The attack the quiz describes: repeatedly triggering THIS exact
// endpoint gives the victim nothing to distinguish a legitimate login
// attempt from an attacker's -- just a bare Approve/Deny choice.
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await validateCredentials(email, password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const pushId = await sendPushNotification(user.deviceToken, {
    title: 'Login attempt',
    body: 'Tap Approve to sign in',
  });

  // Poll (or receive a webhook callback) for the user's tap.
  const approved = await waitForPushResponse(pushId, { timeoutMs: 60_000 });
  if (!approved) return res.status(401).json({ error: 'Login denied or timed out' });

  res.json({ token: issueJwt(user.id) });
});

// An attacker with stolen credentials can call THIS endpoint
// repeatedly, at any hour, with no additional information required --
// each attempt just re-triggers the same bare Approve/Deny prompt.`,
  },
  {
    label: 'Fixed — Number Matching',
    language: 'typescript',
    code: `import crypto from 'crypto';

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await validateCredentials(email, password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  // A short number the LOGIN SCREEN shows -- the user must find and
  // tap this exact number among several choices in the auth app.
  const displayNumber = crypto.randomInt(10, 100).toString();   // 2 digits, e.g. "47"

  const pushId = await sendPushNotification(user.deviceToken, {
    title: 'Login attempt',
    body: 'Select the matching number to sign in',
    // The push itself carries the CORRECT number plus a couple of
    // decoys -- the app shows all of them, shuffled, as tap targets.
    choices: shuffle([displayNumber, randomDecoy(displayNumber), randomDecoy(displayNumber)]),
    correctChoice: displayNumber,
  });

  // Respond to the BROWSER immediately with the number to display --
  // the user needs to see it on THIS screen before checking their phone.
  res.json({ pushId, displayNumber });
});

// A separate endpoint the browser polls, showing displayNumber to the
// user while waiting for the app-side selection to come back:
app.get('/auth/login/status/:pushId', async (req, res) => {
  const result = await getPushResult(req.params.pushId);   // 'approved' | 'denied' | 'pending'
  if (result === 'approved') return res.json({ token: issueJwt(/* ... */) });
  res.json({ status: result });
});

// An attacker triggering repeated pushes now gets nothing useful from
// mere spam -- each push shows a DIFFERENT random number, and the
// victim's own authenticator app never displays the attacker's login
// SCREEN at all, so the victim has no correct number to match even if
// they wanted to (unless they were actively trying to log in
// themselves at that exact moment and could see it on their own browser).`,
  },
];

const exercise: TryItExercise = {
  prompt: 'An attacker triggers 20 login push notifications for a victim overnight, hoping for an accidental tap. With NUMBER MATCHING in place, what specifically stops the victim from accidentally approving one of these, even if they tap SOMETHING on their phone out of habit or annoyance?',
  hint: 'The victim is not logged into the attacker\'s browser session and cannot see the attacker\'s login screen. What number would they even be trying to match?',
  solution: `// The victim has no correct number to select at all -- they never
// see the attacker's login screen, so they have no displayNumber to
// match against the choices shown in their authenticator app.

// Even if the victim, annoyed by the repeated buzzing, opens the app
// and taps a number AT RANDOM out of habit, the odds of accidentally
// picking the correct one among 3 shuffled choices is only 1-in-3 per
// attempt -- meaningfully lower than a plain Approve/Deny push (where
// a single reflexive tap on "Approve" succeeds with certainty). More
// importantly, the entire premise of the fatigue attack -- "the
// victim doesn't need to think, just tap to make it stop" -- breaks
// down, because tapping ANY number without actually checking a real
// login screen has, at best, a 1-in-3 chance of accidentally granting
// access rather than the attack's original 100% success rate against
// a bare Approve button.

// This is also why the fix genuinely requires TWO screens working
// together (the browser showing displayNumber, the app showing the
// shuffled choices) -- number matching implemented as a single-device
// flow (e.g. the app itself showing both the "correct" number and the
// choices) would defeat the whole point, since the attacker's own
// push could then just display its own correct answer alongside itself.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Number matching is really just "Approve/Deny" with extra visual decoration — the underlying security guarantee is the same.',
    reality: 'The codeTabs above show a structural difference, not a cosmetic one: plain Approve/Deny requires no information from a second screen at all, while number matching REQUIRES the user to already be looking at their own real login attempt\'s screen to have any correct answer to select. An attacker\'s spammed pushes carry a number the victim never sees anywhere legitimate, which is precisely what breaks the "just tap to make it stop" behavior the fatigue attack depends on.',
  },
  {
    thought: 'Rate-limiting how many push notifications a user can receive per hour would be an equally effective fix for MFA fatigue.',
    reality: 'Rate limiting reduces the NUMBER of chances an attacker gets, but does nothing to change what happens on any single accidental approval — a determined attacker who sends even 3-5 pushes (well under most reasonable rate limits) still has a real chance of success against a plain Approve/Deny prompt if the victim is tired or distracted. Number matching addresses the actual mechanism of the attack (accidental approval requiring zero context) rather than just reducing how many attempts an attacker gets to exploit that same mechanism — the two approaches are complementary, not substitutes for each other.',
  },
];

@Component({
  selector: 'app-sec-mfa-fatigue',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './mfa-fatigue-and-number-matching-implemented.html',
  styleUrl: './mfa-fatigue-and-number-matching-implemented.scss',
})
export class MfaFatigueAndNumberMatchingImplementedSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
