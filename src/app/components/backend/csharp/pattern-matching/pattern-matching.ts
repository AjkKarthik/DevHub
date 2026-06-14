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
  selector: 'app-csharp-pattern-matching',
  standalone: true,
  imports: [
    CommonModule, CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
    CommonMistakesComponent, RevisionCardComponent,
  ],
  templateUrl: './pattern-matching.html',
  styleUrl: './pattern-matching.scss',
})
export class CsharpPatternMatching {

  quickRef: QuickRefItem[] = [
    { name: 'is',                    type: 'keyword',  desc: 'Pattern test: checks type/value and optionally binds in one step — x is int n', since: 'C# 7' },
    { name: 'switch expression',     type: 'syntax',   desc: 'Expression form of switch — returns a value, no break, exhaustiveness checked at compile time', since: 'C# 8' },
    { name: 'when',                  type: 'keyword',  desc: 'Guard clause on a switch arm — extra boolean condition evaluated after the pattern matched', since: 'C# 7' },
    { name: 'and / or / not',        type: 'operator', desc: 'Pattern combinators: x is > 0 and < 100, x is null or "", x is not null', since: 'C# 9' },
    { name: 'constant pattern',      type: 'syntax',   desc: 'Match a literal value: x is 42, x is null, x is "hello", x is true', since: 'C# 7' },
    { name: 'type pattern',          type: 'syntax',   desc: 'Match and bind a type: obj is string s — type check + cast combined in one step', since: 'C# 7' },
    { name: 'property pattern {}',   type: 'syntax',   desc: 'Match on property values: obj is { Name: "Alice", Age: > 18 } — no cast required', since: 'C# 8' },
    { name: 'positional pattern ()', type: 'syntax',   desc: 'Match via deconstruction: point is (0, 0) or (var x, var y)', since: 'C# 8' },
    { name: 'list pattern []',       type: 'syntax',   desc: 'Match array/list structure: arr is [first, .., last] or [_, > 0]', since: 'C# 11' },
    { name: 'var pattern',           type: 'syntax',   desc: 'Always matches and binds to a variable — useful in when guards or nested positions', since: 'C# 7' },
    { name: '_ discard pattern',     type: 'syntax',   desc: 'Wildcard — matches anything without binding. Used as switch expression catch-all', since: 'C# 8' },
    { name: 'sealed + switch',       type: 'syntax',   desc: 'Sealed class hierarchy + switch expression = compiler-verified exhaustiveness (discriminated union pattern)', since: 'C# 8' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Pattern matching replaces type-checking boilerplate',
      points: [
        '<code>is T x</code> checks the type <em>and</em> binds the cast result in a single expression — no separate <code>as</code> + null check needed.',
        'Switch expressions are concise and return a value directly: <code>shape switch { Circle c => Math.PI * c.R * c.R, _ => 0 }</code>.',
        'The compiler performs exhaustiveness analysis on switch expressions — a missing case on a sealed hierarchy produces a warning (CS8509); a missing arm at runtime throws <code>MatchFailureException</code>.',
        'Traditional <code>if (x is T) { T t = (T)x; }</code> becomes just <code>if (x is T t)</code> — one line, no redundant cast, no null risk.',
        'Pattern variables are in scope for the duration of the arm (switch expression) or the block (is expression) — they are not accessible outside their scope.',
      ],
    },
    {
      heading: 'Property patterns match shapes without casting',
      points: [
        '<code>obj is { Name: "Alice", Age: > 18 }</code> matches any object where those property conditions hold — no cast, no intermediate variable.',
        'Property patterns compose for nested objects: <code>order is { Customer: { Tier: Tier.Gold }, Amount: > 1000 }</code> drills into nested properties naturally.',
        'They work on any accessible properties or fields — classes, records, structs — without any special interface implementation.',
        'Combine with type patterns: <code>obj is Order { Status: OrderStatus.Shipped, Items.Count: > 0 }</code> checks type <em>and</em> shape in one expression.',
        'An empty property pattern <code>{}</code> matches any non-null value of any type — it is equivalent to <code>is not null</code>.',
      ],
    },
    {
      heading: 'Pattern combinators: and / or / not',
      points: [
        '<code>and</code> requires both sub-patterns to match: <code>x is > 0 and < 100</code> replaces <code>x > 0 && x < 100</code> in pattern position.',
        '<code>or</code> accepts either sub-pattern: <code>x is null or ""</code> is equivalent to <code>string.IsNullOrEmpty(x)</code> in one expression.',
        '<code>not</code> negates a pattern: <code>x is not null</code> is cleaner and reads more naturally than <code>x != null</code> in pattern context.',
        'Combinators can be nested and parenthesised: <code>x is (> 0 and < 50) or (> 100 and < 200)</code> — parentheses control precedence explicitly.',
        '<strong>Important:</strong> <code>and</code>/<code>or</code> are <em>pattern combinators</em>, not boolean operators — they only work inside <code>is</code> or switch arms, not in arbitrary boolean expressions.',
      ],
    },
    {
      heading: 'Exhaustiveness is a compile-time guarantee on sealed hierarchies',
      points: [
        'On a <code>sealed abstract</code> class/record hierarchy, the compiler knows all subtypes and verifies that every subtype is handled in the switch expression.',
        'On an <code>enum</code>, all defined values should be handled; the <code>_</code> discard arm catches anything outside the defined values (invalid casts, future additions).',
        'Missing cases on a sealed hierarchy produce CS8509 warning (and throw <code>MatchFailureException</code> at runtime) — treat warnings as errors in CI.',
        'This is how C# simulates <em>discriminated unions</em>: model your domain with sealed hierarchies and let the compiler enforce completeness at compile time.',
        'Open hierarchies (non-sealed classes, interfaces) cannot be exhaustively checked — the compiler does not know all implementations, so a <code>_</code> arm is always required.',
      ],
    },
    {
      heading: 'Positional patterns and deconstruction',
      points: [
        'Positional patterns work on any type with a <code>Deconstruct</code> method — records get it automatically; classes can define it manually.',
        '<code>point is (0, 0)</code> deconstructs <code>point</code> using its <code>Deconstruct(out double x, out double y)</code> and then matches the constant patterns.',
        'Bind and match simultaneously: <code>point is (var x, > 0)</code> — binds <code>x</code> and requires the Y component to be positive.',
        'Tuple patterns are positional patterns on <code>ValueTuple</code>: <code>(a, b) switch { ("Rock", "Scissors") => ... }</code> matches two values simultaneously without nesting.',
        'Nested positional patterns are allowed: <code>line is (Point(0, var y1), Point(0, var y2))</code> deconstructs a pair of points.',
      ],
    },
    {
      heading: 'Pattern matching and null safety',
      points: [
        'A property pattern on a <code>null</code> value never matches — it returns <code>false</code> without throwing. <code>null is { Name: "Alice" }</code> is <code>false</code>.',
        '<code>x is null</code> is the idiomatic null check in pattern context; <code>x is not null</code> is the non-null check — both work correctly even with operator overloaded <code>==</code>.',
        'Nullable reference types and patterns interact naturally: after <code>if (x is string s)</code>, <code>s</code> is non-nullable inside the if block.',
        'The <code>{}</code> empty property pattern matches any non-null reference type or non-default value type — use it as a concise non-null guard: <code>obj is { }</code>.',
        'A type pattern <code>x is T t</code> implicitly excludes null — even if T is a reference type, the pattern fails if x is null, so t is always non-null inside the block.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Type & Constant Patterns',
      language: 'csharp',
      code: `// ── is type pattern — check and bind in one step ─────────────────
object obj = "Hello, World!";

// Modern: is T variable — type check + cast combined
if (obj is string text)
    Console.WriteLine(text.Length);  // text is string here (non-nullable)

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

if (input is null)     Console.WriteLine("null");       // ← runs
if (input is not null) Console.WriteLine("has value");  // ← skipped

// ── var pattern — always matches, useful in when guards ───────────
static bool IsValidLength(object? value) =>
    value is var v && v?.ToString()?.Length is > 0 and < 256;

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
Console.WriteLine(DescribeNumber(15));  // odd: 15

// ── Discard _ pattern — match anything, don't bind ───────────────
static string Classify(object? x) => x switch
{
    null       => "null",
    int n      => $"integer: {n}",
    string s   => $"string of length {s.Length}",
    bool b     => $"bool: {b}",
    _          => $"other: {x.GetType().Name}",
};`,
    },
    {
      label: 'switch Expressions',
      language: 'csharp',
      code: `// ── Sealed hierarchy for exhaustive matching ─────────────────────
abstract record Shape;
record Circle(double Radius)            : Shape;
record Rectangle(double W, double H)   : Shape;
record Triangle(double Base, double H) : Shape;

// Compiler knows all Shape subtypes — no _ needed (exhaustive)
static double Area(Shape shape) => shape switch
{
    Circle c        => Math.PI * c.Radius * c.Radius,
    Rectangle r     => r.W * r.H,
    Triangle t      => 0.5 * t.Base * t.H,
};

Console.WriteLine(Area(new Circle(5)));          // 78.539...
Console.WriteLine(Area(new Rectangle(4, 6)));    // 24
Console.WriteLine(Area(new Triangle(3, 8)));     // 12

// ── Relational patterns with when guards ─────────────────────────
static string BmiCategory(double bmi) => bmi switch
{
    < 18.5             => "Underweight",
    >= 18.5 and < 25.0 => "Normal",
    >= 25.0 and < 30.0 => "Overweight",
    >= 30.0            => "Obese",
    _                  => "Invalid",
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

// ── Notification dispatch — type-based result ─────────────────────
interface INotification { }
record EmailNotification(string To, string Subject)      : INotification;
record SmsNotification(string Phone, string Body)        : INotification;
record PushNotification(string DeviceId, string Title)   : INotification;

static string Summarise(INotification n) => n switch
{
    EmailNotification e => $"Email to {e.To}: {e.Subject}",
    SmsNotification s   => $"SMS to {s.Phone}",
    PushNotification p  => $"Push to {p.DeviceId}: {p.Title}",
    _                   => "Unknown notification",  // required — INotification is open
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
    { Name: "System", Age: 0 }                  => "Hello, system account",
    { Age: < 18 }                                => $"Hi {p.Name}, you're a minor",
    { Address: { Country: "US", City: "NYC" } }  => $"Hey New Yorker {p.Name}!",
    { Age: >= 65 }                               => $"Good day, {p.Name} (senior)",
    _                                            => $"Hello, {p.Name}",
};

var alice = new Person("Alice", 30, new Address("US", "NYC"));
Console.WriteLine(Greet(alice));  // Hey New Yorker Alice!

// ── Property pattern on order ─────────────────────────────────────
record Order(string Id, decimal Amount, string CustomerTier, bool IsPaid);

static string OrderStatus(Order o) => o switch
{
    { IsPaid: false, Amount: > 10_000 }         => "Pending — manual approval",
    { IsPaid: false }                            => "Awaiting payment",
    { CustomerTier: "Gold", Amount: > 500 }      => "Gold priority — expedite",
    { IsPaid: true }                             => "Paid — standard processing",
    _                                            => "Unknown state",
};

// ── Positional pattern — deconstruct and match ────────────────────
record Point(double X, double Y);

static string Quadrant(Point p) => p switch
{
    (0, 0)     => "Origin",
    (> 0, > 0) => "Quadrant I",
    (< 0, > 0) => "Quadrant II",
    (< 0, < 0) => "Quadrant III",
    (> 0, < 0) => "Quadrant IV",
    (0, _)     => "Y axis",
    (_, 0)     => "X axis",
    _          => "Unknown",
};

Console.WriteLine(Quadrant(new Point(3, 4)));   // Quadrant I
Console.WriteLine(Quadrant(new Point(-1, 2)));  // Quadrant II
Console.WriteLine(Quadrant(new Point(0, 0)));   // Origin

// ── Combining type + property + var patterns ──────────────────────
abstract record Expr;
record Num(double Value)             : Expr;
record Add(Expr Left, Expr Right)   : Expr;
record Mul(Expr Left, Expr Right)   : Expr;

static double Eval(Expr e) => e switch
{
    Num { Value: var v }              => v,
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
    []               => "empty",
    [var x]          => $"single: {x}",
    [var a, var b]   => $"two items: {a}, {b}",
    [1, 2, ..]       => "starts with 1, 2",
    [.., var last]   => $"last element: {last}",
    _                => $"{arr.Length} items",
};

Console.WriteLine(DescribeList([]));            // empty
Console.WriteLine(DescribeList([42]));          // single: 42
Console.WriteLine(DescribeList([1, 2, 3, 4])); // starts with 1, 2
Console.WriteLine(DescribeList([5, 6, 7]));    // last element: 7

// ── Slice pattern (..) captures the rest ─────────────────────────
static (int First, int Last, int Count) Edges(int[] arr) => arr switch
{
    []                        => (0, 0, 0),
    [var only]                => (only, only, 1),
    [var first, .., var last] => (first, last, arr.Length),
};

// ── Discriminated union simulation with sealed hierarchy ──────────
abstract record Result<T>;
record Ok<T>(T Value)         : Result<T>;
record Err<T>(string Message) : Result<T>;

static Result<int> ParsePositive(string s) =>
    int.TryParse(s, out int n)
        ? n > 0 ? new Ok<int>(n) : new Err<int>("Must be positive")
        : new Err<int>($"Not a number: {s}");

static string HandleResult(Result<int> r) => r switch
{
    Ok<int>  { Value: > 100 }    => "Large number!",
    Ok<int>  { Value: var v }    => $"Got: {v}",
    Err<int> { Message: var m }  => $"Error: {m}",
};

Console.WriteLine(HandleResult(ParsePositive("42")));   // Got: 42
Console.WriteLine(HandleResult(ParsePositive("200")));  // Large number!
Console.WriteLine(HandleResult(ParsePositive("abc")));  // Error: Not a number: abc

// ── HTTP response pattern — real-world composite patterns ─────────
record HttpResponse(int StatusCode, string? Body, string? ErrorMessage);

static string ProcessResponse(HttpResponse res) => res switch
{
    { StatusCode: 200, Body: not null and var body }      => $"Success: {body[..Math.Min(50, body.Length)]}",
    { StatusCode: 201 }                                    => "Resource created",
    { StatusCode: >= 400 and < 500, ErrorMessage: var e } => $"Client error: {e ?? "unknown"}",
    { StatusCode: >= 500, ErrorMessage: var e }            => $"Server error: {e ?? "internal"}",
    { StatusCode: var code }                               => $"Unhandled status: {code}",
};`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Non-exhaustive switch expression on open hierarchy — runtime MatchFailureException',
      wrong: `interface IShape { }
class Circle   : IShape { public double Radius { get; set; } }
class Rectangle : IShape { public double W { get; set; } double H { get; set; } }

// Misses Rectangle — compiler cannot warn on open interface
static double Area(IShape shape) => shape switch
{
    Circle c => Math.PI * c.Radius * c.Radius,
    // Rectangle missing!
};
// Throws MatchFailureException at runtime when a Rectangle is passed`,
      right: `static double Area(IShape shape) => shape switch
{
    Circle c    => Math.PI * c.Radius * c.Radius,
    Rectangle r => r.W * r.H,
    _ => throw new ArgumentOutOfRangeException(nameof(shape), $"Unhandled shape: {shape.GetType().Name}"),
};
// Prefer sealed abstract record for compile-time exhaustiveness:
// abstract record Shape; record Circle(...) : Shape; record Rectangle(...) : Shape;`,
      explanation: 'The compiler can only verify exhaustiveness for sealed class hierarchies and enums. For interfaces and open class hierarchies, it has no way to know all implementations. A missing arm throws MatchFailureException at runtime. Always add a _ catch-all that throws a descriptive exception, or better yet, model your domain with sealed hierarchies to get compile-time checking.',
    },
    {
      title: 'Pattern arm order — general case before specific case shadows later arms',
      wrong: `// CustomerType.Gold arms ordered wrong — specific case never reached
static decimal GetDiscount(Order o) => o switch
{
    { CustomerType: CustomerType.Gold }              => 12m,  // catches ALL Gold
    { CustomerType: CustomerType.Gold, Amount: > 1000m } => 18m,  // DEAD CODE!
    _ => 5m,
};
// CS8510 warning: arm is unreachable — but easy to miss`,
      right: `// Most specific cases FIRST — patterns are evaluated top to bottom
static decimal GetDiscount(Order o) => o switch
{
    { CustomerType: CustomerType.Gold, Amount: > 1000m } => 18m,  // specific first
    { CustomerType: CustomerType.Gold }                   => 12m,  // then general
    _ => 5m,
};`,
      explanation: 'Switch expression arms are evaluated from top to bottom and the first matching arm wins. A less-specific pattern (e.g., any Gold order) placed before a more-specific one (Gold AND Amount > 1000) will match first, making the specific arm dead code. The compiler emits CS8510 for unreachable arms — treat it as an error in CI.',
    },
    {
      title: 'Confusing and / or pattern combinators with && / || boolean operators',
      wrong: `// WRONG: and/or are pattern keywords — using them outside patterns is wrong
// and outside of a switch/is expression they have different meaning or fail to compile
bool IsValidAge(int age) => age > 0 && age < 150;   // correct — but if you try:

static string AgeGroup(int age) => age switch
{
    // This looks right but and/or precedence may surprise you:
    > 0 and < 13 or > 12 and < 20 => "child or teen",
    // Parsed as: (> 0 and (< 13 or > 12)) and < 20  — WRONG!
    _ => "adult",
};`,
      right: `// Use parentheses to make precedence explicit
static string AgeGroup(int age) => age switch
{
    (> 0 and < 13) or (> 12 and < 20) => "child or teen",
    >= 20 => "adult",
    _ => "invalid",
};
// In when guards, use regular &&/|| — not and/or:
// int n when n > 0 && n < 100 => ...   ← correct
// int n when n is > 0 and < 100 => ... ← also correct (nested is)`,
      explanation: 'The and/or/not keywords are pattern combinators — they work inside is expressions and switch arms, not in general boolean expressions. Their precedence may not be obvious: or binds less tightly than and, so (> 0 and < 13) or (> 12 and < 20) should use explicit parentheses. In when guards, regular && and || operators are clearer and less surprising.',
    },
    {
      title: 'Assuming property pattern throws on null — it does not match, but you expect it to',
      wrong: `// Developer expects this to throw or handle null specially
object? response = null;

string result = response switch
{
    { } obj => $"Got object: {obj}",    // {} = non-null pattern
    null    => "null",                  // <- forgot this case entirely!
    // If this arm is missing:
    _ => "fallback"                     // null hits _ — might silently succeed
};
// The bug: developer thinks { } matches null and does something safe
// but { } NEVER matches null — it falls through to _ or the missing null arm`,
      right: `// {} is shorthand for "not null" — always handle null explicitly
string result = response switch
{
    { } obj => $"Got: {obj}",    // matches any non-null
    null    => "null",           // explicit null arm — put it first or after { }
};

// Even better — make intent clear:
string safe = response is not null
    ? response.ToString()!
    : "null";`,
      explanation: 'An empty property pattern {} is shorthand for "any non-null value" — it never matches null. If you forget to add a null arm in a switch expression that might receive null, the null value falls through to _ (or throws MatchFailureException if there is no _). This is usually correct behavior but surprises developers who think {} handles null somehow.',
    },
    {
      title: 'Using a when guard for conditions that could be a pattern — readability loss',
      wrong: `// Overly verbose: when guard doing what a pattern could express
static string Classify(int n) => n switch
{
    int x when x > 0 && x < 100   => "small positive",
    int x when x >= 100 && x < 1000 => "medium",
    int x when x >= 1000           => "large",
    int x when x < 0              => "negative",
    _ => "zero",
};`,
      right: `// Use relational patterns directly — cleaner and fully supported by the compiler
static string Classify(int n) => n switch
{
    > 0 and < 100    => "small positive",
    >= 100 and < 1000 => "medium",
    >= 1000          => "large",
    < 0              => "negative",
    0                => "zero",
};
// Reserve when for conditions patterns cannot express: method calls, cross-arm bindings`,
      explanation: 'Relational patterns (>, <, >=, <=) and combinators (and, or) cover most numeric range checks without needing when guards. when guards are best reserved for conditions that cannot be expressed as patterns: calling methods (when n % 2 == 0), accessing bindings from earlier in the arm, or complex cross-property logic.',
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'What is the main advantage of a switch expression over a switch statement in C#?',
      options: [
        'switch expressions are faster at runtime due to jump table optimization',
        'switch expressions return a value and the compiler checks exhaustiveness; switch statements do not',
        'switch expressions support more value types',
        'switch statements require break; switch expressions require return',
      ],
      answer: 1,
      explanation: 'A <code>switch</code> expression returns a value directly (no <code>break</code>, no fall-through) and the compiler performs exhaustiveness checking — a missing case on a sealed hierarchy produces CS8509. A traditional switch statement executes side effects and has no such guarantee.',
    },
    {
      q: 'Which code correctly uses a property pattern to check that a User is active and over 18?',
      options: [
        'user is User && user.IsActive && user.Age > 18',
        'user is { IsActive: true, Age: > 18 }',
        'user is User { IsActive == true, Age == > 18 }',
        'user matches { IsActive: true } and { Age: > 18 }',
      ],
      answer: 1,
      explanation: 'Property patterns use <code>{ PropertyName: pattern }</code> syntax. The colon separates the property name from the nested pattern. Relational patterns like <code>> 18</code> are valid nested patterns. <code>==</code> is not valid inside a property pattern; <code>matches</code> is not a C# keyword.',
    },
    {
      q: 'What does x is > 0 and < 100 mean in C# 9+?',
      options: [
        'Bitwise AND of the two comparison results',
        'A pattern combinator that requires x to satisfy both relational patterns simultaneously',
        'It is invalid syntax — you cannot combine patterns with and',
        'It means x is between 0 and 100 inclusive',
      ],
      answer: 1,
      explanation: '<code>and</code> is a <em>pattern combinator</em> (not a boolean operator) introduced in C# 9. <code>x is > 0 and < 100</code> requires x to match both <code>> 0</code> and <code>< 100</code> — x is in the open interval (0, 100). The bounds 0 and 100 themselves do not match.',
    },
    {
      q: 'What is the purpose of a when guard in a switch expression arm?',
      options: [
        'It specifies the return type of the arm',
        'It provides an additional boolean condition that must be true after the pattern already matched',
        'It marks the arm as optional so the compiler skips it when not needed',
        'It is required on every arm when using relational patterns',
      ],
      answer: 1,
      explanation: 'A <code>when</code> guard adds an extra boolean predicate evaluated after the pattern matches. The arm only fires if both the pattern matches <em>and</em> the when condition is true. Use it for conditions that cannot be expressed as patterns, e.g. method calls: <code>int n when n % 2 == 0 => "even"</code>.',
    },
    {
      q: 'What does an empty property pattern {} match?',
      options: [
        'Any value including null',
        'Only empty objects with no properties',
        'Any non-null value (equivalent to is not null)',
        'Only objects of type object',
      ],
      answer: 2,
      explanation: 'An empty property pattern <code>{}</code> matches any non-null value of any type — it is equivalent to <code>is not null</code>. It does <em>not</em> match <code>null</code>. This makes it a concise non-null guard in switch expressions: <code>{ } obj => ...</code> binds the non-null value to <code>obj</code>.',
    },
    {
      q: 'What happens at runtime when a non-exhaustive switch expression receives a value matching no arm?',
      options: [
        'It returns the default value for the return type',
        'It skips the switch expression entirely',
        'It throws MatchFailureException',
        'It throws NullReferenceException',
      ],
      answer: 2,
      explanation: 'If a switch expression has no arm that matches the input value and no <code>_</code> discard catch-all, the runtime throws <code>MatchFailureException</code>. For sealed hierarchies the compiler warns (CS8509); for open hierarchies it cannot warn. Always add a <code>_</code> arm that throws a descriptive exception to get a clear error message instead of a cryptic MatchFailureException.',
    },
    {
      q: 'Which of the following correctly uses a list pattern to match an array with exactly two elements and bind both?',
      options: [
        'arr is [.., var a, var b]',
        'arr is [var a, var b]',
        'arr is [var a, .., var b]',
        'arr is { Length: 2, [0]: var a, [1]: var b }',
      ],
      answer: 1,
      explanation: '<code>arr is [var a, var b]</code> matches an array with exactly two elements and binds the first to <code>a</code> and the second to <code>b</code>. Option A matches any array with two or more elements and binds the last two. Option C matches arrays with two or more elements and binds first and last. Option D is not valid C# property pattern syntax.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use pattern matching vs if/else?',
      a: 'Prefer pattern matching when branching on the type or shape of a value with multiple cases — a switch expression is more readable, concise, and exhaustiveness-checked. Use <code>if/else</code> for simple boolean conditions or when the logic does not fit the pattern model (e.g., async branching, early returns). Signal: if you write <code>if (x is T t) { ... } else if (x is U u) { ... }</code>, that is a strong signal to switch to a switch expression.',
    },
    {
      q: 'Can I pattern match on strings?',
      a: 'Yes. Constant patterns work on strings: <code>s is "hello"</code> or in a switch arm. For more complex checks, use <code>when</code> guards: <code>s when s.StartsWith("http") => ...</code>. Property patterns also work: <code>s is { Length: > 0 }</code> matches any non-empty string. List patterns in C# 11 work on <code>ReadOnlySpan&lt;char&gt;</code> (not <code>string</code> directly) — useful for character-level parsing without allocating a substring.',
    },
    {
      q: 'What is a discriminated union in C#?',
      a: 'A discriminated union is a type that is exactly one of a fixed set of named cases, each with its own data. C# has no native DU syntax (unlike F#, Rust, or TypeScript), but you can simulate them with a <code>sealed abstract record</code> base and <code>record</code> subtypes. Pattern matching on a sealed hierarchy is exhaustively checked by the compiler — adding a new subtype causes CS8509 warnings everywhere the hierarchy is switched on. Common uses: <code>Result&lt;T&gt;</code> (Ok/Err), <code>Option&lt;T&gt;</code>, domain events, AST nodes.',
    },
    {
      q: 'How do list patterns work and what is the slice pattern?',
      a: 'List patterns (C# 11+) match on the structure of arrays, spans, or any indexable type with <code>Length</code>/<code>Count</code>. Each slot is its own pattern: <code>[_, > 0, var last]</code> matches a 3-element sequence where the second is positive. The <strong>slice pattern</strong> <code>..</code> matches zero or more elements: <code>[first, .. var middle, last]</code> matches any sequence with at least two elements, binding the first, last, and the elements in between to <code>middle</code> (as an array). Omitting a binding (<code>..</code> alone) just skips the middle elements.',
    },
    {
      q: 'How does the compiler decide if a switch expression is exhaustive?',
      a: 'The compiler analyzes whether every possible input value is covered by at least one arm. For <strong>sealed class hierarchies</strong>, it knows all concrete subtypes at compile time — if you cover every subtype, it confirms exhaustiveness. For <strong>enums</strong>, it checks that all declared enum values are handled. For <strong>open hierarchies</strong> (interfaces, non-sealed classes), it cannot enumerate implementations, so a <code>_</code> arm is always required. Missing coverage produces CS8509 (a warning, not error by default) and throws <code>MatchFailureException</code> at runtime.',
    },
    {
      q: 'What does a positional pattern desugar to?',
      a: 'A positional pattern calls the <code>Deconstruct</code> method on the matched value. <code>point is (> 0, > 0)</code> is equivalent to calling <code>point.Deconstruct(out var x, out var y)</code> and then testing <code>x > 0 &amp;&amp; y > 0</code>. Records automatically generate a <code>Deconstruct</code> method matching their primary constructor parameters. Classes can define <code>Deconstruct</code> manually as an instance method or extension method with <code>out</code> parameters. Tuples (<code>ValueTuple</code>) also support positional patterns because they implement <code>Deconstruct</code>.',
    },
    {
      q: 'Can I use pattern matching inside LINQ?',
      a: 'Yes — <code>is</code> expressions work inside LINQ delegates. <code>items.OfType&lt;T&gt;()</code> is the most common form. For more complex patterns: <code>items.Where(x => x is { Status: "Active", Amount: > 0 })</code>. Switch expressions work in <code>Select</code>: <code>items.Select(x => x switch { Circle c => c.Radius, _ => 0 })</code>. However, EF Core cannot translate pattern expressions to SQL — only use them in <code>AsEnumerable()</code> or <code>ToList()</code> LINQ chains that run in memory.',
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

- Any order under 50 gets 0% regardless of customer type (check this first)
- VIP customers always get 20%
- Gold customers with Amount > 1000 get 18%; Gold with any amount get 12%
- Silver customers on their first order get 15%; otherwise 8%
- Regular customers with Amount > 500 on their first order get 10%
- All other Regular customers get 5%`,
    language: 'csharp',
    hints: [
      'Use a switch expression on the Order record directly with property patterns',
      'The "under 50" arm must come first — patterns are evaluated top to bottom',
      'Property patterns let you check multiple fields: { CustomerType: CustomerType.Gold, Amount: > 1000m }',
      'For Silver first-order: { CustomerType: CustomerType.Silver, IsFirstOrder: true }',
      'You can combine property patterns: { Amount: > 500m, IsFirstOrder: true }',
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
// CalculateDiscount(new Order(VIP,    500m,  false)) => 20
// CalculateDiscount(new Order(Gold,  1500m,  false)) => 18
// CalculateDiscount(new Order(Gold,   200m,  false)) => 12
// CalculateDiscount(new Order(Silver, 300m,  true))  => 15
// CalculateDiscount(new Order(Silver, 300m,  false)) => 8
// CalculateDiscount(new Order(Regular,600m,  true))  => 10
// CalculateDiscount(new Order(Regular,300m,  false)) => 5
// CalculateDiscount(new Order(VIP,     30m,  false)) => 0`,
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

    _ => 0m,
};`,
  };

  revision: RevisionSummary = {
    oneLiner: 'Pattern matching replaces manual type-checks and casts with concise, compiler-checked expressions. Switch expressions return values and enforce exhaustiveness on sealed hierarchies. Property, positional, and list patterns let you match shapes without casting.',
    mustKnow: [
      'is T t: type check + null-safe cast in one step. After the is expression, t is guaranteed non-null inside the if block.',
      'Switch expressions return a value; arms are evaluated top to bottom — more specific arms must come before general ones.',
      'Property pattern {}: matches any non-null value. null is { Prop: x } always returns false, never throws.',
      'and/or/not are pattern combinators — only valid inside is or switch arms, not in general boolean expressions.',
      'Exhaustiveness: sealed hierarchies get compile-time checking (CS8509); open hierarchies always need a _ arm.',
      'Positional patterns call Deconstruct() — records get it automatically; classes define it manually with out parameters.',
      'List patterns (C# 11): [] = empty, [x] = single, [first, .., last] = any with ≥2 elements, binding first and last.',
    ],
    interviewFocus: [
      'What is the difference between a switch statement and a switch expression? (side effects vs value-returning; no exhaustiveness vs compile-time checking)',
      'What does {} empty property pattern match? (any non-null value — equivalent to is not null)',
      'Why must more-specific switch arms come before general ones? (arms evaluated top to bottom — specific before general)',
      'How does C# simulate discriminated unions? (sealed abstract record + record subtypes + exhaustive switch expression)',
      'What happens if a switch expression has no matching arm at runtime? (MatchFailureException — not NullReferenceException)',
    ],
  };
}
