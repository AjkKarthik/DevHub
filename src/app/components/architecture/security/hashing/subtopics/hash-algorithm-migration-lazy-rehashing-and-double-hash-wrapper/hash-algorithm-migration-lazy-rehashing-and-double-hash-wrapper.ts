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
    heading: 'The QnA Names Two Real Migration Strategies — Neither Ever Gets Built',
    points: [
      'The main page\'s own QnA describes lazy migration precisely: "when a user logs in... verify against the old hash. If valid: re-hash with the new algorithm. Update the stored hash." — every step named, none of it shown as working code.',
      'It also names the double-hashing pattern (<code>bcrypt(base64(md5(password)))</code>) as "immediately deployable without waiting for logins" — a real technique with a real trade-off, also never demonstrated.',
      'The two strategies solve the SAME underlying problem differently: lazy migration only migrates users who actually log in again; double-hashing migrates every stored hash immediately, without needing anyone to authenticate first.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Lazy Migration on Login',
    language: 'typescript',
    code: `import bcrypt from 'bcrypt';
import crypto from 'crypto';

interface UserRow {
  id: string;
  passwordHash: string;
  hashAlgorithm: 'md5' | 'bcrypt'; // tracks which algorithm produced passwordHash
}

async function verifyAndMigrate(user: UserRow, plainPassword: string): Promise<boolean> {
  if (user.hashAlgorithm === 'bcrypt') {
    // Already migrated -- normal bcrypt verification, nothing else to do.
    return bcrypt.compare(plainPassword, user.passwordHash);
  }

  // Still on the OLD algorithm (MD5, in this example).
  const oldHash = crypto.createHash('md5').update(plainPassword).digest('hex');
  const isValid = oldHash === user.passwordHash; // MD5 has no timing-attack surface worth preserving here -- it's being retired regardless

  if (isValid) {
    // Correct password confirmed -- this is the ONE moment the
    // plaintext password is available, so migrate right now.
    const newHash = await bcrypt.hash(plainPassword, 12);
    await db.query(
      'UPDATE users SET password_hash = $1, hash_algorithm = $2 WHERE id = $3',
      [newHash, 'bcrypt', user.id]
    );
  }

  return isValid;
}

// A user who logs in successfully is transparently upgraded to
// bcrypt -- no password reset required, no visible change for them
// at all. A user who never logs in again stays on MD5 indefinitely.`,
  },
  {
    label: 'Double-Hash Wrapper — Migrating Every Row Immediately',
    language: 'typescript',
    code: `import bcrypt from 'bcrypt';
import crypto from 'crypto';

// A ONE-TIME migration script -- runs against every existing row,
// no login required from anyone.
async function migrateAllRowsToDoubleHash() {
  const rows = await db.query('SELECT id, password_hash FROM users WHERE hash_algorithm = $1', ['md5']);

  for (const row of rows.rows) {
    // Wrap the EXISTING md5 hash in a fresh bcrypt hash -- this does
    // NOT require knowing the plaintext password at all, which is
    // exactly why it's "immediately deployable" per the main page's
    // own QnA -- unlike lazy migration, it needs no one to log in.
    const wrapped = await bcrypt.hash(row.password_hash, 12);
    await db.query(
      'UPDATE users SET password_hash = $1, hash_algorithm = $2 WHERE id = $3',
      [wrapped, 'md5-then-bcrypt', row.id]
    );
  }
}

// Login now needs to know the WRAPPING happened -- verification
// recomputes the SAME two-step chain, then delegates to bcrypt.compare:
async function verifyDoubleHash(storedHash: string, plainPassword: string): Promise<boolean> {
  const oldStyleHash = crypto.createHash('md5').update(plainPassword).digest('hex');
  return bcrypt.compare(oldStyleHash, storedHash);
}

// The trade-off the main page's own QnA names directly: this migrates
// every row instantly, but the ORIGINAL md5(password) value is still
// exactly what bcrypt is protecting -- if MD5's own weaknesses are
// ever exploitable independent of a full preimage attack, that risk
// persists inside the wrapper. It buys time, not a clean break from
// the old algorithm's own properties.`,
  },
];

const exercise: TryItExercise = {
  prompt: 'A team runs the double-hash migration script, then a WEEK LATER also deploys the lazy-migration login code from the first codeTab — but the lazy-migration code checks <code>user.hashAlgorithm === \'bcrypt\'</code> to decide whether a row is already migrated. Does a row the double-hash script already touched get handled correctly?',
  hint: 'What value does the double-hash migration script actually set <code>hash_algorithm</code> to, versus what the lazy-migration code is checking for?',
  solution: `// No -- this is a real bug, not a hypothetical one.

// The double-hash script sets hash_algorithm to 'md5-then-bcrypt',
// but the lazy-migration code's own check only recognizes 'bcrypt'
// as "already migrated." A row with 'md5-then-bcrypt' falls through
// to the ELSE branch, which tries crypto.createHash('md5').update
// (plainPassword)... and compares it against a value that is no
// longer a plain MD5 hash at all -- it's now a bcrypt-wrapped one.
// Every login for these rows would incorrectly fail.

// The fix isn't a workaround -- it's that any code path deciding "is
// this row migrated?" needs to recognize EVERY algorithm value a
// migration strategy might have written, including ones written by a
// DIFFERENT migration strategy deployed at a different time. Running
// two independent migration approaches against the same column
// without reconciling their own state values is exactly the kind of
// gap that slips through when each strategy is designed (and tested)
// in isolation.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Lazy migration and the double-hash wrapper are two competing approaches — a team should pick exactly one.',
    reality: 'They solve different constraints and can be COMBINED: double-hashing migrates everyone immediately (no login required), while a separate, later step can fully re-hash the plaintext password (dropping the old algorithm from the chain entirely) the next time each user actually logs in — closing the "the old hash\'s own properties still matter" gap the double-hash wrapper alone leaves open.',
  },
  {
    thought: 'Lazy migration eventually migrates every user, given enough time.',
    reality: 'It only migrates users who actually log in again. An account that\'s abandoned, or belongs to a user who never returns, stays on the old algorithm indefinitely — which is exactly why the main page\'s own QnA mentions a "mandatory password reset after a deadline" as the real mechanism for closing that gap, not lazy migration by itself.',
  },
  {
    thought: 'The double-hash wrapper is strictly worse than lazy migration since it doesn\'t fully replace the old algorithm.',
    reality: 'It solves a problem lazy migration cannot: rows belonging to users who may never log in again. It\'s a genuinely different trade-off (immediate but incomplete migration vs. complete but login-gated migration), not a strictly worse version of the same idea.',
  },
];

@Component({
  selector: 'app-sec-hash-migration',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './hash-algorithm-migration-lazy-rehashing-and-double-hash-wrapper.html',
  styleUrl: './hash-algorithm-migration-lazy-rehashing-and-double-hash-wrapper.scss',
})
export class HashAlgorithmMigrationLazyRehashingAndDoubleHashWrapperSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
