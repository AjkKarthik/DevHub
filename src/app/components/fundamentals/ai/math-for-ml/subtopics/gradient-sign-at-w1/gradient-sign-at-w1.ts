import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-ai-gradient-sign-at-w1',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './gradient-sign-at-w1.html',
  styleUrl: './gradient-sign-at-w1.scss'
})
export class GradientSignAtW1Subtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Computed in Node",
      "points": [
        "MSE(w) = mean((w x - y)^2) with x = 1..5 and y = 2x. The derivative is mean(2 (w x - y) x) = 2 (w - 2) mean(x^2) = 22 (w - 2).",
        "At w = 1: numerical gradient -22.000000, analytical -22. At w = 2: both 0. At w = 3: 22.",
        "The negative sign means the loss falls as w grows, so gradient descent moves w up towards 2.",
        "The tab now prints both values with the correct expectation."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Gradient check",
      "language": "typescript",
      "code": "for (const w of [1, 2, 3]) {\n  const num = numericalGradient(mse, [w])[0];\n  const ana = analyticalGradientW(w);\n  console.log(w, num.toFixed(6), ana); // 1: -22, 2: 0, 3: 22\n}"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "Someone writes the analytical gradient as <code>2 * (y[i] - w * x) * x</code> (operands swapped). At which value of w would a gradient check fail to notice?",
    "hint": "The bug flips the sign.",
    "solution": "Only at w = 2, where the true gradient is 0 and the flipped one is also 0. At w = 1 the check shows +22 against -22, so test away from the minimum."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "Any starting point has a gradient near 0.",
      "reality": "Only the minimum does; at w = 1 the slope is steep (-22)."
    },
    {
      "thought": "The sign of the gradient does not matter, only its size.",
      "reality": "The sign tells gradient descent which way to move."
    }
  ];
}
