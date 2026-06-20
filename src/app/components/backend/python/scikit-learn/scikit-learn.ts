import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../components/shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../../components/shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../../components/shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../components/shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../../components/shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../../components/shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../../components/shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../../components/shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../../components/shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../../components/shared/page-complete/page-complete';

@Component({
  selector: 'app-python-scikit-learn',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './scikit-learn.html',
  styleUrl: './scikit-learn.scss'
})
export class PythonScikitLearn {
  readingTime = 25; difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'; since = 'scikit-learn 1.3+';
  route = 'py-scikit-learn'; nextRoute = '/python/pytest'; nextLabel = 'Testing with pytest';

  quickRef: QuickRefItem[] = [
    { name: 'estimator.fit(X, y)', type: 'method', desc: 'Train the model. X is feature matrix (n_samples, n_features); y is target array (n_samples,).' },
    { name: 'estimator.predict(X)', type: 'method', desc: 'Predict classes or regression values. predict_proba(X) returns class probabilities.' },
    { name: 'train_test_split(X, y)', type: 'function', desc: 'Split dataset. test_size=0.2, random_state=42 for reproducibility, stratify=y for class balance.' },
    { name: 'Pipeline([("name", step)])', type: 'class', desc: 'Chain transforms + estimator. Prevents data leakage. pipe.fit(X_train).predict(X_test).' },
    { name: 'cross_val_score(est, X, y)', type: 'function', desc: 'K-fold cross-validation. cv=5, scoring="accuracy"/"f1"/"r2". Returns array of fold scores.' },
    { name: 'GridSearchCV(est, param_grid)', type: 'class', desc: 'Exhaustive hyperparameter search. best_estimator_, best_params_, best_score_ after fit.' },
    { name: 'classification_report(y_true, y_pred)', type: 'function', desc: 'Precision, recall, F1, support per class. Most useful classification metric summary.' },
    { name: 'StandardScaler / MinMaxScaler', type: 'class', desc: 'Feature normalisation. Fit on training data only; transform both train and test. In Pipeline.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Estimator API — fit, predict, transform',
      points: [
        'scikit-learn uses a consistent API for all models: fit(X, y) trains the model; predict(X) for classification/regression; transform(X) for preprocessing; fit_transform(X) combines both. This consistency means you can swap one classifier for another with a single line change.',
        'Feature matrix X has shape (n_samples, n_features). Target y has shape (n_samples,) for single-output or (n_samples, n_outputs) for multi-output. All values must be numeric — encode categorical variables with OrdinalEncoder or OneHotEncoder. Impute missing values with SimpleImputer before fitting.',
        'Supervised learning: Classification (predict a class label) — LogisticRegression, RandomForestClassifier, SVC, GradientBoostingClassifier. Regression (predict a continuous value) — LinearRegression, RandomForestRegressor, Ridge, SVR. Unsupervised learning: KMeans, DBSCAN for clustering; PCA for dimensionality reduction.',
        'Hyperparameters vs parameters: parameters are learned from data (model weights). Hyperparameters are set before training (n_estimators=100, max_depth=5). Use cross-validation + GridSearchCV or RandomizedSearchCV to find optimal hyperparameters. Never tune on the test set.',
      ]
    },
    {
      heading: 'Pipeline — Preventing Data Leakage',
      points: [
        'Pipeline chains transforms + estimator: pipe = Pipeline([("impute", SimpleImputer()), ("scale", StandardScaler()), ("model", LogisticRegression())]). Calling pipe.fit(X_train, y_train) applies each step in sequence — fitting on train only. pipe.predict(X_test) transforms test data through the fitted steps before prediction.',
        'Data leakage occurs when information from the test set contaminates the training process. The most common mistake: fit StandardScaler on the entire dataset, then split. The scaler\'s mean and std include test data — the model has indirectly "seen" the test set. Pipeline prevents this by fitting transforms only on training data.',
        'make_pipeline(*steps) is the shorthand that auto-names steps. ColumnTransformer applies different transformers to different columns: numeric columns → StandardScaler; categorical columns → OneHotEncoder. Combined in a Pipeline: Pipeline([(\"preprocess\", col_transformer), (\"model\", RandomForestClassifier())]).',
        'Custom transformers implement fit(X, y=None) → self and transform(X) → X_transformed. Inherit from BaseEstimator and TransformerMixin to get get_params/set_params and fit_transform for free. This makes custom steps work inside pipelines and GridSearchCV.',
      ]
    },
    {
      heading: 'Model Evaluation and Cross-Validation',
      points: [
        'Never evaluate on training data — it gives optimistically biased results. Always split into train/test with train_test_split. Better: use cross_val_score which performs K-fold cross-validation (default 5 folds) — more robust estimate of generalisation performance than a single split.',
        'Metrics for classification: accuracy (fraction correct — misleading for imbalanced classes), precision (positive predictions correct), recall (actual positives found), F1 (harmonic mean of precision and recall), ROC-AUC (area under ROC curve — threshold-independent). classification_report() shows all of these.',
        'Metrics for regression: MAE (mean absolute error — in original units, robust to outliers), MSE/RMSE (mean squared error — penalises large errors), R² (proportion of variance explained — 1.0 is perfect, 0 is baseline). Use mean_squared_error with squared=False for RMSE.',
        'Overfitting vs underfitting: overfitting = high train score, low test score (too complex). Underfitting = low train and test scores (too simple). Fix overfitting: more data, regularisation (Ridge/Lasso), less complex model (reduce max_depth). Fix underfitting: more features, more complex model, reduce regularisation.',
      ]
    },
    {
      heading: 'GridSearchCV and Feature Importance',
      points: [
        'GridSearchCV exhaustively searches a hyperparameter grid with cross-validation. param_grid = {"model__n_estimators": [50, 100], "model__max_depth": [3, 5]}. Note the double underscore prefix (model__) for pipeline step parameters. gs.best_estimator_ is refitted on the whole training set with the best hyperparameters.',
        'RandomizedSearchCV samples a fixed number of parameter combinations (n_iter=50) from distributions — faster than grid search for large hyperparameter spaces. Use scipy.stats.randint(1, 100) for random integers, uniform(0.01, 1) for floats.',
        'Feature importance: tree-based models have feature_importances_ attribute (impurity-based importance). Use permutation_importance() from sklearn for a more reliable estimate: it measures how much accuracy drops when a feature is shuffled. SHAP (SHapley Additive exPlanations) gives the most accurate feature attribution.',
        'Learning curves: plot_learning_curve shows how training and validation scores change with training set size. If train score >> val score: overfitting — get more data or reduce complexity. If both are low: underfitting — get more features or increase complexity.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Pipeline & evaluation',
      language: 'typescript',
      code: `from sklearn.pipeline import Pipeline, make_pipeline
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
import numpy as np

# --- Dataset ---
from sklearn.datasets import load_breast_cancer
X, y = load_breast_cancer(return_X_y=True)

# --- Train/test split ---
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# --- Pipeline: no data leakage ---
pipe = Pipeline([
    ("impute", SimpleImputer(strategy="median")),
    ("scale", StandardScaler()),
    ("model", LogisticRegression(max_iter=1000, C=1.0)),
])

pipe.fit(X_train, y_train)
y_pred = pipe.predict(X_test)
y_proba = pipe.predict_proba(X_test)[:, 1]

print(classification_report(y_test, y_pred, target_names=["malignant", "benign"]))
print(f"ROC-AUC: {roc_auc_score(y_test, y_proba):.3f}")

# --- Cross-validation ---
cv_scores = cross_val_score(pipe, X, y, cv=5, scoring="f1")
print(f"CV F1: {cv_scores.mean():.3f} ± {cv_scores.std():.3f}")

# --- GridSearchCV ---
param_grid = {
    "model__C": [0.01, 0.1, 1, 10],
    "model__penalty": ["l1", "l2"],
    "model__solver": ["liblinear"],
}

gs = GridSearchCV(pipe, param_grid, cv=5, scoring="roc_auc", n_jobs=-1)
gs.fit(X_train, y_train)
print("Best params:", gs.best_params_)
print("Best AUC:", gs.best_score_)`
    },
    {
      label: 'Mixed features & feature importance',
      language: 'typescript',
      code: `from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.inspection import permutation_importance
from sklearn.model_selection import train_test_split
import numpy as np

# Example: mixed numeric + categorical features
import pandas as pd
df = pd.DataFrame({
    "age": [25, 35, np.nan, 45, 28, 52],
    "salary": [50000, 80000, 75000, 120000, 55000, 90000],
    "department": ["eng", "sales", "eng", "mgmt", "eng", "sales"],
    "promoted": [0, 1, 1, 1, 0, 1],
})

X = df.drop("promoted", axis=1)
y = df["promoted"].values
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.33, random_state=0)

# Separate transformers per column type
numeric_features = ["age", "salary"]
categorical_features = ["department"]

numeric_transformer = Pipeline([
    ("imputer", SimpleImputer(strategy="mean")),
    ("scaler", StandardScaler()),
])
categorical_transformer = Pipeline([
    ("imputer", SimpleImputer(strategy="constant", fill_value="unknown")),
    ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
])

preprocessor = ColumnTransformer([
    ("num", numeric_transformer, numeric_features),
    ("cat", categorical_transformer, categorical_features),
])

# Full pipeline
clf = Pipeline([
    ("prep", preprocessor),
    ("model", RandomForestClassifier(n_estimators=100, random_state=42)),
])
clf.fit(X_train, y_train)
print(f"Accuracy: {clf.score(X_test, y_test):.2f}")

# Feature importance via permutation
perm = permutation_importance(clf, X_test, y_test, n_repeats=10, random_state=42)
feature_names = numeric_features + clf.named_steps["prep"].named_transformers_["cat"].named_steps["onehot"].get_feature_names_out(categorical_features).tolist()
for name, imp in sorted(zip(feature_names, perm.importances_mean), key=lambda x: -x[1]):
    print(f"{name}: {imp:.4f}")`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Fitting the scaler on the entire dataset before splitting',
      wrong: `scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)   # uses ALL data including test!
X_train, X_test, y_train, y_test = train_test_split(X_scaled, y)`,
      right: `X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
# Fit scaler only on train, transform both:
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)   # NOT fit_transform!
# Or use Pipeline which handles this automatically`,
      explanation: 'Fitting the scaler on all data leaks test statistics (mean, std) into training — the model has indirectly "seen" the test set via the normalisation parameters. This makes test metrics optimistically biased. Always fit preprocessors on training data only. Pipeline handles this automatically and is the recommended approach.'
    },
    {
      title: 'Using accuracy for imbalanced classification',
      wrong: `y_pred = model.predict(X_test)
score = accuracy_score(y_test, y_pred)   # 99% accuracy on 99% negative class = useless!`,
      right: `from sklearn.metrics import classification_report, roc_auc_score
print(classification_report(y_test, y_pred))
print(f"ROC-AUC: {roc_auc_score(y_test, model.predict_proba(X_test)[:,1]):.3f}")
# Also consider: f1_score, precision_score, recall_score with average="macro"/"weighted"`,
      explanation: 'A model that always predicts the majority class achieves high accuracy on imbalanced data. Precision, recall, F1, and ROC-AUC are more informative for imbalanced problems. For rare-event detection (fraud, disease), recall (sensitivity) is often the most important metric — missing a positive is worse than a false alarm.'
    },
    {
      title: 'Tuning hyperparameters on the test set',
      wrong: `# Try different C values, check test score, pick best
for C in [0.01, 0.1, 1, 10]:
    model.set_params(model__C=C).fit(X_train, y_train)
    score = model.score(X_test, y_test)   # leaks test info!`,
      right: `from sklearn.model_selection import GridSearchCV
gs = GridSearchCV(model, {"model__C": [0.01, 0.1, 1, 10]}, cv=5, scoring="f1")
gs.fit(X_train, y_train)   # tunes on train with cross-validation only
final_score = gs.score(X_test, y_test)   # evaluate best model on test ONCE`,
      explanation: 'Repeatedly evaluating on the test set to pick hyperparameters causes test set overfitting — you optimise for one particular test split. Use cross-validation (GridSearchCV or RandomizedSearchCV) on the training set to pick hyperparameters. Then evaluate the final best model on the test set exactly once.'
    },
    {
      title: 'Not using stratify=y in train_test_split for classification',
      wrong: `X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)
# With 5% positive class: test might have 1% or 10% — random`,
      right: `X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2,
                                                    random_state=42, stratify=y)
# Ensures 5% positive class in both train and test`,
      explanation: 'Without stratify=y, random splitting may produce a test set with a very different class distribution than the training set — especially with imbalanced classes and small test sizes. stratify=y ensures each split has the same proportion of each class as the original dataset. Use stratify=y whenever you have a classification problem.'
    },
  ];

  challenge: Challenge = {
    title: 'Titanic Classifier Pipeline',
    language: 'typescript',
    description: 'Build a scikit-learn Pipeline for Titanic survival prediction. Features: Pclass (int), Sex (str), Age (float with NaN), SibSp (int), Fare (float). Use ColumnTransformer to: (a) impute+scale numeric features; (b) encode Sex with OneHotEncoder. Train a RandomForestClassifier. Use 5-fold CV to report mean F1. Use GridSearchCV to tune n_estimators=[50,100,200] and max_depth=[3,5,None].',
    hints: [
      'ColumnTransformer([(\"num\", num_pipe, num_cols), (\"cat\", cat_pipe, cat_cols)])',
      'cross_val_score(pipe, X_train, y_train, cv=5, scoring="f1")',
      'GridSearchCV param_grid keys: "model__n_estimators", "model__max_depth"',
    ],
    starterCode: `from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_score, GridSearchCV, train_test_split

def build_titanic_pipeline() -> Pipeline:
    pass`,
    solution: `from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_score, GridSearchCV, train_test_split
from sklearn.metrics import classification_report
import numpy as np

def build_titanic_pipeline() -> Pipeline:
    num_features = ["Pclass", "Age", "SibSp", "Fare"]
    cat_features = ["Sex"]

    num_pipe = Pipeline([
        ("impute", SimpleImputer(strategy="median")),
        ("scale", StandardScaler()),
    ])
    cat_pipe = Pipeline([
        ("impute", SimpleImputer(strategy="most_frequent")),
        ("encode", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
    ])
    preprocessor = ColumnTransformer([
        ("num", num_pipe, num_features),
        ("cat", cat_pipe, cat_features),
    ])
    return Pipeline([
        ("prep", preprocessor),
        ("model", RandomForestClassifier(n_estimators=100, random_state=42)),
    ])

# Usage (with a titanic df):
# pipe = build_titanic_pipeline()
# X_train, X_test, y_train, y_test = train_test_split(X, y, stratify=y, random_state=42)
# cv_scores = cross_val_score(pipe, X_train, y_train, cv=5, scoring="f1")
# print(f"CV F1: {cv_scores.mean():.3f}")
# param_grid = {"model__n_estimators":[50,100,200],"model__max_depth":[3,5,None]}
# gs = GridSearchCV(pipe, param_grid, cv=5, scoring="f1", n_jobs=-1)
# gs.fit(X_train, y_train); print(gs.best_params_)`
  };

  quiz: QuizQuestion[] = [
    { q: 'Why must you use fit_transform(X_train) but only transform(X_test)?', options: ['fit_transform is faster for large datasets', 'Fitting on test data leaks statistics into preprocessing — causing overly optimistic test scores', 'transform() and fit_transform() produce different outputs', 'X_test cannot be fitted'], answer: 1, explanation: 'fit() computes statistics (mean, std for StandardScaler; vocabulary for OneHotEncoder) from the data. If you fit on test data, those statistics influence the preprocessing of training data via the scaler — the model has indirectly "seen" the test set. Always fit on training data only, then apply (transform) to both train and test.' },
    { q: 'What is the purpose of Pipeline in scikit-learn?', options: ['To speed up training', 'To chain preprocessing and model into one object, preventing data leakage and simplifying cross-validation', 'To run steps in parallel', 'To automatically select the best algorithm'], answer: 1, explanation: 'Pipeline chains transforms + estimator. When cross-validating, Pipeline ensures preprocessing is fitted only on the training fold — not on validation data. This prevents data leakage. It also simplifies code: one pipe.fit(X_train) trains everything; one pipe.predict(X_test) preprocesses and predicts.' },
    { q: 'What does cross_val_score(estimator, X, y, cv=5) return?', options: ['The best hyperparameters', 'An array of 5 scores — one per cross-validation fold', 'The mean score only', 'The fitted estimator'], answer: 1, explanation: 'cross_val_score splits the data into 5 folds, trains on 4 and evaluates on 1, repeating for each fold. It returns an array of 5 scores. Take .mean() for the overall performance estimate and .std() for variance. This is more reliable than a single train/test split because it averages over multiple validation sets.' },
    { q: 'Why is ROC-AUC preferred over accuracy for imbalanced classification?', options: ['ROC-AUC is always higher than accuracy', 'ROC-AUC measures the model\'s ability to distinguish classes regardless of threshold; accuracy rewards majority class prediction', 'ROC-AUC is easier to compute', 'ROC-AUC only works with binary classification'], answer: 1, explanation: 'On a 99% negative class dataset, always predicting negative gives 99% accuracy. ROC-AUC measures the area under the Receiver Operating Characteristic curve — how well the model separates classes at any threshold. A random classifier has AUC=0.5; perfect classifier has AUC=1.0. AUC is threshold-independent and meaningful even when classes are highly imbalanced.' },
  ];

  qna: QnaItem[] = [
    { q: 'What is the difference between GridSearchCV and RandomizedSearchCV?', a: 'GridSearchCV exhaustively searches all combinations in param_grid. For 4 parameters with 5 values each: 5^4 = 625 combinations × 5 CV folds = 3125 fits. It finds the globally best grid combination but is slow for large grids. RandomizedSearchCV samples n_iter random combinations from param distributions (scipy.stats distributions). n_iter=50 × 5 folds = 250 fits — ~12× faster. Empirically, RandomizedSearchCV finds comparable results: most hyperparameter spaces have large plateau regions where random search covers them efficiently.' },
    { q: 'What is the difference between feature importance from RandomForest and permutation importance?', a: 'RandomForest\'s feature_importances_ is based on impurity reduction (Gini/entropy): how much each feature reduces node impurity across trees. It is biased towards high-cardinality features (many unique values) and correlated features (one absorbs the other\'s importance). Permutation importance (permutation_importance()) measures the decrease in performance when a feature is randomly shuffled. It is model-agnostic, works on any fitted estimator, and correctly handles correlated features. SHAP (SHApley values) is the most accurate but computationally expensive.' },
    { q: 'How do you handle class imbalance in scikit-learn?', a: 'Options: (1) class_weight="balanced" on classifiers (LogisticRegression, RandomForestClassifier) — automatically weights minority class higher. (2) Resampling: oversample minority (SMOTE from imbalanced-learn), undersample majority (RandomUnderSampler). (3) Threshold tuning: predict_proba(X) and choose a threshold that balances precision/recall for your use case. (4) Use a metric that handles imbalance: F1, precision, recall, ROC-AUC instead of accuracy. Never use accuracy as the primary metric for imbalanced problems.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Use Pipeline to prevent data leakage; GridSearchCV for hyperparameter tuning on cross-validation only; use F1/ROC-AUC not accuracy for classification evaluation.',
    mustKnow: [
      'Pipeline = preprocessors + estimator. Prevents data leakage in CV.',
      'fit on train, transform both train and test. Never fit on test data.',
      'cross_val_score returns K fold scores — mean ± std for reliable estimate.',
      'GridSearchCV tunes on training data only — evaluate final model on test ONCE.',
      'stratify=y in train_test_split for balanced class splits.',
      'ROC-AUC and F1 > accuracy for imbalanced classification.',
    ],
    interviewFocus: [
      'What is data leakage and how does Pipeline prevent it?',
      'When would you use RandomizedSearchCV over GridSearchCV?',
      'Why is accuracy misleading for imbalanced datasets?',
    ]
  };
}
