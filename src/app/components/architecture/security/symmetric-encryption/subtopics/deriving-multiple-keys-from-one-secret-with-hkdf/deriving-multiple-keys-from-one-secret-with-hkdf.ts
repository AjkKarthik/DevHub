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
    heading: 'A Different Problem Than the Main Page\'s Own KDF Advice',
    points: [
      'The main page\'s own theory bullet says "never derive keys from passwords without a KDF (use PBKDF2 or Argon2 with a salt)" — that\'s about turning a low-entropy, human-chosen PASSWORD into a usable key, deliberately made slow to resist brute force.',
      'The quiz\'s own KDF question names a COMPLETELY DIFFERENT problem HKDF solves: you already have ONE high-entropy shared secret (from a Diffie-Hellman exchange, or a KMS-issued key) and need to derive SEVERAL independent keys from it — an encryption key and a separate MAC key, for instance — without making a slow, brute-force-resistant KDF call for each one.',
      'Node\'s <code>crypto.hkdfSync(digest, ikm, salt, info, keylen)</code> implements RFC 5869 directly: <code>ikm</code> is the shared secret, <code>info</code> is a context string that makes each derived key CRYPTOGRAPHICALLY INDEPENDENT even though they all come from the identical input secret.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'One Shared Secret, Two Independent Keys',
    language: 'typescript',
    code: `import crypto from 'crypto';

// A shared secret from SOME prior step -- a Diffie-Hellman exchange,
// or a data key already returned by KMS. It is NOT a password, and
// it is already high-entropy -- HKDF is fast specifically because it
// doesn't need to be slow the way a password-based KDF does.
const sharedSecret = crypto.randomBytes(32); // stand-in for a real DH/KMS secret

function deriveKey(secret: Buffer, purpose: string, length: number): Buffer {
  const derived = crypto.hkdfSync(
    'sha256',
    secret,
    Buffer.alloc(0),  // salt -- optional per RFC 5869, empty is valid
    purpose,          // 'info' -- the context string that separates keys
    length
  );
  return Buffer.from(derived);
}

// Two keys derived from the IDENTICAL shared secret -- only the
// 'info' context string differs between the two calls.
const encryptionKey = deriveKey(sharedSecret, 'encryption-key-v1', 32); // AES-256
const macKey        = deriveKey(sharedSecret, 'mac-key-v1',        32); // HMAC-SHA256

// encryptionKey and macKey are cryptographically independent -- an
// attacker who somehow recovers ONE of them gains no computational
// shortcut toward recovering the other, even though both were
// derived from the exact same sharedSecret.`,
  },
  {
    label: 'Why This Beats Deriving Both Keys the Naive Way',
    language: 'typescript',
    code: `// A tempting but WRONG shortcut: just use the shared secret directly
// for encryption, and hash it once for the MAC key.
const naiveEncryptionKey = sharedSecret;                             // the raw secret itself
const naiveMacKey        = crypto.createHash('sha256')
  .update(sharedSecret)
  .digest();                                                          // SHA-256(secret)

// This is NOT independent in the way HKDF's output is -- an
// attacker who recovers naiveMacKey can trivially test candidate
// values of sharedSecret against it (hash and compare), and
// naiveEncryptionKey IS sharedSecret verbatim, meaning recovering
// EITHER value directly recovers -- or trivially checks against --
// the other.

// HKDF's own construction (an HMAC-based extract-then-expand
// process per RFC 5869) is specifically designed so this kind of
// shortcut doesn't exist between its outputs, which is the entire
// reason to reach for a real HKDF implementation instead of ad-hoc
// hashing when one shared secret needs to become several keys.`,
  },
];

const exercise: TryItExercise = {
  prompt: 'Two services call <code>deriveKey(sharedSecret, \'encryption-key-v1\', 32)</code> with the exact same <code>sharedSecret</code> value. Do they get the same derived key? What if one of them passes <code>\'encryption-key-v2\'</code> as the purpose string instead?',
  hint: 'HKDF is a deterministic function — what are ALL of its inputs, and which one changed?',
  solution: `// Same secret + same 'info' string ('encryption-key-v1' both times)
// -> IDENTICAL derived key. HKDF is deterministic: given the same
// ikm, salt, info, and keylen, it always produces the same output --
// this determinism is exactly what lets two independent services
// derive the SAME key from a shared secret without ever transmitting
// the derived key itself.

// Same secret + DIFFERENT 'info' string ('v1' vs 'v2')
// -> COMPLETELY DIFFERENT derived key, unrelated to the 'v1' one.
// The info parameter is precisely the mechanism that makes this
// possible -- changing it while holding the secret constant is how a
// SINGLE shared secret becomes many independent-looking keys, one
// per distinct context string, without ever needing a new underlying
// secret for each one.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'HKDF and PBKDF2/Argon2 are interchangeable — pick whichever your language\'s crypto library happens to have available.',
    reality: 'They solve different problems. PBKDF2/Argon2 are deliberately SLOW to resist brute-forcing a low-entropy password. HKDF is fast and assumes the input is ALREADY high-entropy (a shared secret, not a password) — using HKDF on a raw password would provide none of the brute-force resistance a real password KDF exists to add.',
  },
  {
    thought: 'Since HKDF is deterministic, it\'s less secure than a KDF that produces different output every time.',
    reality: 'Determinism is the entire POINT for this use case — it\'s what lets two parties who both hold the same shared secret independently derive the identical key without ever transmitting it. A random/non-deterministic KDF would make that coordination impossible.',
  },
  {
    thought: 'Hashing the shared secret once for each purpose (<code>SHA256(secret + "encryption")</code>, <code>SHA256(secret + "mac")</code>) is an equally safe alternative to HKDF.',
    reality: 'Ad-hoc concatenate-and-hash constructions don\'t carry HKDF\'s formal, RFC 5869-specified independence guarantee between outputs — HKDF\'s extract-then-expand construction is specifically designed to avoid the kind of relationship the second codeTab\'s naive approach still has between its two derived values.',
  },
];

@Component({
  selector: 'app-sec-symkey-hkdf',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './deriving-multiple-keys-from-one-secret-with-hkdf.html',
  styleUrl: './deriving-multiple-keys-from-one-secret-with-hkdf.scss',
})
export class DerivingMultipleKeysFromOneSecretWithHkdfSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
