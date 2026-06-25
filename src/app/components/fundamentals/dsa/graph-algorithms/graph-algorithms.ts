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
  selector: 'app-dsa-graph-algorithms',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            CommonMistakesComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './graph-algorithms.html',
  styleUrl: './graph-algorithms.scss',
})
export class DsaGraphAlgorithms {
  quickRef: QuickRefItem[] = [
    { name: 'Dijkstra',       type: 'syntax',  desc: 'Shortest path, non-negative weights — O((V+E) log V) with min-heap' },
    { name: 'Topological sort',type: 'syntax', desc: 'Directed acyclic graph ordering — Kahn\'s BFS or DFS postorder' },
    { name: 'Union-Find',     type: 'syntax',  desc: 'Connected components, cycle detection — O(α(n)) per op with path compression' },
    { name: 'Bellman-Ford',   type: 'syntax',  desc: 'Shortest path with negative edges — O(VE), detects negative cycles' },
    { name: 'Kahn\'s algo',  type: 'syntax',  desc: 'Topological sort via in-degree: enqueue 0-indegree nodes, process' },
    { name: 'Cycle detection',type: 'syntax',  desc: 'Directed: 3-color DFS. Undirected: Union-Find or parent-tracking DFS' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Dijkstra\'s Algorithm',
      points: [
        'Finds shortest paths from a source to all nodes in a graph with non-negative edge weights.',
        'Uses a min-heap (priority queue): always process the node with the smallest known distance first.',
        'Greedy: once a node is popped with its final distance, that distance is optimal.',
        'Does NOT work with negative edge weights — use Bellman-Ford instead.',
      ],
    },
    {
      heading: 'Topological Sort',
      points: [
        'Orders nodes in a DAG so every directed edge u→v has u before v in the output.',
        'Kahn\'s algorithm (BFS): compute in-degrees, enqueue 0-in-degree nodes, reduce neighbors\' in-degrees, repeat.',
        'DFS approach: run DFS, add each node to the front of the result after all its neighbors are processed.',
        'Detect cycles: if not all nodes are in the topological order, a cycle exists (used in course schedule problem).',
      ],
    },
    {
      heading: 'Union-Find (Disjoint Set Union)',
      points: [
        'Supports two operations: find (get component root) and union (merge two components).',
        'Path compression: flatten the tree by pointing directly to root on find — amortizes to O(α(n)) ≈ O(1).',
        'Union by rank: merge the smaller tree under the larger — keeps tree flat.',
        'Use for: connected components, cycle detection in undirected graphs, Kruskal\'s MST.',
      ],
    },
    {
      heading: 'Cycle Detection',
      points: [
        'Undirected: DFS tracking parent — if a visited neighbor is not the parent, it\'s a cycle.',
        'Directed: 3-color DFS (white/grey/black). A back edge (grey→grey) means cycle.',
        'Alternative for directed: topological sort (Kahn\'s) — if output.length < V, a cycle exists.',
        'Union-Find: adding an edge where both endpoints have the same root creates a cycle.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Dijkstra & Topo Sort',
      language: 'typescript',
      code: `// Dijkstra — O((V+E) log V) with min-heap
// graph: Map<node, [neighbor, weight][]>
function dijkstra(graph: Map<number, [number, number][]>, src: number): Map<number, number> {
  const dist = new Map<number, number>([[src, 0]]);
  // Simulate min-heap: [distance, node] sorted by distance
  const heap: [number, number][] = [[0, src]];
  while (heap.length) {
    heap.sort((a, b) => a[0] - b[0]); // In real code: use proper min-heap
    const [d, u] = heap.shift()!;
    if (d > (dist.get(u) ?? Infinity)) continue; // stale entry
    for (const [v, w] of graph.get(u) ?? []) {
      const newDist = d + w;
      if (newDist < (dist.get(v) ?? Infinity)) {
        dist.set(v, newDist);
        heap.push([newDist, v]);
      }
    }
  }
  return dist;
}

// Topological sort — Kahn's BFS O(V+E)
function topologicalSort(numNodes: number, edges: number[][]): number[] {
  const inDegree = new Array(numNodes).fill(0);
  const adj: number[][] = Array.from({length: numNodes}, () => []);
  for (const [u, v] of edges) { adj[u].push(v); inDegree[v]++; }
  const queue = inDegree.map((d, i) => d === 0 ? i : -1).filter(i => i >= 0);
  const result: number[] = [];
  while (queue.length) {
    const u = queue.shift()!;
    result.push(u);
    for (const v of adj[u]) { if (--inDegree[v] === 0) queue.push(v); }
  }
  return result.length === numNodes ? result : []; // empty = cycle exists
}`,
    },
    {
      label: 'Union-Find',
      language: 'typescript',
      code: `class UnionFind {
  private parent: number[];
  private rank: number[];

  constructor(n: number) {
    this.parent = Array.from({length: n}, (_, i) => i);
    this.rank = new Array(n).fill(0);
  }

  find(x: number): number {
    if (this.parent[x] !== x) this.parent[x] = this.find(this.parent[x]); // path compression
    return this.parent[x];
  }

  union(x: number, y: number): boolean {
    const px = this.find(x), py = this.find(y);
    if (px === py) return false; // already same component — would create cycle
    if (this.rank[px] < this.rank[py]) this.parent[px] = py;
    else if (this.rank[px] > this.rank[py]) this.parent[py] = px;
    else { this.parent[py] = px; this.rank[px]++; }
    return true;
  }
}

// Count connected components using Union-Find
function countComponents(n: number, edges: number[][]): number {
  const uf = new UnionFind(n);
  let components = n;
  for (const [a, b] of edges) if (uf.union(a, b)) components--;
  return components;
}

// Detect cycle in undirected graph
function hasCycle(n: number, edges: number[][]): boolean {
  const uf = new UnionFind(n);
  for (const [a, b] of edges) if (!uf.union(a, b)) return true; // same component
  return false;
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Dijkstra with negative weights — produces wrong answers',
      wrong: `// Dijkstra assumes a shorter path won't be found later
// Negative edges violate this — a detour may be shorter`,
      right: `// Use Bellman-Ford for negative weights
// Dijkstra works ONLY with non-negative edge weights`,
      explanation: 'Dijkstra marks nodes as "finalized" when popped. Negative edges can create shorter paths discovered later, corrupting the result.',
    },
    {
      title: 'Not skipping stale Dijkstra heap entries',
      wrong: `const [d, u] = heap.shift();
// Process u immediately — may use outdated distance`,
      right: `const [d, u] = heap.shift()!;
if (d > (dist.get(u) ?? Infinity)) continue; // skip stale`,
      explanation: 'A node can be in the heap multiple times with different distances. Skip entries where a better distance was already found.',
    },
    {
      title: 'Topological sort: not detecting cycles via output length',
      wrong: `return result; // may return partial order if graph has cycle`,
      right: `return result.length === numNodes ? result : []; // empty signals cycle`,
      explanation: 'If a cycle exists, some nodes never reach in-degree 0 and are never enqueued. Check that all nodes appear in the output.',
    },
    {
      title: 'Union-Find without path compression — degrades to O(n)',
      wrong: `find(x: number): number {
  while (this.parent[x] !== x) x = this.parent[x]; // linear traversal
  return x;
}`,
      right: `find(x: number): number {
  if (this.parent[x] !== x) this.parent[x] = this.find(this.parent[x]); // flatten
  return this.parent[x];
}`,
      explanation: 'Path compression makes future finds O(1) amortized. Without it, deep trees cause O(n) finds.',
    },
    {
      title: 'Directed cycle detection: using visited set like undirected DFS',
      wrong: `// 2-color DFS — works for undirected, NOT directed graphs
if (visited.has(neighbor)) return true; // could be a finished node, not a back edge`,
      right: `// 3-color DFS for directed: white(0)=unvisited, grey(1)=in-stack, black(2)=done
if (color[neighbor] === 1) return true; // back edge = cycle`,
      explanation: 'In directed graphs, visiting an already-done (black) node is fine. Only visiting a grey (in-stack) node indicates a cycle.',
    },
  ];

  challenge: Challenge = {
    title: 'Course Schedule II',
    language: 'typescript',
    description: 'Given numCourses and prerequisites, return a valid course order. Return empty array if impossible (cycle). A prerequisite [a, b] means you must take b before a.',
    hints: ['Build adjacency list and in-degree array', 'Use Kahn\'s algorithm (BFS topological sort)', 'If output length < numCourses, a cycle exists'],
    starterCode: `function findOrder(numCourses: number, prerequisites: number[][]): number[] {
  // Kahn's topological sort
}`,
    solution: `function findOrder(numCourses: number, prerequisites: number[][]): number[] {
  const inDegree = new Array(numCourses).fill(0);
  const adj: number[][] = Array.from({length: numCourses}, () => []);
  for (const [a, b] of prerequisites) { adj[b].push(a); inDegree[a]++; }
  const queue = inDegree.map((d, i) => d === 0 ? i : -1).filter(i => i >= 0);
  const result: number[] = [];
  while (queue.length) {
    const u = queue.shift()!;
    result.push(u);
    for (const v of adj[u]) if (--inDegree[v] === 0) queue.push(v);
  }
  return result.length === numCourses ? result : [];
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the key limitation of Dijkstra\'s algorithm?',
      options: ['Only works on trees', 'Requires non-negative edge weights', 'Cannot handle directed graphs', 'O(V²) time only'],
      answer: 1,
      explanation: 'Dijkstra greedily finalizes distances. Negative edges allow shorter paths discovered later, making greedy incorrect.',
    },
    {
      q: 'In Kahn\'s algorithm, what does it mean if the output has fewer nodes than the graph?',
      options: ['Some nodes are disconnected', 'A cycle exists in the graph', 'The graph is empty', 'Multiple valid orderings exist'],
      answer: 1,
      explanation: 'Nodes in a cycle never reach in-degree 0 and are never enqueued. If output.length < V, a cycle prevents full topological ordering.',
    },
    {
      q: 'What does Union-Find\'s path compression achieve?',
      options: ['Reduces edge count', 'Flattens tree for near-O(1) future finds', 'Detects negative cycles', 'Speeds up union by rank'],
      answer: 1,
      explanation: 'Path compression points nodes directly to the root during find, flattening the tree. Future finds for those nodes become O(1).',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use Union-Find vs BFS/DFS for connected components?',
      a: 'Use Union-Find when edges are added incrementally (online) — it supports dynamic connectivity in near-O(1) per edge. Use BFS/DFS when the full graph is given upfront — it\'s simpler to implement. For MST (Kruskal\'s), Union-Find is standard.',
    },
    {
      q: 'What is the difference between Dijkstra and BFS for shortest paths?',
      a: 'BFS finds shortest paths in unweighted graphs (each edge costs 1). Dijkstra finds shortest paths in weighted graphs with non-negative edge weights. If all weights are equal, BFS is simpler and O(V+E) vs Dijkstra\'s O((V+E) log V).',
    },
    {
      q: 'What is topological sort used for in practice?',
      a: 'Build systems (compile order), task scheduling with dependencies, course prerequisites, package managers (npm install order). Any problem where you need to process nodes in dependency order on a DAG.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Dijkstra (min-heap) for weighted shortest paths, topological sort (Kahn\'s BFS) for DAG ordering, Union-Find for dynamic connected components.',
    mustKnow: [
      'Dijkstra: non-negative weights only, skip stale heap entries',
      'Topological sort: output.length < V means cycle detected',
      'Union-Find: path compression + union by rank → O(α) per op',
      'Directed cycle: 3-color DFS (grey = in-stack = back edge)',
      'Undirected cycle: Union-Find — union returns false if already connected',
    ],
    interviewFocus: [
      'Course Schedule (topological sort + cycle detection)',
      'Network delay time (Dijkstra)',
      'Number of connected components (Union-Find)',
    ],
  };
}
