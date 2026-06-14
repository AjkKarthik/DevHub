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
  selector: 'app-csharp-whats-new-9-10',
  standalone: true,
  imports: [
    CommonModule,
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
    CommonMistakesComponent, RevisionCardComponent,
  ],
  templateUrl: './whats-new-9-10.html',
  styleUrl: './whats-new-9-10.scss',
})
export class CsharpWhatsNew910 {

  quickRef: QuickRefItem[] = [
    { name: 'record',                       type: 'keyword',   desc: 'C# 9. Reference-type with value-based equality, with-expression, and auto-generated ToString', since: 'C# 9' },
    { name: 'record struct',                type: 'keyword',   desc: 'C# 10. Value-type record — stack semantics + record convenience; mutable by default (use readonly record struct for immutability)', since: 'C# 10' },
    { name: 'init',                         type: 'keyword',   desc: 'C# 9. Property setter callable only during construction or object-initialiser — immutable afterwards', since: 'C# 9' },
    { name: 'with { … }',                   type: 'syntax',    desc: 'C# 9. Non-destructive mutation: creates a shallow copy of a record with specified properties replaced', since: 'C# 9' },
    { name: 'Top-level programs',           type: 'syntax',    desc: 'C# 9. Drop the class/Main boilerplate; write statements directly at file scope', since: 'C# 9' },
    { name: 'Target-typed new',             type: 'syntax',    desc: 'C# 9. List<string> items = new(); — type inferred from the declaration context', since: 'C# 9' },
    { name: 'Pattern: and / or / not',      type: 'syntax',    desc: 'C# 9. Logical pattern combinators: x is > 0 and < 100, x is not null, x is Cat or Dog', since: 'C# 9' },
    { name: 'Covariant return types',       type: 'syntax',    desc: 'C# 9. Overriding methods may return a more derived type than the base declaration', since: 'C# 9' },
    { name: 'static lambda',               type: 'syntax',    desc: 'C# 9. static x => x + 1 — captures nothing, preventing accidental closure allocations', since: 'C# 9' },
    { name: 'global using',                 type: 'keyword',   desc: 'C# 10. Applies a using directive to the entire project — conventionally in GlobalUsings.cs', since: 'C# 10' },
    { name: 'File-scoped namespace',        type: 'syntax',    desc: 'C# 10. namespace Foo.Bar; removes one level of indentation from the whole file', since: 'C# 10' },
    { name: 'Extended property pattern',    type: 'syntax',    desc: 'C# 10. { Address.City: "London" } — match nested properties without intermediate variables', since: 'C# 10' },
    { name: 'const interpolated strings',   type: 'syntax',    desc: 'C# 10. Interpolated strings composed of only constants can themselves be const', since: 'C# 10' },
    { name: '[CallerArgumentExpression]',   type: 'decorator', desc: 'C# 10. Captures the source-code expression text of a caller argument — great for assertion helpers', since: 'C# 10' },
    { name: 'nint / nuint',                 type: 'type',      desc: 'C# 9. Platform-width integers (int/uint on 32-bit, long/ulong on 64-bit) — useful for interop', since: 'C# 9' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'C# 9 — records and init-only setters',
      points: [
        '<code>record</code> types let the compiler generate value-based <code>Equals</code>, <code>GetHashCode</code>, <code>==</code>/<code>!=</code>, <code>ToString</code>, and a copy constructor from your property declarations. Two records with the same values are equal by definition.',
        'Positional record syntax <code>public record Point(double X, double Y);</code> generates the primary constructor, properties with <code>init</code>-only setters, and a <code>Deconstruct</code> method — all in one line.',
        'The <code>with</code> expression performs non-destructive mutation: <code>var p2 = p1 with { Y = 99 };</code> creates a shallow copy with Y replaced, leaving p1 unchanged. This is the idiomatic way to "update" immutable data.',
        '<code>init</code>-only setters can also be added to regular class properties. They allow assignment during object initialisation (<code>new Config { Host = "db" }</code>) but prevent reassignment afterwards — giving you flexible construction without full mutability.',
        'You can add a compact constructor to a positional record for validation: <code>public Point { if (X &lt; 0) throw new ArgumentException("..."); }</code> — the compiler fills in the assignments, you just add checks.',
      ],
    },
    {
      heading: 'C# 9 — programs, patterns, and other features',
      points: [
        'Top-level programs eliminate the <code>class Program { static void Main(string[] args) { ... } }</code> boilerplate. Statements at file scope become the entry point; <code>args</code>, <code>return</code>, and <code>await</code> still work. Only one file per project may do this.',
        'Target-typed <code>new</code> infers the type from the assignment context: <code>Dictionary&lt;string, List&lt;int&gt;&gt; map = new();</code>. Also works in method arguments when the parameter type is unambiguous.',
        'Logical pattern combinators: <code>age is >= 18 and < 65</code>, <code>s is not null</code>, <code>day is Saturday or Sunday</code>. They compose with all existing patterns inside <code>is</code> expressions and <code>switch</code> arms.',
        'Covariant return types allow an override to declare a more derived return type: <code>public override Cat Clone()</code> where the base declares <code>Animal Clone()</code>. Callers that hold a <code>Cat</code> reference no longer need to cast the return value.',
        '<code>static</code> anonymous functions and lambdas (<code>static x => x + 1</code>) prevent the lambda from capturing any enclosing variables, ensuring no hidden closure allocation. The compiler enforces this — any attempt to capture a local is a compile error.',
      ],
    },
    {
      heading: 'C# 10 — project structure cleanup',
      points: [
        '<code>global using</code> directives apply to the whole project. Conventionally placed in a <code>GlobalUsings.cs</code> file, they eliminate the repetitive <code>using System.Linq;</code> at the top of every file. SDK-style projects already generate implicit global usings for common namespaces.',
        'File-scoped namespaces (<code>namespace Foo.Bar;</code> — note the semicolon, no braces) apply to the entire file and remove one level of indentation. Only one file-scoped namespace per file is permitted.',
        '<code>record struct</code> combines record convenience (value equality, <code>with</code>, <code>Deconstruct</code>) with struct value semantics. Unlike <code>record class</code>, a <code>record struct</code> is <strong>mutable by default</strong>. Use <code>readonly record struct</code> for the immutable version.',
        'Extended property patterns allow matching nested members inline: <code>c is { Address.City: "London" }</code> instead of <code>c is { Address: { City: "London" } }</code>. Nesting depth is unlimited.',
        'Parameterless struct constructors are now allowed: in C# 10 you can define <code>public struct Point { public Point() { X = 1; Y = 1; } }</code> — previously the default constructor was fixed to zero-initialise all fields.',
      ],
    },
    {
      heading: 'C# 10 — expressions and attributes',
      points: [
        'Constant interpolated strings: if all interpolated expressions are themselves <code>const</code>, the resulting interpolated string can also be <code>const</code>: <code>const string Msg = \$"{AppName} v{Version}";</code>.',
        '<code>[CallerArgumentExpression("paramName")]</code> on a method parameter captures the source-code text of the corresponding argument. The compiler fills it in at the call site. Used by <code>ArgumentNullException.ThrowIfNull</code> to include the expression text in the exception message.',
        'Lambda improvements: lambdas can now declare an explicit return type (<code>(string s) =&gt; (int)s.Length</code>), carry attributes, and use <code>var</code> as the parameter type to infer the overload. This makes <code>[GeneratedRegex]</code> partial methods and similar patterns more natural.',
        'Anonymous types now support <code>with</code>-expressions: <code>var a2 = a1 with { Name = "Bob" };</code> — previously only records had this. Useful when you don\'t want to define a named type for a one-off projection.',
        '<code>ArgumentNullException.ThrowIfNull(param)</code>, <code>ArgumentException.ThrowIfNullOrEmpty</code>, and related guard helpers were added in .NET 6 / C# 10 era. They use <code>[CallerArgumentExpression]</code> internally to produce messages like <code>&quot;param&quot; cannot be null (Parameter \'param\')</code>.',
      ],
    },
    {
      heading: 'Record inheritance and equality nuances',
      points: [
        'Records support inheritance: <code>public record Animal(string Name); public record Dog(string Name, string Breed) : Animal(Name);</code>. A <code>Dog</code> instance never equals an <code>Animal</code> instance even if properties match — the compiler generates a <code>protected virtual bool PrintMembers</code> chain that includes the runtime type in equality.',
        'The equality contract for records is type-sensitive: a subtype and a base-type instance with the same values are not equal. This is intentional and correct for domain models — but surprises those expecting structural equality across the hierarchy.',
        'Computed properties in a record body (with a getter only) do <em>not</em> participate in equality or <code>ToString</code> — only primary constructor parameters and any <code>{ get; init; }</code> declared properties are included.',
        '<code>sealed</code> records cannot be inherited. Sealing prevents the subtype-equality surprise and lets the compiler optimise equality checks. Add <code>sealed</code> when you don\'t intend extension: <code>public sealed record Point(double X, double Y);</code>.',
        'The <code>with</code>-expression uses the copy constructor which copies ALL properties including any from base records in the chain. If you add a new property to a base record, all derived-record <code>with</code> usages automatically include it — no manual update needed.',
      ],
    },
    {
      heading: 'Low-level C# 9 features and what drove them',
      points: [
        '<code>nint</code> / <code>nuint</code> are native-size integers — the same width as a pointer on the current platform (32-bit on x86, 64-bit on x64). They map to <code>IntPtr</code>/<code>UIntPtr</code> under the hood and support arithmetic operators, making interop pointer math much more natural.',
        'Function pointers (<code>delegate*&lt;int, int, int&gt; fp = &Math.Abs;</code>) provide a type-safe syntax for calling native functions through a pointer with zero managed-delegate overhead. Used in high-performance interop and the new Roslyn-generated P/Invoke patterns.',
        '<code>[ModuleInitializer]</code> on a <code>static void Init()</code> method causes it to be called once before any code in the module runs. Used by source generators, serializer contexts, and native AOT bootstrapping code.',
        '<code>[SkipLocalsInit]</code> suppresses the CLR default of zeroing all local variables before the method runs — a measurable win in hot stackalloc/unsafe paths where you immediately initialise every field.',
        'These low-level features primarily benefit framework and library authors writing high-performance code. Application code rarely needs them, but understanding they exist explains why newer .NET libraries are significantly faster than their predecessors.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'C# 9 Records',
      language: 'csharp',
      code: `// ── Positional record — everything in one line ────────────────────
// Compiler generates: constructor, init properties, Deconstruct,
// Equals, GetHashCode, ==, !=, ToString
public record Point(double X, double Y);

var p1 = new Point(1.0, 2.0);
var p2 = new Point(1.0, 2.0);
Console.WriteLine(p1 == p2);          // True  — value equality
Console.WriteLine(p1);                // Point { X = 1, Y = 2 }

// ── with expression — non-destructive copy ────────────────────────
var p3 = p1 with { Y = 99.0 };       // shallow copy, Y replaced
Console.WriteLine(p1);                // unchanged: Point { X = 1, Y = 2 }
Console.WriteLine(p3);                // Point { X = 1, Y = 99 }

// ── Record with compact constructor (validation) ───────────────────
public record Person(string FirstName, string LastName)
{
    // Computed property — NOT included in equality or ToString
    public string FullName => \$"{FirstName} {LastName}";

    // Compact constructor: compiler fills in assignments;
    // you just add the validation.
    public Person
    {
        ArgumentException.ThrowIfNullOrEmpty(FirstName);
    }
}

// ── init-only setters on a regular class ──────────────────────────
public class Config
{
    public string Host { get; init; } = "localhost";
    public int    Port { get; init; } = 5432;
}

var cfg = new Config { Host = "db.prod", Port = 5432 };  // OK
// cfg.Host = "other";  // CS8852 — cannot set init-only after construction

// ── Deconstruct ───────────────────────────────────────────────────
var (x, y) = p1;   // auto-generated for positional records
Console.WriteLine(\$"x={x}, y={y}");   // x=1, y=2`,
    },
    {
      label: 'C# 9 Patterns & More',
      language: 'csharp',
      code: `// ── Logical pattern combinators ───────────────────────────────────
static string Classify(int n) => n switch
{
    < 0            => "negative",
    0              => "zero",
    > 0 and < 10   => "small positive",
    >= 10 and < 100 => "medium",
    _               => "large",
};

// not pattern — cleaner null checks:
static void Print(string? s)
{
    if (s is not null)
        Console.WriteLine(s.ToUpper());
}

// or pattern — readable alternatives:
static bool IsWeekend(DayOfWeek d) =>
    d is DayOfWeek.Saturday or DayOfWeek.Sunday;

// Combining patterns — HTTP status classification:
static string HttpCategory(int code) => code switch
{
    >= 200 and < 300 => "success",
    >= 400 and < 500 => "client error",
    >= 500 and < 600 => "server error",
    _                => "other",
};

// ── Target-typed new ──────────────────────────────────────────────
Dictionary<string, List<int>> map = new();       // type on the left is enough
List<string> names = new(capacity: 100);         // with hint

void Process(List<int> items) { }
Process(new() { 1, 2, 3 });                     // works in arguments too

// ── static lambdas — no closure allocation ────────────────────────
// static prevents accidentally capturing outer variables
var evens = Enumerable.Range(0, 10)
    .Where(static n => n % 2 == 0)   // no closure — no allocation
    .ToList();

// ── Covariant return types ────────────────────────────────────────
abstract class Shape { public abstract Shape Clone(); }
class Circle(double Radius) : Shape
{
    // Returns Circle — callers holding Circle don't need a cast
    public override Circle Clone() => new(Radius);
}`,
    },
    {
      label: 'C# 10 Features',
      language: 'csharp',
      code: `// ── 1. File-scoped namespace (no braces, one indent level saved) ──
namespace MyApp.Services;

public class OrderService { }   // entire file is MyApp.Services

// ── 2. global using (in GlobalUsings.cs) ─────────────────────────
global using System;
global using System.Collections.Generic;
global using System.Linq;
// Implicit usings from SDK (controlled by <ImplicitUsings>enable):
// global using System.IO; global using System.Threading.Tasks; etc.

// ── 3. record struct ──────────────────────────────────────────────
public record struct Vector2(float X, float Y);            // mutable
public readonly record struct Color(byte R, byte G, byte B); // immutable

var v1 = new Vector2(1f, 2f);
var v2 = new Vector2(1f, 2f);
Console.WriteLine(v1 == v2);    // True — value equality like record class

// record struct IS mutable (unlike record class):
v1.X = 5f;                      // compiles — v1 is not readonly
// readonly record struct prevents this mutation

// ── 4. Extended property patterns ────────────────────────────────
public record Address(string City, string Country);
public record Customer(string Name, Address Address);

// C# 10: match nested in one pattern
bool isLondon = customer is { Address.City: "London" };

// Previously required nested braces:
// bool isLondon = customer is { Address: { City: "London" } };

// ── 5. const interpolated strings ─────────────────────────────────
const string AppName  = "DevHub";
const string Version  = "2.0";
const string FullName = \$"{AppName} v{Version}";  // OK — all const

// ── 6. CallerArgumentExpression ──────────────────────────────────
static void Requires(bool condition,
    [System.Runtime.CompilerServices.CallerArgumentExpression("condition")]
    string? expr = null)
{
    if (!condition)
        throw new ArgumentException(\$"Assertion failed: {expr}");
}

int x = -1;
Requires(x > 0);   // throws: "Assertion failed: x > 0"

// ── 7. ArgumentNullException.ThrowIfNull (.NET 6) ─────────────────
void Save(string name)
{
    ArgumentNullException.ThrowIfNull(name);  // auto message: "name"
    // ...
}`,
    },
    {
      label: 'Record inheritance',
      language: 'csharp',
      code: `// ── Record inheritance ────────────────────────────────────────────
public record Animal(string Name, int Age);
public record Dog(string Name, int Age, string Breed) : Animal(Name, Age);

var animal = new Animal("Rex", 3);
var dog    = new Dog("Rex", 3, "Labrador");

// Type-sensitive equality: Dog != Animal even with same property values
Console.WriteLine(animal == dog);                  // False
Console.WriteLine(animal.Equals(dog));             // False

// but within same type:
var dog2 = new Dog("Rex", 3, "Labrador");
Console.WriteLine(dog == dog2);                    // True

// ── with-expression through hierarchy ─────────────────────────────
var renamed = dog with { Name = "Buddy" };         // Dog { Name=Buddy, Age=3, Breed=Labrador }
Console.WriteLine(renamed.GetType().Name);         // Dog — type preserved

// ── Sealed records — lock out further inheritance ─────────────────
public sealed record Point(double X, double Y);
// public record Point3D(double X, double Y, double Z) : Point(X, Y); // CS8880 — cannot extend sealed

// ── Computed properties are excluded from equality ─────────────────
public record Product(string Name, decimal Price)
{
    public decimal PriceWithTax => Price * 1.2m;  // NOT in Equals/GetHashCode
}

var p1 = new Product("Widget", 10m);
var p2 = new Product("Widget", 10m);
Console.WriteLine(p1 == p2);        // True — PriceWithTax ignored
Console.WriteLine(p1.PriceWithTax); // 12 — computed on the fly

// ── Deconstruct in switch ─────────────────────────────────────────
string Describe(Animal a) => a switch
{
    Dog d => \$"Dog: {d.Name} ({d.Breed})",
    _     => \$"Animal: {a.Name}",
};`,
    },
    {
      label: 'Low-level C# 9',
      language: 'csharp',
      code: `using System.Runtime.CompilerServices;
using System.Runtime.InteropServices;

// ── nint / nuint — native-size integers ───────────────────────────
nint  handle = 42;          // IntPtr under the hood; platform-width
nuint size   = 1024;        // UIntPtr

nint result = handle + 8;   // arithmetic works with normal operators
Console.WriteLine(IntPtr.Size == 8
    ? "Running 64-bit" : "Running 32-bit");

// ── Function pointers (unsafe, zero overhead) ─────────────────────
static unsafe void FunctionPointerDemo()
{
    // No delegate allocation — direct call through a pointer
    delegate*<int, int> absPtr = &Math.Abs;
    Console.WriteLine(absPtr(-42));   // 42

    // Managed calling convention (default):
    delegate*<double, double, double> add = &Add;
    Console.WriteLine(add(1.5, 2.5));  // 4.0
}
static double Add(double a, double b) => a + b;

// ── Module initializer ────────────────────────────────────────────
// Called automatically before any code in this assembly runs
internal static class Bootstrap
{
    [ModuleInitializer]
    internal static void Init()
    {
        Console.WriteLine("Module loaded");
        // Register codecs, pre-warm caches, etc.
    }
}

// ── SkipLocalsInit — skip zero-init of locals ─────────────────────
[SkipLocalsInit]
static unsafe void FastStackAlloc()
{
    // We MUST initialise every element ourselves:
    Span<int> buf = stackalloc int[64];
    for (int i = 0; i < buf.Length; i++)
        buf[i] = i * 2;   // explicit init — no zero-fill needed
}

// ── ArgumentNullException.ThrowIfNull (.NET 6) ────────────────────
void ProcessOrder(Order order, string userId)
{
    ArgumentNullException.ThrowIfNull(order);   // "order" in message
    ArgumentNullException.ThrowIfNull(userId);  // "userId" in message
    // Replaces the old: if (x is null) throw new ArgumentNullException(nameof(x));
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Assuming record struct is immutable like record class',
      wrong: `// record class: properties are init-only (immutable by default)
public record class Point(double X, double Y);  // immutable

// record struct: properties are MUTABLE by default
public record struct Vector(float X, float Y);

var v = new Vector(1f, 2f);
v.X = 99f;  // compiles! — record struct is mutable
// Passing to a method may mutate the original's copy unexpectedly`,
      right: `// Use 'readonly record struct' for an immutable value type:
public readonly record struct Vector(float X, float Y);

var v = new Vector(1f, 2f);
// v.X = 99f;  // CS8340 — cannot mutate readonly record struct members`,
      explanation: 'record class generates init-only properties (immutable after construction). record struct does NOT — its properties are mutable by default. If you want an immutable value-type record, use readonly record struct. This is one of the most common C# 10 gotchas for developers coming from record class.',
    },
    {
      title: 'Expecting records in collections to be equal when their contained lists differ',
      wrong: `// 'with' is SHALLOW — lists are copied by reference
public record Order(int Id, List<string> Items);

var o1 = new Order(1, ["Widget", "Gadget"]);
var o2 = new Order(1, ["Widget", "Gadget"]);

// Two different List<string> objects with the same content:
Console.WriteLine(o1 == o2);   // FALSE — List<T> uses reference equality
// The record's generated Equals calls List<T>.Equals which is ReferenceEquals`,
      right: `// Use an immutable collection or an array for value equality:
public record Order(int Id, ImmutableArray<string> Items);

var o1 = new Order(1, ["Widget", "Gadget"]);
var o2 = new Order(1, ["Widget", "Gadget"]);
Console.WriteLine(o1 == o2);   // True — ImmutableArray<T> has value equality`,
      explanation: 'Record equality delegates to each property\'s Equals(). Mutable collection types (List<T>, array) use reference equality, so two records with different list instances but the same contents are not equal. Use ImmutableArray<T>, ImmutableList<T>, or a custom equality comparer. This is a frequent source of "but they look equal!" bugs in record-based domain models.',
    },
    {
      title: 'Confusing init with readonly — init allows object initialiser, readonly does not',
      wrong: `public class Order
{
    // readonly: can only be set in the constructor body
    public readonly string Id;

    // But you cannot do: new Order { Id = "X" }  ← compile error
    // because readonly fields don't support object initialiser syntax
}`,
      right: `public class Order
{
    // init: set in constructor OR object initialiser, immutable after
    public string Id { get; init; } = "";
}

var o = new Order { Id = "ORD-1" };  // OK — object initialiser
// o.Id = "other";                    // CS8852 — immutable after init`,
      explanation: 'readonly fields can only be assigned in a constructor body or field initialiser — they don\'t support the object initialiser syntax. init-only properties do support object initialiser syntax while still preventing post-construction mutation. Use init for properties you want configurable during initialisation but immutable thereafter.',
    },
    {
      title: 'Putting global using directives in files that contain other code',
      wrong: `// OrderService.cs — mixes global using with class definition
global using System.Linq;
global using System.Text.Json;

public class OrderService { … }   // This works but breaks convention
// Developers searching for global usings have to hunt through all files`,
      right: `// GlobalUsings.cs — dedicated file, easy to find and maintain
global using System.Collections.Generic;
global using System.Linq;
global using System.Text.Json;
global using System.Threading.Tasks;
// No other code in this file`,
      explanation: 'global using directives are valid in any .cs file, but the convention is a dedicated GlobalUsings.cs at the project root. This makes the project\'s global namespace easier to audit and avoids confusion when someone searches for which namespaces are implicitly available. Most .NET templates and StyleCop rules enforce this convention.',
    },
    {
      title: 'Expecting with-expressions to deep-copy nested reference types',
      wrong: `public record Order(int Id, Address ShippingAddress);
public record Address(string City);

var addr = new Address("London");
var order1 = new Order(1, addr);
var order2 = order1 with { Id = 2 };

// Both orders reference THE SAME Address object:
Console.WriteLine(ReferenceEquals(order1.ShippingAddress,
                                  order2.ShippingAddress));   // True!
// Mutating the Address (if it were mutable) would affect both orders`,
      right: `// Option 1: make nested types records too — then they're also immutable
// and sharing a reference is safe.

// Option 2: use with when you actually want a new nested object:
var order2 = order1 with
{
    Id = 2,
    ShippingAddress = order1.ShippingAddress with { City = "Manchester" }
};
// Now order2 has a new Address object, order1's is unchanged`,
      explanation: 'The with-expression calls the compiler-generated copy constructor, which copies property values — but reference-type properties are copied by reference, not by value. Two records sharing an inner reference object is usually fine when inner types are also immutable records (sharing is safe). When inner types are mutable, you need explicit nested with-expressions or manual deep-copy logic.',
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'What makes record types different from regular classes in terms of equality?',
      options: [
        'Records use reference equality, just like classes, but with a cleaner syntax',
        'Records generate value-based Equals and GetHashCode based on all their declared properties',
        'Records can only be compared with == if they implement IEquatable<T> manually',
        'Records disable equality comparison to promote immutability',
      ],
      answer: 1,
      explanation: 'The compiler auto-generates <code>Equals()</code>, <code>GetHashCode()</code>, and <code>==</code>/<code>!=</code> for record types based on all primary-constructor parameters and declared <code>{ get; init; }</code> properties. Two separate record instances with the same values are equal.',
    },
    {
      q: 'What is an init-only setter and when can you assign to it?',
      options: [
        'A setter callable only from within the same class',
        'A setter callable during the constructor or an object initialiser — immutable afterwards',
        'A setter that automatically initialises the property to its default value',
        'A setter that runs only once per application lifetime',
      ],
      answer: 1,
      explanation: '<code>init</code> setters (C# 9) allow a property to be set in the constructor body or via object-initialiser syntax (<code>new Config { Host = "db" }</code>), but not reassigned later. This gives flexibility at construction time without ongoing mutability.',
    },
    {
      q: 'What does the "with" expression do for records?',
      options: [
        'It mutates the original record in place and returns void',
        'It creates a shallow copy with specified properties replaced — the original is unchanged',
        'It merges two records by combining their property values',
        'It provides a fluent builder for constructing records step by step',
      ],
      answer: 1,
      explanation: '<code>with</code> calls the compiler-generated copy constructor and then sets the specified properties on the new copy. The original is never modified. Reference-type properties are shallow-copied (same reference), so nested mutable objects are shared.',
    },
    {
      q: 'What is the difference between record class and record struct?',
      options: [
        'record struct supports inheritance, record class does not',
        'record class is immutable by default; record struct is mutable by default — use readonly record struct for immutability',
        'They are identical except record struct uses stack allocation in all cases',
        'record struct cannot use the with-expression',
      ],
      answer: 1,
      explanation: '<code>record class</code> generates <code>init</code>-only properties — immutable after construction. <code>record struct</code> generates regular mutable properties by default. Add <code>readonly</code> to get <code>readonly record struct</code> with immutable properties. Both support value-based equality and <code>with</code>-expressions.',
    },
    {
      q: 'What does a file-scoped namespace declaration achieve?',
      options: [
        'Allows multiple namespaces in one file',
        'Removes one level of indentation from the entire file by using a semicolon instead of braces',
        'Makes all types in the namespace internal by default',
        'It is required for source generators to locate types',
      ],
      answer: 1,
      explanation: '<code>namespace Foo.Bar;</code> applies to the whole file without braces, eliminating one level of indentation. It is semantically identical to wrapping the file in a traditional namespace block. Only one file-scoped namespace per file is permitted.',
    },
    {
      q: 'Why does record equality fail when a property is a List<T>?',
      options: [
        'Records cannot contain collection properties',
        'List<T> uses reference equality, so two records with different list instances — even with same contents — are not equal',
        'The compiler skips collection properties in the generated Equals',
        'You need to add [RecordEquals] to enable collection comparison',
      ],
      answer: 1,
      explanation: 'Record\'s generated <code>Equals</code> delegates to each property\'s own <code>Equals()</code>. <code>List&lt;T&gt;</code> inherits reference equality from <code>object</code> — two separate lists with the same content are not equal. Use <code>ImmutableArray&lt;T&gt;</code> (which has structural equality) or override <code>Equals</code> manually.',
    },
    {
      q: 'What does the static modifier on a lambda or anonymous function prevent?',
      options: [
        'It prevents the lambda from being passed as a parameter',
        'It prevents the lambda from capturing any enclosing variables, eliminating potential closure allocation',
        'It makes the lambda execute on the thread pool',
        'It prevents the lambda from throwing exceptions',
      ],
      answer: 1,
      explanation: '<code>static x => x + 1</code> instructs the compiler that this lambda must capture nothing. Any attempt to reference an outer variable is a compile error. This guarantees no closure object is allocated and documents intent clearly. Useful in LINQ chains on hot paths.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use record vs record struct vs class?',
      a: '<strong>record</strong> (reference type): immutable data transfer objects, domain value objects, API responses, domain events — anything where value equality and non-destructive mutation (<code>with</code>) is the core requirement.<br><br><strong>readonly record struct</strong>: small geometry/colour/measurement types that are also immutable and benefit from stack allocation / no GC.<br><br><strong>record struct</strong> (mutable): rare — you want record convenience (value equality, Deconstruct, ToString) but need mutability. Most often the wrong choice; reach for a plain struct or a class instead.<br><br><strong>class</strong>: when identity matters (two instances are distinct even with same data), when you need rich inheritance hierarchies, or when the type is primarily stateful and behavioural.',
    },
    {
      q: 'How do global usings and implicit usings differ?',
      a: '<strong>Global usings</strong> you write yourself: <code>global using System.Text.Json;</code> in a dedicated file — full control. <strong>Implicit usings</strong> are generated by the .NET SDK based on project type: console apps get <code>System</code>, <code>System.Linq</code>, etc.; web apps additionally get ASP.NET Core namespaces. Both create project-wide <code>using</code> directives. See the generated file in <code>obj/</code> to know exactly what is imported.',
    },
    {
      q: 'Can I use pattern matching and/or/not outside switch expressions?',
      a: 'Yes — anywhere an <code>is</code> expression is valid: <code>if (status is >= 200 and &lt; 300)</code>, <code>if (input is not null and not "")</code>, <code>bool ok = x is int or string;</code>. Precedence: <code>not</code> binds tightest, then <code>and</code>, then <code>or</code>. They also compose in <code>switch</code> arms and can be combined with type/property patterns.',
    },
    {
      q: 'How does record inheritance affect equality?',
      a: 'Record equality is type-sensitive. A <code>Dog</code> record with the same values as an <code>Animal</code> base record is <strong>not</strong> equal to it — the compiler generates a <code>EqualityContract</code> virtual property that includes the runtime type. This prevents the substitution-principle violation of a base and derived instance comparing equal. Seal a record to lock out inheritance and slightly optimise equality checks.',
    },
    {
      q: 'What is CallerArgumentExpression useful for?',
      a: 'It captures the <em>source-code text</em> of a call-site argument as a string filled in by the compiler. The canonical use: assertion helpers and guard clauses — <code>Requires(x &gt; 0)</code> can throw <code>"Assertion failed: x &gt; 0"</code> without you manually writing the string. <code>ArgumentNullException.ThrowIfNull</code> uses this internally to produce <code>"Value cannot be null. (Parameter \'param\')"</code> automatically.',
    },
    {
      q: 'Is the with-expression a deep copy or a shallow copy?',
      a: 'Shallow copy. The compiler-generated copy constructor copies each property\'s value — primitive values are independent copies, but reference-type properties (objects, lists) are copied by reference. Two records then share the same inner object. This is fine when inner types are also immutable records (sharing is safe). When inner objects are mutable, nest <code>with</code>-expressions or perform explicit deep copying.',
    },
    {
      q: 'When would I use nint/nuint over int/long?',
      a: 'For interop with native APIs that use <code>HANDLE</code>, <code>SIZE_T</code>, or pointer-arithmetic values that must match the platform\'s pointer width. The arithmetic operators work naturally on <code>nint</code> without casts to/from <code>IntPtr</code>. Application code almost never needs them directly — they are a tool for P/Invoke and unsafe pointer math, typically in system libraries and source-generated P/Invoke (<code>[LibraryImport]</code>).',
    },
  ];

  challenge: Challenge = {
    title: 'Immutable Domain Model with Records',
    language: 'csharp',
    description: `Model a simple e-commerce order using C# 9/10 features. Requirements: (1) record Address(string Street, string City, string PostCode). (2) record OrderLine(string ProductName, int Quantity, decimal UnitPrice) with a computed property Total. (3) record Order with int Id, string CustomerName, Address ShippingAddress, IReadOnlyList<OrderLine> Lines (all init-only), and a computed decimal GrandTotal. (4) Static method ApplyDiscount(Order order, decimal pct) returns a new Order with all line UnitPrices reduced by pct% using with-expressions. (5) Two Orders with identical values must compare equal (==).`,
    hints: [
      'Positional record: public record Address(string Street, string City, string PostCode);',
      'Add a computed property in the record body: public decimal Total => Quantity * UnitPrice;',
      'For Order, use a non-positional record so you can mix init properties and computed properties',
      'In ApplyDiscount: order with { Lines = order.Lines.Select(l => l with { UnitPrice = ... }).ToList() }',
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
    public int                      Id              { get; init; }
    public string                   CustomerName    { get; init; } = "";
    public Address                  ShippingAddress { get; init; } = new("", "", "");
    public IReadOnlyList<OrderLine> Lines           { get; init; } = [];
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

// Test:
var addr = new Address("1 High St", "London", "EC1A");
var lines = new List<OrderLine>
{
    new("Widget", 2, 9.99m),
    new("Gadget", 1, 49.99m),
};
var order1 = new Order { Id = 1, CustomerName = "Alice", ShippingAddress = addr, Lines = lines };
var order2 = new Order { Id = 1, CustomerName = "Alice", ShippingAddress = addr, Lines = lines };

Console.WriteLine(order1 == order2);   // True — value equality (same list reference)
Console.WriteLine(order1.GrandTotal);  // 69.97
var discounted = OrderService.ApplyDiscount(order1, 10);
Console.WriteLine(discounted.GrandTotal);  // 62.973`,
  };

  revision: RevisionSummary = {
    oneLiner: 'C# 9 introduced records (value-based equality, with-expressions, init setters), logical pattern combinators (and/or/not), and target-typed new; C# 10 added record struct, file-scoped namespaces, global usings, extended property patterns, and CallerArgumentExpression.',
    mustKnow: [
      'Records generate value-based <code>Equals</code>/<code>GetHashCode</code>/<code>==</code> from declared properties; computed properties are excluded',
      '<code>init</code> setters allow assignment in constructors and object initialisers but not afterwards — enabling flexible construction with post-construction immutability',
      '<code>with</code>-expression is a <strong>shallow copy</strong> — reference-type nested properties share the same object; safe when nested types are also immutable',
      '<code>record struct</code> is mutable by default; use <code>readonly record struct</code> for immutable value-type records',
      'Record equality is type-sensitive — a base record and its derived record are never equal even with identical values',
      'File-scoped namespace (<code>namespace Foo.Bar;</code>) removes one level of indentation from the entire file; global using applies a directive project-wide',
      '<code>static</code> lambdas capture nothing — no closure allocation; <code>static n => n * 2</code> is both an optimisation and a documentation hint',
    ],
    interviewFocus: [
      'What is the difference between a record and a class? Between record class and record struct?',
      'Why might record equality fail when the record contains a List<T> property?',
      'What does the with-expression produce — deep copy or shallow copy?',
      'What is an init-only setter, and how does it differ from readonly?',
      'How does record inheritance affect equality checks?',
    ],
  };
}
