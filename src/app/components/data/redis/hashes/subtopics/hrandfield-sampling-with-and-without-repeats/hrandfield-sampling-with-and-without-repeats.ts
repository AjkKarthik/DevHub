import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-hrandfield-sampling-with-and-without-repeats',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './hrandfield-sampling-with-and-without-repeats.html',
  styleUrl: './hrandfield-sampling-with-and-without-repeats.scss',
})
export class HrandfieldSamplingWithAndWithoutRepeatsSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'What the main page names but never shows',
      points: [
        'The main page\'s own theory names <code>HRANDFIELD</code> (introduced in Redis 6.2) and says it "returns one or more random fields from a hash, optionally with their values" — verified accurate against the command\'s own docs — but no codeTab on the page ever calls it.',
        'The <code>count</code> argument changes behaviour in a way worth knowing precisely: a POSITIVE count returns that many DISTINCT fields (capped at the hash\'s own field count if count is larger), while a NEGATIVE count returns EXACTLY <code>abs(count)</code> fields and is explicitly allowed to repeat the same field more than once.',
        'The optional <code>WITHVALUES</code> modifier (only usable together with a count) returns each sampled field alongside its value, avoiding a separate <code>HMGET</code> round trip to look up what was actually picked.',
      ],
    },
    {
      heading: 'When each mode is the right one to reach for',
      points: [
        'Positive count fits "pick N distinct winners from a pool" — a giveaway drawing 3 unique winners from a hash of contest entries, where the SAME entry winning twice would be a bug.',
        'Negative count fits weighted or repeated sampling — e.g. simulating dice rolls where a field named after each face should be equally likely to come up more than once in a short sequence, or spot-checking a random subset of cache keys where re-sampling the same key twice is harmless.',
        'Neither mode gives a caller control over the ORDER of returned fields being meaningfully random on its own for the positive-count case — Redis\'s own docs note the reply order is "not truly random," so a caller needing genuinely shuffled output should shuffle client-side.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Positive count: distinct winners',
      language: 'typescript',
      code: `// Reproduces HRANDFIELD's documented positive-count behaviour:
// distinct fields only, capped at the hash's own field count.
class FakeRedisHash {
  constructor(private fields: Map<string, string>) {}

  hrandfield(count: number, withValues = false): string[] | [string, string][] {
    const keys = [...this.fields.keys()];
    const n = Math.min(count, keys.length); // capped, never more than the hash has
    const shuffled = [...keys].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, n);
    return withValues ? picked.map(k => [k, this.fields.get(k)!] as [string, string]) : picked;
  }
}

const contest = new FakeRedisHash(new Map([
  ['alice', 'entry-1'],
  ['bob', 'entry-2'],
  ['carol', 'entry-3'],
  ['dave', 'entry-4'],
]));

// Pick exactly 2 distinct winners from 4 entries.
const winners = contest.hrandfield(2);
console.log('2 distinct winners from 4 entries:', winners.length, 'unique?', new Set(winners).size === winners.length);

// Ask for MORE winners than there are entries -- capped, no repeats, no error.
const overAsk = contest.hrandfield(10);
console.log('asking for 10 winners from 4 entries:', overAsk.length, '(capped at hash size)');
// 2 distinct winners from 4 entries: 2 unique? true
// asking for 10 winners from 4 entries: 4 (capped at hash size)`,
    },
    {
      label: 'Negative count: repeats allowed',
      language: 'typescript',
      code: `// Reproduces HRANDFIELD's documented negative-count behaviour:
// exactly |count| fields, sampling WITH replacement (repeats allowed).
class FakeRedisHash {
  constructor(private fields: Map<string, string>) {}

  hrandfield(count: number): string[] {
    const keys = [...this.fields.keys()];
    if (count >= 0) {
      const n = Math.min(count, keys.length);
      return [...keys].sort(() => Math.random() - 0.5).slice(0, n);
    }
    const n = Math.abs(count);
    return Array.from({ length: n }, () => keys[Math.floor(Math.random() * keys.length)]);
  }
}

const die = new FakeRedisHash(new Map([
  ['1', 'one'], ['2', 'two'], ['3', 'three'],
  ['4', 'four'], ['5', 'five'], ['6', 'six'],
]));

// Roll the die 8 times -- MORE rolls than there are faces, and repeats
// are exactly what a real die roll needs.
const rolls = die.hrandfield(-8);
console.log('8 rolls of a 6-sided die:', rolls);
console.log('exactly 8 results even though the hash only has 6 fields:', rolls.length === 8);
// 8 rolls of a 6-sided die: [ '3', '1', '6', '3', '2', '5', '1', '4' ]  (example -- genuinely random)
// exactly 8 results even though the hash only has 6 fields: true`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A feature-flag rollout needs to enable a new feature for EXACTLY 10% of a hash of 500 registered beta users, with no user ever selected twice. Which HRANDFIELD count mode (positive or negative), and roughly what count value, fits this requirement?',
    hint: 'Re-read the theory point on which mode guarantees distinct fields, and compute what 10% of 500 actually is.',
    solution: `Positive count, with count = 50 (10% of 500). A positive count returns DISTINCT fields only -- exactly the "no user selected twice" requirement -- and since 50 is well under the hash's own 500 fields, HRANDFIELD returns exactly 50 unique users, not a capped-down smaller set.

Negative count would be the wrong choice here specifically because it explicitly allows the same field to be returned more than once -- a negative count of -50 could genuinely select the same beta user twice (and a different, smaller number of TRULY distinct users overall), directly violating the "no user selected twice" requirement even though it would still return exactly 50 raw results.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"A negative count just means \'give me fewer than the hash actually has\' — the sign controls how many, same as a positive count, just interpreted differently."',
      reality: 'The sign changes the SAMPLING METHOD, not merely how the number is interpreted: positive means "without replacement" (distinct fields, capped at hash size), negative means "with replacement" (repeats allowed, always exactly abs(count) results regardless of hash size). A negative count can return MORE results than the hash has fields, which a positive count can never do.',
    },
    {
      thought: '"HRANDFIELD returns fields in genuinely shuffled order, so the first N results of a large positive count are a fair random ordering, not just a fair random SELECTION."',
      reality: 'Redis\'s own docs explicitly note the reply order for a positive count "is not truly random" and that a caller needing shuffled order should shuffle client-side. The SELECTION is fair (each field has an equal chance of being among the ones returned), but nothing guarantees the returned array\'s own ORDER is unbiased.',
    },
  ];

  topicLabel = 'Hashes';
  topicRoute = '/redis/hashes';
  prev: SubtopicLink | null = {
    label: 'The Shopping Cart Challenge Leaves Phantom Zero-Quantity Items',
    route: '/redis/hashes/shopping-cart-phantom-zero-quantity-items',
  };
  next: SubtopicLink | null = null;
}
