import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-apiversion-constraint-mechanics-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './why-omitting-apiversion-constraint-causes-ambiguous-match.html',
  styleUrl: './why-omitting-apiversion-constraint-causes-ambiguous-match.scss',
})
export class WhyOmittingApiversionConstraintCausesAmbiguousMatchSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own mistake describes the missing constraint as "All requests route to the same controller regardless of version" — the actual failure is more disruptive than that phrasing implies',
      points: [
        'The main API Versioning page\'s "Missing :apiVersion constraint" mistake says that without <code>{version:apiVersion}</code>, "<code>{version}</code> is just a string" and "all requests route to the same controller regardless of version." This is true when there is only ONE controller — but the main page\'s OWN examples show <code>GetV1</code> and <code>GetV2</code> as SEPARATE actions sharing the SAME <code>[HttpGet("{id:int}")]</code> route template, distinguished only by <code>[MapToApiVersion]</code>. Without the <code>:apiVersion</code> constraint, <code>[MapToApiVersion]</code>\'s metadata is never consulted by ordinary routing at all — meaning BOTH actions become equally valid matches for the SAME incoming request, for EVERY request to that route, not just ones with an unexpected version.',
      ],
    },
    {
      heading: 'ASP.NET Core\'s routing system requires exactly ONE unambiguous match per request — two actions sharing an identical route template with no route-level tie-breaker throws AmbiguousMatchException, a 500 error, on literally every request to that endpoint',
      points: [
        'The <code>:apiVersion</code> constraint is what plugs the API versioning negotiator INTO the routing system\'s action-selection process as a genuine tie-breaker — without it, ASP.NET Core\'s ordinary routing has no mechanism that even KNOWS <code>[MapToApiVersion]</code> exists, since that attribute is versioning-specific metadata the base framework doesn\'t natively understand. Two actions with an otherwise-identical HTTP method and route template, with no other route-level way to distinguish them, produce a genuine <code>AmbiguousMatchException</code> the instant routing tries to select ONE of them — which happens on literally the FIRST request to that URL, not just requests carrying an unexpected version value.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own multi-version controller — with the constraint removed',
      language: 'csharp',
      code: `// Removing the ':apiVersion' constraint from the main page's own example:
[ApiController]
[ApiVersion("1.0", Deprecated = true)]
[ApiVersion("2.0")]
[Route("api/v{version}/[controller]")]   // <-- constraint REMOVED
public class ProductsController : ControllerBase
{
    [HttpGet("{id:int}")]
    [MapToApiVersion("1.0")]
    public IActionResult GetV1(int id)
        => Ok(new { id, format = "legacy" });

    [HttpGet("{id:int}")]
    [MapToApiVersion("2.0")]
    public IActionResult GetV2(int id)
        => Ok(new { id, name = "Laptop", price = 999.99m });
}

// WITHOUT the :apiVersion constraint, ASP.NET Core's ROUTING SYSTEM
// (not the versioning library) sees TWO candidate actions for
// "GET api/v{version}/products/{id}" — GetV1 and GetV2 — with
// IDENTICAL HTTP method, IDENTICAL route template, and NO route-level
// distinguishing information, since [MapToApiVersion] is metadata the
// base routing system has no built-in awareness of at all.`,
    },
    {
      label: 'What actually happens — AmbiguousMatchException on EVERY request, not just wrong-version ones',
      language: 'csharp',
      code: `// A request to ANY of these URLs — v1, v2, or a nonsense value —
// ALL hit the exact same ambiguity, because the constraint's ABSENCE
// means version negotiation never even runs as part of route
// selection:

// GET /api/v1/products/1
// GET /api/v2/products/1
// GET /api/vBLAH/products/1   ← even this "matches" the route template,
//                                since {version} with no constraint
//                                accepts ANY string segment

// ALL THREE THROW THE SAME EXCEPTION:
//
//   Microsoft.AspNetCore.Routing.Matching.AmbiguousMatchException:
//   The request matched multiple endpoints. Matches:
//
//   ProductsController.GetV1 (MyApi)
//   ProductsController.GetV2 (MyApi)
//
// This is a 500 Internal Server Error, thrown DURING ROUTING itself —
// before any action code, any model binding, any [ApiVersion]-aware
// logic runs at all. It is NOT "the wrong version's data comes back" —
// it is a hard, immediate failure for every single request to this
// route, the moment TWO OR MORE actions share an identical template
// with no other distinguishing route information.

// ── THE FIX — restoring the constraint plugs versioning INTO routing's
// own tie-breaking mechanism ──
[Route("api/v{version:apiVersion}/[controller]")]   // ✓ constraint restored
public class ProductsController : ControllerBase
{
    // Now the SAME two actions resolve WITHOUT ambiguity: the
    // :apiVersion constraint causes ASP.NET Core's endpoint selection
    // to defer to Asp.Versioning's own IActionConstraint
    // implementation, which reads [MapToApiVersion] metadata and picks
    // EXACTLY ONE matching action based on the NEGOTIATED version for
    // this specific request — resolving what would otherwise be a
    // routing-level ambiguity into a single, correct match.
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Given that the failure mode without the constraint is an AmbiguousMatchException thrown for EVERY request (not a silent "wrong version" bug), propose why this specific mistake is actually LESS dangerous in practice than the "missing [MapToApiVersion]" mistake covered in the previous subtopic, despite sounding more severe.',
    hint: 'Consider how quickly each mistake would be noticed during development — one produces a loud, unmissable 500 error on the very first manual test of the endpoint; the other produces a quiet 200 OK with subtly wrong data that might pass a superficial smoke test.',
    solution: `The missing ':apiVersion' constraint mistake is actually LESS dangerous
in practice, precisely BECAUSE it fails loudly and immediately. The
very FIRST manual test of the endpoint — hitting it once in a browser,
Postman, or curl, for ANY version — produces an unmissable 500 error
with a clear AmbiguousMatchException message naming both conflicting
actions. A developer cannot ship this mistake without noticing it,
since the endpoint is completely broken from the first request onward,
with no path to a "looks fine" false sense of success.

Contrast this with the previous subtopic's "missing [MapToApiVersion]"
mistake: that one returns 200 OK with a PLAUSIBLE-LOOKING response body
— just the wrong version's shape. A developer casually testing
"does GET /api/v1/products/1 return something reasonable?" sees a 200
with SOME JSON object and might not notice the fields belong to v2, not
v1, especially if the two DTOs share some overlapping field names (both
have "id", for instance). This is exactly why the previous subtopic's
dedicated content-assertion test was necessary — a status-code check
alone provides zero protection against it, whereas THIS subtopic's
constraint mistake would already have been caught by the crudest
possible smoke test.

The general lesson: a bug that fails LOUDLY and IMMEDIATELY (like a
missing route constraint) is often less operationally risky than one
that fails QUIETLY and PLAUSIBLY (like a missing version-mapping
attribute) — even though the loud failure sounds more severe when
described in the abstract. This is why test suites should weight extra
scrutiny toward failure modes that DON'T produce an obvious error,
rather than assuming "if something's wrong, we'll definitely notice."`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'without the :apiVersion route constraint, requests simply route to "whichever version happens to be first" or to a default, silently ignoring the intended version.',
      reality: 'ASP.NET Core\'s routing system requires exactly one unambiguous match — two actions sharing an identical HTTP method and route template with no constraint-based tie-breaker throws AmbiguousMatchException (a 500 error) on literally every single request to that route, not a silent fallback to any particular version.',
    },
    {
      thought: 'the :apiVersion constraint is just a validation rule, similar to {id:int}, that rejects malformed version values with a 400.',
      reality: 'the constraint\'s real job is plugging Asp.Versioning\'s own action-selection logic into ASP.NET Core\'s routing pipeline as a tie-breaker between multiple actions sharing an identical route template — without it, the base routing system has no built-in awareness of [MapToApiVersion] metadata at all.',
    },
    {
      thought: 'a mistake that produces a loud, immediate 500 error (like the missing route constraint) is inherently more dangerous in practice than one that produces a quiet 200 OK with subtly wrong data.',
      reality: 'a loud failure is caught by the crudest possible manual smoke test on the very first request — a quiet failure with a plausible-looking response body can pass casual testing entirely undetected, making it the more operationally risky mistake despite sounding less severe in the abstract.',
    },
  ];
}
