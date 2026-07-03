import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-exhaustiveness-reflection-coverage-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-exhaustiveness-reflection-coverage.html',
  styleUrl: './testing-exhaustiveness-reflection-coverage.scss',
})
export class TestingExhaustivenessCatchingNewSubtypesWithReflectionBasedCoverageTestsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'CS8509 catches the switch — it does not catch your tests',
      points: [
        'The main topic explains that adding a new subtype to a sealed hierarchy produces a CS8509 warning everywhere the hierarchy is switched on — a genuine compile-time safety net for the PRODUCTION code. But CS8509 says nothing about your TEST SUITE: you can add a new subtype, dutifully add a new arm to satisfy the compiler, and still never write a test for that new arm — the suite silently loses coverage while looking green.',
      ],
    },
    {
      heading: 'A reflection-based test that enumerates the sealed hierarchy itself',
      points: [
        'Rather than relying on a developer to remember to add a test case for each new subtype, a single test can use reflection to discover every concrete subtype of the sealed base at runtime (<code>typeof(Shape).Assembly.GetTypes().Where(t => t.IsSubclassOf(typeof(Shape)) && !t.IsAbstract)</code>) and assert that a matching test-data entry exists for each one.',
        'This test FAILS the moment a new subtype is added without a corresponding test case — closing the exact gap CS8509 leaves open. It converts "did we forget to test the new case?" from a code-review judgment call into an automatically enforced, self-updating check.',
      ],
    },
    {
      heading: 'Two different exhaustiveness guarantees, two different mechanisms',
      points: [
        'CS8509 (compiler): "does every VALUE of this type have a matching switch ARM?" — checked at compile time, for one specific switch expression at a time.',
        'The reflection test (runtime, test-suite level): "does every SUBTYPE have a corresponding TEST CASE?" — checked once per test run, and it covers the whole hierarchy\'s test coverage in one assertion rather than one switch expression.',
        'Neither one substitutes for the other: CS8509 protects a specific piece of production dispatch logic; the reflection test protects the test suite\'s own completeness as the domain model grows. Both are needed for genuine long-term safety on a growing sealed hierarchy.',
      ],
    },
    {
      heading: 'Making the failure message point straight at the fix',
      points: [
        'A well-written coverage test should report exactly WHICH subtype is missing a test case by name, not just "coverage check failed" — this turns a future developer\'s CI failure into an immediate, actionable to-do rather than a debugging exercise.',
        'Combine this with <code>[Theory]</code>/<code>[MemberData]</code> (from the main C# hub\'s xUnit-based testing conventions) to parameterize the actual behavioral assertions per subtype, while the separate reflection-based test guards ONLY that the set of tested subtypes matches the set of actual subtypes.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The gap — CS8509 satisfied, but the new arm is untested',
      language: 'csharp',
      code: `// Domain model — a sealed hierarchy, exactly like the main topic's Shape example
public abstract record Shape;
public record Circle(double Radius) : Shape;
public record Rectangle(double W, double H) : Shape;

public static class AreaCalculator
{
    public static double Area(Shape shape) => shape switch
    {
        Circle c    => Math.PI * c.Radius * c.Radius,
        Rectangle r => r.W * r.H,
        // Exhaustive today — CS8509 stays silent, compiler is satisfied.
    };
}

// Existing tests — written when only Circle and Rectangle existed:
public class AreaCalculatorTests
{
    [Fact]
    public void Circle_ComputesArea() =>
        Assert.Equal(Math.PI * 25, AreaCalculator.Area(new Circle(5)), precision: 5);

    [Fact]
    public void Rectangle_ComputesArea() =>
        Assert.Equal(24, AreaCalculator.Area(new Rectangle(4, 6)));
}

// Six months later, a teammate adds Triangle:
public record Triangle(double Base, double Height) : Shape;
// The switch above now gets CS8509 — they add an arm to fix the warning:
//   Triangle t => 0.5 * t.Base * t.Height,
// The compiler is satisfied. But NO new [Fact] was added for Triangle —
// nothing in the test suite tells anyone this happened. It ships untested.`,
    },
    {
      label: 'Closing the gap — a reflection-based exhaustiveness test',
      language: 'csharp',
      code: `using System.Reflection;
using Xunit;

public class ShapeCoverageTests
{
    // Every concrete (non-abstract) subtype of Shape, discovered at runtime —
    // no hand-maintained list to forget to update.
    public static IEnumerable<object[]> AllShapeSubtypes() =>
        typeof(Shape).Assembly.GetTypes()
            .Where(t => t.IsSubclassOf(typeof(Shape)) && !t.IsAbstract)
            .Select(t => new object[] { t });

    // The set of subtypes THIS TEST SUITE actually exercises —
    // maintained by hand, deliberately, as the thing being checked.
    private static readonly HashSet<Type> TestedShapeTypes = new()
    {
        typeof(Circle),
        typeof(Rectangle),
        // Triangle is NOT listed yet — this is the point.
    };

    [Theory]
    [MemberData(nameof(AllShapeSubtypes))]
    public void EveryShapeSubtype_HasATestCase(Type shapeType)
    {
        Assert.True(
            TestedShapeTypes.Contains(shapeType),
            $"'{shapeType.Name}' is a Shape subtype with no corresponding test case in " +
            $"{nameof(ShapeCoverageTests)}.{nameof(TestedShapeTypes)}. Add a test for it " +
            $"before this check will pass — CS8509 only checks the switch is exhaustive, " +
            $"not that {shapeType.Name} is actually tested.");
    }
}

// Running this AFTER Triangle is added (but before a test is written for it):
//   FAIL: EveryShapeSubtype_HasATestCase(Triangle)
//   'Triangle' is a Shape subtype with no corresponding test case...
//
// This fails LOUDLY and BY NAME — exactly the gap CS8509 alone cannot close,
// because CS8509 only ever asks "is the switch exhaustive?", never
// "is the TEST SUITE exhaustive?"`,
    },
    {
      label: 'The fix — add the test, then the coverage check passes',
      language: 'csharp',
      code: `public class ShapeCoverageTests
{
    public static IEnumerable<object[]> AllShapeSubtypes() =>
        typeof(Shape).Assembly.GetTypes()
            .Where(t => t.IsSubclassOf(typeof(Shape)) && !t.IsAbstract)
            .Select(t => new object[] { t });

    private static readonly HashSet<Type> TestedShapeTypes = new()
    {
        typeof(Circle),
        typeof(Rectangle),
        typeof(Triangle), // added alongside the actual behavioral test below
    };

    [Theory]
    [MemberData(nameof(AllShapeSubtypes))]
    public void EveryShapeSubtype_HasATestCase(Type shapeType) =>
        Assert.True(TestedShapeTypes.Contains(shapeType),
            $"'{shapeType.Name}' has no test case — see {nameof(ShapeCoverageTests)}.");
}

public class AreaCalculatorTests
{
    [Fact]
    public void Triangle_ComputesArea() =>
        Assert.Equal(12, AreaCalculator.Area(new Triangle(3, 8)));

    // ... existing Circle/Rectangle tests unchanged
}

// Now both the compiler (CS8509 — production dispatch is exhaustive) AND the
// test suite (ShapeCoverageTests — every subtype has real behavioral
// coverage) genuinely agree the hierarchy is fully handled.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The <code>TestedShapeTypes</code> set is maintained by hand — a developer could add a new shape subtype AND remember to update <code>TestedShapeTypes</code> without ever writing a real behavioral test, defeating the whole point. Suggest a stronger version of this check that does not rely on a second hand-maintained list at all.',
    hint: 'Instead of hand-maintaining a set of "tested" types, consider deriving the "tested" set directly from the test suite itself — e.g. reflecting over the [Theory]/[InlineData] entries actually used by AreaCalculatorTests, or having the calculator test class expose the shapes it covers, so there is only ONE source of truth instead of two lists that can drift apart.',
    solution: `// Stronger version — derive "tested" types from the [InlineData] the real
// behavioral test theory actually uses, so there is only ONE list to maintain:

public class AreaCalculatorTests
{
    public static IEnumerable<object[]> ShapesWithExpectedAreas() =>
        new List<object[]>
        {
            new object[] { new Circle(5), Math.PI * 25 },
            new object[] { new Rectangle(4, 6), 24.0 },
            new object[] { new Triangle(3, 8), 12.0 },
        };

    [Theory]
    [MemberData(nameof(ShapesWithExpectedAreas))]
    public void Area_MatchesExpected(Shape shape, double expected) =>
        Assert.Equal(expected, AreaCalculator.Area(shape), precision: 5);
}

public class ShapeCoverageTests
{
    [Fact]
    public void EveryShapeSubtype_IsCoveredByAreaCalculatorTests()
    {
        var allSubtypes = typeof(Shape).Assembly.GetTypes()
            .Where(t => t.IsSubclassOf(typeof(Shape)) && !t.IsAbstract)
            .ToHashSet();

        // Derive "tested" types directly from the real test data —
        // no second hand-maintained list that can silently drift out of sync.
        var testedTypes = AreaCalculatorTests.ShapesWithExpectedAreas()
            .Select(data => ((Shape)data[0]).GetType())
            .ToHashSet();

        var untested = allSubtypes.Except(testedTypes);
        Assert.True(!untested.Any(),
            $"Untested Shape subtypes: {string.Join(", ", untested.Select(t => t.Name))}");
    }
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the compiler\'s CS8509 exhaustiveness warning means the new subtype is fully handled and safe to ship.',
      reality: 'CS8509 only checks that a switch expression has an ARM for every subtype — it says nothing about whether that arm\'s behavior is actually tested. A new subtype can satisfy the compiler and still ship with zero test coverage.',
    },
    {
      thought: 'the only way to catch an untested new subtype is careful code review, since the compiler already checks the switch itself.',
      reality: 'a reflection-based test that enumerates the sealed hierarchy\'s concrete subtypes at runtime and asserts each has a corresponding test case turns this into an automated, self-updating CI check — no code-review vigilance required.',
    },
    {
      thought: 'a hand-maintained "list of tested types" used purely for a coverage-check test is just as reliable as deriving that list from the actual test data.',
      reality: 'a hand-maintained coverage list can itself drift out of sync — the strongest version derives the "tested" set directly from the real behavioral test\'s own data source, so there is exactly one list to keep up to date, not two.',
    },
  ];
}
