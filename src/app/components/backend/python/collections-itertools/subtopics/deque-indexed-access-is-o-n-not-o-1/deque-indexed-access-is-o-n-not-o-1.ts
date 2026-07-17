import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './deque-indexed-access-is-o-n-not-o-1.html',
  styleUrl: './deque-indexed-access-is-o-n-not-o-1.scss'
})
export class DequeIndexedAccessIsONNotO1Subtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'deque wins at both ends — but deque[i] in the middle is O(n), not O(1) like a list',
      points: [
        'The main page\'s own theory and mistakes both make a strong, correct case for deque over list for queue operations: "deque.popleft() is O(1); list.pop(0) is O(n)." It\'s easy to over-generalize this into "deque is just a strictly better list" — faster at everything a list does, with no tradeoff.',
        'Python\'s own collections documentation states the actual tradeoff directly: "Indexed access is O(1) at both ends but slows to O(n) in the middle. For fast random access, use lists instead." So deque[0] and deque[-1] (the two ends) are genuinely O(1), matching a list\'s indexed access — but deque[len(dq) // 2], or any index that isn\'t right at one of the two ends, requires traversing from the nearest end, making it O(n) in the general case.',
        'This is a real, structural tradeoff — a deque is optimized specifically for O(1) operations at both ends (append, appendleft, pop, popleft), which requires an internal structure genuinely different from a list\'s single contiguous, directly-indexable array. The main page\'s own sliding-window example (deque(maxlen=5)) never touches the middle by index, which is exactly why that specific use case never runs into this cost at all.',
      ]
    },
    {
      heading: 'Where this actually matters — and the main page\'s own solution algorithm has an important detail worth noticing',
      points: [
        'Any algorithm that treats a deque like a list for RANDOM index-based access — binary search, repeatedly reading deque[middle_index], or iterating with an explicit numeric index rather than a for loop — silently degrades from what would be O(log n) or O(1) per access on a list to O(n) per access on a deque, turning an algorithm that looked efficient on paper into one that is actually much slower in practice.',
        'The main page\'s own sliding_window_max() solution is a good example of doing this CORRECTLY: it only ever accesses dq[0] and dq[-1] (both ends, both genuinely O(1)) — never an arbitrary middle index — which is precisely why using a deque there is a real performance win rather than an accidental cost. The lesson generalizes: deque is the right tool specifically for algorithms that only ever need the two ends, not for anything requiring genuine random access throughout the whole structure.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Both-ends access is O(1) — middle access is O(n)',
      language: 'typescript',
      code: `from collections import deque
import time

big_deque = deque(range(1_000_000))
big_list  = list(range(1_000_000))

# Both ends — deque is genuinely O(1), same as list:
start = time.perf_counter()
for _ in range(100_000):
    _ = big_deque[0]
    _ = big_deque[-1]
print("deque both-ends:", time.perf_counter() - start)   # fast

# The MIDDLE — deque degrades to O(n); list stays O(1):
mid = len(big_deque) // 2
start = time.perf_counter()
for _ in range(1_000):   # note: far FEWER iterations than above
    _ = big_deque[mid]
print("deque middle:", time.perf_counter() - start)      # noticeably slower
                                                            # per-access, despite
                                                            # 100x fewer iterations

start = time.perf_counter()
for _ in range(100_000):
    _ = big_list[mid]
print("list middle:", time.perf_counter() - start)        # stays fast — O(1)
                                                            # regardless of index`,
    },
    {
      label: 'The main page\'s own sliding-window solution only ever touches the ends — by design',
      language: 'typescript',
      code: `from collections import deque

def sliding_window_max(data: list[int], k: int) -> list[int]:
    result = []
    dq: deque = deque()   # stores indices; front = max index
    for i, val in enumerate(data):
        # dq[0] — reading the FRONT (an end) — genuinely O(1)
        while dq and dq[0] < i - k + 1:
            dq.popleft()
        # dq[-1] — reading the BACK (the other end) — also O(1)
        while dq and data[dq[-1]] < val:
            dq.pop()
        dq.append(i)
        if i >= k - 1:
            result.append(data[dq[0]])
    return result

# Every single deque access here — dq[0], dq[-1], popleft(), pop(),
# append() — touches only the front or back. Never dq[some_middle_index].
# This is EXACTLY why deque is the correct, efficient choice for this
# specific algorithm — it never pays the O(n) middle-access cost at all.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer replaces a list-based binary search algorithm\'s underlying data structure with a deque, reasoning that "deque is generally faster than list, so this should only help performance." Benchmarks afterward show the binary search is now dramatically SLOWER than the original list-based version, not faster. Explain why, using what this subtopic covers.',
    hint: 'What does binary search fundamentally do at each step — does it repeatedly access elements at the two ENDS of the collection, or does it repeatedly jump to arbitrary MIDDLE indices (computed as (low + high) // 2)? What does this subtopic\'s theory say about the cost of accessing a deque by index, depending on where that index falls?',
    solution: 'The slowdown happens because binary search\'s entire algorithm is built around repeatedly accessing an arbitrary MIDDLE index (mid = (low + high) // 2) at every single step, narrowing the search range — and per Python\'s own collections documentation, deque indexed access "is O(1) at both ends but slows to O(n) in the middle." Binary search almost never touches the two ends of the collection; it specifically needs fast access to whatever index the algorithm\'s current midpoint happens to be, which for a deque means paying an O(n) traversal cost on nearly every single comparison. Since binary search performs O(log n) such accesses, and each one now individually costs O(n) instead of the O(1) a list provides, the overall complexity degrades from the expected O(log n) to O(n log n) — asymptotically much worse, and the benchmark results reflect exactly that. The developer\'s reasoning ("deque is generally faster") was based on an incomplete picture — deque genuinely IS faster specifically for append/appendleft/pop/popleft and both-ends indexed access, but binary search is precisely the kind of algorithm that needs neither of those; it needs fast RANDOM access throughout the whole structure, which is exactly what a plain list, not a deque, is built for. The fix is simply reverting to a list for this specific algorithm — deque should be reserved for algorithms (like the main page\'s own sliding-window pattern) that genuinely only ever touch the two ends.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since deque provides O(1) operations that a list can only do in O(n) (like popleft), deque must be a strictly faster, more capable replacement for list in every situation, with indexed access being just as fast either way.',
      reality: 'This subtopic\'s theory and first code example both show this is incorrect — Python\'s own documentation confirms deque\'s indexed access is only O(1) at the two ends, degrading to O(n) in the middle, which is genuinely SLOWER than a list\'s consistently O(1) indexed access anywhere in the structure.'
    },
    {
      thought: 'An algorithm that works correctly and efficiently with a list (like binary search) will automatically keep the same efficiency characteristics if the underlying list is simply swapped for a deque, since both support the same [] indexing syntax.',
      reality: 'This subtopic\'s exercise shows the opposite — supporting the same syntax does not mean the same performance; an algorithm relying on fast random access throughout the whole structure (not just the two ends) can become dramatically slower on a deque, even though the code itself requires no changes to keep running.'
    },
    {
      thought: 'The main page\'s own recommendation to prefer deque over list for queue-like operations generalizes to preferring deque over list broadly, for any use case involving frequent element access.',
      reality: 'This subtopic\'s second code example shows the real, narrower scope of that recommendation — deque is the right choice specifically when an algorithm only ever needs the two ends (append/appendleft/pop/popleft, or reading index 0/-1), exactly matching the main page\'s own sliding-window solution, not for general-purpose indexed access throughout a collection.'
    }
  ];
}
