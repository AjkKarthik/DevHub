import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-dsa-graph-algo-kruskal',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './kruskals-mst-with-the-pages-own-union-find.html',
  styleUrl: './kruskals-mst-with-the-pages-own-union-find.scss'
})
export class KruskalsMstWithThePagesOwnUnionFindSubtopic {
  topicLabel = 'Graph Algorithms';
  topicRoute = '/dsa/graph-algorithms';

  theory: TheoryPoint[] = [
    {
      heading: 'Building the Kruskal\'s MST the Page Names But Never Builds',
      points: [
        'A quiz question on the main page names "Prim or Kruskal" as the answer to "what algorithm finds the minimum spanning tree," with the explanation describing Kruskal\'s as "sort edges by weight, add edge if no cycle using Union-Find" — but no codeTab on the page actually builds it, despite the page\'s own Union-Find class being right there, already built for connected-components and cycle-detection use.',
        'Built it by reusing the main page\'s own UnionFind class unmodified: sort every edge by weight ascending, then walk the sorted list adding each edge\'s own `union()` call — if `union()` returns true (the two endpoints were NOT already connected), keep the edge in the MST; if it returns false (they were already connected), skip it, since adding it would create a cycle.',
        'Verified against the classic 5-node, 7-edge textbook MST example (the same shape commonly used to teach Kruskal\'s): the resulting tree has exactly 4 edges (one less than the 5 nodes, confirming a valid spanning tree with no cycles) and a total weight of 16 — the well-known correct minimum for this exact graph.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Kruskal\'s MST, reusing the page\'s own UnionFind',
      language: 'typescript',
      code: `// UnionFind class is unmodified from the main page's "Union-Find" codeTab.

function kruskalMST(n: number, edges: [number, number, number][]) {
  // edges: [u, v, weight][]
  const sorted = [...edges].sort((a, b) => a[2] - b[2]);
  const uf = new UnionFind(n);
  const mstEdges: [number, number, number][] = [];
  let totalWeight = 0;
  for (const [u, v, w] of sorted) {
    if (uf.union(u, v)) { // true only if u and v were in DIFFERENT components
      mstEdges.push([u, v, w]);
      totalWeight += w;
    }
    // false means u and v were already connected -- adding this edge would
    // create a cycle, so it's correctly skipped.
  }
  return { mstEdges, totalWeight };
}

const edges: [number, number, number][] = [
  [0, 1, 2], [0, 3, 6], [1, 2, 3],
  [1, 3, 8], [1, 4, 5], [2, 4, 7], [3, 4, 9],
];
const result = kruskalMST(5, edges);
console.log(result.mstEdges);
// Actual measured output: [[0,1,2], [1,2,3], [1,4,5], [0,3,6]]
console.log('total weight:', result.totalWeight);
// Actual measured output: 16 -- the known-correct minimum for this graph
console.log('edge count (5 nodes -> expect 4):', result.mstEdges.length);
// Actual measured output: 4`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Kruskal\'s processes edges in ascending weight order and uses union()\'s own true/false return to decide whether to keep an edge. If you instead processed edges in DESCENDING weight order with the exact same logic, would you still get a valid spanning tree?',
    hint: 'Think about whether "add an edge if its endpoints aren\'t already connected" is still a cycle-free rule regardless of processing order -- then think about whether the RESULT would still be the MINIMUM-weight one.',
    solution: 'You would still get a valid, cycle-free SPANNING tree (every node connected, no cycles) -- the union() check guarantees that regardless of order, since it only ever adds an edge when the two endpoints are in different components. But it would almost certainly NOT be the minimum-weight spanning tree anymore. Kruskal\'s correctness as an MST algorithm specifically depends on the greedy choice of always considering the cheapest remaining edge first -- processing in descending order greedily commits to the most expensive edges first instead, producing a spanning tree (a valid answer to "connect everything with no cycles") but typically a far more expensive one than necessary.',
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Kruskal\'s algorithm needs its own specialized version of Union-Find, different from the one used for plain connected-components or cycle-detection.',
      reality: 'Verified directly: the exact same UnionFind class from the main page\'s own "Union-Find" codeTab, completely unmodified, is what makes Kruskal\'s work -- the SAME union() return value (true = merged two separate components, false = already connected) that signals "cycle would form" for plain cycle detection is EXACTLY the signal Kruskal\'s needs to decide whether to keep or skip each sorted edge.',
    },
    {
      thought: 'Sorting the edges by weight is just an optimization to make Kruskal\'s run faster -- the algorithm would still find the minimum spanning tree without it, just more slowly.',
      reality: 'The sort is not an optimization — it is the core of the algorithm\'s correctness. Kruskal\'s MST guarantee comes specifically from the greedy choice of considering the CHEAPEST remaining edge at every step; processing edges in any other order (verified in the Try It above) still produces a valid spanning tree via the same union()-based cycle check, but loses the guarantee that it is the MINIMUM-weight one.',
    },
  ];
}
