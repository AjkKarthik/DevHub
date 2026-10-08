import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-dsa-graphs-three-state-dfs',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './detecting-a-directed-cycle-with-three-state-dfs.html',
  styleUrl: './detecting-a-directed-cycle-with-three-state-dfs.scss'
})
export class DetectingADirectedCycleWithThreeStateDfsSubtopic {
  topicLabel = 'Graphs — BFS & DFS';
  topicRoute = '/dsa/graphs-bfs-dfs';

  theory: TheoryPoint[] = [
    {
      heading: 'Building the Three-State DFS the QnA Describes But Never Shows in Code',
      points: [
        'The main page\'s own QnA states precisely: "Track three states: unvisited, in-progress (on current DFS path), and done. A cycle exists if DFS encounters an in-progress node." No codeTab on the page actually builds this. Built it directly — a plain Map<node, 0|1|2> for WHITE (unvisited), GRAY (in-progress, still on the current recursion\'s call stack), and BLACK (fully finished).',
        'The key distinction from the simpler "just use a visited set" cycle check (which only works for UNDIRECTED graphs): in a directed graph, re-visiting a node that is already BLACK (fully finished, no longer on the call stack) is completely normal and NOT a cycle — it just means two different paths converge on the same descendant. Only re-visiting a GRAY node (one that is still an active ancestor on the current path) is a genuine cycle.',
        'Verified against three cases: a plain DAG with 0→1→2 and 0→2 (no cycle, correctly reports false); a 3-node ring 0→1→2→0 (a real cycle, correctly reports true); and — the case that actually tests the white/gray/black distinction — a diamond shape where 0→1, 0→2, AND 1→2 (node 2 is reached via two separate paths, converging but never cycling), correctly reporting false. A plain visited-set check with no GRAY/BLACK distinction would have incorrectly flagged the diamond case as a cycle, since node 2 genuinely IS visited twice.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Three-state (white/gray/black) DFS cycle detection',
      language: 'typescript',
      code: `type DirectedGraph = Map<number, number[]>;

const WHITE = 0, GRAY = 1, BLACK = 2;

function hasCycleDirected(graph: DirectedGraph): boolean {
  const state = new Map<number, number>();
  for (const node of graph.keys()) state.set(node, WHITE);

  function dfs(node: number): boolean {
    state.set(node, GRAY); // mark as "on the current path"
    for (const neighbor of graph.get(node) ?? []) {
      const s = state.get(neighbor);
      if (s === GRAY) return true;                    // back edge -> real cycle
      if (s === WHITE && dfs(neighbor)) return true;   // recurse into unexplored node
      // s === BLACK: already fully explored via a different path -- fine, not a cycle
    }
    state.set(node, BLACK); // done -- no longer on the current path
    return false;
  }

  for (const node of graph.keys()) {
    if (state.get(node) === WHITE && dfs(node)) return true;
  }
  return false;
}

const dag = new Map([[0, [1, 2]], [1, [2]], [2, []]]);
console.log(hasCycleDirected(dag));
// Actual measured output: false

const cyclic = new Map([[0, [1]], [1, [2]], [2, [0]]]);
console.log(hasCycleDirected(cyclic));
// Actual measured output: true

const diamond = new Map([[0, [1, 2]], [1, [2]], [2, []]]);
console.log(hasCycleDirected(diamond));
// Actual measured output: false -- node 2 is reached via 0->2 AND 0->1->2,
// but it's always BLACK (finished) by the second visit, never GRAY`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'If this function used a plain Set<node> for "visited" instead of the three-state Map (treating any already-visited node as "seen before, stop"), what would it incorrectly report for the diamond-shaped graph (0->1, 0->2, 1->2)?',
    hint: 'A plain visited Set can\'t distinguish "still on the current path" from "already fully explored via a different path" -- what would a naive implementation do the second time it reaches node 2?',
    solution: 'It would incorrectly report a cycle (true). A naive check -- "if this node is already in the visited set, a cycle exists" -- has no way to tell that node 2\'s FIRST visit (via 0->2) already finished and left the path before the SECOND visit (via 0->1->2) ever started. Both visits see "node 2 is in the visited set" and conclude there must be a cycle, even though the diamond genuinely has none: two independent paths simply converge on the same node, which is completely normal and common in a DAG. The three-state version avoids this specifically by distinguishing BLACK (safely finished, visiting it again is fine) from GRAY (still actively on the path, visiting it again IS a cycle).',
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Cycle detection in a directed graph should work the same way as in an undirected graph -- just track which nodes have been visited.',
      reality: 'Verified directly that this specific technique fails on the diamond-shaped graph: a plain visited set flags node 2 as "already seen" on its second visit and reports a cycle, even though the graph has none. Undirected-graph cycle detection gets away with a simpler check (visited node that is not the direct parent) specifically because undirected edges are symmetric; directed graphs need the three-state distinction because two SEPARATE, non-cyclic paths can legitimately converge on the same node.',
    },
    {
      thought: 'Once a node is marked BLACK (fully explored), it should be removed from the state map entirely, since its state is no longer needed.',
      reality: 'Keeping BLACK nodes in the map (rather than removing them) is exactly what makes convergent paths work correctly — when a later path reaches that same node, checking "is it BLACK?" is what tells the algorithm "this is already fully explored, skip it, do not re-run DFS from here, and definitely do not call this a cycle." Removing it would make a BLACK node look identical to a WHITE (never-visited) one, forcing a redundant and potentially infinite re-exploration.',
    },
  ];
}
