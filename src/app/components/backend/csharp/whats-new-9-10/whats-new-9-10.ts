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
  selector: 'app-csharp-whats-new-9-10',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './whats-new-9-10.html',
  styleUrl: './whats-new-9-10.scss',
})
export class CsharpWhatsNew910 {

  quickRef: QuickRefItem[] = [
    { name: 'record',                       type: 'keyword',  desc: 'C# 9. Reference type with value-based equality, immutability by default, and a synthesised with-expression copy constructor.' },
    { name: 'init',                         type: 'keyword',  desc: 'C# 9. Property setter that can only be called during object initialisation (constructor or object-initialiser). Makes properties immutable after construction.' },
    { name: 'Top-level programs',           type: 'syntax',   desc: 'C# 9. Omit the class and Main method boilerplate. Write statements directly in a .cs file — the compiler generates the entry point.' },
    { name: 'Target-typed new',             type: 'syntax',   desc: 'C# 9. Omit the type on the right-hand side of new when the type is inferrable: List<string> items = new();' },
    { name: 'Pattern: and / or / not',      type: 'syntax',   desc: 'C# 9. Logical pattern combinators: x is > 0 and < 100, x is not null, x is Cat or Dog.' },
    { name: 'Covariant return types',       type: 'syntax',   desc: 'C# 9. Overriding methods can return a more derived type than the base method declared.' },
    { name: 'nint / nuint',                 type: 'type',     desc: 'C# 9. Native-sized integers — platform width (32-bit on 32-bit, 64-bit on 64-bit). Useful for interop and pointer arithmetic.' },
    { name: 'record struct',                type: 'keyword',  desc: 'C# 10. Value-type record. Combines struct semantics with record features (value equality, with-expression, Deconstruct).' },
    { name: 'global using',                 type: 'keyword',  desc: 'C# 10. A using directive that applies to the entire project. Reduces boilerplate in every file.' },
    { name: 'File-scoped namespace',        type: 'syntax',   desc: 'C# 10. namespace Foo.Bar; (semicolon, no braces) applies to the whole file. Eliminates one level of indentation.' },
    { name: 'const interpolated strings',   type: 'syntax',   desc: 'C# 10. Interpolated string literals that consist only of other constants can themselves be const.' },
    { name: 'CallerArgumentExpression',     type: 'decorator', desc: 'C# 10. Attribute that captures the expression text of a caller argument as a string — useful for assertion/logging helpers.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'C# 9 — records and immutability',
      points: [
        '<code>record</code> types generate value-based <code>Equals</code>, <code>GetHashCode</code>, and <code>ToString</code> automatically. Two record instances with the same property values are considered equal.',
        'Record properties declared in the primary constructor are <code>init</code>-only by default — immutable after construction, but settable via an <strong>object initialiser</strong>.',
        'The <code>with</code> expression creates a shallow copy of a record with specific properties changed: <code>var updated = original with { Name = "Alice" };</code>',
        '<code>init</code> setters can also be used on regular class properties. They allow setting a property in an object initialiser but prevent re-assignment later.',
      ],
    },
    {
      heading: 'C# 9 — programs and patterns',
      points: [
        'Top-level programs eliminate the <code>class Program { static void Main(string[] args) { ... } }</code> boilerplate. The <code>args</code> variable is still available implicitly.',
        'Target-typed <code>new</code> expressions infer the type from context: <code>HttpClient client = new();</code>. Works in field declarations, method arguments, and variable declarations.',
        'New pattern combinators: <code>and</code>, <code>or</code>, <code>not</code>. Example: <code>age is >= 18 and <= 65</code>, <code>input is not null</code>, <code>shape is Circle or Square</code>.',
        'Covariant return types allow an override to return a more specific type, reducing the need to cast in callers.',
      ],
    },
    {
      heading: 'C# 10 — cleaner project structure',
      points: [
        '<code>global using</code> directives belong in a dedicated file (e.g. <code>GlobalUsings.cs</code>) and automatically apply to all files in the project. SDK-style projects emit implicit global usings for common namespaces.',
        'File-scoped namespaces (<code>namespace Foo.Bar;</code> with a semicolon) remove one level of indentation from the entire file. Only one namespace per file is allowed in this form.',
        '<code>record struct</code> combines record convenience (value equality, <code>with</code>, <code>Deconstruct</code>) with struct value semantics and stack allocation.',
        'Extended property patterns (<code>{ Address.City: "London" }</code>) allow matching nested properties without intermediate variables.',
      ],
    },
    {
      heading: 'C# 10 — expression and attribute improvements',
      points: [
        'Constant interpolated strings: <code>const string prefix = "ERR"; const string msg = \$"{prefix}: invalid";</code> — works when all interpolated expressions are also constants.',
        '<code>[CallerArgumentExpression("param")]</code> captures the source-code expression of a method argument as a string, enabling rich assertion messages without manual text: <code>Requires(x > 0, nameof(x > 0))</code> automatically captures <code>"x > 0"</code>.',
        '<code>record</code> types can now seal <code>ToString()</code> to prevent derived records from overriding it with <code>sealed override string ToString() => ...</code>.',
        'Improved lambda declarations: lambdas can now have explicit return types and attributes in C# 10, e.g. <code>var parse = [return: MaybeNull] (string s) => int.TryParse(s, out var n) ? n : default;</code>.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'C# 9 Records',
      language: 'csharp',
      code: `// ── 1. Record declaration — positional syntax ────────────────────
// Compiler generates: constructor, Deconstruct, Equals, GetHashCode, ToString
public record Point(double X, double Y);

var p1 = new Point(1.0, 2.0);
var p2 = new Point(1.0, 2.0);
Console.WriteLine(p1 == p2);        // True  — value equality, not reference
Console.WriteLine(p1);              // Point { X = 1, Y = 2 }

// ── 2. with expression — non-destructive mutation ─────────────────
var p3 = p1 with { Y = 99.0 };     // new Point(1.0, 99.0)
Console.WriteLine(p1);              // unchanged: Point { X = 1, Y = 2 }
Console.WriteLine(p3);              // Point { X = 1, Y = 99 }

// ── 3. Record with extra members ──────────────────────────────────
public record Person(string FirstName, string LastName)
{
    // Computed property — does NOT participate in equality
    public string FullName => \$"{FirstName} {LastName}";

    // Custom validation in the compact constructor
    public Person
    {
        if (string.IsNullOrWhiteSpace(FirstName))
            throw new ArgumentException("FirstName is required");
    }
}

// ── 4. init-only setters on a regular class ───────────────────────
public class Config
{
    public string Host  { get; init; } = "localhost";
    public int    Port  { get; init; } = 5432;
}

// OK — set during object initialisation
var cfg = new Config { Host = "db.prod", Port = 5432 };

// COMPILE ERROR — cannot set init property after construction:
// cfg.Host = "other";  // Error CS8852

// ── 5. Deconstruct ────────────────────────────────────────────────
var (x, y) = p1;          // auto-generated Deconstruct
Console.WriteLine(x);     // 1
Console.WriteLine(y);     // 2`,
    },
    {
      label: 'C# 9 Patterns & More',
      language: 'csharp',
      code: `// ── 1. Logical pattern combinators ───────────────────────────────
static string Classify(int n) => n switch
{
    < 0          => "negative",
    0            => "zero",
    > 0 and < 10 => "small positive",
    >= 10        => "large positive",
    _            => "unknown",
};

// not pattern for null checks:
static void Print(string? s)
{
    if (s is not null)
        Console.WriteLine(s.ToUpper());
}

// or pattern:
static bool IsWeekend(DayOfWeek d) =>
    d is DayOfWeek.Saturday or DayOfWeek.Sunday;

// ── 2. Top-level program ──────────────────────────────────────────
// In a .NET 6+ project, Program.cs can just be:
//   using System;
//   Console.WriteLine("Hello, World!");
// args is implicitly available as string[] args.

// ── 3. Target-typed new ───────────────────────────────────────────
Dictionary<string, List<int>> map = new();     // no need to repeat the type
List<string>                  list = new(100); // with capacity hint

// Also works in method calls when type is unambiguous:
void Process(List<string> items) { }
Process(new() { "a", "b", "c" });

// ── 4. Covariant return types ─────────────────────────────────────
public abstract class Animal
{
    public abstract Animal Clone();
}

public class Cat : Animal
{
    public string Name { get; init; } = "";

    // Override returns Cat (more derived) — valid since C# 9
    public override Cat Clone() => new Cat { Name = this.Name };
}

// ── 5. nint / nuint ──────────────────────────────────────────────
nint  ptr  = 42;          // IntPtr under the hood; width matches platform
nuint uptr = 0xFF_FF_FF;

// Useful for interop:
// [DllImport("lib")]
// static extern nint GetHandle();`,
    },
    {
      label: 'C# 10 Features',
      language: 'csharp',
      code: `// ── 1. Global usings (GlobalUsings.cs) ───────────────────────────
// Place in one file; applies to all .cs files in the project
global using System;
global using System.Collections.Generic;
global using System.Linq;
global using System.Threading.Tasks;

// SDK-style projects auto-generate implicit global usings for common namespaces.
// Disable with: <ImplicitUsings>disable</ImplicitUsings> in .csproj

// ── 2. File-scoped namespace ──────────────────────────────────────
// Old style (adds one level of indentation):
// namespace MyApp.Services
// {
//     public class OrderService { ... }
// }

// New style (C# 10) — entire file is in this namespace:
namespace MyApp.Services;

public class OrderService { /* ... */ }

// ── 3. record struct ──────────────────────────────────────────────
// Value type + record features. Stack-allocated for small structs.
public record struct Vector2(float X, float Y);

var v1 = new Vector2(1f, 2f);
var v2 = new Vector2(1f, 2f);
Console.WriteLine(v1 == v2);   // True — value equality

// Unlike record class, record struct is mutable by default:
// v1.X = 5f;  // OK (record struct)
// Use 'readonly record struct' to make it immutable

// ── 4. Extended property patterns ────────────────────────────────
public record Address(string City, string Country);
public record Customer(string Name, Address Address);

static bool IsLondonCustomer(Customer c) =>
    c is { Address.City: "London" };  // nested property in one pattern

// ── 5. const interpolated strings ─────────────────────────────────
const string AppName  = "DevHub";
const string Version  = "2.0";
const string FullName = \$"{AppName} v{Version}";  // OK — all interpolations are const

// ── 6. CallerArgumentExpression ───────────────────────────────────
static void Requires(
    bool condition,
    [System.Runtime.CompilerServices.CallerArgumentExpression("condition")]
    string? conditionText = null)
{
    if (!condition)
        throw new ArgumentException(\$"Condition failed: {conditionText}");
}

int x = -1;
Requires(x > 0);   // throws: "Condition failed: x > 0"`,
    },
  ];

  challenge: Challenge = {
    title: 'Immutable Domain Model with Records',
    description: `Model a simple e-commerce order using C# 9/10 features.

Requirements:
1. Create a record Address(string Street, string City, string PostCode)
2. Create a record OrderLine(string ProductName, int Quantity, decimal UnitPrice) with a computed property Total = Quantity * UnitPrice
3. Create a record Order with:
   - An int Id (init-only)
   - A string CustomerName (init-only)
   - An Address ShippingAddress (init-only)
   - An IReadOnlyList<OrderLine> Lines (init-only)
   - A computed decimal GrandTotal that sums all Lines[].Total
4. Write a static method ApplyDiscount(Order order, decimal pct) that returns a new Order with all line UnitPrices reduced by pct % using with-expressions
5. Demonstrate that two Orders with identical values are equal (==)`,
    language: 'csharp',
    hints: [
      'Use positional record syntax: public record Address(string Street, string City, string PostCode);',
      'Add a computed property inside the record body: public decimal Total => Quantity * UnitPrice;',
      'For Order, use a non-positional record so you can mix init properties with computed ones',
      'In ApplyDiscount, use "order with { Lines = order.Lines.Select(l => l with { UnitPrice = l.UnitPrice * (1 - pct/100) }).ToList() }"',
    ],
    starterCode: `// TODO: define Address record
// TODO: define OrderLine record with Total computed property
// TODO: define Order record with Id, CustomerName, ShippingAddress, Lines, GrandTotal

public static class OrderService
{
    // Returns a new Order with all line prices reduced by pct%
    public static Order ApplyDiscount(Order order, decimal pct)
    {
        throw new NotImplementedException();
    }
}`,
    solution: `public record Address(string Street, string City, string PostCode);

public record OrderLine(string ProductName, int Quantity, decimal UnitPrice)
{
    public decimal Total => Quantity * UnitPrice;
}

public record Order
{
    public int                    Id               { get; init; }
    public string                 CustomerName     { get; init; } = "";
    public Address                ShippingAddress  { get; init; } = new("", "", "");
    public IReadOnlyList<OrderLine> Lines          { get; init; } = [];
    public decimal GrandTotal => Lines.Sum(l => l.Total);
}

public static class OrderService
{
    public static Order ApplyDiscount(Order order, decimal pct) =>
        order with
        {
            Lines = order.Lines
                .Select(l => l with { UnitPrice = l.UnitPrice * (1 - pct / 100m) })
                .ToList()
        };
}

// Usage:
var addr  = new Address("1 High St", "London", "EC1A 1BB");
var lines = new List<OrderLine>
{
    new("Widget", 2, 9.99m),
    new("Gadget", 1, 49.99m),
};
var order1 = new Order { Id = 1, CustomerName = "Alice", ShippingAddress = addr, Lines = lines };
var order2 = new Order { Id = 1, CustomerName = "Alice", ShippingAddress = addr, Lines = lines };

Console.WriteLine(order1 == order2);   // True — value equality
Console.WriteLine(order1.GrandTotal);  // 69.97

var discounted = OrderService.ApplyDiscount(order1, 10);
Console.WriteLine(discounted.GrandTotal);   // 62.973`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What makes record types different from regular classes in terms of equality?',
      options: [
        'Records use reference equality, just like classes, but with a cleaner syntax',
        'Records generate value-based Equals and GetHashCode based on all their properties',
        'Records can only be compared with == if they implement IEquatable<T> manually',
        'Records disable equality comparison entirely to promote immutability',
      ],
      answer: 1,
      explanation: 'The compiler auto-generates <code>Equals()</code>, <code>GetHashCode()</code>, and <code>==</code>/<code>!=</code> operators for record types based on all their declared properties. Two separate record instances with the same property values are therefore considered equal, unlike class instances which default to reference equality.',
    },
    {
      q: 'What is an init-only setter and when can you assign to it?',
      options: [
        'A setter that can only be called from within the same class',
        'A setter that can only be assigned during the constructor or an object initialiser, making the property immutable afterwards',
        'A setter that initialises the property to its default value automatically',
        'A setter that runs only once per application lifetime',
      ],
      answer: 1,
      explanation: '<code>init</code> setters (introduced in C# 9) allow a property to be set during object construction — either in the constructor body or via object-initialiser syntax (<code>new Config { Host = "db" }</code>) — but not after the object has been created. This gives you immutability without forcing use of a constructor for every property.',
    },
    {
      q: 'What does the "with" expression do for records?',
      options: [
        'It mutates the original record in place and returns void',
        'It creates a shallow copy of the record with specified properties replaced by new values',
        'It merges two records by combining their property values',
        'It provides a fluent builder pattern for constructing records',
      ],
      answer: 1,
      explanation: 'The <code>with</code> expression performs non-destructive mutation. It calls the compiler-generated copy constructor and then sets only the specified properties on the copy. The original record is never modified. Example: <code>var updated = original with { Name = "Bob" };</code> — <code>original</code> is unchanged.',
    },
    {
      q: 'What is the advantage of file-scoped namespaces in C# 10?',
      options: [
        'They allow multiple namespaces to be declared in a single file',
        'They reduce one level of indentation across the entire file by using a semicolon instead of braces',
        'They make all types in the namespace internal by default',
        'They are required for source generators to work correctly',
      ],
      answer: 1,
      explanation: 'A file-scoped namespace (<code>namespace Foo.Bar;</code>) applies to the entire file without braces, removing one level of indentation from every type and member declaration. This is a purely stylistic improvement — it is equivalent to a traditional namespace block wrapping the whole file. Only one file-scoped namespace per file is permitted.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use record vs record struct vs class?',
      a: `<strong>record</strong> (reference type): Use for immutable data transfer objects, domain value objects, or any type where value equality matters and you want the convenience of <code>with</code>-expressions and auto-generated <code>ToString</code>. Good for DTOs, API responses, domain events.<br><br>
<strong>record struct</strong> (value type): Use when you also want value semantics for memory layout (stack allocation, no GC pressure for short-lived values) AND the record convenience features. Good for small coordinate/vector types, points, colours.<br><br>
<strong>class</strong>: Use when identity matters (two instances are different even with the same data), when you need inheritance hierarchies, or when the object has significant mutable state and behaviour.`,
    },
    {
      q: 'How do global usings and implicit usings differ?',
      a: `<strong>Global usings</strong> are directives you write yourself: <code>global using System.Text.Json;</code>. You place them in a file (conventionally <code>GlobalUsings.cs</code>) and they apply project-wide. You have full control over what is included.<br><br>
<strong>Implicit usings</strong> are automatically generated by the .NET SDK based on your project type. A console app gets <code>System</code>, <code>System.Collections.Generic</code>, <code>System.Linq</code>, etc. A web app additionally gets <code>Microsoft.AspNetCore.Builder</code> and related namespaces. They are controlled by the <code>&lt;ImplicitUsings&gt;enable&lt;/ImplicitUsings&gt;</code> setting in your <code>.csproj</code>. You can see the generated file in <code>obj/</code>.`,
    },
    {
      q: 'Can I use pattern matching with and/or/not outside switch expressions?',
      a: `Yes. The logical pattern combinators (<code>and</code>, <code>or</code>, <code>not</code>) work anywhere an <code>is</code> expression is valid:<br><br>
<pre>if (status is >= 200 and < 300) { /* success */ }
if (input is not null and not "") { /* non-empty */ }
bool isWeekend = day is DayOfWeek.Saturday or DayOfWeek.Sunday;</pre>
They also compose inside <code>switch</code> expressions, <code>switch</code> statements, and any <code>is</code> pattern. The precedence is: <code>not</code> binds tightest, then <code>and</code>, then <code>or</code> — same as logical operators but for patterns.`,
    },
    {
      q: 'What is CallerArgumentExpression useful for?',
      a: `It captures the <em>source-code text</em> of an argument expression as a string, automatically filled in by the compiler at the call site.<br><br>
The canonical use case is <strong>assertion helpers and guard clauses</strong>:<br>
<pre>[return: MaybeNull]
static void Requires(bool cond,
    [CallerArgumentExpression("cond")] string? expr = null)
{
    if (!cond) throw new ArgumentException(\$"Assertion failed: {expr}");
}

Requires(user.Age >= 18);
// Throws: "Assertion failed: user.Age >= 18"</pre>
Before C# 10, developers had to pass the expression text manually as a string. This feature is also used in <code>ArgumentException.ThrowIfNullOrEmpty</code> and <code>Debug.Assert</code> in .NET 6+.`,
    },
  ];
}
