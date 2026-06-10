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
  selector: 'app-csharp-extension-methods',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './extension-methods.html',
  styleUrl: './extension-methods.scss',
})
export class CsharpExtensionMethods {

  quickRef: QuickRefItem[] = [
    { name: 'this T param',          type: 'syntax',   desc: 'First parameter with this modifier — declares the type being extended and the instance name', since: 'C# 3' },
    { name: 'static class',          type: 'keyword',  desc: 'Extension methods must live in a non-nested static class — the class itself is never instantiated', since: 'C# 3' },
    { name: 'IEnumerable<T>',        type: 'interface',desc: 'Base interface extended by LINQ — Where, Select, OrderBy, etc. are all extension methods on it', since: 'C# 3' },
    { name: 'using namespace',       type: 'keyword',  desc: 'Extension methods are only visible when their containing namespace is imported', since: 'C# 3' },
    { name: 'Fluent API',            type: 'syntax',   desc: 'Pattern where extension methods return the same type, enabling method chaining: obj.Step1().Step2()', since: 'C# 3' },
    { name: 'null check',            type: 'syntax',   desc: 'Extension methods can be called on null — check the extended parameter before dereferencing it', since: 'C# 3' },
    { name: 'interface extension',   type: 'syntax',   desc: 'Extend an interface to add behaviour to every implementor without modifying the interface', since: 'C# 3' },
    { name: 'cannot access private', type: 'constraint', desc: 'Extension methods are syntactic sugar for static calls — they cannot access private/protected members', since: 'C# 3' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'How extension methods work',
      points: [
        'An extension method is a <code>static</code> method in a <code>static</code> class whose first parameter has the <code>this</code> modifier. The type of that parameter is the type being extended.',
        'The compiler rewrites every call <code>obj.MyExtension(args)</code> into <code>MyStaticClass.MyExtension(obj, args)</code> — no runtime magic, just syntax sugar.',
        'The method must be in a namespace that is imported with <code>using</code>. If the namespace is not imported, the extension method is invisible at the call site.',
        'Extension methods cannot access <code>private</code> or <code>protected</code> members — they are compiled to ordinary static calls with no special access.',
      ],
    },
    {
      heading: 'LINQ is built entirely on extension methods',
      points: [
        'Every LINQ operator (<code>Where</code>, <code>Select</code>, <code>OrderBy</code>, <code>GroupBy</code>, <code>ToList</code>, etc.) is an extension method on <code>IEnumerable&lt;T&gt;</code> or <code>IQueryable&lt;T&gt;</code> in the <code>System.Linq</code> namespace.',
        'Because they extend an interface, they work on any type implementing that interface: arrays, lists, dictionaries, custom collections.',
        'The deferred execution of LINQ is a property of the iterator pattern and lambda expressions — extension methods themselves do not add laziness.',
        'Understanding that LINQ is extension methods demystifies it completely: you can write your own "LINQ-like" operators the same way.',
      ],
    },
    {
      heading: 'Extending interfaces',
      points: [
        'Extension methods on an interface automatically apply to every type that implements the interface — without modifying the interface or any implementor.',
        'This is how you can add "default utility methods" to third-party or sealed interfaces you don\'t control.',
        'C# 8 introduced <em>default interface methods</em> (actual virtual members on the interface), but extension methods are often simpler and more broadly compatible.',
        'Be careful: if an implementor defines a method with the same name as an extension, the instance method takes precedence.',
      ],
    },
    {
      heading: 'Null-safe extension methods',
      points: [
        'Unlike regular instance methods, extension methods can be called on a <code>null</code> reference without throwing a <code>NullReferenceException</code> at the call site — the check just results in a normal method call with <code>null</code> as the first argument.',
        'You can exploit this to write safe null-guard utilities: <code>null.IsNullOrEmpty()</code> is valid if <code>IsNullOrEmpty</code> is an extension on <code>string?</code>.',
        'Always document whether your extension method handles <code>null</code> gracefully or throws <code>ArgumentNullException</code>.',
        'Throwing <code>ArgumentNullException</code> (not <code>NullReferenceException</code>) is the correct pattern when you require a non-null argument.',
      ],
    },
    {
      heading: 'Fluent API pattern',
      points: [
        'Returning <code>this</code> (or a transformed version of the input) from an extension method enables method chaining: <code>builder.SetName("x").SetPort(80).Build()</code>.',
        'This pattern is used extensively by ASP.NET Core middleware pipeline, Entity Framework query builder, FluentValidation, and many test frameworks.',
        'For immutable types, each extension returns a new instance. For mutable builders, the same object is returned for chaining.',
        'Fluent APIs are most readable when the extension method names read like an English sentence.',
      ],
    },
    {
      heading: 'When NOT to use extension methods',
      points: [
        'If you own the type, prefer adding the method directly to the class — it has full access to private members and is more discoverable.',
        'Avoid extending <code>object</code> — every type then "gains" the method, polluting IntelliSense for the entire codebase.',
        'Do not use extension methods to sneak functionality into a type that genuinely needs a redesign — they can hide design debt.',
        'Extension methods on concrete classes can lead to confusion: if the class later adds a method with the same signature, the extension is silently shadowed.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Basics',
      language: 'csharp',
      code: `// ── Extension method declaration ──────────────────────────────────────
// Must be: static method, in a static class, first param has 'this'
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

// Usage — called as if they are instance methods
string name = "hello world";
Console.WriteLine(name.ToTitleCase());          // Hello world
Console.WriteLine(name.Truncate(5));            // hello…
Console.WriteLine(name.SafeLength());           // 11

string? nullStr = null;
Console.WriteLine(nullStr.IsNullOrEmpty());     // True
Console.WriteLine(nullStr.SafeLength());        // 0  — no NullReferenceException`,
    },
    {
      label: 'LINQ Explained',
      language: 'csharp',
      code: `// ── LINQ is extension methods on IEnumerable<T> ──────────────────────
using System.Linq;

var orders = new[]
{
    new { Id = 1, Customer = "Alice", Total = 150m, Status = "shipped"   },
    new { Id = 2, Customer = "Bob",   Total = 80m,  Status = "pending"   },
    new { Id = 3, Customer = "Alice", Total = 200m, Status = "shipped"   },
    new { Id = 4, Customer = "Carol", Total = 50m,  Status = "cancelled" },
};

// These are all extension method calls on IEnumerable<T>
var aliceTotal = orders
    .Where(o => o.Customer == "Alice")          // IEnumerable<T> → IEnumerable<T>
    .Where(o => o.Status == "shipped")
    .Sum(o => o.Total);                         // → decimal

Console.WriteLine(aliceTotal);  // 350

// ── Write your own LINQ-like extension ────────────────────────────────
public static class EnumerableExtensions
{
    // ForEach — not in standard LINQ, easy to add
    public static void ForEach<T>(this IEnumerable<T> source, Action<T> action)
    {
        ArgumentNullException.ThrowIfNull(source);
        ArgumentNullException.ThrowIfNull(action);
        foreach (var item in source) action(item);
    }

    // Chunk into batches
    public static IEnumerable<T[]> InBatches<T>(this IEnumerable<T> source, int size)
    {
        var batch = new List<T>(size);
        foreach (var item in source)
        {
            batch.Add(item);
            if (batch.Count == size) { yield return batch.ToArray(); batch.Clear(); }
        }
        if (batch.Count > 0) yield return batch.ToArray();
    }
}

orders.Where(o => o.Status == "shipped").ForEach(o =>
    Console.WriteLine(\`Shipped: #\${o.Id} £\${o.Total}\`));

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
    // Works for every IRepository<T> without modifying the interface
    public static T GetOrThrow<T>(this IRepository<T> repo, int id)
    {
        var item = repo.FindById(id);
        if (item is null)
            throw new KeyNotFoundException(\`Item \${id} not found.\`);
        return item;
    }

    public static bool Exists<T>(this IRepository<T> repo, int id) =>
        repo.FindById(id) is not null;

    public static int Count<T>(this IRepository<T> repo) =>
        repo.GetAll().Count();
}

// ── Usage on any implementation ───────────────────────────────────────
public class InMemoryProductRepo : IRepository<Product>
{
    private readonly Dictionary<int, Product> _store = new();
    public Product? FindById(int id)      => _store.GetValueOrDefault(id);
    public IEnumerable<Product> GetAll()  => _store.Values;
    public void Save(Product p)           => _store[p.Id] = p;
}

var repo = new InMemoryProductRepo();
repo.Save(new Product { Id = 1, Name = "Widget" });

Console.WriteLine(repo.Exists(1));   // True
Console.WriteLine(repo.Exists(99));  // False
Console.WriteLine(repo.Count());     // 1
var p = repo.GetOrThrow(1);          // returns the product
// repo.GetOrThrow(99);              // throws KeyNotFoundException`,
    },
    {
      label: 'Fluent Builder',
      language: 'csharp',
      code: `// ── Mutable builder with fluent extension methods ────────────────────
public class EmailMessage
{
    public string   From    { get; set; } = "";
    public string   To      { get; set; } = "";
    public string   Subject { get; set; } = "";
    public string   Body    { get; set; } = "";
    public bool     IsHtml  { get; set; }
    public List<string> Cc  { get; } = new();
}

public static class EmailExtensions
{
    public static EmailMessage From(this EmailMessage m, string from)    { m.From = from;    return m; }
    public static EmailMessage To(this EmailMessage m, string to)        { m.To = to;        return m; }
    public static EmailMessage WithSubject(this EmailMessage m, string s){ m.Subject = s;    return m; }
    public static EmailMessage WithBody(this EmailMessage m, string b)   { m.Body = b;       return m; }
    public static EmailMessage AsHtml(this EmailMessage m)               { m.IsHtml = true;  return m; }
    public static EmailMessage AddCc(this EmailMessage m, string cc)     { m.Cc.Add(cc);     return m; }
}

// ── Clean fluent call site ─────────────────────────────────────────────
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
      code: `// ── Pitfall 1: shadowed by instance method ────────────────────────────
public class Logger
{
    public void Log(string msg) => Console.WriteLine(\`[Instance] \${msg}\`);
}

public static class LoggerExtensions
{
    public static void Log(this Logger l, string msg) =>
        Console.WriteLine(\`[Extension] \${msg}\`);
}

var logger = new Logger();
logger.Log("test");  // [Instance] test — instance method wins

// ── Pitfall 2: namespace not imported ─────────────────────────────────
// namespace MyApp.Extensions { public static class StringExt { ... } }
// Without 'using MyApp.Extensions;' the extension is invisible

// ── Pitfall 3: extending object (pollutes everything) ─────────────────
// BAD — every type gets this method, clutters IntelliSense
public static class BadExtensions
{
    public static bool IsNull(this object? obj) => obj is null;
}
// int x = 5; x.IsNull()  — works but feels wrong

// ── Pitfall 4: hiding design debt ─────────────────────────────────────
// If you own the class, prefer adding the method directly
public class Order { public decimal Total { get; set; } }

// Prefer: method on the class (has private access)
// public bool IsHighValue() => Total > 1000;

// OK if you don't own Order, but prefer the above for your own types
public static class OrderExtensions
{
    public static bool IsHighValue(this Order o) => o.Total > 1000;
}

// ── Best practice: IsNullOrEmpty on string? ───────────────────────────
// Extension is safe to call on null — check in body
public static class SafeStringExt
{
    public static bool IsNullOrWhiteSpace(this string? s) =>
        string.IsNullOrWhiteSpace(s);
}

string? s = null;
Console.WriteLine(s.IsNullOrWhiteSpace()); // True — no NullReferenceException`,
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'What are the three requirements for declaring an extension method?',
      options: [
        'It must be in a sealed class, return void, and have no parameters',
        'It must be a static method, in a static class, with the first parameter prefixed by this',
        'It must be a virtual method, in a partial class, and override a base method',
        'It must implement IExtension, be in a public class, and be marked with [Extension]',
      ],
      answer: 1,
      explanation: 'An extension method must be (1) <code>static</code>, (2) inside a non-nested <code>static class</code>, and (3) have its first parameter marked with the <code>this</code> keyword. The type of that parameter is the type being extended.',
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
      explanation: 'Extension methods are pure syntactic sugar. <code>obj.Truncate(10)</code> is compiled identically to <code>StringExtensions.Truncate(obj, 10)</code>. No runtime mechanism is involved — the IL is identical to a static method call.',
    },
    {
      q: 'What happens if a class defines an instance method with the same signature as an extension method?',
      options: [
        'A compile-time error is thrown — duplicate method signatures are not allowed',
        'The extension method takes precedence over the instance method',
        'The instance method takes precedence — the extension method is silently ignored',
        'Both methods are called in order — the instance method first, then the extension',
      ],
      answer: 2,
      explanation: 'Instance methods always take precedence over extension methods. If the class later adds a method matching an extension you use, your code silently starts calling the instance method. This is a key reason to prefer adding methods to your own types directly rather than via extensions.',
    },
    {
      q: 'Can an extension method be called on a null reference?',
      options: [
        'No — the runtime throws NullReferenceException before the method is called',
        'Yes — the call compiles to a static method call, so null is just passed as the first argument',
        'Only if the method is marked with [AllowNull]',
        'Only on value types, not reference types',
      ],
      answer: 1,
      explanation: 'Because the compiler turns <code>nullRef.MyExtension()</code> into <code>MyClass.MyExtension(nullRef)</code>, no member access occurs before entering the method — so no <code>NullReferenceException</code> is thrown at the call site. The method body is responsible for null-checking the first parameter.',
    },
    {
      q: 'What is the relationship between LINQ and extension methods?',
      options: [
        'LINQ is a language keyword unrelated to extension methods',
        'LINQ uses extension methods internally but you cannot write your own LINQ-style operators',
        'All LINQ operators (Where, Select, OrderBy, etc.) are extension methods on IEnumerable<T> and IQueryable<T>',
        'LINQ methods are instance methods on the Array class only',
      ],
      answer: 2,
      explanation: 'Every LINQ standard query operator is an extension method defined in <code>System.Linq.Enumerable</code> (for <code>IEnumerable&lt;T&gt;</code>) or <code>System.Linq.Queryable</code> (for <code>IQueryable&lt;T&gt;</code>). You can write your own LINQ-style operators in exactly the same way.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Can extension methods access private members of the extended type?',
      a: 'No. Extension methods are compiled to ordinary static method calls — they have the same access as any external caller. They can only access <code>public</code> and <code>internal</code> (within the same assembly) members. If you need private access, you must add the method directly to the class, use a partial class (if you own the source), or refactor the type to expose a suitable API.',
    },
    {
      q: 'Do I need to import a namespace to use extension methods?',
      a: 'Yes. Extension methods are only in scope when the namespace containing their static class is imported with a <code>using</code> directive (or with a global using in a shared file). This is intentional — it prevents accidental extension method discovery and lets you control which sets of extensions are available. Forgetting the import is a common reason for "method not found" compiler errors on extension methods.',
    },
    {
      q: 'How does the fluent API pattern relate to extension methods?',
      a: 'A fluent API is built by having methods return the type they operate on, enabling chaining: <code>obj.A().B().C()</code>. Extension methods are ideal for fluent APIs because they let you add chaining behaviour to types you don\'t own (e.g. third-party builders or framework types) without subclassing. Each extension returns the same type (or a modified copy for immutable types), keeping the chain alive. ASP.NET Core\'s middleware pipeline and Entity Framework\'s query builder are large-scale examples.',
    },
    {
      q: 'When should I prefer adding a method directly to a class over using an extension method?',
      a: 'Always prefer adding to the class directly if you own the type. Instance methods have full access to private and protected members, are easier to discover, show up cleanly in documentation, and cannot be accidentally shadowed. Extension methods are the right tool when: (1) you do not own or cannot modify the type, (2) the type is sealed and you cannot subclass it, (3) you want to add utility methods to an interface without adding a required member, or (4) you are building a fluent DSL on top of a framework type.',
    },
    {
      q: 'Can extension methods be generic?',
      a: 'Yes. Extension methods can have their own generic type parameters, and those parameters can be constrained just like on any generic method. For example: <code>public static T? FirstOrDefault&lt;T&gt;(this IEnumerable&lt;T&gt; source, Func&lt;T, bool&gt; predicate)</code>. The compiler infers the type argument from the call site, so you rarely need to specify it explicitly. This is exactly how the standard LINQ operators are defined.',
    },
  ];

  challenge: Challenge = {
    title: 'Fluent Validation Pipeline',
    description: `Build a set of extension methods that create a fluent validation DSL for <code>string</code>.
1. Create a <code>ValidationResult</code> class with a <code>bool IsValid</code> property and a <code>List&lt;string&gt; Errors</code>.
2. Add an extension method <code>Validate(this string? value, string fieldName)</code> that starts a chain by returning a new <code>ValidationResult</code>.
3. Add extension methods on <code>ValidationResult</code>: <code>IsRequired()</code>, <code>MinLength(int min)</code>, <code>MaxLength(int max)</code>, <code>Matches(string pattern, string message)</code>. Each should add an error message to <code>Errors</code> if the rule fails, and return <code>this</code> for chaining.
4. Demonstrate the chain for validating a username (required, 3–20 chars, alphanumeric only).`,
    language: 'csharp',
    hints: [
      'ValidationResult keeps a reference to the original string value so each method can check it',
      'IsRequired: add error if value is null or empty',
      'MinLength: add error if value?.Length < min',
      'Matches: use Regex.IsMatch(value ?? "", pattern)',
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

    // TODO: IsRequired — add error if null or empty
    public static ValidationResult IsRequired(this ValidationResult r)
        => throw new NotImplementedException();

    // TODO: MinLength
    public static ValidationResult MinLength(this ValidationResult r, int min)
        => throw new NotImplementedException();

    // TODO: MaxLength
    public static ValidationResult MaxLength(this ValidationResult r, int max)
        => throw new NotImplementedException();

    // TODO: Matches — regex pattern
    public static ValidationResult Matches(this ValidationResult r, string pattern, string message)
        => throw new NotImplementedException();
}

// Expected usage:
string username = "ab!";
var result = username.Validate("Username")
    .IsRequired()
    .MinLength(3)
    .MaxLength(20)
    .Matches("^[a-zA-Z0-9]+\$", "must be alphanumeric");

Console.WriteLine(result.IsValid);  // False
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
            r.Errors.Add(\`\${r.FieldName} is required.\`);
        return r;
    }

    public static ValidationResult MinLength(this ValidationResult r, int min)
    {
        if ((r.Value?.Length ?? 0) < min)
            r.Errors.Add(\`\${r.FieldName} must be at least \${min} characters.\`);
        return r;
    }

    public static ValidationResult MaxLength(this ValidationResult r, int max)
    {
        if ((r.Value?.Length ?? 0) > max)
            r.Errors.Add(\`\${r.FieldName} must be at most \${max} characters.\`);
        return r;
    }

    public static ValidationResult Matches(this ValidationResult r, string pattern, string message)
    {
        if (!Regex.IsMatch(r.Value ?? "", pattern))
            r.Errors.Add(\`\${r.FieldName} \${message}.\`);
        return r;
    }
}

var result = "ab!".Validate("Username")
    .IsRequired()
    .MinLength(3)
    .MaxLength(20)
    .Matches("^[a-zA-Z0-9]+\$", "must be alphanumeric");

Console.WriteLine(result.IsValid);  // False — "ab!" is < 3 chars AND not alphanumeric
foreach (var e in result.Errors) Console.WriteLine(e);`,
  };
}
