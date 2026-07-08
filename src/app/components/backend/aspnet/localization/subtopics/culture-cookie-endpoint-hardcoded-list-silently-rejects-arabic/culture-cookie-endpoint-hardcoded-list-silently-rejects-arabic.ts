import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-culture-cookie-hardcoded-list-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './culture-cookie-endpoint-hardcoded-list-silently-rejects-arabic.html',
  styleUrl: './culture-cookie-endpoint-hardcoded-list-silently-rejects-arabic.scss',
})
export class CultureCookieEndpointHardcodedListSilentlyRejectsArabicSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Culture Cookie Endpoint\'s Validation List Doesn\'t Match Supported Cultures',
      points: [
        'The main page\'s own "Setup" code tab configures var supportedCultures = new[] { "en", "fr", "de", "ar" }; — Arabic is explicitly supported, and the page even has a dedicated "RTL / Arabic Support" section built specifically for it. But the separately-shown "Culture Cookie" tab validates incoming culture values against a DIFFERENT, hardcoded array: if (!new[] { "en", "fr", "de" }.Contains(culture)) return Results.BadRequest(...) — missing "ar" entirely.',
        'The result: a user trying to set their language preference to Arabic through this exact endpoint gets a 400 Bad Request, even though the application fully supports Arabic everywhere else — UseRequestLocalization() accepts it, an Arabic resource file (if created) would serve it correctly, and the RTL section exists specifically to render it. The only thing standing in the way is this one hardcoded array silently drifting out of sync with the real supported-cultures list declared elsewhere in the same file.',
      ],
    },
    {
      heading: 'Why Two Separate Lists Exist At All — and How to Stop Them From Drifting',
      points: [
        'The Setup tab\'s supportedCultures array configures the FRAMEWORK\'s own negotiation and resource-loading behavior; the Culture Cookie tab\'s array is APPLICATION code performing its own separate, redundant validation before setting the cookie. Nothing connects the two — they are two independent arrays that happen to need the same values, with no compiler or runtime warning if one is updated without the other.',
        'The fix is to stop hardcoding a second list at all: inject IOptions&lt;RequestLocalizationOptions&gt; into the cookie endpoint and validate against options.Value.SupportedUICultures (the single source of truth already configured in Setup) instead of maintaining a parallel array by hand. This guarantees the two can never drift apart again, since there is only one list left to update.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The bug — two independent lists, one missing Arabic',
      language: 'csharp',
      code: `// Setup — Arabic IS a supported culture:
var supportedCultures = new[] { "en", "fr", "de", "ar" };
app.UseRequestLocalization(options =>
{
    options.SetDefaultCulture("en")
           .AddSupportedCultures(supportedCultures)
           .AddSupportedUICultures(supportedCultures);
});

// Culture Cookie endpoint — Arabic is NOT in this hardcoded list:
app.MapPost("/api/language", (string culture, HttpContext ctx) =>
{
    if (!new[] { "en", "fr", "de" }.Contains(culture))      // "ar" missing here
        return Results.BadRequest("Unsupported culture.");
    // ...sets the cookie...
});
// A user requesting culture=ar gets 400 — despite the app fully
// supporting Arabic (including the dedicated RTL section elsewhere
// on this page) everywhere EXCEPT this one endpoint.`,
    },
    {
      label: 'Test proving the bug',
      language: 'csharp',
      code: `[Fact]
public async Task Setting_Arabic_Culture_Via_Cookie_Endpoint_Incorrectly_Fails()
{
    var response = await _client.PostAsync("/api/language?culture=ar", null);

    // Demonstrates the actual bug — this SHOULD succeed, since "ar" is
    // a supported culture per Setup, but the endpoint's own hardcoded
    // validation list doesn't include it.
    Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
}`,
    },
    {
      label: 'The fix — one source of truth instead of two lists',
      language: 'csharp',
      code: `app.MapPost("/api/language", (
    string culture,
    HttpContext ctx,
    IOptions<RequestLocalizationOptions> localizationOptions) =>
{
    var supported = localizationOptions.Value.SupportedUICultures?
        .Select(c => c.Name) ?? Enumerable.Empty<string>();

    if (!supported.Contains(culture))
        return Results.BadRequest("Unsupported culture.");

    ctx.Response.Cookies.Append(
        CookieRequestCultureProvider.DefaultCookieName,
        CookieRequestCultureProvider.MakeCookieValue(new RequestCulture(culture, culture)),
        new CookieOptions { Expires = DateTimeOffset.UtcNow.AddYears(1) });

    return Results.Ok(new { culture });
});
// Now there is only ONE list to update when supported cultures change —
// the Setup tab's AddSupportedUICultures(supportedCultures) call.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'After applying the fix above, a teammate later adds Hebrew ("he") as a supported RTL culture by updating ONLY the Setup tab\'s supportedCultures array. Does the culture cookie endpoint need a separate matching update this time, and why is that different from before?',
    hint: 'Compare what the FIXED endpoint reads its supported-culture list FROM versus what the ORIGINAL, buggy endpoint read it from.',
    solution: `No separate update is needed this time — that's precisely the point
of the fix. The FIXED endpoint reads its validation list from
localizationOptions.Value.SupportedUICultures, which is populated
directly from the SAME supportedCultures array the Setup tab already
passes to AddSupportedUICultures(supportedCultures). Adding "he" to
that ONE array automatically makes the cookie endpoint accept it too,
since there is no second, independently-maintained list left to fall
out of sync.

This is the structural difference from the original bug: the ORIGINAL
endpoint hardcoded its OWN separate array — new[] { "en", "fr", "de" }
— that had no relationship to the Setup tab's list at all, so updating
one never touched the other. The fix didn't just add "ar" to that
hardcoded array (which would have solved THIS instance of the bug but
left the same drift risk for the NEXT culture someone adds) — it
removed the second array entirely, so this entire CLASS of bug can no
longer occur, no matter how many cultures are added in the future.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the main page\'s Culture Cookie endpoint validates against the same supported-cultures configuration used everywhere else in the app.',
      reality: 'it validates against its OWN separate, hardcoded array that is missing "ar" (Arabic) — a value the Setup tab\'s supportedCultures array explicitly includes, and that the page\'s own RTL section is built specifically to support.',
    },
    {
      thought: 'fixing this bug just means adding "ar" to the cookie endpoint\'s hardcoded validation array.',
      reality: 'that only fixes THIS instance — the next culture added to Setup\'s list would hit the identical bug again. The durable fix removes the second hardcoded array entirely and reads from IOptions&lt;RequestLocalizationOptions&gt; instead, so there is only one list left to maintain.',
    },
    {
      thought: 'if a culture is rejected by this endpoint\'s validation, it means the application genuinely doesn\'t support that culture yet.',
      reality: 'it can just as easily mean the endpoint\'s own hardcoded validation list has silently drifted out of sync with the REAL supported-cultures configuration declared elsewhere — the rejection doesn\'t necessarily reflect actual application-wide support.',
    },
  ];
}
