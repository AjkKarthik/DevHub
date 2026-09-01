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
    heading: 'The Quiz Explains Rainbow Tables — Never Builds One',
    points: [
      'The quiz\'s own explanation is precise: "an attacker precomputes hashes of millions of common passwords... during a database breach, they look up leaked hashes in the table to instantly recover the plain-text password." A small, working version of exactly this makes the mechanism concrete rather than abstract.',
      'The main page\'s own mistake block already shows salted vs. unsalted password hashing is unsafe with SHA-256 directly — this subtopic isolates the SPECIFIC mechanism salting defeats (precomputed lookup), separate from the SPEED problem bcrypt/Argon2id solve.',
      'A simplified, un-salted SHA-256 rainbow table is genuinely buildable and demonstrable in a few lines — a REAL rainbow table (using time-memory trade-off chains to compress storage) is more elaborate, but the core defeat-by-precomputation property is identical either way.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Building a Small Rainbow Table (Precomputed Lookup)',
    language: 'typescript',
    code: `import crypto from 'crypto';

// A tiny "common passwords" list -- real rainbow tables cover
// millions of entries, but the mechanism is identical at any scale.
const COMMON_PASSWORDS = [
  'password', '123456', 'qwerty', 'letmein', 'admin123',
  'welcome1', 'sunshine', 'iloveyou', 'monkey123', 'dragon',
];

function sha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

// The rainbow table: precomputed ONCE, reusable against ANY leaked
// database that used unsalted SHA-256 for password storage.
const rainbowTable = new Map<string, string>(); // hash -> plaintext
for (const pw of COMMON_PASSWORDS) {
  rainbowTable.set(sha256(pw), pw);
}

// ── Attacker's view: a leaked, UNSALTED hash database ─────────────────
const leakedHashes = {
  alice: sha256('sunshine'),
  bob:   sha256('correct-horse-battery-staple-xyz123'), // not in the table
};

for (const [user, hash] of Object.entries(leakedHashes)) {
  const recovered = rainbowTable.get(hash);
  console.log(\`\${user}: \${recovered ?? '(not in table -- not cracked instantly)'}\`);
}
// alice: sunshine   -- instant lookup, no computation needed at attack time
// bob: (not in table -- not cracked instantly)`,
  },
  {
    label: 'The Same Attack Against Salted Hashes -- Defeated',
    language: 'typescript',
    code: `// Now the same users' passwords are stored with a per-user random salt.
function saltedHash(password: string, salt: string): string {
  return crypto.createHash('sha256').update(salt + password).digest('hex');
}

const aliceSalt = crypto.randomBytes(16).toString('hex');
const aliceSaltedHash = saltedHash('sunshine', aliceSalt);

// The SAME rainbow table, built for UNSALTED hashes, is now useless --
// it has no entry for sha256(salt + 'sunshine') at all, because that
// exact salt value didn't exist when the table was precomputed.
console.log('Rainbow table lookup on salted hash:', rainbowTable.get(aliceSaltedHash));
// undefined -- even though 'sunshine' IS in the original table

// The attacker's only remaining option: compute sha256(aliceSalt + candidate)
// for EVERY candidate password, for THIS ONE user's salt specifically --
// no precomputation from before the breach helps at all, and cracking
// a second user (with a DIFFERENT salt) requires starting over completely.
function crackWithKnownSalt(targetHash: string, salt: string, candidates: string[]): string | null {
  for (const candidate of candidates) {
    if (saltedHash(candidate, salt) === targetHash) return candidate;
  }
  return null;
}

console.log('Cracked with per-user salt known:', crackWithKnownSalt(aliceSaltedHash, aliceSalt, COMMON_PASSWORDS));
// still finds 'sunshine' -- salting doesn't stop a TARGETED attack against
// one specific hash, only INSTANT lookups against a precomputed table`,
  },
];

const exercise: TryItExercise = {
  prompt: 'Alice and a completely different user, Carol, both happen to choose the password <code>"sunshine"</code>. Both accounts are stored with per-user random salts. Do Alice\'s and Carol\'s stored password hashes look the same to someone who has breached the database?',
  hint: 'What TWO inputs does <code>saltedHash()</code> combine before hashing — and does the SAME plaintext with a DIFFERENT salt produce the same hash?',
  solution: `// No -- Alice's and Carol's stored hashes are completely different,
// even though they chose the identical password.

// saltedHash(password, salt) hashes salt + password together -- since
// Alice's salt and Carol's salt are two INDEPENDENT random values,
// sha256(aliceSalt + 'sunshine') and sha256(carolSalt + 'sunshine')
// are unrelated outputs with no detectable connection between them.

// This is a second, separate benefit of salting beyond defeating
// precomputed tables: an attacker who breaches the database cannot
// even tell that Alice and Carol share a password, which they COULD
// tell instantly from a plain unsalted hash database (identical
// hashes = identical passwords, directly visible without cracking
// anything at all).`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Salting makes password hashing SLOWER, which is what actually defeats brute-force attacks.',
    reality: 'Salting and slow hashing (bcrypt/Argon2id) solve TWO DIFFERENT problems. Salting defeats PRECOMPUTATION (an attacker can\'t reuse a table computed before the breach); slowness defeats RAW GUESSING SPEED (however many guesses per second an attacker can try). A salted SHA-256 hash is still fast to brute-force per-user — it just can\'t be instantly looked up. Real password storage needs both properties, which is exactly why bcrypt/Argon2id combine automatic salting with deliberate slowness in one algorithm.',
  },
  {
    thought: 'Once a database is salted, an attacker who already knows a specific user\'s salt (visible in the same breached row) gains no advantage at all.',
    reality: 'Knowing the salt lets an attacker mount a TARGETED brute-force against that ONE user\'s hash — the Try It\'s <code>crackWithKnownSalt()</code> function does exactly this. Salting stops INSTANT, precomputed lookups; it doesn\'t stop a dedicated, per-user attack, which is why hashing speed matters independently.',
  },
  {
    thought: 'A rainbow table has to be rebuilt from scratch for every new database an attacker targets.',
    reality: 'That\'s precisely why unsalted hash databases are so dangerous — the SAME precomputed table (built once, offline, with no time pressure) instantly cracks EVERY unsalted database that happens to use the same hash function, no matter which specific site or company it came from.',
  },
];

@Component({
  selector: 'app-sec-hash-rainbow',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './rainbow-tables-vs-salting-demonstrated.html',
  styleUrl: './rainbow-tables-vs-salting-demonstrated.scss',
})
export class RainbowTablesVsSaltingDemonstratedSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
