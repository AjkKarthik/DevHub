import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-generic-code-parameterized-tests-across-multiple-type-arguments-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-generic-code-parameterized-tests-across-multiple-type-arguments.html',
  styleUrl: './testing-generic-code-parameterized-tests-across-multiple-type-arguments.scss',
})
export class TestingGenericCodeParameterizedTestsAcrossMultipleTypeArgumentsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main topic\'s whole pitch is "works for any type" — that claim needs a test per type',
      points: [
        'The main Generics page repeatedly emphasizes that a generic method "works for int, double, decimal" or "any custom numeric type" — this is precisely the kind of claim that should be VERIFIED across multiple type arguments, not just assumed to hold because it compiles for one. A generic method that works correctly for <code>int</code> can still behave subtly differently for <code>decimal</code> (rounding), <code>double</code> (precision), or a custom type implementing the same constraint interface incorrectly.',
      ],
    },
    {
      heading: 'xUnit Theory + InlineData across type arguments — the concrete pattern',
      points: [
        'You cannot make the TEST METHOD ITSELF generic and parameterize the type argument via <code>[InlineData]</code> directly (xUnit needs concrete runtime values, and a <code>Type</code> object passed as data doesn\'t let you write <code>Min&lt;T&gt;</code> with <code>T</code> bound at runtime) — instead, write ONE non-generic test PER representative type, or write a single test that calls the generic method with SEVERAL different type arguments explicitly inside the test body.',
        '<code>[Theory] [InlineData(3, 7, 3)] [InlineData(7, 3, 3)] [InlineData(5, 5, 5)]</code> on a test calling <code>Min(a, b)</code> with <code>int</code> arguments tests the BEHAVIOR (which value wins, tie-breaking) thoroughly for one type — then a SEPARATE test (or a second <code>[Theory]</code> using <code>string</code> arguments) verifies the same generic method\'s behavior holds for a completely different type, confirming the constraint-based logic (<code>IComparable&lt;T&gt;.CompareTo</code>) genuinely generalizes rather than accidentally only working for the one type it was informally tried with during development.',
      ],
    },
    {
      heading: 'Testing constraint-driven correctness — INumber<T> generic math specifically',
      points: [
        'For <code>Sum&lt;T&gt;(IEnumerable&lt;T&gt; source) where T : INumber&lt;T&gt;</code> from the main topic, a genuinely valuable test verifies IDENTICAL LOGICAL BEHAVIOR across <code>int</code>, <code>double</code>, and <code>decimal</code> — e.g. summing the same 3 conceptual values (as <code>int</code>, <code>double</code>, <code>decimal</code> respectively) and asserting each produces its type\'s correct total. This directly tests the main topic\'s central claim: "one generic algorithm to work across all numeric types."',
        'Pay special attention to <code>decimal</code> specifically in these tests — its different rounding/precision behavior compared to <code>double</code> can reveal edge cases (e.g. an <code>Average</code> implementation using <code>T.CreateChecked(count)</code> that behaves correctly for <code>double</code> but throws for a <code>decimal</code> input in an edge case) that a single-type manual smoke test during development would never surface.',
      ],
    },
    {
      heading: 'Testing that a MISSING constraint actually fails to compile — using a source-level check, not a runtime test',
      points: [
        'The main topic\'s "Calling a member on T without a constraint" Common Mistake produces a COMPILE ERROR (CS1061), not a runtime failure — this cannot be caught by an ordinary xUnit test at all, since a test project that fails to compile never runs. The correct verification for "this constraint is actually required" is a documented, INTENTIONAL negative compile check: keep a small commented-out reference of the broken code directly in the test file (exactly as this series\' code samples already do) as living documentation, or use a dedicated compile-time test tool if your team has one (e.g. Roslyn-based "should not compile" test helpers exist as community packages, though they add real complexity most codebases don\'t need for a single constraint check).',
        'The MORE PRACTICAL takeaway: constraint correctness is primarily verified by the COMPILER itself at every build — this is arguably BETTER test coverage than a runtime unit test could provide, since it is checked on every single compilation, not just when the test suite happens to run. Recognize this as a case where "the compiler is the test" rather than reaching for unit-test machinery to verify something the type system already guarantees.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Testing a generic method across multiple concrete types',
      language: 'csharp',
      code: `public static T Min<T>(T a, T b) where T : IComparable<T>
    => a.CompareTo(b) <= 0 ? a : b;

public class MinTests
{
    // Tests Min<int> thoroughly — including a tie case
    [Theory]
    [InlineData(3, 7, 3)]
    [InlineData(7, 3, 3)]
    [InlineData(5, 5, 5)] // tie — CompareTo returns 0, "a" should win per <= 0
    public void Min_ReturnsSmaller_ForIntegers(int a, int b, int expected)
    {
        Assert.Equal(expected, Min(a, b));
    }

    // A SEPARATE type entirely — proves the constraint-based logic
    // genuinely generalizes, not just "happens to work for int".
    [Theory]
    [InlineData("cat", "bat", "bat")]  // lexicographic ordering
    [InlineData("apple", "apple", "apple")]
    public void Min_ReturnsSmaller_ForStrings(string a, string b, string expected)
    {
        Assert.Equal(expected, Min(a, b));
    }

    // A THIRD type with different comparison semantics (dates) — the same
    // generic method, verified against yet another IComparable<T> shape.
    [Fact]
    public void Min_ReturnsEarlierDate_ForDateTime()
    {
        var earlier = new DateTime(2026, 1, 1);
        var later   = new DateTime(2026, 6, 1);

        Assert.Equal(earlier, Min(earlier, later));
        Assert.Equal(earlier, Min(later, earlier)); // order shouldn't matter
    }
}`,
    },
    {
      label: 'Testing INumber<T> generic math across numeric types',
      language: 'csharp',
      code: `using System.Numerics;

public static T Sum<T>(IEnumerable<T> source) where T : INumber<T>
{
    T total = T.Zero;
    foreach (var item in source) total += item;
    return total;
}

public class SumTests
{
    [Fact]
    public void Sum_AddsIntegersCorrectly()
    {
        Assert.Equal(10, Sum(new[] { 1, 2, 3, 4 }));
    }

    [Fact]
    public void Sum_AddsDoublesCorrectly()
    {
        Assert.Equal(7.0, Sum(new[] { 1.5, 2.5, 3.0 }));
    }

    [Fact]
    public void Sum_AddsDecimalsCorrectly_WithExactPrecision()
    {
        // decimal is the type most likely to reveal a rounding bug that
        // int and double tests alone would never surface — worth its
        // own dedicated test, not just "another INumber<T> case".
        Assert.Equal(0.3m, Sum(new[] { 0.1m, 0.1m, 0.1m }));
    }

    [Fact]
    public void Sum_ReturnsZero_ForEmptySequence()
    {
        // T.Zero (from INumber<T>) must resolve correctly for the empty case —
        // worth its own test since it's the one path that never touches +=.
        Assert.Equal(0, Sum(Array.Empty<int>()));
        Assert.Equal(0m, Sum(Array.Empty<decimal>()));
    }
}`,
    },
    {
      label: 'Why a missing constraint can\'t be caught by a runtime test',
      language: 'csharp',
      code: `// This does NOT compile — CS1061: 'T' does not contain a definition for 'CompareTo'
// public static T Min<T>(T a, T b)
// {
//     return a.CompareTo(b) <= 0 ? a : b;
// }
//
// A test PROJECT containing this code would fail to BUILD, meaning no test
// in the entire project would run at all — there is no runtime unit test
// that can "catch" a missing generic constraint, because the failure
// happens before any test code executes.
//
// The practical takeaway: constraint correctness is verified by the
// COMPILER on every single build — arguably stronger coverage than a
// unit test, since it's checked far more often than a test suite runs.
// Recognize this as a case where the type system IS the test.

// The constrained, CORRECT version compiles and is what actually ships:
public static T Min<T>(T a, T b) where T : IComparable<T>
    => a.CompareTo(b) <= 0 ? a : b;`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Write a test proving that <code>Sum&lt;T&gt;</code> produces the SAME conceptual total (12) whether the elements are provided as <code>int</code>, <code>double</code>, or <code>decimal</code> — three separate calls in one test, asserting each result equals 12 in its own type.',
    hint: 'Call Sum(new[] { 5, 3, 4 }) for int, Sum(new[] { 5.0, 3.0, 4.0 }) for double, and Sum(new[] { 5m, 3m, 4m }) for decimal — assert each against 12, 12.0, and 12m respectively in the same test method.',
    solution: `[Fact]
public void Sum_ProducesTheSameConceptualTotal_AcrossNumericTypes()
{
    Assert.Equal(12, Sum(new[] { 5, 3, 4 }));         // int
    Assert.Equal(12.0, Sum(new[] { 5.0, 3.0, 4.0 })); // double
    Assert.Equal(12m, Sum(new[] { 5m, 3m, 4m }));     // decimal

    // All three prove the SAME generic implementation produces the
    // logically correct total regardless of which INumber<T> is bound —
    // exactly the "one generic algorithm, any numeric type" claim
    // the main topic makes about INumber<T>.
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'if a generic method compiles and works correctly when manually tried with one type (e.g. int) during development, its constraint-based logic is proven to work for every type satisfying that constraint.',
      reality: 'a constraint (like IComparable&lt;T&gt; or INumber&lt;T&gt;) only guarantees the METHOD EXISTS — it says nothing about whether the algorithm behaves correctly for every type\'s specific semantics (decimal\'s rounding vs double\'s precision, for instance). Testing across multiple representative types is the only way to verify the "works for any type" claim actually holds.',
    },
    {
      thought: 'a missing generic constraint (like forgetting where T : IComparable&lt;T&gt;) is a bug category that unit tests should catch, like any other logic error.',
      reality: 'a missing constraint produces a COMPILE ERROR — the test project fails to build entirely, so no test ever runs to "catch" it. This is a case where the compiler itself is the verification mechanism, checked on every build, which is arguably stronger coverage than a unit test that only runs when the suite executes.',
    },
    {
      thought: 'testing a generic numeric algorithm (like Sum&lt;T&gt; with INumber&lt;T&gt;) only needs coverage for int and maybe double, since decimal is "just another number type."',
      reality: 'decimal\'s different rounding and precision behavior compared to double is exactly the kind of type-specific edge case a generic algorithm can silently mishandle — it deserves its own dedicated test, not just another parameterized case assumed to behave identically to int/double.',
    },
  ];
}
