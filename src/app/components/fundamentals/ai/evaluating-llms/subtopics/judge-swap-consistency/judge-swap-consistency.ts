import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-ai-judge-swap-consistency',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './judge-swap-consistency.html',
  styleUrl: './judge-swap-consistency.scss'
})
export class JudgeSwapConsistencySubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "From Zheng et al., 2023 (MT-Bench and Chatbot Arena)",
      "points": [
        "Consistency was defined as the share of pairs where the judge gives the same result when the two answers are swapped.",
        "GPT-4 was consistent in 65.0% of cases with the default prompt. It was biased toward the first answer in 30.0% and toward the second in 5.0%.",
        "GPT-3.5 was consistent in 46.2% and Claude-v1 in 23.8% under the same prompt, so the effect was larger for the weaker judges of the time.",
        "The page's pairwiseCompare already does the recommended thing: run both orders, count a win only when both agree, otherwise tie. The wording now gives the figure correctly."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Measure swap consistency",
      "language": "typescript",
      "code": "async function swapConsistency(\n  pairs: Array<{ q: string; a: string; b: string }>,\n  judge: (q: string, first: string, second: string) => Promise<'A' | 'B' | 'tie'>,\n): Promise<number> {\n  let consistent = 0;\n  for (const { q, a, b } of pairs) {\n    const r1 = await judge(q, a, b);   // a shown first\n    const r2 = await judge(q, b, a);   // b shown first\n    const same = (r1 === 'A' && r2 === 'B') || (r1 === 'B' && r2 === 'A') ||\n                 (r1 === 'tie' && r2 === 'tie');\n    if (same) consistent++;\n  }\n  return consistent / pairs.length;   // MT-Bench GPT-4: 0.65\n}"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "Your judge is swap-consistent on 60% of pairs. You compare 200 pairs. Roughly how many give a usable win/loss verdict?",
    "hint": "Inconsistent pairs become ties.",
    "solution": "About 120 (60% of 200), minus any consistent ties. The other ~80 become ties, so you need more pairs than a naive count suggests to reach the same confidence."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "A 65% preference for the first answer means the judge is close to random.",
      "reality": "65% was consistency; the first-position bias was 30% of cases."
    },
    {
      "thought": "Swapping order and averaging removes the bias.",
      "reality": "It exposes inconsistent cases; counting them as ties is what keeps the bias out of the result."
    }
  ];
}
