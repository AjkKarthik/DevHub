import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-safe-wrapper-dispose-idempotent-use-after-dispose-throws-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-safe-wrapper-dispose-idempotent-use-after-dispose-throws.html',
  styleUrl: './testing-safe-wrapper-dispose-idempotent-use-after-dispose-throws.scss',
})
export class TestingSafeWrapperDisposeIdempotentUseAfterDisposeThrowsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'You cannot unit test the pointer arithmetic itself in any meaningful way — but you CAN, and MUST, test the safety CONTRACT of the wrapper around it',
      points: [
        'The main Unsafe Code &amp; Pointers page\'s own "Safe wrapper pattern" example (<code>UnmanagedBuffer</code>) is exactly the shape of code that gets unsafe pointer logic into production responsibly: raw pointers stay entirely inside the class, and the public surface is ordinary, safe C#. Testing this class is NOT about testing pointer arithmetic — it is about testing that the SAFETY CONTRACT the wrapper promises actually holds: double-dispose does not crash, use-after-dispose throws predictably, and the buffer\'s observable state (its <code>Length</code>, its <code>Span</code> contents) behaves exactly as any other <code>IDisposable</code> would.',
      ],
    },
    {
      heading: 'Three concrete, fully-managed (no unsafe keyword in the TEST) properties to assert',
      points: [
        '<strong>Idempotent Dispose</strong>: calling <code>Dispose()</code> a second time must NOT throw and must NOT attempt to free already-freed native memory (a double-free is undefined behaviour, potentially a genuine memory-corruption bug, not just a logic error). The main page\'s <code>UnmanagedBuffer.Dispose()</code> guards with a <code>_disposed</code> flag specifically to make this safe — a test should assert that guard actually works.',
        '<strong>Use-after-dispose throws</strong>: any method that touches the underlying pointer (<code>AsSpan()</code> in the main page\'s example) must throw <code>ObjectDisposedException</code> once disposed, rather than silently reading/writing invalid memory. This is exactly the difference between "safe unsafe code" and a ticking time bomb — the check has to run on EVERY access, not just be documented as a precondition.',
        '<strong>The Span\'s observable length and content match what was written</strong> — proving the wrapper\'s <code>AsSpan()</code> genuinely exposes the SAME underlying buffer (not a stale copy, not a wrong length) that other operations mutate.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Testing idempotent Dispose — calling it twice must be safe',
      language: 'csharp',
      code: `using Xunit;

public class UnmanagedBufferTests
{
    [Fact]
    public void Dispose_CalledTwice_DoesNotThrow()
    {
        var buffer = new UnmanagedBuffer(1024);

        buffer.Dispose();

        // This is the critical assertion — a double free of NativeMemory
        // is undefined behaviour (potential memory corruption), NOT a
        // clean exception. The wrapper's _disposed guard must make a
        // SECOND Dispose() call a safe no-op:
        var exception = Record.Exception(() => buffer.Dispose());
        Assert.Null(exception);
    }

    [Fact]
    public void UsingStatement_DisposesExactlyOnce_EvenWithExplicitDisposeAlso()
    {
        UnmanagedBuffer? captured = null;
        using (var buffer = new UnmanagedBuffer(1024))
        {
            captured = buffer;
            buffer.AsSpan().Fill(0xAB);
        }
        // "using" already called Dispose() here — calling it again
        // explicitly must still be safe:
        var exception = Record.Exception(() => captured!.Dispose());
        Assert.Null(exception);
    }
}`,
    },
    {
      label: 'Testing use-after-dispose throws ObjectDisposedException',
      language: 'csharp',
      code: `public class UnmanagedBufferDisposalTests
{
    [Fact]
    public void AsSpan_AfterDispose_ThrowsObjectDisposedException()
    {
        var buffer = new UnmanagedBuffer(1024);
        buffer.Dispose();

        // This is the assertion that actually PROVES the safety
        // contract — without it, "AsSpan after Dispose" would silently
        // hand back a Span<byte> over ALREADY-FREED native memory,
        // which is a genuine, exploitable use-after-free bug, not a
        // benign logic error:
        Assert.Throws<ObjectDisposedException>(() => buffer.AsSpan());
    }

    [Fact]
    public void AsSpan_BeforeDispose_ReturnsWorkingSpanOfCorrectLength()
    {
        using var buffer = new UnmanagedBuffer(256);

        Span<byte> span = buffer.AsSpan();
        span.Fill(0x7F);

        Assert.Equal(256, span.Length);
        Assert.Equal(256, buffer.Length);
        Assert.All(buffer.AsSpan().ToArray(), b => Assert.Equal(0x7F, b));
        // Re-reading via a FRESH AsSpan() call proves the mutation
        // landed in the SAME underlying native buffer, not a stale copy.
    }
}`,
    },
    {
      label: 'What a test CANNOT prove — no unit test detects an actual native memory leak',
      language: 'csharp',
      code: `// There is NO practical unit test that directly proves NativeMemory.Free
// was actually called and the OS reclaimed the memory — unlike managed
// objects, there is no WeakReference/GC.Collect() trick that works for
// unmanaged allocations, because the GC has no knowledge of native memory
// at all.
//
// The realistic verification strategy is INDIRECT:
[Fact]
public void Dispose_SetsInternalPointerToNull_PreventingFurtherUse()
{
    var buffer = new UnmanagedBuffer(1024);
    buffer.Dispose();

    // We can't inspect the private _ptr field directly in a clean test —
    // but we CAN assert the PUBLICLY OBSERVABLE consequence of it being
    // nulled/freed: every public method that would dereference it now
    // throws instead of silently "working" on freed memory.
    Assert.Throws<ObjectDisposedException>(() => buffer.AsSpan());

    // For a genuine leak-detection test, you need something outside
    // unit testing entirely — e.g. running the allocate/dispose cycle
    // thousands of times under a memory profiler (dotMemory, dotnet-
    // counters --counters System.Runtime) and confirming the process's
    // native (non-GC) memory usage returns to baseline, not just that
    // managed heap size is stable.
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate writes <code>UnmanagedBuffer</code> WITHOUT the <code>_disposed</code> guard — <code>Dispose()</code> simply calls <code>NativeMemory.Free(_ptr)</code> unconditionally every time it is invoked. Write a test that would catch the resulting bug, and explain what actually goes wrong at the native memory level when Dispose runs twice.',
    hint: 'Consider what NativeMemory.Free(ptr) does the SECOND time it is called with the same pointer value that was already freed once — this is not a C# exception scenario at all, so think about what kind of test failure would actually surface it.',
    solution: `// The buggy version — no _disposed guard:
public sealed class BuggyUnmanagedBuffer : IDisposable
{
    private unsafe void* _ptr;
    private readonly int _size;

    public BuggyUnmanagedBuffer(int size)
    {
        _size = size;
        unsafe { _ptr = NativeMemory.AllocZeroed((nuint)size); }
    }

    public Span<byte> AsSpan()
    {
        unsafe { return new Span<byte>(_ptr, _size); }
    }

    public void Dispose()
    {
        // BUG: no _disposed check — frees the SAME pointer value every
        // single time Dispose() is called, no matter how many times:
        unsafe { NativeMemory.Free(_ptr); }
    }
}

[Fact]
public void Dispose_CalledTwice_ShouldNotDoubleFree()
{
    var buffer = new BuggyUnmanagedBuffer(1024);
    buffer.Dispose();

    // WHAT ACTUALLY HAPPENS AT THE NATIVE LEVEL: NativeMemory.Free
    // (which wraps the C runtime's free()) called TWICE on the SAME
    // pointer is undefined behaviour at the allocator level — it can
    // corrupt the heap's internal free-list bookkeeping, silently, with
    // NO GUARANTEED EXCEPTION in C#. Some allocators crash immediately
    // (AV/segfault), some corrupt unrelated memory that only surfaces
    // as a crash much later in a COMPLETELY DIFFERENT part of the
    // program, and some appear to "work" for a while.
    //
    // This means a plain "Assert.Throws" test is NOT reliable here —
    // a double-free may or may not throw an exception C# can catch at
    // all; it might instead crash the ENTIRE PROCESS (access violation),
    // which no xUnit Assert can capture as a normal test failure.
    //
    // The PRACTICAL way to catch this class of bug in code review /
    // testing is a STATIC review checklist item ("does Dispose() have
    // an idempotency guard?") PLUS a stress test that calls Dispose()
    // many times in a tight loop across MANY buffer instances under a
    // sanitizer/memory-debug allocator (e.g. running the test suite
    // under an environment variable that enables the debug CRT heap on
    // Windows, or Address Sanitizer equivalents) — a plain, unmodified
    // xUnit run may simply not manifest the corruption on every machine
    // or every run, which is itself the core danger of this bug class.
    var exception = Record.Exception(() => buffer.Dispose());
    // This assertion is a WEAK signal — it may pass even with the bug
    // present, since not every double-free throws a managed exception:
    Assert.Null(exception);
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a unit test can directly verify that unsafe pointer code has no bugs in its pointer arithmetic.',
      reality: 'unit tests verify observable BEHAVIOR (values read/written, exceptions thrown) — they cannot inspect raw memory correctness directly; the real safety net is wrapping unsafe code behind a safe, well-tested public API surface, which is what IS testable.',
    },
    {
      thought: 'a double-free bug (calling Dispose twice on unguarded native memory code) will reliably throw a catchable .NET exception in a test.',
      reality: 'a double-free is undefined behaviour at the native allocator level — it may corrupt heap bookkeeping silently, crash the entire process with no catchable exception, or appear to work depending on the allocator and timing; a plain Assert.Throws test is not a reliable detector for this class of bug.',
    },
    {
      thought: 'testing that Dispose() does not throw when called twice fully proves the wrapper is leak-free and memory-safe.',
      reality: 'it only proves the OBSERVABLE .NET-level contract holds — genuine native memory leak detection requires a memory profiler or stress test observing actual process memory, since the GC (and therefore ordinary unit-test tricks like WeakReference) has no visibility into unmanaged allocations at all.',
    },
  ];
}
