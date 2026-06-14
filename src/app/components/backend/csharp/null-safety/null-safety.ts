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
  selector: 'app-csharp-null-safety',
  standalone: true,
  imports: [
    CommonModule, CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
    CommonMistakesComponent, RevisionCardComponent,
  ],
  templateUrl: './null-safety.html',
  styleUrl: './null-safety.scss',
})
export class CsharpNullSafety {

  quickRef: QuickRefItem[] = [
    { name: '?',                              type: 'operator', desc: 'Nullable type suffix — int? declares a nullable value type (Nullable<int>)',                         since: 'C# 2' },
    { name: '?.',                             type: 'operator', desc: 'Null-conditional operator — short-circuits to null instead of throwing if the left side is null',     since: 'C# 6' },
    { name: '??',                             type: 'operator', desc: 'Null-coalescing operator — returns right-hand side when left side is null',                           since: 'C# 2' },
    { name: '??=',                            type: 'operator', desc: 'Null-coalescing assignment — assigns right-hand side only when left side is null',                    since: 'C# 8' },
    { name: '!',                              type: 'operator', desc: 'Null-forgiving operator — tells the compiler "trust me, this is not null" (suppresses warning only)', since: 'C# 8' },
    { name: '#nullable enable',               type: 'keyword',  desc: 'Enables nullable reference type analysis for the file or project',                                    since: 'C# 8' },
    { name: 'ArgumentNullException.ThrowIfNull', type: 'method', desc: 'Throws ArgumentNullException if the argument is null — replaces verbose null guard boilerplate',    since: '.NET 6' },
    { name: 'is not null',                    type: 'syntax',   desc: 'Pattern-matching null check — preferred over != null; works with the type system',                    since: 'C# 9' },
    { name: 'required',                       type: 'keyword',  desc: 'Forces the property to be set in object initialiser — compiler error if omitted',                     since: 'C# 11' },
    { name: '[NotNullWhen]',                  type: 'decorator', desc: 'Nullability attribute: tells the compiler the parameter is non-null when the method returns true/false', since: 'C# 8' },
    { name: 'null object pattern',            type: 'syntax',   desc: 'Return a "do-nothing" default object instead of null to eliminate null checks at call sites',          since: 'C# 1' },
    { name: '?.Invoke()',                     type: 'syntax',   desc: 'Thread-safe event invocation — event?.Invoke(this, args) avoids race between null check and invoke',   since: 'C# 6' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Nullable value types (int?)',
      points: [
        '<code>int?</code> is syntactic sugar for <code>Nullable&lt;int&gt;</code> — a generic struct that wraps any value type, adding a <code>HasValue</code> flag and a <code>Value</code> property.',
        'Value types (<code>int</code>, <code>bool</code>, <code>double</code>, <code>struct</code>) cannot normally hold <code>null</code>; the <code>?</code> suffix adds that capability without making the type a reference type.',
        'A nullable value type exposes <code>HasValue</code> (bool) and <code>Value</code> (the underlying value — throws <code>InvalidOperationException</code> if <code>HasValue</code> is false). Never access <code>.Value</code> without checking <code>HasValue</code> or using a null check first.',
        'Use <code>GetValueOrDefault(fallback)</code> to safely unwrap without an exception. Use <code>TryParse</code> patterns at input boundaries to avoid creating a nullable just to check it immediately.',
        'Nullable value types box differently: <code>int?</code> with a value boxes to <code>int</code> (not <code>Nullable&lt;int&gt;</code>), and <code>int?</code> with no value boxes to <code>null</code>. Lifted operators (comparisons, arithmetic) propagate null — <code>null &gt; 3</code> returns <code>null</code>, not false.',
      ],
    },
    {
      heading: 'Nullable reference types (#nullable enable)',
      points: [
        'Introduced in C# 8, nullable reference types let the compiler track whether a reference type can be null at compile time, turning a class of runtime NullReferenceExceptions into compile-time warnings.',
        'Without it, every <code>string</code> variable silently accepts null. With it, <code>string</code> means non-nullable and <code>string?</code> explicitly allows null — the compiler warns when you dereference a nullable without a null check.',
        'Enable it project-wide in the <code>.csproj</code> with <code>&lt;Nullable&gt;enable&lt;/Nullable&gt;</code>, or per-file with <code>#nullable enable</code>. New .NET 6+ projects have it enabled by default.',
        'The <code>!</code> null-forgiving operator (<code>name!</code>) suppresses nullable warnings when you know a value is non-null but the compiler cannot prove it — use sparingly, and only when you have external guarantees (e.g., after a <code>HasValue</code> check the compiler can\'t flow-analyse).',
        'Nullable flow analysis follows if/else branches, pattern matching, and method return values. Attributes like <code>[NotNullWhen(true)]</code> (used by <code>TryGetValue</code>) tell the compiler that a parameter is non-null when the method returns a specific bool value, enabling safe use without an explicit check.',
      ],
    },
    {
      heading: 'The null operators',
      points: [
        '<strong>Null-conditional <code>?.</code></strong> evaluates the right side only if the left is non-null; otherwise the whole expression becomes <code>null</code>. Essential for chaining: <code>order?.Customer?.Email</code> is null if any link is null, never throwing NullReferenceException.',
        '<strong>Null-coalescing <code>??</code></strong> provides a fallback value: <code>name ?? "Anonymous"</code> returns <code>"Anonymous"</code> only when <code>name</code> is null. Chain it for multiple fallbacks: <code>GetFromCache() ?? GetFromDb() ?? "default"</code>.',
        '<strong>Null-coalescing assignment <code>??=</code></strong> assigns the right side to the variable only when it is currently null. Ideal for lazy initialisation: <code>_cache ??= new Dictionary&lt;string, T&gt;();</code>.',
        '<code>?.Invoke()</code> is the idiomatic way to raise events — <code>EventHandler? handler = MyEvent; handler?.Invoke(this, args);</code> avoids a race condition where another thread unsubscribes between the null check and the invoke call.',
        '<code>?.[index]</code> works on collections: <code>tags?[0]</code> returns null if <code>tags</code> is null, but still throws <code>IndexOutOfRangeException</code> if the array exists but is empty — combine with bounds checking.',
      ],
    },
    {
      heading: 'Fail fast with ThrowIfNull',
      points: [
        '<code>ArgumentNullException.ThrowIfNull(param)</code> (.NET 6+) replaces the four-line guard pattern. It uses <code>CallerArgumentExpressionAttribute</code> to capture the parameter name automatically — no <code>nameof()</code> required.',
        'Use it at every public method and constructor entry point to catch null bugs at the system boundary, not deep inside a call stack where the root cause is obscure.',
        'The <code>is not null</code> pattern (C# 9) is preferred for conditional null checks in if-statements: <code>if (user is not null)</code> integrates with nullable flow analysis and pattern matching, narrowing the type inside the block.',
        '<code>?? throw</code> is the concise way to enforce non-null on a value: <code>string key = GetKey() ?? throw new InvalidOperationException("Key is required");</code> — reads naturally and avoids a separate null check.',
        'The null object pattern eliminates null checks entirely for optional services: return a "do-nothing" implementation instead of null, so callers never need a guard at all. <code>NullLogger.Instance</code>, <code>NullDiscountStrategy</code>, and similar patterns remove entire classes of null-related bugs.',
      ],
    },
    {
      heading: 'Null in LINQ and collections',
      points: [
        'Filter nulls early with <code>.Where(x =&gt; x is not null)</code> or <code>.OfType&lt;T&gt;()</code> (which simultaneously filters and casts, excluding nulls). Filtering early prevents null propagation through the rest of the pipeline.',
        '<code>FirstOrDefault()</code> returns the default value (null for reference types) when no element matches — never use <code>.First()</code> when the sequence might be empty or return no matches. Always handle the null return from <code>FirstOrDefault()</code>.',
        'Use <code>?.Property ?? fallback</code> inside <code>Select</code> projections: <code>users.Select(u =&gt; u?.Email ?? "no email")</code> avoids a separate null-filtering step.',
        'Return empty collections, never null, from repository and service methods — <code>return [];</code> or <code>return Enumerable.Empty&lt;T&gt;()</code>. Callers can always safely iterate an empty sequence; they cannot iterate null.',
        'When nullability is enabled, LINQ operators that return <code>T?</code> (like <code>FirstOrDefault&lt;T&gt;()</code>) surface warnings that guide you to add null handling. Let the compiler lead you to the right patterns.',
      ],
    },
    {
      heading: 'required members and init accessors',
      points: [
        'The <code>required</code> keyword (C# 11) marks a property that must be set in an object initialiser. Omitting it is a compile error — enforcing completeness at construction without a parameterised constructor.',
        '<code>init</code> accessors (C# 9) allow a property to be set in an object initialiser but not mutated after construction. Combine with <code>required</code> to enforce immutable initialisation: <code>public required string Name { get; init; }</code>.',
        'Records with positional parameters enforce all properties at construction — the compiler generates a constructor and <code>init</code> properties automatically. For DTO classes without records, <code>required init</code> achieves the same "set once" guarantee.',
        '<code>[SetsRequiredMembers]</code> attribute on a constructor tells the compiler that the constructor satisfies all required member constraints — used when you provide a custom constructor that sets all required properties, so the object initialiser is not forced.',
        'Together, <code>required</code> + <code>init</code> + nullable reference types form a powerful combination: you get compile-time proof that all mandatory non-null properties were set, and optional properties are explicitly <code>string?</code>. This eliminates entire categories of "property forgot to be set" runtime bugs.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Nullable Value Types',
      language: 'csharp',
      code: `// ── int? is Nullable<int> ─────────────────────────────────────────
int  regularInt  = 42;
int? nullableInt = null;   // perfectly legal

// Checking before use
if (nullableInt.HasValue)
    Console.WriteLine(nullableInt.Value);  // safe

// GetValueOrDefault — never throws
int result = nullableInt.GetValueOrDefault(-1);  // -1
int safe   = nullableInt ?? 0;                   // 0  (coalescing)

// ── TryParse pattern (preferred over nullable) ─────────────────────
string input = "42";

if (int.TryParse(input, out int value))
    Console.WriteLine($"Parsed: {value}");  // Parsed: 42
else
    Console.WriteLine("Not a valid integer");

// ── DateTime? for optional dates ───────────────────────────────────
DateTime? completedAt = null;

// ?.ToString() returns null (not an exception) when completedAt is null
string display = completedAt?.ToString("yyyy-MM-dd") ?? "Not yet completed";
Console.WriteLine(display);  // Not yet completed

completedAt = DateTime.UtcNow;
display = completedAt?.ToString("yyyy-MM-dd") ?? "Not yet completed";
Console.WriteLine(display);  // e.g. 2025-06-14

// ── Nullable arithmetic — null propagates ─────────────────────────
int? a = 10;
int? b = null;

int? sum     = a + b;   // null  (null propagates through arithmetic)
int? doubled = a * 2;   // 20

Console.WriteLine(sum ?? 0);      // 0
Console.WriteLine(doubled ?? 0);  // 20

// ── Lifted operators — null is NOT false ──────────────────────────
int? x = 5;
int? y = 3;

bool? greater = x > y;    // true
bool? nullCmp = null > 3; // null — NOT false! null propagates in comparisons

// Guard before using the result in an if:
if (greater == true)       // not just "if (greater)" — that ignores null
    Console.WriteLine("x is greater");`,
    },
    {
      label: 'Nullable Reference Types',
      language: 'csharp',
      code: `#nullable enable
using System.Diagnostics.CodeAnalysis;

// ── string vs string? ─────────────────────────────────────────────
string  name  = "Alice";   // non-nullable — compiler enforces non-null
string? alias = null;      // nullable — explicitly allows null

// Compiler warns here without a null check:
// Console.WriteLine(alias.Length);  // Warning CS8602: Dereference of a possibly null reference

// Safe access
if (alias is not null)
    Console.WriteLine(alias.Length);  // compiler knows it's non-null here

Console.WriteLine(alias?.Length ?? 0);  // 0 — null-safe

// ── Annotations in practice ───────────────────────────────────────
public class UserProfile
{
    public required string FirstName  { get; init; }  // must be set; non-null
    public required string LastName   { get; init; }
    public string?         MiddleName { get; init; }  // optional
    public string?         Bio        { get; set;  }  // optional; mutable
}

var user = new UserProfile { FirstName = "Alice", LastName = "Smith" };
// MiddleName omitted — defaults to null

string display = user.MiddleName is not null
    ? $"{user.FirstName} {user.MiddleName} {user.LastName}"
    : $"{user.FirstName} {user.LastName}";

// ── Null-forgiving operator ! — use sparingly ─────────────────────
string? fromDatabase = GetFromDb();   // returns string?

// BAD: silences the warning but can still throw at runtime:
string definitelySet = fromDatabase!;

// BETTER: provide a real fallback:
string safer = fromDatabase ?? throw new InvalidOperationException("Expected a value");

// ── [NotNullWhen] attribute — teach the compiler about TryGet patterns ──
// This is how Dictionary.TryGetValue is annotated internally:
public bool TryFind(string key, [NotNullWhen(true)] out string? result)
{
    result = _store.GetValueOrDefault(key);
    return result is not null;
}

if (TryFind("user", out string? found))
    Console.WriteLine(found.Length);  // compiler knows found is non-null here`,
    },
    {
      label: 'Null Operators',
      language: 'csharp',
      code: `// ── Null-conditional ?. ──────────────────────────────────────────
Order? order = GetOrder(id);

// Without ?. — verbose and error-prone
string? email = null;
if (order != null && order.Customer != null)
    email = order.Customer.Email;

// With ?. — clean, short-circuits on first null
email = order?.Customer?.Email;  // null if any link in the chain is null

// ── ?. with methods ───────────────────────────────────────────────
int? count = order?.GetLineItems()?.Count;  // null if order is null
order?.Cancel();  // only calls Cancel() if order is not null

// ── ?. with indexers ──────────────────────────────────────────────
string[]? tags = GetTags();
string? firstTag = tags?[0];  // null if tags is null — still throws if tags is empty!

// ── ?.Invoke() — thread-safe event raising ────────────────────────
// Old pattern (race condition: another thread can unsubscribe between lines):
// if (MyEvent != null) MyEvent(this, args);

// Safe pattern — captures delegate reference first:
EventHandler? handler = MyEvent;
handler?.Invoke(this, EventArgs.Empty);

// ── Null-coalescing ?? ───────────────────────────────────────────
string? config = Environment.GetEnvironmentVariable("APP_ENV");
string  env    = config ?? "development";

// Chain ?? for multiple fallbacks (evaluated left to right, stops at first non-null)
string resolved = GetFromCache() ?? GetFromDb() ?? "default";

// ?? with throw — guard and assign in one expression
string required = config ?? throw new InvalidOperationException("APP_ENV must be set");

// ── Null-coalescing assignment ??= ────────────────────────────────
private List<string>? _log;

_log ??= new List<string>();    // initialise only when null
_log.Add("Event logged");

// Lazy property — computed once
private string? _cachedResult;

public string GetResult()
{
    _cachedResult ??= ComputeExpensive();
    return _cachedResult;
}

// ── Combined real-world example ───────────────────────────────────
public string GetDisplayName(User? user)
    => user?.FullName?.Trim()
        ?? user?.Username
        ?? "Anonymous";`,
    },
    {
      label: 'Guard Patterns',
      language: 'csharp',
      code: `// ── ArgumentNullException.ThrowIfNull (.NET 6+) ──────────────────
public void SendEmail(string to, string subject, string body)
{
    ArgumentNullException.ThrowIfNull(to);       // auto-captures "to" as param name
    ArgumentNullException.ThrowIfNull(subject);
    ArgumentNullException.ThrowIfNull(body);

    Console.WriteLine($"Sending to {to}: {subject}");
}

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
public interface ILogger
{
    void Log(string message);
}

public class NullLogger : ILogger
{
    public static readonly NullLogger Instance = new();
    public void Log(string message) { }   // intentionally does nothing
}

ILogger logger = GetLogger() ?? NullLogger.Instance;
logger.Log("This always works — no NullReferenceException ever");

// ── Return empty collections, never null ──────────────────────────
// BAD: callers must null-check before iterating
public IEnumerable<Product>? GetProductsBad(int categoryId)
{
    if (!_cache.TryGetValue(categoryId, out var products)) return null;
    return products;
}

// GOOD: always iterable; callers never need a null guard
public IEnumerable<Product> GetProducts(int categoryId)
{
    if (!_cache.TryGetValue(categoryId, out var products))
        return Enumerable.Empty<Product>();   // or []
    return products;
}

// ── required members (C# 11) ─────────────────────────────────────
public class OrderLine
{
    public required string ProductSku  { get; init; }  // must be set
    public required int    Quantity    { get; init; }  // must be set
    public string?         Note        { get; init; }  // optional
}

var line = new OrderLine
{
    ProductSku = "SKU-001",
    Quantity   = 2,
    // Note is optional — can omit
};
// Compile error if ProductSku or Quantity is missing from the initializer`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using ! (null-forgiving) liberally — silences real null bugs',
      wrong: `#nullable enable

// Using ! to silence every nullable warning — defeats the purpose
string? result = GetFromDatabase(id);
ProcessString(result!);    // suppresses warning — but result could be null!
string upper = result!.ToUpper();  // NullReferenceException at runtime if null

// Scattered ! throughout the code means nullable reference types
// provide zero protection — worse than disabling it entirely`,
      right: `#nullable enable

string? result = GetFromDatabase(id);

// Option 1: null check — compiler narrows type
if (result is null)
    throw new InvalidOperationException($"Record {id} not found");
string upper = result.ToUpper();  // safe — compiler knows it's non-null

// Option 2: null-coalescing with throw
string value = result ?? throw new InvalidOperationException($"Record {id} not found");

// Option 3: provide a fallback
string safeValue = result ?? "default";

// Use ! ONLY when you have a guarantee the compiler can't see:
string[] args = Environment.GetCommandLineArgs();
string programName = args[0]!;  // GetCommandLineArgs() always has at least 1 element`,
      explanation: 'The null-forgiving operator ! produces zero IL bytecode — it only silences the compiler warning. Overusing it negates the entire benefit of nullable reference types: you get all the annotation overhead with none of the safety. Every ! is a place where a NullReferenceException can still occur at runtime. Reserve ! for genuinely external guarantees the compiler cannot prove.',
    },
    {
      title: 'Returning null from collection methods — forces callers to null-check',
      wrong: `// Returning null from a collection method — every caller must check
public IEnumerable<Order>? GetOrdersByCustomer(int customerId)
{
    var orders = _repository.FindOrders(customerId);
    if (orders.Count == 0) return null;   // BAD: returning null for "no items"
    return orders;
}

// Caller:
var orders = GetOrdersByCustomer(42);
foreach (var o in orders)    // NullReferenceException if no orders exist!
    Process(o);`,
      right: `// Always return an empty collection — never null
public IEnumerable<Order> GetOrdersByCustomer(int customerId)
{
    var orders = _repository.FindOrders(customerId);
    return orders.Count == 0 ? [] : orders;   // empty array, never null
    // Or: return orders ?? [];
}

// Caller — no null check needed, always safe to iterate:
foreach (var o in GetOrdersByCustomer(42))
    Process(o);

// The rule: "empty" and "null" are different things for collections.
// "No orders" IS empty — it is not "no answer"`,
      explanation: 'Returning null from a collection method forces every caller to null-check before iterating. An empty collection is semantically correct for "no results" — iterating an empty collection is always safe. The only time to return null is when the absence of a result means something different from "no items" — and even then, consider a nullable or Optional<T> wrapper instead.',
    },
    {
      title: 'Using First() on a potentially empty sequence — throws',
      wrong: `// First() throws InvalidOperationException if sequence is empty
var firstOrder = orders.Where(o => o.Status == "Pending").First();
// Throws if no pending orders — unhandled exception in production

// Also wrong: ignoring the null from FirstOrDefault
var order = orders.FirstOrDefault(o => o.Id == id);
order.Process();   // NullReferenceException if order is null`,
      right: `// Option 1: FirstOrDefault + null check
var order = orders.FirstOrDefault(o => o.Id == id);
if (order is null)
{
    // Handle "not found" — log, return 404, throw domain exception etc.
    return NotFound();
}
order.Process();  // safe

// Option 2: First() with an Any() guard (only when you expect it to exist)
if (!orders.Any(o => o.Status == "Pending"))
    return;   // nothing to process
var firstPending = orders.First(o => o.Status == "Pending");

// Option 3: FirstOrDefault with ?? throw (clean for "must exist" scenarios)
var required = orders.FirstOrDefault(o => o.Id == requiredId)
    ?? throw new KeyNotFoundException($"Order {requiredId} not found");`,
      explanation: 'First() throws InvalidOperationException when the sequence contains no matching elements — it is correct only when you are certain an element exists. FirstOrDefault() returns null (or default for value types) when nothing matches. Always handle the null case explicitly. In nullable-enabled projects, the compiler warns you to handle the nullable return from FirstOrDefault<T>().',
    },
    {
      title: 'Not enabling #nullable enable — missing the compile-time safety net',
      wrong: `// .csproj without nullable enabled (or old project):
// <Nullable>disable</Nullable>  ← not catching null bugs at compile time

// No warnings for any of these:
string name = null;           // silently null
string upper = name.ToUpper(); // NullReferenceException at runtime
return name.Length;           // NullReferenceException at runtime

// Every string parameter could be null — no compile-time guidance`,
      right: `// In .csproj — enable for the whole project:
// <Nullable>enable</Nullable>

// Now the compiler catches these at build time:
string name = null;              // CS8600: Cannot convert null to non-nullable
string upper = name.ToUpper();   // CS8602: Dereference of possibly null reference

// Correct patterns with nullable enabled:
string? maybeNull = GetName();
string safe = maybeNull ?? "default";

// Or in a new project via dotnet new — it's already enabled by default in .NET 6+`,
      explanation: 'Without #nullable enable, every reference type implicitly allows null — you get no compile-time guidance about what can and cannot be null. NullReferenceException is the most common runtime error in C# code. Enabling nullable reference types shifts null bug detection from runtime (production crash) to compile time (build failure). New .NET 6+ projects have it enabled by default.',
    },
    {
      title: 'Checking for null with == null instead of is null',
      wrong: `// == null works but can be overridden
object? value = GetValue();

if (value == null)            // can be overridden by operator == on the type
    return;

// A type can override == to return true even when the object is not null:
// public static bool operator ==(MyType? a, object? b) => true; // nonsense but legal

// Also: #nullable flow analysis doesn't narrow the type on == null check
// in some edge cases`,
      right: `// is null uses reference equality — cannot be overridden, always correct
object? value = GetValue();

if (value is null)          // pattern match — always reference null check
    return;

// is not null — compiler narrows type in the else branch / after the if
if (value is not null)
    UseValue(value);        // compiler knows value is not null here

// Use is null / is not null consistently for null checks:
string? name = GetName();
ArgumentNullException.ThrowIfNull(name);   // throws if null
Console.WriteLine(name.Length);            // safe after ThrowIfNull`,
      explanation: 'The == null comparison invokes the type\'s equality operator, which can be overloaded to return unexpected results. The is null pattern performs a true reference-equality check that cannot be overridden and cannot return wrong results. It also integrates more cleanly with C#\'s nullable flow analysis — the compiler can narrow types more reliably after is null / is not null checks.',
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
      explanation: '<code>int?</code> is <code>Nullable&lt;int&gt;</code> — a struct that exists at runtime with <code>HasValue</code> and <code>Value</code> members, and real performance implications (boxing). <code>string?</code> is purely a compile-time annotation: the IL bytecode is identical to unannotated <code>string</code> — null can still occur at runtime, and the annotation only affects compiler warnings.',
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
      explanation: '<code>??</code> (null-coalescing) returns the right side when the left is null: <code>name ?? "default"</code>. <code>?.</code> (null-conditional) short-circuits a member access chain to null when any receiver is null: <code>order?.Customer?.Email</code> — no NullReferenceException thrown.',
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
      explanation: 'The null-forgiving operator <code>!</code> produces zero IL bytecode. It is a pure compile-time annotation that tells the nullable analyser "I know this is non-null, stop warning me." If the value is actually null at runtime, you will still get a NullReferenceException. Use it only when you have guarantees the compiler cannot prove.',
    },
    {
      q: 'What advantage does <code>ArgumentNullException.ThrowIfNull(param)</code> have over a manual null check?',
      options: [
        'It is faster at runtime than an if statement',
        'It is one line instead of four, automatically captures the parameter name via CallerArgumentExpressionAttribute, and annotates the parameter as non-null after the call',
        'It works only in async methods',
        'It logs the exception before throwing',
      ],
      answer: 1,
      explanation: '<code>ArgumentNullException.ThrowIfNull(param)</code> uses <code>CallerArgumentExpressionAttribute</code> to capture the argument expression as the parameter name automatically — no <code>nameof()</code> needed. It is also annotated with <code>[NotNull]</code> so the compiler treats the argument as non-null after the call, enabling better nullable flow analysis for the rest of the method.',
    },
    {
      q: 'What does the <code>??=</code> operator do?',
      options: [
        'Assigns the right-hand side to the variable if the right-hand side is null',
        'Assigns the right-hand side to the variable only if the variable is currently null',
        'Throws an exception if either side is null',
        'Compares two nullable values for equality',
      ],
      answer: 1,
      explanation: '<code>??=</code> is the null-coalescing assignment operator. <code>x ??= value</code> is equivalent to <code>if (x == null) x = value;</code> — the right side is only evaluated and assigned when the left side is currently null. It is ideal for lazy initialisation: <code>_cache ??= new Dictionary&lt;K, V&gt;();</code>.',
    },
    {
      q: 'Why should you return an empty collection instead of null from a collection method?',
      options: [
        'Null cannot be returned from IEnumerable methods in .NET 6+',
        'An empty collection can be safely iterated with foreach without a null check, while null throws NullReferenceException',
        'Empty collections use less memory than null',
        'Only reference to the difference is between nullable and non-nullable return types',
      ],
      answer: 1,
      explanation: 'An empty collection is a valid, iterable answer to "give me items that match this query — there were none." A null return means every caller must null-check before iterating, and a missed check is a NullReferenceException. Returning <code>Enumerable.Empty&lt;T&gt;()</code> or <code>[]</code> lets all callers iterate safely with no guard. Only return null when you are distinguishing between "no result" and "empty result" — and even then, prefer <code>T?</code> or <code>Optional&lt;T&gt;</code>.',
    },
    {
      q: 'What does the <code>required</code> keyword (C# 11) enforce?',
      options: [
        'The property must be set in the constructor',
        'The property must be set in an object initialiser at the point of creation — omitting it is a compile error',
        'The property is read-only after construction',
        'The property cannot be null',
      ],
      answer: 1,
      explanation: '<code>required</code> marks a property that must be explicitly assigned in an object initialiser. If you write <code>new Order { }</code> without setting a required property, the compiler emits an error. It is a compile-time safety net that does not require a parameterised constructor, making it ideal for DTO classes, records, and models where you want to enforce completeness at construction.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between <code>int?</code> and <code>string?</code>?',
      a: '<code>int?</code> is <code>Nullable&lt;int&gt;</code> — a real runtime struct with <code>HasValue</code> and <code>Value</code> properties. It has a small runtime overhead (boxing when assigned to <code>object</code>). <code>string?</code> is only a compile-time annotation when <code>#nullable enable</code> is active. At runtime, a <code>string?</code> variable is exactly the same as a <code>string</code> — the annotation exists solely so the compiler can warn you about potential null dereferences. Disabling nullable reference types removes all <code>string?</code> annotations but has zero effect on <code>int?</code>.',
    },
    {
      q: 'Does <code>#nullable enable</code> affect runtime behaviour?',
      a: 'No. Nullable reference type annotations are erased by the compiler — they produce no IL bytecode. Enabling <code>#nullable enable</code> only changes what warnings the compiler emits. A <code>string?</code> can still be null at runtime and will still throw a NullReferenceException if you dereference it without checking. The annotations are a static analysis tool, not a runtime safety net — which is why using <code>!</code> to silence all warnings is counterproductive.',
    },
    {
      q: 'How do I handle null in LINQ queries?',
      a: 'Filter nulls early with <code>.Where(x =&gt; x is not null)</code> or use <code>.OfType&lt;T&gt;()</code> which simultaneously filters out nulls and casts. For projections, use <code>?.Property ?? fallback</code> inside <code>Select</code>. Prefer <code>FirstOrDefault()</code> over <code>First()</code> when the sequence might be empty, and always handle the null return:<br><br><code>var order = orders.FirstOrDefault(o =&gt; o.Id == id);</code><br><code>if (order is null) return NotFound();</code><br><br>In nullable-enabled projects, <code>FirstOrDefault&lt;T&gt;()</code> returns <code>T?</code>, surfacing a warning if you dereference the result without a null check.',
    },
    {
      q: 'What is the null object pattern?',
      a: 'Instead of returning <code>null</code> from a factory or service, return a "do-nothing" object that implements the same interface. For example, a <code>NullLogger</code> implements <code>ILogger</code> but its <code>Log</code> method does nothing. Callers can use the result freely without null checks — removing entire classes of NullReferenceExceptions.<br><br>It is most useful for optional services: loggers, notification handlers, discount calculators, metrics collectors — anything that can legitimately be "absent". The absense of the service is modelled as an inert implementation, not as null.',
    },
    {
      q: 'What is the difference between FirstOrDefault() and First() in terms of null safety?',
      a: '<code>First()</code> throws <code>InvalidOperationException</code> if the sequence is empty or no element matches the predicate. Use it only when you are certain an element exists.<br><br><code>FirstOrDefault()</code> returns <code>null</code> (or <code>default(T)</code> for value types) when nothing matches. It is the safe choice for "find an optional element" scenarios. The critical mistake is calling <code>FirstOrDefault()</code> and then immediately using the result without a null check — the runtime exception just moves one line later.<br><br>Pattern: <code>var item = list.FirstOrDefault(predicate) ?? throw new NotFoundException(...);</code> makes the intent explicit — the item must exist, and the exception is informative.',
    },
    {
      q: 'What is [NotNullWhen] and when would I use it?',
      a: '<code>[NotNullWhen(true)]</code> is a nullable flow attribute that tells the compiler: "when this method returns <code>true</code>, the annotated <code>out</code> parameter is guaranteed to be non-null." This is how <code>Dictionary.TryGetValue(key, out TValue? value)</code> is annotated — after a successful call, the compiler treats <code>value</code> as non-null in the <code>if (dict.TryGetValue(...))  {  }</code> branch.<br><br>Use it when you implement TryXxx methods: <code>public bool TryParse(string input, [NotNullWhen(true)] out MyType? result)</code>. Without the attribute, callers would need to add a null-forgiving operator or extra null check even after a successful call.',
    },
    {
      q: 'How does the required keyword differ from making a property non-nullable?',
      a: 'A non-nullable property (<code>public string Name { get; set; }</code>) tells the compiler the property will not be null — but it does not enforce that the caller <em>actually sets it</em> at construction. An object created without setting <code>Name</code> gets an empty string or causes a warning, but compiles.<br><br><code>required</code> goes further: it is a compile error to create an instance without explicitly setting the property in the object initialiser. Combined with <code>init</code>: <code>public required string Name { get; init; }</code> — the property must be set once at creation, cannot be changed after, and the compiler verifies it was set at every creation site. This is the strongest compile-time guarantee short of using a constructor parameter.',
    },
  ];

  challenge: Challenge = {
    title: 'Safe Configuration Reader',
    description: `Implement a ConfigReader class that loads settings lazily and safely.

Requirements:
1. Use <code>??=</code> for lazy loading — the internal dictionary must not be populated until the first read
2. Use <code>?.</code> for nested property access when reading optional settings from a config section
3. Use <code>ArgumentNullException.ThrowIfNull</code> for required parameters
4. <code>GetRequired</code> must throw a clear exception if the setting is missing
5. <code>GetOptional</code> must return the fallback value if the setting is missing
6. <code>GetSection</code> uses a <code>"section:key"</code> composite key convention`,
    language: 'csharp',
    hints: [
      'Declare the dictionary as Dictionary<string, string>? and use ??= in the Settings property getter',
      'Use ArgumentNullException.ThrowIfNull on the result before returning from GetRequired',
      'For GetOptional, return the value ?? defaultValue rather than throwing',
      'For GetSection, build the composite key "${section}:{key}" and TryGetValue on it',
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

    // TODO: lazy loading with ??=
    private Dictionary<string, string> Settings => throw new NotImplementedException();

    // TODO: return value or throw if key is missing
    public string GetRequired(string key)
        => throw new NotImplementedException();

    // TODO: return value or defaultValue if key is missing
    public string GetOptional(string key, string defaultValue = "")
        => throw new NotImplementedException();

    // TODO: composite key lookup: "{section}:{key}"
    public string? GetSection(string section, string key)
        => throw new NotImplementedException();
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

    // ??= ensures the loader runs only once (lazy initialisation)
    private Dictionary<string, string> Settings => _cache ??= _loader();

    public string GetRequired(string key)
    {
        ArgumentNullException.ThrowIfNull(key);
        return Settings.TryGetValue(key, out string? value)
            ? value
            : throw new InvalidOperationException($"Required configuration key '{key}' is missing.");
    }

    public string GetOptional(string key, string defaultValue = "")
    {
        ArgumentNullException.ThrowIfNull(key);
        return Settings.GetValueOrDefault(key) ?? defaultValue;
    }

    public string? GetSection(string section, string key)
    {
        ArgumentNullException.ThrowIfNull(section);
        ArgumentNullException.ThrowIfNull(key);
        string compositeKey = $"{section}:{key}";
        Settings.TryGetValue(compositeKey, out string? value);
        return value;
    }
}

// Usage:
var reader = new ConfigReader(() => new Dictionary<string, string>
{
    ["connectionString"]     = "Server=localhost;Database=MyDb",
    ["database:timeout"]     = "30",
    ["database:maxPoolSize"] = "100",
});

string connStr  = reader.GetRequired("connectionString");
string timeout  = reader.GetSection("database", "timeout") ?? "60";
string logLevel = reader.GetOptional("logging:level", "Information");`,
  };

  revision: RevisionSummary = {
    oneLiner: 'int? is a real runtime struct (Nullable<T>); string? is compile-time only. Use ?. to chain safely, ?? for fallbacks, ??= for lazy init. Enable #nullable project-wide. Return empty collections — never null. Use ArgumentNullException.ThrowIfNull at method boundaries.',
    mustKnow: [
      '<code>int?</code> = runtime struct <code>Nullable&lt;int&gt;</code> with HasValue/Value. <code>string?</code> = compile-time annotation only — null can still occur at runtime.',
      '<code>?.</code> short-circuits to null; <code>??</code> provides a fallback; <code>??=</code> assigns only when null. Combine: <code>user?.Name ?? "Guest"</code>.',
      '<code>!</code> null-forgiving produces zero IL — only suppresses compiler warnings. Overusing it defeats the purpose of nullable reference types.',
      'Enable <code>#nullable enable</code> project-wide (<code>&lt;Nullable&gt;enable&lt;/Nullable&gt;</code>). New .NET 6+ projects have it by default.',
      'Return empty collections (<code>[]</code> or <code>Enumerable.Empty&lt;T&gt;()</code>), never null — iterating an empty collection is always safe.',
      '<code>required</code> + <code>init</code> (C# 11/9): compile-time proof that a property was set at construction without a parameterised constructor.',
      '<code>ArgumentNullException.ThrowIfNull(x)</code> at every public method boundary — catches null bugs at the source, not deep in the call stack.',
    ],
    interviewFocus: [
      'What is the difference between int? and string? at runtime? (int? is a real struct; string? is annotation-only — both can be null at runtime)',
      'What does the ! null-forgiving operator actually do at runtime? (Nothing — zero IL; if value is null, NullReferenceException still occurs)',
      'Why return an empty collection instead of null? (Callers can always iterate an empty collection; null requires a guard at every call site)',
      'What is the null object pattern and when would you use it? (Return a do-nothing implementation instead of null; eliminates null checks for optional services)',
      'What does [NotNullWhen(true)] do? (Tells the compiler an out parameter is non-null when method returns true — used by TryGetValue, TryParse)',
    ],
  };
}
