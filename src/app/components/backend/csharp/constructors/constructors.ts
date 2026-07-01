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
  selector: 'app-csharp-constructors',
  standalone: true,
  imports: [
    CommonModule, CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
    CommonMistakesComponent, RevisionCardComponent,
  ],
  templateUrl: './constructors.html',
  styleUrl: './constructors.scss',
})
export class CsharpConstructors {

  quickRef: QuickRefItem[] = [
    { name: 'this()',              type: 'keyword', desc: 'Chains to another constructor in the same class. The target runs first, then the calling body.', since: 'C# 1' },
    { name: 'base()',              type: 'keyword', desc: 'Calls a constructor in the base class. Must appear in the constructor initializer list.', since: 'C# 1' },
    { name: 'static ctor',        type: 'syntax',  desc: 'Parameterless, no access modifier. Runs once per AppDomain before first type access.', since: 'C# 1' },
    { name: 'primary ctor',       type: 'syntax',  desc: 'C# 12. Parameters on the class declaration, in scope throughout the class body.', since: 'C# 12' },
    { name: 'required',           type: 'keyword', desc: 'C# 11. Forces caller to set a property via an object initializer. Compile-time enforced.', since: 'C# 11' },
    { name: '[SetsRequiredMembers]', type: 'class', desc: 'Attribute that exempts a constructor from the required property check — it guarantees initialization itself.', since: 'C# 11' },
    { name: 'new()',              type: 'keyword', desc: 'Invokes a constructor. Shortened to new() when the type is inferred from context.', since: 'C# 9' },
    { name: 'object initializer', type: 'syntax',  desc: 'Sets properties/fields after the constructor runs: new Foo { X = 1, Y = 2 }.', since: 'C# 3' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Default vs parameterized constructors',
      points: [
        'If you declare <strong>no constructor at all</strong>, C# generates a public default (parameterless) constructor for you that zero-initializes all fields.',
        'The moment you declare <em>any</em> constructor yourself, the compiler stops generating the default one. If you still want <code>new Foo()</code> to work, you must write it explicitly.',
        'Parameterized constructors allow objects to start life in a valid, fully-initialized state — prefer them over "create-then-set" patterns where the object could be used in a partially initialized state.',
        'When there are many optional parameters, use <strong>object initializers</strong> or the <strong>builder pattern</strong> rather than creating a combinatorial explosion of constructor overloads.',
        'Constructor logic should be fast and side-effect-free: validate arguments, store values, done. Heavy work (I/O, network, database) belongs in factory methods or async initializers, not constructors.',
      ],
    },
    {
      heading: 'Constructor chaining with this()',
      points: [
        'Use <code>: this(...)</code> to delegate to another constructor in the same class. This prevents duplicating validation or initialization logic across multiple overloads.',
        'The target constructor runs <em>first</em>, then the calling constructor body runs. Think of the chained constructor as "setup" and the callers as "optional extras."',
        'A common pattern: one "primary" constructor holds all the real logic; other overloads provide defaults and chain into it.',
        'Chaining keeps code DRY — if you later need to add a new field, you only update the one constructor that everyone chains into.',
        'You cannot put both <code>: this(...)</code> and <code>: base(...)</code> on the same constructor. Work around this by chaining through a sibling that calls <code>base(...)</code>.',
      ],
    },
    {
      heading: 'Calling the base constructor with base()',
      points: [
        'When a class inherits from a base class, the base class constructor must run before the derived constructor body. <code>: base(...)</code> selects which base constructor to invoke.',
        'If you omit <code>: base(...)</code>, C# automatically calls the parameterless base constructor. If the base class has no parameterless constructor, you <em>must</em> supply <code>: base(...)</code> explicitly.',
        'You can pass derived constructor parameters straight through to the base: <code>public Dog(string name) : base(name)</code>.',
        'Unlike <code>this()</code>, you cannot chain both <code>: this()</code> and <code>: base()</code> on the same constructor — use <code>this()</code> to forward to a sibling that then calls <code>base()</code>.',
        'Initialization order: base constructor body → derived field initializers → derived constructor body. Understanding this is critical when troubleshooting NullReferenceExceptions during construction.',
      ],
    },
    {
      heading: 'Static constructors',
      points: [
        'A static constructor has no access modifier, no parameters, and is prefixed with <code>static</code>. It is called automatically, exactly once, before any static member is accessed or any instance is created.',
        'Use static constructors to initialize expensive static resources: loading configuration from disk, populating a lookup dictionary, or setting up a connection factory.',
        'You cannot call a static constructor manually, and you cannot predict the exact moment it runs relative to other types — only that it runs before first use of the type.',
        'If a static constructor throws an exception, the type becomes permanently unusable for the lifetime of the application domain — the runtime wraps it in <code>TypeInitializationException</code> on every subsequent access.',
        'Keep static constructor logic minimal: only initialize what truly needs to be shared and ready before any instance is created. For lazy initialization, prefer <code>Lazy&lt;T&gt;</code> instead.',
      ],
    },
    {
      heading: 'C# 12 primary constructors',
      points: [
        'Primary constructors place parameters directly on the class declaration: <code>class Point(int x, int y)</code>. The parameters are in scope throughout the entire class body.',
        'Unlike record primary constructors, class primary constructors do <strong>not</strong> automatically generate public properties — you decide how to expose the values.',
        'This is ideal for dependency injection: <code>class OrderService(IOrderRepo repo, ILogger&lt;OrderService&gt; logger)</code> makes DI boilerplate nearly vanish.',
        'Primary constructor parameters can be captured in lambdas, property initializers, and method bodies — anywhere a field would normally be used.',
        'If you need a backing field (e.g. to mutate the value or to prevent the parameter from being captured as a closure variable), assign the parameter to a field explicitly: <code>private readonly IOrderRepo _repo = repo;</code>.',
      ],
    },
    {
      heading: 'Object initializers and the required keyword',
      points: [
        'Object initializers (<code>new Foo { Name = "Alice", Age = 30 }</code>) set public properties/fields after the constructor runs — no special constructor needed.',
        'They pair naturally with parameterless constructors and are great when most properties are optional — callers only set what they need.',
        '<code>required</code> (C# 11) marks a property as mandatory for object initializers. The compiler rejects <code>new Foo()</code> if a required property is omitted — you get the safety of a parameterized constructor with the flexibility of object initializers.',
        'Records combine these ideas elegantly — use records when you want a named, immutable data container; use classes with <code>required</code> properties when you need mutability or rich behavior.',
        'Constructors annotated with <code>[SetsRequiredMembers]</code> bypass the required check — the attribute signals to the compiler that the constructor itself guarantees all required members are set.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Chaining with this()',
      language: 'csharp',
      code: `public class SimpleHttpClient
{
    private readonly string _baseUrl;
    private readonly int    _timeoutSeconds;
    private readonly bool   _followRedirects;

    // Primary constructor — all validation and assignment lives here
    public SimpleHttpClient(string baseUrl, int timeoutSeconds, bool followRedirects)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(baseUrl);
        if (timeoutSeconds <= 0) throw new ArgumentOutOfRangeException(nameof(timeoutSeconds));

        _baseUrl         = baseUrl;
        _timeoutSeconds  = timeoutSeconds;
        _followRedirects = followRedirects;
    }

    // Convenience overloads — all chain to the primary constructor
    public SimpleHttpClient(string baseUrl, int timeoutSeconds)
        : this(baseUrl, timeoutSeconds, followRedirects: true) { }

    public SimpleHttpClient(string baseUrl)
        : this(baseUrl, timeoutSeconds: 30) { }

    public override string ToString() =>
        $"{_baseUrl} (timeout={_timeoutSeconds}s, redirects={_followRedirects})";
}

// Usage
var c1 = new SimpleHttpClient("https://api.example.com");
var c2 = new SimpleHttpClient("https://api.example.com", 10);
var c3 = new SimpleHttpClient("https://api.example.com", 10, false);
Console.WriteLine(c1); // https://api.example.com (timeout=30s, redirects=True)`,
    },
    {
      label: 'base() inheritance',
      language: 'csharp',
      code: `public abstract class Animal
{
    public string Name { get; }
    public int    Age  { get; }

    protected Animal(string name, int age)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        Name = name;
        Age  = age;
    }

    public abstract string Speak();
}

public class Dog : Animal
{
    public string Breed { get; }

    // Pass name and age up to the base constructor
    public Dog(string name, int age, string breed)
        : base(name, age)          // base runs first
    {
        Breed = breed;
    }

    // Convenience overload — chains to the Dog constructor above
    public Dog(string name, int age)
        : this(name, age, breed: "Mixed") { }

    public override string Speak() => "Woof!";
}

var rex = new Dog("Rex", 3, "Labrador");
Console.WriteLine($"{rex.Name} ({rex.Breed}) says: {rex.Speak()}");
// Rex (Labrador) says: Woof!

// Initialization order when creating 'rex':
// 1. Animal(string name, int age) runs — sets Name, Age
// 2. Derived field initializers run (none in Dog here)
// 3. Dog(string, int, string) body runs — sets Breed`,
    },
    {
      label: 'Static constructor',
      language: 'csharp',
      code: `public class CountryCodeLookup
{
    // Shared, readonly lookup table — expensive to build, built once
    private static readonly Dictionary<string, string> _codes;

    // Static constructor: runs once before any member access
    static CountryCodeLookup()
    {
        Console.WriteLine("Building lookup table...");
        _codes = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["US"] = "United States",
            ["GB"] = "United Kingdom",
            ["DE"] = "Germany",
            ["JP"] = "Japan",
            ["IN"] = "India",
        };
    }

    public static string GetName(string code) =>
        _codes.TryGetValue(code, out var name) ? name : "Unknown";
}

// First access triggers the static constructor
Console.WriteLine(CountryCodeLookup.GetName("US")); // Building lookup table... → United States
Console.WriteLine(CountryCodeLookup.GetName("jp")); // Japan (case-insensitive)
Console.WriteLine(CountryCodeLookup.GetName("ZZ")); // Unknown

// ── Prefer Lazy<T> for optional lazy initialization ───────────────────
public class Config
{
    private static readonly Lazy<Dictionary<string, string>> _settings =
        new(() => LoadFromDisk());  // only called on first .Value access

    public static string? Get(string key) =>
        _settings.Value.TryGetValue(key, out var v) ? v : null;

    private static Dictionary<string, string> LoadFromDisk() => new() { ["MaxRetry"] = "3" };
}`,
    },
    {
      label: 'C# 12 primary constructors',
      language: 'csharp',
      code: `// C# 12: parameters declared on the class declaration
public class OrderService(IOrderRepository repo, ILogger<OrderService> logger)
{
    // Best practice: assign to readonly fields to make intent explicit
    private readonly IOrderRepository _repo   = repo;
    private readonly ILogger          _logger = logger;

    public async Task<Order?> GetOrderAsync(int id)
    {
        _logger.LogInformation("Fetching order {Id}", id);
        return await _repo.FindByIdAsync(id);
    }
}

// Struct with primary constructor
public readonly struct Point(double x, double y)
{
    public double X { get; } = x;
    public double Y { get; } = y;

    public double DistanceTo(Point other) =>
        Math.Sqrt(Math.Pow(X - other.X, 2) + Math.Pow(Y - other.Y, 2));

    public override string ToString() => $"({X}, {Y})";
}

var p1 = new Point(0, 0);
var p2 = new Point(3, 4);
Console.WriteLine(p1.DistanceTo(p2));  // 5
Console.WriteLine(p2);                 // (3, 4)`,
    },
    {
      label: 'required + [SetsRequiredMembers]',
      language: 'csharp',
      code: `// ── required: compile-time object initializer enforcement ───────────
public class UserProfile
{
    public required string Username { get; init; }  // CS9035 if omitted
    public required string Email    { get; init; }  // CS9035 if omitted
    public string? Bio      { get; init; }           // optional
    public string  AvatarUrl { get; init; } = "/default-avatar.png";
}

// Correct
var user = new UserProfile
{
    Username = "alice",
    Email    = "alice@example.com",
    Bio      = "Loves C#.",
};

// Error: new UserProfile { Username = "alice" };  ← CS9035: 'Email' is required

// ── [SetsRequiredMembers]: constructor that guarantees all required fields ──
public class UserProfile2
{
    public required string Username { get; init; }
    public required string Email    { get; init; }

    [System.Diagnostics.CodeAnalysis.SetsRequiredMembers]
    public UserProfile2(string username, string email)
    {
        Username = username;  // compiler trusts that required members are set here
        Email    = email;
    }
}

var u2 = new UserProfile2("bob", "bob@example.com");  // no object initializer needed

// ── Records generate required init properties automatically ──────────────
public record CreateOrderCommand(string CustomerId, string ProductId, int Quantity = 1);

var cmd = new CreateOrderCommand("C1", "P42");
Console.WriteLine(cmd.CustomerId);  // C1
// cmd with { Quantity = 3 } — non-destructive mutation`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Doing heavy work (I/O, async calls) inside a constructor',
      wrong: `public class ReportService
{
    private readonly string _template;

    public ReportService()
    {
        // Blocks the thread; cannot use async; throws on error = object unusable
        _template = File.ReadAllText("template.html");
    }
}`,
      right: `public class ReportService
{
    private string _template = string.Empty;

    // Factory method allows async initialization
    public static async Task<ReportService> CreateAsync()
    {
        var svc = new ReportService();
        svc._template = await File.ReadAllTextAsync("template.html");
        return svc;
    }
}`,
      explanation: 'Constructors run synchronously and cannot be async. Doing I/O, network calls, or database queries in a constructor blocks the thread, prevents proper error handling, and makes the type hard to test. Use a static async factory method (CreateAsync) or initialize lazily via a property backed by Lazy<T>.',
    },
    {
      title: 'Calling virtual methods from a constructor',
      wrong: `public class Base
{
    public Base()
    {
        PrintInfo();   // calls the overridden version, but Derived fields aren't set yet!
    }

    public virtual void PrintInfo() => Console.WriteLine("Base");
}

public class Derived : Base
{
    private readonly string _name = "Derived";

    public override void PrintInfo() => Console.WriteLine(_name);  // prints "" or throws
}`,
      right: `public class Base
{
    public Base() { }

    // Called by derived types after construction completes
    protected virtual void Initialize() { }
}

// Or: avoid the virtual dispatch entirely — use template method after construction
var d = new Derived();
d.Initialize();`,
      explanation: 'When a base constructor calls a virtual method, the overridden version in the derived class runs — but at that point the derived class fields haven\'t been initialized yet (their initializers run after the base constructor). This produces null references or default values. Never call virtual or abstract methods from constructors.',
    },
    {
      title: 'Duplicating validation across overloaded constructors instead of chaining',
      wrong: `public class Email
{
    public Email(string address, bool verified)
    {
        if (string.IsNullOrWhiteSpace(address)) throw new ArgumentException("...");
        if (!address.Contains('@')) throw new ArgumentException("...");
        Address  = address;
        Verified = verified;
    }

    public Email(string address)  // duplicated validation!
    {
        if (string.IsNullOrWhiteSpace(address)) throw new ArgumentException("...");
        if (!address.Contains('@')) throw new ArgumentException("...");
        Address  = address;
        Verified = false;
    }
}`,
      right: `public class Email
{
    public Email(string address, bool verified = false)
    {
        if (string.IsNullOrWhiteSpace(address)) throw new ArgumentException("...");
        if (!address.Contains('@')) throw new ArgumentException("...");
        Address  = address;
        Verified = verified;
    }
    public string Address  { get; }
    public bool   Verified { get; }
}`,
      explanation: 'Duplicated validation across overloads is a maintenance trap — when requirements change, developers update one overload and miss others. Chain overloads with : this(...) or use optional parameters to funnel all calls through a single constructor that owns the validation logic.',
    },
    {
      title: 'Ignoring that the compiler drops the default constructor once you add one',
      wrong: `public class Config
{
    public Config(string path) { /* load from path */ }
}

// Later, trying to deserialize or mock:
var c = new Config();   // CS7036: no argument given for required parameter 'path'
// Many serializers and mock frameworks call the parameterless constructor by default`,
      right: `public class Config
{
    public string Path { get; private set; } = string.Empty;

    public Config(string path) { Path = path; }

    // Explicitly restored for serializers / testing
    public Config() { }
}`,
      explanation: 'Declaring any constructor removes the compiler-generated parameterless one. Serializers (System.Text.Json, Newtonsoft), ORM frameworks, and mock libraries often need a parameterless constructor. Re-add it explicitly when you need both constructor forms, or use [JsonConstructor] to point the serializer at the right one.',
    },
    {
      title: 'Publishing `this` from a constructor (object escape)',
      wrong: `public class EventSource
{
    private static readonly List<EventSource> _all = new();

    public EventSource()
    {
        _all.Add(this);  // 'this' escapes before the constructor finishes
        // If a derived constructor throws after this, _all holds a broken object
    }
}`,
      right: `public class EventSource
{
    private static readonly List<EventSource> _all = new();

    private EventSource() { }  // private; construction is complete

    public static EventSource Create()
    {
        var src = new EventSource();   // fully constructed
        _all.Add(src);                 // safe to share now
        return src;
    }
}`,
      explanation: 'Passing `this` out of a constructor (to an event, collection, or static list) before the constructor finishes is called "object escape". If the constructor fails after the escape, the external holder has a reference to a partially-initialized or inconsistent object. Use a factory method that registers after full construction.',
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'You define one parameterized constructor in a class. What happens to the default (parameterless) constructor?',
      options: [
        'It still exists but is made private.',
        'The compiler no longer generates it — new Foo() is now a compile error.',
        'It still exists and remains public.',
        'It is converted into a static constructor.',
      ],
      answer: 1,
      explanation: 'Once you declare any constructor, the compiler stops auto-generating the parameterless default. You must write it explicitly if you still need it.',
    },
    {
      q: 'In constructor chaining with this(), which constructor body runs first?',
      options: [
        'The one with the this() call, then the target.',
        'Both run in parallel.',
        'The target constructor runs first, then the calling constructor body.',
        'The order is undefined.',
      ],
      answer: 2,
      explanation: 'The chained (target) constructor always runs before the body of the constructor that contains the : this(...) call. This lets you treat the target constructor as "base setup."',
    },
    {
      q: 'When does a static constructor run?',
      options: [
        'Every time a new instance of the class is created.',
        'Only when explicitly called.',
        'Once per AppDomain, before the first instance is created or any static member is accessed.',
        'On application startup, before Main() executes.',
      ],
      answer: 2,
      explanation: 'Static constructors run automatically, exactly once per AppDomain, triggered by first access to the type — either creating an instance or accessing a static member. They cannot be called manually.',
    },
    {
      q: 'Which statement about C# 12 primary constructor parameters on a class is TRUE?',
      options: [
        'They automatically create public properties like record primary constructors do.',
        'They are available throughout the class body but do not automatically create properties or fields.',
        'They can only be used in the constructor body, not in methods.',
        'They are implicitly readonly fields.',
      ],
      answer: 1,
      explanation: 'Class primary constructor parameters are in scope throughout the class body (methods, lambdas, property initializers), but unlike records they do NOT auto-generate properties. You decide how to expose them.',
    },
    {
      q: 'What does the required keyword (C# 11) enforce?',
      options: [
        'The property must be set in a parameterized constructor.',
        'The property cannot be null.',
        'The caller must set the property via an object initializer (or a constructor marked [SetsRequiredMembers]).',
        'The property is read-only after construction.',
      ],
      answer: 2,
      explanation: 'required forces callers to supply a value via an object initializer. It is enforced at compile time. Constructors annotated with [SetsRequiredMembers] are exempt because they guarantee the member is set internally.',
    },
    {
      q: 'What is the risk of calling a virtual method from a base class constructor?',
      options: [
        'Nothing — virtual dispatch works correctly at all times.',
        'The base class version always runs, ignoring the override.',
        'The derived class override runs, but derived fields are not yet initialized — can cause null references.',
        'The compiler prevents virtual calls in constructors.',
      ],
      answer: 2,
      explanation: 'When a base constructor calls a virtual method, C# calls the most-derived override. However, derived class fields are initialized after the base constructor completes — so the override runs with uninitialized fields, often producing null references or default values. Never call virtual methods from constructors.',
    },
    {
      q: 'What happens if a static constructor throws an exception?',
      options: [
        'The exception is swallowed and initialization is retried on next access.',
        'The type is marked as failed — every subsequent access throws TypeInitializationException for the rest of the AppDomain.',
        'The application exits immediately.',
        'Only the static constructor\'s error is surfaced; instances can still be created.',
      ],
      answer: 1,
      explanation: 'A static constructor that throws causes the runtime to wrap it in TypeInitializationException and permanently mark the type as failed. Every future access to that type — including creating instances — throws the same exception. There is no recovery within the AppDomain.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Can I call both : this() and : base() on the same constructor?',
      a: 'No — a constructor can only have one initializer, either <code>: this(...)</code> or <code>: base(...)</code>. The typical workaround: chain through <code>: this(...)</code> to a sibling constructor that itself calls <code>: base(...)</code>.',
    },
    {
      q: 'Does a static constructor run once per type or once per instance?',
      a: 'Once per <strong>type</strong>, regardless of how many instances get created — the CLR guarantees it runs at most once, triggered automatically before the first instance is created or the first static member is accessed. It never re-runs, even if you create a thousand instances of the type across the AppDomain\'s lifetime — this is distinct from an instance constructor, which runs once per <code>new</code> call.',
    },
    {
      q: 'When should I prefer primary constructors over traditional constructors?',
      a: 'Primary constructors shine for <strong>simple dependency injection</strong> and <strong>data holder types</strong> where you just need to capture a few values with minimal ceremony. Stick with traditional constructors when you need complex validation logic, multiple overloads, or when the constructor body is substantial enough that clarity matters more than brevity. For DI-heavy services, primary constructors dramatically reduce boilerplate.',
    },
    {
      q: 'Object initializers look like constructors — what is the real difference?',
      a: 'An object initializer runs <em>after</em> the constructor completes. The constructor sets up the object\'s invariants, then the initializer sets additional properties. This means the object is briefly in a partially-initialized state between the constructor call and the end of the initializer block — a concern if the constructor publishes a reference to <code>this</code>. Parameterized constructors avoid this by ensuring full initialization before the object is ever observable.',
    },
    {
      q: 'What is the initialization order when constructing a derived class object?',
      a: 'The order is: (1) derived field initializers run first, (2) the base class constructor body runs, (3) the derived constructor body runs. This surprises many developers — derived fields are initialized before the base constructor runs, not after. However, the base constructor body runs before the derived constructor body. If the base constructor calls a virtual method, the derived override runs (step 2), but at that point derived fields have their initializer values, not constructor-assigned values.',
    },
    {
      q: 'How does [SetsRequiredMembers] work and when should I use it?',
      a: '<code>[SetsRequiredMembers]</code> on a constructor tells the compiler "this constructor guarantees all <code>required</code> members are set — do not emit CS9035." Use it when you have a constructor that explicitly sets every required property (e.g. a convenience constructor or a constructor that deserializers or testing frameworks call). Without it, the compiler would require callers of that constructor to also use an object initializer, which is often unnecessary.',
    },
  ];

  challenge: Challenge = {
    title: 'Build a validated Money type',
    language: 'csharp',
    description: `Create a Money struct that enforces currency and amount rules through its constructors.

Requirements:
1. A primary constructor Money(decimal amount, string currency) that validates:
   - Amount must be >= 0 (throw ArgumentOutOfRangeException)
   - Currency must be exactly 3 uppercase letters (throw ArgumentException otherwise)
2. A convenience constructor Money(decimal amount) that defaults currency to "USD" using : this(...)
3. A static factory method Money.Zero(string currency) returning a zero-amount Money value
4. A static constructor that initializes a static Dictionary of 3 well-known currencies and their symbols (USD→$, EUR→€, GBP→£)
5. A ToString() override that formats the amount with the symbol if known (e.g. $10.00) or as "10.00 JPY"

Bonus: Add a MoneyDto class with required decimal Amount and required string Currency properties.`,
    starterCode: `public struct Money
{
    // TODO: static currency symbol map (static constructor)
    public decimal Amount   { get; }
    public string  Currency { get; }

    // TODO: primary constructor with validation
    // TODO: convenience constructor defaulting to USD
    // TODO: static Zero() factory method
    public override string ToString() => throw new NotImplementedException();
}

// Test:
// var price = new Money(9.99m, "USD");  Console.WriteLine(price);  // $9.99
// var euros = new Money(15.50m, "EUR"); Console.WriteLine(euros);  // €15.50
// var plain = new Money(100m);          Console.WriteLine(plain);  // $100.00
// var zero  = Money.Zero("GBP");        Console.WriteLine(zero);   // £0.00`,
    solution: `public struct Money
{
    private static readonly Dictionary<string, string> _symbols;

    static Money()
    {
        _symbols = new Dictionary<string, string>
        {
            ["USD"] = "$",
            ["EUR"] = "€",
            ["GBP"] = "£",
        };
    }

    public decimal Amount   { get; }
    public string  Currency { get; }

    public Money(decimal amount, string currency)
    {
        if (amount < 0)
            throw new ArgumentOutOfRangeException(nameof(amount), "Amount must be non-negative.");
        if (string.IsNullOrEmpty(currency) || currency.Length != 3
            || currency != currency.ToUpperInvariant())
            throw new ArgumentException("Currency must be 3 uppercase letters.", nameof(currency));

        Amount   = amount;
        Currency = currency;
    }

    public Money(decimal amount) : this(amount, "USD") { }

    public static Money Zero(string currency) => new Money(0m, currency);

    public override string ToString() =>
        _symbols.TryGetValue(Currency, out var sym)
            ? $"{sym}{Amount:F2}"
            : $"{Amount:F2} {Currency}";
}

public class MoneyDto
{
    public required decimal Amount   { get; init; }
    public required string  Currency { get; init; }
}

// Usage
var price = new Money(9.99m, "USD");   Console.WriteLine(price);  // $9.99
var euros = new Money(15.50m, "EUR");  Console.WriteLine(euros);  // €15.50
var plain = new Money(100m);           Console.WriteLine(plain);  // $100.00
var zero  = Money.Zero("GBP");         Console.WriteLine(zero);   // £0.00`,
  };

  revision: RevisionSummary = {
    oneLiner: 'Constructors initialize objects. The key mechanisms are: chaining (this/base), static constructors (once per type), primary constructors (C# 12), and required members (C# 11).',
    mustKnow: [
      'Declaring any constructor removes the compiler-generated parameterless default. Restore it explicitly if needed.',
      '<code>: this(...)</code> chains to a sibling constructor; the target runs first. <code>: base(...)</code> calls the base class constructor. You cannot use both on the same constructor.',
      'Static constructor: parameterless, no access modifier, runs once per AppDomain before first type access. If it throws, the type is permanently unusable.',
      'C# 12 primary constructor parameters are in scope throughout the class body but do NOT auto-generate properties (unlike records).',
      '<code>required</code> (C# 11) + <code>{ get; init; }</code>: compile-time enforcement that callers supply a value via object initializer. <code>[SetsRequiredMembers]</code> exempts a constructor.',
      'Never call virtual methods from constructors — the derived override runs with uninitialized derived fields.',
      'Never do heavy work (I/O, async) in a constructor — use a static async factory method instead.',
    ],
    interviewFocus: [
      'What happens to the default constructor when you add a parameterized one? (compiler stops generating it)',
      'What\'s the execution order when chaining with this() and base()? (target first, then calling body; base before derived)',
      'Why is calling a virtual method from a base constructor dangerous? (override runs before derived fields are initialized)',
      'How does C# 12 class primary constructor differ from record primary constructor? (no auto-properties for classes)',
      'What does [SetsRequiredMembers] do? (tells compiler the constructor guarantees all required members are set)',
    ],
  };
}
