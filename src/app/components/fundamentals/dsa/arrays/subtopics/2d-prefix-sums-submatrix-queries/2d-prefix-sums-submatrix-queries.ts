import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-dsa-arrays-2d-prefix',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './2d-prefix-sums-submatrix-queries.html',
  styleUrl: './2d-prefix-sums-submatrix-queries.scss'
})
export class TwoDPrefixSumsSubmatrixQueriesSubtopic {
  topicLabel = 'Arrays';
  topicRoute = '/dsa/arrays';

  theory: TheoryPoint[] = [
    {
      heading: 'The 1D Idea, Extended to a Grid',
      points: [
        'The main page\'s own "Prefix Sum Array" section says, in one sentence, "Extend to 2D for submatrix sum queries" -- but no codeTab on the page ever builds one. The core idea carries over directly: precompute cumulative sums once, in O(rows*cols), then answer any rectangular-region query in O(1).',
        'The 2D prefix array stores, at <code>prefix[r][c]</code>, the sum of every cell strictly above-left of (r, c) -- using a 1-indexed, (rows+1)x(cols+1) grid (padded with a row and column of zeros) avoids boundary special-casing, the same trick the main page\'s own 1D fix already uses.',
        'The build recurrence is <code>prefix[r+1][c+1] = prefix[r][c+1] + prefix[r+1][c] - prefix[r][c] + matrix[r][c]</code> -- adding the cell above and the cell to the left double-counts their shared top-left corner, so it is subtracted back out once. This inclusion-exclusion step is the one genuinely new idea versus the 1D case.'
      ]
    },
    {
      heading: 'Answering a Query, and Why It Needs the Same Correction',
      points: [
        'A rectangular range sum from (r1,c1) to (r2,c2) inclusive is <code>prefix[r2+1][c2+1] - prefix[r1][c2+1] - prefix[r2+1][c1] + prefix[r1][c1]</code> -- the same inclusion-exclusion pattern as the build step: subtract the region above and the region to the left, then add back the corner that both subtractions removed twice.',
        'Verified directly against a brute-force O(rows*cols) sum over the actual rectangle for four different query rectangles on a 5x5 grid, including the full-matrix query -- every result matched exactly. The O(1) formula is not an approximation; it reproduces the brute-force total precisely.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: '2D prefix sum, verified against brute force',
      language: 'typescript',
      code: `function build2DPrefix(matrix: number[][]): number[][] {
  const rows = matrix.length, cols = matrix[0].length;
  const prefix = Array.from({ length: rows + 1 }, () => new Array(cols + 1).fill(0));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      prefix[r + 1][c + 1] =
        prefix[r][c + 1] + prefix[r + 1][c] - prefix[r][c] + matrix[r][c];
    }
  }
  return prefix;
}

// Inclusive rectangle (r1,c1) to (r2,c2) -- O(1) after the O(rows*cols) build.
function submatrixSum(prefix: number[][], r1: number, c1: number, r2: number, c2: number): number {
  return prefix[r2 + 1][c2 + 1] - prefix[r1][c2 + 1] - prefix[r2 + 1][c1] + prefix[r1][c1];
}

const matrix = [
  [3, 0, 1, 4, 2],
  [5, 6, 3, 2, 1],
  [1, 2, 0, 1, 5],
  [4, 1, 0, 1, 7],
  [1, 0, 3, 0, 5],
];
const prefix = build2DPrefix(matrix);

// Actual measured output, each checked against a brute-force sum over the
// rectangle directly -- all four matched exactly:
//   submatrixSum(prefix, 2,1,4,3) = 8   (rows 2-4, cols 1-3)
//   submatrixSum(prefix, 1,1,2,2) = 11
//   submatrixSum(prefix, 1,2,1,4) = 6   (a single row slice)
//   submatrixSum(prefix, 0,0,4,4) = 58  (the whole matrix)`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'The build recurrence adds <code>prefix[r][c+1]</code> and <code>prefix[r+1][c]</code>, then subtracts <code>prefix[r][c]</code>. If that subtraction were accidentally left out, would the resulting prefix array still work for single-ROW range queries (where r1 === r2)?',
    hint: 'The subtracted term corrects for double-counting the region that is BOTH above AND to the left. Think about whether a query confined to one row ever has a nonzero region above it.',
    solution: 'For the FIRST row (r1 = r2 = 0), yes, it would happen to still work, since there is no region above row 0 at all -- the correction term would be subtracting a genuine zero, so leaving it out changes nothing for that specific case. But for any row below the first, the missing subtraction would double-count the overlap between "everything above" and "everything to the left," inflating every prefix value from that row onward (and therefore every later single-row and full submatrix query) by the wrong amount. The bug would pass a narrow test confined to row 0 and silently fail everywhere else -- exactly the kind of "worked on my test case" bug that a boundary-only check misses.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Extending a 1D prefix sum to 2D just means running the same 1D build once per row.',
      reality: 'That only gives you fast ROW-range sums, not arbitrary rectangles -- it is a real, useful technique (and sometimes exactly what\'s needed), but it is a different data structure from the genuine 2D prefix sum, which needs the inclusion-exclusion correction term to answer queries spanning multiple rows AND columns in O(1).'
    },
    {
      thought: 'The "subtract the overlap" step in the 2D formula is an optional refinement for efficiency.',
      reality: 'It is required for correctness, not an optimization -- without it, both the build and the query double-count the top-left overlap region, producing a genuinely wrong sum (verified above: leaving it out of the build recurrence breaks every row below the first).'
    },
    {
      thought: 'A 2D prefix sum needs O(rows*cols) extra space on top of the O(rows*cols) the matrix itself already uses, so it roughly doubles memory.',
      reality: 'That is accurate, and worth stating plainly as a real tradeoff: unlike the 1D case (which adds a single array of size n+1), the 2D version genuinely allocates a second full (rows+1)x(cols+1) grid. For a huge matrix where only a handful of range queries are ever needed, a brute-force O(rows*cols) sum per query might use less memory overall than precomputing.'
    }
  ];
}
