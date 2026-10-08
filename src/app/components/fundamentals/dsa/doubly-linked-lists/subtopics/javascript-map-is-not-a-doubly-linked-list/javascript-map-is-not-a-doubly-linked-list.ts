import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-dsa-dll-map-not-dll',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './javascript-map-is-not-a-doubly-linked-list.html',
  styleUrl: './javascript-map-is-not-a-doubly-linked-list.scss'
})
export class JavascriptMapIsNotADoublyLinkedListSubtopic {
  topicLabel = 'Doubly Linked Lists';
  topicRoute = '/dsa/doubly-linked-lists';

  theory: TheoryPoint[] = [
    {
      heading: 'What V8\'s Own Source Actually Describes',
      points: [
        'The main page\'s own QnA on real-world DLL usage originally listed "JavaScript\'s Map internally" alongside LRU caches and browser history. Checking V8\'s own source (<code>src/objects/ordered-hash-table.h</code>) shows this is not accurate: Map and Set are implemented as an <code>OrderedHashTable</code> -- entries live in a contiguous, array-backed table appended in insertion order, with a separate hash-bucket array pointing at the FIRST entry of each bucket\'s collision chain.',
        'The "chain" that threads through colliding entries is a forward-only array of next-entry INDICES, used purely to resolve hash collisions within one bucket -- it is not a general-purpose doubly linked list of heap-allocated nodes, and critically, there is no "prev" pointer or prev-index anywhere in the design.',
        'Deleted entries are tracked as holes in the backing array (not physically removed until a later rehash compacts the table) -- iteration walks the array from start to end, skipping holes, which is what actually produces insertion-order iteration. This is architecturally closer to a hash table with an ordered backing array than to any linked list.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Observable behavior, consistent with an array-backed design',
      language: 'typescript',
      code: `const m = new Map<string, number>();
m.set('a', 1);
m.set('b', 2);
m.set('c', 3);
console.log([...m.keys()]);
// Actual measured output: ['a', 'b', 'c']

m.delete('b');
m.set('b', 99); // re-insert the deleted key
console.log([...m.keys()]);
// Actual measured output: ['a', 'c', 'b'] -- b did NOT return to its old middle position,
// it was appended at the end, consistent with "the backing array has a hole where b used
// to be, and re-inserting b appends a brand new entry"

// Note: this observable behavior is CONSISTENT with the array-backed OrderedHashTable
// design, but is not, by itself, PROOF of it -- a DLL-based design that always moves a
// re-inserted key to the tail would produce the identical observable result. The actual
// proof is in V8's own source code structure, not in anything a JS program alone can
// directly inspect.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Since the observable re-insertion behavior above is consistent with BOTH an array-backed design and a DLL-based design, what would you actually need to check to be certain which one V8 uses?',
    hint: 'Think about what kind of evidence a JavaScript program running in the engine could ever directly observe versus what requires looking somewhere else entirely.',
    solution: 'A JavaScript program has no way to directly inspect V8\'s internal memory layout -- it can only observe the RESULTS of operations (values, iteration order, timing), never the underlying data structure\'s actual shape. To be certain, you need to go to a source outside the running program entirely: read V8\'s own source code (as this subtopic did, citing <code>ordered-hash-table.h</code>), read an authoritative engineering writeup from the V8 team, or use a debugger/memory inspector built specifically for V8 internals. This is a general lesson: observable behavior can rule OUT some hypotheses (if the re-insertion test above had restored b to its old position, that would have ruled out a simple "append to array, skip holes" design) but it can never, on its own, CONFIRM a specific internal implementation when multiple designs could produce identical observable behavior.',
  };

  misconceptions: Misconception[] = [
    {
      thought: 'JavaScript\'s Map preserves insertion order because it is implemented internally as a doubly linked list, similar to the LRU cache pattern on this page.',
      reality: 'Verified directly against V8\'s own source: Map/Set are implemented as an OrderedHashTable -- an array-backed hash table where insertion order comes from appending to a contiguous backing array, not from any linked-list pointer structure. There is no "prev" pointer anywhere in the real design.',
    },
    {
      thought: 'If a JavaScript test shows behavior "consistent with" a particular data structure, that test has proven the engine uses that data structure.',
      reality: 'Consistent-with is not the same as proof-of. The re-insertion test above is consistent with the real array-backed design, but a hypothetical DLL-based design using "always move re-inserted keys to the tail" would produce the exact same observable result. Confirming which one is actually used requires looking at the engine\'s own source, not just running more JavaScript.',
    },
  ];
}
