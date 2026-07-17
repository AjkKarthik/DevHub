import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './cv-integer-auto-selects-stratifiedkfold.html',
  styleUrl: './cv-integer-auto-selects-stratifiedkfold.scss'
})
export class CvIntegerAutoSelectsStratifiedkfoldSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'cv=5 does not mean "plain 5-fold" — it means "whatever fold strategy fits the estimator"',
      points: [
        'The main page\'s own theory describes cross_val_score(est, X, y, cv=5) as performing "K-fold cross-validation (default 5 folds)" and its own code passes stratify=y to train_test_split as a separate, explicit step — implying that stratification is something you have to opt into by hand. scikit-learn\'s own cross-validation guide describes cv=5 doing more automatically than that framing suggests.',
        'scikit-learn\'s own documentation states it directly: "When the cv argument is an integer, cross_val_score uses the KFold or StratifiedKFold strategies by default, the latter being used if the estimator derives from ClassifierMixin." Passing a plain integer to cv is not a request for literal, unstratified KFold — it is a request for "the appropriate default splitter," and which splitter that is depends on what kind of estimator was passed in.',
        'The exact documented condition is whether the estimator is recognized as a classifier (via ClassifierMixin, the same check sklearn.base.is_classifier() performs) combined with y being binary or multiclass. A LogisticRegression or RandomForestClassifier wrapped in cross_val_score(..., cv=5) silently gets StratifiedKFold\'s class-balance-preserving splits; a LinearRegression or RandomForestRegressor with the identical cv=5 argument gets plain KFold instead, with no stratification concept applying at all to a continuous target.',
      ]
    },
    {
      heading: 'This applies identically to GridSearchCV — and it changes what "no stratify=y" actually means',
      points: [
        'Since GridSearchCV, cross_validate, and every other scikit-learn tool accepting an integer cv argument routes through the same internal splitter-selection utility, this behavior is not unique to cross_val_score — the main page\'s own GridSearchCV examples (param_grid, cv=5) benefit from the identical automatic StratifiedKFold selection for its classification tasks, without that being spelled out anywhere in the call itself.',
        'This reframes what the main page\'s own advice about stratify=y actually covers: stratify=y on train_test_split governs ONE single split (the initial train/test division) and genuinely does need to be passed explicitly, since train_test_split has no concept of "the estimator" to infer stratification from — but any cv=integer argument passed later to cross_val_score or GridSearchCV on a classifier already gets equivalent per-fold class-balance preservation automatically, with no separate stratify parameter to remember for THAT part of the workflow.',
        'The practical consequence worth knowing precisely: someone auditing a pipeline for "did we forget stratification anywhere" needs to check train_test_split calls explicitly (since those never auto-stratify), but does NOT need to worry about GridSearchCV(cv=5) or cross_val_score(cv=5) on a classifier silently producing unstratified folds — that part is already handled, by default, as long as an integer (not a manually-constructed KFold object) was passed.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The same cv=5 argument silently picks a different splitter per estimator type',
      language: 'typescript',
      code: `from sklearn.model_selection import cross_val_score, StratifiedKFold, KFold
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.datasets import load_breast_cancer, load_diabetes

# --- Classification: cv=5 silently uses StratifiedKFold ---
X_clf, y_clf = load_breast_cancer(return_X_y=True)
clf = LogisticRegression(max_iter=1000)

scores_int = cross_val_score(clf, X_clf, y_clf, cv=5)
# Per sklearn's own docs: since LogisticRegression derives from
# ClassifierMixin and y_clf is binary, this is EQUIVALENT to:
scores_explicit = cross_val_score(
    clf, X_clf, y_clf, cv=StratifiedKFold(n_splits=5)
)
# scores_int and scores_explicit are identical, fold-for-fold --
# cv=5 was never "plain KFold" for this classifier at all.

# --- Regression: the identical cv=5 argument uses plain KFold ---
X_reg, y_reg = load_diabetes(return_X_y=True)
reg = LinearRegression()

scores_reg = cross_val_score(reg, X_reg, y_reg, cv=5)
# Here, cv=5 IS equivalent to plain KFold(n_splits=5) -- there is
# no class balance concept for a continuous target, so
# StratifiedKFold was never a candidate for this estimator at all.
scores_reg_explicit = cross_val_score(
    reg, X_reg, y_reg, cv=KFold(n_splits=5)
)
# Same scores_reg either way -- confirming which splitter cv=5
# actually resolved to, purely based on estimator type.`,
    },
    {
      label: 'GridSearchCV inherits the identical automatic behavior',
      language: 'typescript',
      code: `from sklearn.model_selection import GridSearchCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import load_breast_cancer

X, y = load_breast_cancer(return_X_y=True)

# No stratify= parameter exists on GridSearchCV at all -- yet its
# cv=5 argument still resolves to StratifiedKFold automatically,
# via the exact same estimator-type check cross_val_score uses.
gs = GridSearchCV(
    RandomForestClassifier(random_state=42),
    param_grid={"n_estimators": [50, 100], "max_depth": [3, 5]},
    cv=5,   # StratifiedKFold, silently, because the estimator is a
             # classifier and y is binary -- confirmed identical to
             # passing cv=StratifiedKFold(n_splits=5) explicitly.
)
gs.fit(X, y)

# Contrast: train_test_split has NO estimator to inspect, so it
# genuinely never auto-stratifies -- stratify=y must be passed
# explicitly there, and only there, for equivalent protection:
from sklearn.model_selection import train_test_split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y   # required here
)`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate reviewing a scikit-learn pipeline flags every train_test_split call missing stratify=y as a bug, and separately flags cross_val_score(clf, X, y, cv=5) — where clf is a LogisticRegression and y is a binary target — as "also missing stratification, since there\'s no stratify parameter here either." Explain whether the second flag is actually a real issue, using what this subtopic covers.',
    hint: 'Does cross_val_score even have a stratify parameter to pass? What does scikit-learn\'s own documented behavior say happens to a plain integer cv=5 argument specifically when the estimator is a classifier and y is binary?',
    solution: 'The second flag is not a real issue — cross_val_score(clf, X, y, cv=5) already gets stratified folds automatically, with nothing missing. Per this subtopic\'s theory, scikit-learn\'s own cross-validation documentation states that when cv is passed as an integer, cross_val_score uses StratifiedKFold specifically "if the estimator derives from ClassifierMixin" — which LogisticRegression does — combined with y being binary or multiclass, which it is here. This is exactly why cross_val_score has no separate stratify parameter at all: unlike train_test_split, which has no way to inspect "what kind of estimator will eventually use this split" and therefore requires stratify=y to be passed explicitly, cross_val_score DOES receive the estimator directly as its first argument, so it can (and per its own documented default behavior, does) automatically choose StratifiedKFold over plain KFold based on that estimator\'s type. The teammate\'s first flag (missing stratify=y on train_test_split calls) is a legitimate concern, since that specific function genuinely never auto-stratifies under any circumstance. But treating the absence of a stratify parameter on cross_val_score as equivalent negligence conflates two different APIs with two different, documented default behaviors — one requires an explicit opt-in because it has no estimator to inspect, the other performs the equivalent protection automatically because it does.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Passing an integer to the cv parameter (cv=5) in cross_val_score or GridSearchCV always means plain, unstratified K-fold splitting — stratification is something that only happens if you explicitly pass a StratifiedKFold object instead.',
      reality: 'This subtopic\'s theory and first code example show scikit-learn\'s own documentation states the opposite as the default behavior — cv=5 automatically resolves to StratifiedKFold whenever the estimator derives from ClassifierMixin and the target is binary/multiclass, silently matching what an explicitly-constructed StratifiedKFold(n_splits=5) would produce, with plain KFold only used as the fallback for regressors or other non-classifier estimators.'
    },
    {
      thought: 'Since GridSearchCV has no stratify= parameter (unlike train_test_split), a classifier tuned with GridSearchCV(clf, param_grid, cv=5) risks unstratified folds unless a StratifiedKFold object is passed explicitly.',
      reality: 'This subtopic\'s second code example shows GridSearchCV routes through the exact same automatic splitter-selection logic as cross_val_score — a plain integer cv=5 argument already resolves to StratifiedKFold for a classifier with a binary/multiclass target, with no separate stratify parameter needed or available, because the automatic detection makes one unnecessary for this specific API.'
    },
    {
      thought: 'The lack of a stratify parameter on cross_val_score/GridSearchCV, contrasted with train_test_split requiring an explicit stratify=y, is an inconsistency in scikit-learn\'s API design that a careful pipeline audit should flag as a gap.',
      reality: 'This subtopic\'s exercise shows this apparent inconsistency reflects a genuine, documented difference in capability rather than an oversight — train_test_split has no estimator argument to inspect and therefore cannot auto-detect whether stratification is appropriate, while cross_val_score and GridSearchCV DO receive the estimator directly and use that information to automatically select the correct splitter, making an explicit stratify parameter unnecessary for those two APIs specifically.'
    }
  ];
}
