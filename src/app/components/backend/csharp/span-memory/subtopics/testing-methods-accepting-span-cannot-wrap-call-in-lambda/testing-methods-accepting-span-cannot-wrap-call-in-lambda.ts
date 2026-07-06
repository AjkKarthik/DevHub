import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-methods-accepting-span-cannot-wrap-call-in-lambda-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-methods-accepting-span-cannot-wrap-call-in-lambda.html',
  styleUrl: './testing-methods-accepting-span-cannot-wrap-call-in-lambda.scss',
})
export class TestingMethodsAcceptingSpanCannotWrapCallInLambdaSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own ref-struct restrictions apply directly to a common xUnit assertion pattern',
      points: [
        'The main Span & Memory page states <code>Span&lt;T&gt;</code>, being a ref struct, "cannot be a field in a class, cannot be boxed, cannot be used across await points, and cannot be stored in arrays." A closely related restriction the main page does not spell out: a LOCAL VARIABLE of a ref struct type CANNOT be CAPTURED by a lambda expression or local function that is converted to a delegate — because that lambda, once it captures ANY outer variable, is compiled into a heap-allocated closure class, and a ref struct can never be a field on any class, closure or otherwise.',
      ],
    },
    {
      heading: 'This directly breaks the natural-looking xUnit pattern: Assert.Throws(() => method(mySpan))',
      points: [
        'The instinctive way to test that a method throws for invalid input — <code>Assert.Throws&lt;ArgumentException&gt;(() =&gt; Parse(mySpanVariable));</code> — is a COMPILE ERROR the moment <code>mySpanVariable</code> is a local variable declared OUTSIDE the lambda and then referenced (captured) from inside it. The compiler rejects this specific pattern with an error like "Cannot use local \'mySpanVariable\' of type \'Span&lt;char&gt;\' inside an anonymous method, lambda expression, query expression, or local function because it is a ref struct."',
      ],
    },
    {
      heading: 'The fix: construct the span INSIDE the lambda, or use a local function/direct call instead',
      points: [
        'A span CAN be created and used entirely WITHIN a lambda\'s own body without being "captured" from an outer scope — <code>Assert.Throws&lt;ArgumentException&gt;(() =&gt; Parse("bad-input".AsSpan()));</code> compiles fine, because the span is constructed FRESH inside the lambda, never referencing a variable declared outside it.',
        'When the span genuinely needs to be built ahead of time (e.g. constructed via several setup steps before the assertion), the cleanest fix is to skip the lambda-based assertion helper entirely and use a plain try/catch block, or call the method directly and check for the exception with a local (non-capturing) helper — sidestepping the ref-struct-capture restriction altogether rather than fighting it.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The compile error — capturing a Span<T> local variable in a lambda',
      language: 'csharp',
      code: `using Xunit;

static int ParseFirstNumber(ReadOnlySpan<char> input)
{
    if (!int.TryParse(input, out int result))
        throw new FormatException("Not a valid number");
    return result;
}

public class SpanParsingTests
{
    [Fact]
    public void ParseFirstNumber_InvalidInput_Throws()
    {
        ReadOnlySpan<char> badInput = "not-a-number".AsSpan();

        // COMPILE ERROR — CS8175: "Cannot use ref local 'badInput'
        // inside an anonymous method, lambda expression, or query
        // expression" — the lambda would need to CAPTURE badInput,
        // and a ref struct can never be a field on the heap-allocated
        // closure class the compiler generates for a capturing lambda:
        Assert.Throws<FormatException>(() => ParseFirstNumber(badInput));
    }
}`,
    },
    {
      label: 'Fix 1 — construct the span INSIDE the lambda body, so nothing is captured',
      language: 'csharp',
      code: `public class SpanParsingTestsFixed
{
    [Fact]
    public void ParseFirstNumber_InvalidInput_Throws()
    {
        // The span is built FRESH, entirely within the lambda's own
        // body — no outer local variable is referenced, so there is
        // nothing for the lambda to "capture" at all. This compiles
        // and runs correctly:
        Assert.Throws<FormatException>(() =>
            ParseFirstNumber("not-a-number".AsSpan()));
    }
}`,
    },
    {
      label: 'Fix 2 — skip the lambda-based helper entirely with a plain try/catch',
      language: 'csharp',
      code: `public class SpanParsingTestsTryCatch
{
    [Fact]
    public void ParseFirstNumber_InvalidInput_Throws()
    {
        // When the span genuinely needs multi-step setup before the
        // assertion (making "construct it inline" awkward), a plain
        // try/catch sidesteps the ref-struct-capture restriction
        // entirely — no lambda, no capture, no compile error:
        ReadOnlySpan<char> badInput = BuildComplexTestInput(); // imagine
                                                                 // several
                                                                 // setup
                                                                 // steps here

        try
        {
            ParseFirstNumber(badInput);
            Assert.Fail("Expected FormatException was not thrown");
        }
        catch (FormatException)
        {
            // expected — test passes
        }
    }

    static ReadOnlySpan<char> BuildComplexTestInput() => "not-a-number".AsSpan();
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A test needs to verify that <code>ParseFirstNumber</code> correctly parses a span built from string concatenation across two setup variables: <code>string prefix = "42"; string suffix = "!";</code> combined as <code>(prefix + suffix.Substring(0,0)).AsSpan()</code>. Explain why this specific test does NOT hit the ref-struct-capture compile error even though it uses local variables, and write it as a passing (non-throwing) test.',
    hint: 'The variables being referenced (prefix and suffix) are ordinary string locals, not Span<T> locals — only a REF STRUCT local variable triggers the capture restriction. Building the span itself still happens inside the lambda body.',
    solution: `[Fact]
public void ParseFirstNumber_ValidInput_ReturnsCorrectValue()
{
    string prefix = "42";
    string suffix = "!";

    // This compiles FINE, even though it's inside a lambda AND
    // references outer local variables — because "prefix" and
    // "suffix" are ordinary STRING locals (reference types), not
    // Span<T> locals. Only capturing a REF STRUCT local (like a
    // Span<T> or ReadOnlySpan<T> variable declared outside the
    // lambda) triggers the restriction — capturing ordinary
    // reference-type locals like strings is completely unaffected:
    int result = ParseFirstNumber((prefix + suffix.Substring(0, 0)).AsSpan());

    Assert.Equal(42, result);

    // The KEY distinction: the .AsSpan() call itself happens INSIDE
    // the lambda/method body, constructing the span fresh each time
    // — "prefix" and "suffix" being captured is fine because they are
    // ordinary managed reference types, not ref structs.
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the "ref struct cannot be captured in a lambda" restriction applies to any variable referenced from within a lambda that touches spans in any way.',
      reality: 'it specifically applies to REF STRUCT (Span<T>/ReadOnlySpan<T>) local variables declared OUTSIDE the lambda and then referenced from inside it — capturing ordinary reference-type locals like strings, or constructing a span fresh entirely within the lambda\'s own body, is unaffected.',
    },
    {
      thought: 'Assert.Throws(() => methodTakingSpan(mySpan)) always works the same way regardless of where mySpan was declared.',
      reality: 'it compiles fine if the span is constructed inline inside the lambda, but fails to compile with CS8175 if mySpan is a Span<T>-typed local variable declared in the enclosing test method and then referenced (captured) from inside the lambda.',
    },
    {
      thought: 'the only way to test a method that throws given Span<T> input is to avoid Assert.Throws entirely and always use try/catch.',
      reality: 'Assert.Throws works perfectly well as long as the span is built inline inside the lambda expression itself — try/catch is only needed as a fallback when the span genuinely requires multi-step setup that is awkward to inline.',
    },
  ];
}
