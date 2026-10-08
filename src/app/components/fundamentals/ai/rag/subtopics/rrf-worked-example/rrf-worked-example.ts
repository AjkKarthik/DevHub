import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-ai-rrf-worked-example',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './rrf-worked-example.html',
  styleUrl: './rrf-worked-example.scss'
})
export class RrfWorkedExampleSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Fusing two lists with k = 60",
      "points": [
        "BM25 returns [A, B, C]; the vector search returns [C, A, D]. Each document gets 1 / (60 + rank) from every list it appears in, with ranks starting at 1.",
        "A: 1/61 + 1/62 = 0.0325. C: 1/63 + 1/61 = 0.0323. B: 1/62 = 0.0161. D: 1/63 = 0.0159.",
        "Fused order: A, C, B, D. Documents found by both retrievers rise above documents found by only one.",
        "The constant k (60 in the original paper) flattens the gap between rank 1 and rank 2, so agreement between lists matters more than a single first place."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Fuse lists",
      "language": "typescript",
      "code": "function rrf(lists: string[][], k = 60): Array<[string, number]> {\n  const scores = new Map<string, number>();\n  for (const list of lists) {\n    list.forEach((id, i) => {\n      scores.set(id, (scores.get(id) ?? 0) + 1 / (k + i + 1)); // i is 0-based\n    });\n  }\n  return [...scores].sort((a, b) => b[1] - a[1]);\n}\n\nrrf([['A', 'B', 'C'], ['C', 'A', 'D']]);\n// [['A', 0.0325], ['C', 0.0323], ['B', 0.0161], ['D', 0.0159]]"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "Document X is rank 1 in BM25 only. Document Y is rank 3 in both lists. With k = 60, which ranks higher?",
    "hint": "Compare 1/61 with 2/63.",
    "solution": "Y. X scores 1/61 = 0.0164; Y scores 2/63 = 0.0317, almost twice as much. Appearing in both lists outweighs a single top rank."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "Hybrid search needs BM25 and cosine scores on the same scale.",
      "reality": "RRF ignores raw scores and combines ranks only."
    },
    {
      "thought": "The top result from either list always stays on top.",
      "reality": "A document ranked well in both lists can overtake one ranked first in only one."
    }
  ];
}
