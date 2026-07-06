import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-stackalloc-inside-loop-never-frees-between-iterations-stackoverflow-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './stackalloc-inside-loop-never-frees-between-iterations-stackoverflow.html',
  styleUrl: './stackalloc-inside-loop-never-frees-between-iterations-stackoverflow.scss',
})
export class StackallocInsideLoopNeverFreesBetweenIterationsStackoverflowSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page describes stackalloc as "no GC involved" — true, but this also means there is no automatic reclamation BETWEEN iterations of a loop either',
      points: [
        'The main Unsafe Code &amp; Pointers page describes <code>stackalloc</code> as allocating "a contiguous block on the stack — no GC involved." This is correct, and it is exactly why <code>stackalloc</code> is so fast — but "no GC" also means there is no automatic per-iteration cleanup mechanism at all. A heap allocation inside a loop becomes eligible for GC as soon as it is no longer referenced (often within the SAME iteration); a <code>stackalloc</code> buffer\'s space is only reclaimed when the ENTIRE METHOD returns — not each time the loop body finishes an iteration.',
      ],
    },
    {
      heading: 'stackalloc reserves space on the CURRENT method\'s stack frame — that frame does not shrink or grow back between loop iterations',
      points: [
        'A method\'s stack frame size is fundamentally fixed for the duration of that single call to the method — <code>stackalloc</code> inside a loop body does not create N separate, independently-freed regions; conceptually, each <code>stackalloc</code> call reuses (or, in poorly-written code, ADDS TO) the SAME reserved stack space for the lifetime of the method call, since the stack pointer for THIS method\'s frame is not moved back down until the method itself returns.',
        'The .NET documentation explicitly warns against using <code>stackalloc</code> inside a loop for exactly this reason: repeatedly stackalloc-ing inside a loop, especially with a size that depends on loop-iteration-specific or user-controlled input, can exhaust the (typically only 1 MB by default on Windows) thread stack far faster than the equivalent heap allocations ever would, resulting in an unrecoverable <code>StackOverflowException</code> that CANNOT be caught by any try/catch — it terminates the process immediately.',
      ],
    },
    {
      heading: 'The size passed to stackalloc should be a small, KNOWN-BOUNDED constant — never derived from a loop counter or unbounded external input',
      points: [
        'This is why virtually every real <code>stackalloc</code> usage pattern allocates ONCE, before entering a loop, and reuses that single buffer for every iteration (exactly as shown in the safe <code>Span&lt;byte&gt; safeBuf = stackalloc byte[256]</code> pattern the main page itself recommends) — the loop reads/writes into the SAME already-allocated region repeatedly, rather than calling <code>stackalloc</code> fresh on every pass.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The trap — stackalloc called freshly inside every loop iteration',
      language: 'csharp',
      code: `// DANGEROUS: a fresh stackalloc on every single iteration
static void ProcessItems(int[] itemSizes)
{
    for (int i = 0; i < itemSizes.Length; i++)
    {
        // Each iteration reserves MORE stack space — this does NOT
        // "free" the previous iteration's stackalloc before allocating
        // the next one. The method's stack frame simply keeps growing
        // for as long as this loop keeps running:
        Span<byte> buffer = stackalloc byte[itemSizes[i]];
        Process(buffer);
    }
    // For a large itemSizes.Length, or large individual sizes, this
    // can exhaust the thread's stack (typically 1 MB by default) and
    // throw StackOverflowException — which CANNOT be caught by any
    // try/catch anywhere in the call stack. The process terminates.
}

static void Process(Span<byte> data) { /* ... */ }`,
    },
    {
      label: 'The fix — allocate ONE buffer before the loop, reuse it every iteration',
      language: 'csharp',
      code: `// SAFE: allocate ONCE, outside the loop, and reuse the SAME buffer
static void ProcessItemsSafely(int[] itemSizes, int maxItemSize)
{
    // A single, small, KNOWN-BOUNDED buffer — sized for the LARGEST
    // possible item, allocated exactly once for this method call:
    Span<byte> buffer = stackalloc byte[maxItemSize];

    for (int i = 0; i < itemSizes.Length; i++)
    {
        // Reuse a SLICE of the same already-reserved stack space —
        // no additional stack is consumed per iteration, no matter
        // how many iterations the loop runs:
        Span<byte> slice = buffer[..itemSizes[i]];
        Process(slice);
    }
}

static void Process(Span<byte> data) { /* ... */ }`,
    },
    {
      label: 'Why the equivalent heap-allocation version does NOT have this problem',
      language: 'csharp',
      code: `// For comparison — a fresh HEAP allocation on every iteration is
// WASTEFUL (GC pressure), but fundamentally SAFE from a stack-overflow
// perspective, because each array becomes eligible for GC as soon as
// it is no longer referenced — usually well before the loop even ends:
static void ProcessItemsOnHeap(int[] itemSizes)
{
    for (int i = 0; i < itemSizes.Length; i++)
    {
        byte[] buffer = new byte[itemSizes[i]]; // heap allocation
        Process(buffer);
        // "buffer" becomes eligible for collection here — the NEXT
        // iteration's allocation does not accumulate on top of it.
        // This is slower (GC overhead) but will never itself cause a
        // StackOverflowException purely from repeated allocation.
    }
}

static void Process(byte[] data) { /* ... */ }

// The lesson is NOT "always avoid stackalloc in loops" — it is:
// "stackalloc ONCE, size it to the worst case, and reuse slices" —
// exactly the pattern in the SAFE example above. The main page's own
// recommendation to prefer "Span<byte> safeBuf = stackalloc byte[256]"
// already models allocating once; the trap is specifically calling
// stackalloc itself repeatedly, fresh, INSIDE a loop body.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A recursive method that parses a nested data structure calls <code>Span&lt;byte&gt; scratch = stackalloc byte[256];</code> once at the TOP of its own method body, on every recursive call. For deeply nested input (say, 10,000 levels), this throws <code>StackOverflowException</code> even though each individual <code>stackalloc</code> call is small and appears only ONCE per method invocation, not inside a loop. Explain why this still fails, and how it differs from the loop scenario.',
    hint: 'Consider that recursion means EVERY level of nesting gets its OWN separate stack frame, each with its OWN 256-byte stackalloc reservation, existing SIMULTANEOUSLY on the stack for as long as the recursion is still "descending" — unlike a loop, where all iterations share the SAME single stack frame.',
    solution: `// The recursive method — 256 bytes stackalloc'd on EVERY call, not
// inside a loop, just once per invocation:
static void ParseNested(ReadOnlySpan<byte> data, int depth)
{
    Span<byte> scratch = stackalloc byte[256]; // 256 bytes, ONCE per call

    if (TryParseLeaf(data, scratch, out var remaining))
        return;

    ParseNested(remaining, depth + 1); // recurse
}

// WHY THIS DIFFERS FROM THE LOOP SCENARIO:
// A LOOP reuses the SAME stack frame for every iteration — "for (...) {
// stackalloc ... }" inside one method body means the method has exactly
// ONE stack frame, and (as shown in the main exercise) repeated
// stackalloc calls within that ONE frame accumulate stack usage WITHIN
// that single frame's lifetime.
//
// RECURSION is fundamentally different: EVERY recursive call creates
// its OWN, entirely separate stack frame — nested 10,000 levels deep
// means there are 10,000 SIMULTANEOUS stack frames alive at once (the
// outermost call has not returned yet, so its frame — and its 256-byte
// scratch buffer — is still on the stack), each with its OWN 256-byte
// stackalloc reservation. The TOTAL stack consumption at maximum depth
// is roughly 10,000 * (256 bytes + the frame's other overhead) — easily
// several megabytes, which exceeds the default ~1 MB thread stack long
// before parsing finishes.
//
// The fix here is NOT "reuse one stackalloc across recursive calls"
// (impossible — each recursive call genuinely needs its own frame) —
// it is to convert the recursion to an ITERATIVE loop with an explicit,
// heap-allocated stack data structure (a List<T> or Stack<T> managing
// the "recursion" manually), OR to stackalloc ONCE in a single non-
// recursive entry-point method and pass the SAME scratch Span down as
// a parameter through the recursive calls, rather than re-stackalloc-ing
// it at every level:
static void ParseNestedFixed(ReadOnlySpan<byte> data)
{
    Span<byte> scratch = stackalloc byte[256]; // ONCE, in the entry point
    ParseNestedCore(data, scratch, depth: 0);
}

static void ParseNestedCore(ReadOnlySpan<byte> data, Span<byte> scratch, int depth)
{
    if (TryParseLeaf(data, scratch, out var remaining)) return;
    ParseNestedCore(remaining, scratch, depth + 1); // reuses the SAME
                                                     // scratch buffer —
                                                     // no per-level
                                                     // stackalloc at all
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'stackalloc inside a loop is automatically "freed" and reused at the start of each new iteration, similar to how a heap allocation becomes eligible for GC.',
      reality: 'a method\'s stack frame does not shrink between loop iterations — repeated stackalloc calls inside a loop body accumulate stack usage for the entire duration of that method call, with no automatic per-iteration reclamation.',
    },
    {
      thought: 'a small, fixed-size stackalloc (like 256 bytes) is always safe no matter where it appears in the code, since it is "just" 256 bytes.',
      reality: 'in a loop, that 256 bytes effectively multiplies by the iteration count; in recursion, it multiplies by the recursion depth — either can exhaust the default ~1 MB thread stack even though each individual call site only requests a small amount.',
    },
    {
      thought: 'a StackOverflowException from excessive stackalloc usage can be caught and handled with a try/catch, like most other exceptions.',
      reality: 'StackOverflowException cannot be caught by any try/catch in .NET — it terminates the process immediately, since the runtime itself no longer has guaranteed stack space to safely run exception-handling code.',
    },
  ];
}
