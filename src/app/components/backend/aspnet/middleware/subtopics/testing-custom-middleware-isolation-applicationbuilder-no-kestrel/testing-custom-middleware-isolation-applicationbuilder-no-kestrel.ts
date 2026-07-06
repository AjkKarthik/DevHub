import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-custom-middleware-isolation-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-custom-middleware-isolation-applicationbuilder-no-kestrel.html',
  styleUrl: './testing-custom-middleware-isolation-applicationbuilder-no-kestrel.scss',
})
export class TestingCustomMiddlewareIsolationApplicationbuilderNoKestrelSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own Q&A mentions this technique in one sentence — this subtopic is the actual test for the page\'s own CorrelationIdMiddleware challenge',
      points: [
        'The main Middleware Pipeline page\'s Q&amp;A states: "build a minimal pipeline... directly: <code>var handler = new ApplicationBuilder(sp).Use(...).Build()</code>, then invoke the resulting <code>RequestDelegate</code> with a <code>DefaultHttpContext</code>." This is exactly right, but left as a one-line sketch — this subtopic writes the ACTUAL test for the main page\'s own <code>CorrelationIdMiddleware</code> challenge, with no Kestrel, no <code>WebApplicationFactory</code>, and no real HTTP involved at all.',
      ],
    },
    {
      heading: 'A middleware class is just a plain C# class with an InvokeAsync method — testable directly, or via a minimal ApplicationBuilder-built pipeline',
      points: [
        'The SIMPLEST test constructs the middleware directly (<code>new CorrelationIdMiddleware(next, logger)</code>) and calls <code>InvokeAsync(context)</code> — no <code>ApplicationBuilder</code> needed at all, since the class has no dependency on the broader pipeline machinery. This works well for middleware with a SIMPLE "next" delegate (a lambda you write yourself for the test).',
        'For middleware that needs to be tested AS PART OF a realistic multi-step pipeline (verifying it correctly cooperates with OTHER middleware, or that <code>OnStarting</code> callbacks actually fire in the right order), building a real, minimal <code>IApplicationBuilder</code> pipeline and calling <code>.Build()</code> to get an actual composed <code>RequestDelegate</code> is the more faithful test — it exercises the SAME composition mechanism the real <code>WebApplication</code> uses internally, just without Kestrel, routing, or any other production machinery.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Testing the main page\'s CorrelationIdMiddleware directly — no pipeline at all',
      language: 'csharp',
      code: `using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

public class CorrelationIdMiddlewareTests
{
    [Fact]
    public async Task InvokeAsync_NoIncomingHeader_GeneratesNewCorrelationId()
    {
        // A fake "next" delegate — just records that it was called, and that
        // the correlation ID was already stored in HttpContext.Items by then:
        string? capturedId = null;
        RequestDelegate next = ctx =>
        {
            capturedId = ctx.Items["CorrelationId"] as string;
            return Task.CompletedTask;
        };

        var middleware = new CorrelationIdMiddleware(next, NullLogger<CorrelationIdMiddleware>.Instance);
        var context = new DefaultHttpContext();

        await middleware.InvokeAsync(context);

        Assert.NotNull(capturedId);
        Assert.NotEmpty(capturedId);   // a real Guid.NewGuid().ToString("N") was generated
    }

    [Fact]
    public async Task InvokeAsync_WithIncomingHeader_ReusesProvidedCorrelationId()
    {
        RequestDelegate next = ctx => Task.CompletedTask;
        var middleware = new CorrelationIdMiddleware(next, NullLogger<CorrelationIdMiddleware>.Instance);

        var context = new DefaultHttpContext();
        context.Request.Headers["X-Correlation-Id"] = "existing-id-123";

        await middleware.InvokeAsync(context);

        Assert.Equal("existing-id-123", context.Items["CorrelationId"]);
    }
}
// Both tests run in milliseconds — no HTTP, no Kestrel, no real server
// anywhere in the process.`,
    },
    {
      label: 'Verifying the OnStarting callback actually adds the response header',
      language: 'csharp',
      code: `[Fact]
public async Task InvokeAsync_RegistersOnStartingCallback_AddsCorrelationIdHeader()
{
    RequestDelegate next = ctx => Task.CompletedTask;
    var middleware = new CorrelationIdMiddleware(next, NullLogger<CorrelationIdMiddleware>.Instance);

    var context = new DefaultHttpContext();
    context.Response.Body = new MemoryStream();  // DefaultHttpContext needs a real stream

    await middleware.InvokeAsync(context);

    // OnStarting callbacks are NOT invoked automatically by
    // DefaultHttpContext — they only fire when the response ACTUALLY
    // starts writing. Manually trigger them to verify the callback
    // does what it claims:
    await context.Response.StartAsync();

    Assert.True(context.Response.Headers.ContainsKey("X-Correlation-Id"));
    // Proves the OnStarting callback genuinely runs and sets the header
    // — a test that only checked context.Items would NEVER catch a bug
    // where the OnStarting registration itself was broken or omitted.
}`,
    },
    {
      label: 'Testing middleware AS PART OF a real, minimal composed pipeline',
      language: 'csharp',
      code: `using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;

[Fact]
public async Task CorrelationIdMiddleware_ComposedWithDownstreamEndpoint_HeaderSurvivesFullPipeline()
{
    // Build a REAL, minimal DI container and IApplicationBuilder — the
    // SAME composition mechanism WebApplication uses internally, just
    // without Kestrel, routing, or any actual network listener:
    var services = new ServiceCollection();
    services.AddLogging();
    var provider = services.BuildServiceProvider();

    var appBuilder = new ApplicationBuilder(provider);
    appBuilder.UseMiddleware<CorrelationIdMiddleware>();
    appBuilder.Run(async ctx => await ctx.Response.WriteAsync("Hello"));

    RequestDelegate pipeline = appBuilder.Build();  // the SAME kind of
                                                     // composed RequestDelegate
                                                     // a real app builds at startup

    var context = new DefaultHttpContext { RequestServices = provider };
    context.Response.Body = new MemoryStream();

    await pipeline(context);   // invoke the FULL composed pipeline directly

    Assert.True(context.Response.Headers.ContainsKey("X-Correlation-Id"));
    context.Response.Body.Seek(0, SeekOrigin.Begin);
    var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
    Assert.Equal("Hello", body);
    // This test proves CorrelationIdMiddleware genuinely cooperates
    // correctly with a DOWNSTREAM handler in a real composed pipeline
    // — not just that its own InvokeAsync method behaves correctly
    // in isolation.
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A test constructs <code>new DefaultHttpContext()</code> and calls a middleware\'s <code>InvokeAsync</code> directly, WITHOUT setting <code>context.Response.Body</code> to a real stream first. The test throws a <code>NullReferenceException</code> or similar unrelated to the middleware\'s own logic. Explain the likely cause and the fix.',
    hint: 'Consider what DefaultHttpContext actually provides out of the box for Response.Body, versus what a real HTTP request/Kestrel connection would provide — DefaultHttpContext is a minimal, standalone implementation with no real network connection backing it.',
    solution: `[Fact]
public async Task Broken_Test_MissingResponseBodyStream()
{
    RequestDelegate next = ctx => Task.CompletedTask;
    var middleware = new SomeMiddleware(next);

    var context = new DefaultHttpContext();
    // MISSING: context.Response.Body = new MemoryStream();

    await middleware.InvokeAsync(context);
    // If SomeMiddleware's InvokeAsync writes to context.Response.Body
    // directly (e.g. "await context.Response.WriteAsync(...)"), or
    // registers an OnStarting callback that gets triggered and then
    // attempts to write, this can throw — DefaultHttpContext's default
    // Response.Body is Stream.Null in some versions, or otherwise
    // unsuited for actually reading back what was written, depending on
    // exactly what the test tries to do with it afterward.
}

// THE LIKELY CAUSE: DefaultHttpContext is a lightweight, STANDALONE
// implementation of HttpContext meant for exactly this kind of
// low-level middleware unit test — it does NOT come with a real
// network connection, and its default Response.Body is not
// necessarily a stream you can usefully write to AND read back from
// in the same test. Middleware that writes actual response content
// (not just headers) needs an EXPLICIT, real stream assigned first.

// THE FIX — always assign a real, readable/writable stream before
// invoking middleware that might write to the response body:
[Fact]
public async Task Fixed_Test_WithProperResponseBodyStream()
{
    RequestDelegate next = ctx => Task.CompletedTask;
    var middleware = new SomeMiddleware(next);

    var context = new DefaultHttpContext();
    context.Response.Body = new MemoryStream();   // <-- the fix

    await middleware.InvokeAsync(context);

    context.Response.Body.Seek(0, SeekOrigin.Begin);
    var written = await new StreamReader(context.Response.Body).ReadToEndAsync();
    // Now genuinely readable — a MemoryStream supports both writing
    // (what the middleware does) and reading back (what the test needs
    // to assert on) within the same test method.
    Assert.Equal("expected content", written);
}

// GENERAL RULE: any test invoking middleware against a DefaultHttpContext
// should explicitly assign context.Response.Body = new MemoryStream()
// UPFRONT, as a matter of course — this is one of the most common
// "friction" points when first writing this style of low-level
// middleware test, and it has nothing to do with the middleware's own
// correctness.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'testing custom middleware always requires WebApplicationFactory and a real (in-memory or otherwise) HTTP server.',
      reality: 'a middleware class is just a plain C# class with an InvokeAsync method — it can be instantiated directly and tested with a hand-written "next" delegate and a DefaultHttpContext, with no server, no Kestrel, and no WebApplicationFactory involved at all.',
    },
    {
      thought: 'DefaultHttpContext works identically to a real HttpContext from an actual incoming request, requiring no extra setup for a middleware unit test.',
      reality: 'DefaultHttpContext is a minimal, standalone implementation — middleware that writes to the response body needs context.Response.Body explicitly assigned to a real stream (like MemoryStream) before invocation, since there is no real network connection backing it by default.',
    },
    {
      thought: 'testing a middleware class\'s InvokeAsync method in isolation is equivalent to testing that it behaves correctly as part of a real, composed pipeline alongside other middleware.',
      reality: 'a genuinely thorough test suite also builds a minimal real IApplicationBuilder pipeline (via .UseMiddleware<T>().Build()) to verify the middleware cooperates correctly with a downstream handler — the same composition mechanism a real WebApplication uses internally, just without Kestrel.',
    },
  ];
}
