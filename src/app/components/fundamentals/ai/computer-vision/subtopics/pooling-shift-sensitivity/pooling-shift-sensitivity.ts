import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-ai-pooling-shift-sensitivity',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './pooling-shift-sensitivity.html',
  styleUrl: './pooling-shift-sensitivity.scss'
})
export class PoolingShiftSensitivitySubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Run on the page's maxPool (2x2, stride 2)",
      "points": [
        "Input rows <code>[0,0,1,1,0,0,0,0]</code> pooled to <code>[0,1,0,0]</code>. Shifted right by one pixel, <code>[0,0,0,1,1,0,0,0]</code> pooled to <code>[0,1,1,0]</code> — a different pattern, not a shifted one.",
        "A single bright pixel at position 3 pooled to <code>[0,1,0,0]</code>; at position 4 it pooled to <code>[0,0,1,0]</code>. Moving one input pixel moved the output by a whole cell.",
        "With stride 2, only shifts by an even number of pixels line up with the pooling grid, so small odd shifts change outputs. This is aliasing from subsampling.",
        "Pooling gives some tolerance to tiny local changes, but CNNs get most of their robustness to position from data augmentation. The theory bullet now says so."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Shift test",
      "language": "typescript",
      "code": "const row = [0, 0, 1, 1, 0, 0, 0, 0];\nconst A = [row, row, row, row];\nconst B = A.map(r => [0, ...r.slice(0, 7)]);   // shift right by 1\n\nconsole.log(maxPool(A)[0]); // [0, 1, 0, 0]\nconsole.log(maxPool(B)[0]); // [0, 1, 1, 0]  - different, not shifted"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "Would a shift of two pixels to the right give a pooled output that is simply the original shifted by one cell?",
    "hint": "Stride 2 means the pooling windows start every 2 pixels.",
    "solution": "Yes (away from the borders). A two-pixel shift moves every value into the matching position of the next window, so the 2x2 stride-2 output shifts by exactly one cell. Only shifts that are multiples of the stride preserve the structure."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "Max pooling makes a CNN translation invariant.",
      "reality": "A one-pixel shift changed the output pattern here."
    },
    {
      "thought": "If pooling is shift-sensitive, CNNs cannot handle moved objects.",
      "reality": "They learn tolerance from varied training data (augmentation), not from pooling alone."
    }
  ];
}
