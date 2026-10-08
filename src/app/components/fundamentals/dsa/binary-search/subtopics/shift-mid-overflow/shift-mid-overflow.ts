import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-dsa-shift-mid-overflow',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './shift-mid-overflow.html',
  styleUrl: './shift-mid-overflow.scss'
})
export class ShiftMidOverflowSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'Why the Shortcut Breaks Only in JavaScript',
      points: [
        'The main page\'s Quick Reference originally gave the midpoint as <code>(lo+hi)&gt;&gt;1</code>, while its own mistake block said overflow is "unlikely" in JavaScript because numbers are 64-bit floats. Both cannot be true at once: the plain sum is exact up to 2^53, but every bitwise operator first converts its operand to a signed 32-bit integer.',
        'Verified directly: <code>(2**30 + 2**30) &gt;&gt; 1</code> evaluates to <code>-1073741824</code>, and <code>(2**31 + 2**31) &gt;&gt; 1</code> evaluates to <code>0</code>. Once <code>lo + hi</code> reaches 2^31, the midpoint is no longer between lo and hi at all.',
        'Arrays never get that long in practice, so the bug stays hidden in ordinary index searches. It shows up in binary search on the answer, where <code>hi</code> is a value rather than an index: an integer square root of 2^31 - 1 run with the shift midpoint returned 0 after one iteration, against the correct 46340.',
        'Rewriting it as <code>lo + ((hi - lo) &gt;&gt; 1)</code> does not help either: it fails as soon as the range <code>hi - lo</code> itself reaches 2^31. <code>Math.floor</code> on a normal number has no 32-bit step, so the main page\'s own templates were already correct; only the shortcut was wrong.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Integer square root with three midpoint formulas',
      language: 'typescript',
      code: `// Binary search on the answer: largest m with m * m <= x.
// Uses the "upper middle" so lo = mid always makes progress.
function isqrt(x: number, midOf: (lo: number, hi: number) => number): number {
  let lo = 0, hi = x;
  while (lo < hi) {
    const mid = midOf(lo, hi + 1);
    if (mid * mid <= x) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

const shiftSum   = (lo: number, hi: number) => (lo + hi) >> 1;
const shiftRange = (lo: number, hi: number) => lo + ((hi - lo) >> 1);
const floorRange = (lo: number, hi: number) => lo + Math.floor((hi - lo) / 2);

isqrt(1_000_000_000, shiftSum);   // 31622  correct (sum stays below 2^31)
isqrt(2 ** 31 - 1, shiftSum);     // 0      WRONG
isqrt(2 ** 31 - 1, shiftRange);   // 0      WRONG (range is 2^31)
isqrt(2 ** 31 - 1, floorRange);   // 46340  correct
isqrt(3_000_000_000, floorRange); // 54772  correct

// What the shift actually does past 2^31:
(2 ** 30 + 2 ** 30) >> 1;  // -1073741824
(2 ** 31 + 2 ** 31) >> 1;  // 0`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Some codebases use <code>(lo + hi) &gt;&gt;&gt; 1</code> (unsigned shift) instead of <code>&gt;&gt; 1</code>. Does that fix the problem for every answer range a JavaScript number can hold?',
    hint: 'The unsigned shift converts to an unsigned 32-bit integer instead of a signed one. What is its largest value?',
    solution: 'No. The unsigned shift converts to a 32-bit unsigned integer, so it is correct while lo + hi stays below 2^32 (about 4.29 billion) and wrong past that. It doubles the safe range compared with >> 1 but does not remove the limit. Answer spaces such as "minimum time in milliseconds" or sums of large weights easily pass 2^32, so lo + Math.floor((hi - lo) / 2) is the only form that stays correct up to the 2^53 limit of exact integers.',
  };

  misconceptions: Misconception[] = [
    {
      thought: 'JavaScript has no integer overflow, so midpoint overflow is only a C++ and Java interview concern.',
      reality: 'Plain addition does not overflow until 2^53, but bitwise operators (<code>&gt;&gt;</code>, <code>|</code>, <code>&amp;</code>, <code>~~</code>) all convert their operands to 32-bit integers first. The popular <code>(lo + hi) &gt;&gt; 1</code> and <code>~~((lo + hi) / 2)</code> idioms therefore reintroduce exactly the 32-bit limit the language otherwise avoids.',
    },
    {
      thought: 'The bug would show up quickly in tests because the search would crash.',
      reality: 'It does not crash. A negative or zero midpoint is still a valid number, the loop keeps running, and the function returns a plausible but wrong value. Index searches never reach 2^31, so tests on arrays pass; only searches over large value ranges hit it.',
    },
  ];
}
