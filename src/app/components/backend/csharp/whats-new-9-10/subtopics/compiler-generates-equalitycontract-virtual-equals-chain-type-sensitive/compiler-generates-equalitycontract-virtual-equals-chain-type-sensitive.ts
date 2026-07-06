import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-compiler-generates-equalitycontract-virtual-equals-chain-type-sensitive-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './compiler-generates-equalitycontract-virtual-equals-chain-type-sensitive.html',
  styleUrl: './compiler-generates-equalitycontract-virtual-equals-chain-type-sensitive.scss',
})
export class CompilerGeneratesEqualitycontractVirtualEqualsChainTypeSensitiveSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states record equality is "type-sensitive" and mentions a "generated EqualityContract virtual property" — this subtopic shows exactly what that generated code looks like and why it works',
      points: [
        'The main C# 9 &amp; 10 page notes: "the compiler generates a <code>protected virtual bool PrintMembers</code> chain that includes the runtime type in equality" and "generates an <code>EqualityContract</code> virtual property that includes the runtime type." These are both real, but stated as facts to accept rather than mechanisms to inspect — decompiling a simple record reveals EXACTLY how "Dog != Animal even with identical properties" is implemented, line by line.',
      ],
    },
    {
      heading: 'EqualityContract is a virtual property returning typeof(the record\'s OWN declared type) — and it is CHECKED FIRST, before any property comparison happens at all',
      points: [
        'For <code>public record Animal(string Name);</code>, the compiler generates (conceptually): <code>protected virtual Type EqualityContract =&gt; typeof(Animal);</code>. For <code>public record Dog(string Name, string Breed) : Animal(Name);</code>, it generates its OWN override: <code>protected override Type EqualityContract =&gt; typeof(Dog);</code>.',
        'The generated <code>Equals(Animal? other)</code> method\'s FIRST check (before comparing <code>Name</code>, <code>Breed</code>, or anything else) is: <code>other is not null &amp;&amp; EqualityContract == other.EqualityContract &amp;&amp; Name == other.Name [&amp;&amp; Breed == other.Breed, for the Dog override]</code>. Because <code>EqualityContract</code> is VIRTUAL, calling it on an <code>Animal</code>-typed reference that actually POINTS TO a <code>Dog</code> instance still returns <code>typeof(Dog)</code> — exactly the same virtual-dispatch mechanism that makes <code>ToString()</code> overrides work polymorphically.',
      ],
    },
    {
      heading: 'This is WHY the comparison fails at the very first check, before Name is ever examined — and why sealing a record removes even that check',
      points: [
        'When comparing an <code>Animal</code> instance (whose <code>EqualityContract</code> returns <code>typeof(Animal)</code>) against a <code>Dog</code> instance (whose <code>EqualityContract</code> returns <code>typeof(Dog)</code>), the very FIRST condition in the generated <code>Equals</code> method — <code>EqualityContract == other.EqualityContract</code> — is already <code>false</code> (<code>typeof(Animal) != typeof(Dog)</code>), so the method short-circuits and returns <code>false</code> immediately. The <code>Name</code> values are NEVER EVEN COMPARED — the type mismatch alone is sufficient to fail equality.',
        'A <code>sealed record</code> has no possible derived types, so its <code>EqualityContract</code> can never differ from any OTHER instance of the exact same sealed type being compared — the compiler can (and does, per the main page\'s own note) slightly optimize the generated equality code for sealed records, since the type-comparison branch becomes provably redundant when no subtype could ever exist.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The source-level records from the main page\'s own example',
      language: 'csharp',
      code: `public record Animal(string Name);
public record Dog(string Name, string Breed) : Animal(Name);

var animal = new Animal("Rex");
var dog    = new Dog("Rex", "Labrador");

// From the main page: this is False, even with matching Name:
Console.WriteLine(animal == dog);   // False`,
    },
    {
      label: 'What the compiler ACTUALLY generates (decompiled, simplified for clarity)',
      language: 'csharp',
      code: `public record Animal
{
    public string Name { get; init; }

    public Animal(string Name) { this.Name = Name; }

    // The KEY generated member the main page refers to:
    protected virtual Type EqualityContract => typeof(Animal);

    public virtual bool Equals(Animal? other) =>
        other is not null
        && EqualityContract == other.EqualityContract   // <-- CHECKED FIRST
        && Name == other.Name;

    public override bool Equals(object? obj) => Equals(obj as Animal);

    public override int GetHashCode() =>
        HashCode.Combine(EqualityContract, Name);

    public static bool operator ==(Animal? left, Animal? right) =>
        left is null ? right is null : left.Equals(right);
}

public record Dog : Animal
{
    public string Breed { get; init; }

    public Dog(string Name, string Breed) : base(Name) { this.Breed = Breed; }

    // Dog's OWN override — returns typeof(Dog), not typeof(Animal):
    protected override Type EqualityContract => typeof(Dog);

    // Dog's Equals ALSO checks EqualityContract first, via the base
    // call chain, then adds its OWN Breed comparison:
    public virtual bool Equals(Dog? other) =>
        base.Equals((Animal?)other)   // includes the EqualityContract
                                       // check + Name comparison
        && other is not null
        && Breed == other.Breed;

    public override bool Equals(object? obj) => Equals(obj as Dog);

    public override int GetHashCode() =>
        HashCode.Combine(base.GetHashCode(), Breed);
}`,
    },
    {
      label: 'Tracing exactly why animal == dog is false — step by step',
      language: 'csharp',
      code: `var animal = new Animal("Rex");
var dog    = new Dog("Rex", "Labrador");

// animal == dog compiles to Animal's operator==, which calls
// animal.Equals(dog) — dog is implicitly usable as an Animal reference
// (Dog derives from Animal), so this resolves to Animal.Equals(Animal? other):

// Inside Animal.Equals(Animal? other):
//   other is not null                        → true (dog is not null)
//   EqualityContract == other.EqualityContract
//     "EqualityContract" here means "animal.EqualityContract" → typeof(Animal)
//     "other.EqualityContract" means "dog.EqualityContract"
//       — VIRTUAL DISPATCH: even though "other" is typed as Animal? in
//         this method signature, the ACTUAL runtime object is a Dog,
//         so the virtual call resolves to Dog's OVERRIDE → typeof(Dog)
//     typeof(Animal) == typeof(Dog)  → FALSE
//
// The && short-circuits HERE — "Name == other.Name" is NEVER EVALUATED
// AT ALL. The method returns false purely because the two objects'
// EqualityContract values differ, regardless of what Name holds on
// either side.

Console.WriteLine(animal == dog);   // False — confirmed, and now you
                                     // know EXACTLY which line of
                                     // generated code produces it`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Two records, <code>Dog</code> and <code>Cat</code>, BOTH derive from the SAME base <code>Animal(string Name)</code> record, and both happen to have a Name of "Rex". Using the generated-code model from this subtopic, explain precisely why <code>((Animal)dog) == ((Animal)cat)</code> is false, and identify which specific generated code line makes that determination.',
    hint: 'Both dog and cat are being compared THROUGH an Animal-typed reference in this expression — but virtual dispatch on EqualityContract still resolves to each object\'s ACTUAL runtime type, not the compile-time reference type used in the comparison expression.',
    solution: `public record Animal(string Name);
public record Dog(string Name, string Breed) : Animal(Name);
public record Cat(string Name, bool IsIndoor) : Animal(Name);

var dog = new Dog("Rex", "Labrador");
var cat = new Cat("Rex", true);

// Both cast to Animal for the comparison:
bool result = ((Animal)dog) == ((Animal)cat);

// TRACING THROUGH THE GENERATED CODE:
// The cast "(Animal)dog" does NOT change the OBJECT'S actual runtime
// type — it only changes the COMPILE-TIME reference type used for
// method/operator resolution. The underlying object is STILL a real
// Dog instance at runtime; the cast is purely a compiler-level view.
//
// "==" resolves to Animal's operator==, which calls
// "((Animal)dog).Equals((Animal)cat)" — this invokes
// Animal.Equals(Animal? other), where "this" is the Dog instance
// (viewed as Animal) and "other" is the Cat instance (also viewed
// as Animal).
//
// Inside Animal.Equals(Animal? other):
//   other is not null                          → true
//   EqualityContract == other.EqualityContract
//     "EqualityContract" (on "this", the Dog instance, even though
//     referenced via an Animal-typed variable) — VIRTUAL DISPATCH
//     resolves to Dog's override → typeof(Dog)
//     "other.EqualityContract" (on the Cat instance, also referenced
//     via Animal-typed) — VIRTUAL DISPATCH resolves to Cat's own
//     override → typeof(Cat)
//     typeof(Dog) == typeof(Cat)   → FALSE
//
// The && short-circuits at THIS exact line — Name is never compared,
// Breed and IsIndoor (which do not even exist on the OTHER type) are
// never touched either. The result is False, determined ENTIRELY by
// the EqualityContract mismatch, regardless of the fact that both
// objects happen to share Name == "Rex" and were both compared through
// an identical Animal-typed compile-time view. This is precisely why
// casting to a common base type does NOT make two genuinely
// different-runtime-type records compare equal — EqualityContract's
// virtual dispatch always "sees through" the cast to each object's
// real, underlying type.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'record equality checks all the declared properties first, and only considers the runtime type if the properties happen to match.',
      reality: 'the generated Equals method checks EqualityContract (the runtime type) FIRST — if it differs, the method short-circuits and returns false immediately, without ever comparing any property values at all.',
    },
    {
      thought: 'casting two record instances to a common base type before comparing them with == makes the comparison ignore their actual runtime types.',
      reality: 'EqualityContract is a virtual property — casting only changes the compile-time reference type used for method resolution, but virtual dispatch still resolves EqualityContract to each object\'s real runtime type, so the type-sensitivity survives the cast.',
    },
    {
      thought: 'sealing a record has no effect on how its equality comparison actually executes at runtime, beyond preventing future inheritance.',
      reality: 'because a sealed record can never have a derived type, the compiler can (and does) optimize its generated equality code, since the EqualityContract comparison becomes provably always-true between any two instances of the same sealed type.',
    },
  ];
}
