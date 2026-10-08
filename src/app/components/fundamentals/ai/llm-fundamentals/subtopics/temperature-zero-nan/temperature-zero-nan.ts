import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-ai-temperature-zero-nan',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './temperature-zero-nan.html',
  styleUrl: './temperature-zero-nan.scss'
})
export class TemperatureZeroNanSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Run on the page's functions",
      "points": [
        "softmax([2, 1, 0], 0) divided each logit by 0, giving Infinity, Infinity and NaN. The max was Infinity, Infinity minus Infinity is NaN, and every probability came out NaN.",
        "topPSample([2, 1, 0], 0, 0.9) then returned index 2 — the logit 0, the least likely token. With NaN probabilities no comparison succeeds, so the code fell through to its last-element fallback.",
        "Greedy decoding should return index 0 (logit 2). The fixed softmax treats temperature 0 as argmax and returns a one-hot distribution.",
        "After the fix, topPSample([2, 1, 0], 0, 0.9) returns 0 and topPSample([0, 3, 1], 0, 0.9) returns 1."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "The fix",
      "language": "typescript",
      "code": "function softmax(logits: number[], temperature: number): number[] {\n  if (temperature <= 0) {                       // greedy\n    const best = logits.indexOf(Math.max(...logits));\n    return logits.map((_, i) => (i === best ? 1 : 0));\n  }\n  const scaled = logits.map(l => l / temperature);\n  const max = Math.max(...scaled);\n  const exps = scaled.map(v => Math.exp(v - max));\n  const sum = exps.reduce((a, b) => a + b, 0);\n  return exps.map(e => e / sum);\n}"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "Before the fix, would a very small temperature such as 0.0001 also have failed?",
    "hint": "Is 2 / 0.0001 a finite number?",
    "solution": "No. The scaled logits are 20000, 10000 and 0, all finite. After subtracting the max, the exponents are 0, -10000 and -20000, giving probabilities 1, 0 and 0. Only exactly 0 (or a negative temperature) breaks it."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "Temperature 0 is just a very cold temperature in the same formula.",
      "reality": "The formula divides by T; at exactly 0 it must be replaced by argmax."
    },
    {
      "thought": "If the code falls back to the last element, the result is still reasonable.",
      "reality": "Here the fallback picked the least likely token."
    }
  ];
}
