import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-handler-partial-write-corruption-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './handler-writes-before-returning-false-corrupts-next-handler.html',
  styleUrl: './handler-writes-before-returning-false-corrupts-next-handler.scss',
})
export class HandlerWritesBeforeReturningFalseCorruptsNextHandlerSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own theory section states "Never write a partial response then return false" as a rule — but doesn\'t show what "corruption" actually looks like when a handler breaks it',
      points: [
        'The main Error Handling page\'s "IExceptionHandler (.NET 8+)" section says: "A handler that returns <code>false</code> leaves the response untouched — the next handler starts with a clean state. Never write a partial response then return <code>false</code>." This is stated as an absolute rule, but the page never demonstrates the CONCRETE failure that results from breaking it — which matters because the failure mode is subtle: HTTP responses cannot be "rolled back" once writing has begun, so a handler that sets a status code or writes ANY bytes before deciding it can\'t fully handle the exception leaves that partial state permanently in place for whatever runs next.',
      ],
    },
    {
      heading: 'Once ctx.Response.StatusCode is set (or worse, once any bytes have been written to the body), that state is NOT reset before the next IExceptionHandler in the chain runs — the "clean state" the main page promises only holds if every handler is disciplined about never touching the response before its final true/false decision',
      points: [
        '<code>HttpContext</code> is a SHARED object across the entire exception-handling chain — there is no per-handler snapshot-and-restore mechanism. If <code>HandlerA.TryHandleAsync</code> sets <code>ctx.Response.StatusCode = 422</code> partway through some conditional logic, then later decides the exception doesn\'t actually match its criteria and returns <code>false</code>, the NEXT handler in the chain (<code>HandlerB</code>) still sees <code>ctx.Response.StatusCode</code> already set to 422 — even though HandlerB has no idea HandlerA ever ran, and even if HandlerB never touches <code>StatusCode</code> itself (relying on <code>IProblemDetailsService.WriteAsync</code> or a downstream default to set it correctly), the STALE 422 from HandlerA may already be locked in.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A handler that sets StatusCode speculatively before its final decision — breaking the "clean state" guarantee for the next handler',
      language: 'csharp',
      code: `public class SpeculativeValidationHandler(IProblemDetailsService pds) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext ctx, Exception ex, CancellationToken ct)
    {
        // BUG: sets StatusCode SPECULATIVELY, before actually confirming
        // this handler will claim the exception — perhaps written this
        // way because the developer wanted "422 as a sensible default"
        // while investigating the exception's details:
        ctx.Response.StatusCode = 422;

        if (ex is not ValidationException ve)
        {
            // Realizes partway through that this ISN'T actually a
            // ValidationException — returns false to pass it along.
            // BUT 'ctx.Response.StatusCode' is now STUCK at 422 —
            // nothing resets it:
            return false;
        }

        await pds.WriteAsync(new ProblemDetailsContext
        {
            HttpContext = ctx, Exception = ex,
            ProblemDetails = new ProblemDetails { Title = ve.Message, Status = 422 },
        }, ct);
        return true;
    }
}

// Registered BEFORE the fallback, exactly as the main page recommends:
builder.Services.AddExceptionHandler<SpeculativeValidationHandler>();
builder.Services.AddExceptionHandler<FallbackExceptionHandler>();`,
    },
    {
      label: 'The fallback handler\'s response is silently corrupted — a 500-intent response served with a leftover 422 status',
      language: 'csharp',
      code: `public class FallbackExceptionHandler(IProblemDetailsService pds) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext ctx, Exception ex, CancellationToken ct)
    {
        // This handler is written EXACTLY as the main page's own
        // examples show — it does NOT set StatusCode itself here,
        // trusting a sensible default OR expecting to set it below:
        await pds.WriteAsync(new ProblemDetailsContext
        {
            HttpContext = ctx, Exception = ex,
            ProblemDetails = new ProblemDetails { Title = "An error occurred", Status = 500 },
        }, ct);
        return true;
    }
}

// WHAT ACTUALLY HAPPENS when an InvalidOperationException (NOT a
// ValidationException) is thrown:
//
//   1. SpeculativeValidationHandler.TryHandleAsync runs FIRST.
//      Sets ctx.Response.StatusCode = 422 speculatively.
//      Discovers ex is NOT ValidationException. Returns false.
//
//   2. FallbackExceptionHandler.TryHandleAsync runs NEXT — its OWN
//      logic is entirely correct, and it calls WriteAsync with
//      ProblemDetails.Status = 500 in the BODY.
//
//   3. THE CLIENT RECEIVES: an HTTP response whose ACTUAL STATUS CODE
//      is 422 (because ctx.Response.StatusCode was already set to 422
//      by SpeculativeValidationHandler in step 1, and — depending on
//      exactly which ASP.NET Core version and IProblemDetailsService
//      implementation is in use — WriteAsync may or may not overwrite
//      an already-set StatusCode), while the JSON BODY says
//      '"status": 500, "title": "An error occurred"'. A client
//      checking response.StatusCode sees 422 (implying a validation
//      problem); a client reading the BODY's "status" field sees 500
//      (implying a server error) — two CONTRADICTORY signals from the
//      SAME response, and neither handler's own code is individually
//      "wrong" in isolation.

// THE FIX: never touch ctx.Response (StatusCode, headers, or body) in
// ANY WAY until the handler has FULLY decided it will handle the
// exception — determine the outcome FIRST, using only local variables,
// and only THEN touch the response:
public class FixedValidationHandler(IProblemDetailsService pds) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext ctx, Exception ex, CancellationToken ct)
    {
        if (ex is not ValidationException ve) return false;   // decide FIRST

        ctx.Response.StatusCode = 422;   // touch the response ONLY AFTER
        await pds.WriteAsync(new ProblemDetailsContext              // deciding
        {
            HttpContext = ctx, Exception = ex,
            ProblemDetails = new ProblemDetails { Title = ve.Message, Status = 422 },
        }, ct);
        return true;
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Propose a test that would catch the StatusCode-corruption bug described in this subtopic — one that specifically proves the fallback handler\'s response is uncorrupted even when a PRECEDING handler in the chain briefly touches the response before declining to handle the exception.',
    hint: 'Consider throwing an exception type that NONE of the specific handlers recognize, and asserting on the ACTUAL response.StatusCode the client receives — does it match the fallback\'s intended 500, or does it show contamination from an earlier handler\'s speculative StatusCode assignment?',
    solution: `A test that throws an exception type the speculative handler does NOT
recognize, and asserts the client-visible status code matches the
FALLBACK's intended value (not a leftover from the earlier handler),
directly catches this corruption:

public class HandlerCorruptionTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public HandlerCorruptionTests(WebApplicationFactory<Program> factory)
        => _client = factory.CreateClient();

    [Fact]
    public async Task UnrecognizedException_ReachesFallbackWithUncorruptedStatusCode()
    {
        // This exception is NOT a ValidationException — the
        // SpeculativeValidationHandler should decline it (return
        // false), and FallbackExceptionHandler should fully own the
        // response:
        var response = await _client.GetAsync("/test/throw-invalid-operation-exception");

        var body = await response.Content.ReadFromJsonAsync<ProblemDetails>();

        // THE KEY ASSERTION: the ACTUAL response status code must match
        // what the FALLBACK intended (500) — if SpeculativeValidationHandler's
        // speculative 'ctx.Response.StatusCode = 422' assignment leaked
        // through, this assertion fails, directly proving the
        // corruption:
        Assert.Equal(500, (int)response.StatusCode);

        // Also assert the BODY's own status field agrees — a mismatch
        // between response.StatusCode and body.Status is itself a sign
        // something upstream touched the response before the handler
        // that's SUPPOSED to own it ever ran:
        Assert.Equal(500, body!.Status);
        Assert.Equal((int)response.StatusCode, body.Status);
    }
}

This test would FAIL with SpeculativeValidationHandler's bug present
(response.StatusCode would be 422, not 500) and PASS once the handler
is fixed to decide first, touch the response second — directly
verifying the main page's own stated rule ("never write a partial
response then return false") rather than trusting it as an
unenforced comment. The last assertion — checking response.StatusCode
against body.Status for AGREEMENT — is a useful general-purpose smoke
test for this entire class of bug: any handler in the chain that
partially touches the response before ultimately declining tends to
produce exactly this kind of status-code/body mismatch, regardless of
which specific handlers are involved.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the main page\'s promise that "the next handler starts with a clean state" means HttpContext automatically resets any changes a declining handler made before returning false.',
      reality: 'there is no automatic reset mechanism — HttpContext is a single shared object across the entire chain, and any response state (StatusCode, headers, body bytes) a handler touches before returning false remains in place for whatever runs next, since the "clean state" promise depends entirely on every handler\'s own discipline about not touching the response prematurely.',
    },
    {
      thought: 'setting ctx.Response.StatusCode speculatively, before fully confirming a handler will claim the exception, is harmless as long as the handler eventually calls WriteAsync correctly when it DOES claim the exception.',
      reality: 'the danger is specifically in the case where the handler does NOT end up claiming the exception (returns false) — the speculative StatusCode assignment persists into whatever the NEXT handler produces, potentially creating a response where the status code and the body\'s described status disagree.',
    },
    {
      thought: 'a mismatch between an HTTP response\'s actual status code and its ProblemDetails body\'s "status" field would be caught immediately by any reasonable test suite, since it is such an obvious inconsistency.',
      reality: 'a test that only checks the BODY content (e.g. asserting the title or status field within the JSON) without separately asserting on the actual HTTP response.StatusCode can pass even with this exact corruption present, since the body itself can still describe the correct intended status even while the wire-level status code is wrong.',
    },
  ];
}
