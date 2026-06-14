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
  selector: 'app-csharp-whats-new-11-12',
  standalone: true,
  imports: [
    CommonModule,
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
    CommonMistakesComponent, RevisionCardComponent,
  ],
  templateUrl: './whats-new-11-12.html',
  styleUrl: './whats-new-11-12.scss',
})
export class CsharpWhatsNew1112 {

  quickRef: QuickRefItem[] = [
    { name: 'required',                    type: 'keyword',    desc: 'C# 11. Forces callers to set a property in an object initialiser. Compile error if omitted. Works with init or set.', since: 'C# 11' },
    { name: 'Raw string literals """',     type: 'syntax',     desc: 'C# 11. Triple-quoted strings that need no escaping. Content between """ ... """ is literal. Supports interpolation with $"""...""".', since: 'C# 11' },
    { name: 'Generic math / INumber<T>',   type: 'interface',  desc: 'C# 11. Static abstract interface members enable numeric algorithms generic over int, double, decimal, etc.', since: 'C# 11' },
    { name: 'List patterns',               type: 'syntax',     desc: 'C# 11. Match array/list content: [1, 2, ..] matches a list starting with 1 and 2. [var head, ..] captures the first element.', since: 'C# 11' },
    { name: 'static abstract (interface)', type: 'keyword',    desc: 'C# 11. Interface members can be static and abstract/virtual. Enables operator overloading and factory methods in interfaces.', since: 'C# 11' },
    { name: 'u8 string literals',          type: 'syntax',     desc: 'C# 11. Append u8 to a string literal to get ReadOnlySpan<byte> of UTF-8 bytes at compile time: "hello"u8', since: 'C# 11' },
    { name: 'file (access modifier)',      type: 'keyword',    desc: 'C# 11. Type is only visible within the file it is declared in. Ideal for source-generator helpers and internal implementation types.', since: 'C# 11' },
    { name: 'scoped',                      type: 'keyword',    desc: 'C# 11. Limits the lifetime of a ref or Span<T> parameter to prevent it from escaping the current method scope.', since: 'C# 11' },
    { name: 'Primary constructors',        type: 'syntax',     desc: 'C# 12. Constructor parameters in the class/struct declaration. Parameters are in scope throughout the whole type body.', since: 'C# 12' },
    { name: 'Collection expressions []',   type: 'syntax',     desc: 'C# 12. Uniform syntax for all collection types: [1,2,3] for List<T>, arrays, Span<T>, etc. Supports spread ..', since: 'C# 12' },
    { name: 'Default lambda parameters',   type: 'syntax',     desc: 'C# 12. Lambda expressions can now have default parameter values: var greet = (string name = "World") => $"Hello {name}";', since: 'C# 12' },
    { name: 'using alias any type',        type: 'syntax',     desc: 'C# 12. using MyPoint = (int X, int Y); aliases any type including tuples, pointers, and arrays.', since: 'C# 12' },
    { name: 'ref readonly parameters',     type: 'keyword',    desc: 'C# 12. Pass by reference but guarantee the callee will not modify the value. Stricter than in, more explicit than ref.', since: 'C# 12' },
    { name: '[InlineArray(n)]',            type: 'decorator',  desc: 'C# 12. Struct attribute enabling fixed-size stack-allocated buffers used by Span<T> and the runtime — replaces stackalloc for fixed-size arrays.', since: 'C# 12' },
    { name: 'Experimental interceptors',   type: 'decorator',  desc: 'C# 12 (experimental). Redirect a specific method call site to a different implementation at compile time. Used by source generators.', since: 'C# 12' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'C# 11 — required members and raw string literals',
      points: [
        'The <code>required</code> modifier on a property forces every caller to supply a value via an object initialiser or via a constructor annotated with <code>[SetsRequiredMembers]</code>. The compiler produces a compile error if any required member is omitted at a creation site.',
        '<code>required</code> works with both <code>set</code> and <code>init</code> properties, and also with fields. Unlike constructor parameters, required member names are explicit at the call site — <code>new User { Email = "a@b.com" }</code> — which improves readability and tooling support.',
        'Raw string literals (<code>"""..."""</code>) eliminate the need to escape backslashes, double-quotes, and newlines. Indentation of the closing delimiter determines how much leading whitespace is stripped from each line, keeping code indented naturally.',
        'Interpolated raw string literals use <code>$"""..."""</code>. To include a literal <code>{</code>, use <code>{{</code>. For JSON/SQL that heavily uses curly braces, use <code>$$"""..."""</code> where <code>\$\${expr}</code> is the interpolation syntax and single <code>{</code> is literal.',
        'UTF-8 string literals (<code>"hello"u8</code>) produce a <code>ReadOnlySpan&lt;byte&gt;</code> of the UTF-8-encoded bytes <em>at compile time</em> — zero allocation, zero runtime encoding overhead. Ideal for HTTP headers, serialisation format strings, or any API that expects UTF-8 bytes.',
      ],
    },
    {
      heading: 'C# 11 — generic math and static abstract interface members',
      points: [
        'Static abstract interface members allow interfaces to declare static methods, operators, and properties that implementing types must provide. The implementing type, not an instance, supplies the member.',
        '<code>INumber&lt;T&gt;</code> (in <code>System.Numerics</code>) builds on this: it groups <code>+</code>, <code>-</code>, <code>*</code>, <code>/</code>, <code>T.Zero</code>, <code>T.One</code>, <code>T.CreateChecked</code>, etc. into a single constraint. A single <code>Sum&lt;T&gt;</code> method works for <code>int</code>, <code>double</code>, <code>decimal</code>, and any custom numeric type without boxing.',
        'List patterns match the content of arrays and list-like collections in <code>switch</code> and <code>is</code> expressions. <code>[1, 2, ..]</code> matches any sequence starting with 1 and 2; <code>[var head, ..var rest]</code> captures the first element and the remaining slice.',
        'The pattern <code>[.., var last]</code> matches the last element of any sequence without knowing its length. Combined with positional and property patterns, list patterns enable exhaustive structural deconstruction of data.',
        'Checked arithmetic operators can now be defined on user types via <code>checked</code> operator overloads. The CLR invokes the checked version when the enclosing context is <code>checked { }</code> — enabling overflow-safe custom numeric types consistent with <code>int</code> semantics.',
      ],
    },
    {
      heading: 'C# 11 — file-local types and lifetime keywords',
      points: [
        'The <code>file</code> access modifier declares a type visible only within the single source file where it is defined. It cannot be referenced from any other file, including test projects — enforcing strict encapsulation without touching <code>internal</code> or <code>private</code> members of a class.',
        '<code>file</code> types are the idiomatic home for source-generator helper types and single-file implementation details. When a source generator emits a helper class, <code>file</code> prevents naming collisions across multiple generated files in the same compilation.',
        'The <code>scoped</code> keyword restricts the lifetime of a <code>ref</code>, <code>ref readonly</code>, or <code>Span&lt;T&gt;</code> parameter — the compiler ensures it cannot be stored in a field or returned from the method. This allows the runtime to safely allocate a <code>Span</code> on the stack without ref-safety analysis failing.',
        '<code>scoped ref</code> and <code>scoped Span&lt;T&gt;</code> parameters are already implicit in many positions, but the explicit keyword documents intent and unlocks additional optimisations in high-performance code where lifetime tracking matters.',
        'Nameof now works inside attribute arguments: <code>[NotNullWhen(nameof(result))]</code>, previously requiring string literals or constants. This integrates name-tracking with nullable analysis annotations more ergonomically.',
      ],
    },
    {
      heading: 'C# 12 — primary constructors for classes and structs',
      points: [
        'Primary constructors extend the syntax that records already had to regular <code>class</code> and <code>struct</code> types: <code>public class OrderService(IRepo repo, ILogger logger)</code>. The parameters are in scope throughout the entire type body — methods, properties, and field initialisers.',
        'For <strong>classes</strong>, primary constructor parameters are <em>not</em> automatically promoted to properties. The compiler captures them in backing fields only when they are referenced in a method or property body. To expose them publicly, you must write the property yourself.',
        'Primary constructors are especially ergonomic for dependency injection: no separate private field declarations and no constructor assignment boilerplate — just reference the parameters wherever needed.',
        'You may define additional constructors, but they must chain to the primary constructor with <code>this(…)</code>. This ensures the primary constructor parameters are always initialised regardless of which overload is called.',
        'Structs with primary constructors follow the same rules. A <code>readonly struct</code> with a primary constructor can expose parameters as <code>readonly</code> properties while keeping the body clean.',
      ],
    },
    {
      heading: 'C# 12 — collection expressions and spread',
      points: [
        'Collection expressions (<code>[1, 2, 3]</code>) provide a single unified syntax for creating arrays (<code>int[]</code>), <code>List&lt;T&gt;</code>, <code>Span&lt;T&gt;</code>, <code>ReadOnlySpan&lt;T&gt;</code>, <code>ImmutableArray&lt;T&gt;</code>, and any type that implements the <code>[CollectionBuilder]</code> pattern.',
        'The spread element (<code>..</code>) splices an existing collection inline: <code>[..list1, ..list2, extra]</code>. The compiler emits efficient code that may pre-allocate the correct size — often faster than multiple <code>AddRange</code> calls.',
        'Empty collection expressions (<code>[]</code>) infer the target type from context — replacing <code>Array.Empty&lt;T&gt;()</code>, <code>Enumerable.Empty&lt;T&gt;()</code>, and <code>new List&lt;T&gt;()</code> with a concise, type-inferred alternative.',
        '<code>using</code> aliases can now name any type, not just named class/struct types: <code>using Point = (int X, int Y);</code>, <code>using Matrix = float[,];</code>, <code>using Callback = Action&lt;string, int&gt;;</code>. Complex or verbose type signatures become readable identifiers.',
        'Default lambda parameters (<code>(int x, int y = 10) =&gt; x + y</code>) and <code>ref readonly</code> parameters round out the ergonomic improvements. <code>ref readonly</code> passes large structs by reference while explicitly preventing mutation at the call site, avoiding the silent defensive copies that <code>in</code> can produce.',
      ],
    },
    {
      heading: 'C# 12 — inline arrays and interceptors',
      points: [
        'Inline arrays (<code>[InlineArray(n)]</code> on a single-field struct) create a fixed-size, stack-allocated buffer that the runtime can index with standard array syntax. They underpin the performance of <code>Span&lt;T&gt;</code> over small fixed buffers in the runtime itself.',
        'An inline array struct holds <em>n</em> elements of its field\'s type contiguously in memory. You read and write via <code>span[i]</code> after casting with <code>MemoryMarshal</code> — zero heap allocation, cache-friendly layout.',
        'Interceptors (experimental in C# 12, stabilising in C# 13) allow a source generator to redirect a specific call site — identified by file path and line — to a different static method. This enables compile-time specialisation without AOP frameworks or IL weaving.',
        'The primary use of interceptors is Minimal API source generation: the runtime\'s <code>[GeneratedCode]</code> interceptors replace reflective parameter binding with source-generated type-safe binding, contributing to the startup-time improvements in .NET 8+ web apps.',
        'These low-level features — inline arrays, interceptors — are primarily for framework authors and source-generator writers, not everyday application code. Understanding them explains why .NET 8 minimal APIs start faster and allocate less than .NET 6 equivalents.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'C# 11 Features',
      language: 'csharp',
      code: `// ── 1. required members ──────────────────────────────────────────
public class UserDto
{
    public required string Email    { get; init; }
    public required string UserName { get; init; }
    public string?         Bio      { get; init; }  // optional
}

// OK:
var dto = new UserDto { Email = "a@b.com", UserName = "alice" };

// COMPILE ERROR — Email and UserName are required:
// var bad = new UserDto { Bio = "dev" };

// Constructor that satisfies required members:
public class UserDto2
{
    [System.Diagnostics.CodeAnalysis.SetsRequiredMembers]
    public UserDto2(string email, string userName)
    {
        Email    = email;
        UserName = userName;
    }
    public required string Email    { get; init; }
    public required string UserName { get; init; }
}

// ── 2. Raw string literals ────────────────────────────────────────
// No escaping needed for \\ or "
string json = """
    {
        "name": "Alice",
        "scores": [1, 2, 3]
    }
    """;

// Interpolated raw string:
string name = "Bob";
string msg  = \$"""
    Hello, {name}!
    Your account was created on {DateTime.UtcNow:yyyy-MM-dd}.
    """;

// Use $$ for JSON with lots of {} — \$\${expr} is the hole, single { is literal
string template = $$"""
    { "id": \$\${Guid.NewGuid()} }
    """;

// ── 3. List patterns ──────────────────────────────────────────────
int[] data = [1, 2, 3, 4, 5];

string desc = data switch
{
    []                    => "empty",
    [var only]            => \$"single: {only}",
    [var h, ..var tail]   => \$"head={h}, {tail.Length} more",
};
// desc = "head=1, 4 more"

bool startsWith12 = data is [1, 2, ..];    // true
bool exactly3     = data is [_, _, _];     // false (5 elements)

// Capture last element:
string last = data is [.., var l] ? \$"last={l}" : "empty";  // last=5

// ── 4. UTF-8 string literals ──────────────────────────────────────
// Zero allocation — produces ReadOnlySpan<byte> at compile time
ReadOnlySpan<byte> httpOk     = "HTTP/1.1 200 OK\r\n"u8;
ReadOnlySpan<byte> jsonHeader = "Content-Type: application/json\r\n"u8;`,
    },
    {
      label: 'Generic Math',
      language: 'csharp',
      code: `using System.Numerics;

// ── 1. Generic numeric algorithm using INumber<T> ─────────────────
// Works with int, long, double, decimal, float, BigInteger, etc.
public static T Sum<T>(IEnumerable<T> values) where T : INumber<T>
{
    T total = T.Zero;
    foreach (var v in values)
        total += v;
    return total;
}

Console.WriteLine(Sum(new[] { 1, 2, 3 }));           // 6 (int)
Console.WriteLine(Sum(new[] { 1.5, 2.5, 3.0 }));     // 7 (double)
Console.WriteLine(Sum(new[] { 1m, 2.5m, 0.5m }));    // 4 (decimal)

// ── 2. Generic average ────────────────────────────────────────────
public static double Average<T>(IEnumerable<T> values) where T : INumber<T>
{
    var list  = values.ToList();
    T   sum   = T.Zero;
    foreach (var v in list) sum += v;
    return double.CreateChecked(sum) / list.Count;
}

// ── 3. Static abstract interface member — custom numeric type ──────
public interface IAddable<T> where T : IAddable<T>
{
    static abstract T operator +(T a, T b);
    static abstract T Zero { get; }
}

public readonly struct Celsius : IAddable<Celsius>
{
    public double Value { get; }
    public Celsius(double v) => Value = v;

    public static Celsius operator +(Celsius a, Celsius b) => new(a.Value + b.Value);
    public static Celsius Zero => new(0);
    public override string ToString() => \$"{Value}°C";
}

// ── 4. Checked operator overloads (C# 11) ────────────────────────
// Define separate checked/unchecked versions for overflow handling
public readonly struct Saturating
{
    public int Value { get; }
    public Saturating(int v) => Value = v;

    // Checked: throws on overflow (used in checked { } context)
    public static checked Saturating operator +(Saturating a, Saturating b)
        => new(checked(a.Value + b.Value));

    // Unchecked: wraps on overflow (used in unchecked { } context, the default)
    public static Saturating operator +(Saturating a, Saturating b)
        => new(unchecked(a.Value + b.Value));

    public override string ToString() => Value.ToString();
}

// ── 5. IMinMaxValue<T> / Clamp ────────────────────────────────────
public static T Clamp<T>(T value, T min, T max) where T : INumber<T>
    => T.Clamp(value, min, max);

int clamped = Clamp(150, 0, 100);      // 100
double cd   = Clamp(-5.0, 0.0, 1.0);  // 0.0`,
    },
    {
      label: 'C# 12 Features',
      language: 'csharp',
      code: `// ── 1. Primary constructors ───────────────────────────────────────
// Parameters are in scope throughout the entire class body
public class OrderService(IOrderRepository repo, ILogger<OrderService> logger)
{
    public async Task<Order?> GetOrderAsync(int id, CancellationToken ct)
    {
        logger.LogInformation("Fetching order {Id}", id);
        return await repo.GetByIdAsync(id, ct);
    }

    // Expose as a property if needed:
    public IOrderRepository Repository => repo;
}

// Also works on structs:
public struct Point3D(float x, float y, float z)
{
    public float X => x;
    public float Y => y;
    public float Z => z;
    public float Length => MathF.Sqrt(x*x + y*y + z*z);
}

// ── 2. Collection expressions ─────────────────────────────────────
int[]         arr  = [1, 2, 3];
List<string>  list = ["a", "b", "c"];
Span<int>     span = [10, 20, 30];

// Spread operator ..:
int[] first  = [1, 2, 3];
int[] second = [4, 5, 6];
int[] all    = [..first, ..second, 7];  // [1,2,3,4,5,6,7]

// Empty collection:
List<int> empty = [];

// ── 3. Default lambda parameters ──────────────────────────────────
var greet = (string name = "World") => \$"Hello, {name}!";

Console.WriteLine(greet());          // Hello, World!
Console.WriteLine(greet("Alice"));   // Hello, Alice!

// ── 4. using alias for any type ───────────────────────────────────
using Point     = (int X, int Y);
using Matrix2x2 = (float A, float B, float C, float D);
using Callback  = System.Action<string, int>;

Point     p = (3, 4);
Matrix2x2 m = (1f, 0f, 0f, 1f);  // identity

// ── 5. ref readonly parameters ────────────────────────────────────
// Pass by reference (avoids copying large structs) but caller's value is unchanged
static float Dot(ref readonly Vector3 a, ref readonly Vector3 b)
    => a.X * b.X + a.Y * b.Y + a.Z * b.Z;

var v1 = new Vector3(1, 0, 0);
var v2 = new Vector3(0, 1, 0);
float dot = Dot(ref v1, ref v2);   // 0 — perpendicular

record struct Vector3(float X, float Y, float Z);`,
    },
    {
      label: 'file & scoped (C# 11)',
      language: 'csharp',
      code: `// ── file access modifier ─────────────────────────────────────────
// Visible ONLY within this .cs file — not even in the same project
file class JsonDeserializer
{
    // Implementation detail; no risk of namespace collision with other files
    public static T? Deserialize<T>(string json) =>
        System.Text.Json.JsonSerializer.Deserialize<T>(json);
}

// Source generators use file classes to emit helper types without
// polluting the user's namespace:
//   file class MyGenerator_Helper { ... }   // in generated output
//   file class AnotherGenerator_Helper { } // in a second generated file
// Both are named differently but file-scoped so no clash.

// file classes can nest inside each other:
file class Outer
{
    file class Inner { }  // visible only within this file
}

// ── scoped — limit Span<T> lifetime ──────────────────────────────
// Without scoped: compiler must assume span could escape; restricts optimisations
// With scoped: compiler guarantees span cannot outlive the method

static void FillBuffer(scoped Span<byte> buffer)
{
    // buffer cannot be stored in a field or returned — compiler enforces this
    buffer.Fill(0xFF);
}

// Allow stack-allocated Span to be passed without unsafe blocks
Span<byte> buf = stackalloc byte[64];
FillBuffer(buf);   // Safe — scoped guarantees no escape

// ── scoped ref ────────────────────────────────────────────────────
static ref readonly int First(scoped ref readonly int[] arr)
{
    // arr is scoped — cannot be stored; safe to return ref to element
    return ref arr[0];
}

// ── nameof in attribute arguments (C# 11) ─────────────────────────
using System.Diagnostics.CodeAnalysis;

class Validator
{
    // Previously required a string literal; nameof works now:
    public bool TryGetValue([NotNullWhen(true)] out string? result)
    {
        result = "hello";
        return true;
    }
}`,
    },
    {
      label: 'Inline Arrays (C# 12)',
      language: 'csharp',
      code: `using System.Runtime.CompilerServices;
using System.Runtime.InteropServices;

// ── Inline array struct ────────────────────────────────────────────
// A fixed-size stack-allocated buffer, indexed like a regular array.
// The type must be a struct with exactly one field.
[InlineArray(16)]
public struct Buffer16<T>
{
    private T _element;  // the single required field
}

// Usage — just use array indexing syntax:
Buffer16<int> buf = default;
for (int i = 0; i < 16; i++)
    buf[i] = i * i;

Console.WriteLine(buf[3]);   // 9
Console.WriteLine(buf[7]);   // 49

// ── Span<T> from inline array ─────────────────────────────────────
// The runtime knows the size — MemoryMarshal can create a Span over it
Buffer16<float> floats = default;
Span<float> span = MemoryMarshal.CreateSpan(ref floats[0], 16);
span.Fill(1.0f);   // initialise all 16 floats to 1.0

// ── Why this matters ──────────────────────────────────────────────
// Before inline arrays, fixed-size buffers required:
//   stackalloc (unsafe only)
//   unsafe fixed (requires unsafe context)
//   arrays on the heap (GC allocation)
//
// Inline arrays give you heap-free fixed-size buffers in safe code.
// The .NET runtime itself uses them internally for small collections
// (e.g., the Vector128<T> type is backed by an inline array of 4 floats).

// ── Practical example: a fast 4-element SIMD-style vector ─────────
[InlineArray(4)]
public struct Float4
{
    private float _f;
}

public static Float4 Add(Float4 a, Float4 b)
{
    Float4 result = default;
    for (int i = 0; i < 4; i++)
        result[i] = a[i] + b[i];
    return result;
}

var a = new Float4(); a[0] = 1; a[1] = 2; a[2] = 3; a[3] = 4;
var b = new Float4(); b[0] = 5; b[1] = 6; b[2] = 7; b[3] = 8;
var c = Add(a, b);
// c[0]=6, c[1]=8, c[2]=10, c[3]=12  — all on the stack, no allocation`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Forgetting [SetsRequiredMembers] on a constructor that sets required members',
      wrong: `public class Config
{
    public required string Host { get; init; }
    public required int    Port { get; init; }

    // Missing [SetsRequiredMembers] — compiler still requires object initialiser
    public Config(string host, int port)
    {
        Host = host;
        Port = port;
    }
}

// CS9035: required member Host must be set — even though constructor sets it!
var c = new Config("localhost", 5432);`,
      right: `using System.Diagnostics.CodeAnalysis;

public class Config
{
    public required string Host { get; init; }
    public required int    Port { get; init; }

    [SetsRequiredMembers]   // tells compiler: this constructor satisfies all required members
    public Config(string host, int port)
    {
        Host = host;
        Port = port;
    }
}

var c = new Config("localhost", 5432);  // OK — no object initialiser needed`,
      explanation: 'The compiler tracks required member satisfaction at call sites. Without [SetsRequiredMembers], it assumes the constructor leaves required members unset and demands object initialiser syntax at every call site. Add the attribute to any constructor that provably assigns all required members, so factory methods and simple constructors work without boilerplate.',
    },
    {
      title: 'Assuming primary constructor parameters are automatically public properties',
      wrong: `// Class primary constructor (C# 12)
public class Product(string name, decimal price);

// Expecting to access p.Name and p.Price — they do NOT exist
var p = new Product("Widget", 9.99m);
Console.WriteLine(p.Name);   // CS1061 — 'Product' has no definition for 'Name'`,
      right: `// Records auto-generate properties from primary constructor parameters
public record ProductRecord(string Name, decimal Price);  // Has .Name and .Price

// For classes, you must declare the properties yourself:
public class Product(string name, decimal price)
{
    public string  Name  => name;
    public decimal Price => price;
}

var p = new Product("Widget", 9.99m);
Console.WriteLine(p.Name);   // Widget`,
      explanation: 'This is the most common C# 12 primary constructor mistake. For record types, primary constructor parameters automatically become public init-only properties — that was true since C# 9. For class and struct types, primary constructor parameters (C# 12) are only compiler-generated backing fields referenced in the body — they are not public. You must explicitly declare a property or field if you want external access.',
    },
    {
      title: 'Using raw string literal indentation incorrectly — unexpected whitespace in output',
      wrong: `// Closing """ is at column 0 — NO indentation stripping!
string json = """
{
    "name": "Alice"
}
""";
// Output:
// {
//     "name": "Alice"
// }
// ← This is what you wanted, but the string ALSO starts with a newline
// and each line starts at column 0 (no trimming because """ is at column 0)`,
      right: `// Indent the closing """ to match your code indentation.
// Compiler strips THAT many leading spaces from every line.
string json = """
    {
        "name": "Alice"
    }
    """;  // ← closing """ at 4-space indent: 4 leading spaces stripped per line
// Result (no extra whitespace):
// {
//     "name": "Alice"
// }`,
      explanation: 'The indentation of the closing triple-quote determines the base indentation stripped from all content lines. If the closing """ is at column 0, no whitespace is stripped — each line retains its full indentation including the method\'s indentation. Indent the closing """ to match the surrounding code block for clean, correctly-stripped output.',
    },
    {
      title: 'Calling primary constructor parameters from a static member',
      wrong: `public class Cache(int maxSize)
{
    // Primary constructor parameters are instance-scoped.
    // A static method CANNOT access them — they don't exist in static context.
    public static Cache CreateDefault()
    {
        return new Cache(maxSize);  // CS0120 — 'maxSize' requires an instance
    }
}`,
      right: `public class Cache(int maxSize)
{
    // Create a const or static field for static defaults:
    private const int DefaultSize = 100;

    public static Cache CreateDefault() => new(DefaultSize);

    // Instance members can use maxSize normally:
    private readonly object?[] _store = new object?[maxSize];
}`,
      explanation: 'Primary constructor parameters are instance-level — they are captured into compiler-generated instance backing fields. They are not accessible in static methods, static fields, or static property initialisers. Move defaults to static/const fields and pass them through normal parameters or constants.',
    },
    {
      title: 'Using list patterns in switch without handling all structural cases (missing exhaustiveness)',
      wrong: `// Parser that only handles some patterns — falls through to exception:
int[] cmd = GetCommand();

string result = cmd switch
{
    [1, var arg]     => \$"cmd1 with {arg}",
    [2, var a, var b] => \$"cmd2 with {a},{b}",
    // Missing: empty list, single-element, three+ elements — runtime exception!
};`,
      right: `int[] cmd = GetCommand();

string result = cmd switch
{
    []               => "no-op",
    [1, var arg]     => \$"cmd1 with {arg}",
    [2, var a, var b] => \$"cmd2 with {a},{b}",
    [var code, ..]   => \$"unknown command {code}",
    // OR use a discard arm:
    // _ => "unknown"
};`,
      explanation: 'Switch expressions with list patterns must be exhaustive. A switch that only handles specific lengths or first-element values will throw SwitchExpressionException at runtime for any unmatched input. Always add a trailing discard arm (<code>_ => …</code>) or a slice pattern (<code>[var head, ..]</code>) to catch remaining cases. The compiler warns about non-exhaustive switches but not always for lists.',
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'What does the "required" keyword enforce in C# 11?',
      options: [
        'The property must be set in the constructor body, not in an object initialiser',
        'The property must be set during object initialisation (constructor or object initialiser), causing a compile error if omitted',
        'The property cannot be null at runtime and throws NullReferenceException if accessed unset',
        'The property is validated by the CLR at runtime',
      ],
      answer: 1,
      explanation: '<code>required</code> is a compile-time constraint. The compiler ensures every call site that creates an instance of the type sets all required members — either via object initialiser or via a constructor annotated with <code>[SetsRequiredMembers]</code>. It does not affect runtime behaviour.',
    },
    {
      q: 'What is the purpose of static abstract interface members in C# 11?',
      options: [
        'They allow static classes to implement interfaces',
        'They let interfaces define static methods and operators that implementing types must provide, enabling generic algorithms over numeric or comparable types',
        'They make interface methods faster by avoiding virtual dispatch',
        'They allow calling interface methods without creating an instance',
      ],
      answer: 1,
      explanation: 'Static abstract interface members enable the <strong>generic math</strong> pattern. An interface can declare <code>static abstract T operator +(T a, T b)</code> and implementing types like <code>int</code> or <code>double</code> provide the implementation. This lets you write a single <code>Sum&lt;T&gt;</code> method that works for all numeric types without boxing or runtime dispatch.',
    },
    {
      q: 'What does the spread operator (..) do inside a C# 12 collection expression?',
      options: [
        'It creates a shallow copy of the collection',
        'It flattens/splices an existing collection inline into the new collection being constructed',
        'It generates all values between two bounds, like a range',
        'It matches remaining elements in a list pattern, acting as a discard',
      ],
      answer: 1,
      explanation: 'The spread element (<code>..</code>) inside a collection expression (<code>[a, ..b, c]</code>) splices all elements of <code>b</code> into the new collection at that position. The compiler emits efficient code that may pre-calculate the total size. It works across arrays, <code>List&lt;T&gt;</code>, <code>Span&lt;T&gt;</code>, and any supported collection type.',
    },
    {
      q: 'How do primary constructors in C# 12 differ from record primary constructors?',
      options: [
        'Class primary constructors auto-generate public properties; record primary constructors do not',
        'Record primary constructors auto-generate init-only properties; class/struct primary constructors only scope the parameters for use in the body — no auto-properties are created',
        'They are identical — primary constructors behave the same in both records and classes',
        'Class primary constructors are sealed; record primary constructors can be overridden',
      ],
      answer: 1,
      explanation: 'For <code>record</code> types, each positional primary constructor parameter automatically becomes a public <code>init</code>-only property. For <code>class</code> and <code>struct</code> types (C# 12), the parameters are in scope throughout the body but no public properties are generated — you write them manually if needed.',
    },
    {
      q: 'What does the "file" access modifier do in C# 11?',
      options: [
        'The type is compiled into a separate file at build time',
        'The type is only visible within the single source file where it is declared — not accessible from any other file in the project',
        'The type is marked as file-system-safe (no special characters in names)',
        'The type can only be serialised to a file',
      ],
      answer: 1,
      explanation: 'The <code>file</code> access modifier (C# 11) creates a type that is entirely private to its containing source file. It cannot be referenced from any other file, even within the same project. This is the primary mechanism for source generators to emit helper types without risking naming collisions with types in other generated files.',
    },
    {
      q: 'What does "u8" do when appended to a C# 11 string literal?',
      options: [
        'It encodes the string as Unicode-8 characters (8-bit Unicode)',
        'It produces a ReadOnlySpan<byte> containing the UTF-8 bytes of the string, computed at compile time with zero allocation',
        'It creates a read-only string with 8-byte alignment',
        'It restricts the string to the first 8 characters',
      ],
      answer: 1,
      explanation: 'The <code>u8</code> suffix (<code>"hello"u8</code>) instructs the compiler to encode the string literal as UTF-8 bytes and expose them as a <code>ReadOnlySpan&lt;byte&gt;</code>. The encoding happens at compile time — no runtime allocation, no runtime <code>Encoding.UTF8.GetBytes()</code> call. Used for HTTP headers, binary formats, and any API that needs UTF-8 byte buffers.',
    },
    {
      q: 'What is the difference between ref readonly and "in" parameters?',
      options: [
        'ref readonly allows mutation; in does not',
        'Both prevent mutation, but ref readonly requires the call site to use the "ref" keyword explicitly, making the by-reference pass visible, while "in" can silently create a defensive copy if the argument is not already a variable',
        'in passes by reference; ref readonly passes by value with a copy',
        'They are identical in C# 12',
      ],
      answer: 1,
      explanation: 'Both <code>in</code> and <code>ref readonly</code> prevent callee mutation. The difference is at the call site: <code>in</code> accepts lvalues and rvalues (and silently copies rvalues), while <code>ref readonly</code> requires the caller to write <code>ref</code>, making the by-reference intent explicit and preventing the silent defensive copies that <code>in</code> can trigger when passed a temporary or constant.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between raw string literals and regular string literals?',
      a: 'Regular string literals require backslash escaping for special characters (<code>\\\\</code>, <code>\\"</code>, <code>\\n</code>) and cannot span multiple lines without <code>@</code>.<br><br><strong>Raw string literals</strong> (C# 11) use three or more double-quote delimiters. Content between the opening and closing <code>"""</code> is taken literally — no escaping needed. The indentation of the closing <code>"""</code> determines how much leading whitespace is stripped from each line, keeping code indented naturally.<br><br>They are ideal for JSON, SQL, XML, HTML, and regex patterns. For strings that contain curly braces (like JSON), use <code>$$"""..."""</code> where <code>\$\${expr}</code> is the interpolation syntax and a single <code>{</code> is literal.',
    },
    {
      q: 'When should I use collection expressions vs List<T> initialiser syntax?',
      a: 'Collection expressions (<code>[1, 2, 3]</code>) are a universal syntax introduced in C# 12. They work for arrays, <code>List&lt;T&gt;</code>, <code>Span&lt;T&gt;</code>, <code>ReadOnlySpan&lt;T&gt;</code>, <code>ImmutableArray&lt;T&gt;</code>, and custom types with <code>[CollectionBuilder]</code>.<br><br>Use collection expressions when:<br>- You want a consistent syntax regardless of the target collection type<br>- You are using the spread operator <code>..</code> to combine collections<br>- You want to create empty collections concisely: <code>[]</code> instead of <code>Array.Empty&lt;T&gt;()</code><br><br>The old initialiser syntax (<code>new List&lt;int&gt; { 1, 2, 3 }</code>) still works. Prefer collection expressions in new code for consistency.',
    },
    {
      q: 'How do list patterns differ from other C# patterns?',
      a: 'List patterns (C# 11) match the <em>structure and content</em> of arrays and list-like collections in <code>switch</code> and <code>is</code> expressions.<br><br>Key syntax:<br>- <code>[]</code> — matches an empty sequence<br>- <code>[1, 2, 3]</code> — matches exactly the sequence 1, 2, 3<br>- <code>[var head, ..]</code> — captures the first element; <code>..</code> matches the rest<br>- <code>[.., var last]</code> — captures the last element<br>- <code>[var first, ..var rest]</code> — captures first and the remaining slice<br><br>They are particularly useful for parsing command-line arguments, protocol messages, or any scenario where position matters.',
    },
    {
      q: 'What is the difference between ref readonly, in, and ref parameters?',
      a: 'All three pass an argument by reference (no struct copy), but with different mutation guarantees:<br><br><strong>ref</strong>: callee can read AND write. Caller must use <code>ref</code> at the call site.<br><br><strong>in</strong> (C# 7.2): callee can only read. Compiler may create a temporary defensive copy if the argument is a property, constant, or rvalue. Caller does not need to write <code>in</code>.<br><br><strong>ref readonly</strong> (C# 12): callee can only read. Like <code>in</code>, but the call site must write <code>ref</code>, making the by-reference intent explicit and preventing the silent defensive copy that <code>in</code> can produce.<br><br>Use <code>ref readonly</code> when you have large readonly structs and want zero-copy semantics to be visible and enforced at the call site.',
    },
    {
      q: 'What are file-local types and when should I use them?',
      a: 'The <code>file</code> access modifier (C# 11) declares a type that is visible <em>only within the source file</em> where it is defined — not from any other file in the project, even if they are in the same namespace or assembly.<br><br>Use <code>file</code> types when:<br>- You are writing a source generator that emits helper classes — <code>file</code> prevents naming collisions between multiple generated files<br>- You have a single-file implementation detail that must never be leaked to consumers<br>- You want stronger encapsulation than <code>private</code> nested classes without needing a wrapper class<br><br>It is not appropriate for types shared across files or APIs intended for external consumers.',
    },
    {
      q: 'When should I prefer primary constructors over explicit constructors?',
      a: 'Primary constructors (C# 12) are most ergonomic for <strong>dependency injection</strong> and <strong>simple data-holding classes</strong> where the constructor does nothing except capture parameters. Instead of declaring private fields and writing assignment boilerplate, you just reference the parameter names in the body.<br><br>Stick with explicit constructors when:<br>- The constructor has non-trivial logic (validation, transformation, event subscription)<br>- You need to control whether a parameter becomes a field (primary constructor always captures if used in the body)<br>- You need to chain multiple overloaded constructors with different logic<br>- The type has a lot of state unrelated to constructor parameters<br><br>Primary constructors and explicit constructors can coexist — additional constructors must chain to the primary with <code>this(…)</code>.',
    },
    {
      q: 'What are inline arrays and what problem do they solve?',
      a: 'Inline arrays (<code>[InlineArray(n)]</code> on a single-field struct) declare a fixed-size buffer that lives inside the struct itself — on the stack for stack-allocated instances, or embedded in the heap object for heap-allocated ones. No separate heap allocation for the buffer.<br><br>They solve the problem of needing a small, fixed-size array without GC pressure or <code>unsafe</code> code. Before inline arrays, your options were: heap-allocated <code>T[]</code>, <code>stackalloc</code> (unsafe context), or manually unrolled fields.<br><br>In practice, inline arrays are a framework-author feature — the runtime uses them inside <code>Vector128&lt;T&gt;</code>, <code>Vector256&lt;T&gt;</code>, and various internal collections. Application code rarely needs them directly, but understanding them explains why .NET\'s SIMD types are allocation-free.',
    },
  ];

  challenge: Challenge = {
    title: 'Generic Statistics Calculator',
    description: 'Use C# 11 generic math to implement a reusable Statistics<T> class. Requirements: (1) Constrain T with INumber<T>. (2) Implement Sum(IEnumerable<T>) → T. (3) Implement Average(IEnumerable<T>) → double. (4) Implement Min(IEnumerable<T>) → T. (5) Implement Max(IEnumerable<T>) → T. (6) Implement StdDev(IEnumerable<T>) → double (population standard deviation). (7) Verify it works with int[], double[], and decimal[] without code changes.',
    language: 'csharp',
    hints: [
      'Constraint: where T : INumber<T>',
      'Use T.Zero as the starting sum; T supports += operator',
      'For double conversion use: double.CreateChecked(value)',
      'StdDev: compute mean, then sqrt of average squared deviation',
    ],
    starterCode: `using System.Numerics;

public static class Statistics<T> where T : INumber<T>
{
    public static T Sum(IEnumerable<T> values)
    {
        throw new NotImplementedException();
    }

    public static double Average(IEnumerable<T> values)
    {
        throw new NotImplementedException();
    }

    public static T Min(IEnumerable<T> values)
    {
        throw new NotImplementedException();
    }

    public static T Max(IEnumerable<T> values)
    {
        throw new NotImplementedException();
    }

    public static double StdDev(IEnumerable<T> values)
    {
        throw new NotImplementedException();
    }
}`,
    solution: `using System.Numerics;

public static class Statistics<T> where T : INumber<T>
{
    public static T Sum(IEnumerable<T> values)
    {
        T total = T.Zero;
        foreach (var v in values) total += v;
        return total;
    }

    public static double Average(IEnumerable<T> values)
    {
        var list  = values.ToList();
        T   sum   = T.Zero;
        foreach (var v in list) sum += v;
        return double.CreateChecked(sum) / list.Count;
    }

    public static T Min(IEnumerable<T> values) => values.Aggregate(T.Min);

    public static T Max(IEnumerable<T> values) => values.Aggregate(T.Max);

    public static double StdDev(IEnumerable<T> values)
    {
        var list = values.ToList();
        double mean = Average(list);
        double variance = list
            .Select(v => double.CreateChecked(v) - mean)
            .Select(d => d * d)
            .Average();
        return Math.Sqrt(variance);
    }
}

// Usage:
Console.WriteLine(Statistics<int>.Sum([1, 2, 3, 4, 5]));           // 15
Console.WriteLine(Statistics<double>.Average([1.0, 2.0, 3.0]));    // 2.0
Console.WriteLine(Statistics<decimal>.Min([3m, 1m, 2m]));          // 1
Console.WriteLine(Statistics<int>.StdDev([2, 4, 4, 4, 5, 5, 7, 9])); // 2.0`,
  };

  revision: RevisionSummary = {
    oneLiner: 'C# 11 added required members, raw string literals, generic math (INumber<T>), list patterns, u8 literals, and file-local types; C# 12 added primary constructors for classes, collection expressions with spread, inline arrays, and ref readonly parameters.',
    mustKnow: [
      '<code>required</code> enforces compile-time property initialisation at object creation sites — pair with <code>[SetsRequiredMembers]</code> on any constructor that sets all required members',
      'Raw string literals (<code>"""..."""</code>) need no escaping; closing-delimiter indentation controls whitespace stripping; use <code>$$"""..."""</code> for JSON/SQL with literal <code>{</code> characters',
      '<code>INumber&lt;T&gt;</code> and static abstract interface members enable one generic implementation of <code>Sum</code>, <code>Average</code>, <code>Clamp</code>, etc. that works across all built-in numeric types',
      'Class primary constructors (C# 12) do NOT auto-generate properties — that is record behaviour only; class parameters are scoped captures, not public API',
      'Collection expressions (<code>[]</code>) unify array, list, Span, and ImmutableArray creation; spread (<code>..</code>) splices collections inline; empty collection is just <code>[]</code>',
      '<code>file</code> access modifier (C# 11) makes a type visible only within its source file — the source generator pattern for collision-free helper types',
      '<code>ref readonly</code> parameters (C# 12) pass by reference without mutation, making the by-ref intent explicit at the call site and avoiding the silent defensive copies that <code>in</code> can create',
    ],
    interviewFocus: [
      'Explain how generic math works in C# 11 — what problem does INumber<T> solve and how does it use static abstract interface members?',
      'What is the difference between record primary constructors and class primary constructors in C# 12?',
      'How do raw string literals handle indentation and what is the double-dollar ($$) form for?',
      'What does the spread operator (..) do inside a collection expression?',
      'Explain the difference between ref, in, and ref readonly parameters — when would you choose each?',
    ],
  };
}
