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
  selector: 'app-csharp-tuples',
  standalone: true,
  imports: [
    CommonModule, CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
    CommonMistakesComponent, RevisionCardComponent,
  ],
  templateUrl: './tuples.html',
  styleUrl: './tuples.scss',
})
export class CsharpTuples {

  quickRef: QuickRefItem[] = [
    { name: '(T1, T2)',           type: 'syntax',    desc: 'ValueTuple literal — lightweight, stack-allocated. Supports named fields and deconstruction.', since: 'C# 7' },
    { name: 'named fields',       type: 'syntax',    desc: '(string Name, int Age) — access via name at compile time; runtime only sees Item1/Item2.', since: 'C# 7' },
    { name: 'var (x, y) =',      type: 'syntax',    desc: 'Deconstruction — unpacks tuple fields or any Deconstruct() method into local variables.', since: 'C# 7' },
    { name: 'Discard _',          type: 'keyword',   desc: 'Placeholder to skip an element during deconstruction. Not a variable — compiler ignores it.', since: 'C# 7' },
    { name: '(x, y) = (y, x)',   type: 'syntax',    desc: 'Tuple swap — swaps two variables without a temporary variable in a single expression.', since: 'C# 7' },
    { name: 'Tuple<T1,T2>',       type: 'class',     desc: 'Legacy heap-allocated tuple class. Avoid in modern C# — prefer ValueTuple.', since: '.NET 1' },
    { name: 'anonymous type',     type: 'type',      desc: 'new { Name = x } — compiler-generated immutable type. Use inside LINQ only; cannot cross method boundaries.', since: 'C# 3' },
    { name: 'record',             type: 'keyword',   desc: 'Named, serialization-friendly, reflection-visible immutable type. Prefer over tuples for public APIs.', since: 'C# 9' },
    { name: 'ITuple',             type: 'interface', desc: 'Interface implemented by ValueTuple — enables generic tuple handling and indexer access.', since: 'C# 7.3' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'ValueTuple: the modern tuple',
      points: [
        'C# 7 introduced <code>ValueTuple</code>, a <em>value type</em> (struct) stored on the stack — fast and GC-friendly for transient multi-value returns.',
        'Syntax is concise: <code>(int x, int y) point = (3, 4);</code> or <code>var point = (X: 3, Y: 4);</code>. The compiler infers the tuple type.',
        'Named fields are purely a compiler feature — at runtime they are still <code>Item1</code>/<code>Item2</code>. Reflection and JSON serializers only see the underlying field names.',
        'The old <code>Tuple&lt;T&gt;</code> class (pre-C# 7) is a reference type, heap-allocated, accessed only via <code>.Item1</code>/<code>.Item2</code>. Avoid it in all new code.',
        'Tuple equality: <code>ValueTuple</code> implements <code>IEquatable&lt;T&gt;</code> — two tuples with the same element values are equal. <code>(1, "a") == (1, "a")</code> is true.',
      ],
    },
    {
      heading: 'Deconstruction and discards',
      points: [
        'Deconstruction unpacks a tuple into variables in one step: <code>var (name, age) = GetPerson();</code> — no need to access <code>.Item1</code> or <code>.Item2</code>.',
        'Deconstruct into existing variables: <code>(name, age) = GetPerson();</code> — omit <code>var</code> when the variables are already declared.',
        'Use the discard <code>_</code> to skip elements: <code>var (name, _) = GetPerson();</code> — multiple discards in the same expression are allowed.',
        'Any type with a <code>Deconstruct(out T1 a, out T2 b)</code> method — including records, custom classes, and extension methods — supports this syntax.',
        'Swap two variables without a temporary: <code>(a, b) = (b, a);</code> — the compiler generates efficient IL for this common pattern.',
      ],
    },
    {
      heading: 'Anonymous types',
      points: [
        'Anonymous types (<code>new { Name = x, Age = y }</code>) are compiler-generated sealed classes with read-only properties and value-based <code>Equals</code>.',
        'They are most useful inside LINQ <code>select</code> projections where you need a temporary shaped object that does not leave the method.',
        'Anonymous types cannot be returned from methods (except as <code>object</code> or <code>dynamic</code>), passed easily to other methods, or serialized reliably.',
        'Anonymous types have structural equality within the same assembly — two instances with the same property names, types, and values in the same order are considered equal.',
        'In practice, anonymous types are mostly a LINQ-era feature. In modern C#, named tuples or records are usually clearer and more type-safe replacements.',
      ],
    },
    {
      heading: 'Tuple vs anonymous type vs record',
      points: [
        '<strong>Tuple</strong>: best for internal/private method returns. Lightweight, no ceremony. Named fields vanish at runtime — invisible to JSON serializers and reflection.',
        '<strong>Anonymous type</strong>: best inside a single method or LINQ query for temporary reshaping. Cannot cross method boundaries without losing the type.',
        '<strong>Record</strong>: best when the shape needs a name, lives in a public API, needs serialization, or will be reused. Works with reflection, JSON, and pattern matching.',
        'Rule of thumb: tuple for quick internal returns; anonymous type for LINQ projections; record for anything public, shared, or persistent.',
        'Prefer records over tuples on any boundary that crosses assembly lines, is part of a public API, or appears in test assertions — the named type makes intent clear.',
      ],
    },
    {
      heading: 'Returning multiple values — design guidelines',
      points: [
        'Before tuples existed, common workarounds were <code>out</code> parameters, custom classes, or <code>KeyValuePair&lt;K,V&gt;</code>. Tuples replace all of these for simple cases.',
        'Limit tuple arity to 2–3 elements. Beyond that, the return type becomes hard to read and a record with named properties is almost always clearer.',
        'Use descriptive field names even for internal tuples — <code>(bool Success, string Error)</code> is far clearer than <code>(bool, string)</code>.',
        '<code>out</code> parameters are still preferred when the return value signals success/failure and the caller often ignores the out value: <code>int.TryParse</code> is the canonical example.',
        'For long-lived results (stored in a field, returned from a public method, added to a collection) always use a record or class — the GC-less benefit of ValueTuple is only meaningful for short-lived call-stack temporaries.',
      ],
    },
    {
      heading: 'Tuple equality and performance',
      points: [
        '<code>ValueTuple</code> implements <code>IEquatable&lt;(T1, T2)&gt;</code> and <code>IComparable</code> — tuples can be compared with <code>==</code>, <code>!=</code>, <code><</code>, <code>></code>, and used as dictionary keys or in sorted collections.',
        'Comparison is element-by-element left to right: <code>(1, "b") > (1, "a")</code> is true because string "b" > "a" after the first element ties.',
        'ValueTuple is a struct, so assigning a tuple creates a copy — mutations to one copy do not affect the original. This is safe and expected for value types.',
        'For very tight loops returning thousands of values per second, a <code>ValueTuple</code> avoids a heap allocation that <code>Tuple&lt;T&gt;</code> or a record class would incur.',
        'In practice, the allocation difference only matters in hot paths measured by a profiler. For most code, readability (record over tuple) outweighs micro-performance concerns.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Basic Tuples',
      language: 'csharp',
      code: `// ── Tuple declaration ──────────────────────────────────────────────────
(string Name, int Age) person = ("Alice", 30);
Console.WriteLine(person.Name);   // Alice
Console.WriteLine(person.Age);    // 30

// ── var inference with named fields ────────────────────────────────────
var point = (X: 10, Y: 20);
Console.WriteLine($"{point.X}, {point.Y}");  // 10, 20

// ── Without names — Item1 / Item2 fallback ─────────────────────────────
(int, string) pair = (42, "hello");
Console.WriteLine(pair.Item1);   // 42
Console.WriteLine(pair.Item2);   // hello

// ── Returning multiple values from a method ────────────────────────────
static (bool Success, string Message, int Code) TryParse(string input)
{
    if (int.TryParse(input, out int n))
        return (true, "Parsed OK", n);
    return (false, "Not a number", -1);
}

var result = TryParse("42");
Console.WriteLine(result.Success);   // True
Console.WriteLine(result.Code);      // 42

// ── Tuple equality ─────────────────────────────────────────────────────
var t1 = (Name: "Alice", Score: 95);
var t2 = (Name: "Alice", Score: 95);
Console.WriteLine(t1 == t2);   // True — ValueTuple has value equality

// Named fields are a compile-time alias — runtime type is ValueTuple<string, int>
// JSON serialization will produce { "Item1": "Alice", "Item2": 95 } NOT { "Name": "Alice" }`,
    },
    {
      label: 'Deconstruction & Discards',
      language: 'csharp',
      code: `// ── Basic deconstruction ──────────────────────────────────────────────
static (string Name, int Age, string City) GetUser() =>
    ("Bob", 25, "London");

var (name, age, city) = GetUser();
Console.WriteLine($"{name} is {age} from {city}");

// ── Discard unwanted fields with _ ─────────────────────────────────────
var (userName, _, userCity) = GetUser();   // age discarded
Console.WriteLine($"{userName} lives in {userCity}");

// ── Deconstruct into existing variables (no var) ───────────────────────
string n;
int a;
(n, a, _) = GetUser();
Console.WriteLine($"{n}: {a}");

// ── Records also support deconstruction ────────────────────────────────
public record Point(int X, int Y);

var p = new Point(3, 7);
var (px, py) = p;
Console.WriteLine($"{px}, {py}");   // 3, 7

// ── Swap variables using tuple deconstruction ──────────────────────────
int x = 1, y = 2;
(x, y) = (y, x);   // clean swap — no temporary variable
Console.WriteLine($"x={x}, y={y}");  // x=2, y=1

// ── Custom Deconstruct method on a class ──────────────────────────────
public class Rectangle
{
    public int Width  { get; init; }
    public int Height { get; init; }
    public void Deconstruct(out int w, out int h) => (w, h) = (Width, Height);
}

var rect = new Rectangle { Width = 10, Height = 5 };
var (w, h) = rect;   // works because of Deconstruct
Console.WriteLine($"Area = {w * h}");   // Area = 50`,
    },
    {
      label: 'Anonymous Types & LINQ',
      language: 'csharp',
      code: `var products = new[]
{
    new { Name = "Widget",    Price = 9.99m,  Category = "Tools"       },
    new { Name = "Gadget",    Price = 24.99m, Category = "Electronics" },
    new { Name = "Doohickey", Price = 4.49m,  Category = "Tools"       },
};

// ── LINQ projection into anonymous type ────────────────────────────────
var summary = products
    .Where(p => p.Price < 20m)
    .Select(p => new { p.Name, Discounted = p.Price * 0.9m });

foreach (var item in summary)
    Console.WriteLine($"{item.Name}: {item.Discounted:C}");
// Widget: £8.99
// Doohickey: £4.04

// ── Group into anonymous type ───────────────────────────────────────────
var grouped = products
    .GroupBy(p => p.Category)
    .Select(g => new
    {
        Category = g.Key,
        Count    = g.Count(),
        Total    = g.Sum(p => p.Price),
    });

foreach (var g in grouped)
    Console.WriteLine($"{g.Category}: {g.Count} items, {g.Total:C}");

// ── Anonymous type equality — structural, within same assembly ─────────
var a1 = new { Name = "Alice", Age = 30 };
var a2 = new { Name = "Alice", Age = 30 };
Console.WriteLine(a1.Equals(a2));  // True — same shape + values

// ── Cannot easily return anonymous type — return as named type instead ──
// Bad: static object GetProjection() => new { Name = "x" };  // caller gets object
// Good: use a record
public record ProductSummary(string Name, decimal Discounted);
static ProductSummary Project(dynamic p) => new(p.Name, p.Price * 0.9m);`,
    },
    {
      label: 'Tuple vs Record',
      language: 'csharp',
      code: `// ── Tuple: quick internal return — lightweight ────────────────────────
static (double Min, double Max, double Avg) Stats(IEnumerable<double> data)
{
    var list = data.ToList();
    return (list.Min(), list.Max(), list.Average());
}

var (min, max, avg) = Stats([1.0, 2.0, 3.0, 4.0, 5.0]);
Console.WriteLine($"Min={min} Max={max} Avg={avg}");
// Min=1 Max=5 Avg=3

// ── Record: named, reusable, serializable ─────────────────────────────
public record StatsResult(double Min, double Max, double Avg);

static StatsResult StatsAsRecord(IEnumerable<double> data)
{
    var list = data.ToList();
    return new StatsResult(list.Min(), list.Max(), list.Average());
}

var stats = StatsAsRecord([1.0, 2.0, 3.0, 4.0, 5.0]);
Console.WriteLine(stats);       // StatsResult { Min = 1, Max = 5, Avg = 3 }
Console.WriteLine(stats.Min);   // 1

// ── Old Tuple<T> class — avoid in new code ─────────────────────────────
Tuple<string, int> legacy = Tuple.Create("Alice", 30);
Console.WriteLine(legacy.Item1);  // Alice — no named fields, heap-allocated

// ── Named fields disappear at runtime ─────────────────────────────────
(string Name, int Age) t = ("Alice", 30);

// At runtime, this is ValueTuple<string, int>:
object boxed = t;
// ((ValueTuple<string,int>)boxed).Item1 works; .Name does NOT

// JSON serialization produces: {"Item1":"Alice","Item2":30}  — NOT {"Name":"Alice"}
// Use a record if JSON keys must match property names`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Tuple named fields invisible to JSON serializers — Item1/Item2 in the output',
      wrong: `// Returning a tuple from an API endpoint / serializing it
static (string Name, int Age) GetPerson() => ("Alice", 30);

var person = GetPerson();
var json = JsonSerializer.Serialize(person);
// json = {"Item1":"Alice","Item2":30}   ← Name and Age are lost!
// Consumer gets Item1/Item2 — tuple field names exist only at compile time`,
      right: `// Use a record — properties survive serialization
public record PersonDto(string Name, int Age);

static PersonDto GetPerson() => new("Alice", 30);

var json = JsonSerializer.Serialize(GetPerson());
// json = {"Name":"Alice","Age":30}   ← correct`,
      explanation: 'ValueTuple field names (Name, Age) are a compiler-only feature stored in attributes, not in the runtime type. System.Text.Json, Newtonsoft.Json, and reflection all see the underlying ValueTuple<string, int> with Item1/Item2. For any JSON, API, or cross-boundary data, use a record or class with proper named properties.',
    },
    {
      title: 'Using the legacy Tuple<T> class in new code instead of ValueTuple',
      wrong: `// Old Tuple<T> — verbose, heap-allocated, no named fields, no deconstruction
public Tuple<string, int, bool> GetStatus()
{
    return Tuple.Create("Alice", 30, true);
}

var result = GetStatus();
Console.WriteLine(result.Item1);  // only Item1/Item2/Item3 available`,
      right: `// ValueTuple — concise, stack-allocated, named fields, deconstruction
public (string Name, int Age, bool IsActive) GetStatus() =>
    ("Alice", 30, true);

var (name, age, active) = GetStatus();
Console.WriteLine(name);   // Alice
// OR access by name:
var status = GetStatus();
Console.WriteLine(status.Name);   // Alice`,
      explanation: 'Tuple<T> (the class) was the pre-C# 7 solution. It is heap-allocated (GC pressure), has no named fields (only Item1/Item2), does not support deconstruction, and is verbose to create. ValueTuple (the struct) is the modern replacement — stack-allocated, supports named fields, deconstruction, and direct == equality.',
    },
    {
      title: 'Returning more than 3-4 tuple elements — a record is clearer',
      wrong: `// Hard to read — what does each position mean?
static (string, int, bool, decimal, DateTime, string) GetOrder() =>
    ("Alice", 42, true, 149.99m, DateTime.Now, "Express");

// Caller has to count positions or read the return type carefully
var (customer, id, isPaid, amount, date, shipping) = GetOrder();`,
      right: `// Named record — self-documenting, reusable, no position-counting needed
public record OrderSummary(
    string    Customer,
    int       Id,
    bool      IsPaid,
    decimal   Amount,
    DateTime  PlacedAt,
    string    ShippingMethod);

static OrderSummary GetOrder() =>
    new("Alice", 42, true, 149.99m, DateTime.Now, "Express");

var order = GetOrder();
Console.WriteLine(order.Customer);   // Alice`,
      explanation: 'Tuples with more than 2-3 elements become hard to read and maintain — adding a field shifts all positions. When a return value has 4+ parts, give it a name by creating a record. The self-documenting field names, pattern matching support, and reusability far outweigh the small allocation cost.',
    },
    {
      title: 'Mutating a tuple copy thinking it changes the original',
      wrong: `var original = (X: 10, Y: 20);
var copy = original;   // value type — full copy on assignment

copy.X = 99;           // ERROR: ValueTuple fields are writable, but this is a copy!
// Alternatively: modifying 'copy' NEVER affects 'original'

Console.WriteLine(original.X);  // still 10 — mutation was on copy only
// Developer expected original.X to be 99`,
      right: `// ValueTuple is a value type — assignment copies, not shares
var original = (X: 10, Y: 20);
var modified = original with { };  // with not available on ValueTuple...

// Correct approach: just create a new tuple
var updated = (X: 99, Y: original.Y);

// Or modify the original variable itself:
original.X = 99;
Console.WriteLine(original.X);  // 99 (variable was updated, not a copy)`,
      explanation: 'ValueTuple is a struct. Assigning it to another variable creates a complete copy. Mutating the copy has no effect on the original. This is the standard value-type semantics in C# — the same behavior as int, double, and DateTime. If you need to "update" a named tuple, create a new one with the desired values.',
    },
    {
      title: 'Using an anonymous type outside of its declaring method — loses type information',
      wrong: `// Cannot return anonymous type with its full type
static object GetProjection()
{
    return new { Name = "Alice", Score = 95 };
}

var result = GetProjection();  // type is 'object'
Console.WriteLine(result.Name);   // compile error — object has no .Name
// You'd need dynamic or reflection — fragile and slow`,
      right: `// Use a record or named tuple for cross-method data
public record Projection(string Name, int Score);

static Projection GetProjection() => new("Alice", 95);

var result = GetProjection();
Console.WriteLine(result.Name);   // Alice — fully typed

// Or a named tuple for internal use
static (string Name, int Score) GetTuple() => ("Alice", 95);
var (n, s) = GetTuple();`,
      explanation: 'Anonymous types are sealed, compiler-generated classes whose name is unknowable. They cannot be declared as return types or parameter types, so they can only travel as object or dynamic — both lose type safety. Reserve anonymous types for temporary LINQ projections within a single method. For any data that needs to cross a method boundary, use a named tuple or a record.',
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'What is the key difference between ValueTuple and the old Tuple<T> class?',
      options: [
        'ValueTuple supports named fields; Tuple<T> supports only Item1/Item2',
        'ValueTuple is a value type (stack-allocated); Tuple<T> is a reference type (heap-allocated)',
        'ValueTuple is only available in .NET 6+; Tuple<T> works on all versions',
        'There is no difference — ValueTuple is just an alias for Tuple<T>',
      ],
      answer: 1,
      explanation: '<code>ValueTuple</code> is a struct — it lives on the stack and avoids heap allocation and GC pressure. <code>Tuple&lt;T&gt;</code> is a class, allocated on the heap and accessed only via Item1/Item2. Both support multiple values, but ValueTuple additionally supports named fields and deconstruction.',
    },
    {
      q: 'What does the _ discard do in tuple deconstruction?',
      options: [
        'It stores the value in a variable literally named "_"',
        'It causes a compile error if used more than once',
        'It signals to the compiler to ignore that element — no variable is created',
        'It converts the element to null',
      ],
      answer: 2,
      explanation: 'The discard <code>_</code> is not a variable — it signals "I do not need this value". Multiple discards are allowed in the same deconstruction. This keeps code clean when a method returns more values than the caller needs.',
    },
    {
      q: 'When should you prefer a record over a tuple for returning multiple values?',
      options: [
        'Never — tuples are always faster',
        'Only when the values need to be sorted',
        'When the shape is part of a public API, needs JSON serialization, or will be reused across methods',
        'Only when the tuple has more than 5 elements',
      ],
      answer: 2,
      explanation: 'Tuples are great for quick internal returns, but their named fields vanish at runtime — JSON serializers produce Item1/Item2, and reflection cannot see the names. Records have proper named properties that survive serialization, can be documented and reused, and work with pattern matching.',
    },
    {
      q: 'Where are anonymous types (new { Name = x }) most appropriately used?',
      options: [
        'As return types for public API methods',
        'Inside a single method or LINQ query for temporary projections',
        'As base types for inheritance hierarchies',
        'Anywhere — they are interchangeable with records',
      ],
      answer: 1,
      explanation: 'Anonymous types cannot cross method boundaries without losing their type (only <code>object</code> or <code>dynamic</code> would work as return type). They shine in LINQ <code>select</code> projections where you reshape data temporarily without needing a named type.',
    },
    {
      q: 'What is the result of serializing (string Name, int Age) person = ("Alice", 30) to JSON with System.Text.Json?',
      options: [
        '{"Name":"Alice","Age":30}',
        '{"Item1":"Alice","Item2":30}',
        '["Alice", 30]',
        'A runtime exception because tuples cannot be serialized',
      ],
      answer: 1,
      explanation: 'ValueTuple named fields (Name, Age) are compile-time only — stored in attributes on the method signature, not on the runtime type. System.Text.Json (and other serializers) see the underlying <code>ValueTuple&lt;string, int&gt;</code> with fields <code>Item1</code> and <code>Item2</code>. Use a record or class if JSON key names must match property names.',
    },
    {
      q: 'Which statement about ValueTuple equality is correct?',
      options: [
        'ValueTuple does not support == equality — you must use Equals()',
        'ValueTuple implements IEquatable<T> — two tuples with the same element values are equal using ==',
        'ValueTuple equality is reference-based like classes',
        'ValueTuple equality only works when field names match',
      ],
      answer: 1,
      explanation: '<code>ValueTuple</code> implements <code>IEquatable&lt;(T1, T2)&gt;</code> — two tuples with the same element values in the same positions are equal using <code>==</code>, regardless of whether field names differ. Field names are a compile-time alias only and do not participate in equality.',
    },
    {
      q: 'What is the cleanest way to swap two int variables in C# using tuples?',
      options: [
        'int temp = a; a = b; b = temp;',
        '(a, b) = (b, a);',
        'a = a ^ b; b = a ^ b; a = a ^ b;',
        'Tuple.Swap(ref a, ref b);',
      ],
      answer: 1,
      explanation: 'Tuple deconstruction assignment <code>(a, b) = (b, a);</code> is the idiomatic C# 7+ swap — no temporary variable needed. The compiler generates efficient IL equivalent to the three-line temp-variable approach.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Do named tuple fields exist at runtime?',
      a: 'No — tuple field names like <code>Name</code> and <code>Age</code> in <code>(string Name, int Age)</code> are a compiler-only illusion, stored as attributes on method signatures. At runtime the underlying type is <code>ValueTuple&lt;string, int&gt;</code> with only <code>Item1</code> and <code>Item2</code>. This means reflection, JSON serializers (System.Text.Json, Newtonsoft), and dynamic code cannot see named fields. If you need named fields at runtime, use a <code>record</code> or <code>class</code>.',
    },
    {
      q: 'Can I deconstruct types other than tuples?',
      a: 'Yes. Any type that defines a <code>Deconstruct(out T1 a, out T2 b)</code> method supports the same syntax. Positional records get <code>Deconstruct</code> generated automatically. You can add <code>Deconstruct</code> as an extension method to third-party types you cannot modify. Pattern matching also uses <code>Deconstruct</code> for positional patterns: <code>point is (> 0, > 0)</code> calls <code>Deconstruct</code> internally.',
    },
    {
      q: 'How do I return more than 7 values in a tuple?',
      a: '<code>ValueTuple</code> supports up to 8 generic parameters. For more, the 8th slot is a <code>TRest</code> that itself is another <code>ValueTuple</code>, forming a nested chain. In practice, if you need more than 3–4 return values, stop using a tuple and create a <code>record</code> or a dedicated DTO class. The named type will be cleaner, more maintainable, and easier to evolve over time.',
    },
    {
      q: 'Are anonymous types mutable?',
      a: 'No — anonymous type properties are read-only; you cannot set them after construction. Once created with <code>new { Name = "Alice", Age = 30 }</code>, the properties are fixed. This makes them safe to pass around in LINQ queries but limits their use. If you need mutable intermediate data inside a method, use a named tuple or a <code>class</code>. If you need immutable but named persistent data, use a <code>record</code>.',
    },
    {
      q: 'When should I use out parameters vs a tuple for returning multiple values?',
      a: '<code>out</code> parameters shine when: (1) the primary return value signals success/failure (<code>bool TryParse(..., out int result)</code>) and the caller often ignores the out value; (2) the calling pattern is a common try-pattern. Named tuples are better when: both return values are equally important; the caller will always use both; readability matters more than the TryXxx convention. In modern C# (9+), records win for anything non-trivial — they are named, documented, and serializable.',
    },
    {
      q: 'Can ValueTuples be used as dictionary keys?',
      a: 'Yes. <code>ValueTuple</code> implements <code>IEquatable&lt;T&gt;</code> and overrides <code>GetHashCode</code>, making it a valid dictionary key. <code>var cache = new Dictionary&lt;(int X, int Y), string&gt;();</code> is valid and efficient. Equality and hashing are based on element values, not field names. This is a clean pattern for multi-key lookups without needing to create a dedicated key class.',
    },
    {
      q: 'What is ITuple and when is it useful?',
      a: '<code>ITuple</code> is an interface implemented by all <code>ValueTuple</code> variants. It exposes a <code>Length</code> property and an indexer <code>[int index]</code> returning <code>object?</code>. This enables generic code that can handle any tuple without knowing its arity at compile time — useful for logging, serialization, or reflection utilities that need to inspect tuple contents. Normal application code rarely uses <code>ITuple</code> directly.',
    },
  ];

  challenge: Challenge = {
    title: 'MinMax Statistics',
    description: `Write a method that analyses an array of integers and returns a tuple with statistics.
1. Create <code>Analyse(int[] numbers)</code> returning <code>(int Min, int Max, double Average, int Range)</code>.
2. <code>Range</code> is Max minus Min.
3. In the calling code, deconstruct the result and discard <code>Average</code> using <code>_</code>.
4. Demonstrate swapping two ints with tuple deconstruction — no temporary variable.`,
    language: 'csharp',
    hints: [
      'Use LINQ: numbers.Min(), numbers.Max(), numbers.Average()',
      'Range = max - min — compute it inside the method before returning',
      'Deconstruct with: var (min, max, _, range) = Analyse(data)',
      'Swap with: (a, b) = (b, a)',
    ],
    starterCode: `static (int Min, int Max, double Average, int Range) Analyse(int[] numbers)
{
    // TODO: return the four statistics
    throw new NotImplementedException();
}

int[] data = { 3, 7, 1, 9, 4, 6 };

// TODO: deconstruct, discarding Average
// var (min, max, _, range) = ...;
// Console.WriteLine($"Min={min}, Max={max}, Range={range}");

// TODO: swap two ints without a temp variable
int a = 10, b = 20;
// swap a and b
Console.WriteLine($"a={a}, b={b}");  // should print a=20, b=10`,
    solution: `static (int Min, int Max, double Average, int Range) Analyse(int[] numbers)
{
    int min = numbers.Min();
    int max = numbers.Max();
    return (min, max, numbers.Average(), max - min);
}

int[] data = { 3, 7, 1, 9, 4, 6 };

var (min, max, _, range) = Analyse(data);
Console.WriteLine($"Min={min}, Max={max}, Range={range}");
// Min=1, Max=9, Range=8

int a = 10, b = 20;
(a, b) = (b, a);
Console.WriteLine($"a={a}, b={b}");  // a=20, b=10`,
  };

  revision: RevisionSummary = {
    oneLiner: 'ValueTuple (C# 7) is a stack-allocated multi-value return. Named fields are compile-time only — JSON serializers see Item1/Item2. Use records for public APIs and serialization; tuples for quick internal returns.',
    mustKnow: [
      'ValueTuple is a value type (struct): stack-allocated, GC-friendly, copied on assignment, supports == equality.',
      'Named tuple fields exist only at compile time — runtime type is ValueTuple<T1, T2>. Reflection and JSON serializers see Item1/Item2.',
      'Deconstruction: var (x, y) = tuple; — works on tuples, records, and any type with a Deconstruct() method.',
      '_ discard: skip tuple elements you do not need. Multiple discards allowed in one expression.',
      '(a, b) = (b, a) — idiomatic C# swap using tuple assignment. No temporary variable needed.',
      'Anonymous types: compiler-generated, read-only, structural equality. Cannot cross method boundaries. Best for LINQ projections only.',
      'When to use what: tuple = quick internal return; anonymous type = LINQ-local projection; record = public API, serialization, or reuse.',
    ],
    interviewFocus: [
      'What is ValueTuple and how does it differ from Tuple<T>? (struct vs class, named fields, deconstruction, stack vs heap)',
      'Do named tuple field names survive serialization? (No — JSON produces Item1/Item2; use record for named JSON keys)',
      'What does _ mean in deconstruction? (discard — not a variable, tells compiler to ignore that element)',
      'When would you choose a record over a tuple? (public API, serialization, pattern matching, reuse, > 3 fields)',
      'Can anonymous types be returned from methods? (Only as object/dynamic — losing type safety; use record instead)',
    ],
  };
}
