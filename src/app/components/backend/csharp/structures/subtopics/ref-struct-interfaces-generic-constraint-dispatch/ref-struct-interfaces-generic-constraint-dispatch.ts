import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-ref-struct-interfaces-generic-constraint-dispatch-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './ref-struct-interfaces-generic-constraint-dispatch.html',
  styleUrl: './ref-struct-interfaces-generic-constraint-dispatch.scss',
})
export class RefStructInterfacesGenericConstraintDispatchSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page mentions this in one clause — never demonstrates it',
      points: [
        'The main Structures page states, in passing: "C# 13 allows ref struct to implement interfaces, provided they are used only through generic constraints — enabling polymorphism without the boxing that interface-typed variables would cause." This is a brand-new (C# 13) capability worth seeing in actual code, since it resolves a real historical limitation.',
      ],
    },
    {
      heading: 'Why ref structs COULDN\'T implement interfaces before C# 13',
      points: [
        'Implementing an interface historically meant the type COULD be assigned to a variable of that interface type — <code>IMyInterface x = myValue;</code> — which, for any value type, means BOXING (heap-allocating a copy). But <code>ref struct</code> is specifically defined as never being allowed to escape onto the heap — so allowing it to implement an interface would create a direct contradiction: the interface assignment path requires boxing, but boxing is exactly what <code>ref struct</code> forbids.',
        'Before C# 13, this contradiction was resolved by simply NOT allowing <code>ref struct</code> to implement interfaces at all — a real limitation, since it meant <code>Span&lt;T&gt;</code>-like types could never participate in interface-based generic algorithms, only in algorithms written specifically for their own concrete type.',
      ],
    },
    {
      heading: 'C# 13\'s fix — allow implementation, but ONLY generic-constrained dispatch',
      points: [
        'C# 13 resolves the contradiction by allowing a <code>ref struct</code> to implement an interface, while STILL forbidding the boxing-requiring path: you CANNOT write <code>IMyInterface x = myRefStruct;</code> (still a compile error) — you CAN call interface members through a GENERIC TYPE PARAMETER constrained to that interface (<code>where T : IMyInterface</code>), exactly the same <code>constrained.callvirt</code>-style mechanism that makes <code>static abstract</code> interface members work without an instance (covered in the Abstract Classes & Interfaces topic\'s own subtopic on this).',
        'This means a <code>ref struct</code> implementing an interface gets GENUINE polymorphism (a generic algorithm can operate on ANY type implementing the interface, ref struct or not) with ZERO boxing — the JIT specializes the generic method per concrete type argument, the same specialization mechanism ordinary generic constraints have always used, just now extended to permit ref struct type arguments specifically for this interface-implementing scenario.',
      ],
    },
    {
      heading: 'A concrete motivating use case — Span-like types participating in generic algorithms',
      points: [
        'Before C# 13, writing a generic algorithm that needed to work over BOTH ordinary collections AND <code>Span&lt;T&gt;</code>-like stack-only buffers, via a SHARED interface contract, was impossible — the span-like type simply could not implement the interface at all. C# 13\'s relaxation opens this door specifically for the generic-constrained dispatch shape, letting high-performance buffer/parsing code share interface-based algorithms with ordinary heap-allocated collections, without paying the boxing cost either way.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Before C# 13 — this was simply not possible at all',
      language: 'csharp',
      code: `// Pre-C# 13: a ref struct implementing an interface was a compile error
public interface ILength
{
    int Length { get; }
}

// COMPILE ERROR (pre-C# 13): 'MyBuffer': ref struct cannot implement interfaces
// ref struct MyBuffer : ILength
// {
//     private Span<byte> _data;
//     public int Length => _data.Length;
// }

// The ONLY option before C# 13: write algorithms specific to the
// CONCRETE ref struct type, with no shared interface-based abstraction
// possible for Span-like types at all.`,
    },
    {
      label: 'C# 13 — implementation allowed, but generic-constrained dispatch only',
      language: 'csharp',
      code: `public interface ILength
{
    int Length { get; }
}

// C# 13: ref struct CAN now implement an interface:
public ref struct StackBuffer : ILength
{
    private Span<byte> _data;
    public StackBuffer(Span<byte> data) => _data = data;
    public int Length => _data.Length;
}

// The BOXING-requiring path is STILL forbidden — this remains a
// compile error, exactly as it always has been for ref struct:
// ILength boxed = new StackBuffer(stackalloc byte[8]); // still illegal

// The GENERIC-CONSTRAINED path is what C# 13 newly permits — zero
// boxing, resolved via the same constrained-dispatch mechanism that
// powers static abstract interface members:
static int GetLength<T>(T item) where T : ILength => item.Length;

Span<byte> raw = stackalloc byte[8];
var buffer = new StackBuffer(raw);

int len = GetLength(buffer); // WORKS — T is StackBuffer, resolved
                               // generically, ZERO boxing occurs
Console.WriteLine(len); // 8`,
    },
    {
      label: 'A generic algorithm shared between a ref struct and an ordinary class',
      language: 'csharp',
      code: `public interface ILength
{
    int Length { get; }
}

public ref struct StackBuffer : ILength
{
    private Span<byte> _data;
    public StackBuffer(Span<byte> data) => _data = data;
    public int Length => _data.Length;
}

public class HeapList : ILength
{
    private readonly List<int> _items = new();
    public void Add(int item) => _items.Add(item);
    public int Length => _items.Count;
}

// ONE generic algorithm, shared between a STACK-ONLY ref struct and an
// ORDINARY heap-allocated class — exactly the motivating use case:
static void PrintLength<T>(T item) where T : ILength
    => Console.WriteLine($"Length: {item.Length}");

Span<byte> raw = stackalloc byte[16];
PrintLength(new StackBuffer(raw));  // "Length: 16" — zero boxing

var list = new HeapList();
list.Add(1); list.Add(2); list.Add(3);
PrintLength(list);                  // "Length: 3" — ordinary class, no issue

// Before C# 13, StackBuffer could never have participated in this
// shared generic algorithm at all — it simply couldn't implement
// ILength. Now it can, with the same zero-boxing guarantee ref struct
// has always provided for its own concrete-type usage.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Would <code>static void PrintAny(ILength item) => Console.WriteLine(item.Length);</code> (a NON-generic method accepting the interface type directly, instead of a generic type parameter) compile if called with a StackBuffer argument? Explain why or why not, referencing the specific boundary C# 13 draws.',
    hint: 'Recall the theory\'s specific framing: C# 13 permits implementation but still forbids the BOXING-requiring assignment path. Think about what "PrintAny(ILength item)" actually requires at the call site — does passing a StackBuffer argument to a parameter of type ILength require the exact same boxing conversion that "ILength boxed = myRefStruct;" would?',
    solution: `// No — this does NOT compile. Passing a StackBuffer argument to a
// parameter of type ILength (a non-generic interface type) requires
// EXACTLY the same implicit boxing conversion as "ILength boxed =
// myRefStruct;" — the argument must be converted to the interface type
// at the call site, which for a value type means boxing.

static void PrintAny(ILength item) => Console.WriteLine(item.Length);

Span<byte> raw = stackalloc byte[8];
var buffer = new StackBuffer(raw);

// PrintAny(buffer);
// COMPILE ERROR — cannot convert StackBuffer to ILength without boxing,
// which ref struct forbids categorically, regardless of C# 13's
// interface-implementation relaxation.

// The ONLY way to call length-related logic on a StackBuffer through
// its ILength interface membership is the GENERIC path:
static void PrintAnyGeneric<T>(T item) where T : ILength
    => Console.WriteLine(item.Length);

PrintAnyGeneric(buffer); // WORKS — T is resolved to StackBuffer at the
                           // call site, no boxing needed, no interface-
                           // typed PARAMETER or VARIABLE ever created.

// This is exactly the boundary the theory describes: C# 13 permits
// IMPLEMENTING the interface, but the only way to actually USE that
// implementation is through a constrained generic type parameter —
// never through an ordinary interface-typed parameter, variable, or
// return type, which would all require the same forbidden boxing step.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'C# 13\'s support for ref struct interface implementation means a ref struct can now be assigned to an interface-typed variable or passed to an interface-typed parameter, just like any other type implementing that interface.',
      reality: 'that specific path still requires boxing and remains a compile error for ref struct, exactly as before C# 13 — the only newly-permitted usage is calling interface members through a GENERIC TYPE PARAMETER constrained to the interface, which resolves without boxing via specialized dispatch.',
    },
    {
      thought: 'ref struct could always implement interfaces in C#, just with some unspecified restriction on how they could be used.',
      reality: 'prior to C# 13, a ref struct implementing an interface at all was a compile error — there was no partial support; C# 13 introduces implementation support for the first time, specifically scoped to the generic-constrained dispatch shape.',
    },
    {
      thought: 'the C# 13 relaxation for ref struct interfaces uses a fundamentally different mechanism than the one that powers static abstract interface members.',
      reality: 'both features rely on the same underlying constrained-dispatch mechanism (resolving the correct implementation via a generic type parameter at the JIT level, specialized per concrete type argument) — ref struct interface implementation is essentially applying that same tool to a new scenario.',
    },
  ];
}
