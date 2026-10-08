import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-ai-target-scaling-trees',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './target-scaling-trees.html',
  styleUrl: './target-scaling-trees.scss'
})
export class TargetScalingTreesSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Run with XGBoost 3.2.0",
      "points": [
        "Target: 300,000 * x0 + 500,000 + noise, about 3,000 rows. Fit 1 on raw y; fit 2 on standardised y, with predictions transformed back.",
        "RMSE was 39,422 for both, and the largest difference between the two sets of predictions was 1 (on values near a million).",
        "XGBoost 2+ estimates base_score from the data: it was 496,263, matching mean(y) of 496,263, so the first residuals are already centred.",
        "Tree splits depend on the order of gradients and leaf values scale with them, so a linear change to y is undone exactly when you invert it. The mistake block now says this and recommends a log transform or a different objective for skewed targets."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Raw vs scaled (Python)",
      "language": "typescript",
      "code": "// r1 = XGBRegressor(n_estimators=200, max_depth=4).fit(X, y).predict(X)\n// mu, sd = y.mean(), y.std()\n// r2 = XGBRegressor(n_estimators=200, max_depth=4).fit(X, (y - mu) / sd).predict(X) * sd + mu\n// rmse(r1), rmse(r2)          # 39422, 39422\n// np.max(np.abs(r1 - r2))     # 1\n// base_score                  # 4.9626e5 = mean(y)"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "House prices range from 50,000 to 5,000,000 and the business cares about percentage error. Should you standardise y or log-transform it?",
    "hint": "Which one changes what the loss measures?",
    "solution": "Log-transform it (fit log1p(price), predict with expm1). Standardising leaves squared error in pounds, dominated by expensive houses; the log turns errors into roughly relative errors, which matches the goal."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "Large target values make XGBoost unstable.",
      "reality": "A linear rescale gave identical accuracy; base_score starts at the mean anyway."
    },
    {
      "thought": "Standardising and log-transforming y are interchangeable.",
      "reality": "Only the log changes the loss; standardising is undone when you invert it."
    }
  ];
}
