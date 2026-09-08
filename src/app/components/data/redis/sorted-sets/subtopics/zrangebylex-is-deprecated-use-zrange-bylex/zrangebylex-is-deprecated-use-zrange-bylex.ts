import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-zrangebylex-is-deprecated-use-zrange-bylex',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './zrangebylex-is-deprecated-use-zrange-bylex.html',
  styleUrl: './zrangebylex-is-deprecated-use-zrange-bylex.scss',
})
export class ZrangebylexIsDeprecatedUseZrangeBylexSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'What the main page originally missed',
      points: [
        'The main page\'s own QnA presented <code>ZRANGEBYLEX key [min [max</code> as a current, recommended command with zero mention of its status. Verified directly against the command\'s own official docs: ZRANGEBYLEX has been DEPRECATED since Redis 6.2.0.',
        'The modern replacement is the unified <code>ZRANGE key min max BYLEX</code> — the exact same command family that already replaced ZRANGEBYSCORE with <code>ZRANGE ... BYSCORE</code>, which the main page\'s OWN quiz explanation already correctly notes elsewhere on the same page ("In Redis 6.2+, use ZRANGE with BYSCORE").',
        'The unification is consistent: ZRANGE now covers plain rank-based ranges, BYSCORE ranges, and BYLEX ranges, all through one command, optionally combined with REV for descending order — the same pattern this hub\'s own Lists topic already documents for ZRANGEBYSCORE.',
      ],
    },
    {
      heading: 'A precondition worth restating precisely',
      points: [
        'Both the old and new forms share the same hard requirement, verified directly against Redis\'s own docs: lexicographic ordering is only well-defined "when all the elements in a sorted set are inserted with the same score." If members have different scores, the returned elements from either command are documented as unspecified.',
        'In practice this means a sorted set built purely for lexicographic range queries (autocomplete, alphabetical pagination) typically uses a CONSTANT score (often 0) for every member — the score field is not doing any ranking work at all in that use case, only the member strings themselves are compared.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'ZRANGE ... BYLEX, verified',
      language: 'typescript',
      code: `// Reproduces Redis's own documented ZRANGEBYLEX example exactly,
// using the modern ZRANGE ... BYLEX syntax.
function zrangeByLex(members: string[], min: string, max: string): string[] {
  const parseBound = (b: string) => {
    if (b === '-') return { negInf: true };
    if (b === '+') return { posInf: true };
    return { value: b.slice(1), inclusive: b[0] === '[' };
  };
  const minB = parseBound(min) as { negInf?: boolean; value?: string; inclusive?: boolean };
  const maxB = parseBound(max) as { posInf?: boolean; value?: string; inclusive?: boolean };

  return members
    .filter(m => {
      if (!minB.negInf) {
        if (minB.inclusive ? m < minB.value! : m <= minB.value!) return false;
      }
      if (!maxB.posInf) {
        if (maxB.inclusive ? m > maxB.value! : m >= maxB.value!) return false;
      }
      return true;
    })
    .sort();
}

// ZADD myzset 0 a 0 b 0 c 0 d 0 e 0 f 0 g -- all same score, required for
// lexicographic ordering to be well-defined at all.
const myzset = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];

console.log('ZRANGE myzset - [c BYLEX:', zrangeByLex(myzset, '-', '[c'));
console.log('ZRANGE myzset - (c BYLEX:', zrangeByLex(myzset, '-', '(c'));
console.log('ZRANGE myzset [aaa (g BYLEX:', zrangeByLex(myzset, '[aaa', '(g'));
// ZRANGE myzset - [c BYLEX: [ 'a', 'b', 'c' ]
// ZRANGE myzset - (c BYLEX: [ 'a', 'b' ]
// ZRANGE myzset [aaa (g BYLEX: [ 'b', 'c', 'd', 'e', 'f' ]`,
    },
    {
      label: 'Autocomplete with a constant score',
      language: 'typescript',
      code: `// A real autocomplete index: every member shares score 0, and the
// member STRING itself is the only thing being range-queried.
class FakeRedisZSet {
  private zsets = new Map<string, Map<string, number>>();

  zadd(key: string, score: number, member: string): void {
    if (!this.zsets.has(key)) this.zsets.set(key, new Map());
    this.zsets.get(key)!.set(member, score);
  }
  zrangeByLex(key: string, min: string, max: string): string[] {
    const members = [...(this.zsets.get(key)?.keys() ?? [])];
    const parseBound = (b: string) => {
      if (b === '-') return { negInf: true };
      if (b === '+') return { posInf: true };
      return { value: b.slice(1), inclusive: b[0] === '[' };
    };
    const minB = parseBound(min) as { negInf?: boolean; value?: string; inclusive?: boolean };
    const maxB = parseBound(max) as { posInf?: boolean; value?: string; inclusive?: boolean };
    return members
      .filter(m => {
        if (!minB.negInf && (minB.inclusive ? m < minB.value! : m <= minB.value!)) return false;
        if (!maxB.posInf && (maxB.inclusive ? m > maxB.value! : m >= maxB.value!)) return false;
        return true;
      })
      .sort();
  }
}

const redis = new FakeRedisZSet();
for (const city of ['berlin', 'boston', 'budapest', 'chicago', 'cairo']) {
  redis.zadd('autocomplete:cities', 0, city); // constant score -- pure lexicographic index
}

function suggest(prefix: string): string[] {
  // \\xff (0xff) is not a valid UTF-8 continuation byte, so it reliably
  // sorts after every real character that could follow the prefix.
  return redis.zrangeByLex('autocomplete:cities', \`[\${prefix}\`, \`[\${prefix}\\xff\`);
}

console.log('suggest("b"):', suggest('b'));
console.log('suggest("bu"):', suggest('bu'));
// suggest("b"): [ 'berlin', 'boston', 'budapest' ]
// suggest("bu"): [ 'budapest' ]`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team builds an autocomplete sorted set the same way as above, but accidentally uses <code>ZADD</code> with the CURRENT TIMESTAMP as the score for each city (thinking "most recently added first" would be a nice tiebreaker), instead of a constant score. What actually breaks?',
    hint: 'Re-read the hard precondition in the theory above — what does Redis\'s own documentation say happens to lexicographic queries when scores differ across members?',
    solution: `The autocomplete queries themselves become unreliable, not merely "less optimal." Redis's own documentation is explicit that lexicographic range results are UNSPECIFIED once members have different scores -- not "still correct but unsorted," but genuinely undefined behavior. A prefix search might return an incomplete set of matches, an out-of-order set, or happen to look correct by coincidence depending on how the skiplist's internal score-then-member ordering lines up for that specific data -- none of which is something the application can rely on.

The fix is to keep the score constant (0, or any single fixed value) for every member in a set used purely for lexicographic queries, and track "recently added" using a SEPARATE mechanism entirely -- a second sorted set scored by timestamp, if that ordering is genuinely needed, rather than trying to make one sorted set serve both the lexicographic-search and recency-ranking jobs at once.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"ZRANGEBYLEX still being present and working in current Redis means it\'s a fully current, undeprecated command — deprecation only matters once a command is actually removed."',
      reality: 'Verified directly against Redis\'s own docs: ZRANGEBYLEX carries an explicit "Deprecated as of Redis v6.2.0" notice today, even though it still works. A deprecated command can be removed in a future major version with no further notice beyond the deprecation itself — new code should prefer the documented replacement (ZRANGE ... BYLEX) rather than relying on a deprecated command staying available indefinitely.',
    },
    {
      thought: '"The score field in a sorted set always has SOME meaningful effect on ZRANGEBYLEX / ZRANGE ... BYLEX results, even if it\'s subtle."',
      reality: 'When every member shares the identical score (the only supported way to use these lexicographic commands), the score plays literally NO role in the query at all — ordering and range matching are determined purely by comparing member strings byte-by-byte. The score field exists on the sorted set as a data structure, but for this specific use case it is not doing any work.',
    },
  ];

  topicLabel = 'Sorted Sets';
  topicRoute = '/redis/sorted-sets';
  prev: SubtopicLink | null = {
    label: 'ZUNIONSTORE: WEIGHTS, AGGREGATE, and the COUNT Mode',
    route: '/redis/sorted-sets/zunionstore-weights-aggregate-and-count-mode',
  };
  next: SubtopicLink | null = null;
}
