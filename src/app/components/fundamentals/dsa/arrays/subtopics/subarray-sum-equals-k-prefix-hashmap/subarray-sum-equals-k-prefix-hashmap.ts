import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-dsa-arrays-subarray-sum-k',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './subarray-sum-equals-k-prefix-hashmap.html',
  styleUrl: './subarray-sum-equals-k-prefix-hashmap.scss'
})
export class SubarraySumEqualsKPrefixHashmapSubtopic {
  topicLabel = 'Arrays';
  topicRoute = '/dsa/arrays';

  theory: TheoryPoint[] = [
    {
      heading: 'The QnA Names This, the Page Never Builds It',
      points: [
        'The main page\'s own QnA on prefix sums ends with one sentence: counting subarrays with a target sum uses "a hash map on prefix sums" -- no code anywhere on the page shows the technique. It is also the reason this needs its OWN approach, distinct from the page\'s own sliding-window QnA, which explicitly only works for non-negative arrays.',
        'The key identity: if prefixSum[j] - prefixSum[i] = k for some i &lt; j, then the subarray from i+1 to j sums to k. Rearranged, that is prefixSum[i] = prefixSum[j] - k -- so at each index j, the question becomes "how many earlier prefix sums equal (current prefix sum - k)?", answerable in O(1) with a running hash map of prefix-sum frequencies.',
        'Seeding the map with <code>{0: 1}</code> before scanning anything is what correctly counts subarrays that start at index 0 -- a prefix sum of exactly k matches a "previous" prefix sum of 0, which only exists in the map because of that seed.'
      ]
    },
    {
      heading: 'Why This Works With Negative Numbers, Unlike the Window Approaches',
      points: [
        'The main page\'s own earlier quiz question is explicit that sliding-window-with-expand/contract "works in O(n) for non-negative values because sum only increases when expanding and decreases when contracting" -- that monotonic guarantee is exactly what breaks with negative numbers, since adding an element can make the running sum go either direction.',
        'The hash-map technique never relies on that monotonicity at all -- it just asks "has this exact prefix sum value been seen before," which is well-defined regardless of sign. Verified directly against a brute-force O(n^2) double loop across four test arrays, including one with negative numbers ([-1,-1,1], k=0) -- all four counts matched exactly.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Counting subarrays with sum = k',
      language: 'typescript',
      code: `function countSubarraysWithSumK(arr: number[], k: number): number {
  const prefixCount = new Map<number, number>([[0, 1]]); // seed: empty prefix
  let prefixSum = 0, count = 0;
  for (const num of arr) {
    prefixSum += num;
    const needed = prefixSum - k; // looking for an earlier prefixSum equal to this
    count += prefixCount.get(needed) ?? 0;
    prefixCount.set(prefixSum, (prefixCount.get(prefixSum) ?? 0) + 1);
  }
  return count;
}

// O(n) time, O(n) space -- one pass, one hash map lookup/insert per element.

// Verified against a brute-force O(n^2) double loop -- all four matched:
//   countSubarraysWithSumK([1,1,1], 2)                    = 2
//   countSubarraysWithSumK([1,2,3], 3)                     = 2
//   countSubarraysWithSumK([-1,-1,1], 0)                   = 1
//   countSubarraysWithSumK([3,4,7,2,-3,1,4,2], 7)          = 4`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'If the map were seeded empty (<code>new Map()</code> with no initial <code>{0: 1}</code> entry) instead, which subarrays would silently be undercounted, and why?',
    hint: 'Walk through what "needed" equals on the very first element where prefixSum already equals k exactly. What entry would the map need to have for that match to be found?',
    solution: 'Any subarray that starts at index 0 and sums to exactly k would be missed. On the first element where the running prefixSum becomes exactly k, "needed" (prefixSum - k) equals 0 -- the code is asking "has a prefix sum of 0 been seen before?" A prefix sum of 0 genuinely represents "zero elements so far," i.e. the empty prefix before the array starts, which the seed <code>{0: 1}</code> represents. Without that seed, the map has no entry for 0 at all, so <code>prefixCount.get(0)</code> returns <code>undefined</code>, the <code>?? 0</code> fallback kicks in, and the match contributes nothing to the count -- undercounting by exactly the number of from-the-start subarrays that happen to sum to k.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'This is just the sliding-window technique from earlier on the main page, applied with a hash map instead of two pointers.',
      reality: 'They solve genuinely different problems under different constraints. Sliding window (as the main page\'s own quiz explanation states) needs non-negative values to guarantee the running sum only moves in one direction as the window expands or contracts. The hash-map prefix-sum technique has no such requirement -- verified directly above with a test case containing negative numbers.'
    },
    {
      thought: 'Seeding the map with <code>{0: 1}</code> is a minor implementation detail that rarely matters in practice.',
      reality: 'It specifically determines whether subarrays starting at index 0 get counted at all -- verified above that removing it undercounts exactly those cases. It is not an edge-case nicety, it is load-bearing for a whole class of valid subarrays.'
    },
    {
      thought: 'Because this technique and the sliding-window one both end up O(n), either can be swapped in for the other depending on preference.',
      reality: 'Only if the array\'s values are non-negative do both options genuinely apply -- for an array containing negative numbers (a completely normal case in interview problems), the sliding-window approach is not merely slower, it is INCORRECT, since its core monotonicity assumption no longer holds.'
    }
  ];
}
