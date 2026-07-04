import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-params-array-hidden-allocation-every-call-span-fix-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './params-array-hidden-allocation-every-call-span-fix.html',
  styleUrl: './params-array-hidden-allocation-every-call-span-fix.scss',
})
export class ParamsArrayHiddenAllocationEveryCallSpanFixSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page covers Span<T> as a zero-allocation tool — params arrays are a common place that allocation sneaks back in, unnoticed',
      points: [
        'The main Arrays page emphasizes <code>Span&lt;T&gt;</code> for avoiding heap allocation on slices. A very common, easy-to-miss source of the EXACT allocation the page warns about is a <code>params</code> array parameter — every call site using the params-comma-list syntax allocates a brand-new array on the heap, even when the method itself never mutates or retains it.',
      ],
    },
    {
      heading: 'Every params call site is a fresh heap array — not shared, not pooled, not optimized away',
      points: [
        'A method declared as <code>static void Log(string prefix, params object[] args)</code>, called as <code>Log("info", userId, action, timestamp)</code>, has the compiler generate <code>new object[] { userId, action, timestamp }</code> at the CALL SITE — a brand-new array, allocated fresh, every single time that call executes, regardless of how many times the same arguments are passed.',
        'This is easy to miss because nothing in the CALLING code looks like an allocation — the comma-separated argument list reads like ordinary parameter passing, with no <code>new</code> keyword or array literal visible anywhere at the call site.',
      ],
    },
    {
      heading: 'C# 12\'s params ReadOnlySpan<T> overload eliminates the allocation for suitable call sites',
      points: [
        'C# 12 allows <code>params</code> to be declared over <code>Span&lt;T&gt;</code> or <code>ReadOnlySpan&lt;T&gt;</code> instead of only <code>T[]</code>: <code>static void Log(string prefix, params ReadOnlySpan&lt;object&gt; args)</code>. For call sites where the JIT can prove the arguments never escape the call, this allows the argument list to potentially be assembled without a heap allocation at all (e.g. via stack allocation), rather than unconditionally boxing them into a new array.',
        'This is exactly the same category of fix the main page\'s own <code>Span&lt;T&gt;</code> content advocates for elsewhere (avoiding a sub-array allocation via <code>AsSpan</code>) — applied here specifically to the params call-site allocation that most C# developers do not realize is happening at all.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The hidden allocation — invisible at the call site',
      language: 'csharp',
      code: `// Traditional params array parameter:
static void Log(string prefix, params object[] args)
{
    Console.WriteLine($"{prefix}: {string.Join(", ", args)}");
}

// Every one of these calls allocates a NEW object[] array, even though
// nothing about the calling code visually suggests an allocation:
Log("info", userId, action, timestamp);   // new object[3] { ... } allocated
Log("info", userId, action, timestamp);   // ANOTHER new object[3] allocated
                                            // — not reused, not pooled, not cached

// Inside a hot logging path called millions of times, this is a real,
// continuous stream of small array allocations that most developers
// never notice, because there's no "new" keyword anywhere in sight
// at the call site.`,
    },
    {
      label: 'C# 12 fix — params ReadOnlySpan<T> avoids the array allocation',
      language: 'csharp',
      code: `// C# 12 — params over ReadOnlySpan<T> instead of T[]:
static void LogFast(string prefix, params ReadOnlySpan<object> args)
{
    Console.WriteLine($"{prefix}: {string.Join(", ", args.ToArray())}");
}

// Call sites look IDENTICAL to the array version — no source change
// needed by callers:
LogFast("info", userId, action, timestamp);

// But the COMPILER can now choose a construction strategy that avoids
// a heap allocation for the argument list itself (e.g. building the
// span over stack-allocated storage when the call shape allows it),
// rather than unconditionally allocating a new object[] every time —
// exactly the same optimization the main page's Span<T> section
// describes for AsSpan() slicing, applied here to method call
// argument assembly instead.`,
    },
    {
      label: 'When the old params T[] overload is still the right choice',
      language: 'csharp',
      code: `// If the method NEEDS to retain the array beyond the call (store it,
// return it, pass it to another async method, etc.), params
// ReadOnlySpan<T> is the WRONG tool — a Span<T> cannot be stored on
// the heap, used across an await, or captured, exactly as covered in
// the main Arrays page's own Span<T> vs Memory<T> guidance:

static object[] CollectArgs(params object[] args) => args; // fine — the
                                                             // array is
                                                             // meant to
                                                             // escape

// A params ReadOnlySpan<T> version of this method would not compile
// as written, since you cannot return a ReadOnlySpan<object> the same
// way and expect it to outlive the call in the same manner — this is
// a genuine trade-off, not a strictly-better replacement in every case.
// Reserve the Span-based params overload for methods that only read
// the arguments synchronously and never let them escape the call.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A hot-path method is called as <code>Sum(1, 2, 3)</code> a million times per second, declared as <code>static int Sum(params int[] nums)</code>. Explain the per-call cost this incurs, and whether switching to <code>params ReadOnlySpan&lt;int&gt;</code> is a safe fix here.',
    hint: 'Consider what params int[] allocates at each call site, and whether the Sum method itself ever needs to retain or return the array beyond computing a single int result.',
    solution: `// Current: static int Sum(params int[] nums)
//
// Every call — Sum(1, 2, 3) — allocates a brand-new int[3] array on
// the heap, purely to pass three literal integers into the method.
// At a million calls per second, this is a continuous stream of small
// array allocations and corresponding GC pressure, entirely invisible
// at the call site (no "new" keyword appears anywhere).
//
// Switching to: static int Sum(params ReadOnlySpan<int> nums)
//
// IS safe here, because Sum only READS the values synchronously to
// compute a single int result — it never stores the span, returns it,
// or uses it across an await boundary. This is exactly the scenario
// where the C# 12 Span-based params overload is a strict improvement:
// same call-site syntax, same behavior, but the compiler can avoid
// the per-call heap array allocation entirely.

static int Sum(params ReadOnlySpan<int> nums)
{
    int total = 0;
    foreach (int n in nums) total += n;
    return total;
}

Sum(1, 2, 3); // no heap array allocated for the argument list`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a params array parameter only allocates when the caller explicitly passes an array literal, not when passing individual comma-separated arguments.',
      reality: 'every call using the comma-separated argument syntax also allocates a brand-new array at that call site — there is no visual "new" keyword, but the compiler generates one regardless of calling style.',
    },
    {
      thought: 'params ReadOnlySpan<T> is a strictly better replacement for params T[] in every method signature.',
      reality: 'a Span-based params overload only works for methods that read the arguments synchronously and never let them escape the call (store, return, or use across await) — methods that need to retain the array must keep the T[] overload.',
    },
    {
      thought: 'the allocation cost of a params array call only matters for very large argument lists.',
      reality: 'even a tiny 2-3 element params call allocates a full heap array every single invocation — in a hot path called millions of times, this adds up regardless of how few arguments are passed per call.',
    },
  ];
}
