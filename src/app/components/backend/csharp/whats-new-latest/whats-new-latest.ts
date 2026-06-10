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
  selector: 'app-csharp-whats-new-latest',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './whats-new-latest.html',
  styleUrl: './whats-new-latest.scss',
})
export class CsharpWhatsNewLatest {

  quickRef: QuickRefItem[] = [
    { name: 'params ReadOnlySpan<T>',     type: 'keyword',   desc: 'C# 13. params now works with Span<T> and ReadOnlySpan<T> — zero allocation variadic methods for hot paths.' },
    { name: 'new Lock type',              type: 'class',     desc: 'C# 13. System.Threading.Lock replaces object-based locking. Use lock (myLock) or myLock.EnterScope() for safer, more explicit locking.' },
    { name: 'allows ref struct',          type: 'constraint', desc: 'C# 13. Generic type constraint that permits ref struct types (like Span<T>) as type arguments.' },
    { name: 'ref/unsafe in async',        type: 'syntax',    desc: 'C# 13. ref locals and unsafe code can now appear in async methods and iterators (in non-async segments).' },
    { name: 'field keyword',              type: 'keyword',   desc: 'C# 13. Inside a property accessor, "field" refers to the compiler-generated backing field, eliminating manual private field declarations.' },
    { name: 'CountBy()',                  type: 'method',    desc: '.NET 9 LINQ. Groups elements and returns (key, count) pairs. More efficient than GroupBy(...).Select(g => (g.Key, g.Count())).' },
    { name: 'AggregateBy()',              type: 'method',    desc: '.NET 9 LINQ. Aggregates values by key without creating intermediate groups. Like GroupBy + Aggregate in one pass.' },
    { name: 'Index()',                    type: 'method',    desc: '.NET 9 LINQ. Returns (index, element) tuples — equivalent to Select((x, i) => (i, x)) but more readable.' },
    { name: 'TimeProvider',              type: 'class',     desc: '.NET 8+. Abstraction over system time. Inject in services; use FakeTimeProvider in tests. Replaces DateTime.UtcNow coupling.' },
    { name: 'extension members (C# 14)', type: 'syntax',    desc: 'C# 14 preview. Extension blocks can declare both instance and static extension members, including properties and operators.' },
    { name: 'partial properties (C# 14)', type: 'keyword',  desc: 'C# 14. Property declarations can be split across partial class files, enabling source-generator-driven property bodies.' },
    { name: 'AVX-512 / SIMD',            type: 'type',      desc: '.NET 9/10. New Vector512<T> and AVX-512 intrinsics for hardware-accelerated SIMD operations on 512-bit registers.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'C# 13 — params spans and the Lock type',
      points: [
        '<code>params ReadOnlySpan&lt;T&gt;</code> enables zero-allocation variadic methods. Unlike <code>params T[]</code> which allocates an array on the heap for each call, span-based params use stack allocation for small argument counts.',
        'The new <code>System.Threading.Lock</code> type (not <code>object</code>) is more explicit and carries metadata. The compiler generates better code when you use it with the <code>lock</code> statement. Use <code>Lock.EnterScope()</code> for a disposable scope pattern.',
        'The <code>field</code> keyword inside a property accessor refers to the auto-generated backing field. This eliminates the pattern of declaring a private field manually just to add validation logic to a property.',
        '<code>allows ref struct</code> lifts the restriction that prevented <code>Span&lt;T&gt;</code> and other ref structs from being used as generic type arguments — enabling more performant zero-copy API designs.',
      ],
    },
    {
      heading: '.NET 9/10 — LINQ additions',
      points: [
        '<code>CountBy(keySelector)</code> counts elements per key in a single pass: <code>words.CountBy(w => w.Length)</code> returns an <code>IEnumerable&lt;KeyValuePair&lt;int, int&gt;&gt;</code>. More efficient than <code>GroupBy</code> when you only need counts.',
        '<code>AggregateBy(keySelector, seed, accumulator)</code> performs a keyed aggregation without materialising intermediate groups. Ideal for summing, averaging, or accumulating values per group in one pass.',
        '<code>Index()</code> returns <code>(int Index, T Item)</code> pairs for every element, replacing the verbose <code>.Select((x, i) => (i, x))</code> idiom.',
        '<code>System.Linq.Enumerable.ToFrozenDictionary()</code> and <code>ToFrozenSet()</code> (introduced in .NET 8) create immutable, read-optimised collections. Lookups are faster than <code>Dictionary&lt;K,V&gt;</code> for read-heavy workloads.',
      ],
    },
    {
      heading: '.NET 9/10 — performance and JSON',
      points: [
        '.NET 9/10 JIT improvements include: better inlining of small methods, loop inversion, improved de-virtualization, and AVX-512 SIMD support via <code>System.Runtime.Intrinsics.X86.Avx512F</code>.',
        '<code>System.Text.Json</code> now supports <code>JsonSerializerOptions.MakeReadOnly()</code>, custom <code>JsonConverter</code> resolution via <code>IJsonTypeInfoResolver</code>, and significantly faster serialisation through source generators.',
        '<code>TimeProvider</code> (introduced in .NET 8, widely adopted in 9/10) abstracts over <code>DateTime.UtcNow</code> and <code>Task.Delay</code>. Inject <code>TimeProvider.System</code> in production and <code>FakeTimeProvider</code> in tests for deterministic time control.',
        '<code>System.IO.Pipelines</code> improvements in .NET 9/10 reduce allocations for high-throughput I/O. Combined with <code>IAsyncEnumerable&lt;T&gt;</code>, they power the low-level network and serialisation stacks in ASP.NET Core Kestrel.',
      ],
    },
    {
      heading: 'C# 14 preview — extension members',
      points: [
        'C# 14 introduces <strong>extension blocks</strong>: a new syntax that groups extension methods and properties for a type in a single block, replacing the static-class-with-static-methods approach.',
        'Extension properties allow you to add computed properties to types you don\'t own: <code>extension(string s) { public bool IsEmail => s.Contains(\'@\'); }</code>.',
        'Extension blocks can also declare static extension members, enabling factory-style patterns on existing types.',
        '<strong>Partial properties</strong> (C# 14) allow a property declaration to be split across files — the declaring half in one file, the implementation half in another. This is primarily targeted at source generators that need to inject property implementations.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'C# 13 Features',
      language: 'csharp',
      code: `// ── 1. params ReadOnlySpan<T> — zero allocation ──────────────────
// Old: params T[] allocates a heap array on every call
static int SumOld(params int[] values)
{
    int total = 0;
    foreach (var v in values) total += v;
    return total;
}

// New: params ReadOnlySpan<T> — stack-allocated for small counts
static int Sum(params ReadOnlySpan<int> values)
{
    int total = 0;
    foreach (var v in values) total += v;
    return total;
}

Console.WriteLine(Sum(1, 2, 3, 4, 5));   // 15 — no heap allocation

// ── 2. The new Lock type ──────────────────────────────────────────
// Old pattern — lock on an object:
// private readonly object _gate = new();
// lock (_gate) { ... }

// New pattern — explicit Lock type:
using System.Threading;

private readonly Lock _lock = new();

void SafeIncrement(ref int counter)
{
    lock (_lock)          // works with lock statement
    {
        counter++;
    }
}

// Or using disposable scope:
void SafeAppend(List<string> list, string item)
{
    using (_lock.EnterScope())  // auto-released when scope exits
    {
        list.Add(item);
    }
}

// ── 3. field keyword in property accessors ────────────────────────
public class Temperature
{
    // No separate private _celsius field needed!
    public double Celsius
    {
        get => field;
        set
        {
            if (value < -273.15)
                throw new ArgumentOutOfRangeException(nameof(value),
                    "Cannot be below absolute zero");
            field = value;   // "field" is the compiler-generated backing field
        }
    }

    public double Fahrenheit => Celsius * 9 / 5 + 32;
}

// ── 4. allows ref struct constraint ───────────────────────────────
// Without the constraint, Span<T> cannot be used as T
static void Process<T>(T value) where T : allows ref struct
{
    // T can now be Span<int>, ReadOnlySpan<char>, etc.
    Console.WriteLine(value?.ToString());
}

Process(new Span<int>([1, 2, 3]));`,
    },
    {
      label: '.NET 9 LINQ',
      language: 'csharp',
      code: `// ── 1. CountBy ───────────────────────────────────────────────────
string[] words = ["apple", "banana", "avocado", "blueberry", "cherry", "apricot"];

// Count words by their first letter
foreach (var (letter, count) in words.CountBy(w => w[0]))
    Console.WriteLine(\$"{letter}: {count}");
// a: 3, b: 2, c: 1

// Old equivalent (less efficient — creates intermediate groups):
// words.GroupBy(w => w[0]).Select(g => (g.Key, g.Count()))

// ── 2. AggregateBy ────────────────────────────────────────────────
var orders = new[]
{
    (CustomerId: 1, Amount: 100m),
    (CustomerId: 2, Amount:  50m),
    (CustomerId: 1, Amount: 200m),
    (CustomerId: 3, Amount:  75m),
    (CustomerId: 2, Amount: 125m),
};

// Sum orders per customer in a single pass — no GroupBy intermediate
var totals = orders.AggregateBy(
    keySelector:  o => o.CustomerId,
    seed:         0m,
    func:        (total, o) => total + o.Amount);

foreach (var (customerId, total) in totals)
    Console.WriteLine(\$"Customer {customerId}: \${total}");
// Customer 1: $300, Customer 2: $175, Customer 3: $75

// ── 3. Index() ────────────────────────────────────────────────────
string[] fruits = ["apple", "banana", "cherry"];

// Old:
var oldIndexed = fruits.Select((fruit, i) => (i, fruit));

// New — cleaner:
foreach (var (index, fruit) in fruits.Index())
    Console.WriteLine(\$"[{index}] {fruit}");
// [0] apple, [1] banana, [2] cherry

// ── 4. FrozenDictionary and FrozenSet ────────────────────────────
// Build once, read many times — faster lookups than Dictionary<K,V>
var config = new Dictionary<string, string>
{
    ["db"]    = "localhost:5432",
    ["cache"] = "localhost:6379",
}.ToFrozenDictionary();

// Lookups are O(1) but ~20-30% faster due to optimised internal structure
bool hasDb = config.ContainsKey("db");

// FrozenSet for membership testing:
var validRoles = new[] { "admin", "editor", "viewer" }.ToFrozenSet();
bool isAdmin = validRoles.Contains("admin");`,
    },
    {
      label: 'TimeProvider & JSON',
      language: 'csharp',
      code: `// ── 1. TimeProvider abstraction ──────────────────────────────────
// Production code — inject TimeProvider
public class OrderExpiryService(TimeProvider time)
{
    public bool IsExpired(Order order, TimeSpan ttl)
        => time.GetUtcNow() - order.CreatedAt > ttl;

    public async Task WaitForExpiryAsync(Order order, TimeSpan ttl, CancellationToken ct)
    {
        var remaining = ttl - (time.GetUtcNow() - order.CreatedAt);
        if (remaining > TimeSpan.Zero)
            await Task.Delay(remaining, time, ct);  // uses TimeProvider's delay
    }
}

// In DI setup:
// builder.Services.AddSingleton(TimeProvider.System);

// In tests — control time deterministically:
// using Microsoft.Extensions.Time.Testing;
// var fakeTime = new FakeTimeProvider(DateTimeOffset.UtcNow);
// fakeTime.Advance(TimeSpan.FromHours(25));  // fast-forward

// ── 2. System.Text.Json source generators ─────────────────────────
// Zero-reflection, AOT-compatible, faster serialisation
[System.Text.Json.Serialization.JsonSerializable(typeof(UserDto))]
[System.Text.Json.Serialization.JsonSerializable(typeof(List<UserDto>))]
public partial class AppJsonContext : System.Text.Json.Serialization.JsonSerializerContext { }

public record UserDto(int Id, string Name, string Email);

// Use the generated context — no reflection at runtime:
string json  = System.Text.Json.JsonSerializer.Serialize(
    new UserDto(1, "Alice", "alice@example.com"),
    AppJsonContext.Default.UserDto);

UserDto? user = System.Text.Json.JsonSerializer.Deserialize(
    json,
    AppJsonContext.Default.UserDto);

// ── 3. .NET 9/10 JIT — dynamic PGO in action ─────────────────────
// Dynamic Profile-Guided Optimisation (PGO) is enabled by default in .NET 8+.
// The JIT observes which branches and types are hot at runtime and re-JITs
// with better code. No code changes needed — just run and let PGO warm up.

// You can verify PGO is active with:
// DOTNET_TieredPGO=1 (default in .NET 8+)

// ── 4. System.IO.Pipelines — high-throughput I/O ─────────────────
using System.IO.Pipelines;

async Task ParseLinesAsync(Stream stream, CancellationToken ct)
{
    var reader = PipeReader.Create(stream);
    while (true)
    {
        var result = await reader.ReadAsync(ct);
        var buffer = result.Buffer;

        foreach (var segment in buffer)
        {
            // Process each segment without copying — zero alloc
            ProcessSegment(segment.Span);
        }

        reader.AdvanceTo(buffer.End);
        if (result.IsCompleted) break;
    }
    await reader.CompleteAsync();
}

static void ProcessSegment(ReadOnlySpan<byte> data)
    => Console.WriteLine(\$"Segment: {data.Length} bytes");`,
    },
    {
      label: 'C# 14 Preview',
      language: 'csharp',
      code: `// ─────────────────────────────────────────────────────────────────
// C# 14 (preview as of 2025) — Extension Members
// ─────────────────────────────────────────────────────────────────

// ── 1. Extension block syntax ─────────────────────────────────────
// Old style (C# 3+): static class with static methods
public static class StringExtensionsOld
{
    public static bool IsEmail(this string s) => s.Contains('@') && s.Contains('.');
}

// New style (C# 14): extension block — groups instance AND static extensions
// extension(string s)
// {
//     // Instance extension property:
//     public bool IsEmail => s.Contains('@') && s.Contains('.');
//
//     // Instance extension method:
//     public string Truncate(int max) =>
//         s.Length <= max ? s : s[..max] + "...";
// }

// ── 2. Static extension members ───────────────────────────────────
// extension(DateTime)
// {
//     // Static extension factory:
//     public static DateTime FromUnixSeconds(long seconds)
//         => DateTimeOffset.FromUnixTimeSeconds(seconds).UtcDateTime;
// }
//
// Usage: DateTime dt = DateTime.FromUnixSeconds(1_700_000_000);

// ── 3. partial properties ─────────────────────────────────────────
// Declaring file (hand-written or tool-generated signature):
// public partial class MyViewModel
// {
//     public partial string Name { get; set; }
// }

// Implementing file (e.g. generated by source generator):
// public partial class MyViewModel
// {
//     private string _name = "";
//     public partial string Name
//     {
//         get => _name;
//         set { _name = value; OnPropertyChanged(); }
//     }
// }

// ── 4. field keyword (C# 13, widely used in 14) ───────────────────
public class Person
{
    private string _firstName = "";

    // C# 13 "field" keyword eliminates manual backing field
    public string FirstName
    {
        get => field;
        set => field = value?.Trim() ?? throw new ArgumentNullException(nameof(value));
    }

    // Non-null validated string — field is auto-declared
    public string LastName
    {
        get => field;
        set
        {
            ArgumentException.ThrowIfNullOrWhiteSpace(value);
            field = value;
        }
    }
}

// ── 5. params collections — broader support ────────────────────────
// C# 13 expanded params to work with IEnumerable<T>, List<T>, etc.
static void LogAll(params IEnumerable<string> messages)
{
    foreach (var m in messages) Console.WriteLine(m);
}

LogAll("one", "two", "three");           // direct call
LogAll(new List<string> { "a", "b" });   // also accepted`,
    },
  ];

  challenge: Challenge = {
    title: 'LINQ Statistics with .NET 9 operators',
    description: `Use the new .NET 9 LINQ operators to analyse a collection of sales records.

Given a list of SaleRecord(string Region, string Product, decimal Amount), implement SalesAnalyzer:

1. TopProductsByRegion(records) → Dictionary<string, string>
   Returns the best-selling product (by total Amount) for each Region using AggregateBy or GroupBy

2. TransactionCountByRegion(records) → IEnumerable<(string Region, int Count)>
   Uses CountBy to count transactions per Region

3. IndexedSummary(records) → IEnumerable<string>
   Uses Index() to return strings like "[0] North: Widget $450.00"
   Format: "[{index}] {Region}: {Product} \${Amount:F2}"

4. Use TimeProvider to add a timestamp to each summary line (bonus)`,
    language: 'csharp',
    hints: [
      'CountBy(r => r.Region) gives transaction counts directly',
      'For TopProductsByRegion, group by (Region, Product) and sum Amount, then pick max per Region',
      'Index() returns (int Index, T Item) — destructure with var (i, item)',
      'Inject TimeProvider and use time.GetUtcNow() for the timestamp',
    ],
    starterCode: `public record SaleRecord(string Region, string Product, decimal Amount);

public class SalesAnalyzer(TimeProvider time)
{
    public Dictionary<string, string> TopProductsByRegion(IEnumerable<SaleRecord> records)
    {
        throw new NotImplementedException();
    }

    public IEnumerable<(string Region, int Count)> TransactionCountByRegion(
        IEnumerable<SaleRecord> records)
    {
        throw new NotImplementedException();
    }

    public IEnumerable<string> IndexedSummary(IEnumerable<SaleRecord> records)
    {
        throw new NotImplementedException();
    }
}`,
    solution: `public record SaleRecord(string Region, string Product, decimal Amount);

public class SalesAnalyzer(TimeProvider time)
{
    public Dictionary<string, string> TopProductsByRegion(IEnumerable<SaleRecord> records)
    {
        // Sum by (Region, Product) then pick best per region
        return records
            .GroupBy(r => r.Region)
            .ToDictionary(
                g => g.Key,
                g => g.GroupBy(r => r.Product)
                       .Select(pg => (Product: pg.Key, Total: pg.Sum(r => r.Amount)))
                       .MaxBy(x => x.Total)!.Product);
    }

    public IEnumerable<(string Region, int Count)> TransactionCountByRegion(
        IEnumerable<SaleRecord> records)
    {
        return records
            .CountBy(r => r.Region)
            .Select(kv => (kv.Key, kv.Value));
    }

    public IEnumerable<string> IndexedSummary(IEnumerable<SaleRecord> records)
    {
        var ts = time.GetUtcNow().ToString("HH:mm:ss");
        return records
            .Index()
            .Select(x => \$"[{x.Index}] {x.Item.Region}: {x.Item.Product} \${x.Item.Amount:F2} @ {ts}");
    }
}

// Usage:
var records = new[]
{
    new SaleRecord("North", "Widget",  450m),
    new SaleRecord("North", "Gadget",  200m),
    new SaleRecord("South", "Widget",  300m),
    new SaleRecord("South", "Gadget",  600m),
    new SaleRecord("North", "Widget",  100m),
};

var analyzer = new SalesAnalyzer(TimeProvider.System);

foreach (var (region, product) in analyzer.TopProductsByRegion(records))
    Console.WriteLine(\$"{region}: {product}");
// North: Widget (total 550), South: Gadget (total 600)

foreach (var (region, count) in analyzer.TransactionCountByRegion(records))
    Console.WriteLine(\$"{region}: {count} transactions");

foreach (var line in analyzer.IndexedSummary(records))
    Console.WriteLine(line);`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the performance benefit of params ReadOnlySpan<T> over params T[] in C# 13?',
      options: [
        'ReadOnlySpan<T> allows more arguments than T[]',
        'params ReadOnlySpan<T> avoids heap allocation for the argument array — arguments are stack-allocated for small counts',
        'ReadOnlySpan<T> enables parallel processing of the variadic arguments',
        'There is no performance difference — it is purely a syntax preference',
      ],
      answer: 1,
      explanation: '<code>params T[]</code> always allocates a new array on the heap, even for a single call with a few arguments. <code>params ReadOnlySpan&lt;T&gt;</code> uses the stack for small argument counts (the compiler can use stackalloc under the hood), producing zero GC pressure on hot paths. This is especially valuable in tight loops or high-throughput serialisation code.',
    },
    {
      q: 'What does LINQ\'s CountBy() method return and how does it differ from GroupBy?',
      options: [
        'CountBy returns the total count of all elements; GroupBy returns the total count per group',
        'CountBy returns IEnumerable<KeyValuePair<TKey, int>> of (key, count) pairs in a single pass; GroupBy creates intermediate group objects with their full element sequences',
        'They are identical — CountBy is just a convenience alias for GroupBy(...).Count()',
        'CountBy only works on numeric sequences; GroupBy works on any type',
      ],
      answer: 1,
      explanation: '<code>CountBy(keySelector)</code> counts elements per key in a single streaming pass and returns <code>IEnumerable&lt;KeyValuePair&lt;TKey, int&gt;&gt;</code>. <code>GroupBy</code> creates <code>IGrouping&lt;TKey, T&gt;</code> objects that buffer all elements per group in memory, which is more memory-intensive when you only need counts. <code>CountBy</code> is more efficient for the "count by category" pattern.',
    },
    {
      q: 'Why is TimeProvider preferred over DateTime.UtcNow in .NET 8+ code?',
      options: [
        'TimeProvider is faster than DateTime.UtcNow at runtime',
        'DateTime.UtcNow is deprecated in .NET 8',
        'TimeProvider is an abstraction that can be substituted in tests with FakeTimeProvider, enabling deterministic time-dependent tests without Thread.Sleep or real delays',
        'TimeProvider automatically converts between time zones',
      ],
      answer: 2,
      explanation: '<code>DateTime.UtcNow</code> is a static call that couples your code to real wall-clock time, making time-dependent tests slow, flaky, or impossible to write deterministically. <code>TimeProvider</code> is an abstract class you can inject. In production you inject <code>TimeProvider.System</code>; in tests you inject <code>FakeTimeProvider</code> and call <code>.Advance()</code> to control time without sleeping. It also abstracts <code>Task.Delay</code> and timer creation.',
    },
    {
      q: 'What does the C# 14 "extension block" syntax improve over traditional extension methods?',
      options: [
        'Extension blocks allow extension methods to access private members of the extended type',
        'Extension blocks enable instance extension properties, static extension members, and cleaner grouping of related extensions in a single syntax — something static classes could not express',
        'Extension blocks compile to faster code than traditional extension methods',
        'Extension blocks replace interfaces and abstract classes for polymorphism',
      ],
      answer: 1,
      explanation: 'Traditional extension methods (static method with <code>this T param</code>) can only add methods. C# 14 extension blocks add: <strong>extension properties</strong> (<code>public bool IsEmail => ...</code>), <strong>static extension members</strong> (factory methods on existing types), and cleaner grouping syntax. The feature makes the language extensibility model first-class rather than a clever workaround.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is Dynamic PGO and how does it improve .NET 9/10 performance without code changes?',
      a: `Dynamic Profile-Guided Optimisation (PGO) was enabled by default starting in .NET 8. The JIT compiler starts by generating fast-to-compile "tier 0" code. As the application runs, the runtime profiles which methods are called frequently, which branches are taken, and which interface implementations are actually used.<br><br>
After gathering this profile data, the JIT re-compiles hot methods at "tier 1" using the actual runtime observations — inlining methods based on real call patterns, de-virtualising interface calls where the concrete type is always the same, and optimising branches that are almost always taken one way.<br><br>
This can yield 10–30% throughput improvements on realistic workloads with zero code changes. You can verify it is active with the environment variable <code>DOTNET_TieredPGO=1</code> (the default in .NET 8+).`,
    },
    {
      q: 'How does AggregateBy differ from GroupBy + Aggregate?',
      a: `<code>GroupBy(keySelector).Select(g => (g.Key, g.Aggregate(...)))</code> buffers all elements per group in memory before the aggregate step — two passes through the data, O(n) extra memory for intermediate groups.<br><br>
<code>AggregateBy(keySelector, seed, func)</code> accumulates values per key in a single streaming pass using a dictionary internally. No intermediate group objects are created.<br><br>
Practical difference example:<br>
<pre>// GroupBy (two passes, buffers all elements):
var totals = orders.GroupBy(o => o.CustomerId)
                   .Select(g => (g.Key, g.Sum(o => o.Amount)));

// AggregateBy (one pass, no intermediate groups):
var totals = orders.AggregateBy(
    o => o.CustomerId, 0m, (sum, o) => sum + o.Amount);</pre>
For large datasets where grouping is the bottleneck, <code>AggregateBy</code> reduces both time and memory.`,
    },
    {
      q: 'What is the "field" keyword in C# 13 and when should I use it?',
      a: `The <code>field</code> keyword inside a property accessor is a contextual keyword that refers to the compiler-generated backing field for that property.<br><br>
Previously, if you wanted to add validation logic to a property you had to declare a separate private field:<br>
<pre>private string _name = "";
public string Name { get => _name; set => _name = value?.Trim() ?? ""; }</pre>

With <code>field</code>, you write:<br>
<pre>public string Name
{
    get => field;
    set => field = value?.Trim() ?? "";
}</pre>
The backing field is generated by the compiler — you never see it in your source. Use it whenever you want to intercept get or set (for validation, notification, lazy initialisation) without polluting the class with private field declarations. It pairs well with <code>INotifyPropertyChanged</code> implementations.`,
    },
    {
      q: 'What are interceptors in C# 12/13 and who are they for?',
      a: `Interceptors (marked <code>[Experimental]</code>) are a compile-time feature that lets a method re-route a specific call site to a different implementation. They are primarily intended for <strong>source generators</strong>, not for everyday application code.<br><br>
A source generator can emit an interceptor that replaces a call like <code>app.MapGet("/users", handler)</code> with a more optimised, AOT-compatible implementation that has no runtime reflection. This is how ASP.NET Core's <em>request delegate generator</em> works in .NET 8+.<br><br>
Unless you are writing source generators or framework infrastructure code, you will never write interceptors directly. They are a tooling primitive, not a user-facing feature. The <code>[Experimental]</code> attribute signals that the syntax may change before stabilisation.`,
    },
  ];
}
