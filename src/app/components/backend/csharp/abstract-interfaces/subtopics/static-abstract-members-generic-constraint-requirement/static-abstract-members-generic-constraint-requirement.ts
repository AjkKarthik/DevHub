import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-static-abstract-members-generic-constraint-requirement-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './static-abstract-members-generic-constraint-requirement.html',
  styleUrl: './static-abstract-members-generic-constraint-requirement.scss',
})
export class StaticAbstractMembersGenericConstraintRequirementSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page shows the CORRECT usage — never the natural WRONG attempt',
      points: [
        'The main Abstract Classes & Interfaces page demonstrates <code>static abstract</code> members being called correctly through a generic type parameter (<code>T.Create(arg)</code> inside a method constrained to <code>where T : IFactory&lt;T, string&gt;</code>) — but it never shows the natural first attempt a developer new to the feature tries: calling the static member directly on the INTERFACE type itself, which does not compile at all.',
      ],
    },
    {
      heading: 'Why IFactory.Create(...) cannot work — there is no single implementation to call',
      points: [
        'An interface with a <code>static abstract</code> member is fundamentally different from an ordinary static class method: the interface itself provides NO implementation whatsoever — each IMPLEMENTING TYPE provides its own. Calling <code>IFactory&lt;Widget, string&gt;.Create(...)</code> directly on the interface would require the runtime to know WHICH implementing type\'s version to invoke, but an interface reference carries no such information the way an object reference carries a runtime type.',
        'This is fundamentally different from calling an ordinary INSTANCE virtual method through an interface reference (<code>ILogger logger = ...; logger.Log(...)</code>) — there, the interface VARIABLE holds a reference to an actual OBJECT with a real runtime type, and virtual dispatch resolves correctly. A <code>static abstract</code> member has no such object to carry runtime-type information at all — there is no instance in the picture.',
      ],
    },
    {
      heading: 'The generic type parameter IS the mechanism that supplies the missing type information',
      points: [
        'Writing <code>T.Create(arg)</code> inside a method constrained to <code>where T : IFactory&lt;T, string&gt;</code> works because the COMPILER, at the generic method\'s CALL SITE, knows the concrete type substituted for <code>T</code> (e.g. <code>Widget</code>, from <code>CreateInstance&lt;Widget&gt;("Spinner")</code>) — this is resolved via a special CLR instruction (<code>constrained.callvirt</code> under the hood) that the JIT can specialize per concrete type argument, rather than through ordinary interface dispatch.',
        'This means <code>static abstract</code> interface members are usable ONLY in this one specific shape: called through a generic type parameter that is itself CONSTRAINED to the interface declaring the static abstract member — there is no other syntactically valid way to invoke one.',
      ],
    },
    {
      heading: 'This is precisely why generic math needs this feature at all',
      points: [
        'Before C# 11, writing a truly generic <code>Sum&lt;T&gt;(IEnumerable&lt;T&gt; values)</code> that could ADD numbers of ANY numeric type was impossible without either separate overloads per numeric type, or reflection/expression-tree hacks — because operators (<code>+</code>) are STATIC by nature in C#, and there was previously no way for a generic constraint to require "T must support a static + operator."',
        '<code>static abstract</code> interface members (culminating in <code>System.Numerics.INumber&lt;T&gt;</code> and friends) solve this exactly by letting a generic constraint express "T must provide these static operators/members" — and the ONLY place those members can then be invoked is through the constrained type parameter itself, exactly the mechanism this subtopic demonstrates.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The natural wrong attempt — calling the interface\'s static member directly',
      language: 'csharp',
      code: `// The main topic's own IFactory example:
public interface IFactory<TSelf, TInput> where TSelf : IFactory<TSelf, TInput>
{
    static abstract TSelf Create(TInput input);
}

public class Widget : IFactory<Widget, string>
{
    public string Name { get; }
    private Widget(string name) => Name = name;
    public static Widget Create(string name) => new Widget(name);
}

// The natural first attempt — calling directly on the INTERFACE:
// var w = IFactory<Widget, string>.Create("Spinner");
// COMPILE ERROR: CS8926 — "An interface cannot have a static abstract
// member 'Create' invoked directly through the interface type" (exact
// wording varies) — there is no single implementation the interface
// itself could dispatch to; each implementing type provides its own,
// and the interface has no way of knowing WHICH one you mean here.

// Calling it on the CONCRETE type directly works fine — this is just an
// ordinary static method call, nothing special about it:
var w1 = Widget.Create("Spinner"); // fine — Widget.Create is concrete`,
    },
    {
      label: 'The ONLY way to call it generically — through a constrained type parameter',
      language: 'csharp',
      code: `// The main topic's own generic method — this IS the correct shape:
T CreateInstance<T>(string arg) where T : IFactory<T, string>
    => T.Create(arg);   // works — T is a GENERIC TYPE PARAMETER constrained
                          // to IFactory<T, string>, not the interface itself

var w2 = CreateInstance<Widget>("Spinner"); // compiler substitutes T = Widget
Console.WriteLine(w2.Name); // Spinner

// Under the hood, "T.Create(arg)" compiles to a special CLR instruction
// (constrained.callvirt) that the JIT specializes per concrete type
// argument at the CALL SITE of CreateInstance<Widget> — genuinely
// different machinery than either ordinary static dispatch (Widget.Create)
// or ordinary virtual instance dispatch (interface.Method() on an object).

// This ALSO means you cannot store "T.Create" as a delegate/Func the
// same way you might with an ordinary static method reference, without
// itself being inside a similarly-constrained generic context:
Func<string, T> CreateDelegate<T>() where T : IFactory<T, string>
    => T.Create; // valid — because we're still inside a method
                  // constrained on T`,
    },
    {
      label: 'Why generic math needs exactly this mechanism',
      language: 'csharp',
      code: `using System.Numerics;

// Before C# 11 / static abstract members, this was NOT expressible —
// there was no way to constrain T to "supports a static + operator":
static T SumAll<T>(IEnumerable<T> values) where T : INumber<T>
{
    T total = T.Zero;          // static abstract member on INumber<T>
    foreach (var v in values)
        total += v;             // uses T's static abstract + operator
    return total;
}

Console.WriteLine(SumAll(new[] { 1, 2, 3 }));         // 6 (int)
Console.WriteLine(SumAll(new[] { 1.5, 2.5 }));        // 4.0 (double)
Console.WriteLine(SumAll(new[] { 1m, 2m, 3m }));      // 6 (decimal)

// ONE generic method now works across every numeric type that
// implements INumber<T> — int, double, decimal, and any custom numeric
// type you define yourself — because T.Zero and the + operator are both
// static abstract members, callable ONLY through the constrained T,
// exactly the mechanism this subtopic covers. Before this feature, you
// would have needed a separate SumAll overload for every numeric type,
// or resorted to reflection/expression trees to fake generic arithmetic.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Would <code>static abstract TSelf Create(TInput input);</code> (from the main topic\'s IFactory interface) be callable as <code>((IFactory<Widget, string>)someWidgetInstance).Create("x")</code> — i.e. through an ordinary interface-typed INSTANCE reference, the same way explicit interface implementation works for regular instance members? Explain why or why not.',
    hint: 'Think about what an "interface-typed instance reference" actually IS — a reference to a specific OBJECT. Static members, by definition, have no association with any particular instance at all — consider whether it even makes conceptual sense to look up a static member "through" an object reference, versus through a generic type parameter that stands in for a TYPE, not an instance.',
    solution: `// No — this does not compile, and the reason is conceptual, not just a
// syntax restriction: static members have no connection to any specific
// INSTANCE at all. "someWidgetInstance" is a reference to one particular
// Widget object — but Create() doesn't operate on an instance, it
// operates on the TYPE Widget itself (to construct a NEW instance).

// var w = someWidgetInstance.Create("x");  // COMPILE ERROR regardless
//                                            // of casting to the interface —
//                                            // "Create" is static; it
//                                            // cannot be invoked via an
//                                            // instance expression at all,
//                                            // interface-typed or not.

// This is true for ordinary static members too, with or without
// interfaces involved — you have never been able to call a static
// method "through" an instance variable in C#, even before static
// abstract interface members existed:
public class Ordinary { public static void Foo() { } }
var o = new Ordinary();
// o.Foo();  // Also a compile error — same underlying reason.

// The ONLY mechanism that lets you invoke a static abstract interface
// member "generically" (without knowing the concrete type by name) is
// the constrained generic type PARAMETER shape (T.Create(...) inside a
// method where T : IFactory<T, TInput>) — because T there represents a
// TYPE, substitutable per call site, not an instance. There is no
// instance-reference equivalent for static members, interface-based or
// otherwise — this has always been true in C#, and static abstract
// interface members do not change that fundamental rule.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a static abstract interface member can be called directly on the interface type itself, similar to how an ordinary static class method is called on its declaring class.',
      reality: 'the interface itself provides no implementation for a static abstract member — each implementing type provides its own — so there is no single implementation the interface could dispatch to when called directly; only a generic type parameter constrained to the interface can invoke it.',
    },
    {
      thought: 'static abstract interface members can be called through an interface-typed instance reference, the same way ordinary instance members work via explicit interface implementation.',
      reality: 'static members have no association with any instance at all — this is a fundamental C# rule that predates static abstract interface members entirely; static members have never been callable through an instance reference, interface-typed or not.',
    },
    {
      thought: 'the only way generic math (summing arbitrary numeric types) could have been achieved before C# 11 was reflection or expression trees, and static abstract members are just a convenience wrapper around the same idea.',
      reality: 'static abstract interface members introduce a genuinely new CLR-level dispatch mechanism (a specialized constrained call resolved per concrete type argument at the generic method\'s call site) — this is categorically different from, and significantly faster than, reflection-based or expression-tree-based approaches to generic arithmetic.',
    },
  ];
}
