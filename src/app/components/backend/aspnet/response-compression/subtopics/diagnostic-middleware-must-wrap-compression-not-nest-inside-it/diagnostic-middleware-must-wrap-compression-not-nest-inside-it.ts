import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-compression-diagnostic-ordering-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './diagnostic-middleware-must-wrap-compression-not-nest-inside-it.html',
  styleUrl: './diagnostic-middleware-must-wrap-compression-not-nest-inside-it.scss',
})
export class DiagnosticMiddlewareMustWrapCompressionNotNestInsideItSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Reading Content-Encoding After next() Only Works From OUTSIDE the Compression Middleware',
      points: [
        'The main page\'s own "Verify Compression" code tab shows a diagnostic middleware that calls await next() then reads ctx.Response.Headers["Content-Encoding"] — but never shows where this snippet is registered relative to app.UseResponseCompression(). Middleware registered BEFORE UseResponseCompression() wraps it — its own post-next() code doesn\'t run until compression\'s own post-next() code (which is what actually finalizes and sets the Content-Encoding header) has already completed. Middleware registered AFTER UseResponseCompression() is nested INSIDE it — its post-next() code runs and completes BEFORE compression\'s own finalization step ever executes.',
        'If this diagnostic snippet is placed after app.UseResponseCompression() (a very natural place to put it, right next to where the endpoints are mapped), it will read an empty Content-Encoding value for EVERY request — even ones that genuinely get compressed — because by the time the diagnostic middleware\'s own read executes, the outer compression middleware hasn\'t finalized the header yet. The diagnostic would misleadingly suggest compression is never happening at all.',
      ],
    },
    {
      heading: 'The Fix — and Why It Matches the Page\'s Own Placement Rule',
      points: [
        'The fix is simply to register the diagnostic middleware BEFORE app.UseResponseCompression(), making it the OUTER wrapper: its post-next() code then only runs after compression\'s own post-next() code has fully completed and set the real header value. This is the exact same underlying rule the main page\'s own "Middleware Placement" theory point already states for compression itself relative to UseStaticFiles() — middleware that needs to observe or act on the FINAL state of a response must be registered OUTSIDE whatever produces that final state, not nested inside it.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The bug — diagnostic registered AFTER compression',
      language: 'csharp',
      code: `var app = builder.Build();

app.UseResponseCompression();

// BUG: registered AFTER compression — nested INSIDE it. This code's
// own post-next() runs BEFORE compression's post-next() has set the
// real Content-Encoding header, so "encoding" is always null here.
app.Use(async (ctx, next) =>
{
    await next();
    var encoding = ctx.Response.Headers["Content-Encoding"].FirstOrDefault();
    if (encoding != null)
    {
        Console.WriteLine($"Compressed with {encoding}: {ctx.Request.Path}");
    }
});

app.MapGet("/products", (IProductRepo repo) => repo.GetAllAsync());`,
    },
    {
      label: 'The fix — diagnostic registered BEFORE compression',
      language: 'csharp',
      code: `var app = builder.Build();

// FIX: registered BEFORE compression — wraps it as the OUTER layer.
// This code's post-next() now runs AFTER compression has finalized
// and set the real Content-Encoding header.
app.Use(async (ctx, next) =>
{
    await next();
    var encoding = ctx.Response.Headers["Content-Encoding"].FirstOrDefault();
    if (encoding != null)
    {
        Console.WriteLine($"Compressed with {encoding}: {ctx.Request.Path}");
    }
});

app.UseResponseCompression();
app.MapGet("/products", (IProductRepo repo) => repo.GetAllAsync());`,
    },
    {
      label: 'Test proving the ordering-dependent difference',
      language: 'csharp',
      code: `[Fact]
public async Task Diagnostic_Registered_After_Compression_Never_Observes_The_Header()
{
    // Test host wired with the BUGGY ordering from the first tab.
    var client = _factoryWithDiagnosticAfterCompression.CreateClient();

    var request = new HttpRequestMessage(HttpMethod.Get, "/products");
    request.Headers.AcceptEncoding.Add(new StringWithQualityHeaderValue("br"));
    var response = await client.SendAsync(request);

    // The RESPONSE itself IS genuinely compressed...
    Assert.Equal("br", response.Content.Headers.ContentEncoding.Single());
    // ...but the diagnostic middleware's own capture never saw it.
    Assert.DoesNotContain("br", CapturedEncodings);
}

[Fact]
public async Task Diagnostic_Registered_Before_Compression_Observes_The_Header()
{
    var client = _factoryWithDiagnosticBeforeCompression.CreateClient();

    var request = new HttpRequestMessage(HttpMethod.Get, "/products");
    request.Headers.AcceptEncoding.Add(new StringWithQualityHeaderValue("br"));
    await client.SendAsync(request);

    Assert.Contains("br", CapturedEncodings);
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer debugging "why does my diagnostic logging never show Content-Encoding, even though DevTools clearly shows the response IS compressed?" initially suspects the response compression configuration itself is broken. Using the ordering rule above, what should they check FIRST, and why is the DevTools evidence actually proof the config is fine?',
    hint: 'DevTools inspects the ACTUAL response the browser received over the wire — which middleware, if any, could that possibly bypass?',
    solution: `They should check the REGISTRATION ORDER of the diagnostic middleware
relative to app.UseResponseCompression() first — not the compression
configuration itself. DevTools shows the Content-Encoding header on the
ACTUAL response that traveled over the wire to the browser, which is
necessarily the FINAL state of the response after every middleware,
including compression, has completed. If DevTools shows
Content-Encoding: br, compression genuinely happened — that evidence is
conclusive and already rules out a configuration problem.

The diagnostic middleware seeing nothing is therefore not evidence that
compression isn't working — it's evidence that the diagnostic code
itself is reading the header at the WRONG POINT in the middleware
pipeline: nested inside compression rather than wrapping it. Moving the
diagnostic middleware's registration to BEFORE app.UseResponseCompression()
(making it the outer layer) is the fix, and requires zero changes to the
compression configuration itself.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a middleware reading ctx.Response.Headers after await next() always sees the fully finalized response, regardless of where it\'s registered relative to other middleware.',
      reality: 'it only sees state that has been finalized by whatever ran BEFORE it in the pipeline unwind — middleware nested INSIDE another middleware (registered after it) completes its own post-next() code before the outer middleware\'s post-next() code (like compression\'s own finalization) ever runs.',
    },
    {
      thought: 'if a diagnostic middleware never logs a Content-Encoding value, that proves response compression isn\'t actually happening.',
      reality: 'it can just as easily mean the diagnostic middleware is registered in the WRONG position — nested inside compression rather than wrapping it — while compression itself is working correctly, as DevTools or curl would independently confirm.',
    },
    {
      thought: 'the main page\'s own "Middleware Placement" rule (compression must come before things that generate the response) only applies to response-generating middleware like UseStaticFiles() and routing.',
      reality: 'the same underlying rule applies to ANY middleware that needs to observe the FINAL state of a response — including a simple diagnostic logger — it must be registered OUTSIDE (before) whatever finalizes that state, exactly as compression itself must be registered outside static files and routing.',
    },
  ];
}
