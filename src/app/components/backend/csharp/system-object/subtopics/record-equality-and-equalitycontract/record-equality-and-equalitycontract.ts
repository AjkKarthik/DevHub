import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-record-equality-and-equalitycontract-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './record-equality-and-equalitycontract.html',
  styleUrl: './record-equality-and-equalitycontract.scss',
})
export class RecordEqualityAndEqualityContractSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page mentions record auto-equality — never the inheritance edge case',
      points: [
        'The main System.Object page states records "auto-generate all equality members from their constructor parameters." True, but incomplete — it never addresses what happens with a record INHERITANCE hierarchy: does a base record and a derived record with IDENTICAL field values compare equal? The answer is NO, and the mechanism behind that is worth understanding directly.',
      ],
    },
    {
      heading: 'The problem this solves — naive field-only equality would be WRONG here',
      points: [
        'If record equality genuinely only compared constructor-parameter FIELD VALUES (as the main page\'s wording alone might suggest), then <code>new Animal("Rex")</code> and <code>new Dog("Rex")</code> (where <code>Dog</code> inherits from <code>Animal</code> and adds no new fields) would compare EQUAL, since their only field (<code>Name</code>) matches — this would be a genuine correctness bug: a caller holding an <code>Animal</code>-typed reference could never distinguish "this is actually a Dog" from "this is actually an Animal" via equality alone, silently violating the intuitive expectation that objects of different RUNTIME TYPES should not compare equal.',
      ],
    },
    {
      heading: 'The actual mechanism — a hidden, compiler-generated EqualityContract property',
      points: [
        'Every record the compiler generates includes a HIDDEN, PROTECTED, VIRTUAL property named <code>EqualityContract</code> (of type <code>Type</code>) that returns the record\'s OWN most-derived runtime type. The compiler-generated <code>Equals</code> method checks THIS property FIRST, before comparing any field — two records are only considered for further (field-by-field) comparison if their <code>EqualityContract</code> values MATCH, i.e. they are genuinely the SAME most-derived type.',
        'This is exactly why <code>new Animal("Rex").Equals(new Dog("Rex"))</code> is <code>false</code> — <code>Animal</code>\'s <code>EqualityContract</code> returns <code>typeof(Animal)</code>, <code>Dog</code>\'s returns <code>typeof(Dog)</code>, these do not match, and the compiler-generated <code>Equals</code> short-circuits to <code>false</code> BEFORE it would ever compare the (identical) <code>Name</code> field values.',
      ],
    },
    {
      heading: 'Why EqualityContract is virtual — and what happens when you write your own derived record',
      points: [
        'Because <code>EqualityContract</code> is <code>virtual</code>, each derived record type AUTOMATICALLY overrides it to return ITS OWN type — you never write this override yourself; the compiler generates it silently for every record you declare, base or derived.',
        'This means the "same type" check is genuinely based on the ACTUAL RUNTIME TYPE, exactly mirroring how <code>GetType()</code> (from the main page\'s own theory) reflects the true runtime type rather than a declared/static one — record equality is deliberately built to respect the SAME "exact type, not just compatible fields" intuition the main page\'s own <code>GetType() == typeof(T)</code> discussion establishes for ordinary classes.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The surprising behavior — identical fields, different types, NOT equal',
      language: 'csharp',
      code: `public record Animal(string Name);
public record Dog(string Name) : Animal(Name); // adds no new fields

var animal = new Animal("Rex");
var dog = new Dog("Rex");

// Despite having the EXACT SAME Name value, these are NOT equal:
Console.WriteLine(animal.Equals(dog)); // False
Console.WriteLine(animal == dog);       // False (compiler warns:
                                          // comparing different record types)

// If record equality were PURELY field-based (as a naive reading of
// "auto-generates equality from constructor parameters" might suggest),
// this would incorrectly be True — Dog adds no new fields at all, so a
// naive field comparison would find them identical.`,
    },
    {
      label: 'The mechanism — a hidden EqualityContract property, checked FIRST',
      language: 'csharp',
      code: `// CONCEPTUAL representation of what the compiler actually generates
// for "public record Animal(string Name);" — not something you write
// yourself, but genuinely present in the compiled type:
public class Animal : IEquatable<Animal>
{
    public string Name { get; init; }
    public Animal(string name) => Name = name;

    // Hidden, protected, VIRTUAL — every record gets one:
    protected virtual Type EqualityContract => typeof(Animal);

    public virtual bool Equals(Animal? other) =>
        other is not null
        && EqualityContract == other.EqualityContract // CHECKED FIRST
        && Name == other.Name;                          // only reached if
                                                          // the types genuinely match
}

// And for "public record Dog(string Name) : Animal(Name);" — Dog
// automatically OVERRIDES EqualityContract to return its OWN type:
public class Dog : Animal, IEquatable<Dog>
{
    public Dog(string name) : base(name) { }

    protected override Type EqualityContract => typeof(Dog); // overridden!

    public virtual bool Equals(Dog? other) =>
        other is not null
        && EqualityContract == other.EqualityContract
        && Name == other.Name;
}

// animal.Equals(dog) calls Animal's Equals(Animal? other) overload —
// EqualityContract comparison: typeof(Animal) vs typeof(Dog) (since dog's
// OVERRIDDEN EqualityContract returns Dog's type) — these DON'T match,
// so the method returns false immediately, WITHOUT ever comparing Name.`,
    },
    {
      label: 'Confirming records of the SAME type still compare correctly',
      language: 'csharp',
      code: `public record Animal(string Name);
public record Dog(string Name) : Animal(Name);

// Two Dogs with the same Name — SAME most-derived type, DOES compare equal:
var dog1 = new Dog("Rex");
var dog2 = new Dog("Rex");
Console.WriteLine(dog1.Equals(dog2)); // True — EqualityContract matches
                                        // (both typeof(Dog)), Name matches too

// Two Animals with the same Name — also equal, same reasoning:
var animal1 = new Animal("Generic");
var animal2 = new Animal("Generic");
Console.WriteLine(animal1.Equals(animal2)); // True

// This confirms EqualityContract is not "always different" — it
// correctly distinguishes DIFFERENT types while still allowing SAME-type
// instances with matching fields to compare equal, exactly the behavior
// the main topic's own GetType()-based reasoning would predict, applied
// specifically to the record-generated Equals implementation.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Given <code>record Cat(string Name) : Animal(Name);</code> (a SIBLING of Dog, both deriving from Animal), would <code>new Dog("Rex").Equals(new Cat("Rex"))</code> return true or false? Explain using the EqualityContract mechanism.',
    hint: 'Trace through the mechanism exactly as shown in the code examples: each record type (Animal, Dog, Cat) gets its OWN overridden EqualityContract returning its OWN specific type. Compare what EqualityContract returns for a Dog instance versus a Cat instance, independent of whether they share a common ancestor.',
    solution: `public record Animal(string Name);
public record Dog(string Name) : Animal(Name);
public record Cat(string Name) : Animal(Name); // sibling of Dog

var dog = new Dog("Rex");
var cat = new Cat("Rex");

Console.WriteLine(dog.Equals(cat)); // False

// Dog's EqualityContract returns typeof(Dog).
// Cat's EqualityContract returns typeof(Cat).
// typeof(Dog) != typeof(Cat) — the EqualityContract check fails
// immediately, regardless of whether Dog and Cat share a common
// ancestor (Animal) or have identical Name values ("Rex" in both cases).

// The comparison is ALWAYS based on the EXACT, most-derived runtime
// type of EACH instance being compared — sharing a common base record
// is irrelevant to this check. Only two instances of the EXACT SAME
// most-derived record type can ever compare equal, no matter how
// closely related their types are in the inheritance hierarchy
// otherwise. This is deliberately the same strictness as an ordinary
// class's typeof(T) exact-type check from the main topic's own theory
// — applied automatically, by the compiler, to every record type.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'record equality compares ONLY the constructor-parameter field values, exactly as the phrase "auto-generates equality from constructor parameters" literally implies.',
      reality: 'every record also has a hidden, compiler-generated, virtual EqualityContract property returning its own most-derived type — the generated Equals method checks THIS first, and two records of genuinely different runtime types are never considered equal regardless of matching field values.',
    },
    {
      thought: 'a base record and a derived record that adds no new fields will compare equal if their inherited field values match, since there is nothing structurally different between them to compare.',
      reality: 'the EqualityContract check is based on the ACTUAL RUNTIME TYPE, not the structural field layout — a base Animal("Rex") and a derived Dog("Rex") with identical fields are never equal, because their EqualityContract values (typeof(Animal) vs typeof(Dog)) genuinely differ.',
    },
    {
      thought: 'two sibling record types that both derive from the same base record (like Dog and Cat both deriving from Animal) might compare equal to each other if they happen to share the same field values, since they are "related" through the common ancestor.',
      reality: 'EqualityContract is unique per most-derived TYPE, not per inheritance branch — Dog\'s EqualityContract and Cat\'s EqualityContract are different regardless of their shared ancestor, so sibling record types with matching field values are never equal to each other.',
    },
  ];
}
