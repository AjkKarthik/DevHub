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
  selector: 'app-csharp-null-safety',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './null-safety.html',
  styleUrl: './null-safety.scss',
})
export class CsharpNullSafety {

  quickRef: QuickRefItem[] = [
    { name: '?',                              type: 'operator', desc: 'Nullable type suffix — int? declares a nullable value type (Nullable<int>)',                        since: 'C# 2' },
    { name: '?.',                             type: 'operator', desc: 'Null-conditional operator — short-circuits to null instead of throwing if the left side is null',    since: 'C# 6' },
    { name: '??',                             type: 'operator', desc: 'Null-coalescing operator — returns right-hand side when left side is null',                          since: 'C# 2' },
    { name: '??=',                            type: 'operator', desc: 'Null-coalescing assignment — assigns right-hand side only when left side is null',                   since: 'C# 8' },
    { name: '!',                              type: 'operator', desc: 'Null-forgiving operator — tells the compiler "trust me, this is not null" (suppresses warning only)', since: 'C# 8' },
    { name: '#nullable enable',               type: 'keyword',  desc: 'Enables nullable reference type analysis for the file or project',                                   since: 'C# 8' },
    { name: 'ArgumentNullException.ThrowIfNull', type: 'method', desc: 'Throws ArgumentNullException if the argument is null — replaces verbose null guard boilerplate',   since: '.NET 6' },
    { name: 'is not null',                    type: 'syntax',   desc: 'Pattern-matching null check — preferred over != null; works with the type system',                   since: 'C# 9' },
    { name: 'null object pattern',            type: 'syntax',   desc: 'Return a "do-nothing" default object instead of null to eliminate null checks at call sites',         since: 'C# 1' },
    { name: 'required',                       type: 'keyword',  desc: 'Forces the property to be set in object initialiser — compiler error if omitted',                    since: 'C# 11' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Nullable value types (int?)',
      points: [
        '<code>int?</code> is syntactic sugar for <code>Nullable&lt;int&gt;</code> — a generic struct that wraps any value type.',
        'Value types (<code>int</code>, <code>bool</code>, <code>double</code>, <code>struct</code>) cannot normally hold <code>null</code>; the <code>?</code> suffix adds that capability.',
        'A nullable value type has two properties: <code>HasValue</code> (bool) and <code>Value</code> (the underlying value — throws if <code>HasValue</code> is false).',
        'Use <code>GetValueOrDefault(fallback)</code> to safely unwrap without an exception, and <code>TryParse</code> patterns to avoid null entirely when parsing user input.',
      ],
    },
    {
      heading: 'Nullable reference types (#nullable enable)',
      points: [
        'Introduced in C# 8, this feature lets the compiler track whether a reference type can be null at compile time.',
        'Without it, every <code>string</code> variable could silently be <code>null</code>. With it, <code>string</code> means non-nullable and <code>string?</code> explicitly allows null.',
        'Enable it project-wide in the <code>.csproj</code> with <code>&lt;Nullable&gt;enable&lt;/Nullable&gt;</code>, or per-file with <code>#nullable enable</code>.',
        'The <code>!</code> null-forgiving operator (<code>name!</code>) suppresses nullable warnings when you know a value is non-null but the compiler cannot prove it — use sparingly.',
      ],
    },
    {
      heading: 'The null operators',
      points: [
        '<strong>Null-conditional <code>?.</code></strong> — evaluates the right side only if the left is non-null; otherwise the whole expression becomes <code>null</code>. Great for chaining: <code>order?.Customer?.Email</code>.',
        '<strong>Null-coalescing <code>??</code></strong> — provides a fallback value: <code>name ?? "Anonymous"</code> returns <code>"Anonymous"</code> only when <code>name</code> is null.',
        '<strong>Null-coalescing assignment <code>??=</code></strong> — assigns the right side to the variable only when it is currently null. Ideal for lazy initialisation of fields.',
        'Chaining all three is common: <code>result = source?.Get(key) ?? cache ??= ComputeExpensive();</code>',
      ],
    },
    {
      heading: 'Fail fast with ThrowIfNull',
      points: [
        '<code>ArgumentNullException.ThrowIfNull(param)</code> (.NET 6+) is one line of null-guard code versus the classic four-line <code>if (x == null) throw new ArgumentNullException(nameof(x))</code>.',
        'Use it at every public method entry point to catch bugs at the boundary, not deep inside a call stack.',
        'The <code>is not null</code> pattern (C# 9) is preferred for conditional checks: <code>if (user is not null)</code> works correctly with the nullable type system and pattern matching.',
        'The null object pattern eliminates null checks entirely for some scenarios: return a "do-nothing" implementation instead of null, so callers never need to guard.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Nullable Value Types',
      language: 'csharp',
      code: `// ── int? is Nullable<int> ────────────────────────────────────────
int  regularInt  = 42;
int? nullableInt = null;   // perfectly legal
int? parsed      = null;

// Checking before use
if (nullableInt.HasValue)
    Console.WriteLine(nullableInt.Value);  // safe

// GetValueOrDefault — never throws
int result = nullableInt.GetValueOrDefault(-1);  // -1
int safe   = nullableInt ?? 0;                   // 0  (coalescing)

// ── TryParse pattern (preferred over nullable) ────────────────────
string input = "42";

if (int.TryParse(input, out int value))
    Console.WriteLine($"Parsed: {value}");  // Parsed: 42
else
    Console.WriteLine("Not a valid integer");

// ── DateTime? for optional dates ──────────────────────────────────
DateTime? completedAt = null;

// ?.ToString() returns null (not an exception) when completedAt is null
string display = completedAt?.ToString("yyyy-MM-dd") ?? "Not yet completed";
Console.WriteLine(display);  // Not yet completed

completedAt = DateTime.UtcNow;
display = completedAt?.ToString("yyyy-MM-dd") ?? "Not yet completed";
Console.WriteLine(display);  // e.g. 2024-03-15

// ── Nullable arithmetic ───────────────────────────────────────────
int? a = 10;
int? b = null;

int? sum = a + b;       // null  (null propagates through arithmetic)
int? doubled = a * 2;   // 20

Console.WriteLine(sum ?? 0);     // 0
Console.WriteLine(doubled ?? 0); // 20

// ── Lifted operators ──────────────────────────────────────────────
int? x = 5;
int? y = 3;

bool? greater = x > y;   // true (lifted comparison)
bool? nullCmp = null > 3; // null (not false — null propagates)`,
    },
    {
      label: 'Nullable Reference Types',
      language: 'csharp',
      code: `#nullable enable

// ── string vs string? ─────────────────────────────────────────────
string  name   = "Alice";   // non-nullable — compiler enforces non-null
string? alias  = null;      // nullable — explicitly allows null

// Compiler warns here without a null check:
// Console.WriteLine(alias.Length);  // Warning: possible dereference of null

// Safe access
if (alias is not null)
    Console.WriteLine(alias.Length);  // compiler knows it's non-null here

Console.WriteLine(alias?.Length ?? 0);  // 0 — safe with operators

// ── Annotations in practice ───────────────────────────────────────
public class UserProfile
{
    public required string FirstName { get; init; }   // must be set at init
    public required string LastName  { get; init; }
    public string?         MiddleName { get; init; }  // optional
    public string?         Bio        { get; set;  }
}

var user = new UserProfile
{
    FirstName = "Alice",
    LastName  = "Smith",
    // MiddleName not required — defaults to null
};

// MiddleName is string? so compiler requires null handling
string display = user.MiddleName is not null
    ? $"{user.FirstName} {user.MiddleName} {user.LastName}"
    : $"{user.FirstName} {user.LastName}";

// ── Null-forgiving operator ! ─────────────────────────────────────
// Use only when YOU know it's non-null but the compiler can't prove it
string? fromDatabase = GetFromDb();   // returns string?
string definitelySet = fromDatabase!; // suppress warning — use with care

// Better: use ?? to provide a real fallback
string safer = fromDatabase ?? throw new InvalidOperationException("Expected a value");

// ── Constructor / method annotations ─────────────────────────────
public string FormatName(string first, string? middle, string last)
{
    // first and last are non-nullable — no null check needed
    // middle is nullable — must be handled
    return middle is not null
        ? $"{first} {middle} {last}"
        : $"{first} {last}";
}`,
    },
    {
      label: 'Null Operators',
      language: 'csharp',
      code: `// ── Null-conditional ?. ──────────────────────────────────────────
Order? order = GetOrder(id);

// Without ?. — verbose and fragile
string? email = null;
if (order != null && order.Customer != null)
    email = order.Customer.Email;

// With ?. — clean, short-circuits on first null
email = order?.Customer?.Email;  // null if any link in the chain is null

// ── ?. with methods ───────────────────────────────────────────────
int? length = order?.GetLineItems()?.Count;  // null if order is null
order?.Cancel();  // only calls Cancel() if order is not null

// ── ?. with indexers ──────────────────────────────────────────────
string[]? tags = GetTags();
string? firstTag = tags?[0];  // null if tags is null; IndexOutOfRange if tags is empty

// ── Null-coalescing ?? ───────────────────────────────────────────
string? config = Environment.GetEnvironmentVariable("APP_ENV");
string  env    = config ?? "development";  // fallback when null

// Chaining ?? for multiple fallbacks
string resolved = GetFromCache() ?? GetFromDb() ?? "default";

// ?? with throw
string required = config ?? throw new InvalidOperationException("APP_ENV must be set");

// ── Null-coalescing assignment ??= ────────────────────────────────
private List<string>? _log;

// Old pattern — two lines
if (_log == null)
    _log = new List<string>();

// With ??= — one line, only initialises if null
_log ??= new List<string>();
_log.Add("Event logged");

// Lazy property initialisation
private string? _cachedResult;

public string GetResult()
{
    _cachedResult ??= ComputeExpensive();  // computed once, cached forever
    return _cachedResult;
}

// ── Combined real-world example ───────────────────────────────────
public string GetDisplayName(User? user)
{
    return user?.FullName?.Trim()
        ?? user?.Username
        ?? "Anonymous";
}`,
    },
    {
      label: 'Guard Patterns',
      language: 'csharp',
      code: `// ── ArgumentNullException.ThrowIfNull (.NET 6+) ─────────────────
public void SendEmail(string to, string subject, string body)
{
    ArgumentNullException.ThrowIfNull(to);
    ArgumentNullException.ThrowIfNull(subject);
    ArgumentNullException.ThrowIfNull(body);

    // All three are guaranteed non-null from here
    Console.WriteLine($"Sending to {to}: {subject}");
}

// Old verbose equivalent (still valid, but wordy):
// if (to is null) throw new ArgumentNullException(nameof(to));

// ── is not null pattern (C# 9+) ──────────────────────────────────
public string FormatAddress(Address? address)
{
    if (address is null)
        return "No address provided";

    // Compiler knows address is non-null after the guard
    return $"{address.Line1}, {address.City}, {address.PostCode}";
}

// Pattern in expression context
string result = address is not null
    ? $"{address.City}"
    : "Unknown city";

// ── Null object pattern ───────────────────────────────────────────
// Instead of returning null from a factory — return a "do nothing" object

public interface ILogger
{
    void Log(string message);
}

public class ConsoleLogger : ILogger
{
    public void Log(string message) => Console.WriteLine(message);
}

// NullLogger: satisfies the interface but does nothing
public class NullLogger : ILogger
{
    public static readonly NullLogger Instance = new();
    public void Log(string message) { }  // intentionally blank
}

// Callers never need to null-check
ILogger logger = GetLogger() ?? NullLogger.Instance;
logger.Log("This always works safely");  // no NullReferenceException ever

// ── Optional<T> — explicit absence without null ───────────────────
public readonly struct Optional<T>
{
    private readonly T _value;
    public bool HasValue { get; }
    public T Value => HasValue ? _value : throw new InvalidOperationException("No value present");

    private Optional(T value) { _value = value; HasValue = true; }

    public static Optional<T> Of(T value)    => new(value);
    public static Optional<T> Empty()        => default;

    public T GetOrDefault(T fallback) => HasValue ? _value : fallback;
    public Optional<TResult> Map<TResult>(Func<T, TResult> selector)
        => HasValue ? Optional<TResult>.Of(selector(_value)) : Optional<TResult>.Empty();
}

// Usage — makes nullability part of the type signature
Optional<User> maybeUser = FindUser(id);
string display = maybeUser
    .Map(u => u.FullName)
    .GetOrDefault("Guest");`,
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'What is the key difference between <code>int?</code> and a nullable reference type like <code>string?</code>?',
      options: [
        'They are identical — both are just compiler hints',
        '<code>int?</code> is a runtime wrapper struct (Nullable&lt;int&gt;) with real HasValue/Value semantics; <code>string?</code> is only a compile-time annotation with no runtime difference',
        '<code>string?</code> allocates extra memory; <code>int?</code> does not',
        '<code>int?</code> only works in .NET 8+; <code>string?</code> works from C# 1',
      ],
      answer: 1,
      explanation: '<code>int?</code> is <code>Nullable&lt;int&gt;</code> — a struct that exists at runtime with <code>HasValue</code> and <code>Value</code> members. <code>string?</code> is purely a compile-time annotation: the runtime type is still <code>string</code>, and null is still null. The compiler uses the annotation to emit warnings, but the IL bytecode is identical to unannotated <code>string</code>.',
    },
    {
      q: 'What is the difference between <code>??</code> and <code>?.</code>?',
      options: [
        'They are the same operator with different syntax',
        '<code>??</code> provides a fallback value when the left side is null; <code>?.</code> conditionally accesses a member and returns null if the receiver is null',
        '<code>?.</code> provides a fallback; <code>??</code> accesses members conditionally',
        'Both throw exceptions when encountering null',
      ],
      answer: 1,
      explanation: '<code>??</code> (null-coalescing) lets you write <code>name ?? "default"</code> — the right side is returned only when the left is null. <code>?.</code> (null-conditional) lets you write <code>order?.Customer?.Email</code> — the chain short-circuits to null at the first null link, preventing a NullReferenceException.',
    },
    {
      q: 'What does the <code>!</code> (null-forgiving) operator actually do at runtime?',
      options: [
        'Throws an exception if the value is null',
        'Converts null to the default value of the type',
        'Nothing — it only suppresses the compiler nullable warning; the runtime is unchanged',
        'Unwraps a Nullable&lt;T&gt; and throws if HasValue is false',
      ],
      answer: 2,
      explanation: 'The null-forgiving operator <code>!</code> produces zero IL bytecode. It is a pure compile-time annotation that tells the nullable analyser "I know this is non-null, stop warning me." If the value actually is null at runtime, you will still get a NullReferenceException. Use it only when you have external guarantees the compiler cannot see.',
    },
    {
      q: 'What advantage does <code>ArgumentNullException.ThrowIfNull(param)</code> have over a manual null check?',
      options: [
        'It is faster at runtime than an if statement',
        'It is one line instead of four, throws with the correct parameter name automatically, and is annotated so the compiler knows the parameter is non-null after the call',
        'It works only in async methods',
        'It logs the exception before throwing',
      ],
      answer: 1,
      explanation: '<code>ArgumentNullException.ThrowIfNull(param)</code> replaces the classic four-line guard. It automatically captures the parameter name via <code>CallerArgumentExpressionAttribute</code> (no <code>nameof</code> needed), and is annotated with <code>[NotNull]</code> so the compiler treats the parameter as non-null after the call — improving nullable flow analysis for the rest of the method.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between <code>int?</code> and <code>string?</code>?',
      a: '<code>int?</code> is <code>Nullable&lt;int&gt;</code> — a real runtime struct. It has <code>HasValue</code> and <code>Value</code> properties and a real performance overhead (boxing when passed as <code>object</code>). <code>string?</code> is only a compile-time annotation when <code>#nullable enable</code> is active. At runtime a <code>string?</code> variable is exactly the same as a <code>string</code> variable — the annotation exists solely so the compiler can warn you about potential null dereferences.',
    },
    {
      q: 'Does <code>#nullable enable</code> affect runtime behaviour?',
      a: 'No. Nullable reference type annotations are erased by the compiler — they produce no IL bytecode. Enabling <code>#nullable enable</code> only changes what warnings the compiler emits. A <code>string?</code> can still be null at runtime and will still throw a NullReferenceException if you dereference it without checking. The annotations are a static analysis tool, not a runtime safety net.',
    },
    {
      q: 'What is the null object pattern?',
      a: 'Instead of returning <code>null</code> from a factory or repository, you return a "do-nothing" object that implements the same interface. For example, a <code>NullLogger</code> implements <code>ILogger</code> but its <code>Log</code> method does nothing. Callers can use the result freely without null checks, removing entire classes of NullReferenceExceptions. It is most useful for optional services (loggers, notification handlers, metrics collectors) that may legitimately be absent.',
    },
    {
      q: 'How do I handle null in LINQ?',
      a: 'Filter nulls early with <code>.Where(x =&gt; x is not null)</code> (or <code>.OfType&lt;T&gt;()</code> to simultaneously filter and cast). Use <code>FirstOrDefault()</code> rather than <code>First()</code> when the sequence might be empty and handle the null result at the call site. For projections, use <code>?.Property ?? fallback</code> inline: <code>users.Select(u =&gt; u?.Email ?? "no email")</code>. In nullable-enabled projects, LINQ operators that return <code>T?</code> (like <code>FirstOrDefault</code>) will surface warnings that guide you to add proper null handling.',
    },
  ];

  challenge: Challenge = {
    title: 'Safe Configuration Reader',
    description: `Implement a ConfigReader class that loads settings lazily and safely.

Requirements:
1. Use ??= for lazy loading — the internal dictionary must not be populated until the first read
2. Use ?. for nested property access when reading optional settings from a config section
3. Use ArgumentNullException.ThrowIfNull for the required connectionString setting
4. Return a typed Optional<T> (or use ?? for nullable fallbacks) for optional settings
5. The GetRequired method must throw a clear exception if the setting is missing`,
    language: 'csharp',
    hints: [
      'Declare the dictionary as Dictionary<string, string>? and use ??= to initialise it on first access',
      'Use ArgumentNullException.ThrowIfNull on the result before returning from GetRequired',
      'For GetOptional, return the value ?? defaultValue rather than throwing',
      'A section reader can use ?. to access the parent dictionary before looking up the key',
    ],
    starterCode: `public class ConfigReader
{
    private readonly Func<Dictionary<string, string>> _loader;
    private Dictionary<string, string>? _cache;

    public ConfigReader(Func<Dictionary<string, string>> loader)
    {
        ArgumentNullException.ThrowIfNull(loader);
        _loader = loader;
    }

    // TODO: implement lazy loading with ??=
    private Dictionary<string, string> Settings => /* ??= here */ throw new NotImplementedException();

    // TODO: return value or throw if key is missing
    public string GetRequired(string key)
    {
        throw new NotImplementedException();
    }

    // TODO: return value or defaultValue if key is missing
    public string GetOptional(string key, string defaultValue = "")
    {
        throw new NotImplementedException();
    }

    // TODO: use ?. to safely read from a sub-section prefix "section:key"
    public string? GetSection(string section, string key)
    {
        throw new NotImplementedException();
    }
}`,
    solution: `public class ConfigReader
{
    private readonly Func<Dictionary<string, string>> _loader;
    private Dictionary<string, string>? _cache;

    public ConfigReader(Func<Dictionary<string, string>> loader)
    {
        ArgumentNullException.ThrowIfNull(loader);
        _loader = loader;
    }

    // ??= ensures the loader runs only once
    private Dictionary<string, string> Settings => _cache ??= _loader();

    public string GetRequired(string key)
    {
        ArgumentNullException.ThrowIfNull(key);

        Settings.TryGetValue(key, out string? value);

        // ThrowIfNull with a custom message via ?? throw
        return value
            ?? throw new InvalidOperationException($"Required configuration key '{key}' is missing.");
    }

    public string GetOptional(string key, string defaultValue = "")
    {
        ArgumentNullException.ThrowIfNull(key);

        return Settings.TryGetValue(key, out string? value)
            ? value
            : defaultValue;
    }

    // ?. safely navigates: if Settings is somehow null (it won't be after ??=),
    // or if the composite key doesn't exist, we return null gracefully
    public string? GetSection(string section, string key)
    {
        string compositeKey = $"{section}:{key}";
        Settings.TryGetValue(compositeKey, out string? value);
        return value;
    }
}

// Usage example:
var reader = new ConfigReader(() => new Dictionary<string, string>
{
    ["connectionString"]     = "Server=localhost;Database=MyDb",
    ["database:timeout"]     = "30",
    ["database:maxPoolSize"] = "100",
});

string connStr  = reader.GetRequired("connectionString"); // "Server=localhost..."
string timeout  = reader.GetSection("database", "timeout") ?? "60"; // "30"
string logLevel = reader.GetOptional("logging:level", "Information"); // "Information" (fallback)`,
  };
}
