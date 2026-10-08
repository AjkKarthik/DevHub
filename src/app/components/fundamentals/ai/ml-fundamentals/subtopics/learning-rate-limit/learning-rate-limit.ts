import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-ai-learning-rate-limit',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './learning-rate-limit.html',
  styleUrl: './learning-rate-limit.scss'
})
export class LearningRateLimitSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Computed and measured",
      "points": [
        "For MSE on y = m x + b, the curvature (Hessian) is <code>[[2 mean(x^2), 2 mean(x)], [2 mean(x), 2]]</code>. For x = 1..5 that is <code>[[22, 6], [6, 2]]</code>, whose largest eigenvalue is about 23.66.",
        "Plain gradient descent on a quadratic converges only when lr &lt; 2 / largest eigenvalue, here 2 / 23.66 = 0.0845.",
        "Running the page's function for 1000 epochs: lr 0.01 reached m = 1.9952, b = 0.0174; lr 0.08 and 0.084 reached m = 2, b = 0; lr 0.085 ended with m = -135,685 and lr 0.1 with m around -6e135.",
        "Standardising x (centre 3, scale by its standard deviation) changes the curvature so much that lr 0.5 converged in 50 epochs with zero error."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Sweep the rate",
      "language": "typescript",
      "code": "const X = [1, 2, 3, 4, 5], Y = [2, 4, 6, 8, 10];\nfor (const lr of [0.01, 0.08, 0.084, 0.085, 0.1]) {\n  console.log(lr, gradientDescent(X, Y, lr, 1000));\n}\n// 0.01  -> m 1.9952, b 0.0174   (slow)\n// 0.084 -> m 2, b 0             (fast)\n// 0.085 -> m -135685            (diverges)"
    },
    {
      "label": "Compute the limit",
      "language": "typescript",
      "code": "const n = X.length;\nconst a = 2 * X.reduce((s, x) => s + x * x, 0) / n;  // 22\nconst c = 2 * X.reduce((s, x) => s + x, 0) / n;      // 6\nconst d = 2;\nconst lambdaMax = ((a + d) + Math.sqrt((a - d) ** 2 + 4 * c * c)) / 2; // 23.66\nconsole.log(2 / lambdaMax); // 0.0845"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "If every x in the example were multiplied by 10 (x = 10..50), would the safe learning rate go up or down, and roughly by how much?",
    "hint": "mean(x squared) dominates the largest eigenvalue.",
    "solution": "Down, by roughly 100 times. mean(x squared) grows by 100, so the largest eigenvalue grows by about 100 and the limit 2 / lambda shrinks to about 0.0009. This is why unscaled features force tiny learning rates."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "Divergence starts gradually as the learning rate grows.",
      "reality": "There is a sharp edge: 0.084 converged perfectly and 0.085 exploded."
    },
    {
      "thought": "A smaller learning rate is always better.",
      "reality": "Below the limit, larger rates converge faster; 0.01 was still noticeably off after 1000 epochs."
    }
  ];
}
