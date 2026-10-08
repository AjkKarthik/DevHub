import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-dsa-ll-palindrome-restore',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './palindrome-check-mutates-the-list-without-restoring.html',
  styleUrl: './palindrome-check-mutates-the-list-without-restoring.scss'
})
export class PalindromeCheckMutatesTheListWithoutRestoringSubtopic {
  topicLabel = 'Linked Lists';
  topicRoute = '/dsa/linked-lists';

  theory: TheoryPoint[] = [
    {
      heading: 'Proving the Side Effect, Then Fixing It',
      points: [
        'The main page\'s own Palindrome Challenge solution was tested directly: build <code>[1,2,3,2,1]</code>, call <code>isPalindrome(head)</code>, then traverse starting from that SAME original <code>head</code> reference afterward. The result: <code>[1,2,3,2]</code> — the function returned the correct boolean, but permanently shortened and restructured the list it was given, even though its signature only ever reads <code>head</code>.',
        'Tracing exactly why: the solution finds the middle node (<code>slow</code>) and then reverses everything after it. Reversing a node always starts by overwriting THAT node\'s own next pointer. So the node right after <code>slow</code> (call it <code>mid</code>) has its next pointer flipped to point BACKWARD (eventually to null), severing the forward path <code>slow -&gt; mid -&gt; ...</code> that the original list depended on — <code>slow.next</code> itself is never reassigned, but what it points to no longer leads anywhere useful.',
        'The fix needs exactly one more full pass: after comparing, reverse the (already-reversed) second half a SECOND time — undoing the first reversal — and explicitly reconnect it to <code>slow.next</code>. Verified across four test cases (an odd-length palindrome, an even-length non-palindrome, an even-length palindrome, and a longer non-palindrome): every single one came back with the exact original array, element for element, after the restoring version returned.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Proving the mutation',
      language: 'typescript',
      code: `function isPalindrome(head: ListNode | null): boolean {
  if (!head || !head.next) return true;
  let slow = head, fast = head;
  while (fast.next && fast.next.next) { slow = slow.next!; fast = fast.next.next; }
  let prev: ListNode | null = null, curr: ListNode | null = slow.next;
  while (curr) { const next = curr.next; curr.next = prev; prev = curr; curr = next; }
  let left: ListNode | null = head, right: ListNode | null = prev;
  while (right) { if (left!.val !== right.val) return false; left = left!.next; right = right.next; }
  return true;
}

const original = fromArray([1, 2, 3, 2, 1]);
const headRef = original; // keep the original head reference
console.log(isPalindrome(original));
// Actual measured output: true

console.log(toArray(headRef)); // traverse from the SAME original head
// Actual measured output: [1, 2, 3, 2] -- one node short, permanently restructured`,
    },
    {
      label: 'The restoring version',
      language: 'typescript',
      code: `function reverse(head: ListNode | null): ListNode | null {
  let prev: ListNode | null = null, curr = head;
  while (curr) { const next = curr.next; curr.next = prev; prev = curr; curr = next; }
  return prev;
}

function isPalindromeRestoring(head: ListNode | null): boolean {
  if (!head || !head.next) return true;
  let slow = head, fast = head;
  while (fast.next && fast.next.next) { slow = slow.next!; fast = fast.next.next; }

  const secondHalfStart = slow.next;
  const reversedSecondHalf = reverse(secondHalfStart);

  let left: ListNode | null = head, right = reversedSecondHalf;
  let result = true;
  while (right) {
    if (left!.val !== right.val) { result = false; break; }
    left = left!.next;
    right = right.next;
  }

  // Restore: reverse back and reconnect to the middle node
  slow.next = reverse(reversedSecondHalf);
  return result;
}

const t = fromArray([1, 2, 3, 2, 1]);
console.log(isPalindromeRestoring(t)); // Actual measured output: true
console.log(toArray(t));               // Actual measured output: [1, 2, 3, 2, 1] -- fully restored`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The restoring version reverses the second half, compares, then reverses it AGAIN before returning. Does this second reversal change the overall time complexity from the original O(n) solution?',
    hint: 'The second reversal walks over the same (roughly half-length) sublist the first reversal already walked over — does adding one more linear pass change the asymptotic class?',
    solution: 'No -- the overall time complexity stays O(n). The original solution already does three O(n/2)-ish passes: finding the middle, reversing the second half, and comparing. The restoring version simply adds a FOURTH pass of the same size (reversing the second half back). Four passes over roughly n/2 elements each is still O(n) total, just with a larger constant factor -- the asymptotic class does not change, only the real-world runtime gets a bit slower. The extra space stays O(1) too, since the restore reuses the same reverse() helper with no new data structure.',
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A function that only takes "head" as a parameter and returns a boolean cannot have mutated the caller\'s list.',
      reality: 'Verified directly: the main page\'s own isPalindrome function does exactly this. Linked-list nodes are mutable objects referenced by pointer -- any function holding a reference into the middle of a list can rewrite .next pointers reachable from that node, which silently changes what the ORIGINAL head reference sees when traversed afterward, even though "head" itself was never reassigned.',
    },
    {
      thought: 'Since the function returns the correct answer, the "fix" for the destructive reversal is purely cosmetic.',
      reality: 'Correctness of the RETURN VALUE and correctness of SIDE EFFECTS are two separate concerns. If the caller expected to use the same list again afterward (a very common real-world assumption), the original version is a real bug, not a style nit -- confirmed by traversing the original head after the call and getting a different, shorter list back.',
    },
  ];
}
