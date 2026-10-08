import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-ai-sqrt-dk-scaling',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './sqrt-dk-scaling.html',
  styleUrl: './sqrt-dk-scaling.scss'
})
export class SqrtDkScalingSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Simulated in Node",
      "points": [
        "Query and key components drawn from N(0, 1). The standard deviation of q·k was 2.02 for d_k = 4, 8.03 for d_k = 64 and 22.45 for d_k = 512 — matching sqrt(d_k) = 2, 8 and 22.6.",
        "With d_k = 64 and 10 keys, the largest softmax weight averaged 0.859 without scaling: attention nearly always picks one key.",
        "Dividing the scores by 8 brought the average largest weight down to 0.317, so attention stays spread over several keys and gradients reach all of them.",
        "This is the variance argument behind the page's mistake block, now backed by numbers."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Simulate",
      "language": "typescript",
      "code": "const g = () => Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random());\nconst q = Array.from({ length: 64 }, g);\nconst scores = Array.from({ length: 10 }, () =>\n  Array.from({ length: 64 }, g).reduce((s, v, i) => s + v * q[i], 0));\n\nMath.max(...softmax(scores));                 // ~0.86 on average\nMath.max(...softmax(scores.map(s => s / 8))); // ~0.32 on average"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "A model doubles its head size from d_k = 64 to 256 but keeps dividing by 8. What happens to the score spread?",
    "hint": "sqrt(256) = 16.",
    "solution": "Unscaled scores now have std about 16, so dividing by 8 leaves std about 2 instead of 1. Softmax becomes more peaked again. Dividing by sqrt(256) = 16 restores unit variance."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "The scaling is just a convention with little effect.",
      "reality": "It changed the typical top attention weight from 0.86 to 0.32 for d_k = 64."
    },
    {
      "thought": "Larger heads need less scaling.",
      "reality": "They need more: the spread grows with sqrt(d_k)."
    }
  ];
}
