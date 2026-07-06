import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-antiforgery-validation-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-antiforgery-token-validation-with-webapplicationfactory.html',
  styleUrl: './testing-antiforgery-token-validation-with-webapplicationfactory.scss',
})
export class TestingAntiforgeryTokenValidationWithWebapplicationfactorySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page shows the antiforgery SPA flow (GET /antiforgery/token → set cookie + return header token, then validate on POST) but never proves the validation actually rejects a forged or missing token — a policy that is never negatively tested is not verified to work at all',
      points: [
        'Antiforgery validation has a specific two-part shape that a test needs to exercise correctly: the server issues a cookie value AND a separate token value (returned in the response body for a SPA to read); a legitimate request must present BOTH — the cookie (sent automatically by the HttpClient\'s cookie container) and the header carrying the SAME token value the cookie encodes. Testing "it works" means proving three distinct request shapes: valid cookie + valid header (succeeds), valid cookie + WRONG header (rejected), and no header at all despite a valid cookie (rejected) — each exercises a different part of <code>IAntiforgery.ValidateRequestAsync()</code>\'s logic.',
        '<code>WebApplicationFactory</code>\'s default <code>HttpClient</code> does not automatically persist cookies between requests the way a browser does — <code>HttpClientHandler.UseCookies</code> must be explicitly enabled (it usually is by default for <code>CreateClient()</code>, but a manually constructed handler can silently disable it), or the test must manually copy the <code>Set-Cookie</code> header\'s value into the next request\'s <code>Cookie</code> header. Getting this wrong produces a test that always fails validation for the WRONG reason (no cookie at all) rather than testing the actual header-mismatch logic.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Fetching a real token pair, then testing all three request shapes',
      language: 'csharp',
      code: `[Fact]
public async Task Antiforgery_Requires_Matching_Cookie_And_Header()
{
    await using var app = new WebApplicationFactory<Program>();
    var client = app.CreateClient(); // cookies enabled by default

    // Step 1 — fetch a real token pair (sets the cookie AND returns
    // the header-token value in the response body, per the main
    // page's own SPA flow):
    var tokenResponse = await client.GetAsync("/antiforgery/token");
    var tokenBody = await tokenResponse.Content
        .ReadFromJsonAsync<TokenResponse>();
    var validToken = tokenBody!.Token;

    // The client's CookieContainer now holds the XSRF-TOKEN cookie
    // automatically (HttpClient persists Set-Cookie across requests
    // on the SAME HttpClient instance).

    // CASE 1 — valid cookie + valid header → succeeds
    var goodRequest = new HttpRequestMessage(HttpMethod.Post, "/submit");
    goodRequest.Headers.Add("X-XSRF-TOKEN", validToken);
    goodRequest.Content = JsonContent.Create(new { data = "ok" });
    var goodResponse = await client.SendAsync(goodRequest);
    Assert.Equal(HttpStatusCode.OK, goodResponse.StatusCode);
}

public record TokenResponse(string Token);`,
    },
    {
      label: 'Proving rejection — wrong header value and missing header entirely',
      language: 'csharp',
      code: `[Fact]
public async Task Antiforgery_Rejects_Tampered_Header_Token()
{
    await using var app = new WebApplicationFactory<Program>();
    var client = app.CreateClient();
    await client.GetAsync("/antiforgery/token"); // sets the real cookie

    // CASE 2 — valid cookie (from the real fetch above) but a
    // FORGED/guessed header value that does not match the cookie's
    // encoded token:
    var tamperedRequest = new HttpRequestMessage(HttpMethod.Post, "/submit");
    tamperedRequest.Headers.Add("X-XSRF-TOKEN", "attacker-guessed-value");
    tamperedRequest.Content = JsonContent.Create(new { data = "forged" });
    var tamperedResponse = await client.SendAsync(tamperedRequest);

    Assert.Equal(HttpStatusCode.BadRequest, tamperedResponse.StatusCode);
    // ValidateRequestAsync() throws AntiforgeryValidationException,
    // which the framework surfaces as 400 by default.
}

[Fact]
public async Task Antiforgery_Rejects_Missing_Header_Despite_Valid_Cookie()
{
    await using var app = new WebApplicationFactory<Program>();
    var client = app.CreateClient();
    await client.GetAsync("/antiforgery/token"); // cookie is now set

    // CASE 3 — the cookie is present and valid (HttpClient sends it
    // automatically), but NO X-XSRF-TOKEN header is attached at all —
    // simulating exactly what a genuine cross-origin CSRF attempt
    // looks like: the attacker's page can trigger the browser to send
    // the cookie automatically, but cannot read the token value to
    // also attach the matching header (same-origin policy blocks that):
    var noHeaderRequest = new HttpRequestMessage(HttpMethod.Post, "/submit");
    noHeaderRequest.Content = JsonContent.Create(new { data = "csrf-attempt" });
    var noHeaderResponse = await client.SendAsync(noHeaderRequest);

    Assert.Equal(HttpStatusCode.BadRequest, noHeaderResponse.StatusCode);
    // This is the test that actually proves CSRF protection works —
    // cases 1 and 2 alone would pass even if the endpoint ignored
    // the antiforgery check entirely for GET-only cookie presence.
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A test suite includes only "Case 1" (valid cookie + valid header succeeds) and considers antiforgery protection verified. A teammate later refactors /submit and accidentally removes the await antiforgery.ValidateRequestAsync(ctx) call entirely, believing the endpoint no longer needs it. Would Case 1 alone catch this regression? Design the minimum additional test that would.',
    hint: 'If ValidateRequestAsync() is never called, does the endpoint still return 200 OK for a request with a valid cookie and valid header? What request would FAIL only if validation is actually still happening?',
    solution: `No — Case 1 alone would NOT catch this regression. If the
ValidateRequestAsync() call is removed entirely, a request with a
valid cookie and valid header still succeeds (200 OK) — nothing about
that request's OUTCOME changes, because the endpoint was never
relying on failure paths to prove anything. A test that only asserts
"a well-formed request succeeds" passes identically whether antiforgery
validation is actually running or has been silently deleted.

The minimum additional test that catches this regression is exactly
Case 3 from this subtopic: a request with a VALID COOKIE but NO
header at all. If ValidateRequestAsync() is genuinely running, this
request is rejected with 400 (the cookie alone is insufficient — the
header must also be present and match). If the validation call has
been removed, this exact request now SUCCEEDS with 200 OK, since
nothing is checking for the header anymore — the test's assertion
(expecting 400) fails, correctly flagging the regression.

This mirrors a general testing principle worth generalizing: a
security control is only verified by a test that specifically exercises
the FAILURE path the control is supposed to enforce. A test suite for
authentication that only checks "valid credentials log in successfully"
never proves invalid credentials are rejected; a test suite for CSRF
protection that only checks "a well-formed request succeeds" never
proves a forged one is blocked. Positive-path tests prove the happy
path works; only negative-path tests prove the security boundary is
actually being enforced.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a passing integration test where a request with a valid antiforgery cookie and valid header returns 200 OK is sufficient proof that CSRF protection is correctly configured.',
      reality: 'that test alone cannot distinguish "antiforgery validation is working correctly" from "antiforgery validation was never being enforced at all" — both produce an identical 200 OK for a well-formed request; only a test sending a request with a MISSING or mismatched header proves the rejection path is actually enforced.',
    },
    {
      thought: 'testing CSRF protection just means confirming the /antiforgery/token endpoint returns a token — the actual validation logic on protected endpoints doesn\'t need separate test coverage.',
      reality: 'the token-issuing endpoint and the validating endpoint are two independent code paths — a bug or accidental removal of ValidateRequestAsync() on the PROTECTED endpoint has nothing to do with whether the token endpoint still works, and only a test that sends requests directly to the protected endpoint (with and without a matching header) exercises the validation logic itself.',
    },
    {
      thought: 'WebApplicationFactory\'s HttpClient automatically handles cookies exactly like a real browser, so nothing special is needed to test cookie-dependent flows like antiforgery.',
      reality: 'CreateClient() does enable cookie persistence by default across requests made on the SAME HttpClient instance, but this is easy to accidentally break — a manually constructed HttpClientHandler with UseCookies = false, or creating a NEW client per request, silently drops the cookie and produces a test that fails for the wrong reason (missing cookie) rather than testing the intended header-mismatch scenario.',
    },
  ];
}
