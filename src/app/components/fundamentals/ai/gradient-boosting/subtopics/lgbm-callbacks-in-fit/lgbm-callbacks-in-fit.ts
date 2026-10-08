import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-ai-lgbm-callbacks-in-fit',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './lgbm-callbacks-in-fit.html',
  styleUrl: './lgbm-callbacks-in-fit.scss'
})
export class LgbmCallbacksInFitSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Run with LightGBM 4.7.0",
      "points": [
        "With <code>callbacks=[lgb.early_stopping(50)]</code> in the constructor and an eval_set in fit(), training built all 1,000 trees and <code>best_iteration_</code> was 0 — early stopping never happened.",
        "With the same callbacks passed to <code>fit()</code>, training stopped at 59 trees and <code>best_iteration_</code> was 59.",
        "The constructor accepts extra keyword arguments for booster parameters, so it does not reject <code>callbacks</code>; it simply never uses it as a callback.",
        "The page's LightGBM example now passes the callbacks to fit()."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Wrong vs right (Python)",
      "language": "typescript",
      "code": "// # Wrong: silently ignored\n// m = lgb.LGBMClassifier(n_estimators=1000, callbacks=[lgb.early_stopping(50)])\n// m.fit(X_tr, y_tr, eval_set=[(X_val, y_val)])\n// m.booster_.num_trees()   # 1000\n// m.best_iteration_        # 0\n//\n// # Right\n// m = lgb.LGBMClassifier(n_estimators=1000)\n// m.fit(X_tr, y_tr, eval_set=[(X_val, y_val)],\n//       callbacks=[lgb.early_stopping(50)])\n// m.best_iteration_        # 59"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "Your LightGBM model trains for exactly n_estimators rounds every time, even though validation loss stops improving early. Name two things to check.",
    "hint": "Where are the callbacks, and is there a validation set?",
    "solution": "First, that early_stopping is passed in fit(callbacks=...) rather than the constructor. Second, that fit() receives a validation set (eval_set or eval_X/eval_y); without one there is nothing to monitor. best_iteration_ confirms whether it worked."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "If the constructor accepts an argument, LightGBM uses it.",
      "reality": "Unknown keyword arguments are accepted and may be ignored; callbacks only work in fit()."
    },
    {
      "thought": "Early stopping is on whenever you pass an eval_set.",
      "reality": "It needs the early_stopping callback (or early_stopping_rounds) as well."
    }
  ];
}
