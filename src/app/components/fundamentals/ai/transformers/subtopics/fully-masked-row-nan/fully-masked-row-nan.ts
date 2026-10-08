import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-ai-fully-masked-row-nan',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './fully-masked-row-nan.html',
  styleUrl: './fully-masked-row-nan.scss'
})
export class FullyMaskedRowNanSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Run on the page's function",
      "points": [
        "With the mask row [true, true, true] for the first query, <code>scaledDotProductAttention</code> returned <code>[NaN, NaN, NaN]</code> for that row.",
        "Every score is -Infinity, so the max is -Infinity. Each exponent is exp(-Infinity - -Infinity) = exp(NaN) = NaN, and the normalised weights are NaN.",
        "A causal mask never does this: position i can always attend to itself. A key-padding mask can, for example when a padding token is used as a query.",
        "The page now warns about this in a code comment."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Reproduce and guard",
      "language": "typescript",
      "code": "const mask = [[true, true, true], [false, false, true], [false, false, false]];\nscaledDotProductAttention(X, X, X, mask)[0]; // [NaN, NaN, NaN]\n\n// Guard: use a large finite value instead of -Infinity\nif (mask[i][j]) scores[i][j] = -1e9;\n// fully masked row -> uniform weights instead of NaN (ignore it later)"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "With the -1e9 guard, what weights does a fully masked row of three positions get, and why is that harmless?",
    "hint": "All three scores are equal.",
    "solution": "All scores are -1e9, so softmax gives 1/3 to each. That row is still meaningless, but it is a finite number; as long as the loss ignores padding positions, it does not affect training, and nothing turns into NaN."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "Setting masked scores to -Infinity is always safe.",
      "reality": "It is, unless every score in a row is masked; then softmax gives NaN."
    },
    {
      "thought": "A causal mask can produce this.",
      "reality": "No: each position can always see itself. Padding masks are the risk."
    }
  ];
}
