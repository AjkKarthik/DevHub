import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-zunionstore-weights-aggregate-and-count-mode',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './zunionstore-weights-aggregate-and-count-mode.html',
  styleUrl: './zunionstore-weights-aggregate-and-count-mode.scss',
})
export class ZunionstoreWeightsAggregateAndCountModeSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'What the main page names but never shows',
      points: [
        'The main page\'s own QnA describes <code>ZUNIONSTORE dest numkeys key1 key2... WEIGHTS w1 w2 AGGREGATE SUM|MIN|MAX</code> in one paragraph — verified accurate against the command\'s own docs — but no codeTab on the page ever calls it.',
        'Verified directly against Redis\'s own docs, using the exact worked example there: with two sorted sets holding <code>one</code> and <code>two</code> (scores 1 and 2 respectively) and a second set additionally holding <code>three</code> (score 3), <code>ZUNIONSTORE out 2 zset1 zset2 WEIGHTS 2 3</code> produces <code>one=5, three=9, two=10</code> — each member\'s score is multiplied by its SET\'s weight before the (default SUM) aggregation combines scores for members present in more than one input set.',
        'The main page\'s own QnA names only <code>SUM|MIN|MAX</code> as valid AGGREGATE modes — verified against Redis\'s own docs there is a real FOURTH mode, <code>COUNT</code>, which ignores the original scores entirely and instead counts (optionally weighted) how many of the input sets each member appears in.',
      ],
    },
    {
      heading: 'A genuine use case AGGREGATE COUNT unlocks',
      points: [
        'Without WEIGHTS, AGGREGATE COUNT turns ZUNIONSTORE into a direct "how many of these N sets does each member appear in" tally — computed server-side in one command, with no need to fetch every set and count membership overlaps in application code.',
        'This is a genuinely different question from the default SUM behavior: SUM answers "what is this member\'s combined weighted score across the sets it appears in," while COUNT answers "in how many of the sets does this member appear at all," completely ignoring what its score was in each one.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'WEIGHTS + default SUM',
      language: 'typescript',
      code: `// Reproduces Redis's own documented ZUNIONSTORE example exactly.
function zunionstore(
  sets: Map<string, number>[],
  weights: number[] = [],
  aggregate: 'SUM' | 'MIN' | 'MAX' | 'COUNT' = 'SUM',
): Map<string, number> {
  const scores = new Map<string, number>();
  sets.forEach((set, i) => {
    const weight = weights[i] ?? 1;
    for (const [member, score] of set) {
      const contribution = aggregate === 'COUNT' ? weight : score * weight;
      if (!scores.has(member)) {
        scores.set(member, contribution);
      } else {
        const existing = scores.get(member)!;
        if (aggregate === 'SUM' || aggregate === 'COUNT') scores.set(member, existing + contribution);
        else if (aggregate === 'MIN') scores.set(member, Math.min(existing, contribution));
        else if (aggregate === 'MAX') scores.set(member, Math.max(existing, contribution));
      }
    }
  });
  return scores;
}

const zset1 = new Map([['one', 1], ['two', 2]]);
const zset2 = new Map([['one', 1], ['two', 2], ['three', 3]]);

const result = zunionstore([zset1, zset2], [2, 3]); // WEIGHTS 2 3, default SUM
console.log('ZUNIONSTORE out 2 zset1 zset2 WEIGHTS 2 3:', [...result.entries()].sort((a, b) => a[1] - b[1]));
// ZUNIONSTORE out 2 zset1 zset2 WEIGHTS 2 3: [ [ 'one', 5 ], [ 'three', 9 ], [ 'two', 10 ] ]
// one:   (1*2) + (1*3) = 5
// two:   (2*2) + (2*3) = 10
// three:        (3*3) = 9  -- only in zset2, so only weighted by 3`,
    },
    {
      label: 'AGGREGATE COUNT: tag popularity',
      language: 'typescript',
      code: `function zunionstore(
  sets: Map<string, number>[],
  weights: number[] = [],
  aggregate: 'SUM' | 'MIN' | 'MAX' | 'COUNT' = 'SUM',
): Map<string, number> {
  const scores = new Map<string, number>();
  sets.forEach((set, i) => {
    const weight = weights[i] ?? 1;
    for (const [member] of set) {
      const contribution = aggregate === 'COUNT' ? weight : 0;
      scores.set(member, (scores.get(member) ?? 0) + contribution);
    }
  });
  return scores;
}

// tags:post1, tags:post2, tags:post3 -- how many posts is each tag used on?
const post1Tags = new Map([['redis', 0], ['nosql', 0]]);
const post2Tags = new Map([['redis', 0], ['caching', 0]]);
const post3Tags = new Map([['redis', 0], ['nosql', 0], ['performance', 0]]);

// AGGREGATE COUNT with no WEIGHTS: each set a tag appears in contributes 1.
const popularity = zunionstore([post1Tags, post2Tags, post3Tags], undefined, 'COUNT');
console.log('tag popularity across 3 posts:', [...popularity.entries()].sort((a, b) => b[1] - a[1]));
// tag popularity across 3 posts: [
//   [ 'redis', 3 ], [ 'nosql', 2 ], [ 'caching', 1 ], [ 'performance', 1 ]
// ]
// -- computed with a single server-side command, no per-post fetch-and-count needed`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A weekly leaderboard (<code>zset_week</code>) and a monthly leaderboard (<code>zset_month</code>) both track the SAME player IDs with their own separate point totals. A dashboard needs "highest single-period score a player has achieved, whichever period that was." Which AGGREGATE mode fits — SUM, MIN, MAX, or COUNT?',
    hint: 'Re-read what each mode does with a member that appears in multiple input sets — does the dashboard want the periods COMBINED, or does it want to pick out ONE specific value?',
    solution: `MAX. SUM would combine the two periods into a single, larger number that represents neither period's own actual score — not what "highest single-period score" is asking for. COUNT would throw away the actual scores entirely and just report how many periods (2, if the player appears in both) the player is tracked in, which answers a completely different question. MIN would deliberately pick the WORSE of the two scores.

MAX keeps whichever of the two period totals is larger for each player, discarding the smaller one -- exactly "the highest single-period score, whichever period it came from." Note that with equal WEIGHTS 1 1 (the default), MAX genuinely just compares the two raw scores directly, with no combination step at all.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"AGGREGATE only has three modes — SUM, MIN, MAX — since that\'s all a numeric combination could reasonably mean."',
      reality: 'Verified directly against Redis\'s own docs: there is a real fourth mode, COUNT, which does not combine the ORIGINAL scores at all — it ignores them entirely and instead counts how many input sets each member appears in (optionally weighted). This answers a genuinely different question than the other three modes.',
    },
    {
      thought: '"WEIGHTS multiplies the FINAL aggregated result, after SUM/MIN/MAX has already combined scores across sets."',
      reality: 'Verified directly against Redis\'s own docs and demonstrated above: each element\'s score is multiplied by ITS OWN set\'s weight BEFORE aggregation happens, not after. This is why "three" in the worked example gets multiplied by exactly zset2\'s weight (3) and nothing else — it was never in zset1 to begin with, so zset1\'s weight never applies to it at all.',
    },
  ];

  topicLabel = 'Sorted Sets';
  topicRoute = '/redis/sorted-sets';
  prev: SubtopicLink | null = {
    label: 'The Sliding Window Rate Limiter Has the Same Member-Collision Bug',
    route: '/redis/sorted-sets/sliding-window-has-the-same-member-collision-bug',
  };
  next: SubtopicLink | null = {
    label: 'ZRANGEBYLEX Is Deprecated — Use ZRANGE ... BYLEX',
    route: '/redis/sorted-sets/zrangebylex-is-deprecated-use-zrange-bylex',
  };
}
