import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-ai-impurity-importance-bias',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './impurity-importance-bias.html',
  styleUrl: './impurity-importance-bias.scss'
})
export class ImpurityImportanceBiasSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Measured with scikit-learn 1.9.1",
      "points": [
        "Data: 2,000 rows, one real signal (label plus Gaussian noise) and one column that is just a random permutation of 0..1999 — a unique ID with no relationship to the label.",
        "A RandomForestClassifier (200 trees) reported <code>feature_importances_</code> of 0.647 for the signal and <strong>0.353</strong> for the random ID.",
        "<code>permutation_importance</code> on the test split gave 0.188 for the signal and -0.004 for the ID: shuffling the ID changes nothing.",
        "The ID can be split many ways to separate individual training rows, so trees use it to fit noise and collect impurity reduction for it. The page now warns about this."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Reproduce (Python)",
      "language": "typescript",
      "code": "// rng = np.random.RandomState(0); n = 2000\n// signal = rng.randint(0, 2, n)\n// X = np.c_[signal + rng.normal(0, 0.8, n), rng.permutation(n)]  # 2nd col = random ID\n// rf = RandomForestClassifier(n_estimators=200, random_state=0).fit(X_tr, y_tr)\n// rf.feature_importances_                                   # [0.647, 0.353]\n// permutation_importance(rf, X_te, y_te).importances_mean    # [0.188, -0.004]"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "A churn model ranks \"customer_id\" as its third most important feature by feature_importances_. What do you do?",
    "hint": "Could an ID carry real signal?",
    "solution": "Run permutation importance on held-out data. If the ID drops to about zero, it was memorising training rows and should be removed. If it stays important, check for leakage, such as IDs assigned in an order related to churn (for example newer customers)."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "A high impurity importance means the feature predicts the label.",
      "reality": "It can mean the trees used it to fit noise; a random ID scored 0.353."
    },
    {
      "thought": "Permutation importance and impurity importance always agree.",
      "reality": "They measure different things: training-set impurity reduction versus held-out score loss."
    }
  ];
}
