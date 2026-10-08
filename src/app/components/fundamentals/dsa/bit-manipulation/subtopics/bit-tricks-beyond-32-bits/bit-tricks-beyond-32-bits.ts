import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-dsa-bit-tricks-beyond-32-bits',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './bit-tricks-beyond-32-bits.html',
  styleUrl: './bit-tricks-beyond-32-bits.scss'
})
export class BitTricksBeyond32BitsSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'The Same Code, Silently Truncated',
      points: [
        'The main page\'s last mistake warns that JavaScript bitwise operators work on 32-bit signed integers, but only shows <code>1 &lt;&lt; 32</code>. The page\'s own <code>isPowerOfTwo</code> and <code>hammingWeight</code> are affected too, and neither throws: they return wrong answers for numbers above 2^32.',
        'Each <code>&amp;</code> keeps only the low 32 bits of both operands. For n = 2^32 + 2^31, n converts to the int32 value -2^31 and n - 1 converts to 2^31 - 1, which share no bits, so <code>(n &amp; (n - 1)) === 0</code> and <code>isPowerOfTwo</code> returns true. It also returned true for 3 × 2^32 and for 2^40 + 2^10.',
        '<code>hammingWeight</code> drops the high bits the same way. It returned 1 for 2^33 + 1 (the true count is 2), 3 for 2^40 + 7 (true count 4) and 32 for 2^53 - 1 (true count 53). For numbers below 2^32 it was correct, including 4294967293 read as unsigned (31).',
        'BigInt operators do not truncate. The same <code>n &amp; (n - 1n)</code> check written with BigInt returned false for all three non-powers above and true for 2^40. JavaScript numbers are exact integers up to 2^53, so any input that can exceed 2^32 needs BigInt, or arithmetic such as repeated division by 2.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The page functions above 2^32, and BigInt versions',
      language: 'typescript',
      code: `// The main page's versions
function isPowerOfTwo(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0;
}
function hammingWeight(n: number): number {
  let count = 0;
  while (n) { count++; n &= n - 1; }
  return count;
}

isPowerOfTwo(2 ** 32 + 2 ** 31);  // true   WRONG
isPowerOfTwo(3 * 2 ** 32);        // true   WRONG
isPowerOfTwo(2 ** 40 + 2 ** 10);  // true   WRONG
hammingWeight(2 ** 33 + 1);       // 1      WRONG (2)
hammingWeight(2 ** 53 - 1);       // 32     WRONG (53)

// BigInt versions: no 32-bit conversion
function isPowerOfTwoBig(n: number | bigint): boolean {
  const b = BigInt(n);
  return b > 0n && (b & (b - 1n)) === 0n;
}
function hammingWeightBig(n: number | bigint): number {
  let b = BigInt(n), count = 0;
  while (b > 0n) { b &= b - 1n; count++; }
  return count;
}

isPowerOfTwoBig(2 ** 32 + 2 ** 31);  // false
isPowerOfTwoBig(2 ** 40);            // true
hammingWeightBig(2 ** 33 + 1);       // 2
hammingWeightBig(2 ** 53 - 1);       // 53`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'LeetCode\'s "Number of 1 Bits" passes a 32-bit unsigned value, so it may receive 4294967293. Does the page\'s hammingWeight handle that, even though the value is above 2^31?',
    hint: 'Which values lose information when converted to a 32-bit integer: those above 2^31, or those above 2^32?',
    solution: 'Yes. Any value below 2^32 keeps all of its bits when converted; values above 2^31 are just read as negative int32s, and n &= n - 1 still clears one set bit per step until the bit pattern is 0. It returned 31 for 4294967293, the correct count. Bits are only lost for values of 2^32 and above.',
  };

  misconceptions: Misconception[] = [
    {
      thought: 'If a bit trick would overflow, JavaScript would produce Infinity or throw, so a wrong answer would be noticed.',
      reality: 'Bitwise operators silently keep the low 32 bits. isPowerOfTwo returned a confident true for 3 × 2^32 with no error, warning or NaN.',
    },
    {
      thought: 'JavaScript numbers are 64-bit, so bit tricks work on 64 bits.',
      reality: 'Numbers are 64-bit floats with 53 bits of integer precision, but every bitwise operator first converts to a 32-bit integer. Only BigInt gives bitwise operations on wider integers.',
    },
  ];
}
