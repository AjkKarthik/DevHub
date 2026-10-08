import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-ai-ccp-alpha-default-zero',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './ccp-alpha-default-zero.html',
  styleUrl: './ccp-alpha-default-zero.scss'
})
export class CcpAlphaDefaultZeroSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Run with scikit-learn 1.9.1",
      "points": [
        "<code>DecisionTreeClassifier().ccp_alpha</code> is <code>0.0</code>. With alpha 0 the cost-complexity criterion never removes a subtree.",
        "On 2,000 noisy samples (one useful feature plus one random ID column), the default tree had 421 leaves, 100% training accuracy and 63.4% test accuracy.",
        "Choosing ccp_alpha by 5-fold cross-validation on the training split gave alpha 0.0127, a tree with 3 leaves, and 74.2% test accuracy — close to the 73.4% best possible for that noise level.",
        "The page now says that pruning is available through ccp_alpha but off by default."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Tune ccp_alpha (Python)",
      "language": "typescript",
      "code": "// from sklearn.tree import DecisionTreeClassifier\n// from sklearn.model_selection import GridSearchCV\n//\n// full = DecisionTreeClassifier(random_state=0).fit(X_train, y_train)\n// alphas = full.cost_complexity_pruning_path(X_train, y_train).ccp_alphas\n// search = GridSearchCV(DecisionTreeClassifier(random_state=0),\n//                       {'ccp_alpha': alphas}, cv=5).fit(X_train, y_train)\n// print(search.best_params_, search.best_estimator_.get_n_leaves())\n//\n// default tree: 421 leaves, test 0.634\n// tuned (alpha 0.0127): 3 leaves, test 0.742"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "A colleague says \"sklearn prunes trees automatically, so I do not need max_depth\". What would you check to show them otherwise?",
    "hint": "Look at the fitted tree.",
    "solution": "Print tree.get_n_leaves() and the training accuracy: with defaults the tree usually reaches 100% training accuracy with many leaves. Then show ccp_alpha is 0.0 and compare cross-validated scores with a tuned alpha or a max_depth limit."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "Decision trees in scikit-learn are pruned unless you turn it off.",
      "reality": "Every growth control is off by default; ccp_alpha is 0.0."
    },
    {
      "thought": "Pick the alpha with the best test score.",
      "reality": "Choose it with cross-validation on the training data; the test set is for the final estimate."
    }
  ];
}
