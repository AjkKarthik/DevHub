import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-dsa-graphs-bfs-dfs',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            CommonMistakesComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './graphs-bfs-dfs.html',
  styleUrl: './graphs-bfs-dfs.scss',
})
export class DsaGraphsBfsDfs {
  quickRef: QuickRefItem[] = [
    { name: 'BFS',           type: 'syntax',  desc: 'Queue — shortest path in unweighted graph, level-order' },
    { name: 'DFS',           type: 'syntax',  desc: 'Stack/recursion — connected components, cycle detection, paths' },
    { name: 'Visited set',   type: 'syntax',  desc: 'Required for both BFS and DFS to avoid infinite loops' },
    { name: 'Adj list',      type: 'syntax',  desc: 'Map<node, neighbors[]> — O(V+E) space' },
    { name: 'Grid BFS',      type: 'syntax',  desc: '4-directional neighbors: [r-1,c],[r+1,c],[r,c-1],[r,c+1]' },
    { name: 'Islands',       type: 'syntax',  desc: 'DFS/BFS flood fill — mark visited, count components' },
    { name: 'Time O(V+E)',   type: 'syntax',  desc: 'Both BFS and DFS visit each vertex and edge once' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Graph Representation',
      points: [
        'Adjacency list: Map<node, neighbors[]> — O(V+E) space. Preferred for sparse graphs.',
        'Adjacency matrix: V×V boolean grid — O(V²) space. Preferred for dense graphs or edge-weight lookup.',
        'Grid problems are graphs: each cell is a node, 4-directional neighbors are edges.',
        'Directed vs undirected: undirected edges appear in both directions in the adjacency list.',
      ],
    },
    {
      heading: 'BFS — Breadth-First Search',
      points: [
        'Uses a queue. Explores all neighbors at distance d before distance d+1.',
        'Guarantees shortest path in unweighted graphs — the first time a node is reached is via shortest path.',
        'Use BFS for: shortest path, minimum steps, level-by-level processing.',
        'Mark nodes visited when enqueuing (not when dequeuing) to avoid processing duplicates.',
      ],
    },
    {
      heading: 'DFS — Depth-First Search',
      points: [
        'Uses recursion (call stack) or explicit stack. Explores as deep as possible before backtracking.',
        'Use DFS for: connected components, cycle detection, topological sort, all paths.',
        'In grids: DFS naturally implements flood fill — mark cell as visited, recurse on 4 neighbors.',
        'Iterative DFS with explicit stack processes nodes in a different order than recursive DFS.',
      ],
    },
    {
      heading: 'Grid BFS/DFS Patterns',
      points: [
        'Directions array: [[0,1],[0,-1],[1,0],[-1,0]] — iterate to generate all 4 neighbors.',
        'Bounds check: 0 <= r < rows && 0 <= c < cols before accessing grid[r][c].',
        'Mark visited in-place by modifying the grid (e.g. set to \'#\' or \'0\') to save space.',
        'Number of islands, max area of island, rotting oranges, walls and gates all use this pattern.',
      ],
    },
    {
      heading: 'When to Choose BFS Over DFS (and Vice Versa)',
      points: [
        'BFS explores level by level using a queue, guaranteeing it finds the shortest path in terms of number of edges in an unweighted graph — DFS provides no such guarantee, since it dives deep along one path before backtracking, potentially finding a longer path first.',
        'DFS uses less memory in the worst case for wide graphs (its stack only needs to hold one root-to-current-node path, versus BFS potentially holding an entire graph "level" in its queue), making DFS preferable for very wide, shallow graphs.',
        'BFS is the natural choice for shortest-path and "minimum number of steps" problems, while DFS is the natural choice for problems requiring exhaustive exploration of all paths, cycle detection, or topological ordering, where the "shortest" property is irrelevant.',
        'Both BFS and DFS run in O(V + E) time, so the choice between them in practice is driven by which traversal order the specific problem requires (level-by-level vs. deep-then-backtrack), not by any performance difference between the two.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'BFS & DFS on Graph',
      language: 'typescript',
      code: `type Graph = Map<number, number[]>;

// BFS — shortest path, unweighted
function bfs(graph: Graph, start: number): Map<number, number> {
  const dist = new Map<number, number>([[start, 0]]);
  const queue = [start];
  while (queue.length) {
    const node = queue.shift()!;
    for (const neighbor of graph.get(node) ?? []) {
      if (!dist.has(neighbor)) {
        dist.set(neighbor, dist.get(node)! + 1);
        queue.push(neighbor);
      }
    }
  }
  return dist;
}

// DFS — iterative with explicit stack
function dfs(graph: Graph, start: number): number[] {
  const visited = new Set<number>();
  const stack = [start];
  const order: number[] = [];
  while (stack.length) {
    const node = stack.pop()!;
    if (visited.has(node)) continue;
    visited.add(node);
    order.push(node);
    for (const neighbor of graph.get(node) ?? []) {
      if (!visited.has(neighbor)) stack.push(neighbor);
    }
  }
  return order;
}

// Count connected components
function countComponents(n: number, edges: number[][]): number {
  const graph: Graph = new Map(Array.from({length: n}, (_, i) => [i, []]));
  for (const [a, b] of edges) { graph.get(a)!.push(b); graph.get(b)!.push(a); }
  const visited = new Set<number>();
  let count = 0;
  function dfsNode(node: number) {
    if (visited.has(node)) return;
    visited.add(node);
    for (const n of graph.get(node)!) dfsNode(n);
  }
  for (let i = 0; i < n; i++) if (!visited.has(i)) { dfsNode(i); count++; }
  return count;
}`,
    },
    {
      label: 'Grid BFS/DFS',
      language: 'typescript',
      code: `const DIRS = [[0,1],[0,-1],[1,0],[-1,0]];

// Number of islands — DFS flood fill
function numIslands(grid: string[][]): number {
  const rows = grid.length, cols = grid[0].length;
  let count = 0;
  function dfs(r: number, c: number): void {
    if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] !== '1') return;
    grid[r][c] = '0'; // mark visited in-place
    for (const [dr, dc] of DIRS) dfs(r + dr, c + dc);
  }
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      if (grid[r][c] === '1') { dfs(r, c); count++; }
  return count;
}

// Shortest path in grid — BFS
function shortestPath(grid: number[][], start: [number,number], end: [number,number]): number {
  const [sr, sc] = start, [er, ec] = end;
  const rows = grid.length, cols = grid[0].length;
  const queue: [number, number, number][] = [[sr, sc, 0]]; // [row, col, dist]
  const visited = new Set<string>([sr + ',' + sc]);
  while (queue.length) {
    const [r, c, dist] = queue.shift()!;
    if (r === er && c === ec) return dist;
    for (const [dr, dc] of DIRS) {
      const nr = r + dr, nc = c + dc;
      const key = nr + ',' + nc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !grid[nr][nc] && !visited.has(key)) {
        visited.add(key); queue.push([nr, nc, dist + 1]);
      }
    }
  }
  return -1; // no path
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Marking visited when dequeuing instead of when enqueuing',
      wrong: `const node = queue.shift();
visited.add(node); // too late — duplicates already in queue`,
      right: `visited.add(start);
queue.push(start);
// Mark visited BEFORE enqueuing, not after dequeuing`,
      explanation: 'If you mark visited on dequeue, the same node can be enqueued multiple times before being processed — causing duplicate work or infinite loops.',
    },
    {
      title: 'Not checking bounds before accessing grid neighbors',
      wrong: `for (const [dr, dc] of DIRS) {
  dfs(r + dr, c + dc); // may access grid[-1][c] — crash`,
      right: `for (const [dr, dc] of DIRS) {
  const nr = r + dr, nc = c + dc;
  if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) dfs(nr, nc);
}`,
      explanation: 'Always bounds-check before accessing grid cells — negative indices or out-of-range indices cause runtime errors.',
    },
    {
      title: 'Using DFS for shortest path in unweighted graph',
      wrong: `// DFS finds A path — not necessarily the shortest`,
      right: `// BFS guarantees shortest path: first time a node is reached = shortest distance`,
      explanation: 'DFS explores as deep as possible first and may find a longer path. BFS explores by distance, guaranteeing shortest path.',
    },
    {
      title: 'Forgetting the visited set — infinite loop on cycles',
      wrong: `function dfs(node) {
  for (const n of graph.get(node)) dfs(n); // cycles cause stack overflow`,
      right: `const visited = new Set();
function dfs(node) {
  if (visited.has(node)) return;
  visited.add(node);
  for (const n of graph.get(node)) dfs(n);
}`,
      explanation: 'Without a visited set, DFS on a graph with cycles will recurse infinitely (unlike trees, which have no cycles).',
    },
    {
      title: 'Using Array.shift() for BFS queue — O(n²) total',
      wrong: `const queue = [start];
queue.shift(); // O(n) per operation — slow for large graphs`,
      right: `let head = 0;
const queue = [start];
queue[head++]; // O(1) dequeue with pointer`,
      explanation: 'Array.shift() is O(n). For large graphs, BFS with shift() is O(V²). Use an index pointer or a proper deque for O(V+E) BFS.',
    },
  ];

  challenge: Challenge = {
    title: 'Rotting Oranges',
    language: 'typescript',
    description: 'A grid has 0 (empty), 1 (fresh orange), 2 (rotten). Each minute, rotting oranges spread to 4-directional neighbors. Return minutes until all oranges are rotten, or -1 if impossible.',
    hints: ['Multi-source BFS — start with all rotten oranges in the queue', 'Track fresh orange count', 'BFS level = minutes elapsed'],
    starterCode: `function orangesRotting(grid: number[][]): number {
  // Multi-source BFS from all initially rotten oranges
}`,
    solution: `function orangesRotting(grid: number[][]): number {
  const rows = grid.length, cols = grid[0].length;
  const queue: [number, number][] = [];
  let fresh = 0;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 2) queue.push([r, c]);
      if (grid[r][c] === 1) fresh++;
    }
  if (fresh === 0) return 0;
  const DIRS = [[0,1],[0,-1],[1,0],[-1,0]];
  let minutes = 0;
  while (queue.length && fresh > 0) {
    minutes++;
    const size = queue.length;
    for (let i = 0; i < size; i++) {
      const [r, c] = queue.shift()!;
      for (const [dr, dc] of DIRS) {
        const nr = r+dr, nc = c+dc;
        if (nr>=0 && nr<rows && nc>=0 && nc<cols && grid[nr][nc]===1) {
          grid[nr][nc] = 2; fresh--; queue.push([nr, nc]);
        }
      }
    }
  }
  return fresh === 0 ? minutes : -1;
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which algorithm guarantees the shortest path in an unweighted graph?',
      options: ['DFS', 'BFS', 'Topological sort', 'Flood fill'],
      answer: 1,
      explanation: 'BFS explores nodes by increasing distance. The first time a node is reached, it is via the shortest path.',
    },
    {
      q: 'What is the time complexity of BFS and DFS on a graph with V vertices and E edges?',
      options: ['O(V²)', 'O(V + E)', 'O(V log V)', 'O(E log V)'],
      answer: 1,
      explanation: 'Both BFS and DFS visit each vertex once and each edge once (or twice for undirected) → O(V + E).',
    },
    {
      q: 'When marking visited in BFS, when should you mark a node?',
      options: ['When dequeuing', 'When enqueuing', 'After processing all neighbors', 'Before starting BFS'],
      answer: 1,
      explanation: 'Mark visited when enqueuing. If you mark on dequeue, the same node can be enqueued multiple times before being visited.',
    },
  { q: 'Why does DFS use O(V) extra space in the worst case even without an explicit stack array?', options: ['It does not — DFS is O(1) space', 'The recursion call stack can go V deep on a skewed/linear graph', 'DFS always stores the full adjacency matrix', 'Each recursive call allocates a new visited set'], answer: 1, explanation: 'DFS implemented recursively uses the call stack. On a graph that is effectively a long chain (e.g. a linked-list-shaped graph), the recursion depth reaches V, so the call stack itself is O(V) — this is why deep graphs can cause stack overflow with recursive DFS, and an iterative DFS with an explicit stack is preferred for very deep graphs.' },
  { q: 'How do you detect a cycle in an undirected graph using DFS?', options: ['Check for back edges during DFS', 'DFS will naturally visit all nodes without cycles', 'Use topological sort', 'Compare DFS and BFS traversal orders'], answer: 0, explanation: 'In undirected graph DFS: if you visit a node that is already visited and is not the parent, a cycle exists. Track parent to avoid false positives from the undirected edge to the direct parent.' },
  { q: 'What is the difference between a connected component and a strongly connected component?', options: ['Same concept for directed vs undirected graphs', 'Connected component: undirected (path exists between any two nodes); SCC: directed (path in BOTH directions)', 'SCC requires BFS; connected component uses DFS', 'SCCs only exist in DAGs'], answer: 1, explanation: 'Connected component: in undirected graph, all nodes reachable from each other. SCC: in directed graph, every node is reachable from every other node IN BOTH DIRECTIONS. Kosaraju or Tarjan algorithms find SCCs in O(V + E).' },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do you represent a graph for interview problems?',
      a: 'Adjacency list (Map<node, neighbors[]>) is most common. For grids, the grid itself is the implicit graph — no need to build an explicit adjacency list. For edge-weighted graphs, Map<node, [neighbor, weight][]>.',
    },
    {
      q: 'What is multi-source BFS and when is it used?',
      a: 'Start BFS from multiple nodes simultaneously by adding all of them to the initial queue. Used when you want shortest distance from any of several source nodes (e.g. rotting oranges spreads from all rotten cells at once, 0-1 matrix distance from nearest 0).',
    },
    {
      q: 'Can DFS be used on a directed graph to detect cycles?',
      a: 'Yes. Track three states: unvisited, in-progress (on current DFS path), and done. A cycle exists if DFS encounters an in-progress node. This is different from undirected graphs where just tracking visited is enough.',
    },
  { q: 'How do you detect bipartiteness (two-colorability) of a graph?', a: 'BFS/DFS with 2-coloring: assign color 0 to starting node, then alternate colors 0/1 for each neighbor. If you ever try to assign a node the same color as its neighbor, the graph is NOT bipartite (has an odd-length cycle). O(V + E). A graph is bipartite if and only if it contains no odd-length cycles. Applications: matching problems, scheduling.' },
  { q: 'How do you find all islands in a 2D grid?', a: '2D grid: treat each cell as a graph node; edges go to 4-directional neighbors. Count islands: iterate all cells; when you find an unvisited land cell (1), increment count and run BFS/DFS to mark all connected land cells as visited. O(m * n) time. Common pattern for: number of islands, max area of island, flood fill, surrounded regions.' },
  { q: 'What is iterative DFS and how does it handle the call stack limitation?', a: 'Iterative DFS uses an explicit stack instead of the call stack. Push start node; while stack not empty: pop a node, process it, push unvisited neighbors. This avoids stack overflow on very deep graphs (Python default recursion limit is 1000). Iterative DFS may visit nodes in a different order than recursive DFS depending on push order — push neighbors in reverse order to match recursive DFS order.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'BFS (queue) gives shortest path in unweighted graphs; DFS (stack/recursion) finds connected components and cycles — both are O(V+E) with a visited set.',
    mustKnow: [
      'BFS: mark visited when enqueuing, not dequeuing',
      'DFS: always use visited set to avoid infinite loops on cycles',
      'Grid: DIRS array + bounds check before recursing',
      'BFS = shortest path; DFS = components, cycles, all-paths',
      'Time O(V+E), Space O(V) for visited set',
    ],
    interviewFocus: [
      'Number of islands (DFS flood fill)',
      'Rotting oranges (multi-source BFS)',
      'Shortest path in grid (BFS)',
    ],
  };
}
