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
  templateUrl: './broadcasting-3-and-3-1-silently-produces-a-3x3.html',
  styleUrl: './broadcasting-3-and-3-1-silently-produces-a-3x3.scss'
})
export class Broadcasting3And31SilentlyProducesA3X3Subtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The alignment rule, traced through step by step',
      points: [
        'The main page\'s own theory states broadcasting rules in one sentence: "trailing dimensions must be equal or one of them must be 1. Shapes are aligned right-to-left." That description is accurate, but tracing it through a specific, deceptively simple pair of shapes reveals a result most people do not expect on first encounter.',
        'NumPy\'s own broadcasting documentation states the comparison mechanism precisely: "NumPy compares [shapes] element-wise. It starts with the trailing (rightmost) dimension and works its way left. Two dimensions are compatible when 1) they are equal, or 2) one of them is 1." A shorter shape is implicitly left-padded with 1s before the comparison begins.',
        'Walk a flat array of shape (3,) against a column vector of shape (3, 1) through this exact rule: (3,) is left-padded to (1, 3) to match the other\'s 2 dimensions. Comparing trailing dimensions: 3 vs. 1 — compatible, broadcasts to 3. Comparing the next dimension left: 1 vs. 3 — ALSO compatible (one of them is 1), broadcasts to 3. The result shape is (3, 3) — not (3,), not an error, and not the simple element-wise same-shape addition a developer might have assumed was happening.',
      ]
    },
    {
      heading: 'Why this specific shape pair is a genuine, common bug source',
      points: [
        'A (3, 3) result from adding a "flat array" to what looks like the "same" data reshaped is exactly the kind of silent shape mismatch that produces a wrong, but not obviously WRONG-looking, answer — the code runs without error, returns a real NumPy array, and the bug can hide for a while if nothing downstream immediately checks the shape or an obviously nonsensical value.',
        'This exact scenario is a common, real trap: a prior operation like .reshape(-1, 1), or .mean(axis=1, keepdims=True), produces a column vector of shape (N, 1) — perfectly reasonable and often intentional for THAT operation — and it later gets combined with a flat (N,) array from somewhere else in the same pipeline, under the assumption that both represent "the same N values" and should combine element-wise. Broadcasting happily obliges with a (N, N) outer-product-shaped result instead of raising the shape mismatch error a same-shape assumption would have wanted.',
        'This specific danger — "(N,) accidentally colliding with (N,1)" — is not something the official NumPy broadcasting documentation calls out by name as a named pitfall; the docs precisely describe the alignment MECHANISM (confirmed accurate above) without a dedicated warning about this particular shape collision. The practical defense is a habit, not a language feature: check .shape before combining two arrays that are each independently believed to represent "one value per row," especially any array that recently passed through a keepdims=True or reshape(-1, 1) operation.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Tracing (3,) against (3,1) through the documented alignment rule',
      language: 'typescript',
      code: `import numpy as np

flat = np.array([1, 2, 3])          # shape (3,)
column = np.array([[10], [20], [30]])  # shape (3, 1)

result = flat + column
print(result.shape)   # (3, 3) -- NOT (3,), NOT an error

print(result)
# [[11, 12, 13],
#  [21, 22, 23],
#  [31, 32, 33]]
# Every element of 'flat' was added to EVERY element of 'column' --
# an outer-product-shaped result, not the simple element-wise
# [11, 22, 33] a same-length "one value per row" addition might
# have assumed was happening.

# Tracing the documented rule manually:
#   flat   shape (3,)  -> left-padded to (1, 3)
#   column shape (3, 1)
#   compare trailing dims: 3 vs 1 -> compatible, becomes 3
#   compare next dims:     1 vs 3 -> compatible, becomes 3
#   final shape: (3, 3)
# Both steps pass the "equal, or one of them is 1" rule --
# broadcasting proceeds silently, with no error at any point.`,
    },
    {
      label: 'Where this bites in practice: a reshape(-1, 1) meeting a flat array later',
      language: 'typescript',
      code: `import numpy as np

scores = np.array([80, 90, 70])   # shape (3,) -- three students' scores

# Compute each student's deviation from their own row mean --
# intentionally reshaped to a column vector for a DIFFERENT,
# correct broadcasting purpose (subtracting from a 2D matrix):
matrix = np.array([[80, 85], [90, 95], [70, 75]])   # shape (3, 2)
row_means = matrix.mean(axis=1, keepdims=True)        # shape (3, 1) -- intentional!
deviations = matrix - row_means   # (3,2) - (3,1) -> (3,2), CORRECT use

# Later in the same pipeline, someone reuses 'row_means' assuming
# it is just "the three mean values, one per student" -- forgetting
# it is still shape (3, 1), not (3,):
bonus_flat = np.array([5, 10, 2])   # shape (3,) -- intended per-student bonus

adjusted = row_means + bonus_flat
print(adjusted.shape)   # (3, 3) -- SILENT bug! Every mean got added
                          # to every bonus, producing 9 values instead
                          # of the 3 intended per-student totals.

# THE FIX: flatten the column vector back to (3,) before combining
# with another (3,) array, when a true same-shape addition is meant:
row_means_flat = row_means.ravel()   # or row_means[:, 0] -- shape (3,)
adjusted_correct = row_means_flat + bonus_flat
print(adjusted_correct.shape)   # (3,) -- the intended, per-student result`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A function computes per-row averages with row_avg = data.mean(axis=1, keepdims=True) (data has shape (100, 5), so row_avg ends up shape (100, 1)). Later, the function does normalized = data - row_avg, expecting each of the 100 rows to have its own row average subtracted from its 5 values. The result normalized has shape (100, 5), which looks correct at a glance — but a teammate flags that using a DIFFERENT flat array in place of row_avg, like flat_avg = row_avg.ravel() (shape (100,)), silently produces something very different if subtracted from data the same way. Explain what would go wrong with data - flat_avg, using what this subtopic covers.',
    hint: 'Trace data\'s shape (100, 5) against flat_avg\'s shape (100,) through the documented right-to-left alignment rule — what does flat_avg get left-padded to, and do the resulting dimension comparisons succeed or fail?',
    solution: 'data - flat_avg would either raise a broadcasting error or (worse) silently produce a shape nobody intended, depending on the exact numbers involved — and the reason is a DIFFERENT collision than the (3,)-vs-(3,1) case, but the same underlying mechanism. Tracing it: data has shape (100, 5); flat_avg has shape (100,), which gets left-padded to (1, 100) before comparison, per the documented right-to-left alignment rule. Comparing trailing dimensions: 5 vs. 100 — NEITHER is equal NOR is either of them 1, so this specific pairing actually FAILS the broadcasting rule outright and raises a ValueError about incompatible shapes, which is arguably the "safer" outcome here since the mismatch is loud rather than silent. The original, CORRECT version — data - row_avg, using the (100, 1) shaped column vector rather than the (100,) flattened one — works precisely because keepdims=True preserved that trailing (1,) dimension: comparing data\'s trailing 5 against row_avg\'s trailing 1 succeeds (one of them is 1), and comparing the next dimensions 100 vs. 100 succeeds (equal) — broadcasting each row\'s single average across that row\'s 5 values, exactly as intended. This confirms the core lesson from this subtopic: keepdims=True is not a cosmetic detail — the extra trailing (1,) dimension it preserves is precisely what makes this specific alignment work correctly, and casually flattening it away (row_avg.ravel()) changes which dimension broadcasting tries to align against, breaking a case that happened to work by shifting it into either an outright shape error or, in a scenario with different concrete numbers, a different unintended (N, N)-style collision like the one in this subtopic\'s own worked example.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'If a flat array (shape (N,)) and a column vector (shape (N, 1)) both conceptually represent "one value per row," adding them together will always produce a simple element-wise (N,) or (N,1) result, since they are "the same length."',
      reality: 'This subtopic\'s theory and first code example show broadcasting a (3,) array against a (3,1) array produces a (3,3) result — every element of the flat array combined with every element of the column vector, an outer-product-shaped result, not a simple same-shape addition — because NumPy\'s documented alignment rule left-pads the shorter shape and compares dimension-by-dimension, with no special case for "these happen to have the same length."'
    },
    {
      thought: 'NumPy broadcasting will raise an error whenever two arrays being combined do not have genuinely compatible, intended shapes — a shape mismatch mistake is always caught immediately and loudly.',
      reality: 'This subtopic\'s theory and second code example show the opposite for this specific case — (3,) and (3,1) are fully COMPATIBLE by the documented broadcasting rules, so no error is raised at all; the operation succeeds and returns a real, valid-looking array, just not the shape or values the developer actually intended. Only shape pairs where NEITHER dimension matches AND neither is 1 (like the exercise\'s (5,) vs. (100,) trailing-dimension mismatch) trigger an actual error.'
    },
    {
      thought: 'keepdims=True on an aggregation like .mean(axis=1, keepdims=True) is a minor stylistic choice — using the resulting (N, 1) shape versus flattening it to (N,) with .ravel() afterward should not meaningfully change how later broadcasting operations behave.',
      reality: 'This subtopic\'s exercise shows keepdims=True\'s preserved trailing (1,) dimension is often load-bearing for correct broadcasting against a 2D array later in the same pipeline — flattening it away with .ravel() changes which dimension gets aligned during a later broadcast, which can silently shift a correctly-working (N,1)-vs-(N,M) combination into either an outright shape error or an unintended (N,N)-style collision.'
    }
  ];
}
