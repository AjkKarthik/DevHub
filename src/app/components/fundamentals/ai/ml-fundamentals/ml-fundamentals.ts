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
  selector: 'app-ai-ml-fundamentals',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            CommonMistakesComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './ml-fundamentals.html',
  styleUrl: './ml-fundamentals.scss',
})
export class AiMlFundamentals {
  quickRef: QuickRefItem[] = [
    { name: 'Supervised learning',   type: 'keyword', desc: 'Learn f(X)=y from labelled examples. Predict output for new X.' },
    { name: 'Unsupervised learning', type: 'keyword', desc: 'Find structure in unlabelled data — clusters, embeddings, anomalies.' },
    { name: 'Reinforcement learning',type: 'keyword', desc: 'Agent maximises cumulative reward via trial-and-error in an environment.' },
    { name: 'Train / val / test',    type: 'syntax',  desc: 'Train on train set, tune hyperparameters on val, report final metrics on test.' },
    { name: 'Bias-variance',         type: 'keyword', desc: 'High bias = underfitting. High variance = overfitting. Balance both.' },
    { name: 'Loss function',         type: 'function',desc: 'Measures error between prediction and label. MSE for regression, cross-entropy for classification.' },
    { name: 'Gradient descent',      type: 'function',desc: 'Iteratively update weights in the direction that reduces loss: w -= lr * gradient.' },
    { name: 'Regularisation',        type: 'keyword', desc: 'L1 (Lasso) or L2 (Ridge) penalties added to loss to reduce overfitting.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'The Three Types of Machine Learning',
      points: [
        'Supervised learning: the model learns from (input X, label y) pairs to predict y for unseen X. Examples: spam detection, house price prediction.',
        'Unsupervised learning: no labels — the model finds patterns. Examples: k-means clustering, PCA, autoencoders for anomaly detection.',
        'Reinforcement learning: an agent takes actions in an environment, receives rewards, and learns a policy to maximise cumulative reward. Examples: game-playing AI, robotics.',
        'Semi-supervised and self-supervised (e.g. GPT pre-training) sit between supervised and unsupervised — huge unlabelled corpus + small labelled set or generated labels.',
      ],
    },
    {
      heading: 'The Machine Learning Workflow',
      points: [
        '1. Define the problem: classification, regression, clustering, or generation? What is the evaluation metric?',
        '2. Collect and clean data: handle missing values, outliers, class imbalance. Data quality determines model ceiling.',
        '3. Feature engineering: transform raw data into informative numeric features the model can use.',
        '4. Choose and train a model: start simple (linear model), then add complexity only if needed.',
        '5. Evaluate on held-out test set: accuracy, F1, AUC, RMSE — match metric to business goal.',
        '6. Deploy and monitor: model performance degrades over time due to data drift — retrain periodically.',
      ],
    },
    {
      heading: 'Bias-Variance Trade-off',
      points: [
        'Total error = Bias² + Variance + Irreducible Noise.',
        'High bias (underfitting): model too simple — misses real patterns. Fix: more complex model, more features.',
        'High variance (overfitting): model memorises training data, poor generalisation. Fix: more data, regularisation, dropout, simpler model.',
        'Train/val/test split: train on 70-80%, tune on val 10-15%, report final metric only once on test. Never touch test set during development.',
        'K-fold cross-validation: rotate which fold is val — gives a better estimate of generalisation error with limited data.',
      ],
    },
    {
      heading: 'Loss Functions and Optimisation',
      points: [
        'Mean Squared Error (MSE): average of squared differences — regression. Sensitive to outliers.',
        'Cross-entropy loss: for classification — measures divergence between predicted probability distribution and true distribution.',
        'Gradient descent: compute gradient of loss w.r.t. each weight (via backpropagation), then step in the negative gradient direction.',
        'Learning rate: too large → oscillates and diverges. Too small → very slow. Use adaptive optimisers (Adam) or learning rate schedules.',
        'Mini-batch SGD: process small random batches. Good noise helps escape local minima; full batch is stable but slow.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'sklearn Workflow',
      language: 'typescript',
      code: `// Python equivalent shown as pseudocode comments
// from sklearn.model_selection import train_test_split
// from sklearn.preprocessing import StandardScaler
// from sklearn.linear_model import LogisticRegression
// from sklearn.metrics import accuracy_score, classification_report

// Step 1 — split
// X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

// Step 2 — scale features (many models need this)
// scaler = StandardScaler()
// X_train = scaler.fit_transform(X_train)  // fit only on train!
// X_test  = scaler.transform(X_test)       // use same params on test

// Step 3 — train
// model = LogisticRegression()
// model.fit(X_train, y_train)

// Step 4 — evaluate
// y_pred = model.predict(X_test)
// print(accuracy_score(y_test, y_pred))
// print(classification_report(y_test, y_pred))

// TypeScript analogy — structured ML pipeline
function trainTestSplit<T>(data: T[], labels: number[], testRatio = 0.2) {
  const n = data.length;
  const testN = Math.floor(n * testRatio);
  const indices = Array.from({length: n}, (_, i) => i).sort(() => Math.random() - 0.5);
  const testIdx  = new Set(indices.slice(0, testN));
  const trainData  = data.filter((_, i) => !testIdx.has(i));
  const testData   = data.filter((_, i) =>  testIdx.has(i));
  const trainLabels = labels.filter((_, i) => !testIdx.has(i));
  const testLabels  = labels.filter((_, i) =>  testIdx.has(i));
  return { trainData, testData, trainLabels, testLabels };
}`,
    },
    {
      label: 'Gradient Descent',
      language: 'typescript',
      code: `// Gradient descent for simple linear regression y = mx + b
function gradientDescent(
  X: number[], y: number[],
  lr = 0.01, epochs = 1000
): { m: number; b: number } {
  let m = 0, b = 0;
  const n = X.length;

  for (let e = 0; e < epochs; e++) {
    // Predictions
    const yPred = X.map(x => m * x + b);

    // Gradients (partial derivatives of MSE w.r.t. m and b)
    const dm = (-2 / n) * X.reduce((sum, x, i) => sum + x * (y[i] - yPred[i]), 0);
    const db = (-2 / n) * y.reduce((sum, yi, i) => sum + (yi - yPred[i]), 0);

    // Update weights
    m -= lr * dm;
    b -= lr * db;

    if (e % 100 === 0) {
      const mse = yPred.reduce((s, p, i) => s + (p - y[i]) ** 2, 0) / n;
      console.log(\`Epoch \${e}: MSE=\${mse.toFixed(4)}, m=\${m.toFixed(4)}, b=\${b.toFixed(4)}\`);
    }
  }
  return { m, b };
}

const m = gradientDescent([1,2,3,4,5], [2,4,6,8,10]);
// Should converge near m≈2, b≈0`,
    },
    {
      label: 'Evaluation Metrics',
      language: 'typescript',
      code: `// Classification metrics
function confusionMatrix(actual: number[], predicted: number[]) {
  let tp = 0, fp = 0, fn = 0, tn = 0;
  for (let i = 0; i < actual.length; i++) {
    if (actual[i] === 1 && predicted[i] === 1) tp++;
    else if (actual[i] === 0 && predicted[i] === 1) fp++;
    else if (actual[i] === 1 && predicted[i] === 0) fn++;
    else tn++;
  }
  const precision = tp / (tp + fp);
  const recall    = tp / (tp + fn);   // sensitivity
  const f1        = 2 * (precision * recall) / (precision + recall);
  const accuracy  = (tp + tn) / actual.length;
  return { precision, recall, f1, accuracy };
}

// Regression metrics
function regressionMetrics(actual: number[], predicted: number[]) {
  const n = actual.length;
  const mse  = actual.reduce((s, a, i) => s + (a - predicted[i]) ** 2, 0) / n;
  const rmse = Math.sqrt(mse);
  const mae  = actual.reduce((s, a, i) => s + Math.abs(a - predicted[i]), 0) / n;
  const mean = actual.reduce((s, a) => s + a, 0) / n;
  const sst  = actual.reduce((s, a) => s + (a - mean) ** 2, 0);
  const sse  = actual.reduce((s, a, i) => s + (a - predicted[i]) ** 2, 0);
  const r2   = 1 - sse / sst;   // 1 = perfect, 0 = mean baseline
  return { mse, rmse, mae, r2 };
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Scaling test data with test-set statistics',
      wrong: `scaler.fit_transform(X_test)  # fits on test data — data leakage!`,
      right: `scaler.fit(X_train)
X_train = scaler.transform(X_train)
X_test  = scaler.transform(X_test)  # use train-set params only`,
      explanation: 'Fitting the scaler on test data leaks future information into training. Always fit preprocessing (scalers, imputers, encoders) on the training set only, then transform both.',
    },
    {
      title: 'Evaluating on training data only',
      wrong: `model.fit(X_train, y_train)
print(model.score(X_train, y_train))  # train accuracy — useless for real performance`,
      right: `model.fit(X_train, y_train)
print(model.score(X_test, y_test))    # held-out test accuracy`,
      explanation: 'A model can memorise training data and get 100% train accuracy while failing completely on new data. Always evaluate on data the model has never seen.',
    },
    {
      title: 'Choosing accuracy as the metric for imbalanced classes',
      wrong: `# 95% of samples are class 0
# Predict class 0 always → 95% accuracy — looks great, useless model`,
      right: `# Use F1, AUC-ROC, or precision/recall for imbalanced datasets
# F1 balances precision and recall — catches the minority class`,
      explanation: 'Accuracy is misleading for imbalanced data. A model predicting only the majority class achieves high accuracy but fails its real purpose. Use F1, AUC-ROC, or class-weighted metrics.',
    },
    {
      title: 'Confusing validation loss with test performance',
      wrong: `# Tune hyperparameters, check test set after each trial
# Then report the best test accuracy — overfitted to the test set`,
      right: `# Tune on val set only. Touch test set ONCE at the very end.
# Report test performance as the final number.`,
      explanation: 'Repeatedly checking the test set while tuning effectively trains on it. Reserve the test set for a single final evaluation.',
    },
    {
      title: 'Setting the learning rate too high',
      wrong: `optimizer = SGD(learning_rate=1.0)  # loss oscillates, diverges`,
      right: `optimizer = Adam(learning_rate=0.001)  # adaptive, sensible default
# Or use a learning rate schedule that decays over time`,
      explanation: 'A learning rate that is too large causes the optimiser to overshoot the minimum and diverge. Start with Adam at 1e-3 and tune if needed.',
    },
  ];

  challenge: Challenge = {
    title: 'K-Nearest Neighbours Classifier',
    language: 'typescript',
    description: 'Implement a simple KNN classifier that predicts the class of a point by majority vote among its k nearest training points (using Euclidean distance).',
    hints: [
      'Compute Euclidean distance from the query to every training point',
      'Sort by distance and take the k smallest',
      'Return the most common label among those k neighbours',
    ],
    starterCode: `function knnClassify(
  trainX: number[][], trainY: number[],
  queryX: number[], k: number
): number {
  // Return the predicted label for queryX
}`,
    solution: `function knnClassify(
  trainX: number[][], trainY: number[],
  queryX: number[], k: number
): number {
  const distances = trainX.map((point, i) => ({
    dist: Math.sqrt(point.reduce((s, v, d) => s + (v - queryX[d]) ** 2, 0)),
    label: trainY[i],
  }));
  distances.sort((a, b) => a.dist - b.dist);
  const kNearest = distances.slice(0, k);
  const votes: Record<number, number> = {};
  for (const { label } of kNearest) votes[label] = (votes[label] ?? 0) + 1;
  return +Object.entries(votes).sort((a, b) => b[1] - a[1])[0][0];
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the key difference between supervised and unsupervised learning?',
      options: [
        'Supervised uses neural networks; unsupervised uses trees',
        'Supervised learns from (input, label) pairs; unsupervised finds structure in unlabelled data',
        'Supervised is faster to train',
        'Unsupervised is only for images',
      ],
      answer: 1,
      explanation: 'Supervised learning requires labelled training examples (X, y). Unsupervised learning discovers patterns — clusters, embeddings — without labels.',
    },
    {
      q: 'Which describes high variance (overfitting)?',
      options: [
        'Low train error, high test error',
        'High train error, high test error',
        'Low train error, low test error',
        'High train error, low test error',
      ],
      answer: 0,
      explanation: 'Overfitting = model memorises training data (low train error) but fails to generalise (high test error). High variance means the model is too sensitive to training noise.',
    },
    {
      q: 'Why must preprocessing (scaling) be fit only on the training set?',
      options: [
        'Scalers are too slow to refit',
        'Fitting on test data leaks future information (data leakage)',
        'Test data has no variance',
        'All datasets are already normalised',
      ],
      answer: 1,
      explanation: 'Fitting a scaler on the test set means the model indirectly "sees" the test distribution during training — this is data leakage, inflating performance metrics.',
    },
  { q: 'What is cross-validation and why is it preferred over a single train/test split?', options: ['It trains multiple models simultaneously', 'K-fold cross-validation trains and evaluates K times, using each fold as a test set — provides a lower-variance performance estimate', 'It is only used for neural networks', 'It prevents data leakage by default'], answer: 1, explanation: 'K-fold CV: split data into K folds, train on K-1 folds, evaluate on the held-out fold, repeat K times, average scores. Gives a more reliable performance estimate than a single split (which may be lucky or unlucky). K=5 or K=10 is standard. Stratified K-fold preserves class distribution in each fold.' },
  { q: 'What is data leakage and how does it cause overly optimistic evaluation?', options: ['Leaking training data outside the organization', 'Allowing information from the test set (or future data) to influence training — inflates validation metrics', 'Using too many features', 'Using the wrong loss function'], answer: 1, explanation: 'Data leakage: target information from the future or the test set influences training. Examples: (1) Scaling features on all data before splitting; (2) Including a feature derived from the label; (3) Selecting features on all data. Fix: always split first, then fit transformers only on training data.' },
  { q: 'What is the difference between a parametric and non-parametric model?', options: ['Parametric models have no parameters', 'Parametric: fixed number of parameters independent of data size; non-parametric: complexity grows with data', 'Non-parametric models use neural networks', 'Parametric models do not generalize'], answer: 1, explanation: 'Parametric: fixed parameters regardless of n (linear regression, logistic regression, neural networks). Non-parametric: parameters grow with data (k-NN, kernel SVM, decision trees without depth limit). Non-parametric models are more flexible but can be slower and need more data.' },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use cross-validation instead of a simple train/val/test split?',
      a: 'Use k-fold cross-validation when you have limited data. It trains k models on different fold rotations and averages performance — giving a lower-variance estimate of generalisation error. With large datasets (100k+ rows), a simple 80/10/10 split is usually sufficient and much faster.',
    },
    {
      q: 'What is the difference between a parameter and a hyperparameter?',
      a: 'Parameters are learned from data during training (e.g. weights in a neural network, coefficients in linear regression). Hyperparameters are set before training and control the learning process itself (e.g. learning rate, number of hidden layers, k in KNN, regularisation strength). Hyperparameters are tuned using a validation set.',
    },
    {
      q: 'How do you handle class imbalance in a classification problem?',
      a: 'Several strategies: (1) Use appropriate metrics — F1, AUC-ROC instead of accuracy. (2) Oversample the minority class (SMOTE) or undersample the majority. (3) Use class weights in the loss function (class_weight="balanced" in sklearn). (4) Use precision/recall threshold tuning at inference. The right combination depends on the cost of false positives vs false negatives.',
    },
  { q: 'How do you handle missing data in a machine learning pipeline?', a: 'Strategies: (1) Mean/median/mode imputation (SimpleImputer): fast, can distort distributions; (2) KNN imputation: impute based on k nearest neighbours — better but slow for large datasets; (3) Multiple imputation: generate M complete datasets, train M models, average predictions; (4) Add missingness indicator feature (is_null_flag) alongside imputed value — can be informative; (5) Tree-based models (XGBoost, LightGBM) handle NaN natively. Always impute AFTER train/test split using fit only on training data.' },
  { q: 'What is the difference between accuracy, precision, recall, and F1 score?', a: 'Accuracy: correct / total — misleading for imbalanced classes. Precision: TP / (TP + FP) — of all predicted positive, how many are actually positive (important when false positives are costly). Recall: TP / (TP + FN) — of all actual positive, how many did we find (important when false negatives are costly). F1 = 2 * Precision * Recall / (P + R) — harmonic mean. Use F1 for imbalanced datasets. Macro F1 (per-class average) vs weighted F1 (by class frequency).' },
  { q: 'What is the curse of dimensionality and how does it affect ML?', a: 'In high dimensions: (1) Data becomes sparse — points are far apart, distance metrics lose meaning; (2) More data needed to fill the feature space (exponential growth); (3) Model training becomes slower; (4) Overfitting risk increases. Mitigations: dimensionality reduction (PCA, t-SNE, UMAP), feature selection, regularization, or using models robust to high dimensions (tree-based). Rule of thumb: n >> d (samples >> features) for reliable models.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Machine learning trains models to predict from data — supervised (labelled), unsupervised (unlabelled), or reinforcement (rewards). Always split data, scale only on train, and pick metrics matching the problem.',
    mustKnow: [
      'Supervised vs unsupervised vs reinforcement — different problem types',
      'Train/val/test split: fit preprocessing on train only',
      'Bias = underfitting (too simple); variance = overfitting (too complex)',
      'Loss function measures error; gradient descent minimises it',
      'L1/L2 regularisation penalises large weights to reduce overfitting',
      'Accuracy is misleading for imbalanced classes — use F1 or AUC',
    ],
    interviewFocus: [
      'Explain the bias-variance trade-off and how to fix each',
      'What is data leakage and how do you prevent it?',
      'When would you use cross-validation over a single val set?',
    ],
  };
}
