import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-exceptionhandler-chain-ordering-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-exceptionhandler-chain-ordering-works-as-documented.html',
  styleUrl: './testing-exceptionhandler-chain-ordering-works-as-documented.scss',
})
export class TestingExceptionhandlerChainOrderingWorksAsDocumentedSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own Q&A describes a real ordering bug in detail — but nothing on the page shows the test that would actually catch it',
      points: [
        'The main Error Handling page\'s Q&A section walks through a specific scenario: a general-purpose fallback <code>IExceptionHandler</code> registered BEFORE a specific <code>ValidationException</code> handler, where the fallback "handles" everything unconditionally and returns <code>true</code>, silently preventing the specialized handler from ever running. The page explains WHY this happens (registration order determines evaluation order) — but describing a bug in prose is not the same as having a test that fails when the bug is present.',
      ],
    },
    {
      heading: 'An integration test that throws EACH distinct exception type and asserts on the SPECIFIC response shape each SHOULD produce directly proves the chain is both correctly ordered AND that every handler correctly declines exceptions it shouldn\'t claim',
      points: [
        'The test needs to prove TWO separate things: (1) a <code>ValidationException</code> produces the SPECIFIC 422 response the specialized handler is meant to produce, not the fallback\'s generic 500 — and (2) an exception type NONE of the specific handlers recognize still correctly reaches the fallback and produces ITS response. Testing only case (1) in isolation could still pass even with a broken fallback that happens to also return the right shape by coincidence — testing BOTH cases together, and specifically asserting on WHICH handler\'s distinctive response shape came back, is what actually proves the chain\'s ordering and each handler\'s "return false for what I don\'t own" discipline.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the main page\'s own Q&A scenario — a fallback registered FIRST that unconditionally claims everything',
      language: 'csharp',
      code: `// The BUG from the main page's own Q&A, reproduced directly:
public class UnconditionalFallbackHandler(IProblemDetailsService pds) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext ctx, Exception ex, CancellationToken ct)
    {
        ctx.Response.StatusCode = 500;
        await pds.WriteAsync(new ProblemDetailsContext
        {
            HttpContext = ctx, Exception = ex,
            ProblemDetails = new ProblemDetails { Title = "An error occurred", Status = 500 },
        }, ct);
        return true;   // BUG: ALWAYS returns true, regardless of exception type
    }
}

public class ValidationExceptionHandler(IProblemDetailsService pds) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext ctx, Exception ex, CancellationToken ct)
    {
        if (ex is not ValidationException ve) return false;

        ctx.Response.StatusCode = 422;
        await pds.WriteAsync(new ProblemDetailsContext
        {
            HttpContext = ctx, Exception = ex,
            ProblemDetails = new ProblemDetails { Title = ve.Message, Status = 422 },
        }, ct);
        return true;
    }
}

// Program.cs — THE EXACT BUG: registered in the WRONG order:
builder.Services.AddExceptionHandler<UnconditionalFallbackHandler>();  // FIRST — claims everything
builder.Services.AddExceptionHandler<ValidationExceptionHandler>();   // never reached`,
    },
    {
      label: 'An integration test proving the chain does NOT produce the specialized 422 response — catching the exact bug the Q&A describes',
      language: 'csharp',
      code: `public class ExceptionHandlerOrderingTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public ExceptionHandlerOrderingTests(WebApplicationFactory<Program> factory)
        => _client = factory.CreateClient();

    [Fact]
    public async Task ValidationException_ProducesTheSpecializedHandlers422Response_NotTheFallbacks500()
    {
        // This endpoint throws ValidationException — see below:
        var response = await _client.GetAsync("/test/throw-validation-exception");

        var body = await response.Content.ReadFromJsonAsync<ProblemDetails>();

        // THIS is the assertion that fails with the bug present: the
        // WRONG registration order means UnconditionalFallbackHandler
        // claims the exception FIRST, producing a 500 with the generic
        // "An error occurred" title — never reaching
        // ValidationExceptionHandler's 422 response at all:
        Assert.Equal(422, (int)response.StatusCode);
        Assert.Equal(422, body!.Status);
        Assert.NotEqual("An error occurred", body.Title);   // proves the
                                                              // FALLBACK
                                                              // did NOT
                                                              // claim it
    }

    [Fact]
    public async Task UnrecognizedException_StillReachesTheFallbackHandler()
    {
        // An exception type NEITHER specific handler recognizes should
        // still correctly reach the fallback — proving the fallback's
        // OWN logic (once fixed to properly return false for types it
        // doesn't own) still works as the safety net it's meant to be:
        var response = await _client.GetAsync("/test/throw-unrecognized-exception");

        var body = await response.Content.ReadFromJsonAsync<ProblemDetails>();

        Assert.Equal(500, (int)response.StatusCode);
        Assert.Equal("An error occurred", body!.Title);
    }
}

// Test-only endpoints that deliberately throw each exception type:
app.MapGet("/test/throw-validation-exception", () =>
{
    throw new ValidationException("Age must be positive");
});
app.MapGet("/test/throw-unrecognized-exception", () =>
{
    throw new InvalidOperationException("Something else entirely");
});

// WITH THE BUG PRESENT (registration order swapped), the FIRST test
// fails: response.StatusCode is 500, not 422, and body.Title is
// "An error occurred" instead of "Age must be positive" — directly
// proving the ordering bug the main page's Q&A describes, rather than
// relying on a developer to notice it during manual testing or code
// review.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Propose a THIRD test that would catch a DIFFERENT variant of the same ordering mistake: a fallback handler that correctly checks the exception type and returns false for types it does not recognize, but is nonetheless registered in an order that causes it to swallow a MORE SPECIFIC handler\'s exception type due to an inheritance relationship (e.g. the fallback catches "any DomainException" while a subclass-specific handler is registered AFTER it).',
    hint: 'Consider a base DomainException class with a derived NotFoundException — if a handler checking "ex is DomainException" is registered BEFORE a handler checking "ex is NotFoundException", does the base-type check still incorrectly claim the exception before the more specific one gets a chance, even though BOTH handlers correctly inspect the type?',
    solution: `A test for the inheritance-based variant of this ordering bug:

public abstract class DomainException(string message) : Exception(message);
public class NotFoundException(string message) : DomainException(message);

public class GenericDomainExceptionHandler(IProblemDetailsService pds) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext ctx, Exception ex, CancellationToken ct)
    {
        // Correctly checks the type — but "is DomainException" ALSO
        // matches NotFoundException, since it's a subclass:
        if (ex is not DomainException de) return false;

        ctx.Response.StatusCode = 400;
        await pds.WriteAsync(new ProblemDetailsContext
        {
            HttpContext = ctx, Exception = ex,
            ProblemDetails = new ProblemDetails { Title = de.Message, Status = 400 },
        }, ct);
        return true;
    }
}

