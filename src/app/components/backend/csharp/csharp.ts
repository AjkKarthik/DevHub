import { Component } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../shared/quick-ref/quick-ref';
import { BeforeAfterComponent, BeforeAfterExample } from '../../shared/before-after/before-after';
import { CommonMistakesComponent, CommonMistake } from '../../shared/common-mistakes/common-mistakes';
import { PageMetaComponent } from '../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../shared/page-complete/page-complete';
import { RevisionCardComponent, RevisionSummary } from '../../shared/revision-card/revision-card';

@Component({
  selector: 'app-csharp',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    BeforeAfterComponent, CommonMistakesComponent,
    PageMetaComponent, PageCompleteComponent, RevisionCardComponent,
  ],
  templateUrl: './csharp.html',
  styleUrl: './csharp.scss',
})
export class CsharpDemo {

  theory: TheoryPoint[] = [
    {
      heading: 'C# — a strongly-typed, object-oriented language',
      points: [
        'C# runs on the .NET runtime — it compiles to IL (Intermediate Language), then JIT-compiled to native code.',
        'Everything is an object — value types (<code>int</code>, <code>struct</code>) live on the stack; reference types (<code>class</code>) live on the heap.',
        'C# is statically typed — types are checked at compile time, catching bugs before runtime.',
        'Modern C# (10+) has top-level statements, pattern matching, records, and nullable reference types.',
      ],
    },
    {
      heading: 'Classes, interfaces, and records',
      points: [
        '<code>class</code> — reference type with mutable state. Supports inheritance, encapsulation, polymorphism.',
        '<code>interface</code> — defines a contract with no implementation (default interface methods are the exception).',
        '<code>abstract class</code> — partially implemented base class. Cannot be instantiated directly.',
        '<code>record</code> (C# 9+) — immutable reference type with value-based equality. Perfect for DTOs.',
        '<code>record struct</code> (C# 10+) — like record but a value type on the stack.',
      ],
    },
    {
      heading: 'Generics and collections',
      points: [
        'Generics let you write type-safe code without duplicating logic: <code>List&lt;T&gt;</code>, <code>Dictionary&lt;TKey, TValue&gt;</code>.',
        '<code>List&lt;T&gt;</code> — dynamic array. Use when you need ordered, index-accessible items.',
        '<code>Dictionary&lt;K,V&gt;</code> — hash map. O(1) lookup by key.',
        '<code>IEnumerable&lt;T&gt;</code> — the base read-only sequence interface. LINQ works on anything that implements it.',
        'Constraints (<code>where T : class</code>) restrict what types can be used as generic arguments.',
      ],
    },
    {
      heading: 'LINQ — Language Integrated Query',
      points: [
        'LINQ lets you query any <code>IEnumerable&lt;T&gt;</code> or <code>IQueryable&lt;T&gt;</code> with a consistent API.',
        'Two syntaxes: method syntax (<code>.Where().Select()</code>) and query syntax (<code>from x in y where ... select ...</code>).',
        'LINQ is lazy — operators like <code>Where</code> and <code>Select</code> return an unevaluated query; <code>ToList()</code> triggers execution.',
        'Common operators: <code>Where</code>, <code>Select</code>, <code>OrderBy</code>, <code>GroupBy</code>, <code>First</code>, <code>Any</code>, <code>All</code>, <code>Sum</code>, <code>Count</code>.',
        'Entity Framework translates LINQ to SQL — the same syntax works for both in-memory and database queries.',
      ],
    },
    {
      heading: 'async / await and Task',
      points: [
        '<code>async</code> marks a method as asynchronous. It must return <code>Task</code>, <code>Task&lt;T&gt;</code>, or <code>ValueTask&lt;T&gt;</code>.',
        '<code>await</code> suspends the method until the awaited task completes — without blocking the thread.',
        'Use <code>Task.WhenAll()</code> to run multiple async operations in parallel and wait for all to finish.',
        '<code>CancellationToken</code> lets callers cancel long-running operations gracefully.',
        'Never use <code>.Result</code> or <code>.Wait()</code> on a Task in async code — it deadlocks in some contexts.',
      ],
    },
    {
      heading: 'Null handling and pattern matching',
      points: [
        'Nullable reference types (C# 8+) make null explicit: <code>string?</code> can be null, <code>string</code> cannot.',
        '<code>??</code> — null-coalescing: returns right side if left is null. <code>name ?? "Guest"</code>.',
        '<code>?.</code> — null-conditional: short-circuits to null if left is null. <code>user?.Address?.City</code>.',
        'Pattern matching: <code>is</code> checks type and declares a variable in one step. <code>switch</code> expressions are concise and exhaustive.',
        '<code>ArgumentNullException.ThrowIfNull(param)</code> (C# 10+) replaces manual null checks at method entry.',
      ],
    },
  ];

