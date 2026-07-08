import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-localization-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-localized-responses-fixed-culture-provider-vs-accept-language.html',
  styleUrl: './testing-localized-responses-fixed-culture-provider-vs-accept-language.scss',
})
export class TestingLocalizedResponsesFixedCultureProviderVsAcceptLanguageSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Own Q&A Names Two Techniques but Shows Neither',
      points: [
        'The main page\'s own "How do I test that my ASP.NET Core application returns correctly localised responses?" answer describes sending a request with an Accept-Language header AND registering a custom fixed-culture IRequestCultureProvider for determinism — but no code for either appears anywhere on the page. The Accept-Language approach exercises the REAL negotiation pipeline (QueryString → Cookie → Accept-Language, as covered elsewhere on this page) exactly as a real browser request would.',
        'The custom-provider approach instead REPLACES negotiation entirely with a provider that always returns a fixed RequestCulture, regardless of what headers, cookies, or query strings the test sends — useful when you want to assert on localized OUTPUT (does the French resource key actually render correctly?) without also depending on the negotiation pipeline behaving correctly, which is more efficiently tested separately and directly.',
      ],
    },
    {
      heading: 'Why Both Techniques Matter — They Test Different Layers',
      points: [
        'A test using the Accept-Language header proves negotiation AND localization together: real culture providers run in their configured order, and the resulting response is genuinely translated. This is the more end-to-end but also the more fragile test — if a teammate ever reorders culture providers, a test that relies on Accept-Language being checked (rather than an earlier provider winning) could start failing for a completely unrelated reason.',
        'A test using a fixed custom IRequestCultureProvider isolates localization from negotiation entirely — it always proves "given culture X is active, is the correct resource served," regardless of how X got selected. Combining both types of tests covers negotiation correctness and translation correctness as two SEPARATE concerns, rather than conflating them in every test.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Accept-Language integration test — real negotiation pipeline',
      language: 'csharp',
      code: `public class GreetingLocalizationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;
    public GreetingLocalizationTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Greet_Returns_French_When_Accept_Language_Is_Fr()
    {
        var request = new HttpRequestMessage(HttpMethod.Get, "/greet?name=Alice");
        request.Headers.AcceptLanguage.Add(new StringWithQualityHeaderValue("fr"));

        var response = await _client.SendAsync(request);
        var body = await response.Content.ReadFromJsonAsync<GreetingResponse>();

        Assert.Equal("Bonjour, Alice !", body!.Message);
    }

    [Fact]
    public async Task Greet_Falls_Back_To_English_For_Unsupported_Culture()
    {
        var request = new HttpRequestMessage(HttpMethod.Get, "/greet?name=Alice");
        request.Headers.AcceptLanguage.Add(new StringWithQualityHeaderValue("ja"));   // not in SupportedCultures

        var response = await _client.SendAsync(request);
        var body = await response.Content.ReadFromJsonAsync<GreetingResponse>();

        Assert.Equal("Hello, Alice!", body!.Message);   // default culture wins
    }
}`,
    },
    {
      label: 'Fixed-culture provider — deterministic, isolates translation from negotiation',
      language: 'csharp',
      code: `public class FixedCultureProvider(string culture) : IRequestCultureProvider
{
    public Task<ProviderCultureResult?> DetermineProviderCultureResult(HttpContext ctx) =>
        Task.FromResult<ProviderCultureResult?>(new ProviderCultureResult(culture));
}

public class GreetingLocalizationDeterministicTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    public GreetingLocalizationDeterministicTests(WebApplicationFactory<Program> factory) => _factory = factory;

    private HttpClient ClientForCulture(string culture) =>
        _factory.WithWebHostBuilder(builder =>
            builder.ConfigureServices(services =>
                services.Configure<RequestLocalizationOptions>(opts =>
                {
                    // Replaces ALL real negotiation — no header, cookie, or
                    // query string can override this in the test.
                    opts.RequestCultureProviders.Clear();
                    opts.RequestCultureProviders.Add(new FixedCultureProvider(culture));
                })))
        .CreateClient();

    [Fact]
    public async Task Greet_Returns_French_Text_Regardless_Of_Request_Headers()
    {
        var client = ClientForCulture("fr");

        // No Accept-Language, no cookie, no query string set at all —
        // the fixed provider is the ONLY thing deciding the culture.
        var response = await client.GetAsync("/greet?name=Alice");
        var body = await response.Content.ReadFromJsonAsync<GreetingResponse>();

        Assert.Equal("Bonjour, Alice !", body!.Message);
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate proposes deleting the Accept-Language tests entirely, keeping only the fixed-culture-provider tests, arguing they\'re more reliable and test the "real" thing that matters (translated output). What specific bug class would this leave completely uncovered?',
    hint: 'The fixed provider REPLACES opts.RequestCultureProviders entirely in the test host. What does that mean for anything configured in the REAL Program.cs\'s UseRequestLocalization() call — the provider order, the supported-cultures list, the middleware\'s placement in the pipeline?',
    solution: `Deleting the Accept-Language tests would leave the ENTIRE real culture
negotiation pipeline untested — the fixed-provider tests explicitly
CLEAR opts.RequestCultureProviders and replace it with a single
provider that ignores headers, cookies, and query strings completely.
None of the following would be covered by fixed-provider tests alone:

- Whether UseRequestLocalization() is registered in the right place in
  the pipeline (the main page's own "Calling UseRequestLocalization()
  too late" mistake) — a fixed test host with the ENTIRE negotiation
  system swapped out can't detect a real ordering regression in
  Program.cs.
- Whether the real SupportedCultures/SupportedUICultures list actually
  includes the cultures the app claims to support — a fixed-provider
  test would happily "prove" French works even if "fr" were
  accidentally removed from AddSupportedCultures() in production.
- Whether an UNSUPPORTED culture (like the "ja" example above) actually
  falls back to the default culture correctly, rather than throwing
  MissingManifestResourceException.

The fixed-provider tests are valuable for isolating TRANSLATION
correctness from NEGOTIATION correctness — but they are not a superset
of the Accept-Language tests. Both are needed; they cover genuinely
different failure classes.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'testing localization with a real Accept-Language header and testing it with a fixed custom IRequestCultureProvider are two ways to do the same thing — pick whichever is more convenient.',
      reality: 'the Accept-Language approach tests real negotiation (provider order, supported-cultures configuration, middleware placement) together with translation; the fixed-provider approach replaces negotiation entirely to isolate translation correctness alone — they cover different failure classes and aren\'t interchangeable.',
    },
    {
      thought: 'a fixed IRequestCultureProvider test proves the app correctly serves French to French-speaking users in production.',
      reality: 'it proves the app serves French correctly GIVEN that French was somehow selected — it says nothing about whether real negotiation (headers, cookies, query strings, provider order) would have actually selected French for a real user.',
    },
    {
      thought: 'an unsupported Accept-Language value (like "ja" when only en/fr/de/ar are configured) will throw an exception if tested.',
      reality: 'per the main page\'s own Common Mistake about missing SupportedCultures, an unsupported culture in a PROPERLY configured app falls back to the default culture silently — the exception only occurs when SupportedCultures isn\'t configured at all, which is precisely the mistake the main page warns against.',
    },
  ];
}
