import { Component } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-csharp-records',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './records.html',
  styleUrl: './records.scss',
})
export class CsharpRecords {

  quickRef: QuickRefItem[] = [
    { name: 'record',             type: 'keyword', desc: 'Immutable reference type with value-based equality and with-expression support', since: 'C# 9' },
    { name: 'record struct',      type: 'keyword', desc: 'Immutable value-type record — lives on the stack, copied on assignment', since: 'C# 10' },
    { name: 'init',               type: 'keyword', desc: 'Property accessor that can only be set during object initialisation', since: 'C# 9' },
    { name: 'with',               type: 'syntax',  desc: 'Non-destructive mutation — creates a copy of a record with specified properties changed', since: 'C# 9' },
    { name: 'required',           type: 'keyword', desc: 'Forces callers to set a property via object initialiser syntax', since: 'C# 11' },
    { name: 'EqualityContract',   type: 'class',   desc: 'Protected virtual property auto-generated on records for inheritance-aware equality', since: 'C# 9' },
    { name: 'Deconstruct',        type: 'syntax',  desc: 'Auto-generated method on positional records enabling tuple-style destructuring', since: 'C# 9' },
    { name: 'Positional syntax',  type: 'syntax',  desc: 'Shorthand record declaration: properties listed in the primary constructor parameter list', since: 'C# 9' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Records are immutable by default',
      points: [
        'Positional properties declared in the primary constructor are <code>init</code>-only — they can only be set at construction time.',
        'Equality is value-based: two record instances with the same property values are equal (<code>==</code> returns <code>true</code>).',
        'The compiler auto-generates <code>Equals</code>, <code>GetHashCode</code>, <code>ToString</code>, <code>Deconstruct</code>, and the copy constructor.',
        'Immutability makes records safe to share across threads and easy to reason about — no hidden mutation.',
      ],
    },
    {
      heading: 'with expressions for non-destructive mutation',
      points: [
        '<code>with</code> creates a shallow copy of a record with one or more properties overridden: <code>var b = a with { Age = 31 };</code>',
        'The original record is untouched — this is the functional-programming way to "change" data.',
        '<code>with</code> expressions can be chained and work on both <code>record class</code> and <code>record struct</code>.',
        'Use them in pipelines: transform immutable data through a series of stages without side effects.',
      ],
    },
    {
      heading: 'record struct vs record class',
      points: [
        '<code>record class</code> (or just <code>record</code>) is a reference type — allocated on the heap, passed by reference.',
        '<code>record struct</code> is a value type — allocated on the stack (or inline), copied on every assignment.',
        'Use <code>record struct</code> for small, short-lived value objects (e.g. <code>Point</code>, <code>Color</code>) to avoid heap pressure.',
        'Structs cannot be <code>null</code>, cannot inherit from other structs or classes, and are sealed.',
      ],
    },
    {
      heading: 'When to use records',
      points: [
        '<strong>DTOs</strong> — Data Transfer Objects travelling between layers or over the wire benefit from value equality and immutability.',
        '<strong>Domain value objects</strong> — <code>Money</code>, <code>Address</code>, <code>DateRange</code> are naturally identified by their values, not identity.',
        '<strong>API response models</strong> — deserialized JSON objects that should not be modified after creation.',
        '<strong>Configuration objects</strong> — settings that are read-once and shared without mutation risk.',
        'Avoid records for entities with identity (use <code>class</code>), or for large mutable objects where copying is expensive.',
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

// ── Record with extra members ───────────────────────────────────────────
public record Product(string Name, decimal Price)
{
    // Computed property
    public string Label => $"{Name} (£{Price:F2})";

    // Validation in a positional record — use a compact constructor
    public Product
    {
        ArgumentOutOfRangeException.ThrowIfNegative(Price, nameof(Price));
    }

    // Regular method — records can have methods!
    public Product WithDiscount(decimal pct) =>
        this with { Price = Price * (1 - pct / 100) };
}

var p = new Product("Widget", 9.99m);
Console.WriteLine(p.Label);                      // Widget (£9.99)
Console.WriteLine(p.WithDiscount(10).Label);     // Widget (£8.99)`,
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

// ── Nested with — must replace the whole nested record ─────────────────
var relocated = order with
{
    ShipTo = order.ShipTo with { City = "Manchester" }
};
Console.WriteLine(relocated.ShipTo.City); // Manchester
Console.WriteLine(order.ShipTo.City);     // London — untouched

// ── Chaining with in a functional pipeline ─────────────────────────────
Order ApplyVat(Order o)   => o with { Total = o.Total * 1.2m };
Order AddShipping(Order o) => o with { Total = o.Total + 5.99m };

var finalOrder = AddShipping(ApplyVat(order));
Console.WriteLine(finalOrder.Total);  // (149.99 * 1.2) + 5.99 = 185.99`,
    },
    {
      label: 'Record vs Class vs Struct',
      language: 'csharp',
      code: `// ── Reference equality (class) ────────────────────────────────────────
public class PointClass { public int X; public int Y; }

var c1 = new PointClass { X = 1, Y = 2 };
var c2 = new PointClass { X = 1, Y = 2 };
Console.WriteLine(c1 == c2);  // False — different objects

// ── Value equality (record class) ─────────────────────────────────────
public record PointRecord(int X, int Y);

var r1 = new PointRecord(1, 2);
var r2 = new PointRecord(1, 2);
Console.WriteLine(r1 == r2);  // True — same values

// ── Value type (record struct) ─────────────────────────────────────────
public record struct PointStruct(int X, int Y);

var s1 = new PointStruct(1, 2);
var s2 = s1;          // copied, not shared
s2 = s2 with { X = 99 };
Console.WriteLine(s1.X);  // 1 — original unchanged (value semantics)
Console.WriteLine(s2.X);  // 99

// ── Memory allocation comparison ───────────────────────────────────────
// class           → heap allocation, GC pressure, reference passed
// record class    → heap allocation, GC pressure, but value equality
// record struct   → stack / inline, no GC, full copy on assignment
// struct          → stack / inline, no GC, mutable by default (avoid!)`,
    },
    {
      label: 'Init-only Properties',
      language: 'csharp',
      code: `// ── init accessor — set once at construction ──────────────────────────
public class Config
{
    public string Host { get; init; } = "localhost";
    public int    Port { get; init; } = 5432;
    public bool   UseSsl { get; init; }
}

var cfg = new Config { Host = "db.prod.com", Port = 5433, UseSsl = true };
// cfg.Host = "other"; // compile error — init-only after construction

// ── required init — caller MUST set the property (C# 11) ───────────────
public class UserDto
{
    public required string Username { get; init; }
    public required string Email    { get; init; }
    public string? Bio { get; init; }   // optional
}

var user = new UserDto
{
    Username = "alice",
    Email    = "alice@example.com",
    // Bio is optional — no error if omitted
};

// var bad = new UserDto();  // compile error — Username and Email are required

// ── init in records (positional = automatically init) ─────────────────
public record Invoice(int Number, decimal Amount)
{
    // Additional non-positional init property
    public string? Notes { get; init; }
}

var inv = new Invoice(42, 299.99m) { Notes = "Rush order" };`,
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
      explanation: 'The compiler auto-generates <code>Equals</code> and <code>GetHashCode</code> for records based on all properties, so two record instances with identical values are considered equal. Regular classes default to reference equality.',
    },
    {
      q: 'What is the key difference between record struct and record class?',
      options: [
        'record struct supports with expressions; record class does not',
        'record struct is a value type (stack-allocated, copied on assignment); record class is a reference type',
        'record struct is mutable; record class is immutable',
        'There is no difference — they are just different syntax for the same thing',
      ],
      answer: 1,
      explanation: '<code>record struct</code> is a value type: it lives on the stack and is copied on assignment. <code>record class</code> (or just <code>record</code>) is a reference type on the heap. Both support value equality and with expressions.',
    },
    {
      q: 'What does the with expression do?',
      options: [
        'Mutates the original record in place',
        'Creates a shallow copy of the record with specified properties overridden',
        'Casts the record to a different type',
        'Merges two records into one',
      ],
      answer: 1,
      explanation: '<code>with</code> calls the compiler-generated copy constructor and overrides the properties you specify. The original record is completely unchanged — this is non-destructive mutation.',
    },
    {
      q: 'What does the init accessor enforce?',
      options: [
        'The property must be set in the constructor only',
        'The property is read-only everywhere',
        'The property can only be set during object initialisation (constructor or object initialiser)',
        'The property is lazily initialised on first access',
      ],
      answer: 2,
      explanation: '<code>init</code> allows setting the property either inside a constructor or in an object initialiser (<code>new Foo { Prop = value }</code>). After the object is fully constructed, the property becomes read-only.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Can records have methods?',
      a: 'Yes — records are full types and can have methods, computed properties, events, and even implement interfaces. The only difference from a class is that positional properties are <code>init</code>-only, equality is value-based, and <code>ToString</code>/<code>GetHashCode</code> are auto-generated. You can add any members you need inside the record body.',
    },
    {
      q: 'Are records thread-safe?',
      a: 'Immutable records are inherently safe to share across threads because no thread can modify the data after construction. However, immutability only applies to the record\'s own properties — if a property holds a mutable reference type (e.g. a <code>List&lt;T&gt;</code>), that inner object can still be mutated. For full thread-safety, ensure all nested types are also immutable.',
    },
    {
      q: 'How do I add validation to a record?',
      a: 'Use a <em>compact constructor</em> (also called a primary constructor body). For a positional record <code>record Foo(string Name)</code>, add a block without repeating the parameter list: <pre><code>public record Foo(string Name)\n{\n    public Foo { ArgumentException.ThrowIfNullOrEmpty(Name); }\n}</code></pre> The compact constructor runs after properties are assigned, so you can validate them directly.',
    },
    {
      q: 'What is positional syntax in records?',
      a: 'Positional syntax lets you declare a record\'s properties in the primary constructor parameter list: <code>record Point(int X, int Y);</code>. The compiler automatically generates: a constructor accepting X and Y, public <code>init</code>-only properties, a <code>Deconstruct</code> method, and all equality/printing members. It\'s the most concise way to declare a data-only record.',
    },
  ];

  challenge: Challenge = {
    title: 'Money Value Object',
    description: `Model a Money value object using a record.
1. Create a positional record <code>Money</code> with <code>decimal Amount</code> and <code>string Currency</code> properties.
2. Add an <code>Add(Money other)</code> method that returns a new <code>Money</code> record. It should throw <code>InvalidOperationException</code> if the currencies differ.
3. Add a <code>Convert(string toCurrency, decimal rate)</code> method that uses a <code>with</code> expression to return a new Money in the target currency with the converted amount.
4. Verify that two <code>Money</code> instances with the same values are equal.`,
    language: 'csharp',
    hints: [
      'Declare the record with positional syntax: record Money(decimal Amount, string Currency)',
      'In Add, check Currency == other.Currency before adding',
      'In Convert, use: return this with { Amount = Amount * rate, Currency = toCurrency }',
      'Value equality is free — just use == to compare two Money instances',
    ],
    starterCode: `public record Money(decimal Amount, string Currency)
{
    // TODO: Add method — adds two Money values of the same currency
    public Money Add(Money other)
    {
        throw new NotImplementedException();
    }

    // TODO: Convert method — uses with expression to return converted Money
    public Money Convert(string toCurrency, decimal rate)
    {
        throw new NotImplementedException();
    }
}

// Expected usage:
var price    = new Money(10.00m, "GBP");
var tax      = new Money(2.00m,  "GBP");
var total    = price.Add(tax);          // Money { Amount = 12.00, Currency = GBP }
var inEuros  = total.Convert("EUR", 1.17m); // Money { Amount = 14.04, Currency = EUR }
var price2   = new Money(10.00m, "GBP");
Console.WriteLine(price == price2);     // True`,
    solution: `public record Money(decimal Amount, string Currency)
{
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
}
