import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-ai-kmeans-plus-plus-n-init',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './kmeans-plus-plus-n-init.html',
  styleUrl: './kmeans-plus-plus-n-init.scss'
})
export class KmeansPlusPlusNInitSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Measured with scikit-learn 1.9.1",
      "points": [
        "Data: 2,000 points in 10 Gaussian blobs. The best inertia came from 50 initialisations; a run counted as bad if its inertia was more than 5% above that.",
        "One run with init=\"random\": 195 of 200 seeds were bad, the worst 15.9 times the best inertia. One run with k-means++: 66 of 200 were bad, the worst 1.98 times.",
        "With n_init=10, random init was still bad 72 of 100 times; k-means++ was bad 0 of 100 times.",
        "In the source, <code>n_init=\"auto\"</code> sets one run when init is \"k-means++\". The page now recommends several runs."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Measure it (Python)",
      "language": "typescript",
      "code": "// X, _ = make_blobs(n_samples=2000, centers=10, cluster_std=0.6, random_state=4)\n// best = KMeans(10, n_init=50).fit(X).inertia_\n// runs = [KMeans(10, init='k-means++', n_init=1, random_state=s).fit(X).inertia_\n//         for s in range(200)]\n// sum(r > 1.05 * best for r in runs)   # 66 of 200\n//\n// KMeans(10, n_init=10)   # k-means++ x 10: 0 bad runs in 100"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "If one k-means++ run is bad with probability 0.33 and runs are roughly independent, what is the chance that all 10 runs of n_init=10 are bad?",
    "hint": "Multiply.",
    "solution": "About 0.33 to the power 10, roughly 0.000015 — which is why 100 trials with n_init=10 found no bad results. Keeping the best of several runs is very effective."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "k-means++ guarantees the global optimum.",
      "reality": "It gives a provably good expected start, but a single run still ended in a poor optimum 33% of the time here."
    },
    {
      "thought": "scikit-learn already restarts k-means several times.",
      "reality": "Only for random init; for k-means++ the default is one run."
    }
  ];
}
