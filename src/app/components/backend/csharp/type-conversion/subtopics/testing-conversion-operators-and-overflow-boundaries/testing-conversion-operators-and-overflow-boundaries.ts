import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-conversion-operators-and-overflow-boundaries-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-conversion-operators-and-overflow-boundaries.html',
  styleUrl: './testing-conversion-operators-and-overflow-boundaries.scss',
})
export class TestingConversionOperatorsAndOverflowBoundariesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s Temperature struct is demonstrated — never tested',
      points: [
        'The main Type Conversion page\'s challenge builds a full <code>Temperature</code> struct with an implicit operator from <code>double</code>, an explicit operator to <code>double</code> (Fahrenheit), and a <code>TryParse</code> method — but every example is run and printed, never asserted against in an automated test. Conversion operators and overflow boundaries are both genuinely worth testing directly, since both are easy to get subtly wrong (an off-by-one boundary, a swapped round-trip formula).',
      ],
    },
    {
      heading: 'Testing conversion operators — call them like ordinary static methods',
      points: [
        'Both <code>implicit</code> and <code>explicit</code> user-defined conversion operators compile down to ordinary static methods under the hood — they can be tested exactly like any other static method, either through the natural conversion syntax (<code>Temperature t = 100.0;</code>) or, less commonly, via the operator\'s generated method name directly through reflection (rarely necessary — the natural syntax is preferred and reads clearly in a test).',
        'The most valuable test for a conversion operator is a ROUND-TRIP test: convert in one direction, then back, and assert you get (approximately, for floating-point) the original value — this catches asymmetric bugs where the two operators\' formulas do not actually invert each other, a mistake that is easy to make when writing Celsius↔Fahrenheit-style transformations by hand.',
      ],
    },
    {
      heading: 'Testing checked overflow — asserting the exact boundary, not just "some" overflow',
      points: [
        'The main page\'s theory explains <code>checked(int.MaxValue + 1)</code> throws <code>OverflowException</code> — this is directly testable with <code>Assert.Throws&lt;OverflowException&gt;</code>, but a genuinely thorough test should also assert the boundary PRECISELY: <code>int.MaxValue</code> itself must NOT throw, while <code>int.MaxValue + 1</code> must. Testing only "some large number throws" can hide an off-by-one error in overflow-detection logic (relevant for custom checked arithmetic in libraries implementing their own numeric types).',
        'A parameterized <code>[Theory]</code> with boundary values (<code>int.MaxValue</code>, <code>int.MaxValue - 1</code>, and <code>int.MaxValue</code> plus 1 via a computed expression) directly encodes the exact overflow boundary as a permanent regression test, rather than trusting the boundary is correct from reading the arithmetic once.',
      ],
    },
    {
      heading: 'Custom TryParse deserves the same boundary-testing discipline as built-in TryParse',
      points: [
        'The main page\'s <code>Temperature.TryParse</code> handles multiple input shapes ("100C", "212F", "37.5 C", whitespace variations) — each shape, plus each REJECTION case (empty string, missing unit, non-numeric value), deserves its own explicit test case. A custom <code>TryParse</code> that silently accepts malformed input, or rejects valid input, is exactly the kind of edge-case bug that only shows up with deliberate boundary-focused test coverage, not casual manual testing.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Round-trip testing a custom conversion operator',
      language: 'csharp',
      code: `using Xunit;

// The Temperature struct from the main topic's challenge:
public readonly struct Temperature
{
    public double Celsius { get; }
    private Temperature(double celsius) => Celsius = celsius;

    public static implicit operator Temperature(double celsius) => new(celsius);
    public static explicit operator double(Temperature t) => t.Celsius * 9.0 / 5.0 + 32.0;
    public static Temperature FromFahrenheit(double f) => new((f - 32.0) * 5.0 / 9.0);
}

public class TemperatureConversionTests
{
    [Theory]
    [InlineData(0.0)]    // freezing
    [InlineData(100.0)]  // boiling
    [InlineData(37.0)]   // body temp
    [InlineData(-40.0)]  // the famous C=F crossover point
    public void CelsiusToFahrenheitAndBack_RoundTrips(double originalCelsius)
    {
        // Implicit conversion — the operator itself, called via natural syntax:
        Temperature t = originalCelsius;

        // Explicit conversion to Fahrenheit:
        double fahrenheit = (double)t;

        // Convert back using the inverse formula:
        Temperature roundTripped = Temperature.FromFahrenheit(fahrenheit);

        // Round-trip test — catches asymmetric formula bugs that a single
        // one-directional test (like the main topic's own demo) would miss:
        Assert.Equal(originalCelsius, roundTripped.Celsius, precision: 10);
    }

    [Fact]
    public void ImplicitOperator_AllowsDirectAssignmentFromDouble()
    {
        Temperature boiling = 100.0; // exercises the implicit operator directly
        Assert.Equal(100.0, boiling.Celsius);
    }

    [Fact]
    public void ExplicitOperator_ConvertsToFahrenheitCorrectly()
    {
        Temperature boiling = 100.0;
        double fahrenheit = (double)boiling; // exercises the explicit operator
        Assert.Equal(212.0, fahrenheit, precision: 5);
    }
}`,
    },
    {
      label: 'Testing the EXACT overflow boundary, not just "some large number"',
      language: 'csharp',
      code: `using Xunit;

public class OverflowBoundaryTests
{
    [Fact]
    public void MaxValue_DoesNotOverflow()
    {
        // The boundary itself must NOT throw — proving the check isn't
        // off-by-one in the "too eager" direction:
        var result = checked(int.MaxValue);
        Assert.Equal(int.MaxValue, result);
    }

    [Fact]
    public void MaxValuePlusOne_ThrowsOverflowException()
    {
        // Exactly one past the boundary MUST throw — proving the check
        // isn't off-by-one in the "too lenient" direction:
        Assert.Throws<OverflowException>(() => checked(int.MaxValue + 1));
    }

    [Fact]
    public void MaxValueMinusOnePlusOne_DoesNotOverflow()
    {
        // A value just BELOW the boundary, incremented by exactly one,
        // should land EXACTLY on MaxValue without throwing — pins down
        // the boundary from the other side too:
        var result = checked((int.MaxValue - 1) + 1);
        Assert.Equal(int.MaxValue, result);
    }

    [Fact]
    public void Unchecked_WrapsInsteadOfThrowing()
    {
        // Proves the DEFAULT (unchecked) behavior the main topic describes —
        // this should NOT throw, and should wrap to MinValue:
        var result = unchecked(int.MaxValue + 1);
        Assert.Equal(int.MinValue, result);
    }
}`,
    },
    {
      label: 'Boundary-testing a custom TryParse — every shape, every rejection',
      language: 'csharp',
      code: `using Xunit;

public class TemperatureTryParseTests
{
    [Theory]
    [InlineData("100C", 100.0)]
    [InlineData("212F", 100.0)]      // Fahrenheit converted to Celsius
    [InlineData("37.5 C", 37.5)]     // whitespace before unit
    [InlineData("  0C  ", 0.0)]      // leading/trailing whitespace
    [InlineData("98.6f", 37.0)]      // lowercase unit
    public void TryParse_ValidInput_ReturnsExpectedCelsius(string input, double expectedCelsius)
    {
        bool ok = Temperature.TryParse(input, out Temperature result);

        Assert.True(ok);
        Assert.Equal(expectedCelsius, result.Celsius, precision: 1);
    }

    [Theory]
    [InlineData("")]              // empty
    [InlineData("   ")]           // whitespace only
    [InlineData("100")]           // missing unit
    [InlineData("100K")]          // invalid unit (Kelvin not supported)
    [InlineData("abcC")]          // non-numeric value
    [InlineData(null)]            // null input
    public void TryParse_InvalidInput_ReturnsFalse(string? input)
    {
        bool ok = Temperature.TryParse(input!, out Temperature result);

        Assert.False(ok);
        Assert.Equal(default, result); // out param set to default, not left uninitialized
    }
}
// Each rejection case here maps to a genuinely distinct way the custom
// parser could fail — missing unit, wrong unit, non-numeric value, empty
// input — exactly the boundary-testing discipline the main topic's own
// built-in TryParse coverage (int.TryParse, double.TryParse) deserves
// when applied to a hand-written parser too.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Write a test proving that <code>Temperature.TryParse</code> correctly rejects the input <code>"C"</code> (a unit character with no numeric value at all) without throwing an unhandled exception.',
    hint: 'Trace through the TryParse implementation from the main topic\'s challenge: it reads the LAST character as the unit, then tries to parse everything BEFORE that as a double. For the input "C", after removing the unit character, the remaining string to parse is empty — think about what double.TryParse does with an empty string, and whether that path is safely handled.',
    solution: `[Fact]
public void TryParse_UnitWithNoNumericValue_ReturnsFalse()
{
    // "C" — after extracting the unit character 'C', the remaining
    // substring to parse as a double is "" (empty). double.TryParse on
    // an empty string returns false (not an exception) — so TryParse
    // should correctly propagate that failure and return false overall,
    // without throwing:
    bool ok = Temperature.TryParse("C", out Temperature result);

    Assert.False(ok);
    Assert.Equal(default, result);
}

// This test specifically targets the boundary where the "strip the last
// character, parse the rest" logic could go wrong — e.g. if someone
// later "optimizes" the parsing and accidentally assumes the remaining
// substring is always non-empty, this test would catch the regression
// immediately, rather than relying on double.TryParse's own safe
// empty-string handling to save the day silently.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'testing "checked(int.MaxValue + 1) throws OverflowException" is sufficient to verify overflow-checking logic is correct.',
      reality: 'a thorough boundary test also verifies the NON-overflowing side — that int.MaxValue itself, and int.MaxValue - 1 incremented by one, do NOT throw — catching an off-by-one error that a single "large number throws" test would miss entirely.',
    },
    {
      thought: 'a custom implicit/explicit conversion operator can only be exercised by manually running code and reading printed output, since it is special compiler syntax rather than an ordinary method.',
      reality: 'user-defined conversion operators compile down to ordinary static methods and can be tested exactly like any other static method, using the natural conversion syntax (assignment for implicit, a cast for explicit) directly inside test assertions.',
    },
    {
      thought: 'testing a custom TryParse method only requires confirming it accepts a few valid inputs correctly.',
      reality: 'a thorough test suite for a custom TryParse also needs dedicated rejection tests for each distinct way input can be malformed (missing unit, wrong unit, non-numeric value, empty string, null) — mirroring the same boundary-testing discipline expected of built-in TryParse methods.',
    },
  ];
}
