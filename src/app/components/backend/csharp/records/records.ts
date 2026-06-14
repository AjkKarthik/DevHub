import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';

@Component({
  selector: 'app-csharp-records',
  standalone: true,
  imports: [
    CommonModule, CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
    CommonMistakesComponent, RevisionCardComponent,
  ],
  templateUrl: './records.html',
  styleUrl: './records.scss',
})
export class CsharpRecords {

  quickRef: QuickRefItem[] = [
    { name: 'record',            type: 'keyword', desc: 'Immutable reference type with value-based equality, with-expression, Deconstruct, and ToString auto-generated.', since: 'C# 9' },
    { name: 'record struct',     type: 'keyword', desc: 'Immutable value-type record — stack-allocated, copied on assignment, no null, no inheritance.', since: 'C# 10' },
    { name: 'readonly record struct', type: 'keyword', desc: 'All properties are readonly — prevents accidental mutation even inside the struct body.', since: 'C# 10' },
    { name: 'init',              type: 'keyword', desc: 'Property accessor settable only during construction or object initialiser — read-only thereafter.', since: 'C# 9' },
    { name: 'with',              type: 'syntax',  desc: 'Non-destructive mutation: creates a shallow copy with specified properties changed. Original is untouched.', since: 'C# 9' },
    { name: 'required',          type: 'keyword', desc: 'Forces callers to supply a property via object initialiser. Compile error if omitted.', since: 'C# 11' },
    { name: 'Deconstruct',       type: 'syntax',  desc: 'Auto-generated on positional records. Enables (var a, var b) = myRecord; syntax.', since: 'C# 9' },
    { name: 'EqualityContract',  type: 'class',   desc: 'Protected virtual property auto-generated on record classes. Ensures derived records are never equal to base records.', since: 'C# 9' },
    { name: 'Positional syntax', type: 'syntax',  desc: 'record Point(int X, int Y); — primary constructor params become init-only properties automatically.', since: 'C# 9' },
    { name: 'Compact constructor', type: 'syntax', desc: 'Validation block without repeating parameter list: public Point { if (X < 0) throw ...; }', since: 'C# 9' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Records are immutable by default',
      points: [
        'Positional properties declared in the primary constructor are <code>init</code>-only — they can only be set at construction time or in an object initialiser.',
        'Equality is value-based: two record instances with the same property values are equal (<code>==</code> returns <code>true</code>). The compiler auto-generates <code>Equals</code> and <code>GetHashCode</code> over all properties.',
        'The compiler also generates <code>ToString</code> in the format <code>TypeName { Prop = value, ... }</code>, <code>Deconstruct</code> matching the primary constructor, and a copy constructor used by <code>with</code>.',
        'Immutability makes records safe to share across threads — no hidden mutation means no race conditions on the record\'s own properties.',
        'Records are full types: they can have methods, computed properties, implement interfaces, and be nested — the difference from a class is only in what the compiler generates for you.',
      ],
    },
    {
      heading: 'with expressions — non-destructive mutation',
      points: [
        '<code>with</code> creates a <strong>shallow copy</strong> of a record with one or more properties overridden: <code>var b = a with { Age = 31 };</code>. The original is completely untouched.',
        'Under the hood, <code>with</code> calls the compiler-generated copy constructor and then sets the specified properties via their init accessors.',
        '<code>with</code> expressions work on both <code>record class</code> and <code>record struct</code>. They can be chained and composed for functional-style pipelines.',
        'For nested records, you must <code>with</code> the nested record separately: <code>outer with { Inner = outer.Inner with { Prop = value } }</code> — there is no deep-copy shorthand.',
        '<code>with</code> is a shallow copy — if a property holds a mutable reference (e.g. a <code>List&lt;T&gt;</code>), both the original and the copy share the same list object.',
      ],
    },
    {
      heading: 'record struct vs record class',
      points: [
        '<code>record class</code> (or just <code>record</code>) is a reference type: heap-allocated, passed by reference, can be null, supports inheritance from other records.',
        '<code>record struct</code> is a value type: stack/inline-allocated, fully copied on assignment, cannot be null, sealed (no inheritance).',
        'Use <code>record struct</code> for small, short-lived, frequently copied value objects (e.g. <code>Point</code>, <code>Color</code>, <code>Money</code>) to avoid heap pressure.',
        '<code>readonly record struct</code> (C# 10) makes all properties <code>readonly</code> at the struct level — preferred over plain <code>record struct</code> to prevent accidental mutation inside methods.',
        'Choosing between them: if it can be null, if it needs to be stored in a class hierarchy, or if it is larger than ~16 bytes, use <code>record class</code>.',
      ],
    },
    {
      heading: 'When to use records',
      points: [
        '<strong>DTOs</strong> — Data Transfer Objects travelling between layers or over the wire benefit from value equality and immutability, making them safe to compare and cache.',
        '<strong>Domain value objects</strong> — <code>Money</code>, <code>Address</code>, <code>DateRange</code> are naturally identified by their values, not their identity.',
        '<strong>API response/request models</strong> — deserialized JSON objects that should not be modified after creation. Works naturally with <code>System.Text.Json</code>.',
        '<strong>Event sourcing payloads</strong> — immutable event records (<code>OrderPlaced</code>, <code>UserRegistered</code>) are perfect records: created once, never changed, replayed from a log.',
        'Avoid records for <strong>entities</strong> with identity (two customers named "Alice" are different entities — use <code>class</code>); also avoid for large objects where copying is expensive.',
      ],
    },
    {
      heading: 'Record inheritance and EqualityContract',
      points: [
        'Record classes can inherit from other record classes: <code>record Employee(string Name, string Dept) : Person(Name);</code>. Record structs cannot be inherited.',
        'The compiler generates a protected virtual <code>EqualityContract</code> property returning <code>typeof(T)</code> for each record type. Equality checks include the EqualityContract — so a <code>Person</code> instance is <strong>never equal</strong> to an <code>Employee</code> instance even if their shared properties match.',
        'All properties from both the base and derived record participate in equality and <code>ToString</code>. Overriding a property in a derived record is not directly supported — use a new property or a different name.',
        'A derived record inherits <code>with</code>: <code>emp with { Dept = "Engineering" }</code> returns a new <code>Employee</code>. The result type is the concrete type, not the base.',
        'Seal a record class with <code>sealed record</code> when you do not want further derivation — this also allows the compiler to optimise equality without virtual dispatch.',
      ],
    },
    {
      heading: 'Compact constructors and validation',
      points: [
        'A <em>compact constructor</em> (or <em>primary constructor body</em>) adds validation logic without re-declaring the parameter list: <code>public Point { if (X < 0) throw ...; }</code>.',
        'The compact constructor body runs <em>after</em> the positional properties are assigned — so you can validate them directly by name.',
        'Use <code>ArgumentOutOfRangeException.ThrowIfNegative</code>, <code>ArgumentException.ThrowIfNullOrEmpty</code>, etc. for clean, one-liner guards.',
        '<code>required</code> properties (C# 11) enforce that callers supply a value via object initialiser — the compiler catches omissions at call sites, not at runtime.',
        'Combine <code>required</code> with <code>init</code> for the "must supply, then immutable" pattern: the field must be set during construction and cannot be changed afterwards.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Record Basics',
      language: 'csharp',
      code: `// ── Positional record — compiler generates everything ──────────────────
public record Person(string FirstName, string LastName, int Age);

var alice  = new Person("Alice", "Smith", 30);
var alice2 = new Person("Alice", "Smith", 30);

Console.WriteLine(alice == alice2);   // True  — value equality
Console.WriteLine(alice);             // Person { FirstName = Alice, LastName = Smith, Age = 30 }

// Auto-generated Deconstruct
var (first, last, age) = alice;
Console.WriteLine($"{first} is {age}");  // Alice is 30

// ── Record with validation — compact constructor ────────────────────────
public record Product(string Name, decimal Price)
{
    // Compact constructor: runs AFTER properties are set — validate here
    public Product
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(Name, nameof(Name));
        ArgumentOutOfRangeException.ThrowIfNegative(Price, nameof(Price));
    }

    // Computed property — allowed in records
    public string Label => $"{Name} ({Price:C})";

    // Method returning a new record via with
    public Product WithDiscount(decimal pct) =>
        this with { Price = Price * (1 - pct / 100) };
}

var p = new Product("Widget", 9.99m);
Console.WriteLine(p.Label);              // Widget (£9.99)
Console.WriteLine(p.WithDiscount(10).Label);  // Widget (£8.99)
// new Product("", 5m)  ← throws ArgumentException`,
    },
    {
      label: 'with Expressions',
      language: 'csharp',
      code: `public record Address(string Street, string City, string Country);
public record Order(int Id, string Customer, Address ShipTo, decimal Total);

var addr  = new Address("10 High St", "London", "UK");
var order = new Order(1, "Alice", addr, 149.99m);

// ── Basic with expression ───────────────────────────────────────────────
var updated = order with { Total = 199.99m };
Console.WriteLine(order.Total);    // 149.99 — original unchanged
Console.WriteLine(updated.Total);  // 199.99

// ── Nested with — replace the whole nested record ─────────────────────
var relocated = order with
{
    ShipTo = order.ShipTo with { City = "Manchester" }
};
Console.WriteLine(relocated.ShipTo.City); // Manchester
Console.WriteLine(order.ShipTo.City);     // London — untouched

// ── with is SHALLOW copy — mutable references are shared ─────────────
public record Basket(List<string> Items);

var b1 = new Basket(["Apple", "Banana"]);
var b2 = b1 with { };   // copies the reference to the same List!
b2.Items.Add("Cherry"); // mutates the SHARED list

Console.WriteLine(b1.Items.Count); // 3 — b1 is also affected!
// Fix: clone the inner collection
var b3 = b1 with { Items = [..b1.Items] };  // spread creates a new List

// ── Functional pipeline using with ────────────────────────────────────
Order ApplyVat(Order o)    => o with { Total = o.Total * 1.2m };
Order AddShipping(Order o) => o with { Total = o.Total + 5.99m };

var final = AddShipping(ApplyVat(order));
Console.WriteLine(final.Total);  // (149.99 × 1.2) + 5.99 = 185.98`,
    },
    {
      label: 'Record vs Class vs Struct',
      language: 'csharp',
      code: `// ── Reference equality (class) ────────────────────────────────────────
public class PointClass { public int X; public int Y; }

var c1 = new PointClass { X = 1, Y = 2 };
var c2 = new PointClass { X = 1, Y = 2 };
Console.WriteLine(c1 == c2);  // False — different object references

// ── Value equality (record class) ─────────────────────────────────────
public record PointRecord(int X, int Y);

var r1 = new PointRecord(1, 2);
var r2 = new PointRecord(1, 2);
Console.WriteLine(r1 == r2);  // True — same property values

// ── Value type (record struct) ─────────────────────────────────────────
public readonly record struct PointStruct(int X, int Y);  // readonly = preferred

var s1 = new PointStruct(1, 2);
var s2 = s1;           // full copy — not a shared reference
s2 = s2 with { X = 99 };
Console.WriteLine(s1.X);  // 1 — original unchanged (value semantics)
Console.WriteLine(s2.X);  // 99

// ── Record inheritance — EqualityContract ─────────────────────────────
public record Animal(string Name);
public record Dog(string Name, string Breed) : Animal(Name);

var a = new Animal("Rex");
var d = new Dog("Rex", "Husky");

Console.WriteLine(a == d);  // False — different EqualityContract types
// Even though Name matches, Animal and Dog are never considered equal

// ── Memory layout quick reference ─────────────────────────────────────
// class            → heap, GC, reference semantics, nullable
// record class     → heap, GC, value equality, nullable
// record struct    → stack/inline, copy semantics, value equality, not nullable
// struct           → stack/inline, mutable by default, avoid unless perf-critical`,
    },
    {
      label: 'Init-only & Required Properties',
      language: 'csharp',
      code: `// ── init accessor — set once at construction ──────────────────────────
public class Config
{
    public string Host   { get; init; } = "localhost";
    public int    Port   { get; init; } = 5432;
    public bool   UseSsl { get; init; }
}

var cfg = new Config { Host = "db.prod.com", Port = 5433, UseSsl = true };
// cfg.Host = "other";   // compile error — init-only after construction

// ── required init — caller MUST set the property (C# 11) ───────────────
public class UserDto
{
    public required string Username { get; init; }
    public required string Email    { get; init; }
    public string? Bio              { get; init; }   // optional
}

var user = new UserDto
{
    Username = "alice",
    Email    = "alice@example.com",
    // Bio optional — omitting it is fine
};
// var bad = new UserDto();  // compile error — Username and Email required

// ── init in records (positional = automatically init) ─────────────────
public record Invoice(int Number, decimal Amount)
{
    // Non-positional init property — still settable at construction
    public string? Notes { get; init; }
}

var inv = new Invoice(42, 299.99m) { Notes = "Rush order" };
// inv.Notes = "changed";  // compile error

// ── Combining required + init for "must-supply-then-immutable" ────────
public record CustomerProfile
{
    public required string Id       { get; init; }
    public required string FullName { get; init; }
    public string? PhoneNumber      { get; init; }
}

var profile = new CustomerProfile { Id = "C001", FullName = "Alice Smith" };`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'with is a shallow copy — mutable nested objects are still shared',
      wrong: `public record Basket(List<string> Items);

var original = new Basket(["Apple", "Banana"]);
var copy = original with { };  // "copy" of the record

copy.Items.Add("Cherry");      // mutates the SHARED List<string>!

Console.WriteLine(original.Items.Count); // 3 — original also changed!`,
      right: `// Clone the inner collection when copying
var copy = original with { Items = [..original.Items] };  // spread = new list
// OR: new List<string>(original.Items)

copy.Items.Add("Cherry");
Console.WriteLine(original.Items.Count); // 2 — original unchanged`,
      explanation: 'with creates a shallow copy — it copies the record\'s field values, but reference-type fields (like List<T>, arrays, other classes) still point to the same objects. If you need a fully isolated copy, you must clone any mutable reference-type properties manually.',
    },
    {
      title: 'Using records for entities with identity — wrong equality semantics',
      wrong: `// Two customers with the same name are different people in the real world
public record Customer(string Name, string Email);

var c1 = new Customer("Alice", "alice@a.com");
var c2 = new Customer("Alice", "alice@a.com");  // different person, same data

Console.WriteLine(c1 == c2);  // True — but they should be different customers!
// Deduplication logic, Sets, and Dictionaries will merge them accidentally`,
      right: `// Use a class with an Id for entities — identity matters
public class Customer
{
    public Guid   Id    { get; } = Guid.NewGuid();
    public string Name  { get; init; } = "";
    public string Email { get; init; } = "";
}

// OR record with an Id property participating in equality
public record Customer(Guid Id, string Name, string Email);
var c = new Customer(Guid.NewGuid(), "Alice", "alice@a.com");`,
      explanation: 'Records use value equality — two records with identical property values are considered the same object. This is perfect for value objects (Money, Address, Color) but wrong for entities that need to be distinguished by identity even when data matches. Use a class with a unique Id, or include the Id in the record so equality reflects identity.',
    },
    {
      title: 'Record inheritance equality surprise — base and derived are never equal',
      wrong: `public record Animal(string Name);
public record Dog(string Name, string Breed) : Animal(Name);

var a = new Animal("Rex");
var d = new Dog("Rex", "Husky");

// Developer expects them to be equal on Name
if (a == d) Console.WriteLine("Same animal");
// Never prints — different EqualityContract types`,
      right: `// Use pattern matching to check what you actually care about:
if (d is Animal { Name: "Rex" })
    Console.WriteLine("Is an animal named Rex");  // prints

// Or compare only the base property explicitly:
Console.WriteLine(a.Name == d.Name);  // True

// To opt out of EqualityContract on Animal, seal the record:
// sealed record Animal(string Name);  // no inheritance, simpler equality`,
      explanation: 'The compiler generates a protected virtual EqualityContract property returning typeof(T) for each record. Equality checks compare EqualityContract first — a Person and Employee are never equal even if all shared properties match. This prevents accidental equality across an inheritance hierarchy but surprises developers who expect base-type comparison to work.',
    },
    {
      title: 'Confused about when the compact constructor runs — accessing properties before assignment',
      wrong: `public record Temperature(double Celsius)
{
    // WRONG: trying to use a constructor with parameters like a regular ctor
    public Temperature(double celsius)  // duplicate constructor — compile error
    {
        if (celsius < -273.15) throw new ArgumentOutOfRangeException(...);
        Celsius = celsius;  // this is what you think the compact ctor looks like
    }
}`,
      right: `public record Temperature(double Celsius)
{
    // CORRECT: compact constructor — no parameter list, no assignment
    // Properties are already assigned when this body runs
    public Temperature
    {
        if (Celsius < -273.15)
            throw new ArgumentOutOfRangeException(nameof(Celsius),
                "Temperature below absolute zero");
        // You CAN reassign properties here to normalize input:
        Celsius = Math.Round(Celsius, 4);
    }
}`,
      explanation: 'A compact constructor (primary constructor body) has no parameter list and no explicit assignment — the positional properties are assigned by the generated constructor before the compact body runs. You validate or normalize them by reading their property names directly. Writing a regular constructor with the same parameters as the record creates a duplicate and causes a compile error.',
    },
    {
      title: 'Missing readonly on record struct — allows accidental mutation inside methods',
      wrong: `// Non-readonly record struct — each method call on a property creates a mutable copy
public record struct Point(double X, double Y)
{
    // Accidentally mutable: methods can set X or Y with this.X = ...
    // The compiler may also create defensive copies in some contexts
    public double Length() => Math.Sqrt(X * X + Y * Y);
}

// Callers may think Point is immutable, but it is not forced by the type`,
      right: `// readonly record struct — compiler enforces immutability throughout
public readonly record struct Point(double X, double Y)
{
    public double Length => Math.Sqrt(X * X + Y * Y);
    // Any attempt to set X or Y inside a method is a compile error
}

// with still works:
var p = new Point(3, 4);
var q = p with { X = 0 };  // creates a new Point(0, 4)`,
      explanation: 'A plain record struct has value equality and with-expression support but is not forced to be immutable — methods inside the struct can still mutate properties. The readonly modifier on readonly record struct instructs the compiler to enforce immutability on all members, prevent defensive copies in common scenarios, and make intent clear to consumers.',
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'How does equality work for record classes compared to regular classes?',
      options: [
        'Both use reference equality by default',
        'Record classes use value equality — two records with the same property values are equal',
        'Record classes are always unequal unless you override Equals manually',
        'Records use identity equality; classes use value equality',
      ],
      answer: 1,
      explanation: 'The compiler auto-generates <code>Equals</code> and <code>GetHashCode</code> for records based on all properties. Two record instances with identical values are considered equal. Regular classes default to reference equality (same object in memory).',
    },
    {
      q: 'What is the key difference between record struct and record class?',
      options: [
        'record struct supports with expressions; record class does not',
        'record struct is a value type (stack-allocated, copied on assignment); record class is a reference type',
        'record struct is mutable; record class is immutable',
        'There is no difference — they are just different syntax for the same concept',
      ],
      answer: 1,
      explanation: '<code>record struct</code> is a value type: it lives on the stack and is fully copied on assignment. <code>record class</code> (or just <code>record</code>) is a reference type on the heap. Both support value equality and with expressions. Use <code>readonly record struct</code> to additionally enforce immutability.',
    },
    {
      q: 'What does the with expression do?',
      options: [
        'Mutates the original record in place',
        'Creates a shallow copy of the record with the specified properties overridden',
        'Casts the record to a different type',
        'Merges two records into one',
      ],
      answer: 1,
      explanation: '<code>with</code> calls the compiler-generated copy constructor and overrides the specified properties. The original record is completely unchanged. However, it is a <strong>shallow</strong> copy — mutable reference-type properties (like List&lt;T&gt;) are still shared between original and copy.',
    },
    {
      q: 'What does the init accessor enforce?',
      options: [
        'The property must be set inside a constructor body only',
        'The property is read-only everywhere, including at construction',
        'The property can only be set during object initialisation (constructor or object initialiser)',
        'The property is lazily initialised on first access',
      ],
      answer: 2,
      explanation: '<code>init</code> allows setting the property in a constructor body or an object initialiser (<code>new Foo { Prop = value }</code>). After the object is fully constructed, the property becomes read-only. This is more flexible than a private setter because it allows object-initialiser syntax.',
    },
    {
      q: 'You have: record Animal(string Name); record Dog(string Name, string Breed) : Animal(Name); Will new Animal("Rex") == new Dog("Rex", "Husky") be true?',
      options: [
        'Yes — Name matches so they are equal',
        'No — the EqualityContract property differs between Animal and Dog, so they are never equal',
        'It throws InvalidCastException at runtime',
        'Yes — but only if Dog does not add any new properties',
      ],
      answer: 1,
      explanation: 'The compiler generates a protected virtual <code>EqualityContract</code> property returning <code>typeof(T)</code> for each record type. Equality checks this property first — a base record and a derived record are <strong>never equal</strong>, even if all their shared property values match.',
    },
    {
      q: 'When should you prefer record over class for a domain type?',
      options: [
        'Whenever the type has more than two properties',
        'For value objects identified by their data (Money, Address, Point), not by identity',
        'Only for types that are serialized to JSON',
        'Whenever you want to avoid writing constructors',
      ],
      answer: 1,
      explanation: 'Records are ideal for value objects — types where two instances with the same data represent the same concept (like two £10 notes being equal). Entities that need distinct identity (two customers with the same name are different people) should be classes with a unique Id field, because record equality would incorrectly merge them.',
    },
    {
      q: 'What is a compact constructor in a positional record?',
      options: [
        'A constructor with fewer parameters than the positional record declares',
        'A validation block with no parameter list that runs after properties are assigned',
        'A static factory method that replaces the normal constructor',
        'A constructor that uses the base record\'s parameters',
      ],
      answer: 1,
      explanation: 'A compact constructor is a special body block with <em>no parameter list</em>: <code>public Point { /* validate */ }</code>. The positional properties are already assigned by the time this body runs (they are set by the generated constructor). Use it to validate or normalize the incoming values without re-declaring the parameters.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Can records have methods?',
      a: 'Yes — records are full types and can have methods, computed properties, events, static members, and interface implementations. The only differences from a class are what the compiler auto-generates: value equality, <code>ToString</code>, <code>Deconstruct</code>, the copy constructor for <code>with</code>, and the <code>EqualityContract</code>. You can add any members you need inside the record body alongside the generated ones.',
    },
    {
      q: 'Are records thread-safe?',
      a: 'Immutable records are inherently safe to <em>read</em> from multiple threads — no thread can change the record\'s properties after construction. However, immutability only applies to the record\'s own properties. If a property holds a mutable reference type (e.g. a <code>List&lt;T&gt;</code>), that inner object can still be mutated by any thread. For full thread-safety, ensure all nested objects are also immutable (use <code>ImmutableArray&lt;T&gt;</code>, <code>ImmutableList&lt;T&gt;</code>, etc.).',
    },
    {
      q: 'How do I add validation to a record?',
      a: 'Use a <em>compact constructor</em> — a body block with no parameter list. For <code>record Product(string Name, decimal Price)</code>, add: <code>public Product { ArgumentOutOfRangeException.ThrowIfNegative(Price); }</code>. The compact body runs after the positional properties are assigned, so you validate them by name. You can also normalize values here (e.g. <code>Name = Name.Trim();</code>). Combine with <code>required</code> (C# 11) to enforce that callers supply values at construction sites.',
    },
    {
      q: 'What is positional syntax in records?',
      a: 'Positional syntax declares a record\'s properties in the primary constructor parameter list: <code>record Point(int X, int Y);</code>. The compiler automatically generates: a constructor accepting X and Y, public <code>init</code>-only properties for both, a <code>Deconstruct(out int x, out int y)</code> method, and all equality/printing members. It is the most concise form for data-only records. Non-positional properties can be added in the body using <code>{ get; init; }</code>.',
    },
    {
      q: 'How does record inheritance work?',
      a: '<code>record class</code> can inherit from another <code>record class</code>: <code>record Employee(string Name, string Dept) : Person(Name);</code>. The derived record\'s <code>Equals</code> includes the <code>EqualityContract</code> property (<code>typeof(Employee)</code> vs <code>typeof(Person)</code>), so base and derived records are never equal even when all shared properties match. Derived records inherit <code>with</code> support and <code>Deconstruct</code> is updated for all properties. <code>record struct</code> cannot be inherited — it is always sealed.',
    },
    {
      q: 'Can I use records with System.Text.Json?',
      a: 'Yes — <code>System.Text.Json</code> supports records with <code>init</code> properties from .NET 5 onward. The deserializer can set <code>init</code>-only properties because it uses an internal mechanism equivalent to object-initialiser syntax. Positional records also work if you add <code>[JsonConstructor]</code> on the primary constructor (or use .NET 7+ where the primary constructor is inferred). <code>required</code> properties (C# 11) are honoured by the serializer — a missing required JSON field throws during deserialization.',
    },
    {
      q: 'What is the difference between a record and a struct for value objects?',
      a: 'A <code>record class</code> is a heap-allocated reference type — it is nullable, supports inheritance, and has GC overhead. A <code>readonly record struct</code> is a stack/inline value type — no GC, no null, no inheritance. The choice is: for small, frequently created value objects (&lt;= ~16 bytes) that do not need null or inheritance, use <code>readonly record struct</code> for better performance. For larger, richer value objects or ones that need nullable semantics or a sealed hierarchy, use <code>record class</code>.',
    },
  ];

  challenge: Challenge = {
    title: 'Money Value Object',
    description: `Model a Money value object using a record.
1. Create a positional record <code>Money</code> with <code>decimal Amount</code> and <code>string Currency</code> properties.
2. Add a compact constructor that throws <code>ArgumentOutOfRangeException</code> if Amount is negative.
3. Add an <code>Add(Money other)</code> method that returns a new <code>Money</code> record. Throw <code>InvalidOperationException</code> if the currencies differ.
4. Add a <code>Convert(string toCurrency, decimal rate)</code> method using a <code>with</code> expression.
5. Verify that two Money instances with the same values are equal.`,
    language: 'csharp',
    hints: [
      'Declare with positional syntax: record Money(decimal Amount, string Currency)',
      'Compact constructor: public Money { ArgumentOutOfRangeException.ThrowIfNegative(Amount); }',
      'In Add, check Currency == other.Currency before adding amounts',
      'In Convert: return this with { Amount = Amount * rate, Currency = toCurrency }',
      'Value equality is free — just use == or Assert.Equal to compare two Money instances',
    ],
    starterCode: `public record Money(decimal Amount, string Currency)
{
    // TODO: compact constructor — validate Amount is not negative

    // TODO: Add — adds two Money values of the same currency
    public Money Add(Money other)
    {
        throw new NotImplementedException();
    }

    // TODO: Convert — uses with expression to return converted Money
    public Money Convert(string toCurrency, decimal rate)
    {
        throw new NotImplementedException();
    }
}

var price   = new Money(10.00m, "GBP");
var tax     = new Money(2.00m,  "GBP");
var total   = price.Add(tax);               // Money { Amount = 12.00, Currency = GBP }
var inEuros = total.Convert("EUR", 1.17m);  // Money { Amount = 14.04, Currency = EUR }
var price2  = new Money(10.00m, "GBP");
Console.WriteLine(price == price2);          // True`,
    solution: `public record Money(decimal Amount, string Currency)
{
    public Money
    {
        ArgumentOutOfRangeException.ThrowIfNegative(Amount, nameof(Amount));
    }

    public Money Add(Money other)
    {
        if (Currency != other.Currency)
            throw new InvalidOperationException(
                $"Cannot add {Currency} and {other.Currency}");

        return this with { Amount = Amount + other.Amount };
    }

    public Money Convert(string toCurrency, decimal rate) =>
        this with { Amount = Amount * rate, Currency = toCurrency };
}

var price   = new Money(10.00m, "GBP");
var tax     = new Money(2.00m,  "GBP");
var total   = price.Add(tax);
var inEuros = total.Convert("EUR", 1.17m);

Console.WriteLine(total);              // Money { Amount = 12.00, Currency = GBP }
Console.WriteLine(inEuros);           // Money { Amount = 14.04, Currency = EUR }
Console.WriteLine(price == new Money(10.00m, "GBP")); // True`,
  };

  revision: RevisionSummary = {
    oneLiner: 'Records are compiler-enhanced types with value equality, with-expressions, and auto-generated Deconstruct. Use them for value objects and DTOs; use classes for entities with identity. with is a shallow copy — mutable nested objects are still shared.',
    mustKnow: [
      'Records auto-generate: Equals, GetHashCode, ToString, Deconstruct, copy constructor (for with).',
      'Positional properties are init-only — set at construction; read-only thereafter. Use compact constructor to validate.',
      'with creates a shallow copy with overridden properties. The original is untouched; mutable references are still shared.',
      'record class = reference type (heap, nullable, inheritable). readonly record struct = value type (stack, not nullable, sealed).',
      'EqualityContract: base and derived record class instances are NEVER equal, even if all shared property values match.',
      'Use records for value objects (Money, Address); use classes for entities (Customer, Order with identity).',
      'required init (C# 11): caller must supply the value at construction site — compile error if omitted.',
    ],
    interviewFocus: [
      'What is the difference between a record and a class? (value equality, with-expression, auto-generated members vs reference equality)',
      'What does with do and what are its limitations? (shallow copy with overrides — mutable references still shared)',
      'When would you use record struct vs record class? (record struct for small, frequent value types; record class when null/inheritance needed)',
      'Why are base and derived records never equal? (EqualityContract property — ensures type must match, not just properties)',
      'When should you NOT use a record? (entities with identity, large mutable objects, types where copying semantics would be wrong)',
    ],
  };
}
