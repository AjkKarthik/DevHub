import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-ai-precision-zero-division',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './precision-zero-division.html',
  styleUrl: './precision-zero-division.scss'
})
export class PrecisionZeroDivisionSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Reproduced in Node",
      "points": [
        "With 100 samples (5 positive) and a model that predicts 0 every time, the page's function returned <code>{ precision: NaN, recall: 0, f1: NaN, accuracy: 0.95 }</code>.",
        "Precision is TP / (TP + FP). Nothing was predicted positive, so both are 0 and 0 / 0 is NaN in JavaScript.",
        "F1 then becomes NaN too, because it is computed from precision.",
        "The page now returns 0 when a denominator is 0, which matches the behaviour scikit-learn gives by default (it also prints a warning)."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Safe ratio",
      "language": "typescript",
      "code": "const ratio = (num: number, den: number) => (den === 0 ? 0 : num / den);\n\nconst precision = ratio(tp, tp + fp);\nconst recall    = ratio(tp, tp + fn);\nconst f1        = ratio(2 * precision * recall, precision + recall);\n\n// majority-class model: { precision: 0, recall: 0, f1: 0, accuracy: 0.95 }"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "A monitoring job alerts when <code>f1 &lt; 0.5</code>. The model silently starts predicting class 0 for everything. With the original function, does the alert fire?",
    "hint": "What is NaN &lt; 0.5?",
    "solution": "No. f1 is NaN, and NaN < 0.5 is false, so the alert stays quiet exactly when the model is useless. With the guarded version f1 is 0 and the alert fires."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "A useless model gets an F1 of 0 automatically.",
      "reality": "Without a guard, 0 / 0 gives NaN in JavaScript, not 0."
    },
    {
      "thought": "NaN would show up as an obvious error.",
      "reality": "It propagates quietly and makes comparisons false."
    }
  ];
}
