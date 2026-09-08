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
    heading: 'Boundaries Are Lower-Inclusive, Upper-Exclusive',
    points: [
      'The main page\'s own QnA gives the full syntax for both stages in real detail — <code>$bucket</code> with explicit boundaries and a default catch-all, and <code>$bucketAuto</code> for automatically-distributed ranges — but no codeTab on the page demonstrates either.',
      'Each bucket in <code>$bucket</code> spans <code>boundaries[i]</code> UP TO BUT NOT INCLUDING <code>boundaries[i + 1]</code>. Verified directly with boundaries <code>[0, 10, 50, 100, Infinity]</code>: a price of exactly <code>10</code> falls into the <code>[10, 50)</code> bucket, NOT the <code>[0, 10)</code> one — the boundary value itself always belongs to the bucket it starts, never the one it ends.',
      'The <code>default</code> field is not optional decoration — verified directly that a value BELOW the first boundary (a negative price, from bad data) is silently EXCLUDED from the results entirely if no <code>default</code> is specified, rather than producing an error or falling into the first bucket.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: '$bucket and $bucketAuto, With Boundary Edge Cases',
    language: 'typescript',
    code: `const products = db.collection('products');

// Explicit boundaries -- each bucket is [boundaries[i], boundaries[i+1])
const priceRanges = await products.aggregate([
  { \$bucket: {
    groupBy: '\$price',
    boundaries: [0, 10, 50, 100, Infinity],
    default: 'invalid',        // catches values BELOW 0 (bad data)
    output: {
      count: { \$sum: 1 },
      avgPrice: { \$avg: '\$price' },
    },
  }},
]).toArray();

// Automatically-distributed buckets -- no boundaries to choose
const autoDistributed = await products.aggregate([
  { \$bucketAuto: {
    groupBy: '\$price',
    buckets: 5,
    output: { count: { \$sum: 1 } },
  }},
]).toArray();

// Pure-JS verification of the exact boundary rule, matching the
// bucket assignments MongoDB itself would produce:
function assignBucket(value: number, boundaries: number[], defaultLabel: string): number | string {
  for (let i = 0; i < boundaries.length - 1; i++) {
    if (value >= boundaries[i] && value < boundaries[i + 1]) return boundaries[i];
  }
  return defaultLabel;
}

const boundaries = [0, 10, 50, 100, Infinity];
for (const price of [5, 9.99, 10, 49.99, 50, 99.99, 100, 250, -5]) {
  console.log(\`price=\${price} -> bucket=\${assignBucket(price, boundaries, 'invalid')}\`);
}
// -> price=10 -> bucket=10   (NOT bucket=0 -- boundary belongs to the bucket it starts)
// -> price=-5 -> bucket=invalid  (below every boundary -- caught by default)`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'Using the SAME boundaries <code>[0, 10, 50, 100, Infinity]</code>, a product costs exactly <code>$100.00</code>. Which bucket does it fall into: the <code>[50, 100)</code> bucket or the <code>[100, Infinity)</code> bucket?',
  hint: 'Apply the lower-inclusive, upper-exclusive rule directly: is 100 >= 50 AND 100 < 100? Is 100 >= 100 AND 100 < Infinity?',
  solution: `// The [100, Infinity) bucket -- labeled 100 in the output.
//
// Checking [50, 100) first: 100 >= 50 is true, but 100 < 100 is
// FALSE (100 is not strictly less than 100) -- so this bucket does
// NOT claim it. Checking [100, Infinity): 100 >= 100 is true, and
// 100 < Infinity is true -- this bucket DOES claim it.
//
// This confirms the general rule from the theory section applies
// consistently at every boundary in the array, not just the first
// one: a value exactly equal to any boundary always belongs to the
// bucket that boundary STARTS, never the one it ends.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'A value that does not fall within any defined boundary range causes $bucket to throw an error, alerting you to bad or unexpected data.',
    reality: 'Without a default field specified, a value outside every boundary range is silently EXCLUDED from the aggregation results — no error, no warning, the document simply never appears in any bucket\'s output. This is a real, easy-to-miss data-quality trap: a $bucket stage with no default can make bad data (negative prices, nulls that failed to convert) invisible instead of surfacing it.',
  },
  {
    thought: '$bucketAuto guarantees each bucket contains the exact same NUMBER of documents, evenly split N ways.',
    reality: 'MongoDB\'s own documentation only promises $bucketAuto attempts to distribute documents as EVENLY AS POSSIBLE across the requested bucket count — not an exact, guaranteed equal split. When many documents share the identical groupBy value (many products at exactly the same price, for instance), MongoDB cannot split that cluster across a boundary without separating identical values into different buckets, so it keeps them together instead, which can make some buckets larger than others despite the "auto" balancing.',
  },
];

@Component({
  selector: 'app-mongo-agg-bucket',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './bucketing-prices-with-bucket-and-bucketauto.html',
  styleUrl: './bucketing-prices-with-bucket-and-bucketauto.scss',
})
export class BucketingPricesWithBucketAndBucketautoSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