  // ── Code tabs ──────────────────────────────────────────────────────────────
  classTabs: CodeTab[] = [
    {
      label: 'Class basics',
      language: 'csharp',
      code: `public class BankAccount
{
    // Auto-property with init-only setter
    public string Owner { get; init; }
    public decimal Balance { get; private set; }

    public BankAccount(string owner, decimal initialBalance)
    {
        Owner = owner;
        Balance = initialBalance;
    }

    public void Deposit(decimal amount)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(amount);
        Balance += amount;
    }

    public bool Withdraw(decimal amount)
    {
        if (amount > Balance) return false;
        Balance -= amount;
        return true;
    }

    public override string ToString() => $"{Owner}: £{Balance:F2}";
}

// Usage
var account = new BankAccount("Alice", 1000m);
account.Deposit(500m);
account.Withdraw(200m);
Console.WriteLine(account); // Alice: £1300.00`,
    },
    {
      label: 'Interface & polymorphism',
      language: 'csharp',
      code: `public interface IShape
{
    double Area();
    double Perimeter();
    string Describe() => $"Area: {Area():F2}, Perimeter: {Perimeter():F2}"; // default method
}

public class Circle(double radius) : IShape
{
    public double Area() => Math.PI * radius * radius;
    public double Perimeter() => 2 * Math.PI * radius;
}

public class Rectangle(double width, double height) : IShape
{
    public double Area() => width * height;
    public double Perimeter() => 2 * (width + height);
}

// Polymorphism — same interface, different behaviour
IShape[] shapes = [new Circle(5), new Rectangle(4, 6)];
foreach (var shape in shapes)
    Console.WriteLine(shape.Describe());`,
    },
    {
      label: 'Records (C# 9+)',
      language: 'csharp',
      code: `// Record — immutable DTO with value-based equality
public record Person(string FirstName, string LastName, int Age)
{
    public string FullName => $"{FirstName} {LastName}";
}

var alice = new Person("Alice", "Smith", 30);
var alice2 = new Person("Alice", "Smith", 30);

Console.WriteLine(alice == alice2);   // True — value equality
Console.WriteLine(alice.FullName);    // Alice Smith

// Non-destructive mutation with 'with'
var olderAlice = alice with { Age = 31 };
Console.WriteLine(olderAlice);        // Person { FirstName = Alice, LastName = Smith, Age = 31 }
Console.WriteLine(alice.Age);         // 30 — original unchanged

// Deconstruction
var (first, last, age) = alice;
Console.WriteLine($"{first} is {age}");  // Alice is 30`,
    },
    {
      label: 'Generics',
      language: 'csharp',
      code: `// Generic method
public static T Max<T>(T a, T b) where T : IComparable<T>
    => a.CompareTo(b) >= 0 ? a : b;

Console.WriteLine(Max(3, 7));       // 7
Console.WriteLine(Max("apple", "banana")); // banana

// Generic class — type-safe result wrapper
public class Result<T>
{
    public T? Value { get; }
    public string? Error { get; }
    public bool IsSuccess => Error is null;

    private Result(T? value, string? error) { Value = value; Error = error; }

    public static Result<T> Ok(T value) => new(value, null);
    public static Result<T> Fail(string error) => new(default, error);
}

var ok  = Result<int>.Ok(42);
var err = Result<int>.Fail("Not found");

if (ok.IsSuccess) Console.WriteLine(ok.Value); // 42`,
    },
  ];

