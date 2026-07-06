import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-get-cant-change-state-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-get-requests-cant-reach-state-changing-endpoints.html',
  styleUrl: './testing-get-requests-cant-reach-state-changing-endpoints.scss',
})
export class TestingGetRequestsCantReachStateChangingEndpointsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Antiforgery Protects a Verb, Not a URL — the Verb Has to Be Right First',
      points: [
        'The main page\'s own "Using GET endpoints for state changes" Common Mistake shows the fix (mapping DELETE instead of GET) but never shows a REGRESSION TEST that would catch someone re-introducing that mistake later — e.g. a teammate adding a "convenience" GET route to the same handler for easier manual testing in a browser. Antiforgery validation only ever runs for the METHODS it\'s wired to (POST/PUT/PATCH/DELETE) — a GET route pointed at the same handler bypasses antiforgery entirely, not because a token check failed, but because the check never runs for GET in the first place.',
        'This means a test asserting "GET requests to the delete endpoint fail" is testing something ENTIRELY SEPARATE from antiforgery — it is testing routing, not token validation. Confusing the two is the exact gap the main page\'s Common Mistake describes: antiforgery cannot protect a route that never required a safe-in-the-first-place-only verb structure to begin with.',
      ],
    },
    {
      heading: 'What the Test Should Actually Assert',
      points: [
        'A route mapped only as MapDelete("/account/{id}", ...) simply has no GET handler registered for that path — a GET request to it returns 404 Not Found (or 405 Method Not Allowed, depending on routing configuration), regardless of antiforgery tokens, cookies, or authentication. The test proves the ABSENCE of a GET route, which is what actually prevents the CSRF-via-&lt;img&gt;-tag attack the main page describes — antiforgery on the DELETE route is a second, independent layer that would matter only if a GET handler existed at all.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Regression test — no GET handler exists for the state-changing route',
      language: 'csharp',
      code: `public class AccountDeletionRoutingTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public AccountDeletionRoutingTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Get_To_The_Delete_Route_Returns_Not_Found()
    {
        // No token, no cookie, no auth header — none of that matters here.
        // This proves there IS NO GET handler at this path at all.
        var response = await _client.GetAsync("/account/42");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Delete_To_The_Same_Route_Is_Routable()
    {
        // Proves the route exists — just not reachable via GET.
        // (A missing antiforgery token here would separately fail with 400,
        // which is a DIFFERENT test — see the antiforgery testing subtopic
        // on the Web Security topic.)
        var response = await _client.DeleteAsync("/account/42");

        Assert.NotEqual(HttpStatusCode.NotFound, response.StatusCode);
    }
}`,
    },
    {
      label: 'Why this must be a SEPARATE test from antiforgery validation',
      language: 'csharp',
      code: `// A test like this one is checking the WRONG thing for this Common Mistake:
[Fact]
public async Task WRONG_Get_Fails_Because_Of_Missing_Antiforgery_Token()
{
    var response = await _client.GetAsync("/account/42");

    // This assertion would be TRUE for the wrong reason if a GET handler
    // existed and antiforgery correctly rejected it — but it is also
    // TRUE (for an entirely different reason) when no GET handler exists
    // at all. A 404 and a 400-from-failed-antiforgery look similar enough
    // in a loosely-written assertion (Assert.False(response.IsSuccessStatusCode))
    // to mask which protection is actually in place.
    Assert.False(response.IsSuccessStatusCode);
}

// The routing test above asserts the SPECIFIC status code (404, not just
// "not successful") — which is what actually distinguishes "no GET route
// exists" from "a GET route exists but antiforgery rejected it."`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate adds <code>app.MapGet("/account/{id}/delete", handler)</code> alongside the existing <code>MapDelete("/account/{id}", handler)</code>, reasoning it makes manual testing in a browser easier during development. Using the routing test above as a model, what specifically would catch this regression, and why would a test that only checks <code>IsSuccessStatusCode</code> miss it?',
    hint: 'Think about what status code a NEWLY-ADDED GET route returns on success versus what a MISSING route returns, and whether "not successful" is specific enough to tell them apart.',
    solution: `Asserting Assert.Equal(HttpStatusCode.NotFound, response.StatusCode)
against GET /account/{id} would immediately catch this regression: once
the teammate adds a working GET route (even at a slightly different
path like /account/{id}/delete), a request to THAT specific path would
now return 200 (or whatever success code the handler returns) instead
of 404 — the test fails, exactly as it should, flagging that a
GET-triggerable state change now exists.

A test that only asserts Assert.False(response.IsSuccessStatusCode)
against the ORIGINAL /account/{id} path would NOT catch this particular
regression at all, because the teammate added a NEW route at a
different path rather than modifying the existing one — the original
GET /account/{id} still correctly 404s. This is why the test needs to
enumerate the SPECIFIC state-changing operations you want to guarantee
have no GET-accessible equivalent, rather than asserting something
generic about one URL — the vulnerability class is "a GET route exists
ANYWHERE that changes state," not "this one specific URL responds to GET."`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a test asserting a GET request to a state-changing endpoint fails is testing antiforgery protection.',
      reality: 'if no GET handler is mapped for that path at all, the request 404s before antiforgery (or any other middleware) ever runs — the test is proving the ABSENCE of a route, which is a routing concern, not a token-validation concern.',
    },
    {
      thought: 'antiforgery tokens are what prevent the classic CSRF-via-&lt;img src="/account/delete?id=42"&gt; attack the main page describes.',
      reality: 'that specific attack is prevented by there being NO GET route for the state change at all — a browser\'s &lt;img&gt; tag can only ever issue a GET request. Antiforgery protects the POST/PUT/DELETE route from a forged request using the CORRECT verb; it does nothing for a route that was never protected by verb in the first place.',
    },
    {
      thought: 'checking that a response is not successful (Assert.False(IsSuccessStatusCode)) is specific enough to guard against a GET-based state-change regression.',
      reality: 'a 404 (no route), a 400 (failed antiforgery on an existing route), and a 405 (wrong method on an existing route) are all "not successful" — asserting the SPECIFIC expected status code is what actually distinguishes "this route correctly doesn\'t exist for GET" from other, unrelated failure reasons.',
    },
  ];
}
