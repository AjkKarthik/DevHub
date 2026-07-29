import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './why-basic-consistent-hashing-still-needs-virtual-nodes.html',
  styleUrl: './why-basic-consistent-hashing-still-needs-virtual-nodes.scss'
})
export class WhyBasicConsistentHashingStillNeedsVirtualNodesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page names virtual nodes without explaining what problem they actually solve',
      points: [
        'The main page\'s Quick Reference states virtual nodes give "better load distribution," and the quiz explanation correctly describes consistent hashing\'s K/N-keys-move property — but neither ever explains WHY basic (one-point-per-node) consistent hashing needs virtual nodes at all, given that hashing is already supposed to distribute things evenly.',
        'The gap is worth closing because the answer is genuinely counter-intuitive: consistent hashing already uses a good hash function, and yet basic (single-point) consistent hashing can still produce meaningfully UNEVEN load — the hash function being "good" is not enough on its own.',
      ]
    },
    {
      heading: 'Why one point per node on the ring is not enough',
      points: [
        'In basic consistent hashing, each physical node is assigned exactly ONE random position on the hash ring. A node\'s share of the keyspace is the ARC between its position and its counter-clockwise neighbor\'s position — and because each node\'s single position is placed randomly, those arc lengths vary randomly too.',
        'With only a handful of random points on a ring, it is entirely possible (and common) for two nodes\' positions to land close together, starving one of them of keyspace, while a large gap elsewhere hands another node a disproportionately large arc — the same reason randomly-thrown darts cluster unevenly on a board rather than spacing themselves out.',
        'This effect is well documented and measurable: analyses of basic consistent hashing report load-distribution variance (standard deviation relative to the mean, i.e. the coefficient of variation) on the order of tens of percent with few nodes — a real, meaningful imbalance, not a rounding error.',
      ]
    },
    {
      heading: 'How virtual nodes fix it — and by how much',
      points: [
        'Virtual nodes give each PHYSICAL node many positions on the ring (dozens to hundreds) instead of one. Each physical node\'s total keyspace share becomes the SUM of many small, independently-random arcs rather than one single random arc.',
        'This is the same statistical effect behind why averaging many small random samples produces a result closer to the true mean than relying on one large sample: the more virtual points a physical node holds, the more the random highs and lows of its individual arcs cancel out, converging its total share toward the true 1/N fair share.',
        'The measured effect is large: analyses comparing basic (single-point) placement to placement with many virtual nodes per physical node report load-distribution variance dropping from roughly 30% down to under 1% — the specific reason virtual nodes are standard practice in every serious consistent-hashing implementation (Cassandra, DynamoDB, and others all use them), not just an optional refinement.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'One position per node vs. many virtual positions',
      language: 'typescript',
      code: `// Basic consistent hashing: one ring position per physical node
interface RingPlacement {
  approach: 'single-position' | 'virtual-nodes';
  positionsPerPhysicalNode: number;
  typicalLoadVariance: string;
}

const comparison: RingPlacement[] = [
  {
    approach: 'single-position',
    positionsPerPhysicalNode: 1,
    typicalLoadVariance:
      '~30% standard deviation relative to the fair 1/N share -- ' +
      'a few nodes can end up meaningfully over- or under-loaded ' +
      'purely from where their one random position happened to land.',
  },
  {
    approach: 'virtual-nodes',
    positionsPerPhysicalNode: 200, // a typical real-world figure
    typicalLoadVariance:
      '<1% -- each physical node's share is now the SUM of 200 ' +
      'small independent arcs, so random highs and lows average out.',
  },
];

// Why 200-ish, not 2 or 3? More virtual positions per physical
// node keeps reducing variance, but with diminishing returns --
// most systems settle in the low hundreds as the practical
// sweet spot between "evenness" and "ring bookkeeping overhead."`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate says: "Consistent hashing already uses a good hash function, so with 4 nodes each should get roughly 25% of the keys — virtual nodes must just be a minor optimization." You add a 4-node ring with ONE position per node and measure the actual split: 41%, 9%, 31%, 19%. Why is it this uneven if the hash function itself is fine?',
    hint: 'A node\'s share of the ring is not determined by the hash function\'s overall quality — it is determined by the ARC LENGTH between its one ring position and its neighbor\'s. What determines that arc length with only 4 random points on a circle?',
    solution: 'The hash function distributes individual KEYS uniformly, but with only one ring POSITION per node, each node\'s share of the keyspace is the arc between its position and its nearest counter-clockwise neighbor — and with just 4 random points on a circle, those 4 arc lengths are themselves randomly distributed, not guaranteed to be equal. Two positions can land close together (starving one node), while a large gap elsewhere hands another node a disproportionate share. This is exactly the ~30%-variance effect basic consistent hashing is known to produce with few nodes. The fix is virtual nodes: giving each physical node many ring positions (e.g. 200) turns its total share into the SUM of many small, independently-random arcs, which — by the same statistical averaging effect that makes larger samples converge toward a true mean — pulls the total share for every physical node much closer to the fair 1/N split, typically down to well under 1% variance.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'If a consistent-hashing implementation uses a genuinely good hash function, load should already distribute evenly across nodes without needing virtual nodes.',
      reality: 'Per this subtopic\'s theory, the hash function distributes individual KEYS evenly, but with one ring position per node, each node\'s total SHARE depends on random arc lengths between a small number of ring points — which can be quite uneven even with a perfect hash function.'
    },
    {
      thought: 'Virtual nodes are a minor, optional performance tweak on top of consistent hashing.',
      reality: 'Per this subtopic\'s theory, measured load-distribution variance drops from roughly 30% (single-position) to under 1% (many virtual nodes) — a large enough effect that virtual nodes are standard practice in every serious implementation (Cassandra, DynamoDB), not an optional refinement.'
    },
    {
      thought: 'More virtual nodes per physical node always keeps meaningfully improving load balance, so systems should use as many as practically possible.',
      reality: 'Per this subtopic\'s theory, the variance reduction has diminishing returns — most real systems settle around a couple hundred virtual positions per physical node as the practical balance between evenness and the bookkeeping overhead of tracking more ring positions.'
    }
  ];
}
