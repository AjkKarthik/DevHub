import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-ai-mse-vs-ce-gradient',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './mse-vs-ce-gradient.html',
  styleUrl: './mse-vs-ce-gradient.scss'
})
export class MseVsCeGradientSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "The gradient with respect to the logit z",
      "points": [
        "With p = sigmoid(z), cross-entropy gives dL/dz = p - y. MSE (p - y)^2 gives dL/dz = 2 (p - y) p (1 - p): the extra p (1 - p) factor goes to 0 as p approaches 0 or 1.",
        "True label 0, measured in Node: at z = 2 (p = 0.881) CE gradient 0.881, MSE 0.185. At z = 5 (p = 0.993) CE 0.993, MSE 0.0132. At z = 10 (p = 0.99995) CE 0.99995, MSE 0.0000908.",
        "So the more confidently wrong the model is, the less MSE pushes it to change — the opposite of what learning needs.",
        "Cross-entropy's gradient stays close to 1 in that case, which is why the page's LogisticRegression uses p - y."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Compare the two",
      "language": "typescript",
      "code": "const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));\nconst y = 0;\nfor (const z of [2, 5, 10]) {\n  const p = sigmoid(z);\n  const ce  = p - y;\n  const mse = 2 * (p - y) * p * (1 - p);\n  console.log(z, ce.toFixed(5), mse.toExponential(2));\n}\n// 2:  0.88080  1.85e-1\n// 5:  0.99331  1.32e-2\n// 10: 0.99995  9.08e-5"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "At z = 10 the CE gradient is about 1 and the MSE gradient about 0.00009. Roughly how many more gradient steps of the same size would MSE need to make the same change to z?",
    "hint": "Divide the two gradients.",
    "solution": "About 11,000 times as many (0.99995 / 0.0000908). In practice the model barely moves out of a confident mistake under MSE."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "MSE works for classification, just a bit slower.",
      "reality": "Its gradient collapses exactly on the confident errors, so training can stall."
    },
    {
      "thought": "Cross-entropy only matters for multi-class problems.",
      "reality": "Binary cross-entropy is the right loss for a single sigmoid output too."
    }
  ];
}
