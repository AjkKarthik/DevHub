import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-ai-attention-is-equivariant',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './attention-is-equivariant.html',
  styleUrl: './attention-is-equivariant.scss'
})
export class AttentionIsEquivariantSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Run on the page's scaledDotProductAttention",
      "points": [
        "Three token vectors X = [[1,0,2],[0,1,1],[2,1,0]] were attended with Q = K = V = X, then again with the rows in the order [2, 0, 1].",
        "Output for X: [[1, 0.2614, 1.608], [0.8288, 0.6096, 1.1712], [1.7057, 0.8614, 0.3551]]. Output for the reordered X was exactly those three rows in the order [2, 0, 1].",
        "So each token gets the same vector whatever its position — that is equivariance. The output as a whole is not the same; it is reordered.",
        "Without positional encoding the model cannot tell \"dog bites man\" from \"man bites dog\" because each word's vector is identical in both. The theory bullet and mistake now say equivariant."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Check it",
      "language": "typescript",
      "code": "const X = [[1, 0, 2], [0, 1, 1], [2, 1, 0]];\nconst P = [2, 0, 1];\nconst XP = P.map(i => X[i]);\n\nconst out = scaledDotProductAttention(X, X, X);\nconst outP = scaledDotProductAttention(XP, XP, XP);\n// outP equals P.map(i => out[i])  - permuted, not identical"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "If you average the three output rows into one sentence vector, is that vector the same for X and the reordered X?",
    "hint": "Averaging ignores order.",
    "solution": "Yes. The rows are the same three vectors in a different order, so their average is identical. Equivariant per-token outputs plus an order-free pooling give an invariant result, which is why order information has to be injected with positional encodings."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "Reordering tokens gives exactly the same attention output.",
      "reality": "It gives the same rows in a new order (equivariance), as the run shows."
    },
    {
      "thought": "Equivariance means the model understands order.",
      "reality": "It means the opposite: each token's vector ignores its position."
    }
  ];
}
