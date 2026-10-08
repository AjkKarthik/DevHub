import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-dsa-bigo-amortized-proof',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './dynamic-array-amortized-proof.html',
  styleUrl: './dynamic-array-amortized-proof.scss'
})
export class DynamicArrayAmortizedProofSubtopic {
  topicLabel = 'Big-O Notation';
  topicRoute = '/dsa/big-o';

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page States the Conclusion, Not the Proof',
      points: [
        'The main page\'s own "Amortised Analysis" codeTab and a quiz question both assert dynamic-array push is "amortised O(1)" because resizing (O(n)) happens rarely and the cost "averages out over n pushes" -- true, but asserted rather than shown.',
        'The AGGREGATE METHOD proves it directly: sum the TOTAL work done across all n pushes (including every resize-copy), then divide by n. If that average stays bounded by a constant as n grows -- not growing WITH n -- the amortized cost per push really is O(1).',
        'Measured directly below for a doubling array, with n pushes ranging over six orders of magnitude (10 to 1,000,000): the amortized cost per push stayed between roughly 2.0 and 2.7 the entire time -- bounded, not growing. That is the proof, not just the intuition.'
      ]
    },
    {
      heading: 'Why Doubling Specifically Is What Makes This Work',
      points: [
        'With capacity doubling (1, 2, 4, 8, ..., up to the smallest power of 2 at least n), the total copy cost across ALL resizes is a geometric series: 1 + 2 + 4 + ... + (roughly n) &lt; 2n. Added to the n pushes themselves, total work is O(n) for n pushes -- O(1) per push on average.',
        'The geometric series is the key mechanical fact: each new resize costs as much as ALL the previous resizes combined, so the most recent resize dominates the whole sum and the total never exceeds roughly twice the final capacity.',
        'This is a general pattern, not specific to arrays: any amortized-analysis argument that relies on "the expensive operation gets geometrically rarer as it gets more expensive" is doing the same geometric-series trick underneath.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Aggregate method, measured (doubling)',
      language: 'typescript',
      code: `function totalWorkDoubling(n: number): number {
  let capacity = 1;
  let size = 0;
  let totalOps = 0; // 1 per push, + capacity per resize-copy
  for (let k = 0; k < n; k++) {
    if (size === capacity) {
      totalOps += capacity; // the resize's copy cost
      capacity *= 2;
    }
    size++;
    totalOps += 1; // the push itself
  }
  return totalOps;
}

// Actual measured output -- amortized cost (totalOps / n) stays BOUNDED,
// not growing, across six orders of magnitude of n:
//   n=10        totalOps=25        amortized=2.500
//   n=100       totalOps=227       amortized=2.270
//   n=1,000     totalOps=2,023     amortized=2.023
//   n=10,000    totalOps=26,383    amortized=2.638
//   n=100,000   totalOps=231,071   amortized=2.311
//   n=1,000,000 totalOps=2,048,575 amortized=2.049
// This IS the proof: if resizing genuinely cost O(n) "most of the time"
// rather than amortizing away, this ratio would grow with n. It doesn't.`
    },
    {
      label: 'Same proof, linear growth (+1) instead of doubling',
      language: 'typescript',
      code: `function totalWorkLinearGrow(n: number): number {
  let capacity = 1;
  let size = 0;
  let totalOps = 0;
  for (let k = 0; k < n; k++) {
    if (size === capacity) {
      totalOps += capacity;
      capacity += 1; // grows by a FIXED amount, not a multiplier
    }
    size++;
    totalOps += 1;
  }
  return totalOps;
}

// Actual measured output -- amortized cost GROWS LINEARLY with n this time:
//   n=10      totalOps=55        amortized=5.50   (n/2 = 5.0)
//   n=100     totalOps=5,050     amortized=50.50  (n/2 = 50.0)
//   n=1,000   totalOps=500,500   amortized=500.50 (n/2 = 500.0)
//   n=10,000  totalOps=50,005,000 amortized=5,000.50 (n/2 = 5,000.0)
// Growing by +1 each time still "amortizes" in the loose sense that a
// cost gets spread out -- but the spread-out cost is O(n) per push, not
// O(1). The growth FACTOR, not merely "growth happens," is what matters.`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'Using the aggregate-method reasoning above, what would the amortized cost per push be if the array tripled in capacity on every resize instead of doubling (1, 3, 9, 27, ...)? Is it still O(1)?',
    hint: 'The mechanism that made doubling work was that the resize costs form a geometric series bounded by roughly 2n. Does tripling still produce a geometric series, just with a different constant?',
    solution: 'Yes, still O(1) amortized. Tripling produces capacities 1, 3, 9, 27, ..., and the resize-copy costs are also a geometric series: 1 + 3 + 9 + ... + (roughly n), which sums to at most 1.5n (a geometric series with ratio 3 sums to total/(ratio-1) = total/2 for the earlier terms, giving a bound of roughly n*3/2 for the full series dominated by the last term). Adding the n pushes themselves still gives O(n) total work for n pushes, so the amortized cost per push is still a (different, slightly smaller) constant -- O(1) either way. The growth FACTOR changes the constant (doubling averages roughly 2 ops/push measured above; a larger growth factor would average closer to 1, since resizes become rarer), but any constant growth factor greater than 1 keeps the total a geometric series, which is what keeps the amortized cost bounded. Only a growth pattern that is NOT geometric (like the +1 linear-growth codeTab, which is additive rather than multiplicative) breaks the O(1) guarantee.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Saying "the expensive resize happens rarely, so it averages out" is itself a complete proof of O(1) amortized cost.',
      reality: 'It is the correct intuition, but not a proof -- "rarely" and "averages out" need a number attached. The aggregate method supplies that number: sum ALL the work (pushes + every resize-copy) across n operations and divide by n, then check that the result stays bounded as n grows rather than growing with it. Measured above, it does.'
    },
    {
      thought: 'Any growth strategy that is not "resize every single push" will give amortized O(1).',
      reality: 'The linear-growth (+1) codeTab resizes just as rarely in absolute terms as doubling does for small n, but its amortized cost per push grows linearly with n (measured: ~n/2) rather than staying constant. What matters is whether the resize-copy costs form a GEOMETRIC series (bounded total, any multiplicative growth factor &gt; 1) or an ARITHMETIC one (unbounded total, additive growth) -- not merely how often resizing happens.'
    },
    {
      thought: 'Amortized O(1) means every individual push takes roughly the same, small amount of time.',
      reality: 'Individual pushes are NOT uniform -- most are genuinely O(1), but the occasional push that triggers a resize is genuinely O(n) for that one call. "Amortized O(1)" is a statement about the AVERAGE over a long sequence of operations, not a guarantee about any single operation\'s own cost -- a latency-sensitive system (e.g. a real-time audio buffer) that cannot tolerate even one occasional O(n) spike needs a different data structure or a pre-sized buffer, despite the amortized bound being O(1).'
    }
  ];
}
