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
  selector: 'app-ai-linear-logistic-regression',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            CommonMistakesComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './linear-logistic-regression.html',
  styleUrl: './linear-logistic-regression.scss',
})
export class AiLinearLogisticRegression {
  quickRef: QuickRefItem[] = [
    { name: 'Linear regression', type: 'keyword', desc: 'y = Xw + b. Minimise MSE via OLS (closed form) or gradient descent.' },
    { name: 'OLS solution',      type: 'syntax',  desc: 'w = (X^T X)^{-1} X^T y. Exact solution when X is full rank.' },
    { name: 'R²',                type: 'keyword', desc: 'Coefficient of determination. 1 = perfect fit; 0 = mean baseline; negative = worse than mean.' },
    { name: 'Logistic regression',type:'keyword', desc: 'Binary classifier: p = σ(Xw+b). Minimises cross-entropy (log loss).' },
    { name: 'Sigmoid',           type: 'function',desc: 'σ(z) = 1/(1+e^{-z}). Maps real logit to [0,1] probability.' },
    { name: 'Log loss',          type: 'keyword', desc: '−[y·log(p) + (1−y)·log(1−p)]. Classification loss; drives the model toward confident correct predictions.' },
    { name: 'Decision boundary', type: 'keyword', desc: 'Xw + b = 0. Points where predicted probability is 0.5.' },
    { name: 'Regularisation',    type: 'keyword', desc: 'L1 (sparse weights) or L2 (small weights) added to loss to reduce overfitting.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Linear Regression',
      points: [
        'Model: ŷ = w₁x₁ + w₂x₂ + … + b = Xw + b. Learns weights w and bias b to predict a continuous output.',
        'Loss: Mean Squared Error (MSE) = (1/n) Σ(yᵢ − ŷᵢ)². Differentiable — ideal for gradient descent.',
        'OLS closed form: w = (X^T X)^{-1} X^T y. Exact solution in O(n·d²); impractical for millions of features.',
        'Multiple regression: one output, multiple inputs. Polynomial regression adds x², x³ as new features — still a linear model in the parameters.',
        'Assumptions: linearity, independence, homoscedasticity (constant variance), normality of residuals. Violated assumptions lead to unreliable p-values (for inference), though predictions may still be useful.',
      ],
    },
    {
      heading: 'Logistic Regression',
      points: [
        'Model: p(y=1|x) = σ(Xw + b) where σ is the sigmoid function. Outputs a probability in [0,1].',
        'Sigmoid σ(z) = 1/(1+e^{-z}): maps logit z to probability. Decision: if p ≥ 0.5, predict class 1.',
        'Loss: Binary Cross-Entropy = −(1/n) Σ[yᵢ log(pᵢ) + (1−yᵢ) log(1−pᵢ)]. No closed form — must use gradient descent.',
        'Multi-class: Softmax regression replaces sigmoid with softmax; one weight vector per class.',
        'Despite the name, logistic regression is a classification algorithm, not a regression algorithm.',
      ],
    },
    {
      heading: 'Gradient Descent Training',
      points: [
        'For linear regression: ∂MSE/∂w = (2/n)·X^T(Xw−y). Update: w = w − lr · gradient.',
        'For logistic regression: ∂CE/∂w = (1/n)·X^T(p−y) where p is the sigmoid output. Update same form.',
        'Mini-batch SGD: compute gradient on a random batch of 32–256 samples. Noisy but fast; the noise helps escape local minima.',
        'Convergence criteria: loss stops decreasing, gradient norm < ε, or fixed epoch count.',
        'Feature scaling is critical: unscaled features cause elongated loss landscapes where gradient descent converges slowly.',
      ],
    },
    {
      heading: 'Regularisation',
      points: [
        'L2 (Ridge): add λ·||w||² to the loss. Gradient adds λw to each update — all weights shrink toward zero proportionally.',
        'L1 (Lasso): add λ·||w||₁. Produces sparse solutions (many exactly zero) — effective feature selection.',
        'ElasticNet: combine L1 + L2. Best of both worlds when features are correlated.',
        'The regularisation strength λ is a hyperparameter tuned on the validation set. Higher λ → more regularisation → simpler model.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Linear Regression',
      language: 'typescript',
      code: `// Linear regression with gradient descent
class LinearRegression {
  w: number[];
  b = 0;

  constructor(private nFeatures: number, private lr = 0.01, private epochs = 1000) {
    this.w = new Array(nFeatures).fill(0);
  }

  predict(X: number[][]): number[] {
    return X.map(x => x.reduce((s, v, i) => s + v * this.w[i], this.b));
  }

  fit(X: number[][], y: number[]): void {
    const n = X.length;
    for (let epoch = 0; epoch < this.epochs; epoch++) {
      const yPred = this.predict(X);
      const errors = yPred.map((p, i) => p - y[i]);

      // Gradient: (2/n) * X^T * errors
      const dw = this.w.map((_, j) =>
        (2 / n) * errors.reduce((s, e, i) => s + X[i][j] * e, 0)
      );
      const db = (2 / n) * errors.reduce((s, e) => s + e, 0);

      this.w = this.w.map((v, j) => v - this.lr * dw[j]);
      this.b -= this.lr * db;
    }
  }

  r2Score(X: number[][], y: number[]): number {
    const yPred = this.predict(X);
    const mean = y.reduce((s, v) => s + v, 0) / y.length;
    const sst = y.reduce((s, v) => s + (v - mean) ** 2, 0);
    const sse = y.reduce((s, v, i) => s + (v - yPred[i]) ** 2, 0);
    return 1 - sse / sst;
  }
}`,
    },
    {
      label: 'Logistic Regression',
      language: 'typescript',
      code: `// Logistic regression with gradient descent
class LogisticRegression {
  w: number[];
  b = 0;

  constructor(private nFeatures: number, private lr = 0.01, private epochs = 1000) {
    this.w = new Array(nFeatures).fill(0);
  }

  private sigmoid(z: number): number {
    return 1 / (1 + Math.exp(-z));
  }

  predictProba(X: number[][]): number[] {
    return X.map(x => this.sigmoid(x.reduce((s, v, i) => s + v * this.w[i], this.b)));
  }

  predict(X: number[][]): number[] {
    return this.predictProba(X).map(p => p >= 0.5 ? 1 : 0);
  }

  fit(X: number[][], y: number[]): void {
    const n = X.length;
    for (let epoch = 0; epoch < this.epochs; epoch++) {
      const probs = this.predictProba(X);
      const errors = probs.map((p, i) => p - y[i]);  // p - y

      // Gradient: (1/n) * X^T * (p - y)
      const dw = this.w.map((_, j) =>
        errors.reduce((s, e, i) => s + X[i][j] * e, 0) / n
      );
      const db = errors.reduce((s, e) => s + e, 0) / n;

      this.w = this.w.map((v, j) => v - this.lr * dw[j]);
      this.b -= this.lr * db;
    }
  }

  logLoss(X: number[][], y: number[]): number {
    const probs = this.predictProba(X);
    const eps = 1e-15;
    return -probs.reduce((s, p, i) =>
      s + y[i] * Math.log(p + eps) + (1 - y[i]) * Math.log(1 - p + eps), 0
    ) / X.length;
  }
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Not scaling features before linear/logistic regression',
      wrong: `// Feature 1: age [20-80], Feature 2: income [10k-500k]
// Gradient descent takes tiny steps on income, huge steps on age
model.fit(X, y);  // slow convergence, poor performance`,
      right: `// StandardScaler: (x - mean) / std for each feature
const scaled = scaler.fit_transform(X);
model.fit(scaled, y);  // balanced gradient steps`,
      explanation: 'Features on very different scales cause gradient descent to zigzag. StandardScaler (zero mean, unit variance) or MinMaxScaler should be applied before training.',
    },
    {
      title: 'Using MSE loss for classification',
      wrong: `// MSE for binary classification — wrong loss function
const loss = mse(yTrue, yPred);  // doesn't penalise confident wrong predictions strongly`,
      right: `// Binary cross-entropy for classification
const loss = binaryCrossEntropy(yTrue, yPred);  // −[y·log(p)+(1−y)·log(1−p)]`,
      explanation: 'MSE applied to classification produces weak gradients near 0 and 1 (sigmoid saturation). Cross-entropy is the correct loss — it strongly penalises confident wrong predictions.',
    },
    {
      title: 'Interpreting logistic regression coefficients as probabilities',
      wrong: `// "The coefficient for age is 0.5 — so age increases probability by 50%"
// WRONG: coefficients are log-odds, not probabilities`,
      right: `// Coefficient = change in log-odds per unit increase in feature
// To convert: odds_ratio = exp(coefficient)
// odds_ratio 1.6 means 60% higher odds, not 60% higher probability`,
      explanation: 'Logistic regression coefficients are in log-odds space. The effect on probability is non-linear and depends on the current value. Use exp(coef) for the odds ratio.',
    },
    {
      title: 'Setting threshold at 0.5 regardless of class imbalance',
      wrong: `const predictions = probs.map(p => p >= 0.5 ? 1 : 0);  // assumes balanced classes`,
      right: `// Tune threshold on validation set to optimise the metric you care about
// For rare events (fraud, disease), lower threshold → more recall
const predictions = probs.map(p => p >= 0.3 ? 1 : 0);`,
      explanation: 'The 0.5 threshold is only optimal when classes are balanced and false positives and false negatives have equal costs. Tune the threshold using a precision-recall curve on validation data.',
    },
  ];

  challenge: Challenge = {
    title: 'Logistic Regression Gradient Step',
    language: 'typescript',
    description: 'Implement a single gradient descent update step for logistic regression. Given inputs X (n×d), labels y (n), current weights w (d), bias b, and learning rate lr, return updated w and b.',
    hints: [
      'Compute predictions: p = sigmoid(X·w + b)',
      'Compute errors: e = p - y',
      'Gradient for w: (1/n) * X^T · e',
      'Gradient for b: mean(e)',
    ],
    starterCode: `function sigmoid(z: number): number { return 1 / (1 + Math.exp(-z)); }

function gradientStep(
  X: number[][], y: number[],
  w: number[], b: number, lr: number
): { w: number[]; b: number } {
  // Return updated weights and bias after one gradient step
}`,
    solution: `function sigmoid(z: number): number { return 1 / (1 + Math.exp(-z)); }

function gradientStep(
  X: number[][], y: number[],
  w: number[], b: number, lr: number
): { w: number[]; b: number } {
  const n = X.length;
  // Predictions
  const probs = X.map(x => sigmoid(x.reduce((s, v, i) => s + v * w[i], b)));
  // Errors
  const errors = probs.map((p, i) => p - y[i]);
  // Gradients
  const dw = w.map((_, j) =>
    errors.reduce((s, e, i) => s + X[i][j] * e, 0) / n
  );
  const db = errors.reduce((s, e) => s + e, 0) / n;
  return {
    w: w.map((v, j) => v - lr * dw[j]),
    b: b - lr * db,
  };
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does the sigmoid function output in logistic regression?',
      options: [
        'A class label (0 or 1)',
        'A probability between 0 and 1',
        'A loss value',
        'A normalised feature',
      ],
      answer: 1,
      explanation: 'Sigmoid maps any real number to [0,1], interpreting the output as P(y=1|x). The decision is then made by applying a threshold (default 0.5).',
    },
    {
      q: 'Which loss function should you use for binary classification?',
      options: ['Mean Squared Error (MSE)', 'Binary Cross-Entropy', 'Mean Absolute Error', 'Huber Loss'],
      answer: 1,
      explanation: 'Binary cross-entropy −[y·log(p)+(1−y)·log(1−p)] is correct for classification. It strongly penalises confident wrong predictions and provides good gradient signal through the sigmoid.',
    },
    {
      q: 'What does L1 (Lasso) regularisation do to model weights?',
      options: [
        'Doubles all weights',
        'Pushes many weights to exactly zero — produces sparse models',
        'Pushes all weights to a small constant',
        'Has no effect on weights',
      ],
      answer: 1,
      explanation: 'L1 regularisation adds λ·||w||₁ to the loss. Its gradient has a kink at zero that creates a sparsity-inducing effect — many weights go to exactly 0, effectively doing feature selection.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use logistic regression instead of a more complex model?',
      a: 'Use logistic regression as a first baseline — it trains fast, is interpretable (coefficients = feature importance), and works well when the decision boundary is approximately linear. It is also the right choice in regulated industries where model explainability is required. Move to tree-based models or neural networks only when logistic regression\'s accuracy is insufficient.',
    },
    {
      q: 'What is the difference between L1 and L2 regularisation in practice?',
      a: 'L2 (Ridge): all coefficients shrink proportionally but rarely reach zero. Best when you believe most features are relevant. L1 (Lasso): many coefficients become exactly zero — automatic feature selection. Best when you suspect most features are irrelevant. ElasticNet combines both and is robust when features are correlated. Tune the regularisation strength λ with cross-validation.',
    },
    {
      q: 'Why can\'t you use the OLS closed form for logistic regression?',
      a: 'The OLS closed form w = (X^T X)^{-1} X^T y works for linear regression because MSE loss is a quadratic function with a unique global minimum derivable analytically. Logistic regression\'s cross-entropy loss is a non-linear function of the weights (due to the sigmoid); there is no closed-form solution — gradient descent (or Newton\'s method) is required.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Linear regression predicts continuous values (MSE loss, OLS or GD); logistic regression predicts class probabilities (sigmoid + cross-entropy loss). Scale features, tune threshold, regularise to prevent overfitting.',
    mustKnow: [
      'Linear: ŷ = Xw+b, minimise MSE. OLS exact or gradient descent.',
      'Logistic: p = σ(Xw+b), minimise binary cross-entropy',
      'Sigmoid maps logit → [0,1] probability',
      'Decision boundary at Xw+b=0 (probability=0.5)',
      'L1 → sparse weights; L2 → small weights. Both prevent overfitting.',
      'Always scale features before gradient-based training',
    ],
    interviewFocus: [
      'Why cross-entropy and not MSE for classification?',
      'L1 vs L2 regularisation — which produces sparse weights?',
      'How does logistic regression handle multi-class problems?',
    ],
  };
}
