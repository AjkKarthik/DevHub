import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-ai-lgbm-subsample-freq',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './lgbm-subsample-freq.html',
  styleUrl: './lgbm-subsample-freq.scss'
})
export class LgbmSubsampleFreqSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Tested with LightGBM 4.7.0",
      "points": [
        "LightGBM maps <code>subsample</code> to <code>bagging_fraction</code> and <code>subsample_freq</code> to <code>bagging_freq</code>, whose default is 0. Bagging only runs every <code>bagging_freq</code> iterations, so 0 means never.",
        "Two 50-tree models on the same data, one with subsample=0.5 and one with 1.0 (both freq 0), gave identical predicted probabilities.",
        "Adding <code>subsample_freq=1</code> to the 0.5 model changed its predictions, confirming the sampling was now active.",
        "XGBoost samples rows for every tree from <code>subsample</code> alone. The page now explains the difference."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Check it (Python)",
      "language": "typescript",
      "code": "// a = LGBMClassifier(n_estimators=50, subsample=0.5, random_state=1).fit(X, y)\n// b = LGBMClassifier(n_estimators=50, subsample=1.0, random_state=1).fit(X, y)\n// np.allclose(a.predict_proba(X), b.predict_proba(X))   # True  - ignored\n//\n// c = LGBMClassifier(n_estimators=50, subsample=0.5, subsample_freq=1,\n//                    random_state=1).fit(X, y)\n// np.allclose(c.predict_proba(X), b.predict_proba(X))   # False - now sampling"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "A hyperparameter search over LightGBM tries subsample in [0.6, 0.8, 1.0] and every value scores the same. What is the likely reason?",
    "hint": "What is the default bagging_freq?",
    "solution": "subsample_freq was left at 0, so bagging never ran and all three settings trained the same model. Add subsample_freq=1 (or search over it too)."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "subsample means the same thing in XGBoost and LightGBM.",
      "reality": "LightGBM also needs subsample_freq above 0."
    },
    {
      "thought": "If a parameter has no effect, the library would warn.",
      "reality": "Here it is silently unused."
    }
  ];
}
