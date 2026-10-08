import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-dsa-graphs-bipartite',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './checking-bipartiteness-with-two-coloring-bfs.html',
  styleUrl: './checking-bipartiteness-with-two-coloring-bfs.scss'
})
export class CheckingBipartitenessWithTwoColoringBfsSubtopic {
  topicLabel = 'Graphs — BFS & DFS';
  topicRoute = '/dsa/graphs-bfs-dfs';

  theory: TheoryPoint[] = [
    {
      heading: 'Building the 2-Coloring Check the QnA Describes But Never Shows',
      points: [
        'The main page\'s own QnA states the algorithm precisely: "assign color 0 to starting node, then alternate colors 0/1 for each neighbor. If you ever try to assign a node the same color as its neighbor, the graph is NOT bipartite... A graph is bipartite if and only if it contains no odd-length cycles." No codeTab on the page builds this. Built it directly, reusing the page\'s own index-pointer BFS pattern (not shift()) to assign colors level by level.',
        'Verified against the exact claim the QnA makes: a 4-node even-length cycle (0-1-2-3-0) correctly reports bipartite (true); a 3-node triangle (an odd-length cycle) correctly reports NOT bipartite (false); a 5-node pentagon (also odd-length) correctly reports NOT bipartite (false); and a plain tree with no cycles at all correctly reports bipartite (true) — confirming trees are always bipartite, since they contain no cycles of any length.',
        'The algorithm has to run from EVERY unvisited node, not just one starting node — a graph with multiple disconnected components needs its own BFS-and-coloring pass per component, since a color assigned in one component has no relationship to colors in a separate, unreached component.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: '2-coloring bipartiteness check',
      language: 'typescript',
      code: `type Graph = Map<number, number[]>;

function isBipartite(graph: Graph): boolean {
  const color = new Map<number, number>();

  for (const start of graph.keys()) {
    if (color.has(start)) continue; // already colored via another component's BFS
    color.set(start, 0);
    const queue = [start];
    let head = 0;
    while (head < queue.length) {
      const node = queue[head++];
      for (const neighbor of graph.get(node) ?? []) {
        if (!color.has(neighbor)) {
          color.set(neighbor, 1 - color.get(node)!); // opposite color
          queue.push(neighbor);
        } else if (color.get(neighbor) === color.get(node)) {
          return false; // same color as a direct neighbor -> odd cycle -> not bipartite
        }
      }
    }
  }
  return true;
}

const evenCycle = new Map([[0, [1, 3]], [1, [0, 2]], [2, [1, 3]], [3, [2, 0]]]);
console.log(isBipartite(evenCycle));
// Actual measured output: true

const triangle = new Map([[0, [1, 2]], [1, [0, 2]], [2, [0, 1]]]);
console.log(isBipartite(triangle));
// Actual measured output: false

const pentagon = new Map([[0, [1, 4]], [1, [0, 2]], [2, [1, 3]], [3, [2, 4]], [4, [3, 0]]]);
console.log(isBipartite(pentagon));
// Actual measured output: false

const tree = new Map([[0, [1, 2]], [1, [0, 3, 4]], [2, [0]], [3, [1]], [4, [1]]]);
console.log(isBipartite(tree));
// Actual measured output: true -- no cycles at all, so no odd cycle either`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The function skips coloring any node that already has a color assigned ("if (color.has(start)) continue"). Is this check needed for correctness, or is it purely a performance optimization?',
    hint: 'What would happen if you removed that check and the graph had two separate, disconnected components?',
    solution: 'It is needed for CORRECTNESS, not just performance. Without the check, after the first component\'s BFS finishes, the outer loop would reach a node in the SECOND component, see it has no color yet, and correctly start a new BFS for it -- that part works fine either way. The check actually matters for a node that WAS already colored during an earlier component\'s BFS: without "continue", the outer loop would try to color it AGAIN with color 0, resetting a color that might already be 1 from its real component -- corrupting a correct coloring and risking the function reporting a false positive for a non-bipartite graph that just happens to have multiple components.',
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A graph needs to have at least one cycle for the bipartiteness check to be meaningful -- a tree with no cycles has nothing to check.',
      reality: 'Verified directly: a 5-node tree with zero cycles still runs through the full 2-coloring algorithm and correctly reports bipartite (true). This is not a trivial or skipped case -- trees ARE always bipartite, specifically because they have no cycles of any length, let alone an odd one, so the "same color as neighbor" conflict that would flag non-bipartiteness can never occur.',
    },
    {
      thought: 'Checking for an odd-length cycle should require actually finding and measuring the length of every cycle in the graph.',
      reality: 'The 2-coloring approach never explicitly looks for cycles or measures their length at all -- it only ever checks a LOCAL condition (does this specific neighbor already have my own color?) during a single BFS pass. Verified on the pentagon (5-cycle) and triangle (3-cycle) that this local check alone is sufficient to correctly flag both as non-bipartite, with no separate cycle-detection or cycle-length-measuring logic required.',
    },
  ];
}
