import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-ai-l1-soft-threshold',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './l1-soft-threshold.html',
  styleUrl: './l1-soft-threshold.scss'
})
export class L1SoftThresholdSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Simulated in Node",
      "points": [
        "The L1 penalty has gradient +λ or -λ everywhere except 0: the same pull however small the weight. L2's gradient 2λw shrinks with the weight, so the pull fades near zero.",
        "At zero the L1 penalty has a corner (its subgradient is the whole range -λ..λ). A weight stays at exactly 0 whenever the data gradient is smaller than λ.",
        "Fitting 200 samples with 10 features where only 2 matter (y = 3 x0 - 2 x1 + noise) by proximal gradient: L1 with λ = 0.1 gave 8 weights of exactly 0 and kept roughly 2.9 and -1.9 for the real ones.",
        "L2 with the same λ gave no zeros: the 8 irrelevant weights ended between -0.054 and 0.089."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Soft threshold step",
      "language": "typescript",
      "code": "// after an ordinary gradient step on the data loss:\nw = w.map(v => Math.sign(v) * Math.max(Math.abs(v) - lr * lambda, 0)); // L1\n\n// L2 instead shrinks proportionally and never reaches 0:\nw = w.map(v => v / (1 + 2 * lr * lambda));"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "After a gradient step a weight is 0.003, with lr = 0.05 and λ = 0.1. What does the L1 soft-threshold step return, and what does the L2 shrink step return?",
    "hint": "lr times λ is 0.005.",
    "solution": "L1: |0.003| - 0.005 is negative, so the weight becomes exactly 0. L2: 0.003 / (1 + 0.01) is about 0.00297, small but not zero."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "L1 makes the gradient zero near zero.",
      "reality": "Its pull is constant (λ); exact zeros come from that constant pull plus the corner at 0."
    },
    {
      "thought": "L2 also makes weights exactly zero with a big enough λ.",
      "reality": "It only scales them down; they approach zero but do not reach it."
    }
  ];
}
