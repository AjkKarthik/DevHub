import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-dsa-merge-intervals-mutation',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './merge-intervals-mutation.html',
  styleUrl: './merge-intervals-mutation.scss'
})
export class MergeIntervalsMutationSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'Correct Output, Damaged Input',
      points: [
        'The main page\'s original <code>merge</code> returned the right merged intervals, but it did two things to the array it was given. <code>intervals.sort(...)</code> reorders the caller\'s array in place, and <code>result</code> starts with the caller\'s own interval objects, so <code>last[1] = Math.max(...)</code> writes into them.',
        'Run on <code>[[2,6],[1,3],[8,10]]</code>, it returned <code>[[1,6],[8,10]]</code> — correct — and left the caller\'s array as <code>[[1,6],[2,6],[8,10]]</code>: reordered, and with the interval that used to be [1,3] now reading [1,6].',
        'In an interview this goes unnoticed. In an app, the same array is often still in use — a calendar showing the original meetings, or a second calculation on the same data — and it now holds intervals nobody entered.',
        'It also returned <code>[undefined]</code> for an empty input, because <code>[intervals[0]]</code> wraps a missing element. The main page now copies each interval before sorting and returns <code>[]</code> for empty input.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Original vs copy-first merge',
      language: 'typescript',
      code: `// Original: sorts the caller's array and edits the caller's intervals
function mergeInPlace(intervals: number[][]): number[][] {
  intervals.sort((a, b) => a[0] - b[0]);
  const result: number[][] = [intervals[0]];
  for (let i = 1; i < intervals.length; i++) {
    const last = result[result.length - 1];
    if (intervals[i][0] <= last[1]) last[1] = Math.max(last[1], intervals[i][1]);
    else result.push(intervals[i]);
  }
  return result;
}

const meetings = [[2, 6], [1, 3], [8, 10]];
mergeInPlace(meetings);   // [[1, 6], [8, 10]]   correct result
meetings;                 // [[1, 6], [2, 6], [8, 10]]   caller's data changed
mergeInPlace([]);         // [undefined]

// Copy-first version (now on the main page)
function merge(intervals: number[][]): number[][] {
  if (intervals.length === 0) return [];
  const sorted = intervals.map(([s, e]) => [s, e]).sort((a, b) => a[0] - b[0]);
  const result: number[][] = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const last = result[result.length - 1];
    if (sorted[i][0] <= last[1]) last[1] = Math.max(last[1], sorted[i][1]);
    else result.push(sorted[i]);
  }
  return result;
}

const meetings2 = [[2, 6], [1, 3], [8, 10]];
merge(meetings2);   // [[1, 6], [8, 10]]
meetings2;          // [[2, 6], [1, 3], [8, 10]]   unchanged
merge([]);          // []`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Would replacing the first line with <code>const sorted = [...intervals].sort(...)</code> be enough to protect the caller\'s data?',
    hint: 'What does the spread copy: the outer array, or the inner [start, end] arrays too?',
    solution: 'No. The spread makes a new outer array, so the caller\'s order is preserved, but the inner [start, end] arrays are still shared. The line last[1] = Math.max(...) would still change the caller\'s interval objects. Each inner array must be copied as well, which is what intervals.map(([s, e]) => [s, e]) does.',
  };

  misconceptions: Misconception[] = [
    {
      thought: 'If a function returns the right answer, it is correct.',
      reality: 'A function can also change its inputs. Here the return value was right while the caller\'s array was reordered and one of its intervals rewritten. Whether that matters depends on who else holds the array, so it is safer not to modify inputs unless the function says it does.',
    },
    {
      thought: 'Array.prototype.sort returns a sorted copy.',
      reality: 'sort works in place and returns the same array. Use toSorted (ES2023) or sort a copy when the original order must be kept.',
    },
  ];
}
