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
  selector: 'app-csharp-fields',
  standalone: true,
  imports: [
    CommonModule, CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
    CommonMistakesComponent, RevisionCardComponent,
  ],
  templateUrl: './fields.html',
  styleUrl: './fields.scss',
})
export class CsharpFields {

  quickRef: QuickRefItem[] = [
    { name: 'readonly',       type: 'keyword', desc: 'Field can only be assigned at declaration or inside a constructor. Value fixed after construction.', since: 'C# 1' },
    { name: 'const',          type: 'keyword', desc: 'Compile-time constant. Value is inlined by the compiler. Must be a primitive or string literal.', since: 'C# 1' },
    { name: 'static',         type: 'keyword', desc: 'Field belongs to the type, not an instance. Shared across all objects of the class.', since: 'C# 1' },
    { name: 'volatile',       type: 'keyword', desc: 'Tells the compiler/CPU not to cache the field in a register. Used for low-level multi-threading.', since: 'C# 1' },
    { name: 'required',       type: 'keyword', desc: 'C# 11+. Forces callers to set the property/field via an object initializer. Compile-time enforced.', since: 'C# 11' },
    { name: 'backing field',  type: 'keyword', desc: 'A private field that stores the value for a public property. Normally hidden behind a getter/setter.', since: 'C# 1' },
    { name: 'field keyword',  type: 'keyword', desc: 'C# 14 preview. Refers to the compiler-generated backing field inside a property accessor — no manual backing field needed.', since: 'C# 14' },
    { name: 'Interlocked',    type: 'class',   desc: 'Provides atomic operations (Increment, Decrement, CompareExchange) for shared numeric fields without a lock.', since: 'C# 1' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Instance fields vs static fields',
      points: [
        'An <strong>instance field</strong> is created fresh for every object: <code>new BankAccount()</code> gets its own <code>_balance</code> separate from every other account.',
        'A <strong>static field</strong> belongs to the class itself and is shared across <em>all</em> instances. There is exactly one copy in memory regardless of how many objects exist.',
        'Static fields are great for counters (<code>static int _instanceCount</code>), configuration values, or cached results that are the same for every object.',
        'Mutating a static field from multiple threads requires synchronization (<code>lock</code>, <code>Interlocked</code>) — shared state is a concurrency hazard.',
        'In web applications (ASP.NET Core), static fields are shared across <em>all HTTP requests</em> and all users. Storing per-request state in a static field is a critical bug: state leaks between concurrent requests.',
      ],
    },
    {
      heading: 'const (compile-time) vs readonly (runtime)',
      points: [
        '<code>const</code> values are evaluated and baked into the compiled IL at build time. They are implicitly <code>static</code> and can only hold primitive types or <code>string</code>.',
        'Because <code>const</code> values are inlined, changing a <code>const</code> in a library requires <em>recompiling every consumer</em> — a subtle versioning trap that bites cross-team codebases.',
        '<code>readonly</code> fields are evaluated once at runtime — either at declaration or inside a constructor. They can hold any type, including objects and arrays.',
        'Prefer <code>readonly</code> for values that depend on constructor arguments or system state; use <code>const</code> only for true mathematical or domain constants that will <em>never</em> change meaning.',
        'When in doubt between <code>const</code> and <code>static readonly</code>, choose <code>static readonly</code> — it is safer for library versioning and more flexible in the types it can hold.',
      ],
    },
    {
      heading: 'readonly for dependency-injected values',
      points: [
        'Services injected via a constructor (ILogger, DbContext, HttpClient) should be stored in <code>private readonly</code> fields — they are set once and never reassigned.',
        'Making DI fields <code>readonly</code> documents intent: "this service reference is fixed for the lifetime of this object."',
        'The compiler enforces the contract — any attempt to reassign a <code>readonly</code> field outside the constructor is a compile error, not a runtime surprise.',
        'This pattern is so common that C# 12\'s primary constructors can generate the <code>readonly</code> field implicitly, reducing boilerplate significantly.',
        'Do not confuse reference immutability with object immutability: a <code>readonly IList&lt;string&gt;</code> field means you cannot replace the list with a different object, but you can still call <code>list.Add()</code> on it.',
      ],
    },
    {
      heading: 'Keep fields private — expose via properties',
      points: [
        'Fields should almost always be <code>private</code>. Exposing a public field breaks encapsulation: consumers can set it to any value, bypassing validation logic.',
        'A property wraps a backing field with a getter and optional setter, letting you add validation, lazy initialisation, or change notification without breaking callers.',
        'Auto-properties (<code>public int Age { get; set; }</code>) are compiler shorthand — the compiler generates the private backing field automatically.',
        'C# 14 introduces the <code>field</code> keyword inside property accessors, letting you write custom getter/setter logic without declaring a separate backing field.',
        'Init-only properties (<code>{ get; init; }</code>, C# 9+) allow a property to be set only during object initialisation — a middle ground between full mutability and full immutability.',
      ],
    },
    {
      heading: 'required members (C# 11)',
      points: [
        'The <code>required</code> keyword forces callers to provide a value for a field or property in an object initializer. Forgetting it is a compile error — no runtime surprises.',
        'Example: <code>public required string Name { get; init; }</code> — every <code>new Person { Name = "..." }</code> must include <code>Name</code>. Omitting it causes CS9035.',
        '<code>required</code> works on both fields and properties. It is especially useful on <code>record</code> and DTO types where every property must be explicitly set by the caller.',
        'If a type with required members is constructed via reflection or deserialization (e.g. JSON), the caller must use <code>[SetsRequiredMembers]</code> on the constructor to bypass the check.',
        'Compare <code>required</code> to constructor parameters: both force values at construction time, but <code>required</code> + object initializer syntax scales better when a type has many optional and required properties mixed.',
      ],
    },
    {
      heading: 'volatile and thread-safe field access',
      points: [
        'Modern CPUs and compilers reorder and cache memory reads/writes for performance. Without synchronisation, thread A writing a field is not guaranteed to be visible to thread B.',
        '<code>volatile</code> tells the JIT and CPU that reads/writes to this field must not be reordered or cached in a register — every access goes directly to main memory.',
        '<code>volatile</code> is suitable for simple boolean flags used to signal between threads (<code>volatile bool _running = true</code>). It does not make compound operations (read-modify-write like <code>x++</code>) atomic.',
        'For counter increments and decrements, use <code>Interlocked.Increment(ref _counter)</code> — it performs the read-modify-write as a single atomic CPU instruction.',
        'For anything more complex (checking a condition then acting on it), use <code>lock</code> or <code>Mutex</code>. <code>volatile</code> is a low-level tool — prefer <code>Interlocked</code> or higher-level synchronisation primitives in application code.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Instance & Static',
      language: 'csharp',
      code: `public class BankAccount
{
    // ── Instance fields (each object gets its own copy) ───────────────
    private decimal _balance;           // backing field for Balance property
    private string  _owner;

    // ── Static field (one copy shared by ALL BankAccount objects) ─────
    private static int _totalAccounts = 0;

    public BankAccount(string owner, decimal initialBalance)
    {
        _owner   = owner;
        _balance = initialBalance;
        _totalAccounts++;               // increments the shared counter
    }

    public decimal Balance  => _balance;
    public string  Owner    => _owner;
    public static int TotalAccounts => _totalAccounts;

    public void Deposit(decimal amount)
    {
        if (amount <= 0) throw new ArgumentException("Amount must be positive.");
        _balance += amount;
    }
}

// Usage
var a1 = new BankAccount("Alice", 1000m);
var a2 = new BankAccount("Bob",    500m);

Console.WriteLine(a1.Balance);                // 1000
Console.WriteLine(BankAccount.TotalAccounts); // 2  ← shared static

// ─── Static fields in web apps are GLOBAL — beware ───────────────────
// DO NOT store per-request state in a static field.
// It is shared across all concurrent HTTP requests.
// public static string CurrentUser = "...";  // ← critical race condition`,
    },
    {
      label: 'const vs readonly',
      language: 'csharp',
      code: `public class InterestRules
{
    // ── const: compile-time, implicitly static, primitive/string only ──
    public const decimal TaxRate      = 0.20m;   // baked into every consumer's IL
    public const int     MaxWithdrawals = 10;
    public const string  Currency      = "GBP";

    // ── static readonly: runtime constant, shared across instances ────
    public static readonly DateTime EpochStart =
        new DateTime(2020, 1, 1);             // computed once at startup

    public static readonly string[] SupportedCurrencies =
        ["GBP", "USD", "EUR"];               // array — not allowed as const

    // ── Instance readonly: set per-object in constructor ──────────────
    private readonly string   _accountNumber;
    private readonly DateTime _openedAt;

    public InterestRules(string accountNumber)
    {
        _accountNumber = accountNumber;     // assigned once, never changed
        _openedAt      = DateTime.UtcNow;
        // _accountNumber = "other"; // ← compile error: readonly field
    }

    public string AccountNumber => _accountNumber;
}

// ── The const versioning trap ─────────────────────────────────────────
// If LibA.dll changes:  public const int PageSize = 100  → 200
// LibB.dll compiled against old LibA still uses 100 (baked in).
// LibB must recompile to see 200.
// static readonly reads from LibA at runtime — no recompile needed.

Console.WriteLine(InterestRules.TaxRate);           // 0.20
Console.WriteLine(InterestRules.EpochStart);        // 01/01/2020 00:00:00`,
    },
    {
      label: 'readonly + DI + required',
      language: 'csharp',
      code: `// ── Standard DI pattern: readonly fields for injected services ───
public class AccountService
{
    private readonly ILogger<AccountService> _logger;
    private readonly IAccountRepository      _repo;

    public AccountService(ILogger<AccountService> logger, IAccountRepository repo)
    {
        _logger = logger;   // readonly — fixed for lifetime of this object
        _repo   = repo;
        // Any reassignment below would be a compile error
    }

    public async Task<decimal> GetBalanceAsync(Guid id)
    {
        _logger.LogInformation("Fetching balance for {Id}", id);
        var account = await _repo.FindAsync(id);
        return account?.Balance ?? 0m;
    }
}

// ── required members (C# 11) — compile-time init enforcement ─────────
public class CreateOrderRequest
{
    public required string CustomerId { get; init; }  // CS9035 if omitted
    public required string ProductId  { get; init; }
    public int Quantity { get; init; } = 1;           // optional — has default
}

// Correct — required fields provided:
var req = new CreateOrderRequest { CustomerId = "C1", ProductId = "P42" };
// Error: var bad = new CreateOrderRequest { CustomerId = "C1" };
//        CS9035: Required member 'ProductId' must be set.

// ── init-only properties (C# 9) ──────────────────────────────────────
public record Address(string Street, string City, string Country);
// record auto-generates required init-only properties + equality + ToString

// ── field keyword (C# 14) — no manual backing field ──────────────────
public class Temperature
{
    public decimal Celsius
    {
        get => field;
        set => field = value < -273.15m
            ? throw new ArgumentOutOfRangeException(nameof(value))
            : value;
    }
}`,
    },
    {
      label: 'volatile & Interlocked',
      language: 'csharp',
      code: `// ── volatile flag for cross-thread signalling ────────────────────
public class BackgroundWorker
{
    private volatile bool _running = false;   // no register caching
    private readonly Thread _thread;

    public BackgroundWorker()
    {
        _thread = new Thread(DoWork);
    }

    private void DoWork()
    {
        while (_running)   // reads from main memory every time
        {
            // process items...
            Thread.Sleep(100);
        }
        Console.WriteLine("Worker stopped.");
    }

    public void Start() { _running = true;  _thread.Start(); }
    public void Stop()  { _running = false; _thread.Join(); }
}

// ── Interlocked for atomic counter (volatile is NOT enough for ++) ────
public class RequestCounter
{
    private static int _total = 0;

    public static void RecordRequest()
    {
        // ++ is NOT atomic: it's read, increment, write — race condition!
        // _total++;  ← wrong in multithreaded context

        Interlocked.Increment(ref _total);  // single atomic CPU instruction
    }

    public static int Total => Interlocked.CompareExchange(ref _total, 0, -1);
}

// ── Interlocked.CompareExchange — optimistic update pattern ──────────
int _version = 0;
int original = _version;
int updated  = original + 1;
// Only writes if _version is still 'original' (no one else updated it):
bool success = Interlocked.CompareExchange(ref _version, updated, original) == original;`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Exposing public fields instead of properties',
      wrong: `public class User
{
    public string Name;   // anyone can set this to anything
    public int Age;
}`,
      right: `public class User
{
    public string Name { get; set; } = string.Empty;
    public int Age
    {
        get => _age;
        set => _age = value >= 0 ? value : throw new ArgumentException("Age cannot be negative");
    }
    private int _age;
}`,
      explanation: 'Public fields bypass encapsulation — any code can set them to invalid state. Properties allow validation, change notification, and lazy initialization. They also give you a stable API surface: you can change the internal implementation without breaking callers.',
    },
    {
      title: 'Thinking readonly makes a reference-type field immutable',
      wrong: `private readonly List<string> _tags = new();

// Later code:
_tags = new List<string>();  // ← compile error (good — that's what readonly prevents)
_tags.Add("anything");       // ← this WORKS — list contents are still mutable`,
      right: `// Use IReadOnlyList or ImmutableList to prevent content mutation
private readonly IReadOnlyList<string> _tags;

public MyClass(IEnumerable<string> tags)
{
    _tags = tags.ToList().AsReadOnly();  // or ImmutableList<string>.Empty.AddRange(tags)
}`,
      explanation: 'readonly only prevents reassigning the field to a different object. The object itself (a List, Dictionary, array) remains fully mutable through its own methods. To prevent content mutation you need an immutable collection type like IReadOnlyList<T>, ReadOnlyCollection<T>, or ImmutableList<T>.',
    },
    {
      title: 'Using const for values that may change — the versioning trap',
      wrong: `// In shared library (LibA):
public const int DefaultTimeout = 30;  // changes to 60 next release

// In consumer (LibB compiled against old LibA):
// Timeout is still 30 even after LibA.dll is replaced — baked into LibB's IL`,
      right: `// In shared library:
public static readonly int DefaultTimeout = 30;  // read from LibA at runtime

// Consumer automatically picks up 60 without recompile when LibA updates`,
      explanation: 'const values are baked into every referencing assembly at compile time. Changing a const in a library breaks consumers silently: they continue using the old value until they recompile. Use static readonly for values that might change between releases, even slightly. Reserve const for truly invariant mathematical/domain constants.',
    },
    {
      title: 'Storing per-request state in a static field (web apps)',
      wrong: `public class OrderService
{
    // Static field — shared by ALL HTTP requests, ALL users
    public static string CurrentUserId = "";  // race condition!

    public void ProcessOrder()
    {
        // Request A sets CurrentUserId = "user-1"
        // Request B sets CurrentUserId = "user-2" concurrently
        // Request A now reads "user-2" — data leak between users!
    }
}`,
      right: `public class OrderService
{
    private readonly IHttpContextAccessor _httpContext;

    public OrderService(IHttpContextAccessor httpContext) => _httpContext = httpContext;

    public void ProcessOrder()
    {
        string userId = _httpContext.HttpContext!.User.FindFirst("sub")?.Value ?? "";
    }
}`,
      explanation: 'Static fields live for the lifetime of the application and are shared across all concurrent HTTP requests. Storing request-scoped data (current user, request ID, tenant) in a static field causes state to bleed between concurrent users. Use DI-scoped services, IHttpContextAccessor, or AsyncLocal<T> for per-request state.',
    },
    {
      title: 'Using volatile for compound operations thinking it makes them atomic',
      wrong: `private volatile int _count = 0;

// On Thread A:
_count++;  // read → increment → write — still NOT atomic even with volatile

// On Thread B simultaneously:
_count++;  // both threads can read 5, both write 6 — count should be 7`,
      right: `private int _count = 0;

// Thread-safe increment:
Interlocked.Increment(ref _count);

// Thread-safe read:
int current = Interlocked.CompareExchange(ref _count, 0, -1);`,
      explanation: 'volatile prevents caching/reordering but does NOT make read-modify-write operations (like ++) atomic. Two threads can still both read the same value and both write back the same incremented result, losing an increment. Use Interlocked for atomic counters. Use lock for anything more complex than a single-field atomic operation.',
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'What is the key difference between <code>const</code> and <code>readonly</code>?',
      options: [
        'const can hold any type; readonly is restricted to primitives',
        'const is evaluated at compile time and inlined; readonly is evaluated at runtime and can hold any type',
        'readonly is faster at runtime than const',
        'They are identical — just different keywords for style preference',
      ],
      answer: 1,
      explanation: '<code>const</code> values are baked into the compiled IL — only primitive types and <code>string</code> are allowed, and every consumer assembly inlines the value. <code>readonly</code> fields are assigned once at runtime (declaration or constructor) and can hold any type including objects, arrays, and generics.',
    },
    {
      q: 'A static field in a class is…',
      options: [
        'Created anew for each object instance',
        'Shared across all instances of the class — one copy in memory',
        'Automatically thread-safe',
        'Only accessible inside the class itself',
      ],
      answer: 1,
      explanation: 'A <code>static</code> field belongs to the type, not to any individual object. There is exactly one copy regardless of how many instances exist. It is NOT automatically thread-safe — concurrent writes require synchronisation.',
    },
    {
      q: 'Why should injected services (ILogger, DbContext) be stored as <code>readonly</code> fields?',
      options: [
        'readonly fields have faster memory access than regular fields',
        'It prevents the garbage collector from collecting them',
        'It documents that the reference is set once at construction and never reassigned, and the compiler enforces it',
        'DI frameworks require readonly fields to work correctly',
      ],
      answer: 2,
      explanation: 'Marking injected dependencies <code>readonly</code> documents intent and gets compiler enforcement for free. Any code that tries to reassign the field after construction is a compile error. This prevents accidental re-injection or null-assignment bugs.',
    },
    {
      q: 'Which of the following is a valid <code>const</code> declaration?',
      options: [
        'public const List&lt;int&gt; Ids = new List&lt;int&gt;();',
        'public const DateTime Epoch = new DateTime(2020, 1, 1);',
        'public const decimal TaxRate = 0.20m;',
        'public const string[] Tags = ["a", "b"];',
      ],
      answer: 2,
      explanation: '<code>const</code> only supports compile-time primitives (<code>int</code>, <code>double</code>, <code>decimal</code>, <code>bool</code>, <code>char</code>) and <code>string</code>. Object construction (<code>new</code>), arrays, and collection types are not allowed. Use <code>static readonly</code> for those cases.',
    },
    {
      q: 'You change <code>public const int PageSize = 10</code> to <code>= 25</code> in a library. What must consumers do to use the new value?',
      options: [
        'Nothing — they automatically pick up the new value at next run',
        'Recompile against the new library — the old value 10 is baked into their IL',
        'Add a using directive for the updated namespace',
        'Clear the bin/obj folders and rebuild only the library',
      ],
      answer: 1,
      explanation: '<code>const</code> values are inlined into every referencing assembly at compile time. If you ship a new library DLL with a changed <code>const</code>, consumers still have the old value baked into their own IL — they must recompile. <code>static readonly</code> reads from the library at runtime and avoids this problem.',
    },
    {
      q: 'You have <code>private readonly List&lt;string&gt; _tags = new();</code>. Which operation is prevented by <code>readonly</code>?',
      options: [
        '_tags.Add("new") — adding to the list',
        '_tags.Clear() — clearing the list',
        '_tags = new List&lt;string&gt;() — reassigning to a new list',
        '_tags[0] = "x" — replacing an element',
      ],
      answer: 2,
      explanation: '<code>readonly</code> prevents reassigning the <em>field reference</em> to a different object. Operations on the object itself — Add, Clear, indexer assignment — are entirely unaffected. If you want the contents to be immutable too, use <code>IReadOnlyList&lt;T&gt;</code> or <code>ImmutableList&lt;T&gt;</code>.',
    },
    {
      q: 'What does the C# 11 <code>required</code> keyword enforce?',
      options: [
        'The field must be initialized in the class constructor only',
        'The property must be set in an object initializer — omitting it is a compile error',
        'The field cannot be null at runtime',
        'The property is read-only after the first assignment',
      ],
      answer: 1,
      explanation: '<code>required</code> forces callers to include the property in an object initializer: <code>new Order { CustomerId = "C1" }</code>. Omitting it causes CS9035 at compile time. It works with <code>{ get; init; }</code> properties and is useful on DTOs and records where every property must be explicitly set by the caller.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use const vs static readonly?',
      a: 'Use <code>const</code> for true, never-changing domain constants that are safe to inline: <code>Math.PI</code>, <code>MaxRetries = 3</code>, <code>Currency = "GBP"</code>. Use <code>static readonly</code> for anything computed at runtime, anything that holds an object/array, or when you publish the value in a library — changing a <code>const</code> in a library forces every consumer to recompile; a <code>static readonly</code> change is picked up at the next run without recompiling consumers.',
    },
    {
      q: 'Can I have a readonly field that is a mutable object (e.g., a List)?',
      a: 'Yes, and it\'s a common source of confusion. <code>private readonly List&lt;string&gt; _tags = new();</code> means the <em>reference</em> is fixed — you cannot make <code>_tags</code> point to a different list. But you can still call <code>_tags.Add("x")</code> because the list\'s contents are mutable. If you need a truly immutable collection use <code>IReadOnlyList&lt;T&gt;</code>, <code>ReadOnlyCollection&lt;T&gt;</code>, or <code>ImmutableList&lt;T&gt;</code>.',
    },
    {
      q: 'What is the versioning trap with const?',
      a: 'When you define <code>public const int MaxSize = 100</code> in Assembly A, the compiler copies the value <code>100</code> directly into every assembly that references it. If you later change it to <code>200</code> and release a new version of Assembly A, the old assemblies still have <code>100</code> hardcoded in them until they recompile. <code>static readonly</code> avoids this because the value is read from Assembly A at runtime — no consumer recompilation needed.',
    },
    {
      q: 'What is a backing field and when do I need to write one manually?',
      a: 'A backing field is the private field that stores the actual data for a property. Auto-properties (<code>public int Age { get; set; }</code>) generate one invisibly. You need to write one explicitly only when you want custom getter/setter logic: input validation, lazy loading, or change notification. C# 14\'s <code>field</code> keyword lets you write that logic <em>without</em> manually declaring the private field — the compiler generates it for you while you reference it as <code>field</code> inside the accessor.',
    },
    {
      q: 'Is volatile enough to make a field thread-safe?',
      a: '<code>volatile</code> prevents CPU/JIT caching and reordering — every read goes to main memory. This is enough for <em>boolean flags</em> where one thread writes and another reads, and no compound operation is involved. It is <em>not</em> enough for <code>count++</code> (read-increment-write is three operations, not one). Use <code>Interlocked.Increment</code> for atomic counters. For multi-step operations (check-then-act), use <code>lock</code>.',
    },
    {
      q: 'What is the difference between required and constructor parameters for enforcing initialisation?',
      a: 'Both guarantee that a value is provided at construction time, but they scale differently. Constructor parameters are positional — a class with 10 required constructor parameters is verbose and breaks if parameters are reordered. <code>required</code> properties use object initializer syntax — callers use named properties, order does not matter, and optional properties can simply be omitted. Records combine both: the primary constructor generates <code>required init</code> properties automatically. Prefer <code>required</code> + object initializers for data-carrier types (DTOs, commands, events); use constructor parameters for services.',
    },
  ];

  challenge: Challenge = {
    title: 'BankAccount with Fields & Constants',
    description: `Implement a BankAccount class that demonstrates all key field concepts:

Requirements:
1. Private instance field _balance (decimal) — never exposed directly
2. Private readonly field _accountNumber (string) — set in constructor, never changed
3. Static field _interestRate (decimal) — shared across all accounts, default 0.035m (3.5%)
4. Static readonly field MinimumBalance — value 10m, cannot be reassigned at runtime
5. Public property Balance with a get-only accessor
6. Public property AccountNumber with a get-only accessor
7. Static property InterestRate with get and set accessors (validate 0–1 range)
8. Deposit(decimal amount) — validates amount > 0, adds to _balance
9. Withdraw(decimal amount) — validates amount > 0 and balance after >= MinimumBalance
10. ApplyInterest() — multiplies _balance by (1 + _interestRate)`,
    language: 'csharp',
    hints: [
      'readonly fields can only be assigned in the constructor or at the declaration',
      'Static fields are accessed via the class name or directly within the same class',
      'Throw ArgumentException for invalid deposit/withdraw amounts',
      'For Withdraw, check: _balance - amount >= MinimumBalance',
      'ApplyInterest: _balance *= (1 + _interestRate)',
    ],
    starterCode: `public class BankAccount
{
    // TODO: Add private _balance field
    // TODO: Add private readonly _accountNumber field
    // TODO: Add static _interestRate field (default 0.035m)
    // TODO: Add static readonly MinimumBalance field (10m)

    public BankAccount(string accountNumber, decimal initialBalance)
    {
        // TODO: assign fields
    }

    // TODO: Balance property (get only)
    // TODO: AccountNumber property (get only)
    // TODO: InterestRate static property (get + set, validate 0-1 range)

    public void Deposit(decimal amount)
    {
        // TODO: validate and add to _balance
    }

    public void Withdraw(decimal amount)
    {
        // TODO: validate and subtract from _balance (keep >= MinimumBalance)
    }

    public void ApplyInterest()
    {
        // TODO: apply _interestRate to _balance
    }
}`,
    solution: `public class BankAccount
{
    private decimal _balance;
    private readonly string _accountNumber;
    private static decimal _interestRate = 0.035m;
    public static readonly decimal MinimumBalance = 10m;

    public BankAccount(string accountNumber, decimal initialBalance)
    {
        if (initialBalance < MinimumBalance)
            throw new ArgumentException($"Initial balance must be at least {MinimumBalance}.");

        _accountNumber = accountNumber;
        _balance       = initialBalance;
    }

    public decimal Balance       => _balance;
    public string  AccountNumber => _accountNumber;

    public static decimal InterestRate
    {
        get => _interestRate;
        set
        {
            if (value < 0 || value > 1)
                throw new ArgumentOutOfRangeException(nameof(value), "Rate must be between 0 and 1.");
            _interestRate = value;
        }
    }

    public void Deposit(decimal amount)
    {
        if (amount <= 0) throw new ArgumentException("Deposit amount must be positive.");
        _balance += amount;
    }

    public void Withdraw(decimal amount)
    {
        if (amount <= 0) throw new ArgumentException("Withdrawal amount must be positive.");
        if (_balance - amount < MinimumBalance)
            throw new InvalidOperationException($"Cannot withdraw: balance would fall below minimum ({MinimumBalance}).");
        _balance -= amount;
    }

    public void ApplyInterest() => _balance *= (1 + _interestRate);
}

// Usage
var acc = new BankAccount("ACC-001", 500m);
acc.Deposit(200m);
acc.ApplyInterest();
Console.WriteLine(acc.Balance);                 // 731.10
Console.WriteLine(BankAccount.MinimumBalance);  // 10
BankAccount.InterestRate = 0.05m;               // change for all accounts`,
  };

  revision: RevisionSummary = {
    oneLiner: 'Fields store state. The critical distinctions are scope (instance vs static), mutability (const vs readonly), and visibility (private + property vs public field).',
    mustKnow: [
      'Instance fields: one copy per object. Static fields: one copy per type, shared by all instances.',
      '<code>const</code> is compile-time, inlined into every consumer\'s IL — changing it requires recompiling consumers. <code>static readonly</code> is runtime-loaded, safe to change in published libraries.',
      '<code>readonly</code> prevents field reassignment after construction — it does NOT make the object itself immutable. A <code>readonly List&lt;T&gt;</code> can still be mutated via Add/Clear.',
      'DI-injected services go in <code>private readonly</code> fields — set once in the constructor, never changed, compiler-enforced.',
      '<code>required</code> (C# 11) forces callers to supply a value in an object initializer — compile error if omitted. Good for DTOs and record types.',
      '<code>volatile</code> prevents caching/reordering for cross-thread boolean flags. It does NOT make compound operations (++) atomic — use <code>Interlocked</code> for atomic counters.',
      'Static fields in web apps are global across all HTTP requests. Never store per-request or per-user state in a static field.',
    ],
    interviewFocus: [
      'What\'s the difference between const and static readonly? (compile-time inlining vs runtime read; versioning implications)',
      'Does readonly make a field immutable? (no — only the reference; object contents remain mutable)',
      'Why are static fields dangerous in ASP.NET Core? (shared across all concurrent requests — race conditions and state leakage)',
      'When would you use volatile vs lock vs Interlocked? (volatile: simple flag; Interlocked: atomic counter; lock: complex multi-step operation)',
      'What does required (C# 11) do that a constructor parameter doesn\'t? (named, order-independent, scales better for many properties)',
    ],
  };
}
