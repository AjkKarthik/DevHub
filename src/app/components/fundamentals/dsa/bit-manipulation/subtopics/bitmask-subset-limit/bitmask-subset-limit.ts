import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-dsa-bitmask-subset-limit',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './bitmask-subset-limit.html',
  styleUrl: './bitmask-subset-limit.scss'
})
export class BitmaskSubsetLimitSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'Where (1 << n) Stops Meaning 2^n',
      points: [
        'The main page\'s <code>allSubsets</code> loops <code>for (let mask = 0; mask &lt; (1 &lt;&lt; n); mask++)</code>. That bound is 2^n only while 2^n fits in a 32-bit signed integer: <code>1 &lt;&lt; 30</code> is 1,073,741,824, but <code>1 &lt;&lt; 31</code> is -2,147,483,648 and <code>1 &lt;&lt; 32</code> is 1.',
        'So with 31 elements, the loop condition <code>0 &lt; -2147483648</code> is false on the first check and the function returns an empty array — not even the empty subset. With 32 elements the bound is 1 and only the empty subset comes back. Both return without any error.',
        'In practice no one enumerates 2^31 subsets, which is why the main page puts bitmask DP at "typically under 20-25" elements. The real risk is a guard that assumes the code "works up to 32 bits": the useful range of <code>1 &lt;&lt; n</code> as a count is n ≤ 30, and the mask itself can address bits 0 to 30 safely; bit 31 is the sign bit.',
        'The same limit affects the page\'s <code>subsetXORSum</code>, which multiplies by <code>1 &lt;&lt; (n - 1)</code>: from 32 elements upward the multiplier is wrong. For an empty array it multiplies by <code>1 &lt;&lt; -1</code>, which is also -2,147,483,648, and returns -0. <code>2 ** n</code> has no such limit.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'How many times the subset loop runs',
      language: 'typescript',
      code: `1 << 30;   //  1073741824
1 << 31;   // -2147483648   (sign bit)
1 << 32;   //  1            (shift count is taken mod 32)

// How many iterations does the page's loop header allow? (capped for the demo)
function loopIterations(n: number, cap = 4): number {
  let count = 0;
  for (let mask = 0; mask < (1 << n); mask++) {
    if (++count >= cap) break;
  }
  return count;
}
loopIterations(3);    // 4  (capped; would be 8)
loopIterations(30);   // 4  (capped; would be 2^30)
loopIterations(31);   // 0  -> allSubsets returns []
loopIterations(32);   // 1  -> allSubsets returns [[]]

// Safer bound for counts: 2 ** n has no 32-bit limit
for (let mask = 0; mask < 2 ** 3; mask++) { /* 8 iterations */ }

// subsetXORSum on an empty array:
[].reduce((or, n) => or | n, 0) * (1 << (0 - 1));   // -0`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A bitmask DP stores "visited cities" in one integer and checks <code>(mask &gt;&gt; i) &amp; 1</code>. Up to how many cities can it hold safely, and what changes if you switch the mask to BigInt?',
    hint: 'Which bit positions keep their meaning after a 32-bit conversion, and is bit 31 safe for counting with 1 &lt;&lt; n?',
    solution: 'Testing and setting individual bits works for positions 0 to 31, but the full-mask value (1 << n) - 1 and the loop bound 1 << n only behave for n up to 30, so 30 cities is the practical limit with number masks. A BigInt mask has no width limit, but each operation is slower and the DP table indexed by mask would already be far too large long before that, so the 20-25 element guidance on the main page is the real ceiling.',
  };

  misconceptions: Misconception[] = [
    {
      thought: 'An over-large bitmask loop would run for a very long time, so a wrong size would be easy to spot.',
      reality: 'With 31 elements it does the opposite: the bound is negative, the loop runs zero times, and the function returns an empty result instantly.',
    },
    {
      thought: 'Since a 32-bit integer has 32 bits, a bitmask can represent sets of up to 32 elements.',
      reality: 'Bit 31 is the sign bit. Testing it works, but any arithmetic on the full mask, such as 1 &lt;&lt; 31 or comparing against it, sees a negative number. 30 elements is the safe limit for count-style uses.',
    },
  ];
}
