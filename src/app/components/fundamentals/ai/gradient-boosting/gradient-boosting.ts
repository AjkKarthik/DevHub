import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-ai-gradient-boosting',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            CommonMistakesComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './gradient-boosting.html',
  styleUrl: './gradient-boosting.scss',
})
export class AiGradientBoosting {
  quickRef: QuickRefItem[] = [
    { name: 'Boosting',           type: 'keyword', desc: 'Sequential ensemble: each tree corrects the errors of the previous ones.' },
    { name: 'Residuals',          type: 'keyword', desc: 'What the current model gets wrong — the next tree learns these residuals.' },
    { name: 'Learning rate (η)',  type: 'keyword', desc: 'Shrinks each tree\'s contribution. Smaller η → need more trees, but better generalisation.' },
    { name: 'n_estimators',       type: 'keyword', desc: 'Number of trees. With small η, you need many trees. Use early stopping.' },
    { name: 'max_depth',          type: 'keyword', desc: 'Tree depth. Boosting uses shallow trees (depth 3-6); deeper = more overfit.' },
    { name: 'XGBoost',            type: 'keyword', desc: 'Regularised gradient boosting with column/row subsampling. Fast and accurate.' },
    { name: 'LightGBM',           type: 'keyword', desc: 'Leaf-wise growth instead of level-wise. Faster on large datasets.' },
    { name: 'SHAP',               type: 'keyword', desc: 'SHapley Additive exPlanations — per-sample feature importance with theoretical guarantees.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'How Gradient Boosting Works',
      points: [
        'Start with a simple prediction (e.g. mean of y). Compute residuals = y − prediction.',
        'Fit a shallow tree to the residuals (not to y). Add this tree\'s predictions to the ensemble, scaled by learning rate η.',
        'Compute new residuals = y − updated_prediction. Repeat for N trees.',
        'Key insight: each tree corrects what all previous trees got wrong — the ensemble improves incrementally.',
        'This is gradient descent in function space: residuals are the negative gradient of MSE loss; each tree is a step in the function-space gradient direction.',
      ],
    },
    {
      heading: 'XGBoost vs LightGBM vs CatBoost',
      points: [
        'XGBoost: regularised GBM with L1/L2 on leaf weights. Adds column and row subsampling. The original high-performance GBM — still widely used.',
        'LightGBM: leaf-wise tree growth (grows the leaf with max loss reduction) vs level-wise. Much faster on large datasets; can overfit on small ones.',
        'CatBoost: handles categorical features natively via ordered boosting, avoiding target leakage during encoding. Best when many categorical features.',
        'In practice: LightGBM for large tabular data, CatBoost for many categoricals, XGBoost as the safe default.',
      ],
    },
    {
      heading: 'Key Hyperparameters',
      points: [
        'learning_rate (η): 0.01–0.3. Smaller is better but requires more trees. Use η=0.1 as a starting point.',
        'n_estimators: 100–10000. Set large and use early_stopping_rounds on a validation set to stop when val loss stops improving.',
        'max_depth: 3–6 for XGBoost/LGBM. Deeper trees = more complex interactions but higher overfitting risk.',
        'subsample: fraction of training samples per tree. 0.6–0.8 adds randomness and reduces overfitting.',
        'colsample_bytree: fraction of features per tree. 0.6–1.0. Like Random Forest\'s feature randomness.',
        'min_child_weight / min_data_in_leaf: minimum samples to create a leaf — key regularisation.',
      ],
    },
    {
      heading: 'SHAP for Interpretability',
      points: [
        'SHAP (SHapley Additive exPlanations) assigns each feature a contribution to each individual prediction.',
        'Based on game theory: SHAP value = average marginal contribution of a feature across all possible feature orderings.',
        'SHAP values sum to: prediction − base_value. Fully additive and consistent.',
        'TreeSHAP computes exact SHAP values for tree models in O(TLD) — much faster than sampling-based approaches.',
        'Visualisations: SHAP summary plot (global), waterfall plot (per prediction), dependence plot (interaction effects).',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Gradient Boosting from Scratch',
      language: 'typescript',
      code: `// Simplified gradient boosting (regression, MSE loss)
// Each "tree" is a simple mean-predictor per leaf for illustration

function gradientBoostingPredict(
  residualPredictors: Array<(x: number) => number>,
  lr: number,
  basePred: number,
  x: number
): number {
  let pred = basePred;
  for (const tree of residualPredictors) pred += lr * tree(x);
  return pred;
}

// Training concept:
// 1. base prediction = mean(y)
// 2. for t in range(n_trees):
//      residuals = y - current_predictions
//      tree_t = fit_tree(X, residuals)
//      current_predictions += lr * tree_t.predict(X)

// Python (XGBoost):
// import xgboost as xgb
// model = xgb.XGBRegressor(
//   n_estimators=500, learning_rate=0.05,
//   max_depth=5, subsample=0.8, colsample_bytree=0.8,
//   early_stopping_rounds=50, eval_metric='rmse'
// )
// model.fit(X_train, y_train, eval_set=[(X_val, y_val)], verbose=100)`,
    },
    {
      label: 'XGBoost / LightGBM',
      language: 'typescript',
      code: `// XGBoost classification with early stopping (Python pseudocode)
// import xgboost as xgb
// dtrain = xgb.DMatrix(X_train, label=y_train)
// dval   = xgb.DMatrix(X_val,   label=y_val)
//
// params = {
//   'objective': 'binary:logistic',
//   'learning_rate': 0.05,
//   'max_depth': 6,
//   'subsample': 0.8,
//   'colsample_bytree': 0.8,
//   'eval_metric': 'auc',
//   'seed': 42,
// }
// model = xgb.train(params, dtrain, num_boost_round=1000,
//                   evals=[(dval, 'val')], early_stopping_rounds=50)

// LightGBM — faster, leaf-wise growth
// import lightgbm as lgb
// model = lgb.LGBMClassifier(
//   n_estimators=1000, learning_rate=0.05,
//   num_leaves=31, subsample=0.8,
//   callbacks=[lgb.early_stopping(50), lgb.log_evaluation(100)]
// )
// model.fit(X_train, y_train, eval_set=[(X_val, y_val)])

// SHAP for interpretability (Python)
// import shap
// explainer = shap.TreeExplainer(model)
// shap_values = explainer.shap_values(X_test)
// shap.summary_plot(shap_values, X_test, feature_names=feature_names)`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Setting learning rate high without reducing n_estimators',
      wrong: `model = XGBClassifier(learning_rate=0.3, n_estimators=100)
# Fast to train but often underfits or overfits — not optimal`,
      right: `model = XGBClassifier(learning_rate=0.05, n_estimators=1000,
                         early_stopping_rounds=50)
# More trees + smaller LR + early stopping = best practice`,
      explanation: 'The standard strategy: set η small (0.01–0.1), n_estimators large, and use early stopping on a validation set to find the optimal tree count. Small η + more trees generalises better.',
    },
    {
      title: 'Not using early stopping — training too few or too many trees',
      wrong: `model = XGBClassifier(n_estimators=100)
model.fit(X_train, y_train)  # arbitrary 100 trees`,
      right: `model = XGBClassifier(n_estimators=2000, early_stopping_rounds=50)
model.fit(X_train, y_train, eval_set=[(X_val, y_val)])
# Stops when val loss hasn't improved for 50 rounds`,
      explanation: 'Without early stopping you either underfit (too few trees) or overfit (too many). Early stopping automatically finds the optimal round count using validation loss.',
    },
    {
      title: 'Ignoring categorical features — encoding them as integers',
      wrong: `# city: ['London'=0, 'Paris'=1, 'Berlin'=2]
# Implies ordinal relationship: Berlin > Paris > London`,
      right: `# Use CatBoost (native categoricals) or target encoding
# Or one-hot encode low-cardinality features
# Or use LightGBM with categorical_feature parameter`,
      explanation: 'Encoding categoricals as arbitrary integers imposes a false ordinal relationship. Trees can still learn this but need more splits and data. Native categorical support (CatBoost/LGBM) is more efficient.',
    },
    {
      title: 'Not scaling target for regression',
      wrong: `model.fit(X, y)  # y has values 0 – 1,000,000
# XGBoost initialises with mean(y) = 500k — large residuals, slow convergence`,
      right: `# Scale y to ~[0,1] or standardise, then inverse-transform predictions
scaler = StandardScaler()
y_scaled = scaler.fit_transform(y.reshape(-1,1)).ravel()
model.fit(X, y_scaled)
preds = scaler.inverse_transform(model.predict(X_test).reshape(-1,1))`,
      explanation: 'Very large target values lead to large residuals and can cause numerical instability or slow convergence. Standardising y (or log-transforming for skewed distributions) often helps.',
    },
  ];

  challenge: Challenge = {
    title: 'Residual Boosting Step',
    language: 'typescript',
    description: 'Implement one step of gradient boosting: given current predictions and true labels, compute residuals, then return updated predictions after fitting a "stub" (predict mean of residuals).',
    hints: [
      'residuals = y - currentPredictions',
      'stubPrediction = mean(residuals)',
      'updatedPredictions = currentPredictions + lr * stubPrediction',
    ],
    starterCode: `function boostingStep(
  y: number[],
  currentPredictions: number[],
  lr: number
): { residuals: number[]; updatedPredictions: number[] } {
  // One gradient boosting step using a constant "stub" tree
}`,
    solution: `function boostingStep(
  y: number[],
  currentPredictions: number[],
  lr: number
): { residuals: number[]; updatedPredictions: number[] } {
  const residuals = y.map((yi, i) => yi - currentPredictions[i]);
  const stubPred  = residuals.reduce((s, r) => s + r, 0) / residuals.length;
  const updatedPredictions = currentPredictions.map(p => p + lr * stubPred);
  return { residuals, updatedPredictions };
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does each new tree in gradient boosting learn?',
      options: [
        'The original labels y',
        'The residuals — errors of the current ensemble',
        'Random labels for regularisation',
        'The gradient of the weights',
      ],
      answer: 1,
      explanation: 'Each new tree is fit to the residuals (y − current_predictions). This sequentially corrects what the ensemble gets wrong, reducing loss with each added tree.',
    },
    {
      q: 'What is the primary advantage of LightGBM over XGBoost?',
      options: [
        'Better regularisation',
        'Leaf-wise growth makes it significantly faster on large datasets',
        'No hyperparameters to tune',
        'Native GPU support only in LightGBM',
      ],
      answer: 1,
      explanation: 'LightGBM uses leaf-wise (best-first) tree growth, always splitting the leaf with the greatest loss reduction, rather than level-wise like XGBoost. This makes it much faster on large datasets.',
    },
    {
      q: 'Why use early stopping with gradient boosting?',
      options: [
        'To increase the learning rate automatically',
        'To stop training when validation loss stops improving — avoids overfitting and wasting compute',
        'To detect NaN gradients',
        'Required by LightGBM but not XGBoost',
      ],
      answer: 1,
      explanation: 'With too many trees and a small learning rate, gradient boosting eventually overfits. Early stopping monitors validation loss and stops when it hasn\'t improved for a set number of rounds.',
    },
  { q: 'What is the key idea behind gradient boosting?', options: ['Train multiple models in parallel and average them', 'Iteratively add weak learners that fit the residuals (negative gradients) of the previous ensemble', 'Randomly select features for each tree', 'Retrain a single model on misclassified examples'], answer: 1, explanation: 'Gradient boosting: each new tree is trained to predict the residuals (negative gradients of the loss) of the current ensemble. Trees are added sequentially, each correcting the previous ensemble\'s errors. The final prediction sums all tree outputs scaled by learning rate.' },
  { q: 'What is the difference between XGBoost, LightGBM, and CatBoost?', options: ['They are identical', 'XGBoost: level-wise tree growth; LightGBM: leaf-wise (faster, lower memory); CatBoost: native categorical encoding', 'LightGBM is a CPU-only library', 'CatBoost only handles classification'], answer: 1, explanation: 'XGBoost: level-wise tree growth, regularization. LightGBM: leaf-wise growth (grows the most impactful leaf), histogram-based splitting — fastest for large datasets. CatBoost: ordered target encoding for categoricals, reduces leakage. All support GPU and are competitive on tabular data.' },
  { q: 'How does early stopping prevent overfitting in gradient boosting?', options: ['Limits the maximum depth of each tree', 'Monitors validation loss and stops adding trees when it stops improving', 'Adds L1 regularization to each tree', 'Reduces the learning rate automatically'], answer: 1, explanation: 'Early stopping: hold out a validation set, evaluate after adding each tree; stop when validation metric does not improve for N rounds (early_stopping_rounds). Prevents building too many trees which overfits. The optimal number of trees is automatically determined.' },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between bagging (Random Forest) and boosting (XGBoost)?',
      a: 'Bagging trains trees in parallel on independent bootstrap samples and averages them — reduces variance. Boosting trains trees sequentially, each correcting the previous ensemble\'s errors — reduces bias. Bagging is robust and parallelisable. Boosting achieves higher accuracy but is more prone to overfitting and requires careful tuning.',
    },
    {
      q: 'How do SHAP values differ from standard feature importances?',
      a: 'Standard tree feature importance (impurity-based) measures total Gini/variance reduction for each feature across all trees — global only and can be misleading for correlated features. SHAP provides per-sample attribution with consistency guarantees: the contribution of each feature to each individual prediction, summing to the difference between prediction and base value.',
    },
  { q: 'How do you tune the hyperparameters of a gradient boosting model?', a: 'Key hyperparameters: (1) n_estimators + early stopping (auto-determined); (2) learning_rate: 0.01-0.3 (lower = more trees needed but better generalization); (3) max_depth: 3-8 (deeper = more complex = more overfit); (4) subsample: 0.6-0.9 (row sampling per tree); (5) colsample_bytree: 0.6-0.9 (column sampling). Bayesian optimization (Optuna) is more efficient than grid search. Start with low LR + many trees + early stopping, then tune max_depth and sampling.' },
  { q: 'When should you use gradient boosting vs neural networks for tabular data?', a: 'Gradient boosting (XGBoost, LightGBM): generally the best default for tabular data — handles mixed types, missing values, categorical features, is robust to feature scaling, and trains fast. Neural networks: better when you have very large datasets (>1M rows), need end-to-end learning with complex feature interactions (embeddings), or integrate with other neural components. Recent models (TabNet, FT-Transformer) close the gap but GBMs remain competitive.' },
  { q: 'How do you interpret gradient boosting predictions?', a: 'Interpretation tools: (1) Feature importance: split-based (how often a feature splits) or gain-based (improvement in loss). Gain importance is more reliable. (2) SHAP values: theoretically grounded, additive attribution per feature per prediction. TreeSHAP is O(TL) for trees. (3) Partial Dependence Plots (PDP): show marginal effect of one feature on prediction, averaging over other features. (4) LIME: local approximation with a linear model. SHAP is preferred for both global and local interpretation.' },
  { q: 'What is the effect of the learning rate in gradient boosting?', a: 'Learning rate (shrinkage) scales each tree\'s contribution. Low LR (0.01-0.1): requires more trees, better generalization, slower training. High LR (0.3+): fewer trees, faster training, higher overfitting risk. Standard practice: use low LR (0.05-0.1) with early stopping — the model automatically finds the optimal number of trees. LR and n_estimators trade off: halving LR roughly doubles the optimal n_estimators.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Gradient boosting sequentially adds shallow trees, each correcting residuals of the ensemble. XGBoost/LightGBM dominate tabular ML. Tune: learning rate small, many trees, early stopping, SHAP for interpretability.',
    mustKnow: [
      'Boosting: sequential trees on residuals; each step reduces loss',
      'Small learning rate + many trees + early stopping = best practice',
      'XGBoost: regularised, column/row subsampling',
      'LightGBM: leaf-wise growth — faster on large datasets',
      'CatBoost: native categorical encoding — no manual encoding needed',
      'SHAP = per-sample, additive feature importance with game-theory guarantees',
    ],
    interviewFocus: [
      'Bagging (Random Forest) vs boosting (XGBoost) — key differences',
      'Why use early stopping in gradient boosting?',
      'XGBoost vs LightGBM — when to use each',
    ],
  };
}
