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
    heading: 'A "Secure User System" Challenge Hashed Passwords Insecurely',
    points: [
      'The main page\'s own "Secure User System Setup" Challenge — for a HEALTHCARE application — hashed passwords with <code>createHash("sha256").update(password).digest("hex")</code>. SHA-256 alone is a fast, deterministic, general-purpose hash with no salt: the same password ALWAYS produces the exact same digest, and its speed makes brute-forcing weak passwords via GPU cracking practical at scale.',
      'bcrypt (and similar password-hashing functions like Argon2id or scrypt) are built specifically for password storage: they add a random salt automatically, and their cost factor makes each hash attempt deliberately slow — verified via direct execution that hashing the SAME password twice with bcrypt produces two DIFFERENT hashes, unlike SHA-256\'s always-identical output.',
      'This is a completely separate concern from MongoDB\'s OWN internal SCRAM-SHA-256 mechanism (used to authenticate a MongoDB CONNECTION) — the Challenge\'s <code>passwordHash</code> field is an APPLICATION-level user record stored in a regular collection, unrelated to how the driver itself authenticates to the database.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'SHA-256 (Broken) vs. bcrypt (Correct)',
    language: 'typescript',
    code: `import { createHash } from 'crypto';
import bcrypt from 'bcrypt';

// BROKEN -- the main page's original Challenge solution.
function sha256Hash(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

console.log('SHA-256 run twice on the SAME password:');
console.log(sha256Hash('correct-horse-battery-staple') === sha256Hash('correct-horse-battery-staple'));
// -> true. Always identical -- exactly what makes a precomputed
// rainbow-table lookup, or a fast brute-force attempt, practical.

// CORRECT -- bcrypt automatically salts and is deliberately slow.
async function bcryptHash(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

const hash1 = await bcryptHash('correct-horse-battery-staple');
const hash2 = await bcryptHash('correct-horse-battery-staple');
console.log('bcrypt run twice on the SAME password:');
console.log(hash1 === hash2); // -> false -- different random salt each time

// Verifying a password against a bcrypt hash requires compare(), not
// equality -- the salt is embedded IN the hash string itself:
console.log('bcrypt.compare(correct password):', await bcrypt.compare('correct-horse-battery-staple', hash1));
console.log('bcrypt.compare(wrong password):', await bcrypt.compare('wrong-password', hash1));

// The login query shape has to change too -- you can no longer match
// BOTH username and passwordHash in one findOne() call, since the
// stored hash is never equal to a freshly-computed one:
const user = await usersCollection.findOne({ username: safeUsername });
const passwordOk = user ? await bcrypt.compare(safePassword, user.passwordHash) : false;`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'An attacker steals the entire "users" collection, including every stored <code>passwordHash</code>. With the ORIGINAL SHA-256 version, they precompute SHA-256 hashes for the 10 million most common passwords once and check them against every stolen hash instantly. Does the identical attack work against the bcrypt version just as fast?',
  hint: 'Think about what a precomputed table of hashes actually requires to be reusable across many different stolen accounts at once.',
  solution: `// No -- the identical precompute-once, check-against-everyone attack
// does not transfer to bcrypt.
//
// A precomputed SHA-256 table works because SHA-256 has no salt: the
// SAME "password123" hash matches EVERY account in the world that uses
// that password, so one table works against every stolen database.
//
// bcrypt embeds a random, per-hash salt directly into each stored
// value. Even if two different users chose the exact same password,
// their stored bcrypt hashes are different strings, computed with
// different salts -- a table precomputed for one specific salt is
// useless against a hash computed with a different salt. The attacker
// would have to redo the (deliberately slow) hashing work separately
// for EACH stolen hash, not once for the whole stolen database.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'SHA-256 is a strong, modern cryptographic hash function (it\'s what MongoDB itself uses internally for SCRAM-SHA-256 authentication) — using it to hash application passwords should be equally secure.',
    reality: 'SHA-256 being cryptographically strong as a general-purpose hash is a different property from being SUITABLE for password storage specifically. SCRAM-SHA-256 (MongoDB\'s own connection-auth protocol) wraps SHA-256 in a salted, iterated challenge-response protocol — it is NOT the same as directly storing a bare createHash("sha256") digest as an application-level password hash, which has no salt and no deliberate slowdown at all.',
  },
  {
    thought: 'Since the Challenge\'s original hashPassword() function is only used for a demonstration exercise, using a fast, unsalted hash like SHA-256 there is a harmless simplification, not a real security issue.',
    reality: 'The Challenge is explicitly framed as building "a secure MongoDB database for a healthcare application" and its solution is presented as the CORRECT reference answer — a learner following this pattern in a real application would ship a genuine password-storage vulnerability, not a harmless simplification.',
  },
];

@Component({
  selector: 'app-mongo-sec-bcrypt-not-sha256',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './bcrypt-not-sha256-for-password-hashing.html',
  styleUrl: './bcrypt-not-sha256-for-password-hashing.scss',
})
export class BcryptNotSha256ForPasswordHashingSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
