import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-iparsable-tryparse-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-iparsable-tryparse-graceful-failure-daterange.html',
  styleUrl: './testing-iparsable-tryparse-graceful-failure-daterange.scss',
})
export class TestingIparsableTryparseGracefulFailureDaterangeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own DateRange example wraps Parse in a blanket try/catch inside TryParse — this is exactly the kind of "catches everything, but does it actually work for every malformed input?" logic that needs a real test',
      points: [
        'The main Model Binding page\'s <code>DateRange</code> example implements <code>IParsable&lt;DateRange&gt;</code> with <code>Parse</code> splitting a string on <code>".."</code> and parsing each half as a <code>DateOnly</code>, and <code>TryParse</code> wrapping that in a bare <code>try { r = Parse(s ?? "", p); return true; } catch { r = default; return false; }</code>. This is a common, reasonable pattern — but a blanket <code>catch</code> block hides WHICH kinds of malformed input actually get handled gracefully versus which might throw an exception type the framework does not expect from a model binder at all.',
      ],
    },
    {
      heading: 'A model binder is expected to fail via TryParse returning false, not by throwing — a test can enumerate every malformed input shape a real query string could actually contain and prove TryParse never lets an exception escape',
      points: [
        'ASP.NET Core\'s binding infrastructure calls <code>TryParse</code>, not <code>Parse</code>, for query and route parameters — it expects a boolean result, not an exception, to signal failure. Since <code>Parse</code> in the main page\'s own example calls <code>s.Split("..")[0]</code> and <code>[1]</code> directly, a string with ZERO occurrences of <code>".."</code> (e.g. a plain single date, or an empty string) produces an array with only ONE element, and indexing <code>[1]</code> throws <code>IndexOutOfRangeException</code> — a DIFFERENT exception type than the <code>FormatException</code> a malformed date string would throw. A test can verify the blanket <code>catch</code> genuinely covers BOTH exception shapes, not just the one a developer happened to think of while writing it.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own DateRange IParsable implementation, tested against every malformed input shape a real query string could contain',
      language: 'csharp',
      code: `// The main page's own IParsable<DateRange> implementation, unchanged:
public readonly record struct DateRange(DateOnly From, DateOnly To)
    : IParsable<DateRange>
{
    public static DateRange Parse(string s, IFormatProvider? _)
    {
        var p = s.Split("..");
        return new DateRange(DateOnly.Parse(p[0]), DateOnly.Parse(p[1]));
    }
    public static bool TryParse(string? s, IFormatProvider? p, out DateRange r)
    {
        try  { r = Parse(s ?? "", p); return true;  }
        catch { r = default;          return false; }
    }
}

public class DateRangeParsingTests
{
    [Theory]
    [InlineData("2024-01-01..2024-03-31", true)]     // valid — the happy path
    [InlineData("2024-01-01", false)]                 // NO ".." separator at all
    [InlineData("", false)]                            // empty string
    [InlineData("not-a-date..2024-03-31", false)]     // malformed first half
    [InlineData("2024-01-01..not-a-date", false)]     // malformed second half
    [InlineData("2024-01-01..2024-03-31..extra", false)]  // TOO MANY segments
    public void TryParse_NeverThrows_ForAnyMalformedInput(string input, bool expectedSuccess)
    {
        // The critical assertion isn't just "did it return the right
        // bool" — it's that calling TryParse AT ALL never lets an
        // exception escape, regardless of which malformed shape is fed
        // in. If any of these inputs threw instead of returning false,
        // this test call itself would fail with an unhandled exception,
        // not a failed assertion:
        var success = DateRange.TryParse(input, null, out var result);

        Assert.Equal(expectedSuccess, success);
        if (!expectedSuccess)
            Assert.Equal(default, result);
    }
}`,
    },
    {
      label: 'Proving the SPECIFIC exception type differs across malformed inputs — and why the blanket catch happens to save this implementation anyway',
      language: 'csharp',
      code: `public class DateRangeParseExceptionShapeTests
{
    [Fact]
    public void Parse_WithNoSeparator_ThrowsIndexOutOfRangeException_NotFormatException()
    {
        // "2024-01-01".Split("..") produces a ONE-element array —
        // 'p[1]' throws IndexOutOfRangeException, NOT the FormatException
        // a malformed date string would throw. This is worth knowing
        // explicitly, even though TryParse's blanket catch handles both:
        var ex = Record.Exception(() => DateRange.Parse("2024-01-01", null));

        Assert.IsType<IndexOutOfRangeException>(ex);
    }

    [Fact]
    public void Parse_WithMalformedDate_ThrowsFormatException()
    {
        // "not-a-date..2024-03-31".Split("..") DOES produce a two-element
        // array — the exception here comes from DateOnly.Parse itself
        // failing on "not-a-date", which is a FormatException — a
        // DIFFERENT exception type than the previous test:
        var ex = Record.Exception(() => DateRange.Parse("not-a-date..2024-03-31", null));

        Assert.IsType<FormatException>(ex);
    }

    // THE TAKEAWAY: TryParse's bare 'catch { }' (catching System.Exception)
    // happens to correctly swallow BOTH exception types in this specific
    // implementation — but that is worth PROVING with a test, not just
    // assuming, since a bare catch block gives no indication to a reader
    // of WHICH specific exceptions it is actually relied upon to catch.
    // A future refactor that narrows the catch to 'catch (FormatException)'
    // ONLY — a seemingly reasonable "be more specific" cleanup — would
    // silently reintroduce the IndexOutOfRangeException as an unhandled
    // exception for the "no separator" input shape, and ONLY a test
    // exercising that specific malformed shape would catch the regression.
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Given that narrowing TryParse\'s catch block to only FormatException would silently reintroduce IndexOutOfRangeException as an unhandled exception for input with no ".." separator, propose a more explicit fix to the Parse method itself that would make BOTH failure modes throw the SAME exception type — making a future narrowed catch block safe rather than fragile.',
    hint: 'Consider validating the shape of the split array explicitly (checking its length) BEFORE indexing into it, and throwing a single, deliberate exception type (like FormatException) for both "wrong number of segments" and "invalid date" cases.',
    solution: `A more robust Parse implementation validates the split result's shape
explicitly before indexing into it, and throws a single, consistent
exception type for every failure mode — making the method's contract
clear without relying on a blanket catch to paper over inconsistent
exception types:

public static DateRange Parse(string s, IFormatProvider? _)
{
    var parts = s.Split("..");

    // Explicitly validate shape BEFORE indexing — this converts the
    // previously-silent IndexOutOfRangeException into a deliberate,
    // consistent FormatException, matching what DateOnly.Parse already
    // throws for a malformed date:
    if (parts.Length != 2)
        throw new FormatException(
            $"Expected exactly one '..' separator, got {parts.Length - 1} in '{s}'.");

    return new DateRange(DateOnly.Parse(parts[0]), DateOnly.Parse(parts[1]));
}

public static bool TryParse(string? s, IFormatProvider? p, out DateRange r)
{
    try  { r = Parse(s ?? "", p); return true;  }
    catch (FormatException) { r = default; return false; }   // NOW safe to narrow
}

With this fix, EVERY failure path throws FormatException — the
"no separator" case, the "too many separators" case, and the
"malformed date" case all throw the SAME exception type. This means
TryParse's catch block can be safely NARROWED to
catch (FormatException) specifically, rather than needing a bare
catch { } that risks silently swallowing an unrelated bug (like a
NullReferenceException from an entirely different mistake introduced
later) along with the failures it's actually meant to handle.

The broader testing lesson this reinforces: the tests from this
subtopic's first two code tabs would need to be RE-RUN after this fix
to confirm the exception-type tests now both assert FormatException
instead of two different types — exactly the kind of regression a
test suite catches immediately, rather than requiring a developer to
remember to manually re-verify exception shapes after refactoring a
model binder's internals.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a blanket catch { } block inside TryParse is inherently a code smell that should always be narrowed to a specific exception type.',
      reality: 'narrowing it prematurely — without first confirming EVERY failure path in Parse throws the same exception type — can silently reintroduce an unhandled exception for a failure shape the narrower catch no longer covers, exactly as demonstrated with IndexOutOfRangeException in this subtopic.',
    },
    {
      thought: 'testing an IParsable<T> implementation only requires confirming TryParse returns the correct boolean for a handful of obviously-valid and obviously-invalid inputs.',
      reality: 'the more valuable test enumerates every DISTINCT malformed shape a real query string could contain (missing separator, too many separators, malformed sub-values, empty string) — since each shape can trigger a genuinely different exception type internally, even though TryParse\'s external contract looks the same for all of them.',
    },
    {
      thought: 'ASP.NET Core\'s model binding infrastructure calls Parse directly and handles any resulting exception itself.',
      reality: 'the binding infrastructure calls TryParse specifically, expecting a boolean result — an IParsable<T> implementation whose TryParse lets any exception escape (rather than catching it and returning false) breaks that contract and can produce an unhandled 500 error instead of the expected 400 Bad Request.',
    },
  ];
}
