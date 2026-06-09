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
  selector: 'app-csharp-pattern-matching',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './pattern-matching.html',
  styleUrl: './pattern-matching.scss',
})
export class CsharpPatternMatching {

  quickRef: QuickRefItem[] = [
    { name: 'is',                   type: 'keyword',  desc: 'Pattern test operator: checks and optionally binds in one step — x is int n', since: 'C# 7' },
    { name: 'switch expression',    type: 'syntax',   desc: 'Expression form of switch — returns a value, no break, exhaustiveness checked', since: 'C# 8' },
    { name: 'when',                 type: 'keyword',  desc: 'Guard clause on a pattern arm — additional condition after the pattern', since: 'C# 7' },
    { name: 'and / or / not',       type: 'operator', desc: 'Pattern combinators: x is > 0 and < 100, x is null or "", x is not null', since: 'C# 9' },
    { name: 'constant pattern',     type: 'syntax',   desc: 'Match a literal value: x is 42, x is null, x is true', since: 'C# 7' },
    { name: 'type pattern',         type: 'syntax',   desc: 'Match and bind a type: obj is string s — checks and casts in one step', since: 'C# 7' },
    { name: 'property pattern {}',  type: 'syntax',   desc: 'Match on property values: obj is { Name: "Alice", Age: > 18 }', since: 'C# 8' },
    { name: 'positional pattern ()', type: 'syntax',  desc: 'Match via deconstruction: point is (0, 0), (var x, var y)', since: 'C# 8' },
    { name: 'list pattern []',      type: 'syntax',   desc: 'Match array/list structure: arr is [first, .., last], [_, > 0]', since: 'C# 11' },
    { name: 'var pattern',          type: 'syntax',   desc: 'Always matches and binds to a variable: x is var v — useful in when guards', since: 'C# 7' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Pattern matching replaces type-checking boilerplate',
      points: [
        '<code>is T x</code> checks the type <em>and</em> binds the cast result in a single expression — no separate <code>as</code> + null check needed.',
        'Switch expressions are concise and return a value directly: <code>shape switch { Circle c => Math.PI * c.R * c.R, _ => 0 }</code>.',
        'The compiler enforces exhaustiveness on switch expressions — if you miss a case (and have no <code>_</code> fallback), you get a compile-time warning.',
        'Traditional <code>if (x is T) { T t = (T)x; }</code> becomes just <code>if (x is T t)</code> — one line, no redundant cast.',
      ],
    },
    {
      heading: 'Property patterns match shapes',
      points: [
        '<code>obj is { Name: "Alice", Age: > 18 }</code> matches any object where those property conditions hold — no casting required.',
        'Property patterns compose: <code>order is { Customer: { Tier: Tier.Gold }, Amount: > 1000 }</code> drills into nested objects naturally.',
        'They work on any accessible properties or fields — classes, records, structs — without any special interface implementation.',
        'Combine with type patterns for maximum expressiveness: <code>obj is Order { Status: OrderStatus.Shipped, Items.Count: > 0 }</code>.',
      ],
    },
    {
      heading: 'Combinators: and / or / not',
      points: [
        '<code>and</code> requires both patterns to match: <code>x is > 0 and < 100</code> — replaces <code>x > 0 && x < 100</code> in pattern position.',
        '<code>or</code> accepts either pattern: <code>x is null or ""</code> — equivalent to <code>string.IsNullOrEmpty(x)</code> in one expression.',
        '<code>not</code> negates a pattern: <code>x is not null</code> is cleaner than <code>!(x is null)</code> or <code>x != null</code> in pattern context.',
        'Combinators can be nested: <code>x is (> 0 and < 50) or (> 100 and < 200)</code> — parentheses control precedence.',
      ],
    },
    {
      heading: 'Exhaustiveness is a compile-time guarantee',
      points: [
        'On a <code>sealed</code> class hierarchy, the compiler knows all subtypes and can verify every case is covered in a switch expression.',
        'On an <code>enum</code>, all defined values must be handled — the <code>_</code> discard arm catches anything outside the enum (invalid casts etc.).',
        'Missing cases produce a CS8509 warning (non-exhaustive switch expression) — treat warnings as errors in CI to catch this at build time.',
        'This is the closest C# gets to discriminated unions: model your domain with sealed hierarchies and let the compiler enforce completeness.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Type & Constant Patterns',
      language: 'csharp',
      code: `// ── is type pattern — check and bind in one step ─────────────────
object obj = "Hello, World!";

// Old style (C# 1–6)
if (obj is string)
{
    string s = (string)obj;     // redundant cast
    Console.WriteLine(s.Length);
}

// Modern: is T variable — type check + cast combined
if (obj is string text)
{
    Console.WriteLine(text.Length);  // text is string here
}

// ── Constant patterns ─────────────────────────────────────────────
int code = 200;
string status = code switch
{
    200 => "OK",
    201 => "Created",
    400 => "Bad Request",
    401 => "Unauthorized",
    404 => "Not Found",
    500 => "Internal Server Error",
    _   => $"Unknown ({code})",
};
Console.WriteLine(status);  // OK

// ── Null constant pattern ─────────────────────────────────────────
string? input = null;

if (input is null)
    Console.WriteLine("null");           // ← runs

if (input is not null)
    Console.WriteLine("has value");      // ← skipped

// ── var pattern — always matches, binds to any type ───────────────
static bool IsValidLength(object? value) =>
    value is var v && v?.ToString()?.Length is > 0 and < 256;

// ── Discard _ pattern — match anything, don't bind ───────────────
static string Classify(object? x) => x switch
{
    null       => "null",
    int n      => $"integer: {n}",
    string s   => $"string: \\"{s}\\"",
    bool b     => $"bool: {b}",
    _          => $"other: {x.GetType().Name}",
};

Console.WriteLine(Classify(42));          // integer: 42
Console.WriteLine(Classify("hi"));        // string: "hi"
Console.WriteLine(Classify(3.14));        // other: Double
Console.WriteLine(Classify(null));        // null

// ── when guard — extra condition after pattern ────────────────────
static string DescribeNumber(int n) => n switch
{
    0              => "zero",
    < 0            => "negative",
    > 0 and < 10   => "small positive",
    int x when x % 2 == 0 => $"even: {x}",
    int x          => $"odd: {x}",
};

Console.WriteLine(DescribeNumber(7));   // small positive
Console.WriteLine(DescribeNumber(14));  // even: 14
Console.WriteLine(DescribeNumber(15));  // odd: 15`,
    },
    {
      label: 'switch Expressions',
      language: 'csharp',
      code: `// ── Sealed hierarchy for exhaustive matching ─────────────────────
abstract record Shape;
record Circle(double Radius)            : Shape;
record Rectangle(double W, double H)   : Shape;
record Triangle(double Base, double H) : Shape;

// switch expression — returns a value, exhaustive over sealed hierarchy
static double Area(Shape shape) => shape switch
{
    Circle c        => Math.PI * c.Radius * c.Radius,
    Rectangle r     => r.W * r.H,
    Triangle t      => 0.5 * t.Base * t.H,
    // no _ needed — compiler knows all subtypes (sealed)
};

Console.WriteLine(Area(new Circle(5)));          // 78.539...
Console.WriteLine(Area(new Rectangle(4, 6)));    // 24
Console.WriteLine(Area(new Triangle(3, 8)));     // 12

// ── Relational patterns with when guards ─────────────────────────
static string BmiCategory(double bmi) => bmi switch
{
    < 18.5              => "Underweight",
    >= 18.5 and < 25.0  => "Normal",
    >= 25.0 and < 30.0  => "Overweight",
    >= 30.0             => "Obese",
    double.NaN          => "Invalid",
    _                   => "Unknown",
};

// ── Tuple patterns — match multiple values simultaneously ─────────
static string RockPaperScissors(string a, string b) => (a, b) switch
{
    ("Rock",     "Scissors") => $"{a} wins",
    ("Scissors", "Paper")    => $"{a} wins",
    ("Paper",    "Rock")     => $"{a} wins",
    var (x, y) when x == y   => "Draw",
    _                        => $"{b} wins",
};

Console.WriteLine(RockPaperScissors("Rock", "Scissors")); // Rock wins
Console.WriteLine(RockPaperScissors("Rock", "Rock"));     // Draw

// ── Type-based dispatch returning different result types ──────────
interface INotification { }
record EmailNotification(string To, string Subject) : INotification;
record SmsNotification(string Phone, string Body)   : INotification;
record PushNotification(string DeviceId, string Title) : INotification;

static string Summarise(INotification n) => n switch
{
    EmailNotification e => $"Email → {e.To}: {e.Subject}",
    SmsNotification s   => $"SMS → {s.Phone}: {s.Body[..Math.Min(20, s.Body.Length)]}...",
    PushNotification p  => $"Push → {p.DeviceId}: {p.Title}",
    _                   => "Unknown notification",
};`,
    },
    {
      label: 'Property & Positional Patterns',
      language: 'csharp',
      code: `// ── Property pattern — match on property values ──────────────────
record Address(string Country, string City);
record Person(string Name, int Age, Address Address);

static string Greet(Person p) => p switch
{
    { Name: "System", Age: 0 }                    => "Hello, system account",
    { Age: < 18 }                                  => $"Hi {p.Name}, you're a minor",
    { Address: { Country: "US", City: "NYC" } }    => $"Hey New Yorker {p.Name}!",
    { Age: >= 65 }                                 => $"Good day, {p.Name} (senior)",
    _                                              => $"Hello, {p.Name}",
};

var alice = new Person("Alice", 30, new Address("US", "NYC"));
Console.WriteLine(Greet(alice));  // Hey New Yorker Alice!

// ── Nested property pattern on records ────────────────────────────
record Order(string Id, decimal Amount, string CustomerTier, bool IsPaid);

static string OrderStatus(Order o) => o switch
{
    { IsPaid: false, Amount: > 10_000 }                 => "Pending — requires manual approval",
    { IsPaid: false }                                    => "Awaiting payment",
    { CustomerTier: "Gold", Amount: > 500 }              => "Gold priority — expedite",
    { CustomerTier: "Silver", Amount: > 1000 }           => "Silver large order",
    { IsPaid: true }                                     => "Paid — standard processing",
    _                                                    => "Unknown state",
};

// ── Positional pattern — deconstruct and match ────────────────────
record Point(double X, double Y);

static string Quadrant(Point p) => p switch
{
    (0, 0)              => "Origin",
    (> 0, > 0)          => "Quadrant I",
    (< 0, > 0)          => "Quadrant II",
    (< 0, < 0)          => "Quadrant III",
    (> 0, < 0)          => "Quadrant IV",
    (0, _)              => "Y axis",
    (_, 0)              => "X axis",
    _                   => "Unknown",
};

Console.WriteLine(Quadrant(new Point(3, 4)));   // Quadrant I
Console.WriteLine(Quadrant(new Point(-1, 2)));  // Quadrant II
Console.WriteLine(Quadrant(new Point(0, 0)));   // Origin

// ── Combining type + property + positional patterns ───────────────
abstract record Expr;
record Num(double Value)              : Expr;
record Add(Expr Left, Expr Right)    : Expr;
record Mul(Expr Left, Expr Right)    : Expr;

static double Eval(Expr e) => e switch
{
    Num { Value: var v }             => v,
    Add { Left: var l, Right: var r } => Eval(l) + Eval(r),
    Mul { Left: var l, Right: var r } => Eval(l) * Eval(r),
    _ => throw new NotSupportedException(e.GetType().Name),
};

// (2 + 3) * 4 = 20
var expr = new Mul(new Add(new Num(2), new Num(3)), new Num(4));
Console.WriteLine(Eval(expr));  // 20`,
    },
    {
      label: 'List Patterns & Advanced',
      language: 'csharp',
      code: `// ── List patterns (C# 11) — match array/span structure ───────────
static string DescribeList(int[] arr) => arr switch
{
    []                  => "empty",
    [var x]             => $"single: {x}",
    [var a, var b]      => $"two items: {a}, {b}",
    [1, 2, ..]          => "starts with 1, 2",
    [.., var last]      => $"last element: {last}",
    _                   => $"{arr.Length} items",
};

Console.WriteLine(DescribeList([]));             // empty
Console.WriteLine(DescribeList([42]));           // single: 42
Console.WriteLine(DescribeList([1, 2, 3, 4]));  // starts with 1, 2
Console.WriteLine(DescribeList([5, 6, 7]));     // last element: 7

// ── Slice pattern (..) captures the rest ─────────────────────────
static (int First, int Last, int Count) Edges(int[] arr) => arr switch
{
    []                         => (0, 0, 0),
    [var only]                 => (only, only, 1),
    [var first, .., var last]  => (first, last, arr.Length),
};

// ── Discriminated union simulation with sealed hierarchy ──────────
// C# equivalent of F# discriminated unions

abstract record Result<T>;
record Ok<T>(T Value)        : Result<T>;
record Err<T>(string Message) : Result<T>;

static Result<int> ParsePositive(string s) =>
    int.TryParse(s, out int n)
        ? n > 0 ? new Ok<int>(n) : new Err<int>("Must be positive")
        : new Err<int>($"Not a number: {s}");

static string HandleResult(Result<int> r) => r switch
{
    Ok<int> { Value: > 100 }     => "Large number!",
    Ok<int> { Value: var v }     => $"Got: {v}",
    Err<int> { Message: var m }  => $"Error: {m}",
};

Console.WriteLine(HandleResult(ParsePositive("42")));   // Got: 42
Console.WriteLine(HandleResult(ParsePositive("200")));  // Large number!
Console.WriteLine(HandleResult(ParsePositive("abc")));  // Error: Not a number: abc
Console.WriteLine(HandleResult(ParsePositive("-5")));   // Error: Must be positive

// ── Real-world: HTTP response pattern matching ────────────────────
record HttpResponse(int StatusCode, string? Body, string? ErrorMessage);

static string ProcessResponse(HttpResponse res) => res switch
{
    { StatusCode: 200, Body: not null and var body }     => $"Success: {body[..Math.Min(50, body.Length)]}",
    { StatusCode: 201 }                                   => "Resource created",
    { StatusCode: >= 400 and < 500, ErrorMessage: var e } => $"Client error: {e ?? "unknown"}",
    { StatusCode: >= 500, ErrorMessage: var e }           => $"Server error: {e ?? "internal"}",
    { StatusCode: var code }                              => $"Unhandled status: {code}",
};`,
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'What is the main advantage of a <code>switch</code> expression over a <code>switch</code> statement in C#?',
      options: [
        'switch expressions are faster at runtime',
        'switch expressions return a value and the compiler checks exhaustiveness; switch statements do not',
        'switch expressions support more types of values',
        'switch statements require break; switch expressions do not require any termination',
      ],
      answer: 1,
      explanation: 'A <code>switch</code> expression returns a value directly (no <code>break</code>, no fall-through) and the compiler performs exhaustiveness checking — if you miss a case and have no <code>_</code> discard, you get CS8509. A traditional switch statement executes side effects and has no such guarantee.',
    },
    {
      q: 'Which code correctly uses a property pattern to check that a <code>User</code> is active and over 18?',
      options: [
        '<code>user is User && user.IsActive && user.Age > 18</code>',
        '<code>user is { IsActive: true, Age: > 18 }</code>',
        '<code>user is User { IsActive == true, Age == > 18 }</code>',
        '<code>user matches { IsActive: true } and { Age: > 18 }</code>',
      ],
      answer: 1,
      explanation: 'Property patterns use <code>{ PropertyName: pattern }</code> syntax. The colon separates the property name from the nested pattern. Relational patterns like <code>> 18</code> are valid nested patterns. <code>==</code> is not valid syntax inside a property pattern.',
    },
    {
      q: 'What does <code>x is > 0 and < 100</code> mean in C# 9+?',
      options: [
        'Bitwise AND of the two comparisons',
        'A pattern combinator that requires x to satisfy both relational patterns simultaneously',
        'It is invalid syntax — you cannot combine patterns with and',
        'It means x is between 0 and 100 inclusive',
      ],
      answer: 1,
      explanation: '<code>and</code> is a pattern combinator (not a boolean operator) introduced in C# 9. <code>x is > 0 and < 100</code> requires x to match both <code>> 0</code> and <code>< 100</code> at once, i.e. x is in the open interval (0, 100). The range is exclusive — 0 and 100 themselves do not match.',
    },
    {
      q: 'What is the purpose of a <code>when</code> guard in a switch expression arm?',
      options: [
        'It specifies the return type of the arm',
        'It provides an additional boolean condition that must be true after the pattern already matched',
        'It marks the arm as optional so the compiler skips it when not needed',
        'It is required on every arm when using relational patterns',
      ],
      answer: 1,
      explanation: 'A <code>when</code> guard adds an extra boolean predicate after the pattern. The arm only fires if both the pattern matches <em>and</em> the when condition is true. This is useful for conditions that cannot be expressed as patterns, such as calling methods: <code>int n when n % 2 == 0 => "even"</code>.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use pattern matching vs if/else?',
      a: 'Prefer pattern matching when you are branching on the type or shape of a value, especially with multiple cases — a switch expression is more readable and exhaustiveness-checked. Use if/else for simple boolean conditions or when the logic does not fit the pattern model (e.g., complex async branching). As a rule of thumb: if you find yourself writing <code>if (x is T t) { ... } else if (x is U u) { ... }</code>, that is a strong signal to use a switch expression instead.',
    },
    {
      q: 'Can I pattern match on strings?',
      a: 'Yes. Constant patterns work on strings: <code>s is "hello"</code> or in a switch expression. You can also use <code>when</code> guards for more complex string checks: <code>s when s.StartsWith("http") => ...</code>. For C# 11+ list patterns work on <code>ReadOnlySpan&lt;char&gt;</code> but not on <code>string</code> directly. Property patterns work too: <code>s is { Length: > 0 }</code> matches any non-empty string.',
    },
    {
      q: 'What is a discriminated union in C#?',
      a: 'A discriminated union (DU) is a type that can be exactly one of a fixed set of cases, each with its own data. C# has no native DU syntax (unlike F# or TypeScript), but you can simulate them using a <code>sealed abstract record</code> base with <code>record</code> subtypes. Pattern matching on a sealed hierarchy is exhaustively checked by the compiler, giving you the same safety guarantees. Common uses: Result&lt;T&gt; (Ok/Err), Option&lt;T&gt;, domain events, AST nodes.',
    },
    {
      q: 'How do list patterns work?',
      a: 'List patterns (C# 11+) let you match on the structure of arrays, spans, or any type that exposes a <code>Length</code>/<code>Count</code> property and an indexer. <code>[first, .., last]</code> matches any sequence with at least two elements, binding the first and last. The slice pattern <code>..</code> matches zero or more elements and can optionally bind them: <code>[var a, .. var middle, var z]</code>. Each slot can itself be any pattern — constant, relational, type, property, or nested list.',
    },
  ];

  challenge: Challenge = {
    title: 'Discount Calculator',
    description: `Implement a discount calculator using a switch expression with pattern matching.

Given the following types:

\`\`\`csharp
enum CustomerType { Regular, Silver, Gold, VIP }

record Order(
    CustomerType CustomerType,
    decimal Amount,
    bool IsFirstOrder
);
\`\`\`

Write a method \`CalculateDiscount(Order order)\` that returns the discount percentage as a \`decimal\` using these rules:

- VIP customers always get 20%
- Gold customers with Amount > 1000 get 18%; Gold with any amount get 12%
- Silver customers on their first order get 15%; otherwise 8%
- Regular customers with Amount > 500 on their first order get 10%
- All other Regular customers get 5%
- Any order under 50 gets 0% regardless of customer type (check this first)`,
    language: 'csharp',
    hints: [
      'Use a switch expression on the Order record directly',
      'Property patterns let you check multiple fields: { CustomerType: CustomerType.Gold, Amount: > 1000 }',
      'The "under 50" rule should be the first arm — patterns are evaluated top to bottom',
      'For the Silver first-order case: { CustomerType: CustomerType.Silver, IsFirstOrder: true }',
      'You can combine property patterns with and: { Amount: > 500, IsFirstOrder: true }',
    ],
    starterCode: `enum CustomerType { Regular, Silver, Gold, VIP }

record Order(CustomerType CustomerType, decimal Amount, bool IsFirstOrder);

public decimal CalculateDiscount(Order order)
{
    return order switch
    {
        // TODO: implement discount rules with pattern matching
    };
}

// Expected:
// CalculateDiscount(new Order(CustomerType.VIP,    500m,  false)) => 20
// CalculateDiscount(new Order(CustomerType.Gold,  1500m,  false)) => 18
// CalculateDiscount(new Order(CustomerType.Gold,   200m,  false)) => 12
// CalculateDiscount(new Order(CustomerType.Silver, 300m,  true))  => 15
// CalculateDiscount(new Order(CustomerType.Silver, 300m,  false)) => 8
// CalculateDiscount(new Order(CustomerType.Regular,600m, true))   => 10
// CalculateDiscount(new Order(CustomerType.Regular,300m, false))  => 5
// CalculateDiscount(new Order(CustomerType.VIP,     30m, false))  => 0`,
    solution: `enum CustomerType { Regular, Silver, Gold, VIP }

record Order(CustomerType CustomerType, decimal Amount, bool IsFirstOrder);

public decimal CalculateDiscount(Order order) => order switch
{
    // Under £50: no discount regardless of customer type
    { Amount: < 50m }
        => 0m,

    // VIP: always 20%
    { CustomerType: CustomerType.VIP }
        => 20m,

    // Gold: tiered by amount
    { CustomerType: CustomerType.Gold, Amount: > 1000m }
        => 18m,
    { CustomerType: CustomerType.Gold }
        => 12m,

    // Silver: first order bonus
    { CustomerType: CustomerType.Silver, IsFirstOrder: true }
        => 15m,
    { CustomerType: CustomerType.Silver }
        => 8m,

    // Regular: first-order large purchase
    { CustomerType: CustomerType.Regular, Amount: > 500m, IsFirstOrder: true }
        => 10m,

    // Regular: default
    { CustomerType: CustomerType.Regular }
        => 5m,

    // Safety net (should be unreachable with a complete enum)
    _ => 0m,
};`,
  };
}
