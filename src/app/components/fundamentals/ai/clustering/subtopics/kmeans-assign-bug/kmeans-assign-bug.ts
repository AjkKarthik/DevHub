import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-ai-kmeans-assign-bug',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './kmeans-assign-bug.html',
  styleUrl: './kmeans-assign-bug.scss'
})
export class KmeansAssignBugSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Reproduced by running the page's function",
      "points": [
        "The comparison was <code>d &lt; centroids.reduce((bd, bc, bki) =&gt; bki === bestK ? bd : bd, Infinity)</code>. Both branches return <code>bd</code>, so the inner reduce always yields Infinity.",
        "Every distance is less than Infinity, so each step of the outer reduce picks the current index: the result is always the LAST centroid, k - 1.",
        "On 90 points in three well-separated blobs the page's function returned cluster sizes [0, 0, 90] and inertia 4093.9. The labels never changed, so the \"converged\" check passed on the second iteration.",
        "The fixed loop keeps the smallest distance seen so far. The same call now returns [30, 30, 30] with inertia 13.9."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Before and after",
      "language": "typescript",
      "code": "// Before: inner reduce always returns Infinity\nreturn d < centroids.reduce((bd, bc, bki) => bki === bestK ? bd : bd, Infinity) ? ki : bestK;\n\n// After: track the best distance explicitly\nlet bestK = 0, bestD = Infinity;\ncentroids.forEach((c, ki) => {\n  const d = x.reduce((s, v, i) => s + (v - c[i]) ** 2, 0);\n  if (d < bestD) { bestD = d; bestK = ki; }\n});\nreturn bestK;"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "Besides the cluster sizes, what single number from the buggy run should have looked suspicious compared with a sensible clustering?",
    "hint": "Compare 4093.9 with 13.9.",
    "solution": "The inertia. With three tight blobs, each point should be close to its centroid, so total squared distance should be small. 4093.9 is about 300 times higher than the correct 13.9, because one centroid is serving all three blobs."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "If k-means converges, its labels are right.",
      "reality": "The buggy version converged immediately because the labels never changed."
    },
    {
      "thought": "A reduce that compiles is doing what it looks like.",
      "reality": "Both branches of the inner ternary returned the same value, so it computed nothing."
    }
  ];
}
