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
  selector: 'app-csharp-type-conversion',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
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
    { name: 'Convert',               type: 'method',   desc: 'System.Convert static class — converts between base types with null/overflow handling (e.g. Convert.ToInt32)', since: '.NET 1' },
    { name: 'TryParse',              type: 'method',   desc: 'Attempts to parse a string without throwing; returns bool and outputs the result via an out parameter', since: '.NET 1' },
    { name: 'Parse',                 type: 'method',   desc: 'Parses a string to a typed value; throws FormatException or OverflowException on failure', since: '.NET 1' },
    { name: 'checked',               type: 'keyword',  desc: 'Enables overflow checking for integral arithmetic — throws OverflowException instead of silently wrapping', since: 'C# 1' },
    { name: 'unchecked',             type: 'keyword',  desc: 'Disables overflow checking — arithmetic wraps silently (default behaviour for most contexts)', since: 'C# 1' },
    { name: 'implicit operator',     type: 'keyword',  desc: 'Custom implicit conversion operator — lets your type be used anywhere the target type is expected, without a cast', since: 'C# 1' },
    { name: 'explicit operator',     type: 'keyword',  desc: 'Custom explicit conversion operator — requires a (T) cast at the call site; use when data loss or failure is possible', since: 'C# 1' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Implicit vs explicit conversion',
      points: [
        '<strong>Implicit conversions</strong> are inserted automatically by the compiler when the target type can represent every value the source type can hold — for example, <code>int</code> → <code>long</code> or <code>float</code> → <code>double</code>.',
        '<strong>Explicit conversions (casts)</strong> require you to write <code>(T)value</code>. They are needed when converting to a narrower type (e.g. <code>long</code> → <code>int</code>) or between unrelated reference types, because data loss or failure is possible.',
        'A widening conversion is always implicit; a narrowing conversion is always explicit. If the value is out of range and overflow checking is off, the result wraps silently.',
        'Numeric widening order: <code>byte → short → int → long → float → double → decimal</code>. Moving left requires an explicit cast.',
      ],
    },
    {
      heading: 'as vs (T)cast — null vs exception',
      points: [
        'The <code>as</code> operator attempts a reference or nullable-value conversion and returns <code>null</code> if it fails — it <em>never</em> throws an exception. Use it when failure is a normal possibility.',
        'The <code>(T)cast</code> operator throws <code>InvalidCastException</code> at runtime when the conversion is not valid. Use it when a wrong type is a programming error that should surface immediately.',
        'The <code>is</code> operator (C# 7+ pattern form) lets you test and capture in one step: <code>if (obj is Order order)</code> — no cast needed after the check.',
        'Prefer <code>is</code> with a pattern variable over <code>as</code> followed by a null check — the pattern form is more readable and avoids the double lookup.',
      ],
    },
    {
      heading: 'checked and unchecked for overflow',
      points: [
        'By default, C# integer arithmetic is <strong>unchecked</strong>: overflow silently wraps. For example, <code>int.MaxValue + 1</code> yields <code>int.MinValue</code> — no exception.',
        'Wrap arithmetic in a <code>checked</code> block or use the <code>checked(...)</code> expression to make overflow throw <code>OverflowException</code>: <code>checked(int.MaxValue + 1)</code> throws.',
        'Use <code>unchecked</code> explicitly when you intentionally want wrap-around behaviour (e.g. hash-code computation or low-level bit manipulation).',
        'You can also enable project-wide checked arithmetic with the <code>/checked</code> compiler flag or the <code>&lt;CheckForOverflowUnderflow&gt;true&lt;/CheckForOverflowUnderflow&gt;</code> MSBuild property.',
      ],
    },
    {
      heading: 'Custom conversion operators',
      points: [
        'Define <code>public static implicit operator TargetType(SourceType value)</code> to let the compiler insert the conversion automatically — ideal when no data is ever lost.',
        'Define <code>public static explicit operator TargetType(SourceType value)</code> when the conversion could fail or lose precision — this forces callers to write an explicit cast.',
        'A common pattern is to define an implicit conversion <em>from</em> a primitive into your type (e.g. <code>implicit operator Money(decimal amount)</code>) and an explicit conversion <em>back</em> (e.g. <code>explicit operator decimal(Money m)</code>).',
        'Custom conversion operators should be defined in the source or destination type (not both). Avoid chains of implicit conversions — they can surprise callers and cause hard-to-diagnose overload resolution issues.',
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

// ── Numeric type conversions summary ─────────────────────────────
byte  b8  = 200;
short s16 = b8;       // implicit: byte → short
int   i32 = s16;      // implicit: short → int
long  i64 = i32;      // implicit: int → long

int   back = (int)i64;  // explicit: long → int (potential loss)
byte  narrow = (byte)i32; // explicit: int → byte — truncates to 8 bits`,
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

// ── TryParse with culture ─────────────────────────────────────────
bool ok = double.TryParse("3,14",
    System.Globalization.NumberStyles.Any,
    System.Globalization.CultureInfo.GetCultureInfo("de-DE"),
    out double europeanPi);
Console.WriteLine(\`\${ok} → \${europeanPi}\`);  // True → 3.14

// ── System.Convert — handles null and base-type conversions ───────
object? maybeNull = null;

int fromNull  = Convert.ToInt32(maybeNull);   // 0  (no exception for null)
int fromBool  = Convert.ToInt32(true);        // 1
int fromStr   = Convert.ToInt32("100");       // 100
bool fromInt  = Convert.ToBoolean(1);         // true
string asStr  = Convert.ToString(3.14)!;      // "3.14"

// ── Convert.ChangeType — dynamic type conversion ──────────────────
object ChangeType(object val, Type targetType) =>
    Convert.ChangeType(val, targetType);

object result = ChangeType("123", typeof(int));  // (object)123
Console.WriteLine(result.GetType().Name);        // Int32

// ── Span<char> / ReadOnlySpan<char> — zero-alloc parsing ─────────
ReadOnlySpan<char> span = "  42  ".AsSpan().Trim();
int spanParsed = int.Parse(span);   // 42 — no intermediate string allocation

// ── DateTime parsing ──────────────────────────────────────────────
DateTime.TryParse("2024-06-15", out DateTime date);
DateTime.TryParseExact("15/06/2024", "dd/MM/yyyy",
    System.Globalization.CultureInfo.InvariantCulture,
    System.Globalization.DateTimeStyles.None,
    out DateTime exact);
Console.WriteLine(exact.ToShortDateString());`,
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

    // Factory methods as an alternative to the implicit operator
    public static Temperature FromFahrenheit(double f)
        => new Temperature((f - 32.0) * 5.0 / 9.0);

    public static bool TryParse(string input, out Temperature result)
    {
        result = default;
        if (string.IsNullOrWhiteSpace(input)) return false;

        // Accept formats: "100C", "100 C", "212F", "212 F"
        var trimmed = input.Trim().ToUpperInvariant();
        char unit = trimmed[^1];
        if (unit != 'C' && unit != 'F') return false;

        if (!double.TryParse(trimmed[..^1].Trim(), out double val)) return false;

        result = unit == 'C' ? new Temperature(val) : FromFahrenheit(val);
        return true;
    }

    public override string ToString() => \`\${Celsius:F1}°C\`;
}

// ── Implicit conversion in action ─────────────────────────────────
Temperature boiling  = 100.0;       // implicit: double → Temperature
Temperature freezing = 0.0;

Console.WriteLine(boiling);         // 100.0°C
Console.WriteLine(freezing);        // 0.0°C

// ── Explicit conversion to Fahrenheit ─────────────────────────────
double boilingF  = (double)boiling;   // explicit cast required
double freezingF = (double)freezing;

Console.WriteLine(\`\${boilingF}°F\`);   // 212°F
Console.WriteLine(\`\${freezingF}°F\`);  // 32°F

// ── TryParse usage ────────────────────────────────────────────────
if (Temperature.TryParse("98.6F", out Temperature bodyTemp))
    Console.WriteLine(\`Body temp: \${bodyTemp}\`);   // Body temp: 37.0°C

if (!Temperature.TryParse("hot", out _))
    Console.WriteLine("Invalid temperature string");

// ── Money example — implicit from decimal ────────────────────────
public readonly record struct Money(decimal Amount, string Currency)
{
    public static implicit operator Money(decimal amount)
        => new Money(amount, "USD");

    public static explicit operator decimal(Money m) => m.Amount;
}

Money price = 9.99m;          // implicit: decimal → Money
decimal raw = (decimal)price; // explicit: Money → decimal`,
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
      explanation: 'The <code>checked</code> context enables overflow detection for integer arithmetic. Without it, <code>int.MaxValue + 1</code> silently wraps to <code>int.MinValue</code>. Inside a <code>checked</code> block or expression, the same operation throws <code>OverflowException</code> — making the bug visible immediately rather than propagating a wrong value.',
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
      explanation: '<code>int.Parse</code> throws <code>FormatException</code> or <code>OverflowException</code> on bad input. Throwing and catching exceptions for expected failures is expensive and bad practice. <code>int.TryParse</code> returns <code>false</code> without throwing when the string is invalid — making it the correct choice for user input, form fields, or any external data where malformed values are a normal occurrence.',
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
      explanation: 'An <code>explicit</code> conversion operator requires the caller to write a visible <code>(T)cast</code>. This is important when the conversion can lose data (e.g. Fahrenheit → double drops the unit context), can fail, or is semantically surprising. Making it explicit puts the responsibility on the caller to acknowledge the conversion and consider edge cases.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between <code>Convert.ToInt32</code> and <code>(int)</code>?',
      a: '<code>Convert.ToInt32</code> handles <code>null</code> (returns 0), handles <code>bool</code> (true → 1), rounds floating-point values instead of truncating them, and throws <code>OverflowException</code> for out-of-range values. The <code>(int)</code> cast truncates floats (3.9 → 3), throws <code>InvalidCastException</code> for incompatible types, and does not handle <code>null</code>. Use <code>Convert</code> when the source can be null or when you want rounding; use <code>(int)</code> for direct numeric narrowing where you control the input.',
    },
    {
      q: 'Why does <code>as</code> not work with value types like <code>int</code>?',
      a: '<code>as</code> needs to be able to return <code>null</code> when the cast fails — but value types cannot hold <code>null</code>. The only exception is nullable value types: <code>obj as int?</code> compiles because <code>int?</code> can hold <code>null</code>. For direct value-type casts you must use <code>(int)</code>, which will throw <code>InvalidCastException</code> if the object is not actually an <code>int</code> (or boxed <code>int</code>).',
    },
    {
      q: 'When should I define an implicit vs explicit conversion operator on my own type?',
      a: 'Use <code>implicit</code> when the conversion is lossless, always succeeds, and is semantically obvious — for example, a <code>UserId</code> struct converting implicitly from <code>int</code>. Use <code>explicit</code> when the conversion could lose precision or domain meaning, might fail, or should make the developer pause — for example, extracting a raw <code>decimal</code> from a <code>Money</code> value drops the currency context, so an explicit cast is appropriate. Prefer factory methods (<code>FromXxx</code>) over implicit operators when construction requires validation.',
    },
    {
      q: 'What is boxing and unboxing, and how do they relate to type conversion?',
      a: '<strong>Boxing</strong> wraps a value type (e.g. <code>int</code>) in a heap-allocated <code>object</code> wrapper — this happens implicitly whenever a value type is assigned to <code>object</code>, an interface, or a non-generic collection. <strong>Unboxing</strong> is the reverse: extracting the value type from the wrapper using an explicit cast <code>(int)obj</code>. Unboxing throws <code>InvalidCastException</code> if the boxed type does not exactly match — you cannot unbox a boxed <code>int</code> directly to <code>long</code>. Boxing has a performance cost due to heap allocation; generic collections (<code>List&lt;int&gt;</code>) avoid boxing entirely.',
    },
  ];

  challenge: Challenge = {
    title: 'Temperature Struct with TryParse & Conversion Operators',
    description: `Implement a \`Temperature\` readonly struct that supports:

1. An **implicit** conversion operator from \`double\` (treated as Celsius) so you can write \`Temperature t = 100.0;\`
2. An **explicit** conversion operator to \`double\` that returns the temperature in Fahrenheit
3. A static **TryParse** method that accepts strings like \`"100C"\`, \`"212F"\`, or \`"37.5 C"\` and returns \`false\` for invalid input without throwing
4. A meaningful \`ToString()\` override showing the value in Celsius with one decimal place and the °C symbol`,
    language: 'csharp',
    hints: [
      'Keep the struct readonly and store only Celsius internally — derive Fahrenheit on demand',
      'The implicit operator signature: `public static implicit operator Temperature(double celsius)`',
      'The explicit operator returns Fahrenheit: `celsius * 9.0 / 5.0 + 32.0`',
      'In TryParse, trim whitespace, uppercase the string, read the last char as the unit, and parse the rest as a double',
    ],
    starterCode: `public readonly struct Temperature
{
    public double Celsius { get; }

    private Temperature(double celsius) => Celsius = celsius;

    // TODO: implicit operator from double (Celsius)
    // public static implicit operator Temperature(double celsius) => ...

    // TODO: explicit operator to double (returns Fahrenheit)
    // public static explicit operator double(Temperature t) => ...

    // TODO: static TryParse(string input, out Temperature result)
    // Accepts "100C", "212F", "37.5 C", "98.6 F"
    public static bool TryParse(string input, out Temperature result)
    {
        result = default;
        throw new NotImplementedException();
    }

    // TODO: ToString — show Celsius with 1 decimal place and °C
    public override string ToString() => throw new NotImplementedException();
}

// Expected usage:
// Temperature boiling = 100.0;          // implicit
// double boilingF = (double)boiling;    // explicit → 212.0
// Temperature.TryParse("98.6F", out var body);
// Console.WriteLine(body);              // 37.0°C`,
    solution: `public readonly struct Temperature
{
    public double Celsius { get; }

    private Temperature(double celsius) => Celsius = celsius;

    // Implicit: double (Celsius) → Temperature — no data loss
    public static implicit operator Temperature(double celsius)
        => new Temperature(celsius);

    // Explicit: Temperature → double (Fahrenheit) — transforms meaning
    public static explicit operator double(Temperature t)
        => t.Celsius * 9.0 / 5.0 + 32.0;

    public static Temperature FromFahrenheit(double fahrenheit)
        => new Temperature((fahrenheit - 32.0) * 5.0 / 9.0);

    public static bool TryParse(string input, out Temperature result)
    {
        result = default;
        if (string.IsNullOrWhiteSpace(input)) return false;

        var trimmed = input.Trim().ToUpperInvariant();
        char unit = trimmed[^1];
        if (unit != 'C' && unit != 'F') return false;

        var numberPart = trimmed[..^1].Trim();
        if (!double.TryParse(numberPart,
                System.Globalization.NumberStyles.Float,
                System.Globalization.CultureInfo.InvariantCulture,
                out double val))
            return false;

        result = unit == 'C' ? new Temperature(val) : FromFahrenheit(val);
        return true;
    }

    public override string ToString() => \`\${Celsius:F1}°C\`;
}

// ── Usage ──────────────────────────────────────────────────────────
Temperature boiling  = 100.0;        // implicit
Temperature freezing = 0.0;

Console.WriteLine(boiling);          // 100.0°C
Console.WriteLine(freezing);         // 0.0°C

double boilingF  = (double)boiling;  // explicit
double freezingF = (double)freezing;
Console.WriteLine(\`\${boilingF}°F\`);  // 212°F
Console.WriteLine(\`\${freezingF}°F\`); // 32°F

if (Temperature.TryParse("98.6F", out Temperature body))
    Console.WriteLine(body);          // 37.0°C

if (Temperature.TryParse("37.5 C", out Temperature metric))
    Console.WriteLine(metric);        // 37.5°C

if (!Temperature.TryParse("very hot", out _))
    Console.WriteLine("Invalid input rejected correctly");`,
  };
}
