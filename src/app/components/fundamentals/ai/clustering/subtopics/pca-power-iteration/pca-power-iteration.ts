import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-ai-pca-power-iteration',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './pca-power-iteration.html',
  styleUrl: './pca-power-iteration.scss'
})
export class PcaPowerIterationSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Checked against scikit-learn 1.9.1",
      "points": [
        "Power iteration repeatedly multiplies a vector by the covariance matrix and normalises it; it converges to the eigenvector with the largest eigenvalue, and the norm of the product gives that eigenvalue (the variance along it).",
        "Deflation subtracts λ·v·vᵀ from the matrix, so the next run finds the second component, and so on.",
        "On 500 four-dimensional points, the page's new function gave explained variance ratios 0.8208 and 0.0968 and first component (0.9343, 0.3558, 0.0211, -0.0080) — identical to <code>PCA(2).fit(X)</code> in scikit-learn.",
        "The tab also said \"Standardise\" while only centring. It now centres and notes that standardising is a separate choice when features use different units."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Core loop",
      "language": "typescript",
      "code": "let v = Array.from({ length: d }, (_, i) => 1 / Math.sqrt(d + i));\nfor (let t = 0; t < 500; t++) {\n  const w = cov.map(row => row.reduce((s, a, j) => s + a * v[j], 0));\n  lambda = Math.hypot(...w);          // variance along v\n  v = w.map(a => a / lambda);\n}\n// deflate before finding the next component\ncov = cov.map((row, i) => row.map((a, j) => a - lambda * v[i] * v[j]));"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "Why must the explained variance ratio be divided by the trace of the ORIGINAL covariance matrix, not the deflated one?",
    "hint": "What does the trace equal?",
    "solution": "The trace of the covariance matrix is the total variance of the data. After deflation it shrinks by each removed eigenvalue, so dividing by it would overstate later components. The function saves totalVariance before the loop for this reason."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "PCA needs a full eigendecomposition library.",
      "reality": "For the top few components, power iteration with deflation is enough and matches scikit-learn."
    },
    {
      "thought": "Centring and standardising are the same step.",
      "reality": "Centring subtracts the mean; standardising also divides by the standard deviation and changes the components."
    }
  ];
}
