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
    heading: 'The Quiz Names the Race, Not a Timeline',
    points: [
      'The quiz explains TOCTOU precisely: "the application checks a condition... and between the check and the use, an attacker changes the state... check if /tmp/file exists and is safe -> attacker replaces /tmp/file with a symlink to /etc/passwd -> application reads the attacker-chosen file." It also names the fix — atomic operations (the <code>O_EXCL</code> flag), advisory locks (<code>flock</code>), and database transactions for concurrent data.',
      'What the quiz\'s prose never shows is the actual GAP — the literal window in time between the check finishing and the use starting, and exactly what has to happen inside that window for the attack to succeed. This subtopic builds that timeline explicitly, plus the async code shape that creates the gap in the first place.',
    ],
  },
  {
    heading: 'Why Any await Between Check and Use Is a TOCTOU Gap',
    points: [
      'In synchronous, single-threaded code, a check immediately followed by a use has effectively no gap — nothing else can run in between. The moment an <code>await</code> sits between the check and the use, the event loop is free to run OTHER code (including, in principle, another request handling an attacker-controlled action) before the <code>await</code> resolves and the "use" step continues — and that gap is exactly where a TOCTOU race lives.',
      'This means the vulnerability isn\'t really about file systems or symlinks specifically — it is about ANY check-then-act sequence with an async boundary in between, whether that\'s a file existence check, a "does this coupon still have uses left" database read followed by a separate write, or an authorization check followed by a separate resource fetch.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Vulnerable — Check, Then (Later) Act',
    language: 'typescript',
    code: `import fs from 'node:fs/promises';

const SAFE_DIR = '/var/app/uploads';

async function readIfSafe(filePath: string): Promise<Buffer> {
  // ── CHECK ──────────────────────────────────────────────────────
  const stats = await fs.lstat(filePath);
  if (stats.isSymbolicLink()) {
    throw new Error('Symlinks are not allowed');
  }
  // <-- THE GAP: nothing stops another process (or another request
  //     in this same Node process, via the event loop) from replacing
  //     "filePath" with a symlink RIGHT HERE, after the check passed
  //     but before the read below has started.

  // ── USE ────────────────────────────────────────────────────────
  return fs.readFile(filePath);   // may now read through a symlink
}

// Timeline of the actual attack:
// t=0ms   readIfSafe() calls fs.lstat(filePath) -- filePath is a
//         normal, safe file -- isSymbolicLink() returns false, check passes
// t=0-5ms  (the await on lstat() yields control back to the event
//          loop while the filesystem call is in flight)
// t=2ms   Attacker (with write access to that directory -- e.g. a
//         shared /tmp, or a race against their OWN concurrent upload
//         request) deletes filePath and replaces it with a symlink
//         pointing at /etc/passwd
// t=5ms   fs.readFile(filePath) resolves -- filePath is now a symlink,
//         and the function happily returns the CONTENTS of /etc/passwd,
//         even though the check at t=0ms genuinely passed`,
  },
  {
    label: 'Fixed — Atomic Open, No Separate Check',
    language: 'typescript',
    code: `import fs from 'node:fs/promises';
import { constants } from 'node:fs';

async function readIfSafe(filePath: string): Promise<Buffer> {
  // No separate "check" step at all -- open the file with a flag
  // that makes the KERNEL refuse to follow a symlink at open-time,
  // as a single atomic operation. There is no gap for an attacker
  // to exploit, because there are no longer two separate steps.
  const handle = await fs.open(
    filePath,
    constants.O_RDONLY | constants.O_NOFOLLOW,   // O_NOFOLLOW: fail if filePath is a symlink
  );
  try {
    return await handle.readFile();
  } finally {
    await handle.close();
  }
}

// If filePath is (or becomes, at ANY point up to and including the
// instant the kernel actually opens it) a symlink, fs.open() itself
// throws ELOOP -- there is no window between "checked safe" and
// "used" for an attacker to exploit, because checking and using are
// now the SAME atomic kernel call instead of two separate steps.`,
  },
];

const exercise: TryItExercise = {
  prompt: 'The QnA on a nearby page describes a coupon system: "check remaining uses, then decrement" as two separate database operations (a <code>SELECT</code> read followed by a separate <code>UPDATE</code> write). Does this have a TOCTOU gap, and if so, what would the fix look like — using the SAME "make check-and-use one atomic operation" principle as the file-open fix above?',
  hint: 'What happens if two requests both run the SELECT at nearly the same time, both see "1 use remaining," and both then run their own UPDATE?',
  solution: `// Yes -- this is exactly the same class of bug, just with a database
// instead of a filesystem, and the fix follows the identical
// principle: fold the check and the use into ONE atomic operation
// instead of two separate steps with a gap between them.

// The vulnerable version:
//   const coupon = await db.query('SELECT uses_remaining FROM coupons WHERE code = ?', [code]);
//   if (coupon.uses_remaining <= 0) throw new Error('Coupon exhausted');
//   await db.query('UPDATE coupons SET uses_remaining = uses_remaining - 1 WHERE code = ?', [code]);
//   -- two requests can both pass the SELECT check (both see "1
//   remaining") before either one's UPDATE runs, and both then
//   successfully decrement -- the coupon gets used twice even though
//   only one use was ever available.

// The atomic fix: combine the check and the decrement into a SINGLE
// SQL statement, with the check as part of the WHERE clause itself --
//   const result = await db.query(
//     'UPDATE coupons SET uses_remaining = uses_remaining - 1 '
//     + 'WHERE code = ? AND uses_remaining > 0',
//     [code],
//   );
//   if (result.affectedRows === 0) throw new Error('Coupon exhausted');
//   -- the database engine itself guarantees this single statement is
//   atomic: either the row still had uses_remaining > 0 at the exact
//   moment the UPDATE ran and gets decremented, or it didn't and
//   nothing changes -- there is no separate earlier "read" step for a
//   second concurrent request to race against.

// This is the same principle as the fixed file-open codeTab: a TOCTOU
// fix is not "add more validation" -- it is "eliminate the gap between
// checking and using by making them the same operation."`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'TOCTOU is specifically a filesystem/symlink vulnerability — it doesn\'t apply to typical web application code like database operations.',
    reality: 'The Try It above shows the exact same race in a database context — any "read a value, then act on it in a SEPARATE step" pattern has a TOCTOU gap, regardless of what kind of resource is involved. The quiz\'s own filesystem example is just the most classically-cited illustration of a much more general pattern: separating a check from its corresponding action always creates a window, whether that window is measured in filesystem-call microseconds or in the milliseconds between two separate database queries.',
  },
  {
    thought: 'Adding a lock or a re-check right before the "use" step is a reliable general fix for a TOCTOU gap.',
    reality: 'It can help, but it only closes the gap if EVERY code path that could modify the resource also respects the same lock — a lock only prevents a race against code that cooperates with it. The atomic-operation fixes shown above (a single kernel <code>open()</code> call with <code>O_NOFOLLOW</code>; a single SQL <code>UPDATE ... WHERE uses_remaining > 0</code>) are stronger because they don\'t depend on every caller remembering to acquire a lock correctly — the guarantee comes from there being only ONE operation for anything to race against in the first place.',
  },
];

@Component({
  selector: 'app-sec-sc-toctou',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './a-toctou-race-condition-timeline.html',
  styleUrl: './a-toctou-race-condition-timeline.scss',
})
export class AToctouRaceConditionTimelineSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
