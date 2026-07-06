import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-iterator-exceptions-stack-traces-movenext-not-call-site-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './iterator-exceptions-stack-traces-movenext-not-call-site.html',
  styleUrl: './iterator-exceptions-stack-traces-movenext-not-call-site.scss',
})
export class IteratorExceptionsStackTracesMovenextNotCallSiteSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own deferred-validation trap has a debugging consequence it doesn\'t spell out: what the stack trace actually looks like',
      points: [
        'The main Iterators page explains that deferred validation makes exceptions "appear far from the buggy call site." In PRODUCTION, this shows up as a very specific, recognizable symptom: the exception\'s stack trace is rooted in the compiler-generated <code>MoveNext()</code> frame of the hidden iterator class — NOT in the method that originally called the iterator method — because <code>MoveNext()</code> IS where the code that throws is actually executing, potentially many stack frames and a long time away from the original call.',
      ],
    },
    {
      heading: 'The original call site can be completely absent from the stack trace if enumeration happens later, elsewhere',
      points: [
        'If an iterator method is called in one place, stored in a variable, and enumerated MUCH later — inside a completely different method, possibly after being passed through several layers of LINQ operators or returned from another method — the resulting exception\'s stack trace shows the CURRENT enumeration call chain (wherever <code>MoveNext()</code> is ultimately being driven from), with NO trace at all of where the original iterator method was first CALLED. This is a direct, structural consequence of deferred execution: the stack trace reflects when code actually RUNS, not when it was merely REFERENCED.',
        'This is genuinely disorienting the first time you encounter it in a production log: a stack trace pointing at, say, a JSON serializer\'s internal enumeration loop, for an exception whose ROOT CAUSE is invalid data that was passed into an iterator method several layers upstream and enumerated only much later — the log tells you WHERE the code was executing when it failed, not WHERE the bad input originated.',
      ],
    },
    {
      heading: 'The fix is the same eager-validation-wrapper pattern — applied specifically for its stack-trace benefit',
      points: [
        'Beyond the correctness argument the main page already makes, the eager-validation-wrapper pattern has a SEPARATE, purely observability-driven benefit: because the validation now runs synchronously at the CALL SITE, any exception it throws has a stack trace rooted EXACTLY where the bad call happened — the caller\'s own frame, not some later, disconnected <code>MoveNext()</code> frame. This makes production log triage dramatically faster, independent of whether the validation logic itself was ever actually wrong.',
        'A practical corollary: when reviewing an iterator method during code review, treat "does this validate eagerly" as partly a DEBUGGABILITY concern, not purely a correctness one — even validation that will never realistically fail in practice still benefits from throwing at the call site rather than deep inside a later enumeration, purely for the sake of future stack traces being useful.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The confusing stack trace — rooted in MoveNext(), not the original call',
      language: 'csharp',
      code: `static IEnumerable<int> ChunkUnsafe(int[] source, int size)
{
    if (size <= 0)
        throw new ArgumentOutOfRangeException(nameof(size)); // deferred!
    for (int i = 0; i < source.Length; i += size)
        yield return source[i];
}

// Called here, in method A:
IEnumerable<int> chunks = ChunkUnsafe(data, -1); // NO exception yet

// ... stored, passed around, maybe returned from method A ...
// ... enumerated much later, in a COMPLETELY different method B:
foreach (int c in chunks)  // <-- exception ACTUALLY throws HERE
    Process(c);

// The resulting stack trace looks roughly like:
//   at ChunkUnsafe.MoveNext()          <-- where the throw ACTUALLY executes
//   at MethodB.SomeLoop()              <-- wherever enumeration is driven from
//   ...
// NOTICE: "MethodA" (where ChunkUnsafe(data, -1) was originally
// CALLED) does not appear anywhere in this trace — it already
// returned long before the exception occurred.`,
    },
    {
      label: 'The eager-validation-wrapper fix — same stack frame as the actual bad call',
      language: 'csharp',
      code: `static IEnumerable<int> ChunkSafe(int[] source, int size)
{
    ArgumentOutOfRangeException.ThrowIfNegativeOrZero(size); // immediate,
                                                              // synchronous
    return Core(source, size);
    static IEnumerable<int> Core(int[] src, int sz)
    {
        for (int i = 0; i < src.Length; i += sz)
            yield return src[i];
    }
}

// Called here, in method A:
IEnumerable<int> chunks = ChunkSafe(data, -1); // <-- exception throws
                                                //     RIGHT HERE, synchronously

// The stack trace now looks like:
//   at ChunkSafe(Int32[] source, Int32 size)
//   at MethodA.WhereverThisWasCalled()   <-- the ACTUAL bad call site,
//                                            directly visible in the trace
//
// Production log triage is immediate: the trace points EXACTLY at the
// call that passed the invalid size, with zero ambiguity about where
// to look.`,
    },
    {
      label: 'Why "does this validate eagerly" is partly an observability question, not just a correctness one',
      language: 'csharp',
      code: `// Even validation that will "never realistically fail" still
// benefits from the eager pattern, purely for future debuggability:
static IEnumerable<T> TakeFirstN<T>(IEnumerable<T> source, int n)
{
    // This "can't really happen in practice" check STILL belongs
    // eagerly — if it ever DOES fire (a future caller passes bad
    // input that today's callers never would), the resulting stack
    // trace should point at THAT caller, not at some unrelated,
    // disconnected MoveNext() frame days or weeks later in a log:
    ArgumentOutOfRangeException.ThrowIfNegative(n);
    return Core(source, n);

    static IEnumerable<T> Core(IEnumerable<T> src, int count)
    {
        int taken = 0;
        foreach (var item in src)
        {
            if (taken++ >= count) yield break;
            yield return item;
        }
    }
}

// Code review takeaway: "eager validation" is worth doing even when
// you're confident the check will rarely or never trip — the payoff
// is a USEFUL stack trace on the rare day it actually does.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A production log shows an exception with a stack trace rooted at <code>SomeIterator.MoveNext()</code> called from deep inside a LINQ pipeline in an unrelated background job, with no visible trace of where the original iterator method was called. Explain why the original call site is missing, and what change to the iterator method would fix future occurrences.',
    hint: 'Consider the timing gap between when an iterator method is CALLED (constructing the state machine) and when its body actually RUNS (during enumeration) — and what that gap means for what a stack trace, captured at throw time, can and cannot show.',
    solution: `// Why the original call site is missing:
//
// The stack trace captured at THROW time reflects the call stack AT
// THE MOMENT the exception is thrown — which is during enumeration
// (inside MoveNext()), not during the original call to the iterator
// method. By the time enumeration happens (potentially in a
// completely different method, background job, or much later in
// time), the ORIGINAL call site's stack frame has long since been
// popped — it simply no longer exists to appear in any trace captured
// now. The stack trace is not a historical record of every place code
// ever touched this value; it is a snapshot of what is CURRENTLY
// executing, and "where this iterator method was called" is not part
// of that current execution state.
//
// The fix: apply the eager-validation-wrapper pattern to the iterator
// method — move any validation (or, more broadly, any code you want
// tied to the ORIGINAL call site rather than to enumeration time) into
// a synchronous, non-iterator wrapper method that runs immediately
// when called, then delegates to a private iterator for the actual
// lazy work:
static IEnumerable<T> SomeIteratorFixed<T>(/* args */)
{
    // any validation/eager work here — throws HERE if it fails,
    // with a stack trace pointing at the real caller
    return Core(/* args */);
    static IEnumerable<T> Core(/* args */) { /* yield return ... */ yield break; }
}
// Future exceptions from THIS validation will show the real call
// site. Exceptions from the actual per-element logic inside Core(),
// however, will still show a MoveNext()-rooted trace — that part is
// unavoidable, since that logic genuinely only runs during enumeration.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a stack trace shows every place in the codebase a piece of code was ever called from, going back to its origin.',
      reality: 'a stack trace is a snapshot of what is CURRENTLY executing at the moment an exception is thrown — for deferred iterator code, the original call site\'s stack frame has already been popped by the time enumeration (and any resulting exception) actually happens.',
    },
    {
      thought: 'the eager-validation-wrapper pattern is purely a correctness fix for the "exception fires too late" bug.',
      reality: 'it has a SEPARATE, equally important observability benefit — validation that throws at the call site produces a stack trace pointing directly at the real caller, dramatically speeding up production log triage, independent of whether the validation logic itself was ever wrong in practice.',
    },
    {
      thought: 'moving ALL logic in an iterator method to the eager wrapper eliminates confusing MoveNext()-rooted stack traces entirely.',
      reality: 'only code moved OUT of the iterator body (like upfront validation) gets the call-site-rooted trace — exceptions from the actual per-element logic inside the private iterator still show a MoveNext()-rooted trace, since that logic genuinely only executes during enumeration.',
    },
  ];
}
