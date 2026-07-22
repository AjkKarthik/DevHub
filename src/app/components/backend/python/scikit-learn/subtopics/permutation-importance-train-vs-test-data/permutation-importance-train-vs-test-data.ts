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
  templateUrl: './permutation-importance-train-vs-test-data.html',
  styleUrl: './permutation-importance-train-vs-test-data.scss'
})
export class PermutationImportanceTrainVsTestDataSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Which dataset you pass to permutation_importance changes what the numbers actually mean',
      points: [
        'The main page\'s own code example calls permutation_importance(clf, X_test, y_test, ...) — correctly using the test set — but never explains why that choice matters, or what would happen with X_train, y_train instead. scikit-learn\'s own permutation importance user guide addresses this directly: "Permutation importances can be computed either on the training set or on a held-out testing or validation set." Both are valid calls the function accepts without complaint — but they answer genuinely different questions.',
        'The documented reasoning for preferring the held-out set: "Using a held-out set makes it possible to highlight which features contribute the most to the generalization power of the inspected model." Test-set permutation importance measures which features the model relies on for predictions that generalize to genuinely new data — the property most people actually care about when asking "which features matter."',
        'The documented warning about the alternative: "Features that are important on the training set but not on the held-out set might cause the model to overfit." A feature the model has overfit to — essentially memorized specific noise patterns in the training data for — can score as highly "important" when permutation_importance is run on that same training data, since shuffling it disrupts the exact memorized patterns the model latched onto. That same feature can score near-zero importance on the test set, since those memorized patterns never applied to unseen data in the first place.',
      ]
    },
    {
      heading: 'A concrete illustration: a random, meaningless feature can look important on training data alone',
      points: [
        'scikit-learn\'s own example gallery (a companion piece to the user guide\'s prose) demonstrates this concretely: a purely random, uninformative feature added to a dataset can receive a noticeably non-zero, seemingly meaningful importance score when permutation_importance runs on the training set — specifically because a sufficiently flexible model (like an unconstrained RandomForest) has enough capacity to fit to that feature\'s incidental noise patterns in the training data, patterns that permutation genuinely disrupts when shuffled.',
        'That same random feature, evaluated with permutation_importance on the test set instead, correctly scores at or near zero importance — since the noise pattern the model fit to in training never had any relationship to the (independently generated) noise in the test set, so shuffling that feature in the test data has no meaningful effect on test predictions either way.',
        'The practical takeaway: a feature importance report is only trustworthy as a "what does this model actually rely on for real predictions" answer when computed on data the model was never fit on. Running permutation_importance on training data can still be diagnostically useful — a LARGE gap between a feature\'s training-set importance and its test-set importance is itself a signal of overfitting specifically attributable to that feature — but the training-set number alone should never be reported or trusted as "feature importance" without the test-set comparison alongside it.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A random, meaningless feature scores high importance on training data only',
      language: 'typescript',
      code: `from sklearn.ensemble import RandomForestClassifier
from sklearn.inspection import permutation_importance
from sklearn.model_selection import train_test_split
from sklearn.datasets import load_breast_cancer
import numpy as np

X, y = load_breast_cancer(return_X_y=True)
rng = np.random.default_rng(42)

# Add a completely random, meaningless feature -- it has NO real
# relationship to y at all, by construction.
random_feature = rng.normal(size=(X.shape[0], 1))
X_with_noise = np.hstack([X, random_feature])

X_train, X_test, y_train, y_test = train_test_split(
    X_with_noise, y, test_size=0.3, random_state=42
)

# A flexible, unconstrained model has enough capacity to fit to
# incidental patterns in the random feature within the training data.
clf = RandomForestClassifier(n_estimators=200, random_state=42)
clf.fit(X_train, y_train)

# Permutation importance ON TRAINING DATA:
perm_train = permutation_importance(
    clf, X_train, y_train, n_repeats=10, random_state=42
)
print(f"Random feature importance (TRAIN): "
      f"{perm_train.importances_mean[-1]:.4f}")
# A noticeably non-zero value -- the model DID fit to something in
# this feature's training-set noise, and shuffling it measurably
# disrupts the model's (memorized) training-set predictions.`,
    },
    {
      label: 'The same feature, evaluated on test data, correctly shows near-zero importance',
      language: 'typescript',
      code: `# ...continuing from the same fitted 'clf' and data split above:

# Permutation importance ON THE HELD-OUT TEST SET:
perm_test = permutation_importance(
    clf, X_test, y_test, n_repeats=10, random_state=42
)
print(f"Random feature importance (TEST):  "
      f"{perm_test.importances_mean[-1]:.4f}")
# Near zero (and its confidence interval typically straddles zero)
# -- shuffling this feature in NEVER-SEEN data has essentially no
# effect, correctly reflecting that it has no genuine predictive
# relationship to y at all.

# The gap between the two numbers is itself diagnostic:
gap = perm_train.importances_mean[-1] - perm_test.importances_mean[-1]
print(f"Train-vs-test importance gap for the random feature: {gap:.4f}")
# A LARGE gap here is a signal that the model overfit specifically
# to this feature -- exactly the pattern scikit-learn's own docs
# describe: "Features that are important on the training set but
# not on the held-out set might cause the model to overfit."
# Reporting ONLY the training-set number, without this comparison,
# would have presented a meaningless feature as genuinely important.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A model report states "feature X is the third most important predictor" based on permutation_importance(model, X_train, y_train, ...) run once, right after training, before a test set was even set aside. A stakeholder later asks why feature X, despite this ranking, never seems to actually move the model\'s live predictions in production. Explain what might be going on, using what this subtopic covers, and describe the check that should have been run before publishing the report.',
    hint: 'What does permutation importance actually measure when it is run on the SAME data the model was trained on — the model\'s genuine reliance on a feature for predictions on new data, or something else? What comparison would this subtopic\'s theory recommend running before trusting a training-set-only importance ranking?',
    solution: 'The likely explanation is that feature X\'s apparent importance is a training-set overfitting artifact rather than a genuine predictive signal — per this subtopic\'s theory, scikit-learn\'s own documentation explicitly warns that "features that are important on the training set but not on the held-out set might cause the model to overfit," meaning a feature scoring highly on TRAINING-data permutation importance can reflect the model having fit to that feature\'s incidental, non-generalizing patterns in the specific training data used, rather than any real relationship the feature has to the target in general. Since permutation_importance was run only on X_train/y_train — the exact data the model was fit on — shuffling feature X disrupted whatever memorized pattern the model latched onto during training, producing a real-looking importance score. But that memorized pattern, by definition, does not exist in genuinely new production data, which is exactly why the stakeholder observes feature X having no real effect on live predictions: the importance score measured something specific to the training data\'s own noise, not the model\'s actual generalizing behavior. The check that should have been run before publishing is the direct train-versus-test comparison this subtopic\'s own code example demonstrates: compute permutation_importance separately on a genuinely held-out test set (data the model never saw during fitting) and compare the two rankings. A feature that scores highly on train but near-zero on test — exactly the gap pattern in this subtopic\'s second code example — should be flagged as a likely overfitting artifact rather than reported as a genuinely important predictor, and scikit-learn\'s own docs frame precisely this comparison as the intended, documented way to catch it before it reaches a report or a stakeholder.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'permutation_importance(model, X, y, ...) measures a fixed, objective property of which features the model relies on — the choice of whether X/y is the training set or the test set is a minor implementation detail that should not meaningfully change the result.',
      reality: 'This subtopic\'s theory and first code example show the choice is not minor at all — scikit-learn\'s own documentation states training-set and test-set permutation importance can answer genuinely different questions, and a feature can show a real, non-trivial importance score on training data specifically because the model overfit to that feature\'s incidental patterns, while showing near-zero importance on test data where those patterns never applied.'
    },
    {
      thought: 'Since permutation_importance is typically demonstrated (including on this hub\'s own main page) using the test set, computing it on training data instead is simply an invalid or incorrect use of the function that scikit-learn would reject or warn about.',
      reality: 'This subtopic\'s theory shows scikit-learn\'s own docs explicitly describe BOTH training-set and test-set permutation importance as valid, supported use cases with different purposes — the function itself accepts either without complaint or warning; the responsibility for choosing the appropriate one based on what question is being asked (and interpreting a training-set-only result cautiously) falls entirely on the person calling it.'
    },
    {
      thought: 'A large gap between a feature\'s training-set importance and its test-set importance is just statistical noise from having a smaller test set, not a meaningful signal worth investigating.',
      reality: 'This subtopic\'s second code example and exercise show scikit-learn\'s own documentation frames this gap as a specific, meaningful diagnostic for overfitting — "features that are important on the training set but not on the held-out set might cause the model to overfit" — making the train-vs-test importance comparison itself a deliberate, recommended check, not something to dismiss as sampling noise.'
    }
  ];
}
