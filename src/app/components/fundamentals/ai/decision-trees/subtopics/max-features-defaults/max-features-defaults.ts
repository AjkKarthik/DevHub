import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-ai-max-features-defaults',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './max-features-defaults.html',
  styleUrl: './max-features-defaults.scss'
})
export class MaxFeaturesDefaultsSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Checked in scikit-learn 1.9.1",
      "points": [
        "<code>RandomForestClassifier().max_features</code> is <code>'sqrt'</code>: each split looks at a random sqrt(d) features.",
        "<code>RandomForestRegressor().max_features</code> is <code>1.0</code>: each split may look at every feature.",
        "The d/3 rule for regression is the default of the original R randomForest package (Breiman and Cutler), which is where many tutorials take it from.",
        "Feature subsampling is what makes forest trees less correlated than plain bagging, so the regressor default trades decorrelation for stronger individual trees."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Compare settings (Python)",
      "language": "typescript",
      "code": "// from sklearn.ensemble import RandomForestRegressor\n// for mf in ['sqrt', 0.33, 1.0]:\n//     rf = RandomForestRegressor(n_estimators=300, max_features=mf,\n//                                oob_score=True, random_state=0).fit(X, y)\n//     print(mf, rf.oob_score_)\n//\n// RandomForestRegressor().max_features  -> 1.0\n// RandomForestClassifier().max_features -> 'sqrt'"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "A regression dataset has 30 features, and one of them is very strong. Why might max_features=1.0 hurt compared with 0.33?",
    "hint": "Which feature does every tree pick at the root?",
    "solution": "With all features available, almost every tree splits first on the strong feature, so the trees look alike and their errors are correlated; averaging helps less. With about 10 features per split, many trees must use other features, which diversifies them."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "Every random forest library uses d/3 for regression.",
      "reality": "scikit-learn defaults to all features for RandomForestRegressor."
    },
    {
      "thought": "More features per split is always better.",
      "reality": "It makes individual trees stronger but more similar; the best value depends on the data."
    }
  ];
}
