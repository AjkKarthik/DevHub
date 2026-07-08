import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-compression-registration-order-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './registration-order-only-breaks-ties-among-client-supported-encodings.html',
  styleUrl: './registration-order-only-breaks-ties-among-client-supported-encodings.scss',
})
export class RegistrationOrderOnlyBreaksTiesAmongClientSupportedEncodingsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: '"First Matching Provider Wins" Requires an Actual Match First',
      points: [
        'The main page\'s own quiz explanation says "Register [Brotli] first so it is used when the client sends Accept-Encoding: br, gzip — the first matching provider wins." Read carelessly, this could suggest the SERVER always applies its preferred provider regardless of what the client declared support for. In reality, provider registration order is only a TIE-BREAKER among the encodings the CLIENT\'S OWN Accept-Encoding header actually lists — if a client sends Accept-Encoding: gzip (no br token at all), the response is compressed with Gzip, full stop, no matter how highly Brotli is registered.',
        'This matters because the main page\'s own "Verify Compression" code tab tests only ONE scenario (curl -H "Accept-Encoding: br") — proving Brotli gets selected when explicitly requested, but never proving the FALLBACK actually engages correctly for a client that never mentions Brotli at all (an older browser, a non-browser HTTP client, certain proxies).',
      ],
    },
    {
      heading: 'Testing Both Sides of the Fallback',
      points: [
        'A complete test suite for a multi-provider compression setup needs at least three cases: a client declaring only the PREFERRED encoding gets that encoding; a client declaring only the FALLBACK encoding gets the fallback, never the preferred one it never asked for; and a client declaring BOTH gets the preferred one, proving registration order genuinely acts as the tie-breaker only when there IS a choice to make.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Three cases — preferred-only, fallback-only, and both declared',
      language: 'csharp',
      code: `public class ResponseCompressionSelectionTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;
    public ResponseCompressionSelectionTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Client_Declaring_Only_Gzip_Never_Gets_Brotli()
    {
        var request = new HttpRequestMessage(HttpMethod.Get, "/products");
        request.Headers.AcceptEncoding.Add(new StringWithQualityHeaderValue("gzip"));
        // Deliberately NOT adding "br" at all.

        var response = await _client.SendAsync(request);

        Assert.Equal("gzip", response.Content.Headers.ContentEncoding.Single());
        // Proves registration order (Brotli first) never overrides what
        // the CLIENT actually declared support for.
    }

    [Fact]
    public async Task Client_Declaring_Both_Gets_The_Registration_Order_Preference()
    {
        var request = new HttpRequestMessage(HttpMethod.Get, "/products");
        request.Headers.AcceptEncoding.Add(new StringWithQualityHeaderValue("br"));
        request.Headers.AcceptEncoding.Add(new StringWithQualityHeaderValue("gzip"));

        var response = await _client.SendAsync(request);

        Assert.Equal("br", response.Content.Headers.ContentEncoding.Single());
        // NOW registration order is the tie-breaker, since both are on the table.
    }

    [Fact]
    public async Task Client_Declaring_Neither_Gets_An_Uncompressed_Response()
    {
        var request = new HttpRequestMessage(HttpMethod.Get, "/products");
        // No Accept-Encoding header at all.

        var response = await _client.SendAsync(request);

        Assert.Empty(response.Content.Headers.ContentEncoding);
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate reads the main page\'s quiz explanation and concludes: "since Brotli is registered first, I don\'t even need to keep Gzip registered — Brotli covers everyone." Using the three tests above as a model, what specific class of client would this break, and which test catches it?',
    hint: 'Think about what "first matching provider" actually requires — a MATCH. What happens if NEITHER provider matches what a particular client declared?',
    solution: `Removing GzipCompressionProvider would break every client that
supports gzip but NOT Brotli — older browsers, certain HTTP libraries,
proxies, and monitoring or health-check clients that only ever send
Accept-Encoding: gzip. Client_Declaring_Only_Gzip_Never_Gets_Brotli is
exactly the test that would start failing: with only Brotli registered,
a gzip-only client's request would match NO configured provider at all,
so the response falls through UNCOMPRESSED (silently losing all
bandwidth savings for that entire client population) rather than
receiving gzip as intended.

The main page's own "first matching provider wins" phrasing is easy to
misread as "the highest-priority provider always applies" — it actually
means "the highest-priority provider AMONG THE ONES THAT MATCH THE
CLIENT'S DECLARED SUPPORT". Dropping Gzip doesn't just lower priority
for older clients — it removes their ONLY matching provider entirely,
silently disabling compression for them rather than gracefully falling
back.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'registering BrotliCompressionProvider first means the server always compresses with Brotli, regardless of what the client\'s Accept-Encoding header says.',
      reality: 'registration order is only a tie-breaker AMONG the encodings the client actually declared support for — a client that never lists "br" in Accept-Encoding will never receive a Brotli-compressed response, no matter how it\'s registered.',
    },
    {
      thought: 'since Brotli is "preferred" and usually registered first, keeping GzipCompressionProvider registered is redundant once Brotli is configured.',
      reality: 'removing Gzip entirely means any client that supports gzip but not Brotli (older browsers, some proxies, certain HTTP libraries) now matches NO configured provider at all — their responses silently stop being compressed rather than falling back gracefully.',
    },
    {
      thought: 'a client sending no Accept-Encoding header at all still gets SOME compression, since the server has providers configured.',
      reality: 'with no declared encoding support, no provider matches, and the response is sent uncompressed — the client\'s own header is what makes any compression possible at all.',
    },
  ];
}
