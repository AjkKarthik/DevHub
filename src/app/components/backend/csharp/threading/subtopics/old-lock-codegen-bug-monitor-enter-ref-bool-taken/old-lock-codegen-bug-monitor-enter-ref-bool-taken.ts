import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-old-lock-codegen-bug-monitor-enter-ref-bool-taken-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './old-lock-codegen-bug-monitor-enter-ref-bool-taken.html',
  styleUrl: './old-lock-codegen-bug-monitor-enter-ref-bool-taken.scss',
})
export class OldLockCodegenBugMonitorEnterRefBoolTakenSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states the compiled form in one line — this is the specific bug that shaped it',
      points: [
        'The main Threading page states <code>lock(obj) { ... }</code> compiles to <code>Monitor.Enter(obj, ref taken)</code> / <code>Monitor.Exit(obj)</code> in a try/finally, using the two-argument <code>Enter</code> overload with a <code>ref bool taken</code> parameter. Before C# 4 / .NET 4, the compiler generated a DIFFERENT, simpler pattern using the ONE-argument <code>Monitor.Enter(obj)</code> — and that older pattern had a genuine reliability hole.',
      ],
    },
    {
      heading: 'The old codegen: a window existed between Enter succeeding and the try block actually starting',
      points: [
        'The pre-C#4 lowering was effectively: <code>Monitor.Enter(obj); try { ... } finally { Monitor.Exit(obj); }</code> — with <code>Monitor.Enter(obj)</code> called BEFORE the try block began. If a rare, asynchronous exception (historically <code>ThreadAbortException</code>, triggered by the now-obsolete <code>Thread.Abort()</code>) landed in the tiny window AFTER <code>Monitor.Enter</code> successfully acquired the lock but BEFORE the try block\'s protective finally was actually in effect, the <code>finally</code> would never run — the lock would be acquired but NEVER RELEASED, a permanent lock leak that could deadlock every other thread waiting on that same object, for the remaining lifetime of the process.',
      ],
    },
    {
      heading: 'The fix: pass "taken" as a ref parameter, set atomically as part of Enter itself',
      points: [
        'The <code>Monitor.Enter(object obj, ref bool lockTaken)</code> overload (introduced in .NET 4) sets <code>lockTaken</code> to <code>true</code> as an atomic part of successfully acquiring the lock — the CLR guarantees that if the lock was actually taken, <code>lockTaken</code> WILL be observed as <code>true</code> by the corresponding <code>finally</code> block, even if an asynchronous exception occurs at the worst possible moment. The compiler\'s modern lowering calls THIS overload and checks <code>if (taken) Monitor.Exit(obj);</code> in the <code>finally</code> — closing the exact reliability gap the old codegen had.',
        'This is a genuinely rare, historical concern in modern code — <code>Thread.Abort()</code> itself is effectively obsolete and throws <code>PlatformNotSupportedException</code> on .NET Core/.NET 5+ — but the <code>ref bool taken</code> pattern remains in the compiler\'s output today, and understanding WHY it exists explains a detail that would otherwise look like unnecessary boilerplate the first time you decompile a <code>lock</code> block.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'What lock(obj) { ... } actually lowers to today',
      language: 'csharp',
      code: `lock (someObject)
{
    DoWork();
}

// Decompiled equivalent (simplified) — the CURRENT, safe lowering:
bool lockTaken = false;
try
{
    Monitor.Enter(someObject, ref lockTaken); // sets lockTaken=true
                                                // ATOMICALLY with acquiring
    DoWork();
}
finally
{
    if (lockTaken)
        Monitor.Exit(someObject);
    // "if (lockTaken)" is the key — Exit is only called if Enter
    // GENUINELY succeeded, closing the old reliability gap`,
    },
    {
      label: 'The OLD (pre-C# 4) lowering — the reliability gap it had',
      language: 'csharp',
      code: `// The historical, now-replaced lowering pattern:
Monitor.Enter(someObject);   // <-- if a ThreadAbortException landed HERE,
                              //     immediately after Enter succeeded but
                              //     before the try block's protection was
                              //     in effect, the lock is acquired but
                              //     the corresponding finally NEVER RUNS
try
{
    DoWork();
}
finally
{
    Monitor.Exit(someObject); // never reached in that specific failure
                               // window — the lock leaks PERMANENTLY
}

// Every other thread that later calls lock(someObject) blocks forever —
// a single, rare, asynchronous-exception timing coincidence produces a
// process-wide deadlock with no obvious cause in the stack trace.`,
    },
    {
      label: 'Why this is mostly historical today — but still shapes what you see decompiled',
      language: 'csharp',
      code: `// Thread.Abort() — the mechanism that historically triggered this
// exact race — is itself obsolete on modern .NET:
try
{
    someThread.Abort();
}
catch (PlatformNotSupportedException)
{
    // .NET Core / .NET 5+ : Thread.Abort() always throws this —
    // asynchronous thread aborts no longer exist on these runtimes
}

// So the SPECIFIC failure mode the ref-bool pattern was designed to
// close is not directly exploitable via Thread.Abort() anymore on
// modern .NET. The compiler nonetheless STILL emits the ref-bool
// pattern for every lock block — it remains the correct, defensive
// lowering regardless of whether Thread.Abort() is reachable, since
// other forms of unexpected interruption (e.g. out-of-memory
// conditions during JIT) are still theoretically possible at CLR
// boundaries, and the pattern costs nothing extra at runtime.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Explain, in your own words, why <code>Monitor.Enter(object, ref bool taken)</code> guarantees the finally block can always correctly decide whether to call <code>Monitor.Exit</code>, whereas the single-argument <code>Monitor.Enter(object)</code> version cannot provide that same guarantee.',
    hint: 'Consider what "atomically" means here — the CLR guarantees that setting taken=true and actually acquiring the lock happen as one indivisible unit from the perspective of asynchronous exceptions, so there is no window where the lock is held but taken is still false.',
    solution: `// Monitor.Enter(object obj, ref bool lockTaken) — the KEY guarantee:
//
// The CLR treats "acquire the lock" and "set lockTaken = true" as a
// single, atomic unit with respect to asynchronous exceptions. There
// is NO possible interruption point where the lock has been acquired
// but lockTaken is still observed as false by the corresponding
// finally block — either BOTH happened, or NEITHER did.
//
// This means the finally block's "if (lockTaken) Monitor.Exit(obj);"
// check is always CORRECT: if lockTaken is true, the lock is
// definitely held and must be released; if false, the lock was never
// acquired and Exit must NOT be called (calling Exit without holding
// the lock throws SynchronizationLockException).
//
// The single-argument Monitor.Enter(obj) provides NO equivalent
// signal — the ONLY way to know whether Enter succeeded is that
// control reached the line after it, which is exactly what an
// asynchronous exception between Enter succeeding and the try block's
// protection taking effect could interrupt. There is no separate,
// atomically-set flag to consult instead — the reliability gap is a
// direct consequence of relying on program-counter position rather
// than an explicit, atomically-updated signal.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the ref bool "taken" parameter in Monitor.Enter is just an optional convenience for checking whether the lock was acquired.',
      reality: 'it exists specifically to close a genuine reliability gap in the old lock codegen — the CLR guarantees taken is set atomically with acquiring the lock, so the corresponding finally block can always correctly decide whether to call Monitor.Exit, even under an asynchronous exception at the worst possible moment.',
    },
    {
      thought: 'the historical lock leak bug this pattern fixes is still directly exploitable in modern .NET applications.',
      reality: 'the specific trigger — an asynchronous ThreadAbortException from Thread.Abort() — is effectively unavailable on .NET Core/.NET 5+, since Thread.Abort() always throws PlatformNotSupportedException there; the pattern remains in the compiler\'s output as defensive, zero-cost correctness rather than addressing an actively common failure mode today.',
    },
    {
      thought: 'lock(obj) has always compiled to the same Monitor.Enter/Exit pattern seen in decompiled code today.',
      reality: 'the pre-C# 4 lowering used the single-argument Monitor.Enter(obj) called BEFORE the try block began, which had a real (if rare) window where the lock could be acquired but never released — the modern ref bool taken pattern was introduced specifically to close that gap.',
    },
  ];
}
