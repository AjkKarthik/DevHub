import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-why-getenumerator-sometimes-returns-itself-thread-id-check-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './why-getenumerator-sometimes-returns-itself-thread-id-check.html',
  styleUrl: './why-getenumerator-sometimes-returns-itself-thread-id-check.scss',
})
export class WhyGetenumeratorSometimesReturnsItselfThreadIdCheckSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states each GetEnumerator() call hands out an independent cursor — this is exactly how the generated class makes that true AND cheap',
      points: [
        'The main Iterators page states "each call to GetEnumerator() hands out an independent cursor" and separately that the compiler generates ONE hidden class implementing BOTH <code>IEnumerable&lt;T&gt;</code> and <code>IEnumerator&lt;T&gt;</code>. These two facts seem to be in tension: if there is only ONE generated class, how can multiple simultaneous <code>foreach</code> loops over the SAME iterator method call get independent cursors from it? The answer is a specific, documented optimization inside that generated class\'s <code>GetEnumerator()</code> implementation.',
      ],
    },
    {
      heading: 'The generated class checks whether it is being asked for its FIRST enumerator, on the SAME thread that created it',
      points: [
        'The compiler-generated state machine class stores the <code>ManagedThreadId</code> of the thread that constructed it, plus an internal state field starting at a special "not yet started" value. Its <code>GetEnumerator()</code> method checks: is this the FIRST call (state is still "not started"), AND is the calling thread the SAME thread that originally created this instance? If BOTH are true, it returns <code>this</code> — the SAME object — avoiding a second allocation entirely.',
        'This optimization exists specifically for the overwhelmingly common case: <code>foreach (var x in MyIterator())</code> calls <code>GetEnumerator()</code> exactly ONCE, immediately, on the SAME thread that just called <code>MyIterator()</code> — the generated code recognizes this pattern and skips allocating a SEPARATE enumerator object, since the iterable object itself can safely double as its own (single) cursor in that specific case.',
      ],
    },
    {
      heading: 'The moment either condition fails, a genuinely NEW instance is returned — preserving the independent-cursor guarantee',
      points: [
        'If <code>GetEnumerator()</code> is called a SECOND time on the same object (e.g. two separate <code>foreach</code> loops over the same stored <code>IEnumerable&lt;T&gt;</code> variable), or called from a DIFFERENT thread than the one that created the instance, the generated code falls back to constructing a genuinely NEW instance of the same hidden class — a fresh, independent cursor, exactly as the main page\'s own independent-cursor guarantee requires.',
        'This means the SAME iterator variable behaves differently depending on HOW it is consumed: a single, same-thread <code>foreach</code> gets the fast, no-extra-allocation path; two overlapping enumerations, or cross-thread enumeration, correctly fall back to the safe, multi-instance path — the guarantee holds either way, but the ALLOCATION COST differs based on the specific usage pattern, which is worth knowing when reasoning about a hot iterator\'s actual allocation profile.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The common case — foreach gets the this-returning fast path, no extra allocation',
      language: 'csharp',
      code: `static IEnumerable<int> Evens(int max)
{
    for (int i = 0; i <= max; i += 2)
        yield return i;
}

// A SINGLE foreach, on the SAME thread that created the sequence,
// hits the fast path — the compiler-generated object recognizes this
// is its FIRST GetEnumerator() call, on the ORIGINATING thread, and
// returns itself instead of allocating a second object:
foreach (int n in Evens(6))
    Console.WriteLine(n);
// Under the hood: ONE allocation total (the iterator object itself),
// NOT two (one for "the sequence" plus one for "the cursor").`,
    },
    {
      label: 'Two overlapping enumerations of the SAME variable correctly get separate instances',
      language: 'csharp',
      code: `IEnumerable<int> seq = Evens(6); // ONE call — constructs ONE object

// First GetEnumerator() call — hits the fast path, returns "this":
using var e1 = seq.GetEnumerator();

// SECOND GetEnumerator() call on the SAME seq variable — the state
// is no longer "not started" (e1 already claimed the fast path), so
// this call falls back to constructing a genuinely NEW, independent
// instance of the hidden state-machine class:
using var e2 = seq.GetEnumerator();

e1.MoveNext(); Console.WriteLine(e1.Current); // 0
e2.MoveNext(); Console.WriteLine(e2.Current); // 0 — e2 started from
                                                // the beginning too,
                                                // completely independent
                                                // of e1's position

e1.MoveNext(); Console.WriteLine(e1.Current); // 2 — e1 advances alone
// e2 is still at position 0 here — proving the two cursors are
// genuinely independent, exactly as the main page's guarantee states.`,
    },
    {
      label: 'Calling GetEnumerator() from a different thread also forces the safe fallback',
      language: 'csharp',
      code: `IEnumerable<int> seq = Evens(6); // constructed on the main thread

IEnumerator<int>? fromOtherThread = null;
var t = new Thread(() =>
{
    // Even though this is the FIRST GetEnumerator() call on "seq",
    // it is happening on a DIFFERENT thread than the one that
    // constructed it — the fast-path condition ("same thread AND
    // first call") is only half satisfied, so this ALSO falls back
    // to constructing a fresh instance rather than returning "seq"
    // itself, avoiding a shared-mutable-cursor hazard across threads:
    fromOtherThread = seq.GetEnumerator();
});
t.Start();
t.Join();

// This defensive fallback exists specifically because handing out
// "this" as a cursor to be driven from ANOTHER thread would create a
// genuine cross-thread mutable-state hazard — the thread-id check
// protects against that by forcing a safe, separate instance instead.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Explain why the compiler-generated fast path checks BOTH "is this the first call" AND "is this the same thread" — rather than just checking whether it\'s the first call.',
    hint: 'Consider what could go wrong if two threads both received "this" as their cursor from what they each believed was their own independent GetEnumerator() call, if only the "first call" condition were checked without the thread check.',
    solution: `// If the fast path checked ONLY "is this the first call" (without
// also checking the calling thread), a genuine race condition could
// occur:
//
// Thread A calls seq.GetEnumerator() — sees "first call", gets "this"
// Thread B ALSO calls seq.GetEnumerator() at nearly the same moment,
//   racing Thread A — if the "first call" flag hasn't been updated
//   yet, Thread B could ALSO be handed "this" as its cursor
//
// Now BOTH threads believe they hold their OWN independent cursor,
// but they are actually sharing the SAME mutable object — calling
// MoveNext() from Thread A would silently corrupt the position that
// Thread B is also relying on, and vice versa. This would violate the
// "each GetEnumerator() call hands out an independent cursor"
// guarantee in a way that is extremely hard to diagnose (a rare,
// timing-dependent cross-thread corruption bug).
//
// By ALSO requiring the calling thread to match the thread that
// constructed the instance, the compiler-generated code ensures the
// fast path only ever applies within a single thread's own,
// sequential, "call the method then immediately foreach it" pattern —
// the exact scenario where "this" is provably safe to hand out as
// the cursor, because there is no possibility of a second, concurrent
// claimant on a different thread.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the compiler-generated iterator class always allocates a separate cursor object every time GetEnumerator() is called, to guarantee independent cursors.',
      reality: 'the FIRST call, on the SAME thread that constructed the iterator, returns the object itself (no extra allocation) as an optimization — only subsequent calls, or calls from a different thread, allocate a genuinely new instance.',
    },
    {
      thought: 'a single iterator method call always results in exactly one heap allocation, regardless of how the resulting sequence is consumed.',
      reality: 'the allocation count depends on the consumption pattern — a single same-thread foreach gets one allocation total, while multiple overlapping enumerations or cross-thread enumeration each trigger an additional allocation for their own independent instance.',
    },
    {
      thought: 'the thread-id check in the generated GetEnumerator() is just an implementation detail with no real correctness purpose.',
      reality: 'it specifically prevents a genuine race condition where two threads could otherwise both be handed the same mutable object as their "independent" cursor, silently corrupting each other\'s enumeration position.',
    },
  ];
}
