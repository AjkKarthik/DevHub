import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-spant-and-stackalloc-parsing-without-heap-allocations-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './spant-and-stackalloc-parsing-without-heap-allocations.html',
  styleUrl: './spant-and-stackalloc-parsing-without-heap-allocations.scss',
})
export class SpantAndStackallocParsingWithoutHeapAllocationsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A third memory model the main topic never mentions',
      points: [
        'The main Variables &amp; Types page covers exactly two memory locations: the stack (value types, usually) and the managed heap (reference types, and boxed value types). <code>Span&lt;T&gt;</code> (a <code>ref struct</code>, introduced in C# 7.2) is a THIRD option — it is a lightweight, stack-only VIEW over a contiguous block of memory (an array, a string, or stack-allocated memory) without owning or copying that memory itself.',
        'Because a <code>Span&lt;T&gt;</code> is a <code>ref struct</code>, it is restricted to live ONLY on the stack — it cannot be a field of a class, cannot be boxed, cannot be used in an <code>async</code> method or a lambda\'s captured state, and cannot outlive the memory it points to. These restrictions exist specifically to make it SAFE to point at stack memory without the garbage collector needing to track or relocate it.',
      ],
    },
    {
      heading: 'Slicing a string or array WITHOUT allocating a new one',
      points: [
        '<code>string.Substring(start, length)</code> — the ordinary way to extract part of a string — ALLOCATES a brand new string on the heap every single call. For code that slices strings repeatedly (parsing a large file line-by-line, tokenizing input), this can produce a large number of short-lived allocations, adding real GC pressure.',
        '<code>ReadOnlySpan&lt;char&gt; slice = someString.AsSpan(start, length);</code> creates a VIEW into the EXISTING string\'s memory — no new allocation at all. The span behaves like a read-only array for reading/comparing/searching purposes, but the underlying characters are never copied unless you explicitly convert the span back to a <code>string</code> (e.g. with <code>.ToString()</code>, at which point a real allocation finally happens, but only once, only when you actually need a standalone string).',
        'The same technique applies to arrays: <code>int[] arr = [...]; Span&lt;int&gt; slice = arr.AsSpan(2, 3);</code> views a sub-range of the array without copying its elements — mutating the span mutates the original array in place, since it\'s the SAME underlying memory, just viewed through a narrower window.',
      ],
    },
    {
      heading: 'stackalloc — allocating a buffer that never touches the heap at all',
      points: [
        '<code>Span&lt;byte&gt; buffer = stackalloc byte[256];</code> allocates 256 bytes DIRECTLY on the stack (the same place a local <code>int</code> or <code>struct</code> lives) — no heap allocation occurs at all, and the memory is automatically reclaimed when the method returns, exactly like any other stack-local variable. This is genuinely zero-GC-pressure, unlike even a small array allocation (<code>new byte[256]</code>), which always goes on the heap.',
        'This makes <code>stackalloc</code> + <code>Span&lt;T&gt;</code> a natural fit for SHORT-LIVED, FIXED-OR-BOUNDED-SIZE scratch buffers inside a hot path — parsing a small fixed-format record, formatting a number into a temporary buffer before writing it out, or a cryptographic operation\'s temporary working memory — anywhere a small array would otherwise be allocated and immediately discarded on every call.',
        'Because it is genuine STACK memory, <code>stackalloc</code> comes with real limits: the size must be reasonably small (large or unbounded/user-controlled sizes risk a <code>StackOverflowException</code> — never <code>stackalloc</code> a size derived directly from untrusted input without an upper bound check), and — like any <code>Span&lt;T&gt;</code> — it cannot be stored in a field, returned in a way that outlives the current stack frame, or captured by a closure.',
      ],
    },
    {
      heading: 'When this actually matters — and when it does not',
      points: [
        'This is a genuinely NICHE, PERFORMANCE-FOCUSED optimization — for typical business/CRUD application code doing a handful of string operations per request, the allocation savings are immaterial next to database calls, HTTP round-trips, and JSON serialization, which dominate the actual time budget. Reach for <code>Span&lt;T&gt;</code>/<code>stackalloc</code> specifically in HOT PATHS: high-throughput parsers, serializers, low-level networking code, or any loop executing millions of times per second where allocation-driven GC pauses are a measured, real bottleneck.',
        'The .NET base class library itself has been extensively retrofitted to accept <code>ReadOnlySpan&lt;char&gt;</code> overloads alongside the traditional <code>string</code> overloads (e.g. <code>int.Parse(ReadOnlySpan&lt;char&gt;)</code>) — meaning you can often gain the allocation-free benefit just by passing a span where you\'d normally pass a substring, without writing any manual low-level buffer code yourself.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'AsSpan() — slicing without allocating',
      language: 'csharp',
      code: `string line = "2026-07-03,Alice,Active";

// Traditional — each Substring() call allocates a new heap string
string dateOld   = line.Substring(0, 10);
string nameOld   = line.Substring(11, 5);

// Span-based — views into the SAME underlying string memory, zero allocation
ReadOnlySpan<char> lineSpan = line.AsSpan();
ReadOnlySpan<char> dateSpan = lineSpan.Slice(0, 10);
ReadOnlySpan<char> nameSpan = lineSpan.Slice(11, 5);

// Compare/search directly on the span — no allocation needed for this either
bool isActive = lineSpan.EndsWith("Active");

// Only allocate a real string when you actually need one to keep/store:
string date = dateSpan.ToString(); // the ONE allocation, deferred until necessary

// Many BCL methods accept ReadOnlySpan<char> directly — no .ToString() needed:
int year = int.Parse(dateSpan.Slice(0, 4)); // parses straight from the span`,
    },
    {
      label: 'stackalloc — a buffer that never touches the heap',
      language: 'csharp',
      code: `// stackalloc allocates directly on the stack — zero heap allocation,
// automatically reclaimed when the method returns.
Span<byte> buffer = stackalloc byte[256];

// Fill it (e.g. formatting a number into the buffer without allocating a string)
int value = 42_195;
if (value.TryFormat(buffer, out int written))
{
    ReadOnlySpan<byte> formatted = buffer.Slice(0, written);
    // formatted now contains the ASCII bytes for "42195" — no heap allocation
    // occurred anywhere in this formatting operation.
}

// SAFETY: never stackalloc a size derived directly from untrusted input
// without an upper bound — this risks StackOverflowException.
void ParseRecord(int requestedSize)
{
    const int MaxSize = 1024;
    if (requestedSize > MaxSize)
        throw new ArgumentException("Requested size exceeds safe stackalloc limit.");

    Span<byte> safeBuffer = stackalloc byte[requestedSize]; // bounded — safe
}`,
    },
    {
      label: 'ref struct restrictions',
      language: 'csharp',
      code: `// Span<T> is a ref struct — restricted to stack-only lifetime.

class Widget
{
    // COMPILE ERROR — ref structs cannot be fields of a class
    // Span<byte> _buffer;
}

async Task ProcessAsync()
{
    Span<byte> buffer = stackalloc byte[64];
    // COMPILE ERROR — ref structs cannot be used across an 'await' boundary,
    // since the method's stack frame may not exist when execution resumes.
    // await Task.Delay(1);
    // buffer[0] = 1; // would be using a span whose backing stack frame is gone
}

Span<int> GetSpan()
{
    Span<int> local = stackalloc int[4];
    // COMPILE ERROR (or a runtime-unsafe escape) — cannot return a span
    // pointing at THIS method's stack frame, since it's gone once the
    // method returns. The compiler's "escape analysis" catches this.
    return local;
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Write a method <code>bool StartsWithDigit(ReadOnlySpan&lt;char&gt; text)</code> that returns whether the FIRST character of the span is a digit — using <code>char.IsDigit</code> on the span\'s first element, without ever calling <code>.ToString()</code> or allocating a new string.',
    hint: 'Check text.Length > 0 first (an empty span has no first character), then call char.IsDigit(text[0]) — indexing a Span<char> reads directly from the underlying memory, no allocation involved.',
    solution: `bool StartsWithDigit(ReadOnlySpan<char> text)
{
    if (text.Length == 0)
        return false;

    return char.IsDigit(text[0]);
}

// Usage — works directly on a slice, no string allocated anywhere:
string input = "42-line-item";
Console.WriteLine(StartsWithDigit(input.AsSpan())); // True

ReadOnlySpan<char> slice = input.AsSpan(3); // "line-item"
Console.WriteLine(StartsWithDigit(slice));  // False`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '<code>Span&lt;T&gt;</code> is just a more modern-syntax way to write an array — functionally interchangeable with <code>T[]</code>.',
      reality: 'a Span&lt;T&gt; is a VIEW over existing memory (an array, a string, or a stackalloc buffer) — it does not own or copy the data. Slicing a span is zero-allocation; slicing/copying an array (or calling Substring on a string) allocates a new block of memory every time.',
    },
    {
      thought: '<code>stackalloc</code> is safe to use for any buffer size, since it\'s "just stack memory."',
      reality: 'the stack has a much smaller, fixed total size than the heap — a large or unbounded stackalloc (especially one sized from untrusted user input with no upper limit) risks a StackOverflowException, which crashes the process. Always bound the size explicitly before a stackalloc.',
    },
    {
      thought: 'since <code>Span&lt;T&gt;</code> is such a useful performance tool, it should be reached for broadly across application code to reduce allocations.',
      reality: 'for typical business/CRUD code, allocation savings from spans are immaterial compared to database calls, HTTP round-trips, and serialization — Span&lt;T&gt;/stackalloc are a NICHE optimization for measured hot paths (parsers, serializers, high-throughput loops), not a general-purpose habit to apply everywhere.',
    },
  ];
}
