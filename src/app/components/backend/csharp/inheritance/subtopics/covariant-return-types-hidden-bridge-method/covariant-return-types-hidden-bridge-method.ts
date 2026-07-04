import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-covariant-return-types-hidden-bridge-method-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './covariant-return-types-hidden-bridge-method.html',
  styleUrl: './covariant-return-types-hidden-bridge-method.scss',
})
export class CovariantReturnTypesHiddenBridgeMethodSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page mentions the bridge method in one clause — never elaborates',
      points: [
        'The main Inheritance page states, in passing: "Under the hood the compiler emits both the covariant override and a bridge method satisfying the original signature." This is genuinely surprising the first time you learn it — a covariant return override is not ONE method in the compiled IL, it is TWO — and understanding why explains some otherwise-confusing reflection and interop behavior.',
      ],
    },
    {
      heading: 'Why the CLR needs a bridge method at all',
      points: [
        'The underlying .NET runtime\'s virtual method dispatch mechanism (dating back long before C# 9) requires an override to have the EXACT SAME signature — including return type — as the virtual method it overrides. The CLR itself has NEVER natively supported covariant returns at the metadata level for ordinary virtual method overriding.',
        'C# 9 achieves the APPEARANCE of covariant returns entirely at the LANGUAGE level: the compiler generates the covariant method you wrote (returning the more-derived type) PLUS a second, compiler-generated "bridge" method with the ORIGINAL base signature (returning the base type) — this bridge method\'s body simply calls your covariant method and returns its result, satisfying the CLR\'s actual override contract, which still requires an exact signature match.',
      ],
    },
    {
      heading: 'This is why reflection can see TWO methods where you wrote one',
      points: [
        'Calling <code>typeof(DerivedFactory).GetMethods()</code> via reflection can surface BOTH the covariant method you wrote AND the compiler-generated bridge method — the bridge is typically marked with hidden/special compiler-generated metadata flags, but it genuinely exists as a distinct method in the compiled assembly, not merely a language-level illusion.',
        'This matters for anyone doing METAPROGRAMMING (serializers, ORMs, custom reflection-based tooling) over a type hierarchy that uses covariant returns — naively enumerating "all methods named Create" could unexpectedly return two entries for what looks like one C# method declaration.',
      ],
    },
    {
      heading: 'The bridge is invisible in ordinary C# code — but not in IL or via other .NET languages',
      points: [
        'From ordinary C# source code, you never see or call the bridge method directly — the compiler transparently routes calls through whichever method signature is appropriate for the call site\'s STATIC type, and this is exactly why the main page\'s own example (<code>Dog myDog = df.Create("Rex");</code> with no cast) works seamlessly.',
        'A DIFFERENT .NET language (F#, VB.NET) or a tool operating at the IL level, however, genuinely sees BOTH methods in the compiled assembly — this cross-language-visibility detail is a real, if rarely encountered, consequence of covariant returns being a C#-compiler-level feature layered on top of a CLR that has no native concept of it.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main topic\'s own example — what you write',
      language: 'csharp',
      code: `// Exactly the main topic's AnimalFactory / DogFactory example:
public class AnimalFactory
{
    public virtual Animal Create(string name) => new Animal(name);
}

public class DogFactory : AnimalFactory
{
    // What you WRITE — a single covariant override:
    public override Dog Create(string name) => new Dog(name);
}

DogFactory df = new DogFactory();
Dog myDog = df.Create("Rex");   // no cast needed — this is the whole point
Animal a2  = df.Create("Spot"); // also valid — Dog is-an Animal`,
    },
    {
      label: 'What the compiler actually generates — conceptually two methods',
      language: 'csharp',
      code: `// CONCEPTUAL representation of the compiled IL — not something you
// write yourself, but genuinely what exists in the compiled assembly:
public class DogFactory : AnimalFactory
{
    // 1. The covariant method YOU wrote, compiled essentially as-is:
    public Dog Create(string name) => new Dog(name);

    // 2. A compiler-generated BRIDGE method satisfying the CLR's actual
    //    override contract — SAME signature as the base virtual method
    //    (returns Animal, not Dog), marked with special metadata so it
    //    is hidden from ordinary IntelliSense/autocomplete:
    [System.Runtime.CompilerServices.CompilerGenerated]
    public override Animal Create(string name) => this.Create(name); // (1)
    //                                              ^ calls the covariant
    //                                                method above, and the
    //                                                CLR happily upcasts
    //                                                Dog to Animal here —
    //                                                that part IS
    //                                                CLR-native (upcasting
    //                                                is always legal)

    // The CLR's vtable slot for AnimalFactory.Create is filled by method
    // (2) — the bridge — NOT directly by method (1). This is invisible
    // from ordinary C# call sites, which is exactly why the main topic's
    // usage examples above "just work" without you ever needing to know
    // this exists.
}`,
    },
    {
      label: 'Reflection can surface both methods — a real, observable consequence',
      language: 'csharp',
      code: `using System.Reflection;

var methods = typeof(DogFactory).GetMethods(BindingFlags.Public | BindingFlags.Instance)
    .Where(m => m.Name == "Create")
    .ToList();

foreach (var m in methods)
{
    Console.WriteLine($"{m.ReturnType.Name} Create(...) " +
        $"[CompilerGenerated: {m.GetCustomAttribute<System.Runtime.CompilerServices.CompilerGeneratedAttribute>() is not null}]");
}

// Possible output (exact metadata visibility can vary by compiler
// version, but the underlying two-method reality is consistent):
//   Dog Create(...)    [CompilerGenerated: False]   <- the method you wrote
//   Animal Create(...) [CompilerGenerated: True]     <- the bridge method
//
// A naive reflection-based tool enumerating "all methods named Create"
// on DogFactory could see TWO entries here — genuinely surprising if
// you only ever look at the C# source, which shows exactly ONE method
// declaration.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Given that the CLR itself has never natively supported covariant return types for virtual method overriding, explain why <code>Animal a2 = df.Create("Spot");</code> (assigning the covariant call\'s result to an Animal-typed variable) still works correctly, using the bridge-method mechanism from the theory above.',
    hint: 'Think about which of the two methods (the one you wrote, returning Dog, or the compiler-generated bridge, returning Animal) actually gets INVOKED when you call df.Create(...) through a DogFactory-typed reference versus what happens if the call goes through the vtable at the AnimalFactory level. Consider that upcasting a Dog to an Animal is always safe and always was CLR-native, regardless of covariant returns.',
    solution: `// When you write "Animal a2 = df.Create("Spot");" with df statically
// typed as DogFactory, the C# COMPILER (not the CLR) resolves this call
// directly to the covariant method you wrote — the one returning Dog —
// because the compiler can see, at compile time, that df is a DogFactory
// and DogFactory's own Create returns Dog specifically.

// The compiler then inserts an ordinary, CLR-native implicit upcast from
// Dog to Animal at the ASSIGNMENT — "Animal a2 = <Dog value>;" — which
// has ALWAYS been legal in the CLR, covariant returns or not, since Dog
// genuinely IS-AN Animal. No bridge method is even involved in THIS
// particular call, because the compiler resolved directly to the
// covariant method at compile time.

// The bridge method matters specifically for calls that go through the
// VTABLE at the BASE class's level — e.g. if you had:
AnimalFactory af = df;              // reference typed as the BASE class
Animal a3 = af.Create("Fido");      // dispatches through AnimalFactory's
                                      // OWN vtable slot for Create

// THIS call genuinely goes through virtual dispatch, landing on the
// bridge method (which has the matching Animal-returning signature the
// CLR's vtable slot expects) — the bridge then internally calls the
// covariant Dog-returning method and upcasts its result to Animal.

// So: direct calls through a DogFactory-typed reference are resolved by
// the COMPILER straight to the covariant method (no bridge involved);
// calls through a BASE-typed reference genuinely use virtual dispatch
// and land on the compiler-generated bridge, which then delegates to the
// covariant method internally. Both paths end up correct, but via
// different mechanisms — exactly the subtlety the bridge method exists
// to paper over.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a C# 9 covariant return type override compiles down to a single method in the assembly, exactly matching the one method declared in C# source.',
      reality: 'the compiler generates TWO methods: the covariant method you wrote, and a compiler-generated "bridge" method with the original base signature that the CLR\'s virtual dispatch mechanism actually requires — a genuine, observable detail via reflection, not just an internal implementation quirk.',
    },
    {
      thought: 'the CLR itself natively supports covariant return types for virtual method overriding, and C# 9 simply exposes an existing runtime capability.',
      reality: 'the main topic itself notes the CLR "has always supported" this only in the sense that upcasting is always legal — the actual COVARIANT OVERRIDE mechanism (matching a more-derived return type to a base virtual method signature) is achieved entirely by the C# compiler generating a bridge method, not by any native CLR override-matching capability.',
    },
    {
      thought: 'reflection over a type using covariant return types will only ever show the single method that appears in the C# source code.',
      reality: 'reflection can surface BOTH the covariant method and the compiler-generated bridge method as distinct MethodInfo entries — a real consequence worth knowing about for any metaprogramming, serialization, or custom reflection-based tooling operating over such a type hierarchy.',
    },
  ];
}
