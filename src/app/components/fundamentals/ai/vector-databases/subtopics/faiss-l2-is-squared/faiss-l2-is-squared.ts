import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-ai-faiss-l2-is-squared',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './faiss-l2-is-squared.html',
  styleUrl: './faiss-l2-is-squared.scss'
})
export class FaissL2IsSquaredSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Measured with faiss-cpu",
      "points": [
        "With 20,000 normalised 1536-dim vectors, the top distance returned was 0.4326. The page's formula reported 0.5674 as the cosine similarity.",
        "Computing the real dot product between the query and that stored vector gave 0.7837.",
        "For unit vectors, the squared L2 distance is |a - b|² = 2 - 2·cos(a, b), so cos = 1 - d/2. That gave 0.7837, matching exactly.",
        "The index is the default metric, <code>METRIC_L2</code>; FAISS reports squared distances to avoid a square root per comparison."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Correct conversion",
      "language": "bash",
      "code": "# Python\n# index = faiss.IndexHNSWFlat(d, 32)          # METRIC_L2, returns squared distances\n# D, I = index.search(query, 5)\n# cosine = 1 - D[0] / 2                       # 0.7837 for the top hit\n#\n# Or use inner product directly:\n# index = faiss.IndexHNSWFlat(d, 32, faiss.METRIC_INNER_PRODUCT)\n# D, I = index.search(query, 5)               # D is already the cosine"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "Two unit vectors are identical. What squared L2 distance does FAISS report, and what does 1 - d/2 give?",
    "hint": "What is |a - a|?",
    "solution": "The distance is 0, so the cosine is 1 - 0/2 = 1. For opposite vectors the distance is 4 and the cosine is 1 - 4/2 = -1."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "FAISS L2 distance is the Euclidean distance.",
      "reality": "IndexFlatL2 and IndexHNSWFlat return the squared distance."
    },
    {
      "thought": "Wrong scores mean wrong results.",
      "reality": "The ordering was right; only the reported similarity numbers were too low."
    }
  ];
}
