import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-positional-pattern-matching-with-records-deconstruction-in-switch-expressions-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './positional-pattern-matching-with-records-deconstruction-in-switch-expressions.html',
  styleUrl: './positional-pattern-matching-with-records-deconstruction-in-switch-expressions.scss',
})
export class PositionalPatternMatchingWithRecordsDeconstructionInSwitchExpressionsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A one-line fix in the main topic, never fully explained',
      points: [
        'The main OOP-adjacent Common Mistakes section uses <code>d is Animal &#123; Name: "Rex" &#125;</code> to work around the EqualityContract surprise — a PROPERTY pattern — but never explains the FULL family of record pattern-matching syntax this belongs to, or the more powerful POSITIONAL pattern (<code>is Point(0, 0)</code>) that leverages a record\'s auto-generated <code>Deconstruct</code> method directly.',
      ],
    },
    {
      heading: 'Positional patterns — matching directly against Deconstruct',
      points: [
        'Because every positional record auto-generates a <code>Deconstruct</code> method (the main topic\'s own Record Basics tab demonstrates <code>var (first, last, age) = alice;</code>), that SAME <code>Deconstruct</code> can be matched against directly in an <code>is</code> or <code>switch</code> pattern: <code>if (point is (0, 0)) Console.WriteLine("Origin");</code> — no property names needed, just positional values matched in declaration order.',
        'Combine positional matching with variable capture: <code>if (point is (var x, 0)) Console.WriteLine($"On the x-axis at &#123;x&#125;");</code> — capturing <code>X</code> into a new variable <code>x</code> while requiring <code>Y</code> to be exactly <code>0</code>. This works because pattern matching treats each positional slot independently — some slots can be literal-value constraints, others can be capturing bindings.',
      ],
    },
    {
      heading: 'Property patterns and combining with positional patterns',
      points: [
        'Property patterns match named properties regardless of whether the type is positional: <code>Animal &#123; Name: "Rex" &#125;</code> (from the main topic) checks the <code>Name</code> PROPERTY specifically, works on ANY record (or even a plain class) with a <code>Name</code> property, and is unaffected by whether the type happens to be declared with positional syntax.',
        'Positional and property patterns COMBINE in a single expression: <code>is Dog("Rex", Breed: "Husky")</code> matches positionally on <code>Name</code> ("Rex") while ALSO checking the <code>Breed</code> property by name — mixing both styles in one pattern when you want to be positionally concise for some fields and explicit for others.',
        'Nested record patterns recurse naturally: for <code>record Order(int Id, Address ShipTo)</code>, <code>order is (_, (City: "London"))</code> matches any order shipping to London regardless of <code>Id</code>, drilling into the nested <code>Address</code> record\'s own positional/property shape in the same expression.',
      ],
    },
    {
      heading: 'Switch expressions over record hierarchies — genuinely replacing the EqualityContract workaround',
      points: [
        'A <code>switch</code> expression combining TYPE patterns with positional/property patterns is the idiomatic way to branch over a record hierarchy like the main topic\'s <code>Animal</code>/<code>Dog</code>: <code>animal switch &#123; Dog(_, "Husky") =&gt; "A husky!", Dog d =&gt; $"A &#123;d.Breed&#125;", Animal a =&gt; $"Just &#123;a.Name&#125;" &#125;</code> — this reads the ACTUAL runtime type (unlike <code>==</code>, which the main topic shows is blocked by EqualityContract) and lets you match on both TYPE and VALUE simultaneously.',
        'This is the more general, more idiomatic solution to the exact problem the main topic\'s Common Mistakes section patches with a single property-pattern example — pattern matching (not equality operators) is the intended tool for branching logic over a record hierarchy\'s different shapes, and it composes far more expressively than a chain of property-pattern <code>if</code> statements.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Positional patterns — matching Deconstruct directly',
      language: 'csharp',
      code: `public record Point(int X, int Y);

Point origin = new(0, 0);
Point onAxis = new(5, 0);
Point general = new(3, 4);

// Positional pattern — matches against the auto-generated Deconstruct
Console.WriteLine(origin is (0, 0));   // True
Console.WriteLine(general is (0, 0)); // False

// Capture a value while constraining another position
if (onAxis is (var x, 0))
    Console.WriteLine($"On the x-axis at {x}"); // "On the x-axis at 5"

// Use inside a switch expression for classification
string Classify(Point p) => p switch
{
    (0, 0)          => "Origin",
    (var x, 0)      => $"On x-axis at {x}",
    (0, var y)      => $"On y-axis at {y}",
    (var x, var y) when x == y => "On the diagonal",
    _               => "General point",
};

Console.WriteLine(Classify(origin));  // "Origin"
Console.WriteLine(Classify(onAxis));  // "On x-axis at 5"
Console.WriteLine(Classify(new Point(3, 3))); // "On the diagonal"`,
    },
    {
      label: 'Combining positional and property patterns',
      language: 'csharp',
      code: `public record Animal(string Name);
public record Dog(string Name, string Breed) : Animal(Name);

Dog rex = new("Rex", "Husky");

// Positional pattern on a two-property positional record
Console.WriteLine(rex is Dog("Rex", "Husky"));         // True — both positions match

// Mix positional (Name) with property-by-name (Breed) in one pattern
Console.WriteLine(rex is Dog("Rex", Breed: "Husky"));  // Same result, explicit style

// Property pattern alone — the main topic's EqualityContract workaround
Console.WriteLine(rex is Animal { Name: "Rex" });      // True — property-only match

// Nested record pattern — drilling into a related record
public record Address(string City, string Country);
public record Order(int Id, Address ShipTo);

Order order = new(1, new Address("London", "UK"));

// Positional at the outer level, property pattern nested inside
Console.WriteLine(order is (_, { City: "London" })); // True — Id ignored via discard`,
    },
    {
      label: 'Switch expressions over a record hierarchy',
      language: 'csharp',
      code: `public record Animal(string Name);
public record Dog(string Name, string Breed) : Animal(Name);
public record Cat(string Name, bool IsIndoor) : Animal(Name);

// The idiomatic replacement for the main topic's "== is blocked by
// EqualityContract" surprise — pattern matching on TYPE + VALUE together.
string Describe(Animal animal) => animal switch
{
    Dog(_, "Husky")            => "A husky — probably loves the cold",
    Dog d                      => $"A {d.Breed} dog named {d.Name}",
    Cat { IsIndoor: true }     => $"An indoor cat named {animal.Name}",
    Cat c                      => $"An outdoor cat named {c.Name}",
    Animal a                   => $"Just an animal named {a.Name}",
};

Console.WriteLine(Describe(new Dog("Rex", "Husky")));      // "A husky — probably loves the cold"
Console.WriteLine(Describe(new Dog("Max", "Labrador")));   // "A Labrador dog named Max"
Console.WriteLine(Describe(new Cat("Whiskers", true)));    // "An indoor cat named Whiskers"
Console.WriteLine(Describe(new Animal("Generic"))); // "Just an animal named Generic"

// Contrast with the main topic's blocked equality:
Animal a2 = new Dog("Rex", "Husky");
// if (a2 == new Animal("Rex")) ... // never true — EqualityContract blocks it
// Pattern matching sidesteps this entirely by checking type + values directly.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Write a switch expression <code>string Quadrant(Point p)</code> that classifies a <code>Point</code> into <code>"Origin"</code>, <code>"Quadrant I"</code> (x&gt;0, y&gt;0), <code>"Quadrant II"</code> (x&lt;0, y&gt;0), <code>"Quadrant III"</code> (x&lt;0, y&lt;0), <code>"Quadrant IV"</code> (x&gt;0, y&lt;0), or <code>"On an axis"</code> — using positional pattern matching with relational sub-patterns, not if/else.',
    hint: 'Use positional patterns with relational patterns in each slot: (0, 0) => "Origin", (> 0, > 0) => "Quadrant I", (< 0, > 0) => "Quadrant II", (< 0, < 0) => "Quadrant III", (> 0, < 0) => "Quadrant IV", and a final _ => "On an axis" catch-all for anything with a zero coordinate that wasn\'t the origin.',
    solution: `public record Point(int X, int Y);

string Quadrant(Point p) => p switch
{
    (0, 0)      => "Origin",
    (> 0, > 0)  => "Quadrant I",
    (< 0, > 0)  => "Quadrant II",
    (< 0, < 0)  => "Quadrant III",
    (> 0, < 0)  => "Quadrant IV",
    _           => "On an axis",
};

Console.WriteLine(Quadrant(new Point(0, 0)));   // "Origin"
Console.WriteLine(Quadrant(new Point(3, 4)));   // "Quadrant I"
Console.WriteLine(Quadrant(new Point(-3, 4)));  // "Quadrant II"
Console.WriteLine(Quadrant(new Point(-3, -4))); // "Quadrant III"
Console.WriteLine(Quadrant(new Point(3, -4)));  // "Quadrant IV"
Console.WriteLine(Quadrant(new Point(5, 0)));   // "On an axis"`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the property pattern shown in the main topic\'s EqualityContract workaround (<code>d is Animal &#123; Name: "Rex" &#125;</code>) is the only pattern-matching syntax available for records.',
      reality: 'positional patterns (matching directly against a record\'s auto-generated Deconstruct, e.g. is (0, 0)) are a separate, equally powerful syntax that can be combined WITH property patterns in the same expression — is Dog("Rex", Breed: "Husky") mixes both styles.',
    },
    {
      thought: 'to branch logic differently based on a record\'s concrete type in a hierarchy (Animal vs Dog vs Cat), you need a chain of if/is-type checks.',
      reality: 'a single switch expression combining type patterns with positional/property patterns handles this idiomatically and more concisely — animal switch { Dog(_, "Husky") => ..., Cat { IsIndoor: true } => ..., Animal a => ... } matches on type AND value together in one place.',
    },
    {
      thought: 'the <code>==</code> operator being blocked between base and derived records (EqualityContract) means there is no good way to compare or branch on record hierarchy data at all.',
      reality: 'pattern matching (is, switch) is the intended tool for exactly this — it checks runtime type and property/positional values directly, sidestepping EqualityContract entirely rather than fighting against it.',
    },
  ];
}
