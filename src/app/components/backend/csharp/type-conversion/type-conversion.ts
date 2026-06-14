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
  selector: 'app-csharp-type-conversion',
  standalone: true,
  imports: [
    CommonModule,
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
    CommonMistakesComponent, RevisionCardComponent,
  ],
  templateUrl: './type-conversion.html',
  styleUrl: './type-conversion.scss',
})
export class CsharpTypeConversion {

  quickRef: QuickRefItem[] = [
    { name: 'implicit',              type: 'keyword',  desc: 'Implicit conversion — the compiler inserts it automatically when no data loss is possible (e.g. int → long)', since: 'C# 1' },
    { name: '(T)value',              type: 'operator', desc: 'Explicit cast — forcefully converts a value; throws InvalidCastException at runtime on incompatible types', since: 'C# 1' },
    { name: 'as',                    type: 'keyword',  desc: 'Safe reference/nullable cast — returns null instead of throwing when the cast fails', since: 'C# 1' },
    { name: 'is',                    type: 'keyword',  desc: 'Type-test operator — returns true/false; combined with a pattern variable it casts in one step', since: 'C# 1' },
    { name: 'Convert',               type: 'class',    desc: 'System.Convert static class — converts between base types with null/overflow handling (e.g. Convert.ToInt32)', since: '.NET 1' },
    { name: 'TryParse',              type: 'method',   desc: 'Attempts to parse a string without throwing; returns bool and outputs the result via an out parameter', since: '.NET 1' },
    { name: 'Parse',                 type: 'method',   desc: 'Parses a string to a typed value; throws FormatException or OverflowException on failure', since: '.NET 1' },
    { name: 'checked',               type: 'keyword',  desc: 'Enables overflow checking for integral arithmetic — throws OverflowException instead of silently wrapping', since: 'C# 1' },
    { name: 'unchecked',             type: 'keyword',  desc: 'Disables overflow checking — arithmetic wraps silently (default behaviour for most contexts)', since: 'C# 1' },
    { name: 'implicit operator',     type: 'keyword',  desc: 'Custom implicit conversion operator — lets your type be used anywhere the target type is expected, without a cast', since: 'C# 1' },
    { name: 'explicit operator',     type: 'keyword',  desc: 'Custom explicit conversion operator — requires a (T) cast at the call site; use when data loss or failure is possible', since: 'C# 1' },
    { name: 'IConvertible',          type: 'interface', desc: 'Interface implemented by BCL types (bool, int, string…) enabling Convert.ChangeType and typed conversion methods', since: '.NET 1' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Implicit vs explicit conversion',
      points: [
        '<strong>Implicit conversions</strong> are inserted automatically by the compiler when the target type can represent every value the source type can hold — for example, <code>int</code> → <code>long</code> or <code>float</code> → <code>double</code>. No cast syntax needed.',
        '<strong>Explicit conversions (casts)</strong> require you to write <code>(T)value</code>. They are needed when converting to a narrower type (e.g. <code>long</code> → <code>int</code>) or between unrelated reference types, because data loss or failure is possible.',
        'A widening conversion is always implicit; a narrowing conversion is always explicit. If the value is out of range and overflow checking is off, the result wraps silently rather than throwing.',
        'Numeric widening order (each is implicit left-to-right): <code>byte → short → int → long → float → double → decimal</code>. Moving left requires an explicit cast. Note that <code>float → decimal</code> is <em>not</em> implicit.',
        'For reference types, the compiler allows an implicit upcast (derived → base) but requires an explicit downcast (base → derived) because the downcast might fail at runtime if the object is actually a sibling type.',
      ],
    },
    {
      heading: 'as vs (T)cast — null vs exception',
      points: [
        'The <code>as</code> operator attempts a reference or nullable-value conversion and returns <code>null</code> if it fails — it <em>never</em> throws an exception. Use it when failure is a normal possibility that the calling code needs to handle.',
        'The <code>(T)cast</code> operator throws <code>InvalidCastException</code> at runtime when the conversion is not valid. Use it when a wrong type is a programming error that should surface immediately rather than silently propagating as <code>null</code>.',
        'The <code>is</code> operator with a pattern variable (C# 7+) tests and captures in one step: <code>if (obj is Order order)</code> — no separate cast needed and no null-check required after.',
        'Prefer <code>is</code> with a pattern variable over <code>as</code> followed by a null check — the pattern form avoids the double type lookup (is + null check) and is more readable in switch expressions.',
        '<code>as</code> cannot be used with non-nullable value types because null has nowhere to live. Use <code>as int?</code> (nullable) or <code>(int)cast</code> for value types.',
      ],
    },
    {
      heading: 'checked and unchecked for overflow',
      points: [
        'By default, C# integer arithmetic is <strong>unchecked</strong>: overflow silently wraps. <code>int.MaxValue + 1</code> yields <code>int.MinValue</code> — no exception is thrown, the value is just wrong.',
        'Wrap arithmetic in a <code>checked</code> block or expression to make overflow throw <code>OverflowException</code>: <code>checked(int.MaxValue + 1)</code> throws instead of wrapping, making the bug visible.',
        'Use <code>unchecked</code> explicitly when you intentionally want wrap-around behaviour — for example, hash-code computation, CRC calculations, or low-level bit manipulation where overflow is part of the algorithm.',
        'You can enable project-wide checked arithmetic with <code>&lt;CheckForOverflowUnderflow&gt;true&lt;/CheckForOverflowUnderflow&gt;</code> in your <code>.csproj</code>. This changes the default for all arithmetic — useful for safety-critical code.',
        '<code>checked</code>/<code>unchecked</code> only applies to integral types (<code>int</code>, <code>long</code>, etc.). Floating-point types (<code>float</code>, <code>double</code>) never throw on overflow — they produce <code>Infinity</code> or <code>NaN</code> instead.',
      ],
    },
    {
      heading: 'Custom conversion operators',
      points: [
        'Define <code>public static implicit operator TargetType(SourceType value)</code> to let the compiler insert the conversion automatically — ideal when no data is ever lost and the conversion is always semantically safe.',
        'Define <code>public static explicit operator TargetType(SourceType value)</code> when the conversion could fail, lose precision, or change semantic meaning — this forces callers to write a visible <code>(T)cast</code>.',
        'A common pattern is to define an implicit conversion <em>from</em> a primitive into your type (e.g. <code>implicit operator Money(decimal amount)</code>) and an explicit conversion <em>back</em> (e.g. <code>explicit operator decimal(Money m)</code>) to prevent accidental loss of domain meaning.',
        'Custom conversion operators should be defined in either the source or destination type (not both, to avoid ambiguity). Avoid chains of implicit conversions — they can surprise callers and cause difficult-to-diagnose overload resolution issues.',
        'From C# 11+, you can also define <code>checked</code> variants of explicit operators: <code>public static explicit operator checked TargetType(SourceType value)</code>, which participates in checked arithmetic contexts.',
      ],
    },
    {
      heading: 'Boxing and unboxing',
      points: [
        '<strong>Boxing</strong> wraps a value type (e.g. <code>int</code>) in a heap-allocated object wrapper — this happens implicitly whenever a value type is assigned to <code>object</code>, an interface, or added to a non-generic collection like <code>ArrayList</code>.',
        '<strong>Unboxing</strong> extracts the value type from the wrapper using an explicit cast: <code>(int)obj</code>. Unboxing throws <code>InvalidCastException</code> if the boxed type does not exactly match — you cannot unbox a boxed <code>int</code> directly to <code>long</code>.',
        'Boxing has a performance cost: it allocates on the heap and creates GC pressure. Generic collections (<code>List&lt;int&gt;</code>, <code>Dictionary&lt;string, int&gt;</code>) avoid boxing entirely — this is one of the primary motivations for generics.',
        'Interfaces cause boxing for value types: <code>IComparable c = 42;</code> boxes the <code>int</code>. If you call interface methods on value types heavily in a hot path, consider using generic constraints (<code>where T : IComparable&lt;T&gt;</code>) or <code>Span&lt;T&gt;</code> patterns to avoid it.',
        'You can detect unintentional boxing in hot paths with the Roslyn analyzer or BenchmarkDotNet\'s <code>MemoryDiagnoser</code> — excessive allocations often trace back to unintentional boxing in loops or LINQ queries.',
      ],
    },
    {
      heading: 'Parsing and culture-aware conversions',
      points: [
        '<code>int.Parse(str)</code> and <code>double.Parse(str)</code> use the thread\'s current culture by default. On a German system, <code>double.Parse("3,14")</code> returns <code>3.14</code> because German uses comma as the decimal separator — the same call on an English system throws <code>FormatException</code>.',
        'Always pass <code>CultureInfo.InvariantCulture</code> when parsing data from files, APIs, or databases. Use <code>CultureInfo.CurrentCulture</code> only for user-facing display and input in localised apps.',
        '<code>DateTime.TryParseExact</code> should be preferred over <code>DateTime.TryParse</code> for any structured date format (ISO 8601, log timestamps, API responses) — the exact form prevents the runtime from guessing the format and producing a wrong date.',
        'Parsing is one of the few places where choosing the right overload has a significant performance impact. <code>int.Parse(ReadOnlySpan&lt;char&gt;)</code> parses directly from a span without allocating a new string — important in high-throughput code that slices input buffers.',
        'Numeric styles (<code>NumberStyles</code>) control what the parser accepts: <code>NumberStyles.AllowThousands</code> permits "1,000", <code>NumberStyles.HexNumber</code> parses hex without the "0x" prefix. Mismatched styles are a common source of parse failures.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Implicit & Explicit',
      language: 'csharp',
      code: `// ── Implicit (widening) conversions ─────────────────────────────────
int    i = 42;
long   l = i;        // int  → long   (implicit — always safe)
float  f = i;        // int  → float  (implicit)
double d = f;        // float→ double (implicit)

// ── Explicit (narrowing) casts ────────────────────────────────────
double pi    = 3.14159;
int    trunc = (int)pi;   // 3   — fractional part discarded, no exception

long   big   = 10_000_000_000L;
int    small = (int)big;  // wraps silently: -1294967296 (unchecked by default)

// ── checked — overflow throws instead of wrapping ─────────────────
try
{
    int overflow = checked((int)big);   // OverflowException
}
catch (OverflowException ex)
{
    Console.WriteLine(\`Overflow caught: \${ex.Message}\`);
}

// ── checked block ─────────────────────────────────────────────────
checked
{
    int a = int.MaxValue;
    int b = a + 1;   // OverflowException here
}

// ── unchecked — explicit intent to wrap ───────────────────────────
int hashA = 0x7fffffff;
int hashB = unchecked(hashA + 1);  // -2147483648 — intentional wrap
Console.WriteLine(hashB);

// ── Reference type upcasts (implicit) and downcasts (explicit) ────
Animal animal = new Dog();   // implicit upcast — always safe
Dog    dog    = (Dog)animal; // explicit downcast — might throw if animal is a Cat

// Safe downcast using as:
Dog? maybeDog = animal as Dog;  // null if animal is not a Dog — never throws`,
    },
    {
      label: 'as / is Patterns',
      language: 'csharp',
      code: `// ── as operator — null on failure, never throws ──────────────────
object obj = "Hello, World!";

string? text = obj as string;    // "Hello, World!"
int?    num  = obj as int?;      // null — obj is not an int

if (text is not null)
    Console.WriteLine(text.ToUpper());  // HELLO, WORLD!

// ── (T)cast — throws on failure ───────────────────────────────────
try
{
    int bad = (int)obj;  // InvalidCastException: can't cast string to int
}
catch (InvalidCastException ex)
{
    Console.WriteLine(\`Cast failed: \${ex.Message}\`);
}

// ── is with pattern variable (C# 7+) — preferred ─────────────────
void Describe(object shape)
{
    if (shape is Circle c)
        Console.WriteLine(\`Circle, radius: \${c.Radius}\`);
    else if (shape is Rectangle r)
        Console.WriteLine(\`Rectangle: \${r.Width}x\${r.Height}\`);
    else
        Console.WriteLine("Unknown shape");
}

// ── switch expression with type patterns (C# 8+) ─────────────────
double Area(object shape) => shape switch
{
    Circle    c => Math.PI * c.Radius * c.Radius,
    Rectangle r => r.Width * r.Height,
    Triangle  t => 0.5 * t.Base * t.Height,
    _           => throw new ArgumentException(\`Unknown: \${shape.GetType().Name}\`)
};

// ── as vs is pattern comparison ───────────────────────────────────
// Old style (two steps — double lookup):
var order = obj as Order;
if (order != null) Process(order);

// Preferred (one step — pattern variable):
if (obj is Order o) Process(o);

// ── Null check with is ────────────────────────────────────────────
string? maybeNull = GetValue();
if (maybeNull is string value)   // also checks non-null
    Console.WriteLine(value.Length);`,
    },
    {
      label: 'Convert & TryParse',
      language: 'csharp',
      code: `// ── int.Parse — throws on invalid input ──────────────────────────
int parsed = int.Parse("42");    // 42
// int.Parse("abc");             // FormatException
// int.Parse("99999999999");     // OverflowException

// ── int.TryParse — safe, no exceptions ───────────────────────────
string input = Console.ReadLine() ?? "";

if (int.TryParse(input, out int value))
    Console.WriteLine(\`You entered: \${value}\`);
else
    Console.WriteLine("Not a valid integer.");

// ── Culture matters! Always specify for external data ─────────────
// German decimal separator is comma:
bool ok = double.TryParse("3,14",
    System.Globalization.NumberStyles.Any,
    System.Globalization.CultureInfo.GetCultureInfo("de-DE"),
    out double europeanPi);
Console.WriteLine(\`\${ok} → \${europeanPi}\`);  // True → 3.14

// For files/APIs/databases, ALWAYS use InvariantCulture:
double.TryParse("3.14",
    System.Globalization.NumberStyles.Float,
    System.Globalization.CultureInfo.InvariantCulture,
    out double invariantPi);

// ── System.Convert — handles null and base-type conversions ───────
object? maybeNull = null;
int fromNull  = Convert.ToInt32(maybeNull);   // 0  (no exception for null)
int fromBool  = Convert.ToInt32(true);        // 1
bool fromInt  = Convert.ToBoolean(1);         // true
// NOTE: Convert.ToInt32(3.9) → 4 (rounds); (int)3.9 → 3 (truncates)
double rounded = Convert.ToDouble("3.14");    // uses current culture!

// ── Span<char> — zero-alloc parsing (high-throughput) ────────────
ReadOnlySpan<char> span = "  42  ".AsSpan().Trim();
int spanParsed = int.Parse(span);   // 42 — no intermediate string allocation

// ── DateTime.TryParseExact — strict format ────────────────────────
DateTime.TryParseExact("15/06/2024", "dd/MM/yyyy",
    System.Globalization.CultureInfo.InvariantCulture,
    System.Globalization.DateTimeStyles.None,
    out DateTime exact);
Console.WriteLine(exact.ToShortDateString());`,
    },
    {
      label: 'Boxing & Unboxing',
      language: 'csharp',
      code: `// ── Boxing — implicit, allocates on heap ─────────────────────────
int value = 42;
object boxed = value;   // boxing: int → heap object
Console.WriteLine(boxed.GetType().Name);  // Int32

// ── Unboxing — explicit cast required ─────────────────────────────
int unboxed = (int)boxed;    // correct type — works
Console.WriteLine(unboxed);  // 42

// ── Unboxing to WRONG type — InvalidCastException ─────────────────
try
{
    long wrong = (long)boxed;  // throws! boxed type is int, not long
}
catch (InvalidCastException ex)
{
    Console.WriteLine(ex.Message);
    // If you need a long, unbox to int first, then convert:
    long correct = (int)boxed;   // unbox → int, then implicit widening
    Console.WriteLine(correct);  // 42
}

// ── Generic collections avoid boxing entirely ─────────────────────
// Non-generic (boxes every int):
var legacy = new System.Collections.ArrayList();
legacy.Add(42);    // boxing ← heap allocation
int v1 = (int)legacy[0]; // unboxing

// Generic (no boxing):
var modern = new List<int>();
modern.Add(42);    // no boxing
int v2 = modern[0]; // no unboxing

// ── Interface assignment causes boxing ────────────────────────────
IComparable boxedViaInterface = 42;   // int is boxed because IComparable is a ref type
// Avoid in hot paths — use generic constraints instead:
// void Sort<T>(T[] items) where T : IComparable<T>  ← no boxing

// ── Detecting unintentional boxing ────────────────────────────────
// BenchmarkDotNet with [MemoryDiagnoser] shows Gen0 allocations per op.
// A loop calling ArrayList.Add(i) will show N*24 bytes per iteration.
// A loop calling List<int>.Add(i) shows 0 bytes — no boxing.`,
    },
    {
      label: 'Custom Operators',
      language: 'csharp',
      code: `// ── Temperature struct with custom conversions ───────────────────
public readonly struct Temperature
{
    public double Celsius { get; }

    private Temperature(double celsius) => Celsius = celsius;

    // Implicit: double → Temperature (no data loss, natural usage)
    public static implicit operator Temperature(double celsius)
        => new Temperature(celsius);

    // Explicit: Temperature → double in Fahrenheit (data transform)
    public static explicit operator double(Temperature t)
        => t.Celsius * 9.0 / 5.0 + 32.0;

    public static Temperature FromFahrenheit(double f)
        => new Temperature((f - 32.0) * 5.0 / 9.0);

    public static bool TryParse(string input, out Temperature result)
    {
        result = default;
        if (string.IsNullOrWhiteSpace(input)) return false;
        var trimmed = input.Trim().ToUpperInvariant();
        char unit = trimmed[^1];
        if (unit != 'C' && unit != 'F') return false;
        if (!double.TryParse(trimmed[..^1].Trim(),
                System.Globalization.NumberStyles.Float,
                System.Globalization.CultureInfo.InvariantCulture,
                out double val)) return false;
        result = unit == 'C' ? new Temperature(val) : FromFahrenheit(val);
        return true;
    }

    public override string ToString() => \`\${Celsius:F1}°C\`;
}

// ── Usage ─────────────────────────────────────────────────────────
Temperature boiling  = 100.0;       // implicit: double → Temperature
Temperature freezing = 0.0;
Console.WriteLine(boiling);         // 100.0°C

double boilingF  = (double)boiling; // explicit: Temperature → Fahrenheit
Console.WriteLine(\`\${boilingF}°F\`); // 212°F

if (Temperature.TryParse("98.6F", out Temperature body))
    Console.WriteLine(\`Body temp: \${body}\`);   // Body temp: 37.0°C

// ── Money — implicit from decimal, explicit back ──────────────────
public readonly record struct Money(decimal Amount, string Currency)
{
    public static implicit operator Money(decimal amount)
        => new Money(amount, "USD");
    public static explicit operator decimal(Money m) => m.Amount;
}

Money price = 9.99m;          // implicit: decimal → Money
decimal raw = (decimal)price; // explicit: Money → decimal (drops currency)`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Casting a string to int with (int) — use Parse instead',
      wrong: `string input = "42";
int value = (int)input;  // InvalidCastException — (int) is not Parse`,
      right: `string input = "42";
if (int.TryParse(input, out int value))
    Console.WriteLine(value);`,
      explanation: '(int) is an unboxing / type conversion operator, not a parse function. It works on boxed value types and compatible reference types, not strings. Use int.TryParse (safe) or int.Parse (throws) to convert string → int.',
    },
    {
      title: 'Unboxing a boxed int directly to long',
      wrong: `object boxed = 42;        // boxed as int
long l = (long)boxed;     // InvalidCastException — boxed type is int, not long`,
      right: `object boxed = 42;
long l = (int)boxed;      // unbox to int first, then implicit widening to long`,
      explanation: 'Unboxing requires the exact type that was boxed. A boxed int cannot be unboxed directly to long, even though int is implicitly convertible to long. Unbox to the original type first, then let widening happen implicitly.',
    },
    {
      title: 'Parsing with current culture in server code',
      wrong: `// On a European server, comma is the decimal separator
double price = double.Parse("19.99"); // FormatException on de-DE culture!`,
      right: `double price = double.Parse("19.99",
    System.Globalization.CultureInfo.InvariantCulture);`,
      explanation: 'Parse and TryParse use the thread\'s current culture by default. On a German server "19.99" fails because "." is a thousands separator there. Always pass InvariantCulture when parsing data from files, APIs, or databases. Use CurrentCulture only for user-facing display input.',
    },
    {
      title: 'Convert.ToDouble vs (double) rounding behaviour',
      wrong: `double result = (double)(int)3.9;  // 3 — truncates, not rounds
// or relying on Convert.ToInt32 to truncate:
int wrong = (int)Convert.ToDouble("3.9"); // 3 — but intent was 4?`,
      right: `int rounded   = Convert.ToInt32(3.9);   // 4 — rounds to nearest
int truncated = (int)3.9;                // 3 — truncates toward zero
int mathRound = (int)Math.Round(3.9);   // 4 — explicit rounding`,
      explanation: 'Convert.ToInt32(double) rounds to the nearest integer (banker\'s rounding for .5). A direct (int) cast always truncates toward zero. Know which you need — financial calculations nearly always want rounding, not truncation.',
    },
    {
      title: 'Using float/double for monetary arithmetic',
      wrong: `double total = 0.1 + 0.2;
Console.WriteLine(total == 0.3); // False — 0.30000000000000004`,
      right: `decimal total = 0.1m + 0.2m;
Console.WriteLine(total == 0.3m); // True`,
      explanation: 'float and double use binary floating-point which cannot represent most decimal fractions exactly. For money and any calculation where exact decimal representation matters, use decimal. The difference in performance is irrelevant compared to the risk of financial miscalculations.',
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'What is the key difference between using <code>as</code> and <code>(T)cast</code> for reference type conversions?',
      options: [
        'They are identical — both return null when the cast fails',
        '<code>as</code> returns null when the cast fails; <code>(T)cast</code> throws <code>InvalidCastException</code>',
        '<code>(T)cast</code> returns null when the cast fails; <code>as</code> throws an exception',
        '<code>as</code> only works with value types; <code>(T)cast</code> only works with reference types',
      ],
      answer: 1,
      explanation: '<code>as</code> is the safe cast operator — if the object cannot be converted to the target type, it returns <code>null</code> rather than throwing. <code>(T)cast</code> is the forceful cast — if the object is not compatible at runtime, it throws <code>InvalidCastException</code>. Use <code>as</code> when failure is a normal case; use <code>(T)cast</code> when a wrong type signals a programming error.',
    },
    {
      q: 'What does <code>checked(int.MaxValue + 1)</code> do?',
      options: [
        'Returns <code>int.MinValue</code> silently (wrap-around behaviour)',
        'Returns 0',
        'Throws <code>OverflowException</code> at runtime',
        'Is a compile-time error',
      ],
      answer: 2,
      explanation: 'The <code>checked</code> context enables overflow detection for integer arithmetic. Without it, <code>int.MaxValue + 1</code> silently wraps to <code>int.MinValue</code>. Inside a <code>checked</code> block or expression, the same operation throws <code>OverflowException</code> — making the bug visible immediately rather than propagating a wrong value silently.',
    },
    {
      q: 'When should you prefer <code>int.TryParse</code> over <code>int.Parse</code>?',
      options: [
        'Never — <code>int.Parse</code> is always preferred',
        'Only when parsing very large numbers',
        'When the input comes from user input or external data where invalid strings are a normal possibility, to avoid exception overhead',
        'Only when the string might be null',
      ],
      answer: 2,
      explanation: '<code>int.Parse</code> throws <code>FormatException</code> or <code>OverflowException</code> on bad input. Throwing and catching exceptions for expected failures is expensive and semantically wrong. <code>int.TryParse</code> returns <code>false</code> without throwing when the string is invalid — the correct choice for user input, form fields, or any external data where malformed values are normal occurrences.',
    },
    {
      q: 'What is the advantage of marking a custom conversion operator <code>explicit</code> rather than <code>implicit</code>?',
      options: [
        'Explicit operators are faster at runtime',
        'Explicit operators work with value types; implicit operators only work with reference types',
        'It forces the caller to write a cast, making potential data loss or failure visible at the call site',
        'Explicit operators are required for converting between structs',
      ],
      answer: 2,
      explanation: 'An <code>explicit</code> conversion operator requires the caller to write a visible <code>(T)cast</code>. This is important when the conversion can lose data (e.g. extracting a raw <code>decimal</code> from a <code>Money</code> struct drops the currency context), can fail, or is semantically surprising. Making it explicit puts the responsibility on the caller to acknowledge the transformation.',
    },
    {
      q: 'You have <code>object boxed = 42;</code> (boxed as int). What happens when you write <code>(long)boxed</code>?',
      options: [
        'Returns 42L — implicit widening applies during unboxing',
        'Throws <code>InvalidCastException</code> — unboxing requires the exact boxed type',
        'Returns <code>null</code>',
        'Compiles but returns 0',
      ],
      answer: 1,
      explanation: 'Unboxing is strict — it requires the exact same type that was boxed. A boxed <code>int</code> cannot be unboxed directly to <code>long</code>, even though <code>int</code> is implicitly convertible to <code>long</code> in normal code. The correct approach: first unbox to <code>int</code>, then let implicit widening do the rest: <code>long l = (int)boxed;</code>.',
    },
    {
      q: 'What does <code>Convert.ToInt32(3.9)</code> return, and how does it differ from <code>(int)3.9</code>?',
      options: [
        'Both return 3 — they truncate toward zero',
        '<code>Convert.ToInt32(3.9)</code> returns 4 (rounds); <code>(int)3.9</code> returns 3 (truncates)',
        '<code>Convert.ToInt32(3.9)</code> throws; <code>(int)3.9</code> returns 3',
        'Both return 4 — they both use rounding',
      ],
      answer: 1,
      explanation: '<code>Convert.ToInt32(double)</code> rounds to the nearest integer using banker\'s rounding (midpoint rounds to even). A direct <code>(int)</code> cast always truncates toward zero, discarding the fractional part. Knowing this difference matters in financial calculations — always choose deliberately between rounding and truncation.',
    },
    {
      q: 'Why does <code>double.Parse("3.14")</code> potentially throw on a server with a German locale?',
      options: [
        'German locale uses a different Unicode encoding for digits',
        'German locale uses a comma as the decimal separator, so "3.14" is parsed as a thousand-separated number or fails',
        'double.Parse always throws regardless of locale',
        'German locale doesn\'t support floating-point numbers',
      ],
      answer: 1,
      explanation: 'Parse methods use the thread\'s <code>CurrentCulture</code> by default. In German (<code>de-DE</code>), the period "." is a thousands separator and the comma "," is the decimal separator. So <code>"3.14"</code> either fails with <code>FormatException</code> or parses as <code>314</code>. Always pass <code>CultureInfo.InvariantCulture</code> when parsing structured data from files or APIs.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between <code>Convert.ToInt32</code> and <code>(int)</code>?',
      a: '<ul><li><code>Convert.ToInt32</code> handles <code>null</code> (returns 0), handles <code>bool</code> (true → 1), <strong>rounds</strong> floating-point values (3.9 → 4), and throws <code>OverflowException</code> for out-of-range values.</li><li>The <code>(int)</code> cast <strong>truncates</strong> floats (3.9 → 3), throws <code>InvalidCastException</code> for incompatible types, and does not handle <code>null</code>.</li></ul>Use <code>Convert</code> when the source can be null or when you want rounding; use <code>(int)</code> for direct numeric narrowing where you control the input.',
    },
    {
      q: 'Why does <code>as</code> not work with non-nullable value types like <code>int</code>?',
      a: '<code>as</code> needs to be able to return <code>null</code> when the cast fails — but non-nullable value types cannot hold <code>null</code>. The only exception is nullable value types: <code>obj as int?</code> compiles because <code>int?</code> can hold <code>null</code>. For direct value-type casts you must use <code>(int)</code>, which will throw <code>InvalidCastException</code> if the object is not actually an <code>int</code> (or boxed <code>int</code>).',
    },
    {
      q: 'When should I define an implicit vs explicit conversion operator on my own type?',
      a: 'Use <code>implicit</code> when the conversion is lossless, always succeeds, and is semantically obvious — for example, a <code>UserId</code> struct converting implicitly from <code>int</code>. Use <code>explicit</code> when the conversion could lose precision or domain meaning, might fail, or should make the developer pause — for example, extracting a raw <code>decimal</code> from a <code>Money</code> value drops the currency context. Prefer factory methods (<code>FromXxx</code>) over implicit operators when construction requires validation.',
    },
    {
      q: 'What is boxing and unboxing, and how do they relate to performance?',
      a: '<strong>Boxing</strong> wraps a value type (e.g. <code>int</code>) in a heap-allocated <code>object</code> — triggered implicitly by assigning to <code>object</code>, an interface, or a non-generic collection. <strong>Unboxing</strong> extracts the value using an explicit cast. The cost: each box allocates heap memory and creates GC pressure. Generic collections (<code>List&lt;int&gt;</code>) avoid boxing entirely. In hot paths, use <code>MemoryDiagnoser</code> from BenchmarkDotNet to detect unintentional boxing — it shows Gen0 allocations per call.',
    },
    {
      q: 'How do I parse a number from a ReadOnlySpan without allocating a string?',
      a: 'Use the span-based overloads introduced in .NET Core: <code>int.Parse(ReadOnlySpan&lt;char&gt;)</code> and <code>int.TryParse(ReadOnlySpan&lt;char&gt;, out int result)</code>. These parse directly from the buffer without creating an intermediate <code>string</code>: <br><br><code>ReadOnlySpan&lt;char&gt; span = line.AsSpan(start, length);<br>if (int.TryParse(span, out int value)) ...</code><br><br>This matters in high-throughput parsers (CSV, log file parsing, protocol handlers) where the alloc-per-number pattern causes significant GC pressure.',
    },
    {
      q: 'Why can\'t I unbox a boxed <code>int</code> directly to <code>long</code>?',
      a: 'Unboxing reads exactly the type that was stored in the box. When you wrote <code>object boxed = 42</code>, the runtime stored an <code>Int32</code> on the heap. Asking for <code>(long)boxed</code> looks for a boxed <code>Int64</code>, finds an <code>Int32</code> instead, and throws <code>InvalidCastException</code>. The fix is a two-step: unbox to the original type, then widen: <code>long l = (int)boxed;</code>. The widening conversion is free — it happens in a register, not on the heap.',
    },
    {
      q: 'What is <code>Convert.ChangeType</code> and when is it useful?',
      a: '<code>Convert.ChangeType(value, targetType)</code> performs a runtime type conversion using the <code>IConvertible</code> interface. It is useful when the target type is only known at runtime (e.g. deserializing configuration values into typed properties using reflection): <code>object result = Convert.ChangeType("42", typeof(int));</code>. Limitations: the source type must implement <code>IConvertible</code>, only BCL base types are supported, and it is slower than a direct cast. For custom types, define explicit conversion operators or use a dedicated mapper library instead.',
    },
  ];

  challenge: Challenge = {
    title: 'Temperature Struct with TryParse & Conversion Operators',
    description: `Implement a <code>Temperature</code> readonly struct that supports:

1. An <strong>implicit</strong> conversion operator from <code>double</code> (treated as Celsius) so you can write <code>Temperature t = 100.0;</code>
2. An <strong>explicit</strong> conversion operator to <code>double</code> that returns the temperature in Fahrenheit
3. A static <strong>TryParse</strong> method that accepts strings like <code>"100C"</code>, <code>"212F"</code>, or <code>"37.5 C"</code> and returns <code>false</code> for invalid input without throwing
4. A meaningful <code>ToString()</code> override showing the value in Celsius with one decimal place and the °C symbol`,
    language: 'csharp',
    hints: [
      'Keep the struct readonly and store only Celsius internally — derive Fahrenheit on demand',
      'Implicit operator signature: public static implicit operator Temperature(double celsius)',
      'Explicit operator returns Fahrenheit: celsius * 9.0 / 5.0 + 32.0',
      'In TryParse, trim whitespace, uppercase the string, read the last char as the unit, and parse the rest as a double with InvariantCulture',
    ],
    starterCode: `public readonly struct Temperature
{
    public double Celsius { get; }
    private Temperature(double celsius) => Celsius = celsius;

    // TODO: implicit operator from double (Celsius)
    // TODO: explicit operator to double (returns Fahrenheit)

    public static bool TryParse(string input, out Temperature result)
    {
        result = default;
        // TODO: parse "100C", "212F", "37.5 C" etc.
        throw new NotImplementedException();
    }

    public override string ToString() => throw new NotImplementedException();
}

// Expected usage:
// Temperature boiling = 100.0;         // implicit
// double boilingF = (double)boiling;   // explicit → 212.0
// Temperature.TryParse("98.6F", out var body);
// Console.WriteLine(body);             // 37.0°C`,
    solution: `public readonly struct Temperature
{
    public double Celsius { get; }
    private Temperature(double celsius) => Celsius = celsius;

    public static implicit operator Temperature(double celsius)
        => new Temperature(celsius);

    public static explicit operator double(Temperature t)
        => t.Celsius * 9.0 / 5.0 + 32.0;

    public static Temperature FromFahrenheit(double f)
        => new Temperature((f - 32.0) * 5.0 / 9.0);

    public static bool TryParse(string input, out Temperature result)
    {
        result = default;
        if (string.IsNullOrWhiteSpace(input)) return false;

        var trimmed = input.Trim().ToUpperInvariant();
        char unit = trimmed[^1];
        if (unit != 'C' && unit != 'F') return false;

        if (!double.TryParse(trimmed[..^1].Trim(),
                System.Globalization.NumberStyles.Float,
                System.Globalization.CultureInfo.InvariantCulture,
                out double val)) return false;

        result = unit == 'C' ? new Temperature(val) : FromFahrenheit(val);
        return true;
    }

    public override string ToString() => \`\${Celsius:F1}°C\`;
}

// ── Usage ──────────────────────────────────────────────────────────
Temperature boiling  = 100.0;        // implicit
Temperature freezing = 0.0;
Console.WriteLine(boiling);          // 100.0°C

double boilingF = (double)boiling;   // explicit
Console.WriteLine(\`\${boilingF}°F\`); // 212°F

if (Temperature.TryParse("98.6F", out Temperature body))
    Console.WriteLine(body);          // 37.0°C

if (!Temperature.TryParse("very hot", out _))
    Console.WriteLine("Invalid input rejected correctly");`,
  };

  revision: RevisionSummary = {
    oneLiner: 'C# type conversion covers implicit widening (safe, compiler-inserted), explicit narrowing casts (may throw or lose data), <code>as</code>/<code>is</code> patterns for safe reference casts, culture-aware parsing, boxing/unboxing costs, and custom <code>implicit</code>/<code>explicit</code> operators.',
    mustKnow: [
      '<code>as</code> returns <code>null</code> on failure (never throws); <code>(T)cast</code> throws <code>InvalidCastException</code> — choose based on whether failure is a normal case or a bug',
      'Bare <code>(int)</code> truncates float (3.9 → 3); <code>Convert.ToInt32(3.9)</code> rounds (→ 4) — know which you need',
      'Unboxing requires the exact boxed type: boxed <code>int</code> → <code>(long)</code> throws; solution: <code>(int)boxed</code> then implicit widening',
      '<code>checked</code>/<code>unchecked</code> controls overflow behaviour for integer arithmetic; float/double never throw — they produce <code>Infinity</code>/<code>NaN</code>',
      'Always pass <code>CultureInfo.InvariantCulture</code> when parsing data from files or APIs; use <code>CurrentCulture</code> only for user-facing display input',
      'Generic collections (<code>List&lt;int&gt;</code>) avoid boxing; non-generic (<code>ArrayList</code>) boxes every value type — avoidable and measurable with <code>MemoryDiagnoser</code>',
      'Mark custom conversion operators <code>implicit</code> for lossless/safe conversions; <code>explicit</code> when the conversion can fail, loses data, or changes semantic meaning',
    ],
    interviewFocus: [
      'What is the difference between <code>as</code>, <code>(T)cast</code>, and <code>is</code> pattern matching? When would you choose each?',
      'Why can\'t you unbox a boxed <code>int</code> directly to <code>long</code>?',
      'How does <code>checked</code> change the behaviour of integer arithmetic? What does float overflow produce instead?',
      'When would you use <code>implicit</code> vs <code>explicit</code> conversion operators on your own types?',
      'Why should you always specify <code>InvariantCulture</code> when parsing numbers in server code?',
    ],
  };
}
