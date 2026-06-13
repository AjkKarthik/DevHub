import { Component } from '@angular/core';
import { PageMetaComponent }      from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';

@Component({
  selector: 'app-aspnet-response-compression',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent, PageCompleteComponent,
            CommonMistakesComponent, RevisionCardComponent],
  templateUrl: './response-compression.html',
  styleUrl: './response-compression.scss',
})
export class AspnetResponseCompression {

  quickRef: QuickRefItem[] = [
    { name: 'AddResponseCompression()',          type: 'method',  desc: 'Registers compression services and providers. Call before Build().' },
    { name: 'UseResponseCompression()',          type: 'method',  desc: 'Adds compression middleware. Place before static file and MVC middleware.' },
    { name: 'BrotliCompressionProvider',         type: 'class',   desc: 'Brotli compression — better ratio than gzip; supported in all modern browsers.' },
    { name: 'GzipCompressionProvider',           type: 'class',   desc: 'Gzip compression — broader compatibility including older browsers and proxies.' },
    { name: 'CompressionLevel',                  type: 'class',   desc: 'Fastest, Optimal, SmallestSize — balance between CPU cost and size reduction.' },
    { name: 'options.MimeTypes',                 type: 'keyword', desc: 'List of MIME types that trigger compression. Default excludes already-compressed types.' },
    { name: 'options.EnableForHttps',            type: 'keyword', desc: 'Allow compression over HTTPS. Disabled by default due to CRIME/BREACH attacks.' },
    { name: 'ResponseCompressionDefaults',       type: 'class',   desc: 'Contains the default MIME type list to extend rather than replace.' },
    { name: 'Accept-Encoding header',            type: 'keyword', desc: 'Client header indicating supported compression formats (br, gzip, deflate).' },
    { name: 'Content-Encoding header',           type: 'keyword', desc: 'Response header set by the middleware indicating which algorithm was applied.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Why Compress HTTP Responses',
      points: ['Compression reduces the bytes transferred over the network, lowering bandwidth costs and improving perceived performance — especially for large JSON payloads, HTML pages, and API collections. The CPU overhead of compression is usually far outweighed by the network savings, particularly for responses larger than ~1 KB.'],
    },
    {
      heading: 'Brotli vs Gzip',
      points: ['Brotli (br) typically achieves 20–26% better compression than gzip for text content. It is supported in all modern browsers and HTTP/2 connections. Gzip is older and more universally supported (older browsers, non-browser clients, proxies). ASP.NET Core tries providers in registration order — add Brotli first so it is preferred when the client supports it.'],
    },
    {
      heading: 'Compression and HTTPS (CRIME/BREACH)',
      points: ['Compressing HTTPS responses that contain secrets can enable CRIME and BREACH attacks — statistical analysis of compressed size changes reveals secret values. Because of this, EnableForHttps is false by default. Enable it only when: responses do not contain secrets, or you have other mitigations in place. Static files and non-sensitive API responses are generally safe.'],
    },
    {
      heading: 'MIME Type Filtering',
      points: ['Not every response benefits from compression. Already-compressed types (JPEG, PNG, video, ZIP) will grow slightly if re-compressed, wasting CPU. The default list covers common text formats (text/plain, application/json, text/css, application/javascript). Extend it with ResponseCompressionDefaults.MimeTypes.Concat(...) rather than replacing it.'],
    },
    {
      heading: 'Middleware Placement',
      points: ['UseResponseCompression() must come before the middleware that generates the response — UseStaticFiles, UseRouting, MapControllers, and UseResponseCaching. If it comes after, the response body is already sent and cannot be compressed. The middleware hooks into the response pipeline by wrapping the output stream.'],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Setup',
      language: 'csharp',
      code: `// Program.cs
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;   // OK for non-secret APIs
    options.Providers.Add<BrotliCompressionProvider>();   // preferred
    options.Providers.Add<GzipCompressionProvider>();     // fallback
    options.MimeTypes = ResponseCompressionDefaults.MimeTypes.Concat(
        new[] { "application/json", "application/problem+json" });
});

builder.Services.Configure<BrotliCompressionProviderOptions>(opts =>
    opts.Level = CompressionLevel.Optimal);

builder.Services.Configure<GzipCompressionProviderOptions>(opts =>
    opts.Level = CompressionLevel.Optimal);

var app = builder.Build();
app.UseResponseCompression(); // FIRST — before static files and routing`,
    },
    {
      label: 'Custom MIME Types',
      language: 'csharp',
      code: `builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();

    // Extend defaults — don't replace them
    options.MimeTypes = ResponseCompressionDefaults.MimeTypes.Concat(new[]
    {
        "application/json",
        "application/problem+json",
        "application/graphql-response+json",
        "text/event-stream",       // SSE
        "application/xml",
        "application/atom+xml",
    });
});`,
    },
    {
      label: 'Compression Level Trade-offs',
      language: 'csharp',
      code: `// CompressionLevel options:
// Fastest     — minimal CPU, less reduction (good for high-throughput APIs)
// Optimal     — balance (recommended default for most scenarios)
// SmallestSize — max reduction, most CPU (good for rarely-changing static content)

builder.Services.Configure<BrotliCompressionProviderOptions>(opts =>
{
    // Fastest for real-time API responses
    opts.Level = CompressionLevel.Fastest;
});

builder.Services.Configure<GzipCompressionProviderOptions>(opts =>
{
    // Optimal for standard JSON payloads
    opts.Level = CompressionLevel.Optimal;
});`,
    },
    {
      label: 'Static Files + API',
      language: 'csharp',
      code: `app.UseResponseCompression();

// Static files — HTML, CSS, JS get compressed automatically
app.UseStaticFiles();

// API responses — JSON compressed when Accept-Encoding: br or gzip present
app.MapGet("/products", (IProductRepo repo) => repo.GetAllAsync());
app.MapGet("/report", async (IReportService svc) =>
{
    // Large payload — compression gives significant savings
    var report = await svc.GenerateFullReportAsync();
    return Results.Ok(report);
});`,
    },
    {
      label: 'Verify Compression',
      language: 'csharp',
      code: `// Test with curl — request Brotli, see Content-Encoding in response
// curl -H "Accept-Encoding: br" -I https://localhost:5001/products

// Diagnostic middleware to log compression info
app.Use(async (ctx, next) =>
{
    await next();
    var encoding = ctx.Response.Headers["Content-Encoding"].FirstOrDefault();
    if (encoding != null)
    {
        Console.WriteLine(\`Compressed with \${encoding}: \${ctx.Request.Path}\`);
    }
});`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Placing UseResponseCompression() after UseStaticFiles()',
      wrong: `app.UseStaticFiles();
app.UseResponseCompression(); // too late — static files already sent`,
      right: `app.UseResponseCompression(); // must be FIRST
app.UseStaticFiles();`,
      explanation: 'Response compression wraps the output stream. If it is registered after middleware that writes the response, the response is already sent and cannot be compressed.',
    },
    {
      title: 'Enabling compression for already-compressed MIME types',
      wrong: `options.MimeTypes = new[] { "image/jpeg", "image/png", "application/zip" };`,
      right: `options.MimeTypes = ResponseCompressionDefaults.MimeTypes.Concat(
    new[] { "application/json" });`,
      explanation: 'JPEG, PNG, and ZIP are already compressed. Compressing them again wastes CPU and can make responses larger. Only compress text-based formats.',
    },
    {
      title: 'Blindly enabling EnableForHttps without considering BREACH',
      wrong: `options.EnableForHttps = true; // on an endpoint returning auth tokens in the body`,
      right: `// Keep EnableForHttps = false for endpoints returning secrets
// Enable only for non-sensitive APIs or static content endpoints`,
      explanation: 'The BREACH attack can extract secrets from compressed HTTPS responses through an oracle. Only enable HTTPS compression for responses that do not contain user secrets.',
    },
    {
      title: 'Replacing ResponseCompressionDefaults.MimeTypes instead of extending',
      wrong: `options.MimeTypes = new[] { "application/json" }; // loses all defaults`,
      right: `options.MimeTypes = ResponseCompressionDefaults.MimeTypes
    .Concat(new[] { "application/json" });`,
      explanation: 'Setting MimeTypes outright replaces the defaults. Use Concat to keep the built-in text types and add your custom ones.',
    },
  ];