  linqTabs: CodeTab[] = [
    {
      label: 'LINQ basics',
      language: 'csharp',
      code: `var numbers = new[] { 5, 3, 8, 1, 9, 2, 7, 4, 6 };

// Method syntax
var evensSorted = numbers
    .Where(n => n % 2 == 0)
    .OrderBy(n => n)
    .ToList(); // [2, 4, 6, 8]

// Projection
var squared = numbers.Select(n => n * n); // lazy — not evaluated yet
var squaredList = squared.ToList();        // evaluated here

// Aggregation
int sum   = numbers.Sum();         // 45
double avg = numbers.Average();    // 5.0
int max   = numbers.Max();         // 9

// Existence checks
bool hasNine  = numbers.Any(n => n == 9);   // true
bool allPos   = numbers.All(n => n > 0);    // true
int  firstBig = numbers.First(n => n > 6);  // 8`,
    },
    {
      label: 'GroupBy & join',
      language: 'csharp',
      code: `record Product(string Name, string Category, decimal Price);

var products = new List<Product>
{
    new("Laptop",  "Electronics", 999m),
    new("Phone",   "Electronics", 699m),
    new("Desk",    "Furniture",   349m),
    new("Chair",   "Furniture",   199m),
    new("Monitor", "Electronics", 399m),
};

// GroupBy — category totals
var categoryTotals = products
    .GroupBy(p => p.Category)
    .Select(g => new
    {
        Category = g.Key,
        Count    = g.Count(),
        Total    = g.Sum(p => p.Price),
    })
    .OrderByDescending(g => g.Total);

foreach (var cat in categoryTotals)
    Console.WriteLine($"{cat.Category}: {cat.Count} items, £{cat.Total}");
// Electronics: 3 items, £2097
// Furniture:   2 items, £548

// Top item per category
var topPerCategory = products
    .GroupBy(p => p.Category)
    .Select(g => g.MaxBy(p => p.Price)!);`,
    },
    {
      label: 'Query syntax',
      language: 'csharp',
      code: `record Student(string Name, int Grade, string Subject);

var students = new List<Student>
{
    new("Alice", 92, "Maths"),
    new("Bob",   78, "Maths"),
    new("Carol", 88, "Science"),
    new("Dave",  95, "Science"),
    new("Eve",   85, "Maths"),
};

// Query syntax — reads like SQL
var topStudents =
    from s in students
    where s.Grade >= 85
    orderby s.Grade descending
    select new { s.Name, s.Grade, s.Subject };

foreach (var s in topStudents)
    Console.WriteLine($"{s.Name} ({s.Subject}): {s.Grade}");
// Dave (Science): 95
// Alice (Maths): 92
// Carol (Science): 88
// Eve (Maths): 85`,
    },
  ];

  asyncTabs: CodeTab[] = [
    {
      label: 'async / await',
      language: 'csharp',
      code: `// Return Task<T> for async methods with a result
public async Task<string> FetchUserAsync(int id, CancellationToken ct = default)
{
    using var client = new HttpClient();
    // await suspends — thread is free to do other work
    var response = await client.GetAsync($"/api/users/{id}", ct);
    response.EnsureSuccessStatusCode();
    return await response.Content.ReadAsStringAsync(ct);
}

// Return Task (no result) for fire-and-forget style
public async Task SaveLogAsync(string message)
{
    await File.AppendAllTextAsync("app.log", message + Environment.NewLine);
}

// Parallel execution — run both at once
public async Task<(string user, string orders)> GetDashboardAsync(int userId)
{
    var userTask   = FetchUserAsync(userId);
    var ordersTask = FetchOrdersAsync(userId);

    // Both requests are in-flight simultaneously
    await Task.WhenAll(userTask, ordersTask);
    return (userTask.Result, ordersTask.Result);
}`,
    },
    {
      label: 'CancellationToken',
      language: 'csharp',
      code: `// Pass CancellationToken through the call chain
public async Task<List<Product>> SearchProductsAsync(
    string query,
    CancellationToken ct)
{
    await using var db = new AppDbContext();

    return await db.Products
        .Where(p => p.Name.Contains(query))
        .OrderBy(p => p.Name)
        .ToListAsync(ct);   // EF passes ct to the SQL driver
}

// In ASP.NET Core — token comes from the HTTP request
[HttpGet("search")]
public async Task<IActionResult> Search(
    string q,
    CancellationToken ct)  // automatically bound to request lifetime
{
    var results = await SearchProductsAsync(q, ct);
    return Ok(results);
    // If client disconnects, ct is cancelled — no wasted DB work
}

// Manual cancellation with timeout
using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
try
{
    var data = await SearchProductsAsync("phone", cts.Token);
}
catch (OperationCanceledException)
{
    Console.WriteLine("Search timed out");
}`,
    },
    {
      label: 'Exception handling',
      language: 'csharp',
      code: `// Typed catch — most specific first
public async Task<Result<Order>> PlaceOrderAsync(OrderRequest request)
{
    try
    {
        ValidateRequest(request);           // throws ArgumentException
        var order = await _repo.CreateAsync(request);
        await _emailService.SendConfirmationAsync(order);
        return Result<Order>.Ok(order);
    }
    catch (ArgumentException ex)
    {
        return Result<Order>.Fail($"Validation: {ex.Message}");
    }
    catch (DbUpdateException ex)
    {
        _logger.LogError(ex, "DB error placing order");
        return Result<Order>.Fail("Database error — please retry");
    }
    catch (Exception ex) when (ex is not OperationCanceledException)
    {
        _logger.LogError(ex, "Unexpected error");
        return Result<Order>.Fail("An unexpected error occurred");
    }
}

// Custom exception
public class OrderNotFoundException(int orderId)
    : Exception($"Order {orderId} not found");`,
    },
  ];

