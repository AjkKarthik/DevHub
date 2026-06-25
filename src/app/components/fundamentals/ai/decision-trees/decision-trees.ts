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
  selector: 'app-ai-decision-trees',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            CommonMistakesComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './decision-trees.html',
  styleUrl: './decision-trees.scss',
})
export class AiDecisionTrees {
  quickRef: QuickRefItem[] = [
    { name: 'Gini impurity',     type: 'keyword', desc: '1 − Σpᵢ². 0 = pure node; max 0.5 (binary). Used in CART / sklearn.' },
    { name: 'Information gain',  type: 'keyword', desc: 'Entropy(parent) − weighted avg Entropy(children). Used in ID3/C4.5.' },
    { name: 'Entropy',           type: 'function',desc: '−Σpᵢ log₂(pᵢ). 0 = pure; 1 = maximally impure (50/50 binary).' },
    { name: 'Max depth',         type: 'keyword', desc: 'Limits tree growth to prevent overfitting. Key hyperparameter.' },
    { name: 'Pruning',           type: 'keyword', desc: 'Remove leaves that add little purity gain — reduces overfitting.' },
    { name: 'Bagging',           type: 'keyword', desc: 'Train N trees on bootstrap samples; average predictions. Reduces variance.' },
    { name: 'Random Forest',     type: 'keyword', desc: 'Bagging + random feature subset at each split. Uncorrelated trees.' },
    { name: 'Feature importance',type: 'keyword', desc: 'Sum of impurity reduction weighted by samples — which features split most.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Decision Tree Splitting',
      points: [
        'A decision tree splits data by asking yes/no questions about features: "Is age > 30?", "Is income ≤ 50k?"',
        'At each node, the algorithm tries all possible split points for every feature and picks the one that maximises information gain (or minimises Gini impurity).',
        'Gini impurity: G = 1 − Σpᵢ². A node with one class has G=0 (pure). A 50/50 binary split has G=0.5.',
        'Entropy: H = −Σpᵢ log₂(pᵢ). Information gain = H(parent) − weighted average H(children).',
        'For regression trees, the split minimises the variance (or MSE) of target values in each child node.',
      ],
    },
    {
      heading: 'Overfitting and Regularisation',
      points: [
        'Deep trees memorise training data perfectly — zero training error but poor generalisation.',
        'Key hyperparameters to limit growth: max_depth, min_samples_split, min_samples_leaf, max_leaf_nodes.',
        'Pre-pruning: stop growing when improvement < threshold. Post-pruning: grow full tree then remove low-gain leaves.',
        'Cost-complexity pruning (sklearn default): adds a penalty α·|T| for the number of leaves — tune α with cross-validation.',
      ],
    },
    {
      heading: 'Random Forests',
      points: [
        'Bagging: train N trees on bootstrap samples (sampling with replacement). Average predictions (regression) or majority vote (classification).',
        'Random subspace: at each split, only consider a random subset of features (√d for classification, d/3 for regression). Makes trees uncorrelated.',
        'Why uncorrelated trees matter: if all trees make the same error, averaging doesn\'t help. Randomness diversifies errors.',
        'Out-of-bag (OOB) error: samples not in a bootstrap sample (~37%) can be used for validation — no need for a separate val set.',
        'Feature importance: sum of weighted Gini reduction across all trees. Reliable for understanding which features drive predictions.',
      ],
    },
    {
      heading: 'When to Use Tree-Based Models',
      points: [
        'Decision trees: interpretable (can draw the tree), no scaling needed, handles mixed types, but overfits easily.',
        'Random Forest: state-of-the-art for tabular data with little tuning. Robust to outliers and irrelevant features.',
        'Better than linear models when: non-linear relationships exist, feature interactions matter, features are on different scales.',
        'Better than neural networks when: dataset is small-to-medium (< 100k rows), interpretability is needed, training time matters.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Decision Tree Node',
      language: 'typescript',
      code: `// Minimal decision tree implementation
interface TreeNode {
  featureIdx?: number;
  threshold?: number;
  left?: TreeNode;
  right?: TreeNode;
  prediction?: number;
}

function giniImpurity(labels: number[]): number {
  const n = labels.length;
  if (n === 0) return 0;
  const counts: Record<number, number> = {};
  for (const l of labels) counts[l] = (counts[l] ?? 0) + 1;
  return 1 - Object.values(counts).reduce((s, c) => s + (c / n) ** 2, 0);
}

function bestSplit(X: number[][], y: number[]): {fi: number; thresh: number; gain: number} {
  let best = { fi: -1, thresh: -Infinity, gain: -Infinity };
  const parentImpurity = giniImpurity(y);

  for (let fi = 0; fi < X[0].length; fi++) {
    const vals = [...new Set(X.map(x => x[fi]))].sort((a, b) => a - b);
    for (let ti = 0; ti < vals.length - 1; ti++) {
      const thresh = (vals[ti] + vals[ti + 1]) / 2;
      const left  = y.filter((_, i) => X[i][fi] <= thresh);
      const right = y.filter((_, i) => X[i][fi] >  thresh);
      if (left.length === 0 || right.length === 0) continue;
      const gain = parentImpurity
        - (left.length  / y.length) * giniImpurity(left)
        - (right.length / y.length) * giniImpurity(right);
      if (gain > best.gain) best = { fi, thresh, gain };
    }
  }
  return best;
}`,
    },
    {
      label: 'Random Forest Concept',
      language: 'typescript',
      code: `// Random Forest: bag of decision trees with feature randomness
// Python equivalent:
// from sklearn.ensemble import RandomForestClassifier
// rf = RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42)
// rf.fit(X_train, y_train)
// print(rf.feature_importances_)

// TypeScript illustration: bootstrap sampling
function bootstrapSample<T>(data: T[]): T[] {
  return Array.from({length: data.length}, () =>
    data[Math.floor(Math.random() * data.length)]
  );
}

// Feature importances (conceptual) — sum of Gini reductions per feature
function featureImportances(importances: Record<string, number>) {
  const total = Object.values(importances).reduce((s, v) => s + v, 0);
  return Object.fromEntries(
    Object.entries(importances)
      .map(([k, v]) => [k, v / total])
      .sort((a, b) => (b[1] as number) - (a[1] as number))
  );
}

// Majority vote for ensemble prediction
function majorityVote(predictions: number[][]): number[] {
  return predictions[0].map((_, i) => {
    const votes: Record<number, number> = {};
    for (const preds of predictions) votes[preds[i]] = (votes[preds[i]] ?? 0) + 1;
    return +Object.entries(votes).sort((a, b) => b[1] - a[1])[0][0];
  });
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Growing a decision tree without depth limits',
      wrong: `tree = DecisionTreeClassifier()  # no constraints
tree.fit(X_train, y_train)
print(tree.score(X_train, y_train))  # 100% — memorised`,
      right: `tree = DecisionTreeClassifier(max_depth=5, min_samples_leaf=10)
tree.fit(X_train, y_train)
print(tree.score(X_test, y_test))  # real generalisation performance`,
      explanation: 'An unconstrained decision tree creates one leaf per training sample, achieving 100% train accuracy but completely failing on new data. Always set max_depth or min_samples_leaf.',
    },
    {
      title: 'Using feature importance for causal inference',
      wrong: `# Feature "temperature" is most important for ice cream sales
# Therefore temperature CAUSES ice cream sales? No — correlation only`,
      right: `# Feature importance = correlation with target, not causation
# A confounder (e.g. season) can make an unrelated feature appear important`,
      explanation: 'Tree-based feature importances measure predictive correlation, not causation. A feature correlated with the true predictor can appear important even if it has no causal relationship.',
    },
    {
      title: 'Not using OOB score for validation in Random Forest',
      wrong: `rf = RandomForestClassifier(n_estimators=100)
rf.fit(X_train, y_train)
# Need separate val split to evaluate during training`,
      right: `rf = RandomForestClassifier(n_estimators=100, oob_score=True)
rf.fit(X_train, y_train)
print(rf.oob_score_)  # Free validation estimate — no extra split needed`,
      explanation: 'Random Forests compute out-of-bag error for free: each tree is evaluated on the ~37% of samples not in its bootstrap sample. Use oob_score=True to avoid wasting data on a validation set.',
    },
    {
      title: 'Scaling features before tree-based models',
      wrong: `scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)
rf = RandomForestClassifier()
rf.fit(X_scaled, y)  # wasted effort — trees are scale-invariant`,
      right: `# Trees split on thresholds — scaling doesn't change split order
# No need to scale features for decision trees or random forests
rf = RandomForestClassifier()
rf.fit(X, y)`,
      explanation: 'Decision trees split on feature thresholds — multiplying all values by a constant doesn\'t change the ranking. Scaling is unnecessary (and harmless) for tree-based models, unlike for gradient-based methods.',
    },
  ];

  challenge: Challenge = {
    title: 'Gini Split Finder',
    language: 'typescript',
    description: 'Given a list of samples with one numeric feature and a binary label, find the threshold that minimises weighted Gini impurity after the split.',
    hints: [
      'Try every midpoint between consecutive unique feature values as the threshold',
      'Weighted Gini = (n_left/n)*gini(left) + (n_right/n)*gini(right)',
      'Gini impurity = 1 - sum(p_class^2)',
    ],
    starterCode: `function gini(labels: number[]): number {
  const n = labels.length;
  const counts: Record<number,number> = {};
  for (const l of labels) counts[l] = (counts[l]??0)+1;
  return 1 - Object.values(counts).reduce((s,c) => s+(c/n)**2, 0);
}

function bestThreshold(features: number[], labels: number[]): number {
  // Return the threshold that minimises weighted Gini after split
}`,
    solution: `function gini(labels: number[]): number {
  const n = labels.length;
  const counts: Record<number,number> = {};
  for (const l of labels) counts[l] = (counts[l]??0)+1;
  return 1 - Object.values(counts).reduce((s,c) => s+(c/n)**2, 0);
}

function bestThreshold(features: number[], labels: number[]): number {
  const n = features.length;
  const sorted = [...new Set(features)].sort((a,b) => a-b);
  let bestThresh = sorted[0], bestGini = Infinity;
  for (let i = 0; i < sorted.length - 1; i++) {
    const thresh = (sorted[i] + sorted[i+1]) / 2;
    const left  = labels.filter((_,j) => features[j] <= thresh);
    const right = labels.filter((_,j) => features[j] >  thresh);
    const weighted = (left.length/n)*gini(left) + (right.length/n)*gini(right);
    if (weighted < bestGini) { bestGini = weighted; bestThresh = thresh; }
  }
  return bestThresh;
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the Gini impurity of a perfectly pure node (all samples same class)?',
      options: ['1', '0.5', '0', '0.25'],
      answer: 2,
      explanation: 'Gini = 1 − Σpᵢ². A pure node has p=1 for one class: 1 − 1² = 0. A maximally impure binary node (50/50) has Gini = 0.5.',
    },
    {
      q: 'What key randomness does Random Forest add on top of bagging?',
      options: [
        'Random label flipping',
        'Random feature subset at each split — trees see different features',
        'Random learning rate per tree',
        'Random depth limits',
      ],
      answer: 1,
      explanation: 'Bagging uses different data samples. Random Forest additionally considers only a random subset of features at each split, making trees less correlated and reducing ensemble variance.',
    },
    {
      q: 'Why don\'t decision trees need feature scaling?',
      options: [
        'They use gradient descent which is scale-invariant',
        'They split on feature thresholds — monotonic transformations don\'t change split order',
        'Trees normalise features internally',
        'Scaling always hurts tree performance',
      ],
      answer: 1,
      explanation: 'Trees compare feature values to thresholds, not their magnitudes. Multiplying a feature by a constant shifts the threshold equally — the relative ordering and optimal split remain the same.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I prefer Random Forest over Gradient Boosting (XGBoost)?',
      a: 'Random Forest trains trees in parallel — much faster for large datasets. It is less sensitive to hyperparameters and works well out of the box. Gradient Boosting achieves higher accuracy but requires careful tuning of learning rate, n_estimators, and max_depth, and trains sequentially (slower). Start with Random Forest for a fast baseline; switch to XGBoost/LightGBM when you need to squeeze out more accuracy.',
    },
    {
      q: 'What is out-of-bag (OOB) error and why is it useful?',
      a: 'Each tree in a Random Forest is trained on a bootstrap sample — about 63% of the data. The remaining ~37% (out-of-bag samples) were never seen by that tree, so they can be used to estimate generalisation error for free, without a separate validation split. OOB score closely tracks cross-validation accuracy and is especially useful when data is scarce.',
    },
    {
      q: 'How does a decision tree handle missing values?',
      a: 'Standard sklearn decision trees do not support missing values natively — you must impute first (mean/median/mode). XGBoost and LightGBM handle missing values natively by learning the optimal direction to send missing values at each split. CatBoost uses a different strategy (oblivious trees). If missing values carry information (MCAR vs MNAR), imputation strategy matters.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Decision trees split data greedily by Gini/entropy. They overfit without depth limits. Random Forests bag many trees with random feature subsets, producing robust uncorrelated ensembles.',
    mustKnow: [
      'Gini impurity = 1−Σpᵢ². 0 = pure; 0.5 = maximally impure (binary)',
      'Information gain = entropy(parent) − weighted entropy(children)',
      'Deep trees overfit — use max_depth, min_samples_leaf',
      'Bagging: N trees on bootstrap samples; average reduces variance',
      'Random Forest adds feature randomness → uncorrelated trees',
      'Trees are scale-invariant — no need to scale features',
    ],
    interviewFocus: [
      'What is Gini impurity and how is the best split chosen?',
      'How does Random Forest reduce overfitting compared to a single tree?',
      'Feature importance in trees — what does it measure and when is it misleading?',
    ],
  };
}
