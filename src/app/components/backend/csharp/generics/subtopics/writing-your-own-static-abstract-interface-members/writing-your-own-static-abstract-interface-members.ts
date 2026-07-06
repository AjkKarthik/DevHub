import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-writing-your-own-static-abstract-interface-members-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './writing-your-own-static-abstract-interface-members.html',
  styleUrl: './writing-your-own-static-abstract-interface-members.scss',
})
export class WritingYourOwnStaticAbstractInterfaceMembersSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The general feature behind the main topic\'s one application of it',
      points: [
        'The main Generics page treats <code>INumber&lt;T&gt;</code> as a ready-made interface to CONSUME via <code>where T : INumber&lt;T&gt;</code> — it never explains the underlying general-purpose C# 11 feature that makes <code>INumber&lt;T&gt;</code> itself possible to write: STATIC ABSTRACT interface members. This is a genuinely reusable feature you can apply to your OWN interfaces, not something exclusive to the BCL\'s numeric types.',
      ],
    },
    {
      heading: 'What a static abstract member actually is — a NEW kind of polymorphism',
      points: [
        'Ordinary interface members (like every one shown elsewhere on the main page — <code>CompareTo</code>, <code>Dispose</code>) are INSTANCE members: you need an actual OBJECT to call them on. A static abstract member is different: <code>static abstract T Parse(string s);</code> declares a member that exists on the TYPE ITSELF, with no instance required — yet it is still POLYMORPHIC, resolved based on which concrete type <code>T</code> is bound to in a generic context.',
        'This is precisely what <code>T.Zero</code> and <code>T.CreateChecked(count)</code> (seen in the main topic\'s <code>Sum</code>/<code>Average</code> examples) actually ARE — static members accessed directly on the generic type parameter <code>T</code>, dispatched to whichever concrete numeric type <code>T</code> is bound to at that call site. Before C# 11, this specific pattern (calling a STATIC member polymorphically through a generic type parameter) was IMPOSSIBLE — interfaces could only require instance members.',
      ],
    },
    {
      heading: 'Writing your own — a factory-style interface',
      points: [
        'A natural, non-numeric use case: a "parseable" contract for domain types — <code>public interface IParseable&lt;T&gt; &#123; static abstract T Parse(string input); &#125;</code> — any type implementing this provides its OWN static <code>Parse</code> method, and generic code can call <code>T.Parse(input)</code> for ANY <code>T</code> constrained to <code>IParseable&lt;T&gt;</code>, without needing a factory object instance or reflection.',
        'The implementing type provides the static member EXACTLY like implementing any other interface member: <code>public record Temperature(double Celsius) : IParseable&lt;Temperature&gt; &#123; public static Temperature Parse(string input) =&gt; new(double.Parse(input)); &#125;</code> — note the interface is <code>IParseable&lt;Temperature&gt;</code> (self-referencing the implementing type, the same CRTP-like pattern <code>INumber&lt;T&gt;</code> itself uses: <code>INumber&lt;T&gt; where T : INumber&lt;T&gt;</code>).',
      ],
    },
    {
      heading: 'Constraints, dispatch, and where this differs from ordinary polymorphism',
      points: [
        'A generic method constrained to your interface calls the static member the SAME way <code>Sum&lt;T&gt;</code> calls <code>T.Zero</code>: <code>public static T ParseAll&lt;T&gt;(string[] inputs) where T : IParseable&lt;T&gt; =&gt; ...</code> can call <code>T.Parse(input)</code> inside its body — the JIT resolves WHICH concrete type\'s <code>Parse</code> runs based on the type argument supplied at the call site, exactly like the main topic\'s explanation of JIT specialization for value-type generics.',
        'Unlike ordinary VIRTUAL member dispatch (covered in the OOP topic\'s inheritance section), there is no vtable lookup on an instance — a static abstract member is resolved through the GENERIC TYPE SYSTEM itself at JIT-compile time for each specialization, not through runtime object-based dispatch. This is why it works for value types (structs) too, which cannot participate in ordinary virtual/instance-based polymorphism the way reference types can.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A custom static-abstract interface — IParseable<T>',
      language: 'csharp',
      code: `// A self-referencing generic interface — the same CRTP-like pattern
// INumber<T> itself uses (INumber<T> where T : INumber<T>).
public interface IParseable<T> where T : IParseable<T>
{
    static abstract T Parse(string input);
}

public record Temperature(double Celsius) : IParseable<Temperature>
{
    // Implements the STATIC member — no instance needed to call this.
    public static Temperature Parse(string input)
        => new(double.Parse(input));
}

public record Distance(double Meters) : IParseable<Distance>
{
    public static Distance Parse(string input)
        => new(double.Parse(input));
}

// Called directly on the type — no factory object, no reflection:
var temp = Temperature.Parse("21.5");
var dist = Distance.Parse("100.0");
Console.WriteLine(temp.Celsius); // 21.5
Console.WriteLine(dist.Meters);  // 100.0`,
    },
    {
      label: 'Generic code consuming the static abstract member polymorphically',
      language: 'csharp',
      code: `public interface IParseable<T> where T : IParseable<T>
{
    static abstract T Parse(string input);
}

public record Temperature(double Celsius) : IParseable<Temperature>
{
    public static Temperature Parse(string input) => new(double.Parse(input));
}

public record Distance(double Meters) : IParseable<Distance>
{
    public static Distance Parse(string input) => new(double.Parse(input));
}

// Generic method — calls T.Parse(input) polymorphically, resolved to
// whichever concrete type T is bound to at each call site. This is the
// EXACT mechanism behind the main topic's T.Zero / T.CreateChecked calls
// inside Sum<T>/Average<T>, just applied to a custom, non-numeric interface.
public static T[] ParseAll<T>(string[] inputs) where T : IParseable<T>
    => inputs.Select(T.Parse).ToArray();

var temps = ParseAll<Temperature>(["20.0", "21.5", "19.8"]);
var dists = ParseAll<Distance>(["100.0", "250.5"]);

Console.WriteLine(temps[1].Celsius); // 21.5
Console.WriteLine(dists[0].Meters);  // 100.0

// The SAME generic method (ParseAll) works for ANY type implementing
// IParseable<T> — one implementation, dispatched via the type system,
// no instance-based virtual dispatch involved at all.`,
    },
    {
      label: 'Why this differs from ordinary virtual dispatch',
      language: 'csharp',
      code: `// Ordinary polymorphism (from the OOP topic) — needs an INSTANCE
public class Animal
{
    public virtual string Speak() => "...";
}
public class Dog : Animal
{
    public override string Speak() => "Woof!";
}
Animal a = new Dog();
Console.WriteLine(a.Speak()); // instance-based vtable dispatch — needs an object

// Static abstract members — NO instance needed, resolved via the TYPE
// SYSTEM at each generic specialization, works for STRUCTS too (which
// cannot use ordinary virtual/instance dispatch the way classes can).
public interface IParseable<T> where T : IParseable<T>
{
    static abstract T Parse(string input);
}

public readonly record struct Coordinate(int X, int Y) : IParseable<Coordinate>
{
    public static Coordinate Parse(string input)
    {
        var parts = input.Split(',');
        return new Coordinate(int.Parse(parts[0]), int.Parse(parts[1]));
    }
}

// No object of Coordinate needs to exist yet — Parse is called on the TYPE.
var coord = Coordinate.Parse("3,4");
Console.WriteLine(coord); // Coordinate { X = 3, Y = 4 }

// This works for a STRUCT precisely because static abstract dispatch is
// resolved through generics/JIT specialization, not a vtable on an instance —
// a capability ordinary virtual methods never had for value types.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a third type, <code>Weight(double Kilograms) : IParseable&lt;Weight&gt;</code>, implementing the static <code>Parse</code> method, then call the existing generic <code>ParseAll&lt;T&gt;</code> method with <code>Weight</code> as the type argument to prove the same generic method works for it with no changes.',
    hint: 'Define public record Weight(double Kilograms) : IParseable<Weight> { public static Weight Parse(string input) => new(double.Parse(input)); } then call ParseAll<Weight>(["70.5", "82.0"]) and print the results — no changes needed to ParseAll itself.',
    solution: `public record Weight(double Kilograms) : IParseable<Weight>
{
    public static Weight Parse(string input) => new(double.Parse(input));
}

var weights = ParseAll<Weight>(["70.5", "82.0"]);

Console.WriteLine(weights[0].Kilograms); // 70.5
Console.WriteLine(weights[1].Kilograms); // 82.0

// ParseAll<T> required ZERO changes — the same generic implementation
// dispatches to Weight.Parse purely because Weight satisfies
// IParseable<Weight>, exactly the "one implementation, any type" promise
// the main topic makes about generics in general.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'static abstract interface members are a special BCL-only mechanism used exclusively by INumber&lt;T&gt; and its related numeric interfaces.',
      reality: 'static abstract members are a general-purpose C# 11 language feature you can apply to any interface of your own design — a factory-style "parseable" contract, a unit-conversion interface, or any scenario needing a static, type-level operation resolved polymorphically through generics.',
    },
    {
      thought: 'calling T.Parse(input) or T.Zero inside a generic method works the same way as calling a virtual instance method through a base-typed reference (ordinary polymorphism).',
      reality: 'a static abstract member has no instance and no vtable at all — it is resolved through the generic type system at JIT specialization time for each concrete type argument, which is exactly why it also works for STRUCTS (value types), unlike ordinary virtual/instance-based dispatch.',
    },
    {
      thought: 'implementing a self-referencing generic interface like IParseable&lt;T&gt; where T : IParseable&lt;T&gt; is unusual or specific to advanced BCL design — not something an application developer would typically write.',
      reality: 'this self-referencing (CRTP-like) pattern is exactly how INumber&lt;T&gt; itself is declared, and it is a straightforward, reusable pattern for any "each implementing type provides its own static factory/operation" scenario in application code, not an obscure BCL-only trick.',
    },
  ];
}
