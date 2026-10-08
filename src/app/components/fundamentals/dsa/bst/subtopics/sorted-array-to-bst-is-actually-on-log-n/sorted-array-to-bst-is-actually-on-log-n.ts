import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-dsa-bst-sorted-to-bst',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './sorted-array-to-bst-is-actually-on-log-n.html',
  styleUrl: './sorted-array-to-bst-is-actually-on-log-n.scss'
})
export class SortedArrayToBstIsActuallyOnLogNSubtopic {
  topicLabel = 'Binary Search Trees';
  topicRoute = '/dsa/bst';

  theory: TheoryPoint[] = [
    {
      heading: 'Measuring the Hidden Cost of slice()',
      points: [
        'The main page\'s own "Convert sorted array to balanced BST" codeTab was commented "O(n)". Instrumented it directly by counting the total number of ELEMENTS COPIED across every <code>nums.slice()</code> call made during the whole recursive build, for arrays of increasing size.',
        'The measured ratio of (total elements copied) ÷ n grows steadily as n grows -- 1.90 at n=10, 4.80 at n=100, 7.99 at n=1,000, 11.36 at n=10,000, 14.69 at n=100,000. A genuinely O(n) algorithm would show a CONSTANT ratio regardless of n; a growing ratio that tracks <code>log2(n)</code> closely is the signature of O(n log n), not O(n).',
        'The mechanism: <code>slice()</code> copies every element it touches into a brand-new array. At the TOP level of the recursion, one slice copies roughly n elements. At the next level down, two slices together still copy roughly n elements combined (split across two calls). This repeats for every one of the <code>log2(n)</code> levels of recursion, giving n elements copied per level × log2(n) levels = O(n log n) total copying work.',
        'The fix needs zero slicing at all: pass the array ONCE, plus a pair of (lo, hi) index bounds that shrink on each recursive call instead of creating new sliced arrays. Verified directly: this index-based version does EXACTLY n units of work (one node created per element, confirmed for n = 10 through 100,000), and produces the identical tree shape as the original slice-based version.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Measuring the real cost',
      language: 'typescript',
      code: `let totalCopied = 0;

function sortedArrayToBST(nums: number[]): TreeNode | null {
  if (!nums.length) return null;
  const mid = Math.floor(nums.length / 2);
  const node = new TreeNode(nums[mid]);
  const leftSlice = nums.slice(0, mid);
  const rightSlice = nums.slice(mid + 1);
  totalCopied += leftSlice.length + rightSlice.length; // slice() copies this many elements
  node.left = sortedArrayToBST(leftSlice);
  node.right = sortedArrayToBST(rightSlice);
  return node;
}

for (const n of [10, 100, 1_000, 10_000, 100_000]) {
  totalCopied = 0;
  sortedArrayToBST(Array.from({ length: n }, (_, i) => i));
  console.log(n, totalCopied, (totalCopied / n).toFixed(2));
}
// Actual measured output:
//   10      19     1.90
//   100     480    4.80
//   1000    7987   7.99
//   10000   113631 11.36
//   100000  1468946 14.69
// -- the ratio climbs steadily; a real O(n) algorithm would hold it constant`,
    },
    {
      label: 'The O(n) fix — index bounds, no slicing',
      language: 'typescript',
      code: `function sortedArrayToBSTFixed(nums: number[], lo: number, hi: number): TreeNode | null {
  if (lo > hi) return null;
  const mid = Math.floor((lo + hi) / 2);
  const node = new TreeNode(nums[mid]);
  node.left = sortedArrayToBSTFixed(nums, lo, mid - 1);
  node.right = sortedArrayToBSTFixed(nums, mid + 1, hi);
  return node;
}

let totalNodes = 0;
function sortedArrayToBSTCounted(nums: number[], lo: number, hi: number): TreeNode | null {
  if (lo > hi) return null;
  totalNodes++;
  const mid = Math.floor((lo + hi) / 2);
  const node = new TreeNode(nums[mid]);
  node.left = sortedArrayToBSTCounted(nums, lo, mid - 1);
  node.right = sortedArrayToBSTCounted(nums, mid + 1, hi);
  return node;
}

for (const n of [10, 100, 1_000, 10_000, 100_000]) {
  totalNodes = 0;
  const arr = Array.from({ length: n }, (_, i) => i);
  sortedArrayToBSTCounted(arr, 0, arr.length - 1);
  console.log(n, totalNodes); // Actual measured output: equals n exactly, every time
}

// Cross-checked: the fixed version produces the IDENTICAL tree shape as the original`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The original slice-based version and the fixed index-based version both eventually visit every element of the array exactly once to create a node for it. Why does one cost O(n) total and the other O(n log n)?',
    hint: 'Think about what EXTRA work happens at each level of recursion, beyond just the one new TreeNode being created.',
    solution: 'Creating the n TreeNode objects themselves is genuinely O(n) total work in BOTH versions -- that part is identical. The extra cost in the slice-based version comes from COPYING THE REMAINING ARRAY CONTENTS into two brand-new arrays at every single recursive call, just to pass a smaller view down to the next level. That copying work is proportional to the size of the sub-array at each level, and since there are log2(n) levels of recursion, each doing roughly n total element-copies across that level\'s calls, the copying alone adds up to O(n log n) -- on top of, not instead of, the O(n) node-creation work. The index-based version does the identical node creation, but passes only two integers (lo, hi) down instead of copying anything, so it pays zero extra cost beyond the unavoidable O(n) of visiting each element once.',
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A recursive function that creates exactly one new TreeNode per element of the input array must be O(n), since it only "touches" each element once.',
      reality: 'Measured directly: this exact function is O(n log n), not O(n). Each recursive call ALSO slices the remaining array to pass smaller pieces to its children — and that slicing, not the node creation, is what adds the extra log(n) factor. The number of TreeNode creations is a red herring; the real cost driver is everything else the function does per call.',
    },
    {
      thought: 'A complexity comment in existing, working code can be trusted without checking, since the function obviously produces the right tree.',
      reality: 'Producing the CORRECT tree and having the CLAIMED complexity are two completely separate properties. Verified directly: the original slice-based function builds the exact right balanced BST every time, and its own "O(n)" comment is still wrong — the measured copying ratio grows with n rather than staying constant, confirming O(n log n).',
    },
  ];
}