  challenge: Challenge = {
    title: 'Compress a Large JSON Endpoint',
    language: 'csharp',
    description: `Configure response compression for a minimal API:
1. Register Brotli (primary) and Gzip (fallback) providers.
2. Enable compression for application/json and application/problem+json.
3. Set CompressionLevel.Optimal for both providers.
4. Place UseResponseCompression() correctly in the pipeline.
5. Add a GET /report endpoint that returns a large list of 1000 items.`,
    hints: [
      'Brotli first, Gzip second in options.Providers',
      'UseResponseCompression() before UseRouting() and Map calls',
      'Enumerable.Range(1, 1000) generates a list of 1000 items',
    ],
    starterCode: `var builder = WebApplication.CreateBuilder(args);
// TODO: configure compression

var app = builder.Build();
// TODO: middleware order
// TODO: GET /report endpoint`,
    solution: `builder.Services.AddResponseCompression(o =>
{
    o.EnableForHttps = true;
    o.Providers.Add<BrotliCompressionProvider>();
    o.Providers.Add<GzipCompressionProvider>();
    o.MimeTypes = ResponseCompressionDefaults.MimeTypes
        .Concat(new[] { "application/json", "application/problem+json" });
});
builder.Services.Configure<BrotliCompressionProviderOptions>(o => o.Level = CompressionLevel.Optimal);
builder.Services.Configure<GzipCompressionProviderOptions>(o => o.Level = CompressionLevel.Optimal);

var app = builder.Build();
app.UseResponseCompression();
app.UseRouting();

app.MapGet("/report", () =>
    Results.Ok(Enumerable.Range(1, 1000)
        .Select(i => new { Id = i, Name = \`Item \${i}\`, Value = i * 1.5m })));`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which compression algorithm should be listed first for highest priority?',
      options: ['Gzip', 'Deflate', 'Brotli', 'LZ4'],
      answer: 2,
      explanation: 'Brotli achieves better compression ratios. Register it first so it is used when the client sends Accept-Encoding: br, gzip — the first matching provider wins.',
    },
    {
      q: 'Why is EnableForHttps false by default?',
      options: [
        'HTTPS already compresses at the TLS layer',
        'To mitigate CRIME and BREACH side-channel attacks on compressed HTTPS responses',
        'Brotli does not work over HTTPS',
        'It reduces TLS handshake performance',
      ],
      answer: 1,
      explanation: 'CRIME and BREACH attacks exploit changes in compressed response size to infer secrets. EnableForHttps is off by default to protect sensitive HTTPS responses.',
    },
    {
      q: 'Where must UseResponseCompression() be placed?',
      options: [
        'After UseRouting()',
        'After UseStaticFiles()',
        'Before any middleware that writes the response',
        'At the very end of the pipeline',
      ],
      answer: 2,
      explanation: 'Compression wraps the response stream. It must run before middleware that writes to the stream (static files, routing, controllers) — otherwise the response is already sent.',
    },
    {
      q: 'Which MIME types should NOT be included in compression?',
      options: [
        'text/plain and text/html',
        'application/json and application/javascript',
        'image/jpeg, image/png, and application/zip',
        'text/css and application/xml',
      ],
      answer: 2,
      explanation: 'Binary formats like JPEG, PNG, and ZIP are already compressed. Re-compressing them wastes CPU and can increase response size.',
    },
    {
      q: 'How does a client indicate it supports Brotli compression?',
      options: [
        'Content-Encoding: br in the request',
        'Accept-Encoding: br in the request',
        'Content-Type: br in the request',
        'X-Brotli: true in the request',
      ],
      answer: 1,
      explanation: 'The Accept-Encoding request header lists the compression algorithms the client supports. The server responds with Content-Encoding to indicate which one was applied.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Does response compression work with streaming responses?',
      a: 'Yes, but with caveats. The middleware buffers data to compress it, which adds latency for streaming. For Server-Sent Events (SSE) and long-polling, compression is usually disabled or set to Fastest level to avoid buffering delays.',
    },
    {
      q: 'Is response compression better done at the reverse proxy level?',
      a: 'In many production setups, yes — Nginx or IIS handle compression at the edge, offloading CPU from the ASP.NET process. However, if you deploy to Azure App Service, Lambda, or a container without a proxy, application-level compression is the right choice.',
    },
    {
      q: 'What is the minimum response size worth compressing?',
      a: 'Compression headers add overhead. Responses smaller than about 1 KB may end up larger after compression. The middleware has a minimum size check — responses below the threshold are not compressed. You can tune this with a custom IResponseCompressionProvider.',
    },
    {
      q: 'Does the middleware compress responses that already have a Content-Encoding header?',
      a: 'No. The middleware checks for an existing Content-Encoding header and skips compression if one is present, preventing double-compression.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Response compression reduces JSON and text payload sizes with Brotli/Gzip — register providers, choose MIME types carefully, and place the middleware first.',
    mustKnow: [
      'AddResponseCompression() registers providers; UseResponseCompression() must come FIRST in pipeline',
      'Register Brotli before Gzip — first matching provider in Accept-Encoding wins',
      'Extend ResponseCompressionDefaults.MimeTypes with Concat — never replace',
      'EnableForHttps = false by default (BREACH risk) — only enable for non-secret endpoints',
      'Never compress already-compressed types: JPEG, PNG, ZIP',
      'CompressionLevel: Fastest for throughput, Optimal for balance, SmallestSize for static content',
    ],
    interviewFocus: [
      'Brotli vs Gzip — compression ratio, browser support, when to use each',
      'Why EnableForHttps is off by default and what BREACH is',
      'Correct middleware order for response compression',
      'When to do compression at the app layer vs the proxy/CDN layer',
    ],
  };
}
