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
    heading: 'From a Quiz Explanation to a Verified, Working Example',
    points: [
      'The main page\'s own quiz builds a full permissions-bitmask scenario in prose — READ = bit 0 (value 1), WRITE = bit 1 (value 2), ADMIN = bit 2 (value 4), a user with READ + ADMIN stored as the single number 5 (binary 101) — but the QuickRef never lists <code>$bitsAllSet</code>/<code>$bitsAnySet</code> at all, and no codeTab demonstrates the actual query.',
      'The operators take BIT POSITIONS (0-indexed), not the flag VALUES themselves — checking for READ access means passing position <code>0</code>, not the number <code>1</code>. This distinction matters: <code>$bitsAllSet: [0, 2]</code> checks positions 0 and 2 (READ and ADMIN), which is a different thing from checking whether the stored value equals 1 or 4.',
      'Verified directly against the exact bit-check logic the operators implement, across four representative users: a user with READ + ADMIN (5 = 101), READ + WRITE (3 = 011), READ only (1 = 001), and ADMIN only (4 = 100) — confirming <code>$bitsAllSet: [0, 2]</code> matches only the user with BOTH bits set, while <code>$bitsAnySet: [1, 2]</code> matches every user with EITHER bit set.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Bitwise Permission Queries, Verified',
    language: 'typescript',
    code: `const READ = 0;  // bit position 0 -- flag VALUE 1
const WRITE = 1;  // bit position 1 -- flag VALUE 2
const ADMIN = 2;  // bit position 2 -- flag VALUE 4

const users = db.collection('users');

// Users with BOTH READ and ADMIN set (bits 0 AND 2)
const readAndAdmin = await users.find({
  permissions: { \$bitsAllSet: [READ, ADMIN] }
}).toArray();

// Users with EITHER WRITE or ADMIN set (bits 1 OR 2)
const writeOrAdmin = await users.find({
  permissions: { \$bitsAnySet: [WRITE, ADMIN] }
}).toArray();

// Pure-JS equivalent, verified against the same seed data as a
// direct check of what the two queries above should return:
function bitsAllSet(value: number, positions: number[]): boolean {
  return positions.every(p => (value & (1 << p)) !== 0);
}
function bitsAnySet(value: number, positions: number[]): boolean {
  return positions.some(p => (value & (1 << p)) !== 0);
}

const seedUsers = [
  { name: 'Alice', permissions: 5 }, // READ + ADMIN (101)
  { name: 'Bob',   permissions: 3 }, // READ + WRITE (011)
  { name: 'Cy',    permissions: 1 }, // READ only     (001)
  { name: 'Dee',   permissions: 4 }, // ADMIN only    (100)
];

console.log(seedUsers.filter(u => bitsAllSet(u.permissions, [READ, ADMIN])).map(u => u.name));
// -> ['Alice']  (only Alice has BOTH bits)

console.log(seedUsers.filter(u => bitsAnySet(u.permissions, [WRITE, ADMIN])).map(u => u.name));
// -> ['Alice', 'Bob', 'Dee']  (Cy is excluded -- READ-only has neither bit)`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A new role, MODERATE, is added at bit position 3 (flag value 8). A user has <code>permissions: 9</code> (READ + MODERATE, binary 1001). Does <code>{ permissions: { $bitsAllSet: [0, 3] } }</code> match this user?',
  hint: 'Decompose 9 into its individual bits first -- which positions are actually set for the value 9?',
  solution: `// Yes, it matches. 9 in binary is 1001 -- bit 0 (value 1, READ) is
// set, and bit 3 (value 8, MODERATE) is set. $bitsAllSet: [0, 3]
// checks exactly those two positions, and both are 1, so the
// condition is satisfied.
//
// Verified directly: bitsAllSet(9, [0, 3]) evaluates
// (9 & (1<<0)) !== 0 -- true -- AND (9 & (1<<3)) !== 0 -- true --
// -> true overall. The READ+WRITE+ADMIN example from the main page's
// own quiz generalizes cleanly to any new bit position added later,
// since each bit is checked completely independently of the others.`,
};

const misconceptions: Misconception[] = [
  {
    thought: '$bitsAllSet: [1, 4] checks whether the permissions value equals 1 or 4 (a value-based check, like $in).',
    reality: 'The array passed to $bitsAllSet/$bitsAnySet is a list of BIT POSITIONS, not flag values or a set of acceptable numbers. Passing [1, 4] checks bit position 1 (value 2, WRITE in the main page\'s own scheme) AND bit position 4 (value 16, a flag not even defined in the example) — a completely different check from "permissions equals 1 or 4," which $bitsAllSet has no way to express at all (that would be a plain $in query instead).',
  },
  {
    thought: 'A bitmask field storing multiple boolean flags in one number is unusual, MongoDB-specific design — most applications would just use separate boolean fields.',
    reality: 'Bitmasking is a general technique older than MongoDB itself, common in any system needing compact storage of many independent flags (Unix file permissions are the classic example). MongoDB\'s bitwise operators exist specifically because bitmask fields are common enough in real schemas — migrated from other systems, or chosen deliberately for storage efficiency — to need first-class, indexable query support rather than forcing every flag into its own separate field.',
  },
];

@Component({
  selector: 'app-mongo-query-bitwise',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './querying-permission-bitmasks-with-bitsallset.html',
  styleUrl: './querying-permission-bitmasks-with-bitsallset.scss',
})
export class QueryingPermissionBitmasksWithBitsallsetSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
