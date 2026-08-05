import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

const theory: TheoryPoint[] = [
  {
    heading: 'A Readable Pattern With a Hidden Cost',
    points: [
      'The main page\'s own <code>InOrderFrom</code> recurses and re-wraps a <code>foreach</code> at every ' +
      'level: <code>foreach (var v in InOrderFrom(node.Left)) yield return v;</code>. This is genuinely the ' +
      'most readable way to write a recursive tree iterator in C# — and it is also a well-documented ' +
      'performance trap, verified against Eric Lippert\'s own "Recursive Iterator Performance" analysis of ' +
      'exactly this pattern.',
      'Each level of recursion adds ANOTHER layer of enumerator wrapping. Producing a single element from a ' +
      'node at depth <em>d</em> requires unwinding through <em>d</em> nested <code>MoveNext()</code> calls, ' +
      'one per ancestor — not the single O(1) step a hand-rolled explicit-stack iterator would need.',
    ],
  },
  {
    heading: 'From O(n log n) to a Genuine O(n²) Worst Case',
    points: [
      'For a BALANCED tree (depth ~log n), this costs roughly O(n log n) total MoveNext() calls to traverse ' +
      'every element — worse than the O(n) an explicit-stack iterator achieves, but not catastrophically so.',
      'The main page\'s own <code>BinaryTree&lt;T&gt;</code> has NO self-balancing logic — <code>Insert</code> ' +
      'is a plain BST insert. Inserting values that are ALREADY SORTED (a completely realistic input, not a ' +
      'contrived edge case) produces a fully degenerate tree shaped like a linked list, with depth O(n).',
      'Traversing that degenerate tree with the recursive-yield pattern costs O(n) work at EACH of n ' +
      'elements — a genuine O(n²) total cost, for the exact same <code>BinaryTree&lt;T&gt;</code> class shown ' +
      'on the main page, just fed sorted input instead of the demo\'s own 5, 3, 7, 1.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'The Fix — an Explicit Stack, No Recursion',
    language: 'csharp',
    code: `// The main page's own recursive-yield version — readable, but each
// level of recursion adds another layer of enumerator wrapping:
private IEnumerable<T> InOrderFrom(Node? node)
{
    if (node is null) yield break;
    foreach (var v in InOrderFrom(node.Left))  yield return v;  // re-wraps here
    yield return node.Value;
    foreach (var v in InOrderFrom(node.Right)) yield return v;  // and here
}

// The fix: an explicit stack replaces the call stack recursion would
// have used — ONE flat state machine, O(n) total work regardless of
// how skewed or balanced the tree is.
public IEnumerable<T> InOrderIterative()
{
    var stack = new Stack<Node>();
    var current = _root;

    while (current is not null || stack.Count > 0)
    {
        while (current is not null)
        {
            stack.Push(current);
            current = current.Left;
        }
        current = stack.Pop();
        yield return current.Value;      // O(1) per element — no nested unwinding
        current = current.Right;
    }
}

// A degenerate, linked-list-shaped tree — sorted input, no self-balancing:
var skewed = new BinaryTree<int>();
foreach (var n in Enumerable.Range(1, 10_000)) skewed.Insert(n);

// InOrder() (recursive-yield): ~10,000 * 10,000 / 2 MoveNext calls in the worst case
// InOrderIterative(): exactly 10,000 MoveNext calls, always`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The main page\'s own demo inserts 5, 3, 7, 1 — four values, in an order that keeps the tree roughly ' +
    'balanced. Why does this specific demo never reveal the O(n²) worst case, even though the ' +
    '<code>BinaryTree&lt;T&gt;</code> class itself is fully capable of exhibiting it?',
  hint:
    'Think about how many levels deep 5, 3, 7, 1 actually goes, and how the recursion depth (not just the ' +
    'element count) is what drives the extra cost.',
  solution:
    'With only 4 elements inserted in that specific order, the resulting tree has a depth of at most 2-3 ' +
    'levels — nowhere near enough recursion depth for the nested-enumerator overhead to become visible or ' +
    'measurable. The O(n²) behavior is driven by TREE DEPTH, not element count alone; a small, incidentally ' +
    'well-shaped demo tree can never expose it, regardless of how the class is actually implemented ' +
    'underneath. This is exactly why the cost is easy to miss in a quick demo or a small unit test, and only ' +
    'shows up once real, larger, and possibly sorted or near-sorted data is fed into an unbalanced tree like ' +
    'this one.',
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since yield return already makes iteration "lazy," a recursive yield-based iterator must be ' +
      'efficient by definition.',
    reality:
      'Laziness (computing each element on demand rather than materializing the whole sequence upfront) and ' +
      'PER-ELEMENT COST are two separate properties. This recursive pattern IS lazy — it never builds a full ' +
      'in-memory list — but each individual element it lazily produces can still cost O(depth) work to reach, ' +
      'which is precisely the hidden inefficiency here.',
  },
  {
    thought: 'This is only a theoretical concern — real trees are balanced in practice, so the O(n²) case ' +
      'never actually happens.',
    reality:
      'Sorted or near-sorted insertion order is a completely ordinary, realistic input — importing already-' +
      'sorted data, replaying an ordered event log, or inserting timestamped records in chronological order ' +
      'all naturally produce this exact degenerate shape for a plain (non-self-balancing) BST like the one ' +
      'shown on the main page.',
  },
  {
    thought: 'The fix must be to abandon yield return entirely and hand-implement IEnumerator&lt;T&gt; from ' +
      'scratch.',
    reality:
      'The fix shown above still USES yield return — it just avoids the RECURSIVE re-wrapping by replacing ' +
      'the call stack with an explicit <code>Stack&lt;Node&gt;</code> inside a single, flat iterator method. ' +
      'You keep every ergonomic benefit of yield return (no manual Current/MoveNext/Dispose boilerplate) while ' +
      'eliminating the nested-enumerator cost entirely.',
  },
];

@Component({
  selector: 'app-iterator-recursive-yield-tree-traversal-is-on-squared',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './recursive-yield-tree-traversal-is-on-squared.html',
  styleUrl: './recursive-yield-tree-traversal-is-on-squared.scss',
})
export class RecursiveYieldTreeTraversalIsOnSquaredSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
