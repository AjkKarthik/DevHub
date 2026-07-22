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
  templateUrl: './heapq-tuples-need-a-tie-breaker-for-equal-priorities.html',
  styleUrl: './heapq-tuples-need-a-tie-breaker-for-equal-priorities.scss'
})
export class HeapqTuplesNeedATieBreakerForEqualPrioritiesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Equal priorities force heapq to compare the SECOND tuple element — which can raise TypeError',
      points: [
        'The main page\'s own code example pushes (priority, task) tuples directly: heapq.heappush(heap, (2, "task B")). This works fine in that specific example because every priority happens to be unique (1, 2, 3) and the second elements are plain, mutually-comparable strings — but neither of those two conditions is guaranteed in general.',
        'heapq compares heap entries the same way Python compares tuples generally: element by element, left to right, only moving to the next element if the current ones are EQUAL. So if two entries share the same priority, Python falls through to comparing the SECOND tuple element to break the tie. Python\'s own heapq documentation states this directly in its "Priority Queue Implementation Notes" section: "tuple comparison breaks for (priority, task) pairs if the priorities are equal and the tasks do not have a default comparison order."',
        'Concretely: pushing (5, {"id": 1}) and (5, {"id": 2}) — two entries with the same priority, whose second elements are plain dicts — raises TypeError the moment heapq needs to compare them to maintain the heap invariant, since dicts have no defined ordering (<) at all. This can happen unpredictably, only when a tie in priority actually occurs, meaning code can work correctly for a long time before a coincidental tie finally triggers the crash.',
      ]
    },
    {
      heading: 'The documented fix — an always-unique tie-breaker as the middle element',
      points: [
        'Python\'s own documentation recommends a specific, three-element pattern precisely to prevent this: "store entries as 3-element list including the priority, an entry count, and the task. The entry count serves as a tie-breaker... and since no two entry counts are the same, the tuple comparison will never attempt to directly compare two tasks." The recommended implementation uses itertools.count() to generate a strictly increasing, always-unique counter value for each entry.',
        'This works because the entry count is guaranteed unique across every single push — meaning ties on priority alone are resolved by the count (which is always comparable, being plain integers) LONG before Python\'s tuple comparison would ever need to reach the third element (the actual task/payload) at all. The task object itself becomes fully irrelevant to comparison, regardless of whether it happens to support ordering or not.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Equal priorities + non-orderable payloads = TypeError',
      language: 'typescript',
      code: `import heapq

heap = []
heapq.heappush(heap, (5, {"id": 1, "name": "Task A"}))
heapq.heappush(heap, (5, {"id": 2, "name": "Task B"}))
# Both entries have the SAME priority (5) — heapq must compare the
# second element to break the tie...

# TypeError: '<' not supported between instances of 'dict' and 'dict'
# — dicts have no defined ordering at all. This can happen the FIRST
# time two entries genuinely tie on priority, even if earlier pushes
# (with unique priorities) worked perfectly fine.`,
    },
    {
      label: 'The documented fix — a unique entry count as a tie-breaker',
      language: 'typescript',
      code: `import heapq
import itertools

counter = itertools.count()   # 0, 1, 2, 3, ... — always increasing

heap = []
heapq.heappush(heap, (5, next(counter), {"id": 1, "name": "Task A"}))
heapq.heappush(heap, (5, next(counter), {"id": 2, "name": "Task B"}))
# Same priority (5) again — but now the SECOND element (the count)
# breaks the tie: 0 != 1, so Python never needs to compare the two
# dicts at all. No error.

while heap:
    priority, count, task = heapq.heappop(heap)
    print(priority, task["name"])
# 5 Task A   <- pushed first, so its count (0) is lower — pops first
# 5 Task B

# This is exactly the pattern Python's own heapq documentation
# recommends in its "Priority Queue Implementation Notes" section —
# the entry count guarantees tuple comparison NEVER reaches the
# (potentially non-orderable) task object.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A task scheduler pushes (priority, task_dict) tuples onto a heap, where task_dict is an arbitrary dict describing each job. It works correctly in testing for weeks, since test jobs happen to always be assigned distinct priorities. In production, two jobs are legitimately submitted with the same priority for the first time, and the scheduler immediately crashes with TypeError: \'<\' not supported between instances of \'dict\' and \'dict\'. Explain why this bug went unnoticed for so long, and describe the fix, using what this subtopic covers.',
    hint: 'Per this subtopic\'s theory, when does heapq actually need to compare the SECOND element of a (priority, task) tuple — only sometimes, or on every single push/pop? What has to be true about two entries for that second-element comparison to actually happen?',
    solution: 'The bug went unnoticed for weeks because heapq only ever needs to compare the second tuple element (the task dict) when two entries genuinely TIE on the first element (priority) — as Python\'s own documentation confirms, "tuple comparison breaks for (priority, task) pairs if the priorities are equal and the tasks do not have a default comparison order." As long as every test job happened to have a distinct priority, Python never needed to fall through to comparing the dicts at all, so the underlying incomparability of two dicts never actually surfaced — the code was silently relying on an assumption (priorities are always unique) that was never actually true by design, just true by coincidence in every test run so far. The moment two jobs in production legitimately shared the same priority for the first time, heapq needed to break that tie by comparing the second elements, and since plain dicts have no defined ordering, this immediately raised TypeError. The fix is exactly the pattern Python\'s own heapq documentation recommends in its "Priority Queue Implementation Notes": store each heap entry as (priority, entry_count, task) using a strictly increasing counter (via itertools.count()) as the middle element — since every entry count is guaranteed unique, tuple comparison always resolves any priority tie using the count long before it would ever need to compare the task dicts themselves, making the scheduler correct regardless of whether priorities happen to collide.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since the main page\'s own heapq example pushes (priority, task) tuples directly and works correctly, this pattern is safe to use generally for any priority queue, regardless of what kind of object the task/payload actually is.',
      reality: 'This subtopic\'s theory and first code example both show this is incorrect — the main page\'s own example happens to avoid the problem only because its priorities are all unique and its payloads are plain, comparable strings; Python\'s own documentation explicitly warns this pattern "breaks" when priorities tie and payloads lack a default comparison order.'
    },
    {
      thought: 'A TypeError raised from heapq when pushing or popping entries always indicates a bug in the priority values themselves (e.g., mixing incompatible priority types), not something related to the payload/task objects being compared.',
      reality: 'This subtopic\'s first code example shows a different real cause — the TypeError can come entirely from the SECOND tuple element (the task/payload), triggered only when two entries happen to tie on an otherwise perfectly valid, consistent priority value.'
    },
    {
      thought: 'Code using bare (priority, task) tuples with heapq that has worked correctly through extensive testing can be trusted to keep working correctly in production, since any real bug would have already surfaced during testing.',
      reality: 'This subtopic\'s exercise shows the opposite — this specific bug is condition-dependent (it only triggers when two entries genuinely tie on priority), meaning it can pass every test that happens not to exercise that exact condition, then fail unpredictably the first time a real priority collision actually occurs.'
    }
  ];
}