  nullPatternTabs: CodeTab[] = [
    {
      label: 'Null handling',
      language: 'csharp',
      code: `// Nullable reference types — enable in .csproj
// <Nullable>enable</Nullable>

string  name  = "Alice";   // cannot be null — compiler warns
string? alias = null;      // explicitly nullable

// Null-coalescing
string display = alias ?? name;           // "Alice"
string upper   = alias?.ToUpper() ?? ""; // "" (safe chain)

// Null-coalescing assignment
alias ??= "no alias";   // only assigns if alias is null

// Null-conditional indexer
int[]? scores = null;
int? first = scores?[0];  // null, not IndexOutOfRangeException

// ArgumentNullException guard (C# 10+)
public void Process(string input)
{
    ArgumentNullException.ThrowIfNull(input);
    // input is guaranteed non-null here
}`,
    },
    {
      label: 'Pattern matching',
      language: 'csharp',
      code: `// is — type check + declaration
object obj = "hello";
if (obj is string s && s.Length > 3)
    Console.WriteLine(s.ToUpper()); // HELLO

// switch expression (C# 8+)
static string Classify(int n) => n switch
{
    < 0          => "negative",
    0            => "zero",
    > 0 and < 10 => "small positive",
    _            => "large positive",
};

// Property pattern
record Point(int X, int Y);
static string Quadrant(Point p) => p switch
{
    { X: > 0, Y: > 0 } => "Q1",
    { X: < 0, Y: > 0 } => "Q2",
    { X: < 0, Y: < 0 } => "Q3",
    { X: > 0, Y: < 0 } => "Q4",
    _                   => "On axis",
};

// List pattern (C# 11+)
static string Describe(int[] arr) => arr switch
{
    []        => "empty",
    [var x]   => $"single: {x}",
    [var h, ..] => $"starts with {h}",
};`,
    },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'record',                   type: 'keyword',   desc: 'Immutable reference type with value equality and with-expression support', since: 'C# 9' },
    { name: 'record struct',            type: 'keyword',   desc: 'Immutable value type record — lives on the stack', since: 'C# 10' },
    { name: 'init',                     type: 'accessor',  desc: 'Property can only be set during object initialisation', since: 'C# 9' },
    { name: '??',                       type: 'operator',  desc: 'Null-coalescing — returns right operand if left is null', since: 'C# 2' },
    { name: '?.',                       type: 'operator',  desc: 'Null-conditional — short-circuits to null if left side is null', since: 'C# 6' },
    { name: '??=',                      type: 'operator',  desc: 'Null-coalescing assignment — assigns only if left side is null', since: 'C# 8' },
    { name: 'Task<T>',                  type: 'type',      desc: 'Represents an async operation that produces a value of type T', since: '.NET 4' },
    { name: 'CancellationToken',        type: 'type',      desc: 'Passed through async chains to support cooperative cancellation', since: '.NET 4' },
    { name: 'IEnumerable<T>',           type: 'interface', desc: 'Base sequence interface — LINQ extends anything that implements it', since: '.NET 2' },
    { name: 'where T : class',          type: 'constraint', desc: 'Generic constraint — T must be a reference type', since: 'C# 2' },
    { name: 'ArgumentNullException.ThrowIfNull', type: 'method', desc: 'One-liner null guard — throws if argument is null', since: 'C# 10' },
    { name: 'switch expression',        type: 'syntax',    desc: 'Concise exhaustive pattern matching returning a value', since: 'C# 8' },
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: 'Null checks — old guard vs ThrowIfNull',
      before: `public void Save(string name)
{
    if (name == null)
        throw new ArgumentNullException(nameof(name));
    // ...
}`,
      after: `public void Save(string name)
{
    ArgumentNullException.ThrowIfNull(name);
    // ...
}`,
      note: 'ThrowIfNull uses the CallerArgumentExpression attribute to capture the param name automatically.',
    },
    {
      title: 'DTO class vs record',
      before: `public class UserDto
{
    public string Name { get; set; }
    public int Age { get; set; }

    public override bool Equals(object obj)
        => obj is UserDto u && u.Name == Name && u.Age == Age;
    public override int GetHashCode()
        => HashCode.Combine(Name, Age);
}`,
      after: `public record UserDto(string Name, int Age);`,
      note: 'Records auto-generate constructor, Equals, GetHashCode, ToString, and with-expression support.',
    },
    {
      title: 'Async void vs async Task',
      before: `// DANGEROUS — exceptions are unobservable
public async void LoadData()
{
    var data = await FetchAsync();
    Display(data);
}`,
      after: `// Correct — exceptions propagate through the Task
public async Task LoadDataAsync()
{
    var data = await FetchAsync();
    Display(data);
}`,
      note: 'async void swallows exceptions. Only use it for event handlers where the signature is fixed.',
    },
    {
      title: 'Manual loop vs LINQ',
      before: `var result = new List<string>();
foreach (var p in products)
{
    if (p.Price > 100 && p.InStock)
        result.Add(p.Name.ToUpper());
}
result.Sort();`,
      after: `var result = products
    .Where(p => p.Price > 100 && p.InStock)
    .Select(p => p.Name.ToUpper())
    .OrderBy(n => n)
    .ToList();`,
      note: 'LINQ is declarative — it says WHAT you want, not HOW to get it. Easier to read and compose.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using .Result or .Wait() on a Task',
      wrong: `// Deadlocks in ASP.NET / UI contexts
var user = GetUserAsync(id).Result;
var data = LoadAsync().Wait();`,
      right: `// Always await
var user = await GetUserAsync(id);
await LoadAsync();`,
      explanation: '.Result/.Wait() blocks the calling thread. In contexts with a synchronisation context (ASP.NET classic, WPF) this deadlocks because the continuation needs the blocked thread.',
    },
    {
      title: 'Mutating a record instead of using with',
      wrong: `var order = new Order("O1", 100m);
order.Amount = 200m; // compile error — init-only`,
      right: `var order    = new Order("O1", 100m);
var updated = order with { Amount = 200m };`,
      explanation: 'Records are immutable. Use the with-expression to create a modified copy — the original is untouched.',
    },
    {
      title: 'Forgetting ToList() — iterating a LINQ query twice',
      wrong: `var query = items.Where(x => Expensive(x));
var count = query.Count();   // executes query
var list  = query.ToList();  // executes again!`,
      right: `var list  = items.Where(x => Expensive(x)).ToList(); // execute once
var count = list.Count;   // just reads .Count property`,
      explanation: 'LINQ queries are lazy. Every time you enumerate without materialising, the full pipeline runs again. Call ToList() / ToArray() to materialise.',
    },
    {
      title: 'Catching Exception instead of specific types',
      wrong: `try { await SaveAsync(); }
catch (Exception ex)
{
    Console.WriteLine("Error: " + ex.Message);
    // swallows OperationCanceledException, OutOfMemoryException...
}`,
      right: `try { await SaveAsync(); }
catch (DbUpdateException ex) { /* handle DB error */ }
catch (IOException ex)       { /* handle file/network error */ }
// Let unexpected exceptions propagate`,
      explanation: 'Catching the base Exception swallows cancellation and fatal errors. Catch the most specific exception you can handle — let the rest propagate.',
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'What is the key difference between a class and a record in C#?',
      options: [
        'Records are faster than classes',
        'Records have value-based equality; classes have reference-based equality by default',
        'Records cannot have methods',
        'Classes are immutable; records are mutable',
      ],
      answer: 1,
      explanation: 'Two record instances with the same property values are equal (<code>==</code> returns true). Two class instances are only equal if they are the same object in memory (unless you override Equals).',
    },
    {
      q: 'What does LINQ\'s Where() operator return immediately?',
      options: [
        'A List<T> with filtered results',
        'An array',
        'A lazy IEnumerable<T> — the filter has not executed yet',
        'A boolean',
      ],
      answer: 2,
      explanation: 'LINQ operators are lazy. Where() returns an <code>IEnumerable&lt;T&gt;</code> that represents the query. The filter only runs when you enumerate — with foreach, ToList(), Count(), etc.',
    },
    {
      q: 'Why should you avoid async void?',
      options: [
        'It runs synchronously',
        'It is slower than async Task',
        'Exceptions thrown inside async void are unobservable and crash the process',
        'It cannot use await',
      ],
      answer: 2,
      explanation: 'When an exception escapes an async void method it is raised on the synchronisation context — usually crashing the application with no stack trace. Use async Task so exceptions are captured in the returned Task.',
    },
    {
      q: 'What does the ?? operator do?',
      options: [
        'Checks if two values are equal',
        'Returns the right-hand value if the left-hand value is null',
        'Throws if the value is null',
        'Converts null to false',
      ],
      answer: 1,
      explanation: '<code>value ?? fallback</code> evaluates to <code>value</code> if it is non-null, otherwise <code>fallback</code>. It is the null-coalescing operator.',
    },
    {
      q: 'What does CancellationToken enable?',
      options: [
        'Automatic retry on failure',
        'Cooperative cancellation — the caller can signal operations to stop early',
        'Thread-safe access to shared state',
        'Timeout-based exception throwing',
      ],
      answer: 1,
      explanation: 'CancellationToken is a signal. The caller creates a CancellationTokenSource, passes its Token to async methods, and calls Cancel() to request early termination. The async method checks IsCancellationRequested or passes the token to awaited APIs.',
    },
    {
      q: 'What is pattern matching with a when guard clause?',
      options: [
        'A C# preprocessor directive that conditionally compiles code based on a condition',
        'An additional boolean condition in a switch arm or is expression — the arm only matches if both the pattern and the when condition are true',
        'A null-check shorthand that throws when the pattern does not match',
        'A LINQ operator for filtering elements that match a specific type',
      ],
      answer: 1,
      explanation: 'switch (shape) { case Circle c when c.Radius > 10 => "large circle" } — the arm matches only when the shape is a Circle AND its Radius exceeds 10. The when clause can reference variables bound by the pattern (here c). Without the guard, any Circle would match regardless of size. Guards enable fine-grained branching that type patterns alone cannot express.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use a record vs a class?',
      a: 'Use <code>record</code> for data containers (DTOs, API responses, value objects) that are immutable and compared by value. Use <code>class</code> for entities with identity, mutable state, or behaviour-heavy objects like services and repositories.',
    },
    {
      q: 'What is the difference between IEnumerable and IQueryable?',
      a: '<code>IEnumerable&lt;T&gt;</code> is evaluated in memory — LINQ runs C# lambdas. <code>IQueryable&lt;T&gt;</code> translates LINQ into a query language (e.g. SQL via Entity Framework). Always use IQueryable when filtering before fetching from a database to avoid loading all rows.',
    },
    {
      q: 'Should I use ValueTask instead of Task?',
      a: 'Use <code>ValueTask&lt;T&gt;</code> only when the method frequently completes synchronously (e.g. a cache hit). It avoids a heap allocation in that path. For most cases, <code>Task&lt;T&gt;</code> is simpler and the allocation cost is negligible.',
    },
    {
      q: 'What is the difference between abstract class and interface?',
      a: 'An <code>interface</code> is a pure contract — no fields, no constructor, a class can implement many. An <code>abstract class</code> can have fields, constructors, and shared implementation, but a class can only inherit one. Use interfaces for capabilities (IDisposable, IComparable); use abstract classes for shared base implementation.',
    },
    {
      q: 'How does pattern matching with switch expressions work?',
      a: 'A switch expression tests the input against patterns in order and returns the value of the matching arm. Patterns include type patterns (<code>is string s</code>), property patterns (<code>{ Name: "Alice" }</code>), relational patterns (<code>&lt; 0</code>), and the discard <code>_</code> as a catch-all. The compiler warns if the switch is not exhaustive.',
    },
    {
      q: 'What is the difference between ref and out parameters in C#?',
      a: '<code>ref</code> parameters must be initialised by the caller before passing — the method can both read and write the value. <code>out</code> parameters do not need to be initialised by the caller — the method is responsible for assigning them before returning (the compiler enforces this). Both are passed by reference (no copy). Use <code>ref</code> when the current value matters to the method; use <code>out</code> for secondary return values (the classic pattern: <code>int.TryParse(str, out int result)</code>).',
    },
  ];

  challenge: Challenge = {
    title: 'Student grade analyser',
    description: `You have a list of Student records. Using LINQ:
1. Filter to students who passed (grade >= 50)
2. Group them by subject
3. For each subject, return the subject name, student count, and average grade
4. Order results by average grade descending
Return a list of SubjectSummary records.`,
    language: 'csharp',
    hints: [
      'Use GroupBy(s => s.Subject) to group',
      'Use .Select(g => new SubjectSummary(...)) to project each group',
      'g.Average(s => s.Grade) gives the average for a group',
      'Chain .OrderByDescending(s => s.AverageGrade) at the end',
    ],
    starterCode: `record Student(string Name, string Subject, int Grade);
record SubjectSummary(string Subject, int Count, double AverageGrade);

public List<SubjectSummary> Analyse(List<Student> students)
{
    // TODO: filter, group, project, and sort
}`,
    solution: `public List<SubjectSummary> Analyse(List<Student> students)
{
    return students
        .Where(s => s.Grade >= 50)
        .GroupBy(s => s.Subject)
        .Select(g => new SubjectSummary(
            Subject:      g.Key,
            Count:        g.Count(),
            AverageGrade: g.Average(s => s.Grade)
        ))
        .OrderByDescending(s => s.AverageGrade)
        .ToList();
}`,
  };

  revision: RevisionSummary = {
    oneLiner: 'C# is a statically typed, multi-paradigm .NET language combining OOP (classes, interfaces), functional patterns (records, LINQ, pattern matching), and modern async/await concurrency into a single coherent type system.',
    mustKnow: [
      '<code>class</code> vs <code>record</code> vs <code>struct</code>: class = reference + mutable identity; record = value equality + immutability; struct = stack-allocated value type',
      'Interfaces define capabilities (<code>I</code> prefix by convention); classes implement multiple interfaces but inherit one class',
      '<code>async</code>/<code>await</code> wraps <code>Task&lt;T&gt;</code> — never block with <code>.Result</code> or <code>.Wait()</code> in async code or you risk deadlocks',
      'LINQ operators (<code>Where</code>, <code>Select</code>, <code>GroupBy</code>, <code>FirstOrDefault</code>) compose lazily on <code>IEnumerable&lt;T&gt;</code> and translate to SQL via <code>IQueryable&lt;T&gt;</code> in EF Core',
      'Generics produce one type-safe implementation reused for any type — constraints (<code>where T : class</code>, <code>new()</code>, interface) restrict the type parameter',
      'Pattern matching (<code>switch</code> expressions, <code>is</code> patterns, <code>when</code> guards) replaces long <code>if/else</code> chains with exhaustive, readable dispatch',
      'Null safety: <code>string?</code> signals nullable; <code>??</code> coalesces; <code>?.</code> safe-navigates; enable <code>&lt;Nullable&gt;enable&lt;/Nullable&gt;</code> in csproj to catch nulls at compile time',
    ],
    interviewFocus: [
      'What is the difference between a class and a record in C#? When would you choose each?',
      'Explain how async/await works under the hood — what does <code>await</code> actually do to the thread?',
      'How does LINQ\'s deferred execution work and why does it matter for performance?',
      'What are generic constraints and when would you use <code>where T : new()</code>?',
    ],
  };
}
