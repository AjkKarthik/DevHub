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
  selector: 'app-csharp-whats-new-11-12',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './whats-new-11-12.html',
  styleUrl: './whats-new-11-12.scss',
})
export class CsharpWhatsNew1112 {

  quickRef: QuickRefItem[] = [
    { name: 'required',                    type: 'keyword',    desc: 'C# 11. Forces callers to set a property in an object initialiser. Compile error if omitted. Works with init or set.' },
    { name: 'Raw string literals """',     type: 'syntax',     desc: 'C# 11. Triple-quoted strings that need no escaping. Content between \"\"\" ... \"\"\" is literal. Supports interpolation with $"""...""".' },
    { name: 'Generic math / INumber<T>',   type: 'interface',  desc: 'C# 11. Static abstract interface members enable numeric algorithms generic over int, double, decimal, etc.' },
    { name: 'List patterns',               type: 'syntax',     desc: 'C# 11. Match array/list content: [1, 2, ..] matches a list starting with 1 and 2. [var head, ..] captures the first element.' },
    { name: 'static abstract (interface)', type: 'keyword',    desc: 'C# 11. Interface members can be static and abstract/virtual. Enables operator overloading and factory methods in interfaces.' },
    { name: 'u8 string literals',          type: 'syntax',     desc: 'C# 11. Append u8 to a string literal to get ReadOnlySpan<byte> of UTF-8 bytes at compile time: "hello"u8' },
    { name: 'Primary constructors',        type: 'syntax',     desc: 'C# 12. Constructor parameters in the class/struct declaration. Parameters are in scope throughout the whole type body.' },
    { name: 'Collection expressions []',   type: 'syntax',     desc: 'C# 12. Uniform syntax for all collection types: [1,2,3] for List<T>, arrays, Span<T>, etc. Supports spread ..' },
    { name: 'Default lambda parameters',   type: 'syntax',     desc: 'C# 12. Lambda expressions can now have default parameter values: var greet = (string name = "World") => \$"Hello {name}";' },
    { name: 'using alias any type',        type: 'syntax',     desc: 'C# 12. using MyPoint = (int X, int Y); aliases any type including tuples, pointers, and arrays.' },
    { name: 'ref readonly parameters',     type: 'keyword',    desc: 'C# 12. Pass by reference but guarantee the callee will not modify the value. Stricter than in, more explicit than ref.' },
    { name: 'Experimental interceptors',   type: 'decorator',  desc: 'C# 12 (experimental). Redirect a specific method call site to a different implementation at compile time. Used by source generators.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'C# 11 — required members and raw strings',
      points: [
        'The <code>required</code> modifier on a property forces every caller to supply a value via an object initialiser. Unlike a constructor parameter, the property name is explicit at the call site — great for readability and tooling support.',
        '<code>required</code> works with both <code>set</code> and <code>init</code> properties. Use <code>[SetsRequiredMembers]</code> on a constructor to tell the compiler the constructor already handles all required members.',
        'Raw string literals (<code>"""...</code><code>"""</code>) eliminate the need to escape backslashes, quotes, and newlines. The indentation of the closing delimiter trims leading whitespace from each line.',
        'Interpolated raw string literals use <code>$"""..."""</code>. To embed a literal <code>{</code> in the output, use <code>{{</code>. For JSON/SQL that heavily uses curly braces, use <code>$$"""..."""</code> and <code>\$\${expr}</code>.',
      ],
    },
    {
      heading: 'C# 11 — generic math and static abstracts',
      points: [
        'Static abstract interface members allow interfaces to define static methods, operators, and properties that implementing types must provide. This enables truly generic numeric algorithms.',
        '<code>INumber&lt;T&gt;</code> (in <code>System.Numerics</code>) is the flagship example. It lets you write <code>T Sum&lt;T&gt;(T[] values) where T : INumber&lt;T&gt;</code> that works for <code>int</code>, <code>double</code>, <code>decimal</code>, etc.',
        'List patterns match the content of arrays and collections in switch expressions: <code>[1, 2, ..]</code> matches any sequence starting with 1 and 2. <code>[var first, ..]</code> captures the first element.',
        'UTF-8 string literals (<code>"hello"u8</code>) produce a <code>ReadOnlySpan&lt;byte&gt;</code> at compile time — zero allocation, perfect for writing HTTP headers or serialisation code that needs UTF-8 bytes.',
      ],
    },
    {
      heading: 'C# 12 — primary constructors',
      points: [
        'Primary constructors bring the constructor parameters directly into the class/struct declaration: <code>public class Service(ILogger logger, IRepo repo)</code>. The parameters are in scope for the entire type body.',
        'Primary constructor parameters are <em>not</em> automatically properties — they are captured in a compiler-generated backing field only if used inside a method or property body. To expose them, write a property explicitly.',
        'This feature is especially ergonomic for dependency injection: instead of declaring private fields and a constructor body to assign them, you reference the parameters directly.',
        'For records, primary constructors already existed (they generated properties). For classes, primary constructors generate a regular constructor but no automatic properties.',
      ],
    },
    {
      heading: 'C# 12 — collection expressions and more',
      points: [
        'Collection expressions (<code>[1, 2, 3]</code>) provide a single syntax for initialising <code>T[]</code>, <code>List&lt;T&gt;</code>, <code>Span&lt;T&gt;</code>, <code>ImmutableArray&lt;T&gt;</code>, and any type with a <code>[CollectionBuilder]</code> attribute.',
        'The spread operator (<code>..</code>) inside a collection expression flattens another collection inline: <code>[..list1, ..list2, extraItem]</code>.',
        '<code>using</code> aliases can now alias any type, not just named types: <code>using Matrix = float[,];</code>, <code>using Point = (int X, int Y);</code>. This improves readability for complex type signatures.',
        'Default lambda parameters (<code>(string s = "default") => s.ToUpper()</code>) and <code>ref readonly</code> parameters round out C# 12\'s ergonomic improvements for everyday code.',
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

// Use $$ for JSON with lots of {} — {{ means literal {, \$\${expr} is the interpolation
string template = $$"""
    { "id": \$\${Guid.NewGuid()} }
    """;

// ── 3. List patterns ──────────────────────────────────────────────
int[] data = [1, 2, 3, 4, 5];

string desc = data switch
{
    []              => "empty",
    [var only]      => \$"single: {only}",
    [var h, .. var tail] => \$"head={h}, {tail.Length} more",
};
// desc = "head=1, 4 more"

bool startsWith12 = data is [1, 2, ..];    // true
bool exactly3     = data is [_, _, _];     // false (5 elements)

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
    T   sum   = T.Zero;
    int count = 0;
    foreach (var v in values) { sum += v; count++; }
    // Convert T to double via INumber<T>.CreateChecked
    return double.CreateChecked(sum) / count;
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

// ── 4. IMinMaxValue<T> — another generic math interface ───────────
public static T Clamp<T>(T value, T min, T max) where T : INumber<T>
    => T.Clamp(value, min, max);

int clamped = Clamp(150, 0, 100);    // 100
double cd   = Clamp(-5.0, 0.0, 1.0); // 0.0`,
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

var add = (int a, int b = 10) => a + b;
Console.WriteLine(add(5));      // 15
Console.WriteLine(add(5, 3));   // 8

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
  ];

  challenge: Challenge = {
    title: 'Generic Statistics Calculator',
    description: `Use C# 11 generic math to implement a reusable Statistics<T> class.

Requirements:
1. Constrain T with INumber<T>
2. Implement: Sum(IEnumerable<T>) → T
3. Implement: Average(IEnumerable<T>) → double
4. Implement: Min(IEnumerable<T>) → T (use T.MinValue comparison or LINQ)
5. Implement: Max(IEnumerable<T>) → T
6. Implement: StdDev(IEnumerable<T>) → double (population standard deviation)
7. Verify it works with int[], double[], and decimal[] without code changes`,
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
      explanation: '<code>required</code> is a compile-time constraint. The compiler ensures every call site that creates an instance of the type sets all required members — either via object initialiser or via a constructor annotated with <code>[SetsRequiredMembers]</code>. It does not affect runtime behaviour; it is purely a developer-facing API contract enforced by the compiler.',
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
        'It marks the remaining elements of a list pattern, equivalent to the discard _',
      ],
      answer: 1,
      explanation: 'The spread element (<code>..</code>) inside a collection expression (<code>[a, ..b, c]</code>) splices all elements of <code>b</code> into the new collection at that position. For example: <code>[..first, ..second]</code> creates a new collection containing all elements from <code>first</code> followed by all elements from <code>second</code>. It works across arrays, <code>List&lt;T&gt;</code>, <code>Span&lt;T&gt;</code>, and any supported collection type.',
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
      explanation: 'For <code>record</code> types, each positional primary constructor parameter automatically becomes a public <code>init</code>-only property. For <code>class</code> and <code>struct</code> types (C# 12), the parameters are simply in scope throughout the class body — they are captured in compiler-generated backing fields only if used, but no public properties are generated. You must write the properties yourself if you want them.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between raw string literals and regular string literals?',
      a: `Regular string literals require backslash escaping for special characters (<code>\\\\</code>, <code>\\"</code>, <code>\\n</code>) and cannot span multiple lines without <code>@</code>.<br><br>
<strong>Raw string literals</strong> (C# 11) use three or more double-quote delimiters. Content between the opening and closing <code>"""</code> is taken literally — no escaping needed. Leading whitespace up to the indent of the closing <code>"""</code> is stripped, making multi-line strings clean and readable in code.<br><br>
They are ideal for JSON, SQL, XML, HTML, and regex patterns. For strings that contain curly braces (like JSON), use <code>$$"""..."""</code> and require <code>\$\${expr}</code> for interpolation, so that single <code>{</code> is treated literally.`,
    },
    {
      q: 'When should I use collection expressions vs List<T> initialiser syntax?',
      a: `Collection expressions (<code>[1, 2, 3]</code>) are a new universal syntax introduced in C# 12. They work for arrays, <code>List&lt;T&gt;</code>, <code>Span&lt;T&gt;</code>, <code>ReadOnlySpan&lt;T&gt;</code>, <code>ImmutableArray&lt;T&gt;</code>, and custom types with <code>[CollectionBuilder]</code>.<br><br>
Use collection expressions when:<br>
- You want a consistent syntax regardless of the target collection type<br>
- You are using the spread operator <code>..</code> to combine collections<br>
- You want to create empty collections concisely: <code>[]</code> instead of <code>Array.Empty&lt;T&gt;()</code><br><br>
The old initialiser syntax (<code>new List&lt;int&gt; { 1, 2, 3 }</code>) still works. Prefer collection expressions in new code for consistency and brevity.`,
    },
    {
      q: 'How do list patterns differ from other C# patterns?',
      a: `List patterns (C# 11) match the <em>structure and content</em> of arrays and lists in switch expressions and is-expressions.<br><br>
Key syntax:<br>
- <code>[]</code> — matches an empty sequence<br>
- <code>[1, 2, 3]</code> — matches exactly the sequence 1, 2, 3<br>
- <code>[var head, ..]</code> — captures the first element; <code>..</code> matches the rest (discard)<br>
- <code>[.., var last]</code> — captures the last element<br>
- <code>[var first, ..var rest]</code> — captures first and the remaining slice<br><br>
They are particularly useful for parsing command-line arguments, protocol messages, or any scenario where position matters. The <code>..</code> slice pattern also works in <code>System.Range</code> indexing contexts.`,
    },
    {
      q: 'What is the difference between ref readonly, in, and ref parameters?',
      a: `All three pass an argument by reference (no copy), but with different mutation guarantees:<br><br>
<strong>ref</strong>: callee can read AND write. Caller must use <code>ref</code> at the call site.<br><br>
<strong>in</strong> (C# 7.2): callee can only read. Pass by reference to avoid copying large structs. The compiler may create a temporary if the argument is not already a variable.<br><br>
<strong>ref readonly</strong> (C# 12): callee can only read. Like <code>in</code>, but the call site must also use <code>ref</code> explicitly, making it clearer to readers that a reference is being passed. Avoids silent defensive copies that <code>in</code> can create.<br><br>
Use <code>ref readonly</code> when you have large readonly structs and want the no-copy guarantee to be explicit and visible at the call site.`,
    },
  ];
}
