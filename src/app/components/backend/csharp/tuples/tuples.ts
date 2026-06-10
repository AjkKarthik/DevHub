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
  selector: 'app-csharp-tuples',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './tuples.html',
  styleUrl: './tuples.scss',
})
export class CsharpTuples {

  quickRef: QuickRefItem[] = [
    { name: '(T1, T2)',            type: 'syntax',   desc: 'ValueTuple literal — lightweight, stack-allocated tuple type', since: 'C# 7' },
    { name: 'named fields',        type: 'syntax',   desc: '(string Name, int Age) — access fields by name instead of Item1/Item2', since: 'C# 7' },
    { name: 'Deconstruction',      type: 'syntax',   desc: 'var (x, y) = tuple — unpacks tuple fields into local variables', since: 'C# 7' },
    { name: 'Discard _',           type: 'keyword',  desc: '_ placeholder to ignore a tuple element during deconstruction', since: 'C# 7' },
    { name: 'Tuple<T1,T2>',        type: 'class',    desc: 'Old heap-allocated tuple class — prefer ValueTuple in modern code', since: '.NET 1' },
    { name: 'anonymous type',      type: 'type',     desc: 'new { Name = x } — compiler-generated immutable type, mainly used in LINQ', since: 'C# 3' },
    { name: 'record',              type: 'keyword',  desc: 'Named immutable type with value equality — use over tuples for public APIs', since: 'C# 9' },
    { name: 'ITuple',              type: 'interface', desc: 'Interface implemented by ValueTuple — enables generic tuple handling', since: 'C# 7.3' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'ValueTuple: the modern tuple',
      points: [
        'C# 7 introduced <code>ValueTuple</code>, which is a <em>value type</em> — stored on the stack, not the heap. This makes it fast and GC-friendly for transient multi-value returns.',
        'Syntax is concise: <code>(int x, int y) point = (3, 4);</code> or just <code>var point = (x: 3, y: 4);</code>.',
        'Named fields are purely a compiler feature — at runtime they are still <code>Item1</code>/<code>Item2</code>. Reflection will not see the names.',
        'The old <code>Tuple&lt;T&gt;</code> class (pre-C# 7) is a reference type — allocated on the heap and accessed via <code>.Item1</code>/<code>.Item2</code> only. Avoid it in modern code.',
      ],
    },
    {
      heading: 'Deconstruction and discards',
      points: [
        'Deconstruction unpacks a tuple directly into variables: <code>var (name, age) = GetPerson();</code> — no need to access fields separately.',
        'You can deconstruct into existing variables: <code>(name, age) = GetPerson();</code> (without <code>var</code>).',
        'Use the discard <code>_</code> to ignore elements you do not need: <code>var (name, _) = GetPerson();</code>.',
        'Any type that defines a <code>Deconstruct</code> method (including records) supports this syntax, not just tuples.',
      ],
    },
    {
      heading: 'Anonymous types',
      points: [
        'Anonymous types (<code>new { Name = x, Age = y }</code>) create compiler-generated classes with read-only properties. They are reference types.',
        'They are most useful inside LINQ <code>select</code> projections where you need a temporary shaped object that does not leave the method.',
        'Anonymous types cannot be returned from methods (except as <code>object</code> or <code>dynamic</code>), passed to other methods easily, or serialized reliably.',
        'Anonymous types have structural equality — two instances with the same property names, types, and values are considered equal within the same assembly.',
      ],
    },
    {
      heading: 'Tuple vs anonymous type vs record',
      points: [
        '<strong>Tuple</strong>: best for internal/private methods returning multiple values. Lightweight, no ceremony, but named fields are invisible to reflection and serializers.',
        '<strong>Anonymous type</strong>: best inside a single method or LINQ query for temporary projections. Cannot escape the method boundary easily.',
        '<strong>Record</strong>: best when the shape needs a name, lives in a public API, needs serialization, or will be reused. Records work with reflection, JSON serializers, and pattern matching.',
        'Rule of thumb: tuple for quick internal returns, anonymous type for LINQ projections, record for anything public or persistent.',
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

// ── var inference ───────────────────────────────────────────────────────
var point = (X: 10, Y: 20);
Console.WriteLine(\`\${point.X}, \${point.Y}\`);  // 10, 20

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

var bad = TryParse("abc");
Console.WriteLine(bad.Message);      // Not a number`,
    },
    {
      label: 'Deconstruction & Discards',
      language: 'csharp',
      code: `// ── Basic deconstruction ──────────────────────────────────────────────
static (string Name, int Age, string City) GetUser() =>
    ("Bob", 25, "London");

var (name, age, city) = GetUser();
Console.WriteLine(\`\${name} is \${age} from \${city}\`);

// ── Discard unwanted fields with _ ─────────────────────────────────────
var (userName, _, userCity) = GetUser();   // age discarded
Console.WriteLine(\`\${userName} lives in \${userCity}\`);

// ── Deconstruct into existing variables ────────────────────────────────
string n;
int a;
(n, a, _) = GetUser();
Console.WriteLine(\`\${n}: \${a}\`);

// ── Records also support deconstruction ────────────────────────────────
public record Point(int X, int Y);

var p = new Point(3, 7);
var (px, py) = p;
Console.WriteLine(\`\${px}, \${py}\`);   // 3, 7

// ── Swap variables using tuple deconstruction ──────────────────────────
int x = 1, y = 2;
(x, y) = (y, x);   // clean swap without temp variable
Console.WriteLine(\`x=\${x}, y=\${y}\`);  // x=2, y=1`,
    },
    {
      label: 'Anonymous Types & LINQ',
      language: 'csharp',
      code: `using System.Linq;

var products = new[]
{
    new { Name = "Widget",  Price = 9.99m,  Category = "Tools" },
    new { Name = "Gadget",  Price = 24.99m, Category = "Electronics" },
    new { Name = "Doohickey", Price = 4.49m, Category = "Tools" },
};

// ── LINQ projection into anonymous type ────────────────────────────────
var summary = products
    .Where(p => p.Price < 20m)
    .Select(p => new { p.Name, Discounted = p.Price * 0.9m });

foreach (var item in summary)
    Console.WriteLine(\`\${item.Name}: £\${item.Discounted:F2}\`);
// Widget: £8.99
// Doohickey: £4.04

// ── Group into anonymous type ───────────────────────────────────────────
var grouped = products
    .GroupBy(p => p.Category)
    .Select(g => new { Category = g.Key, Count = g.Count(), Total = g.Sum(p => p.Price) });

foreach (var g in grouped)
    Console.WriteLine(\`\${g.Category}: \${g.Count} items, £\${g.Total:F2}\`);

// ── Comparing anonymous types — structural equality ─────────────────────
var a1 = new { Name = "Alice", Age = 30 };
var a2 = new { Name = "Alice", Age = 30 };
Console.WriteLine(a1.Equals(a2));  // True — same shape and values`,
    },
    {
      label: 'Tuple vs Record',
      language: 'csharp',
      code: `// ── Tuple: quick internal return ──────────────────────────────────────
static (double Min, double Max, double Avg) Stats(IEnumerable<double> data)
{
    var list = data.ToList();
    return (list.Min(), list.Max(), list.Average());
}

var (min, max, avg) = Stats(new[] { 1.0, 2.0, 3.0, 4.0, 5.0 });
Console.WriteLine(\`Min=\${min} Max=\${max} Avg=\${avg}\`);

// ── Record: named, reusable, serializable ─────────────────────────────
public record StatsResult(double Min, double Max, double Avg);

static StatsResult StatsAsRecord(IEnumerable<double> data)
{
    var list = data.ToList();
    return new StatsResult(list.Min(), list.Max(), list.Average());
}

var stats = StatsAsRecord(new[] { 1.0, 2.0, 3.0, 4.0, 5.0 });
Console.WriteLine(stats);         // StatsResult { Min = 1, Max = 5, Avg = 3 }
Console.WriteLine(stats.Min);     // 1

// ── Old Tuple<T> class — avoid in new code ─────────────────────────────
Tuple<string, int> legacy = Tuple.Create("Alice", 30);
Console.WriteLine(legacy.Item1);  // Alice — no named fields
// No deconstruction support, heap allocated, verbose API

// ── Named fields disappear at runtime ─────────────────────────────────
(string Name, int Age) t = ("Alice", 30);
object boxed = t;
// ((ValueTuple<string,int>)boxed).Item1 works; .Name does NOT at runtime`,
    },
  ];

  challenge: Challenge = {
    title: 'MinMax Statistics',
    description: `Write a method that analyses an array of integers and returns a tuple with meaningful statistics.
1. Create a method <code>Analyse(int[] numbers)</code> that returns <code>(int Min, int Max, double Average, int Range)</code>.
2. <code>Range</code> is Max minus Min.
3. In the calling code, deconstruct the tuple and discard the <code>Average</code> using <code>_</code> to only print Min, Max and Range.
4. Also demonstrate swapping two ints using tuple deconstruction (no temporary variable).`,
    language: 'csharp',
    hints: [
      'Use LINQ: numbers.Min(), numbers.Max(), numbers.Average()',
      'Range = max - min — compute it inside the method',
      'Deconstruct with: var (min, max, _, range) = Analyse(data)',
      'Swap: (a, b) = (b, a)',
    ],
    starterCode: `static (int Min, int Max, double Average, int Range) Analyse(int[] numbers)
{
    // TODO: return the four statistics
    throw new NotImplementedException();
}

int[] data = { 3, 7, 1, 9, 4, 6 };

// TODO: deconstruct, discarding Average
// TODO: print Min, Max, Range

// TODO: swap two ints without a temp variable
int a = 10, b = 20;
// swap a and b here
Console.WriteLine(\`a=\${a}, b=\${b}\`);  // should print a=20, b=10`,
    solution: `static (int Min, int Max, double Average, int Range) Analyse(int[] numbers)
{
    int min = numbers.Min();
    int max = numbers.Max();
    return (min, max, numbers.Average(), max - min);
}

int[] data = { 3, 7, 1, 9, 4, 6 };

var (min, max, _, range) = Analyse(data);
Console.WriteLine(\`Min=\${min}, Max=\${max}, Range=\${range}\`);
// Min=1, Max=9, Range=8

int a = 10, b = 20;
(a, b) = (b, a);
Console.WriteLine(\`a=\${a}, b=\${b}\`);  // a=20, b=10`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the key difference between ValueTuple and the old Tuple<T> class?',
      options: [
        'ValueTuple supports named fields; Tuple<T> does not support any fields',
        'ValueTuple is a value type (stack-allocated); Tuple<T> is a reference type (heap-allocated)',
        'ValueTuple is only available in .NET 6+; Tuple<T> works on all versions',
        'There is no difference — ValueTuple is just an alias for Tuple<T>',
      ],
      answer: 1,
      explanation: '<code>ValueTuple</code> is a struct — it lives on the stack and avoids heap allocation and GC pressure. <code>Tuple&lt;T&gt;</code> is a class, allocated on the heap. Both support multiple values, but <code>ValueTuple</code> also gains named fields and deconstruction.',
    },
    {
      q: 'What does the _ discard do in tuple deconstruction?',
      options: [
        'It stores the value in a variable literally named "_"',
        'It causes a compile error if used more than once',
        'It tells the compiler to ignore that element — no variable is created',
        'It converts the element to null',
      ],
      answer: 2,
      explanation: 'The discard <code>_</code> is not a variable — it signals "I do not need this value". You can use multiple discards in the same deconstruction. This keeps code clean when a method returns more values than you need.',
    },
    {
      q: 'When should you prefer a record over a tuple for returning multiple values?',
      options: [
        'Never — tuples are always better because they are faster',
        'Only when the values need to be sorted',
        'When the shape is part of a public API, needs serialization, or will be reused across methods',
        'Only when the tuple has more than 3 elements',
      ],
      answer: 2,
      explanation: 'Tuples are great for quick internal returns, but their named fields vanish at runtime (reflection and JSON serializers only see Item1/Item2). Records have proper named properties that survive reflection and serialization, and they can be documented and reused by name.',
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
      explanation: 'Anonymous types cannot easily cross method boundaries (they would need to be typed as <code>object</code>), cannot be named, and are compiler-generated for one-time use. They shine in LINQ <code>select</code> projections where you reshape data temporarily without needing a named type.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Do named tuple fields exist at runtime?',
      a: 'No — tuple field names like <code>Name</code> and <code>Age</code> in <code>(string Name, int Age)</code> are a compiler illusion. At runtime, the underlying type is <code>ValueTuple&lt;string, int&gt;</code> with only <code>Item1</code> and <code>Item2</code>. This means reflection, JSON serializers like <code>System.Text.Json</code>, and dynamic code cannot see named fields. If you need named fields at runtime, use a <code>record</code> or <code>class</code>.',
    },
    {
      q: 'Can I deconstruct types other than tuples?',
      a: 'Yes. Any type that defines a <code>Deconstruct</code> method supports the same syntax. Positional records automatically get <code>Deconstruct</code> generated by the compiler. You can also add <code>Deconstruct</code> as an extension method to third-party types. For example: <code>var (x, y) = myPoint;</code> works if <code>Point</code> has <code>void Deconstruct(out int x, out int y)</code>.',
    },
    {
      q: 'How do I return more than 7 values in a tuple?',
      a: '<code>ValueTuple</code> supports up to 8 generic parameters directly. For more, the 8th slot is a <code>TRest</code> that itself is another <code>ValueTuple</code>, forming a nested chain. In practice, if you need more than 4–5 return values, consider creating a <code>record</code> or a dedicated DTO class — it will be cleaner and more maintainable.',
    },
    {
      q: 'Are anonymous types mutable?',
      a: 'No — anonymous type properties are read-only (they use <code>get</code>-only properties internally). Once created with <code>new { Name = "Alice", Age = 30 }</code> you cannot change any property. This makes them safe to pass around in LINQ queries, but also means you cannot update fields after construction. If you need mutability in a lightweight shape, use a tuple or a mutable <code>class</code>.',
    },
  ];
}
