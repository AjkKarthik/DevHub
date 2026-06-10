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
  selector: 'app-csharp-fields',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
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
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Instance fields vs static fields',
      points: [
        'An <strong>instance field</strong> is created fresh for every object: <code>new BankAccount()</code> gets its own <code>_balance</code> separate from every other account.',
        'A <strong>static field</strong> belongs to the class itself and is shared across <em>all</em> instances. There is exactly one copy in memory regardless of how many objects exist.',
        'Static fields are great for counters (<code>static int _instanceCount</code>), configuration values, or cached results that are the same for every object.',
        'Mutating a static field from multiple threads requires synchronization (<code>lock</code>, <code>Interlocked</code>) — shared state is a concurrency hazard.',
      ],
    },
    {
      heading: 'const (compile-time) vs readonly (runtime)',
      points: [
        '<code>const</code> values are evaluated and baked into the compiled IL at build time. They are implicitly <code>static</code> and can only hold primitive types or <code>string</code>.',
        'Because <code>const</code> values are inlined, changing a <code>const</code> in a library requires <em>recompiling every consumer</em> — a subtle versioning trap.',
        '<code>readonly</code> fields are evaluated once at runtime — either at declaration or inside a constructor. They can hold any type, including objects and arrays.',
        'Prefer <code>readonly</code> for values that depend on constructor arguments or system state; use <code>const</code> only for true mathematical or domain constants.',
      ],
    },
    {
      heading: 'readonly for dependency-injected values',
      points: [
        'Services injected via a constructor (ILogger, DbContext, HttpClient) should be stored in <code>private readonly</code> fields — they are set once and never reassigned.',
        'Making DI fields <code>readonly</code> documents intent: "this service reference is fixed for the lifetime of this object."',
        'The compiler enforces the contract — any attempt to reassign a <code>readonly</code> field outside the constructor is a compile error, not a runtime surprise.',
        'This pattern is so common that C# 12\'s primary constructors can generate the <code>readonly</code> field implicitly, reducing boilerplate.',
      ],
    },
    {
      heading: 'Keep fields private — expose via properties',
      points: [
        'Fields should almost always be <code>private</code>. Exposing a public field breaks encapsulation: consumers can set it to any value, bypassing validation logic.',
        'A property wraps a backing field with a getter and optional setter, letting you add validation, lazy initialisation, or change notification without breaking callers.',
        'Auto-properties (<code>public int Age { get; set; }</code>) are compiler shorthand — the compiler generates the private backing field automatically.',
        'C# 14 introduces the <code>field</code> keyword inside property accessors, letting you write custom getter/setter logic without declaring a separate backing field.',
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

    // Property exposing the private field with read-only access
    public decimal Balance => _balance;
    public string  Owner   => _owner;

    // Static property — no 'this', accessed on the type itself
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

Console.WriteLine(a1.Balance);              // 1000
Console.WriteLine(BankAccount.TotalAccounts); // 2  ← shared static field`,
    },
    {
      label: 'const vs readonly',
      language: 'csharp',
      code: `public class InterestRules
{
    // ── const: compile-time, implicitly static, primitive/string only ──
    public const decimal TaxRate      = 0.20m;   // 20 % — baked into IL
    public const int     MaxWithdrawals = 10;
    public const string  Currency      = "GBP";

    // ── static readonly: runtime constant, shared across instances ────
    public static readonly DateTime EpochStart =
        new DateTime(2020, 1, 1);             // computed once at startup

    public static readonly string[] SupportedCurrencies =
        ["GBP", "USD", "EUR"];               // array — not allowed as const

    // ── Instance readonly: set per-object in constructor ──────────────
    private readonly string _accountNumber;
    private readonly DateTime _openedAt;

    public InterestRules(string accountNumber)
    {
        _accountNumber = accountNumber;     // assigned once, never changed
        _openedAt      = DateTime.UtcNow;
        // _accountNumber = "other"; // ← compile error: readonly field
    }

    public string AccountNumber => _accountNumber;

    // const vs readonly versioning trap:
    // If you change a const in a library, consumers need a recompile.
    // A static readonly field is read at runtime — no recompile needed.
}

Console.WriteLine(InterestRules.TaxRate);           // 0.20
Console.WriteLine(InterestRules.Currency);          // GBP
Console.WriteLine(InterestRules.EpochStart);        // 01/01/2020 00:00:00`,
    },
    {
      label: 'readonly in practice (DI)',
      language: 'csharp',
      code: `// ── Standard DI pattern: readonly fields for injected services ───
public class AccountService
{
    private readonly ILogger<AccountService> _logger;
    private readonly IAccountRepository      _repo;
    private readonly decimal                 _defaultRate;

    public AccountService(
        ILogger<AccountService> logger,
        IAccountRepository repo,
        IConfiguration config)
    {
        _logger      = logger;                          // readonly — fixed for lifetime
        _repo        = repo;
        _defaultRate = config.GetValue<decimal>("Interest:DefaultRate");
        // Any reassignment below would be a compile error
    }

    public async Task<decimal> GetBalanceAsync(Guid id)
    {
        _logger.LogInformation("Fetching balance for {Id}", id);
        var account = await _repo.FindAsync(id);
        return account?.Balance ?? 0m;
    }
}

// ── C# 12 primary constructors reduce readonly boilerplate ────────
public class PaymentService(IPaymentGateway gateway, ILogger<PaymentService> logger)
{
    // 'gateway' and 'logger' are captured; mark field explicitly if needed
    private readonly IPaymentGateway _gateway = gateway;
    private readonly ILogger<PaymentService> _logger  = logger;

    public async Task ChargeAsync(Guid customerId, decimal amount)
    {
        _logger.LogInformation("Charging {Amount} for {Id}", amount, customerId);
        await _gateway.ProcessAsync(customerId, amount);
    }
}

// ── field keyword (C# 14 preview) — no manual backing field needed ─
public class Temperature
{
    private decimal _celsius;

    public decimal Celsius
    {
        get => field;
        set => field = value < -273.15m
            ? throw new ArgumentOutOfRangeException(nameof(value), "Below absolute zero")
            : value;
    }
}`,
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
      explanation: 'A <code>static</code> field belongs to the type, not to any individual object. There is exactly one copy regardless of how many instances exist. It is accessed via the class name, not via an instance reference. It is <em>not</em> automatically thread-safe — concurrent writes require synchronisation.',
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
      explanation: 'Marking injected dependencies <code>readonly</code> documents intent and gets compiler enforcement for free. Any code that tries to reassign the field after construction gets a compile error. This prevents accidental re-injection or null-assignment bugs.',
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
      explanation: '<code>const</code> only supports compile-time primitives (<code>int</code>, <code>double</code>, <code>decimal</code>, <code>bool</code>, <code>char</code>) and <code>string</code>. Object construction (<code>new</code>), arrays, and collection types are not allowed because they require runtime allocation. Use <code>static readonly</code> for those cases.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use const vs static readonly?',
      a: 'Use <code>const</code> for true, never-changing domain constants that are safe to inline: <code>Math.PI</code>, <code>MaxRetries = 3</code>, <code>Currency = "GBP"</code>. Use <code>static readonly</code> for anything computed at runtime, anything that holds an object/array, or when you publish the value in a library — changing a <code>const</code> in a library forces every consumer to recompile; a <code>static readonly</code> change is picked up at the next run without recompiling consumers.',
    },
    {
      q: 'Can I have a readonly field that is a mutable object (e.g., a List)?',
      a: 'Yes, and it\'s a common source of confusion. <code>private readonly List&lt;string&gt; _tags = new();</code> means the <em>reference</em> is fixed — you cannot make <code>_tags</code> point to a different list. But you can still call <code>_tags.Add("x")</code> because the list\'s contents are mutable. If you need a truly immutable collection use <code>IReadOnlyList&lt;T&gt;</code> or <code>ImmutableList&lt;T&gt;</code>.',
    },
    {
      q: 'What is the versioning trap with const?',
      a: 'When you define <code>public const int MaxSize = 100</code> in Assembly A, the compiler copies the value <code>100</code> directly into every assembly that references it (Assembly B, C, etc.). If you later change it to <code>200</code> and release a new version of Assembly A, the old assemblies still have <code>100</code> hardcoded in them. They need to be recompiled against the new A to pick up the change. <code>static readonly</code> avoids this because the value is read from Assembly A at runtime.',
    },
    {
      q: 'What is a backing field and when do I need to write one manually?',
      a: 'A backing field is the private field that stores the actual data for a property. Auto-properties (<code>public int Age { get; set; }</code>) generate one invisibly. You need to write one explicitly only when you want custom getter/setter logic: input validation, lazy loading, or change notification. C# 14\'s <code>field</code> keyword lets you write that logic <em>without</em> manually declaring the private field — the compiler generates it for you while you reference it as <code>field</code> inside the accessor.',
    },
  ];

  challenge: Challenge = {
    title: 'BankAccount with Fields & Constants',
    description: `Implement a BankAccount class that demonstrates all key field concepts:

Requirements:
1. Private instance field _balance (decimal) — never exposed directly
2. Private readonly field _accountNumber (string) — set in constructor, never changed
3. Static field _interestRate (decimal) — shared across all accounts, default 0.035m (3.5%)
4. Static readonly field MinimumBalance — value 10m, cannot be changed at runtime
5. Public property Balance with a get-only accessor
6. Public property AccountNumber with a get-only accessor
7. Static property InterestRate with get and set accessors
8. Deposit(decimal amount) — validates amount > 0, adds to _balance
9. Withdraw(decimal amount) — validates amount > 0 and that balance after >= MinimumBalance
10. ApplyInterest() — multiplies _balance by (1 + _interestRate)`,
    language: 'csharp',
    hints: [
      'readonly fields can only be assigned in the constructor or at the declaration',
      'Static fields are accessed via the class name (BankAccount._interestRate) or directly in static methods',
      'Throw ArgumentException for invalid deposit/withdraw amounts',
      'For Withdraw, check: _balance - amount >= MinimumBalance',
      'ApplyInterest uses the static _interestRate: _balance *= (1 + _interestRate)',
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
    // TODO: InterestRate static property (get + set)

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
            throw new ArgumentException(\`Initial balance must be at least \${MinimumBalance}.\`);

        _accountNumber = accountNumber;
        _balance       = initialBalance;
    }

    public decimal Balance        => _balance;
    public string  AccountNumber  => _accountNumber;

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
            throw new InvalidOperationException(\`Cannot withdraw: balance would fall below minimum (\${MinimumBalance}).\`);
        _balance -= amount;
    }

    public void ApplyInterest() => _balance *= (1 + _interestRate);
}

// Usage
var acc = new BankAccount("ACC-001", 500m);
acc.Deposit(200m);
acc.ApplyInterest();
Console.WriteLine(acc.Balance);              // 731.10
Console.WriteLine(BankAccount.MinimumBalance); // 10
BankAccount.InterestRate = 0.05m;           // change for all accounts`,
  };
}
