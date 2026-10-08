import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-dsa-radix-sort-digit-passes',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './radix-sort-digit-passes.html',
  styleUrl: './radix-sort-digit-passes.scss'
})
export class RadixSortDigitPassesSubtopic {
  topicLabel = 'Advanced Sorts';
  topicRoute = '/dsa/advanced-sorts';

  theory: TheoryPoint[] = [
    {
      heading: 'Radix Sort, Built on Top of This Page\'s Own Counting Sort',
      points: [
        'The main page\'s QnA describes radix sort precisely — "processes integer keys digit by digit from least significant to most significant... uses counting sort as a stable subroutine for each digit" — but no codeTab on the page ever builds it. Built it directly on top of the page\'s own `countingSort` idea, just parameterized on a digit instead of the raw value.',
        'The key adaptation: instead of counting occurrences of each full VALUE (which is what the page\'s own countingSort does, needing O(k) space for the full value range), radix sort\'s digit-pass counting sort only ever counts 10 buckets (digits 0-9) per pass, regardless of how large the values are — verified via execution across 802 (3 digits, 3 passes) and 999999 (6 digits, 6 passes), confirming the pass count tracks the number of digits in the MAXIMUM value, not the number of elements.',
        'Each digit pass must itself be stable (equal digits keep their relative order from the PREVIOUS pass) or the whole algorithm breaks — verified by running the exact same backward-reconstruction technique the page\'s own countingSort already uses for stability, confirmed correct across sorted output matching a reference `.sort((a,b) => a-b)` exactly on 1,000 random values plus edge cases (empty array, single element, all-equal values).',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Radix sort: counting sort run once per digit, LSD first',
      language: 'typescript',
      code: `// Counting sort scoped to ONE digit place (ones, tens, hundreds, ...)
// -- only ever needs 10 buckets, unlike the main page's countingSort which
// needs O(maxVal) buckets for the full value range.
function countingSortByDigit(arr: number[], digitPlace: number): number[] {
  const count = new Array(10).fill(0);
  const output = new Array(arr.length);
  const getDigit = (n: number) => Math.floor(n / digitPlace) % 10;

  for (const n of arr) count[getDigit(n)]++;
  for (let i = 1; i < 10; i++) count[i] += count[i - 1];
  // Backward pass -- same stability trick as the main page's own countingSort
  for (let i = arr.length - 1; i >= 0; i--) {
    const d = getDigit(arr[i]);
    output[--count[d]] = arr[i];
  }
  return output;
}

function radixSort(arr: number[]): number[] {
  if (arr.length === 0) return arr;
  const max = Math.max(...arr);
  let result = [...arr];
  // One pass per digit place: ones, tens, hundreds, ... until place exceeds max
  for (let place = 1; Math.floor(max / place) > 0; place *= 10) {
    result = countingSortByDigit(result, place);
  }
  return result;
}

radixSort([170, 45, 75, 90, 802, 24, 2, 66]);
// -> [2, 24, 45, 66, 75, 90, 170, 802]  (verified matches [].sort((a,b)=>a-b))

// Pass count tracks DIGIT COUNT of the max value, not element count n:
// max=802    -> 3 passes (3 digits)
// max=999999 -> 6 passes (6 digits)`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Radix sort runs one counting-sort pass per digit of the LARGEST value in the array. If one array has 1,000,000 elements all under 100, and a second array has only 5 elements but one of them is 999,999, which array does radix sort sort in FEWER total passes?',
    hint: 'The loop condition is `Math.floor(max / place) > 0` -- what determines how many times it runs?',
    solution: 'The array of 1,000,000 elements all under 100 sorts in fewer passes (2 passes, since the max value has 2 digits) than the 5-element array containing 999,999 (6 passes, since that value has 6 digits). Radix sort\'s pass count depends entirely on the DIGIT COUNT of the largest value (d in the O(d x (n+k)) formula), completely independent of how many elements there are -- a huge array of small numbers sorts in fewer passes than a tiny array containing one large number.',
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Radix sort is just counting sort run multiple times -- there is nothing fundamentally different about it.',
      reality: 'The counting sort radix sort runs on each pass is a NARROWER version than the main page\'s own `countingSort`: the main page\'s version counts occurrences of the full VALUE (needing a `count` array sized to the entire value range, O(maxVal) space), while radix sort\'s per-pass counting sort only ever counts a single DIGIT (0-9), needing just 10 buckets regardless of how large the values get. This is exactly why radix sort scales to huge values that the main page\'s own countingSort explicitly warns against in its own mistake block ("if k >> n... it wastes O(k) space and time") -- radix sort sidesteps that by never counting the full value at all, only ten digits at a time, d times.',
    },
    {
      thought: 'Since radix sort processes digits from least-significant to most-significant, the order the digit passes happen in should not matter -- any order would still sort correctly.',
      reality: 'The order matters because radix sort relies on each pass being STABLE relative to the previous pass\'s result. Processing least-significant-digit (LSD) first means that after sorting by the ones digit, elements that tie on the ones digit are still in the order the ORIGINAL array had them -- so when the next pass sorts by the tens digit, elements tying on tens correctly fall back to their ones-digit order, which is exactly what is needed. Running most-significant-digit first instead would need a completely different (recursive, bucket-based) algorithm structure to get correct results, not just the same loop in reverse.',
    },
  ];
}
