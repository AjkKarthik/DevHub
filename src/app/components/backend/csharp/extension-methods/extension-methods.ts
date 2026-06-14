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
  selector: 'app-csharp-extension-methods',
  standalone: true,
  imports: [
    CommonModule, CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
    CommonMistakesComponent, RevisionCardComponent,
  ],
  templateUrl: './extension-methods.html',
  styleUrl: './extension-methods.scss',
})
export class CsharpExtensionMethods {

  quickRef: QuickRefItem[] = [
    { name: 'this T param',          type: 'syntax',     desc: 'First parameter with this modifier — declares the type being extended and provides the instance name.', since: 'C# 3' },
    { name: 'static class',          type: 'keyword',    desc: 'Extension methods must live in a non-nested static class. The class itself is never instantiated.', since: 'C# 3' },
    { name: 'using namespace',       type: 'keyword',    desc: 'Extension methods are only visible when their containing namespace is imported with using.', since: 'C# 3' },
    { name: 'IEnumerable<T>',        type: 'interface',  desc: 'Base interface extended by all standard LINQ operators — Where, Select, OrderBy, GroupBy, ToList, etc.', since: 'C# 3' },
    { name: 'Fluent API',            type: 'syntax',     desc: 'Extension methods that return the same type, enabling chaining: obj.Step1().Step2().Step3()', since: 'C# 3' },
    { name: 'null-safe call',        type: 'syntax',     desc: 'Extension methods can be called on null — the null is passed as the first arg. Check inside the body.', since: 'C# 3' },
    { name: 'interface extension',   type: 'syntax',     desc: 'Extend an interface to add behaviour to every implementor without modifying the interface or any class.', since: 'C# 3' },
    { name: 'cannot access private', type: 'constraint', desc: 'Extension methods compile to ordinary static calls — no special access to private/protected members.', since: 'C# 3' },
    { name: 'method resolution',     type: 'syntax',     desc: 'Instance methods always win over extension methods with the same signature. Extensions are a fallback.', since: 'C# 3' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'How extension methods work',
      points: [
        'An extension method is a <code>static</code> method in a <code>static</code> class whose first parameter carries the <code>this</code> modifier. The type of that parameter is the type being extended.',
        'The compiler rewrites every call <code>obj.MyExtension(args)</code> into <code>MyStaticClass.MyExtension(obj, args)</code> — no runtime magic, just syntactic sugar. The generated IL is identical to a plain static call.',
        'The method must be in a namespace imported with <code>using</code>. If the namespace is not imported, the extension method is invisible at the call site — a common source of "method not found" confusion.',
        'Extension methods cannot access <code>private</code> or <code>protected</code> members — they compile to ordinary static calls with no special access beyond what any external caller has.',
        'Method resolution order: if the extended type has an instance method with the same name and signature, the <strong>instance method always wins</strong>. Extension methods are a fallback — they are only chosen when no applicable instance method exists.',
      ],
    },
    {
      heading: 'LINQ is built entirely on extension methods',
      points: [
        'Every LINQ operator (<code>Where</code>, <code>Select</code>, <code>OrderBy</code>, <code>GroupBy</code>, <code>ToList</code>, etc.) is an extension method on <code>IEnumerable&lt;T&gt;</code> in <code>System.Linq.Enumerable</code> or on <code>IQueryable&lt;T&gt;</code> in <code>System.Linq.Queryable</code>.',
        'Because they extend an interface, LINQ operators work on any type implementing that interface: arrays, lists, dictionaries, custom collections, and even lazy generators.',
        'The deferred execution of LINQ is a property of the iterator pattern and lambda expressions — extension methods themselves do not add laziness, but LINQ operators use <code>yield return</code> internally.',
        'Understanding that LINQ is extension methods demystifies it completely: you can write your own LINQ-style operators (custom <code>ForEach</code>, <code>Batch</code>, <code>DistinctBy</code> before .NET 6) in exactly the same way.',
        'The chainability of LINQ — <code>source.Where().Select().OrderBy().Take()</code> — comes from each operator returning <code>IEnumerable&lt;T&gt;</code>, enabling the fluent pattern.',
      ],
    },
    {
      heading: 'Extending interfaces',
      points: [
        'Extension methods on an interface automatically apply to every type that implements the interface — without modifying the interface or any implementing class.',
        'This is how you add "utility methods" to third-party or sealed interfaces you do not control: extend the interface in your own static class.',
        'C# 8 introduced <em>default interface methods</em> — actual virtual members on the interface. Extension methods are often simpler, more compatible with older runtimes, and do not participate in polymorphism.',
        'Be careful: if an implementor defines an instance method with the same name as an extension, the instance method takes precedence, silently overriding the extension for that type.',
        'Extension methods on interfaces are resolved at compile time based on the declared type. If you have a variable typed as <code>IList&lt;T&gt;</code>, only extensions on <code>IList&lt;T&gt;</code> or its base interfaces are visible — not extensions defined on <code>List&lt;T&gt;</code>.',
      ],
    },
    {
      heading: 'Null-safe extension methods',
      points: [
        'Unlike regular instance methods, extension methods can be called on a <code>null</code> reference without throwing a <code>NullReferenceException</code> at the call site — the null is just passed as the first argument to the static method.',
        'You can exploit this to write safe null-guard utilities: <code>null.IsNullOrEmpty()</code> is valid if <code>IsNullOrEmpty</code> is an extension on <code>string?</code>.',
        'Always document whether your extension method handles <code>null</code> gracefully (and returns a sensible value) or throws <code>ArgumentNullException</code> for null inputs.',
        'Throwing <code>ArgumentNullException</code> (not <code>NullReferenceException</code>) is the correct pattern when a non-null argument is required — use <code>ArgumentNullException.ThrowIfNull(value)</code>.',
        'Mark the extended parameter as <code>string?</code> (nullable) when the method is designed to accept null; use <code>string</code> (non-nullable) when it should throw on null — the nullable annotation communicates intent.',
      ],
    },
    {
      heading: 'Fluent API pattern',
      points: [
        'Returning <code>this</code> (or a transformed version of the input) from an extension method enables method chaining: <code>builder.SetName("x").SetPort(80).Build()</code>.',
        'This pattern is used extensively by ASP.NET Core middleware pipeline (<code>app.UseRouting().UseAuth().UseEndpoints()</code>), Entity Framework, FluentValidation, and many test frameworks.',
        'For immutable types (records, <code>ImmutableList&lt;T&gt;</code>), each chained extension returns a new instance. For mutable builders, the same object is returned for chaining.',
        'Fluent APIs are most readable when the method names form an English sentence: <code>email.From("...").To("...").WithSubject("...").Send()</code>.',
        'Design consideration: fluent APIs built with extension methods lose the ability to call private members. If the builder logic is complex, consider a real builder class with private state instead.',
      ],
    },
    {
      heading: 'When NOT to use extension methods',
      points: [
        'If you own the type, prefer adding the method directly to the class — it has full access to private members, is more discoverable, and appears in the class\'s own documentation.',
        'Avoid extending <code>object</code> — every single type in your codebase then "gains" the method, polluting IntelliSense for every variable everywhere.',
        'Do not use extension methods to sneak functionality into a type that genuinely needs a redesign — they can be a way to accumulate design debt that\'s harder to refactor later.',
        'Extension methods on concrete classes can create hidden surprises: if the class later adds an instance method with the same signature, the extension is silently ignored at all call sites.',
        'Avoid deep extension-method chains on types you do not control where the API is unstable — a library upgrade that adds an instance method of the same name will silently break your chain\'s behavior.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Basics',
      language: 'csharp',
      code: `// ── Extension method declaration ──────────────────────────────────────
// Requirements: static method, in static class, first param has 'this'
namespace MyApp.Extensions;

public static class StringExtensions
{
    // Extend string — 'value' is the instance the method is called on
    public static bool IsNullOrEmpty(this string? value) =>
        string.IsNullOrEmpty(value);

    public static string Truncate(this string value, int maxLength, string ellipsis = "…")
    {
        ArgumentNullException.ThrowIfNull(value);
        return value.Length <= maxLength
            ? value
            : value[..maxLength] + ellipsis;
    }

    public static string ToTitleCase(this string value) =>
        string.IsNullOrEmpty(value)
            ? value
            : char.ToUpper(value[0]) + value[1..].ToLower();

    // Null-safe — can be called on null without NullReferenceException
    public static int SafeLength(this string? value) => value?.Length ?? 0;
}

// Usage — called as instance methods, compiled to static calls
string name = "hello world";
Console.WriteLine(name.ToTitleCase());      // Hello world
Console.WriteLine(name.Truncate(5));        // hello…
Console.WriteLine(name.SafeLength());       // 11

string? nullStr = null;
Console.WriteLine(nullStr.IsNullOrEmpty()); // True  — no NRE
Console.WriteLine(nullStr.SafeLength());    // 0     — no NRE`,
    },
    {
      label: 'LINQ Explained',
      language: 'csharp',
      code: `// ── LINQ is extension methods on IEnumerable<T> ──────────────────────
var orders = new[]
{
    new { Id = 1, Customer = "Alice", Total = 150m, Status = "shipped"   },
    new { Id = 2, Customer = "Bob",   Total = 80m,  Status = "pending"   },
    new { Id = 3, Customer = "Alice", Total = 200m, Status = "shipped"   },
    new { Id = 4, Customer = "Carol", Total = 50m,  Status = "cancelled" },
};

// All of these are extension method calls on IEnumerable<T>
var aliceTotal = orders
    .Where(o => o.Customer == "Alice")  // ext on IEnumerable<T>
    .Where(o => o.Status == "shipped")
    .Sum(o => o.Total);                 // scalar terminal operator

Console.WriteLine(aliceTotal);  // 350

// ── Write your own LINQ-like extension ────────────────────────────────
public static class EnumerableExtensions
{
    // ForEach — not in standard LINQ
    public static void ForEach<T>(this IEnumerable<T> source, Action<T> action)
    {
        ArgumentNullException.ThrowIfNull(source);
        ArgumentNullException.ThrowIfNull(action);
        foreach (var item in source) action(item);
    }

    // Batch/Chunk — pre-.NET 6 version
    public static IEnumerable<T[]> InBatches<T>(this IEnumerable<T> source, int size)
    {
        var batch = new List<T>(size);
        foreach (var item in source)
        {
            batch.Add(item);
            if (batch.Count == size) { yield return [..batch]; batch.Clear(); }
        }
        if (batch.Count > 0) yield return [..batch];
    }
}

orders
    .Where(o => o.Status == "shipped")
    .ForEach(o => Console.WriteLine($"Shipped: #{o.Id} {o.Total:C}"));

foreach (var batch in Enumerable.Range(1, 10).InBatches(3))
    Console.WriteLine(string.Join(", ", batch));
// 1, 2, 3
// 4, 5, 6
// 7, 8, 9
// 10`,
    },
    {
      label: 'Extending Interfaces',
      language: 'csharp',
      code: `// ── Extend an interface to add behaviour to all implementors ──────────
public interface IRepository<T>
{
    T? FindById(int id);
    IEnumerable<T> GetAll();
    void Save(T item);
}

public static class RepositoryExtensions
{
    // Works for every IRepository<T> — no changes to the interface needed
    public static T GetOrThrow<T>(this IRepository<T> repo, int id)
    {
        var item = repo.FindById(id);
        if (item is null)
            throw new KeyNotFoundException($"Item {id} not found.");
        return item;
    }

    public static bool Exists<T>(this IRepository<T> repo, int id) =>
        repo.FindById(id) is not null;

    public static int Count<T>(this IRepository<T> repo) =>
        repo.GetAll().Count();

    // Generic constraint in extension — works on any IRepository<T> where T has an Id
    public static IEnumerable<T> GetPage<T>(
        this IRepository<T> repo, int page, int pageSize) =>
        repo.GetAll().Skip((page - 1) * pageSize).Take(pageSize);
}

// Usage on any implementation
public class InMemoryProductRepo : IRepository<Product>
{
    private readonly Dictionary<int, Product> _store = new();
    public Product? FindById(int id)     => _store.GetValueOrDefault(id);
    public IEnumerable<Product> GetAll() => _store.Values;
    public void Save(Product p)          => _store[p.Id] = p;
}

var repo = new InMemoryProductRepo();
repo.Save(new Product { Id = 1, Name = "Widget" });

Console.WriteLine(repo.Exists(1));    // True
Console.WriteLine(repo.Exists(99));   // False
Console.WriteLine(repo.Count());      // 1
var p = repo.GetOrThrow(1);           // returns Product
// repo.GetOrThrow(99);               // throws KeyNotFoundException`,
    },
    {
      label: 'Fluent Builder',
      language: 'csharp',
      code: `// ── Mutable builder with fluent extension methods ────────────────────
public class EmailMessage
{
    public string        From    { get; set; } = "";
    public string        To      { get; set; } = "";
    public string        Subject { get; set; } = "";
    public string        Body    { get; set; } = "";
    public bool          IsHtml  { get; set; }
    public List<string>  Cc      { get; }      = new();
}

public static class EmailExtensions
{
    public static EmailMessage From(this EmailMessage m, string from)
        { m.From = from; return m; }

    public static EmailMessage To(this EmailMessage m, string to)
        { m.To = to; return m; }

    public static EmailMessage WithSubject(this EmailMessage m, string s)
        { m.Subject = s; return m; }

    public static EmailMessage WithBody(this EmailMessage m, string b)
        { m.Body = b; return m; }

    public static EmailMessage AsHtml(this EmailMessage m)
        { m.IsHtml = true; return m; }

    public static EmailMessage AddCc(this EmailMessage m, string cc)
        { m.Cc.Add(cc); return m; }
}

// ── Clean fluent call site — reads like a sentence ─────────────────────
var email = new EmailMessage()
    .From("sender@example.com")
    .To("recipient@example.com")
    .WithSubject("Order Confirmation")
    .WithBody("<h1>Thank you!</h1>")
    .AsHtml()
    .AddCc("manager@example.com");

Console.WriteLine(email.Subject);   // Order Confirmation
Console.WriteLine(email.IsHtml);    // True
Console.WriteLine(email.Cc[0]);     // manager@example.com`,
    },
    {
      label: 'Common Pitfalls',
      language: 'csharp',
      code: `// ── Pitfall 1: instance method shadows extension ──────────────────────
public class Logger
{
    public void Log(string msg) => Console.WriteLine($"[Instance] {msg}");
}

public static class LoggerExtensions
{
    public static void Log(this Logger l, string msg) =>
        Console.WriteLine($"[Extension] {msg}");
}

var logger = new Logger();
logger.Log("test");  // [Instance] test — instance method ALWAYS wins

// ── Pitfall 2: namespace not imported ─────────────────────────────────
// namespace MyApp.Extensions { public static class StringExt { ... } }
// Without 'using MyApp.Extensions;' the extension is invisible.
// Error: 'string' does not contain a definition for 'Truncate'

// ── Pitfall 3: extending object — pollutes everything ─────────────────
// BAD — every type in the entire codebase gets this method
public static class BadExtensions
{
    public static bool IsNull(this object? obj) => obj is null;
}
// int x = 5; x.IsNull()  — syntactically valid but terrible for IntelliSense

// ── Pitfall 4: null dereference in extension body ─────────────────────
public static class UnsafeExtensions
{
    // BAD: parameter typed as string (not string?) but no null check in body
    public static string Upper(this string s) => s.ToUpper(); // NRE if s is null
}

// GOOD: type as nullable AND guard the body
public static class SafeExtensions
{
    public static string Upper(this string? s) =>
        s is null ? string.Empty : s.ToUpper();
}

// ── Pitfall 5: using extension instead of adding to own type ──────────
public class Order { public decimal Total { get; set; } }

// BAD — you own Order, just add the method directly with private access
public static class OrderExtensions
{
    public static bool IsHighValue(this Order o) => o.Total > 1000;
}

// GOOD — method on the class (access to all private fields)
// public bool IsHighValue() => _total > _discount > 1000;  // can use private state`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Instance method added later silently shadows your extension',
      wrong: `// Your extension works fine today
public static class OrderExtensions
{
    public static bool IsUrgent(this Order o) => o.Priority > 8;
}

var order = GetOrder();
order.IsUrgent();   // calls your extension — works as expected

// Six months later, the Order class gets a new method:
// public bool IsUrgent() => this.DueDate < DateTime.UtcNow.AddDays(1);

// NOW your extension is silently ignored everywhere.
// All callers get the instance method with different logic — no compiler warning.`,
      right: `// If you OWN the type, always add the method directly to the class:
public class Order
{
    public int Priority { get; set; }
    public bool IsUrgent() => Priority > 8;   // full access, always wins
}

// If you DON'T own the type, extension is appropriate —
// but document that it may be shadowed in future library versions.`,
      explanation: 'Instance methods always win over extension methods with the same signature. If a class later adds an instance method matching your extension, all call sites silently switch to the new method with no compiler warning or error. For types you own, always add methods directly to the class to avoid this invisible behavior change.',
    },
    {
      title: 'Extending object — pollutes IntelliSense for every type',
      wrong: `// This method appears on EVERY type in the entire codebase
public static class ObjectExtensions
{
    public static bool IsNull(this object? obj) => obj is null;
    public static string ToJson(this object obj) => JsonSerializer.Serialize(obj);
    public static void Dump(this object obj) => Console.WriteLine(obj);
}

// Consequences: IntelliSense for int, string, DbContext, HttpClient...
// all show IsNull(), ToJson(), Dump() — huge noise, confuses consumers.`,
      right: `// Restrict to the narrowest type that makes sense
public static class NullableStringExtensions
{
    public static bool IsNullOrEmpty(this string? s) =>
        string.IsNullOrEmpty(s);
}

// For debugging utilities, use a helper method not an extension:
static void Dump(object? obj) => Console.WriteLine(obj);

// Or limit to a specific marker interface your types implement
public static class DumpableExtensions
{
    public static void Dump(this IDumpable d) => Console.WriteLine(d.ToDebugString());
}`,
      explanation: 'Extending object attaches your method to every single type — int, string, Task, HttpClient, your domain objects, everything. This floods IntelliSense with irrelevant suggestions and makes code harder to read and navigate. Always extend the most specific type that needs the method.',
    },
    {
      title: 'Forgetting the using directive — extension method "not found"',
      wrong: `// Extension defined in a different namespace
namespace MyApp.Extensions
{
    public static class StringExtensions
    {
        public static string Truncate(this string s, int max) => s[..Math.Min(max, s.Length)];
    }
}

// In another file — namespace not imported:
string title = "Very long title that needs truncating";
title.Truncate(20);   // compile error: 'string' does not contain a definition for 'Truncate'
// Developer is confused because the method exists but isn't visible`,
      right: `// Add the using directive at the top of the file
using MyApp.Extensions;   // brings StringExtensions into scope

string title = "Very long title that needs truncating";
Console.WriteLine(title.Truncate(20));   // works

// Pro tip: use global using in a shared file for widely-used extensions
// global using MyApp.Extensions;   // applies to all files in the project`,
      explanation: 'Extension methods are only visible when their containing namespace is imported with a using directive. This is the most common reason for a "method does not exist" error on a type where you know an extension is defined. Consider using global usings for extension namespaces your project uses everywhere.',
    },
    {
      title: 'Null dereference inside the extension body — forgetting to check the parameter',
      wrong: `// Extension declared to accept nullable string but body dereferences without checking
public static class StringExtensions
{
    public static string Shorten(this string? s, int max)
    {
        return s.Length <= max ? s : s[..max];   // NullReferenceException if s is null!
    }
}

string? input = null;
input.Shorten(5);   // call succeeds (no NRE at call site)...
                    // ...but throws NullReferenceException inside the method body`,
      right: `public static class StringExtensions
{
    public static string Shorten(this string? s, int max)
    {
        if (s is null) return string.Empty;   // or throw ArgumentNullException if null is invalid
        return s.Length <= max ? s : s[..max];
    }
}

// Alternatively, document that null is not allowed and use non-nullable type:
public static string Shorten(this string s, int max)
{
    ArgumentNullException.ThrowIfNull(s);
    return s.Length <= max ? s : s[..max];
}`,
      explanation: 'The call site does not throw NullReferenceException for a null receiver — the null is just passed as the first argument. But if the method body dereferences that argument without checking, you get NRE inside the method. Decide upfront: if null is valid, handle it (return a default or empty value); if not, validate with ArgumentNullException.ThrowIfNull and use the non-nullable type annotation.',
    },
    {
      title: 'Using extension methods on a type you own instead of adding to the class',
      wrong: `// You own Customer — but you put business logic in an extension class
public class Customer
{
    public string Name     { get; set; } = "";
    private decimal _creditLimit;
    internal List<Order> _orders = new();
}

public static class CustomerExtensions
{
    // Can't access _creditLimit or _orders — they're private/internal
    public static bool CanPlaceOrder(this Customer c, decimal amount)
        => amount < 10_000m;  // wrong logic — can't see _creditLimit!
}`,
      right: `// Add directly to the class — full access to private state
public class Customer
{
    public string Name { get; set; } = "";
    private decimal _creditLimit;
    private List<Order> _orders = new();

    public bool CanPlaceOrder(decimal amount) =>
        amount <= _creditLimit && _orders.Count < 50;  // uses private fields
}`,
      explanation: 'Extension methods compile to external static calls and cannot access private or protected members. If your business logic needs internal state to work correctly, put the method inside the class where it belongs. Reserve extension methods for types you do not own, sealed types, interfaces, or true utility methods that only need public API access.',
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'What are the three requirements for declaring an extension method?',
      options: [
        'It must be in a sealed class, return void, and have no parameters',
        'It must be a static method, in a non-nested static class, with the first parameter prefixed by this',
        'It must be a virtual method, in a partial class, and override a base method',
        'It must implement IExtension, be in a public class, and be marked with [Extension]',
      ],
      answer: 1,
      explanation: 'An extension method must be: (1) <code>static</code>, (2) inside a non-nested <code>static class</code>, and (3) have its first parameter marked with the <code>this</code> keyword. The type of that first parameter is the type being extended.',
    },
    {
      q: 'What does the compiler do when you call an extension method?',
      options: [
        'It injects the method into the extended type at runtime via reflection',
        'It rewrites the call to a regular static method call with the instance as the first argument',
        'It creates a derived class that includes the extension method',
        'It uses a proxy object to intercept the call',
      ],
      answer: 1,
      explanation: 'Extension methods are pure syntactic sugar. <code>obj.Truncate(10)</code> is compiled identically to <code>StringExtensions.Truncate(obj, 10)</code>. No runtime mechanism is involved — the IL is a plain static method call.',
    },
    {
      q: 'What happens if a class defines an instance method with the same signature as an extension method?',
      options: [
        'A compile-time error — duplicate method signatures are not allowed',
        'The extension method takes precedence',
        'The instance method takes precedence — the extension is silently ignored',
        'Both are called in order',
      ],
      answer: 2,
      explanation: 'Instance methods always take precedence over extension methods. If a class later adds a method matching an extension you use, your code silently starts calling the instance method — no warning. This is why you should prefer adding methods directly to types you own.',
    },
    {
      q: 'Can an extension method be called on a null reference?',
      options: [
        'No — the runtime throws NullReferenceException before the method is called',
        'Yes — the call compiles to a static method call, so null is passed as the first argument',
        'Only if the method is marked with [AllowNull]',
        'Only on value types',
      ],
      answer: 1,
      explanation: 'Because the compiler turns <code>nullRef.MyExtension()</code> into <code>MyClass.MyExtension(nullRef)</code>, no member access occurs at the call site — so no NullReferenceException is thrown there. The method body is responsible for null-checking the first parameter if needed.',
    },
    {
      q: 'What is the relationship between LINQ and extension methods?',
      options: [
        'LINQ is a language keyword unrelated to extension methods',
        'LINQ uses extension methods internally but you cannot write your own',
        'All LINQ operators (Where, Select, OrderBy, etc.) are extension methods on IEnumerable<T> and IQueryable<T>',
        'LINQ methods are instance methods on the Array class only',
      ],
      answer: 2,
      explanation: 'Every LINQ standard query operator is an extension method in <code>System.Linq.Enumerable</code> (for <code>IEnumerable&lt;T&gt;</code>) or <code>System.Linq.Queryable</code> (for <code>IQueryable&lt;T&gt;</code>). You can write your own LINQ-style operators in exactly the same way.',
    },
    {
      q: 'Why should you avoid extension methods on the object type?',
      options: [
        'object extensions cause compile-time errors in some project configurations',
        'Extending object attaches the method to every type in the codebase, polluting IntelliSense everywhere',
        'object extensions cannot be called at runtime due to boxing',
        'object is sealed and cannot be extended',
      ],
      answer: 1,
      explanation: 'Every type in C# inherits from <code>object</code>. An extension on <code>object</code> appears on every single type — <code>int</code>, <code>string</code>, <code>Task</code>, <code>HttpClient</code>, your domain models — polluting IntelliSense with noise and making code harder to navigate. Always extend the most specific type that needs the method.',
    },
    {
      q: 'Why do extension methods need a using directive to be visible?',
      options: [
        'To prevent circular dependencies between assemblies',
        'Extension methods are only in scope when their containing namespace is imported — visibility is namespace-scoped, not project-scoped',
        'To ensure the static class is compiled before being used',
        'It is only required in .NET Framework, not .NET Core',
      ],
      answer: 1,
      explanation: 'Extension methods are defined in static classes within namespaces. Like any other type or member, they are only visible at a call site when the namespace is imported with a <code>using</code> directive (or a <code>global using</code>). This keeps extension method discovery explicit and avoids accidental naming conflicts from unrelated extension libraries.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Can extension methods access private members of the extended type?',
      a: 'No. Extension methods compile to ordinary static method calls — they have exactly the same access as any external caller. They can only access <code>public</code> and <code>internal</code> (within the same assembly) members. If you need private access, add the method directly to the class, use a partial class if you own the source, or refactor the type to expose a suitable API.',
    },
    {
      q: 'Do I need to import a namespace to use extension methods?',
      a: 'Yes. Extension methods are only in scope when the namespace containing their static class is imported with a <code>using</code> directive. This is intentional — it prevents accidental extension discovery and lets you control which sets of extensions are available per file. Forgetting the import is the most common reason for a "method not found" compiler error on an extension you know exists. Use <code>global using</code> in a shared file for extension namespaces your entire project uses.',
    },
    {
      q: 'How does the fluent API pattern relate to extension methods?',
      a: 'A fluent API is built by having methods return the type they operate on (or a new instance of it), enabling chaining: <code>obj.A().B().C()</code>. Extension methods are ideal for fluent APIs because they let you add chaining behaviour to types you do not own without subclassing. Each extension returns the same type — for mutable builders the same object; for immutable types a new modified instance. ASP.NET Core\'s middleware pipeline and EF Core\'s query builder are large-scale examples.',
    },
    {
      q: 'When should I prefer adding a method directly to a class over using an extension?',
      a: 'Always prefer the class if you own the type. Instance methods have full access to private members, are more discoverable (they appear in the class documentation and IntelliSense without a using directive), cannot be silently shadowed later, and clearly communicate ownership. Use extension methods when: (1) you do not own or cannot modify the type, (2) the type is sealed, (3) you want to add utilities to an interface without adding a required member, or (4) you are building a fluent DSL on a framework type.',
    },
    {
      q: 'Can extension methods be generic?',
      a: 'Yes — extension methods can have their own generic type parameters with constraints: <code>public static T? FirstOrDefault&lt;T&gt;(this IEnumerable&lt;T&gt; source, Func&lt;T, bool&gt; predicate)</code>. The compiler infers the type argument from the call site so you rarely specify it explicitly. This is exactly how all the standard LINQ operators are defined. Constraints like <code>where T : class</code>, <code>where T : IComparable&lt;T&gt;</code>, or <code>where T : new()</code> are fully supported.',
    },
    {
      q: 'What is the difference between extension methods and default interface methods (C# 8)?',
      a: 'Extension methods are defined externally in a static class — they are resolved at compile time based on the declared type, cannot be overridden in implementing classes, and do not participate in virtual dispatch. Default interface methods are actual virtual members on the interface — implementing classes can override them, they participate in polymorphism, and they appear in the interface\'s own type signature. Use default interface methods when you want implementing classes to be able to specialise the behaviour; use extension methods for utility that should not be overridable.',
    },
    {
      q: 'Can I add extension methods to a sealed class?',
      a: 'Yes — extension methods work on sealed classes because they are external static calls, not inheritance. You cannot subclass a sealed class, but you can absolutely write <code>static class StringExtensions { public static string Truncate(this string s, int max) ... }</code> — <code>string</code> is sealed and this works fine. This is one of the primary use cases for extension methods: adding utility methods to sealed BCL types like <code>string</code>, <code>DateTime</code>, or <code>Stream</code>.',
    },
  ];

  challenge: Challenge = {
    title: 'Fluent Validation Pipeline',
    description: `Build a set of extension methods that create a fluent validation DSL for <code>string</code>.
1. Create a <code>ValidationResult</code> class with <code>string FieldName</code>, <code>string? Value</code>, <code>List&lt;string&gt; Errors</code>, and <code>bool IsValid</code>.
2. Add extension method <code>Validate(this string? value, string fieldName)</code> that returns a new <code>ValidationResult</code>.
3. Add extension methods on <code>ValidationResult</code>: <code>IsRequired()</code>, <code>MinLength(int min)</code>, <code>MaxLength(int max)</code>, <code>Matches(string pattern, string message)</code>. Each adds an error string to <code>Errors</code> if the rule fails and returns <code>this</code> for chaining.
4. Demonstrate validating a username: required, 3–20 chars, alphanumeric only.`,
    language: 'csharp',
    hints: [
      'ValidationResult keeps a reference to the original string so each method can validate it',
      'IsRequired: add error if Value is null or empty',
      'MinLength: add error if (Value?.Length ?? 0) < min',
      'Matches: use Regex.IsMatch(Value ?? "", pattern) — add System.Text.RegularExpressions',
    ],
    starterCode: `public class ValidationResult
{
    public string   FieldName { get; init; } = "";
    public string?  Value     { get; init; }
    public List<string> Errors { get; } = new();
    public bool IsValid => Errors.Count == 0;
}

public static class ValidationExtensions
{
    public static ValidationResult Validate(this string? value, string fieldName)
        => new ValidationResult { FieldName = fieldName, Value = value };

    // TODO: IsRequired
    public static ValidationResult IsRequired(this ValidationResult r)
        => throw new NotImplementedException();

    // TODO: MinLength
    public static ValidationResult MinLength(this ValidationResult r, int min)
        => throw new NotImplementedException();

    // TODO: MaxLength
    public static ValidationResult MaxLength(this ValidationResult r, int max)
        => throw new NotImplementedException();

    // TODO: Matches — use Regex.IsMatch
    public static ValidationResult Matches(this ValidationResult r, string pattern, string message)
        => throw new NotImplementedException();
}

// Expected usage:
var result = "ab!".Validate("Username")
    .IsRequired()
    .MinLength(3)
    .MaxLength(20)
    .Matches("^[a-zA-Z0-9]+$", "must be alphanumeric");

Console.WriteLine(result.IsValid);   // False
foreach (var e in result.Errors) Console.WriteLine(e);`,
    solution: `using System.Text.RegularExpressions;

public class ValidationResult
{
    public string   FieldName { get; init; } = "";
    public string?  Value     { get; init; }
    public List<string> Errors { get; } = new();
    public bool IsValid => Errors.Count == 0;
}

public static class ValidationExtensions
{
    public static ValidationResult Validate(this string? value, string fieldName)
        => new ValidationResult { FieldName = fieldName, Value = value };

    public static ValidationResult IsRequired(this ValidationResult r)
    {
        if (string.IsNullOrEmpty(r.Value))
            r.Errors.Add($"{r.FieldName} is required.");
        return r;
    }

    public static ValidationResult MinLength(this ValidationResult r, int min)
    {
        if ((r.Value?.Length ?? 0) < min)
            r.Errors.Add($"{r.FieldName} must be at least {min} characters.");
        return r;
    }

    public static ValidationResult MaxLength(this ValidationResult r, int max)
    {
        if ((r.Value?.Length ?? 0) > max)
            r.Errors.Add($"{r.FieldName} must be at most {max} characters.");
        return r;
    }

    public static ValidationResult Matches(this ValidationResult r, string pattern, string message)
    {
        if (!Regex.IsMatch(r.Value ?? "", pattern))
            r.Errors.Add($"{r.FieldName} {message}.");
        return r;
    }
}

var result = "ab!".Validate("Username")
    .IsRequired()
    .MinLength(3)
    .MaxLength(20)
    .Matches("^[a-zA-Z0-9]+$", "must be alphanumeric");

Console.WriteLine(result.IsValid);  // False
// Username must be at least 3 characters.
// Username must be alphanumeric.`,
  };

  revision: RevisionSummary = {
    oneLiner: 'Extension methods are static methods with a this-prefixed first parameter — compiled to plain static calls. They add methods to types you do not own, power all of LINQ, and enable fluent APIs. Instance methods always win over extensions with the same signature.',
    mustKnow: [
      'Requirements: static method, in a non-nested static class, first parameter prefixed with this.',
      'Compiled to ordinary static calls: obj.Ext(args) → ExtClass.Ext(obj, args). No runtime magic.',
      'Visible only when the extension\'s namespace is imported with using. Missing using = "method not found".',
      'Cannot access private/protected members — same access as any external caller.',
      'Instance methods always win over extensions with the same signature — silently, with no warning.',
      'Can be called on null (no NRE at call site). Body must check and handle null explicitly.',
      'LINQ is entirely extension methods on IEnumerable<T>/IQueryable<T> — you can write your own the same way.',
    ],
    interviewFocus: [
      'What are the three requirements for an extension method? (static method, static class, this on first parameter)',
      'What does the compiler do with extension method calls? (rewrites to static method call — IL is identical)',
      'Can extension methods access private members? (No — same access as any external caller)',
      'What happens when an instance method and extension method have the same signature? (instance always wins — silently)',
      'Can you call an extension method on null? (Yes — null is just passed as first arg; body must guard against it)',
    ],
  };
}
