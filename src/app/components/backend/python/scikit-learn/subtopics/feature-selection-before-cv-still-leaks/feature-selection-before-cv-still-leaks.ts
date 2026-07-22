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
  templateUrl: './feature-selection-before-cv-still-leaks.html',
  styleUrl: './feature-selection-before-cv-still-leaks.scss'
})
export class FeatureSelectionBeforeCvStillLeaksSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The leak happens before cross_val_score ever gets to split anything',
      points: [
        'The main page\'s own mistake entry covers exactly one leakage pattern: "fitting the scaler on the entire dataset before splitting." That is a real, common mistake — but scikit-learn\'s own documentation identifies a structurally different leakage source that a Pipeline wrapped ONLY around the model does not fix: feature selection or dimensionality reduction performed on the whole dataset before it is ever handed to cross_val_score or GridSearchCV.',
        'scikit-learn\'s own "Common pitfalls" guide walks through this exact scenario with SelectKBest, and states the consequence plainly: "since the feature selection step \'sees\' the test data, the model has an unfair advantage." The example is deliberately built on independently random X and y specifically to show that a leaking pipeline can still report accuracy "much higher than chance" — a model appearing to perform well purely because of the leak, not because it learned anything real.',
        'The reason wrapping only the downstream MODEL in a Pipeline does not fix this: cross_val_score\'s internal fold-splitting happens on whatever X is handed to it as an argument. If SelectKBest(k=25).fit_transform(X, y) already ran on the full X before that transformed X is passed into cross_val_score(pipe, X_selected, y, cv=5), the leak already occurred in the fit_transform call — nothing cross_val_score does internally with its own folds can undo statistics that were already computed from the full dataset one line earlier.',
      ]
    },
    {
      heading: 'The fix: every data-dependent step goes INSIDE the same Pipeline object that gets cross-validated',
      points: [
        'scikit-learn\'s own documented fix is direct: "we recommend using a Pipeline to chain together the feature selection and model estimators... The pipeline ensures that only the training data is used when performing fit." The feature selector has to be a STEP inside the pipeline object itself, not a separate operation performed before that object is ever constructed or passed anywhere.',
        'The docs extend this to cross-validation specifically: "The pipeline can also be fed into a cross-validation function such as cross_val_score... the pipeline ensures that the correct data subset and estimator method is used during fitting and predicting." Once feature selection lives inside the Pipeline, cross_val_score\'s own fold-splitting happens FIRST — each fold\'s training portion gets its own independently-fit SelectKBest, with no visibility into that fold\'s held-out validation data at all.',
        'This generalizes to every data-dependent preprocessing step the main page\'s own theory already lists for Pipeline (imputation, scaling, one-hot encoding) — the same rule applies uniformly: PCA, SelectKBest, RFE, or any other transform that computes statistics FROM the data (not just from fixed, pre-known rules) must live inside the Pipeline object that is the thing actually passed to cross_val_score/GridSearchCV, never applied as a preparatory step beforehand.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Feature selection before cross_val_score leaks, even with the model in a Pipeline',
      language: 'typescript',
      code: `from sklearn.feature_selection import SelectKBest, f_classif
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import cross_val_score
import numpy as np

# Deliberately independent random data -- X and y have NO real
# relationship, so any accuracy meaningfully above chance is a
# leakage artifact, not genuine signal (this mirrors scikit-learn's
# own "Common pitfalls" worked example).
rng = np.random.default_rng(42)
X = rng.normal(size=(100, 1000))   # 1000 candidate features
y = rng.integers(0, 2, size=100)    # random binary target

# BUG: feature selection runs on the FULL dataset, BEFORE cross_val_score
# ever sees it -- the "test" portion of every future fold already
# influenced which 25 features got selected.
X_selected = SelectKBest(f_classif, k=25).fit_transform(X, y)

# The MODEL is wrapped in a Pipeline -- but that does nothing here,
# since the leak already happened one line above.
pipe = Pipeline([("model", LogisticRegression())])
scores = cross_val_score(pipe, X_selected, y, cv=5)
print(scores.mean())
# Reports accuracy noticeably above the 0.5 chance level that X/y's
# genuine (zero) relationship should produce -- the Pipeline around
# the model provided no protection against a leak that occurred
# before cross_val_score was ever called.`,
    },
    {
      label: 'The fix: SelectKBest inside the SAME Pipeline that gets cross-validated',
      language: 'typescript',
      code: `from sklearn.feature_selection import SelectKBest, f_classif
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import cross_val_score
import numpy as np

rng = np.random.default_rng(42)
X = rng.normal(size=(100, 1000))
y = rng.integers(0, 2, size=100)

# THE FIX: SelectKBest is now a STEP inside the pipeline, not a
# preparatory operation performed before the pipeline is built.
pipe = Pipeline([
    ("select", SelectKBest(f_classif, k=25)),
    ("model", LogisticRegression()),
])

# cross_val_score's OWN fold-splitting now happens FIRST -- each
# fold's SelectKBest is fit independently on that fold's training
# portion only, with zero visibility into that fold's held-out data.
scores = cross_val_score(pipe, X, y, cv=5)   # note: raw X, not X_selected
print(scores.mean())
# Reports accuracy correctly hovering around chance (~0.5), matching
# the genuinely random relationship between X and y -- confirming
# the leak is gone once feature selection moved inside the Pipeline
# that cross_val_score actually receives and cross-validates.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A data science team\'s standard workflow is: (1) run PCA to reduce 500 features down to 20 components, fit on the entire labeled dataset once at the start of a notebook; (2) later, experiment with several different classifiers using cross_val_score(pipe, X_pca, y, cv=5), where each pipe is a fresh Pipeline containing only a StandardScaler and the classifier being tested that round. The team is confident this is leakage-free because "the model itself is always in a Pipeline." Explain why this confidence is misplaced, using what this subtopic covers.',
    hint: 'Does the PCA fit_transform step in stage (1) happen before or after cross_val_score\'s own fold-splitting in stage (2)? Does wrapping the StandardScaler and classifier in a Pipeline change anything about when the PCA statistics were computed?',
    solution: 'The team\'s confidence is misplaced because PCA is a data-dependent transformation — it computes its principal components FROM the dataset\'s own covariance structure — and per this subtopic\'s theory, running it once on the entire labeled dataset BEFORE any cross-validation splitting is exactly the same category of leak as the SelectKBest example, just with PCA in place of feature selection. The fact that each subsequent pipe in stage (2) wraps a StandardScaler and the classifier in a Pipeline changes nothing about the PCA leak, because that Pipeline only controls what happens to X_pca — it has no way to reach back in time and undo the fact that X_pca itself was already computed using information from every row in the dataset, including whatever rows will later become each fold\'s held-out validation portion. cross_val_score\'s own fold-splitting in stage (2) operates entirely on the ALREADY-leaked X_pca; by the time cross_val_score runs, the leak is baked into the data being split, and no amount of correct Pipeline usage downstream can retroactively fix it — exactly the mechanism this subtopic\'s theory describes: "the leak already happened in the fit_transform call... nothing cross_val_score does internally with its own folds can undo" it. The correct restructuring is to move PCA itself into each experimental Pipeline (Pipeline([("pca", PCA(n_components=20)), ("scale", StandardScaler()), ("model", classifier)])) and pass the RAW, unreduced X into cross_val_score every time — letting PCA refit independently within each fold\'s training portion, the same fix pattern scikit-learn\'s own docs recommend for SelectKBest.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'As long as the final model passed to cross_val_score or GridSearchCV is wrapped in a scikit-learn Pipeline, the entire workflow is protected from data leakage, regardless of what preprocessing happened to the data before it was ever passed to that function.',
      reality: 'This subtopic\'s theory and first code example show wrapping only the model does not protect against leakage introduced by an earlier, separate preprocessing step (like SelectKBest or PCA) run on the full dataset BEFORE cross_val_score is called — per scikit-learn\'s own documented pitfall, cross-validation\'s fold-splitting operates on whatever data it receives, and cannot undo a leak that already happened in an earlier fit_transform call.'
    },
    {
      thought: 'Data leakage in scikit-learn workflows is essentially one specific mistake — fitting a scaler on the full dataset before train_test_split — and avoiding that one pattern is sufficient to keep a pipeline leakage-free.',
      reality: 'This subtopic\'s theory shows scikit-learn\'s own "Common pitfalls" documentation identifies this as a DISTINCT leakage source from the classic scaler example, worked through with its own dedicated SelectKBest illustration — any data-dependent transformation (feature selection, dimensionality reduction, scaling, or otherwise) performed outside a cross-validated Pipeline is susceptible to the identical underlying problem, not just the one specific scaler scenario.'
    },
    {
      thought: 'The fix for feature-selection leakage is to make sure feature selection happens on the training set specifically, which can be done as a manual, one-time step before defining the Pipeline used for cross-validation.',
      reality: 'This subtopic\'s theory and second code example show the documented fix is more specific than "use the training set once" — the feature selector must be a STEP inside the SAME Pipeline object that cross_val_score/GridSearchCV actually receives, so it gets refit independently within EACH cross-validation fold\'s own training portion, not fit a single time on whatever one static "training set" existed before cross-validation began.'
    }
  ];
}
