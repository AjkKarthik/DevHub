import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-whats-actually-inside-span-ref-field-fast-restricted-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './whats-actually-inside-span-ref-field-fast-restricted.html',
  styleUrl: './whats-actually-inside-span-ref-field-fast-restricted.scss',
})
export class WhatsActuallyInsideSpanRefFieldFastRestrictedSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page lists Span<T>\'s restrictions as a set of rules — they all follow from ONE structural fact about what a Span actually stores',
      points: [
        'The main Span &amp; Memory page states <code>Span&lt;T&gt;</code> "holds a pointer and a length" and separately lists its restrictions (cannot be a class field, cannot be boxed, cannot cross <code>await</code>, cannot be array-stored) as if they were a checklist to memorize. All of these restrictions are actually CONSEQUENCES of one specific implementation detail: <code>Span&lt;T&gt;</code> internally stores a <code>ref T</code> — a genuine, GC-tracked MANAGED REFERENCE to the first element — not a raw pointer, and not a copy of the data.',
      ],
    },
    {
      heading: 'A ref field is fundamentally different from a normal reference-type field — it can point into the MIDDLE of an object, or onto the stack itself',
      points: [
        'An ordinary reference-type field (like a <code>string</code> field) always points at the START of a heap object the GC tracks as a whole unit. A <code>ref T</code> field, by contrast, can point at ANY memory location — including the middle of an array, a field inside a heap object, or a stack-allocated local variable (as with a <code>stackalloc</code>-backed span) — the GC updates this INTERIOR pointer correctly during compaction (a "managed pointer"), but ONLY as long as the ref field itself lives somewhere the GC actually tracks and updates.',
        'This is EXACTLY why <code>Span&lt;T&gt;</code> can slice into the middle of an array with zero allocation and zero copying (the main page\'s own headline feature) — the internal ref field simply points at the SPECIFIC element the slice starts at, with the length field tracking how many elements follow, rather than needing a separate object or copy at all.',
      ],
    },
    {
      heading: 'Every restriction follows directly from this: a ref field cannot safely outlive the stack frame that created it, or exist somewhere the GC cannot properly track and update it',
      points: [
        'Cannot be a class field: a normal class field lives on the HEAP, and the GC does not support ref-typed fields inside ordinary heap objects (only inside ref structs specifically, which the runtime handles as a special case) — this is a genuine CLR-level restriction, not just a C# language rule.',
        'Cannot be boxed: boxing copies a value type onto the heap as an ordinary object — but an ordinary heap object cannot contain a ref field (same restriction as above), so a ref struct containing one cannot be boxed at all.',
        'Cannot cross <code>await</code>: an async method\'s local state is captured into a compiler-generated STATE MACHINE class (a heap object) so it survives the async suspension — but since that state machine is an ordinary class, it cannot hold a <code>Span&lt;T&gt;</code>\'s internal ref field for the exact same reason a normal class cannot.',
        'Cannot be stored in arrays: an array element storage location is subject to the SAME "no ref fields in ordinary heap-tracked storage" restriction — an array of <code>Span&lt;T&gt;</code> would need each element slot to hold a ref field, which arrays (being ordinary heap objects) do not support.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Why slicing into the MIDDLE of an array costs nothing — the ref field points directly at that element',
      language: 'csharp',
      code: `int[] numbers = { 10, 20, 30, 40, 50 };

// AsSpan(2, 3) does NOT copy elements 30, 40, 50 into a new array —
// it constructs a Span<int> whose internal ref field points DIRECTLY
// at numbers[2] (the element holding 30), with a length of 3:
Span<int> slice = numbers.AsSpan(2, 3);

Console.WriteLine(slice[0]); // 30 — read through the ref field,
                              // reaching directly into the ORIGINAL
                              // array's memory, no copy involved

slice[0] = 999; // writes THROUGH the ref field, directly into the
                 // original array's storage:
Console.WriteLine(numbers[2]); // 999 — the original array itself
                                // was mutated, proving "slice" never
                                // held a separate copy at all — it
                                // is a genuine, live reference into
                                // the SAME memory`,
    },
    {
      label: 'A ref field can also point at the STACK — this is how stackalloc + Span<T> works',
      language: 'csharp',
      code: `// stackalloc allocates directly on THIS METHOD'S OWN STACK FRAME —
// Span<int> here holds a ref field pointing at that stack memory:
Span<int> stackBuffer = stackalloc int[4];
stackBuffer[0] = 1;
stackBuffer[1] = 2;

Console.WriteLine(stackBuffer[0] + stackBuffer[1]); // 3 — read/write
                                                     // works exactly
                                                     // like an array-
                                                     // backed span,
                                                     // because the
                                                     // SAME ref-field
                                                     // mechanism
                                                     // underlies both

// This is EXACTLY why a Span<T> pointing at stack memory can NEVER
// be allowed to escape this method's stack frame (via a class field,
// a return value stored beyond this call, or crossing an await) —
// once this method returns, the stack memory the ref field points at
// is GONE. The compiler's ref-struct escape analysis is what prevents
// this specific danger at compile time, rather than allowing a
// dangling-pointer bug at runtime.`,
    },
    {
      label: 'Tracing each restriction back to "a ref field cannot live in ordinary heap storage"',
      language: 'csharp',
      code: `// Cannot be a class field — the CLR does not support ref-typed
// fields inside an ordinary heap-allocated class instance:
public class Holder
{
    // public Span<int> Data; // COMPILE ERROR — ref structs (which
                               // internally contain a ref field)
                               // cannot be fields of an ordinary class
}

// Cannot cross await — the async state machine IS a heap-allocated
// class (or struct promoted to the heap) that must survive
// suspension, and it has the SAME restriction as any other class:
public async Task BadAsync(Span<int> span) // COMPILE ERROR if span
{                                            // is used after an await
    await Task.Delay(1);
    // span[0] = 1; // would require the ref field to survive inside
                     // the compiler-generated state machine class —
                     // not allowed
}

// Cannot be stored in an array — an array's element storage is
// ordinary heap-tracked memory, subject to the identical restriction:
// Span<int>[] spans = new Span<int>[3]; // COMPILE ERROR

// Every one of these is the SAME underlying rule, not three separate
// arbitrary restrictions to memorize independently.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Explain, in terms of the ref field mechanism, why <code>Memory&lt;T&gt;</code> (the main topic page\'s own heap-storable, async-compatible companion to Span&lt;T&gt;) does NOT have any of these restrictions — what does it store internally instead of a ref field?',
    hint: 'Memory<T> is described in the main page as "a regular struct (not a ref struct) that holds a REFERENCE to the underlying data." Consider what kind of reference an ORDINARY struct can safely hold without needing a ref field at all.',
    solution: `// Memory<T> is a REGULAR struct (not a ref struct) — it cannot
// contain a ref field at all, by definition of what makes something
// a ref struct in the first place. Instead, Memory<T> internally
// stores an ordinary MANAGED OBJECT REFERENCE (to the underlying
// array, string, or a custom MemoryManager<T>) PLUS an integer start
// index and length — NOT a direct ref-typed pointer into the middle
// of that object's storage.
//
// This is precisely why Memory<T> has none of Span<T>'s restrictions:
//
// - Can be a class field: an ordinary object reference IS a normal,
//   perfectly legal field type on any class — no CLR restriction
//   applies, because there's no ref field involved.
//
// - Can cross await: the async state machine (an ordinary class) can
//   freely hold an ordinary object reference plus two integers —
//   nothing here needs the special ref-field handling Span<T> requires.
//
// - Can be stored in arrays: an array of Memory<T> is just an array
//   of ordinary structs containing an object reference and two ints
//   — completely unremarkable to the CLR.
//
// The trade-off: because Memory<T> does NOT hold a direct ref
// pointer, accessing its data requires an extra indirection step —
// calling .Span (which THEN constructs a genuine Span<T> with a real
// ref field, valid only for that synchronous access) to actually read
// or write the underlying elements. This is exactly the main page's
// own recommended pattern: "accept Memory<T> in APIs that need to
// store or await the data... call .Span on it... for synchronous
// processing within a single method" — the indirection is the price
// of Memory<T>'s heap-storability.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Span<T>\'s various restrictions (no class fields, no boxing, no await, no arrays) are separate, independent language rules that each need to be memorized on their own.',
      reality: 'all of them follow from ONE structural fact — Span<T> internally stores a ref field (a managed pointer that can reference the middle of an array or stack memory), and the CLR does not support ref-typed fields inside any ordinary heap-tracked storage, which is what class fields, boxed objects, async state machines, and array elements all are.',
    },
    {
      thought: 'Span<T> works by copying the sliced data into its own internal storage, similar to how string.Substring creates a new string.',
      reality: 'Span<T> holds a live reference (a ref field) directly into the ORIGINAL memory — writing through a Span mutates the source array/buffer directly, proving no copy was ever made, unlike Substring which genuinely allocates new storage.',
    },
    {
      thought: 'Memory<T> avoids Span<T>\'s restrictions by using some special heap-compatible version of a ref field.',
      reality: 'Memory<T> does not use a ref field at all — it is an ordinary struct storing a normal managed object reference plus a start index and length, which is precisely why it has none of Span<T>\'s restrictions, at the cost of needing an extra .Span indirection step to actually access the data.',
    },
  ];
}
