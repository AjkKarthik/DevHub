import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-checked-and-unchecked-arithmetic-detecting-integer-overflow-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './checked-and-unchecked-arithmetic-detecting-integer-overflow.html',
  styleUrl: './checked-and-unchecked-arithmetic-detecting-integer-overflow.scss',
})
export class CheckedAndUncheckedArithmeticDetectingIntegerOverflowSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main topic never mentions overflow — and the default behavior is silent',
      points: [
        'The main Variables &amp; Types page shows <code>int</code>\'s range (±2.1 billion) but never covers what happens when arithmetic EXCEEDS that range. By default, C# integer arithmetic is <strong>unchecked</strong>: <code>int.MaxValue + 1</code> does NOT throw — it silently WRAPS AROUND to <code>int.MinValue</code>, producing a wrong-but-plausible-looking number with no error, warning, or exception of any kind.',
        'This default exists for performance reasons (checking every arithmetic operation for overflow has a real runtime cost) and for compatibility with C/C++-style wraparound semantics some algorithms deliberately rely on (hash functions, certain checksums) — but for ordinary business arithmetic, silent wraparound is almost always a bug waiting to happen, not a feature being used intentionally.',
      ],
    },
    {
      heading: 'The checked keyword and checked context',
      points: [
        'Wrapping an expression in <code>checked(...)</code> makes THAT SPECIFIC expression throw <code>OverflowException</code> if the result would exceed the type\'s range, instead of silently wrapping: <code>int result = checked(int.MaxValue + 1);</code> throws immediately.',
        'A <code>checked &#123; ... &#125;</code> BLOCK applies the same enforcement to every arithmetic operation inside it, without needing to wrap each expression individually — useful when a whole method\'s worth of arithmetic should be overflow-safe.',
        'The opposite, <code>unchecked(...)</code> / <code>unchecked &#123; ... &#125;</code>, explicitly opts BACK INTO wraparound behavior even inside a project-wide checked default (see below) — useful for the rare deliberate-wraparound case (a hash combiner is the classic example) so it\'s clear at the call site that overflow is intentional there, not accidental.',
      ],
    },
    {
      heading: 'Making checked the PROJECT-WIDE default',
      points: [
        'Rather than wrapping individual expressions, set <code>&lt;CheckForOverflowUnderflow&gt;true&lt;/CheckForOverflowUnderflow&gt;</code> in the <code>.csproj</code> file — this makes checked arithmetic the DEFAULT for the entire project, so ordinary <code>+</code>/<code>-</code>/<code>*</code> throw on overflow without needing <code>checked(...)</code> wrapped around every operation. Individual expressions that genuinely need wraparound can still opt out with <code>unchecked(...)</code>.',
        'This project-wide setting is a real, low-cost safety net for business/financial code (where a silently-wrapped total is a genuinely dangerous bug) and is worth turning on deliberately rather than relying on the unchecked default — the main topic\'s emphasis on <code>decimal</code> for money is about PRECISION; checked arithmetic is about catching a DIFFERENT class of bug (magnitude/overflow), and the two concerns are complementary, not redundant.',
      ],
    },
    {
      heading: 'Choosing between checked, try-parse-style guards, and a wider type',
      points: [
        '<code>checked</code> converts a SILENT bug into a LOUD crash (an exception) — this is strictly better for catching the bug during testing/development, but a crash is still a crash in production. For code where overflow is a plausible INPUT-DRIVEN scenario (not just a programming bug), validate and reject the input explicitly instead of leaning on <code>checked</code> as the only defense: <code>if (a &gt; int.MaxValue - b) throw new ArgumentException("would overflow");</code> before doing the addition.',
        'The simplest fix for genuinely large values is often to use a WIDER type from the start — <code>long</code> instead of <code>int</code> for values that can plausibly approach or exceed 2.1 billion (e.g. summing many large numbers, cumulative byte counts, certain ID schemes) — this avoids the overflow scenario entirely rather than detecting it after the fact.',
        '<code>checked</code> has a real (small but nonzero) performance cost since every operation gets an overflow check — for performance-critical inner loops doing millions of operations per second where the input range is provably safe, this cost may matter; for ordinary application code, it almost never does, and correctness should win by default.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Silent wraparound (the unchecked default)',
      language: 'csharp',
      code: `int max = int.MaxValue;
Console.WriteLine(max);        // 2147483647

// Default (unchecked) behavior — silently wraps, NO exception, NO warning
int wrapped = max + 1;
Console.WriteLine(wrapped);    // -2147483648 (int.MinValue!) — looks like a real number

// This is easy to hit accidentally in a running total or accumulator:
int total = 0;
for (int i = 0; i < 1_000_000; i++)
{
    total += 3000; // overflows silently partway through the loop
}
Console.WriteLine(total); // a wrong, wrapped-around value — no error anywhere`,
    },
    {
      label: 'checked — turning silence into a real exception',
      language: 'csharp',
      code: `int max = int.MaxValue;

// checked(...) expression — throws immediately on overflow
try
{
    int result = checked(max + 1);
}
catch (OverflowException)
{
    Console.WriteLine("Caught it! Would have silently wrapped otherwise.");
}

// checked { } block — applies to every operation inside
checked
{
    int a = 2_000_000_000;
    int b = 2_000_000_000;
    int sum = a + b; // throws OverflowException here — no silent bug
}

// unchecked — explicitly opt back into wraparound (e.g. inside a checked
// default) for a deliberate use case like a hash combiner:
int hash = unchecked(17 * 31 + someValue.GetHashCode());`,
    },
    {
      label: 'Project-wide checked (.csproj)',
      language: 'csharp',
      code: `<!-- In the .csproj file — makes checked arithmetic the PROJECT DEFAULT -->
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <CheckForOverflowUnderflow>true</CheckForOverflowUnderflow>
  </PropertyGroup>
</Project>

// With this set, ordinary arithmetic throws on overflow project-wide —
// no need to wrap every expression in checked(...) individually.
int max = int.MaxValue;
int result = max + 1; // throws OverflowException — checked is now the default

// Opt OUT for a specific deliberate-wraparound case:
int hash = unchecked(17 * 31 + someValue.GetHashCode());`,
    },
    {
      label: 'Guarding before the operation vs a wider type',
      language: 'csharp',
      code: `// Option 1: explicit pre-check for input-driven overflow scenarios
int SafeAdd(int a, int b)
{
    if (b > 0 && a > int.MaxValue - b)
        throw new ArgumentException("Addition would overflow int range.");
    if (b < 0 && a < int.MinValue - b)
        throw new ArgumentException("Addition would underflow int range.");
    return a + b;
}

// Option 2: use a wider type from the start — avoids the scenario entirely
long total = 0;
for (int i = 0; i < 1_000_000; i++)
{
    total += 3000; // long's range (±9.2 quintillion) makes overflow implausible here
}
Console.WriteLine(total); // correct, no overflow risk at this scale`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Write a method <code>int SafeMultiply(int a, int b)</code> that returns the product of <code>a</code> and <code>b</code>, but throws <code>OverflowException</code> instead of silently wrapping if the result would exceed <code>int</code>\'s range — using the <code>checked</code> keyword, not a manual pre-check.',
    hint: 'Wrap the multiplication in checked(...): return checked(a * b); — the runtime detects the overflow and throws OverflowException automatically, no manual range math needed.',
    solution: `int SafeMultiply(int a, int b)
{
    return checked(a * b);
}

// Usage:
Console.WriteLine(SafeMultiply(1000, 2000)); // 2000000 — fine

try
{
    SafeMultiply(100_000, 100_000); // 10,000,000,000 — exceeds int.MaxValue
}
catch (OverflowException)
{
    Console.WriteLine("Multiplication would overflow — caught safely.");
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'C# throws an exception automatically when integer arithmetic overflows, the same way it does for other invalid operations like dividing by zero.',
      reality: 'by default, C# integer arithmetic is UNCHECKED — overflow silently wraps around to the type\'s minimum value with no exception, no warning, and no error of any kind. Dividing by zero throws; overflowing does not, unless you explicitly opt into checked arithmetic.',
    },
    {
      thought: 'using <code>decimal</code> instead of <code>int</code>/<code>double</code> (as the main topic recommends for money) also protects against overflow.',
      reality: 'decimal\'s advantage is PRECISION (exact base-10 representation, no binary rounding error) — it is a completely separate concern from overflow (exceeding a type\'s representable range). decimal itself CAN overflow too, just at a much larger magnitude (±7.9 x 10^28) than int.',
    },
    {
      thought: 'enabling <code>checked</code> arithmetic project-wide is only useful for catching rare edge-case bugs and has no real practical value for typical business code.',
      reality: 'a silently-wrapped running total or accumulator (a very common pattern — summing prices, counting items, aggregating over a loop) is exactly the scenario checked arithmetic protects against, and it is a genuinely common, easy-to-hit bug in real business/financial code — not just a theoretical edge case.',
    },
  ];
}
