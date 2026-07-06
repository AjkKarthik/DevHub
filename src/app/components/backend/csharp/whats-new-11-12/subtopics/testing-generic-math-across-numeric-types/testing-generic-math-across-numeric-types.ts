import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-generic-math-across-numeric-types-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-generic-math-across-numeric-types.html',
  styleUrl: './testing-generic-math-across-numeric-types.scss',
})
export class TestingGenericMathAcrossNumericTypesOneSuiteEveryInumberImplementationSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own Statistics&lt;T&gt; challenge proves it "works with int[], double[], and decimal[]" — but a SINGLE test run against one T never proves that for the OTHERS',
      points: [
        'The main C# 11 &amp; 12 page\'s challenge explicitly asks to "verify it works with int[], double[], and decimal[] without code changes" — this is exactly the right instinct, but writing three separate, hand-duplicated test classes (one per T) is both tedious AND easy to let drift out of sync as new test cases are added to one but forgotten in the others. The whole POINT of generic math is ONE implementation shared across types — the test suite should mirror that structure, not fragment it.',
      ],
    },
    {
      heading: 'xUnit\'s [Theory] + [MemberData] (or a generic test base class) lets ONE set of test cases run against every T automatically',
      points: [
        'Rather than three separate <code>[Fact]</code> methods (one hardcoded to <code>int</code>, one to <code>double</code>, one to <code>decimal</code>), a SINGLE parameterized test method can accept the numeric TYPE as data and dispatch to the generic method reflectively, or — more idiomatically for compile-time generics — a small, explicit "runner" method per type that all funnel through ONE shared assertion helper, so the actual EXPECTED-VALUE logic is written exactly once and automatically applies to every numeric type under test.',
        'This matters specifically because different numeric types have genuinely different EDGE-CASE behavior that a shared test suite is far more likely to catch than three independently-written ones: integer division truncates, floating-point arithmetic has precision/rounding artifacts, and <code>decimal</code> has different overflow and precision characteristics than either — a test suite structured to share assertion logic across types surfaces these type-specific divergences as failures in a SPECIFIC type\'s row, rather than requiring someone to have thought to write that exact edge case for that exact type by hand.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The naive approach — three independently hand-written test classes',
      language: 'csharp',
      code: `using Xunit;

// WORKS, but the SAME assertion logic is duplicated three times —
// and it is easy to add a new test case to ONE class while forgetting
// the other two, silently losing coverage for those types:
public class StatisticsIntTests
{
    [Fact]
    public void Sum_ReturnsCorrectTotal() =>
        Assert.Equal(15, Statistics<int>.Sum([1, 2, 3, 4, 5]));
}

public class StatisticsDoubleTests
{
    [Fact]
    public void Sum_ReturnsCorrectTotal() =>
        Assert.Equal(15.0, Statistics<double>.Sum([1.0, 2.0, 3.0, 4.0, 5.0]));
}

public class StatisticsDecimalTests
{
    [Fact]
    public void Sum_ReturnsCorrectTotal() =>
        Assert.Equal(15m, Statistics<decimal>.Sum([1m, 2m, 3m, 4m, 5m]));
    // If someone adds a "Sum_HandlesNegativeNumbers" test HERE, but
    // forgets to add the equivalent to StatisticsIntTests and
    // StatisticsDoubleTests, those two types silently lose that
    // specific coverage — nothing enforces the three classes stay
    // in sync with each other at all.
}`,
    },
    {
      label: 'A shared, generic test base class — ONE set of test cases, run against every T',
      language: 'csharp',
      code: `using System.Numerics;
using Xunit;

// A single ABSTRACT test base — every actual assertion is written
// EXACTLY ONCE here, using the SAME INumber<T> constraint the main
// page's Statistics<T> class itself uses:
public abstract class StatisticsTestsBase<T> where T : INumber<T>
{
    // Each concrete subclass supplies how to CONVERT a plain int into
    // this specific T — the only per-type "glue" code needed:
    protected abstract T Of(int value);

    [Fact]
    public void Sum_ReturnsCorrectTotal()
    {
        T[] values = [Of(1), Of(2), Of(3), Of(4), Of(5)];
        Assert.Equal(Of(15), Statistics<T>.Sum(values));
    }

    [Fact]
    public void Min_ReturnsSmallestValue()
    {
        T[] values = [Of(3), Of(1), Of(2)];
        Assert.Equal(Of(1), Statistics<T>.Min(values));
    }

    [Fact]
    public void Max_ReturnsLargestValue()
    {
        T[] values = [Of(3), Of(1), Of(2)];
        Assert.Equal(Of(3), Statistics<T>.Max(values));
    }

    // ANY new test case added HERE automatically applies to EVERY
    // concrete subclass below — there is no way for one numeric type
    // to silently lose coverage that another type has.
}

// Each concrete class is now just ONE LINE of "glue" — no duplicated
// assertion logic at all:
public class StatisticsIntTests : StatisticsTestsBase<int>
{
    protected override int Of(int value) => value;
}

public class StatisticsDoubleTests : StatisticsTestsBase<double>
{
    protected override double Of(int value) => value;
}

public class StatisticsDecimalTests : StatisticsTestsBase<decimal>
{
    protected override decimal Of(int value) => value;
}`,
    },
    {
      label: 'Where per-type divergence SHOULD be tested explicitly — integer truncation vs decimal precision',
      language: 'csharp',
      code: `// The shared base class covers the COMMON behavior every T shares.
// But some behavior is GENUINELY type-specific and deserves its own,
// explicitly separate test — NOT forced into the shared base, since
// forcing it there would require every OTHER type to also exhibit
// the same edge case, which is exactly wrong:

public class StatisticsIntTests : StatisticsTestsBase<int>
{
    protected override int Of(int value) => value;

    [Fact]
    public void Average_WithIntegerDivision_TruncatesTowardZero_ButOurAverageUsesDoubleCreateChecked()
    {
        // int arithmetic alone would truncate (7/2 = 3), but the main
        // page's own Average implementation explicitly converts to
        // double BEFORE dividing (double.CreateChecked(sum) / count) —
        // this test specifically verifies THAT conversion happens
        // correctly for int, catching a regression if someone
        // "simplifies" Average to do integer division directly:
        int[] values = [3, 4]; // sum = 7, count = 2
        Assert.Equal(3.5, Statistics<int>.Average(values));  // NOT 3 (truncated)
    }
}

public class StatisticsDecimalTests : StatisticsTestsBase<decimal>
{
    protected override decimal Of(int value) => value;

    [Fact]
    public void Sum_WithHighPrecisionDecimals_PreservesExactValue()
    {
        // decimal's exact base-10 representation is a genuinely
        // different guarantee than double's binary floating point —
        // worth its OWN dedicated test, since this precision property
        // simply does not apply to int or double at all:
        decimal[] values = [0.1m, 0.2m];
        Assert.Equal(0.3m, Statistics<decimal>.Sum(values));  // EXACT
        // (the equivalent double test would need a tolerance-based
        // comparison instead, since 0.1 + 0.2 != 0.3 exactly in
        // binary floating point — a genuinely different assertion
        // shape per type, which is exactly why this test belongs
        // OUTSIDE the shared base class)
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A shared <code>StatisticsTestsBase&lt;T&gt;</code> test (from this subtopic\'s pattern) includes a test asserting <code>Average([1, 2])</code> equals exactly <code>1.5</code> for every T, including <code>double</code>. Explain why this specific assertion could become flaky for <code>double</code> in a way it never would for <code>int</code> or <code>decimal</code>, and how to fix the SHARED test without losing the shared-base-class structure.',
    hint: 'Consider that not every value that "looks exact" in decimal notation (like 1.5) is guaranteed to be represented with bit-for-bit exactness after a chain of floating-point operations — even though THIS specific value happens to be exactly representable, a slightly different set of input numbers run through the same shared test could produce a result that is correct but not bit-identical to the literal you typed.',
    solution: `// The shared test, as originally written:
public abstract class StatisticsTestsBase<T> where T : INumber<T>
{
    protected abstract T Of(int value);

    [Fact]
    public void Average_OfTwoValues_ReturnsExactMidpoint()
    {
        T[] values = [Of(1), Of(2)];
        Assert.Equal(1.5, Statistics<T>.Average(values));  // exact equality
    }
}

// WHY THIS CAN BECOME FLAKY SPECIFICALLY FOR double (but not int or
// decimal): Assert.Equal(1.5, result) performs an EXACT bit-for-bit
// comparison by default. For THIS specific input (1 and 2), the
// average (1.5) happens to be exactly representable in IEEE 754
// double-precision floating point, so the test passes reliably here.
// But if a FUTURE test case added to this SAME shared base class used
// different values — say Of(1), Of(2), Of(2) averaging to
// 1.6666666... — an exact-equality assertion against a hand-typed
// double literal could fail due to ordinary floating-point rounding
// differences between how the literal is parsed and how the
// computation actually accumulates, even though BOTH values are
// "correct" to within normal floating-point precision. int and
// decimal do not have this issue: int arithmetic here goes through
// Average's double.CreateChecked conversion but starts from EXACT
// integer sums, and decimal maintains exact base-10 precision
// throughout, making bit-exact comparison safe for those two types
// specifically for a much wider range of inputs.

// THE FIX — without abandoning the shared base class structure,
// override JUST the comparison mechanism per type, using a tolerance
// for floating-point-sensitive types:
public abstract class StatisticsTestsBase<T> where T : INumber<T>
{
    protected abstract T Of(int value);
    protected virtual void AssertAverageEqual(double expected, double actual) =>
        Assert.Equal(expected, actual);  // exact by default

    [Fact]
    public void Average_OfTwoValues_ReturnsExactMidpoint()
    {
        T[] values = [Of(1), Of(2)];
        AssertAverageEqual(1.5, Statistics<T>.Average(values));
    }
}

public class StatisticsDoubleTests : StatisticsTestsBase<double>
{
    protected override double Of(int value) => value;

    // Override JUST for double — allow a small floating-point tolerance,
    // while int and decimal subclasses keep the strict default:
    protected override void AssertAverageEqual(double expected, double actual) =>
        Assert.Equal(expected, actual, precision: 10);
}

// This keeps ONE shared set of test CASES (no duplication of WHAT is
// tested), while allowing the ASSERTION MECHANISM itself to differ
// per type where a type's own numeric characteristics genuinely
// require it — exactly the kind of per-type divergence worth handling
// deliberately rather than either ignoring it (flaky tests) or
// abandoning the shared structure entirely (duplicated test logic).`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'testing a generic math method (constrained to INumber<T>) requires either testing it once and trusting it works for all T, or writing entirely separate, independent test classes per numeric type.',
      reality: 'a shared generic test base class lets the actual test CASES be written exactly once and automatically apply to every concrete numeric type, while still allowing type-specific tests (or assertion mechanisms) for behavior that genuinely differs between types.',
    },
    {
      thought: 'if a generic math method\'s tests pass for int and decimal, they will automatically also be correct for double.',
      reality: 'floating-point types have precision and rounding characteristics that integer and decimal types do not share — exact-equality assertions that are safe for int/decimal can become flaky for double given different input values, even when the underlying computation is genuinely correct.',
    },
    {
      thought: 'edge cases like integer truncation or decimal precision preservation should be forced into the shared test base class so every numeric type is tested identically.',
      reality: 'behavior that is genuinely specific to one numeric type (integer division truncation, decimal\'s exact base-10 representation) belongs in that type\'s own dedicated test, not the shared base class, since forcing it there would incorrectly require every other type to exhibit the same type-specific behavior.',
    },
  ];
}
