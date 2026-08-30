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
  templateUrl: './the-quorum-quiz-had-a-second-technically-correct-answer.html',
  styleUrl: './the-quorum-quiz-had-a-second-technically-correct-answer.scss'
})
export class TheQuorumQuizHadASecondTechnicallyCorrectAnswerSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A quiz flaw catchable using nothing but the question\'s own formula',
      points: [
        'The main page\'s own quorum quiz asked "which quorum settings guarantee strong consistency?" with the answer key naming W=2, R=2 as correct, using the formula stated right there in the explanation: W + R > N. One of the WRONG-labeled options was originally "W=3, R=3." Applying the page\'s own formula: 3 + 3 = 6, and 6 > 3 (N=3) — this option ALSO satisfies the stated rule, making it a second, unacknowledged correct answer. The main page has been corrected.',
      ]
    },
    {
      heading: 'The reality: W+R>N is satisfied by more than one option, so the quiz needed a genuine wrong option',
      points: [
        'W + R > N is a THRESHOLD condition, not a single specific pair of numbers — for N=3, W=2/R=2 (sum 4) and W=3/R=3 (sum 6) BOTH clear the threshold; so do W=3/R=1, W=1/R=3, and W=3/R=2, among others. Any quiz question offering a single "correct" answer needs to make sure every OTHER option genuinely fails the formula, not just looks different from the intended answer.',
        'The fix: the flawed "W=3, R=3" option was replaced with "W=1, R=2" — which sums to 3, NOT greater than N=3, making it a genuinely incorrect option consistent with the other two (also-summing-to-3) wrong answers already in the question.',
      ]
    },
    {
      heading: 'Why checking a quiz\'s own internal logic is a distinct skill from checking prose claims',
      points: [
        'Every other correction in this hub\'s Phase 10 batches so far has involved checking a PROSE claim against an external or internal reference. This is a different, complementary check: verifying that a MULTIPLE-CHOICE QUESTION\'s own stated rule, applied mechanically to every one of its own options, produces exactly one correct answer — the same kind of check a test-writer runs before publishing an exam.',
        'This is directly reusable: any quiz question built around a numeric formula (a threshold, a ratio, a modular arithmetic rule) is worth a quick pass applying that formula to EVERY option, not just confirming the intended answer works.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Checking every option against the quiz\'s own formula',
      language: 'bash',
      code: `# The stated rule: W + R > N, with N=3

# Original quiz options and the formula applied to each:
echo "W=1, R=1: $((1+1)) > 3? $([ $((1+1)) -gt 3 ] && echo yes || echo no)"
echo "W=2, R=1: $((2+1)) > 3? $([ $((2+1)) -gt 3 ] && echo yes || echo no)"
echo "W=2, R=2: $((2+2)) > 3? $([ $((2+2)) -gt 3 ] && echo yes || echo no)"
echo "W=3, R=3: $((3+3)) > 3? $([ $((3+3)) -gt 3 ] && echo yes || echo no)"
# -> W=3, R=3 ALSO says "yes" -- the original quiz's unlabeled
#    second correct answer, now replaced with W=1, R=2 (sum 3, "no")`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'You\'re writing your own quiz question about Cassandra quorum consistency for N=5 replicas, with "W=3, R=3" as your intended correct answer. Before publishing, what should you check about your OTHER (wrong-labeled) options?',
    hint: 'Apply the same formula (W + R > N) to every option you\'re planning to label as wrong, not just to the one you intend to be correct.',
    solution: 'Check that every other option genuinely fails W + R > 5. For example, W=3, R=3 gives 6 > 5 (correct, as intended) — but a tempting-looking distractor like W=4, R=4 also gives 8 > 5, making it ALSO technically correct if included as a "wrong" option. The lesson from this subtopic\'s main-page fix applies directly: any numeric-threshold quiz question needs every non-answer option to be mechanically verified as actually failing the stated rule, not just chosen because it "looks different" from the intended answer.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A quiz question with one option marked "correct" and the rest marked "wrong" has, by construction, only one option that actually satisfies the stated rule.',
      reality: 'Per this subtopic\'s theory (a real quiz flaw corrected on the main page during this batch), that\'s not guaranteed — a threshold-based rule like W+R>N can be satisfied by multiple options, and this page\'s own quiz originally had exactly that problem.'
    },
    {
      thought: 'Verifying quiz/exam content for correctness only means checking that the labeled correct answer is actually right.',
      reality: 'Per this subtopic\'s theory, it also means checking that every OTHER option is actually wrong — a labeled-correct answer can be accurate while a labeled-wrong option is ALSO secretly correct, which is just as much of a flaw.'
    },
    {
      thought: 'W + R > N being satisfied by exactly one specific pair of numbers (like W=2, R=2 for N=3) is what makes it "the" strong-consistency configuration.',
      reality: 'Per this subtopic\'s theory, W+R>N is a threshold any sufficiently large W/R pair clears — W=2,R=2 is simply the MINIMAL pair that clears it for N=3, not the only one that does.'
    }
  ];
}
