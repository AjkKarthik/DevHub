import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-dsa-bigo-shrink-patterns',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './arithmetic-vs-harmonic-shrinking-loops.html',
  styleUrl: './arithmetic-vs-harmonic-shrinking-loops.scss'
})
export class ArithmeticVsHarmonicShrinkingLoopsSubtopic {
  topicLabel = 'Big-O Notation';
  topicRoute = '/dsa/big-o';

  theory: TheoryPoint[] = [
    {
      heading: 'Three Shrink Patterns, Three Different Totals',
      points: [
        'The main page\'s own "Common Pitfalls" section said a shrinking inner loop could land on O(n log n) when it checks only "unprocessed elements" -- but that specific pattern (selection sort\'s <code>for j = i+1 to n</code>) is exactly what the SAME page\'s mistake #4 calls "still quadratic." Running both patterns settles it directly.',
        'Measured with a direct op-count: an arithmetic shrink (range decreases by a CONSTANT amount each outer pass, like "unprocessed elements") gives a triangular sum n+(n-1)+...+1 -- the ratio of ops to n² stayed flat at exactly 0.5 from n=100 to n=10,000, confirming O(n²), not O(n log n).',
        'The Challenge\'s own <code>mystery()</code> function is the pattern that actually IS O(n log n): its inner loop\'s STEP grows each outer pass (<code>j += i + 1</code>), so the inner loop runs n/(i+1) times -- a harmonic shrink, not an arithmetic one. Measured ops / (n·log₂n) converged toward ~0.69 (ln 2) as n grew, the signature of the harmonic series H(n) ≈ ln(n).',
        'A third pattern -- the inner range halving while the OUTER loop also only runs log n times -- is neither: it is a geometric series (n + n/2 + n/4 + ... ≈ 2n), which is O(n), not O(n log n). Three visually similar "shrinking inner loop" shapes, three different answers.'
      ]
    },
    {
      heading: 'Why This Is Easy to Get Wrong by Eye',
      points: [
        'All three patterns LOOK the same at a glance: a nested loop where the inner loop\'s range gets smaller as the outer index grows. The complexity depends entirely on the MATH of how it shrinks, not on the visual shape of the code.',
        'A safe rule: don\'t guess from the shape. Write down the exact inner-loop trip count as a function of the outer index i, then sum that function from i=0 to n-1 (or count outer iterations correctly if the outer loop itself doesn\'t run n times). The sum is the real answer.',
        'This is exactly the same "derive, don\'t assume" discipline the main page\'s own mistake #4 already demands for the arithmetic case -- it just needed to be applied consistently to the "unprocessed elements" example too.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Arithmetic shrink — still O(n²)',
      language: 'typescript',
      code: `// "Checking only unprocessed elements" -- selection-sort style.
// The inner range shrinks by exactly 1 each outer pass.
function arithmeticShrink(n: number): number {
  let ops = 0;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) { // n-1, n-2, ..., 1, 0 iterations
      ops++;
    }
  }
  return ops;
}

// Measured (actual run):
//   n=100     ops=4,950      ops/n²  = 0.4950
//   n=1,000   ops=499,500    ops/n²  = 0.4995
//   n=10,000  ops=49,995,000 ops/n²  = 0.5000
// Ratio to n² holds flat at 0.5 -- this is n(n-1)/2, a textbook O(n²).
// Ratio to n·log2(n) instead KEEPS GROWING (7.45 -> 50.1 -> 376.3) --
// proof it is NOT O(n log n), however "shrinking" it looks.`
    },
    {
      label: 'Harmonic shrink — genuinely O(n log n)',
      language: 'typescript',
      code: `// The main page's own Challenge function. The inner loop's STEP grows,
// so its trip count is n/(i+1), not n-(i+1).
function harmonicShrink(n: number): number {
  let ops = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j += i + 1) { // ~n/(i+1) iterations
      ops++;
    }
  }
  return ops;
}

// Total = n/1 + n/2 + n/3 + ... + n/n = n * H(n), H(n) = harmonic series ~ ln(n)
// Measured (actual run), ratio of ops to n*log2(n):
//   n=100       ratio=0.862
//   n=1,000     ratio=0.808
//   n=10,000    ratio=0.780
//   n=100,000   ratio=0.763
// Converging toward ln(2) ≈ 0.693 as n grows -- the harmonic-series
// signature. This is the ONLY one of the three patterns that is O(n log n).`
    },
    {
      label: 'Geometric shrink — actually O(n)',
      language: 'typescript',
      code: `// Outer loop runs only log2(n) times; inner RANGE halves each pass.
function geometricShrink(n: number): number {
  let ops = 0;
  let range = n;
  for (let i = 0; i < Math.log2(n); i++) {
    for (let j = 0; j < range; j++) ops++;
    range = Math.floor(range / 2);
  }
  return ops;
}

// Total = n + n/2 + n/4 + ... + 1 ≈ 2n  (a geometric series, bounded by 2n)
// Measured (actual run):
//   n=128     ops=254    (vs n=128)
//   n=1,024   ops=2,046  (vs n=1,024)
//   n=8,192   ops=16,382 (vs n=8,192)
//   n=65,536  ops=131,070 (vs n=65,536)
// ops stays at roughly 2*n for every n tested -- O(n), NOT O(n log n),
// even though there IS a log-n-iteration outer loop and a halving range.`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'The "geometric shrink" codeTab has an outer loop that runs log₂(n) times and an inner loop whose range is up to n. A tempting shortcut is: "log n outer iterations times up to n inner work = O(n log n)." Why is the real answer O(n) instead, and what does that shortcut get wrong?',
    hint: 'The shortcut multiplies the OUTER iteration count by the inner loop\'s LARGEST possible range -- but the inner range is only that large on the very first outer pass, then it shrinks. Try actually summing the per-pass costs instead of multiplying by the worst case.',
    solution: 'Multiplying "number of outer passes" by "the inner loop\'s maximum range" overcounts, because it treats every outer pass as if it does the SAME (worst-case) amount of inner work. In reality the inner range shrinks geometrically: pass 0 does n work, pass 1 does n/2, pass 2 does n/4, and so on. Summing the actual per-pass costs gives a geometric series n + n/2 + n/4 + ... + 1, which is bounded above by 2n regardless of how many terms there are -- O(n), not O(n log n). The log n factor correctly counts HOW MANY passes there are, but it is the wrong thing to multiply by the range, since the range is not constant across those passes. This is the same mistake, in reverse, as assuming a shrinking inner loop must be sub-quadratic: you have to sum the real per-iteration costs, not multiply by a bound that only holds once.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Any inner loop whose range gets smaller as the outer index grows must be sub-quadratic.',
      reality: 'It depends entirely on HOW it shrinks. An <code>arithmetic</code> shrink (range decreases by a fixed amount, like selection sort\'s "unprocessed elements") is still O(n²) -- verified above with a flat 0.5 ratio to n² across three orders of magnitude of n.'
    },
    {
      thought: '"O(n log n)" always means the inner loop literally divides its range in half each time, the way binary search does.',
      reality: 'The Challenge\'s own O(n log n) function never halves anything -- its inner loop\'s STEP SIZE grows (<code>j += i + 1</code>), producing a harmonic series n·H(n), not a halving pattern. The more commonly-taught route to O(n log n) -- an O(n) outer loop that binary-searches a sorted structure on each pass -- is a different shape that happens to land on the same complexity.'
    },
    {
      thought: 'A geometric shrink (inner range halves) combined with a log-n outer loop must be O(n log n), since both "n" and "log n" show up somewhere in the code.',
      reality: 'Measured above: it is O(n). The log-n factor describes how many outer passes there are, not a multiplier on the inner loop\'s total work -- the per-pass costs form a geometric series that sums to a constant multiple of n, not n log n.'
    }
  ];
}
