import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-ai-rouge-example-recomputed',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './rouge-example-recomputed.html',
  styleUrl: './rouge-example-recomputed.scss'
})
export class RougeExampleRecomputedSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Run with the page's code",
      "points": [
        "Hypothesis \"The cat sat on the mat in the sun\" has 9 words; reference \"The cat is sitting on the mat\" has 7. They share 5 (the twice, cat, on, mat).",
        "So precision is 5/9 = 0.556, recall 5/7 = 0.714 and F1 0.625. The tab had printed 0.625, 0.714 and 0.667.",
        "For the Eiffel Tower pair, the same function gives F1 0.588, not 0.47. Five words match: the, eiffel, tower, is, paris.",
        "France's is reduced to frances, so it does not match France. Removing a trailing 's before stripping punctuation raises the score to 0.706 — a tokeniser detail moves the metric more than the difference in meaning does."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Check the numbers",
      "language": "typescript",
      "code": "rougeN('The cat sat on the mat in the sun', 'The cat is sitting on the mat');\n// { precision: 0.556, recall: 0.714, f1: 0.625 }\n\nrougeN('The Eiffel Tower is located in Paris, France',\n       \"France's capital, Paris, is home to the Eiffel Tower\").f1;\n// 0.588  (tokenise turns \"France's\" into \"frances\")"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "If the hypothesis were exactly the reference sentence, what would ROUGE-1 precision, recall and F1 be?",
    "hint": "Every word overlaps.",
    "solution": "All three are 1.0: overlap equals both lengths."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "Printed example outputs in docs are always run.",
      "reality": "Both examples here were off; the code gave 0.625 and 0.588."
    },
    {
      "thought": "Tokenisation is a minor detail for ROUGE.",
      "reality": "Handling one possessive changed F1 from 0.588 to 0.706."
    }
  ];
}
