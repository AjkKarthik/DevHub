import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-ai-odds-ratio-to-probability',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './odds-ratio-to-probability.html',
  styleUrl: './odds-ratio-to-probability.scss'
})
export class OddsRatioToProbabilitySubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Computed in Node",
      "points": [
        "exp(0.5) = 1.6487, so a coefficient of 0.5 multiplies the odds by about 1.65 per unit of the feature. The mistake block now says 1.65 and 65%, matching the QnA.",
        "From a baseline probability of 0.1 the new probability is 0.155. From 0.5 it is 0.622. From 0.9 it is 0.937.",
        "The same coefficient therefore adds 5.5, 12.2 or 3.7 percentage points depending on the starting point — the effect on probability is largest near 0.5."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Odds to probability",
      "language": "typescript",
      "code": "const coef = 0.5;\nconst oddsRatio = Math.exp(coef); // 1.6487\n\nfunction after(p0: number) {\n  const odds = (p0 / (1 - p0)) * oddsRatio;\n  return odds / (1 + odds);\n}\n[0.1, 0.5, 0.9].forEach(p => console.log(p, after(p).toFixed(3)));\n// 0.1 -> 0.155, 0.5 -> 0.622, 0.9 -> 0.937"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "A churn model has coefficient -0.7 for \"has a support contract\". Describe the effect for a customer whose baseline churn probability is 0.5.",
    "hint": "exp(-0.7) is about 0.50.",
    "solution": "The odds are roughly halved (odds ratio 0.50). At p = 0.5 the odds go from 1 to 0.5, so the probability falls to 0.5 / 1.5, about 0.33."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "A coefficient of 0.5 raises the probability by 50%.",
      "reality": "It multiplies the odds by 1.65; the probability change depends on the baseline."
    },
    {
      "thought": "Odds and probability are the same thing.",
      "reality": "Odds are p / (1 - p); at p = 0.5 the odds are 1."
    }
  ];
}
