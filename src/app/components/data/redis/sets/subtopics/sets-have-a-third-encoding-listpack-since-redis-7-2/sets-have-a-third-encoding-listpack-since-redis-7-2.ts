import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-sets-have-a-third-encoding-listpack-since-redis-7-2',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './sets-have-a-third-encoding-listpack-since-redis-7-2.html',
  styleUrl: './sets-have-a-third-encoding-listpack-since-redis-7-2.scss',
})
export class SetsHaveAThirdEncodingListpackSinceRedis72Subtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'What the main page originally got wrong',
      points: [
        'The main page\'s own theory, quiz, and QnA all described sets as having exactly TWO encodings: intset for small integer sets, and hashtable for "larger sets or string members" — implying any set of non-integer members immediately becomes a hashtable.',
        'Verified directly against Redis\'s own current config.c source: there is a real THIRD tier, <code>set-max-listpack-entries</code> (default 128) and <code>set-max-listpack-value</code> (default 64 bytes), confirming a listpack encoding for sets — added in Redis 7.2, corroborated by multiple independent sources describing the same three-tier model (intset, listpack, hashtable).',
        'So a small set of non-integer members (say, 100 short tag strings) does NOT jump straight to hashtable on current Redis — it uses the more compact listpack first, exactly the same way a small hash or a small list does before either of THEM converts to their own larger structure.',
      ],
    },
    {
      heading: 'The exact decision Redis makes',
      points: [
        'First check: are ALL members integers, and is the count ≤ set-max-intset-entries (512)? If yes → intset.',
        'Otherwise: is the count ≤ set-max-listpack-entries (128) AND every individual value ≤ set-max-listpack-value bytes (64)? If yes → listpack.',
        'Otherwise → hashtable. Only once a set exceeds BOTH the relevant size threshold AND, for non-integer sets, the per-value size cap does it become the (larger, but O(1)-lookup) hashtable representation.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The real three-tier decision',
      language: 'typescript',
      code: `// Reproduces Redis's own three-tier set encoding decision, verified
// directly against config.c's own registered defaults:
// set-max-intset-entries=512, set-max-listpack-entries=128,
// set-max-listpack-value=64.
function allIntegers(members: string[]): boolean {
  return members.every(m => Number.isInteger(Number(m)) && String(Number(m)) === m);
}

function setEncoding(
  members: string[],
  config = { maxIntsetEntries: 512, maxListpackEntries: 128, maxListpackValue: 64 },
): 'intset' | 'listpack' | 'hashtable' {
  if (allIntegers(members) && members.length <= config.maxIntsetEntries) {
    return 'intset';
  }
  const fitsListpack =
    members.length <= config.maxListpackEntries &&
    members.every(m => Buffer.byteLength(m, 'utf8') <= config.maxListpackValue);
  if (fitsListpack) return 'listpack';
  return 'hashtable';
}

console.log('100 integers:', setEncoding(Array.from({ length: 100 }, (_, i) => String(i))));
console.log('100 short tag strings:', setEncoding(Array.from({ length: 100 }, (_, i) => 'tag' + i)));
console.log('200 short tag strings (over listpack entry cap):', setEncoding(Array.from({ length: 200 }, (_, i) => 'tag' + i)));
console.log('a set with one very long value:', setEncoding(['a', 'b', 'x'.repeat(100)]));
// 100 integers: intset
// 100 short tag strings: listpack     <-- the encoding the old theory text never mentioned
// 200 short tag strings (over listpack entry cap): hashtable
// a set with one very long value: hashtable`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A set holds exactly 100 numeric-LOOKING strings, like <code>"007"</code> and <code>"042"</code> (with leading zeros), instead of plain integers. Given the verified <code>allIntegers()</code> check above, would this set use intset, listpack, or hashtable?',
    hint: 'Look closely at what <code>allIntegers()</code> actually checks — does <code>String(Number("007"))</code> come back equal to the original string <code>"007"</code>?',
    solution: `Listpack, not intset. "007" converts via Number("007") to 7, and String(7) is "7" -- which does NOT equal the original string "007". The allIntegers() check specifically requires the value to round-trip back to an IDENTICAL string representation, and a leading zero breaks that round trip.

This isn't just a quirk of this demo's own check -- it mirrors a genuine Redis behavior: intset stores true integer values, and a member like "007" would have to be represented with its leading zero preserved as a STRING to stay faithful to what SADD actually stored, which intset's pure-integer array cannot do. So Redis itself falls back to listpack (or hashtable, if the set is larger) for exactly this reason, not just as an artifact of this particular JavaScript reproduction.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"Any Redis set containing at least one non-integer string member is always stored as a full hashtable."',
      reality: 'True before Redis 7.2, but no longer current — verified directly against config.c: a small set of non-integer members (within set-max-listpack-entries and set-max-listpack-value) now uses the more compact listpack encoding first, the same intermediate tier hashes and lists already had.',
    },
    {
      thought: '"set-max-listpack-entries and set-max-listpack-value work exactly like list-max-listpack-size — a byte-size-based threshold, not a plain entry count."',
      reality: 'Sets follow the SAME model as hashes here, not lists: set-max-listpack-entries is a plain entry count (default 128), and set-max-listpack-value is a per-value byte-size cap (default 64) — two separate, independent numeric limits, neither of which is the single byte-size-per-node cap lists use.',
    },
  ];

  topicLabel = 'Sets';
  topicRoute = '/redis/sets';
  prev: SubtopicLink | null = null;
  next: SubtopicLink | null = {
    label: 'SMOVE: Atomic State Transitions Between Sets',
    route: '/redis/sets/smove-atomic-state-transitions-between-sets',
  };
}
