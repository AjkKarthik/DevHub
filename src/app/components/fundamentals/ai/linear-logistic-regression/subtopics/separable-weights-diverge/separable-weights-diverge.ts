import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-ai-separable-weights-diverge',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './separable-weights-diverge.html',
  styleUrl: './separable-weights-diverge.scss'
})
export class SeparableWeightsDivergeSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Trained in Node",
      "points": [
        "Data: six points on a line, x below 0 labelled 0, x above 0 labelled 1 — perfectly separable. Training uses the page's update rule with lr = 0.5.",
        "Weight after 100 epochs: 3.9; after 1,000: 7.7; after 10,000: 12.1; after 100,000: 16.7. Training loss fell from 0.05 to 0.00008 and was still falling.",
        "Making the weight bigger always makes every point more confidently right, so the loss has an infimum of 0 but no minimum to converge to.",
        "With an L2 penalty of 0.01 added to the gradient, the weight settled at 3.5 and stayed there."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Watch it grow",
      "language": "typescript",
      "code": "const X = [[-2], [-1], [-0.5], [0.5], [1], [2]];\nconst y = [0, 0, 0, 1, 1, 1];\n\nfor (const epochs of [100, 1_000, 10_000, 100_000]) {\n  const m = new LogisticRegression(1, 0.5, epochs);\n  m.fit(X, y);\n  console.log(epochs, m.w[0].toFixed(1)); // 3.9, 7.7, 12.1, 16.7\n}"
    },
    {
      "label": "L2 stops it",
      "language": "typescript",
      "code": "// inside fit(): add lambda * w to the weight gradient\nconst dw = this.w.map((wj, j) =>\n  errors.reduce((s, e, i) => s + X[i][j] * e, 0) / n + lambda * wj\n);\n// lambda = 0.01 -> w settles near 3.5"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "Why does L2 regularisation produce a finite weight here even though the data is still separable?",
    "hint": "What does the penalty add to the loss as w grows?",
    "solution": "The penalty lambda * w^2 grows without limit as w grows, while the log loss can only fall towards 0. Their sum therefore has a real minimum at a finite w (about 3.5 here), where the two gradients balance."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "Running more epochs always gets closer to the right weights.",
      "reality": "On separable data the unregularised weights have no limit; more epochs just make them larger."
    },
    {
      "thought": "Near-zero training loss means a great model.",
      "reality": "Here it signals perfect separation and overconfident probabilities."
    }
  ];
}
