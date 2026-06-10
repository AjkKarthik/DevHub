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
  selector: 'app-csharp-constructors',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './constructors.html',
  styleUrl: './constructors.scss',
})
export class CsharpConstructors {

  quickRef: QuickRefItem[] = [
    { name: 'this()',            type: 'keyword', desc: 'Chains to another constructor in the same class. Runs the chained constructor first, then the current one.', since: 'C# 1' },
    { name: 'base()',            type: 'keyword', desc: 'Calls a constructor in the base class. Must appear in the constructor initializer list.', since: 'C# 1' },
    { name: 'static ctor',      type: 'syntax',  desc: 'A parameterless, access-modifier-free constructor prefixed with static. Runs once per type before first use.', since: 'C# 1' },
    { name: 'primary ctor',     type: 'syntax',  desc: 'C# 12. Parameters declared on the class declaration itself, available throughout the class body without a backing field.', since: 'C# 12' },
    { name: 'required',         type: 'keyword', desc: 'C# 11. Forces the caller to set a property or field via an object initializer. Compile-time enforced.', since: 'C# 11' },
    { name: 'new()',            type: 'keyword', desc: 'Invokes a constructor. Can be shortened to new() when the type can be inferred from context.', since: 'C# 9' },
    { name: 'object initializer', type: 'syntax', desc: 'Sets properties/fields after the constructor runs: new Foo { X = 1, Y = 2 }. No custom constructor needed.', since: 'C# 3' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Default vs parameterized constructors',
      points: [
        'If you declare <strong>no constructor at all</strong>, C# generates a public default (parameterless) constructor for you that zero-initializes all fields.',
        'The moment you declare <em>any</em> constructor yourself, the compiler stops generating the default one. If you still want <code>new Foo()</code> to work, you must write it explicitly.',
        'Parameterized constructors allow objects to start life in a valid, fully-initialized state — prefer them over "create-then-set" patterns where the object could be used in a partially initialized state.',
        'When there are many optional parameters, use <strong>object initializers</strong> or the <strong>builder pattern</strong> rather than creating a combinatorial explosion of constructor overloads.',
      ],
    },
    {
      heading: 'Constructor chaining with this()',
      points: [
        'Use <code>: this(...)</code> to delegate to another constructor in the same class. This prevents duplicating validation or initialization logic across multiple overloads.',
        'The target constructor runs <em>first</em>, then the calling constructor body runs. Think of the chained constructor as "setup" and the callers as "optional extras."',
        'A common pattern: one "primary" constructor holds all the real logic; other overloads provide defaults and chain into it.',
        'Chaining keeps code DRY — if you later need to add a new field, you only update the one constructor that everyone chains into.',
      ],
    },
    {
      heading: 'Calling the base constructor with base()',
      points: [
        'When a class inherits from a base class, the base class constructor must run before the derived constructor body. <code>: base(...)</code> selects which base constructor to invoke.',
        'If you omit <code>: base(...)</code>, C# automatically calls the parameterless base constructor. If the base class has no parameterless constructor, you <em>must</em> supply <code>: base(...)</code> explicitly.',
        'You can pass derived constructor parameters straight through to the base: <code>public Dog(string name) : base(name)</code>.',
        'Unlike <code>this()</code>, you cannot chain <em>both</em> <code>: this()</code> and <code>: base()</code> on the same constructor — use <code>this()</code> to forward to a sibling that then calls <code>base()</code>.',
      ],
    },
    {
      heading: 'Static constructors',
      points: [
        'A static constructor has no access modifier, no parameters, and is prefixed with <code>static</code>. It is called automatically, exactly once, before any static member is accessed or any instance is created.',
        'Use static constructors to initialize expensive static resources: loading configuration from disk, populating a lookup dictionary, or setting up a connection factory.',
        'You cannot call a static constructor manually, and you cannot predict the exact moment it runs relative to other types — only that it runs before first use of the type.',
        'If a static constructor throws an exception, the type becomes permanently unusable for the lifetime of the application domain — guard initializations carefully.',
      ],
    },
    {
      heading: 'C# 12 primary constructors',
      points: [
        'Primary constructors place parameters directly on the class declaration: <code>class Point(int x, int y)</code>. The parameters are in scope throughout the entire class body.',
        'Unlike record primary constructors, class primary constructors do <strong>not</strong> automatically generate public properties — you decide how to expose the values.',
        'This is ideal for dependency injection: <code>class OrderService(IOrderRepo repo, ILogger&lt;OrderService&gt; logger)</code> makes DI boilerplate nearly vanish.',
        'Primary constructor parameters can be captured in lambdas, property initializers, and method bodies — anywhere a field would normally be used.',
        'If you need a backing field (e.g. to mutate the value), assign the parameter to a field yourself: <code>private readonly IOrderRepo _repo = repo;</code>.',
      ],
    },
    {
      heading: 'Object initializers and the required keyword',
      points: [
        'Object initializers (<code>new Foo { Name = "Alice", Age = 30 }</code>) set public properties/fields after the constructor runs — no special constructor needed.',
        'They pair naturally with parameterless constructors and are great when most properties are optional — callers only set what they need.',
        '<code>required</code> (C# 11) marks a property as mandatory for object initializers. The compiler rejects <code>new Foo()</code> if a required property is omitted — you get the safety of a parameterized constructor with the flexibility of object initializers.',
        'Records combine these ideas elegantly — use records when you want a named, immutable data container; use classes with <code>required</code> properties when you need mutability or rich behavior.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Chaining with this()',
      language: 'csharp',
      code: `public class HttpClient
{
    private readonly string _baseUrl;
    private readonly int    _timeoutSeconds;
    private readonly bool   _followRedirects;

    // Primary constructor — all logic lives here
    public HttpClient(string baseUrl, int timeoutSeconds, bool followRedirects)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(baseUrl);
        if (timeoutSeconds <= 0) throw new ArgumentOutOfRangeException(nameof(timeoutSeconds));

        _baseUrl          = baseUrl;
        _timeoutSeconds   = timeoutSeconds;
        _followRedirects  = followRedirects;
    }

    // Convenience overloads — all chain to the primary constructor
    public HttpClient(string baseUrl, int timeoutSeconds)
        : this(baseUrl, timeoutSeconds, followRedirects: true) { }

    public HttpClient(string baseUrl)
        : this(baseUrl, timeoutSeconds: 30) { }

    public override string ToString() =>
        \`\${_baseUrl} (timeout=\${_timeoutSeconds}s, redirects=\${_followRedirects})\`;
}

// Usage
var c1 = new HttpClient("https://api.example.com");
var c2 = new HttpClient("https://api.example.com", 10);
var c3 = new HttpClient("https://api.example.com", 10, false);`,
    },
    {
      label: 'base() inheritance',
      language: 'csharp',
      code: `public abstract class Animal
{
    public string Name   { get; }
    public int    Age    { get; }

    protected Animal(string name, int age)
    {
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
        : base(name, age)
    {
        Breed = breed;
    }

    // Convenient overload with unknown breed
    public Dog(string name, int age)
        : this(name, age, breed: "Mixed") { }

    public override string Speak() => "Woof!";
}

public class Cat : Animal
{
    public bool IsIndoor { get; }

    public Cat(string name, int age, bool isIndoor)
        : base(name, age)
    {
        IsIndoor = isIndoor;
    }

    public override string Speak() => "Meow.";
}

// Usage
var dog = new Dog("Rex", 3, "Labrador");
var cat = new Cat("Whiskers", 5, isIndoor: true);
Console.WriteLine(\`\${dog.Name} says: \${dog.Speak()}\`);`,
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

// Static constructor runs on first access
Console.WriteLine(CountryCodeLookup.GetName("US"));  // "United States"
Console.WriteLine(CountryCodeLookup.GetName("jp"));  // "Japan" (case-insensitive)
Console.WriteLine(CountryCodeLookup.GetName("ZZ"));  // "Unknown"`,
    },
    {
      label: 'C# 12 primary constructors',
      language: 'csharp',
      code: `// C# 12: parameters declared directly on the class
public class OrderService(IOrderRepository repo, ILogger<OrderService> logger)
{
    // Parameters 'repo' and 'logger' are in scope throughout the class.
    // Store them in readonly fields to make intent explicit and prevent mutation.
    private readonly IOrderRepository _repo   = repo;
    private readonly ILogger          _logger = logger;

    public async Task<Order?> GetOrderAsync(int id)
    {
        _logger.LogInformation("Fetching order {Id}", id);
        return await _repo.FindByIdAsync(id);
    }

    public async Task PlaceOrderAsync(Order order)
    {
        _logger.LogInformation("Placing order for customer {Id}", order.CustomerId);
        await _repo.AddAsync(order);
    }
}

// Struct with primary constructor — great for value types
public readonly struct Point(double x, double y)
{
    public double X { get; } = x;
    public double Y { get; } = y;

    public double DistanceTo(Point other) =>
        Math.Sqrt(Math.Pow(X - other.X, 2) + Math.Pow(Y - other.Y, 2));
}

var p1 = new Point(0, 0);
var p2 = new Point(3, 4);
Console.WriteLine(p1.DistanceTo(p2)); // 5`,
    },
    {
      label: 'required keyword (C# 11)',
      language: 'csharp',
      code: `public class UserProfile
{
    // required forces callers to supply these via object initializer
    public required string Username  { get; init; }
    public required string Email     { get; init; }

    // Optional — caller may omit
    public string? Bio       { get; init; }
    public string  AvatarUrl { get; init; } = "/default-avatar.png";
}

// Compile error — Username and Email are required
// var bad = new UserProfile();

// Correct usage
var user = new UserProfile
{
    Username = "alice",
    Email    = "alice@example.com",
    Bio      = "Loves C# and coffee.",
};

// SetsRequiredMembers bypasses the required check — use in constructors
// that guarantee initialization internally
public class UserProfile2
{
    public required string Username { get; init; }
    public required string Email    { get; init; }

    [System.Diagnostics.CodeAnalysis.SetsRequiredMembers]
    public UserProfile2(string username, string email)
    {
        Username = username;
        Email    = email;
    }
}

var u2 = new UserProfile2("bob", "bob@example.com"); // OK`,
    },
  ];

  challenge: Challenge = {
    title: 'Build a validated Money type',
    language: 'csharp',
    description: `Create a <code>Money</code> struct that enforces currency and amount rules through its constructors.

**Requirements:**
1. A primary constructor <code>Money(decimal amount, string currency)</code> that validates:
   - Amount must be >= 0 (throw <code>ArgumentOutOfRangeException</code>)
   - Currency must be exactly 3 uppercase letters (e.g., "USD", "EUR") — throw <code>ArgumentException</code> otherwise
2. A convenience constructor <code>Money(decimal amount)</code> that defaults currency to <code>"USD"</code> using <code>: this(...)</code>
3. A static factory method <code>Money.Zero(string currency)</code> that returns a zero-amount money value
4. A static constructor that initializes a static <code>Dictionary&lt;string, string&gt;</code> of 3 well-known currencies and their symbols (USD→$, EUR→€, GBP→£)
5. A <code>ToString()</code> override that formats the amount with the symbol if known, e.g. <code>$10.00</code> or <code>10.00 JPY</code>

**Bonus:** Add a <code>required</code> property-based version <code>MoneyDto</code> with <code>required decimal Amount</code> and <code>required string Currency</code>.`,
    starterCode: `public struct Money
{
    // TODO: static currency symbol map (static constructor)

    public decimal Amount   { get; }
    public string  Currency { get; }

    // TODO: primary constructor with validation

    // TODO: convenience constructor defaulting to USD

    // TODO: static Zero() factory method

    public override string ToString()
    {
        // TODO: use symbol map, fall back to "amount CURRENCY"
        throw new NotImplementedException();
    }
}

// Test your implementation:
// var price  = new Money(9.99m, "USD");
// var euros  = new Money(15.50m, "EUR");
// var plain  = new Money(100m);          // defaults to USD
// var zero   = Money.Zero("GBP");
// Console.WriteLine(price);  // $9.99
// Console.WriteLine(euros);  // €15.50
// Console.WriteLine(zero);   // £0.00`,
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
        if (currency is not { Length: 3 } || currency != currency.ToUpperInvariant())
            throw new ArgumentException("Currency must be 3 uppercase letters.", nameof(currency));

        Amount   = amount;
        Currency = currency;
    }

    public Money(decimal amount) : this(amount, "USD") { }

    public static Money Zero(string currency) => new Money(0m, currency);

    public override string ToString() =>
        _symbols.TryGetValue(Currency, out var sym)
            ? \`\${sym}\${Amount:F2}\`
            : \`\${Amount:F2} \${Currency}\`;
}

public class MoneyDto
{
    public required decimal Amount   { get; init; }
    public required string  Currency { get; init; }
}`,
  };

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
      explanation: 'Once you declare any constructor, the compiler stops auto-generating the parameterless default. You must write it yourself if you still need it.',
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
      explanation: 'The chained (target) constructor always runs before the body of the constructor that contains the : this(...) call.',
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
      explanation: 'Static constructors run automatically, exactly once per AppDomain, triggered by first access to the type — either creating an instance or accessing a static member.',
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
      explanation: 'required forces callers to supply a value via an object initializer. It is a compile-time check. Constructors annotated with [SetsRequiredMembers] are exempt.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Can I call both : this() and : base() on the same constructor?',
      a: 'No — a constructor can only have one initializer, either <code>: this(...)</code> or <code>: base(...)</code>. The typical workaround is to chain through <code>: this(...)</code> to a sibling constructor that itself calls <code>: base(...)</code>.',
    },
    {
      q: 'What happens if a static constructor throws an exception?',
      a: 'The runtime wraps it in a <code>TypeInitializationException</code> and marks the type as permanently failed. Every subsequent attempt to use the type throws the same exception for the rest of the AppDomain\'s lifetime. Guard static constructor logic carefully — validate resources and handle failures explicitly.',
    },
    {
      q: 'When should I prefer primary constructors over traditional constructors?',
      a: 'Primary constructors shine for <strong>simple dependency injection</strong> and <strong>data holder types</strong> where you just need to capture a few values with minimal ceremony. Stick with traditional constructors when you need complex validation logic, multiple overloads, or when the constructor body is substantial enough that clarity matters more than brevity.',
    },
    {
      q: 'Object initializers look like constructors — what is the real difference?',
      a: 'An object initializer runs <em>after</em> the constructor completes. The constructor sets up the object\'s invariants, then the initializer sets additional properties. This means the object is briefly in a partially-initialized state between the constructor call and the end of the initializer block — a concern if the constructor publishes a reference to <code>this</code>. Parameterized constructors avoid this by ensuring full initialization before the object is ever observable.',
    },
  ];
}