public class NotFoundExceptionHandler(IProblemDetailsService pds) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext ctx, Exception ex, CancellationToken ct)
    {
        if (ex is not NotFoundException nfe) return false;

        ctx.Response.StatusCode = 404;   // more specific status code
        await pds.WriteAsync(new ProblemDetailsContext
        {
            HttpContext = ctx, Exception = ex,
            ProblemDetails = new ProblemDetails { Title = nfe.Message, Status = 404 },
        }, ct);
        return true;
    }
}

// BUG: registered in an order where the BASE-TYPE check runs first,
// even though BOTH handlers correctly check their own type:
builder.Services.AddExceptionHandler<GenericDomainExceptionHandler>();  // matches ANY DomainException
builder.Services.AddExceptionHandler<NotFoundExceptionHandler>();      // never reached for NotFoundException

[Fact]
public async Task NotFoundException_GetsTheMoreSpecific404_NotTheGeneric400()
{
    var response = await _client.GetAsync("/test/throw-not-found-exception");

    // With the bug present, this returns 400 (from
    // GenericDomainExceptionHandler, which correctly matched
    // 'ex is DomainException' since NotFoundException IS a
    // DomainException) instead of the intended 404:
    Assert.Equal(404, (int)response.StatusCode);
}

This demonstrates a SUBTLER version of the same class of bug: both
handlers can be individually "correct" (each properly checks its own
type and returns false otherwise), yet the ordering STILL produces the
wrong result whenever one handler's type check is a SUPERTYPE of
another's. The general rule this test enforces: handlers for MORE
DERIVED exception types must always be registered BEFORE handlers for
their base types — exactly mirroring the same principle C#'s own
catch-block ordering rules enforce at compile time for try/catch
chains (a compiler error if a base-exception catch block precedes a
derived one) — except IExceptionHandler registration order has NO
compiler enforcement at all, making a test like this the only
safety net.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'reading the main page\'s own Q&A explanation of the handler-ordering bug is sufficient documentation — no test is needed since the mechanism is now understood.',
      reality: 'understanding WHY a bug happens does not prevent it from being reintroduced by a future registration-order change — only a test that throws each exception type and asserts on the specific response shape actually catches a regression back to the wrong order.',
    },
    {
      thought: 'as long as every IExceptionHandler correctly checks "is ExactExceptionType" before claiming an exception, registration order cannot matter.',
      reality: 'a handler checking a BASE exception type (like "is DomainException") still incorrectly claims exceptions of a MORE DERIVED type if it is registered before the handler for that derived type — both handlers can be individually correct, yet the combination still produces the wrong result depending on order.',
    },
    {
      thought: 'C# enforces IExceptionHandler registration order the same way it enforces catch-block ordering in a try/catch chain (a compile error for a base-exception catch preceding a derived one).',
      reality: 'IExceptionHandler registration via AddExceptionHandler<T>() has zero compile-time ordering enforcement — the compiler treats each registration as an independent DI call, making an integration test the only mechanism that can catch an incorrect order.',
    },
  ];
}
