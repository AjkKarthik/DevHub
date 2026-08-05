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
    heading: 'A Capability Named, Never Demonstrated',
    points: [
      'The main page\'s own QnA states: "External iterators allow merging two iterators or breaking early; ' +
      'internal iterators abstract away the loop structure." Breaking early is easy to picture — but merging ' +
      'two iterators is never actually shown anywhere on the page, in either codeTab.',
      'This is precisely the capability an INTERNAL iterator (like <code>List&lt;T&gt;.ForEach()</code>) ' +
      'genuinely CANNOT offer: a callback-driven internal iterator only ever sees one collection\'s elements ' +
      'at a time, with no way to pause one traversal to advance another and compare positions.',
    ],
  },
  {
    heading: 'What Merging Actually Requires',
    points: [
      'You need explicit control over EACH iterator\'s own <code>MoveNext()</code>/<code>Current</code> — ' +
      'advancing exactly one side, inspecting its current value, then deciding whether to advance the other ' +
      'side, advance both, or stop. This is only possible because external iteration hands the CALLER that ' +
      'exact level of control.',
      'A classic use case: merging two ALREADY-SORTED sequences into one sorted sequence (the core step of ' +
      'merge sort\'s own merge phase) — at each step, compare the two iterators\' current values and advance ' +
      'whichever one is smaller.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Merging Two Sorted Sequences by Hand',
    language: 'csharp',
    code: `// A hand-rolled external-iterator merge — exactly what the main
// page's own QnA names but never shows. LINQ's Zip() pairs elements
// positionally; this MERGES two already-sorted sequences by VALUE,
// something no internal (callback-driven) iterator could express.
public static IEnumerable<T> MergeSorted<T>(
    IEnumerable<T> left, IEnumerable<T> right) where T : IComparable<T>
{
    using var leftIter  = left.GetEnumerator();
    using var rightIter = right.GetEnumerator();

    bool hasLeft  = leftIter.MoveNext();
    bool hasRight = rightIter.MoveNext();

    // Both iterators advance independently, driven by explicit
    // MoveNext() calls — the exact control an internal iterator
    // (a bare callback per element) could never offer.
    while (hasLeft && hasRight)
    {
        if (leftIter.Current.CompareTo(rightIter.Current) <= 0)
        {
            yield return leftIter.Current;
            hasLeft = leftIter.MoveNext();
        }
        else
        {
            yield return rightIter.Current;
            hasRight = rightIter.MoveNext();
        }
    }

    // Drain whichever side still has elements left.
    while (hasLeft)  { yield return leftIter.Current;  hasLeft  = leftIter.MoveNext(); }
    while (hasRight) { yield return rightIter.Current; hasRight = rightIter.MoveNext(); }
}

// Usage — merging two sorted sequences from the main page's own InOrder()
var treeA = new BinaryTree<int>();
foreach (var n in new[] { 5, 3, 7, 1 }) treeA.Insert(n);
var treeB = new BinaryTree<int>();
foreach (var n in new[] { 6, 2, 8 }) treeB.Insert(n);

foreach (var n in MergeSorted(treeA.InOrder(), treeB.InOrder()))
    Console.Write($"{n} "); // 1 2 3 5 6 7 8 — merged, still sorted`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'Could <code>MergeSorted</code> above be written using <code>List&lt;T&gt;.ForEach()</code> (an internal ' +
    'iterator) instead of explicit <code>GetEnumerator()</code>/<code>MoveNext()</code> calls? Explain ' +
    'specifically what capability would be missing.',
  hint:
    'ForEach() calls your callback once PER ELEMENT, in order, with no way to pause — think about what the ' +
    'merge algorithm needs to do the moment it decides NOT to advance one of the two sequences.',
  solution:
    'No — ForEach() cannot express this. The merge algorithm needs to advance ONE sequence while leaving the ' +
    'OTHER exactly where it is, repeatedly, based on a comparison decided at each step. ForEach()\'s callback ' +
    'runs to completion for every element of ONE collection with no way to pause mid-traversal, peek at where ' +
    'a SECOND, independent traversal currently stands, and selectively decide which one advances next. ' +
    'External iteration is what makes "hold position A, decide based on A and B, advance only one of them" ' +
    'possible in the first place — this is precisely the "external iterators allow merging" capability the ' +
    'main page\'s own QnA names abstractly.',
};

const misconceptions: Misconception[] = [
  {
    thought: 'LINQ\'s Zip() method already does what MergeSorted does — they are interchangeable.',
    reality:
      'Zip() pairs elements purely by POSITION (the 1st element of A with the 1st of B, the 2nd with the 2nd, ' +
      'and so on), regardless of value — it has no concept of "which one is smaller." MergeSorted decides ' +
      'which sequence to advance based on comparing VALUES, producing one combined, still-sorted output — a ' +
      'genuinely different operation that Zip() cannot replicate.',
  },
  {
    thought: 'Since both sequences are already sorted, you could just concatenate them and sort the combined ' +
      'result — same outcome, simpler code.',
    reality:
      'It produces the same OUTPUT but at a real cost: concatenating and re-sorting two sequences of length n ' +
      'and m costs O((n+m) log(n+m)), while the merge shown here does the same job in O(n+m) — genuinely ' +
      'linear, because it only ever needs ONE comparison per step to know which side to advance, exploiting ' +
      'the fact both inputs are already sorted rather than throwing that information away and re-sorting from ' +
      'scratch.',
  },
];

@Component({
  selector: 'app-iterator-merging-two-external-iterators',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './merging-two-external-iterators.html',
  styleUrl: './merging-two-external-iterators.scss',
})
export class MergingTwoExternalIteratorsSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
