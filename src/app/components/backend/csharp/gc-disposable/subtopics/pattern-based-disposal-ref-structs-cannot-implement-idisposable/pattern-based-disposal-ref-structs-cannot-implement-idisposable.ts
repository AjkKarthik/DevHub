import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-pattern-based-disposal-ref-structs-cannot-implement-idisposable-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './pattern-based-disposal-ref-structs-cannot-implement-idisposable.html',
  styleUrl: './pattern-based-disposal-ref-structs-cannot-implement-idisposable.scss',
})
export class PatternBasedDisposalRefStructsCannotImplementIdisposableSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page treats using as tied to IDisposable — the compiler actually accepts far less than that',
      points: [
        'The main GC & IDisposable page describes <code>using</code> as calling <code>Dispose()</code> on an <code>IDisposable</code>. The precise compiler rule is looser: <code>using</code> (and <code>await using</code>) works on ANY type that has an ACCESSIBLE, PARAMETERLESS <code>public void Dispose()</code> method — whether or not that type actually implements <code>IDisposable</code> at all. This is called <strong>pattern-based disposal</strong>, resolved via ordinary method lookup, not interface dispatch.',
      ],
    },
    {
      heading: 'This exists specifically because ref structs cannot implement ANY interface',
      points: [
        'A <code>ref struct</code> (like <code>Span&lt;T&gt;</code> itself, or a custom ref struct) is FORBIDDEN by the C# language from implementing any interface at all — interfaces require the ability to be boxed to a reference type for certain operations, which a ref struct can never be, since it must live only on the stack. If <code>using</code> strictly required <code>IDisposable</code>, ref structs could never participate in a using block, no matter how much they logically need deterministic cleanup (e.g. releasing a pooled buffer, ending a diagnostic scope).',
        'Pattern-based disposal sidesteps this entirely: a ref struct can define a plain public <code>Dispose()</code> method with no interface declaration whatsoever, and <code>using var x = new MyRefStruct();</code> compiles and calls it correctly — the compiler looked for a method matching the SHAPE, not an interface, so the restriction never applies.',
      ],
    },
    {
      heading: 'The same principle applies to await using via a pattern-based DisposeAsync',
      points: [
        'Symmetrically, <code>await using</code> accepts any type with an accessible <code>public ValueTask DisposeAsync()</code> (or a type returning something awaitable with a parameterless <code>GetAwaiter</code>), independent of whether the type implements <code>IAsyncDisposable</code>. This mirrors the same "pattern, not interface" resolution rule as ordinary <code>using</code>.',
        'This is exactly the SAME kind of pattern-based resolution C# already uses elsewhere — <code>foreach</code> works on any type with a <code>GetEnumerator()</code> method (no <code>IEnumerable</code> required), and <code>await</code> itself works on any type with a <code>GetAwaiter()</code> method (no <code>Task</code>-derived type required). <code>using</code>/<code>await using</code> simply extend that same design philosophy to disposal.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A ref struct with a public Dispose() — no IDisposable, no interface at all',
      language: 'csharp',
      code: `// ref structs CANNOT implement any interface — this is a hard
// compiler restriction (ref structs live only on the stack; interface
// dispatch can require boxing, which a ref struct can never undergo):
public ref struct PooledBuffer
{
    private byte[] _buffer;
    private bool _returned;

    public PooledBuffer(int size)
    {
        _buffer = System.Buffers.ArrayPool<byte>.Shared.Rent(size);
        _returned = false;
    }

    public Span<byte> Span => _buffer;

    // Plain public Dispose() — NOT declared via ": IDisposable" anywhere,
    // because ref structs are forbidden from declaring ANY interface:
    public void Dispose()
    {
        if (_returned) return;
        System.Buffers.ArrayPool<byte>.Shared.Return(_buffer);
        _returned = true;
    }
}

// This compiles and works correctly — the compiler resolved "using"
// via PATTERN matching (looking for a public parameterless Dispose()
// method), not via an IDisposable interface check:
using var pooled = new PooledBuffer(1024);
pooled.Span[0] = 42;
// pooled.Dispose() called here automatically — same as any IDisposable`,
    },
    {
      label: 'Proof this is NOT interface dispatch — the type genuinely implements nothing',
      language: 'csharp',
      code: `public ref struct PooledBuffer
{
    // ... same as before ...
    public void Dispose() { /* ... */ }
}

// This would NOT compile — ref structs are physically forbidden from
// declaring an interface, IDisposable or otherwise:
// public ref struct PooledBuffer : IDisposable { ... }  // COMPILE ERROR

// Confirm it directly — casting to IDisposable fails, proving the
// "using" support above has NOTHING to do with the interface:
var pooled = new PooledBuffer(64);
// object boxed = pooled;                    // COMPILE ERROR — ref structs
                                               // cannot be boxed to object
// IDisposable id = pooled;                   // COMPILE ERROR — PooledBuffer
                                               // does not implement IDisposable

// Yet this compiles and runs correctly, purely via the Dispose()
// method SHAPE the compiler looks for:
using var p2 = new PooledBuffer(64);`,
    },
    {
      label: 'The same pattern extends to await using via a pattern-based DisposeAsync',
      language: 'csharp',
      code: `// A regular class CAN implement IAsyncDisposable, but doesn't have to —
// await using also resolves via pattern matching on DisposeAsync():
public class AdHocAsyncResource
{
    public async ValueTask DisposeAsync()
    {
        await Task.Delay(1); // simulate async cleanup
        Console.WriteLine("cleaned up");
    }
}
// Note: no ": IAsyncDisposable" declared anywhere on this type.

await using var res = new AdHocAsyncResource();
// DisposeAsync() called here — resolved by pattern, exactly like
// foreach resolves via GetEnumerator() and await resolves via
// GetAwaiter(), without requiring IEnumerable or a Task-derived type.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Explain why a <code>ref struct</code> physically CANNOT implement <code>IDisposable</code>, and why <code>using</code> still works correctly on one that defines a plain <code>public void Dispose()</code> method.',
    hint: 'Consider what implementing an interface would require at the CLR level (being usable wherever the interface type is expected, including as a boxed reference), and how that conflicts with a ref struct\'s core restriction of living only on the stack.',
    solution: `// Why ref structs cannot implement any interface:
//
// Interface dispatch (calling a method through an interface reference,
// e.g. IDisposable id = someObj;) requires the runtime to be able to
// treat the value as a REFERENCE TYPE for that call — which, for a
// value type, means BOXING it onto the heap first. A ref struct is
// defined specifically to be forbidden from ever being boxed (it must
// live only on the stack, to support scenarios like Span<T> safely
// wrapping stack-allocated or ref-counted memory). Since implementing
// ANY interface would require the possibility of boxing to satisfy an
// interface-typed reference, the C# compiler blanket-forbids ref
// structs from declaring any interface implementation at all.

public ref struct Example
{
    public void Dispose() { /* cleanup */ }
    // public ref struct Example : IDisposable { ... }  // ILLEGAL
}

// Why "using" still works:
//
// using (and await using) are resolved by the COMPILER via PATTERN
// MATCHING — it looks for an accessible, parameterless public
// Dispose() method (or DisposeAsync() returning an awaitable) directly
// on the type, entirely independent of any interface. Because this
// resolution never requires boxing or interface dispatch, it works
// perfectly fine on a ref struct:

using var e = new Example(); // compiles and calls Dispose() correctly,
                              // despite Example implementing NO interface
                              // at all`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a type must implement IDisposable for using to call its Dispose() method.',
      reality: 'using resolves via pattern matching on an accessible, parameterless public Dispose() method — the type does not need to implement IDisposable (or any interface) at all, which is exactly what lets ref structs participate in using blocks.',
    },
    {
      thought: 'ref structs like Span<T> could implement IDisposable if the BCL authors simply chose to add it.',
      reality: 'ref structs are forbidden from implementing ANY interface by the language itself — interface dispatch requires the possibility of boxing to a reference type, which directly conflicts with a ref struct\'s core restriction of living only on the stack.',
    },
    {
      thought: 'pattern-based disposal (Dispose() without IDisposable) is a special-case hack unique to using.',
      reality: 'it follows the SAME general design C# already uses for foreach (resolved via GetEnumerator(), no IEnumerable required) and await (resolved via GetAwaiter(), no Task-derived type required) — using/await using just extend that same pattern-matching philosophy to disposal.',
    },
  ];
}
