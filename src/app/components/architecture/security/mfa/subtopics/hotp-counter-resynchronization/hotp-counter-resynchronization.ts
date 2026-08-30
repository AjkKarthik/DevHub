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
    heading: 'The Problem Named, the Fix Never Shown',
    points: [
      'The QnA states the problem directly: "HOTP (RFC 4226): HMAC-based — uses an incrementing counter as the moving factor. Codes are valid until used. Synchronisation problems arise if codes are generated but not used." What it doesn\'t explain is HOW a real HOTP server recovers from this — the main page\'s own Challenge and codeTabs are entirely TOTP-based (time, not a counter), so the counter-desync problem and its fix never come up in code anywhere on the page.',
      'This subtopic builds RFC 4226\'s own documented fix — the look-ahead window, verified against the RFC via WebSearch before publishing — reusing the SAME <code>hotp()</code> truncation function from the main page\'s own Challenge solution (unmodified) as the building block.',
    ],
  },
  {
    heading: 'Why the Desync Happens at All',
    points: [
      'The QnA\'s own explanation identifies the root cause precisely: the token\'s counter increments every time the DEVICE generates a new code (e.g. the user presses a button, or even just opens the app and it displays the next code) — but the SERVER only ever increments its OWN stored counter after a successful verification. If a user generates a code, gets distracted, and generates ANOTHER one before submitting either, the device\'s counter has now advanced two steps while the server\'s is still at the old position — a mismatch with nothing forcing the two back into alignment on its own.',
      'RFC 4226\'s fix doesn\'t try to prevent the drift — it accepts that it will happen, and gives the SERVER a way to catch up when it does, by checking a small range of FUTURE counter values instead of just the one it expects.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'The Look-Ahead Window',
    language: 'typescript',
    code: `// Reuses the main page's own Challenge hotp() function unmodified --
// this is the exact same HMAC-SHA1 truncation logic, just applied to
// a STORED counter the server tracks per user, instead of a time-based
// value.
function hotp(secret: string, counter: number): string {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac('sha1', Buffer.from(secret, 'base32')).update(buf).digest();
  const offset = hmac[19] & 0x0f;
  const truncated = ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return (truncated % 1_000_000).toString().padStart(6, '0');
}

const LOOK_AHEAD_WINDOW = 10;   // RFC 4226's own recommended parameter, "s"

// The server's stored counter -- NOT incremented on every code
// generation (the server never sees those), only on a verified match.
async function verifyHotp(userId: string, submittedCode: string): Promise<boolean> {
  const serverCounter = await db.users.getHotpCounter(userId);
  const secret = await db.users.getHotpSecret(userId);

  // Check the EXPECTED counter first, then up to s counters ahead --
  // covers a device that generated several unused codes in a row.
  for (let i = 0; i <= LOOK_AHEAD_WINDOW; i++) {
    if (hotp(secret, serverCounter + i) === submittedCode) {
      // RFC 4226's own resync rule: on a match at counter+i, the
      // server's NEW stored counter becomes (counter+i) + 1 -- not
      // just +1 from the OLD value. This is what actually closes the
      // gap the device had already opened up.
      await db.users.setHotpCounter(userId, serverCounter + i + 1);
      return true;
    }
  }
  // No match anywhere in the window -- either a wrong code, or the
  // device has drifted MORE than s steps ahead (a real failure mode
  // RFC 4226 itself notes: past this point, resync needs a different,
  // out-of-band mechanism, e.g. asking the user to enter TWO
  // consecutive codes to prove possession without brute-forcing).
  return false;
}`,
  },
];

const exercise: TryItExercise = {
  prompt: 'A user\'s server-side counter is stored at <code>42</code>. Their physical device has drifted ahead and is currently showing the code for counter <code>45</code> (they generated codes at 42, 43, and 44 without ever submitting any of them, then finally submit the code for 45). Using <code>LOOK_AHEAD_WINDOW = 10</code>, does <code>verifyHotp</code> accept this code — and what is the server\'s counter set to afterward?',
  hint: 'The loop checks <code>serverCounter + i</code> for <code>i</code> from 0 to 10 — is 45 reachable from a starting counter of 42 within that range?',
  solution: `// Yes, it's accepted. serverCounter=42, and the loop checks counters
// 42, 43, 44, 45, ... -- the submitted code matches hotp(secret, 45)
// when i=3 (42+3=45), well within the 0-10 look-ahead range.

// The resync rule then sets the server's counter to (serverCounter +
// i) + 1 = (42 + 3) + 1 = 46 -- NOT simply 42+1=43. This is the
// crucial detail: the server doesn't just increment its old value by
// one, it jumps forward to sit ONE PAST the counter that actually
// matched, fully absorbing the 3-step drift the device had
// accumulated. The very next code the device generates will be for
// counter 46 (since the device's own counter is also now at 46,
// having generated a code for 45 and about to move past it) -- server
// and device are back in perfect alignment after this single
// successful verification, with no further resync needed unless the
// user skips codes again in the future.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Increasing LOOK_AHEAD_WINDOW to a very large number (like 1000) would make HOTP effectively immune to desync problems, with no real downside.',
    reality: 'A larger window doesn\'t just tolerate more legitimate drift — it also gives an attacker attempting to GUESS a valid code a proportionally larger set of valid targets to brute-force against on every single verification attempt, since ANY of the window\'s worth of future codes will be accepted. RFC 4226\'s own recommended value (s=10) is a deliberate, bounded tradeoff between real-world usability (accommodating a modest amount of accidental drift) and keeping the attacker\'s guessing surface small — this is not a parameter to maximize without cost.',
  },
  {
    thought: 'The look-ahead window fixes counter desync the same way TOTP\'s window: 1 parameter (already shown on the main page) fixes clock-drift issues — they\'re basically the same mechanism applied to two different moving factors.',
    reality: 'They differ in a way that matters: TOTP\'s window is checked SYMMETRICALLY (one step behind, current, one step ahead) because clock drift can push either direction — the server\'s clock could be fast or slow relative to the device\'s. HOTP\'s look-ahead window is checked ONE-DIRECTIONALLY (only counter and forward, never behind) because the counter can only ever increase — a device physically cannot "un-generate" a code and go back to an earlier counter value, so there is no symmetric case to check for.',
  },
];

@Component({
  selector: 'app-sec-mfa-hotp-resync',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './hotp-counter-resynchronization.html',
  styleUrl: './hotp-counter-resynchronization.scss',
})
export class HotpCounterResynchronizationSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
