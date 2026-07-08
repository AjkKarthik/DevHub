import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-csrf-token-pair-mechanics-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './cookie-token-and-request-token-are-not-the-same-string.html',
  styleUrl: './cookie-token-and-request-token-are-not-the-same-string.scss',
})
export class CookieTokenAndRequestTokenAreNotTheSameStringSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s "Both Tokens Match" Is a Simplification',
      points: [
        'The main page states the antiforgery cookie and the form/header token are checked to "match" — read literally, this sounds like the classic double-submit-cookie pattern used by some frameworks, where the cookie value and the header value are the SAME string, and validation is a plain equality check. ASP.NET Core\'s actual implementation issues TWO DIFFERENT byte sequences: a cookie token (stored in the antiforgery cookie) and a request token (embedded in the form field or header). GetAndStoreTokens() returns the request token as RequestToken from a single call — it is never equal to the cookie value, even for the very same request.',
        'Validation instead proves the two tokens were issued TOGETHER as a matched pair — both are derived from the same server-generated secret using a keyed cryptographic transform, not compared as identical strings. Presenting the cookie token as the request token (or vice versa) fails validation exactly as reliably as presenting no token at all, since a lone value cannot reconstruct the pairing by itself.',
      ],
    },
    {
      heading: 'Why the Distinction Matters — a Stolen Cookie Value Alone Is Not Enough',
      points: [
        'Under the naive "literally the same string in two places" reading, an attacker who could read the antiforgery cookie (e.g., via a subdomain XSS) could copy that one value into BOTH the cookie slot and the header slot of a forged request, since "they\'re the same string" either way. Under ASP.NET Core\'s actual matched-pair design, that same theft only yields the cookie token — the attacker still cannot derive the corresponding request token from it, since deriving the pair requires the server-side keys used at issuance, not the cookie token\'s bytes alone.',
        'This is precisely why the main page\'s own Common Mistake about a token "living in a cookie only" is dangerous — not because a single shared value would be exposed twice, but because skipping the second channel entirely removes the one piece an attacker genuinely cannot forge without direct access to the response.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Proving the two tokens are different strings',
      language: 'csharp',
      code: `app.MapGet("/antiforgery/inspect", (IAntiforgery antiforgery, HttpContext ctx) =>
{
    var tokens = antiforgery.GetAndStoreTokens(ctx);   // writes the cookie AND returns the pair

    // tokens.RequestToken goes in the form field / X-CSRF-TOKEN header.
    // The cookie ASP.NET Core just wrote holds a DIFFERENT string entirely.
    return Results.Ok(new { requestToken = tokens.RequestToken });
});`,
    },
    {
      label: 'Test — the cookie value and the request token are never equal',
      language: 'csharp',
      code: `[Fact]
public async Task Cookie_Token_And_Request_Token_Are_Different_Strings()
{
    var client = _factory.CreateClient();

    var response = await client.GetAsync("/antiforgery/inspect");
    var body = await response.Content.ReadFromJsonAsync<TokenInspectResponse>();

    var setCookieHeader = response.Headers.GetValues("Set-Cookie")
        .First(h => h.StartsWith("__RequestVerificationToken"));
    var cookieValue = setCookieHeader.Split(';')[0].Split('=')[1];

    // Proves this is a matched PAIR, not the classic "identical value
    // stored in two places" double-submit pattern.
    Assert.NotEqual(cookieValue, body!.RequestToken);
}`,
    },
    {
      label: 'Test — swapping the cookie value in as the request token fails',
      language: 'csharp',
      code: `[Fact]
public async Task Presenting_The_Cookie_Token_As_The_Request_Token_Fails_Validation()
{
    var client = _factory.CreateClient();

    var inspectResponse = await client.GetAsync("/antiforgery/inspect");
    var setCookieHeader = inspectResponse.Headers.GetValues("Set-Cookie")
        .First(h => h.StartsWith("__RequestVerificationToken"));
    var cookieValue = setCookieHeader.Split(';')[0].Split('=')[1];
    client.DefaultRequestHeaders.Add("Cookie", $"__RequestVerificationToken={cookieValue}");

    // Attacker reasoning under the "same string, two places" misconception:
    // "I stole the cookie value — I'll just send it as the header too."
    var request = new HttpRequestMessage(HttpMethod.Post, "/feedback");
    request.Headers.Add("X-CSRF-TOKEN", cookieValue);   // the COOKIE value, not the real request token
    request.Content = new StringContent("message=hi", Encoding.UTF8, "application/x-www-form-urlencoded");

    var response = await client.SendAsync(request);

    // Fails — the cookie token cannot stand in for the request token.
    Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate says: "If an attacker\'s XSS payload on a related subdomain can read our antiforgery cookie via <code>document.cookie</code>, that\'s just as bad as a full CSRF bypass, since they now have \'the\' token." Using the test above, is that true?',
    hint: 'Think about what the attacker can actually DO with only the cookie value — can they construct a request that passes validation using JUST that value?',
    solution: `Not quite — it's bad, but not equivalent to a full bypass. As the
second test shows, presenting the stolen cookie value AS the request
token (in the header or form field) fails validation, because the two
values are a cryptographically related PAIR, not one shared secret
duplicated in two places. Reading the cookie alone does not hand the
attacker something they can replay as the request token.

That said, this is not a reason to be complacent about the underlying
XSS — cookie theft is still a serious vulnerability on its own (session
hijacking and other cookie-based attacks), and an attacker who can
execute JavaScript in the context of the real site could potentially
just call the token-issuing endpoint themselves rather than trying to
reuse a stolen value — at that point antiforgery is no longer the thing
standing between the attacker and a forged request. The narrower,
correct claim is: knowing the cookie token's VALUE alone, with no other
access, does not let an attacker forge the matching request token —
that's specifically what the matched-pair design prevents.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the double-submit antiforgery pattern in ASP.NET Core works by literally comparing the SAME string value stored in the cookie and sent in the form or header.',
      reality: 'GetAndStoreTokens() returns two DIFFERENT values — a cookie token and a request token. Validation proves they were issued together as a matched pair, not that they are byte-for-byte identical strings.',
    },
    {
      thought: 'an attacker who can read the antiforgery cookie\'s value (e.g., via a subdomain XSS) can forge a valid request by sending that same value as both the cookie and the header.',
      reality: 'presenting the cookie token as the request token fails validation — the two are cryptographically related but distinct, and knowing one does not let an attacker derive or substitute the other.',
    },
    {
      thought: '"the token lives in a cookie only" is dangerous mainly because it exposes the same secret value that gets checked elsewhere.',
      reality: 'it\'s dangerous because it removes the SECOND channel entirely — without a request-side token to compare against, there is nothing left that the browser doesn\'t already auto-send via its normal cookie-attachment behavior, which is exactly the vulnerability antiforgery exists to close.',
    },
  ];
}
