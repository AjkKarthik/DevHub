import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-ai-matmul-silent-shape',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './matmul-silent-shape.html',
  styleUrl: './matmul-silent-shape.scss'
})
export class MatmulSilentShapeSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Run in Node",
      "points": [
        "The loop takes k from <code>A[0].length</code> and n from <code>B[0].length</code>, and never looks at <code>B.length</code>. For A (3x2) and B (3x2), k = 2, so it reads <code>B[0]</code> and <code>B[1]</code> only.",
        "Result: <code>[[25,28],[57,64],[89,100]]</code> — exactly the same as multiplying by the first two rows of B. The third row <code>[11,12]</code> was ignored without any error.",
        "Multiplying a 2x3 by a 2x3 does throw, but with \"Cannot read properties of undefined (reading '0')\", because the loop asks for <code>B[2]</code>.",
        "The Linear Algebra tab now asserts the inner dimensions and the mistake text explains which case is silent."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Guarded matmul",
      "language": "typescript",
      "code": "function matmul(A: number[][], B: number[][]): number[][] {\n  const m = A.length, k = A[0].length, n = B[0].length;\n  if (B.length !== k) {\n    throw new Error('shape mismatch: (' + m + 'x' + k + ') · (' + B.length + 'x' + n + ')');\n  }\n  const C = Array.from({ length: m }, () => new Array(n).fill(0));\n  for (let i = 0; i < m; i++)\n    for (let j = 0; j < n; j++)\n      for (let p = 0; p < k; p++) C[i][j] += A[i][p] * B[p][j];\n  return C;\n}"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "A layer computes <code>matmul(input, W)</code> where input is 1x4 and W was accidentally created as 5x3. With the unguarded loop, what happens?",
    "hint": "Compare W.length with input[0].length.",
    "solution": "It runs without error and returns a 1x3 result built from the first 4 rows of W; the fifth row is silently ignored. The guarded version throws \"shape mismatch: (1x4) · (5x3)\"."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "Wrong shapes always crash.",
      "reality": "A loop that trusts A[0].length silently ignores extra rows of B."
    },
    {
      "thought": "If the output has the expected shape, the inputs were right.",
      "reality": "Here the output had a plausible 3x2 shape while being mathematically wrong."
    }
  ];
}
