import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-dsa-right-shift-floors-negatives',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './right-shift-floors-negatives.html',
  styleUrl: './right-shift-floors-negatives.scss'
})
export class RightShiftFloorsNegativesSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'Shifts Are Not Multiplication and Division in Disguise',
      points: [
        'The main page\'s Quick Reference described <code>n &gt;&gt; k</code> as "divide by 2^k" and <code>n &lt;&lt; k</code> as "multiply by 2^k", and a quiz explanation added that shifts are faster than multiplication. In JavaScript each of these has a condition the descriptions left out.',
        'Right shift rounds toward negative infinity. <code>-5 &gt;&gt; 1</code> is -3, while <code>Math.trunc(-5 / 2)</code> is -2; <code>-7 &gt;&gt; 2</code> is -2 against -1; and <code>-1 &gt;&gt; 1</code> stays -1 forever. Code that halves a value in a loop until it reaches 0 never terminates for a negative start.',
        'Both shifts first convert the value to a 32-bit signed integer. <code>2**30 &lt;&lt; 1</code> is -2147483648, and right shift on a value above 2^31 turns it negative before shifting: <code>3e9 &gt;&gt; 1</code> is -647483648. <code>3e9 &gt;&gt;&gt; 1</code> gives the expected 1,500,000,000 because unsigned shift reads the bits as an unsigned 32-bit value, and <code>Math.floor(3e9 / 2)</code> works for any safe integer.',
        'For counting, masking and bit tricks, shifts are the right tool. For arithmetic on values that may be negative or large, use <code>*</code>, <code>/</code> and <code>Math.floor</code> or <code>Math.trunc</code>, and say which rounding you mean.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Shift results vs arithmetic, measured in Node',
      language: 'typescript',
      code: `// Right shift floors; division with Math.trunc rounds toward zero
-5 >> 1;               // -3
Math.trunc(-5 / 2);    // -2
Math.floor(-5 / 2);    // -3   (>> matches floor, not trunc)
-7 >> 2;               // -2
Math.trunc(-7 / 4);    // -1
-1 >> 1;               // -1   (never reaches 0)

// 32-bit conversion before shifting
2 ** 30 << 1;          // -2147483648
3e9 >> 1;              // -647483648   (3e9 does not fit in a signed int32)
3e9 >>> 1;             // 1500000000   (unsigned shift)
Math.floor(3e9 / 2);   // 1500000000   (no 32-bit limit)

// A halving loop that hangs on negative input:
function halvingSteps(n: number): number {
  let steps = 0;
  while (n !== 0) { n >>= 1; steps++; }   // -1 >> 1 === -1, so this never ends for n < 0
  return steps;
}
halvingSteps(40);   // 6
// halvingSteps(-40) would loop forever`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A binary search midpoint is written as <code>(lo + hi) &gt;&gt; 1</code>. When lo and hi are both non-negative, is the floor-versus-truncate difference a problem? What about the 32-bit conversion?',
    hint: 'Floor and truncate only disagree for negative numbers. What happens when lo + hi passes 2^31?',
    solution: 'For non-negative values, floor and truncate agree, so the rounding is fine. The 32-bit conversion is the real problem: once lo + hi reaches 2^31, the sum is read as a negative int32 and the midpoint goes negative or wraps. That is exactly the failure covered in the Binary Search topic, where an integer square root of 2^31 - 1 returned 0. Use lo + Math.floor((hi - lo) / 2) instead.',
  };

  misconceptions: Misconception[] = [
    {
      thought: 'x >> 1 is the same as dividing by 2 and dropping the remainder.',
      reality: 'Only for non-negative x. For negative odd x it rounds down, not toward zero: -5 >> 1 is -3 while truncating division gives -2. It matches Math.floor, not Math.trunc.',
    },
    {
      thought: 'Shifting is a faster way to multiply or divide by 2 in JavaScript.',
      reality: 'It is a different operation: it converts to a 32-bit integer first, so large or fractional values change meaning. Whatever the speed, a shift that returns -647483648 for 3e9 / 2 is not a faster division.',
    },
  ];
}
