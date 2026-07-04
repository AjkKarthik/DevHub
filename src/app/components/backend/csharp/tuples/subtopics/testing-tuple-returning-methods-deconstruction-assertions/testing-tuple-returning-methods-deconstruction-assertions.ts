import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-tuple-returning-methods-deconstruction-assertions-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-tuple-returning-methods-deconstruction-assertions.html',
  styleUrl: './testing-tuple-returning-methods-deconstruction-assertions.scss',
})
export class TestingTupleReturningMethodsDeconstructionAssertionsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page never shows a test for its own tuple-returning examples',
      points: [
        'The main Tuples & Anonymous Types page\'s <code>Analyse(int[] numbers)</code> challenge, and its <code>TryParse</code>/<code>Stats</code> examples, are all demonstrated by printing output — never asserted against in a test. Testing a tuple-returning method has a genuinely different shape than testing an ordinary object-returning method, worth understanding directly.',
      ],
    },
    {
      heading: 'Assert.Equal on a whole tuple leverages ValueTuple\'s own structural equality',
      points: [
        'Because <code>ValueTuple</code> implements <code>IEquatable&lt;T&gt;</code> with element-by-element value equality (exactly as the main page\'s own theory states), <code>Assert.Equal((1, "Alice"), result)</code> works CORRECTLY out of the box — no custom comparer needed, and this is usually the SIMPLEST, most complete way to test a tuple-returning method in one assertion.',
        'This single-assertion approach is preferable to individually asserting each element (<code>Assert.Equal(1, result.Item1); Assert.Equal("Alice", result.Item2);</code>) — the whole-tuple comparison is more concise AND fails with a clearer combined message showing the entire expected/actual tuple, rather than isolated per-field failures that require piecing together.',
      ],
    },
    {
      heading: 'The real pitfall — testing via NAMED FIELD ACCESS silently survives a reordering bug that positional equality would catch',
      points: [
        'Because tuple field NAMES are compile-time-only (the main page\'s own core theory), a test asserting <code>Assert.Equal("Alice", result.Name); Assert.Equal(30, result.Age);</code> is BOUND TO THE NAMES the test author chose to reference — if the METHOD\'S return type later reorders its positional elements (e.g. swapping which position holds Name vs Age) WITHOUT updating the field names consistently, per-field name-based assertions can silently continue passing against the WRONG position if the test happens to name its own local variables to match, or fail confusingly if the compiler infers different positional names.',
        'A whole-tuple <code>Assert.Equal</code> comparing against a literal tuple value (<code>Assert.Equal((Name: "Alice", Age: 30), result)</code>) is actually MORE robust here — it compares POSITIONALLY, exactly matching how the runtime ACTUALLY sees the tuple, rather than relying on named-field access that could theoretically be pointed at the wrong compile-time position after a signature change elsewhere.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The simplest, most complete test — whole-tuple equality',
      language: 'csharp',
      code: `using Xunit;

// The main topic's own Analyse method:
static (int Min, int Max, double Average, int Range) Analyse(int[] numbers)
{
    int min = numbers.Min();
    int max = numbers.Max();
    return (min, max, numbers.Average(), max - min);
}

public class AnalyseTests
{
    [Fact]
    public void Analyse_ReturnsCorrectStatistics()
    {
        var result = Analyse(new[] { 3, 7, 1, 9, 4, 6 });

        // ONE assertion, leveraging ValueTuple's own structural equality —
        // the main topic's own theory ("ValueTuple implements IEquatable<T>")
        // applies directly here:
        Assert.Equal((1, 9, 5.0, 8), result);

        // This is simpler AND produces a clearer combined failure message
        // than asserting each field separately would.
    }
}`,
    },
    {
      label: 'The pitfall — name-based assertions can mask a positional reordering bug',
      language: 'csharp',
      code: `// Original signature — Name first, Age second:
static (string Name, int Age) GetUser() => ("Alice", 30);

public class WeakUserTests
{
    [Fact]
    public void GetUser_ReturnsExpectedNameAndAge()
    {
        var result = GetUser();

        // Testing via NAMED FIELD ACCESS — looks safe, but is bound to
        // whatever position ".Name" and ".Age" currently alias:
        Assert.Equal("Alice", result.Name);
        Assert.Equal(30, result.Age);
    }
}

// Now imagine the method's signature is later "refactored" — someone
// swaps the DECLARED field order but forgets the actual VALUES follow:
static (int Age, string Name) GetUserBuggy() => ("Alice", 30);
// COMPILE ERROR here actually — types don't match (string vs int) —
// this SPECIFIC reordering bug is caught by the type system immediately.
// But consider a same-type reordering, which is NOT caught:

static (string Name, string Nickname) GetUserRenamed() => ("Bob", "Alice");
// If the ORIGINAL test's field names ("Name") happen to still exist
// (just now meaning something different — the person's ACTUAL name
// changed position or meaning), a name-based assertion could silently
// test the WRONG semantic value without any compile error at all,
// since both positions are still type "string".`,
    },
    {
      label: 'The more robust fix — assert against a literal positional tuple',
      language: 'csharp',
      code: `static (string Name, int Age) GetUser() => ("Alice", 30);

public class RobustUserTests
{
    [Fact]
    public void GetUser_MatchesExpectedTupleExactly()
    {
        var result = GetUser();

        // Asserting against a literal tuple compares POSITIONALLY —
        // exactly matching how the RUNTIME actually sees the value,
        // rather than trusting named-field access that is purely a
        // compile-time alias:
        Assert.Equal(("Alice", 30), result);

        // This test would immediately show a clear diff if the method's
        // ACTUAL returned values ever changed position or meaning,
        // regardless of what the compile-time field names happen to be
        // called at the call site — it tests the real runtime shape,
        // not an assumption about which name means what.
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Write a test for the main topic\'s own <code>TryParse(string input)</code> example (returning <code>(bool Success, string Message, int Code)</code>) that verifies BOTH the success case AND the failure case, using whole-tuple equality assertions.',
    hint: 'Call the method with a valid numeric string and assert the expected (true, "Parsed OK", <parsed value>) tuple; call it again with an invalid string and assert the expected (false, "Not a number", -1) tuple — both as single Assert.Equal calls against literal tuple values, exactly the pattern from the robust-fix example.',
    solution: `static (bool Success, string Message, int Code) TryParse(string input)
{
    if (int.TryParse(input, out int n))
        return (true, "Parsed OK", n);
    return (false, "Not a number", -1);
}

public class TryParseTests
{
    [Fact]
    public void TryParse_ValidNumber_ReturnsSuccessTuple()
    {
        var result = TryParse("42");

        // Single, whole-tuple assertion covering all three fields at once:
        Assert.Equal((true, "Parsed OK", 42), result);
    }

    [Fact]
    public void TryParse_InvalidNumber_ReturnsFailureTuple()
    {
        var result = TryParse("not-a-number");

        Assert.Equal((false, "Not a number", -1), result);
    }
}

// Both tests exercise the FULL tuple shape in one assertion each — no
// need for three separate Assert.Equal calls per test case, and both
// compare against the literal, positionally-accurate expected value
// rather than relying on named-field access that could theoretically
// drift from the actual runtime positions.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'testing a tuple-returning method by asserting on each named field individually (result.Name, result.Age) is just as safe as comparing the whole tuple at once.',
      reality: 'named field access is a compile-time-only alias — a whole-tuple comparison against a literal value tests the ACTUAL runtime positions directly, which is more robust against a scenario where field meaning or position drifts in ways the type system alone would not catch.',
    },
    {
      thought: 'ValueTuple needs a custom equality comparer or manual field-by-field comparison to be tested properly with Assert.Equal.',
      reality: 'ValueTuple already implements IEquatable<T> with structural, element-by-element equality — Assert.Equal((expected1, expected2), actual) works correctly out of the box, and is usually the simplest, most complete way to test a tuple-returning method.',
    },
    {
      thought: 'testing multiple fields of a returned tuple always requires multiple separate Assert.Equal calls, one per field.',
      reality: 'a single Assert.Equal comparing the entire tuple against a literal expected tuple value covers every field in one assertion, and produces a clearer combined failure message than several isolated per-field assertions would.',
    },
  ];
}
