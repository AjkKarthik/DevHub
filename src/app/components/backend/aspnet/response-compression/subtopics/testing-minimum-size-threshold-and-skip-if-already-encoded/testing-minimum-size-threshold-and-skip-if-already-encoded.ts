import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-compression-thresholds-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-minimum-size-threshold-and-skip-if-already-encoded.html',
  styleUrl: './testing-minimum-size-threshold-and-skip-if-already-encoded.scss',
})
export class TestingMinimumSizeThresholdAndSkipIfAlreadyEncodedSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Two of the Main Page\'s Own Q&A Claims Are Never Demonstrated',
      points: [
        'The main page\'s own Q&A states two specific, testable behaviors that never appear in any code tab: responses below a minimum size threshold "are not compressed," and the middleware "checks for an existing Content-Encoding header and skips compression if one is present." Both are concrete, falsifiable claims about the middleware\'s decision logic — exactly the kind of behavior worth proving directly with an integration test rather than trusting the documentation\'s prose.',
      ],
    },
    {
      heading: 'Why the Skip-If-Already-Encoded Check Matters in Practice',
      points: [
        'The already-encoded skip exists specifically to prevent DOUBLE COMPRESSION — a scenario that arises naturally whenever an endpoint manually sets Content-Encoding itself (e.g., serving a pre-gzipped static asset, or proxying a response from an upstream service that was already compressed). Without this check, the middleware would try to compress an ALREADY-COMPRESSED byte stream, which is not just wasted CPU — compressing already-compressed data typically makes it SLIGHTLY LARGER, since compressed data has near-maximum entropy and no further redundancy for the algorithm to exploit.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Testing the minimum-size threshold',
      language: 'csharp',
      code: `app.MapGet("/tiny", () => Results.Text("ok"));                       // well under 1 KB
app.MapGet("/large", () => Results.Text(new string('a', 5000)));     // well over 1 KB

[Fact]
public async Task Tiny_Response_Is_Not_Compressed_Even_When_The_Client_Supports_It()
{
    var request = new HttpRequestMessage(HttpMethod.Get, "/tiny");
    request.Headers.AcceptEncoding.Add(new StringWithQualityHeaderValue("br"));

    var response = await _client.SendAsync(request);

    Assert.Empty(response.Content.Headers.ContentEncoding);   // below the size threshold
}

[Fact]
public async Task Large_Response_Is_Compressed_When_The_Client_Supports_It()
{
    var request = new HttpRequestMessage(HttpMethod.Get, "/large");
    request.Headers.AcceptEncoding.Add(new StringWithQualityHeaderValue("br"));

    var response = await _client.SendAsync(request);

    Assert.Equal("br", response.Content.Headers.ContentEncoding.Single());
}`,
    },
    {
      label: 'Testing the skip-if-already-encoded behavior',
      language: 'csharp',
      code: `app.MapGet("/pre-encoded", (HttpContext ctx) =>
{
    // Simulates an endpoint that already applied its OWN encoding —
    // e.g. serving a pre-gzipped static asset from disk.
    ctx.Response.Headers.ContentEncoding = "gzip";
    return Results.Text("already-compressed-payload-placeholder");
});

[Fact]
public async Task Response_With_Existing_Content_Encoding_Is_Not_Recompressed()
{
    var request = new HttpRequestMessage(HttpMethod.Get, "/pre-encoded");
    request.Headers.AcceptEncoding.Add(new StringWithQualityHeaderValue("br"));

    var response = await _client.SendAsync(request);

    // Still "gzip" — the middleware saw an existing header and skipped
    // its own compression entirely, rather than double-encoding on top.
    Assert.Equal("gzip", response.Content.Headers.ContentEncoding.Single());
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate argues the minimum-size threshold is just a performance optimization and could safely be disabled (compress everything, regardless of size) without any correctness risk. Is that accurate?',
    hint: 'Think about what happens to a response\'s TOTAL byte count when a small payload is run through a compression algorithm that adds its own header, footer, and block metadata overhead.',
    solution: `Not entirely — it's not purely a performance nicety, it also protects
against making SOME responses larger. Every compression format
(Brotli, gzip) has framing overhead — headers, checksums, block
metadata — that gets added regardless of how much the payload itself
shrinks. For genuinely tiny payloads (a few bytes), the algorithm's own
overhead can exceed whatever savings compressing the content produces,
making the "compressed" response BIGGER than the original.

Disabling the size threshold ("compress everything") would mean paying
CPU cost AND transferring MORE bytes for these tiny responses — the
worst of both outcomes. The threshold exists to skip compression
specifically in the size range where it cannot possibly help. It's a
genuine correctness-adjacent decision (avoiding a scenario where the
"optimization" actively regresses response size), not purely a CPU-time
shortcut.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the response compression middleware compresses every response whose MIME type is in the configured list, regardless of size.',
      reality: 'the middleware has a minimum-size threshold below which compression is skipped entirely — tiny responses are sent uncompressed even if their MIME type and the client\'s Accept-Encoding would otherwise qualify them.',
    },
    {
      thought: 'if an endpoint sets its own Content-Encoding header manually, the response compression middleware compresses it AGAIN on top, potentially double-encoding it.',
      reality: 'the middleware explicitly checks for an existing Content-Encoding header and skips its own compression entirely when one is already present, specifically to prevent double compression.',
    },
    {
      thought: 'compressing a response makes it smaller, or at worst leaves the size unchanged — there is no size threshold below which compression could make things worse.',
      reality: 'every compression format adds its own framing and header overhead — for sufficiently tiny payloads, that overhead can exceed the savings from compressing the content, making the compressed response LARGER than the original. This is exactly why a minimum-size threshold exists.',
    },
  ];
}
