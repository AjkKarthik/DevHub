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
    heading: 'One Sentence on Secret Rotation — Never Actually Built',
    points: [
      'The main page’s own QnA on webhook security names the mechanism in a single clause: "Secret rotation: support rotating shared secrets by accepting both old and new secret during a transition window." No codeTab anywhere on the page shows this dual-secret verification actually implemented.',
      'The problem this solves: the main page’s own HMAC-verification examples (both the codeTab and Challenge) all assume exactly ONE secret. If a consumer rotates their webhook secret at a specific instant, any in-flight or slightly-delayed delivery still signed with the OLD secret would fail verification the moment the sender switches to checking only the new one — a real, disruptive gap with no grace period.',
      'The fix generalizes the verification step from "does this ONE secret produce a matching signature" to "does ANY currently-valid secret produce a matching signature" — trying the new secret first (the common case, going forward), falling back to the old secret only during the deliberately time-boxed transition window.',
      'This is architecturally the same idea as this hub’s own OAuth & OIDC topic covering JWT key rotation (multiple signing keys valid simultaneously, identified via a key ID) — a resource accepting more than one valid credential during a bounded transition period, rather than an instantaneous hard cutover that breaks anything already in flight.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Verifying Against Multiple Secrets',
    language: 'typescript',
    code: `import crypto from 'crypto';

function computeSignature(payload: string, secret: string): string {
  return 'sha256=' + crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

function timingSafeEqualStrings(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

interface RotationResult {
  valid: boolean;
  matchedSecret: string | null;
}

// Tries every currently-valid secret, in order (newest first) -- during
// a rotation window this is typically [newSecret, oldSecret]; outside
// a rotation window it's just [currentSecret].
function verifyWithRotation(
  payload: string,
  signatureHeader: string,
  validSecrets: string[]
): RotationResult {
  for (const secret of validSecrets) {
    const expected = computeSignature(payload, secret);
    if (timingSafeEqualStrings(expected, signatureHeader)) {
      return { valid: true, matchedSecret: secret };
    }
  }
  return { valid: false, matchedSecret: null };
}

const payload = JSON.stringify({ type: 'order.created' });
const oldSecret = 'old-secret-v1';
const newSecret = 'new-secret-v2';

// A sender that hasn't rotated yet still signs with the OLD secret --
// still accepted during the transition window.
const sigFromOldSender = computeSignature(payload, oldSecret);
console.log(verifyWithRotation(payload, sigFromOldSender, [newSecret, oldSecret]));
// { valid: true, matchedSecret: 'old-secret-v1' }

// A sender that HAS rotated signs with the NEW secret -- also accepted.
const sigFromNewSender = computeSignature(payload, newSecret);
console.log(verifyWithRotation(payload, sigFromNewSender, [newSecret, oldSecret]));
// { valid: true, matchedSecret: 'new-secret-v2' }

// A signature from neither valid secret is still correctly rejected.
const sigFromWrongSecret = computeSignature(payload, 'attacker-guess');
console.log(verifyWithRotation(payload, sigFromWrongSecret, [newSecret, oldSecret]));
// { valid: false, matchedSecret: null }`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'Once the rotation’s transition window ends, what SPECIFIC change should be made to the <code>validSecrets</code> array passed into <code>verifyWithRotation()</code> — and why does simply leaving both secrets in the array forever, rather than actively removing the old one, defeat a real security purpose of rotating a secret in the first place?',
  hint: 'If a secret is being rotated because the OLD one may have been compromised or exposed, what does leaving it in <code>validSecrets</code> indefinitely mean for anyone who obtained that old, supposedly-retired secret?',
  solution: `// Once the transition window ends, the OLD secret must be removed
// from validSecrets entirely -- leaving it in the array as
// [newSecret] only (dropping oldSecret).

// Leaving both secrets valid forever defeats a core reason rotation
// exists: if the old secret was rotated BECAUSE it may have leaked or
// been compromised, an attacker who obtained that old secret could
// still forge valid-looking webhook signatures indefinitely, as long
// as the receiver keeps accepting it. The whole point of a bounded
// TRANSITION WINDOW (not "accept old secret forever") is to give
// legitimate senders enough time to actually pick up and start using
// the new secret, after which the old one's acceptance should be
// revoked -- turning rotation into a real security boundary rather
// than a permanently-widened, ever-growing list of acceptable secrets.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Secret rotation is primarily about GENERATING a new secret value — the verification side of a rotation just needs to start checking against the new value once it exists.',
    reality: 'The codeTab above demonstrates the harder, more important half of rotation: the RECEIVING side has to accept BOTH the old and new secret simultaneously during a transition window, specifically because senders don’t all switch to the new secret at the exact same instant a new one is generated — an in-flight delivery signed moments before rotation would otherwise fail verification the instant the receiver stops accepting the old secret.',
  },
  {
    thought: 'Trying multiple secrets in sequence (as <code>verifyWithRotation</code> does) is meaningfully less secure than checking against a single, known-correct secret.',
    reality: 'Each individual comparison in the codeTab’s loop still uses the SAME timing-safe comparison (<code>crypto.timingSafeEqual</code>) the main page’s own single-secret examples use — trying multiple VALID secrets in sequence doesn’t weaken the security property of any individual comparison; it only changes how many currently-acceptable secrets exist at once, a deliberate, bounded-duration relaxation specifically to support rotation.',
  },
  {
    thought: 'The order secrets are checked in (<code>[newSecret, oldSecret]</code> versus <code>[oldSecret, newSecret]</code>) affects WHICH signatures are accepted.',
    reality: 'The codeTab’s <code>verifyWithRotation</code> function returns as soon as ANY secret in the array produces a match — order only affects which secret gets reported as <code>matchedSecret</code> when multiple entries happen to be checked, and how many comparisons run before succeeding (checking the more likely candidate — the new secret — first is a minor efficiency choice), not whether a given valid signature is ultimately accepted or rejected.',
  },
];

@Component({
  selector: 'app-api-webhook-secret-rotation',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './secret-rotation-during-a-transition-window.html',
  styleUrl: './secret-rotation-during-a-transition-window.scss',
})
export class SecretRotationDuringATransitionWindowSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
