import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-ctx-arguments-oftype-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './ctx-arguments-oftype-is-fragile-use-getargument-by-position.html',
  styleUrl: './ctx-arguments-oftype-is-fragile-use-getargument-by-position.scss',
})
export class CtxArgumentsOftypeIsFragileUseGetargumentByPositionSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own ValidationFilter<T> finds the validated model via ctx.Arguments.OfType<T>().FirstOrDefault() — a pattern that works for its own single-model example, but silently breaks the moment a handler\'s parameter list gains a SECOND parameter that also happens to match type T',
      points: [
        '<code>EndpointFilterInvocationContext.Arguments</code> is a plain <code>IList&lt;object&gt;</code> populated in the EXACT order the handler delegate\'s parameters are declared — index 0 is the first parameter, index 1 the second, and so on. <code>OfType&lt;T&gt;()</code> scans this list and returns EVERY argument whose runtime type is assignable to <code>T</code>, in that positional order — <code>.FirstOrDefault()</code> then grabs whichever one happens to come FIRST, which is only guaranteed to be "the intended model" if T is a type that only ONE parameter in the handler could possibly match.',
        'This assumption holds trivially for the main page\'s own example, where <code>CreateUserRequest</code> is a specific, unique DTO type unlikely to collide with anything else in the handler\'s parameter list. It breaks silently the moment a SECOND parameter of a compatible type appears — e.g., a handler later gains an <code>UpdateUserRequest</code> parameter for a PATCH-style partial update alongside the original, or <code>T</code> is generic enough (an interface, a common base class) that more than one parameter satisfies <code>OfType&lt;T&gt;()</code>.',
      ],
    },
    {
      heading: 'The more robust alternative — accessing an argument by its KNOWN POSITIONAL INDEX via ctx.GetArgument<T>(index) — trades "search for whatever matches" for "the caller must know and state exactly which parameter position the model lives at," which is more verbose but immune to this specific class of silent misfire',
      points: [
        '<code>ctx.GetArgument&lt;T&gt;(index)</code> reads the argument at a SPECIFIC, explicit position and casts it to <code>T</code> — if the handler\'s signature changes in a way that shifts WHICH parameter is at that index, the filter now reads the WRONG parameter (or throws an <code>InvalidCastException</code> if the type doesn\'t match at all) — which is a LOUD, immediately visible failure, in contrast to <code>OfType&lt;T&gt;().FirstOrDefault()</code> silently returning a DIFFERENT, unintended argument that happens to also match the type, with no exception and no obvious symptom beyond "the wrong object got validated."',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The fragile pattern, reproduced — a handler gaining a second compatible parameter',
      language: 'csharp',
      code: `// The main page's OWN ValidationFilter, unchanged:
public class ValidationFilter<T> : IEndpointFilter where T : class
{
    private readonly IValidator<T> _validator;
    public ValidationFilter(IValidator<T> validator) => _validator = validator;

    public async ValueTask<object?> InvokeAsync(
        EndpointFilterInvocationContext ctx, EndpointFilterDelegate next)
    {
        var model = ctx.Arguments.OfType<T>().FirstOrDefault();
        if (model is not null)
        {
            var result = await _validator.ValidateAsync(model);
            if (!result.IsValid)
                return Results.ValidationProblem(result.ToDictionary());
        }
        return await next(ctx);
    }
}

// v1 — the endpoint this was designed for — ONE parameter of type T:
users.MapPost("/", (CreateUserRequest req, IUserService svc) => svc.CreateAsync(req))
     .AddEndpointFilter<ValidationFilter<CreateUserRequest>>();
// ctx.Arguments = [ req (CreateUserRequest), svc (IUserService) ]
// OfType<CreateUserRequest>().FirstOrDefault() correctly finds 'req'.

// v2 — a teammate later adds an "impersonatedBy" admin-override
// parameter that HAPPENS to also be typed CreateUserRequest (perhaps
// copy-pasted from elsewhere, or a genuine "create on behalf of"
// feature that reuses the same DTO shape):
users.MapPost("/admin-create", (
    CreateUserRequest onBehalfOfTemplate,   // <-- ALSO type T !
    CreateUserRequest req,
    IUserService svc) => svc.CreateAsAdminAsync(onBehalfOfTemplate, req, svc))
    .AddEndpointFilter<ValidationFilter<CreateUserRequest>>();

// ctx.Arguments = [ onBehalfOfTemplate, req, svc ]
// OfType<CreateUserRequest>().FirstOrDefault() now returns
// 'onBehalfOfTemplate' — the WRONG parameter — silently. The filter
// validates the template, not the actual new user's request. No
// exception, no obvious symptom — just wrong validation results on
// a specific new endpoint, discovered only by someone noticing
// invalid 'req' data slipping through unvalidated.`,
    },
    {
      label: 'The robust fix — explicit positional access, and a test proving the difference',
      language: 'csharp',
      code: `// A position-aware filter — explicit about WHICH parameter index
// holds the model to validate, rather than searching by type:
public class ValidationFilter<T>(int argumentIndex, IValidator<T> validator)
    : IEndpointFilter where T : class
{
    public async ValueTask<object?> InvokeAsync(
        EndpointFilterInvocationContext ctx, EndpointFilterDelegate next)
    {
        var model = ctx.GetArgument<T>(argumentIndex);
        var result = await validator.ValidateAsync(model);
        if (!result.IsValid)
            return Results.ValidationProblem(result.ToDictionary());
        return await next(ctx);
    }
}

// Registration now states the position EXPLICITLY — self-documenting,
// and immune to a LATER parameter of the same type being added
// elsewhere in the list:
users.MapPost("/admin-create", (
    CreateUserRequest onBehalfOfTemplate,
    CreateUserRequest req,                 // the ACTUAL model to validate
    IUserService svc) => svc.CreateAsAdminAsync(onBehalfOfTemplate, req, svc))
    .AddEndpointFilter(async (ctx, next) =>
    {
        var validator = ctx.HttpContext.RequestServices
            .GetRequiredService<IValidator<CreateUserRequest>>();
        var req = ctx.GetArgument<CreateUserRequest>(1);   // index 1 — 'req', not 'onBehalfOfTemplate'
        var result = await validator.ValidateAsync(req);
        return result.IsValid ? await next(ctx) : Results.ValidationProblem(result.ToDictionary());
    });

// A test proving the two patterns diverge for a handler with TWO
// same-typed parameters — the ONLY thing that changes is which
// selection strategy is used:
[Fact]
public async Task OfType_Grabs_First_Match_Not_Necessarily_The_Intended_One()
{
    var template = new CreateUserRequest { Name = "" };   // deliberately invalid
    var actualRequest = new CreateUserRequest { Name = "Alice" };   // valid

    var ctx = EndpointFilterInvocationContext.Create(
        new DefaultHttpContext(), template, actualRequest);

    // OfType<T>().FirstOrDefault() finds 'template' (index 0) —
    // NOT 'actualRequest' (index 1), even though 'actualRequest' is
    // the one the endpoint actually intends to validate:
    var foundByType = ctx.Arguments.OfType<CreateUserRequest>().FirstOrDefault();
    Assert.Same(template, foundByType);       // proves the misfire

    // GetArgument<T>(1) correctly retrieves 'actualRequest' by its
    // KNOWN position, regardless of what else in the list shares its type:
    var foundByPosition = ctx.GetArgument<CreateUserRequest>(1);
    Assert.Same(actualRequest, foundByPosition);
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team adopts ctx.GetArgument<T>(index) everywhere to fix this fragility, but a later refactor reorders a handler\'s parameters (moving the validated model from position 1 to position 0) WITHOUT updating the filter registration\'s hard-coded index. Compare the resulting failure mode to the original OfType<T>() bug this subtopic describes — is the positional approach strictly safer, or does it trade one silent-failure risk for a different one?',
    hint: 'OfType<T>().FirstOrDefault() fails silently by picking the WRONG object of the right type. GetArgument<T>(index) with a stale index after a reorder — does it necessarily throw, or could it ALSO silently return the wrong object, just via a different mechanism?',
    solution: `The positional approach is not strictly safer in every scenario — it
trades one silent-failure mode for a DIFFERENT one that can be equally
silent, depending on what ends up at the stale index. If the reorder
moves a DIFFERENT-TYPED parameter into position 1 (where the validated
model used to be), GetArgument<CreateUserRequest>(1) THROWS an
InvalidCastException — a loud, immediate, unmissable failure the
moment that code path executes. But if the reorder happens to put
ANOTHER same-typed parameter into position 1 (exactly the scenario
this subtopic's own example constructs — two CreateUserRequest
parameters), GetArgument<T>(1) does NOT throw — it successfully
retrieves the WRONG same-typed object at that position, silently,
with no exception, exactly mirroring the original OfType<T>()
misfire this subtopic set out to fix, just triggered by a stale index
instead of a duplicate type match.

This means positional access is safer specifically against "a NEW
parameter of a compatible type gets ADDED somewhere in the list" (the
original bug) but is NOT safer against "the model's OWN position gets
reordered without updating the filter" — a different but structurally
similar category of drift between the filter's assumption and the
handler's actual signature.

The most robust mitigation available combines both signals: assert the
retrieved argument's TYPE explicitly even when using positional access
(GetArgument<T>(index) already does this via its generic cast, so a
type mismatch at least throws), AND add a lightweight integration test
(matching the "wire it up correctly" testing pattern used elsewhere in
this hub) that sends a real request through the actual endpoint and
confirms the CORRECT property fails validation for a deliberately
invalid input — a test that would catch a silent same-type,
wrong-position misfire that neither OfType<T>() nor a stale
GetArgument<T>(index) alone can guarantee against. The deeper lesson:
whenever a filter's model-selection logic depends on an ASSUMPTION
about the handler's parameter list (by type OR by position), that
assumption is a hidden coupling between the filter and handler
signatures that neither approach eliminates entirely — only a test
exercising the REAL wiring closes the gap completely.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'ctx.Arguments.OfType<T>().FirstOrDefault() is a safe, general-purpose way to find "the model" in an endpoint filter, since T is usually a specific DTO type unlikely to collide with anything else.',
      reality: 'it silently returns whichever argument of a matching type happens to appear FIRST in the handler\'s parameter list — the moment a handler gains a second parameter of the same or a compatible type, this can retrieve the WRONG object with no exception and no visible symptom beyond incorrect validation results.',
    },
    {
      thought: 'ctx.GetArgument<T>(index), being explicit about position, is unconditionally safer than searching by type and eliminates the class of bug this subtopic describes.',
      reality: 'positional access is immune to a NEW same-typed parameter being ADDED elsewhere in the list, but it is NOT immune to the model\'s OWN position shifting during a later parameter reorder — if another same-typed parameter ends up at the stale index, GetArgument<T>() silently returns the wrong object too, without throwing.',
    },
    {
      thought: 'EndpointFilterInvocationContext.Arguments is keyed or otherwise associated with parameter NAMES, similar to how named arguments work in a normal C# method call.',
      reality: 'Arguments is a plain positional IList<object> with no name association at all — it is populated strictly in the order the handler delegate\'s parameters are declared, and both OfType<T>() and GetArgument<T>(index) operate purely on type and position, never on the original parameter\'s name.',
    },
  ];
}
