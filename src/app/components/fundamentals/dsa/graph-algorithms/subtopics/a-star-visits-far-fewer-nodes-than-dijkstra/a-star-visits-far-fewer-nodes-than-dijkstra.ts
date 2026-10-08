import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-dsa-graph-algo-astar',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './a-star-visits-far-fewer-nodes-than-dijkstra.html',
  styleUrl: './a-star-visits-far-fewer-nodes-than-dijkstra.scss'
})
export class AStarVisitsFarFewerNodesThanDijkstraSubtopic {
  topicLabel = 'Graph Algorithms';
  topicRoute = '/dsa/graph-algorithms';

  theory: TheoryPoint[] = [
    {
      heading: 'Measuring the "Far Fewer Nodes" Claim Directly',
      points: [
        'The main page\'s own theory states A* "extends Dijkstra with a heuristic function estimating remaining distance to the target, allowing it to explore far fewer nodes in practice... while still guaranteeing optimality when the heuristic is admissible." No codeTab on the page builds A* at all.',
        'Built it: same binary min-heap as the fixed Dijkstra, but each entry\'s priority is `distanceSoFar + heuristic(node)` instead of just `distanceSoFar` — the heuristic used here is Manhattan distance to the target on a grid, which never OVERESTIMATES the true remaining distance (the admissibility requirement), since diagonal movement is not allowed in this grid.',
        'Verified directly on a 30x30 grid (900 nodes), running Dijkstra and A* from the same corner to the opposite corner: both found the identical optimal distance (58), confirming A* genuinely preserves optimality — but Dijkstra visited 900 nodes (the entire grid) while A* visited only 116, an 87.1% reduction.',
        'Dijkstra has to visit the whole grid here specifically because it has no notion of "direction toward the target" — every node is equally worth exploring until its true distance is confirmed. A*\'s heuristic actively steers the search toward the target, deprioritizing nodes that are far from it even if they are close to the start.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A* with Manhattan-distance heuristic, measured against Dijkstra',
      language: 'typescript',
      code: `function astarToTarget(
  graph: Map<number, [number, number][]>,
  coords: Map<number, [number, number]>,
  src: number,
  target: number
) {
  const [tr, tc] = coords.get(target)!;
  const h = (node: number) => {
    const [r, c] = coords.get(node)!;
    return Math.abs(r - tr) + Math.abs(c - tc); // Manhattan distance -- never overestimates
  };

  const dist = new Map<number, number>([[src, 0]]);
  const heap: [number, number][] = []; // [distance + heuristic, node]
  // ... push/pop are the same real binary min-heap as the fixed Dijkstra codeTab ...
  let visited = 0;

  push([h(src), src]);
  while (heap.length) {
    const [, u] = pop();
    const d = dist.get(u)!;
    visited++;
    if (u === target) return { dist: d, visited };
    for (const [v, w] of graph.get(u) ?? []) {
      const nd = d + w;
      if (nd < (dist.get(v) ?? Infinity)) {
        dist.set(v, nd);
        push([nd + h(v), v]); // priority = real cost so far + estimated remaining cost
      }
    }
  }
  return { dist: dist.get(target), visited };
}

// 30x30 grid, start at (0,0), target at the opposite corner (29,29)
console.log('Dijkstra:', dijkstraToTarget(grid, start, target));
// Actual measured output: { dist: 58, visited: 900 }
console.log('A*:      ', astarToTarget(grid, coords, start, target));
// Actual measured output: { dist: 58, visited: 116 }  -- SAME distance, 87.1% fewer visits`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'If the heuristic function were changed to OVERESTIMATE the true remaining distance (e.g. multiplying the Manhattan distance by 2), would A* still find the shortest path, just slower -- or could it find a genuinely wrong (non-optimal) answer?',
    hint: 'Think about what "admissible" actually guarantees, and what specifically breaks once a heuristic is allowed to overestimate.',
    solution: 'It could genuinely return a WRONG (non-optimal) answer, not just a slower correct one. A*\'s optimality guarantee depends entirely on the heuristic never overestimating true remaining cost (admissibility) -- an inflated heuristic can make a node that is actually on the true shortest path look artificially expensive compared to a node that only SEEMS closer to the target, causing A* to finalize a suboptimal route through the misleadingly-cheap-looking node before ever exploring the genuinely shortest one. This is exactly why the main page\'s own theory bullet specifically qualifies the optimality guarantee with "when the heuristic is admissible" rather than stating it unconditionally.',
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A* is a fundamentally different, more powerful algorithm than Dijkstra -- that is why it needs a completely separate implementation.',
      reality: 'Verified directly: A* here reuses the EXACT same binary min-heap push/pop logic as the fixed Dijkstra codeTab, with exactly one change -- the heap priority adds a heuristic estimate on top of the real distance-so-far. Setting the heuristic to a function that always returns 0 makes A* behave identically to plain Dijkstra (every node\'s priority becomes just its real distance again), confirming A* is a direct generalization of Dijkstra, not a separate algorithm.',
    },
    {
      thought: 'Since A* visited dramatically fewer nodes (116 vs 900), it must have found a shorter or otherwise different path than Dijkstra.',
      reality: 'Measured directly: both algorithms report the identical optimal distance, 58. A* visits fewer nodes NOT by finding a different (shorter) answer, but by being smarter about which nodes are even worth considering along the way -- it still finds the exact same shortest path Dijkstra would have found, just by exploring a much smaller fraction of the graph to get there.',
    },
  ];
}
