import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-custom-policy-vary-by-user-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './custom-ioutputcachepolicy-skips-every-built-in-safety-check.html',
  styleUrl: './custom-ioutputcachepolicy-skips-every-built-in-safety-check.scss',
})
export class CustomIoutputcachepolicySkipsEveryBuiltInSafetyCheckSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'IOutputCachePolicy Is a Bare Interface — No Guards Are Free',
      points: [
        'The main page\'s own "Custom Cache Key" example — UserScopedCachePolicy — implements IOutputCachePolicy DIRECTLY: three raw methods (CacheRequestAsync, ServeFromCacheAsync, ServeResponseAsync), no base class, no inherited behavior. Every safety check the framework\'s own built-in default policy applies — GET/HEAD-only, a cacheable status code, and (per this very page\'s own Q&A) excluding requests carrying an Authorization header — lives ONLY inside that built-in policy\'s implementation. A custom policy written from scratch gets none of it automatically; it must reimplement every guard it wants.',
        'Concretely: the main page\'s CacheRequestAsync sets ctx.EnableOutputCaching = true unconditionally, with no check on ctx.HttpContext.Request.Method at all. Applied via a named policy to ANY endpoint — including a POST or DELETE — it would enable caching for that write endpoint exactly as surely as the page\'s own separately-documented "Caching POST/PUT/DELETE endpoints" Common Mistake, just reached through a custom-policy code path instead of an obvious .CacheOutput() call on a POST handler, which makes it far easier to miss in review.',
      ],
    },
    {
      heading: 'EnableOutputCaching, AllowCacheLookup, and AllowCacheStorage Are Three Separate Switches',
      points: [
        'CacheRequestAsync runs first and only opts a request INTO the caching pipeline via EnableOutputCaching — it does not by itself guarantee anything gets stored. Whether the eventual response is written to the store is a separate decision, made as late as ServeResponseAsync (AllowCacheStorage), once the real status code is finally known. Whether an existing entry may be served at all is a third, independent decision (AllowCacheLookup). A correct from-scratch policy has to set each of these deliberately — setting EnableOutputCaching = true alone is not equivalent to "this will definitely get cached."',
        'The fix is either to reimplement the missing guards directly (a method check in CacheRequestAsync, a status-code check via AllowCacheStorage in ServeResponseAsync), or to avoid implementing IOutputCachePolicy from scratch at all and instead compose the custom vary-by-user logic on top of the framework\'s own policy-builder API, which already carries the GET/HEAD and status-code guards.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own example — no method or status guard',
      language: 'csharp',
      code: `// From the main page's "Custom Cache Key" tab — reproduced here.
// Notice: EnableOutputCaching is set to true unconditionally, with
// NO check on the request method and NO check on the response status.
public class UserScopedCachePolicy : IOutputCachePolicy
{
    public ValueTask CacheRequestAsync(OutputCacheContext ctx, CancellationToken ct)
    {
        ctx.EnableOutputCaching = true;
        ctx.ResponseExpirationTimeSpan = TimeSpan.FromMinutes(10);
        var userId = ctx.HttpContext.User.FindFirst("sub")?.Value ?? "anon";
        ctx.CacheVaryByValues.Add("user", userId);
        return ValueTask.CompletedTask;
    }

    public ValueTask ServeFromCacheAsync(OutputCacheContext ctx, CancellationToken ct)
        => ValueTask.CompletedTask;

    public ValueTask ServeResponseAsync(OutputCacheContext ctx, CancellationToken ct)
        => ValueTask.CompletedTask;
}
// Applied to a POST or DELETE endpoint via a named policy, this would
// cache the WRITE response — the same bug as the main page's own
// "Caching POST/PUT/DELETE endpoints" mistake, just harder to spot.`,
    },
    {
      label: 'Fixed — the two guards reimplemented explicitly',
      language: 'csharp',
      code: `public class UserScopedCachePolicy : IOutputCachePolicy
{
    public ValueTask CacheRequestAsync(OutputCacheContext ctx, CancellationToken ct)
    {
        var method = ctx.HttpContext.Request.Method;
        if (!HttpMethods.IsGet(method) && !HttpMethods.IsHead(method))
        {
            // The guard the built-in default policy provides for free —
            // a from-scratch policy must add it back explicitly.
            ctx.EnableOutputCaching = false;
            return ValueTask.CompletedTask;
        }

        ctx.EnableOutputCaching = true;
        ctx.ResponseExpirationTimeSpan = TimeSpan.FromMinutes(10);
        var userId = ctx.HttpContext.User.FindFirst("sub")?.Value ?? "anon";
        ctx.CacheVaryByValues.Add("user", userId);
        return ValueTask.CompletedTask;
    }

    public ValueTask ServeFromCacheAsync(OutputCacheContext ctx, CancellationToken ct)
        => ValueTask.CompletedTask;

    public ValueTask ServeResponseAsync(OutputCacheContext ctx, CancellationToken ct)
    {
        // Only store genuinely successful responses — another guard the
        // built-in default policy applies that a from-scratch policy
        // does not get automatically. The real status code is only
        // known here, after the handler has actually run.
        if (ctx.HttpContext.Response.StatusCode != StatusCodes.Status200OK)
        {
            ctx.AllowCacheStorage = false;
        }
        return ValueTask.CompletedTask;
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The fixed policy above now guards against non-GET methods and non-200 responses. A teammate applies this SAME policy as the app\'s base policy (via <code>options.AddBasePolicy(...)</code>) instead of scoping it to one endpoint. Is that enough to guarantee correctness everywhere, or is there still a gap?',
    hint: 'Consider the ORDER these three methods run in relative to each other, and whether ctx.EnableOutputCaching being set true in CacheRequestAsync has already committed to anything before ServeResponseAsync ever runs.',
    solution: `It's enough for STORAGE specifically — ServeResponseAsync's
AllowCacheStorage = false check runs after the real response is
generated, so a 500 error page correctly never gets written into the
cache store, regardless of what CacheRequestAsync decided earlier.
That part of the fix is correct and sufficient.

The remaining gap is narrower than it first looks: this policy still
only guards the REQUEST-SIDE decision (method) and the RESPONSE-SIDE
decision (status code) — it says nothing about which routes it should
even apply to. Promoted to the global base policy, it now runs for
EVERY endpoint in the app, including ones that were never designed with
per-user cache keys in mind. A GET endpoint that legitimately returns
the exact same public response for every caller now gets an unnecessary
per-user cache key added to it via CacheVaryByValues, needlessly
fragmenting its cache into one entry per user instead of one shared
entry — correct behavior, wasted cache efficiency.

The safer fix is not more guard logic inside the policy — it's keeping
this custom policy scoped to a NAMED policy applied only to the specific
GET endpoints it was actually designed for, rather than promoting it to
the app-wide base policy for convenience.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'implementing IOutputCachePolicy directly still benefits from the framework\'s built-in GET/HEAD-only and status-code guards, since output caching only ever caches successful GET responses by design.',
      reality: 'those guards live only inside the framework\'s built-in default policy implementation. A class implementing IOutputCachePolicy from scratch — like the main page\'s own UserScopedCachePolicy — gets none of them for free and must reimplement each one explicitly.',
    },
    {
      thought: 'setting ctx.EnableOutputCaching = true in CacheRequestAsync is the single switch that determines whether a response actually gets stored.',
      reality: 'EnableOutputCaching only opts the request into the caching pipeline. Actual storage is separately gated by AllowCacheStorage (decided as late as ServeResponseAsync, once the real status code is known), and actual lookup is separately gated by AllowCacheLookup — these can diverge, e.g. a request can be allowed to look up a hit while being disallowed from writing a new one.',
    },
    {
      thought: 'a bug like "this custom policy caches non-GET requests too" is harder to catch than an ordinary caching mistake, since IOutputCachePolicy is framework-internal plumbing.',
      reality: 'it is just as testable as any other plain class — CacheRequestAsync and ServeResponseAsync are ordinary async methods callable directly with a hand-built OutputCacheContext, the same direct-unit-test technique used elsewhere in this hub for IEndpointFilter and custom IHealthCheck implementations — but only if a test actually asserts behavior for a non-GET verb, which the main page\'s own example never demonstrated.',
    },
  ];
}
